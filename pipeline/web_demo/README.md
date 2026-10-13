# Website demo reels

Turn a template in `website_templates/` into a 9:16 demo reel with an original soundtrack.

1. Serve the template: `cd website_templates/01_streaming_portfolio && python3 -m http.server 8765 --bind 127.0.0.1`
2. Record it frame by frame on a frozen clock (smooth 30 fps whatever the machine speed):
   `node pipeline/web_demo/capture.js phone video/public/web/01/phone.mp4` and `... desk video/public/web/01/desk.mp4`
   (`vt.js` freezes the page clock, steps every CSS animation/transition to virtual time, draws the cursor or fingertip.)
3. Soundtrack (synthesised, no samples): `python3 pipeline/web_demo/sound.py video/public/web/01/sound.wav pipeline/web_demo/cues.json`
4. Edit lives in `video/src/reel/webdemo/web01.json` (segments, captions, camera moves); composition `WebDemo-01`.
5. Render (from video/): `npx remotion render WebDemo-01 ../out/web_demos/01_streaming_portfolio.mp4`

`hero.html` is the source of the template's hero image (CC0 photo, graded, stamped, plate blurred), shot at 1920x1080.
The recordings and sound in `video/public/web/` are git-ignored: re-run steps 1-3 to rebuild them.
