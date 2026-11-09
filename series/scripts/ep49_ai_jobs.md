# EP49 "AI and jobs: what really changes" (Season 5 finale) · queue 052 · script v2, Nov 9

## The lesson
AI takes tasks, not whole jobs. Most jobs are a bundle of tasks; AI can do some of them (drafting, sums, lists), often
well, but its drafts still need a person to check and send them, and it can't do the tasks that need hands, trust or
judgement about people. So most jobs change rather than vanish; the jobs that are mostly paper work change the most.
What to do: list your tasks, let AI draft and add, you check and send, and learn the tool.

## Bujji's notes applied
- Skit 19 48h #3 (Nov 8): the test result, not the setup, inside the first 15 s ("Twenty-five tries... eighteen right"
  at ~8 s); a visual reset about every 4 s in the middle third.
- Skit 13 7-day #2: Telugu line 1 says a number in the first 2 s ("పదిహేను వేల జీతం...").
- Voice standard (Vamsi, Nov 8): English in the Creative 21 style: Fish copies of generic American reference voices
  (Creative 21's own clips: Ravi = am_michael, Suresh = am_puck, the shop AI = af_heart through the phone sound).
  Telugu stays on Parler (clear, close voices: Ravi = Prakash, Suresh = Kiran, the AI = Lalitha).
- Point family: new, "J. what AI replaces: tasks, not people" (after G and I).

## The reach stack (Standing Rule)
1. Stake: a job and a salary (Suresh, eight years at the shop, ₹15,000 a month).
2. Frame 1, sound off: "SURESH: ₹15,000 A MONTH" vs "THE AI APP: ₹0", Ravi with the phone, Suresh under a rice sack.
3. Injustice: eight years of work against a free app.
Line 1 says both numbers within 2 s, EN and TE.

## Facts and sources (checked Nov 9, 2026)
- ILO Working Paper 140, "Generative AI and Jobs: A Refined Global Index of Occupational Exposure" (ILO and Poland's
  NASK, May 2025; ilo.org): one in four workers worldwide is in an occupation with some GenAI exposure; 3.3% of global
  employment is in the highest exposure category; clerical jobs have the highest exposure; most jobs are a mix of tasks,
  so transformation (and augmentation) is more likely than full automation. Figures are potential exposure, not job
  losses. (Also reported by WAM and the EU Digital Skills and Jobs Platform.)
- WEF Future of Jobs Report 2025 (Jan 2025, weforum.org press release): by 2030, 170 million new jobs and 92 million
  displaced, a net 78 million; from all causes (technology, demographics, economics), not AI alone. Caption only.

## Our demo (pipeline/ep49/jobs_demo.py, series/scripts/ep49_demo/7B.json)
Committed before it ran (commit 143adc1). Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores,
offline (checked before and after), temperature 0.7, a fresh chat per ask, every reply read by hand. Five paper tasks
from a shop helper's day, five tries each, right answers fixed before the run.

| task | right |
|---|---|
| add up an order (₹606) | 5/5 (first run: 1/5, four cut off by our own 160-token cap mid-working; re-run with room, committed before it ran: 5/5) |
| price before 18% GST on ₹1,180 (₹1,000) | 5/5 |
| reorder list (sugar, toor dal) | 4/5 (one cut off by our cap) |
| WhatsApp offer (10% off rice, Sunday), usable as sent | 0/5: all five good drafts, but each had "[Your Shop Name]", "[insert date]" or a stray "ice" to fix |
| polite reply to 3 broken eggs, replace today, usable as sent | 4/5 (one left "[Customer's Name]") |
| **all** | **18/25** |

## Hook options
1. **(v1)** Frame 1: the shop; two blocks "SURESH: ₹15,000 A MONTH" (green) / "THE AI APP: ₹0" (red); Ravi holding the
   phone toward Suresh, who has a rice sack on his shoulder. "Fifteen thousand a month, eight years... and a free app
   takes my job?!"
2. "18/25" (our test) as frame 1: a number, no person.
3. Ravi typing "Do Suresh's work" into the AI: action, no numbers.

## Script review (human-viewer, v1) and what changed
Both stop on frame 1 (₹15,000 vs ₹0 next to a man with a sack: hook 8 and 5); Sandeep would share it to his office group.
Both: "I can do the paper part" claims too much after 18/25; "Clerks first" scares office workers and gives them nothing to
do; "Teach me this app" is backwards (Ravi ran the test); the ILO line and the summary sound like a lecture; the ending
only echoes the hook. Sandeep: "Eighteen right": good or bad?; "exposure" sounds like radiation; "who pays late" is what
a ledger app already does; the ILO card is three facts in 4 s. Priya: a 4-bit 7B offline is weaker than the free apps
people use; the offers failed because our prompt never gave the shop name (a prompt failure, not an AI limit); say the
token-cap re-run, or it looks cooked; the ILO "quote" was a paraphrase. Telugu: "ఉద్యోగం తీసుకుంటుందా" word for word ("నా
పని పోతుందా"), "కాగితం పని" bookish ("పేపర్ పని"), "ఆగరా" = wait ("కంగారు పడకురా"), "జీ ఎస్ టీ" spaced, "ఏఐ" one word,
"ప్రభావం ఉంది" claims "already hit", "ముందు క్లర్క్ పనులు" sounds like an order, "నువ్వు ఉండు" = "you wait" ("నువ్వే ఉంటావ్").
Changed (v2): "Eighteen?! That's almost all of it!"; line 5 "every offer message had a blank or a slip to fix" and
Suresh "Nobody told it the shop's name! And who checks it? Me!" (the fix: give it the context, still check); line 8 "I can
draft most of the paper part. Not the sacks, the deliveries, or knowing the regulars."; line 9 "one job in four has
tasks an AI could do. Most of those jobs change, not vanish." (no quote marks, no 3.3%); line 11 "That one changes the
most. Be the one who checks the AI, and learn the tool."; line 12 "So: the AI drafts, you check. Hands and people:
yours."; the ending "Fine, you stay. And you run the app." / "Then it's twenty thousand a month." (back to frame 1's
₹15,000); the test card says the model is weaker than big apps; the caption names the model, offline, the shop-name
prompt and the token-cap re-run; a hit on "Eighteen", the bed out before the offer result, a lift into "you stay".
Telugu as listed.

## Script (English, v2) · ~55 s
| # | Who | Line |
|---|---|---|
| 1 | suresh | Fifteen thousand a month, eight years... [1] and a free app takes my job?! |
| 2 | ravi | Relax! I only tested it on your paper work. |
| 3 | ai | Twenty-five tries at Suresh's paper work. [1] Eighteen right. |
| 4 | suresh | Eighteen?! That's almost all of it! |
| 5 | ai | Sums and GST: ten out of ten. [1] But every offer message had a blank or a slip to fix. |
| 6 | suresh | Nobody told it the shop's name! [1] And who checks it? Me! |
| 7 | ravi | So does it take his job, or not? |
| 8 | ai | I can draft most of the paper part. [1] Not the sacks, the deliveries, or knowing the regulars. |
| 9 | ai | Worldwide, one job in four has tasks an AI could do. [1] Most of those jobs change, not vanish. |
| 10 | suresh | And a job that's all paper work? |
| 11 | ai | That one changes the most. [1] Be the one who checks the AI, and learn the tool. |
| 12 | ravi | So: the AI drafts, you check. [1] Hands and people: yours. |
| 13 | ravi | Fine, you stay. [1] And you run the app. |
| 14 | suresh | Then it's twenty thousand a month. |

## Script (Telugu, v2; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | suresh | పదిహేను వేల జీతం, ఎనిమిదేళ్లు... [1] ఫ్రీ యాప్ వల్ల నా పని పోతుందా?! |
| 2 | ravi | కంగారు పడకురా! నీ పేపర్ పని మీద మాత్రమే టెస్ట్ చేశా. |
| 3 | ai | సురేష్ పేపర్ పని, ఇరవై ఐదు సార్లు. [1] పద్దెనిమిది కరెక్ట్. |
| 4 | suresh | పద్దెనిమిదా?! దాదాపు అంతా! |
| 5 | ai | లెక్కలు, జీ ఎస్ టీ: పదికి పది. [1] కానీ ప్రతి ఆఫర్ మెసేజ్ లో, ఒక ఖాళీ, లేదా ఒక తప్పు ఉంది. |
| 6 | suresh | షాప్ పేరు దానికి ఎవరూ చెప్పలేదు! [1] చెక్ చేసేది ఎవరు? నేనే! |
| 7 | ravi | మరి ఏఐ, సురేష్ పని తీసుకుంటుందా, లేదా? |
| 8 | ai | పేపర్ పనిలో చాలా వరకు, నేను డ్రాఫ్ట్ చేయగలను. [1] బస్తాలు, డెలివరీ, రెగ్యులర్ కస్టమర్లని గుర్తుపట్టడం, నా వల్ల కాదు. |
| 9 | ai | ప్రపంచంలో, నాలుగు ఉద్యోగాల్లో ఒకదాంట్లో, ఏఐ చేయగలిగే పనులు ఉన్నాయి. [1] చాలా ఉద్యోగాలు మారతాయి, పోవు. |
| 10 | suresh | మరి మొత్తం పేపర్ పనే ఉన్న ఉద్యోగం? |
| 11 | ai | అదే ఎక్కువ మారుతుంది. [1] ఏఐ పనిని చెక్ చేసేవాళ్ళు అవ్వండి, టూల్ నేర్చుకోండి. |
| 12 | ravi | అంటే: ఏఐ డ్రాఫ్ట్ చేస్తుంది, నువ్వు చెక్ చేస్తావ్. [1] బస్తాలు, కస్టమర్లు: నీవే. |
| 13 | ravi | సరే, నువ్వే ఉంటావ్. [1] యాప్ కూడా నువ్వే నడుపు. |
| 14 | suresh | అయితే, నెలకి ఇరవై వేలు. |

## Caption ask (one word)
Does AI do any part of your job today? Comment YES or NO.
