# Starting prompt (copy, fill the <...>, paste into a new Claude Code session on the laptop)

```
/travel-vlog-editor

Edit my trip footage into a publish-ready YouTube video for my channel The Travellers (@thetravellers7066).

Footage: <full path, e.g. /Users/vamsi/Videos/2026-10 Acadia/DCIM>   (GoPro <model>, plus phone clips in <path or "none">)
Project folder for all edit files: <path, e.g. /Users/vamsi/Videos/2026-10 Acadia/edit>   (never touch the originals)
Trip: <where, dates, who is in it>
What happened / the story: <2-5 lines: plan, best moments, anything that went wrong, the payoff>
Video type: <step-by-step guide | experience vlog | story | review>  - main promise: <e.g. "how to do Acadia in one day without a car">
Spoken language: <Telugu with English words>; subtitles in <English>; on-screen text in English.
Target length: <e.g. 10-12 min>, plus <2> Shorts.
Music: <folder with licensed tracks, or "pick from YouTube Audio Library: I will download what you suggest">
Must include: <moments/people/facts>.  Must leave out: <people who don't want to appear, private moments>.
Facts to show (I said some on camera): <prices, timings, routes, names>.

Work end to end with the skill's workflow: setup check, scan + contact sheets + transcripts, footage log, then show me
the story outline with title/thumbnail ideas and wait for my OK. Then rough cut, self-review + simulated viewer review,
fix, and give me the 540p preview with chapters and what the review changed. After my notes, render the master and the
upload kit (thumbnails, title options, description, chapters, subtitles in both languages) and the Shorts.
Run heavy jobs one at a time in the background and tell me what is running. Ask me only when you are blocked or at
the two check-ins.
```

Tips
- First time on a laptop, Claude will run `setup_check.py` and tell you what to install.
- A 1-2 hour trip takes a while to scan and transcribe on a laptop (proxies + speech recognition); Telugu speech
  recognition with `large-v3` is slow on CPU - Claude can use `small` for a quick draft and `large-v3` only for the
  clips that go in the video.
- Reply to the outline and the preview with plain notes ("cut the parking part", "more of the waterfall", "music too
  loud at 3:10"); Claude edits edit.json and re-renders only what changed.
