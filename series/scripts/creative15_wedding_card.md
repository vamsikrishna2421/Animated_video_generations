# Creative 15 "Ammamma's dream wedding" · script v2, Nov 2 (the Oct 31 creative slot)

**Format:** a live FM phone-in show: a radio host takes a panicked caller on air; split screen (the studio with the ON
AIR light | the caller's living room), the wedding card on her phone as inserts. New in the creative log (last 7 days:
take 1 / take 2, a PTM courtroom, a TV serial, a video call, cricket commentary, a nature documentary, a projector
classroom).
**Cast:** RJ Bunny (host, "Kaburlu FM 99.9", a made-up station), Sarojini aunty (the bride's mother, a caller from
Kukatpally), Swapna (the bride, 24, the last line). New cast. The AI is an unbranded "AI chat" on her phone.
**AI idea:** a translating AI translates names that are also words (స్వప్న = "dream") and turns titles and small words
into people and relations; telling it "keep the names exactly" doesn't fix it. Type the names, date, day and time in
English yourself, give the AI only the sentences, and read the card out loud before it goes to the family group.
**Bujji's notes applied:** frame 1 is the conflict with its proof on screen (the English card: "our mother's dream
wedding with Ch. Kalyan"); the comment prompt is an opinion ask on the conflict; one ask only.

## Facts and sources (checked Nov 2, 2026)
- Our test only (no outside numbers): the card and every reply are in `series/scripts/creative15_demo/7B.json`.
- 20-11-2026 is a Friday.

## Our demo (pipeline/creative15/invite_demo.py, series/scripts/creative15_demo/7B.json)
Committed before it ran. Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline (an empty network
namespace), temperature 0.7. The card (Telugu): "శ్రీ వేంకటేశ్వర స్వామి కృపతో, మా అమ్మాయి చి.ల.సౌ. స్వప్న వివాహం
చి. కళ్యాణ్ తో, 20-11-2026 శుక్రవారం ఉదయం 10:30 గంటలకు, శ్రీ లక్ష్మి కళ్యాణ మండపం, కూకట్ పల్లి, హైదరాబాద్ లో
జరుగును. ... - సరోజినీ, రమణ". Asked "Translate this wedding invitation into English:" 10 times, then 10 times with
"Keep every name, date, time and place exactly as written. Write the names in English letters; don't translate them."

| read by hand | plain (10) | "keep the names exactly" (10) | all (20) |
|---|---|---|---|
| the bride's name, Swapna, anywhere | 0 | 0 | **0** |
| reads as the senders' mother's wedding ("our mother's ... dream wedding with Ch. Kalyan") | 4 | 6 | **10** |
| "dream" in the card | 6 | 5 | 11 |
| Friday | 9 | 1 | 10 |
| 10:30 in the morning | 10 | 1 ("sunrise at 10:30" in 9) | 11 |
| the mother's own name, Sarojini | 3 | 4 | 7 |

- The bride's title చి.ల.సౌ. became a person ("Mrs. C.L. Sowmya") in most replies; "మా అమ్మాయి" (our girl) became "our
  mother" or "our sister".
- Translating the English back into Telugu gave garbled text (mixed scripts, invented words): no help to someone who
  reads only Telugu, so the reel doesn't recommend it.
- We didn't test the big apps (caption says so); the rule doesn't depend on which app.

## Hook options
1. **(kept)** Frame 1: her phone, the English card: "...on the occasion of our mother's dream wedding with Ch. Kalyan..."
   with red circles; Sarojini on the call: "RJ garu, the AI turned my daughter's wedding card into my mother's!"
2. The studio, the phone-in light blinks, RJ: "Caller one, why are you crying?" "My mother is getting married!"
3. The family WhatsApp group: "Congratulations Ammamma!!" x 40, Sarojini staring.
Kept 1: the mistake is on screen and said in the first line; the conflict is a real fear (the family group).

