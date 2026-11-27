# Creative 42 test: "I missed July. Can I still file my income tax return, and by when?"

Made with `pipeline/creative42/itr_demo.py` (committed before it ran), Nov 27, 2026. Qwen2.5-7B-Instruct (4-bit) on our
computer, no web search, 10 fresh chats per ask (seeds 1-10, temperature 0.7); every reply read by hand
(`itr.json`; the readings are in the script's HAND).

| ask | right last date (31 Dec 2026) and fee | what it said instead |
|---|---|---|
| "What is the last date to file a belated income tax return in India this year?" | **0/10** | 10/10 answered for FY 2022-23; 31 Aug 4, 30 Jun 2, 31 Mar, 30 Oct, 30 Sep, "check" 1 each |
| "I missed the July deadline ... Can I still file it now? By when?" | **0/10** | **"no fixed deadline" 2/10**; 30 Sep, 15 Nov, 31 Oct, "~6 months grace"; old years' 31 July |
| "Today is 27 November 2026." + the same | **0/10** | end of September 2, 31 Mar 2027, 31 Oct, no last date 5; one said 31 Dec as a "no late fee" date with six more months after it (wrong) |
| **all 30** | **0/30** | an invented percentage fee in 9/30 ("0.5% of the tax a day, up to 25%") |

The true answer (the Income Tax Department's own pages, read Nov 27, 2026, via a research pass; AY 2026-27 returns fall
under the Income-tax Act, 1961):
- The usual due date was **31 July 2026** (31 Aug 2026 for non-audit business income); not extended.
- A **belated return** can be filed **until 31 December 2026** (or before the assessment is completed). The late fee
  (section 234F): **₹5,000, or ₹1,000 if total income is up to ₹5 lakh**. (incometax.gov.in, e-filing help "Income Tax
  Returns" FAQ, Q7: "may be furnished on or before 31st December 2026"; the fee "₹1,000 where the total income does not
  exceed ₹5,00,000, and ₹5,000 in all other cases".)
- After that, an **updated return (ITR-U)** is allowed, with 25-70% extra tax, but it "cannot result in ... increase in
  refund" (same FAQ, Q13). So a refund missed by 31 December needs a condonation request under section 119(2)(b), which
  can be refused.
- Revised returns for AY 2026-27 now run to 31 March 2027 (Finance Act 2026), with a fee after 31 Dec: not in the reel.

Limits: one small model with no web search; ChatGPT, Gemini and other apps with web search were not tested and may
answer right. Kiran and his ₹18,400 refund are made up by us; the test and the rules are real.
