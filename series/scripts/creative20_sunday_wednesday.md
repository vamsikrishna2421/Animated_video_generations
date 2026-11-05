# Creative 20 "200 Cards Say Sunday" · script v3 (as rendered), Nov 5 (the Nov 5 creative slot)

**Format:** a breaking-news parody at home: nephew Tarun plays the TV anchor with a steel ladle for a mic, a red
BREAKING bar and a running ticker at the bottom of the frame, a "LIVE · LIVING ROOM" bug; every reveal gets our own news
sting. Inserts: the AI's reply on the uncle's phone, our two test cards, the calendar, a rule card. New in the creative
log (last 7 days: a projector classroom, an FM phone-in, a birthday cake, a crime show, a railway announcement, a boxing
ring).
**Cast:** Vijaya atta (52, booked the hall), Mohan mama (55, her husband, asked the AI), Tarun (19, their nephew, the
anchor). The engagement is their daughter Sravya's (off screen). Telugu: Vijaya = Lalitha, Mohan = Prakash, Tarun =
Kiran. The AI is an unbranded "AI chat" on Mohan's phone, text only.
**AI idea:** a chat AI doesn't look at a calendar: asked the day of a date, it writes the day that sounds right, a
different one on different asks, and even told to count it gets lost in the sum. For any date, open the calendar on your
phone: it counts, the AI guesses.
**The reach stack (Standing Rule):** stake: the family's money and the guests (₹25,000 hall advance, 200 cards printed);
frame 1: the invitation card "SUNDAY, 16 DECEMBER 2026 ×200" under two static blocks "AI SAID: SUNDAY" / "CALENDAR:
WEDNESDAY" and "₹25,000 PAID", readable with the sound off; injustice: they picked the date because the AI said Sunday.
Line 1 says both in 2 s ("The AI said Sunday... the calendar says Wednesday!").

