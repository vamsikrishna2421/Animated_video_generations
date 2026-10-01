# AI Maastaaru brand kit (motion graphics + templates)

Everything lives in `video/src/brand/`, renders with `pipeline/render_brand.sh` into `out/brand/`
(loudness-normalised to -14 LUFS), and is code: change a prop, re-render, done.

## Identity

| | |
|---|---|
| Mark | Gradient squircle (blue `#3B6BFF` to violet `#8B5CF6`) with "Ai" drawn as strokes. The A's crossbar is an amber spark, the i's dot is an amber point, and a graduation cap sits on the A ("Maastaaru" = teacher). |
| Wordmark | "AI Maastaaru", Inter 800, "AI" in the brand gradient. |
| Taglines | EN: "AI, explained simply." / Telugu page: "AI, explained in Telugu." (visuals stay English). |
| Colours | night `#070A18`, paper `#F6F4EF`, blue `#3B6BFF`, violet `#8B5CF6`, cyan `#22D3EE`, amber `#FFB020` (highlight), rose `#F43F5E` (news / alerts). Tokens: `brand/tokens.ts`. |
| Type | Inter 800 (headlines), Anton (captions, big caps), Space Mono (labels, data), plus Archivo Black / Playfair Display / Bebas Neue for ransom stamps. All OFL. |
| Sonic logo | `brand_sting.wav`: whoosh, impact, two-note school bell "ding-DING" (rising fourth) when the cap lands, sparkle. Every video that ends with the sting ends with the same sound. |
| Music | `brand_bed_120.wav` (showreel beat map) and `brand_loop_120.wav` (8-bar loop). 120 BPM: 1 beat = 15 frames, 1 bar = 60 frames. |
| SFX | whoosh, swipe, pop, click, type0-5 (keys), enter, stamp, tick, chime, heart, riser, impact, bell (`video/public/brand/audio/`). |

## Reusable pieces (rendered files in `out/brand/`)

| File | Composition | Use |
|---|---|---|
| `sting_dark.mp4` / `sting_light.mp4` | `Brand-Sting(-Light)` | 3 s logo sting, 9:16 |
| `sting_te.mp4` | `Brand-Sting-Te` | Telugu-page tagline |
| `sting_yt.mp4` | `Brand-Sting-YT` | 16:9, after the YouTube cold open |
| `follow_outro.mp4` / `follow_outro_te.mp4` | `Brand-Follow(-Te)` | 4 s end card: profile card, cursor taps Follow, "Following ✓" burst, Like / Comment / Share / Save |
| `subscribe_yt.mp4` | `Brand-Subscribe` | 16:9 YouTube subscribe + bell |
| `captions_demo.mp4` | `Brand-Captions` | Karaoke captions on real narration |
| `brand_showreel.mp4` | `Brand-Showreel` | Every template once, cut on the beat |

Components for use inside any composition: `LogoMark`, `LogoSting`, `LogoBug` (corner watermark),
`FollowCard`, `EngageRow`, `Subscribe`, `Cursor`, `Karaoke`, `Wipe`, `Flash`, `Punch`, `Aurora`, `Grain`, `Meta`.

## Templates (scene-level, each fills the frame)

Grammar taken from high-engagement motion reels (pacing, type, transitions), never their content.

| Template | For | Key props |
|---|---|---|
| `SearchHook` | Hook in the first 2 s: a question typed into an AI search bar | `segs` (accent words), `label` |
| `PromptBox` | Showing the exact prompt a video was made from (glow input, send, "thinking") | `prompt`, `model` |
| `BigNumber` | One striking stat, counts up, source footnote | `value`, `suffix`, `label`, `note` |
| `Statement` | Big line-by-line claims, accent word with marker sweep | `lines` |
| `RansomStamp` | Meme-energy punchlines, cut-paper words stamped on the beat | `words`, `bg` |
| `LetterAssemble` | Title words flying together, one letter lands late (the gag) | `word`, `late`, `sub` |
| `DotMatrix` | LED-style episode numbers ("EP 01", "5.5") | `text`, `sub` |
| `StatRings` | Up to 3 percentages as gauges | `stats`, `example` / `source` |
| `RankBars` | Ranked lists, highlighted winner | `rows`, `highlight`, `example` / `source` |
| `NewsFlash` | Weekly AI-news format: AI NEWS pill, date, headline, source, live ticker | `headline`, `date`, `source` |
| `Karaoke` | Word-by-word captions, spoken word amber + pop | `words` from a reel timeline |

## Placement rules (retention)

- **Reels: hook first, logo last.** Never open a reel with the sting; the first 2 s must be the hook (`SearchHook`, `Statement`, `BigNumber`). Optional `LogoBug` from ~2 s. End with `follow_outro` (or the sting with a CTA pill).
- **YouTube long-form:** cold open (10-30 s hook) → `sting_yt` → content → `subscribe_yt` end card.
- **Something new every 2-4 s**, every cut on a beat, the music drop on the key visual.
- **Safe zone (9:16):** keep text inside x 60-900, y 220-1480. Instagram puts icons on the right and the caption over the bottom ~440 px.

## Production rules (adopted from the "harness, not prompt" pipeline)

1. Beat map first (120 BPM grid), then 4+ stills reviewed, then the full render, then a frame check, then audio.
2. Motion uses springs/expo-out (`pop`, `prog`), never linear slides.
3. SFX land on the action frame (type keys on each typed character, stamp on each stamp, click on the tap).
4. Data honesty: real numbers carry `source`; illustrative ones carry `example` (screen shows "EXAMPLE DATA").
5. Critique pass on every video: contact sheet + phone-size frames, score 1-10 on hook, readability at phone size, motion, variety, composition, data accuracy, sound sync; fix the 3 worst issues until all are 8+.
6. Every final render goes through `pipeline/loudnorm.py` (-14 LUFS, -1.5 dBTP).
