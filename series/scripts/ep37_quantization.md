# EP37 "The squeezed brain" (Quantization: big models on small devices), script v3

Season 4, queue 039 (replaces the old "Quantization: Shrinking AI Models" lesson in that slot). Ravi anna's shop
(EP33-EP36): the shop's phone AI sorts the WhatsApp messages with EP35's medium brain inside Ravi's phone. His phone
filled up again (EP35's good-morning photos), so the AI squeezed its own brain to make room, and now it files nearly
every message as an ORDER, his wife's "lunch is ready" included. The topic is the plot: a brain is billions of numbers;
quantization stores each one with fewer bits (16 bits: 65,536 possible values; 4 bits: 16; 2 bits: 4), like rounding the
shop's prices; 4 bits keeps the answers at a third of the size, 2 bits breaks it. Rule: download the Q4 file, never Q2.

## Facts (checked Oct 23, 2026)
- The file sizes are Qwen's own GGUF files on Hugging Face (Qwen/Qwen2.5-1.5B-Instruct-GGUF and
  Qwen/Qwen2.5-7B-Instruct-GGUF, read through the Hub API on Oct 23):
  medium brain (Qwen2.5-1.5B-Instruct): 16-bit (fp16) 3.56 GB, 8-bit (q8_0) 1.89 GB, 4-bit (q4_k_m) 1.12 GB, 3-bit
  (q3_k_m) 0.92 GB, 2-bit (q2_k) 0.75 GB.
  big brain (Qwen2.5-7B-Instruct, 7.61 billion parameters on its model card): 16-bit 15.23 GB (four files), 8-bit 8.10 GB,
  4-bit 4.68 GB, 3-bit 3.81 GB, 2-bit 3.02 GB. (EP36's "15 GB, the card holds 8": even the 8-bit file, 8.1 GB, misses.)
  The "k" files keep a few parts at more bits, so a "2-bit" file averages a little more than 2 bits per number.
- n bits give 2^n possible values: 16 bits 65,536; 8 bits 256; 4 bits 16; 2 bits 4 (in the k-quant files each small
  block of numbers gets its own scale, so the 4 values are per block).
- Ollama's qwen2.5:7b download (the default tag) is the 4-bit file: "quantization Q4_K_M", 7.62B parameters, 4.7 GB
  (ollama.com/library/qwen2.5:7b, Oct 23).
- 8 bits lose nothing measurable: "it is possible to perform inference in LLMs with up to 175B parameters without any
  performance degradation" (Dettmers, Lewis, Belkada, Zettlemoyer, "LLM.int8()", arXiv 2208.07339, 2022).
- 4 bits is the sweet spot: "4-bit precision is almost universally optimal for total model bits and zero-shot accuracy"
  (Dettmers and Zettlemoyer, "The case for 4-bit precision", arXiv 2212.09720, ICML 2023).
- Squeezing works better when the model is trained for it: Google's Gemma 3 QAT (quantization-aware training) models,
  "QAT simulates low-precision operations during training to allow quantization with less degradation afterwards";
  Gemma 3 27B "drops from 54 GB (BF16) to just 14.1 GB (int4)", 12B from 24 GB to 6.6 GB and "runs efficiently on laptop
  GPUs like the NVIDIA RTX 4060 Laptop GPU (8GB VRAM)" (Google Developers Blog, Apr 18, 2025). Apple's ~3B on-device
  model uses "2-bit quantization-aware training" (Apple Intelligence Foundation Language Models Tech Report 2025,
  machinelearning.apple.com, July 2025). (Caption and pinned comment: squeezed after training, as in our test, 2 bits
  broke; trained for it, phones run 2 bits.)

## Our demo (pipeline/ep37/squeeze_demo.py, series/scripts/ep37_demo/)
The same brain stored with fewer bits: Qwen's own files of Qwen2.5-1.5B-Instruct (EP35's medium brain), llama.cpp on
this machine's CPU (4 cores, no graphics card), greedy decoding, the shop's own tests with the answers written down first:
EP35's 40 WhatsApp messages (ORDER / PAYMENT / COMPLAINT / OTHER), EP34's 20 bills, EP36's WhatsApp reply (speed).

| Bits (file) | Size | 40 messages sorted right | 20 bills right | reply speed, words/s (whole reply) |
|---|---|---|---|---|
| 16 (fp16) | 3.56 GB | 39 | 13 | 6.4 (whole reply 7.5 s) |
| 8 (q8_0) | 1.89 GB | 39 | 11 | 9.2 (5.3 s) |
| 4 (q4_k_m) | 1.12 GB | 39 | 11 | 14.4 (3.4 s) |
| 3 (q3_k_m) | 0.92 GB | 38 | 6 | 14.5 (a shorter reply, no item list) |
| 2 (q2_k) | 0.75 GB | 20 | 3 | 22.1 (2.7 s, a muddled reply) |

