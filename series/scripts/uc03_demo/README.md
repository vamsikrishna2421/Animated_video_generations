# UC03 test: how AI meeting notes work (ears → who spoke → notes)

Made with `pipeline/uc03/notes_demo.py`, `notes_demo2.py` and `notes_demo3.py` (each committed before it ran), Nov 25. A made-up phone
call (every name, price and item made up by us): Ravi (the shop) orders 40 bags of rice from Suresh (a supplier) at
"fourteen fifty a bag" (₹1,450), sends "fourteen thousand" (₹14,000) as advance by Thursday; Suresh delivers Friday,
pays the ₹500 transport and sends the bill by Wednesday; Ravi keeps 3 empty sacks ready and pays the balance on delivery.
8 turns, two computer voices (Kokoro am_michael, am_onyx), one recording.

1. **Ears** (speech-to-text, faster-whisper small on our computer, 11 s for a 40 s call): every word right except the
   money: "fourteen fifty a bag" → **"$14 .50 a bag"**, "fourteen thousand" → **"$14 ,000"**.
   - The same call with "rupees" said after both amounts: "14 .50 rupees a bag" (still 100 times too small), "14,000 rupees".
   - The original call with a hint to speech-to-text ("A shop call in India. Prices are in Indian rupees: fourteen
     fifty means one thousand four hundred and fifty rupees."): "fourteen fifty a bag", "fourteen thousand", in words,
     no dollar sign.
2. **Who spoke**: the same transcript as one block (no names), or each turn labelled with its speaker (the true turns).
3. **Notes**: Qwen2.5-7B-Instruct (4-bit) on our computer, 10 fresh chats per setup, read by hand.

| | no names on the turns | names on the turns |
|---|---|---|
| price in the notes | **$14.50 a bag in 7/10**; the order **"$580"** (40 × $14.50) in 7/10 (first run) | $14.50 a bag in 5/10 (first run) |
| "Ravi keeps 3 empty sacks ready" (names-first format, `notes_demo2.py`) | **Suresh in 6/10**, Ravi 3/10, dropped 1 | **Ravi 10/10** |
| "Suresh pays the ₹500 transport" | Ravi 2/10, Suresh 2/10, dropped 6/10 | Suresh 2/10, added to Ravi's balance 2/10, dropped 6/10 |

Notes when the money is said differently (`notes_demo3.py`, no names, 10 fresh chats each, read by hand):

| the call | the ears wrote | the notes |
|---|---|---|
| "fourteen fifty **rupees** a bag" | "14 .50 rupees a bag" | **14.50 rupees a bag in 7/10, the order "580 rupees" in 5/10** |
| "fourteen fifty a bag" + the rupee hint to speech-to-text | "fourteen fifty a bag" (words) | 14.50 a bag in 8/10; ₹1,450 in 1/10 |
| "**one thousand four hundred and fifty rupees** a bag" (said in full) | "1,450 rupees a bag" | **₹1,450 in 7/10, wrong in 0/10** (3 give no price) |

Note on `notes2.json`: its automatic label marks the names-on-turns seeds 3 and 9 "wrong" for the sacks because they
also add "Suresh: take back the sacks" (which is right too); read by hand, all 10 give "keep 3 empty sacks ready" to Ravi.

What it shows: each step passes its mistakes on. The ears wrote an Indian price in dollars and most notes copied it,
then multiplied it ($580 for a ₹58,000 order). Without names on the turns, the notes guessed who would do what, and
got the sacks wrong 6 times in 10; with names, 10 in 10 right (names fix who, not money: the dollars stayed). Said in
full, the amount came through right in every note that gave it. Notes are a draft: check every number and every name.

Big apps (their own help pages, read Nov 25): Google Meet's "Take notes for me" is available in English, French,
German, Italian, Japanese, Korean, Portuguese and Spanish, one language per meeting, and "Sometimes, the meeting summary
can be incomplete, inaccurate, or not generated" (support.google.com/meet/answer/14754931). Zoom's meeting summary
lists Hindi and Telugu among its languages (support.zoom.com, "Supported languages for Zoom AI features", KB0078144).
We did not test either app.
