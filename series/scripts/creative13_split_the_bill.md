# Creative 13 "Just the amount" (split the bill with an AI) · script v3 (as rendered), Oct 29

**Format:** a nature-documentary parody ("WILD HYDERABAD"): a whispering narrator observes four friends at a biryani
place attempting "the most dangerous ritual of the urban jungle: splitting the bill". Slow push-ins, a lower third
naming the species, nature-show music stings. New format (creative log: no documentary parody so far; last 7 days:
cricket commentary, a video call, a TV serial, a courtroom PTM, take 1/take 2, a split screen, a quiz show).
**Cast:** the narrator (off screen); Arjun (trusts the AI, holds the phone), Sneha (holds the calculator), Nikhil and
Meghana (react, no lines). New cast. The AI is an unbranded "AI chat" on Arjun's phone (text only).
**AI idea:** asked for "just the amount", a chat AI writes a number that looks right instead of working it out; asked
to show the working, it gets it right far more often, and each line can be checked on a phone calculator. For money:
"Show the working step by step", then check the last line on your calculator.
**Bujji's notes applied:** Skit 09's breakout (a relatable everyday conflict with the numbers in frame 1); the comment
prompt invites an opinion on the conflict ("Equal split, or pay for what you ate?"), this reel's one changed variable against
EP41 / Creative 11's letter baseline.

## Facts and sources (checked Oct 29, 2026)
- Apple Machine Learning Research, "GSM-Symbolic: Understanding the Limitations of Mathematical Reasoning in Large
  Language Models" (machinelearning.apple.com, published October 2024; arXiv 2410.05229): "the performance of all
  models declines when only the numerical values in the question are altered". Caption.
- Google, Gemini Apps Help, "Learn about responses from Gemini Apps" (support.google.com/gemini/answer/16279220):
  "Gemini can hallucinate and present inaccurate information as factual." Caption.
- The big chat apps are much better at sums than our small offline model: the caption says so; the lesson (ask for the
  working, check a line) is what carries over.

## Our demo (pipeline/creative13/bill_demo.py, series/scripts/creative13_demo/)
Committed before it ran (7135588), results in 14bf51c. Qwen's own 4-bit GGUFs of
Qwen2.5-1.5B-Instruct and Qwen2.5-3B-Instruct, llama.cpp, 4 CPU cores, offline, temperature 0.7, 10 replies each way,
every reply read by hand. The bill: food ₹2,847, 5% GST, then a 10% tip on the total with GST, split by 4: each pays
₹822.07. Pass mark (fixed before the run): within ₹1.

| brain | "just the amount" | "show the working step by step" | "write it as one calculator expression" |
|---|---|---|---|
| 3B | 0 of 10 (₹220.23 · ₹965.63 · ₹241.25 · ₹1,059 · ₹220.23 · ₹1,068.25 · ₹1,028.64 · ₹1,138.88 · ₹849 · ₹886.50; about 1 s each) | 9 of 10 (1 cut off at our 400-token cap after the right total) | 6 of 10 (wrong formulas: × 4 instead of ÷ 4, the tip on the wrong amount) |
| 1.5B | 6 of 10 (it ignored "just the amount" and worked it out anyway; 4 slips) | 6 of 10 (3 cut off at the cap, 1 slip) | 5 of 10 |

- On screen: the 3B (the bigger of the two). "Just the amount": ten answers, none right; "show the working": 9 of 10.
- The calculator-expression way is not the fix: its mistakes are wrong formulas you can't see without the working
  (caption and pinned comment).

## Hook options
1. **(kept)** Frame 1: the table, the bill (₹2,847 + 5% GST + 10% tip, 4 friends); Arjun's phone "AI: ₹1,059 each"
   next to Sneha's calculator "₹822.07"; the lower third "WILD HYDERABAD"; Sneha: "One thousand fifty-nine each? My
   calculator says eight twenty-two!"
2. The narrator first, over a slow push-in on four friends staring at a bill: "Observe the most dangerous ritual of the
   urban jungle."
3. The waiter holding out his hand while four phones show four different amounts.
Kept 1: the clash and both numbers in one look, a line in the first second, the documentary voice right after.

## Script review (human-viewer, v1) and what changed
Sandeep (stops, hook 8) and Priya (half-stops, hook 6) both kept watching; the hook stays. Both: "small free AI" sounds like
free ChatGPT ("I tried it, it's right" comments); "Team Arjun or Team Sneha" is no debate, the video settles it.
Changed in v2: the voice says "a tiny offline AI" and the test card names it (Qwen 3B, a laptop, no internet; big apps do
better, the habit still helps); line 4 says it guesses ("looks right" clashed with ₹220 on screen); the rule is "check
each line" (the last line alone misses a tip on the wrong amount), and the AI writes the steps while the calculator checks
them (why ask the AI when Sneha has a calculator?); the narrator carries lines 4-7 in the documentary voice; a dead stop
before "Not one right" and a sting on "nine out of ten"; frame 1 carries the two numbers and little else; the comment
asks a real split question. Telugu: "చిన్న ఉచిత మోడల్" (a phone model? newspaper Telugu) is "ఇంటర్నెట్ లేని ఒక చిన్న యాప్",
the same word as Arjun's "ఆ యాప్".

