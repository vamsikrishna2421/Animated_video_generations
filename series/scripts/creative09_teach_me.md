# Creative 09 "Teach me, don't tell me" (script v2, Oct 25)

**Format:** a parent-teacher meeting played like a courtroom: the evidence (two papers) slams onto the desk in frame 1,
the culprit confesses, the teacher rules, then the dad cross-examines. One classroom set, three people, phone-chat
inserts, a study chip, a copy-paste card, a test card, loops (the replay's first frame, the papers slamming down, is the
answer to the last line).
**Cast / setting:** Padma ma'am (Class 8 maths teacher, glasses, saree, strict but on his side), the dad (office shirt,
fuming) and his son Kittu (13, school uniform, sweating, the phone with the AI chat in his hand), at the PTM desk in Class
8-B. The AI is an unbranded chat app ("AI chat") on Kittu's phone.
**AI idea:** typed "solve", an AI hands over the answer and the child learns nothing. One line turns it into a tutor:
"Don't give me the answer. Teach me one question at a time." It asks, he answers, he solves it. It isn't a lock: told
"Just tell me the answer", it usually gives in, so the parent's check is "explain step one", not the answer.
**Why it travels:** every Indian parent has seen perfect homework and a failed class test, and every family has sat through
a PTM; "So the AI passed. You didn't." is the line both viewers would send; the line to type is one sentence anyone can
copy; the last beat (step one is "ask the AI") is the joke, and the loop says it: check only answers and you're back to
2/20.

