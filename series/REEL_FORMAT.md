# Reel format v5: analogy and concept side by side

Source: three outlier Indian AI-education reels (analysed with vidIQ, Sep 2026):
- databytes_by_shubham, LoRA (DcWDXYYJ6M0)
- bytesofjoy, vector embeddings (DbLtUJiou_i)
- shashwat___agarwal, "Let's check your AI knowledge" (DaP1UBlTXz6, 100x median)

## What those reels do
| Pattern | Seen as | Applied in v5 |
|---|---|---|
| Hook in second 1 | direct question, then proof on screen | "Breaking" ticker plus the wrong AI answer (Cat → "Dog" ✗) visible by frame 8 |
| Persistent header | topic pill plus a countdown timer | `topic` pill with the remaining time, top right |
| Visual change every 4–5 s | new diagram per idea | about 8 s scenes; chips and bars animate on cue inside each scene |
| Analogy plus technical view together | the metaphor block, then the math diagram | **split scene**: real-life still on top, the same idea "IN AI" below |
| Calm, clean look | black/navy background, line diagrams, no heavy SFX | classic lesson backdrop, Inter captions, lo-fi bed, no booms |
| Music | low lo-fi, 15–20 % | `music: "lofi"`, `musicVol: [0.10, 0.26]` |
| Ending | one-line recap, a tease of the next topic, an ego or score CTA | quiz, then recap with the next-episode tease |
| Length | 24–78 s | 70 s (v4 was 101 s) |

## Rules for new reels
1. At most one meme per 2 scenes, always paired with an educational visual and never replacing it.
2. Keep goofy full-screen "hype" scenes (e.g. the goosebumps/filmy slide) out.
3. Pacing (v7 and EP25 both felt too fast): `tempo` 1.0, `gap` 0.5 between sentences, `maxgap` 0.55 inside a take, scene `tail` 0.45. Aim for 2.2–2.6 words/s. Visuals stay fast; the voice breathes. Telugu voices are slower already, so use gap 0.35 for them.
4. Analogy stills: ElevenLabs `flux-2-pro`, 16:9, "cinematic film still, no logos, no text". The free plan allows 3 images a day.
5. Real movie clips can't be used: they are blocked from this environment and copyrighted.

## Split scene spec
```json
{"type": "split", "data": {
  "top": {"img": "reel/<id>/img/x.jpg", "tag": "POST-MATCH REVIEW", "icon": "ClipboardList",
          "chips": [{"t": "Batsman · 60%", "at": 2, "x": 230, "y": 330}], "stamp": {"t": "FAIR ✓", "at": 3, "c": "#34D399"},
          "ticker": "text", "pan": 30},
  "bottom": {"kind": "predict|layers|backflow|loss", "tag": "IN AI", "...": "kind-specific"},
  "bridge": "SAME IDEA IN AI"}}
```
Chip coordinates are in the 1000×560 top panel. `at` refers to the `[n]` cue markers in the lines.

## Voice and cast (feedback on v5)
- Never say or show "Maastaaru"; the teacher's on-screen label is "Teacher". The account handle @ai_maastaaru stays.
- The teacher (ElevenLabs Pooja) carries the lesson. Chintu gets at most one line per reel, and only as the setup question. No reaction or slang lines ("Ayyo", "Brooo", "stonks").
- `start` in a line trims unwanted opening words from an existing take (verify the cut with `asr_check.py`).

## Reference the user liked (YouTube Short a0m2_paWqn0, 75 s)
- One narrator, fast (160–170 wpm), analytical and slightly contrarian ("Here's what I think").
- No characters. Clean UI cards, progress bars and meters on a dot-grid canvas.
- Pinned top banner with the hook phrase for the whole video. Visual change every 1.5–3 s.
- Captions: white on a dark pill, active word in yellow. Subtle UI clicks and pops; low lo-fi music.
- Ends with three concrete uses, then "comment KEYWORD and I'll send the guide".
Applied in v7: teacher-only narration (plus one commentator cameo for the last ball), pinned `banner`, pill captions, tick on each chip reveal.

## Status
- v7 was approved and posted as upload 024 (`out/posted/024_ep23_backprop_cricket_blame_game.mp4`). Use it as the template for the next episodes, with the new pacing in rule 3.

## Two audio versions for every reel (from EP25)
- Every reel ships twice with identical visuals: English narration (`reels/<ep>v1.json`) and Telugu narration (`reels/<ep>te.json`).
- Everything on screen stays English in both: banner, cards, quiz, subtitles. Many viewers understand spoken Telugu but can't read it; everyone reads English.
- The Telugu spec copies the English scene `data`. Each line keeps the Telugu `text` (with `[n]` cue markers placed on the spoken Telugu words) and adds `show` with the English sentence, which becomes the subtitle. Cue timing follows the spoken words.
- Telugu narration: Tenglish (Telugu sentences, English tech words), ElevenLabs voice "Nitya A – Clear, Engaging Tutor" (`54PRhiFo9gt3cL6Jh53g`), eleven_v3, gap 0.35.
- Output: the English video goes to `out/<serial>_<id>_*.mp4` as before; the Telugu one goes to `out/telugu/<serial>_<id>_*_telugu.mp4`, listed as `video_telugu` in `out/upload_queue.json`.
