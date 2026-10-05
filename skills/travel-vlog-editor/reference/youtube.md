# YouTube upload notes

## Master file
- `render.py` master: H.264 High, yuv420p, CRF 17 (1080p) / 18 (4K), AAC 320 kb/s 48 kHz stereo, +faststart,
  -14 LUFS integrated, true peak <= -1 dBTP. YouTube re-encodes everything; a high-quality master is what matters.
- Upload 4K (`"canvas": [3840, 2160]`) when the footage is 4K: YouTube gives 4K uploads a better codec/bitrate, so
  even 1080p viewers see a cleaner picture. Use 1080p if the laptop is slow or the footage is 1080p/2.7K.
- Keep the frame rate of the footage (30 or 60). Don't upscale 1080p to 4K just for bitrate unless asked.

## In YouTube Studio
- **Title**: 50-65 characters, place name + benefit/curiosity (see craft.md).
- **Description**: first 2 lines are what people see - the promise. Then chapters, useful info (prices/timings "as of
  <month year>"), gear, music credits (required for Audio Library tracks that ask for attribution), links, 3-5 hashtags.
- **Chapters**: paste `chapters.txt` into the description. Rules: first timestamp 0:00, at least 3 chapters, each at
  least 10 s long. Chapter names = what's in it ("Buying the ticket", "South Station to Silver Line").
- **Subtitles**: upload `subtitles.srt` (spoken language) and the translated `subtitles.en.srt` under Subtitles. This
  helps search and non-native viewers; burned-in captions are only for key lines.
- **Thumbnail**: 1280x720 JPG, under 2 MB. Test it small (phone size) next to 2-3 competitor thumbnails.
- **End screen**: last 5-20 s (video must be 25 s+). Our outro card leaves two 16:9 slots on the right and a round
  subscribe area bottom-left. Add "Best for viewer" + one specific related video.
- **Cards**: link the related guide/vlog where you mention it.
- **Language**: set the video language (e.g. Telugu) and the title/description language; add an English title/
  description translation if the audience is mixed.
- **Music**: Audio Library tracks are safe; for anything else confirm the licence covers YouTube monetisation.
  After upload, check the Copyright tab in Studio before publishing.
- **Location** and **tags**: add the place; tags matter little, but add the place names and common misspellings.

## Shorts
- Vertical 9:16 (1080x1920), up to 3 minutes; 15-45 s works best for travel. Hook in the first second, captions big
  and inside the middle ~70% (UI covers the bottom and right edge), loop the ending back to the start if possible.
- One idea per Short: "the $2.40 airport bus", "the view at the top", "the mistake that cost us". Link the full video
  (related video field).
- Render with the same engine: `"canvas": [1080, 1920]` and `crop_x` per segment to follow the subject.

## After publishing (teach the skill)
Ask the user, after 48 h and 7 days, for: CTR, average view duration, the retention graph dips (timestamps), and top
traffic sources. Write the lessons into brand/CHANNEL.md (e.g. "viewers drop when we walk without talking > 10 s").
