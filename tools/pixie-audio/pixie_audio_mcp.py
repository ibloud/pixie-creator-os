#!/usr/bin/env python3
"""
PIXIE Audio MCP server (starter, macOS-native).

PIXIE acts as a junior engineer: it prepares material, measures it, drafts
processed versions and keeps a log. It never overwrites anything.
A human makes the final listening decisions.

Tools
  new_project      create a project folder tree + session log
  import_audio     copy a file into 00_source (made read-only)
  separate_stems   AI stem separation via Demucs -> 01_stems
  analyze          loudness, true peak, band balance, sibilance, stereo checks
  apply_chain      run a named effects chain (built-ins or AU/VST3) -> new version
  list_project     show what is saved in a project
  add_note         append a note to the project log

Filesystem back end (everything lives under PIXIE_ROOT, default ~/PIXIE)
  <project>/00_source      originals, read-only, never modified
  <project>/01_stems       separated stems
  <project>/02_processed   processed intermediates
  <project>/03_mixes       mix drafts
  <project>/04_masters     master drafts (24-bit)
  <project>/session.json   machine-readable history of every action
  <project>/notes.md       human-readable log

Rules built in
  - Paths cannot escape the project folder.
  - Outputs are versioned (name_v001.wav, name_v002.wav ...), never overwritten.
  - AU/VST3 plugins load only from the standard macOS plugin folders.
"""
from __future__ import annotations

import json
import fcntl
import functools
import threading
from contextlib import redirect_stdout
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from mcp.server.fastmcp import FastMCP
from scipy import signal

ROOT = Path(os.environ.get("PIXIE_ROOT", str(Path.home() / "PIXIE"))).expanduser().resolve()
SUBDIRS = ("00_source", "01_stems", "02_processed", "03_mixes", "04_masters")
OUTPUT_DIRS = ("02_processed", "03_mixes", "04_masters")
AUDIO_EXTS = {".wav", ".aif", ".aiff", ".flac", ".mp3"}
PLUGIN_DIRS = (Path("/Library/Audio/Plug-Ins"), Path.home() / "Library/Audio/Plug-Ins")

BANDS = (
    ("sub", 20, 60),
    ("bass", 60, 250),
    ("low_mid", 250, 500),
    ("mid", 500, 2000),
    ("upper_mid", 2000, 4000),
    ("presence", 4000, 6000),
    ("sibilance", 6000, 10000),
    ("air", 10000, 20000),
)

SUPPORTED_STEPS = (
    "gain, highpass, lowpass, low_shelf, high_shelf, peak_eq, "
    "compressor, noise_gate, limiter, plugin"
)

