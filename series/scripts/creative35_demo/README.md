# Creative 35 test: an AI's Telugu for a health policy (Nov 20, 2026)
Script: `pipeline/creative35/translate_demo.py` (committed before it ran). A 10-line health-insurance summary we wrote (no
real insurer or policy), Qwen2.5-7B-Instruct 4-bit (llama.cpp) on our computer, 5 fresh chats per ask, temperature 0.7.
Read by hand (HAND in the script); every reply is in `translate.json`.

| line (English) | usual ask: "Translate this into Telugu for my mother" | + "Keep every number, and every 'not', 'only' and 'unless', exactly" |
|---|---|---|
| 5. Claims must be filed within **30 days** of discharge. | right 1 of 5 (also "30 weeks", "30 numbers", no unit) | right 4 of 5 (once "30 months") |
| 4. Cataract surgery is covered only after **2 years**. | right 1 of 5 (also "2 weeks", "2nd stage") | right 2 of 5 (also "2 weeks", "2nd year") |
| 6. Maternity expenses are **not covered**. | kept 0 of 5 ("will be settled", "tax expenses can be claimed", garbled) | kept 0 of 5 (garbled, once "covered") |

- The digits almost always survived (an automatic check passes them); the units and the "not"s did not.
- Most of the Telugu is not readable sentences. One reply invented "10 billion rupees", another switched to Chinese
  for a sentence.
- This is a small free model on our computer. ChatGPT, Gemini and Google Translate were not tested; they handle Telugu
  much better, and the reel says so.
- **The fix:** ask the insurer. IRDAI's Master Circular on Protection of Policyholders' Interests (Sep 5, 2024) requires
  the Customer Information Sheet and the proposal form in regional languages on request (Business Standard, Sep 6,
  2024; TeamLease RegTech; Angel One).
