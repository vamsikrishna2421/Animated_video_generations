# Website demo reels

Turn a template in `website_templates/` into a 9:16 demo reel with an original soundtrack.

1. Serve the template: `cd website_templates/01_streaming_portfolio && python3 -m http.server 8765 --bind 127.0.0.1`
2. Record it frame by frame on a frozen clock (smooth 30 fps whatever the machine speed):
   `node pipeline/web_demo/capture.js phone video/public/web/01/phone.mp4` and `... desk video/public/web/01/desk.mp4`
   (`vt.js` freezes the page clock, steps every CSS animation/transition to virtual time, draws the cursor or fingertip.)
3. Soundtrack (synthesised, no samples): `python3 pipeline/web_demo/sound.py video/public/web/01/sound.wav pipeline/web_demo/cues.json`
4. Edit lives in `video/src/reel/webdemo/web01.json` (segments, captions, camera moves); composition `WebDemo-01`.
5. Render (from video/): `npx remotion render WebDemo-01 ../out/web_demos/01_streaming_portfolio.mp4`

Laptop version (`WebDemo-01-Laptop`, edit in `video/src/reel/webdemo/web01_laptop.json`): the desktop flow plays on a
laptop mockup with camera push-ins (`lcam`: zoom `s` and focus `x, y` on the 1080 x 1920 canvas) and callout pills
pinned to points on the recording (`callouts`: `u, v` = 0-1 of the recording, `y` = pill height on the canvas).
- `node pipeline/web_demo/capture.js deskflow <raw.mp4>` records intro, profile click, rows, numbered row and pop-up with a
  bigger arrow and a ring on every click, and writes `<raw>.pointer.json` (pointer position per frame, CSS px of a
  1280 x 720 viewport) to aim the camera and the callouts. `NAME=PRIYA node ... deskintro <out.mp4>` = the renamed intro.
- Re-encode captures for the renderer: `ffmpeg -i raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -g 15 -c:v libx264 -crf 15 out.mp4`
- Sound: `python3 pipeline/web_demo/sound.py video/public/web/01/sound_laptop.wav pipeline/web_demo/cues_laptop.json`
  (`beds`/`lifts` windows bring the beat back under the end card; `hold_end` keeps it up to the last frame).

`hero.html` is the source of the template's hero image (CC0 photo, graded, stamped, plate blurred), shot at 1920x1080.
The recordings and sound in `video/public/web/` are git-ignored: re-run steps 1-3 to rebuild them.
