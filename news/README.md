# Daily AI news workflow

1. **Collect**: web research (last 24-48 h) + the owner's daily Muse agent digest, saved raw in `news/inbox/<date>_muse.md`.
2. **Verify**: a story goes in only if confirmed by 2+ reputable outlets or the company's own announcement. Leaks, single-source and LinkedIn/blog-only items are held until confirmed. Product claims are attributed ("Google says").
3. **Spec**: `news/<date>.json` (hook / stories / outro; `tts` for English, `tts_te` for Telugu; cards cue on a word index of `text`; optional `demo` panels). Sources go on screen and in `news/<date>_post.md` with the caption.
4. **Render**: `pipeline/render_news.sh news/<date>.json en` and `... te @ai_maastaaru_telugu` → `out/news/`, -14 LUFS. Keep each reel under 3:00.
5. **Spotlights**: standout low-cost / high-speed tools get their own ~1 min reel (`news/spot-<name>.json`).
