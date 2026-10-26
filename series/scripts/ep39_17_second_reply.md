# EP39 "The 17-second reply" (Inference: speed, latency and cost per token) · script v2.2 as rendered, Oct 26

**Slot:** queue 041, replaces the lesson-format `041_ep39_where_ai_costs_come_from.mp4`.
**Cast / setting:** Ravi anna's kirana shop, the shop AI (the student robot on his phone, calm, deadpan). Since EP38 the
AI runs on the shop's own laptop: the squeezed 7B brain (4.7 GB, five bags on an eight-bag counter), no internet needed.
It answers the shop's WhatsApp orders.
**The AI's mistake:** a WhatsApp reply that takes 17 seconds; the customer (Suresh, flat 302) gives up while it is still
"typing…": "Never mind. I'll order from the other shop."
**Topic as plot:** the AI reads the whole message first (the wait before the first word: latency), then writes one
token (a word or a piece of one) at a time, and for every token it lifts every bag of its brain (EP38): 4 tokens a
second on this laptop. Online AIs on big graphics cards (EP36) write about 200 a second, but a shop's bot pays for every
token, and the reply's tokens cost 4-8 times the message's. Rescue: ask for short replies (fewer tokens: faster here,
a smaller bill online). Twist: Ravi makes it read a month of old chat before every reply ("so you know him"): the reply
is short, but the wait before the first word grows from 4 to 92 seconds (the quiz); the customer cancels again (loop).
EP36 did CPU cores vs graphics cards; EP38 the counter (RAM). New here: tokens as the unit of time and money, the two
clocks (reading, then writing), price per token (the reply costs more), and long prompts delaying the first word.

## Facts and sources (checked Oct 26, 2026)
- OpenAI API pricing (developers.openai.com/api/docs/pricing), Standard, per 1M tokens, input → output: gpt-5-mini
  $0.25 → $2.00 (8x), gpt-5.4-mini $0.75 → $4.50 (6x), gpt-4.1-mini $0.40 → $1.60 (4x), gpt-4o-mini $0.15 → $0.60 (4x).
- Google Gemini API pricing (ai.google.dev/gemini-api/docs/pricing), paid tier, per 1M tokens, input (text) → output:
  Gemini 2.5 Flash-Lite $0.10 → $0.40 (4x), Gemini 2.5 Flash $0.30 → $2.50 (8.3x), Gemini 3.6 Flash $0.75 → $3.75 (5x,
  through Dec 31, 2026). So "the reply's tokens usually cost 4 to 8 times the message's" holds on both price lists. On
  screen: Gemini 2.5 Flash 8x, GPT-4.1 mini 4x (neither needs to think first; thinking models also bill their hidden
  thinking as output tokens: caption).
- One reply at those prices (our order: 91 tokens in, 58 out): Gemini 2.5 Flash $0.000172, GPT-4.1 mini $0.000129, so
  1,000 replies cost about ₹10-16 at any rate from ₹80 to ₹95 a dollar (on screen). Per reply the written part costs
  2.5-5x the read part for this order (per token 4-8x: the line says "a token it writes"). The short reply (98 in, 35
  out) cuts the bill 26-32%, not the 40% fewer written tokens. With the month of chat in front (1,788 in, 41 out):
  $0.00064-0.00078 a reply, 4-6x dearer: the month is paid for again on every reply (caption).
- ChatGPT's own plans are not billed per token; the API, which a shop's WhatsApp bot uses, is (caption).
- Artificial Analysis (independent benchmarks, artificialanalysis.ai, Oct 26, 2026): Gemini 2.5 Flash, non-reasoning,
  on Google's API: 198.1 tokens/s, first token after 0.37 s (its default workload: a 10,000-token prompt); the median for
  similar models: 96.4 tokens/s, 1.05 s. On screen: "Gemini 2.5 Flash: about 200 tokens a second (Artificial Analysis)".
