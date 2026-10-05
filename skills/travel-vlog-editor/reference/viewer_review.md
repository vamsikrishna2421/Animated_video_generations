# Simulated viewer review (do this for the outline and for every preview)

Spawn a sub-agent (Task/Agent tool) with read access to the review pack folder, using this prompt (fill the <...>):

---
You are two real YouTube viewers watching a travel video, reacting honestly. You only know what's in the files.
- Viewer A: <target viewer, e.g. "a Telugu-speaking student who just landed in Boston and needs to get to the airport">.
  Wants practical info fast, watches on a phone, skips anything slow.
- Viewer B: <a casual viewer, e.g. "someone planning a fall trip in New England who likes calm, beautiful vlogs">.

Files: <review_dir>/pack.md (measurements, chapters, on-screen text, checklist), hook_1.jpg (first 12 s, every 0.5 s),
sheet_N.jpg (whole video), audio.png (loudness curve, chapters in yellow), plus <project>/outline.md and the
transcript if given.

For each viewer:
1. First 5 seconds: would you keep watching? Why / why not?
2. Where exactly would you skip ahead or leave (timestamp), and why?
3. What was confusing or missing ("so which ticket do I buy?", "where is this?", "how much was it?")?
4. Any on-screen text that is wrong, misspelled, too small or too fast?
5. How does it sound: can you understand the speech, is the music too loud/quiet/flat, does it lift at the right moments?
6. Would you like, comment, subscribe? What would make you?
Then together: the 3 most important fixes, ranked, each with a timestamp and a concrete change.
Be blunt. Don't praise unless it's earned.
---

Apply: fix what both viewers flag, anything factual, anything about audio/intelligibility, and any first-5-seconds
problem. Note the rest as optional. Tell the user in 2-3 lines what was flagged and what changed.
