# NEW IN AI 01: SKY-001, "the first engineering world model" (Skyfall AI, Oct 19, 2026), script v2

Track 3 (New in AI) in the skit format the user asked for ("a real-world scene explaining the concept"). The user sent
the launch post on X (Oct 20) and asked for content on it. The reel explains what launched, what is actually new, what
the numbers say once you read them, and how to check any AI launch. Every number is Skyfall's own: we can't run SKY-001
(waitlist only), so the reel says "their own test" each time.

Setting: an engineering college CAD lab at 11:40 pm, the night before a CAD submission. Meghana (mechanical engineering
student) has spent three hours modelling one wheel hub. Kiran (her classmate, believes every viral post) bursts in with
his phone.

## Facts (checked Oct 20, 2026)
- Launch: Skyfall AI announced SKY-001 on Oct 19, 2026 ("Skyfall AI announces SKY-001, a Latent World Model", company
  site skyfall.ai; blog "Introducing SKY-001: The First World Model for Engineering", published 2026-10-19; CEO Sam
  Pasupalak's thread on X). Access: "Join the waitlist now for early access." No public price, no public model.
- Who: Skyfall AI was founded by Maluuba co-founders Sam Pasupalak and Kaheer Suleman, with Sumit Pasupalak (company
  site). Microsoft acquired Maluuba on Jan 13, 2017 (Microsoft's own blog: Pasupalak and Suleman joined Microsoft's AI
  and Research group; Yoshua Bengio advised).
- How it works, in the company's words (skyfall.ai): Stage 1 "converts a 2D image or text prompt into several rough 3D
  assets at once"; Stage 2 "breaks down the high-level designs into smaller, individual parts, from large structural
  pieces all the way down to tiny screws and fasteners"; Stage 3 "starts by drawing precise 2D sketches
  stroke-by-stroke, then stretches, cuts, or shapes those sketches" (the way a designer works in CAD). "World model"
  here: a model that imagines how a thing looks and fits together before it exists ("can 'dream' anything in the
  physical world").
- The company's own tests (skyfall.ai, Oct 19), against GPT-6 Astra (OpenAI's model) and five other frontier models:

  | Test | SKY-001 | GPT-6 Astra | Next best in their table |
  |---|---|---|---|
  | 3D CAD parts: time per design | 3.9 s | 199 s (51x slower) | |
  | 3D CAD parts: cost per design | $0.005 | $0.75 (150x more) | |
  | 3D CAD parts: shape match (IoU, overlap with the reference shape) | 79.7% | 79.1% | 69.4% |
  | Floor plans (BIM): time per plan | 1.22 s | 144.4 s (118x) | |
  | Floor plans (BIM): cost per plan | $0.00237 | $0.4465 (188x) | |
  | Floor plans (BIM): shape match (IoU) | 43.6% | 40.6% | 42.3% |

  The site's own summary boxes round the floor-plan figures two ways (118x / 188x, and 119x / 186x from $0.0024 vs
  $0.446). The X post says "51-125x faster, 150-210x cheaper, higher IoU than all frontier models"; the 125x and 210x
  are not in the two tables on the site. The shape-match lead is 0.6 points on CAD and 1.3 points on floor plans (where
  GPT-6 Astra is not even the runner-up); the speed and cost gaps are the real claim. No outside group has tested it
  yet; the benchmarks, prompts and comparisons are Skyfall's. Who it is for: teams making thousands of CAD parts or
  plans; for one part, 3 minutes and 75 cents is fine.
- IoU (intersection over union), said "shape match" on screen: the overlap between the drawn shape and the right shape,
  divided by both together. For two plans of the same size, 43.6% means about 61% of each overlaps the other; no model
  in their test reached 50%. (v2 said "less than half of the plan lines up": wrong, fixed after the render review.)

