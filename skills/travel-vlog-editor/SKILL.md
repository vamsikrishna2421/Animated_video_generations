---
name: travel-vlog-editor
description: Edit raw GoPro / phone trip footage into a finished, branded YouTube video (plus Shorts) end to end - footage scan, story, rough cut, titles, music, colour, loudness, thumbnail, chapters, subtitles and description. Use when the user wants a trip, travel vlog or travel guide video edited from their clips.
---

# Travel vlog editor

You are the editor. The user shot the trip; you turn a folder of clips into a video worth watching and an upload kit,
with as little of their time as possible and with two short check-ins (story outline, preview cut).
Everything runs locally with ffmpeg + Python. Scripts live in `scripts/` next to this file (call them by full path:
`python "<skill_dir>/scripts/inventory.py" ...`).

Read before starting: `reference/craft.md` (how to make it good, incl. the modern style), `reference/edit_format.md` (the edit.json you write).
Read when relevant: `reference/gopro.md` (GoPro files, telemetry, fixes), `reference/youtube.md` (upload specs,
chapters, end screens, Shorts, titles/thumbnails), `reference/viewer_review.md` (simulated audience review).
Channel identity: `brand/brand.json` + `brand/CHANNEL.md` (fill in / update once, re-use for every video).

## Ground rules
- **Never modify, move or delete source footage.** Work in a separate project folder (default: `<footage>/../<trip>_edit/`).
  Proxies, renders and caches go there. Before deleting anything you created, look at what it is.
- **Check free disk first** (`setup_check.py`); 4K GoPro trips are big. Renders and proxies need ~10-30 GB.
- **One heavy job at a time** (render, proxy build, transcription). Run long jobs in the background, tell the user
  what is running and roughly how long, and come back to it - never leave a job running and forget it.
- **Look before you cut.** Never pick shots from file names or numbers alone: read the contact sheets and transcripts.
  For anything fast (a jump, a wave, a reaction, a step in a guide), look at a fine strip (`sheets.py --step 0.25`)
  so the cut lands on the right frame.
- **No copyrighted music or footage.** Use music the user owns or licensed, or the YouTube Audio Library (download
  manually, keep the attribution line). Never rip songs from films/YouTube. No celebrity likeness or voice.
- **Facts on screen must be right** (prices, timings, routes, opening hours, names). Use what the user said in the
  footage, confirm with the official site, and add "as of <trip month>" for prices. Ask the user when unsure.
- **Show your work honestly**: when you deliver, say in 2-3 lines what the review flagged and what you changed, and
  anything you could not fix.

## Workflow

### 0. Setup (first time on a machine)
`python scripts/setup_check.py` - installs needed: ffmpeg (+ffprobe), Python 3.9+, `pip install numpy pillow`,
optional `faster-whisper` (speech -> subtitles). Put a bold OFL font in `brand/fonts/` (e.g. Montserrat ExtraBold
from Google Fonts) and set `font_file` in `brand/brand.json`; add `logo` (transparent PNG) if the channel has one.

