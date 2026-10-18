# Daily routine: two scheduled runs

| Run | When (IST) | Makes | Template to copy |
|---|---|---|---|
| Daily new episode | 05:59 | the next AI From Scratch episode, 4 formats (Insta EN/TE, YouTube EN/TE) | EP31 (LoRA, queue 033) |
| Daily creative reel | 17:57 | one original short (30-60 s), EN + TE, built to be shared | Skit 01 "The AI that remembered the wrong price" |

Both runs fire into the same Claude Code session. A run that is still going delays the next one; always finish the
unfinished run first. CLAUDE.md applies to both (human-viewer at script and render stage, audio arc, facts, push only
to `sample1`, no model identifiers in committed files). Never post or publish anywhere: the user posts.

## Start of every run
1. `git status` (clean), branch `sample1`, `git pull origin sample1`.
2. Disk: the writable allowance is small (`df -h /`; "Avail" near 0 means the allowance is spent). An episode needs
   about 1 GB (4 renders + send copies). `pipeline/tools/free_disk.sh "<keep-regex>"` drops the working-tree copies of
   committed renders (they stay in git and on GitHub, `git status` stays clean; it freed 5 GB on Oct 18). Also delete
   review packs of delivered videos (`out/review/<name>/`) and `/tmp/remotion-*`. Keep voice takes of unfinished work.
3. Environment (a container restart wipes `/tmp` and `/dev/shm`; re-create what is missing):
   - Static ffmpeg at `/tmp/claude-0/ffmpeg` (for `make_ig.sh`; it falls back to Remotion's bundled ffmpeg, which
     lacks some filters). `loudnorm.py` and `review_pack.py` use Remotion's ffmpeg.
   - Python: parler_tts 0.2.2, torch (CPU), transformers 4.46.1, faster-whisper, librosa, soundfile.
   - Models cache in RAM: `HF_HUB_CACHE=/dev/shm/hf` (Indic Parler mirror `RXD03/indic-parler-tts`,
     `Systran/faster-whisper-small`; they download again on first use). Set it for `review_pack.py` too, or the ASR
     model lands in `~/.cache` and fills the disk.
   - Node: `cd video && npm ci` if `node_modules` is missing. Chromium headless shell under `/opt/pw-browsers`.
   - Fish TTS key: `FISH_API_KEY` from the environment. Never print it, never ask for it in chat.

## Tools
- `pipeline/tools/render.sh "<Comp>:<out>" ...`: renders in order and loudness-normalises. One render at a time;
  two at once break each other (each clears the shared bundle dirs).
- `node pipeline/tools/stills.cjs <Comp> <dir> <frame...>`: preview stills before a full render.
- `pipeline/tools/make_ig.sh in.mp4 out_ig.mp4`: ~22 MB send copy (the send limit is 30 MiB).
- `python3 pipeline/tools/chapters.py <timeline id>`: YouTube chapter list from a timeline (scenes under 10 s merge).
- `HF_HUB_CACHE=/dev/shm/hf python3 pipeline/review_pack.py <video> [--lang te]` -> `out/review/<name>/`; Telugu also
  `python3 pipeline/te_pack_note.py <video> reels/<id>.json`. Then the `human-viewer` agent reviews the folder.
- `HF_HUB_CACHE=/dev/shm/hf python3 pipeline/tools/te_verify.py reels/<id>te.json <scenes>`: per-sentence Telugu check;
  re-voices bad sentences into the cache, then `pipeline/te_check.py ... <scenes> --force <scenes>` rebuilds the lines.
- Stopping a stuck job: find its PID with `ps -eo pid,args | grep <name> | grep -v grep`, then `kill <PID>`. Never
  `pkill -f`/`pgrep -f` with a pattern that also appears in your own command line (a comp name, "render.sh",
  "snapshot_download"): it kills your own shell (exit code 144; it happened three times on Oct 18).

## Run 1: daily new episode
1. Topic: the next episode in `series/SYLLABUS.md` after the last crayon episode in `out/upload_queue.json` (after
   EP31/033 comes EP32 "RAG part 2", queue 034). The crayon version replaces the old lesson file in that slot; update
   the title and files in `out/upload_queue.json` and `out/UPLOAD_ORDER.md`.
2. Facts from the company's own page or 2+ reputable outlets; vendor benchmarks attributed. Where possible run a
   small real demo (EP30, EP31) and use its measured numbers.
3. Script EN + TE in `series/scripts/epNN_<slug>.md`: a hook that works in 3 s, the quiz by about 45 s, a practical
   rule to take away, next-episode tease. Script-stage viewer review; fix before voicing.
4. Build: `video/src/reel/loop/<Name>Crayon.tsx` (register in `Reel.tsx`), `pipeline/epNN/make_specs.py`
   (Telugu lines use `sentence_cues`), English voice on Fish with the channel narrator reference
   (`pipeline/ep31/voice_en.py`), Telugu on Parler (`pipeline/te_check.py`), `pipeline/reel_build.py`.
