# EP32 "How AI finds the right page" (RAG part 2: chunking, vector databases, re-ranking) — script v4 (as voiced)

Promised by EP31's outro ("Next: how AI finds the right page in your documents"). Crayon style, real demo.
Next (EP33, syllabus): RAG part 3, hybrid search and measuring RAG quality.

Demo (real, ours; pipeline/ep32/rag_demo.py + answer_demo.py, results in series/scripts/ep32_demo/):
a made-up 45-section user manual for a made-up phone ("K7", 2,239 words, 8 chapters) and 30 everyday questions written
the way people ask ("Will my phone survive a shower?", "How long is the guarantee?"). A hit = the piece the search puts
first contains that question's answer sentence. Free models on a 4-core cloud CPU, no graphics card:
meaning search = bge-small-en-v1.5 (BAAI, 33M numbers, MIT), re-ranker = ms-marco-MiniLM-L6-v2 cross-encoder (22.7M,
Apache-2.0), keyword search = BM25 (classic word-matching score). Answers: SmolLM2-1.7B-Instruct (Hugging Face, Apache-2.0).

| Pieces (chunks) | Keyword | Meaning | Meaning + re-ranker | Words sent (top 3) |
|---|---|---|---|---|
| Whole chapters (8) | 23/30 | 25/30 | 28/30 | ~870 |
| Section = heading + paragraph (45) | 18/30 | 25/30 | 27/30 | ~150 |
| One sentence each (136) | 11/30 | 16/30 | 20/30 | ~50 |
| Every 40 words, through sentences (56) | 11/30 | 13/30 | 15/30 | 120 |
| Every 40 words, 20-word overlap (111) | 12/30 | 20/30 | 22/30 | 120 |

- Hook: "Will my phone survive a shower?" keyword search, section pieces: first result = "Meteor shower mode" (the camera's
  night-sky mode). Meaning search: "Water and dust resistance ... Do not take it into the shower" (right).
- Re-ranker misses (section pieces, 3 of 30): broken glass -> "Drops and screen protectors" (not the warranty page),
  charging cable warranty -> "Charging safety", long bus trip -> "Battery health" (not "Battery saver").
- Whole chapters score high but send ~6x more text per question (the answer is buried in ~870 words).
- Answers (SmolLM2-1.7B): with the top 3 pieces, "Can I give it back if I just don't like it?" -> "... phones without a
  defect cannot be returned once they are opened" (right); with no pieces -> "Yes, if you don't like the K7 phone, you can
  return it to the store or manufacturer for a refund or exchange" (made up). It still fumbled the charger question even
  with the right piece ("Yes, the box contains a USB-C cable ..."); the 360M model of EP31 misread the right pages (it said
  the phone survives a shower), so the episode does not use it for answers. Both runs kept (answers_360M/1.7B.json).
- Speed (CPU): indexing all 45 sections 0.6 s; meaning search under 1 ms per question; re-ranking 10 pieces 74-85 ms.
- Top 3 (what the AI reads): section pieces, meaning search 30/30, after re-ranking 29/30: the re-ranker's gain is first
  place (25 -> 27), so the script says "re-rank if your bot reads just the top piece".
- Re-ranker examples (rerank_examples.json): "How long is the guarantee?" meaning #1 Returns and replacements -> re-ranked
  #1 Warranty period; "Can I give it back if I just don't like it?" meaning #1 Recycling your old phone -> Returns and replacements.