## Script (English) · 50.2 s as rendered
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Sneha | One thousand fifty-nine each? [1] My calculator says eight twenty-two! | frame 1: Arjun's phone "₹1,059 each" vs Sneha's calculator "822.07"; "WILD HYDERABAD" |
| 2 | Narrator | Observe. The urban jungle's most dangerous ritual: [1] splitting the bill. | the documentary frame (REC, leaves in the foreground), a slow push-in; lower third "four friends · one bill" |
| 3 | Arjun | The AI is never wrong. [1] I told it: just the amount. | his phone: "Food ₹2,847 + 5% GST, then a 10% tip on the total. 4 friends. Just the amount." |
| 4 | Narrator | When you ask for just the number, this small AI doesn't calculate. [1] It guesses. | the reply "₹1,059 each", "replied in 1 second · no working", "4 × ₹1,059 = ₹4,236 for a ₹3,288 bill", an A GUESS stamp |
| 5 | Narrator | In our test, a tiny offline AI split this bill ten times. [1] Ten answers. / [2] Not a single one right. (two takes, 0.9 s of silence between) | OUR TEST: Qwen 3B, a laptop, no internet; the ten amounts pop in (₹220 to ₹1,139); a stop; "0 of 10"; "right: ₹822.07"; small: "big apps do better · the habit still helps" |
| 6 | Sneha | So make it show its working. | Arjun types "Show the working step by step." |
| 7 | Narrator | Made to show its working, the creature becomes careful. [1] Nine out of ten right. | the working (try 3, shortened): GST 2,847 × 0.05 = 142.35 · 2,847 + 142.35 = 2,989.35 · tip 2,989.35 × 0.10 = 298.94 · 2,989.35 + 298.94 = 3,288.29 · 3,288.29 ÷ 4 = 822.07; "9 of 10 RIGHT", "slower: ~50 s, not 1 s" |
| 8 | Sneha | It writes the steps. [1] I check each line on my calculator. | the same card: each line gets a ✓, her calculator beside it shows each value; MONEY MATHS WITH AI: 1. Type "Show the working step by step." 2. Check each line on a calculator ✓ |
| 9 | Narrator | The young male [1] accepts defeat. | the documentary frame: Arjun pays ₹822; Nikhil and Meghana high-five Sneha |
| 10 | Arjun | Ice cream bill! [1] AI, just the amount! | the waiter brings an ICE CREAM ₹480 bill; his phone flashes "₹1,059 each" → frame 1 (loops) |

## Script (Telugu; on-screen text stays English) · 55.6 s as rendered
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Sneha | ఒక్కొక్కరికి వెయ్యి యాభై తొమ్మిదా?! / [1] నా కాలిక్యులేటర్ లో, ఎనిమిది వందల, ఇరవై రెండు! (two takes) | Okkokkariki veyyi yaabhai tommidaa?! / Naa calculator lo, enimidi vandala, iravai rendu! |
| 2 | Narrator | గమనించండి. నగర అడవిలో అతి ప్రమాదకరమైన ఆచారం: [1] బిల్లు పంచుకోవడం. | Gamaninchandi. Nagara adavilo ati pramaadakaramaina aachaaram: billu panchukovadam. |
| 3 | Arjun | ఆ యాప్ ఎప్పుడూ తప్పు చెప్పదు. [1] ఆన్సర్ మాత్రమే చెప్పు అన్నాను. | Aa app eppudoo tappu cheppadu. Answer maatrame cheppu annaanu. |
| 4 | Narrator | నంబర్ మాత్రమే అడిగితే, ఈ చిన్న యాప్ లెక్క వేయదు. [1] ఊహించి చెబుతుంది. | Number maatrame adigite, ee chinna app lekka veyadu. Oohinchi chebutundi. |
| 5 | Narrator | మా టెస్ట్ లో, ఇంటర్నెట్ లేని ఒక చిన్న యాప్ ఈ బిల్లును పది సార్లు పంచింది. [1] పది జవాబులు. / [2] ఒక్కటీ సరైనది కాదు. (two takes) | Maa test lo, internet leni oka chinna app ee billunu padi saarlu panchindi. Padi javaabulu. Okkatee sarainadi kaadu. |
| 6 | Sneha | అయితే లెక్క మొత్తం చూపించమని అడుగు. | Ayite lekka mottam choopinchamani adugu. |
| 7 | Narrator | లెక్క చూపించమంటే, ఈ జీవి జాగ్రత్తగా మారుతుంది. [1] పదిలో తొమ్మిది సరైనవి. | Lekka choopinchamante, ee jeevi jaagrattagaa maarutundi. Padilo tommidi sarainavi. |
| 8 | Sneha | అది లెక్క రాస్తుంది. [1] ప్రతి లైన్ నేను కాలిక్యులేటర్ లో చెక్ చేస్తా. | Adi lekka raastundi. Prati line nenu calculator lo check chestaa. |
| 9 | Narrator | ఈ కుర్రాడు [1] ఓటమిని అంగీకరించాడు. | Ee kurraadu otamini angeekarinchaadu. |
| 10 | Arjun | ఐస్ క్రీమ్ బిల్లు! [1] ఆన్సర్ మాత్రమే చెప్పు! | Ice cream billu! Answer maatrame cheppu! |

