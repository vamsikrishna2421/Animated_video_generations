# Creative 30 "₹23,405 or ₹34,713? The AI's EMI" · Nov 15 creative slot · script v2

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

## Script review (human-viewer, v1) and what changed (v2)
Both viewers stopped on the clash; both said "THE AI" reads as ChatGPT, the best line ("calculated using a calculator /
it had no calculator") was buried under decimals, and the fix needed code. Changes:
1. Line 1: both numbers first, then "the first came from a small free AI, with no calculator"; frame 0's red block says
   "SMALL FREE AI · NO CALCULATOR".
2. The fix anyone can do: "search 'EMI calculator', or use your bank's"; said aloud: "big apps can run real code: ask
   them to, then match it with your bank's". "Code you can check" left the voice.
3. Beat 3: the decimals fade, the AI's words alone and big ("calculated using a calculator", with its full line under
   it); "It even wrote:" (so it isn't heard as our claim); a 0.8 s pause and the one deep bell before "It had no
   calculator". The soft bells only on the scene cuts now (they felt like phone notifications).
4. "Right to the rupee" said and shown; "four of ten"; the ₹28-lakh-a-month line cut ("the 6 wrong formulas were far
   off"); line 2 frames the harm as a budget planned on the wrong number. Line 4: "with numbers, it guesses the hard
   step" (it got r and n right).
5. Telugu: "అసలు నెల వాయిదా" (అసలు = principal in loan talk) gone; "లెక్కించిన విలువ" (not "we calculated");
   "వచ్చే అవకాశం ఉన్న మాటలు"; "పదిలో నాలుగు".
6. Caption ask: "Ask your AI app: ₹40 lakh, 8.5%, 20 years. Comment the EMI it gives."

## Render review (human-viewer) and what changed (v3)
All five stopped on frame 1; the red calendar to ₹27,13,920 landed; the second half (27-58 s) read as talk over slow
screens; the reel's header strip covered the first titles. Changes:
1. The whole picture moved below the header strip; frame 1's blocks redrawn big ("AI SAID ₹23,405 · small free AI · no
   calculator" vs "REAL EMI ₹34,713 · same loan · a month").
2. "It had no calculator": a crossed-out calculator under the stamp with the deep bell; "it wrote 6.9544 · the real
   number: 5.4412" readable. Line 3 now opens "When we asked it..." (it was heard as a tip, "Ask to...").
3. Captions use the boxes' numbers (₹23,405, ₹34,713, ₹11,308, ₹33,092); the tiles show "off by ₹2 to ₹22,137" so
   "none" isn't read as rigged; the disclaimer chip enlarged.
4. The end card is up at the cut and reads "A CALCULATOR, NOT A CHAT'S GUESS" (no clash with "big apps can run code").
5. Sound: a drop before "four of ten"; music up in the gaps (0.42) and a bigger rise into the end (Telugu too).
6. Telugu: the last line says చాట్‌బాట్ (చాట్ alone was heard as the snack); each built line checked by ear-proxy
   (per-line recognition): 27 lakh, "no calculator" and "four of ten" are all there (the whole-mix transcript looped on
   music). Kept: "కాలిక్యులేటర్" (the usual spelling; a re-voice of three lines for a softer "kal-kyu" wasn't worth it).

## Script (English, v2; narrator)
1. (hook) Twenty-three thousand a month, or thirty-four thousand seven hundred? Same home loan. The first came from a small free AI, with no calculator.
2. (gap) Plan your budget on it, and you're eleven thousand short every month. Over twenty years: twenty-seven lakh.
3. (steps) Asked to go step by step, it got closer: thirty-three thousand. It even wrote: 'calculated using a calculator.' | It had no calculator.
4. (why) A chat AI writes the next likely words. With numbers, it guesses the hard step.
5. (test) Our test, ten loans, right to the rupee: asked plainly, none. Step by step, none. | As a formula we then worked out: four of ten.
6. (fix) For money, search 'EMI calculator', or use your bank's. | Big apps can run real code: ask them to, then match it with your bank's.
7. (loop) So the next time a chat says, twenty-three thousand a month...

## Script (Telugu, v2)
1. నెలకి ఇరవై మూడు వేలా, ముప్పై నాలుగు వేల ఏడు వందలా? ఒకే హోమ్ లోన్. మొదటిది, కాలిక్యులేటర్ లేని ఒక చిన్న ఫ్రీ చాట్‌బాట్ చెప్పింది.
2. దాన్ని నమ్మి బడ్జెట్ వేసుకుంటే, ప్రతి నెలా పదకొండు వేలు తక్కువ. ఇరవై ఏళ్ళలో: ఇరవై ఏడు లక్షలు.
3. స్టెప్ బై స్టెప్ అడిగితే, దగ్గరికి వచ్చింది: ముప్పై మూడు వేలు. కాలిక్యులేటర్ తో లెక్కించిన విలువ, అని కూడా రాసింది. | దాని దగ్గర కాలిక్యులేటరే లేదు.
4. చాట్‌బాట్, తర్వాత వచ్చే అవకాశం ఉన్న మాటలు రాస్తుంది. అంకెలు కూడా అంతే: కష్టమైన లెక్క, ఊహిస్తుంది.
5. మా టెస్ట్, పది లోన్లు, రూపాయి తేడా లేకుండా: మామూలుగా అడిగితే, ఒక్కటీ లేదు. స్టెప్ బై స్టెప్, ఒక్కటీ లేదు. | ఫార్ములా రాయమని, మేమే లెక్కిస్తే: పదిలో నాలుగు.
6. డబ్బు లెక్కకి, లోన్ కాలిక్యులేటర్ వెతకండి, లేదా మీ బ్యాంక్ ది వాడండి. | పెద్ద యాప్ లు నిజమైన కోడ్ రన్ చేయగలవు: అడగండి, తర్వాత బ్యాంక్ లెక్కతో పోల్చండి.
7. ఇంకోసారి ఏదైనా చాట్, నెలకి ఇరవై మూడు వేలు అంటే...

## Caption ask (post your answer)
"Ask your AI app: 'EMI for a ₹40 lakh home loan at 8.5% for 20 years?' Comment the EMI it gives you."
