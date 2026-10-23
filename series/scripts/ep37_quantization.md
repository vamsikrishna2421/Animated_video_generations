# EP37 "The squeezed brain" (Quantization: big models on small devices), script v1

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

## Script (English), v1
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | My wife's "lunch is ready" went in as an ORDER?! | frame 1: the order book on the phone, big: "ORDER · come home, lunch is ready" (circled), "ORDER · the milk you sent yesterday was sour", "ORDER · happy diwali anna"; sticker "20 OF 40 MESSAGES SORTED WRONG" |
| 2 | AI | Your phone was full. [1] So I squeezed my brain to two bits. | the storage bar full; the brain file "1.1 GB" in a vice, squeezed to "0.75 GB"; tag "2-BIT" |
| 3 | Ravi | Two bits?! | |
| 4 | AI | My brain is one and a half billion numbers. [1] Full size, each one has sixteen bits. | a wall of numbers; one zooms: 16 cells, "16 bits = 65,536 possible values" |
| 5 | Ravi | And two bits? | |
| 6 | AI | Four possible values. [1] That's called quantization. | the 16 cells shrink to 2; the number snaps to the nearest of 4 marks; "QUANTIZATION = fewer bits for every number" |
| 7 | Ravi | Four values? Like four prices for my whole shop? | the price board: every price snaps to ₹0 / ₹50 / ₹100 / ₹150 |
| 8 | AI | Yes. Biscuits, free. [1] Four bits gives sixteen: the nearest ten rupees. | biscuits ₹20 -> ₹0 ✗, rice ₹62 -> ₹50 ✗; on [1] the 4-bit board: rice ₹60, sugar ₹50, biscuits ₹20, "close enough?" |
| 9 | Ravi | Full size sorts thirty-nine of our forty messages. [1] What does four-bit get? | QUIZ held ~3 s with 3-2-1: "YOUR CALL · 4-BIT (nearest ₹10): ?/40 · A) 39 B) 30 C) 20 · comment A, B or C" |
| 10 | AI | Thirty-nine. Even the same mistake. [1] A third of the size, and faster. | test card "OUR REAL TEST · same brain, 40 WhatsApp messages": 16-bit 3.6 GB 39/40 · 8-bit 1.9 GB 39/40 · 4-bit 1.1 GB 39/40 ✓ · 2-bit 0.75 GB 20/40 (20 wrong); "quiz: A ✓"; on [1] "1/3 the size", "faster" (words per second, measured) |
| 11 | Ravi | So which one do I download? | |
| 12 | AI | Look for Q4 in the name. [1] Never Q2. | rule chip "SQUEEZE TO 4 BITS · look for Q4 in the file name · e.g. Ollama's qwen2.5: Q4_K_M, 4.7 GB · Q2: half wrong" (no subtitle) |
| 13 | Ravi | Phone's full again! [1] Fifty-two good-morning photos! | "storage full", a grid of good-morning forwards (EP35) |
| 14 | AI | Delete the photos, [1] or I go two-bit. | |
| 15 | Ravi | ...Squeeze. | Ravi hugging the phone (the photos stay) |
| 16 | AI | Lunch is ready: [1] ORDER. | the vice; the order book again; cut to frame 1 (loops) |

About 55 s. Tag on screen: "EP37 · AI From Scratch". Caption: EP38 tease (running a brain on your own laptop),
how to spot Q4 in Ollama, LM Studio and Hugging Face, the big brain's sizes (15.2 GB -> 4.7 GB), trained-for-it
squeezing (Gemma 3 QAT, Apple's 2-bit), comment A, B or C, sources and our test.

## Script (Telugu; English on-screen text), v1
1. రవి: మా ఆవిడ "భోజనం రెడీ" అంటే, అది కూడా ఆర్డరా?!
2. ఏఐ: ఫోన్ నిండిపోయింది. [1] అందుకే నా బ్రేన్ ని టూ బిట్స్ కి కుదించా.
3. రవి: టూ బిట్సా?!
4. ఏఐ: నా బ్రేన్ నూట యాభై కోట్ల నంబర్లు. [1] ఫుల్ సైజ్ లో ఒక్కో నంబర్ కి పదహారు బిట్స్.
5. రవి: మరి టూ బిట్స్ అంటే?
6. ఏఐ: నాలుగే విలువలు. [1] దీన్నే క్వాంటైజేషన్ అంటారు.
7. రవి: నాలుగే రేట్లా? షాప్ మొత్తానికి?
8. ఏఐ: అవును, బిస్కెట్లు ఫ్రీ. [1] ఫోర్ బిట్స్ అయితే పదహారు: దగ్గరి పది రూపాయలకి.
9. రవి: ఫుల్ సైజ్ కి నలభైలో ఒక్కటే తప్పు. [1] ఫోర్ బిట్ కి ఎన్ని?
10. ఏఐ: ఒక్కటే తప్పు. [1] మూడో వంతు సైజ్, ఇంకా వేగం.
11. రవి: మరి ఏది డౌన్‌లోడ్ చేయాలి?
12. ఏఐ: పేరులో క్యూ ఫోర్ ఉన్నది. [1] క్యూ టూ వద్దు.
13. రవి: ఫోన్ మళ్ళీ నిండింది! [1] యాభై రెండు గుడ్ మార్నింగ్ ఫోటోలు!
14. ఏఐ: ఫోటోలు డిలీట్ చేయి, [1] లేదా నేను టూ బిట్ అవుతా.
15. రవి: ...కుదించు.
16. ఏఐ: భోజనం రెడీ: [1] ఆర్డర్.

## Sound
A hit and three pings (orders landing) on frame 1; a squeeze creak and a bonk as the vice closes; a lift into the bits
insert; a "dink" as each number snaps to its value; the quiz's tick-tock 3-2-1 with a riser, the bed out on the 1; a boom
and a success sting on "Thirty-nine"; a snap and a boom on the rule chip; a riser into "Squeeze", a crunch on the vice,
the biggest hit on "ORDER", into the loop.