- A token is a word or a piece of one; in English about 3/4 of a word on average (OpenAI's tokenizer page and help
  article: "1 token ≈ 4 characters ≈ 3/4 of a word"; both refused our fetch today, so the reel shows our own splits).
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
- The 1.5B's short reply (22 tokens, 2.15 s) dropped the quantities: "Confirmed, rice, sunflower oil, eggs, and tea
  powder will be delivered within 30 minutes." (on the test card: faster, but sloppier).
- Its token splits (Qwen2.5's tokenizer): "Sure" "," " Anna" "!" " Here" "'s" " your" " order" ":" ... " sun" "flower"
  ... " flat" " " "3" "0" "2" ...: numbers go one digit per token.
- The runs: reply 17.78 / 17.62 / 16.82 s; short 12.15 / 11.65 / 11.55 s; the month of chat: first token after 87.94 /
  91.96 / 91.83 s. The stream's chunks undercounted Telugu tokens (one chunk can hold several); the counts above are
  the replies re-split by the brain's own tokenizer (`--recount`).
- Reading is faster per token than writing (the prompt is read in one batch: about 20 tokens/s for the 7B here, 93 for
  the 1.5B), but a long prompt still means a long wait: every token of it is read before the first word. The month of
  chat is 1,788 tokens, 20 times the order.
- The same message (written by us in both languages): English 37 tokens, Telugu 69 on OpenAI's o200k_base tokenizer
  (GPT-4o's); 41 vs 184 on Qwen2.5's. Both small brains wrote broken Telugu (the 1.5B looped one word; the 7B mixed in
  made-up words). Caption: Telugu text costs more tokens, so it is slower and pricier per message.
- 4x smaller brain, about 4x faster writing (1.12 GB vs 4.68 GB file, 18.7 vs 4.3 tokens/s): every token reads the
  whole brain from memory (EP38's bags). Test card and caption only (EP35 and EP41 cover choosing a brain).

## Hook options
1. **(kept, v2)** Frame 1: Ravi at the counter, arms up; over him the WhatsApp chat: Suresh's order, "Shop AI is
   typing…" with a big stopwatch at 0:17, and Suresh's next bubble: "Never mind. I'll order from the other shop." Ravi:
   "Seventeen seconds for one reply?! He cancelled!"
2. A queue of five customers tapping their feet, the phone's "typing…" dots crawling, Ravi fanning the phone.
3. Ravi holding a long paper bill from an online AI: "₹ per token?!" (cost first).
Kept 1: a familiar pain (waiting on "typing…"), money leaving the shop, and a number to explain.

## Viewer notes on v1 and what changed (v2)
- Both: the hook stops them; the twist lands ("so you know her" is exactly what Sandeep would do); the growing READ bar
  explains it. Must-fix: the customer at the counter was waiting on a delivery order: now the WhatsApp customer cancels
  in the chat ("Never mind. I'll order from the other shop."), and he is a man, so the AI's real reply "Sure, Anna!"
  fits.
- Both: the laptop bills nothing, so "the ones I write" and "a smaller bill" were wrong: line 8 "But online, every token
  costs money", line 10 "Both. The reply costs four to eight times more", line 12 "Twelve seconds here. Online, a
  smaller bill."
- Both: the 12 s is still slow: the test card says so and names the faster options (the small 1.5B brain: 2.2 s, but it
  dropped the quantities; online: about a second).
- Both: the price chip: "8x" and "4x" big, the dollar prices small, plus "about 1-2 paise a reply (online)". Priya:
  name the model: "Gemini 2.5 Flash: about 200 tokens a second (Artificial Analysis)", and on the price chip models that
  don't bill hidden thinking.
- Sandeep: "a piece of a word" but "Sure", "your", "order" are whole words: line 4 "A word, or a piece of one", with
  "sun·flower = 2 tokens" and "3·0·2 = 3 tokens" big.
- Both: the money quiz gave itself away (writing took 13 s, so B). The quiz moves to the twist: "How long before its
  first word?" A 4 seconds · B 30 seconds · C over a minute, held after "How long?!"; the answer is "Ninety-two seconds".
- Priya: one stopwatch, one thing: line 2's grey bar is labelled "LATENCY: the wait before the first word = 4 s"; the
  twist grows that same grey bar from 4 s to 92 s and its stopwatch reads "first word"; the label stays up.
- Sandeep: "1,788 tokens, big or small?": "30 old orders = 1,788 tokens, 20x the order".
- Sound: a stopwatch click on frame 1, one bonk per token on the bags (4 a second, so you hear how slow it is), the bed
  out before "Ninety-two seconds", room to read the price chip (a pause after line 10).
- Telugu: "పాత మెసేజ్లన్నీ" (not "చాట్లన్నీ", heard "old chaats"), "సెకనుకు నాలుగు టోకెన్లు", line 10 "రెండిటికీ" (both), no
  bill for the laptop.

## Script (English) · ~58 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Seventeen seconds for one reply?! [1] He cancelled! | frame 1: Ravi at the counter, arms up; the WhatsApp card over him: "Suresh · flat 302", his order, "Shop AI is typing…", the stopwatch at 0:17, his bubble "Never mind. I'll order from the other shop."; tag "EP39 · AI From Scratch" |
| 2 | AI | Four seconds to read his order. [1] Thirteen to write the reply. | insert: one bar, 17.6 s long: grey "READ" with "LATENCY = the wait before the first word: 4 s", then on [1] orange "WRITE 13 s" (our test) |
| 3 | Ravi | Thirteen seconds to write that?! | the reply bubble, word for word |
| 4 | AI | I write one token at a time, anna. [1] A word, or a piece of one. | insert: the reply fills in token chips, "Sure · , · Anna · ! · Here · 's · your · order"; on [1] "sun·flower = 2 tokens", "3·0·2 = 3 tokens" ringed, counter "58 tokens" |
| ~~5~~ | ~~Ravi~~ | ~~Pieces?! Write faster!~~ (cut in render review 2 for the spoken fix) | |
| 6 | AI | For every token, I lift all five bags. [1] On this laptop: four tokens a second. | insert: EP38's five lilac bags on the counter, all five jump on each token (a bonk each, 4 a second); on [1] "4 tokens a second (our test)" |
| 7 | Ravi | The online AI replies in one second! | |
| 8 | AI | Big graphics cards: two hundred tokens a second. [1] But online, every token costs money. | insert: a rack of graphics cards, "Gemini 2.5 Flash: about 200 tokens a second (Artificial Analysis)"; on [1] a bill counting tokens |
| 9 | Ravi | Money?! [1] For my message, or its reply? | |
| 10 | AI | Both, [1] and a token it writes costs four to eight times more. | the price chip: "your message 1×" → "its reply" "8×" (Gemini 2.5 Flash) and "4×" (GPT-4.1 mini) big, dollar prices small; "about 1-2 paise a reply"; a pause to read it |
| 11 | Ravi | Then write less! [1] Two short lines! | RULE chip: "ASK FOR SHORT REPLIES" · "type: Reply in 2 short lines." · "fewer tokens: faster here" · "and a smaller bill online" |
| 12 | AI | Thirty-five tokens. [1] Twelve seconds here. Online, a smaller bill. | OUR TEST card: before "58 tokens · 17.6 s", the short reply word for word, after "35 tokens · 11.7 s"; "still slow on a laptop: the small 1.5B brain 2.2 s, but it dropped the quantities · online about 1 s" |
| 13 | Ravi | Better! [1] Now read all his old chats first, so you know him! | Ravi scrolls a month of chat: "30 old orders = 1,788 tokens, 20× the order" |
| 14 | AI | A whole month? [1] I read it all before my first word. | the grey READ bar grows; the stopwatch reads "first word" |
| 15 | Ravi | How long?! | after the line, QUIZ card, 3-2-1 held 2 s: "How long before its first word?" A "4 seconds" · B "30 seconds" · C "over a minute"; "comment A, B or C" |
| 16 | AI | Ninety-two seconds. | out of silence (the bed out on the count's 1); "C ✓ 92 s", the stopwatch at 1:32, "first word: 4 s → 92 s", "LATENCY"; a hit just after the words |
| 17 | AI | Give me a two-line note about him, [1] not the whole month. | "THE FIX: a 2-line note about him, not the month"; the bed swells; then the chat slams back in, "Never mind…" = frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | ఒక్క రిప్లైకి పదిహేడు సెకన్లా?! [1] ఆర్డర్ క్యాన్సిల్ చేశారు! | Okka reply ki padihedu secanlaa?! Order cancel chesaaru! |
| 2 | AI | ఆర్డర్ చదవడానికి నాలుగు సెకన్లు. [1] రిప్లై రాయడానికి పదమూడు. | Order chadavadaaniki naalugu secanlu. Reply raayadaaniki padamoodu. |
| 3 | Ravi | అది రాయడానికి పదమూడు సెకన్లా?! | Adi raayadaaniki padamoodu secanlaa?! |
| 4 | AI | నేను ఒక్కో టోకెన్ రాస్తానండి. [1] ఒక మాట, లేదా మాటలో చిన్న ముక్క. | Nenu okko token raastaanandi. Oka maata, ledaa maatalo chinna mukka. ("ఒక ముక్క" smeared) |
| ~~5~~ | ~~Ravi~~ | ~~ముక్కలా?! స్పీడ్ గా రాయి!~~ (cut, as English) | |
| 6 | AI | ప్రతి టోకెన్ కీ ఐదు బస్తాలూ ఎత్తుతా. [1] ఈ ల్యాప్‌టాప్ లో సెకనుకు నాలుగు టోకెన్లు. | Prati token ki aidu bastaaloo ettutaa. Ee laptop lo secanuku naalugu tokenlu. |
| 7 | Ravi | ఆన్‌లైన్ లో అయితే ఒక్క సెకనులోనే రిప్లై వస్తుంది! | Online lo ayite okka secanulone reply vastundi! ("ఏయ్ ఐ" came out stretched) |
| 8 | AI | పెద్ద గ్రాఫిక్స్ కార్డులు, సెకనుకు రెండొందల టోకెన్లు. [1] కానీ ఆన్‌లైన్ లో ప్రతి టోకెన్ కీ డబ్బులు. | Pedda graphics cardulu, secanuku rendondala tokenlu. Kaanee online lo prati token ki dabbulu. |
| 9 | Ravi | డబ్బులా?! [1] నా మెసేజ్ కా, దాని రిప్లై కా? | Dabbulaa?! Naa message kaa, daani reply kaa? |
| 10 | AI | రెండిటికీ. [1] అది రాసే ప్రతి టోకెన్ కీ నాలుగు నుంచి ఎనిమిది రెట్లు ఎక్కువ. | Renditikee. Adi raase prati token ki naalugu nunchi enimidi retlu ekkuva. |
| 11 | Ravi | అయితే తక్కువ రాయి! [1] రెండు చిన్న లైన్లు! | Ayite takkuva raayi! Rendu chinna lainlu! |
| 12 | AI | ముప్పై ఐదు టోకెన్లు. [1] ఇక్కడ పన్నెండు సెకన్లు, ఆన్‌లైన్ లో బిల్లు తక్కువ. | Muppai aidu tokenlu. Ikkada pannendu secanlu, online lo bill takkuva. |
| 13 | Ravi | బాగుంది! [1] ఇప్పుడు ఆయన పాత మెసేజ్‌లన్నీ ముందు చదువు, ఆయన గురించి తెలుస్తుంది! | Baagundi! Ippudu aayana paata messagelannee mundu chaduvu, aayana gurinchi telustundi! |
| 14 | AI | నెల మొత్తమా? [1] అదంతా చదివాకే నా మొదటి మాట. | Nela mottamaa? Adantaa chadivaake naa modati maata. |
| 15 | Ravi | ఎంతసేపు?! | Enthasepu?! |
| 16 | AI | తొంభై రెండు సెకన్లు. | Tombhai rendu secanlu. |
| 17 | AI | ఆయన గురించి రెండు లైన్ల నోట్ ఇవ్వండి, [1] నెల మొత్తం కాదు. | Aayana gurinchi rendu lainla note ivvandi, nela mottam kaadu. |

Telugu notes: the voiced text has no zero-width joiners (Parler trips on them): "ఆన్లైన్", "ల్యాప్టాప్", "మెసేజ్లన్నీ".

## Caption ask (draft)
Every AI reply is counted in tokens (a word or a piece of one): it reads your whole message first (the wait before the
first word: latency), then writes one token at a time. Online, a shop's bot pays for every token, and the reply's
tokens usually cost 4-8x the message's (about 1-2 paise a reply). Ask for short replies: "Reply in 2 short lines." (our
test: 58 → 35 tokens, 17.6 → 11.7 s). And don't make it read what it doesn't need: a month of old chat made our AI wait
92 s before the first word (online you'd pay for that month on every reply). Remember a regular customer with a 2-line
note, not the whole chat. Telugu: the same message took 69 tokens vs 37 in English (GPT-4o's tokenizer), 184 vs 41 on
our small open model's.
Next: EP40, how AI models are compared (benchmarks).

## Render review 1 (English) and what changed (v2.1)
- Both: the twist is the best part, but the running stopwatch gave the quiz away (0:59 "still reading" = over a minute):
  the digits now read "?:??" until "Ninety-two seconds"; the 1:32 is held 1.2 s after the line, with the fix on screen
  ("a 2-line note about him, not the month"), before the chat slams back in.
- Both: the test card was a wall of numbers: now two big rows (58 tokens · 17.6 s, 35 tokens · 11.7 s) and one big line
  "still slow on a laptop / online: about 1 s"; the small brain is named by size (1.1 GB) like the 4.7 GB one.
- Priya: "40% fewer tokens" counted only the reply (the bill falls 26-32%): the row is gone; "the reply costs 4-8x" was
  per token: line 10 now "Both, and a token it writes costs four to eight times more"; the card says "price of ONE
  token" and shows "1,000 replies: about ₹10-16" (Sandeep: a cost I can feel).
- Both: the music sank under every line and jumped up in each gap (pumping), and never built: the bed eases over 0.3 s
  around each line (reel_build/Reel.tsx `musicDuckRamp`, opt-in), the gap level is lower (0.66, gap gain 1.5 dB), the
  scenes step up (1.25, 1.35), and the last scene sits 10-12 dB under the voices (1.55 + a rise had left its lines 5-8
  dB over the bed: the Telugu pack's speech-to-text lost every word there). The quiz's ticks and riser stop on the
  count's "1", so "Ninety-two" comes out of silence; the hit lands just after the line; the bed swells under the held
  1:32 into the slam (musicEndRamp from 96.5%).
- Telugu (first pack): "ఏయ్ ఐ" stretched into "aaa-ee ai": Ravi's line 7 is now "ఆన్లైన్ దాంట్లో ఒక్క సెకనులోనే రిప్లై
  వస్తుంది!"; line 10 as the English ("అది రాసే ప్రతి టోకెన్ కీ..."). Two Telugu lines run a little faster and the middle
  scene's tail is 0 to keep 59.7 s.

## Render review 2 (English and Telugu) and what changed (v2.2)
- Both: the fixes landed ("?:??" made the quiz real, both cards readable, the per-token wording right, no pumping).
  Left: the answer to "so what should Ravi do?" flashed past unsaid, and the middle stayed flat until the quiz. Now the
  AI says it (line 17, "Give me a two-line note about him, not the whole month.", with THE FIX card); line 5 ("Pieces?!
  Write faster!") is cut to keep 59.9 s; the twist's bed is 2 dB up (boost 1.5, the lines still 8.4-14.6 dB over it)
  and swells from "Ninety-two seconds" into the slam; the stopwatch ticks through the 0:03 lull.
- Telugu ear-check (each line's span of the final mix transcribed on its own): line 2 wobbled on "రాయడానికి" (re-voiced
  with a stutter check), line 4 "ఒక ముక్క" smeared ("చిన్న ముక్క" now), line 7 "ఆన్లైన్ లో అయితే" (Sandeep) at a calmer pace.
- Nice-to-haves done: "online: ~1 s, bill ~30% less" on the test card, the test card's header clear of the banner,
  LATENCY bigger on the first bar, the 3-0-2 ring only once its chips are on screen.
