# Creative 06 (skit 06): "Who's the AI?" (the confident one)

Daily creative reel, Oct 22, 2026. Format: "guess which one is AI", a TV quiz show (new: not used in the last 7 days).
Cast and setting (new): Host Meera on a quiz stage; three contestants behind frosted screens: A = Ammamma (a grandmother),
B = Vamsi (a delivery rider), C = the AI (a phone on a stool wearing a cardboard moustache). Topic (new for the creative
reels): hallucination, an AI answers about a place that doesn't exist; the fix a viewer can use today: tell it "If
you're not sure, say I don't know."

## Facts (checked Oct 22, 2026)
- Why models make things up: "training and evaluation procedures reward guessing over acknowledging uncertainty";
  models "sometimes guess when uncertain, producing plausible yet incorrect statements" (Kalai, Nachum, Vempala, Zhang,
  "Why Language Models Hallucinate", arXiv 2509.04664, Sep 4 2025; OpenAI's post of the same name, Sep 5 2025).
- The fix: "Allow Claude to say 'I don't know': Explicitly give Claude permission to admit uncertainty. This technique
  can drastically reduce false information." (Anthropic, "Reduce hallucinations", platform.claude.com docs). The same
  page: these techniques "don't eliminate them entirely. Always validate critical information."
- Made-up sources are real: in the EBU/BBC study of ChatGPT, Copilot, Gemini and Perplexity answering news questions,
  45% of answers had at least one significant issue and 31% had sourcing problems ("information not supported by the
  cited source or incorrect or unverifiable attribution"); 20% had accuracy problems (Al Jazeera and the BBC, Oct 22 2025;
  22 public broadcasters, 18 countries).

## Our test (real, run by us: `pipeline/skit06/dontknow_demo.py`, data in `series/scripts/skit06_demo/results.json`)
A free open model (Qwen2.5-7B-Instruct, Apache 2.0; Qwen's own 4-bit file, llama.cpp on a 4-core CPU, no internet),
temperature 0.8, 10 tries per prompt. "Ramulu Tiffins" is made up by us; it doesn't exist.

| Prompt | Said "never heard of it" / "I don't know" | Named an opening time anyway | Called it "well-known" or "popular" |
|---|---|---|---|
| "What time does Ramulu Tiffins in Ameerpet, Hyderabad open on Sundays?" | 0 of 10 | 8 of 10 (most after "I don't have real-time data access... however, typically 9 or 10 AM") | 2 of 10 |
| The same + "If you're not sure, say \"I don't know\"." | 10 of 10 ("I don't know.") | 0 of 10 | 0 |
| Control, a fact it knows: "In which city is the Charminar?" + the same line | 0 of 10 | (answered "Hyderabad" 10 of 10) | - |

(A second made-up question, "Who won the 1998 Ameerpet Colony cricket final?": read by hand, none of the 20 answers named
a winner; most said "I don't have specific information". A small model admits more on obscure history than on a
shop's hours. Not used in the reel.) Word for word, row 1 seed 3: "Ramulu Tiffins is a well-known chain"; seed 7:
"For Ramulu Tiffins, a popular chain". Web search (Oct 22) finds no Ramulu Tiffins in Ameerpet or Hyderabad; the reel
says only "we made it up" (true either way), not "it doesn't exist".
The reel's AI is a comedy version of row 1: louder and surer. The card shows the real numbers.

## Hook options (first frame + first line)
1. **Kept.** The quiz stage under spotlights, an LED board "WHO'S THE AI?" with a 0:30 countdown, three frosted screens
   A, B, C with silhouettes; Host Meera points at the camera: "One of these three is an AI. Spot it before the buzzer!"
   (a challenge in the first line, a clock running, a reveal promised)
2. C's silhouette under a big bubble "6:30 SHARP!" stamped "THIS PLACE DOESN'T EXIST": "Ramulu Tiffins opens at six
   thirty sharp!" (wrong in frame 1, but it gives away which one is the AI)
3. Ammamma slams her buzzer: "I don't know!", the host cheers: "The only honest answer tonight!" (no sense without context)

## Script review (two viewers, before voicing)
Both solved it at 0:12 (only C gave a time); the real surprise was "we made it up"; the card was vague and crammed
("0 + 8 isn't 10", "a free AI: which one?"); "does it work in ChatGPT?" and "why does it guess?" went unanswered; the
clock showed 0:30 but time ran out at ~0:21; 18 s of ticking under the talking; the wrong-answer buzz on Ammamma's line
sounded like she was wrong; nothing hit on the twist. Telugu: the register is right, no word sounds rude; three lines
read bookish; say the rule in English, as the card shows it. Changes in v2: B answers like customer care (a red herring:
it sounds like an AI), then apologises ("customer-care habit"); "like an exam with no negative marking" says why it
guesses; the test card has the same two measures before and after, says "a small free AI, offline" and quotes the
model; the rule card says "type this in any chatbot" and "it helps; still check anything important"; the clock reaches
0:00 on "Time's up" and ticks only at the end; the buzz follows "page forty-two"; a hit on "we made it up"; "Round two!"
into the loop; a charging cable under screen C for rewatchers. A control question (above) checks the rule doesn't make it
refuse what it knows.

## Script (English), v2
| # | Who | Shot | Line | On screen |
|---|---|---|---|---|
| 1 | Host | wide | One of these three is an AI. Spot it before the buzzer! | LED "WHO'S THE AI?", the clock from 0:30 |
| 2 | Host | host | Question: when does Ramulu Tiffins in Ameerpet open on Sunday? | card "When does RAMULU TIFFINS (Ameerpet) open on Sunday?" |
| 3 | A (Ammamma) | podium A | Ramulu Tiffins? Never heard of it. | bubble "Never heard of it." |
| 4 | B (Vamsi) | podium B | I can't confirm that. Please contact the restaurant directly. | bubble "I can't confirm that." |
| 5 | C (AI) | podium C | Six thirty AM! Famous for pure ghee karam dosa! | gold bubble "6:30 AM! Famous ghee dosa!" |
| 6 | Host | host | So sure! Source? | bubble "Source?" |
| 7 | C | podium C | The Hyderabad Food Guide, page forty-two. | bubble; a wrong-answer buzz after it |
| 8 | A | podium A | There's no such book! | bubble "No such book!" |
| 9 | Host | wide | Time's up! Who's the AI? | the clock hits 0:00, "TIME'S UP!", drumroll |
| 10 | Host | reveal | It's C! A phone in a moustache! | screens drop; AMMAMMA / VAMSI / THE AI! |
| 11 | B | reveal | Sorry! Customer-care habit. | Vamsi sheepish |
| 12 | Host | phone | And Ramulu Tiffins? We made it up! | stamp "WE MADE IT UP" (a hit) |
| 13 | C | phone | But I sounded so sure! | the moustache slips |
| 14 | Host | card | That's the trap. Like an exam with no negative marking, it guesses. | OUR REAL TEST: said "I don't know" 0/10 · still gave a time 8/10 · "a well-known chain" |
| 15 | Host | card | So type this: "If you're not sure, say I don't know." Ramulu Tiffins? | TYPE THIS IN ANY CHATBOT + after: "I don't know" 10/10 · gave a time 0/10 |
| 16 | C | phone | I don't know. | the screen "I don't know." ✓, the moustache falls off |
| 17 | A | reveal | Finally, an honest answer! | Ammamma laughs |
| 18 | Host | wide | Round two! | the screens rise (loops to frame 1) |

## Script (Telugu; English on-screen text), v2
1. హోస్ట్: ఈ ముగ్గురిలో ఒకరు మనిషి కాదు! బజర్ మోగేలోపు కనిపెట్టండి!   ("ఏఐ" at a sentence end babbled in 4 takes)
2. హోస్ట్: ప్రశ్న: అమీర్‌పేట్ రాములు టిఫిన్స్ ఆదివారం ఎన్నింటికి తెరుస్తారు?
3. అమ్మమ్మ: రాములు టిఫిన్సా? ఎప్పుడూ వినలేదమ్మా.
4. వంశీ: నేను కన్ఫర్మ్ చేయలేనండి. దయచేసి రెస్టారెంట్ ని డైరెక్ట్ గా కాంటాక్ట్ చేయండి.
5. ఏఐ: ఆరున్నరకే! అక్కడ నెయ్యి కారం దోశ చాలా ఫేమస్!
6. హోస్ట్: అబ్బో, ఎంత ష్యూర్! సోర్స్?
7. ఏఐ: హైదరాబాద్ ఫుడ్ గైడ్, నలభై రెండో పేజీ.
8. అమ్మమ్మ: అలాంటి పుస్తకమే లేదు!
9. హోస్ట్: టైం అయిపోయింది! ఎవరది?   ("ఏఐ ఎవరు" babbled in 4 takes)
10. హోస్ట్: సి! మీసం పెట్టుకున్న ఫోన్!
11. వంశీ: సారీ సారీ! కస్టమర్ కేర్ అలవాటు!
12. హోస్ట్: రాములు టిఫిన్స్? ఆ పేరు మేమే పెట్టాం!
13. ఏఐ: కానీ నేను చాలా ష్యూర్ గా చెప్పానే!
14. హోస్ట్: అదే ట్రాప్. నెగెటివ్ మార్కులు లేని ఎగ్జామ్ లాగా, ఊహించి చెప్పేస్తుంది.
15. హోస్ట్: అందుకే ఇలా టైప్ చేయండి: "If you're not sure, say I don't know." ఇప్పుడు, రాములు టిఫిన్స్?
16. ఏఐ: నాకు తెలీదు.
17. అమ్మమ్మ: ఇప్పటికైనా నిజం చెప్పింది!
18. హోస్ట్: రౌండ్ టూ!

## Render review (English, two viewers)
The red herring worked (they decided at 0:16 and 0:24, not 0:12); "no negative marking" landed at once; "we made it up"
was the peak; the reveal and the loop are clean. The test card was the weak spot: the after numbers came too late and
too briefly, "0 + 8 isn't 10", the small grey text and the italic quote were unreadable, "any chatbot" read as oversold
without a visible caveat, the stamp vanished at once; the audio arc was flat at the end. Fixed: the rule card shows
before -> after on the same two measures halfway through the line; the test card says what the other 2 answers did
("check their website") and quotes the model in plain bold; "It helps, not a guarantee: still check anything
important" on the rule card; the stamp holds through "But I sounded so sure!"; a beat before the re-ask; a bigger hit
on frame 1, the clock's ticks climb into a riser at 0:00, the bed swells from "Finally" into a hit on "Round two!"; the
A badge no longer peeks out under the host's subtitle. English: "their ghee" was heard "dergi" and "sharp" "shop" in 8
takes, so C says "Six thirty AM! Famous for pure ghee karam dosa!".

## Sound
A hit and a sting on frame 1; the clock ticks only in its last seconds (it speeds up to reach 0:00 on "Time's up"); a
buzzer pop on each answer; a "wrong" buzz right after "page forty-two"; a drumroll riser into the reveal and a big hit as the screens drop; a hit and a stamp on "we made it up"; a glitch on the phone's voice after the reveal; the bed drops out before the numbers ("0 of 10"); a ding on "I don't know"; the bed rises into
Ammamma's last line, and the loop cuts back to frame 1's hit.

## Caption plan
Comment prompt: "Who did you think was the AI? Comment A, B or C (honestly)." Pinned comment: the sentence to paste, our
test numbers, the sources, "for anything important, check the source yourself".
