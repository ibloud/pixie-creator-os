#!/usr/bin/env bash
# PIXIE Audio MCP - one-step macOS setup.
#
# Run:   bash setup_pixie.sh            (full install, includes Demucs stem separation)
#        bash setup_pixie.sh --no-demucs  (skip the large Demucs/PyTorch download)
#
# What it does:
#   1. Finds Python 3.10-3.12
#   2. Copies pixie_audio_mcp.py to ~/PIXIE/_server and builds a private virtual environment there
#   3. Installs the audio libraries
#   4. Registers "pixie-audio" in Claude Desktop's config (a backup of the old config is kept)
#
# Safe to re-run. It never touches your music files.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIXIE_ROOT="${PIXIE_ROOT:-$HOME/PIXIE}"
SERVER_DIR="$PIXIE_ROOT/_server"
VENV="$SERVER_DIR/.venv"
WITH_DEMUCS=1
for arg in "$@"; do
  case "$arg" in
    --no-demucs) WITH_DEMUCS=0 ;;
    *) echo "Usage: bash setup_pixie.sh [--no-demucs]" >&2; exit 2 ;;
  esac
done
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

[[ "$(uname -s)" == "Darwin" ]] || { echo "This setup is for macOS only."; exit 1; }
[[ -f "$HERE/pixie_audio_mcp.py" ]] || { echo "Put pixie_audio_mcp.py in the same folder as this script, then run again."; exit 1; }

PY=""
for candidate in python3.12 python3.11 python3.10 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info[:2] <= (3, 12) else 1)'; then
      PY="$(command -v "$candidate")"
      break
    fi
  fi
done
if [[ -z "$PY" ]]; then
  echo "Python 3.10, 3.11 or 3.12 is required. Install one from https://www.python.org/downloads/ and run this again."
  exit 1
fi
PIXIE_ROOT="$("$PY" -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).expanduser().resolve())' "$PIXIE_ROOT")"
SERVER_DIR="$PIXIE_ROOT/_server"
VENV="$SERVER_DIR/.venv"
echo "Using $PY"

mkdir -p "$SERVER_DIR"
if [[ "$HERE/pixie_audio_mcp.py" != "$SERVER_DIR/pixie_audio_mcp.py" ]]; then
  cp "$HERE/pixie_audio_mcp.py" "$SERVER_DIR/pixie_audio_mcp.py"
fi

if [[ ! -x "$VENV/bin/python" ]]; then
  "$PY" -m venv "$VENV"
fi
"$VENV/bin/python" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,12) else "Existing PIXIE venv must use Python 3.10-3.12; move it aside and rerun setup.")'
"$VENV/bin/python" -m pip install --quiet --upgrade pip

echo "Installing audio libraries..."
# mcp is pinned below 2 because the server is written for the 1.x API.
"$VENV/bin/python" -m pip install --quiet "mcp[cli]<2" numpy scipy soundfile pyloudnorm pedalboard

if [[ "$WITH_DEMUCS" == "1" ]]; then
  echo "Installing Demucs (large download, several minutes)..."
  # torch/torchaudio are held below 2.9 as a precaution: newer torchaudio changed how audio is saved,
  # which older Demucs releases may not handle.
  "$VENV/bin/python" -m pip install --quiet "torch<2.9" "torchaudio<2.9" demucs
fi

echo "Registering with Claude Desktop..."
"$VENV/bin/python" - "$VENV/bin/python" "$SERVER_DIR/pixie_audio_mcp.py" "$PIXIE_ROOT" <<'PY'
import json, os, pathlib, sys, tempfile, uuid

py, server, root = sys.argv[1:4]
cfg_path = pathlib.Path.home() / "Library/Application Support/Claude/claude_desktop_config.json"
cfg_path.parent.mkdir(parents=True, exist_ok=True)

cfg = {}
if cfg_path.is_symlink():
    raise ValueError("Claude config must not be a symlink.")
if cfg_path.exists():
    text = cfg_path.read_text().strip()
    if text:
        cfg = json.loads(text)
    if not isinstance(cfg, dict) or not isinstance(cfg.get("mcpServers", {}), dict):
        raise ValueError("Claude config and mcpServers must be JSON objects; original left untouched.")
    backup = cfg_path.with_name(f"claude_desktop_config.backup-{uuid.uuid4().hex}.json")
    with backup.open("x") as handle:
        os.chmod(backup, 0o600)
        handle.write(cfg_path.read_text())

cfg.setdefault("mcpServers", {})["pixie-audio"] = {
    "command": py,
    "args": [server],
    "env": {"PIXIE_ROOT": root},
}
fd, raw = tempfile.mkstemp(prefix=".pixie-config-", dir=cfg_path.parent)
tmp = pathlib.Path(raw)
try:
    with os.fdopen(fd, "w") as handle:
        json.dump(cfg, handle, indent=2, allow_nan=False)
        handle.flush()
        os.fsync(handle.fileno())
    tmp.replace(cfg_path)
finally:
    tmp.unlink(missing_ok=True)
print("Config updated:", cfg_path)
PY

if ! command -v ffmpeg >/dev/null 2>&1 && [[ ! -x /opt/homebrew/bin/ffmpeg ]] && [[ ! -x /usr/local/bin/ffmpeg ]]; then
  echo
  echo "Note: ffmpeg was not found. Demucs works best with it (install via Homebrew: brew install ffmpeg)."
fi

echo
echo "Done. Quit and reopen Claude Desktop, then ask it to create a PIXIE project."
echo "Your projects will live in: $PIXIE_ROOT"
echo "If macOS asks whether Claude/Python may access folders like Music or Documents, grant access only to the folders you intend PIXIE to use."
