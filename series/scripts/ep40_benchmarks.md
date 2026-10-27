# EP40 "73 in maths" (Benchmarks & evaluations: how models are compared) · script v2.2 as rendered, Oct 27

**Slot:** queue 042, replaces the lesson-format `042_ep40_ai_benchmarks_how_models_are_tested.mp4`. Agreed calendar:
W2's first EP slot.
**Cast / setting:** Ravi anna's kirana shop, the shop AI (the student robot on his phone, calm, deadpan). After EP39
(the 4.7 GB brain took 17 s a reply; a small 1.1 GB brain wrote it in 2.2 s), Ravi has put the small brain on the
laptop, picked by its maker's chart: "maths 73.2%".
**The AI's mistake:** the small brain gets 9 of Ravi's 20 bills wrong (EP38's bill test: 11 of 20 right).
**Topic as plot:** a benchmark is one exam paper, the same for every AI, with known answers; the chart's 73.2 is the
famous school-maths exam (GSM8K). Ravi makes the AI sit 30 questions of that paper on his laptop (the quiz): 18 of 30,
60%, because the 73.2 is the maker's own test of the full-size brain and Ravi runs the squeezed copy (EP37). His next
suspicion is the field's own worry: the paper has been online since 2021 and exam questions can leak into what a brain
learns from (contamination); the check is the same questions with new names and numbers: 20 of 30, so it didn't learn
the paper by heart. Rescue: only your own test, on your copy, says how it does on your work (20 real bills, the right
totals written down, the same test for every brain): 11 · 15 · 18 of 20, the chart's order, but nine wrong bills on
the small one. Twist: Ravi posts his test online "for every shop"; the AI: the next brains can study it, keep your test
to yourself; a new chart, "100% on Ravi anna's bill test": "It studied MY paper!", the loop back to frame 1. New here:
what a benchmark is, a score belongs to one brain tested one way, contamination and the name-and-number check, your own
test (an eval), keeping it private. EP41 (choosing a model: fast or right) builds on the own-test rule.

## Facts and sources (checked Oct 27, 2026)
- Qwen's own chart (qwenlm.github.io/blog/qwen2.5-llm/; Qwen2.5 Technical Report, arXiv 2412.15115, Tables 8-10),
  Instruct models, GSM8K: Qwen2.5-1.5B 73.2, 3B 86.7, 7B 91.6 (MATH 55.2 / 65.9 / 75.5; MMLU-Redux 50.7 / 64.4 /
  75.4). The same 3B table puts Phi3.5-mini-Instruct at 86.2 on GSM8K. These are the full-size brains, run by the maker.
- GSM8K (OpenAI, "Training Verifiers to Solve Math Word Problems", Cobbe et al., arXiv 2110.14168, Oct 2021): "8.5K
  high quality linguistically diverse grade school math word problems"; the files hold 7,473 training and 1,319 test
  problems; MIT licence (github.com/openai/grade-school-math). Public since 2021.
- Contamination: "Benchmark Data Contamination ... occurs when language models inadvertently incorporate evaluation
  benchmark information from their training data" (Xu et al., arXiv 2406.04244).
- GSM1k (Scale AI, Zhang et al., arXiv 2405.00332, NeurIPS 2024 Datasets and Benchmarks): 1,205 fresh problems written
  like GSM8K's, kept private at first "to prevent a similar problem of data contamination"; "accuracy drops of up to
  8%" with several families (Phi, Mistral, some Llama) showing "systematic overfitting"; "many models, especially those
  on the frontier, show minimal signs of overfitting". (v1 of the paper said 13%; the current version says 8%.)
- GSM-Symbolic (Apple, Mirzadeh et al., arXiv 2410.05229, ICLR 2025): GSM8K questions with the names and numbers
  changed; "the performance of all models declines when only the numerical values in the question are altered";
  names matter less than numbers. A clause that sounds relevant but doesn't matter dropped scores "up to 65%" (the
  worst case, a small model). Caption only; no "AI can't reason" claim (a 2026 re-analysis disputes it).
