# EP30 hand-off: "How AI learns good manners" (RLHF), voiced with Fish Audio

Status (13 Oct 2026): script v2 written and viewer-reviewed (`ep30_rlhf_good_manners.md`, English + Telugu);
real demo run (`ep30_demo_outputs.md`, code in `pipeline/ep30/manners_demo.py`); facts checked (listed in the script).
Not started: voice, crayon scenes, render. Upload serial 031 (replaces the older lesson-format
`031_ep30_rlhf_how_ai_learns_good_manners.mp4`). Next-episode teaser: LoRA ("teach an AI a new skill without a
supercomputer").

## Voice: Fish Audio (the creator has a subscription; API key stored as `FISH_API_KEY` in the environment)
- Helper: `pipeline/fish_tts.py` (`say(text, out, voice=..., model=...)`; written before the key reached a session, so
  test it first with one short line).
- Model header: `s2.1-pro-free` ($0, fair use) by default; `drama-3-preview` for more emotive takes; `s2.1-pro` is
  $15 per million UTF-8 bytes (an episode with retakes is well under $1).
- Voice: ask the creator for their cloned voice IDs (one English, one Telugu if they made both). Otherwise a generic
  library voice. Never a voice that imitates a real person (channel rule).
- Telugu is not named in Fish's language list (83 languages, auto-detected): voice one Telugu line first and check it
  with faster-whisper (`language="hi"` gives a phonetic Devanagari read) before voicing the rest.
- Inline tags for the audio arc: `[emphasis]`, `[pause]`, `[laugh]`, `[whisper]` (square brackets, free text).
- Keep the usual ASR checks (misheard words = mispronounced words), but the creator asked not to chase small slips.

## Build
Same crayon format as EP25-EP29: specs `reels/ep30v1.json` / `reels/ep30te.json` (copy the shape of
`reels/ep29v1.json`), a scenes file like `video/src/reel/loop/VisionCrayon.tsx`, `pipeline/reel_build.py`, render
Reel/YT compositions, `pipeline/review_pack.py`, human-viewer render review, captions + YouTube text, queue item 031.
