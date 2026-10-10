# Daily AI news workflow

1. **Collect**: web research (last 24-48 h) + the owner's daily Muse agent digest, saved raw in `news/inbox/<date>_muse.md`.
2. **Verify**: a story goes in only if confirmed by 2+ reputable outlets or the company's own announcement. Leaks, single-source and LinkedIn/blog-only items are held until confirmed. Product claims are attributed ("Google says").
3. **Spec**: `news/<date>.json` (hook / stories / outro; `tts` for English, `tts_te` for Telugu; cards cue on a word index of `text`; optional `demo` panels). Sources go on screen and in `news/<date>_post.md` with the caption.
4. **Look**: set `"look": "broadcast"` in the spec (numbered heading banners, on-air panel with lower third + scrolling ticker, news music bed). `"cards"` keeps the original stacked-card layout.
5. **Render**: `pipeline/render_news.sh news/<date>.json en` and `... te @ai_maastaaru_telugu` → `out/news/`, -14 LUFS. Keep each reel under 3:00.
6. **Spotlights**: standout low-cost / high-speed tools get their own ~1 min reel (`news/spot-<name>.json`).

# Weekly edition (AI WEEKLY)

Every Saturday, covering Sunday-Saturday: `news/week-<saturday>.json`, id `week-<date>`, edition `AI WEEKLY · NN`.
1. **Collect**: the owner's daily digests (`news/inbox/<date>_muse.md`) plus a sweep of the week (Reuters, TechCrunch,
   The Verge, Bloomberg, Axios; Indian outlets for India stories).
2. **Verify** as above. Drop repeats of earlier editions unless something new happened this week; check the date of
   every lead (digests often resurface old stories). Single-source items are held.
3. **Pick 6-7 stories** a student or working person in India would care about; the hook teases three, including the
   last story, so viewers stay to the end. One "what it means for you" line per story. Business-only items go to the
   caption as quick hits.
4. **Spec extras**: `dek` (short line under the headline), `chapter` + `points` (YouTube key points),
   `cards[].drop` (music ducks before the number and an impact lands on it), hook `hits` (impact on a word),
   `musicBase` / `musicBaseYT` (bed level; aim for music 8-12 dB under the voice), `labs` (YouTube cold open).
5. **Render** the four formats: `pipeline/render_news.sh news/week-<date>.json en`, `... te @ai_maastaaru_telugu`,
   then `COMP=NewsYT SKIP_BUILD=1 pipeline/render_news.sh news/week-<date>.json en` (and `te`) for the 16:9
   YouTube editions (`out/news/<id>-<lang>-yt.mp4`). Review packs and viewer review as for every reel.
6. **Post file**: `news/week-<date>_post.md` with the triage of the digests, sources, captions (EN/TE) and the
   YouTube text with chapters.