mcp = FastMCP("pixie-audio")
_ACTION_LOCK = threading.RLock()


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _slug(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", name.strip()).strip("-.")


def _project_dir(project: str) -> Path:
    if Path(project).is_absolute() or "/" in project or "\\" in project or project in {".", "..", "_server"}:
        raise ValueError("Use a project name, not a path or reserved server directory.")
    slug = _slug(project)
    if not slug:
        raise ValueError("Project name is empty.")
    if (ROOT / slug).is_symlink():
        raise ValueError("Project directories must not be symlinks.")
    pdir = (ROOT / slug).resolve()
    if ROOT not in pdir.parents:
        raise ValueError("Project path is outside the PIXIE root.")
    if not pdir.is_dir():
        raise ValueError(f"Project '{slug}' not found. Create it with new_project first.")
    return pdir


def _resolve_in_project(pdir: Path, rel: str) -> Path:
    if Path(rel).is_absolute() or ".." in Path(rel).parts:
        raise ValueError("Use a relative project path without parent traversal.")
    path = (pdir / rel).resolve()
    if path != pdir and pdir not in path.parents:
        raise ValueError("Path must stay inside the project folder.")
    if not path.exists():
        raise FileNotFoundError(f"Not found in project: {rel}")
    if not path.is_file():
        raise ValueError("Expected an audio file.")
    return path


def _safe_dir(pdir: Path, name: str) -> Path:
    path = pdir / name
    if path.is_symlink() or not path.is_dir() or path.resolve().parent != pdir:
        raise ValueError("Project folders must be real directories inside the project.")
    return path


def _regular(path: Path) -> None:
    if path.is_symlink() or (path.exists() and not path.is_file()):
        raise ValueError("Project metadata must be regular files, not links.")


def _audited(action):
    # Serialize tool work in-process and per project across server processes.
    def decorate(fn):
        @functools.wraps(fn)
        def call(project, *args, **kwargs):
            with _ACTION_LOCK, redirect_stdout(sys.stderr):
                pdir = _project_dir(project)
                lock = pdir / ".pixie.lock"
                fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
                with os.fdopen(fd, "a") as handle:
                    fcntl.flock(handle, fcntl.LOCK_EX)
                    for name in ("session.json", "notes.md"):
                        _regular(pdir / name)
                    try:
                        for name in SUBDIRS:
                            _safe_dir(pdir, name)
                        return fn(project, *args, **kwargs)
                    except Exception as exc:
                        _log(pdir, action, "Failed: " + str(exc), status="failed")
                        raise
        return call
    return decorate


def _rel(pdir: Path, path: Path) -> str:
    return str(path.relative_to(pdir))


def _next_path(directory: Path, stem: str, ext: str = ".wav") -> Path:
    pattern = re.compile(rf"^{re.escape(stem)}_v(\d{{3,}}){re.escape(ext)}$")
    nums = []
    for f in directory.iterdir():
        m = pattern.match(f.name)
        if m:
            nums.append(int(m.group(1)))
    n = (max(nums) + 1) if nums else 1
    return directory / f"{stem}_v{n:03d}{ext}"


def _log(pdir: Path, action: str, summary: str, **details: Any) -> None:
    session = pdir / "session.json"
    _regular(session)
    _regular(pdir / "notes.md")
    data = json.loads(session.read_text())
    if not isinstance(data, dict) or not isinstance(data.get("history"), list):
        raise ValueError("Invalid session history; restore a reviewed backup before writing.")
    entry = {"time": _now(), "action": action, "summary": summary, "status": "ok", **details}
    data.setdefault("history", []).append(entry)
    fd, raw = tempfile.mkstemp(prefix=".session-", dir=pdir)
    tmp = Path(raw)
    try:
        with os.fdopen(fd, "w") as handle:
            json.dump(data, handle, indent=2, allow_nan=False)
            handle.flush()
            os.fsync(handle.fileno())
        tmp.replace(session)
    finally:
        tmp.unlink(missing_ok=True)
    with (pdir / "notes.md").open("a", encoding="utf-8") as f:
        f.write(f"- {entry['time']} **{action}**: {summary}\n")


def _load_audio(path: Path) -> tuple[np.ndarray, int]:
    if path.suffix.lower() not in AUDIO_EXTS:
        raise ValueError(f"Unsupported audio type '{path.suffix}'. Use: {sorted(AUDIO_EXTS)}")
    data, sr = sf.read(str(path), always_2d=True, dtype="float64")
    if not len(data) or not np.isfinite(data).all() or np.max(np.abs(data)) > np.finfo(np.float32).max / 16:
        raise ValueError("Audio must contain non-empty, finite samples.")
    return data, int(sr)


def _db(x: float) -> float | None:
    return round(float(20 * np.log10(x)), 2) if np.isfinite(x) and x > 1e-10 else None


def _true_peak(data: np.ndarray, sr: int) -> float:
    up = signal.resample_poly(data.astype(np.float64), 4, 1, axis=0)
    return float(np.max(np.abs(up)))


def _lufs(data: np.ndarray, sr: int) -> float | None:
    try:
        v = pyln.Meter(sr).integrated_loudness(data)
        return round(float(v), 2) if np.isfinite(v) else None
    except Exception:
        return None


def _band_report(mono: np.ndarray, sr: int) -> tuple[dict[str, float], float | None]:
    amplitude = float(np.max(np.abs(mono)))
    mono = mono / amplitude if amplitude else mono
    nper = min(8192, len(mono))
    freqs, psd = signal.welch(mono, fs=sr, nperseg=nper, axis=0, detrend=False)
    if psd.ndim == 2:
        psd = psd.mean(axis=1)
    total = float(np.sum(psd)) or 1e-20
    nyq = sr / 2
    pct: dict[str, float] = {}
    for name, lo, hi in BANDS:
        if lo >= nyq:
            pct[name] = 0.0
            continue
        mask = (freqs >= lo) & (freqs < min(hi, nyq))
        pct[name] = round(100 * float(np.sum(psd[mask])) / total, 2)
    sib = float(np.sum(psd[(freqs >= 5000) & (freqs < min(9000, nyq))]))
    body = float(np.sum(psd[(freqs >= 1000) & (freqs < 4000)]))
    ratio = round(10 * float(np.log10(sib / body)), 2) if sib > 0 and body > 0 else None
    return pct, ratio


def _plugin_path(raw) -> Path:
    if not raw:
        raise ValueError("plugin step needs a 'path'.")
    path = Path(str(raw)).expanduser().resolve()
    if not any(d.resolve() in path.parents for d in PLUGIN_DIRS):
        raise ValueError("Plugins must be inside /Library/Audio/Plug-Ins or ~/Library/Audio/Plug-Ins.")
    if path.suffix.lower() not in {".component", ".vst3"}:
        raise ValueError("Only AU .component and VST3 .vst3 plugins are supported.")
    if not path.exists():
        raise FileNotFoundError(f"Plugin not found: {path}")
    return path


def _render(data, sr, chain):
    from pedalboard import Pedalboard
    return Pedalboard([_build_effect(step) for step in chain])(data.astype(np.float32).T, sr).T


def _process(data, sr, chain, pdir):
    plugins = [step for step in chain if str(step.get("type", "")).lower() == "plugin"]
    if not plugins:
        return _render(data, sr, chain)
    for step in plugins:
        _plugin_path(step.get("path"))
    # Native plugin stdout/crashes stay in a short-lived worker, never the MCP stream.
    # The worker is this same file, not another service or application runtime.
    with tempfile.TemporaryDirectory(prefix=".tmp-effects-", dir=pdir) as raw:
        tmp = Path(raw)
        np.save(tmp / "input.npy", data, allow_pickle=False)
        (tmp / "task.json").write_text(json.dumps({"sr": sr, "chain": chain}, allow_nan=False))
        proc = subprocess.run([sys.executable, str(Path(__file__).resolve()),
                               "--render-worker", pdir.name, tmp.name],
                              capture_output=True, text=True,
                              env={**os.environ, "PIXIE_ROOT": str(ROOT)})
        if proc.returncode:
            raise RuntimeError("Plugin render failed: " + (proc.stderr or proc.stdout)[-1500:])
        return np.load(tmp / "output.npy", allow_pickle=False)


def _render_worker(project, folder):
    pdir = _project_dir(project)
    if not re.fullmatch(r"\.tmp-effects-[A-Za-z0-9_-]+", folder) or (pdir / folder).is_symlink():
        raise ValueError("Invalid render workspace.")
    task = json.loads(_resolve_in_project(pdir, folder + "/task.json").read_text())
    data = np.load(_resolve_in_project(pdir, folder + "/input.npy"), allow_pickle=False)
    processed = _render(data, task["sr"], task["chain"])
    with (pdir / folder / "output.npy").open("xb") as output:
        np.save(output, processed, allow_pickle=False)


def _build_effect(step: dict[str, Any]):
    from pedalboard import (
        Compressor,
        Gain,
        HighpassFilter,
        HighShelfFilter,
        Limiter,
        LowpassFilter,
        LowShelfFilter,
        NoiseGate,
        PeakFilter,
        load_plugin,
    )

    kind = str(step.get("type", "")).lower()

    def num(key: str, default: float) -> float:
        value = float(step.get(key, default))
        if not np.isfinite(value):
            raise ValueError("Effect parameters must be finite.")
        return value

    if kind == "gain":
        return Gain(gain_db=num("gain_db", 0))
    if kind == "highpass":
        return HighpassFilter(cutoff_frequency_hz=num("cutoff_hz", 80))
    if kind == "lowpass":
        return LowpassFilter(cutoff_frequency_hz=num("cutoff_hz", 16000))
    if kind == "low_shelf":
        return LowShelfFilter(cutoff_frequency_hz=num("cutoff_hz", 200),
                              gain_db=num("gain_db", 0), q=num("q", 0.7071))
    if kind == "high_shelf":
        return HighShelfFilter(cutoff_frequency_hz=num("cutoff_hz", 8000),
                               gain_db=num("gain_db", 0), q=num("q", 0.7071))
    if kind == "peak_eq":
        return PeakFilter(cutoff_frequency_hz=num("cutoff_hz", 1000),
                          gain_db=num("gain_db", 0), q=num("q", 1.0))
    if kind == "compressor":
        return Compressor(threshold_db=num("threshold_db", -18), ratio=num("ratio", 2.0),
                          attack_ms=num("attack_ms", 10), release_ms=num("release_ms", 100))
    if kind == "noise_gate":
        return NoiseGate(threshold_db=num("threshold_db", -60), ratio=num("ratio", 10),
                         attack_ms=num("attack_ms", 1), release_ms=num("release_ms", 100))
    if kind == "limiter":
        return Limiter(threshold_db=num("threshold_db", -1.0), release_ms=num("release_ms", 100))
    if kind == "plugin":
        path = _plugin_path(step.get("path"))
        return load_plugin(str(path), parameter_values=step.get("params") or None,
                           plugin_name=step.get("plugin_name"))
    raise ValueError(f"Unknown step type '{kind}'. Supported: {SUPPORTED_STEPS}")


# --------------------------------------------------------------------------
# Tools
# --------------------------------------------------------------------------
@mcp.tool()
def new_project(name: str) -> str:
    """Create a new PIXIE project folder with the standard subfolders, a session log and notes."""
    slug = _slug(name)
    if slug == "_server":
        raise ValueError("Reserved server directory.")
    if not slug:
        raise ValueError("Project name is empty.")
    pdir = ROOT / slug
    if pdir.exists():
        raise ValueError(f"Project '{slug}' already exists.")
    ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    pdir.mkdir(mode=0o700)  # Exclusive creation: concurrent calls never reuse a project.
    for sub in SUBDIRS:
        (pdir / sub).mkdir()
    (pdir / "session.json").write_text(
        json.dumps({"project": name, "created": _now(), "history": []}, indent=2))
    (pdir / "notes.md").write_text(f"# {name}\n\nCreated {_now()}\n\n## Log\n", encoding="utf-8")
    _log(pdir, "new_project", f"created project '{slug}'")
    return f"Created project '{slug}' at {pdir}"


@mcp.tool()
@_audited("import_audio")
def import_audio(project: str, source_path: str) -> str:
    """Copy an audio file from anywhere on this Mac into the project's 00_source folder (read-only).
    Supported: wav, aiff, flac, mp3. Existing files are never replaced."""
    pdir = _project_dir(project)
    src = Path(source_path).expanduser().resolve()
    if not src.is_file():
        raise FileNotFoundError(f"File not found: {src}")
    if src.suffix.lower() not in AUDIO_EXTS:
        raise ValueError(f"Unsupported type '{src.suffix}'. Use: {sorted(AUDIO_EXTS)}")
    dest = pdir / "00_source" / (_slug(src.stem) + src.suffix.lower())
    if dest.exists():
        raise ValueError(f"{dest.name} already exists in 00_source. Rename the file and try again.")
    fd = os.open(dest, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, "wb") as target, src.open("rb") as original:
            shutil.copyfileobj(original, target)
            os.fchmod(target.fileno(), stat.S_IRUSR)
    except BaseException:
        dest.unlink(missing_ok=True)
        raise
    _log(pdir, "import_audio", f"imported {src.name} as {_rel(pdir, dest)}", source=str(src), output=_rel(pdir, dest))
    return f"Imported as {_rel(pdir, dest)} (read-only)."


@mcp.tool()
@_audited("separate_stems")
def separate_stems(project: str, file: str, model: str = "htdemucs",
                   two_stems: str | None = None) -> dict[str, Any]:
    """Split a project audio file into stems with Demucs and save them to 01_stems.
    file: path relative to the project, e.g. '00_source/song.wav'.
    two_stems: optionally 'vocals' to get just vocals + everything else.
    This can take several minutes for a full song."""
    pdir = _project_dir(project)
    src = _resolve_in_project(pdir, file)
    if src.suffix.lower() not in AUDIO_EXTS:
        raise ValueError(f"Unsupported audio type '{src.suffix}'.")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}", model) or model in {".", ".."}:
        raise ValueError("Invalid model name.")
    if two_stems is not None and two_stems not in {"vocals", "drums", "bass", "other"}:
        raise ValueError("two_stems must be one of: vocals, drums, bass, other.")

    env = dict(os.environ)
    env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + env.get("PATH", "")
    tmp = Path(tempfile.mkdtemp(prefix=".tmp-demucs-", dir=pdir))
    try:
        cmd = [sys.executable, "-m", "demucs", "-n", model, "--float32", "-o", str(tmp)]
        if two_stems:
            cmd += ["--two-stems", two_stems]
        cmd.append(str(src))
        proc = subprocess.run(cmd, capture_output=True, text=True, env=env)
        if proc.returncode != 0:
            tail = (proc.stderr or proc.stdout or "")[-1500:]
            raise RuntimeError(f"Demucs failed (is it installed?). Last output:\n{tail}")
        out_dirs = [d for d in (tmp / model).glob("*") if d.is_dir() and not d.is_symlink()]
        if len(out_dirs) != 1:
            raise RuntimeError("Demucs finished but produced no output.")
        track = _slug(src.stem)
        saved = []
        stem_files = sorted(out_dirs[0].glob("*.wav"))
        if not stem_files:
            raise RuntimeError("Demucs produced no WAV stems.")
        for f in stem_files:
            if f.is_symlink() or tmp not in f.resolve().parents:
                raise ValueError("Unsafe Demucs output path.")
            _load_audio(f)
            dest = _next_path(pdir / "01_stems", f"{track}_{f.stem}")
            fd = os.open(dest, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, "wb") as target, f.open("rb") as original:
                shutil.copyfileobj(original, target)
            saved.append(_rel(pdir, dest))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    _log(pdir, "separate_stems", f"{_rel(pdir, src)} -> {len(saved)} stems ({model})",
         model=model, two_stems=two_stems, stems=saved)
    return {"source": _rel(pdir, src), "model": model, "stems": saved}