Telugu notes: no "ఏఐ" in voiced text ("ఆ యాప్", "ఇంటర్నెట్ లేని ఒక చిన్న యాప్"); numbers mid-line; Indic Parler's three
Telugu speakers (Prakash: the narrator, Kiran: Arjun, Lalitha: Sneha); no English loanword with f in Kiran's lines; no
word one slipped letter away from a swear word (checked again in the transcripts after voicing).

## Render review (human-viewer, round 1, English) and what changed
Both stopped on frame 1 (hook 8 and 6); both: the middle (0:09-0:38) turned into a lecture, "which AI?" undercut it, the
five working lines were shown twice, the big-apps line was grey and gone in a second, and the sound sagged where the
reveals are (quarters -19.4, -20.8, -21.4, -20.6 dB), with no real stop before "Not one right".
Changed: "tiny offline AI" on the app header and on frame 1's card; the test card says "Big apps usually do better (not
tested here). This habit helps on any app:" in white, held 2 s+; the REC viewfinder (corners, REC, a timecode that runs
forward through the reel) over every insert; the five lines shown once, ticked on the same card with the calculator
beside them; the rule card held ~3 s; a 0.8 s pause with the bed out and a thud before "Not one right", a drop before
"nine"; the scenes step up (1.05, 1.2, 1.35, 1.7) into a louder end; "Dessert bill" (heard "Desert Bill", then "The
desired bill") is "Ice cream bill"; "grows careful" (heard "draws") is "becomes careful"; the ice-cream bill holds 0.5 s
longer. Not changed: moving the render to out/local/ (that rule is for Claude's own model names; the tested open model
is named on screen as in earlier packages); the lo-fi groove under a documentary voice (one viewer).
Telugu mix checks (line by line on the final mix): the thud before "పదిలో" buried it (Telugu: no thud); a louder last
scene and the forest bed blurred "యువకుడు" (the Telugu last scene 1.4, the forest at 0.1; "యువకుడు" was lost in five
takes: "కుర్రాడు"); "ఒప్పుకున్నాడు" was heard "अपकूँनादू", one slip from a swear word ("అంగీకరించాడు"); "ఇరవై రెండు"
was lost in most takes and mixes: the 1.12 speed-up swallowed it, and Sneha's number is now its own take at natural speed.

## Render review (round 2, English + Telugu) and what changed
Both: the hook and the documentary jokes land, the rule is clear; the 9/10 moment and the ending were weak. Changed:
English line 4 "Asked for just the number" was heard "Ask for" (advice, the opposite): "When you ask for just the number";
the stop before "Not one right" is the silence between two takes (0.9 s; a pause inside a take came out ~0.3-0.45 s),
then a thud; "Not one right" was heard "Not run right" (and "Not. One. Right." as a question): "Not a single one right";
a sting and a clap after "nine out of ten" and the bed swells after it; louder English gaps and tail; "tiny offline AI"
on its own line on frame 1's card and bigger on the app header; "slower: ~50 s, not 1 s" bigger; the rule card on its
own after Sneha's line, held 3 s; the overpay on the guess card (4 × ₹1,059 = ₹4,236 for a ₹3,288 bill). Telugu: the
lines start 0.5 s in (the opening hit swallowed "ఒక్కొక్కరికి"); "స్వీట్ బిల్లు" is "ఐస్ క్రీమ్ బిల్లు" to match the
slip, with no riser and the ding before the line (both hid it); Arjun's line 3 at natural speed; the ticks under "చెక్
చేస్తా" quieter and the rule card's thud after her last word (heard "chek chekh chestaa"). Checked line by line on both
final mixes: every English line as scripted; every Telugu line heard, no word near a swear word.

## Comment prompt (the one changed variable: an opinion on the conflict)
Equal split, or pay for what you ate? Comment your side.
