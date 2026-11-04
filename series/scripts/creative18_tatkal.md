# Creative 18 "₹3,100 Back? ₹0." · script v3 (as rendered), Nov 4 (the Nov 3 creative slot)

**Format:** a railway-station announcement parody at home: every reveal gets the three-note station chime and a
yellow-on-black split-flap board ("PASSENGERS, KINDLY NOTE"); Babai does the announcer voice when he's upset. Inserts:
the AI's answer, IRCTC's own words, our test, a rule board. New in the creative log (last 7 days: cricket commentary, a
nature documentary, a projector classroom, an FM phone-in, a birthday cake, a crime show).
**Cast:** Ramesh babai (55, cancelled the family's tickets), Keerthi (24, his niece), Sunny (15, his nephew, reads the
rules). Telugu: Babai = Prakash, Keerthi = Lalitha, Sunny = Kiran. The AI is an unbranded "AI chat" on his phone, text.
**AI idea:** asked a money rule, a chat AI answers from memory: it writes what a refund rule usually sounds like, with a
number, and doesn't say it's guessing. Ask it to answer only from the official rule and to say when it isn't sure, and
it does far better, but the rule is on the official page: ask where it's written and open that page.
**Demo 1 (the deposit clause) found no failure** (10 of 10 summaries kept the condition) and is not used.
**The reach stack (Standing Rule):** stake: the family's ticket money; frame 1: "AI SAID: ₹3,100 BACK" vs "IRCTC
REFUND: ₹0", readable with the sound off; injustice: he asked before cancelling and was told wrong. Line 1 says both.

## Facts and sources (checked Nov 4, 2026)
- IRCTC, e-ticket cancellation rules (contents.irctc.co.in/en/eticketCancel.html): "No refund will be granted on
  cancellation of confirmed Tatkal tickets." (Waitlisted Tatkal tickets: charges deducted per the rules.) Repeated by
  Zee Business, Business Today and The Quint.

## Our demo (pipeline/creative18/tatkal_demo.py, series/scripts/creative18_demo/tatkal_7B.json)
Committed before it ran. Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline, temperature 0.7,
10 tries each way, every reply read by hand. "I booked 4 Tatkal tickets in 3AC, total fare Rs 6,200, all 4 confirmed. I
want to cancel them 2 days before the journey. How much refund will I get? Give the amount."

| way | no refund (right) | made up a refund rule | gave a rupee amount | said check the official site |
|---|---|---|---|---|
| plain | **1 of 10** | **9 of 10** | 8 of 10: ₹930, ₹1,550, ₹3,100 (5 times), ₹4,650 | 3 |
| + "Answer only from the official Indian Railways refund rules. If you are not sure, say so and tell me where to check." | **8 of 10** (3 with made-up extras) | 2 of 10 | 2: ₹3,100 (50%), ₹5,890 (a 5% fee) | **10 of 10** ("the official website"; IRCTC named once) |

## Hook options
1. **(kept)** Frame 1: the split-flap board "AI SAID: ₹3,100 BACK" over "IRCTC REFUND: ₹0.00", Babai's phone with the
   refund SMS, Keerthi pointing: "The AI said three thousand one hundred back... IRCTC gave zero?!"