@mcp.tool()
@_audited("analyze")
def analyze(project: str, file: str) -> dict[str, Any]:
    """Measure a project audio file: loudness (LUFS), peaks, RMS, crest factor, frequency band
    balance (% of energy), sibilance vs. mid ratio, stereo correlation and DC offset.
    Flags are heuristic hints for a human, not verdicts."""
    pdir = _project_dir(project)
    path = _resolve_in_project(pdir, file)
    data, sr = _load_audio(path)
    channels = data.shape[1]
    # Average channel powers, not waveforms: opposite-phase stereo must not cancel.
    mono = data

    peak = float(np.max(np.abs(data)))
    rms = float(np.sqrt(np.mean(data ** 2)))
    tp = _true_peak(data, sr)
    lufs = _lufs(data, sr)
    bands, sib_ratio = _band_report(mono, sr)
    corr = None
    if channels >= 2 and np.std(data[:, 0]) > 0 and np.std(data[:, 1]) > 0:
        value = float(np.corrcoef(data[:, 0], data[:, 1])[0, 1])
        corr = round(value, 3) if np.isfinite(value) else None
    dc_channels = np.mean(data, axis=0)
    dc = float(np.mean(data))

    result: dict[str, Any] = {
        "file": _rel(pdir, path),
        "sample_rate": sr,
        "channels": channels,
        "duration_s": round(len(data) / sr, 2),
        "integrated_lufs": lufs,
        "sample_peak_dbfs": _db(peak),
        "true_peak_dbtp": _db(tp),
        "rms_dbfs": _db(rms),
        "crest_factor_db": round(_db(peak) - _db(rms), 2) if _db(peak) is not None and _db(rms) is not None else None,
        "band_energy_percent": bands,
        "sibilance_vs_mid_db": sib_ratio,
        "stereo_correlation": corr,
        "dc_offset": round(dc, 5),
        "dc_offset_per_channel": [round(float(v), 5) for v in dc_channels],
    }

    flags = []
    if peak >= 0.999:
        flags.append("Samples at or near full scale; possible clipping.")
    if result["true_peak_dbtp"] is not None and result["true_peak_dbtp"] > -1.0:
        flags.append("True peak above -1 dBTP; consider checking encoded playback for inter-sample overs.")
    if corr is not None and corr < 0.3:
        flags.append("Low stereo correlation; check mono compatibility.")
    if np.max(np.abs(dc_channels)) > 0.01:
        flags.append("Noticeable DC offset; consider a high-pass filter.")
    if sib_ratio is not None and sib_ratio > -6:
        flags.append("Strong 5-9 kHz energy relative to 1-4 kHz; listen for harsh sibilance.")
    result["flags"] = flags

    _log(pdir, "analyze",
         f"{result['file']}: LUFS {lufs}, true peak {result['true_peak_dbtp']} dBTP",
         file=result["file"], measurements=result)
    return result


