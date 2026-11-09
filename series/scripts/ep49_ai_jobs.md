# EP49 "AI and jobs: what really changes" (Season 5 finale) · queue 052 · script v1, Nov 9

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

## Script (English, v1) · ~55 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | suresh | Fifteen thousand a month, eight years... [1] and a free app takes my job?! | frame 1 |
| 2 | ravi | Relax! I only tested it on your paper work. | the shop |
| 3 | ai | Twenty-five tries at Suresh's paper work. [1] Eighteen right. | OUR TEST: a small free AI, offline · 25 tiles, 18 green |
| 4 | suresh | Eighteen?! | |
| 5 | ai | Sums and GST: ten out of ten. [1] But every offer message needed a fix before sending. | rows: sums 10/10 ✓ · reorder 4/5 · replies 4/5 · offers 0/5 ready to send; the offer draft with "[Your Shop Name]" and a stray "ice" circled |
| 6 | suresh | And who fixes them? Me! | |
| 7 | ravi | So does the AI take his job, or not? | |
| 8 | ai | I can do the paper part. [1] Not the sacks, the deliveries, or knowing who pays late. | SURESH'S DAY: paper (the AI can draft and add) vs hands and people (sacks, deliveries, who pays late, the supplier) |
| 9 | ai | Worldwide, one job in four has some AI exposure. [1] Most will change, not vanish. | ILO, May 2025: 1 in 4 jobs: some exposure · 3.3%: the highest · "transformation is more likely than replacement" |
| 10 | suresh | And a job that's all paper work? | |
| 11 | ai | That job changes the most. [1] Clerks first. | ILO: clerical jobs: the highest exposure |
| 12 | ravi | So the AI drafts and adds, Suresh checks and sends, [1] and the work with hands and people stays his. | the chip: AI TAKES TASKS, NOT JOBS · AI: drafts, sums · you: check, send · the hands-and-people work: yours · learn the tool |
| 13 | ravi | Okay, you stay. [1] Teach me this app. | |
| 14 | suresh | Fifteen thousand a month. | → frame 1 (loops) |

## Script (Telugu, v1; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | suresh | పదిహేను వేల జీతం, ఎనిమిదేళ్లు... [1] ఫ్రీ యాప్ నా ఉద్యోగం తీసుకుంటుందా?! |
| 2 | ravi | ఆగరా! నీ కాగితం పని మీద మాత్రమే టెస్ట్ చేశా. |
| 3 | ai | సురేష్ కాగితం పని, ఇరవై ఐదు సార్లు. [1] పద్దెనిమిది కరెక్ట్. |
| 4 | suresh | పద్దెనిమిదా?! |
| 5 | ai | లెక్కలు, జీఎస్టీ: పదికి పది. [1] కానీ ప్రతి ఆఫర్ మెసేజ్, పంపే ముందు సరి చేయాల్సి వచ్చింది. |
| 6 | suresh | సరి చేసేది ఎవరు? నేనే! |
| 7 | ravi | మరి ఏ ఐ, సురేష్ ఉద్యోగం తీసుకుంటుందా, లేదా? |
| 8 | ai | కాగితం పని నేను చేయగలను. [1] బస్తాలు మోయడం, డెలివరీ, ఎవరు అప్పు తీరుస్తారో తెలియడం, నా వల్ల కాదు. |
| 9 | ai | ప్రపంచంలో, నాలుగు ఉద్యోగాల్లో ఒకదానికి ఏ ఐ ప్రభావం ఉంది. [1] చాలా ఉద్యోగాలు మారతాయి, మాయం కావు. |
| 10 | suresh | మరి ఉద్యోగం మొత్తం కాగితం పనే అయితే? |
| 11 | ai | ఆ ఉద్యోగమే ఎక్కువ మారుతుంది. [1] ముందు క్లర్క్ పనులు. |
| 12 | ravi | అంటే, ఏ ఐ డ్రాఫ్ట్ రాస్తుంది, లెక్క వేస్తుంది. సురేష్ చెక్ చేసి పంపుతాడు. [1] చేతులతో, మనుషులతో చేసే పని సురేష్ దే. |
| 13 | ravi | సరే, నువ్వు ఉండు. [1] ఈ యాప్ నాకు నేర్పించు. |
| 14 | suresh | నెలకి పదిహేను వేలు. |

## Caption ask (one word)
Does AI do any part of your job today? Comment YES or NO.
