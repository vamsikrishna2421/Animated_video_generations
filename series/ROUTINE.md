# Daily routine: two scheduled runs

| Run | When (IST) | Makes | Template to copy |
|---|---|---|---|
| Daily new episode | 05:59 | by weekday: the next syllabus episode as a teaching skit (Sun, Mon, Tue, Wed, Fri), a HOW TO (Thu), AI WEEKLY news (Sat); Insta EN/TE (YouTube: the same files as Shorts) | EP35 (skit, facts, demo), AI Weekly 01 (news) |
| Daily creative reel | 17:57 | one original short (30-60 s), EN + TE, built to be shared | Skit 01 "The AI that remembered the wrong price" |

Both runs fire into the same Claude Code session. A run that is still going delays the next one; always finish the
unfinished run first. CLAUDE.md applies to both (human-viewer at script and render stage, audio arc, facts, push only
to `sample1`, no model identifiers in committed files). Never post or publish anywhere: the user posts.

## Start of every run
1. `git status` (clean), branch `sample1`, `git pull origin sample1` (after `free_disk.sh` has dropped renders and the
   remote has new commits, use the fetch + soft-reset recipe in the lessons: a plain pull rewrites every dropped render).
1b. Read `BUJJI_CLAUDE_HANDOFF.md` (set up Oct 24: Bujji publishes the reels and posts analytics there). Log any numbers
   in the creative log / queue, apply one change at a time, and add a `[NEW]` entry (newest first) when a package is
   pushed. Its notes shape content choices; CLAUDE.md's rules still apply.
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
The day's slot follows the weekday in IST on which the run was fired (a run that starts late keeps its day's slot).
The user's ask (Oct 20): the daily episode covers the whole syllabus, plus weekly AI news and useful how-tos.

| IST day | Slot | Next item from | Posted |
|---|---|---|---|
| Sun, Mon, Tue, Wed, Fri | Syllabus episode, as a teaching skit (steps 1-8 below) | `series/SYLLABUS.md` order: EP38 is next (queue 040), up to EP58 (queue 062); then the use cases UC01-UC24 (queue 064-087), each remade as a skit in its slot. Quiz reels (q04-q06) stay as made. | in serial order (`out/UPLOAD_ORDER.md`) |
| Thu | HOW TO (see "Thursday: HOW TO") | `series/HOWTO.md`, the first "planned" row whose "Needs" are out | the day it is made |
| Sat | AI WEEKLY (see "Saturday: AI WEEKLY") | `news/README.md`, "Weekly edition" | the day it is made |

At five a week: EP36-EP41 by Oct 28, Season 5 (EP42-EP49) by Nov 9, Season 6 (EP50-EP58) by Nov 22, then UC01-UC24 to
the end of December.

From EP33 on (confirmed by the user on Oct 19: "creating a real world scene and explaining the concept... should be the way going forward"), each episode teaches its syllabus topic through a short skit, the way skit 01 taught EP31's lesson
(Oct 18: skit 01 reached about 140 views and the user asked for the real topics to be taught this way). EP31 and EP32
stay as made.
1. Topic: the next episode in `series/SYLLABUS.md` after the last remade episode in `out/upload_queue.json` (the
   remakes run EP33 (035), EP34 (036), EP35 (037), EP36 (038), EP37 (039); next EP38 "Running AI locally on your laptop", queue 040). The skit replaces the old
   lesson file in that slot; update the title and files in `out/upload_queue.json` and `out/UPLOAD_ORDER.md`. A topic
   whose skit needs something the syllabus has not taught yet keeps the order rule in SYLLABUS.md.
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

### Thursday: HOW TO
1. Take the next row of `series/HOWTO.md` (format and rules there) and mark it "in progress".
2. Do it for real on this machine first: install, run, time it; keep the exact commands and outputs
   (`series/scripts/howtoNN_<slug>.md`), and check every step against the official docs of the day.
