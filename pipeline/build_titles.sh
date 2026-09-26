#!/usr/bin/env bash
# 15 s cinematic opening titles: synthesised score + Kokoro VO + Remotion.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/out/muse_titles_15s.mp4}"

mkdir -p "$ROOT/models"
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$ROOT/models/$f" ] || curl -L --fail -o "$ROOT/models/$f" "$BASE/$f"
done

python3 "$ROOT/pipeline/titles_audio.py"

cd "$ROOT/video"
[ -d node_modules ] || npm ci
BROWSER_ARGS=()
if [ -n "${REMOTION_BROWSER:-}" ]; then BROWSER_ARGS=(--browser-executable="$REMOTION_BROWSER"); fi
mkdir -p "$(dirname "$OUT")"
npx remotion render src/index.ts MuseTitles "$OUT" --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k "${BROWSER_ARGS[@]}"
echo "done: $OUT"
