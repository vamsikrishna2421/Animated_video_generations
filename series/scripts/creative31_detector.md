# Creative 31 "Written by AI: 0. Flagged as AI: 89." · Nov 16 creative slot · script v1

## The format
POV (not used in the last 7 days), one calm narrator, no other characters: "you" are the student. Pictures: a grid of 91
essay icons, a desk from above (a notebook in your handwriting, a laptop with a detector saying "AI"), the study's card,
our test cards, the makers' notes, a folder of drafts. After Creative 30 (calm explainer) and EP54 (tutorial).

## Point family
C. AI as gatekeeper (an AI score deciding marks). Last C: Creative 21 (Nov 6). Last two posts: EP54 (N), Creative 30 (B).

## Frame 1 (the reach stack + the same-item clash)
The same 91 essays, two counts: "WRITTEN BY AI: 0" (green) vs "FLAGGED AS AI: 89" (red), over 91 small essay icons, 89 of
them red. The stake: marks and fairness; the person: a student writing English as a second language (most of our
viewers); the culprit: the detector. Line 1 says both numbers in ~3 s, EN and TE.

## Hook options
1. (kept) 91 essays by students: written by AI 0, flagged 89.
2. "A detector says the 1776 Declaration of Independence was written by AI" (our test; funny, but no stake for the viewer).
3. "61% vs near-perfect": the same detectors on second-language vs US-born students (strong, but needs a sentence to set up).

## Facts (company pages / 2+ outlets)
- Stanford HAI, May 15, 2023 (the paper: "GPT Detectors are Biased Against Non-native English Writers", arXiv 2304.02819,
  senior author James Zou): seven detectors; 91 TOEFL essays: "more than half ... (61.22%)" classified as AI-generated;
  "89 of the 91 TOEFL essays (97%) were flagged by at least one of the detectors"; "near-perfect" on essays by U.S.-born
  eighth-graders; the researchers point to perplexity (plain, predictable word choice).
- OpenAI: its AI classifier (launched Jan 31, 2023) "no longer available" as of July 20, 2023 "due to its low rate of
  accuracy" (OpenAI's note; reported by Search Engine Land, Business Today, The Decoder). Its own figures: it caught 26% of
  AI text and called human text AI 9% of the time.
- Turnitin's guidance: its AI writing score should not be used as the sole basis for adverse action against a student
  (Turnitin's help pages, quoted by universities incl. the University of San Diego and Boise State).

## Our test (pipeline/creative31/detector_demo.py, committed before it ran; series/scripts/creative31_demo/detector.json)
Two free detectors on Hugging Face, 4 human texts from before chat AIs (India's Preamble 1949, Tagore 1912, the US
Declaration of Independence 1776, Aesop in 1867 plain English) and 3 real AI texts (a small free AI's EMI working from
Creative 30's test):
- OpenAI's 2019 detector (roberta-base-openai-detector): called the 1776 Declaration AI (55%); called 2 of the 3 real AI
  texts human (34%, 3%); the Preamble, Tagore and Aesop human.
- A 2023 detector trained on ChatGPT answers (chatgpt-detector-roberta): all 7 right.
Small test, short texts (OpenAI said its own classifier was unreliable under 1,000 characters).

## Script (English, v1; narrator)
1. (hook) Ninety-one essays, all written by students. Written by AI: zero. Flagged as AI: eighty-nine.
2. (pov) POV: you wrote yours yourself, in English, your second language. The detector says: AI.
3. (why) Detectors hunt for plain, predictable words. Careful, simple English looks predictable too.
4. (study) Stanford researchers, 2023, seven detectors. Students writing English as a second language: sixty-one percent flagged. | U.S.-born students: near-perfect.
5. (ours) We tried two free detectors. OpenAI's older one called the 1776 Declaration of Independence AI, | and called two of three real AI texts human.
6. (makers) Even the makers warn: OpenAI shut its 2023 detector for low accuracy, and Turnitin says its score shouldn't be the only proof.
7. (fix) So if it's your child: keep the drafts, the notes, the version history. Ask them to judge the work, not the score.
8. (loop) Because remember: ninety-one essays, all written by students...

## Script (Telugu, v1)
1. తొంభై ఒక్క వ్యాసాలు, అన్నీ పిల్లలు రాసినవే. మెషీన్ రాసినవి: సున్నా. మెషీన్ రాసింది అని ముద్ర పడ్డవి: ఎనభై తొమ్మిది.
2. ఊహించండి: మీ వ్యాసం మీరే రాశారు, ఇంగ్లీష్ మీ రెండో భాష. డిటెక్టర్ మాత్రం, మెషీన్ రాసింది అంటోంది.
3. డిటెక్టర్లు, ఊహించగలిగే సాదా మాటల కోసం వెతుకుతాయి. జాగ్రత్తగా రాసిన సింపుల్ ఇంగ్లీష్ కూడా, అలాగే కనిపిస్తుంది.
4. స్టాన్ఫర్డ్ రీసెర్చర్లు, ఏడు డిటెక్టర్లతో టెస్ట్ చేశారు. ఇంగ్లీష్ రెండో భాషగా రాసిన పిల్లలు: అరవై ఒక్క శాతం మీద ముద్ర. | అమెరికాలో పుట్టిన పిల్లల మీద: దాదాపు లేదు.
5. మేము రెండు ఫ్రీ డిటెక్టర్లు ట్రై చేశాం. ఒక పాత డిటెక్టర్, పదిహేడు వందల డెబ్భై ఆరులో రాసిన అమెరికా డిక్లరేషన్ ని, మెషీన్ రాసింది అంది. | నిజంగా మెషీన్ రాసిన మూడింట్లో రెండు, మనుషులు రాసినవి అంది.
6. తయారు చేసినవాళ్ళే హెచ్చరిస్తున్నారు: ఈ స్కోర్ ఒక్కటే రుజువు కాదు.
7. మీ పిల్లల మీద ఈ ముద్ర పడితే: డ్రాఫ్ట్స్, నోట్స్, వెర్షన్ హిస్టరీ దాచండి. స్కోర్ కాదు, పని చూడమని అడగండి.
8. ఎందుకంటే గుర్తుంచుకోండి: తొంభై ఒక్క వ్యాసాలు, అన్నీ పిల్లలు రాసినవే...

## Caption ask (a try-it with a posted answer)
"Paste a paragraph you wrote yourself into any free AI detector. Post the % AI it gives you."
