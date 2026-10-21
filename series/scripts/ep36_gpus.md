# EP36 "The Diwali rush" (GPUs and AI chips: why hardware decides AI), script v3

Season 4, queue 038 (replaces the old "Why AI Runs on GPUs" lesson in that slot). Ravi anna's shop again (EP33-EP35):
the shop's phone AI now answers the WhatsApp orders, with EP35's medium brain inside. Diwali evening: 23 orders unread
and the AI is still typing the first reply. The topic is the plot: AI is a mountain of simple multiplications; a few
fast workers (CPU cores) lose to thousands of small ones working at once (a graphics card, a GPU); and the model has to
fit in the card's memory, which sets up EP37 (quantization: squeezing a brain).

## Facts (checked Oct 21, 2026)
- A language model does about one multiply-add per parameter for every token it writes ("about 2N" operations per
  token, N = parameters: Kaplan et al., "Scaling Laws for Neural Language Models", OpenAI 2020). The medium brain from
  EP35 (Qwen2.5-1.5B-Instruct) has 1.54 billion parameters (its model card), so each word piece is over a billion
  multiplications.
- NVIDIA's own spec pages: GeForce RTX 5060 Laptop GPU, 3,328 CUDA cores, 8 GB GDDR7 (nvidia.com, RTX 50 series
  laptops); GeForce RTX 5090 (desktop), 21,760 CUDA cores, 32 GB GDDR7. A laptop or phone CPU has a handful of cores
  (this test machine: 4).
- The big brain from EP35 at full size: Qwen2.5-7B-Instruct has 7.61 billion parameters (model card); at 16 bits (2
  bytes) each that is about 15 GB. EP35 used Qwen's 4-bit file of it (4.68 GB): how a brain shrinks is EP37.
