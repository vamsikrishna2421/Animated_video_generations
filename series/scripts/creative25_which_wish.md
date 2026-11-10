# Creative 25 "Which Wish Did the AI Write?" (the Nov 10 creative slot) · script v2, Nov 10

## The format (format rotation, Vamsi via Bujji, Nov 9: "too routine, all skits")
A one-question challenge, not a dialogue skit: the family WhatsApp group on screen, two birthday wishes (1 and 2), one
calm narrator, a 3-second countdown for the viewer's guess, the reveal, then our test. The caption carries the logged
variable: a personal-experience ask (Bujji's Skit 14 7-day #3).

## The idea (point family new: "L. AI writes for anyone, unless you give it you")
Ask an AI for a wish and you get a wish that fits any grandmother on earth. Give it two real details and it uses them;
but it can still add things that aren't true. So: two real details, cut what isn't true, sign it yourself.

## Our test (pipeline/creative25/wish_demo.py, series/scripts/creative25_demo/7B.json; committed before it ran)
Qwen2.5-7B-Instruct (Qwen's own 4-bit file), llama.cpp, 4 cores, offline (checked before and after), temperature 0.7,
ten tries each way, a fresh chat each time, every reply read by hand.
| ask | result |
|---|---|
| "a short WhatsApp birthday wish (3 lines) for my grandmother, who turns 80 today" | 10/10 say "May this special day..." (8/10 open "Happy 80th birthday, Grandma!"); 10/10 use a stock phrase (filled with, joy, wonderful, special day); 0/10 say anything only her family would know; 1/10 kept "Of course! Here's a sweet birthday wish..." on top |
| the same + two real details (she taught me to ride a bicycle at 8; her pulihora is the best in the family; "don't add any other memories") | 10/10 use both details; 0/10 make up a memory about her (the rule fixed before the run); but 5/10 add "I miss you" and 1 more "I miss it" (we never said we live away), 2/10 call her "Nana" or "Nanny" |

## The reach stack (checked)
1. Stake: family (a grandmother's 80th, the family group watching).
2. Frame 1, sound off: "TEJA: TYPED IT · 10 minutes" vs "SAI: ASKED AN AI · 1 tap", the two wishes, "ONE IS AI. WHICH?".
3. The small injustice: one tap passing for ten minutes of love; the payoff: you can tell, and so can she.
Line 1 says both numbers within 2 s (80, ten minutes), EN and TE.

## Hook options
1. **(v1)** The family group, two wishes, the two blocks (10 minutes vs 1 tap), "ONE IS AI. WHICH?".
2. Ammamma's reply first ("She hearted only one."), then the two wishes: the answer is teased before the question.
3. "10/10 said 'May this special day'" as frame 1: a number with no people.

## Script review (human-viewer, v1) and what changed
Sandeep 7 (his own family group), Priya 6. Both: the quiz gave itself away: wish 2 said "Grandma", "May this special day"
and three emoji, the blocks named who used the AI and wish 1 was signed "- Teja"; "Sai lives next door" came out of nowhere
at the end; lines 3, 4 and 5 said "only she'd know" three times; "Guess which" at the end had no payoff (answered at
~0:10); "a small free AI" reads as free ChatGPT; the Telugu line 5 said "they all began the same" (a different claim).
Fact check: 5 replies (not 6) say "miss you" (try 1's "I miss it" is about the pulihora); "10/10 start 'Happy 80th
birthday, Grandma!'" is 8/10 (not used). Sandeep: the "Of course! Here's a sweet birthday wish..." reply is the line he'd
forward. Priya: "I miss you" isn't a disobeyed rule, it's a guess: the lesson is that it fills gaps with assumptions, so
tell it the facts that matter and re-read. Telugu: the lone "ఏ" in "ఏ అమ్మమ్మకైనా"; line 4 textbook grammar; "ఆమె" cold;
"మేం"; "నిన్ను మిస్ అవుతున్నా"; "చాట్‌బాట్‌ని" as one word.
Changed (v2): wish 2 is the AI wish that used the two real details (details, try 3), so you have to look; the blocks don't
name anyone ("ONE GRANDSON TYPED · 10 minutes" / "ONE ASKED AN AI · 1 tap"), no signature; "both grandsons live next door"
in line 1 and frame 1; the reveal is "I miss you dearly... from next door?"; the tells: the real details ringed, the
guesses marked; the test card says "a small free AI on our laptop, not ChatGPT" and shows the "Of course!" reply; "five
times" it guessed "I miss you"; the rule: tell it the facts that matter, read every line, fix what isn't true; the ending
is Ammamma's reply to Sai, "Miss me? You're 10 steps away. Come and eat!"; Telugu fixed as listed ("pulihora" is no longer
spoken in English).

## Script (English, v2; narrator) · ~45 s
| # | Line |
|---|---|
| 1 | Ammamma turns eighty. Both grandsons live next door. [1] One typed his wish for ten minutes. One tapped an AI. |
| 2 | Which one did the AI write? [1] One, or two? |
| 3 | Two. [1] "I miss you dearly"... from next door? |
| 4 | The AI used both real details. [1] Then it guessed the rest. |
| 5 | We tested a small free AI on our laptop, not ChatGPT. With no details, ten tries: [1] all ten said "May this special day". One even began, "Of course! Here's a sweet birthday wish". |
| 6 | With the two details, it used both, every time. [1] But five times, it guessed "I miss you". |
| 7 | So tell it the facts that matter, [1] read every line, and fix what isn't true. |
| 8 | Ammamma's reply: [1] "Miss me? You're ten steps away. Come and eat!" |

## Script (Telugu, v2)
| # | Telugu |
|---|---|
| 1 | అమ్మమ్మకి ఎనభై ఏళ్లు. మనవళ్ళు ఇద్దరూ పక్కింట్లోనే ఉంటారు. [1] ఒకడు పది నిమిషాలు టైప్ చేశాడు. ఇంకొకడు చాట్‌బాట్‌ని ఒక్క ట్యాప్ తో అడిగాడు. |
| 2 | ఏది చాట్‌బాట్ రాసింది? [1] ఒకటా, రెండా? |
| 3 | రెండు. [1] పక్కింట్లో ఉండి, నిన్ను మిస్ అవుతున్నా అంటాడా? |
| 4 | చాట్‌బాట్, రెండు నిజమైన విషయాలు వాడింది. [1] మిగతాదంతా ఊహించింది. |
| 5 | మేం మా ల్యాప్‌టాప్ లో, ఒక చిన్న ఫ్రీ చాట్‌బాట్‌ని టెస్ట్ చేశాం, చాట్ జీపీటీ కాదు. వివరాలు లేకుండా, పది సార్లు: [1] పదికి పది, ఒకే మాట: మే దిస్ స్పెషల్ డే. ఒకసారైతే, ఆఫ్ కోర్స్ అని మొదలుపెట్టింది. |
| 6 | రెండు వివరాలు ఇస్తే, ప్రతిసారీ రెండూ వాడింది. [1] కానీ ఐదు సార్లు, నిన్ను మిస్ అవుతున్నా అని ఊహించింది. |
| 7 | అందుకే, ముఖ్యమైన నిజాలు చెప్పండి, [1] ప్రతి లైన్ చదవండి, నిజం కానిది సరిచేయండి. |
| 8 | అమ్మమ్మ రిప్లై: [1] మిస్ అవుతున్నావా? పది అడుగుల దూరంలో ఉన్నావ్, వచ్చి తిను! |

## Caption ask (the logged variable: a personal-experience ask; one question, as Priya asked)
"The last message you got that an AI clearly wrote: what gave it away?"
