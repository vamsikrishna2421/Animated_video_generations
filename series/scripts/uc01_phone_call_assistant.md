# UC01 "42 Seconds of Silence": how an AI phone-call assistant works (queue 064)

A teaching skit in Ravi anna's shop (ROUTINE.md Run 1). Cast: Ravi anna and the shop's phone AI (the shop and people are
made up; our test is real). Topic (SYLLABUS UC01): speech-to-text → LLM → text-to-speech, repeat; latency;
interruptions. Point family H (cost / speed, who pays), last used by EP57 (Nov 20); the posts before it are EP58 (R)
and Creative 37 (L). Bujji's reads applied: frame 1 money-first (no question frame for tutorials); no comment ask, the
try-it in the caption; the middle stays steps-first (EP57) until EP54's 7-day read lands.

## Facts
- Our test (`series/scripts/uc01_demo/README.md`, `pipeline/uc01/call_demo.py`, committed before it ran): one phone
  order (₹1,928), everything on our computer (no GPU), medians of 6 runs. Wait for the whole reply: 41.7 s of silence
  (ears 1.8, brain 29.6, mouth 10.1), total right 6/6. Speak the first sentence while the rest is written: 2.5 s, right
  6/6. "Two short sentences": 7.4 s, right 0/6 (₹2,156-₹2,450). The 1.5B model: right 1/6 (₹1,450, the rice alone, 3
  times).
- People leave about 0.2 s between turns (Stivers et al., PNAS 2009, 10 languages; reported by Scientific American and
  National Geographic).
- Big apps on fast chips (OpenAI's own page, May 2024): its old three-model voice mode (speech-to-text → GPT → speech)
  averaged 2.8 s (GPT-3.5) and 5.4 s (GPT-4); GPT-4o averages 0.32 s. Vendor figures, attributed on screen.

## Hook options
1. **Chosen: money-first, same-measure clash.** Frame 1: "₹1,928 ORDER · SHE HUNG UP" over two blocks, "PEOPLE REPLY IN
   0.2 s" (green) and "SHOP AI REPLIED IN 42 s" (red); Ravi with the dead phone. Line 1: "She hung up! A nineteen
   twenty-eight rupee order, after forty-two seconds of silence!"
2. Count clash: "42 s vs 2.5 s" (the fix in frame 1): gives the answer away.
3. Same-item money clash: "RIGHT TOTAL ₹1,928 vs SHORT ANSWER ₹2,450": strong, but it belongs to the middle.

## Script v1 (EN: Ravi and the AI on Fish, the AI through the phone sound; TE: Parler). [n] = picture cue; " | " = beat.
| # | who | shot | EN | TE |
|---|---|---|---|---|
| 1 | ravi | hook | She hung up! A nineteen twenty-eight rupee order, [1] after forty-two seconds of silence! | ఫోన్ పెట్టేసింది! పంతొమ్మిది వందల ఇరవై ఎనిమిది రూపాయల ఆర్డర్, [1] నలభై రెండు సెకన్ల నిశ్శబ్దం తర్వాత! |
| 2 | ai | ai | I was answering. [1] First I hear, then I think, then I speak. | నేను జవాబు చెప్తూనే ఉన్నా. [1] ముందు వింటా, తర్వాత ఆలోచిస్తా, తర్వాత మాట్లాడతా. |
| 3 | ravi | ravi | Forty-two seconds of thinking?! | నలభై రెండు సెకన్లు ఆలోచనా?! |
| 4 | ai | loop | Hearing her: two seconds. [1] Writing my whole reply: thirty. [2] Turning it into speech: ten. [3] People reply in a fifth of a second. | ఆవిడ మాట వినడానికి రెండు సెకన్లు. [1] మొత్తం జవాబు రాయడానికి ముప్పై. [2] దాన్ని మాటగా మార్చడానికి పది. [3] మనుషులు సెకనులో ఐదో వంతులో జవాబిస్తారు. |
| 5 | ravi | ravi | Then keep it short! | అయితే చిన్నగా చెప్పు! |
| 6 | ai | short | We tried that. [1] Four seconds, [2] and the total was wrong, six times out of six. | అదీ చేశాం. [1] నాలుగు సెకన్లు, [2] కానీ టోటల్ ఆరుకి ఆరు సార్లు తప్పు. |
| 7 | ravi | ravi | Then a smaller, faster brain! | అయితే చిన్న, ఫాస్ట్ బ్రెయిన్ పెట్టు! |
| 8 | ai | small | Faster, [1] but right only once in six. Three times it billed only the rice. | ఫాస్ట్ గానే ఉంది, [1] కానీ ఆరులో ఒక్కసారే సరైంది. మూడు సార్లు బియ్యానికి మాత్రమే బిల్లు వేసింది. |
| 9 | ravi | quiz | So, fast and right? [1] A: shorter answers. B: a smaller brain. C: start talking sooner. | మరి ఫాస్ట్ గానూ, కరెక్ట్ గానూ ఎలా? [1] చిన్న జవాబా? చిన్న బ్రెయిన్ ఆ? లేక ముందే మాట్లాడటమా? |
| 10 | ai | answer | C! \| I say my first sentence while I work out the rest. [1] First sound in two and a half seconds, [2] and the total right, six of six. | మూడోది! \| మిగతా జవాబు రాస్తూనే, ముందు ఒక వాక్యం చెప్పేస్తా. [1] రెండున్నర సెకన్లలో మాట వినిపిస్తుంది, [2] టోటల్ కూడా ఆరుకి ఆరు సరైంది. |
| 11 | ravi | rule | Speak early, but never cut the maths! | ముందే మాట్లాడు, లెక్క మాత్రం కట్ చేయకు! |
| 12 | ai | twist | Hello! One twenty-five kilo bag of rice, [1] two litres of oil... | హలో! ఒక ఇరవై ఐదు కిలోల బియ్యం బస్తా, [1] రెండు లీటర్ల నూనె... |
| 13 | ravi | loop | Stop! She's talking! | ఆగు! ఆవిడ మాట్లాడుతోంది! |

## On screen (English in both versions)
- Frame 1: "₹1,928 ORDER · SHE HUNG UP"; blocks "PEOPLE REPLY IN 0.2 s" | "SHOP AI REPLIED IN 42 s"; the shop, Ravi with
  the phone showing "CALL ENDED"; chip "UC01 · AI From Scratch".
- Line 2: a "made up shop · our test is real" chip.
- Line 4 (insert, steps-first): three boxes in a row, EARS (speech → text) 1.8 s, BRAIN (writes the reply) 29.6 s,
  MOUTH (text → speech) 10.1 s, a red bar filling to "41.7 s of silence"; a green tick at "people: ~0.2 s (10-language
  study)"; note "our small computer, no GPU · OpenAI's figures for big apps: 0.3-5.4 s".
