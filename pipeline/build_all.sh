#!/usr/bin/env bash
# Build several episodes in sequence: ./pipeline/build_all.sh ep00 ep02 ep03 ...
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for ep in "$@"; do
  echo "=== $ep start $(date +%T)"
  if "$ROOT/pipeline/build_lesson.sh" "$ep" > "$ROOT/out/.build_$ep.log" 2>&1; then
    echo "=== $ep ok $(date +%T) $(tail -1 "$ROOT/out/.build_$ep.log")"
  else
    echo "=== $ep FAILED $(date +%T) (see out/.build_$ep.log)"
  fi
done
