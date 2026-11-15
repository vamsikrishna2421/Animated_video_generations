# EP53 "Build RAG over your PDFs, Part 2" (Season 6, a screen tutorial) · queue 057 · script v3, Nov 15

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

## The code on screen (what rag_meaning.py ran, compacted; transformers + all-MiniLM-L6-v2, mean pooling)
```
pages = read_pdf("manual.pdf")   # Part 1, step 1
embed = embedder()   # all-MiniLM-L6-v2
page_vecs = embed(pages)   # 300 pages, once
q_vec = embed([question])[0]
scores = (page_vecs @ q_vec).tolist()
top3 = sorted(range(len(pages)),
              key=lambda i: -scores[i])[:3]
doc = "\n\n".join(f"--- page {i+1} ---\n{pages[i]}"
                  for i in top3)
messages = [{"role": "system", "content": RULES},
  {"role": "user",
   "content": f"Document:\n{doc}\n\nQuestion: {question}"}]
```
(embed() returns unit-length vectors, so `page_vecs @ q_vec` is the cosine similarity; best page first.)

## Script review (human-viewer, v1) and what changed (v2)
Both viewers: "banging found knocking" is the best moment; "same answer" and "doesn't fit" contradict; nobody says
what to do with my own PDF. Must-fixes and changes:
1. The hook said "same answer", but the whole manual never answered (it didn't fit). Now: "15,373: didn't fit our
   small AI" vs "247: answered, page 141"; the answer itself is blurred until the loop line reads it out.
2. The real reason, not only our 4,096 setting: about 60 times the tokens with every question (15,373 / 247 = 62x).
   On screen: our small AI was set to read 4,096 at once; our made-up pages are short (~50 tokens), split long pages.
3. Which one for my PDF: a new line 9 (short: send it whole, Part 1; long or many questions: search by meaning, then
   test 10 questions); on screen a no-code route (upload it to a chat app, run the same 10 questions).
4. The miss: called wrong ("not in the document", but it's on page 96; 2 of 10 like this; check the PDF). On screen
   why word search got 7 here after Part 1's 1/10 (Part 1 took only the top page, the cover).
5. The code on screen now matches what ran (best page first, "\n\n" between pages, "Document: ... Question:").
   One token number: 247 (the drain question) everywhere; "about 230" dropped. English cut to ~185 words.
6. Telugu: no "నాకింగ్"/"బ్యాంగింగ్" in the voice (line 5 now says "one word in the question, another on the page");
   "ఒక్కసారే"; "పేజీ నంబర్లతో"; "మామూలుగా కలిపితే"; line 3 ends "వెతకండి"; "మోడల్" for the AI in line 1.
7. Sound: a boom on the 62x stamp, a whoosh and a ding on banging -> knocking, the drop before "eight" kept.
8. Caption ask changed to the video's own habit: post one question and the page it should find.

## Render review (human-viewer, v2 render, 77.4 s) and what changed (v3)
Both viewers: "banging found knocking" is the only moment that lands; the blurred-answer tease annoys; the payoff came
after "Next" and ran into it ("an agent with tools and the drain question"); sound flat across quarters.
1. Ending: the answer first ("And the drain question? | Clean the drain filter, page 141"), 0.6 s pause, then "Next".
2. Line 9 now says the no-code route out loud ("No code? Upload it to a chat app") and "short" became "a few pages".
3. One ratio, 62x, said and shown; "Here," cut; "you pay for every one" (on screen: money, or waiting); on screen
   "we set our small AI to 4,096: it didn't fit" (our own setting, said plainly). Voice says "over fifteen thousand".
4. Small text enlarged (Part 1 chip, word-search sub-line, the no-code chip, the test footer); "full code: in the
   pinned comment" in step 1.
5. Miss scene: "page 13" explained (a safety page it was given); a new check, pipeline/ep53/rank_check.py: more pages
   wouldn't fix it (page 96 ranked 15th of 300; the other miss, page 69, 88th); the 8th hit "cites a copy of the page".
6. Sound: line 7 split so the drop before "eight" lands in a 0.6 s pause; lines 9-10 moved into the outro scene with a
   rise to 2.0 so the last quarter lifts; ding on the drain answer.
7. Hook: the real answer replaces the blur; a washing machine (water not draining) fills the bottom half until it lands.
Not changed: the "Part 2" banner in the first 2 s (the series frame), and the gap music level (CLAUDE.md wants it louder
in gaps).

## Script (English, v3; narrator)
1. (hook) Over fifteen thousand tokens, or two hundred and forty-seven? One question, a 300-page manual: the whole thing didn't fit our small AI. Three pages answered it: page 141.
2. (part1) Part 1 sent every page. That's sixty-two times the tokens, every question, and you pay for every one.
3. (title) Part 2: send only the pages that answer, found by meaning.
4. (step1) Step one: turn every page into numbers, once. Three hundred pages: three seconds.
5. (step2) Step two: do the same to the question, and take the three closest pages. 'Banging' found 'knocking': different words, same meaning.
6. (step3) Step three: send those pages, with their page numbers and Part 1's rules.
7. (test) Ten questions: right page in the top three? | By meaning, eight. Word search, seven. Both mixed, the simple way: six.
8. (miss) It missed two. The child lock: 'not in the document', but it's on page 96. 'Not there'? Check the PDF.
9. (habit) A few pages? Send it whole, like Part 1. Long? Search by meaning. No code? Upload it to a chat app. Either way, test ten questions you know the page for.
10. (loop) And the drain question? | Clean the drain filter, page 141. Next: an agent with tools.

## Script (Telugu, v3)
1. పదిహేను వేల టోకెన్లా, రెండు వందల నలభై ఏడు టోకెన్లా? మూడొందల పేజీల మాన్యువల్ కి ఒకే ప్రశ్న: మొత్తం మాన్యువల్ మా చిన్న మోడల్ కి పట్టలేదు. మూడు పేజీలతో, పేజీ నూట నలభై ఒకటి నుంచి జవాబు వచ్చింది.
2. పార్ట్ వన్ లో ప్రతి పేజీ పంపాం. అది అరవై రెండు రెట్లు టోకెన్లు, ప్రతి ప్రశ్నకీ; ప్రతి టోకెన్ కీ ఖర్చే.
3. పార్ట్ టూ: జవాబు ఉన్న పేజీలే పంపండి. వాటిని అర్థం బట్టి వెతకండి.
4. స్టెప్ వన్: ప్రతి పేజీని ఒక్కసారే నంబర్లుగా మార్చండి. మూడొందల పేజీలకి మూడు సెకన్లు, మా కంప్యూటర్ లోనే.
5. స్టెప్ టూ: ప్రశ్నని కూడా నంబర్లుగా మార్చి, దగ్గరగా ఉన్న మూడు పేజీలు తీసుకోండి. | ప్రశ్నలో ఒక మాట, పేజీలో వేరే మాట; అర్థం ఒకటే, అందుకే పేజీ దొరికింది.
6. స్టెప్ త్రీ: ఆ పేజీలని, పేజీ నంబర్లతో, పార్ట్ వన్ రూల్స్ తో పంపండి.
7. పది ప్రశ్నలు: సరైన పేజీ టాప్ త్రీ లో ఉందా? | అర్థం బట్టి, ఎనిమిది. మాటల సెర్చ్, ఏడు. రెండూ మామూలుగా కలిపితే: ఆరు.
8. రెండు తప్పాయి. చైల్డ్ లాక్ ప్రశ్నకి, | డాక్యుమెంట్ లో లేదు అంది; కానీ అది పేజీ తొంభై ఆరులో ఉంది. లేదు అంటే, పీడీఎఫ్ మీరే చూసుకోండి.
9. కొన్ని పేజీలేనా? పార్ట్ వన్ లా మొత్తం పంపండి. పెద్దదా? అర్థం బట్టి వెతకండి. | కోడ్ రాదా? చాట్ యాప్ లో అప్‌లోడ్ చేసుకోండి. ఏదైనా, పేజీ తెలిసిన పది ప్రశ్నలతో పరీక్షించండి.
10. మరి డ్రెయిన్ ప్రశ్న? | డ్రెయిన్ ఫిల్టర్ క్లీన్ చేసుకోండి, పేజీ నూట నలభై ఒకటి. తర్వాత: టూల్స్ ఉన్న ఏజెంట్.

## Caption ask (post your answer)
"Post one question you'd ask your own PDF, and the page it should find."