5. Render the 4 formats, review packs, render-stage viewer review, fixes, re-render what changed.
6. Captions, YouTube text with chapters, queue entry, `_ig` copies. Commit (media with `git add -f`; media paths go
   in `.git/info/exclude`) and push.
7. Deliver with SendUserFile (status proactive): Insta EN + TE send copies and the caption file, plus 2-3 lines on
   what the viewers flagged and what changed.

## Run 2: daily creative reel
1. Read `series/creative_log.md`; no format, character set or topic repeats within 7 days. If the user has shared
   views, likes or comments for earlier reels, log them there and lean toward what worked.
2. Concept: one real AI idea a normal viewer can use or repeat to a friend, in a format that travels: two-character
   skit, POV, "guess which one is AI", myth vs fact, a one-question challenge, a relatable home/office/shop moment
   with an AI twist. Write 3 hook options (first frame + first line) and keep the strongest.
3. Hook and retention checklist:
   - Frame 1 already shows something wrong, surprising or funny; the first line lands within 1 s.
   - A conflict or question by 3 s; a new beat every 3-5 s; each reply raises the stakes.
   - The payoff (the lesson, said through the plot) by about 45 s; total 30-60 s.
   - The last frame loops cleanly into the first; no follow card inside the video.
   - The call to action lives in the caption ("Comment X ..."), plus a pinned comment that invites replies.
   - No celebrity likeness or voice, no real brand mocked, no copyrighted music or footage, nobody punched down at.
4. Script EN + TE (`series/scripts/skitNN_<slug>.md` or `creativeNN_<slug>.md`), script-stage viewer review. If
   both viewers would scroll past the hook, write a new hook.
5. Build on the skit system: scene types in `video/src/reel/loop/SkitCrayon.tsx` (or a new `<Name>Crayon.tsx`),
   `pipeline/<id>/make_specs.py`, voices as in `pipeline/skit01/voice.py` (judged takes; English narrator/AI on Fish
   with the channel reference, other English characters and all Telugu on Parler), SFX on every beat, music arc.
6. Render EN + TE, review packs, viewer review, fixes. Post text `out/skits/NN_<slug>_post.txt` (EN + TE captions,
   comment prompt, hashtags, pinned comment), `_ig` copies, log the concept and hook in `series/creative_log.md`,
   commit and push, deliver as in run 1.

Virality can't be promised. What a run controls: the first second, a reason to keep watching every few seconds, a
payoff worth sharing, a loop, and a caption that asks for a comment.

## Lessons that cost a re-render (check before rendering)
- Telugu: any word that can be heard as a swear word (EP31: "LoRA" flapped to "loda"; now written "లారా").
  Big numbers in English inside Telugu sentences; a short pause before a key number.
- Fish can repeat a sentence or add words: judge every take with ASR (word hit, repeats, rate) before using it.
- Short exclamations get misread ("June?!" came out "Johnny"): give a spoken form in the TTS override.
- A hit on the same frame as a key word masks it: land hits about 8 frames earlier.
- The last scene must hold to the final frame (no empty end frame).
- Captions follow the Telugu voice through `sentence_cues`; check the cue times in the review pack.
- Quarters within about 1.5 dB = flat audio: add lifts, a drop before the key number, a rise at the end.
- Misheard words in the review-pack transcript are mispronounced words: reword or re-voice them.
- Parler can drop a one-word sentence ("ఏఐ!" vanished from skit 01's first line): keep a short call inside the phrase
  ("ఏ ఐ, కాలనీ మొత్తం..."). Parler also won't hold a long scream; join takes if a line needs one.
- After a build, check where each `pauses` silence landed (voiced spans or the transcript): it must sit at the sentence
  end before its cue word, not inside the sentence.
- The end swell (musicLift + `musicEndGain` + a scene boost) stacks: by the last 10 s the bed can hit full volume
  under the voice (EP32: "quote" heard as "put" in the PDF tip). `duck` the actionable line, swell from the CTA.
- Whole-line Whisper on long Telugu takes misses babble: run `pipeline/tools/te_verify.py` on every Telugu scene
  before the timeline build (EP32 found six bad sentences the line check passed).
- A lift's kick lands on the cut: if the line starts on the cut, its first word is masked (EP32 "Your turn" heard
  "Your ton"): give the scene `"pre": 0.35`. A riser under a key word masks it too ("headings" -> "hitting").
- Test a mix fix without a full render: `npx remotion render src/index.ts <Comp> out.wav --codec=wav` (about 1 min),
  then Whisper on just the windows that were misheard.
- Every key result needs about 2 s on screen after it is said (EP32: the hook's answer card was up 0.7 s before the
  cut): give that scene a `tail` of 0.8-1.2 s; the music fills the hold, which also breaks a flat middle.
- No picture should sit still for 3+ s while the voice explains: spread the build over the line (EP32's shelves filled
  in 1.5 s, then 4 s of a still frame, and all four viewers drifted there).
- A visual that answers a phrase (a list reordering, a row appearing) needs its own cue on that phrase, not a fixed
  offset from an earlier cue (EP32: the guarantee list reordered while the voice was still on the sentence before).
