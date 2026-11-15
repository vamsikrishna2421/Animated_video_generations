# EP53 "Build RAG over your PDFs, Part 2" (Season 6, a screen tutorial) · queue 057 · script v1, Nov 15

## The format
A screen tutorial (Season 6), one narrator, the code and a chat drawn in our crayon style (as EP51, EP52). Verdict
first: the clash in frame 1, then three short steps, the test, the one miss, the habit.

## The lesson
Part 1 sent the whole PDF with every question. A long PDF can't go whole: our 300-page manual is 15,373 tokens a
question and our small AI's setting holds 4,096. Part 2: send only the pages that answer, found by meaning
("embeddings"): turn every page into numbers once; turn the question into numbers; take the 3 closest pages; send them,
numbered, with Part 1's rules. Then test the search with 10 questions whose right page you know, and count.

## Bujji's notes applied
- Frame 1: a same-item count clash from our own test, in the first 2 s (Bujji, HOW TO 04 48h: the clash rule covers
  tutorials): the same question, the same answer, "15,373 tokens" vs "247 tokens". The person at stake: someone whose
  washing machine won't drain, asking the manual.
- No try-it, no one-word ask: the caption asks people to post their answer (see "Caption ask").
- Verdict first; Telugu line 1 opens on the clash. Visuals in English for the Telugu version.

## Our test (pipeline/ep53/: rag_meaning.py, rag_hybrid.py; series/scripts/ep53_demo/; each committed before it ran)
A 300-page manual we wrote for a made-up washing machine (WM-900): programs, error codes, parts and prices, warranty,
service. The same small free AI as EP51/52 (Qwen2.5-7B, 4-bit, llama.cpp, on our computer, no web search),
temperature 0.2, context setting 4,096 tokens. Embeddings: all-MiniLM-L6-v2 (a small free model, 384 numbers a page),
on our computer. Ten everyday questions, the right page fixed first, every reply read by hand.
| run | right page in the top 3 | notes |
|---|---|---|
| the whole manual | does not fit | 15,373 tokens a question; the setting holds 4,096 |
| Part 1's word search (most words in common) | 7 of 10 | missed q1 smell/odour, q5 banging/knocking, q10 repair/service |
| search by meaning | 8 of 10 | missed q1 and q8 (child lock: it ranked the safety pages 13, 18, 19 first) |
| both mixed, reciprocal rank fusion (the simple way) | 6 of 10 | worse: lost q5 and q10 |
Answers from the 3 pages by meaning: 7 right with the right page (q2 drain filter p141, q4 Rs 1,250 p262, q5 transit
bolts p48, q6 10 years p284, q7 E35 door lock p155, q9 no dish liquid p104, q10 the service number p291); q3 right but
cited page 117 (a second program page); q1 and q8 "Not in the document" (no guess). Prompt tokens 197 to 252, average
230 (q2: 247). Embedding all 300 pages: 3.1 s.

## The code on screen (the steps our test ran, Python; transformers + all-MiniLM-L6-v2, mean pooling)
```
embed = embedder()  # all-MiniLM-L6-v2, on our computer
page_vecs = embed(pages)   # 300 pages, once
q_vec = embed([question])[0]
scores = page_vecs @ q_vec   # how close each page is
top3 = scores.argsort()[-3:]
doc = "".join(f"--- page {i+1} ---\n{pages[i]}"
              for i in top3)
messages = [{"role": "system", "content": rules},
  {"role": "user", "content": doc + question}]
```
(embed() returns unit-length vectors, so `page_vecs @ q_vec` is the cosine similarity.)

## Script (English, v1; narrator)
1. (hook) Fifteen thousand tokens, or two hundred and forty-seven? Same question, same answer from a 300-page manual: clean the drain filter, page 141.
2. (part1) Part 1 sent every page. Here, that's fifteen thousand tokens with every question, and our small AI's setting holds four thousand.
3. (title) Part 2: send only the pages that answer. To find them, search by meaning.
4. (step1) Step one: turn every page into a list of numbers, once. Three hundred pages took three seconds, on our computer.
5. (step2) Step two: turn the question into numbers too, and take the three closest pages. 'Banging' found 'knocking': different words, same meaning.
6. (step3) Step three: send just those pages, numbered, with Part 1's rules. About two hundred and thirty tokens a question.
7. (test) Our test, ten questions: right page in the top three? By meaning, eight. Part 1's word search, seven. | Both mixed, the simple way: six.
8. (miss) When the right page wasn't found, it said: not in the document. It didn't guess.
9. (habit) So before you trust your search, write ten questions with the right page first, and count.
10. (loop) Next: an agent with tools. And the drain question? Clean the filter, page 141, from 247 tokens.

## Script (Telugu, v1)
1. పదిహేను వేల టోకెన్లా, రెండు వందల నలభై ఏడు టోకెన్లా? ఒకే ప్రశ్న, మూడొందల పేజీల మాన్యువల్ నుంచి ఒకే జవాబు: డ్రెయిన్ ఫిల్టర్ క్లీన్ చేసుకోండి, పేజీ నూట నలభై ఒకటి.
2. పార్ట్ వన్ లో ప్రతి పేజీ పంపాం. ఇక్కడ అది ప్రతి ప్రశ్నకీ పదిహేను వేల టోకెన్లు; మా చిన్న చాట్‌బాట్ సెట్టింగ్ పట్టేది నాలుగు వేలే.
3. పార్ట్ టూ: జవాబు ఉన్న పేజీలే పంపండి. వాటిని వెతకడానికి, అర్థం బట్టి సెర్చ్.
4. స్టెప్ వన్: ప్రతి పేజీని ఒకసారి నంబర్ల లిస్ట్ గా మార్చండి. మూడొందల పేజీలకి మూడు సెకన్లు, మా కంప్యూటర్ లోనే.
5. స్టెప్ టూ: ప్రశ్నని కూడా నంబర్లుగా మార్చి, దగ్గరగా ఉన్న మూడు పేజీలు తీసుకోండి. | బ్యాంగింగ్ అన్న ప్రశ్నకి, నాకింగ్ ఉన్న పేజీ దొరికింది; మాటలు వేరు, అర్థం ఒకటే.
6. స్టెప్ త్రీ: ఆ పేజీలే, నంబర్లతో, పార్ట్ వన్ రూల్స్ తో పంపండి. ఒక్కో ప్రశ్నకి సుమారు రెండు వందల ముప్పై టోకెన్లు.
7. మా టెస్ట్, పది ప్రశ్నలు: సరైన పేజీ టాప్ త్రీ లో ఉందా? అర్థం బట్టి, ఎనిమిది. పార్ట్ వన్ మాటల సెర్చ్, ఏడు. | రెండూ కలిపితే, సింపుల్ గా: ఆరు.
8. సరైన పేజీ దొరకనప్పుడు, డాక్యుమెంట్ లో లేదు అంది. గెస్ చేయలేదు.
9. అందుకే, మీ సెర్చ్ ని నమ్మే ముందు, సరైన పేజీతో పది ప్రశ్నలు ముందే రాసి, లెక్కపెట్టండి.
10. తర్వాత: టూల్స్ ఉన్న ఏజెంట్. | మరి డ్రెయిన్ ప్రశ్న? ఫిల్టర్ క్లీన్ చేసుకోండి, పేజీ నూట నలభై ఒకటి, రెండు వందల నలభై ఏడు టోకెన్లతో.

## Caption ask (post your answer)
"Your manual or PDF: how many pages? Post the number, and we'll say whether Part 1 or Part 2 fits it."
