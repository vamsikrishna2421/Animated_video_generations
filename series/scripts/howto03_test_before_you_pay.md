# HOW TO 03 "Test 3 AIs on your question before you pay" · script v2, Nov 5

Thursday HOW TO (run of Thu Nov 5, 2026; the agreed 4-week calendar, W2; EP40's "your own test" made practical). Cast:
Ravi anna and the shop AI (his phone; in the episodes it runs the small 1.1 GB brain, EP39-41). Ravi is about to pay for
an AI plan; the shop AI makes him test first.
**The reach stack (Standing Rule):** stake: Ravi's own bill money; frame 1: the same bill, two free AIs, "₹428 ✗" vs
"₹518 ✓", readable with the sound off; injustice: the AI that "did every step right" would make him undercharge ₹90.
Line 1 says both numbers within 2 s.

## Our real run (pipeline/howto03/three_ais.py, series/scripts/howto03_demo/)
Committed before it ran (commit a6c8604). Three free AIs with open weights, the makers' own 4-bit files, llama.cpp on a
4-core computer, no graphics card, offline (an empty network namespace), temperature 0.7, a fresh chat per question, 3
tries each (seeds 1-3), every answer read by hand (`HAND`; the automatic mark was wrong 3 times).
Ravi's five questions, with the right answers written down first:
1. Bill: "3 kg rice at Rs 62 a kg, 2 litres oil at Rs 145 a litre and 6 eggs at Rs 7 each. What is the total?" → ₹518
2. GST: "Rs 1,180 including 18% GST. Price before GST, and the GST?" → ₹1,000 and ₹180
3. Reorder: "rice 12 kg, sugar 3 kg, oil 8 litres, dal 2 kg, salt 15 packets. I reorder anything below 5." → sugar, dal
4. Telugu: "a 2-line WhatsApp message in Telugu: closed this Sunday, open again Monday 7 am" → real Telugu saying that
5. Honest: "How much did my shop sell last Tuesday?" → it can't know (no figure)

| AI (licence, file) | bill | GST | reorder | Telugu | honest | right (of 15) | median per answer |
|---|---|---|---|---|---|---|---|
| Qwen2.5 1.5B (Apache 2.0, 1.12 GB) | 0 of 3 (₹428, ₹418, ₹428) | 3 | 2 | 0 | 3 | **8** | 11.5 s |
| Phi-3 mini, Microsoft (MIT, 2.39 GB) | 3 | 3 | 3 | 0 | 3 | **12** | 23.7 s |
| Qwen2.5 7B (Apache 2.0, 4.68 GB) | 3 | 3 | 3 | 0 | 3 | **12** | 36.5 s |

- The 1.5B wrote every line of the bill right (186, 290, 42) and added them wrong three times (428, 418, 428).
- Telugu: 0 of 9 (3 AIs × 3 tries). None wrote real Telugu sentences; two of the 7B's three replies end with an English
  "(Translation: The shop is closed this Sunday ... 7 am on Monday)" that its Telugu doesn't say (the third, a made-up
  "Transliteration").
- Phi-3 mini (2.39 GB) matched the 7B (4.68 GB) on Ravi's five (on our laptop it also answered in about two-thirds of the
  time; not said in the reel: the apps' speed is another matter).
- These are older small free models (2024), picked because they run on a laptop with no internet; the apps people pay for
  are bigger. What carries over is the method (on screen: "try yours"). Running them costs the laptop's time and power,
  no fee; not said as "₹0" in the reel.

## Facts and sources
- Licences and files, read on the models' own pages on Hugging Face (Nov 5, 2026): Qwen/Qwen2.5-1.5B-Instruct-GGUF and
  Qwen/Qwen2.5-7B-Instruct-GGUF, "license: apache-2.0"; microsoft/Phi-3-mini-4k-instruct-gguf, "license: mit".
- The method is the one the makers give developers (checked for EP40, Oct 27): OpenAI's model-selection guide, "Choose
  acceptance criteria before comparing models" and "Repeat the comparison across representative tasks"; Anthropic,
  "Design evals that mirror your real-world task distribution". Caption.
- No plan prices on screen (they differ by date and source); the caption says: check the price on the plan's own page.

## Hook options
1. **(kept)** Frame 1: the same bill, two free AIs, only the two sums, big: "186 + 290 + 42 = ₹428 ✗" and "= ₹518 ✓", a
   stamp "RAVI LOSES ₹90", Ravi yelling behind the counter. "Four twenty-eight, or five eighteen?! Same bill!"