@mcp.tool()
@_audited("apply_chain")
def apply_chain(project: str, input_file: str, chain: list[dict[str, Any]],
                output_name: str | None = None,
                output_dir: str = "02_processed") -> dict[str, Any]:
    """Run an ordered effects chain on a project file and save it as a NEW versioned file.

    chain: list of steps, applied in order. Supported types and parameters:
      gain        gain_db
      highpass    cutoff_hz
      lowpass     cutoff_hz
      low_shelf   cutoff_hz, gain_db, q
      high_shelf  cutoff_hz, gain_db, q
      peak_eq     cutoff_hz, gain_db, q
      compressor  threshold_db, ratio, attack_ms, release_ms
      noise_gate  threshold_db, ratio, attack_ms, release_ms
      limiter     threshold_db, release_ms
      plugin      path (AU/VST3 in the standard macOS plugin folders), params (dict), plugin_name
    Example: [{"type":"highpass","cutoff_hz":80},{"type":"compressor","threshold_db":-18,"ratio":3}]
    output_dir: 02_processed, 03_mixes or 04_masters (masters are saved as 24-bit and refused if they would clip).
    """
    if output_dir not in OUTPUT_DIRS:
        raise ValueError(f"output_dir must be one of {OUTPUT_DIRS}.")
    if not chain:
        raise ValueError("chain is empty.")
    json.dumps(chain, allow_nan=False)
    if not all(isinstance(step, dict) for step in chain):
        raise ValueError("Each chain step must be an object.")
    pdir = _project_dir(project)
    src = _resolve_in_project(pdir, input_file)
    data, sr = _load_audio(src)
    before = {"integrated_lufs": _lufs(data, sr), "sample_peak_dbfs": _db(float(np.max(np.abs(data))))}

    processed = _process(data, sr, chain, pdir)
    if not processed.size or not np.isfinite(processed).all():
        raise ValueError("Processing produced empty or non-finite audio; nothing was written.")
    peak = float(np.max(np.abs(processed)))
    after = {"integrated_lufs": _lufs(processed.astype(np.float64), sr), "sample_peak_dbfs": _db(peak)}

    subtype = "PCM_24" if output_dir == "04_masters" else "FLOAT"
    if subtype == "PCM_24" and (peak > 1.0 - 2**-23 or _true_peak(processed, sr) >= 1.0):
        raise ValueError(
            f"Master would clip (peak {after['sample_peak_dbfs']} dBFS). Add a limiter or reduce gain. Nothing was written.")

    if output_name and (Path(output_name).is_absolute() or "/" in output_name or "\\" in output_name or output_name in {".", ".."}):
        raise ValueError("Output name must be a name, not a path.")
    base = _slug(output_name) if output_name else re.sub(r"_v\d{3,}$", "", _slug(src.stem))
    if not base:
        raise ValueError("Output name is empty.")
    dest = _next_path(pdir / output_dir, base)
    fd = os.open(dest, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, "wb") as target:
            sf.write(target, processed, sr, format="WAV", subtype=subtype)
    except BaseException:
        dest.unlink(missing_ok=True)
        raise

    _log(pdir, "apply_chain", f"{_rel(pdir, src)} -> {_rel(pdir, dest)}",
         input=_rel(pdir, src), output=_rel(pdir, dest), chain=chain, before=before, after=after)
    return {"input": _rel(pdir, src), "output": _rel(pdir, dest), "chain": chain,
            "before": before, "after": after}