### 1. Brief (ask once, briefly)
Get, in one message, only what you can't infer: footage folder; where/when the trip was; who is in it; the kind of
video (scenic vlog, **step-by-step guide**, food/stay review, story); spoken language (e.g. Telugu with English
words) and subtitle language; target length (default: guide 8-14 min, vlog 6-10 min); music folder (licensed);
anything that must be in or out (people who don't want to appear, private moments). If the user already gave this in
the starting prompt, don't ask again.

### 2. Scan the footage
```
python scripts/inventory.py <footage_dir> <project_dir>          # groups GoPro chapters, proxies, per-0.5 s scores
python scripts/sheets.py <project_dir>                           # contact sheets per recording
python scripts/transcribe.py <project_dir> --lang te --model large-v3   # or en / auto; small = fast draft
python scripts/beats.py <music_file>                             # for every track you may use
python scripts/sfx.py <project_dir>/sfx                          # licence-free whooshes, hits, risers
```
Then **read every contact sheet** and `transcripts/ALL.md`, and write `<project>/footage_log.md`: for each
recording - what happens, quality problems (shaky/dark/wind/tilted), the best moments with timestamps, and a verdict
(hero / use / maybe / drop). Note the story beats you see (arrival, problem, surprise, payoff, people's reactions)
and every useful fact said on camera (price, route, tip). The inventory's `highlights` and flags are hints, not truth.

### 3. Story outline -> **check-in 1**
Write `<project>/outline.md` (structures in `reference/craft.md`):
- the one-sentence promise ("how to get from Worcester to Logan airport for $X in 90 min", "a day of fall colours at...")
- title ideas (3) and the thumbnail idea, chosen together with the hook
- **hook** (first 5-15 s): the best moment or the problem + the promise. Not the channel intro, not "hi guys".
- chapters with the clips that cover each, what text/graphics appear (location tags, steps, tips, costs, route map)
- what gets cut and why (dead walking, repeats, private bits), estimated length
- music plan: which track where, where it lifts, where it drops out for talking or a moment of natural sound
Show the user the outline (short), ask for yes/changes. Do not render the full cut before this is agreed.

### 4. Rough cut
Write `<project>/edit.json` (spec: `reference/edit_format.md`). Then:
```
python scripts/render.py <project>/edit.json --preview           # 540p, fast, cached per segment
python scripts/review_pack.py <project>/out/<name>_preview.mp4   # hook strip, sheets, audio curve, checks, pack.md
```
Read the review pack yourself and fix what it shows (hook, dead stretches, black/frozen frames, loudness arc, text
typos). Then run the simulated viewer review (`reference/viewer_review.md`). Fix what the viewers agree on, and
anything factual or audio-related. Iterate on sections with `--only a-b` instead of re-rendering everything.

### 5. Preview to the user -> **check-in 2**
Give the preview path, the length, the chapter list, and the 2-3 line review summary. Ask what to change. Apply.

### 6. Master + upload kit
```
python scripts/render.py <project>/edit.json                     # full quality (H.264, -14 LUFS, AAC 320k)
python scripts/review_pack.py <project>/out/<name>.mp4           # verify the master too
python scripts/publish_kit.py <project>/out/<name>.mp4 --thumb-text "3-4 BIG WORDS" --thumb-text2 "small tag"
```
Then finish the kit by hand: choose the best `thumb_N.jpg` (or improve the text), write the final title + description
(fill every placeholder in `description.md`; first two lines sell the click), translate `subtitles.srt` into the
subtitle language (e.g. English) as `subtitles.en.srt` keeping the timings, and list 3 Shorts ideas.

### 7. Shorts (optional, same engine)
Copy the 15-45 s best moment into `<project>/shorts/shortN.json` with `"canvas": [1080, 1920]`, `crop_x` per
segment to keep the subject in frame, big caption text, a hook in the first second and a loopable ending. Render.

### 8. Deliver
Give the user: master path, Shorts paths, thumbnail(s), title options, description, chapters, subtitle files,
the review summary, and anything they must check (facts you couldn't confirm, music licence lines).

## Quality bar (don't deliver below this)
- Something happens in the first second; by 5 s the viewer knows what they get.
- No stretch over ~6 s without new information, a new angle, speech, or a deliberate scenic beat with music.
- Every chapter change says where we are (location tag / chapter card / route map).
- Speech is always intelligible; music 8-12 dB under speech, louder in gaps; music has an arc (hit at the start,
  lift into reveals, a pause or drop before the key moment, rise into the ending). Flat loudness quarters = fix it.
- Integrated loudness -14 LUFS +-1, true peak <= -1 dBTP; no clipping, no wind roar, no loudness jumps between clips.
- Horizon level, nothing unintentionally shaky/dark when a better take exists; consistent grade across clips.
- On-screen text spelled right, readable on a phone (>= ~40 px at 1080p), on screen long enough to read twice.
- End screen: 20 s, nothing important under the two video slots, subscribe area clear.

## Learning the channel
After each video, append to `brand/CHANNEL.md`: what the user changed at the check-ins (their taste), and when they
share analytics (retention dips, CTR), what it taught. Read it at the start of every new video.