4-bit against 16-bit: a third of the file (1.12 / 3.56 GB), the same 39 of 40 with the same single mistake, the same
WhatsApp reply word for word, written 2.2x faster (3.4 s vs 7.5 s; a CPU reads every number for every word, so fewer
bytes means faster). On the bills, the hard job for this small brain (EP34, EP35), 4-bit got 11 of 20 against 16-bit's
13: a small loss there, said in the caption. 3-bit is where it starts to slip (6 bills), 2-bit breaks.
Word for word: the 2-bit file sorted 19 of the 20 messages that weren't orders as ORDER, among them "come home, lunch
is ready", "the milk you sent yesterday was sour", "happy diwali anna and family" and "do you have a job for my
nephew?". Its bill for "anna 2 kg tomato, 1 dozen eggs pls" listed every item on the price board and came to
"TOTAL: 1000 Rs" (right: Rs 158); "2 coconut oil" came to 4.4. Its WhatsApp reply: "Sure, I will be happy to help you
out. Please confirm that I will be able to deliver the items as per your request..." (the 4-bit reply lists all four
items). 16-bit, 8-bit and 4-bit made the same single sorting mistake ("QR code not working, what is your UPI id?" as COMPLAINT),
and 8-bit and 4-bit wrote the WhatsApp reply word for word the same.

## Hook options (first frame + first line)
1. **Kept.** The order book filling the phone: "ORDER · come home, lunch is ready" circled, "ORDER · the milk you sent
   yesterday was sour", "ORDER · happy diwali anna"; a sticker "20 OF 40 MESSAGES SORTED WRONG"; Ravi: "My wife's
   'lunch is ready' went in as an ORDER?!" (a laugh in the first second, the stakes on screen, a mystery: why?)
2. A bill on the phone, two lines of order and fifteen lines of items, "TOTAL: ₹1,000"; the customer: "₹1,000 for
   tomatoes and eggs?!" (real, from our test; but the episode's main test is the 40 messages)
3. A vice squeezing the phone, the AI: "I made myself smaller. Ask me anything." Ravi: "What's two plus two?" "ORDER."
   (no stakes, made up)

