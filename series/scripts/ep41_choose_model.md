# EP41 "The biggest brain" (How to choose the right model) · script v1, Oct 28

**Slot:** queue 044, replaces the lesson-format `044_ep41_how_to_choose_the_right_ai_model.mp4`.
**Cast / setting:** Ravi anna's kirana shop, the shop AI (the student robot on his phone, calm, deadpan). Since EP38 the
shop runs its brains on its own laptop, offline: the three squeezed brains of EP37-EP40 (1.1 GB, 2.1 GB, 4.7 GB). The
AI answers the shop's WhatsApp orders.
**The AI's mistake:** the small 1.1 GB brain (fast, EP39) answers "3 bath soaps and 1 detergent powder" with "Sure,
we'll have those ready for you within 30 minutes." The customer: "WHICH items??" Ravi grabs the biggest brain.
**Topic as plot:** "biggest" isn't a job. Write the pass mark first (every item and quantity right in 19 of 20 replies,
every reply under 10 seconds), give all three brains the same test (his 20 orders), keep the smallest that passes. The
quiz: which brain passes? The middle one: 19 of 20, all under 5 s. The biggest: 16 of 20 (it made up units: "2 liters
of curd and 2 liters of milk" for "2 curd 2 milk") and one reply took 11 s. Twist: a customer types in Telugu words,
"ara kilo panchadara and okati tea podi", and the middle brain answers "Kilo panchadara confirmed.": half a kilo became
a kilo. A new job needs a new test, and on Telugu-typed orders none of the three passes (5 · 14 · 12 of 20). "Then which
brain do I keep?!" loops to frame 1. EP40 taught "test it on your own work"; new here: the pass mark before the test,
"best" depends on the job, the smallest one that passes, and re-testing when the job changes. Season 4 ends here; EP42
(bias and fairness) starts Season 5.

## Facts and sources (checked Oct 28, 2026)
- OpenAI's model-selection guide (developers.openai.com/api/docs/guides/model-selection): "Choose acceptance criteria
  before comparing models"; "keep the lightest setting that meets your quality bar"; "Measure completion time alongside
  quality, including time spent reviewing or repairing the result."; "Treat the guidance on this page as a starting
  point." On screen: the first quote, attributed.
- Anthropic's guide, "Choosing the right model" (platform.claude.com/docs): weigh capabilities, speed and cost; "Create
  benchmark tests specific to your use case. Having a good evaluation set is the most important step in the process.";
  "Test with your actual prompts and data."; two ways to start (a fast, low-cost model first and upgrade only if needed,
  or the most capable first and move down); and combining models (a low-cost model for most of the work). Caption.
- The brains: Qwen's own 4-bit files (q4_k_m) of Qwen2.5-1.5B/3B/7B-Instruct, 1.12 / 2.10 / 4.68 GB (EP38), Apache-2.0.

## Our demo (pipeline/ep41/choose_demo.py, series/scripts/ep41_demo/)
The pass marks were written into the script and committed before any brain ran (commit "pass marks written before the
run"). llama.cpp, 4 CPU cores, greedy, max 80 tokens, offline (an empty network namespace: DNS and a direct connection
both failed). The prompt: EP36's WhatsApp reply prompt plus EP39's "Reply in 2 short lines." The orders: EP34's 20
orders as typed ("2 curd 2 milk"), and the same 20 typed with Telugu words in English letters ("2 perugu 2 paalu",
"ara kilo panchadara and okati tea podi"). Every reply read by hand (`HAND` in the script).

| brain (squeezed, 4-bit) | 20 English orders: every item + quantity | slowest reply | 20 Telugu-typed orders | slowest | bills (EP38) |
|---|---|---|---|---|---|
| 1.1 GB (Qwen2.5 1.5B) | 8 | 2.3 s | 5 | 2.9 s | 11 |
| 2.1 GB (Qwen2.5 3B) | **19 (pass)** | 4.5 s | 14 | 5.3 s | 15 |
| 4.7 GB (Qwen2.5 7B) | 16 | 11.1 s (one over 10 s) | 12 (5 over 10 s) | 12.4 s | 18 |

- Pass mark, replies: every item with its right quantity in at least 19 of 20, every reply under 10 s. Only the 2.1 GB
  passes. Bills (pass mark 20 of 20, money): none passes; the biggest is best there (18), so "best" changes with the job
  (caption).
- The 1.1 GB's misses: "Sure, we'll have those ready for you within 30 minutes." (8 times, word for word or nearly).
- The 2.1 GB's miss: "Coconut oil, 2 kg onion, 1 kg potato" (the "1" left out). On Telugu-typed orders: "Kilo
  panchadara confirmed." for "ara kilo panchadara" (twice it made half a kilo a kilo), quantities left out 3 times.
- The 4.7 GB's misses: "2 liters of curd and 2 liters of milk" for "2 curd 2 milk"; "two liters of milk" for 2 packets;
  two quantities left out; reply 20 took 11.1 s. On Telugu-typed orders it translated: "1 dozen guddlu" → "1 dozen
  guavas", "2 perugu 2 paalu" → "2 eggs and 2 bananas", "2 kobbari nune" → "2 kg of onions"; "ara kilo" → "1 kg".
- Small print: one machine, one prompt, 20 orders each way, greedy decoding; a different prompt or a bigger online model
  could score differently. That's the point: the numbers belong to Ravi's job on Ravi's laptop.

## Hook options
1. **(kept)** Frame 1: the shop's WhatsApp on a big phone: the order "3 bath soaps and 1 detergent powder", the 1.1 GB's
   real reply "Sure, we'll have those ready for you within 30 minutes." circled red, the customer: "WHICH items??"; Ravi
   holding up a fat "4.7 GB · BIGGEST" brain file. Ravi: "It forgot the items again! I'm putting in the biggest brain!"
2. Three brain files on the counter like mangoes at a stall, Ravi squeezing each: "Which one's ripe?"
3. A customer at the counter reading "2 liters of curd" off her phone, Ravi holding two small cups.
Kept 1: a failure every WhatsApp shop has seen, a real reply, and the wrong fix everyone would try (bigger = better).

## Script (English) · ~55 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | It forgot the items again! [1] I'm putting in the biggest brain! | frame 1 (above); tag "EP41 · AI From Scratch" |
| 2 | AI | Biggest for which job, anna? [1] Write the pass mark first. | insert: a notepad "PASS MARK", "written before the test"; OpenAI's line "Choose acceptance criteria before comparing models" (OpenAI's model guide) |
| 3 | Ravi | Every item and quantity right, [1] and the reply in under ten seconds! | the notepad fills: "every item + quantity: 19 of 20 replies" · on [1] "each reply under 10 s" |
| 4 | AI | Then all three brains take one test. [1] Your twenty orders. | OUR REAL TEST card: "20 WhatsApp orders · the same for all three · offline · every reply read"; three brain files 1.1 · 2.1 · 4.7 GB |
| 5 | Ravi | Easy! The biggest one wins! | after the line, QUIZ (4.8 s hold, 3-2-1, then a stop): "Which brain passes Ravi's pass mark?" A 1.1 GB · B 2.1 GB · C 4.7 GB (the biggest) |
| 6 | AI | The middle one passed. [1] Nineteen of twenty, all under five seconds. | out of the stop, a hit: the test card, row 2.1 GB "19 of 20 · slowest 4.5 s · PASS", "B ✓" |
| 7 | Ravi | Not the biggest?! | |
| 8 | AI | Sixteen of twenty. [1] It turned two curds into two litres! | row 4.7 GB "16 of 20 · slowest 11 s ✗"; its real reply: "2 curd 2 milk" → "Sure, we'll deliver 2 liters of curd and 2 liters of milk..." circled; row 1.1 GB "8 of 20 · 2 s ✗ (skips the items)" |
| 9 | Ravi | Litres of curd?! | two small curd cups in his hands |
| 10 | AI | Keep the smallest brain that passes. [1] Your pass mark, your test. | RULE chip "CHOOSE A BRAIN": "1 write the pass mark first" · "2 one test for every brain" · "3 keep the smallest that passes" |
| 11 | Ravi | Done! [1] The middle one, forever! | Ravi taps "2.1 GB" on the laptop; a WhatsApp ding |
| 12 | Ravi | Ara kilo means HALF a kilo! [1] It doubled the sugar! | the phone: a customer types "ara kilo panchadara and okati tea podi"; the reply "Kilo panchadara confirmed." with "ara kilo = ½ kg" circled |
| 13 | AI | Your customers type Telugu words too. [1] On those, none of the three passed. | TELUGU-TYPED ORDERS card: 1.1 GB 5 · 2.1 GB 14 · 4.7 GB 12 of 20 (pass mark 19) "NONE PASSES"; the big one's "2 perugu 2 paalu → 2 eggs and 2 bananas" |
| 14 | Ravi | None?! [1] Then which brain do I keep?! | then frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | మళ్ళీ ఐటమ్స్ మర్చిపోయింది! [1] అతి పెద్ద బ్రెయిన్ పెడతా! | Malli items marchipoyindi! Ati pedda brain pedataa! |
| 2 | AI | ఏ పనికి పెద్దది అన్నా? [1] ముందు పాస్ మార్క్ రాయండి. | Ae paniki peddadi annaa? Mundu pass mark raayandi. |
| 3 | Ravi | ప్రతి ఐటమ్, ప్రతి క్వాంటిటీ కరెక్ట్, [1] పది సెకన్ల లోపు రిప్లై! | Prati item, prati quantity correct, padi secondla lopu reply! |
| 4 | AI | అయితే మూడు బ్రెయిన్లకీ ఒకే టెస్ట్. [1] మీ ఇరవై ఆర్డర్లు. | Ayite moodu brainlakee oke test. Mee iravai orderlu. |
| 5 | Ravi | ఈజీ! పెద్దదే గెలుస్తుంది! | Easy! Peddade gelustundi! |
| 6 | AI | మధ్యలో ఉన్నది పాస్. [1] ఇరవై లో పందొమ్మిది, ఐదు సెకన్ల లోపే. | Madhyalo unnadi pass. Iravai lo pandommidi, aidu secondla lope. |
| 7 | Ravi | పెద్దది కాదా?! | Peddadi kaadaa?! |
| 8 | AI | ఇరవై లో పదహారు. [1] రెండు పెరుగులను రెండు లీటర్లు చేసింది! | Iravai lo padahaaru. Rendu perugulanu rendu leetarlu chesindi! |
| 9 | Ravi | లీటర్ల పెరుగా?! | Leetarla perugaa?! |
| 10 | AI | పాస్ అయిన వాటిలో చిన్నదే ఉంచండి. [1] మీ పాస్ మార్క్, మీ టెస్ట్. | Pass ayina vaatilo chinnade unchandi. Mee pass mark, mee test. |
| 11 | Ravi | సరే! [1] ఇక మధ్య బ్రెయిన్ నే! | Sare! Ika madhya brain ne! |
| 12 | Ravi | అర కిలో అంటే సగం కిలో! [1] పంచదార డబుల్ చేసింది! | Ara kilo ante sagam kilo! Panchadaara double chesindi! |
| 13 | AI | మీ కస్టమర్లు తెలుగు పదాలు కూడా టైప్ చేస్తారు. [1] వాటిలో, మూడింట్లో ఏదీ పాస్ కాలేదు. | Mee customerlu Telugu padaalu kooda type chestaaru. Vaatilo, moodintlo aedee pass kaaledu. |
| 14 | Ravi | ఏదీ కాదా?! [1] మరి ఏ బ్రెయిన్ ఉంచాలి?! | Aedee kaadaa?! Mari ae brain unchaali?! |

Telugu notes: line 1's punch words ("ఐటమ్స్ మర్చిపోయింది") inside 2 s (handoff Oct 27); no "ఏఐ" in voiced text; no
"డిసైడ్"; no zero-width joiners.

## Caption ask (draft)
Which AI brain is best? Wrong question: best for which job? Write your pass mark first, give every brain the same test,
keep the smallest one that passes. On Ravi's WhatsApp replies, the 2.1 GB passed and the biggest didn't (16 of 20: "2
liters of curd"). On his bills, the biggest is best (18 of 20). New job, new test. Comment: which job would you test
first?
