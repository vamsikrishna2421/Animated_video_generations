#!/bin/bash
# free_disk.sh [keep-regex] : frees disk by dropping the working-tree copies of committed .mp4 renders (they stay in git
# and on GitHub; `git status` stays clean). Keeps files matching keep-regex (default: the newest queue items and skits).
# Restore one later with: git update-index --no-skip-worktree <file> && git checkout -- <file>
cd "$(dirname "$0")/../.."
keep=${1:-"skits/"}
before=$(df --output=avail -m / | tail -1)
git ls-files out | grep -E '\.mp4$' | grep -v -E "$keep" | while read -r f; do
  [ -f "$f" ] || continue
  git update-index --skip-worktree -- "$f" && rm -f -- "$f"
done
after=$(df --output=avail -m / | tail -1)
echo "freed $((after - before)) MB (now ${after} MB free)"
