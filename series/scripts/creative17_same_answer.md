# Creative 17 "Same Answer, Two Marks" · script v2, Nov 4 (the Nov 2 creative slot)

**Format:** a TV crime-show parody (a CASE FILE title, an evidence board with red string, EXHIBIT tags, a black-and-white
"reconstruction" with a DRAMATISED label, CASE CLOSED stamp) in a tuition room; inserts of the AI's marks and our test.
New in the creative log (last 7 days: a TV serial, a video call, cricket commentary, a nature documentary, a projector
classroom, an FM phone-in, a birthday cake).
**Cast:** Varsha (14, wrote the answer, plays the detective), Akhil (14, copied it word for word), Srinivas sir (the
tuition teacher, marks homework with an AI). Telugu: Varsha = Lalitha, Akhil = Kiran, Srinivas sir = Prakash. The AI is
an unbranded "AI marker" on his phone, text only.
**AI idea:** a chat AI picks each word of its reply with a little chance, so the same question can get a different
answer, and a mark is an answer too: the same answer, marked twice, can get two marks. A marking scheme didn't steady it
in our test, and it misread the answer. Let the AI point to lines; a person gives the marks.
**The reach stack (Standing Rule, Nov 3):** stake: marks; frame 1: two answer sheets, word for word the same, "7/10" and
"9/10" in red, readable with the sound off; injustice: the boy who copied gets more than the girl who wrote it; the AI is
the culprit. Line 1 says both numbers in ~2.5 s. Comment ask in the caption only.

## Facts and sources (checked Nov 4, 2026)
- How a chat AI picks words: the model gives every possible next word a probability and the reply is sampled from them;
  "temperature" sets how much chance is involved (Google Cloud, Vertex AI docs, "Adjust parameter values": "Temperature
  controls the degree of randomness in token selection"; at 0 the most likely token is always picked; OpenAI API
  reference: higher values "like 0.8 will make the output more random"). Chat apps don't let you set it.
- Our demo below (the marks are ours, not a claim about any app).

## Our demo (pipeline/creative17/grade_demo.py, series/scripts/creative17_demo/7B.json)
Committed before it ran. Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline, temperature 0.7
(a usual chat setting), 10 tries each way, every reply read by hand. One Class 9 answer (written by us), "Why do we see
lightning before we hear thunder? (10 marks)": "Lightning and thunder happen at the same time in the cloud. But light
travels much faster than sound... sound travels at only about 3,000 m/s in air [the real figure: about 340]... if the
thunder comes 3 seconds after the lightning, the lightning was about 1 km away."

| way | the mark, 10 tries |
|---|---|
| "Mark this answer out of 10. Reply with just the mark." | 7 (once), 8 (7 times), 9 (twice) |
| + a 4-point marking scheme, "mark each point, then the total" | 7 (twice), 8 (4 times), 9 (4 times) |

Read by hand (the scheme way): point (a) "both happen at the same time" is the answer's first sentence; it gave 2/2 once,
1/2 six times, 0/2 three times ("The student did not mention that lightning and thunder happen at the same time"). Point
(c), the speeds: the answer's 3,000 m/s for sound is wrong by about 9 times; it gave full marks 4 of 10 ("This is
correct"), and took one mark off 6 of 10 ("slightly off"). Caption only: the missed 3,000.

## Hook options
1. **(kept)** Frame 1: the evidence board: EXHIBIT A, Varsha's answer, "7/10"; EXHIBIT B, Akhil's, the same words
   highlighted, "9/10"; red string between them, "SAME ANSWER" on the string; Varsha pointing: "He copied my answer word
   for word... he gets nine, I get seven?!"
2. Sir reading the marks out on the class group, Varsha's face falling at "seven".
3. Akhil showing off "9/10" on his phone to Varsha.
Kept 1: the clash, the stake and the injustice in one look; a crime show is new and makes the injustice the joke.

## Script review (human-viewer, v1) and what changed
Both would stop (hook 8 and 9) and share it; the red string makes the unfairness readable with no sound and the crime
show is new. Both: with the sound off, who copied whom wasn't clear and "marked by: AI" was tiny (it read as a teacher's
favouritism); "a little chance" read as "an opportunity"; the rule card was too much to read; "the AI points to the
lines" came right after it misread a line; no action to try tonight. Priya: the bars say mostly 8: one answer giving 7
and 9 is rare (about 4 in 100 pairs; 16 with the scheme), so say "mostly eight, but seven and nine came up"; the scheme
widened the spread, "still seven to nine" undersold it; a 7B on a laptop isn't sir's app: say "try it on yours"; keep
the answer's 3,000 m/s off screen. Both: why would Akhil, with a 9, ask to be marked again? Changed: frame 1 keeps only
the marks, ORIGINAL / COPIED stamps and "SAME ANSWER · MARKED BY AI", big; line 4 "It rolls a dice for every word"; line
6 "Mostly eight. But seven and nine both came up!"; line 8 "The marks jumped even more!"; line 10 "So the AI flags the
lines. A person checks them and gives the marks." with a card "GOT AN AI MARK? TEST IT: same answer, 3 new chats. The
mark changes? Show your teacher."; "try it on yours" on the test card; line 11 "Sir, mark mine again, I'll get ten!
...Seven?!". Telugu: "నాకు ఏడేనా?!" (not "ఏడా", heard as "where" or "cried"); "సార్ ఫోన్ లో చాట్ బాట్ దిద్దింది";
"మెషీన్ ఎవరికీ ఫేవర్ చేయదు" (not "పక్షపాతం", one sound from "పక్షవాతం", paralysis); "ప్రతి మాటకీ అది డైస్ వేసి
ఎంచుకుంటుంది" (not "లక్", heard near "లక్ష"); "అదీ చేశాం: ఇంకా ఎక్కువ తేడా!"; "మనిషి చూసి, మార్కులు వేయాలి".