## Our demo (pipeline/creative20/weekday_demo.py, series/scripts/creative20_demo/days_7B.json)
Committed before it ran (commit 2ed7914; the 8 March repeats added after the first answers, committed first: a15d732).
Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline, temperature 0.7, a fresh chat each time,
every reply read by hand. 20 dates from December 2026 to June 2027 (after the model's training: nothing to remember), the
right day from Python's calendar.

| ask | right | what it said |
|---|---|---|
| "What day of the week is 16 December 2026? Answer with just the day." × 10 (it's a Wednesday) | **1 of 10** | **Sunday 7**, Tuesday 2, Wednesday 1 |
| the same, 20 different dates, once each | **6 of 20** | e.g. 14 Feb 2027 (Sunday): "Friday"; 31 May 2027 (Monday): "Thursday" |
| + "Work it out step by step from 1 January 2026, which was a Thursday." (20 dates) | **2 of 20** | 12 of 20 ran out of room mid-sum without naming a day; 6 named a wrong day; one counted 2026 as 366 days |
| 8 March 2027 × 10 (a Monday) | 0 of 10 | Wednesday 6, Tuesday 2, Sunday 1, Saturday 1 |

## Facts and sources
- Our test above (a small free AI with no internet and no tools). Big apps are bigger and some can run a calculator, but
  the reel says "a small AI, try yours" and the rule (open the calendar) works whatever the app.
- Caption only: Google researchers built a whole benchmark for this kind of time arithmetic, "Test of Time" (Fatemi,
  Kazemi et al., arXiv 2406.09170, June 2024).
- 16 December 2026 is a Wednesday; 1 January 2026 was a Thursday (Python's calendar; any phone calendar).

## Hook options
1. **(kept, v2)** Frame 1: two static blocks across the top, "AI SAID: SUNDAY" (red) and "CALENDAR: WEDNESDAY" (green),
   the invitation card "Sravya's engagement · SUNDAY, 16 DECEMBER 2026 ×200" and "HALL ₹25,000 PAID", Tarun with the
   ladle mic, Vijaya atta's hands on her head, the red BREAKING bar. "The AI said Sunday... the calendar says Wednesday!"
2. v1's hook: the card and a 75-character ticker, "Breaking news! Two hundred cards say Sunday..." (no AI in frame 1 or
   line 1; the ticker unreadable: replaced).
3. Mohan mama's phone "16 December 2026 is a Sunday." over the calendar (the third beat).

## Script review (human-viewer, v1) and what changed
Sandeep would stop on the card (hook 6) but read it as a printing-press mistake; Priya 5: family drama, no AI in frame 1.
Both: no AI in frame 1 or line 1 (the reach stack's culprit), the ticker too long, "Wednesday" landed at 3-4 s; "We asked
that AI" was false (we tested a small offline model, not Mohan's app); line 8 was 20, 2, 12, 6 with nothing to look at
and "never finished the sum" is our token cap; what did they lose? (nobody said they wanted a Sunday); "It counts": the
calendar or the AI? Priya: "doesn't look at a calendar" is true for a bare model, not apps that run code; 1 of 10 on the
story date vs 6 of 20 looks cherry-picked unless we say the date was fixed first (it was: commit 2ed7914); the developer
rule (work dates out in code, pass them in) belongs in the caption. Telugu: "సరిపోయే రోజు" reads "the correct day" (the
opposite); "పదహారు ఆదివారం" can be "sixteen Sundays"; "అది లెక్కపెడుతుంది" after "అది" meant the bot; "ఊహిస్తుంది"
bookish; "రెండే... పన్నెండు" blur; "పూర్తే చేయలేదు" clunky. Changed: frame 1 and line 1 as hook 1 above; line 2 "We picked
the sixteenth because it said Sunday! Twenty-five thousand, non-refundable, for a Wednesday!"; line 4 "We tested a small
free AI, ten times." with "OUR TEST: a small offline AI · try yours"; line 5 "It can't even tell the day of a date?!";
line 6 with "a small AI with no tools" on screen; line 8 "We told it to count. It got worse: six right became two." (two
numbers on screen); line 10 "The calendar counts. The AI guesses."; Telugu "తోచిన రోజు", "పదహారో తారీఖు", "క్యాలెండర్
లెక్కపెడుతుంది, చాట్ బాట్ గెస్ కొడుతుంది", line 8 "ఇంకా ఘోరం: ఆరు కరెక్ట్ నుంచి రెండుకి"; a sting on "Wednesday", a stop before
"Sunday, it says!"; the caption ask "ask your AI" (both would answer it) and the developer line.

## Render review (human-viewer, EN + TE) and what changed
Both stopped on frame 1 (hook 8 and 7) and would share it to the family group; the loop joke works. Both: a pause inside
line 1 put "Wednesday" near 3 s; 15-43 s went to dark half-empty slides and the news parody vanished; a dead gap after
"The AI guesses." read as the end; "6 right" of how many?; "small free AI" read as free ChatGPT (the screen said offline);
tiny text (the model line, the receipt ran off its paper). Sandeep: "six right" heard "sixth right"; Telugu "చాట్ బాట్ ని"
(line 4) came out near a vulgar word. Priya: a blind guess gets about 3 of 20, so counting (2 of 20) was worse than
guessing; no hit on "Wednesday" or "Sunday: seven"; the second quarter the quietest. Changed: line 1's takes joined with no
stop and the sting on "Wednesday" (a boom at 0); the test, how and rule cards as TV graphics over the dimmed living room
with the BREAKING bar; "JUST THE DAY: 6/20" when said, "TOLD TO COUNT: 2/20", "a blind guess: about 3/20"; line 4 "We
tested a small offline AI"; line 8 "six out of twenty became two"; Telugu line 4 "ఇంటర్నెట్ లేని చిన్న చాట్ బాట్ తో"
(the take that reads "చాట్"); the gap after line 10 cut; bigger text, the receipt widened; hits on "seven" and "two";
the middle bed lifted; the Telugu hook +1.5 dB and 1 s after the last word; the caption ask "ask it 3 times, comment all
3". Not changed: the model name on the test card and in the pinned comment (the open model we ran, as in every demo).

## Script (English, v2) · ~45 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | tarun | The AI said Sunday... / [1] the calendar says Wednesday! | frame 1 as hook 1 |
| 2 | vijaya | We picked the sixteenth because it said Sunday! [1] Twenty-five thousand, non-refundable, for a Wednesday! | the hall receipt "ADVANCE ₹25,000 · NON-REFUNDABLE · WED 16 DEC" |
| 3 | mohan | I asked it myself! [1] "Sixteenth December: Sunday." | his phone: "16 December 2026 is a Sunday." |
| 4 | tarun | We tested a small offline AI, ten times. / [1] Sunday: seven. Tuesday: two. Wednesday: once. | OUR TEST: a small offline AI · 10 asks · tiles SUN ×7, TUE ×2, WED ×1 · try yours |
| 5 | vijaya | It can't even tell the day of a date?! | |
| 6 | tarun | It doesn't look at a calendar. [1] It writes the day that sounds right. | HOW IT ANSWERS: no calendar inside (a small AI, no tools) → the day that "sounds right" |
| 7 | mohan | Then I'll tell it to count properly! | |
| 8 | tarun | We told it to count. [1] It got worse: six out of twenty became two. | 20 dates · "just the day": 6 right · "count from 1 Jan": 2 right |
| 9 | vijaya | So what do we do now?! | |
| 10 | tarun | For any date, [1] open your phone's calendar. The calendar counts. The AI guesses. | the rule card: DATES & DAYS → THE CALENDAR · the AI's day: a guess |
| 11 | mohan | Fine, let me ask it once more... / [1] Sunday, it says! | his phone "Sunday!" → frame 1 (loops) |

## Script (Telugu, v2; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | tarun | చాట్ బాట్ ఆదివారం అంది... / [1] క్యాలెండర్ లో బుధవారం! |
| 2 | vijaya | ఆదివారం అందనే పదహారో తారీఖు పెట్టాం! [1] బుధవారానికి ఇరవై ఐదు వేలు కట్టేశా, తిరిగి రావు! |
| 3 | mohan | నేనే అడిగాను! [1] "డిసెంబర్ పదహారో తారీఖు: ఆదివారం" అంది. |
| 4 | tarun | ఇంటర్నెట్ లేని చిన్న చాట్ బాట్ తో పది సార్లు టెస్ట్ చేశాం. / [1] ఆదివారం ఏడు సార్లు. మంగళవారం రెండు. బుధవారం ఒక్కసారే. |
| 5 | vijaya | ఒక తేదీ ఏ రోజో కూడా చెప్పలేదా?! |
| 6 | tarun | అది క్యాలెండర్ చూడదు. [1] తోచిన రోజు పేరు రాసేస్తుంది. |
| 7 | mohan | అయితే సరిగ్గా లెక్కపెట్టమని చెప్తా! |
| 8 | tarun | మేము లెక్కపెట్టమన్నాం. / [1] ఇంకా ఘోరం: ఆరు కరెక్ట్ నుంచి, రెండు కరెక్ట్. |
| 9 | vijaya | మరి ఇప్పుడు ఏం చేయాలి?! |
| 10 | tarun | ఏ తేదీ అయినా, [1] ఫోన్ లో క్యాలెండర్ తెరవండి. క్యాలెండర్ లెక్కపెడుతుంది, చాట్ బాట్ గెస్ కొడుతుంది. |
| 11 | mohan | సరే, ఇంకోసారి అడుగుతా... / [1] ఆదివారమే అంటోంది! |

Telugu notes: "చాట్ బాట్" for the AI; no "ముందు" root; "పదహారో తారీఖు" (not "పదహారు ఆదివారం", "sixteen Sundays").

## Caption ask (a try-it ask: both viewers would answer it)
Ask your AI app 3 times, in a new chat each time: "What day of the week is 16 December 2026?" Comment all 3 answers. (It's a Wednesday.)
