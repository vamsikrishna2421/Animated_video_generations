# GoPro footage notes

## Files on the card (DCIM/100GOPRO, 101GOPRO, ...)
| Pattern | Meaning |
|---|---|
| `GX01xxxx.MP4`, `GX02xxxx.MP4` ... | HERO6+ HEVC (H.265) recording `xxxx`, chapters 01, 02, ... (a new chapter every ~4 GB / ~8-12 min) |
| `GH01xxxx.MP4` ... | same, H.264 (AVC) |
| `GOPRxxxx.MP4` + `GP01xxxx.MP4` | older cameras: first chapter + following chapters |
| `GL01xxxx.LRV` / `GOPRxxxx.LRV` | low-res proxy of the same chapter - `inventory.py` reuses them as proxies (fast) |
| `GX01xxxx.THM` | thumbnail, ignore |
| `GS01xxxx.360` | MAX 360 footage - reframe to a normal view in GoPro Player / Quik first, then edit the export |
`inventory.py` groups chapters into one recording id (`GX0123`), so a long take is one clip with continuous time.
Never rename files on the card; copy the whole DCIM folder to the laptop/SSD first.

## Common problems and fixes
- **HEVC 10-bit is slow to decode** on older laptops: the proxies handle analysis; for renders use `--hwaccel`
  (Mac / NVIDIA) and preview at 540p. If the master render is too slow, `"encoder": "h264_videotoolbox"` (Mac) or
  `"h264_nvenc"` (NVIDIA).
- **Fisheye/Wide lens**: fine for action and POV; for buildings/rooms set `"lens_fix": true`, or punch in (`zoom` 1.1).
- **Tilted horizon**: if horizon levelling was off, a slight `zoom` + rotate is not built in - prefer another take;
  mention it in the log.
- **Wind noise**: GoPro mics roar in wind. Mark those segments `mute` and use music, or keep speech and subtitle it.
  Look for a "wind" flag: loud, flat audio with low speech score in the analysis.
- **Low light**: GoPro noise is heavy at night: `grade: "night"`, shorter shots, or skip.
- **High frame rates** (60/120/240): normal speed needs `fps` 30/60 in edit.json (render conforms); slow motion via
  `speed` 0.5 / 0.25.
- **TimeWarp / TimeLapse clips** are already sped up - use them as transitions; `speed` 1.
- **Camera clock wrong** (time zone / never set): `shot_at` order may be off; sort by content when the sheets disagree.
- **Duplicate takes**: keep the steadiest/brightest; note others as maybe.

## Telemetry (optional extras)
GoPro MP4s carry GPS, speed and accelerometer data (GPMF track). With a tool such as `telemetry-parser` (Python) or
`gopro-telemetry` (Node) you can extract GPS to draw a real route map or show speed on a bike/drive segment. Only add
this when it helps the story (hikes, drives, rides); confirm the tool installs on the user's machine first.

## Shooting tips to tell the user for next trips (put them in CHANNEL.md once)
- Say the useful facts on camera (price, platform, time, name of the place) - they become text and subtitles.
- Record 5-10 s of steady establishing shot at every new place (for location tags and transitions).
- Capture reactions (selfie mode) at the big moments; they make hooks and thumbnails.
- Use a wind muff / external mic for talking parts; turn horizon levelling on; 4K30 or 2.7K60 for most things,
  1080p120/240 only for slow motion.
