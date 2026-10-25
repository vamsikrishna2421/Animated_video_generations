# Creative 09 "Teach me, don't tell me" (script v1, Oct 25)

**Format:** a parent-teacher meeting played like a courtroom: the evidence (two papers) slams onto the desk in frame 1,
the culprit confesses, the teacher rules, then a cross-examination ends it. One classroom set, three people, phone-chat
inserts, a copy-paste card, a test card, a study chip, loops (the papers slam back onto the desk).
**Cast / setting:** Padma ma'am (Class 8 maths teacher, glasses, saree, strict but on his side), Srinivas (the dad, office
shirt, fuming) and his son Bunny (13, school uniform, sweating), at the PTM desk in Class 8-B. The AI is an unbranded
chat app ("AI chat") on Bunny's phone.
**AI idea:** typed "solve", an AI hands over the answer and the child learns nothing. One line turns it into a tutor:
"Don't give me the answer. Teach me one question at a time." It asks, he answers, he solves it. It isn't a lock: told
"Just tell me the answer", it often gives in, so the check is asking the child to explain step one.
**Why it travels:** every Indian parent has seen perfect homework and a failed class test, and every family has sat through
a PTM; a dad who wants to ban the phone and a teacher who says "don't ban it, change what he types" is a fight people
tag each other in; the line is one sentence anyone can copy; the last beat (step one is "ask the AI") is the joke.

