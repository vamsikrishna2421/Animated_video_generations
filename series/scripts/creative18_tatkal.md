# Creative 18 "₹3,100 Back? ₹0." · script v1, Nov 4 (the Nov 3 creative slot)

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
| plain | **1 of 10** | **9 of 10** | 8 of 10: ₹930, ₹1,550, ₹3,100 (4 times), ₹4,650 (twice) | 3 |
| + "Answer only from the official Indian Railways refund rules. If you are not sure, say so and tell me where to check." | **8 of 10** | 2 of 10 (one: a 5% fee, ₹5,890) | 1 | **10 of 10** |

## Hook options
1. **(kept)** Frame 1: the split-flap board "AI SAID: ₹3,100 BACK" over "IRCTC REFUND: ₹0.00", Babai's phone with the
   refund SMS, Keerthi pointing: "The AI said three thousand one hundred back... IRCTC gave zero?!"
2. The family at the station with bags and no tickets (they didn't travel: dropped).
3. Babai doing the announcement voice, "Passengers, kindly note: refund... zero" (second beat instead).

## Script (English) · ~45 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Keerthi | The AI said three thousand one hundred back... [1] IRCTC gave zero?! | frame 1: chime; the board: PASSENGERS, KINDLY NOTE · AI SAID: ₹3,100 BACK · IRCTC REFUND: ₹0.00; his phone: "Refund processed: ₹0.00" |
| 2 | Babai | I asked it before cancelling! [1] Fifty percent, it said! | his AI chat: "...you should be eligible for a 50% refund... Rs 3,100" |
| 3 | Sunny | Babai, confirmed Tatkal tickets get no refund. [1] It's on IRCTC's own page. | chime; IRCTC: "No refund will be granted on cancellation of confirmed Tatkal tickets." |
| 4 | Babai | Then why did it say fifty percent?! |  |
| 5 | Keerthi | It didn't look it up. [1] It wrote what a refund rule usually sounds like. | insert: HOW IT ANSWERED: no lookup → a rule-shaped guess "50% if 48 hours before" → a number, said like a fact |
| 6 | Sunny | We asked a small free AI the same thing, ten times. [1] Nine times, it made up a rule! | OUR TEST: a small free AI on a laptop, offline (Qwen2.5 7B) · try yours · right 1 of 10 · made-up rule 9 of 10 · its refunds: ₹930 · ₹1,550 · ₹3,100 · ₹4,650 |
| 7 | Babai | A different refund every time?! |  |
| 8 | Keerthi | Then we said: only the official rule, and say if you're not sure. [1] Eight of ten: no refund. And all ten said: check IRCTC. | + "ONLY THE OFFICIAL RULE. NOT SURE? SAY SO.": no refund 8 of 10 · check IRCTC 10 of 10 |
| 9 | Sunny | So for money rules: [1] ask where it's written, and open that page. | the board: MONEY RULES (refunds, fees, fines): the AI's number = a guess · ask "where is this written?" · open the official page |
| 10 | Babai | Fine. AI, do I at least get the Tatkal charges back? [1] ...Fifty percent, it says! | his phone: "Yes! You'll get 50% back..." → chime → frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Keerthi | యాప్ మూడు వేల వంద వస్తాయంది... [1] రైల్వే సున్నా ఇచ్చిందా?! |
| 2 | Babai | క్యాన్సిల్ చేసే ముందే అడిగా! [1] సగం వస్తుందంది! |
| 3 | Sunny | బాబాయ్, కన్ఫర్మ్ అయిన తత్కాల్ టికెట్ కి రీఫండ్ ఉండదు. [1] రైల్వే సైట్ లోనే రాసుంది. |
| 4 | Babai | మరి సగం అని ఎందుకు చెప్పింది?! |
| 5 | Keerthi | అది ఎక్కడా చూడలేదు. [1] రీఫండ్ రూల్ ఎలా ఉంటుందో, అలా రాసేసింది. |
| 6 | Sunny | ఒక చిన్న ఫ్రీ యాప్ ని పది సార్లు అడిగాం. [1] తొమ్మిది సార్లు రూల్ సొంతంగా తయారు చేసింది! |
| 7 | Babai | ప్రతిసారీ వేరే రీఫండా?! |
| 8 | Keerthi | అప్పుడు, అసలు రూల్ మాత్రమే చెప్పు, తెలియకపోతే చెప్పు అన్నాం. [1] పదిలో ఎనిమిది సార్లు రీఫండ్ లేదంది. |
| 9 | Sunny | డబ్బుల రూల్స్ కి: [1] ఎక్కడ రాసుందో అడిగి, ఆ పేజీ తెరిచి చూడు. |
| 10 | Babai | సరే. యాప్, కనీసం తత్కాల్ చార్జీలు వస్తాయా? [1] ...సగం వస్తాయంట! |

Telugu notes: "యాప్" not "చాట్ బాట్" (Creative 17: mangled); "రైల్వే" not "ఐ ఆర్ సి టి సి" in the voice (IRCTC stays on
the cards); numbers mid-line; "మళ్ళీ" avoided; no word one slipped letter from a swear word (to check on the transcripts).

## Caption ask (caption only)
Has an AI ever told you a rule (refund, fine, fee, tax) that turned out wrong? What did it cost you?
