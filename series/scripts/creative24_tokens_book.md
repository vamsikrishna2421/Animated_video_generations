# Creative 24 "The Same Question, 101 Tokens" (the Nov 9 creative slot) · script v3.2, Nov 9

## The format test (Vamsi via Bujji, Nov 6; agreed for a Nov 9-11 creative slot)
The "3D textbook": an open book on a desk. The left page holds the words (still); the diagram on the right page lifts off
the paper into 3D and performs the idea; a page turn moves to the next idea. One calm narrator (the Creative 21 voice
standard in English: an American reference voice through Fish; Telugu on Parler). This format is the one variable.

## The idea (point family B, "AI can't do what it looks like it does": it reads tokens, not words)
An AI doesn't read words; it reads tokens, chunks of text. Many tokenizers cut Telugu into far more pieces than English:
the same question can take several times the tokens. AI companies count tokens and charge for them; a chat's memory is
counted in tokens. So the same Telugu question can cost more and fill the memory faster. Newer tokenizers are fairer;
not fair yet. What to do: for long Telugu work, send it in parts; test which app handles Telugu best.

## The reach stack
1. Stake: fairness for the viewer's own language (the Telugu page especially).
2. Frame 1, sound off: the book open, two token towers already risen from the right page: "ENGLISH: 13 TOKENS" vs
   "TELUGU: 101 TOKENS", "THE SAME QUESTION".
3. Injustice: the same question, 7.8 times the tokens, for writing in Telugu.

