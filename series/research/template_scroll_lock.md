# Template idea: "scroll locked" product promo (reel Dd-DZ_HoPwu, 28 s, a motion-graphics creator's fictional phone ad)

Watched via download + frames + transcript. It is a phone filming an editor timeline playing the ad; the ad itself:

- 0-2 s: looks like a native sponsored post (product shot, like/comment/share rail, "Sponsored" caption). Voice: "Hey guys. Not so fast."
- 2-4 s: "Stay for 20 seconds." A lock pill with a countdown (0:20, "SCROLL LOCKED") appears top centre and ticks down for the whole ad.
- 4-20 s: dark, minimal, one accent colour (deep red). One idea per beat: neon line-draw of the product, single giant word ("LOOK."),
  lens zoom ("8x" + moon), particle drift with a half-typed line ("Everything wa..."), light sweep, red glow dot.
  Voice: 1-3 word lines ("Look." "Everything waits." "All day and all night.").
- 20-28 s: self-aware close: "Was it 20 seconds? Yes." "You thought this was your phone? You wish." "Fine. You can scroll now."
  Timer hits 0:00, lock opens. End card: logo, name, "Worth stopping for."

Why it works: the countdown turns watch time into a promise with a visible end (people finish what they can see the end of);
talking to the scroller ("not so fast", "you can scroll now") is pattern-interrupt plus payoff; every beat is one idea.

Ours (built): `lock: true` in an explainer spec shows the lock pill + countdown to the end card, unlocking on the follow card
(`ScrollLock` in video/src/news/NewsReel.tsx). Best for <= 30 s reels; for 90 s explainers a 1:30 countdown is a big ask.
Next: a 20-30 s "one idea per beat" short format (dark, single accent, kinetic single words, line-draw reveals), no brands.
