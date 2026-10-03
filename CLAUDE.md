# Working rules for this repo (AI education reels: @ai_maastaaru / @ai_maastaaru_telugu)

## Human-viewer review (always)
Every piece of content goes past the `human-viewer` agent (`.claude/agents/human-viewer.md`) before the user sees it:
1. **Script stage:** send the script (and on-screen text) to `human-viewer`. Fix confusion, contradictions,
   weak hooks and unanswered "so which one do I use?" questions before voicing.
2. **Render stage:** `python3 pipeline/review_pack.py <video> [--lang te]` -> `out/review/<name>/`, then ask
   `human-viewer` to review that folder. Fix what both viewers agree on, and anything factual or audio-related.
3. When delivering, tell the user in two or three lines what the viewers flagged and what was changed.

## Audio is an engagement lever, not a background
- Music needs an arc: a hit in the first second, a lift into each reveal, a drop or pause before the key number,
  and a rise into the CTA. Flat loudness across quarters = fix it.
- Keep music audible but under the voice (about 8-12 dB below in speech, louder in gaps); place hits on cuts.
- Check pronunciation in the review-pack transcript (misheard words = mispronounced words).

## Standing constraints
- Push only to branch `sample1`; keep the tree clean. Never put model identifiers in committed files; renders
  that name the model go to git-ignored `out/local/`.
- Verify news/facts with the company's own page or 2+ reputable outlets; attribute vendor benchmarks.
- No celebrity likenesses or voices, no copyrighted footage or music. Visuals in English for Telugu versions.
