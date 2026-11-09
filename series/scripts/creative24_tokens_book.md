# Creative 24 "The Same Question, 101 Tokens" (the Nov 9 creative slot) · script v2, Nov 9

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
- Tokens are how AI services are counted and charged: OpenAI's API pricing is per million input and output tokens
  (openai.com/api/pricing); context windows (a chat's memory) are given in tokens.
- Research: "Language Model Tokenizers Introduce Unfairness Between Languages" (Petrov, La Malfa, Torr, Bibi; NeurIPS
  2023): the same text in different languages can differ up to 15x in tokenized length, across 17 tokenizers.

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

## Script (English, v2; narrator only) · ~52 s
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

## Script (Telugu, v2)
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
