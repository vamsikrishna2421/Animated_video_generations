# Creative 32 "₹36,000, Said the AI. ₹44,000, Said Clause 11." · Nov 17 creative slot · script v1

## Format and rotation
- Format: **a nature-documentary parody** (last used by Creative 13, Oct 29; not in the last 7 days). A hushed narrator,
  a REC viewfinder, a lower third ("WILD HYDERABAD"), leaves in the corners. Not a dialogue skit (Creative 31 was a POV;
  the tenant has three short lines, the narrator carries it).
- Cast (new): Anusha, 26, a tenant in Hyderabad packing for a job in Pune; the narrator (unseen). No owner on screen.
- Point family: new, **O. "Ask for every rupee: an AI's answer can drop the small print"**. The last post was EP55 (N).
- Topic: moving out early from an 11-month rental agreement (Creative 19, Nov 4, had a tenant and a landlord asking an
  AI about a deposit; 13 days ago, a different point (family A); new cast).

## Hook options (kept: A)
- **A (kept):** Anusha among moving boxes, phone in hand; two blocks: "THE AI: MOVING OUT COSTS ₹36,000" (red) vs
  "HER AGREEMENT: ₹44,000" (amber); narrator: "The AI told her moving out would cost thirty-six thousand. Her agreement
  says forty-four." Same item, two numbers, a person paying the gap, the AI as the culprit, sound off readable.
- B: the deposit slip "₹54,000 paid · ₹10,000 back" with "she expected ₹18,000": a stronger injustice, but the AI never
  said "₹18,000" (she worked it out), so the AI isn't the culprit in frame 1.
- C: "Something lurks in clause eleven" in the long grass: funny, but no numbers in frame 1 (fails the reach stack).

