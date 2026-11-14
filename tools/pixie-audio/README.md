# PIXIE Audio — native macOS MCP review candidate

**Scope correction — owner direction, 14 November 2026:** this draft is a
possible supporting audio component. The owner's app use case is PIXIE assisting
them in GarageBand on iPad/iPhone while their producer uses Logic on a Mac. It is
not delivered by this server. See the [Companion use-case record](https://github.com/Loptr-Lab/pixie-ecosystem-guide/blob/docs/assistant-producer-use-case/apps/companion/review/ASSISTANT_PRODUCER_USE_CASE.md)
and [Creator audio requirements](../../docs/artist-workflow.md#assistant-producer-audio-requirements--owner-direction-14-november-2026).
The Claude registration instructions below describe the still-present initial
implementation, not approved PIXIE onboarding. Removing/replacing that setup and
providing the actual PIXIE connection remain outstanding; no code change is made
by this documentation correction.

A local Python stdio tool for preparing, measuring and drafting audio. PIXIE acts
as a junior audio engineer; a human makes final listening and release decisions.
This is an optional native tool in Creator OS's existing repository, **not** a
browser feature, web backend, DAW controller, shared Companion store or installed
plugin release. No automatic bridge to Creator OS or Companion is added.

## Reference and scope

Reference SHA-256 hashes (original ZIP contents):
`pixie_audio_mcp.py`: `1c913caca5064459f8a0e578303d2fd89a4b191692964547afc4495d770b8270`;
`setup_pixie.sh`: `0a03c165432937ba5c4e2041a94d3dc2df20c7a02ffa8d1ae1f42897abb5d1fa`.

Both `pixie_audio_mcp.py` and `setup_pixie.sh` were supplied in the owner's
`files 3.zip` (14 November 2026). They are the implementation baseline, retained
and improved rather than replaced. Current main, the two unrelated open PRs
(#59 and #61), README, CONTRIBUTING, architecture and stable pre-alpha handoff
were inspected. No existing native audio server/setup was found in this checkout.
The root `vercel.json` disables automatic previews for this review branch only,
so opening the requested draft does not publish a web deployment; other branches
retain their existing behavior. GitHub Pages remains main-only.
The precise addition is native local asset preparation; project canon, browser
identity, publishing, card-deck authority and existing release gates stay separate.

## Setup on an Apple Silicon Mac

Keep the two implementation files together, then run:

```bash
bash setup_pixie.sh
# Or skip installing Demucs and PyTorch:
bash setup_pixie.sh --no-demucs
```

Requires Python 3.10–3.12. Uses `/opt/homebrew/bin` and `/usr/local/bin` as well as
the inherited PATH. Setup creates `~/PIXIE/_server/.venv`, installs the server and
stack, then merges only the `pixie-audio` entry into
`~/Library/Application Support/Claude/claude_desktop_config.json`.
`PIXIE_ROOT` overrides the asset root and installation location. No setup is run
by opening the browser site. Quit/reopen Claude Desktop after setup.

Existing config settings/servers are retained. Before replacing the config,
setup writes a uniquely named, private backup beside it, then uses an atomic
replacement. Malformed config is left untouched. Re-running is supported,
including from the installed server folder; an unsupported existing venv requires
manual review/replacement, rather than silent deletion. Do not edit Claude's
config simultaneously with setup. Backups can contain other servers' secrets:
keep them private. Dependencies are not fully lock-pinned; installation requires
network access and may update the venv. `mcp[cli]<2` is intentionally required for
this FastMCP API. `torch<2.9` and `torchaudio<2.9` are **unverified precautionary
Demucs constraints**, not a tested compatibility guarantee. `--no-demucs` does
not uninstall an existing Demucs installation.

Install ffmpeg separately if needed (`brew install ffmpeg`); setup reports when
it is missing. Demucs may fetch model weights on its first run. MP3/AIFF/FLAC
reading depends on the installed SoundFile/libsndfile decoder. Audio and logs
stay local, but a connected MCP client receives the returned paths/measurements
and any notes/files explicitly exposed through these tools under that client's
privacy settings. No claim of confidential chat or zero host logging is made.

## Seven tools

| Tool | Behavior |
| --- | --- |
| `new_project(name)` | Slugifies the name and exclusively creates the five folders, session history and notes; `_server` is reserved. |
| `import_audio(project, source_path)` | Explicitly copies WAV/AIFF/FLAC/MP3 from an external local path into `00_source`; duplicate names fail and the copy becomes read-only. |
| `separate_stems(project, file, model="htdemucs", two_stems=None)` | Captured `python -m demucs --float32` subprocess, model/target validation, project-local temporary files, new versioned stems and cleanup. Optional targets: vocals/drums/bass/other. |
| `analyze(project, file)` | Integrated LUFS, sample/4× resampled true peak, RMS/crest, Welch band-energy percentages, 5–9 kHz versus 1–4 kHz ratio, stereo correlation and DC offset (including per channel); JSON-safe nulls for unavailable/silent measurements. |
| `apply_chain(project, input_file, chain, output_name=None, output_dir="02_processed")` | Ordered gain, highpass, lowpass, low/high shelves, peak EQ, compressor, gate, limiter and AU/VST3; new versioned WAVs only. |
| `list_project(project)` | Lists local audio-folder files and records the listing in history. |
| `add_note(project, text)` | Appends an explicit human/assistant note to both histories. |

Example tool arguments (relative project file paths):

```json
{"project":"demo","input_file":"00_source/synthetic.wav","chain":[{"type":"highpass","cutoff_hz":80},{"type":"gain","gain_db":-3}],"output_dir":"02_processed"}
```

Outputs go to `02_processed`, `03_mixes` or `04_masters`. Intermediates/mixes are
floating-point WAVs and may exceed full scale: review their reported peaks before
playback. Master drafts use PCM_24 and reject sample values outside its positive
range **or** a 4× reconstructed peak at/above 0 dBTP. The guard does not apply
normalization or limiting automatically. The 4× estimate is not certified
BS.1770 true-peak metering; listening, encoder and device checks remain human work.
LUFS can be unavailable for clips shorter than the meter window or unsupported
channel configurations. Band energy averages channel powers, avoiding cancellation
of opposite-phase stereo; percentages use total Welch power as denominator and
need not sum to 100 outside the 20 Hz–20 kHz reported bands. All flags are listening
hints, never verdicts or mastering approval. Files are loaded in memory; long
sessions and 4× resampling can require substantial RAM.

## Filesystem, plugins and audit boundaries

```
<PIXIE_ROOT>/<slug>/
  00_source/       read-only imported copies
  01_stems/       versioned separated stems
  02_processed/   versioned float WAVs
  03_mixes/       versioned float WAVs
  04_masters/     versioned 24-bit master drafts
  session.json    structured action history
  notes.md        readable action history
  .pixie.lock     advisory per-project lock
```

Project audio arguments must be relative, cannot contain `..`, and must resolve
inside the project. Symlinked project/audio folders and linked log files are
rejected. The sole explicit external-file exception is `import_audio.source_path`;
AU/VST3 paths have their separate standard-folder rule. Absolute project audio
paths are rejected even when they point inside the project. Output names are
names, not paths. Exclusive creation and project locks prevent cooperative
concurrent writers from replacing an output. Originals are never overwritten or
processed in place. Read-only chmod is protection against accidental edits, not
an OS sandbox against the same Mac user or privileged processes.

Plugins must resolve within `/Library/Audio/Plug-Ins` or
`~/Library/Audio/Plug-Ins`, with `.component`/`.vst3` extensions. They execute native
code: use only trusted plugins. Plugin-containing chains run in a short-lived
worker in the **same server file**, with stdout/stderr captured so native plugin
messages cannot corrupt MCP stdio. The worker is not a security sandbox. Plugin
UI, licensing, discovery, Apple Silicon architecture and actual AU/VST3 loading
remain unverified. Demucs output is also captured. The server itself prints no
application messages to stdout; stdout is the protocol channel.

Successful actions and failures against a valid auditable project are recorded
in both logs. Unsafe/missing project or metadata paths are refused without
writing through them. Atomic session replacement protects against torn JSON;
`session.json` and `notes.md` are **not a single crash-atomic transaction**. A
process/disk failure can leave an output with an incomplete log, or only one log
updated. Inspect existing files/history before retrying; do not reset a project
to hide a failed action. These logs are not a backup system. Local filenames,
import paths, chain parameters and notes appear in them; never commit personal
sessions. Sudden power loss, hostile concurrent filesystem edits, arbitrarily
malicious native plugins and full recovery are not established by these tests.

## Verification and human Mac checklist

Isolated developer tests (no Demucs installation):

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-test.txt
.venv/bin/python -m pytest test_pixie_audio.py -q
bash -n setup_pixie.sh
```

Tests generate synthetic waveforms in temporary directories; no music or audio
fixtures are committed. Tests exercise actual built-in DSP and real MCP stdio,
plus a real built-in worker render. **Demucs is mocked and has not been run.**
Plugin loading/worker orchestration is mocked; no real AU/VST3 is tested. Config
merge/re-run/malformed-input tests execute the setup script's Python block in a
temporary directory, not a real Claude Desktop profile. CI covers Python
3.10/3.11/3.12 on Linux; it is not Apple Silicon or macOS acceptance.

On a real Mac, a human must:

1. Run setup (first with `--no-demucs`, then with Demucs if desired), inspect the
   private config backup/merged entry, and verify Claude Desktop lists seven tools
   after restart. Handle Music/Documents/macOS folder permission prompts for only
   intended folders; no permissions bypass is implemented.
2. Generate or use their own authorized synthetic test audio, import it, measure,
   process, reopen outputs and make listening decisions. Confirm original hashes
   and read-only mode, versions, logs and the master clip refusal.
3. Install ffmpeg as needed, run an actual Demucs separation, verify weight-download
   behavior, Apple Silicon CPU/MPS execution, versions, output shapes and temporary
   cleanup. The torch/torchaudio precaution needs real validation.
4. With a trusted installed AU/VST3, verify allowed-path loading, parameter naming,
   architecture, licensing/UI limitations and that plugin output stays off MCP stdout.
5. Review disk-space, memory and backup/recovery needs before using long or valuable
   sessions. Keep this draft unmerged/unpublished until separately approved.

Not included: de-esser, reference matching, A/B comparison, DAW or RipX control,
recording, publishing, browser synchronization or automatic mastering approval.
