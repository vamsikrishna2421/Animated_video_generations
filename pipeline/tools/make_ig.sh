#!/bin/bash
# make_ig.sh in.mp4 out.mp4 : ~22 MB copy that fits the 30 MiB send limit (two-pass x264, 160k AAC).
# Uses $FFMPEG, else the static build at /tmp/claude-0/ffmpeg, else Remotion's bundled ffmpeg.
R=$(cd "$(dirname "$0")/../.." && pwd)
FF=${FFMPEG:-/tmp/claude-0/ffmpeg}
if [ ! -x "$FF" ]; then
  RC=$R/video/node_modules/@remotion/compositor-linux-x64-gnu; FF=$RC/ffmpeg; export LD_LIBRARY_PATH=$RC
fi
in=$(realpath "$1"); out=$(realpath -m "$2")
dur=$("$FF" -i "$in" 2>&1 | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')
vb=$(python3 -c "print(int(22*8*1024/$dur - 200))")
tmp=$(mktemp -d); cd "$tmp"
"$FF" -y -loglevel error -i "$in" -c:v libx264 -preset medium -b:v ${vb}k -pass 1 -an -f mp4 /dev/null && \
"$FF" -y -loglevel error -i "$in" -c:v libx264 -preset medium -b:v ${vb}k -pass 2 -c:a aac -b:a 160k -movflags +faststart "$out"
cd / && rm -rf "$tmp"
echo "$out $(du -h "$out" | cut -f1) (video ${vb}k, ${dur}s)"
