#!/usr/bin/env bash
# Render episodes one at a time from out/.render_queue (one id per line), committing each.
# Append ids with: echo ep14 >> out/.render_queue
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
Q=out/.render_queue
touch "$Q"
while true; do
  # never overlap with a render started outside the queue
  while pgrep -f "pipeline/render_commit.sh" >/dev/null; do sleep 10; done
  ID=$(head -1 "$Q" | tr -d '[:space:]')
  if [ -z "$ID" ]; then sleep 15; continue; fi
  sed -i '1d' "$Q"
  echo "$(date +%T) start $ID" >> out/.queue.log
  ./pipeline/render_commit.sh "$ID" > "out/.rc_$ID.log" 2>&1
  echo "$(date +%T) done  $ID: $(grep -E ' ok | FAILED' out/.batch.log | tail -1)" >> out/.queue.log
done