## Our test (pipeline/creative32/summary_demo.py, committed before it ran; rescore.py fixes one auto check)
A rental agreement we made up (14 clauses; clause 9: one month's notice; clause 10: a 6-month lock-in, two months'
rent, Rs 36,000; clause 11: Rs 8,000 repainting from the deposit). Qwen2.5-7B-Instruct (4-bit) on llama.cpp on our
computer, temperature 0.7, 10 runs per ask, every reply read by hand:
| ask | the lock-in (Rs 36,000) | the Rs 8,000 painting |
|---|---|---|
| "Summarise this rental agreement for me in 5 short points." | 10 of 10 | 0 of 10 |
| "I may have to move out after 4 months for a job transfer. What will it cost me?" | 10 of 10 said Rs 36,000 | 0 of 10 (none said Rs 44,000) |
| "List every amount of money I may have to pay or lose, and every condition on leaving early. Give the clause number for each." | 10 of 10 | 10 of 10 |
The real cost of leaving at month 4: Rs 36,000 + Rs 8,000 = Rs 44,000 from the Rs 54,000 deposit: Rs 10,000 back, not
Rs 18,000. (The notice month's rent is rent she pays anyway.)

## Facts
- Ours only: the test above, on one small free model. We do not claim big apps make this exact mistake.
- For the caption (verified, several outlets): in January 2025 Apple paused its AI notification summaries for news apps
  after the BBC complained of false summaries (BBC; Business Insider; NBC; AV Club; Silicon Republic).
- Lock-in clauses in Indian 11-month agreements are common (housing.com; NoBroker); our agreement is made up, and the
  reel gives no legal advice.

## Script v1 (EN | TE)
| # | who | English | Telugu |
|---|---|---|---|
| 1 | narrator | The AI told her moving out would cost thirty-six thousand. Her agreement says forty-four. | చాట్‌బాట్ చెప్పింది: ఇల్లు ఖాళీ చేస్తే ముప్పై ఆరు వేలు. అగ్రిమెంట్ లో మాత్రం: నలభై నాలుగు వేలు. |
| 2 | narrator | Here, among the cardboard, the young tenant prepares to migrate. A job in Pune. Four months into an eleven-month agreement. | ఇక్కడ, అట్టపెట్టెల మధ్య, మన టెనెంట్ వలసకి సిద్ధమవుతోంది. పూణే లో కొత్త ఉద్యోగం; పదకొండు నెలల అగ్రిమెంట్ లో, నాలుగు నెలలే అయ్యాయి. |
| 3 | anusha | I may have to move out after four months. What will it cost me? | నాలుగు నెలలకే ఖాళీ చేయాల్సి రావచ్చు. నాకు ఎంత ఖర్చవుతుంది? |
| 4 | narrator | The AI has all fourteen clauses. Thirty-six thousand, it says. The lock-in penalty. | చాట్‌బాట్ దగ్గర, పద్నాలుగు క్లాజులూ ఉన్నాయి. ముప్పై ఆరు వేలు, అంటోంది. లాక్ ఇన్ పెనాల్టీ. |
| 5 | anusha | Fifty-four thousand deposit, minus thirty-six. Eighteen thousand back. Fine! | యాభై నాలుగు వేల డిపాజిట్, ముప్పై ఆరు పోతే, పద్దెనిమిది వేలు వెనక్కి. పర్లేదు! |
| 6 | narrator | But deep in clause eleven, something waits. | కానీ క్లాజ్ పదకొండు లోతుల్లో, ఒకటి దాక్కుని ఉంది. |
| 7 | anusha | Eight thousand for painting?! So ten thousand back, not eighteen?! | పెయింటింగ్ కి ఎనిమిది వేలా?! అంటే వచ్చేది పది వేలే, పద్దెనిమిది కాదా?! |
| 8 | narrator | We asked a small free AI on our computer the same question, ten times. Thirty-six thousand: ten times. | The painting: not once. | మా కంప్యూటర్ లో ఒక చిన్న ఫ్రీ చాట్‌బాట్ ని, ఇదే ప్రశ్న పదిసార్లు అడిగాం. ముప్పై ఆరు వేలు: పదిసార్లూ. | పెయింటింగ్: ఒక్కసారి కూడా లేదు. |
| 9 | narrator | So ask it this: list every amount I may pay or lose, with the clause number. Ten out of ten found the painting. | Then open those clauses, and add them up yourself. | అందుకే ఇలా అడగండి: నేను కట్టాల్సిన, కోల్పోయే ప్రతి రూపాయి, క్లాజ్ నంబర్ తో చెప్పు. పదికి పది, పెయింటింగ్ చూపించింది. | ఆ క్లాజులు మీరే చదివి, లెక్క వేసుకోండి. |
| 10 | narrator | Meanwhile, in the next flat, another tenant asks the AI what moving out will cost... | ఇంతలో, పక్క ఫ్లాట్ లో, ఇంకో టెనెంట్ చాట్‌బాట్ ని అడుగుతోంది, ఖాళీ చేస్తే ఎంత అవుతుందని... |

## On screen (English in both versions)
1. Frame 1: Anusha among taped boxes ("KITCHEN", "BOOKS"), phone up; two blocks "THE AI: MOVING OUT COSTS ₹36,000" vs
   "HER AGREEMENT: ₹44,000"; the viewfinder (REC, timecode); a chip "a made-up agreement · a small free AI · our test".
2. The lower third "WILD HYDERABAD · the tenant, preparing to migrate"; a map card Hyderabad -> Pune; "MONTH 4 of 11".
3. The phone: her question (our test's words).
4. The AI's real reply, "you will have to pay Rs 36,000" lit; the agreement's 14 clauses fanned behind the phone.
5. Her sum on a sticky note: 54,000 − 36,000 = 18,000 ✓.
6. The agreement page in long grass; the grass parts on clause 11: "Rs 8,000 towards repainting shall be deducted from
   the security deposit".
7. The sum redone: 54,000 − 36,000 − 8,000 = ₹10,000; 18,000 struck out.
8. Test card: 10 tiles "₹36,000" ✓, 10 tiles "₹8,000 painting" ✗ (0/10).
9. The better question typed; "10/10 found the painting"; the reply's line "(Clause 11)"; "open those clauses · add them
   up yourself".
10. The next flat's door, another tenant's phone: the same question; cut to frame 1.

## Caption ask (a try-it with a posted answer)
"Try it on your own rent agreement (black out names, address and ID numbers first): ask any AI 'List every amount I
may pay or lose, with the clause number.' Post one amount it found that you didn't know about."