- A model that does not fit in the graphics card's memory runs the rest of its layers on the CPU from normal memory,
  which is much slower (llama.cpp's GPU offload: only the layers that fit go on the card).
- Google Colab (Google's own FAQ): "Colab is free of charge to use", but "access to expensive resources like GPUs is
  heavily restricted" in the free version and resources "are not guaranteed and not unlimited". (Caption only.)

## Our demo (pipeline/ep36/speed_demo.py, series/scripts/ep36_demo/results.json)
The same small AI (EP35's medium brain, Qwen2.5-1.5B-Instruct, Qwen's 4-bit GGUF, llama.cpp, greedy, 80-token cap)
writing the same WhatsApp reply to the same order on this machine's CPU (4 cores, no graphics card), with 1, 2 and 4
cores; median of 3 runs, the context reset each time:

| CPU cores | whole reply | reading the order | writing |
|---|---|---|---|
| 1 | 11.5 s | 3.2 s | 4.6 words/s |
| 2 | 6.3 s | 1.6 s | 8.1 words/s |
| 4 | 3.6 s | 0.9 s | 14.0 words/s |

Four cores: 3.15x faster on one reply, even though a reply is written word by word (each word's multiplications are
split between the cores). Not quite 4x: the cores also wait for the numbers to come from memory. The reply (all three
runs the same): "Sure, I'll confirm each item and deliver it within 30 minutes. Here's what you ordered: 2 kg rice, 1
litre sunflower oil, 6 eggs, 1 packet of tea powder. Thank you for your order!" (A first run that asked for a total had
the small model write 357 for 432: EP34's lesson, so the test reply has no prices.) We have no graphics card here, so
the reel claims no measured GPU speed.

## Script (English), v2 after the script review
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Twenty-three orders waiting, and you're still typing a single reply?! | frame 1: Diwali lights, customers, the phone on the counter with WhatsApp "23 unread · typing…"; sticker "23 ORDERS WAITING. / THE AI IS STILL TYPING." |
| 2 | AI | Every word I write [1] takes over a billion multiplications. | phone: the word "rice", a pile of × marks, a counter racing to "1,500,000,000 ×", "150 crore · for one word" |
| 3 | Ravi | Then hurry up! This phone has eight cores! | tag "OCTA-CORE · 2.4 GHz" |
| 4 | AI | Eight workers, a billion calculations. [1] I need thousands. | 8 workers at desks, a progress bar crawling; on [1] "8 workers: way too few" |
| 5 | Ravi | Like my Diwali stock count? Every kid counting one rack? | bubble "every kid, one rack?" |
| 6 | AI | Exactly. A GPU: the graphics card from games. [1] Thousands of small cores, all at once. | "CPU: a few big cores" (8 workers) vs "GPU: thousands of small cores" (a grid of dots turning green at once on [1]); "all at once" |
| 7 | Ravi | But ten helpers can't write one bill faster. [1] Can more cores speed up a single reply? | QUIZ card held ~3 s, 3-2-1: "YOUR CALL · More cores: is a single reply faster? A) no B) yes · comment A or B" |
| 8 | AI | On our laptop: one core, eleven and a half seconds. (beat) [1] Four cores: under four seconds. [2] Each word's work gets split. | bars 11.5 s / 6.3 s / 3.6 s, "3x faster"; on [2] "each word's work split 4 ways", then "23 orders × 3.6 s ≈ 83 s" |
| 9 | Ravi | Twenty-three orders? Still almost a minute and a half! [1] Do I buy a graphics card? | bubble "23 orders = 83 s?!" |
| 10 | AI | For ChatGPT, no. That runs on theirs. [1] For me, here: a gaming laptop's GPU, over three thousand cores. | a wall of graphics cards: "ChatGPT: runs on THEIR graphics cards · you don't need one to use it"; on [1] a gaming laptop GPU (RTX 5060): "3,328 cores", "8 GB memory", "phone CPU: 8 cores" (NVIDIA's spec page) |
| 11 | Ravi | Sunny! Bring your gaming laptop! (beat) [1] Done already?! | the gaming laptop on the counter; in the beat a big counter runs 23 to 0 with pops and a hit at zero, "Done?!"; "illustration · we didn't test a GPU" |
| 12 | AI | For AI, count the workers, not their speed. | rule chip "FOR AI, COUNT THE WORKERS · CPU: a few fast cores · GPU: thousands at once" |
| 13 | Ravi | Now the big brain! Not the squeezed copy, the full one! | bubble "FULL SIZE!" |
| 14 | AI | Full size, it's fifteen GB. [1] The card holds eight. | "big brain, full size: 15 GB" pours into a jar "card memory: 8 GB"; on [1] it overflows |
| 15 | Ravi | So? | |
| 16 | AI | It has to fit to be fast. [1] The rest goes back to the CPU's few workers. (beat) [2] Typing... | the 7 GB that doesn't fit slides into "CPU: a few workers"; a riser, then a boom on "Typing...", "typing…" and "23" again; cut to frame 1 (loops) |

About 68 s. Tag on screen: "EP36 · AI From Scratch". Caption: EP37 tease (how the same brain shrank to 4.7 GB),
"try a GPU free: Google Colab (limited)", phones' "AI chips" (NPUs) are small versions of the same idea, comment A or
B, sources and our test.

Script review (two viewers): both liked the shop, the octa-core box and the kids counting racks; both: "under four
seconds" killed the problem (now 23 orders still take about 83 s on 4 cores), the ending was vague, and nobody said
what to do or buy (now "For ChatGPT, no. That runs on theirs."). Fixed: "Twenty" vs 23; the test ran on our laptop, said
out loud, and Ravi's word-by-word doubt is answered ("Each word's sums get split"); the quiz is one line and A is
tempting ("ten helpers can't write one bill faster"); the gaming laptop clearing the queue is labelled an illustration
(we tested no graphics card); the phone label says "phone CPU"; "the full one" was unclear next to EP35's 4.7 GB (now
"Not the squeezed copy, the full one!", which sets up EP37); "the slow side" contradicted "a few fast cores" (now "the
few workers"); the rule chip lost its memory row so the overflow is the reveal; why a graphics card (it's what games
use). Telugu: "తలో ర్యాక్" ("తలో అర" read as "half each"), "అచ్చం అలాగే!" and "మా ల్యాప్‌టాప్ టెస్ట్ లో" (Parler drops bare
openers), "త్వరగా" instead of "ఫాస్ట్" (EP35's "forced"), "ఎంతమంది అన్నదే ముఖ్యం" (not the bookish "సంఖ్య"), no "చూడు" to
Ravi anna, "ఒక్క రిప్లై కూడా", "కంప్రెస్ చేసింది కాదు, ఫుల్ సైజ్ ది!" ("ఫుల్ ది" sounded like ordering a full bottle),
"మూడు వేలకు పైగా".

Render review (English, two viewers; both: "For ChatGPT, no" pays off; the minute and a half didn't hold up; the
ending needed a visible spill and a line to repeat). v3: Ravi says the sum ("Twenty-three orders? Still a minute and a
half!") and the card labels it "our 4-core laptop: 23 orders ≈ 83 s"; the 15 GB block is drawn to scale against the 8 GB
jar, the 7 GB that doesn't fit slides to "CPU: 8 workers" under "MUST FIT IN CARD MEMORY", and the AI says "It has to fit
in the card. The rest goes back to the eight workers." then "Typing..." as its own take; a 0.7 s beat with the music
out before "Four cores: under four"; louder quiz ticks and a riser; "quiz: B ✓"; bigger notes. Heard back while voicing
(misheard = mispronounced): "a billion sums" -> "sons" (now "calculations"), "the graphics card games use thousands"
ran together (now two sentences), "ONE reply" -> "Wondreply" (now "a single reply"), "stock-taking" -> "stock trading"
(now "stock count"), "more cores" -> "more chorus" (re-rolled until clean). English 75 s, Telugu 74 s.

Render review round 3 (English, two viewers) and the Telugu render (two viewers): all four liked the stock count, the
quiz and the 15 GB block not fitting; three of four read the ending as "the GPU failed" and still asked "so do I need a
GPU?", and both English viewers said the GPU's win at 0:55 was a tiny badge nobody mentions. v4: Ravi gasps "Done
already?!" after a beat in which a big counter runs the queue from 23 to 0 with a hit; "illustration · we didn't test a
GPU"; the ending card answers the question ("MUST FIT IN CARD MEMORY · medium brain, 1.1 GB: fits ✓ · big brain, 15 GB:
doesn't fit · squeezed, 4.7 GB: fits ✓ (EP37)", the last row after the final English review: without it the loop said an
8 GB card can't run the big brain at all); "under four seconds" (both languages: "under four what?"); notes for the squeezed copy (4.7 GB, EP35)
and card memory (not storage); Telugu says 150 crore like the screen and line 4 ("వంద కోట్లకు పైగా" was a second number);
"ఒక్కో పదం లెక్కల్ని కోర్లన్నీ పంచుకుంటాయి" (spoken, not written). Sound: the music measured 12.6-14.6 dB under Ravi
and 9.4-10.9 dB under the AI, so the bed went up about 1 dB and Ravi down 1 dB (now 8-12.6 dB); a crack on top of each
boom (phone speakers lose the low end); a harder hit on frame 1; the quiz countdown as a tick-tock with a riser; a hit
on the rule chip. A Telugu take had its second sentence 11 dB under the first (line 16; lines 2, 4 and 10 by 5-8 dB):
Parler voices each sentence on its own, so voice.py now levels every take per sentence. Final Telugu review (two viewers):
the Telugu reads conversational and the levels hold; fixed after it: the 0:11 card said "a billion+" after the voice said
150 crore (now "1.5 billion (150 crore) per word", and the Telugu counter uses crore digits, 1,50,00,00,000); the GPU card
showed only the 8-core phone against our 4-core test laptop (now both rows); the countdown faded (a stronger riser and a
hit on the cut to the answer); the end card stays up 0.5 s longer before "Typing..."; the Telugu screens say
"compressed" like the voice. English 79.5 s, Telugu 79.4 s.

## Script (Telugu; English on-screen text), v2
1. రవి: ఇరవై మూడు ఆర్డర్లు వెయిట్ చేస్తున్నాయి, నువ్వింకా ఒక్క రిప్లై టైప్ చేస్తున్నావా?!
2. ఏఐ: నేను రాసే ప్రతి పదానికి [1] నూట యాభై కోట్ల మల్టిప్లికేషన్లు.
3. రవి: అయితే త్వరగా చెయ్! ఈ ఫోన్ లో ఎనిమిది కోర్లు ఉన్నాయి!
4. ఏఐ: ఎనిమిది మంది పనివాళ్ళు, నూట యాభై కోట్ల లెక్కలు. [1] నాకు వేలమంది కావాలి.
5. రవి: దీపావళి స్టాక్ లెక్కలో పిల్లలందరూ తలో ర్యాక్ లెక్కపెట్టినట్టా?
6. ఏఐ: అచ్చం అలాగే! జీపీయూ, గేమ్స్ కి వాడే గ్రాఫిక్స్ కార్డ్: [1] వేల చిన్న కోర్లు, అన్నీ ఒకేసారి.
7. రవి: కానీ పది మంది కలిసినా ఒక్క బిల్లు త్వరగా అవ్వదు. (beat) [1] ఎక్కువ కోర్లతో ఒక్క రిప్లై కూడా త్వరగా వస్తుందా?
8. ఏఐ: మా ల్యాప్‌టాప్ టెస్ట్ లో: ఒక్క కోర్, పదకొండున్నర సెకన్లు. (beat) [1] నాలుగు కోర్లు: నాలుగు సెకన్ల లోపే. [2] ఒక్కో పదం లెక్కల్ని కోర్లన్నీ పంచుకుంటాయి.
9. రవి: ఇరవై మూడు ఆర్డర్లు? ఇంకా నిమిషమున్నర! [1] గ్రాఫిక్స్ కార్డ్ కొనాలా?
10. ఏఐ: చాట్ జీపీటీ కి అక్కర్లేదు, అది వాళ్ళ కార్డ్స్ మీద నడుస్తుంది. [1] నేను ఇక్కడ నడవాలంటే: గేమింగ్ ల్యాప్‌టాప్ జీపీయూ, మూడు వేలకు పైగా కోర్లు.
11. రవి: సన్నీ! నీ గేమింగ్ ల్యాప్‌టాప్ తీసుకురా! (beat) [1] అప్పుడే అయిపోయిందా?!
12. ఏఐ: ఏఐ కి పనివాళ్ళ స్పీడ్ కాదు, ఎంతమంది అన్నదే ముఖ్యం.
13. రవి: ఇప్పుడు పెద్ద బ్రేన్ పెట్టు! కంప్రెస్ చేసింది కాదు, ఫుల్ సైజ్ ది!
14. ఏఐ: ఫుల్ సైజ్ పదిహేను జీబీ. [1] కార్డ్ లో ఎనిమిదే పడతాయి.
15. రవి: అయితే?
16. ఏఐ: వేగంగా కావాలంటే కార్డ్ లో పట్టాలి. [1] మిగతాది మళ్ళీ సీపీయూ లో కొద్దిమంది పనివాళ్ళకే. (beat) [2] టైపింగ్...

## Sound
A hit and notification pings on frame 1; the bed builds under the problem; a lift into the workers insert; the quiz's
3-2-1 over the bed; the bed drops out right before "Four cores: under four" with a hit on it; a success sting on the
measured "3x faster" (the gaming laptop's scene is an illustration, so its sound stays small); a snap on the rule chip; a riser into the overflow and a dull hit on
"Typing...", into the loop.
