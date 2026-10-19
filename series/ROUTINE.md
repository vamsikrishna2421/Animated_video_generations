# Daily routine: two scheduled runs

| Run | When (IST) | Makes | Template to copy |
|---|---|---|---|
| Daily new episode | 05:59 | the next AI From Scratch episode as a teaching skit, Insta EN/TE (YouTube: the same files as Shorts) | Skit 01 (the story), EP32 (facts, demo) |
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

## Run 1: daily new episode (a teaching skit)
From EP33 on, each episode teaches its syllabus topic through a short skit, the way skit 01 taught EP31's lesson
(Oct 18: skit 01 reached about 140 views and the user asked for the real topics to be taught this way). EP31 and EP32
stay as made.
1. Topic: the next episode in `series/SYLLABUS.md` after the last remade episode in `out/upload_queue.json` (after
   EP32/034 comes EP33 "RAG part 3: hybrid search and measuring RAG quality", queue 035). The skit replaces the old
   lesson file in that slot; update the title and files in `out/upload_queue.json` and `out/UPLOAD_ORDER.md`.
2. Facts from the company's own page or 2+ reputable outlets; vendor benchmarks attributed. Where possible run a
   small real demo (EP30-EP32) and put its measured numbers in the story.
3. Story before visuals:
   - Cast: the recurring shop duo, Ravi anna (kirana owner) and the shop's phone AI (the channel's student robot,
     calm, deadpan). Each episode the AI makes the mistake this topic fixes, so returning viewers know the world. A
     topic that lives elsewhere moves: home (Amma, Chinnu) for privacy, scams and deepfakes; an office or a college
     when it is about work or study.
   - The topic is the plot: its failure mode is the conflict (on screen in frame 1, the stakes in line 1), the
     technique is the rescue, the last beat is its limit or the next episode's problem. Skit 01: the AI billed June
     prices (facts trained in go stale) -> "Show me the price board. I'll read it before every bill." (look it up
     each time) -> "Now mug it up." (training freezes them again).
   - No "lecture in costume" (the viewers' words for skit 01's first draft): lines of 1-3 s, one idea per line, the
     AI explains in one sentence at most, the human asks what the viewer would ask ("So which one do I use?").
     Never more than two AI lines in a row: Ravi reacts in between (EP33's four at 0:39-0:51 lost both viewers).
   - The teaching beats, each carried by a line and a picture:

     | By | Beat |
     |---|---|
     | 3 s | the failure on screen, the stakes said |
     | ~15 s | why it happened: one crayon insert of the mechanism, cued on the line that names it |
     | ~30 s | our demo's result on a phone screen, with the measured numbers |
     | ~40 s | the quiz: a character puts the question to the viewer, options on screen, a 1.5-2 s hold, then the plot answers |
     | ~50 s | the rescue = the practical rule, said and shown as a big chip (sound-off viewers) |
     | end | the twist that undoes the rescue or opens the next topic; loops to frame 1; no follow card |

   - 45-75 s. An "EPNN · AI From Scratch" tag stays on screen; the next-episode tease and the call to action go in
     the caption.
   - EP33 seed (replace it if a better story comes): the shop AI searches the stock book by meaning and misses an
     exact item code; keyword search finds it; both together find both kinds; a 20-question test with known answers
     settles it (hit rates from our own demo).
4. Script EN + TE in `series/scripts/epNN_<slug>.md` (beat table: who, line, on screen; facts and sources; demo
   numbers). Script-stage viewer review, also asking: could you explain the idea to a friend now, and which line felt
   like a lecture? If both viewers would scroll past the hook, write a new one. Fix before voicing.
5. Build on the skit system: `SkitCrayon.tsx` (shop) or `HomeCrayon.tsx` (home), with the topic's inserts added there
   or in a new `<Name>Crayon.tsx` (register in `Reel.tsx`); `pipeline/epNN/make_specs.py` and `voice.py` on the
   `pipeline/skit02/voice.py` pattern (one judged take per line, cached; English on Fish: the AI with the narrator
   reference, each human with a Parler-made reference clip; Telugu on Parler with the strict judge); SFX on every
   beat; the audio arc from CLAUDE.md; `pipeline/reel_build.py`.
6. Render Insta EN + TE (9:16), one at a time; file names as EP32. YouTube takes the same two files as Shorts (no
   landscape render, no chapters). Review packs, render-stage viewer review, fixes, re-render what changed.
7. Captions EN + TE (the episode number, the next-episode tease, a comment prompt, a pinned comment with the sources),
   `out/youtube/NNN_epNN_youtube.txt` (Shorts titles and descriptions), the queue entry (`youtube` lists the two
   vertical files), `_ig` copies. Commit (media with `git add -f`; media paths go in `.git/info/exclude`) and push.
8. Deliver with SendUserFile (status proactive): Insta EN + TE send copies and the caption files, plus 2-3 lines on
   what the viewers flagged and what changed.

### Recorded voice (trial on EP33 only, Oct 18-19; ended: the user picked the AI voices)
The user voices the episode: both characters, English and, if they can, Telugu (a language they skip gets TTS).
- The script goes to the user only after the demo and the script-stage viewer review: they record once, so the
  numbers and lines must be final. The recording guide sits in the script file (`series/scripts/ep33_hybrid_search.md`):
  the line number before each line, 2 s gaps, a slip = say the line again (the last take wins), ★ lines twice, 5 s of
  room tone first, the original file rather than a WhatsApp voice note.
- The file arrives attached in chat, through Google Drive (the Drive connector), or uploaded on GitHub into
  `incoming/` on `sample1` (pull it, then move it out of the tracked tree).
- Cut: one clip per line at the spoken numbers (Whisper word times; Telugu also by silences), the last clean take,
  60 ms before the first sound and 100 ms after the last. Clean: high-pass 80 Hz, noise reduction from the room tone,
  clicks, gentle compression, lines level-matched. The AI's lines go through `phone()` from `pipeline/skit02/voice.py`.
- A human take is not stretched like TTS: spec `tempo` 1.0; `pipeline/ep33/voice_rec.py` shortens long pauses and
  can speed a slow take a little with rubberband (EP33 take 1: about 2 words a second, 1.07x kept the voice natural).
- EP33 take 1 lessons: the user read "Line N, Name" (sometimes just "N, Name"); `pipeline/tools/cut_takes.py --script`
  finds both, aligns each line's words (MMS forced aligner) and skips the name, but a line said right after the name
  with no pause can still start on it: check every cut line with Whisper and fix the stragglers (`DROP_FIRST`).
  The phone-filtered AI voice is thin, so the music bed masks it sooner than a TTS voice ("Then use keyword search"
  read "the new skewered search" until the bed went to 0.55 under that scene); keep effects off the speech (typing
  ticks on a line's first words masked them).
- reel_build notes found on the way: `boost` below 1 makes the bed quieter; `drop_cue` reads the scene's first line,
  so a drop before a later line's cue needs `drop_at: [[line index, cue]]`.
- While the recording is pending: build the scenes against a TTS guide track (never delivered), and don't start the
  next episode.
- EP33 (Oct 19): delivered, English in the user's take 1, Telugu on Parler. A re-record of English line 1 ("AI!" read
  as "Yeah") may still come: swap it in then (cut_takes `--script`, voice_rec, rebuild, re-render EN, re-deliver); it
  does not hold up EP34. The user plans to record the next episode too, saying "Line N" before every line.
- Oct 19: the user felt their EP33 take lacked punch and asked for the same episode with AI voices to compare
  (`reels/ep33tts.json`, `pipeline/ep33/voice_en.py`: skit 01's cast). The viewers split: one preferred the AI voices
  (the recorded hook read "Yeah, you told him what of stock?"), the other the human take ("a TTS voice on an AI page
  smells like a content farm"). Both said 0:39-0:51 drags in both versions: the script, not the voice. Their idea: the
  owner voices Ravi, TTS voices the shop AI. The user's call, the same day: "AI voice English is only good". The
  trial is over: from EP34 on, both languages are voiced with TTS and no script goes out for recording. English as
  EP33's published cut (`pipeline/ep33/voice_en.py`): Ravi on Parler "Thoma", the shop AI on Fish with the narrator
  reference through `phone()`, judged per line after the filter and again after the build's tempo. Telugu on Parler
  as `pipeline/ep33/voice_te.py`.

## Run 2: daily creative reel
1. Read `series/creative_log.md`; no format, character set or topic repeats within 7 days. The shop cast (Ravi anna
   and the shop AI) belongs to the episodes now: use other casts and settings so the two daily posts look different.
   If the user has shared views, likes or comments for earlier reels, log them there and lean toward what worked.
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
   `pipeline/<id>/make_specs.py`, voices as in `pipeline/skit02/voice.py` (judged takes; English on Fish: the
   narrator/AI with the channel reference, other characters with a Parler-made reference clip; all Telugu on Parler),
   SFX on every beat, music arc.
6. Render EN + TE, review packs, viewer review, fixes. Post text `out/skits/NN_<slug>_post.txt` (EN + TE captions,
   comment prompt, hashtags, pinned comment), `_ig` copies, log the concept and hook in `series/creative_log.md`,
   commit and push, deliver as in run 1.

Virality can't be promised. What a run controls: the first second, a reason to keep watching every few seconds, a
payoff worth sharing, a loop, and a caption that asks for a comment.

## Lessons that cost a re-render (check before rendering)
- Telugu: any word that can be heard as a swear word or a slur (EP31: "LoRA" flapped to "loda"; now written "లారా".
  EP33: "దొరకలేదు" through the AI's phone filter was heard as "turakaledu"; now "నో మ్యాచ్ అండి").
  A phone filter on Telugu keeps a low cut near 150 Hz (300 Hz took d vs t and the nasals: "బామ్" -> "bava"),
  and the takes are judged after the filter, not before (pipeline/ep33/voice_te.py).
  Big numbers in English inside Telugu sentences; a short pause before a key number.
- Fish can repeat a sentence or add words: judge every take with ASR (word hit, repeats, rate) before using it.
- TTS sped up by the spec `tempo` (ffmpeg atempo) blurs key words: EP33 at 1.2x read "Keyword off" as "Keyword on",
  "pain relief" as "paint relief", "Test" as "just". Check each line after the build (Whisper on `line_NN.wav` or per
  line on the render) and give a blurred line its own `"tempo": 1.0`.
- Parler runs words together across a pause: "Why two? Switch one off" -> "why to switch one off", "pain balm" ->
  "paint bomb" in six takes. Re-roll with a word check (the judge's word hit passed both), or reword.
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
- Never run Parler (`te_check.py`, `te_verify.py`) during a render: the container's memory limit kills Parler and the
  render's ffmpeg without an error message (EP32 lost a render and two re-voices). Check the output file's time.
- Fish takes judged at normal speed can blur after the reel's 1.25x tempo (EP32: "word" -> "world"): judge the
  stretched line (`video/public/reel/<id>/line_NN.wav`), and give a blurred line its own `tempo` (1.15-1.2).
- A word that is misheard after two fixes (tempo, mix) gets reworded, not re-rolled (EP32: "re-rank" -> "add a
  re-ranker").
