# Creative 16 "Happy Dad 60th Bir" · script v2, Nov 3 (the Nov 1 creative slot)

**Format:** a family birthday cake reveal (the lights go down, the family sings, the cake comes out), then the argument
around the cake; inserts of the AI chat, the AI's chunks, a test card and a rule card. New in the creative log (last 7
days: cricket commentary, a nature documentary, a projector classroom, an FM phone-in).
**Cast:** Thathayya (Ramana garu, turning 60), Harish mama (his son, who asked the AI for the cake message), Bindu (his
niece, 13, counts on her fingers). New cast (Harini and Bittu became Harish and Bindu so the three Telugu voices differ:
Parler has one female Telugu speaker). The AI is an unbranded "AI chat" on her phone.
**AI idea:** a chat AI reads text in chunks (tokens), not letters, so it can't see how many letters it wrote and can't
count them. Ask it for the words; count the letters yourself.
**Bujji's notes applied:** frame 1 is the conflict with its proof (the cake: "HAPPY DAD 60TH BIR", "THDAY!" on the
table); the comment prompt is an opinion ask on the conflict; one ask only.

## Facts and sources (checked Nov 3, 2026)
- OpenAI Help Center, "What are tokens and how to count them?": models read text as tokens, pieces of words; a rule of
  thumb for English: 1 token ≈ 4 characters. (On screen we show our own model's real chunks instead.)
- The model's own tokenizer (Qwen2.5-7B-Instruct, read on this machine): "HAPPY 60TH BIRTHDAY NANNA" is 12 tokens:
  H · APP · Y · (space) · 6 · 0 · TH · ␣B · IRTH · DAY · ␣NAN · NA. The cake text "HAPPY DAD 60TH BIRTHDAY!" is 13
  tokens for 21 characters: H · APP · Y · ␣D · AD · ␣ · 6 · 0 · TH · ␣B · IRTH · DAY · !; "HAPPY 60TH NANNA" is 14 characters.

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

## Script review (human-viewer, v1) and what changed
Both stopped on frame 1 (hook 9 and 7) and would share it (family and office groups). Both: "chunks" needed one concrete
picture; the three "zero of ten" tests in a row dragged (~25 s); number slips: "12 chunks" over a strip of 11 (the space
token was missing), letters vs characters, the DAD cake vs the NANNA test phrase, "sixtieth" vs "60TH", "it said
fourteen" when 6 of 10 said 15; the loop repeated the reading. Priya: it never said "15", he told it 15; tokenize the cake
text itself; say we didn't test the big apps. Sandeep: a comment prompt to argue over ("whose fault?"); no birthday song
over the voice. Changed: line 6 "It doesn't see letters. To it, I-R-T-H is one sticker." over the cake text's real chunks
(13 chunks · 21 characters, with the space tokens shown as ␣); the count and spell tests are one beat ("it said fourteen
or fifteen. It's twenty-two. And it spelled birth-ar-day!"); line 2 "I told the AI: fifteen letters!"; line 4 "it's
twenty-one!" (21 characters); "not the big apps" on the test card; the rule card shows the fix ("HAPPY 60TH NANNA = 14 ✓
fits"); the reel ends on "Bindu, read it again!" and cuts straight to frame 1; the comment prompt asks whose fault it is.
Telugu: "అది పదాల్ని ముక్కలుగా చూస్తుంది, అక్షరాలుగా కాదు" (not "ముక్కలు ముక్కలుగా", heard as chopping); "పది సార్లు
అడిగా, పదిహేను అక్షరాల మెసేజ్ ఇవ్వమని" (fifteen and ten apart); "బర్ అయిపోయానా?".

## Script (English) · ~45 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Bindu | Happy Dad sixtieth Bir... [1] BIR?! | frame 1: the party, the cake "HAPPY DAD / 60TH BIR", "THDAY!" dripped onto the board; "the cake fits 15 letters" |
| 2 | Harish | I told the AI: fifteen letters! [1] It gave me this! | his AI chat: "...The cake fits only 15 letters." → "Happy dad 60th birthday!"; "21, not 15" |
| 3 | Thathayya | Sixty years old, [1] and I'm a Bir. |  |
| 4 | Bindu | Mama, it's twenty-one! [1] I counted! | "21!" · H·A·P·P·Y·D·A·D·6·0·T·H·B·I·R·T·H·D·A·Y·! |
| 5 | Harish | But the AI counts better than me! |  |
| 6 | Bindu | It doesn't see letters. [1] To it, I-R-T-H is one sticker. | WHAT THE AI SEES: H · APP · Y · ␣D · AD · ␣ · 6 · 0 · TH · ␣B · IRTH · DAY · ! · "13 chunks · 21 characters" · "IRTH is one sticker: it never sees I-R-T-H" |
| 7 | Bindu | I asked a small free AI for a fifteen-letter message, ten times. / [1] Zero fit. | OUR TEST: a small free AI, offline · not the big apps · "...fits only 15 letters" · 10 tries: 0 of 10 fit · 17 to 24 characters |
| 8 | Harish | Then I'll make it count them! |  |
| 9 | Bindu | Tried that: it said fourteen or fifteen. / [1] It's twenty-two. And it spelled birth-ar-day! | "How many letters in HAPPY 60TH BIRTHDAY NANNA?": it said 14 or 15 (10 of 10) · the real count 22 · spelled out first: "BIRTHARDAY" |
| 10 | Thathayya | Ask the AI for the words. / [1] Count the letters yourself. | A CAKE, A FORM, A BIO? the AI: the words · YOU: the count · "HAPPY 60TH NANNA" 14 ✓ fits |
| 11 | Thathayya | Now, cut the cake! [1] Bindu, read it again! | → frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Bindu | హ్యాపీ డాడ్ సిక్స్టీయత్ బర్... [1] బర్?! |
| 2 | Harish | పదిహేను అక్షరాలే కావాలని చాట్ బాట్ కి చెప్పా! [1] ఇది ఇచ్చింది! |
| 3 | Thathayya | అరవై ఏళ్ళకి, [1] బర్ అయిపోయానా? |
| 4 | Bindu | మామా, అవి ఇరవై ఒక్కటి! [1] నేను లెక్కపెట్టా! |
| 5 | Harish | నాకంటే చాట్ బాట్ బాగా లెక్కపెడుతుంది కదా! |
| 6 | Bindu | అది పదాల్ని ముక్కలుగా చూస్తుంది, అక్షరాలుగా కాదు. [1] దానికి ఇర్త్ ఒకే స్టిక్కర్. |
| 7 | Bindu | ఒక చిన్న ఫ్రీ చాట్ బాట్ ని పది సార్లు అడిగా, పదిహేను అక్షరాల మెసేజ్ ఇవ్వమని. / [1] ఒక్కటి కూడా పట్టలేదు. |
| 8 | Harish | అయితే లెక్కపెట్టమని చెప్తా! |
| 9 | Bindu | అదీ చేశా: పద్నాలుగు, పదిహేను అంది. / [1] ఉన్నవి ఇరవై రెండు. బర్తార్డే అని స్పెల్లింగ్ కూడా రాసింది! |
| 10 | Thathayya | మాటలు చాట్ బాట్ ని అడుగు. / [1] అక్షరాలు నువ్వే లెక్కపెట్టు. |
| 11 | Thathayya | సరే, కేక్ కట్ చేద్దాం. [1] బిందూ, ఇంకోసారి చదువు! |

Telugu notes: no "ఏఐ" in voiced text ("చాట్ బాట్"); numbers mid-line; no word one slipped letter from a swear word (to
check on the transcripts).

## Comment prompt (an opinion on the conflict)
Whose fault is the cake: Harish mama's or the AI's? Tell us why.