## Script (English), v3 after the script-stage and render-stage reviews (lines 8-9 folded into 7)
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Kiran | Meghana, stop! [1] A new AI designs a part in four seconds! | frame 1: headline "AI: 4 SECONDS / HER: 3 HOURS"; CAD lab at night, clock 11:40; Meghana at her monitor; Kiran bursts in, phone up; on [1] his phone (inset) draws a hub: sketch, stretch, holes |
| 2 | Meghana | Four seconds? This one hub took me three hours! | big tags: "hub_v7_FINAL_final.cad", "3 h 02 min" |
| 3 | Kiran | It's SKY-001. [1] It says fifty-one times faster than GPT-6 Astra, and a hundred and fifty times cheaper! | launch card: "Skyfall AI · SKY-001 · 'the first engineering world model'"; on [1] "51x faster · 150x cheaper · than GPT-6 Astra, on design tasks" |
| 4 | Meghana | Says who? | bubble |
| 5 | Kiran | (music out) Um... the company. [1] Their own test. | a neutral stamp on the card: "THEIR OWN TEST" |
| 6 | Meghana | Okay. How does it work? | |
| 7 | Kiran | It says it imagines the shape first: that's the world model. [1] Then it splits it into parts and draws each one like you do: [2] sketch, stretch, cut. [3] And it's more accurate than all of them! | "1 picture or text → rough 3D shapes" (three rough wheels) and the tag "world model = imagines the shape first"; on [1] "2 split into parts": tyre, rim, hub, bolts fly apart; on [2] "3 each part drawn like a designer": a circle sketched → stretched into a disc → holes cut; on [3] "the post also says: 'more accurate than all of them!'" |
| (card) | | | QUIZ, held about 4 s with a ticking 3-2-1: "YOUR CALL · Shape match, their test: (how close its 3D part is to the right one) SKY-001 79.7% · GPT-6 Astra 79.1% · A) more accurate B) a tie · comment A or B" |
| 10 | Meghana | Point six apart? [1] Basically a tie. [2] The real claim: four seconds instead of three minutes. [3] For one hub? Either's fine. | bars: shape match 79.7 vs 79.1 → "basically a tie"; on [2] 3.9 s vs 199 s → "51x faster", $0.005 vs $0.75 → "150x cheaper"; on [3] "matters at thousands of designs" |
| 11 | Kiran | On floor plans, it matched forty-four percent. [1] GPT-6 Astra got even less. | two plans of the same size, offset so the overlap really is a 44% shape match; "SKY-001: 44% match"; on [1] "GPT-6 Astra: 41%"; small "shape match = overlap ÷ both plans together · their test: 43.6% vs 40.6% · no model reached 50%" |
| 12 | Meghana | Less than half? [1] I'm not living in any of those houses! | bubble "Less than half?!" |
| 13 | Kiran | Can we try it tonight? | bubble "Tonight?" |
| 14 | Meghana | Waitlist only, no public price. [1] Before you trust any launch, ask: [2] one, who tested it? [3] Two, against what? [4] Three, can I use it today? | tags "waitlist only · no price yet", "no outside test yet"; on [1] the rule card "NEW AI LAUNCH? ASK:", each question as it is said, and SKY-001's answer after it: "they did", "their own tasks", "not yet" |
| 15 | Kiran | Wait! [1] Another AI, a thousand times faster! | his phone pings "NEW AI: 1000x FASTER!!!" (no name: a joke on the hype cycle) |
| 16 | Meghana | Says who? | bubble; cut to frame 1 ("Meghana, stop!"), so it loops |

About 70 s (Fish takes run long; English at tempo 1.2 for Kiran, 1.18 for Meghana). Tag on screen: "NEW IN AI". Caption: the facts with sources, both tables, who it is for, "comment A or B".

Review notes (script stage, two viewers): "Says who? Um... the company" was the best moment for both; the first 3 s
didn't earn it with the sound off (now a headline on frame 1); the quiz came out of nowhere (Kiran now reads the
post's own accuracy claim first) and mixed "accuracy" with "IoU" (now "shape match" everywhere); "the win is cost" had
no price behind it (now "their real claim", and "no price yet"); the house joke mocked the best of a bad lot (now
"GPT-6 Astra got even less" / "any of those houses"); the chatbot comparison wasn't Skyfall's (dropped); "extrude" →
their own verb "stretch"; the loop said "Meghana, stop!" twice (now it ends on "Says who?"); Telugu: "చీప్" sounded
like cheap quality (now "తక్కువ ఖర్చు"), "గెలుపు" was newspaper Telugu, "ప్రతి లాంచ్ ని అడుగు" read as asking the
launch itself.

Render review (v2 render, 68 s): both viewers: "Says who? ...the company" and the loop make the reel; 0:19-0:34 dragged
(now one Kiran line, "How does it work?" instead of "How is it so fast?", which implied a cause nobody showed); the
speed/cost bars flashed by (now held under "four seconds instead of three minutes. For one hub? Either's fine.", which
also says who it is for); the floor-plan drawing showed about 8% overlap for a 44% score (redrawn); the stamp blurred
into the wheel; the quiz bed went near-silent between beats (the bed's pad is on); "Um" was rushed (a 0.8 s silent beat
before it, its own pause kept); "Ask any launch" was heard as "launched" (now "Before you trust any launch, ask:"), and
the rule card answers its questions for SKY-001.

