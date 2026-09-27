#!/usr/bin/env bash
# Render one episode, run pronunciation QA, then commit and push it (video + captions + sources).
# Usage: ./pipeline/render_commit.sh <id>
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ID="$1"
cd "$ROOT"
./pipeline/build_all.sh "$ID" > out/.batch.log 2>&1
cat out/.batch.log
if [ -n "${ASR_MODEL:-}" ]; then python3 pipeline/voice_qa.py "$ASR_MODEL" "$ID" 2>&1 | grep -E "^(ep|uc)|missed"; fi
ls -la out/${ID}_*.mp4 2>/dev/null | awk '{print $5/1048576 " MB", $9}'
git add -A && git commit -q -m "Render $ID

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AZ25s8yuQRKu5MeiURr1GP" && git push origin sample1 2>&1 | tail -1
