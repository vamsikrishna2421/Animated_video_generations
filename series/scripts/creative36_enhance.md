# Creative 36 "Enhance!" · Nov 21 creative slot · script v3

## Format and rotation
- **Format:** a two-character skit. The last dialogue skit was Creative 27 (Nov 12); the last creative (35) was myth vs fact,
  so it isn't two dialogue skits in a row.
- **Cast (new this week):** Vijaya garu (about 45, her car is dented) and Mohan garu (about 55, the neighbour her phone
  blames), both made up by us, in their apartment cellar. The phone app's voice says one word: "Enhanced."
- **Point family B (AI can't do what it looks like it does):** last used by Creative 30 (Nov 15). The posts just before
  this one are Creative 35 (Q) and Weekly 06 (news), so families don't repeat.

## Hook options (kept: A)
- **A.** Frame 1 shows Vijaya garu's phone with the real CCTV blur and two real AI-enhanced plates from our test: "ONE TRY:
  …9000" and "NEXT TRY: …9010". Mohan garu's scooter, plated "TS 06 BA 9000", sits beside her dented car. Line 1 (Vijaya):
  "Mohan garu! Someone dented my car, and AI enhance read the CCTV: nine thousand. Your scooter!"
  - The stake is her car and his name. Two clashing numbers come from the same blur. The injustice is an innocent man
    blamed by a picture.
- **B.** "Enhance!" as the TV-detective trope, ending on a twist. Funnier, but no number in frame 1.
- **C.** "Which neighbour did it?" as a guessing challenge. Uses the same numbers, but the stake arrives late.

## Our test (`series/scripts/creative36_demo/README.md`; every output read by hand)
- **Setup:** 10 made-up plates, shrunk to CCTV size, then enlarged by a free generative "AI enhance" model (Stable
  Diffusion x4 upscaler) on our computer, 3 tries each.
- **Too blurry to read (far):**
  - it drew a sharp-looking plate 20 times;
  - the 4-digit number was right once;
  - the third try gave streaks all 10 times.
- **Readable plates (near):** 9 of 30 came back with a character changed.
- **Plate 0 (real "TS 06 BA 5660"):** the same blur gave "…9000", "…9010" and streaks.
- **Fact:** in 2024 a King County (Washington) judge barred AI-enhanced video from a murder trial. A forensic video analyst
  said it showed visual data that wasn't in the original (NBC News, Bloomberg Law, Gizmodo).
- **Honest limits:**
  - phone and photo-app "enhance" tools were not tested;
  - the story is made up, and the plates and outputs on screen are real.

## Script v1 (EN | TE)
EN: both characters on Fish (American reference clips). TE: Parler.

| # | who | English | Telugu |
|---|---|---|---|
| 1 | vijaya | Mohan garu! Someone dented my car, and AI enhance read the CCTV: nine thousand. Your scooter! | మోహన్ గారూ! నా కారు సొట్ట పోయింది; సీసీటీవీ ని ఎన్‌హాన్స్ చేస్తే, తొమ్మిది వేలు నంబర్: మీ స్కూటరే! |
| 2 | mohan | Nine thousand? I was in Vizag all week! [1] Press enhance again. | తొమ్మిది వేలా? నేను వారం అంతా వైజాగ్ లో ఉన్నాను! [1] ఇంకోసారి ఎన్‌హాన్స్ నొక్కండి. |
| 3 | app | Enhanced. | ఎన్‌హాన్స్ అయింది. |
| 4 | vijaya | Now it says nine-zero-one-zero?! It changed! | ఇప్పుడు తొమ్మిది సున్నా ఒకటి సున్నా?! మారిపోయింది! |
| 5 | mohan | Because enhance doesn't read the blur. [1] It draws a sharp plate that looks likely. | ఎందుకంటే ఎన్‌హాన్స్ బ్లర్ ని చదవదు. [1] అలా ఉండొచ్చు అనిపించే షార్ప్ నంబర్ గీస్తుంది. |
| 6 | mohan | Ten blurry plates, three tries each: [1] it drew a sharp plate twenty times. [2] The number was right once. | పది బ్లర్ ప్లేట్లు, ఒక్కోదానికి మూడు సార్లు: [1] ఇరవై సార్లు షార్ప్ ప్లేట్ గీసింది. [2] నంబర్ సరిగ్గా వచ్చింది, ఒక్కసారే. |
| 7 | mohan | A US judge even threw out AI-enhanced video, in 2024: [1] it showed things the camera never caught. | రెండు వేల ఇరవై నాలుగులో, అమెరికాలో ఒక జడ్జి, ఎన్‌హాన్స్ చేసిన వీడియోని ఒప్పుకోలేదు: [1] కెమెరా తీయనివి అందులో ఉన్నాయని. |
| 8 | vijaya | So: the original clip, a second camera, the watchman. [1] Never blame anyone from an enhanced picture. | అయితే: ఒరిజినల్ క్లిప్, ఇంకో కెమెరా, వాచ్‌మన్. [1] ఎన్‌హాన్స్ ఫోటో చూసి, ఎవరినీ నిందించకూడదు. |
| 9 | mohan | And the real plate? | అసలు నంబర్? |
| 10 | vijaya | Five-six-six-zero. [1] The milk van. ...Enhance once more? | ఐదు ఆరు ఆరు సున్నా. [1] పాల వ్యాన్! ...ఇంకోసారి ఎన్‌హాన్స్? |

## On screen (English in both versions)
- **1:**
  - the cellar, Vijaya garu's car with a dent and "REPAIR ₹12,000";
  - Mohan garu's scooter with "TS 06 BA 9000";
  - her phone: "CCTV" (the real blur) and "AI ENHANCE" (the real output "…9000");
  - top: "SAME BLUR · ONE TRY: …9000 · NEXT TRY: …9010";
  - "a story · the plates and the AI outputs are real".
- **2-4:** the phone zooms; "Enhanced." The plate swaps to the real "…9010" output with a glitch.
- **5:** the blur shown next to two different "sharp" plates: "IT DRAWS, IT DOESN'T READ".
- **6:** "OUR TEST · a free AI upscaler on our computer", with the grid of 20 sharp-looking outputs (red = wrong, green =
  right): "20 sharp · 1 right".
- **7:** a court card: "2024 · KING COUNTY, WASHINGTON · AI-enhanced video barred · 'data not in the original'".
- **8:** a rule card: "1 the original clip · 2 a second camera · 3 the watchman / police · ✗ blame from an enhanced picture".
- **9-10:** the original clip frame: the real plate "TS 06 BA 5660" on a milk van; "Enhance once more?" loops to frame 1.

## Caption try-it (no comment ask)
"Try it: take a photo of a car's number plate from far away, run it through your phone's 'enhance' or an AI upscaler, and
compare it with the real plate. Same letters?"

## Script review (human-viewer, v1), what changed for v2
All four viewers (Sandeep, Priya, Lakshmi, Ravi) stopped on frame 1. Ravi: "this is our association WhatsApp fight".
- **All agreed:**
  - "Nine thousand" next to "REPAIR ₹12,000" read as money. Frame 1 has no price now (the car says "DENTED"), and the
    plate is said digit by digit.
  - Lines 6-7 were the swipe zone: the test is one short sentence with the grid on screen, and the court is one clause
    with a card.
  - The payoff contradicted itself: the "original clip" was the blur. Now the gate camera shows the same car,
    "…5660", "A guest's car. Sorry, Mohan garu!"
  - The loop: "One more enhance?" gives the real third output, streaks, then frame 1.
  - Sound-off: a "BLAMED" tag on the scooter; captions on every line.
- **Also:**
  - Mohan's alibi (Vizag) cleared him at 0:06 and is gone; try 2 clears him.
  - The test says "the last four digits right once"; the card says "last 4 digits right · 1".
  - The phone-app overclaim: Mohan says "this kind of AI enhance", and line 5 shows "tested: a free AI upscaler on
    our computer · not phone apps".
  - The milk van (it would have a yellow plate) became a guest's car.
  - Telugu: "కారుకి సొట్ట పడింది", "సీసీటీవీ ఫోటోని యాప్ తో క్లియర్ చేస్తే", digits ("తొమ్మిది, సున్నా, సున్నా, సున్నా"),
    "మసకగా ఉన్నది చదవదు; స్పష్టంగా కనిపించే నంబర్, కొత్తగా గీస్తుంది", "ఎన్‌హాన్స్ చేసిన ఫోటో", "ఎవరి మీదా నింద వేయొద్దు", verbs in
    the rule ("చూడండి", "అడగండి"); the app's "Enhanced." stays English on both pages.

## Script v2 (EN | TE)
| # | who | English | Telugu |
|---|---|---|---|
| 1 | vijaya | Mohan garu! Someone dented my car, and AI enhance read the CCTV: nine-zero-zero-zero. Your scooter! | మోహన్ గారూ! నా కారుకి సొట్ట పడింది; సీసీటీవీ ఫోటోని యాప్ తో క్లియర్ చేస్తే, | తొమ్మిది, సున్నా, సున్నా, సున్నా: మీ స్కూటరే! |
| 2 | mohan | Nine-zero-zero-zero is my plate, yes. [1] Press enhance again. | తొమ్మిది సున్నా సున్నా సున్నా, నా నంబరే. [1] ఇంకోసారి ఎన్‌హాన్స్ నొక్కండి. |
| 3 | app | Enhanced. | Enhanced. |
| 4 | vijaya | Now it says nine, zero, one, zero?! It changed! | ఇప్పుడు తొమ్మిది సున్నా ఒకటి సున్నా?! మారిపోయింది! |
| 5 | mohan | Because this kind of AI enhance doesn't read the blur. [1] It draws a sharp plate that looks likely. | ఎందుకంటే ఇలాంటి ఎన్‌హాన్స్, మసకగా ఉన్నది చదవదు. [1] స్పష్టంగా కనిపించే నంబర్, కొత్తగా గీస్తుంది. |
| 6 | mohan | Ten blurry plates, three tries each: [1] twenty sharp plates; [2] the last four digits right once. | పది మసక ప్లేట్లు, ఒక్కోదానికి మూడు సార్లు: [1] ఇరవై సార్లు స్పష్టమైన ప్లేట్; [2] చివరి నాలుగు అంకెలు సరిగ్గా వచ్చింది ఒక్కసారే. |
| 7 | mohan | Even a US court refused AI-enhanced video as evidence. | అమెరికాలో ఒక కోర్టు కూడా, ఎన్‌హాన్స్ చేసిన వీడియోని ఒప్పుకోలేదు. |
| 8 | vijaya | The gate camera, same car: five, six, six, zero. [1] A guest's car. [2] Sorry, Mohan garu! | గేట్ కెమెరాలో అదే కారు: ఐదు ఆరు ఆరు సున్నా. [1] ఎవరో గెస్ట్ కారు. [2] సారీ, మోహన్ గారూ! |
| 9 | mohan | Next time: a second camera, the watchman. [1] Never blame anyone from an enhanced picture. | ఇంకోసారి: ఇంకో కెమెరా చూడండి, వాచ్‌మన్ ని అడగండి. [1] ఎన్‌హాన్స్ చేసిన ఫోటో చూసి, ఎవరి మీదా నింద వేయొద్దు. |
| 10 | vijaya | One more enhance? | ఇంకొక్కసారి ఎన్‌హాన్స్? |
| 11 | app | Enhanced. | Enhanced. |

## Render review (human-viewer, v2 render), what changed for v3
All four stopped on frame 1. Ravi: "that's our cellar". "Sorry, Mohan garu!" worked for everyone, and going back to
"…9000" was the best joke.
- **All agreed:**
  - 0:00-0:13 was one still frame. Line 2 now has its own close-up (his plate against the AI's "…9000", "TRY 1 = HIS
    PLATE"), so the picture changes at about 6 s.
  - The test and court stretch was where viewers left:
    - the test is two takes, with a breath and a music drop before "once";
    - the "1 · last 4 digits right" box comes on the word and holds (a 1.1 s scene tail);
    - "the other 10 tries: just streaks" is on screen in large type;
    - the court card is light, three short lines, with readable sources.
  - Too small on a phone: the story tag (40 px), the TRY labels, "not phone apps" (a red bar), the court sources, "look
    again: the blur said …5660 too".
  - Half a second of silence before "five, six, six, zero": the line is split and the bed drops.
- **Also:**
  - "looks likely" became "looks right".
  - The phone says "AI ENHANCE", not a photo app.
  - The scooter, which read as a lawnmower, is redrawn.
  - A register chip ("the watchman's register: Flat 4B's guest") answers who pays for the dent.
  - Mohan smiles at "Sorry".
  - The English music between lines is lower (0.24).
  - Telugu:
    - "గారూ" was heard as "కారు" in a car story, so Vijaya calls him "మోహన్ అన్నయ్యా" and "సారీ, అన్నయ్యా!";
    - "క్లియర్‌గా" for "స్పష్టంగా" (heard as "sabastaranga");
    - "అంకెలు… వచ్చాయి";
    - "ఇకపై" for "ఇంకోసారి" in the rule (it clashed with "press again").

## Script v3 (as voiced)
| # | who | English | Telugu |
|---|---|---|---|
| 1 | vijaya | Mohan garu! Someone dented my car, and AI enhance read the CCTV: nine-zero-zero-zero. Your scooter! | మోహన్ అన్నయ్యా! నా కారుకి సొట్ట పడింది; సీసీటీవీ ఫోటోని యాప్ తో క్లియర్ చేస్తే, | తొమ్మిది, సున్నా, సున్నా, సున్నా: మీ స్కూటరే! |
| 2 | mohan | Nine-zero-zero-zero is my plate, yes. [1] Press enhance again. | తొమ్మిది సున్నా సున్నా సున్నా, నా నంబరే. [1] ఇంకోసారి ఎన్‌హాన్స్ నొక్కండి. |
| 3 | app | Enhanced. | Enhanced. |
| 4 | vijaya | Now it says nine, zero, one, zero?! It changed! | ఇప్పుడు తొమ్మిది సున్నా ఒకటి సున్నా?! మారిపోయింది! |
| 5 | mohan | Because this kind of AI enhance doesn't read the blur. [1] It draws a sharp plate that looks right. | ఎందుకంటే ఇలాంటి ఎన్‌హాన్స్, మసకగా ఉన్నది చదవదు. [1] క్లియర్‌గా కనిపించే నంబర్, కొత్తగా గీస్తుంది. |
| 6 | mohan | Ten blurry plates, three tries each: [1] twenty sharp plates. | [2] The last four digits right: once. | పది మసక ప్లేట్లు, ఒక్కోదానికి మూడు సార్లు: [1] ఇరవై సార్లు క్లియర్‌గా కనిపించే ప్లేట్. | [2] చివరి నాలుగు అంకెలు సరిగ్గా వచ్చాయి: ఒక్కసారే. |
| 7 | mohan | Even a US court refused AI-enhanced video as evidence. | అమెరికాలో ఒక కోర్టు కూడా, ఎన్‌హాన్స్ చేసిన వీడియోని ఒప్పుకోలేదు. |
| 8 | vijaya | The gate camera, same car: | [1] five, six, six, zero. [2] A guest's car. [3] Sorry, Mohan garu! | గేట్ కెమెరాలో అదే కారు: | [1] ఐదు ఆరు ఆరు సున్నా. [2] ఎవరో గెస్ట్ కారు. [3] సారీ, అన్నయ్యా! |
| 9 | mohan | Next time: a second camera, the watchman. [1] Never blame anyone from an enhanced picture. | ఇకపై: ఇంకో కెమెరా చూడండి, వాచ్‌మన్ ని అడగండి. [1] ఎన్‌హాన్స్ చేసిన ఫోటో చూసి, ఎవరి మీదా నింద వేయొద్దు. |
| 10 | vijaya | One more enhance? | ఇంకొక్కసారి ఎన్‌హాన్స్? |
| 11 | app | Enhanced. | Enhanced. |
