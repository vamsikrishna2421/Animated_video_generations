# Creative 25 "Which Wish Did the AI Write?" (the Nov 10 creative slot) · script v1, Nov 10

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
| "a short WhatsApp birthday wish (3 lines) for my grandmother, who turns 80 today" | 10/10 start "Happy 80th birthday, Grandma!" and say "May this special day..."; 10/10 use a stock phrase (filled with, joy, wonderful, special day); 0/10 say anything only her family would know; 1/10 kept "Of course! Here's a sweet birthday wish..." on top |
| the same + two real details (she taught me to ride a bicycle at 8; her pulihora is the best in the family; "don't add any other memories") | 10/10 use both details; 0/10 make up a memory about her (the rule fixed before the run); but 6/10 add "I miss you" (we never said we live away), 2/10 call her "Nana" or "Nanny" |

## The reach stack (checked)
1. Stake: family (a grandmother's 80th, the family group watching).
2. Frame 1, sound off: "TEJA: TYPED IT · 10 minutes" vs "SAI: ASKED AN AI · 1 tap", the two wishes, "ONE IS AI. WHICH?".
3. The small injustice: one tap passing for ten minutes of love; the payoff: you can tell, and so can she.
Line 1 says both numbers within 2 s (80, ten minutes), EN and TE.

## Hook options
1. **(v1)** The family group, two wishes, the two blocks (10 minutes vs 1 tap), "ONE IS AI. WHICH?".
2. Ammamma's reply first ("She hearted only one."), then the two wishes: the answer is teased before the question.
3. "10/10 said 'May this special day'" as frame 1: a number with no people.

## Script (English, v1; narrator) · ~48 s
| # | Line | On screen |
|---|---|---|
| 1 | Ammamma turns eighty. [1] Teja typed his wish for ten minutes. Sai tapped an AI once. | frame 1: the group; 1 and 2; the two blocks; ONE IS AI. WHICH? |
| 2 | Which one did the AI write? [1] One, or two? | "1 or 2?" and a 3-2-1 countdown (a 2.6 s hold) |
| 3 | Two. [1] It could go to any grandmother on earth. | 2 stamped AI; its stock phrases highlighted |
| 4 | One has her running behind his cycle, and her pulihora. [1] Only her family knows those. | the two details ringed in 1 |
| 5 | We asked a small free AI the same thing, ten times. [1] Ten out of ten: "May this special day". Not one thing only she'd know. | our test card |
| 6 | Then we gave it the two real details. [1] It used both, every time. But six times it added "I miss you"... and Sai lives next door. | the twist card; a real line, "I miss you dearly" struck |
| 7 | So let it write, the right way: two real details, [1] cut what isn't true, and sign it yourself. | the rule card |
| 8 | Ammamma replied to only one of them. [1] Guess which. | her reply bubble starts: "❤️ ..."; loops to frame 1 |

## Script (Telugu, v1)
| # | Telugu |
|---|---|
| 1 | అమ్మమ్మకి ఎనభై ఏళ్లు. [1] తేజ పది నిమిషాలు టైప్ చేశాడు. సాయి, చాట్ బాట్ ని ఒక్కసారి అడిగాడు. |
| 2 | ఏది చాట్ బాట్ రాసింది? [1] ఒకటా, రెండా? |
| 3 | రెండు. [1] ఇది ప్రపంచంలో, ఏ అమ్మమ్మకైనా పంపొచ్చు. |
| 4 | ఒకటిలో, సైకిల్ వెనకాల పరిగెత్తిన అమ్మమ్మ, ఆమె పులిహోర ఉన్నాయి. [1] అవి వాళ్ళ ఫ్యామిలీకి మాత్రమే తెలుసు. |
| 5 | మేము ఒక చిన్న ఫ్రీ చాట్ బాట్ ని, ఇదే పది సార్లు అడిగాం. [1] పదికి పది, ఒకే మాటతో మొదలయ్యాయి. ఆమెకి మాత్రమే తెలిసిన ఒక్క విషయం కూడా లేదు. |
| 6 | తర్వాత, ఆ రెండు నిజమైన విషయాలు ఇచ్చాం. [1] ప్రతిసారీ రెండూ వాడింది. కానీ ఆరు సార్లు, మిస్ అవుతున్నా అని రాసింది. సాయి పక్కింట్లోనే ఉంటాడు. |
| 7 | అందుకే: రెండు నిజమైన విషయాలు ఇవ్వండి, [1] నిజం కానిది తీసేయండి, మీ పేరుతో మీరే పంపండి. |
| 8 | అమ్మమ్మ, ఒక్కరికే రిప్లై ఇచ్చింది. [1] ఎవరికో గెస్ చేయండి. |

## On-screen texts (from our test; English on both pages)
- 1 (Teja, written by us): "Happy 80th, Ammamma! Still remember you running behind my cycle, holding the seat. Keep the pulihora ready, coming at 7! - Teja"
- 2 (the AI, bare, try 8): "Happy 80th birthday, Grandma! May this special day be filled with love, joy, and all the happiness you deserve. Here's to another wonderful chapter in your life! 🎉🎂💖"
- the twist line (details, try 3): "Your pulihora is still the best in the family, and I miss you dearly."

## Caption ask (the logged variable: a personal-experience ask)
"Has someone sent you a message you could tell an AI wrote? How did you know?"
