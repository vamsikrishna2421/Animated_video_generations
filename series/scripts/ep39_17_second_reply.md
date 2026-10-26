# EP39 "The 17-second reply" (Inference: speed, latency and cost per token) · script v1, Oct 26

**Slot:** queue 041, replaces the lesson-format `041_ep39_where_ai_costs_come_from.mp4`.
**Cast / setting:** Ravi anna's kirana shop, the shop AI (the student robot on his phone, calm, deadpan). Since EP38 the
AI runs on the shop's own laptop: the squeezed 7B brain (4.7 GB, five bags on an eight-bag counter), no internet needed.
**The AI's mistake:** a WhatsApp reply that takes 17 seconds; the customer at the counter gives up and walks off.
**Topic as plot:** the AI reads the whole message first (the wait before the first word: latency), then writes one
token (a piece of a word) at a time, and for every token it lifts every bag of its brain (EP38): 4 tokens a second on
this laptop. Online AIs on big graphics cards (EP36) write over 100 a second, but bill every token, and the tokens it
writes cost 4-8 times the tokens it reads. Rescue: ask for short replies (fewer tokens: faster and cheaper). Twist:
Ravi makes it read a month of old chat before every reply ("so you know her"): the reply is short, but the wait before
the first word grows to 92 seconds; the customer walks off again (loops to frame 1).
EP36 did CPU cores vs graphics cards; EP38 the counter (RAM). New here: tokens as the unit of time and money, the two
clocks (reading, then writing), price per token (writing costs more), and long prompts delaying the first word.

## Facts and sources (checked Oct 26, 2026)
- OpenAI API pricing (developers.openai.com/api/docs/pricing), Standard, per 1M tokens, input → output: gpt-5-mini
  $0.25 → $2.00 (8x), gpt-5.4-mini $0.75 → $4.50 (6x), gpt-4.1-mini $0.40 → $1.60 (4x), gpt-4o-mini $0.15 → $0.60 (4x).
- Google Gemini API pricing (ai.google.dev/gemini-api/docs/pricing), paid tier, per 1M tokens, input (text) → output:
  Gemini 2.5 Flash-Lite $0.10 → $0.40 (4x), Gemini 2.5 Flash $0.30 → $2.50 (8.3x), Gemini 3.6 Flash $0.75 → $3.75 (5x,
  through Dec 31, 2026). So "the tokens it writes cost about 4 to 8 times the tokens it reads" holds on both price lists.
- Artificial Analysis (independent benchmarks, artificialanalysis.ai, Oct 26, 2026): Gemini 2.5 Flash, non-reasoning,
  on Google's API: 198.1 tokens/s, first token after 0.37 s (its default workload: a 10,000-token prompt); the median for
  similar models: 96.4 tokens/s, 1.05 s. Gemini 3.5 Flash-Lite (reasoning): 413.8 tokens/s; the median for its price
  tier 116.2 tokens/s. On screen: "online AI: 100+ tokens a second" (attributed). Reasoning models wait longer before the
  first word (they think first): not in the skit.
- A token is a piece of a word; in English about 3/4 of a word on average (OpenAI's tokenizer page and help article:
  "1 token ≈ 4 characters ≈ 3/4 of a word"; both pages refused our fetch today, so the reel says only "a piece of a word"
  and shows real token splits from our test).
- OpenAI's GPT-4o tokenizer needs far fewer tokens for Telugu than GPT-4's: 159 → 45 for their sample sentence (OpenAI's
  "Hello GPT-4o" page, localized copy). Caption only.

