# Creative 22 "The Meter Photo" · script v1, Nov 7 (the Nov 7 creative slot)

**Format: story mode** (Vamsi's taste note via Bujji, Nov 6: one character, one warm narration thread, deliberately
simple pictures, the lesson inside the story, a reveal at the end). One room (Kamala amma's wall with the meter, a small
table, a clock), the bill, the app on her phone, one hand-made meter close-up, one test card, one rule card. New in the
creative log: no narrator-led story so far.
**Point family (ROUTINE Run 2):** B, "AI can't do what it looks like it does" (Bujji's electricity-meter idea, Nov 6).
The previous creative (21) was C (gatekeeper), the previous episode EP47 D: no repeat in a row.
**Cast:** Kamala amma (68, a retired maths teacher, lives alone), the storyteller (no on-screen name). Made up.
Telugu: storyteller = Prakash, Kamala = Lalitha. English: storyteller = an American reference voice (Kokoro af_bella)
through Fish; Kamala = an Indian-English reference (Parler) through Fish.
**AI idea:** an app that reads numbers from a photo can misread a meter: on a seven-segment display a 6 is an 8 with one
line missing. Our small AI read printed digits perfectly and meter digits not once. Before you pay a bill an app read
for you, match the reading to your meter, digit by digit.
**The reach stack:** stake: her money (₹960 → ₹1,60,936, a made-up rate of ₹8 a unit); frame 1: "HER USUAL BILL ₹960" /
"THIS MONTH ₹1,60,936" over the bill and her shocked face; injustice: the app's misread, not her use. Telugu line 1
starts on the numbers.
**Ending built to be forwarded (Skit 16/17 lesson):** the teacher corrects the bill in red pen, "Wrong answer. See me."

## Our demo (pipeline/creative22/meter_demo.py, series/scripts/creative22_demo/)
Committed before it ran (70c72c4); the printed follow-up added after the first 8 answers, committed before it ran
(76b34f9). We drew 24 meter photos ourselves (so every true reading is known): 12 clean, 12 phone-like (a slight tilt,
blur, a glare patch). A small free AI that reads photos (Qwen2.5-VL-3B, llama.cpp's own GGUF), offline, temperature 0,
"Read the kWh reading on this electricity meter's display. Answer with only the digits."

| photos | read right | e.g. |
|---|---|---|
| 12 clean meter photos | **0 of 12** | 66114 → "86111", 61373 → "81371", 45358 → "16388" |
| 12 phone-like meter photos | **0 of 12** (3 off by one digit: 33994 → 13994; 5 empty answers) | |
| the same 12 readings, printed plainly | **12 of 12** | |

## Facts and sources
- Indian power distribution companies let customers submit a self-reading with a meter photo through their apps
  (consumer guides); vendors sell AI/OCR meter-photo reading to them (e.g. Bharat Smart Services' own site: "AI-powered
  OCR meter reading"; its accuracy claims are its own). The reel doesn't name a company or say her company uses AI.
- The bill, the rate (₹8 a unit) and Kamala amma are made up; the misread "86111" is a real answer from our test.

## Hook options
1. **(v1)** Frame 1: two blocks "HER USUAL BILL ₹960" (green) / "THIS MONTH ₹1,60,936" (red), the bill in her hand,
   her glasses down her nose; "Kamala amma's power bill is usually nine hundred and sixty rupees. This month: one lakh,
   sixty thousand."
2. Her meter "66114" next to the app's "READ ✓ 86111" (the mechanism first: weaker stake).
3. The red pen and "See me." on the bill (spends the reveal).

## Script (English, v1) · ~50 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | storyteller | Kamala amma's power bill is usually nine hundred and sixty rupees. [1] This month: one lakh, sixty thousand. | frame 1 as hook 1 |
| 2 | kamala | One lakh? [1] For one fan and one fridge? | the bill: units 20,117 |
| 3 | storyteller | Every month, she photographs her meter, [1] and an app reads it for her. | the phone framing the meter |
| 4 | storyteller | This time, the app read: [1] eight, six, one, one, one. | READ ✓ 86111 |
| 5 | storyteller | Her meter said [1] six, six, one, one, four. | her meter 66114, the 1st and 5th digits circled; the app's 86111 |
| 6 | storyteller | On a meter, a six is an eight [1] with one line missing. | a 6 and an 8; the missing line lights up |
| 7 | storyteller | We gave a small free AI that reads photos twenty-four meter photos. [1] It read zero right. | OUR TEST: 24 meter photos · 0 / 24 |
| 8 | storyteller | The same numbers, printed plainly? [1] Twelve out of twelve. | 12 / 12 · it reads print; meter digits fool it |
| 9 | kamala | Thirty-five years, [1] I corrected answer sheets. | |
| 10 | storyteller | So she did what she always did. [1] She took out her red pen. | the red pen: 86111 struck, 66114, 120 units |
| 11 | storyteller | Before you pay a bill an app read for you, [1] match the reading to your meter, [2] digit by digit. | the rule card |
| 12 | kamala | Wrong answer. [1] See me. | "See me." in red → frame 1 (loops) |

## Script (Telugu, v1; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | storyteller | ఎప్పుడూ తొమ్మిది వందల అరవై రూపాయలు. [1] ఈ నెల, లక్షా అరవై వేలు! కమలమ్మ కరెంట్ బిల్లు. |
| 2 | kamala | లక్ష రూపాయలా? [1] ఒక ఫ్యాన్, ఒక ఫ్రిజ్ కి? |
| 3 | storyteller | ప్రతి నెలా ఆమె మీటర్ ఫోటో తీస్తుంది, [1] ఒక యాప్ దాన్ని చదువుతుంది. |
| 4 | storyteller | ఈసారి యాప్ చదివింది: [1] ఎనిమిది, ఆరు, ఒకటి, ఒకటి, ఒకటి. |
| 5 | storyteller | మీటర్ లో ఉన్నది: [1] ఆరు, ఆరు, ఒకటి, ఒకటి, నాలుగు. |
| 6 | storyteller | మీటర్ మీద, ఆరు అంటే, [1] ఒక గీత తక్కువ ఎనిమిది. |
| 7 | storyteller | ఫోటోలు చదివే ఒక చిన్న ఫ్రీ ఏ ఐ కి, ఇరవై నాలుగు మీటర్ ఫోటోలు ఇచ్చాం. [1] ఒక్కటి కూడా సరిగ్గా చదవలేదు. |
| 8 | storyteller | అవే నంబర్లు, మామూలుగా ప్రింట్ చేస్తే? [1] పన్నెండుకి పన్నెండు. |
| 9 | kamala | ముప్పై ఐదేళ్ళు, [1] పేపర్లు దిద్దాను. |
| 10 | storyteller | అందుకే, ఎప్పుడూ చేసేదే చేసింది. [1] ఎర్ర పెన్ను తీసింది. |
| 11 | storyteller | యాప్ చదివిన బిల్లు కట్టే ముందు, [1] బిల్లులో రీడింగ్, మీటర్ రీడింగ్, [2] ఒక్కో అంకె సరిపోల్చండి. |
| 12 | kamala | తప్పు. [1] నన్ను వచ్చి కలువు. |

## Caption ask (a try-it ask: a test the viewer can run tonight)
Go to your meter tonight. Does the reading on your last bill match it? Comment MATCH or NO MATCH.