## Script review (human-viewer, v1) and what changed
Both stopped on frame 1 (hook 8 and 8) and liked "Swapna means dream" and "our girl became our mother". Both: the rule
was the weak spot (which lines are "the blessing lines"? what is left for the AI?) and the number chips were too much to
read; end on the family-group flood, the frame people will share. Sandeep: sound-off frame 1 needs a headline; "read it
out loud" doesn't help a mother who can't read English; Swapna saying Ammamma already gets calls clashed with the call.
Priya: the "keep the names exactly" result was buried (Friday right 9 of 10 without it, 1 of 10 with it) and "sunrise at 10:30" was
only on a chip; label it a small free AI and say we didn't test the big apps; "dream wedding: 11" counted "dream"
anywhere. Changed: frame 1 headline "AI MARRIED OFF AMMAMMA"; the test card shows one big number (Swapna 0 of 20) and
"Ammamma was the bride: 10 of 20", "dream: 11 of 20"; line 8 "We did. Worse! Friday went wrong nine times, and
ten-thirty became sunrise!"; the rule is a fill-in-the-blanks card (you type the names, date, day and time, the AI
translates the rest, someone who reads both checks it); Swapna checks it (not "read it out loud"); the last line is
"Amma... you already sent it!" and the family group floods (243 members), then frame 1; "a small free AI, offline, not the
big apps" on the test card and in the caption. RJ Pinky became RJ Bunny (a male voice, so three voices are distinct in
Telugu, where Parler has one female speaker). Telugu: "చాట్ బాట్ మా అమ్మకి పెళ్ళి చేసేసింది" (not "...పెళ్ళి
అయిపోయింది", heard "is over"); "స్వప్న అంటే డ్రీమ్ కదా", "ట్రాన్స్ లేట్ చేసేసింది" (not "అనువాదం"); "స్వప్న పేరు
రాలేదు" (not "స్వప్న రాలేదు", "Swapna didn't come"); "శుక్రవారం కాస్తా గురువారం, శనివారం అయిపోయింది"; "పేర్లు, తేదీ,
రోజు దగ్గర ఖాళీ వదలండి" (not "దీవెనల లైన్లు", heard as the shlokam).

## Script (English) · ~45 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Sarojini | RJ garu, the AI turned my daughter's wedding card [1] into my mother's! | frame 1: her phone, the AI's English card (plain try 4, word for word): "...on the occasion of our mother Ch.L.Sau's dream wedding with Ch.Kalyan...", red circles; "Swapna? not on the card"; headline AI MARRIED OFF AMMAMMA |
| 2 | Bunny | Your mother's?! [1] What does it say? | the studio (ON AIR) over her living room |
| 3 | Sarojini | "Our mother's dream wedding with Kalyan." [1] Where is Swapna? | the card, "dream wedding" grows |
| 4 | Bunny | Swapna means dream! [1] It translated her name. | "స్వప్న (Swapna) = dream" · "it translated her name" |
| 5 | Sarojini | And "our girl" [1] became "our mother"! | "మా అమ్మాయి = our girl" → "our mother" |
| 6 | Bunny | We tried your card on a small free AI, twenty times. / [1] Swapna: zero. Half the time, Ammamma was the bride! | OUR TEST: a small free AI, offline · not the big apps · the same card 20 times; big: Swapna's name 0 of 20; Ammamma was the bride 10 of 20; "dream" 11 of 20 |
| 7 | Sarojini | I'll tell it: keep the names exactly! | the split, "Keep the names exactly!" |
| 8 | Bunny | We did. Worse! / [1] Friday went wrong nine times, and ten-thirty became sunrise! | + "keep every name exactly" · 10 tries: Swapna still 0 of 10 · Friday wrong 9 of 10 · "sunrise at 10:30" 9 of 10; WORSE |
| 9 | Bunny | Leave blanks for the names, date and day. / [1] Let the AI do the rest, then fill them in yourself. | the card with blanks, filled in green (Swapna, Kalyan, Friday 20 Nov 2026, 10:30 AM, Sri Lakshmi Kalyana Mandapam); 1 YOU type the names, date, day and time 2 the AI translates only the rest 3 someone who reads both checks it |
| 10 | Sarojini | And Swapna checks it [1] before the family group sees it! | the split, "Swapna checks it first" |
| 11 | Swapna | Amma... [1] you already sent it! | Swapna in the doorway; the family group (243) floods: "Congratulations Ammamma!! 🎉", "Ammamma is marrying Kalyan??", ...; frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Sarojini | ఆర్జే గారూ, మా అమ్మాయి పెళ్ళి కార్డు ని ఇంగ్లీష్ లో రాయమంటే, / [1] చాట్ బాట్ మా అమ్మకి పెళ్ళి చేసేసింది! |
| 2 | Bunny | మీ అమ్మకా?! [1] ఏం రాసింది? |
| 3 | Sarojini | "అవర్ మదర్స్ డ్రీమ్ వెడ్డింగ్ విత్ కళ్యాణ్". / [1] మా స్వప్న ఎక్కడ? |
| 4 | Bunny | స్వప్న అంటే డ్రీమ్ కదా! [1] పేరుని కూడా ట్రాన్స్ లేట్ చేసేసింది. |
| 5 | Sarojini | "మా అమ్మాయి" ని [1] "మా అమ్మ" చేసేసింది! |
| 6 | Bunny | మీ కార్డు ని ఒక చిన్న ఫ్రీ చాట్ బాట్ తో ఇరవై సార్లు ట్రై చేశాం. / [1] స్వప్న పేరు ఒక్కసారి కూడా రాలేదు! సగం సార్లు అమ్మమ్మే పెళ్ళికూతురు! |
| 7 | Sarojini | పేర్లు మార్చొద్దు అని చెప్తా! |
| 8 | Bunny | అదీ చేశాం. ఇంకా దారుణం! / [1] శుక్రవారం కాస్తా గురువారం, శనివారం అయిపోయింది. పదిన్నర కాస్తా సన్ రైజ్ అయింది! |
| 9 | Bunny | పేర్లు, తేదీ, రోజు దగ్గర ఖాళీ వదలండి. / [1] మిగతాది చాట్ బాట్ కి ఇచ్చి, ఖాళీలు మీరే నింపండి. |
| 10 | Sarojini | ఫ్యామిలీ గ్రూప్ లో పెట్టే ముందు, [1] స్వప్న ఒకసారి చెక్ చేస్తుంది! |
| 11 | Swapna | అమ్మా... [1] నువ్వు ఆల్రెడీ పంపేశావ్! |

Telugu notes: no "ఏఐ" in voiced text ("చాట్ బాట్"); no word one slipped letter from a swear word (to check again on the
transcripts).

## Comment prompt (an opinion on the conflict)
Would you send a wedding card an AI translated, without a check? Yes or no, and why?