## Facts and sources (checked Nov 9, 2026)
- Our test (pipeline/creative24/token_demo.py, series/scripts/creative24_demo/tokens.json; committed before it ran):
  five everyday questions in English and Telugu (the same meaning), counted with three real tokenizers:
  | tokenizer | EN total | TE total | TE / EN |
  |---|---|---|---|
  | cl100k_base (OpenAI's older open tokenizer, used by its GPT-4 and GPT-3.5 models, per tiktoken) | 66 | 485 | 7.35 |
  | o200k_base (OpenAI's newer one, used by its GPT-4o-era models, per tiktoken) | 66 | 111 | 1.68 |
  | Qwen2.5 (the open Qwen2.5 models, 2024) | 66 | 421 | 6.38 |
  The electricity-bill question: 13 tokens in English, 101 (older), 23 (newer), 86 (Qwen2.5) in Telugu. The word
  " current": 1 token; " కరెంట్": 12 (older), 3 (newer).
  Follow-up (added after the script review, committed before it ran): the same questions typed in English letters
  ("Ee nela naa current bill..."): 117 / 101 / 117 tokens = 1.77x, 1.53x, 1.77x of English.
  Follow-up 2 (added after the render review, committed before it ran; creative24_demo/tokens_current.json): OpenAI's
  tiktoken library (v0.14.0) maps gpt-4 and gpt-3.5-turbo to cl100k_base and gpt-4o, gpt-4.1, o3 and gpt-5 to
  o200k_base; the Qwen3 tokenizer (2025) gives the same counts as Qwen2.5: Telugu 421 vs 66, 6.38x.
- Tokens are how AI services are counted and charged: OpenAI's API pricing is per million input and output tokens
  (openai.com/api/pricing); context windows (a chat's memory) are given in tokens.
- Research: "Language Model Tokenizers Introduce Unfairness Between Languages" (Petrov, La Malfa, Torr, Bibi; NeurIPS
  2023): the same text in different languages can differ up to 15x in tokenized length, across 17 tokenizers.

## Render review (human-viewer, v2 render) and what changed (v3)
Both: the 0:25 memory bars showed about 8x for "your app", then 0:30 said the newer ChatGPT is under 2x (a contradiction);
"use a newer app" names nothing (which app? is my ChatGPT the newer one?) and "count your tokens" names no counter; the
0:30 good news gets no lift and NOT FAIR YET lands while "getting fairer" is still being said; the 6.4x label spills off
the page, the 0:36 footnote is tiny and calls the newer tokenizer "a 2024 one" (it's Nov 2026); the left page is cropped
to fragments while the camera leans in. Sandeep: "these counters" (nobody mentioned counters); the developer bit is not
for him; the bars feel like maths class. Priya: "tokens are the AI's memory" (memory is *counted* in tokens); rerun on
current models; one frame worth saving (all three ratios, model names, date); music as loud as the voice (-17.6 vs -18.4
dB), a pad hum in the voice's range, no arc (quarters within 1.5 dB), the frame-1 hit no bigger than the kick. Book: the
chunk blocks cover the question; the turning page shows the tip text mirrored; the last right page is blank; the top
third is empty after 0:07. Telugu: "తెలుగు" heard as "థెలుకు"; "ఏ ఐ" heard as "ఏ ఏ"; "కొత్త" heard as "kutta"; the silence
falls before "తెలుగులో", not before "నూట ఒకటి"; "ఇవి" needs a noun; "మంచి వార్త" newsreader; "లోపుకి" → "లోపే".
Changed (v3): a follow-up count (committed before it ran): OpenAI's tiktoken library maps gpt-4o, gpt-4.1, o3 and gpt-5
to the newer tokenizer (so "the newer one" = today's ChatGPT models), and the 2025 Qwen3 tokenizer counts exactly as
Qwen2.5 (421, 6.38x), so the open-model point holds today. Order: hook, chunks, "current", why, then the good news
(today's ChatGPT: 23; from seven times to under two), the open model (six times), "Getting fairer." and, after a beat on
silence, "Not fair yet." (its own take, the stamp on it), then why it matters (memory of the chat is counted in tokens;
bars at the real ratios: English 1, today's ChatGPT 1.7, an open model 6.4), then the tips (a forgetful long Telugu chat:
start another chat with a short summary; paying per token: count Telugu tokens first, the free counter on the page). The
developer cost line is gone (Sandeep). The top third carries a chapter header and, on the bars, a saveable table (all
three ratios, model names, the date). Telugu: "చాట్ బాట్" for "ఏ ఐ"; "ఇప్పటి" for "కొత్త"; the wording fixes; the split take
before "నూట ఒకటి".

## Script review 2 (human-viewer, the v3 script) and what changed (v3.1)
Both: the contradiction is fixed and the ratios agree (7.4 / 1.7 / 6.4). Still to change: Telugu line 2 repeated "the same
question"; "కొంచెం మెరుగైంది" (a little) contradicts seven times down to under two; line 4 should say whose chunks; "తెలుగు"
needs a check on every take; tip 1: ask for the summary, paste it into a new chat; tip 2 had no setup (cost was cut):
"building with AI? count your Telugu tokens and compare models before you pick"; "Not fair yet" with the bed out played like
the ending (a dip, not a stop; straight into why-it-matters); a stake in the first 10 s ("and it can only hold so many");
"memory" clashes with ChatGPT's Memory feature (say "room" / "holds"); name the open model (Qwen) on screen.
Changed: all of the above. Every Telugu take with "తెలుగు" must be heard with it (MUST check); the table names the models
"per OpenAI's tiktoken"; the counter page says it counts OpenAI's models.

## Render review 2 (human-viewer, the v3.1 render) and what changed (v3.2)
Both: the contradiction, the app and the chunks are fixed; the table is the save frame. Still to change: Telugu re-takes
("పట్టగలదు" looped, "గుడ్ న్యూస్ ఏంటంటే" stuttered, "తెలుగు" in lines 7-8, "నూట ఒకటి" heard "nota agati", "రెండు" and "ఆరు"
swallowed); NOT FAIR YET was up under 2 s; "÷" in the table header reads as "+" on a phone; the try-it card printed 13 and 23,
so "comment both numbers" gave nothing to do, and its words showed as stubs while the camera was on the tips; "compare
models" with a counter that only counts OpenAI's; "fill that room" (what room?); no lift on 101 -> 23; frame 1 sat still
to 0:07.
Changed: Telugu lines 1 (the number's take now "నూట ఒకటి టోకెన్లు"), 2 ("గుర్తుంచుకోగలదు"), 5 ("గుడ్ న్యూస్:", "ఏడు రెట్లు
ఉండేది, ఇప్పుడు రెండు కంటే తక్కువ"), 6 ("ఇంకా, ఆరు రెట్లు"), 7 ("ఆ లిమిట్"), 8 re-voiced, each take checked for its key word
(six tries); Parler said "పెద్ద తెలుగు చాట్" as "థెలుక్" on every take, so lines 7-8 say "పెద్ద చాట్" (the Telugu page's chat
is Telugu already); English 7 "Telugu uses up that limit faster", 8 "count your Telugu tokens on the model you'll use"; the
stamp held into the page turn; "TELUGU TOKENS PER ENGLISH TOKEN"; the card asks for a sentence of yours and marks 13/23
as our example, and appears as the camera crosses to it; the bed boosted under the good news with a hit as 101 lands on
23; a slow push-in on frame 1.

## Script (English, v3.1; narrator only; lines 7-8 as v3.2 below) · ~50 s
| # | Line | The book |
|---|---|---|
| 1 | Thirteen tokens in English. [1] A hundred and one in Telugu. | spread 1: the towers (13 vs 101), frame-1 blocks, "older ChatGPT model" |
| 2 | The same question. [1] An AI reads tokens, chunks of text, and it can only hold so many. | the English question as 13 blocks on the right page |
| 3 | The word "current": one chunk in English. [1] In Telugu letters: twelve tiny pieces. | "current" one block; "కరెంట్" bursts into 12 |
| 4 | Why? [1] Its chunk list was built mostly from English text. | the stamp, with the research credit |
| 5 | The good news: today's ChatGPT counts that question in twenty-three. [1] Over five questions: from seven times down to under two. | page turn; spread 2: 101 shrinks to 23; bars older 7.4x, today 1.7x; a lift |
| 6 | But a popular free open model: still six times. [1] Getting fairer. / [2] Not fair yet. | the Qwen bar 6.4x; the saveable table; a dip, NOT FAIR YET on its words |
| 7 | Why it matters: Telugu uses up that limit faster. [1] So in a long Telugu chat, the AI forgets the start sooner. | page turn; spread 3: the same chat's room used (1, 1.7, 6.4) |
| 8 | Long Telugu chat forgetting what you said? [1] Ask for a short summary, and paste it into a new chat. [2] Building with AI? Count your Telugu tokens on the model you'll use. | page turn; spread 4: the tips; the counter page; the flip back |

## Script (Telugu, v3.2: as voiced)
| # | Telugu |
|---|---|
| 1 | ఇంగ్లీష్ లో పదమూడు టోకెన్లు. తెలుగులో, అదే ప్రశ్నకి, / [1] నూట ఒకటి టోకెన్లు. |
| 2 | చాట్ బాట్ పదాలు చదవదు: [1] టోకెన్లు చదువుతుంది, అంటే టెక్స్ట్ ముక్కలు. అది కొన్ని టోకెన్లు మాత్రమే గుర్తుంచుకోగలదు. |
| 3 | కరెంట్ అనే పదం, ఇంగ్లీష్ లో ఒక్క ముక్క. [1] తెలుగు అక్షరాల్లో రాస్తే, పన్నెండు ముక్కలు. |
| 4 | ఎందుకు? [1] దాని ముక్కల లిస్ట్, ఎక్కువగా ఇంగ్లీష్ టెక్స్ట్ తోనే తయారైంది. |
| 5 | గుడ్ న్యూస్: ఇప్పటి చాట్ జీపీటీ లో, అదే ప్రశ్నకి ఇరవై మూడు టోకెన్లే. [1] ఐదు ప్రశ్నల్లో: ఏడు రెట్లు ఉండేది, ఇప్పుడు రెండు కంటే తక్కువ. |
| 6 | కానీ ఉచితంగా దొరికే ఒక ఓపెన్ మోడల్ లో, ఇంకా, ఆరు రెట్లు. [1] మెరుగవుతోంది. / [2] ఇంకా సమానం కాదు. |
| 7 | ఇది ఎందుకు ముఖ్యం అంటే: టోకెన్లు పెరిగితే, ఆ లిమిట్ త్వరగా అయిపోతుంది. [1] అందుకే పెద్ద చాట్ లో, మొదట చెప్పింది త్వరగా మర్చిపోతుంది. |
| 8 | పెద్ద చాట్ లో ముందు చెప్పింది మర్చిపోతుంటే? [1] చిన్న సమ్మరీ అడిగి, ఇంకో చాట్ లో పేస్ట్ చేయండి. [2] యాప్ తయారు చేస్తుంటే, మీరు వాడే మోడల్ లోనే తెలుగు టోకెన్లు లెక్కపెట్టండి. |

## Script review (human-viewer, v1) and what changed
Both stop on frame 1 (hook 7 and 8: a tall orange "TELUGU 101" reads as unfair to us). Both: the 101 is the older
tokenizer and the reel only says so at 0:32, so it felt baited ("AI charges Telugu 7x more!" is the wrong share);
"tokenizer" and "open model" are jargon; "costs more" means nothing to someone on a free app (what do I lose?); no sound
plan. Sandeep: why does Telugu get cut up at all?; what if I type Telugu in English letters?; the same lift trick by
spread 3. Priya: label the tower; 7.8x (one question) vs 7.35x (five) needs saying; 7 → 1.7 → 6 doesn't read as "getting
fairer"; "send it in parts" saves no tokens; chatbots can't count their own tokens, so the ask fills with made-up numbers.
Telugu: "ఏఐ" can come out "ఏయ్" (write "ఏ ఐ"); "సాధారణంగా", "రోజువారీ", "న్యాయం వైపు" bookish; "ముక్కలుగా పంపండి" now sounds
like "send it as tokens".
Changed (v2): frame 1 labels the 101 "older ChatGPT model"; the turn at ~25 s: "the newer ChatGPT counts that question in
twenty-three" (the drop from 101 to 23 is the story); "why": they were built mostly from English text (Petrov et al.); what
an app user loses: the AI's memory is counted in tokens, so a long Telugu chat runs out of room sooner; cost said only for
developers who pay per token; "a popular free open model: still six times"; "one question" vs "five questions" said; the
tips: use a newer app for long Telugu work, and count Telugu tokens first if you pay per token (a free counter, named in
the caption); the caption ask uses a token counter, not the chatbot; a sound plan (a page flip and a hit on every turn,
drops before "a hundred and one" and "not fair yet"). Telugu as listed.

## Script (English, v2; superseded) · ~52 s
| # | Line | The book |
|---|---|---|
| 1 | Thirteen tokens in English. [1] A hundred and one in Telugu. | spread 1: the two towers (13 vs 101), the frame-1 blocks, "TELUGU (older ChatGPT model)" |
| 2 | The same question. [1] An AI reads tokens: chunks of text, not words. | the English question as 13 labelled blocks |
| 3 | The word "current": one chunk in English. [1] In Telugu letters: twelve tiny pieces. | "current" one block; "కరెంట్" bursts into 12 |
| 4 | Why? [1] These counters were built mostly from English text. | the stamp "BUILT MOSTLY FROM ENGLISH" |
| 5 | In your app, tokens are the AI's memory. [1] A long Telugu chat runs out of room sooner. | page turn; spread 2: two memory bars, the Telugu one fills first |
| 6 | And developers pay per token: [1] the same Telugu question costs more. | coin stacks: ×7.8 |
| 7 | The good news: the newer ChatGPT counts that question in twenty-three. [1] Over five questions: from seven times down to under two. | page turn; spread 3: the 101 tower shrinks to 23; bars: older 7.4×, newer 1.7× |
| 8 | But a popular free open model: still six times. [1] Getting fairer. Not fair yet. | the third bar 6.4×; NOT FAIR YET |
| 9 | Long Telugu work? Use a newer app. [1] Paying per token? Count your Telugu tokens first. | page turn; spread 4: two tips; the book flips back to spread 1 |

## Script (Telugu, v2; superseded)
| # | Telugu |
|---|---|
| 1 | ఇంగ్లీష్ లో పదమూడు టోకెన్లు. [1] తెలుగులో, అదే ప్రశ్నకి నూట ఒకటి. |
| 2 | ఒకే ప్రశ్న. [1] ఏ ఐ పదాలు చదవదు: టోకెన్లు చదువుతుంది, అంటే టెక్స్ట్ ముక్కలు. |
| 3 | కరెంట్ అనే పదం, ఇంగ్లీష్ లో ఒక్క ముక్క. [1] తెలుగు అక్షరాల్లో రాస్తే, పన్నెండు ముక్కలు. |
| 4 | ఎందుకు? [1] ఇవి ఎక్కువగా ఇంగ్లీష్ టెక్స్ట్ తోనే తయారయ్యాయి. |
| 5 | మీ యాప్ లో, టోకెన్లే ఏ ఐ మెమరీ. [1] పెద్ద తెలుగు చాట్ కి, చోటు త్వరగా అయిపోతుంది. |
| 6 | డెవలపర్లు ప్రతి టోకెన్ కి డబ్బు కడతారు. [1] అదే తెలుగు ప్రశ్నకి, ఖర్చు ఎక్కువ. |
| 7 | మంచి వార్త: కొత్త చాట్ జీపీటీ, అదే ప్రశ్నని ఇరవై మూడుగా లెక్కపెడుతుంది. [1] ఐదు ప్రశ్నల్లో: ఏడు రెట్ల నుంచి, రెండు రెట్ల లోపుకి. |
| 8 | కానీ ఒక పాపులర్ ఫ్రీ ఓపెన్ మోడల్ లో, ఇంకా ఆరు రెట్లు. [1] కొంచెం మెరుగైంది. ఇంకా సమానం కాదు. |
| 9 | పెద్ద తెలుగు పనికి, కొత్త యాప్ వాడండి. [1] టోకెన్ కి డబ్బు కడితే, ముందే తెలుగు టోకెన్లు లెక్కపెట్టండి. |

## Caption ask (a try-it test)
Paste one Telugu sentence and its English version into a free token counter (OpenAI's Tokenizer page) and comment both
numbers.