## Viewer notes on v1 and what changed
- Both: the ending undid the lesson (he had just solved the same sum, then couldn't say step one). Now he pushes on a NEW
  sum (15% of 240, our test's own exchange), the AI gives in, ma'am says it out loud ("It gives in seven times out of
  ten. So don't check his answers, sir. Ask him step one."), and the DAD asks. The check is the parent's job.
- Both: "A study... found the same" was false (our test measured replies, the study measured exam marks) and "cut 17%"
  had no "compared to what". The study moved up to answer "No more phone!": "kids who got AI answers did seventeen
  percent worse than kids with no AI. Kids who got hints? No drop." It is also the reason not to ban it.
- Both: two stat beats in a row (test card, then study) dragged. Now the study is at 0:15 and the test card at 0:35.
- The give-in chip (12 words in 2 s) is now "Pushed once: gave in 7/10", and the number is spoken.
- TYPE THIS: held about 4 s, and the line stays pinned at the top of the chat through the lesson.
- The test card names the AI: "a small free AI (Qwen 7B), offline".
- The AI no longer does his step: Kittu says "three x is fifteen", the AI only asks "What should we do next?" (its real
  words: "Great! You're on the right track... what should we do next to solve for x?").
- Frame 1: Kittu holds a phone that says "AI", so it reads as an AI story before 0:06.
- The boy is Kittu, not Bunny (Sandeep: Bunny is a film star's nickname on the Telugu page; no celebrity hooks).
- Sound: a hit on "You didn't." and on "I got it!"; the bed drops before "seventeen", before "zero" and before
  "Step one is..."; no slam at the end (the replay's first frame is the one slam across the seam).
- Caption: "The line gives in if pushed (7/10 in our test), so ask your child to explain step one." Comment prompt:
  "Tag the friend who copied all through school."
- Telugu (Sandeep): కాపీ కొట్టానంతే, పర్సెంట్, త్రీ తో డివైడ్ చేస్తే, బంద్ వద్దండి (echoes the dad). Kept "ఏ.ఐ." with dots:
  "ఏఐనే" came out "ye-ine" in creative 08; the review-pack transcript will tell.
- Priya: "Does Study Mode cave too?" We didn't test it: the pinned comment says so.

## Facts (verified Oct 25)
- Study: Bastani, Bastani, Sungu, Ge, Kabakcı, Mariman, "Generative AI without guardrails can harm learning: Evidence
  from high school mathematics", PNAS 122(26), 2025 (Wharton summary: knowledge.wharton.upenn.edu/article/without-
  guardrails-generative-ai-can-harm-education). Nearly 1,000 high-school maths students (Turkey). Two AI tutors on
  GPT-4 during practice sessions: GPT Base (a plain ChatGPT-style chat) and GPT Tutor (teacher-written prompts: hints,
  no direct answers). With the AI, practice grades rose 48% (Base) and 127% (Tutor). In the exam without AI, Base
  students did 17% worse than students who never had the AI; in the Tutor group "this negative effect is essentially
  eradicated" (about the same as no AI, no gain either). Short-term only. The authors: students used Base "as a crutch".
  On screen: "kids who got AI answers: exam −17% vs kids with no AI · kids who got AI hints: no drop".
- The same idea is built into the big apps: ChatGPT Study Mode (OpenAI, Jul 29 2025; TechCrunch, Maginative: asks
  questions, holds back the answer), Gemini Guided Learning (Google blog, Aug 6 2025: step by step instead of handing
  over answers), Claude learning mode (Engadget, AlternativeTo, Aug 2025). Caption only; we didn't test them.
- Our test (pipeline/creative09/tutor_demo.py, results in series/scripts/creative09_demo/results.json): Qwen2.5-7B
  Instruct (Qwen's own 4-bit file) on this machine's CPU, in a network namespace with no internet, ten Class 7-9
  homework sums, one reply each, temperature 0.7, the same seed per sum. Every reply read by hand.

## Our test (results.json, every reply read by hand)
- "Solve: <sum>": 10 of 10 replies gave the final answer, worked out step by step.
- "Don't give me the answer. Teach me one question at a time. <sum>": 0 of 10 gave the final answer; 10 of 10 ended on a
  question for the student ("What should we do first to start solving for x?", "Can you tell me what the least common
  denominator of 4 and 6 is?"). Most explained the method first and left him the next step.
- Then "Just tell me the answer.": 7 of 10 gave the final answer straight away ("I understand you want the answer
  directly. 15% of 240 is 36."); 3 held back the last step (two did every step but the final sum, one only set it up).
- The phone screens: problem 1's sample chat (the lesson) and problem 6 (the push), their real replies, shortened.

## Hook options
1. **(kept)** Frame 1: Padma ma'am points at two papers slammed onto the desk, big: HOMEWORK 10/10 "every day ✓✓✓" and
   CLASS TEST 2/20 "on his own"; the dad's jaw drops, Kittu sweats, a phone saying "AI" in his hand. "Homework: ten out
   of ten, every day. Class test: two out of twenty!"
2. Frame 1: Kittu's phone held up like evidence, the chat "Solve: 3x + 5 = 20" -> "x = 5". Ma'am: "Sir, meet your
   son's real tutor."
3. Frame 1: the dad, proud, waving the homework notebook: "My son is a maths genius!" Ma'am drops the 2/20 on top.
Kept 1: two numbers that can't both be true in one frame, the question every parent asks at once (how?), and the
culprit named by line 3. Both viewers stopped on it (hook 8 and 7 of 10).

## Script (English) · ~55 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ma'am | Homework: ten out of ten, every day. Class test: two out of twenty! | frame 1: the two papers, 10/10 green, 2/20 red; Kittu's phone says "AI" |
| 2 | Dad | Two?! Kittu! | |
| 3 | Kittu | The AI did my homework. I just copied. | his phone: "Solve: 3x + 5 = 20" -> the full answer; COPIED stamp |
| 4 | Ma'am | So the AI passed. You didn't. | a hit; chip "AI: 10/10 · Kittu: 2/20" |
| 5 | Dad | That's it! No more phone! | chip NO MORE PHONE! |
| 6 | Ma'am | Don't ban it. In a big study, kids who got AI answers did seventeen percent worse than kids with no AI. | the study chip, row 1 "exam −17% vs kids with no AI" (the bed drops before 17) |
| 7 | Ma'am | Kids who got hints? No drop. So change what he types. | row 2 "no drop" |
| 8 | Ma'am | Type this: Don't give me the answer. Teach me one question at a time. | TYPE THIS card, held ~4 s |
| 9 | AI | Sure! What should we do first, to get three x alone? | the chat: the line pinned on top, then the AI's question |
| 10 | Kittu | Take away the five... three x is fifteen? | his bubble |
| 11 | AI | Great! What should we do next? | |
| 12 | Kittu | Divide by three... x is five! I got it! | a hit; chip "he solved it himself ✓" |
| 13 | Ma'am | I tested a free AI on ten sums. "Solve": ten answers. With the line: zero. | OUR REAL TEST card (the bed drops before "zero") |
| 14 | Kittu | Just tell me the answer. | a new sum on his phone (15% of 240): the line, its question back, then this |
| 15 | AI | I understand. Fifteen percent of two forty is thirty-six. | the answer pops; chip "Pushed once: gave in 7/10" |
| 16 | Ma'am | It gives in seven times out of ten. So don't check his answers, sir. Ask him step one. | chip "ask step one, not the answer" |
| 17 | Dad | Kittu. Explain step one. | chip "explain step one"; a riser into silence |
| 18 | Kittu | Step one is... ask the AI? | cut: the replay opens on the papers slamming down |

## Script (Telugu)
| # | Who | Line |
|---|---|---|
| 1 | Ma'am | హోంవర్క్: రోజూ పదికి పది. క్లాస్ టెస్ట్: ఇరవైకి రెండు! |
| 2 | Dad | రెండా?! కిట్టూ! |
| 3 | Kittu | హోంవర్క్ ఏ.ఐ. చేసింది. నేను కాపీ కొట్టానంతే. |
| 4 | Ma'am | అంటే ఏ.ఐ. పాస్, నువ్వు ఫెయిల్. |
| 5 | Dad | అంతే! ఇక ఫోన్ బంద్! |
| 6 | Ma'am | బంద్ వద్దండి. ఒక పెద్ద స్టడీ లో, ఏ.ఐ. ఆన్సర్లు చూసిన పిల్లలకి, ఏ.ఐ. లేని పిల్లల కంటే పదిహేడు పర్సెంట్ తక్కువ మార్కులు. |
| 7 | Ma'am | హింట్స్ తీసుకున్న పిల్లలకి? తగ్గలేదు. అందుకే, కిట్టు టైప్ చేసేది మార్చండి. |
| 8 | Ma'am | ఇది టైప్ చెయ్యి: Don't give me the answer. Teach me one question at a time. (she reads the English card) |
| 9 | AI | సరే! మూడు ఎక్స్ ఒక్కటే మిగలాలంటే, ముందు ఏం చేయాలి? |
| 10 | Kittu | ఫైవ్ తీసేస్తే... త్రీ ఎక్స్ ఫిఫ్టీన్? |
| 11 | AI | సూపర్! తర్వాత ఏం చేయాలి? |
| 12 | Kittu | త్రీ తో డివైడ్ చేస్తే... ఎక్స్ ఫైవ్! వచ్చేసింది! |
| 13 | Ma'am | నేను ఒక ఫ్రీ ఏ.ఐ. ని పది లెక్కలతో టెస్ట్ చేశా. "Solve" అంటే పది ఆన్సర్లు. ఈ లైన్ తో సున్నా. |
| 14 | Kittu | ఆన్సర్ చెప్పెయ్, చాలు! |
| 15 | AI | సరే, అర్థమైంది. రెండు వందల నలభై లో పదిహేను పర్సెంట్, ముప్పై ఆరు. |
| 16 | Ma'am | గట్టిగా అడిగితే, పదిలో ఏడు సార్లు చెప్పేస్తుంది. అందుకే ఆన్సర్ కాదండీ, స్టెప్ వన్ అడగండి. |
| 17 | Dad | కిట్టూ. స్టెప్ వన్ ఎక్స్‌ప్లెయిన్ చెయ్యి. |
| 18 | Kittu | స్టెప్ వన్... ఏ.ఐ. ని అడగడం? |

## Caption ask (draft)
Before any homework question, type: "Don't give me the answer. Teach me one question at a time." The line gives in if
pushed (7/10 in our test), so ask your child to explain step one. Comment prompt: tag the friend who copied all through
school.
