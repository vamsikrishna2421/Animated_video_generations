# EP56 "Can a Free Voice Assistant Understand Telugu? Build a Voice Assistant" (Season 6, a screen tutorial) · queue 060 · script v1, Nov 18

## The one variable (Bujji's EP53 48h read, agreed Nov 17)
Frame 1 is a question the viewer already has ("Can a free voice assistant understand Telugu?") with a person at stake
(a customer asking about her refund in Telugu) and what the free ears actually wrote (Hindi letters). Not a number
clash. The numbers (English 7/10, Telugu 0/10) come in line 1 by ~3 s. The middle stays EP54's one code line per step.

## The lesson
A voice assistant is three pieces: ears (speech to text), a brain (EP55's bot and order server, unchanged), a mouth (text
to speech). Each is one line of code on screen; the full code in the pinned comment. Test it in your language with real
numbers, and make it read the number back before it acts.

## Point family
New, P: "What it heard is not what you said" (speech-to-text in your language). The last post was Creative 32 (O).

## Facts
- OpenAI's Whisper: open-source speech recognition, released September 2022, trained on 680,000 hours of audio (OpenAI's
  announcement and paper, arXiv 2212.04356).
- Whisper large-v3: November 2023, Hugging Face model card (1M hours weakly labelled + 4M pseudo-labelled; 10-20% fewer
  errors than large-v2 across languages).
- faster-whisper (SYSTRAN) runs Whisper on a CPU; we used int8 on 4 CPU cores.

## Our test (pipeline/ep56/: make_questions.py, voice_demo.py; committed before each run; fixes noted in
series/scripts/ep56_demo/README.md)
EP54's made-up shop and 10 customers. Each question spoken by our computer voices (Parler), in English and in Telugu
(order numbers said as words, e.g. "నలభై నాలుగు పదిహేడు"). Ears: Whisper small or large-v3 (int8, CPU). Brain: EP55's
WhatsApp bot (Qwen2.5-7B-Instruct, 4-bit) + EP55's fixed order server. Scored: did the right order number reach the shop?
| ears | right number | notes |
|---|---|---|
| English, small | 7 of 10 | 3 came out like prices ("42.90", "46.11", "$44.17") |
| Telugu, small, transcribe | 0 of 10 | 6 in Hindi letters, 4 looping junk |
| Telugu, small, translate to English | 0 of 10 | "Order 40, 417", "43rd January" |
| Telugu, large-v3, transcribe | 3 of 10 | numbers as "40, 4, 17" |
| Telugu, large-v3, translate to English | 5 of 10 | all 5 answers right; no made-up numbers |
- When it couldn't read a number, the AI sent a made-up order number: "12345" 8 times in 50.
- Time on our computer (4 CPU cores): ears 1.5 s (small) / 5.4 s (large-v3, translate); brain ~10 s; mouth (our TTS)
  ~20 s. One answer ≈ 35 s with the bigger ears.

## Script review (human-viewer, v1), what changed for v2
- Frame 1 was overloaded: the customer's bubble first (with an English gloss), the Hindi-letter transcript at ~0.6 s,
  the scores on the voice; labels say what was scored ("right order number") and which model got 0 ("small free model").
  Telugu "తెలుగులో: సున్నా" (not "Telugu is a zero").
