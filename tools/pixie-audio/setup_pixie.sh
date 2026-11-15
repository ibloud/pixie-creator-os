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
#   4. Prints the vendor-neutral stdio launch command; no AI-client config is changed
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


if ! command -v ffmpeg >/dev/null 2>&1 && [[ ! -x /opt/homebrew/bin/ffmpeg ]] && [[ ! -x /usr/local/bin/ffmpeg ]]; then
  echo
  echo "Note: ffmpeg was not found. Demucs works best with it (install via Homebrew: brew install ffmpeg)."
fi

echo
echo "Installed PIXIE Audio. Start its vendor-neutral MCP stdio server with:"
printf '  %q %q\n' "$VENV/bin/python" "$SERVER_DIR/pixie_audio_mcp.py"
echo "No AI-client registration or provider connection was configured."
echo "PIXIE is the assistant; OpenAI is preferred, but the app connection remains unverified."
echo "Your projects will live in: $PIXIE_ROOT"
echo "If macOS asks whether PIXIE/Python may access folders like Music or Documents, grant access only to the folders you intend PIXIE to use."