- Line 6: "TOLD: 'REPLY IN TWO SHORT SENTENCES'": 4 s; six totals ₹2,259, ₹2,450, ₹2,156, ₹2,159, ₹2,259, ₹2,359 struck
  out against "RIGHT: ₹1,928"; "0 of 6".
- Line 8: "A SMALLER MODEL (1.5B)": fast; totals ₹1,450 ×3, ₹1,605, ₹1,760, ₹1,928; "1 of 6"; "₹1,450 = the rice alone".
- Line 9: the quiz, A / B / C held about 2 s.
- Line 10: a timeline: "Hello!" playing at 2.5 s while the rest is still being written; "6 of 6 right"; 41.7 s → 2.5 s.
- Line 11: rule chip "START TALKING SOONER · NEVER CUT THE WORKING".
- Lines 12-13: the caller's bubble "WAIT, MAKE IT 3 DOZEN EGGS!" while the AI keeps reading; "NEXT PROBLEM:
  INTERRUPTIONS"; loops to frame 1.

Sound: a boom, clap and a hang-up beep on frame 1; a clock tick under the silence bar; pops on each stage box; a buzz on
each wrong total; a drop before the quiz answer, a ding on C; a lift into the rule; the caller's line as a phone bubble
pop; a riser and the slam back to frame 1.
Caption try-it (no comment ask): "Call any shop's AI line or voice assistant and count the seconds before it speaks."

## Script review (human-viewer, v1) and what changed
- Both viewers: the quiz came after A and B had already failed → the quiz now comes right after the three boxes, and the
  tries answer it; "short = wrong" needed a why → "I do the sum by writing it out"; the ending only works if we hear the
  caller → the caller is voiced, and the AI reads on over her.
- Priya (facts): "four seconds" was neither 7.4 s nor 4.7 s → "seven seconds" (wait for the whole short reply, the same
  measure as 42); the bar now shows the sum of the three medians, 41.5 s; the 2.5 s is "worked out from our timings" and
  "still not human-fast"; the CPU caveat and the big apps' 3-5 s (OpenAI's three-step voice mode) are said, and GPT-4o's
  0.32 s is not lumped in; the 1.5B model got the full ask (as A), not the short one.
- Sandeep: "nineteen twenty-eight" sounded like a year → "an almost-two-thousand-rupee order" (₹1,928 on screen);
  "wrong every time / right once / right every time"; option C "TALK WHILE THINKING"; the chip says MATHS; "one bag of
  rice, twenty-five kilos"; one buzz, not six; the UC01 chip off frame 1. Telugu: "ఒక్క మాట లేదు", "ఆలోచిస్తావా",
  రెప్పపాటు (0.2 s on screen), "షార్ట్ గా", "చిన్న మోడల్ పెట్టు", "కరెక్ట్ అయింది", "సీ!", "బియ్యం బస్తా, ఇరవై ఐదు కిలోలు, ఒకటి".

