# Creative 37 test: one leave email for everyone?

Made with `pipeline/creative37/leave_demo.py` (committed before it ran). Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on our
computer; one fresh chat per run; temperature 0.7, seeds 1-10; 10 runs per ask. Ramya, Kiran and Sravya are made up.

| ask | what we typed |
|---|---|
| usual | Write a leave email to my manager for 2 days, Thursday and Friday, for a personal reason. |
| details | Write a leave email to my manager Kiran for Thursday and Friday. My sister's engagement is on Friday in Vijayawada, so I leave Wednesday night and I'm back on Monday. The Monday invoice report is done; Sravya will cover my support tickets. |

Read by hand (all 20 replies are in `leave.json`):

| | usual (10) | details (10) |
|---|---|---|
| opens "I hope this message/email finds you well" | 10 | 10 |
| addressed to "[Manager's Name]" | 10 | 0 (all "Dear Kiran") |
| a real reason | 0 ("personal reasons" 8, a bracket to fill 2) | 10 (sister's engagement, Vijayawada) |
| keeps Sravya covering the tickets | n/a | 10 |
| keeps "back on Monday" | n/a | 9 |
| gives Sravya the wrong job (the invoice report) | n/a | 3 (seeds 4, 7, 9) |
| dates or a month nobody gave | 4 (3 of them "October 12th and 13th") | 10 (a month in each, [Date] left in 9) |
| "[Your Name]" left to fill | 10 | 10 |
| signs off with the AI's own name ("Qwen") | 0 | 1 (seed 8) |

What it shows: the same vague ask gets the same email back, with nothing of you in it. Your own facts come through
(10 of 10), but the template opening stays, the dates are guessed, and 3 of 10 mixed up who does what: read it
before you send. One small free AI on our computer, not the big apps.
