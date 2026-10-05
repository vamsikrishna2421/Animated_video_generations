# travel-vlog-editor (Claude Code skill)

Turns a folder of GoPro/phone trip clips into a finished, branded YouTube video + Shorts + upload kit.

## Install on your laptop (once)
1. Install the tools:
   - **Mac**: install Homebrew (https://brew.sh), then `brew install ffmpeg python`
   - **Windows**: `winget install Gyan.FFmpeg` and `winget install Python.Python.3.12` (open a new terminal after)
   - then: `python3 -m pip install numpy pillow faster-whisper` (Windows: `py -m pip install ...`)
2. Copy this whole `travel-vlog-editor` folder to your personal skills folder:
   - Mac/Linux: `~/.claude/skills/travel-vlog-editor/`
   - Windows: `C:\Users\<you>\.claude\skills\travel-vlog-editor\`
   (so the file `~/.claude/skills/travel-vlog-editor/SKILL.md` exists)
3. Fonts: download Montserrat from https://fonts.google.com/specimen/Montserrat and put `Montserrat-ExtraBold.ttf`
   and `Montserrat-SemiBold.ttf` in `brand/fonts/`. Optional: a transparent `logo.png` in `brand/` and set
   `"logo": "logo.png"` in `brand/brand.json`.
4. Check: `python3 ~/.claude/skills/travel-vlog-editor/scripts/setup_check.py` -> should end with READY.

## Use
Copy the GoPro card's DCIM folder to the laptop (or an SSD), open Claude Code in a folder next to it, and paste the
prompt from `STARTING_PROMPT.md` (type `/travel-vlog-editor` first if Claude doesn't pick the skill up by itself).
Claude scans the footage, proposes a story outline (you approve), renders a preview (you comment), then the master,
thumbnail, title, description, chapters and subtitles.

## What's inside
- `SKILL.md` - the workflow Claude follows
- `scripts/` - inventory (scan + proxies + scores), sheets (contact sheets), transcribe (speech), beats (music grid),
  cards (brand graphics), render (edit.json -> video), review_pack (self-check), publish_kit (upload kit),
  setup_check
- `reference/` - craft playbook, edit.json format, GoPro notes, YouTube notes, viewer review prompt
- `brand/` - brand.json (name, colours, fonts, logo), CHANNEL.md (what works on this channel; grows over time)
- `examples/edit_example.json` - a small edit list using every feature