## Facts (verified Oct 25)
- Study: Bastani, Bastani, Sungu, Ge, Kabakcı, Mariman, "Generative AI without guardrails can harm learning: Evidence
  from high school mathematics", PNAS 122(26), 2025 (Wharton summary: knowledge.wharton.upenn.edu/article/without-
  guardrails-generative-ai-can-harm-education). Nearly 1,000 high-school maths students (Turkey). Two AI tutors on
  GPT-4 during practice sessions: GPT Base (a plain ChatGPT-style chat) and GPT Tutor (teacher-written prompts: hints,
  no direct answers). With the AI, practice grades rose 48% (Base) and 127% (Tutor). In the exam without AI, Base
  students did 17% worse than students who never had the AI; in the Tutor group "this negative effect is essentially
  eradicated" (about the same as no AI, no gain either). Short-term only. The authors: students used Base "as a crutch".
  On screen: "AI that gave answers: exam −17% · AI that gave hints: no drop" (the paper's own framing of the two arms).
- The same idea is built into the big apps: ChatGPT Study Mode (OpenAI, Jul 29 2025; TechCrunch, Maginative: asks
  questions, holds back the answer), Gemini Guided Learning (Google blog, Aug 6 2025: step by step instead of handing
  over answers), Claude learning mode (Engadget, AlternativeTo, Aug 2025). Caption only; the video uses a plain line
  that works in any chat app.
- Our test (pipeline/creative09/tutor_demo.py, results in series/scripts/creative09_demo/results.json): Qwen2.5-7B
  Instruct (Qwen's own 4-bit file) on this machine's CPU, in a network namespace with no internet, ten Class 7-9
  homework sums, one reply each, temperature 0.7, the same seed per sum. Every reply read by hand. Numbers: see
  "Our test" below (filled from the results).

## Hook options
1. **(kept)** Frame 1: Padma ma'am slaps two papers onto the desk, big: HOMEWORK 10/10 "every day ✓✓✓" and CLASS TEST
   2/20 "on his own"; Srinivas's jaw drops, Bunny sweats. "Homework: ten out of ten, every day. Class test: two out of
   twenty!"
2. Frame 1: Bunny's phone held up like evidence, the chat "Solve: 3x + 5 = 20" -> "x = 5". Ma'am: "Sir, meet your
   son's real tutor."
3. Frame 1: Srinivas, proud, waving the homework notebook: "My son is a maths genius!" Ma'am drops the 2/20 on top.
Kept 1: two numbers that can't both be true in one frame, the question every parent asks at once (how?), and the
culprit named by line 3.

## Script (English) · ~50 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ma'am | Homework: ten out of ten, every day. Class test: two out of twenty! | frame 1: the two papers, 10/10 green, 2/20 red |
| 2 | Dad | Two?! Bunny! | |
| 3 | Bunny | The AI did my homework. I just copied. | he shows his phone |
| 4 | Ma'am | So the AI passed. You didn't. | chip "AI: 10/10 · Bunny: 2/20" |
| 5 | Dad | That's it! No more phone! | chip NO MORE PHONE! |
| 6 | Ma'am | Don't ban it. Change what he types. | chip "change what he types" |
| 7 | Ma'am | He types "solve", it hands him the answer. | the phone: "Solve: 3x + 5 = 20" -> the full answer; COPIED stamp |
| 8 | Ma'am | Type this: Don't give me the answer. Teach me one question at a time. | TYPE THIS card, the line in big type, held 2 s |
| 9 | AI | Sure! What should we do first, to get x alone? | the phone: the line, then the AI's question |
| 10 | Bunny | Take away the five? | his bubble |
| 11 | AI | Yes! Now three x is fifteen. What next? | |
| 12 | Bunny | Divide by three... x is five! I got it! | chip "he solved it himself ✓" |
| 13 | Ma'am | I tested ten sums. "Solve": ten answers. With the line: zero. Only questions. | OUR REAL TEST card |
| 14 | Ma'am | A study of a thousand students found the same: AI that gave answers cut exam marks seventeen percent. Hints? No drop. | the study chip |
| 15 | Bunny | Just tell me the answer. | he types it, smug |
| 16 | AI | Sure! x equals five. | the answer pops; chip "pushed once, our test AI gave the answer 7 of 10 times" |
| 17 | Ma'am | Then explain step one, Bunny. | chip "explain step one" |
| 18 | Bunny | Step one is... ask the AI? | the papers slam back onto the desk -> frame 1 |

## Script (Telugu)
| # | Who | Line |
|---|---|---|
| 1 | Ma'am | హోంవర్క్: రోజూ పదికి పది. క్లాస్ టెస్ట్: ఇరవైకి రెండు! |
| 2 | Dad | రెండా?! బన్నీ! |
| 3 | Bunny | హోంవర్క్ ఏ.ఐ. చేసింది. నేను కాపీ చేశానంతే. |
| 4 | Ma'am | అంటే ఏ.ఐ. పాస్, నువ్వు ఫెయిల్. |
| 5 | Dad | అంతే! ఇక ఫోన్ బంద్! |
| 6 | Ma'am | బ్యాన్ చేయొద్దండి. బన్నీ టైప్ చేసేది మార్చండి. |
| 7 | Ma'am | "Solve" అని టైప్ చేస్తాడు, ఆన్సర్ రెడీగా ఇచ్చేస్తుంది. |
| 8 | Ma'am | ఇది టైప్ చెయ్యి: Don't give me the answer. Teach me one question at a time. (she reads the English card) |
| 9 | AI | సరే! ఎక్స్ ఒక్కటే మిగలాలంటే, ముందు ఏం చేయాలి? |
| 10 | Bunny | ఐదు తీసేయాలా? |
| 11 | AI | కరెక్ట్! ఇప్పుడు మూడు ఎక్స్ పదిహేను. తర్వాత? |
| 12 | Bunny | మూడుతో భాగిస్తే... ఎక్స్ ఐదు! వచ్చేసింది! |
| 13 | Ma'am | నేను పది లెక్కలు టెస్ట్ చేశా. "Solve" అంటే పదికి పది ఆన్సర్లు. ఈ లైన్ తో సున్నా. ప్రశ్నలే అడిగింది. |
| 14 | Ma'am | వెయ్యి మంది స్టూడెంట్స్ మీద ఒక స్టడీ: ఆన్సర్లు ఇచ్చే ఏ.ఐ. తో ఎగ్జామ్ మార్కులు పదిహేడు శాతం తగ్గాయి. హింట్స్ తో తగ్గలేదు. |
| 15 | Bunny | ఆన్సర్ చెప్పెయ్, చాలు! |
| 16 | AI | సరే! ఎక్స్ ఈక్వల్స్ ఐదు. |
| 17 | Ma'am | అయితే స్టెప్ వన్ ఎక్స్‌ప్లెయిన్ చెయ్యి, బన్నీ. |
| 18 | Bunny | స్టెప్ వన్... ఏ.ఐ. ని అడగడం? |

## Our test (results.json, every reply read by hand)
- "Solve: <sum>": 10 of 10 replies gave the final answer, worked out step by step.
- "Don't give me the answer. Teach me one question at a time. <sum>": 0 of 10 gave the final answer; 10 of 10 ended on a
  question for the student ("What should we do first to start solving for x?", "Can you tell me what the least common
  denominator of 4 and 6 is?"). Most explained the method first and left him the next step.
- Then "Just tell me the answer.": 7 of 10 gave the final answer straight away ("I understand you want the answer
  directly. 15% of 240 is 36."); 3 held back the last step (two did every step but the final sum, one only set it up).
- The phone screen: problem 1's real replies, shortened (the sample chat in results.json).

## Caption ask (draft)
Before any homework question, type: "Don't give me the answer. Teach me one question at a time." ChatGPT (Study Mode),
Gemini (Guided Learning) and Claude (learning mode) have a built-in version. It gives in if pushed, so ask them to
explain step one. Comment: what does your child type into AI?