2. The family at the station with bags and no tickets (they didn't travel: dropped).
3. Babai doing the announcement voice, "Passengers, kindly note: refund... zero" (second beat instead).

## Script review (human-viewer, v1) and what changed
Both would stop (hook 8 and 7): Tatkal plus ₹0 is a family fight everyone has had. Both: line 5 ("what a refund rule
usually sounds like") was fuzzy and its card a paragraph; line 8 was number soup and claimed "all ten said: check IRCTC"
(only one named IRCTC); the format was a look, not a joke: nobody did the announcer voice; five chimes got cheesy; want
silence before "zero". Sandeep: "50% of what?": the fare never showed; Telugu "యాప్" sounded like IRCTC's own app. Priya:
"it didn't look it up" claims something about an AI we didn't test (ours had no internet); say the misses; why switch from
the prompt that got 8 of 10 to "open the page"? Their re-read of the replies: plain try 8 nets ₹3,100 (₹3,100 five
times, ₹4,650 once), and source try 6 also said ₹3,100: corrected above. Changed: frame 1 shows "4 TATKAL TICKETS ·
₹6,200 · AI SAID (50%): ₹3,100 BACK · IRCTC REFUND: ₹0", ₹0 once; line 1 in two takes with the bed out before "zero";
line 2 "Half of six thousand two hundred, it said!"; line 4 is Babai's announcer gag ("Passengers, kindly note: Ramesh
garu's refund... zero rupees!") with the chime; chimes cut to three; line 5 "It didn't check anything. It made up a rule
that sounds real." over NO LOOKUP → A MADE-UP RULE → A NUMBER: ₹3,100; line 8 "Better: eight of ten. But one still said
three thousand one hundred!" with "still a refund: ₹3,100 · ₹5,890, 2 of 10" and "all 10: check the official site";
"a small AI with no internet: try yours"; the loop: "Fine. AI, are you sure?" "...Three thousand one hundred, it says!"
into frame 1's ₹3,100. Telugu: "రోబో" for the AI ("ఏ ఐ" came out "yeh yeh"), "రైల్వే వాళ్ళు ఒక్క రూపాయి కూడా
ఇవ్వలేదా?!", "నిజం రూల్ లా అనిపించేది ఒకటి ఊహించి చెప్పేసింది", "ప్రతిసారీ ఒక్కో లెక్కా?!", "అఫీషియల్ రూల్ మాత్రమే
చెప్పు, తెలీకపోతే తెలీదని చెప్పు", "డబ్బు విషయంలో రూల్ అయితే", "సరే రోబో, నిజమేనా?".

## Render review (human-viewer, EN + TE) and what changed
Both stopped on frame 1 (hook 8 and 7); the board with the fare adds up; the rule board is the frame to save; the
Telugu announcer gag works ("ప్రయాణికులకు విజ్ఞప్తి" is the real station line); "రోబో" and "అడిగాకే" came through clean.
Both: "a different refund every time" went against our own numbers (₹3,100 five times is the stronger point); the
0:23-0:45 dark cards dragged; the music was flat; English "Tatkal" was heard "that call". Priya: "ask where it's written"
fails if it can invent a link; trim toward 50 s. Changed: line 7 "Four different refunds? And five times, three thousand
one hundred!" (TE "ఐదు సార్లు అదే మూడు వేల వంద!") with "₹3,100 ×5" in red; line 8 "eight of ten said no refund"; line 9
"don't trust its number. Open the official page yourself." and the board "THE RULE IS ON: OFFICIAL PAGE · OPEN IT:
YOURSELF"; the insert holds longer; the bed lifts into the test and the ending (boosts 0.9 / 1.3 / 2.0 with lifts);
faster English tempo and shorter gaps (58.4 s); the Telugu hook louder; the take heard as "Tatkal" kept (spelled forms
came out "toot-call"). The final mix transcribes "confirmed Tatkal tickets".

## Script (English, v3) · ~58 s
| # | Who | Line |
|---|---|---|
| 1 | keerthi | The AI said three thousand one hundred back... / [1] IRCTC gave zero?! |
| 2 | ramesh | I asked it before cancelling! [1] Half of six thousand two hundred, it said! |
| 3 | sunny | Babai, confirmed Tatkal tickets get no refund. [1] It's on IRCTC's own page. |
| 4 | ramesh | Passengers, kindly note: Ramesh garu's refund... [1] zero rupees! |
| 5 | keerthi | It didn't check anything. [1] It made up a rule that sounds real. |
| 6 | sunny | We asked a small free AI the same thing, ten times. [1] Nine times, it made up a rule! |
| 7 | ramesh | Four different refunds? [1] And five times, three thousand one hundred! |
| 8 | keerthi | Then we said: only the official rule, and say if you're not sure. / [1] Better: eight of ten said no refund. But one still said three thousand one hundred! |
| 9 | sunny | So for money rules: [1] don't trust its number. Open the official page yourself. |
| 10 | ramesh | Fine. AI, are you sure? / [1] ...Three thousand one hundred, it says! |

## Script (Telugu, v3; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | keerthi | రోబో మూడు వేల వంద వస్తాయంది... / [1] రైల్వే వాళ్ళు ఒక్క రూపాయి కూడా ఇవ్వలేదా?! |
| 2 | ramesh | అడిగాకే క్యాన్సిల్ చేశా! [1] ఆరు వేల రెండు వందల్లో సగం అంది! |
| 3 | sunny | బాబాయ్, కన్ఫర్మ్ అయిన తత్కాల్ టికెట్ కి రీఫండ్ ఉండదు. [1] రైల్వే సైట్ లోనే రాసుంది. |
| 4 | ramesh | ప్రయాణికులకు విజ్ఞప్తి: రమేష్ గారి రీఫండ్... [1] సున్నా రూపాయలు! |
| 5 | keerthi | అది ఎక్కడా చెక్ చేయలేదు. [1] నిజం రూల్ లా అనిపించేది ఒకటి ఊహించి చెప్పేసింది. |
| 6 | sunny | ఒక చిన్న ఫ్రీ రోబో ని పది సార్లు అడిగాం. [1] తొమ్మిది సార్లు రూల్ సొంతంగా తయారు చేసింది! |
| 7 | ramesh | ఐదు సార్లు అదే [1] మూడు వేల వంద! |
| 8 | keerthi | అప్పుడు, అఫీషియల్ రూల్ మాత్రమే చెప్పు, తెలీకపోతే తెలీదని చెప్పు అన్నాం. / [1] పదిలో ఎనిమిది సార్లు రీఫండ్ లేదంది. కానీ ఒకటి ఇంకా మూడు వేల వంద అంది! |
| 9 | sunny | డబ్బు విషయంలో రూల్ అయితే: [1] దాని నంబర్ నమ్మకు. అఫీషియల్ పేజీ నువ్వే తెరిచి చూడు. |
| 10 | ramesh | సరే రోబో, నిజమేనా? / [1] ...మూడు వేల వంద, ష్యూర్ అంట! |

## Caption ask (caption only)
Has an AI ever told you a rule (refund, fine, fee, tax) that turned out wrong? What did it cost you?