2. Ravi's finger on "PAY ₹____/month" with a scoreboard "8 / 12 / 12 of 15" (no stake on screen, the price unverified:
   dropped).
3. The Telugu message with its English "translation" (the 7th beat instead).

## Script review (human-viewer, v1) and what changed
Sandeep would stop (hook 7), Priya less (6: small models failing sums isn't news, but "every line right, total wrong" is).
Both: step 4 contradicted itself (none passed Telugu, so "keep the one that passes" picks nothing, and the reel's own rule
says Ravi should pay); "of 15" and "0 of 9" came from nowhere (3 tries never said); "1.5B" next to "1.1 GB"; "zero of nine"
sounded like a claim about all AIs (ChatGPT writes Telugu); "saying it was right": it never said that; speed and "₹0" are
about a laptop, not the apps; the five questions and the 5×3 table can't be read on a phone; the payoff of the sum is
spent by 0:23. Priya: 2 of 3 Telugu replies say "Translation" (the third "Transliteration"); the guides say set the pass
rule first; the paid plan is never tested. Sandeep: "BEFORE YOU PAY" after a grocery bill read as paying the bill; who
loses the ₹90? Telugu: line 1 too long for 2 s; "కట్టే ముందు" (the banned root); "స్టెప్పులు" like dance steps; "కూడిక" a
textbook word; "ఇంకా తొందరగా" like "hurry up"; "నువ్వు ఏ బ్రెయిన్?"; the 2.4 GB one called "చిన్న ఫైలు" while "చిన్నది" is
the bad one. Changed: frame 1 only the two sums and "RAVI LOSES ₹90"; "Before you buy an AI plan" and the title "BEFORE YOU
PAY FOR AN AI PLAN"; step 1 adds the pass rule ("which ones it can't get wrong"); step 2 "three times, a new chat each
time" with "5 questions × 3 tries = 15"; step 3 is ticks only, the totals big, no seconds; the AIs are SMALL 1.1 GB, MIDDLE
2.4 GB, BIG 4.7 GB (names small); line 7 "These small free ones: zero of nine" and "an English 'translation' its Telugu
doesn't say"; line 9 "For bills and stock, the middle one tied the big one. For Telugu, none passed."; line 10 "So take
your Telugu question to the free apps. Pay only if none passes, and test the paid one the same way."; no speed or ₹0 in the
voice; the full table on the save card and in the caption; Telugu as noted (నాలుగొందల/ఐదొందల, కట్టేలోపు, స్టెప్స్, టోటల్,
ట్రాన్స్లేషన్, నీది ఏ బ్రెయిన్, చిన్నది/మధ్యది/పెద్దది); a hit on 428 and a drop before "zero of nine"; the caption ask about
the viewer's own work question.

## Build notes
- Stills: frame 1's header sat under the banner and the "RAVI LOSES ₹90" stamp covered Ravi's eyes (now on the counter);
  the Telugu screen's "0 of 9" overlapped the totals; step 4's header was clipped (it shrinks to fit); the save card still
  said "note the seconds" (now "the must-be-exact ones decide"); the bubble matches the line ("The big one wins?").
- English 62.7 s. Fish's line 7 put a stop in "an English translation. Its Telugu doesn't say." (the card carries it).
- Telugu: the first pass's spelling lists were too strict (good takes rejected, four tries a line): broad substrings,
  then every try re-judged.

## Script (English, v2) · ~60 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Four twenty-eight, or five eighteen?! [1] Same bill! | frame 1 as above |
| 2 | AI | Before you buy an AI plan, [1] test it on your own questions. Four steps. | HOW TO 03 · BEFORE YOU PAY FOR AN AI PLAN · 3 small free AIs: SMALL 1.1 GB · MIDDLE 2.4 GB · BIG 4.7 GB |
| 3 | AI | One: [2] five questions from your work. [1] Write the right answers first, and which ones it can't get wrong. | bill → ₹518 · GST → ₹1,000 + ₹180 · reorder → sugar, dal · Telugu message → real Telugu · last Tuesday's sales → "can't know"; "MUST BE EXACT: bill, GST" |
| 4 | AI | Two: [2] the same words to each AI, [1] three times, a new chat each time. | three chats, the bill typed in each; "5 questions × 3 tries = 15 answers each" |
| 5 | AI | Three: [2] mark every answer yourself. [1] Right or wrong. | ticks per question, totals SMALL 8/15 · MIDDLE 12/15 · BIG 12/15 |
| 6 | Ravi | The small one did every step right... [1] and added it wrong, three times! | "186 + 290 + 42 = 428 ✗"; tries 428 · 418 · 428 |
| 7 | AI | And the Telugu message? [1] These small free ones: zero of nine. / The big one even added an English "translation" its Telugu doesn't say. | its Telugu, then "(Translation: The shop is closed this Sunday...)", stamp "THE TELUGU DOESN'T SAY THIS"; "0 of 9 = 3 AIs × 3 tries" |
| 8 | Ravi | So, the big one wins? | |
| 9 | AI | Four: [2] keep the one that passes. / [1] For bills and stock, the middle one tied the big one. For Telugu, none passed. | MIDDLE 12/15 = BIG 12/15 (bills ✓); Telugu ✗ ✗ ✗ |
| 10 | AI | So take your Telugu question to the free apps. / [1] Pay only if none passes, and test the paid one the same way. | the save card |
| 11 | Ravi | Wait... which brain are YOU? | |
| 12 | AI | The small one. [1] Four twenty-eight. | "the shop AI: SMALL, 1.1 GB"; frame 1 (loops) |

## Script (Telugu, v2; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Ravi | నాలుగొందల ఇరవై ఎనిమిదా? ఐదొందల పద్దెనిమిదా?! [1] ఒకే బిల్లు! |
| 2 | AI | ఏ చాట్ బాట్ ప్లాన్ కైనా డబ్బులు కట్టేలోపు, [1] మీ సొంత ప్రశ్నలతో టెస్ట్ చేయండి. నాలుగు స్టెప్స్. |
| 3 | AI | ఒకటి: [2] మీ పనిలోంచి ఐదు ప్రశ్నలు. [1] సరైన జవాబులు మొదట రాసి పెట్టుకోండి, ఏవి తప్పు కాకూడదో కూడా. |
| 4 | AI | రెండు: [2] ప్రతి చాట్ బాట్ కీ అవే మాటలు, [1] మూడు సార్లు, ప్రతిసారీ కొత్త చాట్ లో. |
| 5 | AI | మూడు: [2] ప్రతి జవాబుకీ మీరే మార్కులు వేయండి. [1] కరెక్టా, తప్పా. |
| 6 | Ravi | చిన్నది ప్రతి స్టెప్ కరెక్ట్ గా చేసింది... [1] టోటల్ మాత్రం మూడు సార్లూ తప్పు! |
| 7 | AI | మరి తెలుగు మెసేజ్? [1] ఈ చిన్న ఫ్రీ చాట్ బాట్లు: తొమ్మిదికి సున్నా. / పెద్దది పైగా, దాని తెలుగులో లేనిదే ఇంగ్లీష్ ట్రాన్స్లేషన్ గా రాసింది. |
| 8 | Ravi | అంటే, పెద్దదే గెలుస్తుందా? |
| 9 | AI | నాలుగు: [2] మీ టెస్ట్ పాస్ అయినదే ఉంచుకోండి. / [1] బిల్లులకి, స్టాక్ కి, మధ్యది పెద్దదానితో సమానం. తెలుగుకి, ఏదీ పాస్ కాలేదు. |
| 10 | AI | ఆ తెలుగు ప్రశ్న ఫ్రీ యాప్స్ ని అడగండి. / [1] ఫ్రీ యాప్ ఒక్కటీ పాస్ కాకపోతేనే డబ్బులు కట్టండి, పెయిడ్ దాన్ని కూడా ఇలాగే టెస్ట్ చేయండి. |
| 11 | Ravi | ఒక్క నిమిషం... నీది ఏ బ్రెయిన్? |
| 12 | AI | చిన్నదే. [1] నాలుగొందల ఇరవై ఎనిమిది. |

Telugu notes: "మొదట", not "ముందుగా"/"ముందే"/"ముందు" (near a slur; "కట్టేలోపు"); "చాట్ బాట్" for the AIs; చిన్నది /
మధ్యది / పెద్దది for SMALL / MIDDLE / BIG all the way through; numbers mid-line or in their own phrase.

## Caption ask (caption only; the viewer's own experience, Bujji Nov 4)
What's one work question an AI got wrong for you? Drop it in the comments, we'll test it.

## Next HOW TO
HOW TO 04: What to never paste into an AI chat (Thu Nov 12).