## Our demo (pipeline/ep39/speed_demo.py, series/scripts/ep39_demo/)
EP38's shop job (EP36's WhatsApp order: "Anna, please send 2 kg rice, 1 litre sunflower oil, 6 eggs and 1 packet of tea
powder to flat 302.") on this machine (4 CPU cores, no graphics card), Qwen's own 4-bit files (q4_k_m) of
Qwen2.5-7B-Instruct (EP38's brain) and Qwen2.5-1.5B-Instruct, llama.cpp, greedy, context 4096, the reply streamed token
by token, 3 runs per test from an empty cache (median kept), the internet cut for every run (empty network namespace:
DNS and a direct connection both fail, only the loopback device).

| brain | test | prompt tokens | wait for the first token | whole reply | tokens written | writing speed |
|---|---|---|---|---|---|---|
| 7B | the reply (EP38's) | 91 | 4.26 s | 17.62 s | 58 | 4.3 tokens/s |
| 7B | + "Reply in 2 short lines." | 98 | 4.31 s | 11.65 s | 35 | 4.6 tokens/s |
| 7B | + a month of old chat first (30 orders) | 1,788 | 91.83 s | 101.55 s | 41 | 4.1 tokens/s |
| 7B | the reply in Telugu | 97 | 4.84 s | 67.07 s | 284 | 4.6 tokens/s |
| 1.5B | the reply | 91 | 1.01 s | 3.89 s | 55 | 18.7 tokens/s |
| 1.5B | + "Reply in 2 short lines." | 98 | 0.95 s | 2.15 s | 22 | 17.5 tokens/s |
| 1.5B | + a month of old chat first | 1,788 | 19.23 s | 21.65 s | 41 | 16.5 tokens/s |
| 1.5B | the reply in Telugu | 97 | 1.01 s | 22.12 s | 400 (the cap; it looped one word) | 18.9 tokens/s |

- The 7B's replies, word for word (greedy: all three runs the same). The reply (58 tokens): "Sure, Anna! Here's your
  order: - 2 kg rice - 1 litre sunflower oil - 6 eggs - 1 packet of tea powder. Your order will be delivered to flat 302
  within 30 minutes. Thanks for choosing us!" Short (35 tokens): "Sure, 2 kg rice, 1 litre sunflower oil, 6 eggs, and 1
  packet of tea powder. Delivery will be within 30 minutes." After the month of chat (41 tokens): "Sure! 2 kg rice, 1
  litre sunflower oil, 6 eggs, and 1 packet of tea powder will reach flat 302 within 30 minutes. Thank you!"
- Its token splits (Qwen2.5's tokenizer): "Sure" "," " Anna" "!" " Here" "'s" " your" " order" ":" ... " sun" "flower"
  ... " flat" " " "3" "0" "2" ...: numbers go one digit per token.
- The runs: reply 17.78 / 17.62 / 16.82 s; short 12.15 / 11.65 / 11.55 s; the month of chat: first token after 87.94 /
  91.96 / 91.83 s. The stream's chunks undercounted Telugu tokens (one chunk can hold several); the counts above are
  the replies re-split by the brain's own tokenizer (`--recount`).
- Reading is faster per token than writing (the prompt is read in one batch: about 21 tokens/s for the 7B here, 93 for
  the 1.5B), but a long prompt still means a long wait: every token of it is read before the first word.
- The same message (written by us in both languages): English 37 tokens, Telugu 69 on OpenAI's o200k_base tokenizer
  (GPT-4o's); 41 vs 184 on Qwen2.5's. Both small brains wrote broken Telugu (the 1.5B looped one word; the 7B mixed in
  made-up words). Caption: Telugu text costs more tokens, so it is slower and pricier per message.
- 4x smaller brain, about 4x faster writing (1.12 GB vs 4.68 GB file, 18.7 vs 4.3 tokens/s): every token reads the
  whole brain from memory (EP38's bags). Caption only (EP35 and EP41 cover choosing a brain).

## Hook options
1. **(kept)** Frame 1: the counter; a customer (an aunty with a cloth bag) turning to walk out; the phone held up to
   camera: WhatsApp, the order bubble, under it "AI is typing…" and a big stopwatch at 0:17. Ravi, arms up: "Seventeen
   seconds for one reply?! She walked off!"
2. A queue of five customers tapping their feet, the phone's "typing…" dots crawling, Ravi fanning the phone.
3. Ravi holding a long paper bill from an online AI: "₹ per token?!" (cost first).
Kept 1: a familiar pain (waiting on "typing…"), money walking out of the shop, and a number to explain.

## Script (English) · ~58 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Seventeen seconds for one reply?! [1] She walked off! | frame 1: the counter, the aunty turning away; the phone big: her order bubble, "AI is typing…", stopwatch 0:17; tag "EP39 · AI From Scratch" |
| 2 | AI | Four seconds to read the order. [1] Thirteen to write the reply. | insert: one bar, 17 s long: grey "READ 4 s", then on [1] orange "WRITE 13 s" (our test) |
| 3 | Ravi | Thirteen seconds to write that?! | the reply bubble, word for word |
| 4 | AI | I write one token at a time, anna. [1] A token is a piece of a word. | insert: the reply fills in token chips, "Sure · , · Anna · ! · Here · 's · your · order"; on [1] "1 token = a piece of a word", counter "58 tokens" |
| 5 | Ravi | Pieces?! [1] Write faster! | |
| 6 | AI | For every token, I lift all five bags. [1] On this laptop: four a second. | insert: EP38's five lilac bags on the counter, all five jump on each token tick; on [1] "4 tokens a second (our test, 4-core laptop)" |
| 7 | Ravi | The online AI replies in one second! | |
| 8 | AI | Big graphics cards. [1] And it bills you for every token. | insert: a server rack of graphics cards, "online AI: 100+ tokens a second (Artificial Analysis)"; on [1] a meter "₹ per token" ticking with each token |
| 9 | Ravi | Bills?! [1] For my words, or its words? | after the line, QUIZ card, 3-2-1 held 2 s: "Which tokens cost more?" A "the ones it reads (your message)" · B "the ones it writes (its reply)" · C "same price"; "comment A, B or C" |
| 10 | AI | The ones I write. [1] Four to eight times more. | the bed drops on the count's 1, a hit on "write", "B ✓"; on [1] the price chip: "per 1M tokens, read → write: GPT-5 mini $0.25 → $2.00 · Gemini 2.5 Flash-Lite $0.10 → $0.40" |
| 11 | Ravi | Then write less! [1] Two short lines! | Ravi types "Reply in 2 short lines." |
| 12 | AI | Thirty-five tokens. [1] Twelve seconds, and a smaller bill. | OUR TEST card: the short reply word for word; "58 tokens, 17.6 s → 35 tokens, 11.7 s"; then RULE chip, held: "SHORT REPLIES = FASTER + CHEAPER" · "type: Reply in 2 short lines." · "every token costs time; online, it costs money" |
| 13 | Ravi | Better! [1] Now read all her old chats first, so you know her! | Ravi scrolls a month of chat: "30 old orders = 1,788 tokens" |
| 14 | AI | Then I read the whole month [1] before my first word. | the READ bar grows and grows; the writing bar stays short |
| 15 | Ravi | How long?! | |
| 16 | AI | Ninety-two seconds. | the stopwatch spins to 1:32, "LATENCY: the wait before the first word"; the aunty walks off; the bed drops out; the stopwatch at 0:17 slams in = frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | ఒక్క రిప్లైకి పదిహేడు సెకన్లా?! [1] ఆవిడ వెళ్ళిపోయింది! | Okka reply ki padihedu secanlaa?! Aavida vellipoyindi! |
| 2 | AI | ఆర్డర్ చదవడానికి నాలుగు సెకన్లు. [1] రిప్లై రాయడానికి పదమూడు. | Order chadavadaaniki naalugu secanlu. Reply raayadaaniki padamoodu. |
| 3 | Ravi | అది రాయడానికి పదమూడు సెకన్లా?! | Adi raayadaaniki padamoodu secanlaa?! |
| 4 | AI | నేను ఒక్కో టోకెన్ రాస్తానండి. [1] టోకెన్ అంటే మాటలో ఒక ముక్క. | Nenu okko token raastaanandi. Token ante maatalo oka mukka. |
| 5 | Ravi | ముక్కలా?! [1] స్పీడ్ గా రాయి! | Mukkalaa?! Speed gaa raayi! |
| 6 | AI | ప్రతి టోకెన్ కీ ఐదు బస్తాలూ ఎత్తుతా. [1] ఈ ల్యాప్‌టాప్ లో సెకనుకు నాలుగు. | Prati token ki aidu bastaaloo ettutaa. Ee laptop lo secanuku naalugu. |
| 7 | Ravi | ఆన్‌లైన్ ఏఐ ఒక్క సెకనులో రిప్లై ఇస్తుంది! | Online AI okka secanulo reply istundi! |
| 8 | AI | పెద్ద గ్రాఫిక్స్ కార్డులు. [1] కానీ ప్రతి టోకెన్ కీ బిల్లు వేస్తుంది. | Pedda graphics cardulu. Kaanee prati token ki bill vestundi. |
| 9 | Ravi | బిల్లా?! [1] నా మాటలకా, దాని మాటలకా? | Billaa?! Naa maatalakaa, daani maatalakaa? |
| 10 | AI | నేను రాసేవాటికి. [1] నాలుగు నుంచి ఎనిమిది రెట్లు ఎక్కువ. | Nenu raasevaatiki. Naalugu nunchi enimidi retlu ekkuva. |
| 11 | Ravi | అయితే తక్కువ రాయి! [1] రెండు చిన్న లైన్లు! | Ayite takkuva raayi! Rendu chinna lainlu! |
| 12 | AI | ముప్పై ఐదు టోకెన్లు. [1] పన్నెండు సెకన్లు, బిల్లు కూడా తక్కువ. | Muppai aidu tokenlu. Pannendu secanlu, bill kooda takkuva. |
| 13 | Ravi | బాగుంది! [1] ఇప్పుడు ఆవిడ పాత చాట్లన్నీ ముందు చదువు, ఆవిడ గురించి తెలుస్తుంది! | Baagundi! Ippudu aavida paata chaatlannee mundu chaduvu, aavida gurinchi telustundi! |
| 14 | AI | అయితే నెల మొత్తం చదివాకే [1] నా మొదటి మాట. | Ayite nela mottam chadivaake naa modati maata. |
| 15 | Ravi | ఎంతసేపు?! | Enthasepu?! |
| 16 | AI | తొంభై రెండు సెకన్లు. | Tombhai rendu secanlu. |

## Caption ask (draft)
Every reply is counted in tokens (pieces of words): the AI reads your message first (the wait before the first word),
then writes one token at a time. Online AIs bill every token, and the ones they write cost 4-8x the ones they read. Ask
for short replies: "Reply in 2 short lines." (our test: 58 → 35 tokens, 17.6 → 11.7 s). And don't make it read what it
doesn't need: a month of old chat made our AI wait 92 s before the first word. Telugu: the same message took 69 tokens
vs 37 in English (GPT-4o's tokenizer), 184 vs 41 on our small open model's.
Next: EP40, how AI models are compared (benchmarks).
