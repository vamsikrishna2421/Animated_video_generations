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

## Fish test results (14 Oct 2026)
- Key works (authenticated 200). Account voices: "Vamsi Voice" `05d44b87ad9b40818e7f5df1177656a7` (private, the
  creator's clone, trained on English) and "Bujji voice" (public; not used unless it is the creator's own recording).
- `s2.1-pro-free` works with the cloned voice. `drama-3-preview` returns 402: API credit is 0 and is billed apart from
  the app plan (top up at fish.audio/app/developers).
- English test line: clean; Whisper heard "ice" as "eyes" once (write "ice" with emphasis or re-roll).
- Telugu must be in Telugu script: the romanized line came out as babble, the Telugu-script line was recognisable
  ("naa business ideani chala unique andi... ekkada, Antarctica lo"). The v2 Telugu lines are romanized: convert them
  to Telugu script (keep English tech words in Telugu letters, e.g. ఏఐ, బిజినెస్) before voicing.

- The creator finds their cloned voice weak. Voice design (`/v1/voice-design`, model `voice-design-1`) returns 402
  until API credit is added. Free alternative that works: the channel's existing narrator as an inline reference
  (`fish_tts.py --ref video/public/reel/ep29v1/src/01_hook.wav --ref-text "<its words>"`, Telugu: `ep29te`); the
  English test line transcribed perfectly ("selling ice in Antarctica"). Fish's public library is mostly clones of
  real people (politicians, actors, cricketers): do not use those.

## Build
Same crayon format as EP25-EP29: specs `reels/ep30v1.json` / `reels/ep30te.json` (copy the shape of
`reels/ep29v1.json`), a scenes file like `video/src/reel/loop/VisionCrayon.tsx`, `pipeline/reel_build.py`, render
Reel/YT compositions, `pipeline/review_pack.py`, human-viewer render review, captions + YouTube text, queue item 031.