@mcp.tool()
@_audited("list_project")
def list_project(project: str) -> dict[str, Any]:
    """List the files saved in a project, grouped by folder, with sizes and modified times."""
    pdir = _project_dir(project)
    out: dict[str, Any] = {}
    for sub in SUBDIRS:
        files = []
        d = pdir / sub
        if d.is_dir():
            for f in sorted(d.iterdir()):
                if f.is_file() and not f.is_symlink() and not f.name.startswith("."):
                    st = f.stat()
                    files.append({
                        "name": f.name,
                        "size_mb": round(st.st_size / 1_048_576, 2),
                        "modified": datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat(timespec="seconds"),
                    })
        out[sub] = files
    _log(pdir, "list_project", "Listed project files.")
    return {"project": pdir.name, "path": str(pdir), "folders": out}


@mcp.tool()
@_audited("add_note")
def add_note(project: str, text: str) -> str:
    """Append a note to the project's log (notes.md and session.json)."""
    pdir = _project_dir(project)
    clean = " ".join(text.split())
    if not clean:
        raise ValueError("Note is empty.")
    _log(pdir, "add_note", clean)
    return "Note added."


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render-worker":
        _render_worker(sys.argv[2], sys.argv[3])
    else:
        ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
        mcp.run(transport="stdio")
