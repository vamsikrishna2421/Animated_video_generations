#!/usr/bin/env bash
# One episode: episodes/<id>.json -> Kokoro narration -> music -> (optional images) -> 1080x1920 MP4.
# Usage: ./pipeline/build_lesson.sh ep01 [--images]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EP="${1:?usage: build_lesson.sh <episode id, e.g. ep01> [--images]}"
SPEC="$ROOT/episodes/$EP.json"
OUT="$ROOT/out/${EP}_$(python3 -c "import json,re,sys;print(re.sub(r'[^a-z0-9]+','_',json.load(open('$SPEC'))['title'].lower()).strip('_'))").mp4"

mkdir -p "$ROOT/models"
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$ROOT/models/$f" ] || curl -L --fail -o "$ROOT/models/$f" "$BASE/$f"
done
[ -s "$ROOT/models/kokoro-v1.0-timed.onnx" ] || python3 "$ROOT/pipeline/make_timed_model.py"

# Images first (GPU only) so the timeline picks them up.
if [ "${2:-}" = "--images" ]; then python3 "$ROOT/pipeline/lesson_images.py" "$SPEC"; fi
python3 "$ROOT/pipeline/lesson_voice.py" "$SPEC"
python3 "$ROOT/pipeline/music.py" --timeline "$ROOT/video/src/lesson/timelines/$EP.json" --out "$ROOT/video/public/lessons/$EP/music.wav"

cd "$ROOT/video"
[ -d node_modules ] || npm ci
BROWSER_ARGS=()
if [ -n "${REMOTION_BROWSER:-}" ]; then BROWSER_ARGS=(--browser-executable="$REMOTION_BROWSER"); fi
mkdir -p "$(dirname "$OUT")"
npx remotion render src/index.ts "Lesson-$EP" "$OUT" --codec=h264 --crf=27 --x264-preset=slow --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=192k "${BROWSER_ARGS[@]}"
echo "done: $OUT"