## Script review (two viewers, v1)
Both: "Biscuits, free" is where it clicks; the sizes and the "or I go two-bit" ending didn't add up. The 1.1 GB brain
squeezed to 0.75 GB, then "full size 3.6 GB" on the card: so the brain was already 4-bit (say it). "And faster" with no
number is vendor talk (now measured: twice as fast, 3.4 s against 7.5 s a reply). "Never Q2" clashed with Apple's 2-bit
phone model and with "never" from one small model (now "Q2 broke me"; the caption says bigger brains take it better: our
7B at 2 bits still sorted 39 of 40). Nobody said "rounding", the whole idea; "one and a half billion... 65,536 values"
lost Sandeep (the voice now carries the prices: exact to the paisa, the nearest ten rupees, four prices per shelf; the
screen keeps the steps). "Four prices for the whole shop" is wrong, each block gets its own scale: "per shelf". The quiz
counted right answers while the Telugu voice asked for mistakes, and "close enough?" gave it away: now one card in both
languages, "4-BIT: how many wrong (of 40)? A 1 B 10 C 20", and every card counts mistakes ("2-BIT: 20 OF 40 WRONG" in
frame 1, two order rows instead of three). "Even the same mistake" (which one?) is cut. "Q4 in the name" of what: the
chip says "downloading a model (Ollama, LM Studio)? Pick the Q4 file" and answers the ChatGPT users ("the ChatGPT app:
their computers, their choice"); "Ollama's Q4_K_M, 4.7 GB" (the 7B) left the chip for the caption. The AI goes back to
Q4 before the photo gag, so "or I squeeze to two-bit" makes sense. Fewer sounds, one big hit on the answer. Telugu:
"కంప్రెస్" (EP36's word; "కుదించు" was textbook), "రేట్లు" not "విలువలు", "అరవై రెండు, అరవై అవుతుంది" not "దగ్గరి పది
రూపాయలకి", the AI says మీరు to Ravi ("డిలీట్ చేయండి, లేకపోతే"), "స్పీడ్" said whole, "ర్యాక్" for shelf ("అర" read as
"half" in EP36).

## Render review (English, two viewers, v2 render)
Both: the price board is where it clicks ("Biscuits: free" got a laugh); the loop lands and the join is seamless; the
sizes add up now. Both: the silent countdown ran long (3.6 s of nobody talking), and only "Just one" landed as a hit:
the final "ORDER" needs the biggest one. Sandeep: "Q4, like the fourth quarter?", the ChatGPT row read as half a
sentence, the wall of decimals nearly lost him at 0:09, Ravi's hook sounded like an announcement ("My wife's lunch is
ready. Went in as an order."). Priya: "twice as fast on what?", "what did 4-bit lose?", a footnote too small to read.
Heard back: "exact the paisa" (the "to" swallowed), "how many thus four-bit". Fixed in v3: the hook says "My wife says
'lunch is ready', and you made it an ORDER?!"; "right down to the paisa"; "How many will four-bit get wrong?"; one big
number rounds (0.0371826 to 0.04) instead of ten; the card says "one reply, 4-core computer, no GPU: 3.4 s vs 7.5 s" and
shows the catch ("hard job (20 bills) 13 -> 11 right"); the chip says "Q4 in the file name = 4-bit" and "using the
ChatGPT app? nothing to do"; the quiz holds 2.6 s with a 0.8 s count; a stacked hit on the last "ORDER"; the last
scene's bed lifts (boost 1.6, rise 1.4) with Ravi and the AI raised to stay 8 dB clear. Telugu while voicing: "డౌన్‌లోడ్"
garbled in four takes (line 11 now "మరి ఏ ఫైల్ తీసుకోవాలి?"); "అరవై రెండు, అరవై అవుతుంది" looped (now "ఫోర్ బిట్ లో
బియ్యం అరవై రూపాయలు"); the last word "ఆర్డర్" came out "adar" in four takes (now "ఆర్డర్ అండి", a deadpan "order,
sir"); "ఒక్కటే." alone is a one-word sentence Parler drops (now "ఒక్కటే తప్పు!").

## Script (English), v3
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | My wife says "lunch is ready", and you made it an ORDER?! | frame 1: the order book on the phone, big: "ORDER · come home, lunch is ready" (circled), "ORDER · the milk you sent yesterday was sour"; sticker "2-BIT AI: 20 OF 40 WRONG" |
| 2 | AI | Your phone was full. [1] So I squeezed my brain from four bits to two. | storage bar full; the brain file "4-bit · 1.1 GB" in a vice; on [1] it squeezes to "2-bit · 0.75 GB" |
| 3 | Ravi | You squeezed it?! | |
| 4 | AI | It's called quantization: [1] rounding every number in my brain. | "QUANTIZATION = ROUNDING"; a wall of numbers ("150 crore numbers"); one zooms, "0.0371826" rounds to "0.04" |
| 5 | Ravi | Rounding? Like my prices? | the price board slides in |
| 6 | AI | Full size: right down to the paisa. [1] Four-bit: the nearest ten rupees. | board column "full · 16-bit · 65,536 steps": rice ₹61.85, milk ₹27.60, dal ₹139.75, biscuits ₹19.50; on [1] "4-bit · 16 steps": ₹60, ₹30, ₹140, ₹20 |
| 7 | Ravi | And two-bit? | |
| 8 | AI | Four prices per shelf. [1] Biscuits: free. | column "2-bit · 4 steps (₹0/50/100/150)": ₹50, ₹50, ₹150, ₹0; on [1] the ₹0 circled, "FREE?!" |
| 9 | Ravi | Full size got one wrong out of forty. [1] How many will four-bit get wrong? | QUIZ held ~3 s, 3-2-1: "4-BIT: how many wrong (of 40)? · A 1 · B 10 · C 20 · comment A, B or C" |
| 10 | AI | Just one. [1] A third of the size, twice as fast. | test card "OUR TEST · same brain, 40 WhatsApp messages": 16-bit 3.6 GB 1 wrong · 8-bit 1.9 GB 1 wrong · 4-bit 1.1 GB 1 wrong ✓ · 2-bit 0.75 GB 20 wrong; "quiz: A ✓"; on [1] "⅓ the size", "2x faster: 3.4 s vs 7.5 s a reply"; a note "4-bit = the brain you installed in EP35" |
| 11 | Ravi | So which one do I download? | |
| 12 | AI | The one with Q4 in its name. [1] Going back to it now. | rule chip "PICK THE Q4 FILE · downloading a model (Ollama, LM Studio)? the Q4 file · Q2 broke our test brain: 20 of 40 wrong · the ChatGPT app: their computers, their choice" (no subtitle); on [1] "restoring Q4 · 1.1 GB ✓" |
| 13 | Ravi | Phone's full again! [1] Fifty-two good-morning photos! | "storage full", a grid of good-morning forwards (EP35) |
| 14 | AI | Delete the photos, [1] or I squeeze to two-bit. | two buttons: "DELETE PHOTOS" / "SQUEEZE THE AI" |
| 15 | Ravi | Fine... squeeze. | his thumb on "SQUEEZE THE AI" |
| 16 | AI | Lunch is ready: [1] ORDER. | the vice closes, "2-bit"; the order book again; cut to frame 1 (loops) |

About 50 s. Tag on screen: "EP37 · AI From Scratch". Caption: EP38 tease (running a brain on your own laptop),
how to spot Q4 (Ollama shows "quantization Q4_K_M", LM Studio and Hugging Face file names say q4_k_m), Q8 if it fits
(in our test Q8 = Q4 on both jobs, 1.7x bigger, 1.6x slower), the hard job lost a little (bills: 16-bit 13, 4-bit 11 of
20), bigger brains survive more squeezing (our 7B at 2 bits: 39 of 40), trained-for-it squeezing (Gemma 3 QAT, Apple's
2-bit), the big brain's sizes (15.2 GB -> 4.7 GB), comment A, B or C, sources and our test.

## Script (Telugu; English on-screen text), v3
1. రవి: మా ఆవిడ "భోజనం రెడీ" అంటే, అది కూడా ఆర్డర్ అనుకున్నావా?!
2. ఏఐ: ఫోన్ నిండిపోయింది. [1] అందుకే నా బ్రేన్ ని ఫోర్ బిట్ నుంచి టూ బిట్ కి కంప్రెస్ చేశాను.
3. రవి: కంప్రెస్ చేశావా?!
4. ఏఐ: దీని పేరు Quantization. [1] నా బ్రేన్ లో ప్రతి నంబర్ ని రౌండ్ చేయడం.   (the term in English letters: Parler said "kontization" in Telugu script)
5. రవి: రౌండ్ చేయడమా? నా రేట్ల లాగానా?
6. ఏఐ: అసలు సైజ్ లో పైసా కూడా లెక్కే. [1] ఫోర్ బిట్ లో బియ్యం అరవై రూపాయలు.
7. రవి: మరి టూ బిట్?
8. ఏఐ: ఒక్కో ర్యాక్ కి నాలుగే రేట్లు. [1] బిస్కెట్లు ఫ్రీ!
9. రవి: అసలు సైజ్ కి నలభైలో ఒక్కటే తప్పు. [1] ఫోర్ బిట్ కి ఎన్ని తప్పులు?
10. ఏఐ: ఒక్కటే తప్పు! [1] మూడో వంతు సైజ్, డబుల్ స్పీడ్.
11. రవి: మరి ఏ ఫైల్ తీసుకోవాలి?
12. ఏఐ: పేరులో క్యూ ఫోర్ ఉన్నది. [1] నేనూ మళ్ళీ దానికే వెళ్తున్నా.
13. రవి: ఫోన్ మళ్ళీ నిండింది! [1] యాభై రెండు గుడ్ మార్నింగ్ ఫోటోలు!
14. ఏఐ: ఫోటోలు డిలీట్ చేయండి, [1] లేకపోతే నేను టూ బిట్ కి వెళ్తా.
15. రవి: సరే... కంప్రెస్ చెయ్.
16. ఏఐ: భోజనం రెడీ: [1] ఆర్డర్ అండి.

## Render review (Telugu, v3 render)
Sandeep (Telugu at home) and Priya (reading the captions): the price board and "బిస్కెట్లు ఫ్రీ!" is where it clicks,
the loop lands ("ఆర్డర్ అండి" plays as a shop-boy deadpan), no word sounds rude, and the AI says మీరు to Ravi anna as it
should; the small grey text can't be read on a phone. Sandeep: "ఫుల్ సైజ్" and "ఫోర్ బిట్" blurred ("ఫూల్ బిట్"), the hook's
"ఆర్డరా" came back "అడా", the quiz hit masked "ఒక్కటే", "దీన్నే... అంటారు" and "రెండింతల స్పీడ్" sound bookish, the
storage popup sat over Ravi's face, and the last frame's pose didn't match frame 1. Priya: the shop wall says rice ₹60
and dal ₹120 while the board said ₹139.75. Fixed (both languages where shared): "అసలు సైజ్" for full size; "అది కూడా
ఆర్డర్ అనుకున్నావా?!"; "దీని పేరు Quantization." (in Telugu script Parler said "kontization" in four takes); "డబుల్
స్పీడ్"; the quiz hit half a second earlier; bigger, darker small text (150 crore, the speed line, the catch, the
footnote); the popup over the counter and the photos beside Ravi; dal ₹119.75, so the wall's prices are the 4-bit column;
the loop's last pose is frame 1's; a riser into "Biscuits: free" (the flat middle).

## Sound (fewer sounds, after the script review)
A hit and two pings on frame 1; a squish as the vice closes; a lift into the rounding insert; one ding as the 4-bit
prices land and a bonk on "Biscuits: free"; the quiz's tick-tock 3-2-1 with a riser, the bed out on the 1; the big hit
and a success sting on "Just one"; a snap on the rule chip; a riser into "Fine... squeeze", the squish, a glitch and the
biggest hit on "ORDER", into the loop.