v4 final (third render review + checks): the lines got longer, so the quarters went flat -> the bed itself rises 5 dB
over the last quarter; under the PDF tip the end swell had the music at full volume ("quote" heard as "put") -> the
bed ducks under the tip and swells from "Next" into the follow ask; Telugu sentences checked one at a time (the
whole-line check missed babble): six re-voiced ("ఇది ఎందుకు ముఖ్యం?", "మాన్యువల్ మాత్రం కుదరదు అంటోంది." looped,
"చిన్నదైతే ఇవ్వచ్చు.", "ముప్పై మామూలు ప్రశ్నలు.", the vector-database sentence, "అంటే: చిన్న డాక్యుమెంట్?").
Masked words in the English mix (each take was clean alone): "headings" (heard "hitting") under the riser into the
headings crown -> riser at 0.3; "Your turn" ("Your ton") started on the lift's kick -> the voice starts 0.35 s after
the cut; "codes" ("calls") -> a two-step duck (tip 0.4, next-episode line 0.65) with the swell from "Follow".
Telugu sync: cues inside a sentence had snapped to the next sentence (the AI's made-up answer appeared with "the manual
says no"; the 18 and the 13 came a sentence late) -> placed by letters inside their own sentence take.
Fourth render review (English): "codes" still dropped in the full-file transcript -> one 0.4 duck from the tip
through "codes", the swell from "Follow"; the meaning-search row shows on "meaning search" and the scoreboard holds
1 s (the hook's answer card was up 0.7 s); the guarantee list reorders on "moved" (Telugu: on "రిటర్న్స్ పేజీ ని
తీసి"), not during "a bigger AI still reads the wrong page"; music-only holds after the scoreboard, the headings 25
and the re-ranker result (the middle was one level); the re-ranker caveats bigger, the top-3 line shortened ("AI reads
the top 3? meaning search alone: 30/30"); "Your turn" -> "Now, your turn" (the two-word take read as "Your ton",
even alone; matches the Telugu "ఇప్పుడు మీ వంతు").
Telugu render review: "రిటర్న్స్ పేజీ ని తీసి" (took the returns page out) -> "కిందకి దించి" (moved it down; the
screen shows it at #2); captions pinned to the measured Telugu sentence starts (they ran ~0.3 s early); step 2, where
all four viewers drifted: the shelves fill one topic at a time while the voice explains (they were full in 1.5 s,
then 4 s of a still picture), a "the PDF trick is at the end" reminder until "library", and the bed builds through
the scene (it was the quietest stretch). Not changed: the PDF trick stays at the end (the tease at 0:24 pays off
there); "how short is short" and PDFs without headings were asked once each (EP33 covers testing your own search).

v3 -> v4 (second render review, English + Telugu): the cost line says the number and the reason ("whole chapters also
scored 25, but sent six times the text, and AI services charge by the word"; Telugu ends on "ప్రతి పదానికీ డబ్బు కట్టాలి");
the PDF tip is teased out loud at ~0:24 ("Stick around: one trick for your own PDFs"); quiz options 2x bigger; "codes"
(heard "goals") -> "exact error codes" with a softer swell under it; audible lifts: a riser into the headings crown and
into "5 became 3", a louder cut scene and a quieter vector-database/re-ranker stretch so the middle isn't one flat loop;
"40 words ≈ one section" readable; "(2 more right first time, out of 30: a small test)" under 5 -> 3; captions narrower
(clear of Instagram's buttons); Telugu "ముప్పై లో థర్టీన్". (The Telugu quiz silence is 2.1 s in the audio, like English;
the transcript timing showed less.)

v2 -> v3 (render review of the first English cut): the caveats were in tiny print -> big tags in the lower half
("a made-up phone manual · tested by us", "both found the right page 25/30 · chapters sent 6x the text", "slower: ~80 ms
vs under 1 ms a question", "if the AI reads the top 3: meaning search alone had it 30/30", "a bigger AI still reads the
wrong page"); the illustrative rupee meter is gone (a made-up number dressed as data) -> our own words-per-question bars
(chapters ~864 vs headings ~152) and the voice says the decision ("whole chapters found the page as often, but sent six
times the text"); "shower" is highlighted as the WRONG PAGE stamp lands; the made-up answer appears when the voice says
"Yes" (a 0.5 s beat after the question); "25 became 27" -> "first-place misses: 5 became 3"; the re-ranker line no longer
says "if your bot reads one piece" (that is now the quiz's job, so the quiz is applied, not repeated), the quiz asks
"What helps more: a bigger AI, or a re-ranker?" (no "A: a bigger AI" stammer) and the answer says why ("The re-ranker.
Why? A bigger AI still reads the wrong page."); "40 words ≈ one section of this manual" on screen; the answer to the
hook ("no showers") on screen; a tease for the PDF tip at 0:24. Sound: quieter bed in the explanations, louder hook,
lifts (a brighter layer) at the headings crown and the 5 -> 3, a deeper drop (5%) before the quiz answer, a lift into
"Your turn", and a swell from the PDF tip into the follow ask. (The quiz silence was already 2.1 s in the audio; the
transcript timestamps had it at 0.5 s.)

v1 -> v2 (viewer script review): "AI" and the manual in line one, the wrong page stamped by 0:01; the made-up refund
moved up to the third beat ("why it matters"); the re-ranker only after it is explained, and only where our data backs it
(first place 25 -> 27; with the top three, meaning search alone already had the right page for 30/30, so the rule is
"re-rank if your bot reads just one piece"); "the whole manual" answered with cost (a short one: just paste it); the
2023 study moved to the YouTube notes; single sentences off the voice (on screen in small print); one name per idea
(keyword search / meaning search / re-ranker; no "quick search", no "the same search"); every score "out of 30" once;
a 40-word run WITH a 20-word overlap added (20/30) so the fixed-size cut isn't a strawman; the quiz is solved by applying
the re-ranker idea (the right page keeps landing second) and says "The answer is B" in full; a Monday tip for non-coders
(ask the chatbot to quote the lines it used); refund cards show the question, the model's real words and its name;
Telugu: all nine wording fixes; 252 words (was 283).

| # | English (as voiced) | On screen |
|---|---|---|
| 1 | We gave an AI our phone's manual: “Will my phone survive a shower?” Its search pulled up the camera's meteor shower mode. It matched the word, not the meaning. | frame 0: "AI helper · K7 phone manual (made up) · tested by us"; question bubble; the result card "Meteor shower mode" by 0.4 s, stamp WRONG PAGE by 0.9 s (hit); "shower" highlighted in both |
| 2 | 30 everyday questions. Right page first: keyword search, 18. Meaning search, 25. | scoreboard "right page first, out of 30": keyword 18 / meaning 25; the right card "Water and dust resistance: Do not take it into the shower" with a tick |
| 3 | Why it matters: with no page, AI guesses. “Can I give it back if I just don't like it?” Our small AI: “Yes, for a refund.” The manual says no. Stick around: one trick for your own PDFs. | question bubble; AI bubble with its real words ("Yes, if you don't like the K7 phone, you can return it ... for a refund or exchange"), "SmolLM2-1.7B · no manual given", stamp MADE UP (sting); the manual's line "Phones without a defect cannot be returned once they are opened" |
| 4 | Why not paste the whole manual? A short one, sure. Real ones run hundreds of pages. In our test, whole chapters also scored 25, but sent 6 times the text, and AI services charge by the word. | short doc -> chat, tick "short doc: just paste it"; then a fat manual + a meter "you pay per word × every question"; small print "our test: whole chapters 25/30, 6× the words" |
| 5 | Step one: cut it into pieces. Every 40 words, even mid-sentence: 13 out of 30. Overlap them: 20. Cut at headings: 25. | scissors; rows: torn 40-word cards (13), overlapping cards (20), heading + paragraph cards (25, crown); small print "single sentences: 16/30, they lose what 'it' means" |
| 6 | Step two: store each piece as numbers for its meaning, in a vector database, a library sorted by meaning. Your question becomes numbers too, and the nearest pieces come out. | pieces -> number strips -> shelves labelled by topic (water & care, battery, camera, warranty); the question's dot lands on "water & care", nearest pieces glow; small print "vector databases like FAISS (Meta) search millions" |
| 7 | Step three: a re-ranker reads your question beside each top piece, and reorders them. First-place misses: 5 became 3. | top pieces list; a robot with a magnifier reads each beside the question; cards reorder; scoreboard bar "+ re-ranker 27"; small print "slower: 74 ms vs under 1 ms a question · meaning search alone had it in the top 3 for 30/30" |
| 8 | Now, your turn. Your AI reads only the first piece, and the right page keeps coming second. What helps more: a bigger AI, or a re-ranker? The re-ranker. Why? A bigger AI still reads the wrong page. Ours moved “guarantee” from the returns page to the warranty page. | YOUR TURN; A / B cards; 1.5 s countdown, music drops; crown on B; "How long is the guarantee?": #1 Returns and replacements -> Warranty period (tick) |
| 9 | So: short document? Paste it. Big one? Cut at headings, search by meaning, re-rank if it reads one piece. Using a chatbot with your PDF? Ask it to quote the lines it used. Next: why meaning search misses exact error codes. Follow, so you don't miss it. | checklist; tip card "chatbot + your PDF? ask it to quote the lines it used"; NEXT "when meaning search misses exact codes, like E-42 (+ how to test your search)"; handle to the last frame |

## Telugu (Telugu script, as voiced; visuals and captions in English)
1. మేము మా ఫోన్ మాన్యువల్ ని ఒక ఏఐ కి ఇచ్చి, "నా ఫోన్ షవర్ లో తడిస్తే పాడవుతుందా?" అని సెర్చ్ లో టైప్ చేశాం. దాని సెర్చ్ కెమెరా లోని మీటియర్ షవర్ మోడ్ ని తెచ్చింది. అది మాటని పట్టుకుంది, అర్థాన్ని కాదు.
2. ముప్పై మామూలు ప్రశ్నలు. సరైన పేజీ మొదట వచ్చింది: కీవర్డ్ సెర్చ్ లో, ఎయిటీన్. అర్థంతో వెతికితే, ట్వెంటీ ఫైవ్.
3. ఇది ఎందుకు ముఖ్యం? పేజీ ఇవ్వకపోతే, ఏఐ ఊహించి చెప్తుంది. "నచ్చకపోతే తిరిగి ఇవ్వచ్చా?" అని అడిగితే, మా చిన్న ఏఐ, "ఇవ్వచ్చు, రిఫండ్ వస్తుంది" అంది. మాన్యువల్ మాత్రం కుదరదు అంటోంది. చివర్లో, మీ పీడీఎఫ్ ల కోసం ఒక ట్రిక్ ఉంది.
4. మొత్తం మాన్యువల్ నే ఎందుకు ఇవ్వకూడదు? చిన్నదైతే ఇవ్వచ్చు. కానీ నిజమైన మాన్యువల్స్ వందల పేజీలు. మా టెస్ట్ లో, మొత్తం చాప్టర్లకీ ట్వెంటీ ఫైవ్ వచ్చింది, కానీ ఆరు రెట్లు ఎక్కువ టెక్స్ట్ వెళ్ళింది. ఏఐ సర్వీసుల్లో ప్రతి పదానికీ డబ్బు కట్టాలి.
5. మొదటి స్టెప్: ముక్కలుగా కట్ చేయండి. ప్రతి నలభై పదాలకి, వాక్యం మధ్యలో అయినా కట్ చేస్తే, ముప్పై లో థర్టీన్. ముక్కలు కొంచెం ఓవర్ ల్యాప్ అయితే, ట్వెంటీ. హెడింగ్ దగ్గర కట్ చేస్తే, ట్వెంటీ ఫైవ్.
6. రెండో స్టెప్: ప్రతి ముక్క అర్థం నంబర్లుగా మారి, ఒక వెక్టర్ డేటాబేస్ లో ఉంటుంది, అర్థం ప్రకారం సర్దిన లైబ్రరీ లాగా. మీ ప్రశ్న కూడా నంబర్లుగా మారుతుంది, దగ్గరగా ఉన్న ముక్కలు బయటకి వస్తాయి.
7. మూడో స్టెప్: రీ ర్యాంకర్. అది మీ ప్రశ్న పక్కన ప్రతి టాప్ ముక్క ని చదివి, వరుస మారుస్తుంది. మొదటి స్థానంలో తప్పులు, ఐదు నుంచి మూడు కి తగ్గాయి.
8. ఇప్పుడు మీ వంతు. మీ ఏఐ మొదటి ముక్క ఒక్కటే చదువుతుంది, సరైన పేజీ ఎప్పుడూ రెండో స్థానంలో వస్తోంది. ఏది ఎక్కువ సాయం చేస్తుంది: ఇంకా పెద్ద మోడలా, రీ ర్యాంకరా? (pause) రీ ర్యాంకర్. పెద్ద మోడల్ అయినా తప్పు పేజీ నే చదువుతుంది. మా రీ ర్యాంకర్, "గ్యారెంటీ ఎంత కాలం?" అనే ప్రశ్నకి, రిటర్న్స్ పేజీ ని తీసి, వారంటీ పేజీ ని పైకి పెట్టింది.
9. అంటే: చిన్న డాక్యుమెంట్? మొత్తం పేస్ట్ చేయండి. పెద్దదైతే? హెడింగ్స్ దగ్గర కట్ చేయండి, అర్థంతో వెతకండి, బాట్ ఒక్క ముక్కే చదివితే రీ ర్యాంక్ చేయండి. మీ పీడీఎఫ్ తో చాట్ బాట్ వాడుతుంటే, అది వాడిన లైన్స్ ని చూపించమని అడగండి. తర్వాతి ఎపిసోడ్ లో: అర్థంతో వెతికే సెర్చ్, ఎర్రర్ కోడ్స్ ని ఎందుకు మిస్ అవుతుందో చూద్దాం. మిస్ అవ్వకుండా ఫాలో అవ్వండి.

Telugu notes: no "chunk" word in Telugu ("chanka" is armpit): pieces are ముక్కలు. "AI" is ఏఐ inside a sentence (a
one-word ఏఐ sentence gets dropped by the voice); no lone "బీ." ("ఆన్సర్ బీ"); "టాప్" instead of "పై" (heard as "on the
AI"); "పెద్ద మోడల్" (three ē sounds in a row otherwise). Numbers said in English.

## Facts (checked 2026-10-18)
- Lost in the Middle: Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang, arXiv 2307.03172 (Jul 2023; TACL):
  "performance is often highest when relevant information occurs at the beginning or end of the input context, and
  significantly degrades when models must access relevant information in the middle of long contexts". Said as "a 2023
  study found models often miss facts buried in the middle of long text" (newer models may do better; dated on purpose).
- Retrieve & re-rank (Sentence-Transformers docs, sbert.net): the first-stage retriever "has to be efficient for large
  document collections with millions of entries" and returns e.g. 100 hits; a cross-encoder re-ranker scores each
  (query, document) pair: "higher performance, as they perform attention across the query and the document", but scoring
  millions of pairs "would be rather slow". Our corpus is small, so we re-rank the top 10.
- Vector database: FAISS (Meta FAIR, github.com/facebookresearch/faiss): "a library for efficient similarity search and
  clustering of dense vectors ... search in sets of vectors of any size, up to ones that possibly do not fit in RAM."
  (Our demo keeps 45 vectors in a plain array; the idea is the same.)
- Models and licences from their Hugging Face cards: bge-small-en-v1.5 (MIT, 33.4M parameters counted locally),
  ms-marco-MiniLM-L6-v2 (Apache-2.0, 22.7M), SmolLM2-1.7B-Instruct (Apache-2.0).
- Honesty limits: the manual and questions are made up by us (said on screen); 30 questions is a small test; the hit
  rule is strict (a single-sentence piece that answers in other words counts as a miss, e.g. "Placing it on a wireless
  charging pad will not charge it"). "Even from millions" is the vector-database claim (FAISS, sbert), not our test.
