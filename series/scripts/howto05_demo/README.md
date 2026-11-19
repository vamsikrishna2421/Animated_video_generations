# HOW TO 05 demo: we made a fake flood video, then ran the checks on it (Nov 19, 2026)
Script: `pipeline/howto05/fake_demo.py` (committed before it ran; the one change before the counted run, attention and
VAE slicing, came after the first start was killed for memory before any shot was made).

- **The fake (`make.json`, `fake_flood.mp4`, `shot1-3/`):** AnimateDiff-Lightning, 4 steps (ByteDance, CreativeML
  OpenRAIL-M), on the epiCRealism base (Stable Diffusion 1.5, CreativeML OpenRAIL-M). 3 shots x 16 frames, 432 x 768, 8
  frames a second = 6 s. CPU only (4 cores, bfloat16, no graphics card): 92 + 88 + 88 s = 268 s (4.5 minutes) of making,
  plus 10.5 s to load and a one-time 5 GB download. Every shot it made is kept; nothing re-rolled.
- **Check 1, pause (`sheet1-3.jpg`, HAND in the script):** sign text, 0 readable words in 48 of 48 frames (we asked
  for "AMEERPET"); frame 8 -> 9 of shot 3, one umbrella becomes two; walkers merge; a head rises with no body.
- **Check 2, label (`label.json`):** no C2PA Content Credentials, no IPTC "trainedAlgorithmicMedia" tag, no SynthID
  marker in the clip or a frame. YouTube labels a video as AI when the creator discloses it, when it carries C2PA
  data, when it was made with YouTube's own tools, or when YouTube's systems detect it (YouTube Help, "Disclosing use
  of altered or synthetic content", read Nov 19). Meta adds "AI info" when it detects industry-standard AI indicators
  or when people disclose it (Meta newsroom, labeling post, updates of July 1 and Sept 12, 2024). Ours carries no
  indicator, so only a platform's own detector could label it: a missing label proves nothing.
- **Check 3, ask:** PIB Fact Check, WhatsApp +91-8799711259 ("Any Suspicious News of information can be fact checked",
  factcheck.pib.gov.in, read Nov 19). Not run: we don't send our own fake to a fact-checker.
- **Not tested:** a real clip for comparison (Wikimedia Commons refused this machine's shared network with HTTP 429; no
  camera here), paid video models (cleaner fakes, fewer clues), AI-detector apps.