3. Script EN + TE in the skit world (the result in frame 1, 3-4 real steps, the "save this" card), script-stage
   viewer review, then build (`<Name>Crayon.tsx`, `pipeline/howtoNN/`), voice, render, review packs, render-stage
   review and fixes as for an episode.
4. Files: `out/howto/NN_<slug>.mp4`, `out/howto/telugu/NN_<slug>_te.mp4`, `_ig` copies, and
   `out/howto/NN_<slug>_post.txt` (EN + TE captions with every command, links, requirements, licences, pinned
   comment, YouTube Shorts text). Mark the row "done" in `series/HOWTO.md`, commit, push, deliver as in step 8.

### Saturday: AI WEEKLY
1. Follow `news/README.md` "Weekly edition" for the 7 days before the run: the owner's digests in `news/inbox/`, a
   sweep of the week, every story confirmed by the company's own page or 2+ reputable outlets, 6-7 stories with a
   "what it means for you" line each.
2. AI WEEKLY 02 (Sat Oct 24) also covers Oct 11-17, which never went out: start from `news/inbox/2026-10-14_triage.md`,
   re-check each item (prices and rollouts move), and keep the biggest stories of the two weeks.
3. Spec `news/week-<date>.json`, the four renders (`pipeline/render_news.sh`, 9:16 EN/TE and the 16:9 YouTube
   editions), review packs, viewer review, fixes, `news/week-<date>_post.md`, commit, push, deliver as in step 8.
   Nothing is posted automatically: the user reviews the delivered reel before posting; flag any story that needs their
   call in the delivery note.

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
  Numbers inside Telugu sentences: English worked for big ones (EP31-33), but EP35's "ఫోర్టీనా" came out "fortyna"
  and Telugu number words (పద్నాలుగు, నలభై) came through; check each number in the transcript. A short pause before a
  key number.
- Fish can repeat a sentence or add words: judge every take with ASR (word hit, repeats, rate) before using it.
- TTS sped up by the spec `tempo` (ffmpeg atempo) blurs key words: EP33 at 1.2x read "Keyword off" as "Keyword on",
  "pain relief" as "paint relief", "Test" as "just". Check each line after the build (Whisper on `line_NN.wav` or per
  line on the render) and give a blurred line its own `"tempo": 1.0`.
- EP34 lessons: Parler's English Ravi said "then" for "ten" in every take (reword away from such words); a long
  three-part Telugu line babbled in all four Parler takes (split it into two takes with `file2`/`tts2`); check each
  line's must-hear words (`MUST` in `pipeline/ep34/voice.py`): the word-hit judge passed "I loan" for "I'll own"; the
  first cut ran 93 s: write the AI's lines short and keep the explaining on screen.
