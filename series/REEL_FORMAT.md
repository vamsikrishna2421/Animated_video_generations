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
| Length | 24–78 s | 78 s (v4 was 101 s) |

## Rules for new reels
1. At most one meme per 2 scenes, always paired with an educational visual and never replacing it.
2. Keep goofy full-screen "hype" scenes (e.g. the goosebumps/filmy slide) out.
3. Pacing: `tempo` 1.1, `gap` 0.05, scene `tail` 0.05, `maxgap` 0.2. Aim for 2.6–3.4 words/s in `voice_judge`.
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
