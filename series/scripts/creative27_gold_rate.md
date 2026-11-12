# Creative 27 "₹5,000 for 10 Grams, Says the AI" · the Nov 12 creative slot · script v1

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

## Script (English; Mom, Chinnu, the AI on the phone) · ~48 s
| # | Who | Line | Picture |
|---|---|---|---|
| 1 | Mom | Five thousand rupees for ten grams, says the AI! [1] And your board says one lakh twenty-eight thousand?! | the phone on the glass, the board; the two prices |
| 2 | Chinnu | Mom, it's Divya's wedding necklace, not a fight. [1] Show me the phone. | the necklace on the velvet; he takes the phone |
| 3 | Chinnu | Read the next line: [1] "as of my last update in October 2023." | the chat, the line circled |
| 4 | Mom | So? Gold is gold! | |
| 5 | Chinnu | Even in 2023, ten grams was about fifty-five thousand. [1] It's three years old, and a zero short. | a card: 2023 ₹55,000 · AI ₹5,000 · today ₹1,28,150 |
| 6 | Mom | Then ask it today's date! | she types |
| 7 | AI | Today's date is: [1] current date. | the reply "Today's date is [current date]." |
| 8 | Chinnu | It has no calendar and no live rates. [1] We asked our AI ten times: nine times it said, "I can't see today's price." | the test card |
| 9 | Chinnu | When an answer says "as of my last update", [1] it's a memory, not a price. Today's price is on the board, with today's date. | the rule card; the board, "12 NOV 2026" |
| 10 | Mom | Fine. [1] But let me ask it once more... | she types again -> frame 1 |

## Script (Telugu; అమ్మ, చిన్ను, the AI in English)
| # | Who | Telugu |
|---|---|---|
| 1 | అమ్మ | పది గ్రాములకి ఐదు వేలు అంటోంది చాట్‌బాట్! [1] మీ బోర్డు మీద లక్షా ఇరవై ఎనిమిది వేలా?! |
| 2 | చిన్ను | అమ్మా, ఇది దివ్య పెళ్ళి నెక్లెస్, గొడవ కాదు. [1] ఫోన్ ఇవ్వు. |
| 3 | చిన్ను | కింద లైన్ చూడు: [1] అక్టోబర్, రెండు వేల ఇరవై మూడు నాటి సమాచారం అంట. |
| 4 | అమ్మ | అయితే ఏంటి? బంగారం బంగారమే! |
| 5 | చిన్ను | రెండు వేల ఇరవై మూడులో కూడా, పది గ్రాములు యాభై ఐదు వేలు. [1] మూడేళ్ల పాత లెక్క, పైగా ఒక సున్నా తక్కువ. |
| 6 | అమ్మ | అయితే ఈరోజు తేదీ ఎంతో అడుగు! |
| 7 | AI (English) | Today's date is: [1] current date. |
| 8 | చిన్ను | దానికి క్యాలెండర్ లేదు, లైవ్ రేట్లు లేవు. / [1] మా చాట్‌బాట్ ని పది సార్లు అడిగాం: తొమ్మిది సార్లు, ఈరోజు ధర నాకు తెలియదు అంది. |
| 9 | చిన్ను | జవాబులో లాస్ట్ అప్‌డేట్ అని ఉంటే, అది జ్ఞాపకం, ధర కాదు. / [1] ఈరోజు ధర బోర్డు మీద ఉంది, ఈరోజు తేదీతో. |
| 10 | అమ్మ | సరేలే. [1] కానీ ఇంకోసారి అడిగి చూస్తా... |

## Caption ask (a try-it test)
"Try it: ask any AI chat 'What's today's gold rate?' Does its answer show today's date and a source? Comment DATE or NO DATE."
