# Creative 36 test: "AI enhance" on a blurry number plate (Nov 21, 2026)
Script: `pipeline/creative36/enhance_demo.py` (committed before it ran; v2 after v1 clipped the plate text and was stopped
after 2 images). 10 made-up plates in the Telangana format (made-up numbers), drawn sharp (the truth), shrunk to a CCTV-sized
blur at two levels, then enlarged by the Stable Diffusion x4 upscaler (a generative "AI enhance" model, run on our
computer; prompt "a sharp clear photo of a white Indian car number plate with black letters", 20 steps), 3 seeds each.
Every output was read by hand from `sheet_far.jpg` and `sheet_near.jpg` (HAND in the script). Images: `out/local/creative36_demo/` (not committed).

| level | what we gave it | sharp-looking plates | 4-digit number right |
|---|---|---|---|
| far (36x9 px) | a blur you can only half read | 20 of 30 (seed 2: streaks all 10 times) | 1 of 20 sharp ones |
| near (52x13 px) | readable by eye | most | whole plate right 21 of 30; 9 of 30 had a character changed (9233 -> 9Z33, 5822 -> 5S22, 9149 -> 9140) |

- **Same blur, three tries (plate 0, real "TS 06 BA 5660"):** "...9010", streaks, "...9000".
- "TS" came back as "TB" or "1B" in most far outputs: the model draws plate-like letters, it doesn't read them.
- Limits: one open model on our computer; phone and photo-app "enhance" tools were not tested. The point is how
  generative upscalers work (they add detail that wasn't captured), which a court also found (below).
- **Fact:** in 2024 King County (Washington) Superior Court Judge Leroy McCullough barred AI-enhanced video (Topaz) from a
  murder trial; a forensic video analyst said the enhanced video contained visual data that wasn't in the original
  (NBC News, Bloomberg Law, Gizmodo).
