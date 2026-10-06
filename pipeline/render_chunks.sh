#!/bin/bash
# Resumable chunked Remotion render: finished chunks are kept, so a container restart only loses the chunk in progress.
# usage: pipeline/render_chunks.sh <CompositionId> <totalFrames> <chunkFrames> <out.mp4> <audio.wav> [extra remotion args...]
set -e
COMP=$1; TOTAL=$2; STEP=$3; OUT=$4; AUDIO=$5; shift 5
ROOT=$(cd "$(dirname "$0")/.." && pwd)
DIR="$ROOT/out/local/chunks_$COMP"; mkdir -p "$DIR"
cd "$ROOT/video"
: > "$DIR/list.txt"
for ((s=0; s<TOTAL; s+=STEP)); do
  e=$((s+STEP-1)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  f=$(printf "%s/c%05d.mp4" "$DIR" $s)
  if [ ! -s "$f" ]; then
    npx remotion render src/index.ts "$COMP" "$f.part.mp4" --frames=$s-$e --muted "$@" --log=error
    mv "$f.part.mp4" "$f"
    echo "chunk $s-$e done"
  fi
  echo "file '$f'" >> "$DIR/list.txt"
done
FF=${FFMPEG:-/tmp/claude-0/ffmpeg}
"$FF" -loglevel error -y -f concat -safe 0 -i "$DIR/list.txt" -i "$AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
echo "joined -> $OUT"
