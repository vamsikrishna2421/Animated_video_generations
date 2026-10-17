#!/bin/bash
# render.sh "<CompId>:<out path relative to video/>" ... : renders in order, then loudness-normalises each file.
# Never run two of these at once: each render clears the shared bundle dirs in /tmp.
R=$(cd "$(dirname "$0")/../.." && pwd)
B=${CHROME:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
cd "$R/video"
for pair in "$@"; do
  id=${pair%%:*}; out=${pair#*:}
  t0=$(date +%s)
  npx remotion render src/index.ts $id $out --overwrite --browser-executable=$B --concurrency=3 --log=error --bundle-cache=false || { echo "FAILED $id"; continue; }
  python3 ../pipeline/loudnorm.py $out >/dev/null 2>&1 || echo "loudnorm failed $id"
  rm -rf /tmp/remotion-webpack-bundle-* /tmp/react-motion-render* 2>/dev/null
  echo "done $id $(( $(date +%s) - t0 ))s $(du -h $out | cut -f1)"
done
