# Creative 33 "Which One Is Really Kittu?" · Nov 18 creative slot · script v2

## Format and rotation
- **A one-question challenge** (last used by Creative 25, Nov 10; not a dialogue skit: agreed with Bujji, Nov 18-19).
  Amma's phone: a chat with "Kittu ❤", two voice notes (1 and 2), a payment screen for ₹50,000 under her thumb. "Which
  one is really Kittu?" A 3-second countdown, then the reveal.
- Cast (new): Amma (on screen, holding the phone), Kittu (a voice only). Narrator: the channel's calm storyteller.
- Point family: G, "Scams dressed as AI" (EP45, Nov 3). The last post was EP56 (P).

## Hook options (kept: A)
- **A (kept):** the chat with two voice notes and "₹50,000 · PAY" ready; "One of these voice notes is really Kittu. The
  other wants fifty thousand rupees from his mother." A question, a person, money, the AI as the culprit.
- B: "13 seconds of his voice. ₹50,000 from his mother." Two numbers, but no game.
- C: a ringing phone, "Amma, it's me": a familiar scam opener, no question for the viewer.

## Our test (pipeline/creative33/clone_demo.py, committed before it ran)
Kittu and "someone else" are computer voices (Parler, on our machine): nobody real was cloned. A voice-cloning service
(Fish Audio, the one this channel uses for its narrator) copied Kittu from the first 3.6 s, 13.2 s and 30.6 s of his
voice note. A speaker-recognition model (SpeechBrain ECAPA) scored each voice against two sentences Kittu said that no
reference contained (cosine similarity, shown ×100):
| English | match with Kittu |
|---|---|
| Kittu vs his own other sentence | 62 |
| copy from 30.6 s | 65 |
| copy from 13.2 s | 62 |
| copy from 3.6 s (one sentence) | 50 |
| someone else | 7 |
Telugu (copy from 13.6 s): Kittu vs Kittu 54, the copy 58, someone else 16. Each copy took 2.7-9.2 s to make; the scam
line in the reel took 7.6 s (EN) and 9.1 s (TE). A program's score, not people's ears: we did not test people.

## Facts (for the narration and caption)
- McAfee, "Beware the Artificial Impostor" (May 2023; 7,054 adults in 7 countries, 1,010 in India): 47% of Indian adults
  had experienced or knew someone who had experienced an AI voice scam (global 25%); of Indian victims who lost money,
  48% lost over ₹50,000 (Business Today, Business Insider India, BOOM). McAfee also said 3 seconds of audio can be enough
  to clone a voice (their claim; our 3.6 s copy scored 50).