## Script v2
| # | who | shot | EN | TE |
|---|---|---|---|---|
| 1 | ravi | hook | She hung up! An almost-two-thousand-rupee order, [1] after forty-two seconds of silence! | ఫోన్ పెట్టేసింది! దాదాపు రెండు వేల రూపాయల ఆర్డర్, [1] నలభై రెండు సెకన్లు ఒక్క మాట లేదు! |
| 2 | ai | ai | I was answering! [1] On this small computer, I hear, then think, then speak, one after the other. | నేను జవాబు చెప్తూనే ఉన్నా! [1] ఈ చిన్న కంప్యూటర్ లో, ముందు వింటా, తర్వాత ఆలోచిస్తా, తర్వాత మాట్లాడతా. |
| 3 | ravi | ravi | Forty-two seconds of thinking?! | నలభై రెండు సెకన్లు ఆలోచిస్తావా?! |
| 4 | ai | stages | Hearing her: two seconds. [1] Writing my whole reply: thirty. [2] Turning it into speech: ten. [3] Even big apps took three to five seconds for these three steps. | ఆవిడ మాట వినడానికి రెండు సెకన్లు. [1] మొత్తం జవాబు రాయడానికి ముప్పై. [2] మాటగా మార్చడానికి పది. [3] పెద్ద యాప్స్ కూడా, ఈ మూడు స్టెప్పులకి మూడు నుంచి ఐదు సెకన్లు తీసుకున్నాయి. |
| 5 | ravi | quiz | So how do I make you fast? [1] A, shorter answers. B, a smaller model. C, talk while thinking. | మరి నిన్ను ఫాస్ట్ ఎలా చేయాలి? [1] షార్ట్ జవాబా? చిన్న మోడలా? లేక ఆలోచిస్తూనే మాట్లాడటమా? |
| 6 | ai | short | Shorter: seven seconds, [1] but the total was wrong every time. [2] I do the sum by writing it out. | షార్ట్ జవాబు: ఏడు సెకన్లు, [1] కానీ టోటల్ ప్రతిసారీ తప్పు. [2] నేను లెక్క రాస్తూనే చేస్తా. |
| 7 | ravi | ravi | Then a smaller model! | అయితే చిన్న మోడల్ పెట్టు! |
| 8 | ai | small | Faster, [1] but right only once. Three times, it billed only the rice. | ఫాస్ట్ గానే ఉంది, [1] కానీ ఒక్కసారే కరెక్ట్ అయింది. మూడు సార్లు బియ్యానికి మాత్రమే బిల్లు వేసింది. |
| 9 | ai | answer | C! \| I say one sentence while I write the rest. [1] She hears me in two and a half seconds, [2] and the total is right every time. | సీ! \| మిగతాది రాస్తూనే, ముందు ఒక వాక్యం చెప్పేస్తా. [1] రెండున్నర సెకన్లలో ఆవిడకి నా మాట వినిపిస్తుంది, [2] టోటల్ కూడా ప్రతిసారీ కరెక్ట్. |
| 10 | ravi | rule | Talk while thinking, but never cut the maths! | ఆలోచిస్తూనే మాట్లాడు, లెక్క మాత్రం కట్ చేయకు! |
| 11 | ai | twist | Hello! One bag of rice, twenty-five kilos, [1] two litres of oil... | హలో! బియ్యం బస్తా, ఇరవై ఐదు కిలోలు, ఒకటి. [1] రెండు లీటర్ల నూనె... |
| 12 | caller | twist | Wait, make it three dozen eggs! | ఆగండి, గుడ్లు మూడు డజన్లు! |
| 13 | ai | twist | ...and two dozen eggs. | ...రెండు డజన్ల గుడ్లు. |
| 14 | ravi | loop | You're not listening! [1] She'll hang up again! | నువ్వు వినట్లేదు! [1] మళ్ళీ ఫోన్ పెట్టేస్తుంది! |

On screen v2: frame 1 bar "₹1,928 ORDER · SHE HUNG UP", blocks "PEOPLE REPLY IN 0.2 s" | "SHOP AI REPLIED IN 42 s", no UC01
chip; the boxes 1.8 + 29.6 + 10.1 = 41.5 s on "our small computer, no GPU"; the quiz options "SHORTER ANSWERS / A SMALLER
MODEL / TALK WHILE THINKING"; "0 of 6 right" with one buzz and "it does the sum by writing it out"; "1 of 6 right";
the timeline "2.5 s (worked out from our timings) · still not human-fast (0.2 s)"; the rule "TALK WHILE THINKING ·
NEVER CUT THE MATHS"; the caller's bubble on line 12; "NEXT PROBLEM: INTERRUPTIONS" on line 14.

## Voices
- EN (Fish): "it billed only the rice" was heard "it build only the rice" → "it charged only for the rice". The judge
  marked "C." (too short) and "two and a half" (more words than "2.5") as bad; their transcripts are exact, so the
  best-scored takes stay.
- TE (Parler): every take read in full (the judge keeps 110 letters). Line 8's first take garbled its end → re-voiced with
  a check on its last words. Line 6's check expected "एड" where Whisper writes "येड" for ఏడు (fixed). The first Telugu
  run was killed for lack of memory (the test's two models were still in the RAM disk; removed).
- EN 64.4 s, TE 71.9 s.
