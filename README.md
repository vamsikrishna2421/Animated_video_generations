# Animated video generation (code-animated, not AI-video)

Promo videos built the way the "Claude Code + Remotion" crowd does it: the visuals are
**animated React components** rendered frame-by-frame to MP4, not a diffusion video model.
Voice is generated **locally with Kokoro** (82M-param TTS, ONNX, CPU), and music is
**synthesised procedurally** in Python, so there are no samples, API keys, or paid services.

Sample: `out/muse_tax_promo.mp4`, a 52 s 1080p promo for **Muse**, a personal tax assistant
that takes the user from collecting documents, to planning savings (old vs new regime,
deductions), to seeing the refund, to filing and e-verifying the ITR.

Sample 2: `out/muse_titles_15s.mp4`, a 15 s cinematic opening-title sequence in the style of
the "Opus made HBO documentary titles, even the soundtrack is code" post: black 2.39:1 frame,
film grain, document fragments flickering on each hit, a pre-impact silence, a braam impact, a
light-sweep title reveal, and a serif tagline. Score and trailer VO (Kokoro `bm_george`) are
fully generated. Build it with `./pipeline/build_titles.sh`, and edit the cues in
`script/titles.json`.

| Time | Picture | Sound |
|---|---|---|
| 0–2 s | Thread of gold light, grain | Sub drone fades in, reversed swell |
| 2–6.8 s | Fragments (FORM 16, 80C, HRA, 26AS…) flicker, figures cascade | A hit on every fragment, accelerating; VO: "Every document. Every deduction. Every rupee." |
| 6.8–8 s | Fragments collapse into an ember (Muse) | Riser, then 0.25 s of silence |
| 8 s | Flash; MUSE revealed by light sweep | Braam impact + sub drop |
| 9.6–15 s | Tagline, credits line, Muse opens its eyes, fade | Sparse reverb piano; VO: "Meet Muse. Your taxes... handled."; final hit |

## Pipeline

```
script/promo.json ──► pipeline/voice.py ──► voice_<scene>.wav + src/timeline.json
                                              │ (scene durations = speech length)
                     pipeline/music.py  ──► music.wav + sfx (sized to timeline)
                                              │
video/src (Remotion/React scenes) ──────────► npx remotion render ──► out/*.mp4
                                              (narration + ducked music + sfx muxed)
```

- **Timing comes from the voice.** Each scene lasts as long as its narration plus padding,
  so edits to the script re-time the whole video automatically.
- **Captions** are word-by-word karaoke, paced across each narration clip.
- **Music ducking:** the bed drops from `music.volume` to `music.duckedVolume` while Muse speaks.
- **Muse** (`video/src/components/MuseOrb.tsx`) is a glowing orb character that floats, blinks,
  and pulses while talking.

## Run

```bash
pip install -r requirements.txt
(cd video && npm ci)
./pipeline/build.sh                      # downloads Kokoro model on first run (~340 MB)
# optional: REMOTION_BROWSER=/path/to/chrome-headless-shell ./pipeline/build.sh
```

Live preview / tweak animations in the browser: `cd video && npx remotion studio`.

## Make a new video

1. Copy `script/promo.json`, then edit the scene `text` (spoken) and `caption` (on screen).
   Voices: `af_heart`, `af_bella`, `am_michael`, `bf_emma`, `bm_george`, ... (54 in total,
   several languages). A per-scene `"voice"` override is supported.
2. Add or modify scene components in `video/src/scenes/` and register them in `src/Promo.tsx`.
3. `./pipeline/build.sh path/to/script.json out/name.mp4`

## Layout

| Path | Purpose |
|---|---|
| `script/promo.json` | Narration, captions, voice, music settings |
| `pipeline/voice.py` | Kokoro TTS → per-scene WAV, loudness-normalised, and `timeline.json` |
| `pipeline/music.py` | Procedural pads/arp/bass/drums bed + pop and success SFX |
| `pipeline/build.sh` | End-to-end build (promo) |
| `script/titles.json`, `pipeline/titles_audio.py`, `pipeline/build_titles.sh` | Cinematic titles: cue sheet, synthesised score + VO, build |
| `video/src/titles/Titles.tsx` | Title-sequence composition (`MuseTitles`) |
| `video/` | Remotion project (1920×1080, 30 fps) |

Figures shown in the promo (tax, savings, refund) are illustrative.
