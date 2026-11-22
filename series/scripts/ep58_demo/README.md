# EP58 test: the ML engineer's task, on this machine (Nov 22, 2026)
Script: `pipeline/ep58/train_demo.py` (committed before it ran). Data: the UCI SMS Spam Collection (5,574 real SMS, 747
spam; UK messages, about 2012), split 80/20 (seed 58). A TF-IDF + logistic-regression filter (scikit-learn), 4 CPU cores.
Results: `train.json`.

| | result |
|---|---|
| training time | 1.86 s (4,459 messages) |
| right on the 1,115 it never saw | 1,100 (98.7%) |
| spam caught | 135 of 149 (14 missed) |
| genuine texts flagged as spam | 1 of 966 |

- **Our 6 Indian-style messages (written by us, no real numbers or links):**
  - Scams:
    - the lottery "Rs 25,00,000" text was caught (spam probability 0.97);
    - the KYC "account will be blocked" text was missed (0.25);
    - the parcel "pay Rs 25 to release" text was missed (0.25).
  - Genuine: the OTP, the electricity bill and the hostel text were all left alone.
  - It learned from old UK texts, so it misses the scams Indians get now. The fix is new data, which is the ML engineer's
    real work.
- **The other two jobs (Season 6's own tests):**
  - EP51 (prompt engineer: write and test the instructions): the shop bot with no system prompt was right 4 of 10; with
    rules and the price list, 9 of 10.
  - EP54 (AI engineer: connect the model to data and tools): with no tool it guessed order status, 6 of 10 wrong; with
    one tool, `get_order`, 10 of 10 right.
- **Facts:**
  - Naukri JobSpeak, September 2026 (Info Edge's report and Naukri's blog): fresher hiring +1% YoY, fresher AI/ML hiring
    +19%, all AI/ML roles +20%, IT/software services -4%.
  - LinkedIn Jobs on the Rise 2026, India (January 2026): Prompt Engineer #1, AI Engineer #2 (Business Standard,
    Careers360, The Hans India).
