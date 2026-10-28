# Daily AI news workflow

1. **Collect**: web research (last 24-48 h) + the owner's daily Muse agent digest, saved raw in `news/inbox/<date>_muse.md`.
2. **Verify**: a story goes in only if confirmed by 2+ reputable outlets or the company's own announcement. Leaks, single-source and LinkedIn/blog-only items are held until confirmed. Product claims are attributed ("Google says").
3. **Spec**: `news/<date>.json` (hook / stories / outro; `tts` for English, `tts_te` for Telugu; cards cue on a word index of `text`; optional `demo` panels). Sources go on screen and in `news/<date>_post.md` with the caption.
4. **Look**: set `"look": "broadcast"` in the spec (numbered heading banners, on-air panel with lower third + scrolling ticker, news music bed). `"cards"` keeps the original stacked-card layout.
5. **Render**: `pipeline/render_news.sh news/<date>.json en` and `... te @ai_maastaaru_telugu` → `out/news/`, -14 LUFS. Keep each reel under 3:00.
6. **Spotlights**: standout low-cost / high-speed tools get their own ~1 min reel (`news/spot-<name>.json`).

# Weekly edition (AI WEEKLY)

Every Saturday at 05:59 IST (the Saturday slot of the daily new episode, `series/ROUTINE.md`), covering the 7 days
before the run: `news/week-<saturday>.json`, id `week-<date>`, edition `AI WEEKLY · NN`. AI WEEKLY 02 (Oct 24) also
covers Oct 11-17, which never went out (triage in `news/inbox/2026-10-14_triage.md`).
**From AI WEEKLY 03 (Oct 31), Bujji's length test:** Weekly 02 (2:43) held 7.6% of English viewers past 3 s and
averaged 2.2 s watched. The 9:16 Insta editions (EN and TE) are now one ~60 s cut with the week's top 3 stories (the hook
teases all three, the last one paid off with the `hush` card); the full 6-7 story roundup goes only into the 16:9
YouTube edition. The caption carries a comment prompt (a quiz on one story), as every other reel does.
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
7. **Lessons from AI WEEKLY 02** (Oct 24; two viewer rounds per language):
   - Length: about 300 English words for six stories plus hook and outro gives ~2:45; the Telugu voice runs longer
     (first pass 3:19), so write the Telugu shorter, not faster. Viewers swipe at stories that are not for them:
     keep a business-only story to one line and put a spoken tease ("Still coming: ...") before the dull middle.
   - The hook must not give away the last story's number; tease it ("one Indian IT giant does the opposite") and
     pay it off with a `hush` card (bed silent ~1 s, riser into it, loudest hit on the number) plus a baseline.
   - Spec keys: `lean: true` (dek fades, no lower third, bigger card text), `beatCuts: 15` (cuts on the bed's beat),
     story `pause` (gap before a `part: 2` card), `hush` on a big card, `tail` on the outro (the end card starts
     under the last line, so no 5 s of music after the last word).
   - Every number needs its owner and its baseline on screen ("13,000 since April", "as many as last year"); cut a
     stat that has neither (the Anthropic junior-hiring share had no years).
   - Telugu: cue cards on the first word of each Telugu clause (the verb comes last, so end-of-clause cues land
     late); keep the same number of sentences in `text` and `tts_te` so the English captions follow the Telugu voice
     sentence by sentence; spell letter names with long vowels ("ఏ ఐ", "జీ పీ టీ", "పీ హెచ్ పీ"), జెమిని not జెమినై;
     avoid "పిన్ ని" (heard as "pinni") and "లన్నీ డిలీట్" (heard as "nahin delete"); everyday words over TV-news ones.
   - English TTS: "chat G P T" (lower-case chat), "Character A.I. has filed", never end a sentence on "A.I." before
     the next one (the splitter keeps them together, so the pause and the full stop vanish). Check the review-pack
     transcript and re-voice misheard parts with `pipeline/tools/news_retake.py` (keeps the first take whose
     transcript has every required word).
