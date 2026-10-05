# Starting prompt: New Hampshire trip

## Open Claude Code with Opus 5.5 at max effort
In a terminal, in the folder that holds your footage (or the folder above it):
```
claude --model opus --effort max
```
Or inside a running session: `/model` -> choose Opus 5.5, then `/effort` -> max. (Desktop app: same commands in the
Code tab.) Then paste the prompt below, after filling the <...>.

## Prompt
```
/travel-vlog-editor

Make a modern, cinematic YouTube video from my New Hampshire trip footage for my channel The Travellers
(@thetravellers7066). This is a new video from new footage.

Footage: <full path, e.g. /Users/vamsi/Videos/New Hampshire 2026/DCIM>   (GoPro <model>; phone clips: <path or none>)
Project folder for all edit files: <e.g. /Users/vamsi/Videos/New Hampshire 2026/edit>   (never touch the originals)
Trip: <dates>, <who was there>, places: <e.g. Kancamagus Highway, Flume Gorge, Franconia Notch, Lake Winnipesaukee...>
The story in a few lines: <plan, best moments, what surprised you, anything that went wrong, the payoff>
Style: modern travel film - cold-open montage cut on the beat, speed ramps and hyperlapses between places, punch-ins,
minimal kinetic titles and location tags, sound design with natural sound + whooshes/hits, warm cinematic grade,
letterbox for scenic parts. Keep the useful info too (route, parking, entry fees, timings, tips) as clean cards.
Spoken language: <Telugu with English words / no talking>; subtitles in English; on-screen text in English.
Target length: <8-12 min>, plus <3> Shorts (9:16).
Music: <folder with licensed tracks, or "suggest tracks from the YouTube Audio Library and I will download them">
Must include: <moments/people/facts>.   Leave out: <people who don't want to appear, private moments>.

Work end to end with the skill: setup check, scan + contact sheets + transcripts, footage log, then show me the story
outline with 3 title ideas and the thumbnail idea and wait for my OK. Then rough cut, self-review + simulated viewer
review, fix, and give me the 540p preview with chapters and what the review changed. After my notes, render the 4K
(or 1080p if my laptop is slow) master and the upload kit (thumbnails, title options, description, chapters,
subtitles in both languages) and the Shorts. Run heavy jobs one at a time in the background and tell me what is
running. Ask me only when blocked or at the two check-ins.
```

## Tips
- First run on a laptop: Claude runs `setup_check.py` and tells you what to install (ffmpeg, Python packages, font).
- Speech recognition for Telugu is slow at full quality; Claude can draft with `small` and use `large-v3` only on the
  clips that make the cut.
- Reply to the outline and the preview with plain notes ("more of the gorge", "cut the parking lot", "music too loud at
  3:10"); Claude edits edit.json and re-renders only what changed.