## Script (English) · ~45 s (v2 lines in pipeline/creative17/make_specs.py)
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Varsha | He copied my answer word for word... [1] he gets nine, I get seven?! | frame 1: CASE FILE · Varsha's sheet stamped ORIGINAL, 7/10 · Akhil's, the same words highlighted, stamped COPIED, 9/10 · red string "SAME ANSWER · MARKED BY AI" |
| 2 | Akhil | Sir's AI marked it. [1] Machines don't play favourites! |  |
| 3 | Srinivas sir | Same answer, two marks? [1] Impossible. |  |
| 4 | Varsha | Possible, sir. It rolls a dice for every word. [1] Ask again, get a new mark. | insert: HOW A CHAT AI ANSWERS: each next word has odds: it rolls for it · a wheel (7 · 8 · 9, sized by our test) lands on 8, then 9 · "ask again → a new roll → a new mark" |
| 5 | Akhil | Prove it! |  |
| 6 | Varsha | We had a small free AI mark one answer, ten times. [1] Mostly eight. But seven and nine both came up! | OUR TEST: a small free AI on a laptop, offline (Qwen2.5 7B) · ONE answer, marked 10 times · try it on yours · tiles 7 8 8 9 8 9 8 8 8 8 · "mostly 8, but 7 and 9 came up" |
| 7 | Srinivas sir | Then I'll give it my marking scheme! |  |
| 8 | Varsha | We did. The marks jumped even more! [1] And three times, it gave my first line a zero! | + a 4-point marking scheme: tiles 9 9 8 9 9 8 7 7 8 8 · HER FIRST LINE "...happen at the same time in the cloud." · THE AI, 3 TIMES OUT OF 10: 0/2 "The student did not mention that lightning and thunder happen at the same time." |
| 9 | Akhil | So it's a lottery?! |  |
| 10 | Varsha | So the AI flags the lines. [1] A person checks them and gives the marks. | AI MARKING: THE RULE · THE AI flags the lines · A PERSON checks, gives the mark · GOT AN AI MARK? TEST IT: same answer, 3 new chats. The mark changes? Show your teacher. |
| 11 | Akhil | Sir, mark mine again, I'll get ten! [1] ...Seven?! | the AI marker: "Akhil: 7/10" → frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Varsha | నా ఆన్సర్ అక్షరం అక్షరం కాపీ కొట్టాడు... [1] వాడికి తొమ్మిది, నాకు ఏడేనా?! |
| 2 | Akhil | సార్ ఫోన్ లో చాట్ బాట్ దిద్దింది. [1] మెషీన్ ఎవరికీ ఫేవర్ చేయదు! |
| 3 | Srinivas sir | ఒకే ఆన్సర్ కి రెండు మార్కులా? [1] కుదరదు. |
| 4 | Varsha | కుదురుతుంది సార్. ప్రతి మాటకీ అది డైస్ వేసి ఎంచుకుంటుంది. [1] ఇంకోసారి అడిగితే, ఇంకో మార్కు. |
| 5 | Akhil | ప్రూవ్ చెయ్! |
| 6 | Varsha | ఒక చిన్న ఫ్రీ చాట్ బాట్ తో, ఒకే ఆన్సర్ ని పది సార్లు దిద్దించాం. [1] ఎక్కువ సార్లు ఎనిమిది. కానీ ఏడూ వచ్చింది, తొమ్మిదీ వచ్చింది! |
| 7 | Srinivas sir | అయితే నా మార్కింగ్ స్కీమ్ ఇస్తా! |
| 8 | Varsha | అదీ చేశాం: ఇంకా ఎక్కువ తేడా! [1] మూడు సార్లు, నా మొదటి లైన్ కి సున్నా వేసింది! |
| 9 | Akhil | అంటే ఇది లాటరీనా?! |
| 10 | Varsha | అందుకే చాట్ బాట్ లైన్లు చూపిస్తుంది. [1] మనిషి చూసి, మార్కులు వేయాలి. |
| 11 | Akhil | సార్, నాది ఇంకోసారి దిద్దండి, పది వస్తుంది! [1] ...ఏడేనా?! |

Telugu notes: no "ఏఐ" in voiced text ("చాట్ బాట్"); "మళ్ళీ" avoided (EP42); "సున్నా" (zero) and "లక్" to check on the
transcripts; no word one slipped letter from a swear word.

## Caption ask (an opinion on the conflict; caption only)
Should a teacher be allowed to mark homework with an AI? Yes or no, and why?
