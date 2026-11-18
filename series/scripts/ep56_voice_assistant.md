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

## Script v1 (EN | TE)
| # | English | Telugu |
|---|---|---|
| 1 | Can a free voice assistant understand Telugu? We built one. English: seven of ten. | Telugu: zero. | ఫ్రీ వాయిస్ అసిస్టెంట్ కి తెలుగు అర్థమవుతుందా? మేం ఒకటి తయారు చేశాం. ఇంగ్లీష్: పదిలో ఏడు. | తెలుగు: సున్నా. |
| 2 | A voice assistant is three pieces: ears turn speech into text, a brain answers, and a mouth says it. | వాయిస్ అసిస్టెంట్ లో మూడు భాగాలు: మాటని టెక్స్ట్ గా మార్చే చెవులు, జవాబిచ్చే మెదడు, అది చెప్పే నోరు. |
| 3 | The ears: Whisper, OpenAI's speech model, free and open since 2022. It runs on our own computer. | చెవులు: విస్పర్, ఓపెన్ సోర్స్ స్పీచ్ మోడల్, రెండు వేల ఇరవై రెండు నుంచి ఫ్రీ. మా కంప్యూటర్ లోనే నడుస్తుంది. |
| 4 | Step one, the ears: one line turns the customer's voice into text. Step two, the brain: last episode's bot and order server, unchanged. | స్టెప్ వన్, చెవులు: ఒక్క లైన్, కస్టమర్ మాటని టెక్స్ట్ గా మారుస్తుంది. స్టెప్ టూ, మెదడు: పోయిన ఎపిసోడ్ బాట్, ఆర్డర్ సర్వర్, మార్పు లేకుండా. |
| 5 | Step three, the mouth: a computer voice reads the answer out. | స్టెప్ త్రీ, నోరు: కంప్యూటర్ వాయిస్ జవాబు చదివి చెబుతుంది. |
| 6 | Our test: ten customers' questions, spoken by computer voices. English: seven right; three numbers came out like prices. | Telugu, small ears: Hindi letters. Zero. | మా టెస్ట్: పది మంది కస్టమర్ల ప్రశ్నలు, కంప్యూటర్ వాయిస్ లతో. ఇంగ్లీష్: ఏడు కరెక్ట్; మూడు నంబర్లు ధరల్లా వచ్చాయి. | తెలుగు, చిన్న చెవులు: హిందీ అక్షరాలు. సున్నా. |
| 7 | And when it couldn't read the number, the AI made one up: one, two, three, four, five. | నంబర్ అర్థం కానప్పుడు, చాట్‌బాట్ ఒకటి సృష్టించింది: ఒకటి, రెండు, మూడు, నాలుగు, ఐదు. |
| 8 | Bigger ears, translating to English first: five of ten. | And on our computer, one answer took about thirty-five seconds. | పెద్ద చెవులు, ముందు ఇంగ్లీష్ లోకి అనువదిస్తే: పదిలో ఐదు. | మా కంప్యూటర్ లో, ఒక్క జవాబుకి దాదాపు ముప్పై ఐదు సెకన్లు. |
| 9 | So test it in your language, with real numbers, and make it read the number back before it acts. Next: deploy your AI app. | అందుకే మీ భాషలో, నిజమైన నంబర్లతో టెస్ట్ చేసుకోండి; పని చేసే ముందు, నంబర్ తిరిగి చదివి చెప్పేలా చేసుకోండి. | తర్వాత: మీ యాప్ ని లైవ్ కి తీసుకెళ్ళడం. |

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
"Try it: say your order number (or any 4-digit number) in Telugu to your phone's voice typing. Post exactly what it typed."