- What to do (FTC's family-emergency-scam advice, widely reported): a family code word; hang up and call back on a number
  you know. In India, report cyber fraud on 1930 or cybercrime.gov.in.

## Script review (human-viewer, v1), what changed for v2
- The guess was too easy: note 2 talked about an accident and money, so the words gave it away, not the voice. Both
  notes now say the same neutral sentence from the test ("Amma, did you take your tablets today?": Kittu, and the copy
  from 13 s). The scam line plays only after the reveal ("here's what a scammer makes it say").
- "Kittu against his own voice: 62" confused everyone: the scores are now "real Kittu / the copy / a stranger", against
  another sentence Kittu said (on screen), with the drop before "the copy"; the 3.6 s bar moved to the caption;
  "a program's score, not your ears" on screen.
- Frame 1 says AI ("one is an AI copy of his voice · Kittu = a made-up computer voice"); the twist says why: "We didn't
  copy a real person, on purpose. Scammers do, from your reels."
- The advice is spoken in full, 1930 included, for calls and voice notes; the loop ends on Amma typing "What's our code
  word?" (the forward moment). "Made in 8 seconds" on the stamp (7.6 s; TE 9 s), not in the voice.
- McAfee's 47% moved to the caption (the reel is 60 s; a stat card after the answer was a swipe point).
- Telugu: "నిజంగా కిట్టుది"; "కిట్టు" for "అతని"; "కట్ చేసి"; "ఇంట్లో వాళ్ళకే తెలిసిన"; no "కాల్ చేసుకోండి".

## Script v2 (EN | TE)
| # | who | English | Telugu |
|---|---|---|---|
| 1 | storyteller | One of these voice notes is really Kittu. The other is an AI copy of his voice. Can you tell? | ఈ రెండు వాయిస్ నోట్స్ లో, ఒక్కటే నిజంగా కిట్టుది. ఇంకోటి, కంప్యూటర్ చేసిన అతని గొంతు కాపీ. మీరు చెప్పగలరా? |
| 2 | clip1 | Amma, did you take your tablets today? | అమ్మా, ఈరోజు టాబ్లెట్లు వేసుకున్నావా? |
| 3 | clip2 | Amma, did you take your tablets today? | అమ్మా, ఈరోజు టాబ్లెట్లు వేసుకున్నావా? |
| 4 | storyteller | Which one is Kittu? Three, two, one. | నిజమైన కిట్టు ఎవరు? మూడు, రెండు, ఒకటి. |
| 5 | storyteller | Two is the copy, made from thirteen seconds of his voice note. Here's what a scammer makes it say. | రెండోది కాపీ; కిట్టు వాయిస్ నోట్ లోని పదమూడు సెకన్లతో చేసింది. స్కామర్ దానితో ఇలా చెప్పిస్తాడు. |
| 6 | clip3 | I had a small accident. Please send fifty thousand rupees to this number. | చిన్న యాక్సిడెంట్ అయింది. ఈ నంబర్ కి యాభై వేలు పంపు, ఇప్పుడే. |
| 7 | storyteller | A voice-matching program scored them. Original Kittu: sixty-two. | The copy: sixty-two. A stranger: seven. | వాయిస్ మ్యాచ్ ప్రోగ్రామ్ స్కోర్ చేసింది. అసలు కిట్టు: యాభై నాలుగు. | కాపీ: యాభై ఎనిమిది. బయటి వ్యక్తి: పదహారు. |
| 8 | storyteller | And note one? A computer voice too. We didn't copy a real person, on purpose. Scammers do, from your reels. | మరి ఒకటో వాయిస్ నోట్? అదీ కంప్యూటర్ వాయిస్ నే. నిజమైన మనిషిని మేము కావాలనే కాపీ చేయలేదు; స్కామర్లు మీ రీల్స్ నుంచి చేస్తారు. |
| 10 | storyteller | So set a family code word, in person. A money call or voice note: cut it, call his saved number, ask the code word. | Report it on 1930. | అందుకే, ఇంట్లో వాళ్ళకే తెలిసిన ఒక కోడ్ వర్డ్ పెట్టుకోండి. డబ్బులు అడిగితే: కట్ చేసి, సేవ్ చేసిన నంబర్ కి ఫోన్ చేసి, కోడ్ వర్డ్ అడగండి. | ఒకటి, తొమ్మిది, మూడు, సున్నా కి చెప్పండి. |
| 11 | storyteller | A new voice note from Kittu. This time, Amma types back: what's our code word? | కిట్టు నుంచి కొత్త వాయిస్ నోట్. ఈసారి అమ్మ రిప్లై: మన కోడ్ వర్డ్ చెప్పు? |

## On screen (English in both versions)
1. Frame 1: Amma (glasses, a green saree) holding her phone; the chat "Kittu ❤" with voice notes 1 and 2 (waveforms, play
   icons); a payment card "₹50,000 · PAY" under her thumb; "WHICH ONE IS REALLY KITTU?".
2-3. Each voice note plays (its waveform fills); the line it says as a caption.
4. A 3-2-1 countdown ring over the two notes.
5. A stamp on note 2: "A COPY · from 13 s of his voice note · made in under 10 s".
6. Score bars: Kittu vs his own voice 62, the copy 62, a copy from 3.6 s 50, someone else 7 (TE: 54 / 58 / 16).
7. Note 1 flips: "ALSO A COMPUTER VOICE · Kittu isn't real · we made both".
8. A card: "47% of Indians faced an AI voice scam or know someone who did" · McAfee survey, India, May 2023.
9. A rule card: "a family code word" · "money call? hang up, call back on the saved number" · "report: 1930".
10. The phone buzzes: a new voice note from Kittu -> frame 1.

## Caption try-it (no comment ask, per Bujji's Nov 17 read)
"Today: agree a family code word with your parents, in person. Never post it."

## Render review (human-viewer, v1 render), what changed for v2
Both viewers flagged:
- 28-31 s: the score card was empty while the voice read "Original Kittu: sixty-two". Now all three labels and empty bars are up from the first word, and each bar fills as its number is spoken. The chip "it can't tell them apart" overclaimed; it now reads "couldn't tell? the program scored them the same", with "a program's score, not human ears" underneath.
- "Real Kittu" sat badly next to the twist (Kittu is a computer voice), so it is now "original Kittu" in voice, bars and caption. The frame-1 subtitle "Kittu = a made-up computer voice" spoiled the twist; it is gone. The subtitle now reads only "one of them is an AI copy of his voice".
- The two notes showed different lengths (0:04 / 0:03) and waveforms, a tell before the guess. Both now read 0:03 with the same waveform until the reveal.
- The ₹50,000 PAY card disappeared while the copy asked for money. It now stays up and pulsing through the scam line.
- The reveal and twist chips covered Amma's face. They moved to the phone column.
- Telugu: the title collided with the header badge on the zoom cut, so the title and phone moved down. The narration said 13 seconds while the test used 13.6 s; it now says పదమూడున్నర (13.5), and the screen shows 13.5 s.
- The rule card: text is bigger. "1930" now comes up 1/3 s before it is spoken and stays big for the rest of the line.
- Audio: there is a 0.7 s pause plus a music drop before the copy's score, the key number. The guess gap is now 0.7 s.
