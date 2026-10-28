# EP41 "The biggest brain" (How to choose the right model) · script v2.1, Oct 28

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
1. **(kept)** Frame 1: the shop's WhatsApp on a big phone, three different orders ("3 bath soaps and 1 detergent
   powder", "1 curd 1 bread 5 biscuits", "4 milk packets and 2 bread") each answered with the 1.1 GB's real reply, the
   same words every time: "Sure, we'll have those ready for you within 30 minutes." (circled red), the customer: "WHICH
   items??"; Ravi holding up a fat "4.7 GB · BIGGEST" brain file. Ravi: "Same reply to every order?! I'm putting in the
   biggest brain!"
2. Three brain files on the counter like mangoes at a stall, Ravi squeezing each: "Which one's ripe?"
3. A customer at the counter reading "2 liters of curd" off her phone, Ravi holding two small cups.
Kept 1: a failure every WhatsApp shop has seen, real replies, and the wrong fix everyone would try (bigger = better).

## Viewer notes on v1 and what changed (v2)
- Both: one canned reply didn't look like a bug ("sounds fine"): frame 1 shows the same reply to three orders.
- Both: line 3 said "every item right" next to "19 of 20": the line says "Nineteen of twenty orders right".
- Both: the quiz could be solved by elimination: a D, "none of them" (it also sets up the twist).
- Both: "why the smallest?": "it's faster and needs less memory" (EP38: 2.3 GB vs 5.0 GB of RAM; EP39: speed); and so
  the reel doesn't say "big = worse", the rule card says "a different job, a different winner: on bills the 4.7 GB is
  best (18 of 20)".
- Both: "none passes, so now what?": "Fix the prompt, or try another brain. Then test again." (Anthropic's guide:
  upgrade if needed, or combine models), before the loop.
