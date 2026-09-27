#!/usr/bin/env bash
# Generate narration for one episode and run pronunciation QA (no render).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 pipeline/lesson_voice.py "episodes/$1.json" | tail -1
[ -n "${ASR_MODEL:-}" ] && python3 pipeline/voice_qa.py "$ASR_MODEL" "$1" 2>&1 | grep -E "^(ep|uc)|missed"
