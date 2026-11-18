# Creative 33 "Which One Is Really Kittu?" · Nov 18 creative slot · script v1

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

## Script v1 (EN | TE)
| # | who | English | Telugu |
|---|---|---|---|
| 1 | storyteller | One of these voice notes is really Kittu. The other wants fifty thousand rupees from his mother. | ఈ రెండు వాయిస్ నోట్స్ లో, ఒక్కటే నిజమైన కిట్టు. ఇంకోటి, వాళ్ళ అమ్మ దగ్గర యాభై వేలు అడుగుతోంది. |
| 2 | clip1 | Hi Amma, I reached the hostel. | అమ్మా, హాస్టల్ కి చేరుకున్నాను. |
| 3 | clip2 | Amma, it's me, Kittu. I had a small accident. | అమ్మా, నేను కిట్టుని. చిన్న యాక్సిడెంట్ అయింది. |
| 4 | storyteller | Which one is Kittu? Three, two, one. | నిజమైన కిట్టు ఎవరు? మూడు, రెండు, ఒకటి. |
| 5 | storyteller | Voice note two is a copy. A voice-cloning service made it from thirteen seconds of his voice note, in under ten seconds. | రెండో వాయిస్ నోట్, ఒక కాపీ. వాయిస్ క్లోనింగ్ సర్వీస్, అతని వాయిస్ నోట్ లోని పదమూడు సెకన్లతో, పది సెకన్ల లోపే దీన్ని తయారు చేసింది. |
| 6 | storyteller | A voice-matching program scored them. Kittu against his own voice: sixty-two. The copy: sixty-two. | Someone else: seven. | వాయిస్ మ్యాచ్ చేసే ప్రోగ్రామ్ తో స్కోర్ చేశాం. కిట్టు, తన గొంతుతో: యాభై నాలుగు. కాపీ: యాభై ఎనిమిది. | వేరే వ్యక్తి: పదహారు. |
| 7 | storyteller | And voice note one? Also a computer voice. Kittu isn't a real person: we made both, to show you how easy it is. | మరి ఒకటో వాయిస్ నోట్? అది కూడా కంప్యూటర్ వాయిస్. కిట్టు నిజమైన మనిషి కాదు; ఎంత సులువో చూపించడానికి, రెండూ మేమే చేశాం. |
| 8 | storyteller | In McAfee's survey, forty-seven percent of Indians had faced an AI voice scam, or knew someone who had. | మెకఫీ సర్వే లో, నలభై ఏడు శాతం భారతీయులు, వాయిస్ క్లోన్ స్కామ్ ని ఎదుర్కొన్నారు, లేదా ఎదుర్కొన్నవాళ్ళు తెలుసు. |
| 9 | storyteller | So set a family code word today. Any call asking for money: hang up, and call back on the number you saved. | అందుకే ఈరోజే, ఇంట్లో ఒక కోడ్ వర్డ్ పెట్టుకోండి. డబ్బులు అడిగే కాల్ వస్తే: పెట్టేసి, సేవ్ చేసిన నంబర్ కి మీరే తిరిగి కాల్ చేసుకోండి. |
| 10 | storyteller | Amma's phone buzzes again. A new voice note from Kittu... | అమ్మ ఫోన్ మళ్ళీ మోగింది. కిట్టు నుంచి, కొత్త వాయిస్ నోట్... |

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