- Sandeep: "eggs and bananas" was only on screen: Ravi says "Perugu became eggs?!". Priya: the 11 s fail is said ("And
  one reply took eleven seconds."); the sugar reply is shown whole ("Kilo panchadara confirmed. Tea podi confirmed.").
- Both: less text on the pass-mark card (the OpenAI line below it, small) and on the result cards.
- Telugu (Sandeep): "అతి పెద్ద" newsreader-ish: "అన్నిటికన్నా పెద్ద"; "పెరుగులను": "పెరుగు కప్పులని"; "మధ్య బ్రెయిన్ నే":
  "మధ్యదే"; "అర కిలో అంటే సగం కిలో" (explaining ara kilo to Telugu people): "అర కిలో అడిగితే కిలో రాసింది!"; line 13
  plainer; "guddlu" stays off screen (it reads close to a crude word); Ravi says "ఎగ్స్", not "గుడ్లు".
- Priya: EP39's 17 s vs 11 s here: the caption says EP39's 17 s was the long reply; with "Reply in 2 short lines." the
  big brain writes in 6-11 s.

## Render review 1 (Sandeep, Priya) and what changed
- Both: "Same reply to every order" next to "8 of 20": "Same reply, order after order?!" (EN and TE re-voiced), the
  caption "order after order".
- Both: the bills reversal never stayed on screen: the rule card shows rows 1-2 at once (said earlier) and row 3 as it
  is spoken, the note "on bills, the 4.7 GB is best (18 of 20)" from a third of the line, and the card holds through
  "The middle one, forever!".
- Both: the second half sat at one level and the sugar twist had no hit: the order pops up on the cut, the bed stops,
  the reply "Kilo panchadara confirmed." lands with a boom and a clap 0.4 s before Ravi; the bed is out under a louder
  riser before the last line.
- Priya: "orders right, every reply" was heard "orders, write every reply": "Nineteen of twenty orders right! And every
  reply under ten seconds!". "perugu (curd) · paalu (milk)" glossed on the card. The caption marks the Telugu-names
  prompt "not tested yet".
- Sandeep: the setup card sat still: "replies read by hand: 0 of 60" counts up with a bar. A chip on the Telugu card:
  "picked D? right, for Telugu orders". Telugu caption: "okkokkati chadivaam", "vere pani, vere winner".
- Telugu per-line check of the final mix: line 1's "పెడతా" (heard "prattaa") and 13b's "అవ్వలేదు" (heard
  "avalagadu") re-voiced; line 4's "vavava" was the window, not the take (the take reads "మీ ఇరవై ఆర్డర్లు").
- Kept (one viewer): the RAM numbers stay in the caption; "Telugu words are a new job" (Priya: "inputs your test missed")
  stays, with "then test again" on screen.

## Script (English) · ~60 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Same reply, order after order?! [1] I'm putting in the biggest brain! | frame 1 (above); tag "EP41 · AI From Scratch" |
| 2 | AI | Biggest for which job, anna? [1] Write the pass mark first. | insert: a notepad "PASS MARK · written before the test"; small, below: "OpenAI's model guide: 'Choose acceptance criteria before comparing models'" |
| 3 | Ravi | Nineteen of twenty orders right! [1] And every reply under ten seconds! | the notepad fills: "19 of 20 orders: every item + quantity" · on [1] "every reply under 10 s" |
| 4 | AI | Then all three brains take one test: [1] your twenty orders. | OUR REAL TEST card: "the same 20 orders · offline · every reply read"; three brain files 1.1 · 2.1 · 4.7 GB |
| 5 | Ravi | Easy! The biggest one wins! | after the line, QUIZ (4.8 s, 3-2-1, then a stop): "Which brain passes Ravi's pass mark?" A 1.1 GB · B 2.1 GB · C 4.7 GB (the biggest) · D none of them |
| 6 | AI | The middle one passed. [1] Nineteen of twenty, all under five seconds. | out of the stop, a hit: the test card, row 2.1 GB "19 of 20 · 4.5 s · PASS ✓", "B ✓" |
| 7 | Ravi | Not the biggest?! | |
| 8 | AI | Sixteen of twenty: it turned two curds into two litres! [1] And one reply took eleven seconds. | row 4.7 GB "16 of 20 ✗"; its real reply "2 curd 2 milk → 2 liters of curd and 2 liters of milk" circled; on [1] "slowest 11.1 s ✗"; row 1.1 GB "8 of 20 ✗" |
| 9 | Ravi | Two litres of curd?! | two small curd cups in his hands |
| 10 | AI | Keep the smallest one that passes: [1] it's faster and needs less memory. | RULE chip "CHOOSE A BRAIN": "1 write the pass mark first" · "2 one test for every brain" · "3 keep the smallest that passes"; under it "a different job, a different winner: on bills, the 4.7 GB is best (18 of 20)" |
| 11 | Ravi | The middle one, forever! | Ravi taps "2.1 GB" on the laptop; a WhatsApp ding |
| 12 | Ravi | Half a kilo became a kilo! [1] It doubled the sugar! | the phone: a customer types "ara kilo panchadara and okati tea podi"; the reply "Kilo panchadara confirmed. Tea podi confirmed." with "ara kilo = ½ kg" circled |
| 13 | AI | Telugu words are a new job, anna. [1] And none of the three passed it. | TELUGU-TYPED ORDERS card: 1.1 GB 5 · 2.1 GB 14 · 4.7 GB 12 of 20 (pass mark 19) "NONE PASSES"; the 4.7 GB's "2 perugu 2 paalu → 2 eggs and 2 bananas" |
| 14 | Ravi | Perugu became eggs?! [1] So now what?! | |
| 15 | AI | Fix the prompt, or try another brain. [1] Then test again. | chip "NONE PASSES? change the prompt or the brain · test again" |
| 16 | Ravi | Test again?! [1] Then which brain do I keep?! | then frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | ఆర్డర్ ఆర్డర్ కీ ఒకటే రిప్లై?! [1] అన్నిటికన్నా పెద్ద బ్రెయిన్ పెడతా! | Order order kee okate reply?! Annitikanna pedda brain pedataa! |
| 2 | AI | ఏ పనికి పెద్దది అన్నా? [1] ముందు పాస్ మార్క్ రాయండి. | Ae paniki peddadi annaa? Mundu pass mark raayandi. |
| 3 | Ravi | ఇరవై లో పందొమ్మిది ఆర్డర్లు కరెక్ట్, [1] ప్రతి రిప్లై పది సెకన్ల లోపు! | Iravai lo pandommidi orderlu correct, prati reply padi secondla lopu! |
| 4 | AI | అయితే మూడు బ్రెయిన్లకీ ఒకే టెస్ట్. [1] మీ ఇరవై ఆర్డర్లు. | Ayite moodu brainlakee oke test. Mee iravai orderlu. |
| 5 | Ravi | ఈజీ! పెద్దదే గెలుస్తుంది! | Easy! Peddade gelustundi! |
| 6 | AI | మధ్యలో ఉన్నది పాస్. [1] ఇరవై లో పందొమ్మిది, ఐదు సెకన్ల లోపే. | Madhyalo unnadi pass. Iravai lo pandommidi, aidu secondla lope. |
| 7 | Ravi | పెద్దది కాదా?! | Peddadi kaadaa?! |
| 8 | AI | ఇరవై లో పదహారు. రెండు పెరుగు కప్పులని రెండు లీటర్లు చేసింది! [1] ఒక రిప్లై కి పదకొండు సెకన్లు. | Iravai lo padahaaru. Rendu perugu kappulani rendu leetarlu chesindi! Oka reply ki padakondu secondlu. |
| 9 | Ravi | లీటర్ల పెరుగా?! | Leetarla perugaa?! |
| 10 | AI | పాస్ అయిన వాటిలో చిన్నదే ఉంచండి. [1] అది ఫాస్ట్, మెమరీ కూడా తక్కువ. | Pass ayina vaatilo chinnade unchandi. Adi fast, memory kooda takkuva. |
| 11 | Ravi | ఇక మధ్యదే, ఎప్పటికీ! | Ika madhyade, eppatikee! |
| 12 | Ravi | అర కిలో అడిగితే కిలో రాసింది! [1] పంచదార డబుల్! | Ara kilo adigite kilo raasindi! Panchadaara double! |
| 13 | AI | తెలుగు పదాలతో కూడా టైప్ చేస్తారు అన్నా. [1] దానికి ఒక్కటి కూడా పాస్ అవ్వలేదు. | Telugu padaalato kooda type chestaaru annaa. Daaniki okkati kooda pass avvaledu. |
| 14 | Ravi | పెరుగు ఎగ్స్ అయిందా?! [1] ఇప్పుడేం చేయాలి?! | Perugu eggs ayindaa?! Ippudem cheyaali?! |
| 15 | AI | ప్రాంప్ట్ మార్చండి, లేదా వేరే బ్రెయిన్ ట్రై చేయండి. [1] తర్వాత మళ్ళీ టెస్ట్. | Prompt maarchandi, ledaa vere brain try cheyandi. Tarvaata malli test. |
| 16 | Ravi | మళ్ళీ టెస్టా?! [1] మరి ఏ బ్రెయిన్ ఉంచాలి?! | Malli testaa?! Mari ae brain unchaali?! |

Telugu notes: line 1's punch words ("ఒకటే రిప్లై") inside 2 s (handoff Oct 27); no "ఏఐ" in voiced text; no "డిసైడ్";
no "గుడ్లు" (and no "guddlu" on screen); no zero-width joiners.

## Caption ask (draft)
Which AI brain is best? Wrong question: best for which job? Write your pass mark first, give every brain the same test,
keep the smallest one that passes. On Ravi's WhatsApp replies, the 2.1 GB passed and the biggest didn't (16 of 20: "2
liters of curd"). On his bills, the biggest is best (18 of 20). New job, new test. Comment: which job would you test
first?