- Saturation: "LLMs now achieve over 90% accuracy on popular benchmarks like MMLU" (Humanity's Last Exam, CAIS and
  Scale AI, arXiv 2501.14249): new, harder papers keep being written. Caption.
- Human votes: Arena (formerly LMArena / Chatbot Arena): two anonymous answers, people vote (arena.ai/how-it-works);
  "The Leaderboard Illusion" (Cohere Labs and others, arXiv 2504.20879): undisclosed private testing of many variants
  (27 by Meta before Llama 4) biases the scores. Caption.
- Your own test: Anthropic, "Design evals that mirror your real-world task distribution" (platform.claude.com, Develop
  tests); OpenAI, "Choose acceptance criteria before comparing models" and "Repeat the comparison across representative
  tasks" (developers.openai.com, Model selection).

## Our demo (pipeline/ep40/bench_demo.py, series/scripts/ep40_demo/)
The shop's brains as EP38 ran them: Qwen's own 4-bit files (q4_k_m), llama.cpp, 4 CPU cores, greedy, offline (empty
network namespace). Two tests of 30 questions each:
- the paper: GSM8K's test set, questions 1-30, word for word ("Janet’s ducks lay 16 eggs per day...");
- the same 30 with only the names and numbers changed (our rewrite, new answers worked out by us: "Lakshmi’s ducks lay
  22 eggs per day... five for breakfast... three [for muffins]... $3": 42), the way GSM-Symbolic rewrote GSM8K.
Each reply works step by step and ends "Answer: <number>"; every reply was read by hand (`HAND` in the script: two
candle replies said "L - 8 centimeters shorter" and "92 cm shorter"; the regex had read the 8 as right).

| brain (squeezed, 4-bit) | maker's chart, GSM8K (full-size) | the paper, 30 | new names and numbers, 30 | Ravi's 20 bills (EP38) |
|---|---|---|---|---|
| Qwen2.5 1.5B (1.12 GB) | 73.2% | 18 (60%) | 20 (67%) | 11 |
| Qwen2.5 3B (2.10 GB) | 86.7% | not run* | not run* | 15 |
| Qwen2.5 7B (4.68 GB) | 91.6% | not run* | not run* | 18 |

- *The 3B run was stopped at 17 of 60 replies (about 2 minutes a reply on this machine); the 7B (about twice as
  slow) was not started. The reel tests only the 1.5B, Ravi's brain in this story.
- The 1.5B did not fall on the changed questions (18 → 20 of 30): no sign it learned this paper by heart. Its 18 of 30
  is under the maker's 73.2%: the chart is the full-size brain, the whole paper, the maker's own way of asking; ours is
  the squeezed file, 30 questions, our prompt (caption).
- The 1.5B's wrong bills (EP38): "2 bread 4 biscuits" ₹65 (right ₹170), "half kg sugar and one tea powder" ₹85.50
  (₹148), "3 bath soaps and 1 detergent powder" ₹158 (₹234) and six more. Frame 1 shows the first.

## Hook options
1. **(kept)** Frame 1: Ravi yelling, a fan of bills in his hand, the top one "2 bread 4 biscuits: ₹65 ✗ (right ₹170)",
   "9 of 20 wrong" in red; beside him the brain's launch chart, "1.1 GB brain · MATHS 73.2% ⭐". Ravi: "Seventy-three in
   maths, and you got nine of my twenty bills wrong?!"
2. The shop AI proudly holding up a marks card "MATHS 73%", Ravi tearing it in half over a wrong bill.
3. A "TOPPER" garland on the laptop, a customer at the counter arguing over ₹65 vs ₹170.
Kept 1: a contradiction you read in one look (a high mark, a wrong bill), the marks-vs-real-work trope, a number to
explain. Frame 1 keeps two readable things only: the ₹65 ✗ bill and the 73.2% chart.

## Viewer notes on v1 and what changed (v2)
- Both: the hook stops them ("my amma's line about every topper"); the numbers piled up at 0:12-0:30 (the three-score
  board, 30 and 30 again, the 8%): the board and the 8% go to the caption; the paper's results are said as percents
  (60%, 67%) so "eighteen" and "twenty" no longer mean two things (Sandeep: "Twenty what?").
- Priya: 18/30 is 60%, not 73.2, and nobody said why; our own numbers put the squeezed brain at 60% on the paper and
  55% on the bills, so "your shop isn't on that paper" blamed the wrong thing. Now the AI says it: "Seventy-three was
  my full-size brain, tested by my maker. You run me squeezed." The chart got the order right (11 · 15 · 18), and the
  test card says so; only your test shows the nine wrong bills.
- Both: the quiz gave itself away (the plot needed "it didn't copy"). The quiz is now the paper on Ravi's laptop: "Its
  score?" A "73%, like the chart" · B "60%" · C "30%".
- Both: "keep your test private" was only in the caption, and Sandeep read the 100% as good news: the AI says "Keep your
  test to yourself", and Ravi's last line is "It studied MY paper!".
- Sandeep: "answers written first, before what?": "with the right totals written down". "Brains study?": "exam
  questions leak into what AIs learn from" is on the card; the line is "It happens."
- Both (sound): a dead stop before the quiz answer, a slam on the 100% chart.
- Left for the caption: the big brain is the slow one from EP39 (fast or right is EP41's question).

## Confirmation pass on v2 and what changed (v2.1)
- Both: the v1 fixes landed (percents, the spoken squeeze, a real quiz, "keep your test to yourself", "right totals").
- Both: line 7 had the logic backwards ("Or you copied!": copying would raise the 60, not explain it): now "Even that
  sixty could be copied! That paper's online!".
- Priya: the voice put the whole 13 points on the squeeze (our prompt and 30 of 1,319 questions differ too): line 6
  "Seventy-three was my full-size brain, on my maker's test. You run me squeezed, on yours."
- Priya: "No copying" rested on two questions out of 30: line 9 "No drop: no sign of copying."
- Both: the line 12 card had nine numbers and a sentence: now three big bill rows and "same order as the chart"; the
  rule chip keeps three rows.

## Script (English) · ~58 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Seventy-three in maths, [1] and you got nine of my twenty bills wrong?! | frame 1: Ravi yelling with the fan of bills, top bill "2 bread 4 biscuits: ₹65 ✗ (right ₹170)", "9 of 20 wrong"; the launch chart "1.1 GB brain · MATHS 73.2% ⭐"; laptop "1.1 GB brain"; tag "EP40 · AI From Scratch" |
| 2 | AI | That's the famous maths exam, anna. [1] The same paper for every AI. | insert: an exam paper "GSM8K · 1,319 school maths questions · answers known"; on [1] three robots at desks with the same paper, "BENCHMARK = the same exam for every AI" |
| 3 | Ravi | Then write it here! [1] Thirty questions! | Ravi slaps 30 sheets on the laptop; after the line, QUIZ card, 3-2-1 held 2 s: "The same paper on Ravi's laptop. Its score?" A "73%, like the chart" · B "60%" · C "30%"; "comment A, B or C" |
| 4 | AI | Eighteen out of thirty. [1] Sixty percent. | out of silence; OUR REAL TEST card: "the paper (30 questions): 18 right = 60%", "B ✓"; the chart's 73.2% beside it |
| 5 | Ravi | Not seventy-three?! | |
| 6 | AI | Seventy-three was my full-size brain, on my maker's test. [1] You run me squeezed, on yours. | insert: a big full-size brain in the maker's lab "73.2% · full size · the maker's test"; on [1] the squeezed brain in a press on Ravi's laptop "60% · squeezed (EP37) · your laptop"; "A SCORE = one brain, tested one way" |
| 7 | Ravi | Even that sixty could be copied! [1] That paper's online! | "online since 2021" stamp |
| 8 | AI | It happens. [1] So: the same questions, new names and numbers. | card "CONTAMINATION: exam questions leak into what AIs learn from"; on [1] COPY CHECK: "Janet’s ducks lay 16 eggs → Lakshmi’s ducks lay 22 eggs" |
| 9 | AI | Sixty-seven percent. [1] No drop: no sign of copying. | "new names and numbers: 20 of 30 = 67%" next to "the paper: 60%"; "no drop: it didn't learn the paper by heart" |
| 10 | Ravi | So which number do I trust?! | |
| 11 | AI | Yours. [1] Give each brain your twenty bills, with the right totals written down. | RULE chip: "TEST IT ON YOUR OWN WORK" · "20 real bills, right totals written down" · "the same test for every brain" · "your copy, your settings" (three rows) |
| 12 | AI | On your bills, [1] the big brain got eighteen of twenty. | test card "RAVI'S 20 BILLS (our test)": three big rows, 1.1 GB 11 · 2.1 GB 15 · 4.7 GB 18; one short line "same order as the chart" |
| 13 | Ravi | Super! [1] I'll post my test online, for every shop! | Ravi typing; a post "Ravi anna's bill test: 20 questions + answers" goes up |
| 14 | AI | Then the next brains can study it. [1] Keep your test to yourself. | the post flies into the pile the AIs learn from; on [1] chip "KEEP YOUR TEST PRIVATE" |
| 15 | Ravi | A hundred percent? [1] It studied MY paper! | a new launch chart slams in: "NEW BRAIN · Ravi anna's bill test: 100% ⭐"; then frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | మ్యాథ్స్ లో డెబ్బై మూడు, [1] నా ఇరవై బిల్లుల్లో తొమ్మిది తప్పా?! | Maths lo debbai moodu, naa iravai billullo tommidi tappaa?! |
| 2 | AI | అది ఫేమస్ మ్యాథ్స్ ఎగ్జామ్ అండి. [1] ప్రతి బ్రెయిన్ కీ అదే పేపర్. | Adi famous maths exam andi. Prati brain kee ade paper. |
| 3 | Ravi | అయితే ఇక్కడే రాయి! [1] ముప్పై లెక్కలు! | Ayite ikkade raayi! Muppai lekkalu! ("ముప్పై ప్రశ్నలు" babbled in three takes) |
| 4 | AI | ముప్పై లో పద్దెనిమిది. [1] అరవై శాతం. | Muppai lo paddenimidi. Aravai shaatam. |
| 5 | Ravi | డెబ్బై మూడు కాదా?! | Debbai moodu kaadaa?! |
| 6 | AI | డెబ్బై మూడు, నా అసలు సైజ్ బ్రెయిన్ కి, మా కంపెనీ టెస్ట్. [1] మీ దగ్గర కంప్రెస్ చేసిన బ్రెయిన్, మీ టెస్ట్. | Debbai moodu, naa asalu size brain ki, maa company test. Mee daggara compress chesina brain, mee test. |
| 7 | Ravi | అరవై కూడా కాపీ ఏమో! [1] ఆ పేపర్ ఆన్లైన్ లో ఉంది! | Aravai kooda copy emo! Aa paper online lo undi! |
| 8 | AI | అలా జరుగుతుంది. [1] అందుకే అవే లెక్కలు, కొత్త పేర్లు, కొత్త నంబర్లతో. | Alaa jarugutundi. Anduke ave lekkalu, kotta perlu, kotta numberlato. |
| 9 | AI | అరవై ఏడు శాతం. [1] తగ్గలేదు. కాపీ చేసినట్టు లేదు. | Aravai edu shaatam. Taggaledu. Copy chesinattu ledu. |
| 10 | Ravi | మరి ఏ నంబర్ ని నమ్మాలి?! | Mari ae number ni nammaali?! |
| 11 | AI | మీదే. [1] ప్రతి బ్రెయిన్ కీ మీ ఇరవై బిల్లులు ఇవ్వండి, సరైన టోటల్స్ రాసి పెట్టి. | Meede. Prati brain kee mee iravai billulu ivvandi, saraina totals raasi petti. |
| 12 | AI | మీ బిల్లుల్లో, [1] పెద్ద బ్రెయిన్ కి ఇరవై లో పద్దెనిమిది. | Mee billullo, pedda brain ki iravai lo paddenimidi. |
| 13 | Ravi | సూపర్! [1] నా టెస్ట్ ఆన్లైన్ లో పెడతా, అన్ని షాపులకీ! | Super! Naa test online lo pedataa, anni shaapulakee! |
| 14 | AI | అప్పుడు తర్వాతి బ్రెయిన్లు దాన్ని చదివేస్తాయి. [1] మీ టెస్ట్ మీ దగ్గరే ఉంచుకోండి. | Appudu tarvaati brainlu daanni chadivestaayi. Mee test mee daggare unchukondi. |
| 15 | Ravi | వంద శాతమా? [1] నా పేపర్ చదివేసింది! | Vanda shaatamaa? Naa paper chadivesindi! |

Telugu notes: no zero-width joiners in the voiced text ("ఆన్లైన్"); no "ఏఐ" (Parler stutters on it): "బ్రెయిన్";
"అసలు సైజ్" for full size (EP37: "ఫుల్ సైజ్" blurred); "కంప్రెస్" for squeezed (EP37).

## Render review 1 (English and Telugu) and what changed (v2.2)
- Both: the hook and the twist work; the quiz card was up 2.2 s and the answer came without a real stop: the hold is
  3.4 s, the 3-2-1 ends 1.3 s before "Eighteen out of thirty", the bed is out for that stretch.
- Both: "same order as the chart" named a chart they never saw: the bill card shows each brain's chart score beside its
  bill score (chart 73% · 11 of 20 · 9 wrong; 87% · 15 · 5; 92% · 18 · 2) and "same order as the chart, but only YOUR
  test shows the wrong bills".
- Both: the 100% landed like every cut and the last quarter dipped: a success sting, boom, clap and glitch on the new
  chart, a louder riser into it, the bed out from 0.9 s before "A hundred percent?" through the line (English "my
  paper" read "by paper" when the bed came back mid-line), the English last scene's bed up (boost 1.8) with a louder
  hats-and-claps build. English quarters now -20.7, -20.4, -19.9 after the quiet quiz quarter.
- Priya: "(its full-size brain)" was the smallest text on the card: "its FULL-SIZE brain" in 44 px; the
  CONTAMINATION card stays up 0.8 s longer and the title switches to THE COPY CHECK with the card; "18 vs 20 right: two
  questions apart" under the no-drop chip; "it studied the paper!" big.
- Telugu by ear (each line's span of the final mix transcribed on its own): line 8's "అలా జరుగుతుంది" was a rushed
  0.86 s take that vanished: now "అవును, అలా జరుగుతుంది."; "ఆన్లైన్" smeared in lines 7 and 13: "ఆన్ లైన్" at tempo 1.05,
  and "నా టెస్ట్ ని ఆన్ లైన్ లో" (13); line 11 at 1.05. Caption 14 now "Then the next brains may study it. Keep your test
  to yourself." To stay under 60 s the Telugu holds are shorter (GAP_TE).
- Render review 2 (confirmation): every must-fix landed; at boost 1.6 the Telugu rule line (11) lost "ఇరవై" and
  "ఇవ్వండి" under the bed, so the Telugu last scene keeps boost 1.5 and the softer build. Left as is: Telugu line 7's
  "ఆన్ లైన్" is still borderline in the transcript (four re-rolls all sound the same); 3 of 14 English cuts on the beat.

## Caption ask (draft)
That "73% in maths" on an AI's launch chart is a benchmark: one exam paper, the same for every AI. This one is GSM8K,
1,319 school maths word problems, online since 2021. The score is the maker's own test of its full-size brain. We gave
the same small brain (squeezed to 4-bit, as people run it on a laptop) 30 questions of that paper: 60%. Copying is a
real worry (exam questions can leak into training data; Scale AI's fresh copy of this exam caught some brains dropping
up to 8%), so we checked: the same 30 with new names and numbers, 67%. No copying. On Ravi's own 20 bills: 11, 15 and 18
right for the three sizes, the chart's order, but nine wrong bills on the small one. So test it on your own work: 20
real jobs, the right answers written down, the same test for every AI, on the copy and settings you will use. And keep
your test to yourself. Next: EP41, how to choose the right model (the 18-of-20 brain is the slow one from EP39).
