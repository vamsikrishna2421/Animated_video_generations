#!/usr/bin/env bash
# Script -> Kokoro voice -> procedural music -> Remotion animation -> final MP4.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="${1:-$ROOT/script/promo.json}"
OUT="${2:-$ROOT/sample_out/muse_tax_promo.mp4}"

# 1. Models (Kokoro v1.0 ONNX, ~340 MB, one-time download)
mkdir -p "$ROOT/models"
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$ROOT/models/$f" ] || curl -L --fail -o "$ROOT/models/$f" "$BASE/$f"
done

# 2. Voice + timeline, 3. music + sfx
python3 "$ROOT/pipeline/voice.py" "$SCRIPT"
python3 "$ROOT/pipeline/music.py"

# 4. Render (Remotion muxes narration, music and sfx into the MP4)
cd "$ROOT/video"
[ -d node_modules ] || npm ci
BROWSER_ARGS=()
if [ -n "${REMOTION_BROWSER:-}" ]; then BROWSER_ARGS=(--browser-executable="$REMOTION_BROWSER"); fi
mkdir -p "$(dirname "$OUT")"
npx remotion render src/index.ts MusePromo "$OUT" --codec=h264 --crf=18 --audio-codec=aac "${BROWSER_ARGS[@]}"
echo "done: $OUT"
