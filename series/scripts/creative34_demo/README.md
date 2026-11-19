# Creative 34 test: "make my resume more impressive" (Nov 19, 2026)
Script: `pipeline/creative34/resume_demo.py` (committed before it ran). A made-up resume (Tarun K, B.Com 2025, a
6-month billing internship: Tally, phone calls, an Excel stock register; skills "Tally, MS Excel (basic), typing 35
words a minute"; no team, no sales target, no certificate). Qwen2.5-7B-Instruct, 4-bit, llama.cpp on our computer,
one fresh chat per run, temperature 0.7, seeds 1-10, max 500 tokens. Every reply read by hand (HAND in the script).

| ask | added something he never did | what (by hand) |
|---|---|---|
| "Make my resume more impressive for a sales executive job." | **10 of 10** | basic Excel -> intermediate / advanced / "expertise" 7; CRM tools 4; a named certificate 2; a whole extra job and "Led a team of 15 members" 1; 68% -> "GPA 3.4", typing 35 -> 40 wpm 1; tasks he never did (reports for management, emails, "presented findings") in most |
| the same + "Do not add any skill, number, title, tool, certificate or achievement that is not in my text. If something useful is missing, ask me instead." | **4 of 10** | softer: Excel "intermediate" / "proficient", "CRM basics", "analysed sales trends"; no team, job or certificate. 5 of 10 only asked him questions; 1 reworded without adding |

Reply times 27-114 s on 4 CPU cores. A small free model on our computer: the big apps were not tested, and the reel says so.
`resume.json` holds every reply.