## Script (Telugu; English on-screen text), v3
1. కిరణ్: మేఘనా! ఆపు ఆపు! [1] కొత్త ఏఐ నాలుగు సెకన్లలో ఒక పార్ట్ డిజైన్ చేసేస్తుంది!
2. మేఘన: నాలుగు సెకన్లా? ఈ ఒక్క హబ్ కి నాకు మూడు గంటలు పట్టింది!
3. కిరణ్: దాని పేరు స్కై జీరో జీరో వన్. [1] జీపీటీ సిక్స్ ఆస్ట్రా కంటే యాభై ఒక్క రెట్లు ఫాస్ట్, నూట యాభై రెట్లు తక్కువ ఖర్చు అంట!
4. మేఘన: ఎవరు చెప్పారు?
5. కిరణ్: అదీ, ఆ కంపెనీనే. [1] వాళ్ళ సొంత టెస్ట్.
6. మేఘన: సరే. అది ఎలా పని చేస్తుంది?
7. కిరణ్: ముందు షేప్ మొత్తం ఊహిస్తుందంట, అదే వరల్డ్ మోడల్. [1] తర్వాత పార్టులుగా విడదీసి, ఒక్కోటి నువ్వు గీసినట్టే గీస్తుంది. [2] స్కెచ్ వేసి, పైకి లాగి, కట్. [3] పైగా అన్నిటికంటే కరెక్ట్ అంట!
10. మేఘన: పాయింట్ సిక్స్ తేడానా? [1] దాదాపు సేమ్. [2] అసలు క్లెయిమ్ ఏంటంటే, మూడు నిమిషాల బదులు నాలుగు సెకన్లు. [3] ఒక్క హబ్ కి? ఏ ఏఐ అయినా పర్లేదు.
11. కిరణ్: ఫ్లోర్ ప్లాన్స్ లో నలభై నాలుగు పర్సెంటే మ్యాచ్ అయింది. [1] జీపీటీ సిక్స్ ఆస్ట్రా కి ఇంకా తక్కువ.
12. మేఘన: సగం కూడా లేదా? [1] ఆ ఇళ్ళలో దేంట్లోనూ నేను ఉండను!
13. కిరణ్: ఈ రాత్రే ట్రై చేద్దామా?
14. మేఘన: ఇంకా వెయిట్‌లిస్టే. ధర కూడా చెప్పలేదు. [1] ఏ కొత్త ఏఐ వచ్చినా, నమ్మే ముందు అడుగు: [2] ఒకటి, ఎవరు టెస్ట్ చేశారు? [3] రెండు, దేనితో పోల్చారు? [4] మూడు, ఇప్పుడు వాడగలనా?
15. కిరణ్: ఆగు! [1] ఇంకో ఏఐ వచ్చింది, వెయ్యి రెట్లు ఫాస్ట్ అంట!
16. మేఘన: ఎవరు చెప్పారు?

Telugu render review: "ఎవరు చెప్పారు? … అదీ, ఆ కంపెనీనే" and the loop land in Telugu too. Fixed: "ఇంకో ఏఐ, వెయ్యి"
ran together ("ఇంకో యే, యే రెట్లు"), now "ఇంకో ఏఐ వచ్చింది, వెయ్యి రెట్లు"; the opening was caught as one word, now
"మేఘనా! ఆపు ఆపు!"; news-reader words made spoken ("శాతమే" → "పర్సెంటే", "వెయిట్‌లిస్ట్ మాత్రమే" → "ఇంకా
వెయిట్‌లిస్టే", "ఏ లాంచ్ నైనా" → "ఏ కొత్త ఏఐ వచ్చినా", "అసలు క్లెయిమ్:" → "అసలు క్లెయిమ్ ఏంటంటే,"); the Telugu
caption now says the $0.005 is their test cost, not a price; a riser under the quiz countdown (both languages).

## Sound
A hit on frame 1 (Kiran bursting in) with a pop; the bed (with a soft pad, so no stretch goes dead) builds under the
claims and drops out for a 0.8 s silent beat before "Um... the company"; a bonk on "own"; a lift into how it works; the quiz's ticking 3-2-1 over the bed; a hit on the cut
to the numbers (the line starts 0.35 s later, so the hit doesn't hide "Point"), the bed out under "Point six apart?"
and back on "Basically a tie"; a swell under the house joke; the rule
card on a snap; pops speeding up into the loop and the bed rising to the end.
