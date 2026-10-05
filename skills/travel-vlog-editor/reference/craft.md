# Craft: how to make a trip video people watch

## Pick the format first (it decides everything else)
| Format | Promise | Works when | Length |
|---|---|---|---|
| **Guide / how-to** ("Worcester to Logan airport by train") | saves the viewer time, money or stress | there is a route, a process, prices, mistakes to avoid | 8-14 min |
| **Experience vlog** ("Fall colours at Meadow Brook") | a feeling, a place seen through you | the place is visually strong and there are moments/reactions | 6-10 min |
| **Story** ("We almost missed our flight") | what happened next | there is a problem, stakes and an outcome | 5-12 min |
| **Review** (stay, food, park, ticket) | should I go / buy | the user has an opinion and specifics | 6-12 min |
Guides are searched for and keep earning views for years; scenic vlogs rely on recommendations. A trip can give
both: a guide as the main video and the most beautiful 30 s as a Short. Combine where natural: a guide told as a
small story ("I had 3 hours before my flight...") beats a dry list.

## Structure
**Hook (0-15 s)**: open on the strongest moment or the problem, then the promise in one line.
- Guide: "This is the cheapest way from Worcester to Logan airport - two tickets, one transfer, about 90 minutes.
  I'll show every step, and the one ticket mistake that costs you double."
- Vlog: 3-5 fast shots of the best views/reactions on the music's first phrase, then a title.
- Story: the tense moment first ("Gate closes in 20 minutes and we're still on the bus"), then rewind.
Never open with the channel intro, "hi guys welcome back", packing, or a long drive.
**Intro sting**: 2-4 s, after the hook. Not every video needs one; never over 5 s.
**Body**: chapters in the order of the journey. Each chapter = arrive (location tag) -> what happens -> what you learn
or feel -> a small payoff. Re-hook every ~60-90 s with a question or a tease ("the next part is where it went wrong").
**Ending**: payoff + recap (guide: route/cost/time card; vlog: best moment callback), one clear ask (subscribe /
watch next), then a 20 s end screen. No long goodbye.

## Pacing rules of thumb
- Average shot 2-5 s for b-roll; talking can run longer if the info is good. Cut dead air inside talking (jump cuts
  are fine on YouTube; cover big jumps with b-roll).
- Walking/riding with nothing new: speed up (2-6x), or cut to the arrival. Keep 1-2 s of real-time at the start and end.
- Scenic moments: let 1-3 of the best breathe (4-8 s) with music up and no text. That's the "wow" - don't bury it.
- Variety: alternate wide / medium / close, POV / selfie / static. Same angle twice in a row reads as a jump.
- Cut on motion (a turn, a step, a door) and on the beat for montages; hold still shots on the downbeat.
- Remove: repeated shots of the same thing, unusable footage, private/sensitive moments, people who didn't consent
  (blur or cut faces of strangers in close-ups when they're the subject), anything showing addresses/tickets/IDs.

## Transitions
Hard cuts for 90% of edits. `dissolve` for time passing or mood; `dip` (fade to black) between days or big chapters;
`slideleft`/`smoothleft` for a playful montage step; `flash` on a beat hit. Never a different fancy transition on
every cut.

## Speed ramps, slow motion, timelapse
- High-fps GoPro clips (60/120/240) at `speed` 0.5/0.25 for water, jumps, hair/flags in wind, food pours.
- Hyperlapse: walking clips at 4-8x with `stabilize` if they wobble; good transitions between places.
- Freeze-frame (`freeze_end`) + `counter` or `big` text for a price reveal or a funny face.

## Text and graphics (use the brand styles, keep it clean)
- `location` at each new place (first 1-3 s after arriving). `route` map for transit guides at each transfer.
- `step` badges for instructions; `tip` for money/time tips; `counter` for prices and durations.
- `caption` for English lines when the speech is Telugu (or vice versa), for the key sentences only -
  full subtitles go in the uploaded SRT, not burned in.
- `big` for the hook line or a chapter punchline, max once per few minutes.
- Text in English is easiest to keep consistent and searchable; Telugu text needs a Telugu-capable font and Pillow
  with raqm (check `PIL.features.check("raqm")`) or it renders broken.

## Audio (half of the experience)
- Speech first: mark talking segments `"audio": "voice"` so music ducks 8-12 dB under them. If wind ruins speech,
  use a cleaner take, subtitle it, or cut it.
- Natural sound is a tool: waves, crowd, train announcement, a laugh. Drop the music for 1-3 s on such a moment.
- Music arc: a hit on frame 1 (or the first cut), a lift into each reveal/chapter (start a new section on a `lift`
  from beats.py), a pause/drop right before the key moment, a rise into the ending. One track per mood section; change
  tracks at chapter boundaries with a dip or a hard cut on a beat - not a slow crossfade between two songs.
- Pick music by tempo/mood: guide = light, steady, ~95-115 bpm, no vocals under talking; scenic = wide, slower; montage
  = upbeat 115-130. Avoid tracks with vocals under speech.
- Check the review pack: quarter loudness should rise toward the end, not fall; no silent gaps unless intended.

## Colour
GoPro footage is usually fine with `natural`; Protune/Flat footage needs `flat`. Sunsets/autumn: `golden`.
Snow/water/city at noon: `cool` or `natural`. Night: `night` (denoise + lift). Keep one look per chapter; match
clips shot at the same place. Don't oversaturate skin.

## Hooking the click (title + thumbnail are planned before editing)
- Title: specific + benefit or curiosity, place name included: "Worcester to Logan Airport by Train: Every Step + Cost",
  "We Took the $2.40 Bus to Boston Airport (Worth It?)". 50-65 characters. No clickbait the video doesn't deliver.
- Thumbnail: one clear subject (face reacting / the place / the ticket), 3-4 words max, high contrast, readable at
  phone size; don't repeat the title words; brand colours for recognition.
- The hook must deliver the thumbnail's promise in the first 15 s.

## What this channel has learned so far (keep updated in brand/CHANNEL.md)
See `brand/CHANNEL.md`.