- Lines 2-5 (pieces, Whisper's history, three steps) folded into one ~12 s beat: three rows, one code line each, Whisper
  as a chip. "Small ears" -> "small free model".
- "8 times in 50" explained on screen: 10 questions × 5 ways of listening.
- The verdict and the catch said plainly: best free result 5/10, ~35 s an answer, 20 of it the mouth; it answers in
  English.
- The computer-voice caveat said once and turned into the ask ("these were computer voices: try yours"); "read the
  number back" is said as advice until it's better (not tested), with "or let customers type it".
- Telugu: "తనే ఒక నంబర్ పెట్టేసింది" (not "ఒకటి సృష్టించింది: ఒకటి..."); "ట్రాన్స్‌లేట్ చేస్తే"; "తెలుగు మాట, హిందీ
  అక్షరాల్లో"; no "పని చేసే ముందు".
- Caption try-it: one fixed phrase, any 4-digit number, voice typing set to Telugu; it tests your phone's voice typing,
  a different system from ours, and the caption says so.

## Script v2 (EN | TE)
| # | English | Telugu |
|---|---|---|
| 1 | Can a free voice assistant understand Telugu? We built one. Right order number, in English: seven of ten. | In Telugu: zero. | ఫ్రీ వాయిస్ అసిస్టెంట్ కి తెలుగు అర్థమవుతుందా? మేం ఒకటి తయారు చేశాం. ఇంగ్లీష్ లో, ఆర్డర్ నంబర్ పదిలో ఏడుసార్లు కరెక్ట్. | తెలుగులో: సున్నా. |
| 2 | Three pieces, one line of code each: ears turn the voice into text, the brain is last episode's bot, | and a mouth reads the answer out. | మూడు భాగాలు, ఒక్కోదానికి ఒక్క లైన్: మాటని టెక్స్ట్ గా మార్చే చెవులు, పోయిన ఎపిసోడ్ బాట్ మెదడు, | జవాబు చదివి చెప్పే నోరు. |
| 3 | Our test: ten customers, in computer voices. English: three numbers came out like prices. | Telugu, small free model: Telugu words, in Hindi letters. | మా టెస్ట్: పది మంది కస్టమర్లు, కంప్యూటర్ వాయిస్ లలో. ఇంగ్లీష్: మూడు నంబర్లు ధరల్లా వచ్చాయి. | తెలుగు, చిన్న ఫ్రీ మోడల్: తెలుగు మాట, హిందీ అక్షరాల్లో. |
| 4 | When it couldn't read the number, the AI made one up: one, two, three, four, five. Eight times in fifty tries. | నంబర్ అర్థం కానప్పుడు, చాట్‌బాట్ తనే ఒక నంబర్ పెట్టేసింది: ఒకటి, రెండు, మూడు, నాలుగు, ఐదు. యాభై ప్రయత్నాల్లో ఎనిమిదిసార్లు. |
| 5 | Best free result: a bigger model, translating to English first. Five of ten. | About thirty-five seconds an answer on our computer, and twenty of that is the mouth. | బెస్ట్ ఫ్రీ రిజల్ట్: పెద్ద మోడల్, ముందు ఇంగ్లీష్ లోకి ట్రాన్స్‌లేట్ చేస్తే. పదిలో ఐదు. | ఒక్క జవాబుకి దాదాపు ముప్పై ఐదు సెకన్లు; అందులో ఇరవై, నోరే. |
| 6 | These were computer voices, so try it with yours. Until it's better, have it read the number back, or let customers type it. | Next: deploy your AI app. | ఇవి కంప్యూటర్ వాయిస్ లు; మీ గొంతుతో ట్రై చేసుకోండి. అప్పటిదాకా, నంబర్ తిరిగి చదివి చెప్పించండి, లేదా నంబర్ ని టైప్ లో తీసుకోండి. | తర్వాత: మీ యాప్ ని లైవ్ కి తీసుకెళ్ళడం. |

## On screen (English in both versions)
1. Frame 1: "CAN A FREE VOICE ASSISTANT UNDERSTAND TELUGU?"; a customer's bubble in Telugu (the 4417 question) and "WHAT
   THE FREE EARS WROTE" with the Hindi-letter transcript; then blocks "ENGLISH 7/10" and "TELUGU 0/10".
2. Three boxes: EARS (speech -> text) -> BRAIN (EP55's bot + order server) -> MOUTH (text -> speech).
3. A card: "Whisper · OpenAI · open-source speech model · Sept 2022 · 680,000 hours of audio"; "runs on our computer".
4. Code cards, one line each: text = ears.transcribe("question.wav"); answer = bot.ask(text); voice.say(answer).
5. Test card: English small 7/10 with the 3 price-like numbers; Telugu small 0/10 with the Hindi letters.
6. The made-up number: the AI's JSON line with "12345" big; "8 times in 50".
7. Telugu, bigger ears (large-v3), translate: 5/10; a time bar: ears 5 s + brain 10 s + mouth 20 s = ~35 s.
8. Rule card: test in your language · real numbers · read the number back; "NEXT · EP57: DEPLOY YOUR AI APP".

## Caption ask (a try-it with a posted answer)
"Try it: set your phone's voice typing to Telugu and say 'ఆర్డర్ నలభై నాలుగు పదిహేడు' (order 4417), or any 4-digit
number. Post exactly what it typed." (Your phone's voice typing is a different system from the free model we tested.)
