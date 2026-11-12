# Creative 27 "₹5,000 for 10 Grams, Says the AI" · the Nov 12 creative slot · script v2

## The format and the point
A two-character skit at a jewellery counter (the last creative was the devotional pilot, the last episode a
tutorial, so a skit is allowed). Amma (Mom on the English page) and her son Chinnu are buying the necklace for his
sister Divya's wedding; the jeweller says nothing and points at his rate board. Point family I, "out of date": an
AI's answer has a date. The usable idea: when an answer says "as of my last update...", it's a memory, not a price;
for anything that changes daily, read the date line, or check a live rate that shows today's date.

## Bujji's notes applied
- Frame 1, the strongest pair shape so far (EP47's "₹1,600 vs ₹1", 66.3%): two prices for the same thing, readable
  with the sound off: "THE AI: ₹5,000" vs "THE BOARD: ₹1,28,150" for 10 g of 22-carat gold. A family stake (a wedding
  necklace), an injustice (Mom accuses an honest jeweller because of the AI), the AI as the culprit.
- No opinion ask (0-for-7): the caption carries a try-it test.

## Facts (checked Nov 12, 2026)
- Today's 22-carat rate: ₹1,28,150 per 10 g (Groww, "Gold Rate Today in India (12 Nov 2026)"; Goodreturns, "Gold Rate
  Today (12 November 2026)"); 5paisa ₹1,30,140 ("As on 12 November, 2026"). 24-carat ₹1,39,800 (Groww, Goodreturns).
- October 2023: 22-carat about ₹52,870-57,410 per 10 g (Business Standard, Oct 16, 2023: Rs 55,410; Oct 30, 2023:
  Rs 57,410; Kalinga TV, Oct 2, 2023: Rs 52,870). So the AI's "₹4,500-5,000 for 10 g" was wrong even for 2023.

## Our test (pipeline/creative27/gold_demo.py, series/scripts/creative27_demo/gold.json; committed before it ran)
A small free AI on our computer with no web search (Qwen2.5-7B-Instruct, 4-bit, llama.cpp), temperature 0.7, a fresh
chat each time, 10 tries each:
- "What is the price of 10 grams of 22-carat gold in India today?": 9 of 10 gave no price ("I would need to access
  real-time market data", "check a reliable source"); 1 of 10 (try 8): "as of my last update in October 2023, the price
  per gram of 22-carat gold in India is typically around INR 450 to INR 500 ... 10 grams would be approximately INR
  4,500 ... INR 5,000", then "these prices are illustrative and may not reflect current market values".
- With "Before you answer, tell me the date your information is from.": 8 of 10 no price, several "my last update was
  in 2023"; 1 of 10 "INR 350,000 - INR 400,000" (too high); 1 of 10 "around ₹[Price]".
- "What is today's date?": 9 of 10 "Today's date is [current date]" (or "[today's date]"), with a note to check your
  device; 1 of 10 "I don't have real-time capabilities to provide today's exact date."

## Hook options
1. **(v1)** The jewellery counter, Mom slaps her phone on the glass: "THE AI: ₹5,000" vs "THE BOARD: ₹1,28,150", "10 g ·
   22-carat gold · TODAY"; the jeweller's eyebrows; line 1 both numbers within 2 s.
2. The phone: "Today's date is [current date]." Funny, but no stake.
3. Chinnu reading "as of my last update in October 2023": the answer before the question.

## Script review (human-viewer, v1) and what changed (v2)
Both would watch it through (Amma at the counter is "my house"; "బంగారం బంగారమే!" and "ఒక సున్నా తక్కువ" land), but: the AI
wasn't named, so it read as "all AI" (their own apps know the date and search); the script hid that the AI warned her
twice (its first line says "check a local or online gold dealer", its last "these prices are illustrative"); the
1-in-10 wasn't told; the payoff read as "trust the shop"; "[current date]" needs to read without sound.
Changed (v2): "a small free AI, no web search" on every chat screen and said in line 8; line 3 reads its real first line
("check a local gold dealer. You're at one."); line 9 "We asked it ten times. Nine times: 'check today's rate.' Once,
it guessed. You got the once."; line 10 "Check a live rate with today's date: it matches the board." (a live rate page,
12 Nov 2026, ₹1,28,150, beside the board); "[current date]" big and held, the bed out under it; a beat before "a zero
short" and "you got the once"; Telugu "ఫోన్ ఇవ్వమ్మా", "మరి ఈరోజు తేదీ", "పాత లెక్క" (not జ్ఞాపకం). The caption adds: an app that
searches the web should show today's date and a source; check for both.

## Script (English, v2)
| # | Who | Line |
|---|---|---|
| 1 | amma | Five thousand rupees for ten grams, says the AI! [1] And your board says one lakh twenty-eight thousand?! |
| 2 | chinnu | Mom, it's Divya's wedding necklace, not a fight. [1] Show me. |
| 3 | chinnu | Its first line: [1] "check a local gold dealer." You're at one. |
| 4 | amma | But then it says [1] five thousand! |
| 5 | chinnu | "As of my last update in October 2023." [1] Even then, ten grams was about fifty-five thousand. / [2] A zero short! |
| 6 | amma | Then ask it today's date! |
| 7 | ai | Today's date is: [1] current date. |
| 8 | chinnu | This one's a small free AI with no internet: [1] no calendar, no live rates. |
| 9 | chinnu | We asked it ten times. [1] Nine times: "check today's rate." Once, it guessed. / [2] You got the once. |
| 10 | chinnu | "As of my last update" means a memory, not a price. [1] Check a live rate with today's date: it matches the board. |
| 11 | amma | Fine. [1] But let me ask it once more... |

## Script (Telugu, v2; the AI in English)
| # | Who | Telugu |
|---|---|---|
| 1 | amma | పది గ్రాములకి ఐదు వేలు అంటోంది చాట్‌బాట్! [1] మీ బోర్డు మీద లక్షా ఇరవై ఎనిమిది వేలా?! |
| 2 | chinnu | అమ్మా, ఇది దివ్య పెళ్ళి నెక్లెస్, గొడవ కాదు. [1] ఫోన్ ఇవ్వమ్మా. |
| 3 | chinnu | మొదటి లైనే చూడు: [1] దగ్గర్లో బంగారం షాప్ లో కనుక్కోండి, అంటోంది. నువ్వు ఉన్నది అక్కడే. |
| 4 | amma | కానీ తర్వాత [1] ఐదు వేలు అంది కదా! |
| 5 | chinnu | అది అక్టోబర్ రెండు వేల ఇరవై మూడు నాటి లెక్క. [1] అప్పుడు కూడా పది గ్రాములు యాభై ఐదు వేలు. / [2] ఒక సున్నా తక్కువ! |
| 6 | amma | మరి ఈరోజు తేదీ ఎంతో అడుగు! |
| 7 | ai | Today's date is: [1] current date. |
| 8 | chinnu | ఇది ఇంటర్నెట్ లేని చిన్న ఫ్రీ చాట్‌బాట్: [1] క్యాలెండర్ లేదు, లైవ్ రేట్లు లేవు. |
| 9 | chinnu | పది సార్లు అడిగాం. [1] తొమ్మిది సార్లు, ఈరోజు రేట్ చూసుకోండి అంది. ఒక్కసారే ఊహించింది. / [2] నీకు వచ్చింది అదే. |
| 10 | chinnu | లాస్ట్ అప్‌డేట్ అంటే, అది పాత లెక్క, ఈరోజు ధర కాదు. / [1] ఈరోజు తేదీ ఉన్న లైవ్ రేట్ చూడు: బోర్డు తో సరిపోతుంది. |
| 11 | amma | సరేలే. [1] కానీ ఇంకోసారి అడిగి చూస్తా... |

## Caption ask (a try-it test)
"Try it: ask your AI app 'What's today's 22-carat gold rate?' Does the answer show today's date and a source? Comment DATE or NO DATE."
