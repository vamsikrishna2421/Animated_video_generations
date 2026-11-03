# Creative 16 "Happy Dad 60th Bir" · script v1, Nov 3 (the Nov 1 creative slot)

**Format:** a family birthday cake reveal (the lights go down, the family sings, the cake comes out), then the argument
around the cake; inserts of the AI chat, the AI's chunks, a test card and a rule card. New in the creative log (last 7
days: cricket commentary, a nature documentary, a projector classroom, an FM phone-in).
**Cast:** Thathayya (Ramana garu, turning 60), Harini atta (his daughter, a home baker who asked the AI for the cake
message), Bittu (her nephew, 12, counts on his fingers). New cast. The AI is an unbranded "AI chat" on her phone.
**AI idea:** a chat AI reads text in chunks (tokens), not letters, so it can't see how many letters it wrote and can't
count them. Ask it for the words; count the letters yourself.
**Bujji's notes applied:** frame 1 is the conflict with its proof (the cake: "HAPPY DAD 60TH BIR", "THDAY!" on the
table); the comment prompt is an opinion ask on the conflict; one ask only.

## Facts and sources (checked Nov 3, 2026)
- OpenAI Help Center, "What are tokens and how to count them?": models read text as tokens, pieces of words; a rule of
  thumb for English: 1 token ≈ 4 characters. (On screen we show our own model's real chunks instead.)
- The model's own tokenizer (Qwen2.5-7B-Instruct, read on this machine): "HAPPY 60TH BIRTHDAY NANNA" is 12 tokens:
  H · APP · Y · (space) · 6 · 0 · TH · ␣B · IRTH · DAY · ␣NAN · NA.

## Our demo (pipeline/creative16/cake_demo.py, series/scripts/creative16_demo/7B.json)
Committed before it ran. Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline, temperature 0.7,
10 replies each way, every reply read by hand.

| ask | result |
|---|---|
| "Write a message for my father's 60th birthday cake. The cake ... fits only 15 letters ... (spaces don't count)" | **0 of 10 fit**: 17 to 24 characters ("Happy dad 60th birthday!" = 21, 5 times) |
| "How many letters are in "HAPPY 60TH BIRTHDAY NANNA"? Don't count spaces." (22) | **0 of 10 right**: 14 (4 times) or 15 (6 times) |
| "Spell it one character per line, numbered, then give the total" (the fix people try) | **0 of 10 right**: totals 17 to 30; the lists themselves wrong ("BIRTHARDAY", "NANA") |

## Hook options
1. **(kept)** Frame 1: the cake under the party lights: icing "HAPPY DAD 60TH BIR" to the very edge, "THDAY!" dripped onto
   the table; Bittu reading it out: "Happy Dad 60th Bir... BIR?!"
2. Harini typing "under 15 letters" and the AI replying "Here's a 15-letter message: Happy dad 60th birthday!"
3. Thathayya blowing the candles, then squinting at "BIR".
Kept 1: the mistake is visible and said in frame 1; it is funny and a real family moment.

## Script (English) · ~50 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Bittu | Happy Dad sixtieth Bir... [1] BIR?! | frame 1: the cake "HAPPY DAD 60TH BIR", "THDAY!" on the table |
| 2 | Harini | The AI said it fits fifteen letters! | her phone: "Here's a short message: Happy dad 60th birthday!" |
| 3 | Thathayya | Sixty years old, [1] and I'm a Bir. |  |
| 4 | Bittu | Atta, it's twenty-one letters! [1] I counted! | Bittu counting on his fingers: 21 |
| 5 | Harini | But the AI counts better than me! |  |
| 6 | Bittu | It doesn't see letters. [1] It sees chunks. | the AI's chunks of "HAPPY 60TH BIRTHDAY NANNA": H·APP·Y·6·0·TH·B·IRTH·DAY·NAN·NA, "12 chunks, 22 letters" |
| 7 | Bittu | We asked a small free AI for a fifteen-letter message, ten times. / [1] Zero fit. | OUR TEST: a small free AI, offline · "fits only 15 letters" · 10 replies: 0 fit (17 to 24) |
| 8 | Harini | Then I'll make it count them! |  |
| 9 | Bittu | Tried that. "Happy sixtieth birthday Nanna"? / [1] It said fourteen. It's twenty-two. | count: 0 of 10 right (14 or 15; the truth 22) |
| 10 | Harini | Make it spell it out? |  |
| 11 | Bittu | Still wrong. [1] It spelled "birth-ar-day"! | spell it out first: 0 of 10 right · "BIRTHARDAY" |
| 12 | Thathayya | Ask the AI for the words. / [1] Count the letters yourself. | RULE: 1 the AI gives the words 2 YOU count the letters 3 too long? cut a word, count again |
| 13 | Thathayya | Now, cut the cake. [1] Bittu, read it again! |  |
| 14 | Bittu | Happy Dad sixtieth Bir— | the cake again: frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Bittu | హ్యాపీ డాడ్ సిక్స్టీయత్ బర్... [1] బర్?! |
| 2 | Harini | పదిహేను అక్షరాలే అని చాట్ బాట్ చెప్పింది! |
| 3 | Thathayya | అరవై ఏళ్ళకి, [1] నేను బర్ నా? |
| 4 | Bittu | అత్తా, అవి ఇరవై ఒక్క అక్షరాలు! [1] నేను లెక్కపెట్టా! |
| 5 | Harini | నాకంటే చాట్ బాట్ బాగా లెక్కపెడుతుంది కదా! |
| 6 | Bittu | అది అక్షరాలు చూడదు. [1] ముక్కలు ముక్కలుగా చూస్తుంది. |
| 7 | Bittu | ఒక చిన్న ఫ్రీ చాట్ బాట్ ని పదిహేను అక్షరాల మెసేజ్ పది సార్లు అడిగా. / [1] ఒక్కటి కూడా పట్టలేదు. |
| 8 | Harini | అయితే లెక్కపెట్టమని చెప్తా! |
| 9 | Bittu | అదీ చేశా: "హ్యాపీ సిక్స్టీయత్ బర్త్ డే నాన్న" లో ఎన్ని? / [1] పద్నాలుగు అంది. ఉన్నవి ఇరవై రెండు. |
| 10 | Harini | స్పెల్లింగ్ రాయమంటే? |
| 11 | Bittu | అదీ తప్పే. [1] "బర్తార్డే" అని రాసింది! |
| 12 | Thathayya | మాటలు చాట్ బాట్ ని అడుగు. / [1] అక్షరాలు నువ్వే లెక్కపెట్టు. |
| 13 | Thathayya | సరే, కేక్ కట్ చేద్దాం. [1] బిట్టూ, ఇంకోసారి చదువు! |
| 14 | Bittu | హ్యాపీ డాడ్ సిక్స్టీయత్ బర్— |

Telugu notes: no "ఏఐ" in voiced text ("చాట్ బాట్"); numbers mid-line; no word one slipped letter from a swear word (to
check on the transcripts).

## Comment prompt (an opinion on the conflict)
Would you let an AI write the message on a family cake? Yes or no, and why?