- A music drop (`drop_cue`/`drop_at`) is 0.8 s long and does not move the lines: for a real silence before a punchline,
  also give the line before it a gap of about 0.75 s (skit 03: the first cut's drop before "No" sat under the line before).
- Memory (Oct 19, skit 03): files in `/dev/shm` count against the shell's memory limit (about 13.7 GB), so a 7B model
  in `/dev/shm` plus its llama.cpp process plus Parler got the demo killed. Run one heavy model at a time and delete
  the other models from `/dev/shm` meanwhile (`/tmp/claude-0/hf_dl.py` puts Parler and Whisper back in a minute). Long
  demos save results row by row and can resume (`pipeline/skit03/confess_demo.py`).
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
- A quiz card is one short line ("MEDIUM: ?/40") with a 3-2-1 count, held 2.5 s or more (the `GAP` after its line):
  EP35's first card had 16 words for 1.5 s and neither viewer could read it.
- When one card counts right answers and another counts mistakes, write the unit on every number ("9 wrong") and say
  "out of 20" in the voice (EP35: the bills bar "TINY 19/20" read as a good score).
- Numbers on screen must add up across the reel (EP35's first cut: 1 GB free, 41 GB free after deleting the photos,
  then "free: 1 GB" after 52 more photos).
- In a Telugu pack the "music-only" level can cover only the music drop (the voice fills almost every second):
  compare the voice and music stems before boosting the bed (EP35: "15 dB under" was the drop; the stems matched English).
- Parler drops the opening word or sentence of a Telugu take and the judge still passes it (NEW IN AI 01: "అదీ," of
  "అదీ, ఆ కంపెనీనే." and the whole "పాయింట్ సిక్స్ తేడానా?"): give each line's opening word a MUST entry, and read
  every chosen take's transcript before building. An ellipsis ("అదీ...") made the pause so long the judge threw the
  takes out as LONG; a comma keeps the hesitation.
- A hit SFX on a cut hides the first word of the next line (NEW IN AI 01: "Point six apart?" heard as "Int 6 apart"):
  give that scene `pre` 0.3-0.4 so the hit lands before the voice.
- `rise` and `swell` stay at their gain after the window (the Reel keeps each ramp), so they multiply into every later
  scene: plan the later boosts lower, and check the quarter levels in the pack (NEW IN AI 01: three ramps = 4x by the end).
- A diagram of a score has to show that score (NEW IN AI 01: the floor-plan card showed about 8% overlap for a 43.6%
  IoU; equal squares offset 22% each way, or 39% sideways, give 0.44).
- A line Whisper mishears only in the full-pack transcript may be the voice-activity split: transcribe the opening on
  its own before re-voicing (NEW IN AI 01: "Meghana, STAM" in the pack, "Megana. Stop." alone). A real merge comes
  from `maxgap` tightening the pause after a short exclamation ("stop, a new" -> "stomp a new"): give that line its
  own `maxgap`.
- Fish ran a three-sentence line together ("three minutes for one hub", which clashed with "three hours"): split
  such a line into two takes with " | " in make_specs (works for English as well as Telugu).
- Fish mishears plain English words when a homophone exists (EP36: "a billion sums" -> "sons", "ONE reply" ->
  "Wondreply", "stock-taking" -> "stock trading", "more cores" -> "more chorus"): pick words with no near twin
  ("calculations", "a single reply", "stock count"), and re-roll a word you can't replace until the transcript is clean.
- A label for where something lands sits above the landing spot, never under it (EP36: "CPU: 8 workers" vanished under
  the sliding 7 GB block), and every label on a moving piece fits inside that piece.
- The last reveal needs its own riser and hit, or the final quarter reads flat in the pack (EP36: a riser and boom into
  the overflow, a bigger boom on "Typing...").
- A one-word Telugu take on Parler ("టైపింగ్...") babbles on the first tries ("ఆయ్ పింట్", "పైపిం"): give it a MUST
  entry so the judge retries, and split the English caption at the take boundary with "<pause 0.3>" in `show`.
- Parler voices each sentence of a take on its own, and one sentence can come out 11 dB under the other (EP36's
  Telugu line 16; the pack's voice-activity check didn't even count it as speech): `level()` in pipeline/ep36/voice.py
  evens every take per sentence against its loudest stretch (a median reference missed line 16, where most
  stretches were the quiet ones); copy it into new voice scripts.
- The moment the episode is about needs its own beat: a pause, a big visual, a hit and a spoken reaction (EP36: the GPU
  clearing the queue was a small badge nobody mentioned until Ravi's "Done already?!").
- A loop ending still has to answer "so do I need it?": put the answer on screen before the last gag (EP36: three of
  four viewers read the ending as "the GPU failed" until the card "medium brain, 1.1 GB: fits ✓ · big brain, 15 GB:
  doesn't fit").
- Type-check before every render (EP36: a `//` comment pasted mid-line commented out the rest of a `sfx.push(...)`).
  To stop a render, kill by PID the chain's subshell first, then render.sh, the node remotion process and its
  headless_shell browsers: killing render.sh alone orphans remotion, and a `render; make_ig; pack` chain then runs on a
  half-written mp4. Chain those steps with `&&`.
- A drop that ends on the cue brings the bed back exactly on the punchline word, and stacked ramps (boost x rise x
  swell) cap it at full volume (EP36: "Typing" heard as "Type in"): hold the drop through the word with
  `drop_at: [[line, cue, hold_s]]`. Hits for a line go on the cut, before its first word ("For AI" heard as "O.A.I.").
- Captions in "phrase" mode break only at punctuation (Reel.tsx `phraseChunks`): to hold back a reveal, end the caption
  phrase before it ("Google keeps it... up to three years"). A "<pause>" in `show` works only on two-take lines; on a
  single take it printed "<pause 0.8>" on screen (creative 05).
- Draw a laptop slam as a slam: a thick arm, a hand, impact lines, the lid folded flat, the stakes in a bold block in
  the top third (creative 05: a still arm read as "a desk lamp"); frame the loop's last beat like frame 1.
- Fish read "Relax, ma'am" as "Relax mom" and "pin" as "been": drop the honorific, use "put up". Parler Telugu blurred
  "సెండ్ నొక్కకు" in eight takes ("సెండ్ చెయ్యకు" came through) and "చాట్స్" reads "charts" ("మనం టైప్ చేసేది").
- A loop's last hit must be its biggest. In a speech-dense skit the quarters stay within 1 dB however the bed moves
  (the voice dominates), so the arc comes from the hits, the gaps and a drop before the final hit:
  `drop_pre: [[line index, s before the line, length s]]` takes the bed out under the riser so the slam lands on
  silence (creative 05: the closing slam measured 1 dB under the opening one; both viewers heard "no build").
  A last scene's `boost` lower than the one before dips the bed at the cut (1.35 after 1.7): carry the level, then
  `rise`. Reading beats that land in the lofi bed's bar-end holes are near silence (-28 to -33 dB): `musicPad`
  fills them (-23 dB), and `musicGapGain: 3` raises the bed itself in the gaps (the player's volume tops out at 1, so
  without it a pause sits no louder than the bed under speech; -20 dB, 8 dB under the voice).
- A line whose words are already on screen (a rule chip) gets `nocap` (no subtitle): chip + subtitle + tag read as
  three text blocks and the tag went unread. Put the answer to "and if my company has none?" on screen with the rule.
- The Telugu judge: a missed word must cost more than the length flag, or a take that loses the name ("Ajjun") beats a
  clean one 0.05 s over the limit, and voice.py deletes the losers (skit05 voice.py: 1.5 per missed word). Back up a
  kept take before a re-roll; widen MUST spellings from what the judge hears ("नाउटिस", "पट्टगालगे").
- A fact about one product makes users of the other one ask "me too?" (Gemini's 3 years: "ChatGPT lo kuda?"): answer
  it in the pinned comment with that company's own wording.
- HOW TO runs (HOW TO 01): a tool you install goes in its own venv (`python3 -m venv --system-site-packages`), so a
  dependency can't move the pipeline's pinned transformers/torch; check `pip install --dry-run` first. Disk: models go
  to `/dev/shm/hf` (`HF_HUB_CACHE`), and a container restart wipes them (move a stray `~/.cache/huggingface` model there
  instead of downloading it twice). Telugu on a canvas needs a Telugu font (`apt-get install fonts-lohit-telu`).
- A demo line must be true where it was made: our test machine is a server CPU, so "made on a computer", not "on a
  laptop". Code shown in a reel and pasted in a caption: Instagram strips leading spaces, so no indented blocks (a loop
  on one line), and the caption, pinned comment, YouTube text and save card must point at the same place.
- Fish: "two install commands" is heard "to install"; "Parler" comes out "Indikpala" (respell "Parlay", the French
  sound); an opening phrase can vanish behind the phone filter for the judge but be there in the raw take (check the
  raw file before re-voicing). Parler Telugu drops a long line's first sentence: split it with " | " (two takes, a
  `must2` list for the second). A killed voice run leaves its failing take in the cache, and the next full run reuses
  it: delete that file or re-voice the line by number.
- `musicEndGain` lifts the whole bed about 2.8 dB, not just the ending (its tanh normalisation has gain 1.37 on quiet
  signals): HOW TO 01 Telugu dropped to 6-7 dB voice-over-music on every line. `musicEndRamp: [start fraction, dB]`
  swells only from the start point (start it where the last explaining line ends; a line under the swell may need a
  `duck_lines` entry to stay 8 dB clear). Put a lift's hit 0.7 s before a key word (`pre`): at 0.3 s the boom tail
  and the outro layer blurred "తెలుగు" in the mix while the isolated take was clean.
- The Telugu judge writes numbers as digits ("30" for ముప్పై): put the digits in the MUST group, or the complete take
  fails and a take that dropped the number wins by 0.003 points (Parler dropped "ముప్పై సెకన్లు" in 3 of 4 tries).
  Whisper can also skip the first sentence of a take with a long pause in it: transcribe the halves before re-voicing.
- On a Telugu page "తెలుగు" must sound right: check it in each isolated take (`line_XX.wav`, after tempo), not only in
  the mix. Parler said "తిలుగుకి" mid-sentence in eight takes but cleanly where it opens a sentence, so lead with it;
  and a 1.2x speed-up turned a clean "తెల్గో" into "తిల్గో" (a short word's vowel smears): give that line `tempo` 1.0.
- A "guess which one is AI" game is solved in seconds if only one answer sounds like a guess (creative 06 script review:
  both viewers at 0:12): give another contestant AI-sounding words (B's customer-care "I can't confirm that. Please
  contact the restaurant directly."), and keep the silhouettes and caption labels neutral ("Contestant C", not "AI").
- A test card must show the same measures before and after, on screen 2 s or more ("0/10 -> 10/10"), say what the
  rest of the tries did ("0 + 8 isn't 10"), quote the model word for word in a plain font, and carry the caveat.
- Parler Telugu babbles on "ఏఐ" at the end of a sentence ("ఒకరు ఏఐ.", "ఏఐ ఎవరు?": 8 takes); mid-sentence it is fine.
  English inside a Telugu line ("If you're not sure, say I don't know") came through clean in one take.
- RAM: the model cache lives in /dev/shm (RAM). Parler plus a 7B llama.cpp model plus the cache ran out of memory and
  the LLM run died without an error line; run them one after the other and delete a finished model from /dev/shm.
- A new reel's media folders (`video/public/reel/<id>/`, `out/skits/NN_*.mp4`) go into `.git/info/exclude` when they
  are created, or the next `git add -A` commits the voice-take caches.
- EP37 lessons: a judge's must-hear list written before hearing a voice is too narrow (the Telugu "ఆవిడ" came back as
  "अविड़ा", "अविद", "आवविड"; "రౌండ్" as "राून"); when every take fails on spelling, the picker keeps the one with the best
  base score, and that was the worse take three times (line 1 lost "ఆవిడ", 6b dropped "ఫోర్ బిట్ లో"). Read each
  failing take's transcript, widen the list, delete the kept take and re-voice. English: Whisper writes "2-bit" for
  "two-bit", so a "two" must-word fails a clean take; Fish read "paisa" as "Pisa" (a strict "paisa" must-word fixed it)
  and Parler swallowed "an" ("made it in order"; an "an" must-word fixed it). Parler Telugu garbled "డౌన్‌లోడ్" in four
  takes ("ఏ ఫైల్ తీసుకోవాలి?" came through) and looped "అరవై రెండు, అరవై అవుతుంది" (one number per sentence).
- A quoted message inside a shouted line reads as an announcement ("My wife's 'lunch is ready' went in as an ORDER"):
  give it a verb that frames the quote and a question to rise into ("My wife says 'lunch is ready', and you made it an
  ORDER?!"). A test card needs the machine on the speed claim ("4-core computer, no GPU") and the catch on screen
  ("hard job 13 -> 11"), or the result reads as a free lunch. A silent quiz countdown over 3 s loses the viewer: 2.6 s
  with 0.8 s counts.
- Levels move when a take is re-voiced (a new length shifts every later line against the bed's bars): re-measure after
  each rebuild, and keep separate gain tables per language (`GAIN_TE`).
- Telugu: two terms that open with the same sound blur in a fast exchange ("ఫుల్ సైజ్" / "ఫోర్ బిట్" heard as "ఫూల్
  బిట్"): use "అసలు సైజ్" for full size. A technical term Parler mangles in Telugu script ("క్వాంటైజేషన్" ->
  "kontization" in four takes) came out right written in English letters inside the Telugu line ("దీని పేరు
  Quantization."), as its own take. A boom on the cut still masks a Telugu line's first word ("ఒక్కటే" -> "agar"):
  half a second early. Make a shop's wall board agree with any price board on screen (EP37: dal ₹120 vs ₹139.75).

- Creative 07 lessons (our own tests): read every reply by hand before a number goes on screen. Asked "How is it? Rate
  it out of 10.", 4 of 10 replies rewrote her answer and scored only their own rewrite ("This version is rated
  7/10"), and two scored hers in words ("around 4-5", "a **5**"): a first-"N/10" regex reported 5.9, the hand score was
  4.75 (the script review caught it in results.json). Keep the hand scores and the reason in the demo script (`HAND`).
- A test model's training cutoff leaks into the result: Qwen2.5 called a 2025 graduation and internship "not a valid
  year" and docked points for it. In a story set in 2026, the test text says "last year", not the year.
- A persona prompt can be harsh on everything: "a strict interviewer who rejects 9 out of 10 candidates" gave a strong,
  specific answer 3/10 for "lacks a personal touch". Before a reel recommends a prompt, run a strong-answer control
  with the same prompt; a prompt whose score doesn't follow the answer only teaches the viewer to feel bad.
- Telugu: a word that clips into a slur in a fast take is a swear-word risk: "ముందు" came out "mund" (near ముండ) in
  the mix, and its replacement "మొదట" came out "moddata" (near a vulgarity) in one take; "ఫస్ట్" ("phast") was safe. Parler babbled the short "స్ట్రిక్ట్ గా ఉండమని చెప్పు." in five takes ("నాకు"
  in front fixed it) and said "ఫెయిర్" as "pyaar"; an English line inside the Telugu reel (in English letters) came out
  clean, and needs the English judge: the Telugu one heard a clean "Believe in yourself." as "बीलीग यो स्वफ".
- A Telugu judge's must-hear list misses the take the ear accepts ("आइदू रेजेक्षन", "थेलिस्तुन्दी", "पादिकी", "याला"):
  the picker then keeps the best base score, which twice was the worse take. Back up each plausible take as it lands
  (the picker deletes the rest) and swap the better one into the cache before the build.
- Creative 08 lessons: the reel's title bar ("SKIT · <banner>") covers y 130-200 of the 1080x1920 frame, so phone
  headers, card titles and tags start below y 215 (the first stills hid "AI chat", "OUR REAL TEST" and "REWIND").
  Fish at 1.1-1.14x turned "a big party, or small?" into "oh small" in every build; "or something small?" came through.
  EP33's Telugu length check (0.11 s a letter, set for a flat AI voice) threw out every shouted or paused character
  take, so each line burned four Parler tries: creative08/voice.py allows 0.15. Whisper writes "pesarattu" as
  "Pesara 2" / "Pizarattu" and "four thousand eight hundred rupees" as "Rs 4,800": judge such lines against a digit
  version and match the dish as part of a word.
- A demo whose later stage depends on the script (creative 08: the answers it gets after asking) can be stopped at a row
  count and resumed with new input: rows save one by one and the done ones are skipped.
- Pulling after free_disk.sh (Oct 24): a fast-forward `git pull` re-wrote the skip-worktree renders (33 queue mp4s),
  the disk hit 0 and git stopped mid-merge (stray empty mp4s, the new file half-written). Recipe instead: `git fetch
  origin sample1`, `git diff --name-only HEAD origin/sample1` (what changed), `git reset --soft origin/sample1`, then
  `git checkout origin/sample1 -- <those files>`. Nothing else in the tree is touched; check `df -h /` before any pull.
