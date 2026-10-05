# edit.json - the edit decision list `render.py` renders

Paths are relative to the edit.json file. Times are seconds. Recording ids come from `inventory.json`
(GoPro chapters are already joined: `GX0123` = GX010123.MP4 + GX020123.MP4 + ...; `in`/`out` count across chapters).
The `//` comments below explain fields; real edit.json files must be plain JSON without comments.

```json
{
  "title": "Worcester to Logan Airport by train - full guide",
  "canvas": [1920, 1080],            // [3840, 2160] for a 4K master, [1080, 1920] for Shorts
  "fps": 30,                         // match the footage (30 or 60; 24/25 if shot that way)
  "brand": "../brand/brand.json",
  "project": ".",                    // folder with inventory.json (default: this folder)
  "output": "out/logan_guide.mp4",
  "grade": "natural",                // default grade for all footage segments (see grades below)
  "letterbox": 2.39,                 // optional cinematic bars (2.39 or 2.0); a segment can set "letterbox": false
  "ambient_db": -6,                  // default gain for "keep" (natural sound) segments
  "music_db": -14,                   // default music gain in the gaps (it is ducked further under speech)
  "loudness": -14,                   // integrated LUFS target (YouTube)
  "encoder": "libx264",              // or h264_videotoolbox (Mac) / h264_nvenc (NVIDIA) for faster masters
  "duck": {"threshold": 0.015, "ratio": 9, "attack": 25, "release": 450},
  "segments": [ ... ],
  "music": [ ... ],
  "sfx": [ ... ]
}
```

## Segments (played in order)

### Footage
```json
{"src": "GX0123", "in": 62.4, "out": 68.9,
 "speed": 1.0,                 // 0.25-0.5 slow motion (use high-fps clips), 2-8 for hyperlapse walks; audio muted above 2.5x
 "audio": "keep",              // keep = natural sound at ambient_db | voice = someone talking: full level + ducks the music | mute
 "gain_db": 0,                 // override the level for this segment
 "transition": "cut",          // into this segment: cut | fade | dissolve | dip | flash | wipeleft | slideleft | smoothleft | circleopen | zoomin | ...
 "tdur": 0.5,                  // transition length
 "chapter": "South Station",   // starts a YouTube chapter here (publish_kit makes chapters.txt)
 "grade": "warm",              // natural | flat (GoPro Protune) | warm | golden | cool | vivid | night | bw | none | raw ffmpeg filter string
 "zoom": 1.0, "zoom_to": 1.12, // static punch-in (zoom) or slow push-in over the segment (zoom -> zoom_to)
 "crop_x": 0.5, "crop_y": 0.5, // framing when cropping (0 = left/top, 1 = right/bottom); essential for 9:16 Shorts
 "stabilize": false,           // extra deshake (GoPro HyperSmooth footage rarely needs it)
 "lens_fix": false,            // soften GoPro fisheye (straight lines in cities/rooms)
 "reverse": false,
 "freeze_end": 0,              // hold the last frame N s (e.g. under a price reveal)
 "watermark": true,            // brand watermark when brand.json has "watermark": true
 "text": [ overlays... ]}
```

### Card (full-frame branded graphic over blurred footage or the brand colour)
```json
{"card": "intro",   "dur": 3,   "bg_src": "GX0101", "bg_in": 12}           // channel sting, max ~4 s, AFTER the hook
{"card": "chapter", "dur": 2.5, "big": "Part 2", "text": "South Station", "sub": "Boston"}
{"card": "title",   "dur": 3,   "text": "Worcester to Logan by train", "sub": "Full guide"}
{"card": "outro",   "dur": 20,  "bg_src": "GX0140", "bg_in": 3, "text": "Thanks for watching", "sub": "Watch next →"}
```
On cards, `text` is the card's own title; put extra overlays under `"overlays": [...]`.

### Photo
```json
{"image": "photos/IMG_1234.jpg", "dur": 4, "zoom": 1.0, "zoom_to": 1.08, "text": [...]}
```

## Text overlays (inside a segment; `at` is seconds from the segment start)
```json
{"kind": "location", "text": "South Station", "sub": "Boston, MA · Day 1", "at": 0.4, "dur": 3.5}
{"kind": "lower",    "text": "Silver Line SL1", "sub": "free from the airport"}
{"kind": "big",      "text": "We almost missed the flight", "sub": "", "size": 120, "y": 0.5}
{"kind": "step",     "n": 3, "text": "Buy a CharlieTicket at the kiosk"}          // or "label": "NEXT"
{"kind": "tip",      "label": "Money tip", "text": "Youth Pass = 50% off every ride"}
{"kind": "caption",  "text": "English line for what is said in Telugu"}
{"kind": "route",    "text": "Worcester > South Station > Silver Line > Logan", "current": 2}
{"kind": "counter",  "text": "$2.40", "sub": "one bus ride"}
```
Optional `"anim"`: `slide` (default for location/lower/step/tip) or `fade`. Keep text on screen long enough to read
twice (~0.3 s per word, minimum 1.5 s). Don't stack more than two overlays at once.

## Music and sound effects (times in the FINAL video)
```json
"music": [
  {"file": "music/morning_walk.mp3", "at": 0,  "from": 12.0, "to": 140.0, "gain_db": -14, "fade_in": 0.3, "fade_out": 2,
   "credit": "Music: Morning Walk - Artist (YouTube Audio Library)"},
  {"file": "music/drive.mp3", "at_seg": 14, "offset": 0, "to_end": true, "loop": true}
],
"sfx": [{"file": "sfx/whoosh.wav", "at_seg": 9, "offset": -0.2, "gain_db": -8}]
```
- `python scripts/sfx.py <project>/sfx` generates licence-free whoosh / whoosh_short / swish / hit / boom / riser /
  riser_long / suck / click / shutter. Whoosh starts ~0.2-0.5 s before a slide/zoom cut; a riser ENDS on the cut
  (offset = -riser length); hit/boom on frame 1 and big reveals.
- `at_seg` anchors to the start of segment N (0-based) so it survives edits; `offset` shifts it.
- The music is ducked automatically while `"audio": "voice"` segments play; mark talking segments as `voice`.
- To land cuts on the beat: read `<track>.beats.json` and choose `in`/`out` so segment boundaries in the final timeline
  fall on `beats` (cut on bars for big changes, `lifts` for reveals / new chapters / drone shots).
- To make a hard music drop before a key moment: end one track with a short fade_out just before the segment and
  start the next (or the same track at a later `from`) on the reveal.

## Outputs
`render.py` writes `<output>.mp4` and `<output>.timeline.json` (start/end of every segment, chapter and overlay in the
final video). `--preview` writes `<name>_preview.mp4` at 540p. Per-segment intermediates are cached in
`<project>/.render_cache/` - delete that folder to reclaim space after the master is approved.
Debug: set `VLOG_KEEP=1` to keep intermediate join files and print the ffmpeg commands.
