# Creative 30 "₹23,405 or ₹34,713? The AI's EMI" · Nov 15 creative slot · script v1

## The format (the pitch to Bujji, Nov 14: a calm explainer in the Hanuman pilot's shape)
No characters, nobody talks to anybody. One calm narrator, one picture per beat (a loan letter and a house, a 20-year
calendar, the AI's own working on lined paper, words typing themselves, our test tiles, a calculator), a bell on every
cut (deep on frame 1 and the loop). A quiet music bed under the voice, up in the gaps (CLAUDE.md's arc), not the
Hanuman pilot's no-music: the bells carry the cuts. Follows EP53 (a screen tutorial) and Creative 29 (story mode).

## Point family
B. AI can't do what it looks like it does (maths). Last two posts: EP53 (M), Creative 29 (D). Family B last used by
Creative 22 (Nov 7).

## Frame 1 (the reach stack + the same-item clash rule)
The same home loan, two monthly EMIs: "THE AI SAID ₹23,405" (red) vs "THE REAL EMI ₹34,713" (green), over a loan letter
"HOME LOAN · ₹40,00,000 · 8.5% · 20 YEARS" and a house. The stake: a family's home-loan budget; the injustice: ₹11,308
a month (₹27 lakh over 20 years) nobody planned for; the AI the culprit. Line 1 says both numbers in ~3 s, EN and TE.

## Hook options
1. (kept) Frame 1 the two EMIs; "Twenty-three thousand a month, said a small AI. The real EMI: thirty-four thousand seven hundred."
2. "It wrote 'calculated using a calculator'. It had no calculator." (the best line, but no number clash in frame 1)
3. "₹27 lakh you never planned for": one big number, no clash; fails the stack.

## Our test (pipeline/creative30/emi_demo.py, rescore.py; series/scripts/creative30_demo/emi.json; committed before they ran)
Ten loans of the kind a family takes (our numbers: bike, personal, car, two home loans, education, a phone on EMI,
tractor, two-wheeler), the EMI from the standard formula, the same small free AI as EP51-53 (Qwen2.5-7B-Instruct,
4-bit, llama.cpp, on our computer, no tools, no web), temperature 0.2, one fresh chat each. Right = within ₹1.
| asked | right | notes |
|---|---|---|
| plainly ("reply with only the EMI") | 0 of 10 | off by ₹2 (the phone) to ₹22,137 a month (car: 35,709 vs 13,572); the ₹40 lakh home loan 23,405 vs 34,713 |
| step by step | 0 of 10 | closer: off by ₹32 to ₹1,621 a month; the right formula every time, then guessed powers: home loan "(1.00708333)^240 ≈ 6.9544 (This value is calculated using a calculator or financial software)", real 5.4412, no calculator; EMI 33,092 |
| as a formula, which we then worked out | 4 of 10 | exact on 4 (bike, car, phone, tractor); 6 wrong formulas (rates not divided by 1200...), the home loan's gives ₹28,33,333 a month. All 10 came in maths notation ("^"), so the demo's Python-only evaluator refused them; rescore.py (committed first) read them as written |

## Facts
- The EMI formula: EMI = P × r × (1 + r)^n / ((1 + r)^n − 1), r = annual rate / 12 / 100, n = months (standard; every
  bank's EMI calculator uses it).
- Some chat apps can run real code for maths: OpenAI's help page "Data analysis with ChatGPT" (ChatGPT writes and runs
  Python for calculations; check the code and outputs); Google's Gemini API docs, "Code execution" (the model writes and
  runs Python). Cited in the caption, not named in the video.

## Script (English, v1; narrator)
1. (hook) Twenty-three thousand a month, said a small AI. The real EMI on this home loan: thirty-four thousand, seven hundred.
2. (gap) Eleven thousand short, every month. Over twenty years, twenty-seven lakh rupees you never planned for.
3. (steps) Asked to work it out step by step, it got closer: thirty-three thousand. And it wrote, 'calculated using a calculator.' | It had no calculator.
4. (why) A chat AI writes the next likely words. Numbers too: it writes them; it doesn't work them out.
5. (test) Our test, ten loans: asked plainly, none right. Step by step, none. | As a formula we then worked out: four.
6. (fix) For money, use a calculator: your bank's EMI calculator, or code you can check.
7. (loop) So the next time a chat says, twenty-three thousand a month...

## Script (Telugu, v1)
1. నెలకి ఇరవై మూడు వేలు, అంది ఒక చిన్న చాట్‌బాట్. ఈ హోమ్ లోన్ అసలు నెల వాయిదా: ముప్పై నాలుగు వేల ఏడు వందలు.
2. ప్రతి నెలా పదకొండు వేలు తక్కువ. ఇరవై ఏళ్ళలో, మీరు లెక్కలో వేసుకోని ఇరవై ఏడు లక్షలు.
3. స్టెప్ బై స్టెప్ అడిగితే, దగ్గరికి వచ్చింది: ముప్పై మూడు వేలు. కాలిక్యులేటర్ తో లెక్కించాం, అని కూడా రాసింది. | దాని దగ్గర కాలిక్యులేటరే లేదు.
4. చాట్‌బాట్ తర్వాత రావాల్సిన మాటలు రాస్తుంది. అంకెలు కూడా అంతే: రాస్తుంది, లెక్క వేయదు.
5. మా టెస్ట్, పది లోన్లు: మామూలుగా అడిగితే, ఒక్కటీ సరిగ్గా లేదు. స్టెప్ బై స్టెప్, ఒక్కటీ లేదు. | ఫార్ములా రాయమని, మేమే లెక్కిస్తే: నాలుగు.
6. డబ్బు లెక్కకి, కాలిక్యులేటరే వాడండి: మీ బ్యాంక్ లోన్ కాలిక్యులేటర్, లేదా మీరు చెక్ చేయగలిగే కోడ్.
7. ఇంకోసారి ఏదైనా చాట్, నెలకి ఇరవై మూడు వేలు అంటే...

## Caption ask (post your answer)
"Your last EMI or bill: did you check it with a calculator, or trust the app? Post which."
