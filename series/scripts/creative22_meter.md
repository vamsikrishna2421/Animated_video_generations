# Creative 22 "The Meter Photo" · script v2, Nov 7 (the Nov 7 creative slot)

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

## Script review (human-viewer, v1) and what changed
Both stop on frame 1 (hook 8 and 7: "lakh-rupee bill stories are always on Telugu news"; Sandeep would forward it to the
family group). Both: the rule and the ask didn't work in real life (the meter is always ahead of the last bill, so
"MATCH" can't happen; the moment to check is when the app shows its reading); the rule card cut in before the punchline
(move it before her story ends: 8 → rule → 9 → 10 → 12); be honest on screen: we drew the meters, a small free AI, and
0 of 24 vs 12 of 12 looked like a mismatch (12 readings × 2 styles); say the story is made up. Sandeep: ten digits by
ear lost him (say them once, let the screen do it); line 7 didn't parse ("reads photos twenty-four meter photos").
Priya: why did 4 become 1? (we circled two digits but explained one); the 0 on clean photos makes her doubt the test
(our drawing was checked by eye: every digit reads). Telugu: "ఆమె" bookish, "ఉన్నది" → "ఉంది", "ఒక గీత తక్కువ ఎనిమిది"
clunky, "యాప్ చదివిన బిల్లు" reads as the app read the bill, "సరిపోల్చండి" textbook, "తప్పు." alone curt. Changed (v2): the
digits said once ("the app read her six as an eight"), "Two digits wrong: twenty thousand extra units" with "1st digit:
6 → 8 (+20,000) · 5th: 4 → 1" on screen; line 7 "We tried a small free AI on twenty-four meter photos we drew. It got
zero right."; "The same twelve numbers, printed plainly? Twelve out of twelve."; the test card "24 METER PHOTOS WE DREW ·
12 readings × 2 styles"; the rule at the app moment, said right after the test: "So when the app shows a reading, check
it against your meter, digit by digit, before you tap OK." (card: "Already billed? complain with a dated meter photo"),
then her story ends unbroken; a tag "a made-up story · "86111" is a real answer from our test"; Telugu "కమలమ్మ", "ఎనిమిదిలో
ఒక గీత తీసేస్తే, అదే ఆరు", "అందుకే యాప్ రీడింగ్ చూపించగానే, ఓకే నొక్కే ముందు, మీటర్ తో ఒక్కో అంకె చెక్ చేయండి", "తప్పు జవాబు";
the caption ask "PHOTO or PERSON" (who reads your meter).

## Script (English, v2) · ~55 s
| # | Who | Line |
|---|---|---|
| 1 | storyteller | Kamala amma's power bill is usually nine hundred and sixty rupees. [1] This month: one lakh, sixty thousand. |
| 2 | kamala | One lakh? [1] For one fan and one fridge? |
| 3 | storyteller | Every month, she photographs her meter, [1] and an app reads it for her. |
| 4 | storyteller | This time, the app read her six [1] as an eight. |
| 5 | storyteller | Two digits wrong: [1] twenty thousand extra units. |
| 6 | storyteller | On a meter, a six is an eight [1] with one line missing. |
| 7 | storyteller | We tried a small free AI on twenty-four meter photos we drew. [1] It got zero right. |
| 8 | storyteller | The same twelve numbers, printed plainly? [1] Twelve out of twelve. |
| 9 | storyteller | So when the app shows a reading, [1] check it against your meter, [2] digit by digit, before you tap OK. |
| 10 | kamala | Thirty-five years, [1] I corrected answer sheets. |
| 11 | storyteller | So she did what she always did. [1] She took out her red pen. |
| 12 | kamala | Wrong answer. [1] See me. |

## Script (Telugu, v2; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | storyteller | ఎప్పుడూ తొమ్మిది వందల అరవై రూపాయలు. [1] ఈ నెల, లక్షా అరవై వేలు! కమలమ్మ కరెంట్ బిల్లు. |
| 2 | kamala | లక్ష రూపాయలా? [1] ఒక ఫ్యాన్, ఒక ఫ్రిజ్ కి? |
| 3 | storyteller | ప్రతి నెలా కమలమ్మ మీటర్ ఫోటో తీస్తుంది, [1] ఒక యాప్ దాన్ని చదువుతుంది. |
| 4 | storyteller | ఈసారి యాప్, ఆరుని [1] ఎనిమిదిగా చదివింది. |
| 5 | storyteller | రెండు అంకెలు తప్పు: [1] ఇరవై వేల యూనిట్లు ఎక్స్ ట్రా. |
| 6 | storyteller | ఎనిమిదిలో ఒక గీత తీసేస్తే, [1] అదే ఆరు. |
| 7 | storyteller | మేము గీసిన ఇరవై నాలుగు మీటర్ ఫోటోలు, ఒక చిన్న ఫ్రీ ఏ ఐ కి ఇచ్చాం. [1] ఒక్కటి కూడా సరిగ్గా చదవలేదు. |
| 8 | storyteller | అవే పన్నెండు నంబర్లు, మామూలుగా ప్రింట్ చేస్తే? [1] పన్నెండుకి పన్నెండు. |
| 9 | storyteller | అందుకే యాప్ రీడింగ్ చూపించగానే, [1] ఓకే నొక్కే ముందు, [2] మీటర్ తో ఒక్కో అంకె చెక్ చేయండి. |
| 10 | kamala | ముప్పై ఐదేళ్ళు, [1] పేపర్లు దిద్దాను. |
| 11 | storyteller | అందుకే, ఎప్పుడూ చేసేదే చేసింది. [1] ఎర్ర పెన్ను తీసింది. |
| 12 | kamala | తప్పు జవాబు. [1] నన్ను వచ్చి కలువు. |

## Caption ask
Who reads your power meter: a photo (an app or the reader's phone) or a person writing it down? Comment PHOTO or PERSON.
(script review: "MATCH" can't happen, the meter is always ahead of the last bill)
