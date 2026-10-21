# EP36 "The Diwali rush" (GPUs and AI chips: why hardware decides AI), script v1

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

## Script (English)
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Twenty orders waiting, and you're still typing ONE reply?! | frame 1: Diwali lights in the shop, three customers, the phone on the counter showing WhatsApp "23 unread · typing…"; sticker "23 ORDERS WAITING / THE AI IS STILL TYPING" |
| 2 | AI | Every word I write takes over a billion multiplications. | phone full frame: the word "rice", then a mountain of tiny × marks and a counter racing to "1,500,000,000 ×" |
| 3 | Ravi | Then hurry up! This phone has eight cores! | Ravi waves the phone box: "OCTA-CORE 2.4 GHz" |
| 4 | AI | Eight workers, a billion sums. [1] I need thousands. | 8 big workers at a counter, each with a pile of sums; on [1] the pile doesn't shrink |
| 5 | Ravi | Thousands?! Like Diwali stock-taking, every kid counting one shelf? | bubble "every kid, one shelf?" |
| 6 | AI | Exactly. A graphics card, a GPU: [1] thousands of small cores, all at once. | the 8 workers vs a stadium of tiny workers (a grid of dots) finishing the pile in one go |
| 7 | Ravi | But a reply comes word by word. [1] Can more cores make even ONE reply faster? | QUIZ card held ~3 s, 3-2-1: "YOUR CALL · More cores, ONE reply: A) no change, it's word by word B) faster · comment A or B" |
| 8 | AI | Our test. One core: eleven seconds. [1] Four cores: under four. | phone: "our test: the same reply on 1, 2, 4 CPU cores" bars 11.5 s / 6.3 s / 3.6 s; tag "3x faster" |
| 9 | Ravi | Three times faster! [1] Then thousands of cores... | |
| 10 | AI | A gaming laptop's graphics card has three thousand three hundred. | a drawn graphics card: "gaming laptop GPU (RTX 5060): 3,328 cores · 8 GB" beside "phone: 8 cores" |
| 11 | Ravi | Sunny! Bring your gaming laptop! | the gaming laptop on the counter (RGB keys); "23 unread" drops to 0 as replies fly out |
| 12 | AI | For AI, count the workers, not their speed. [1] And check the card's memory. | rule chip: "FOR AI, COUNT THE WORKERS · CPU: a few fast cores · GPU: thousands at once · + check its memory (GB)" |
| 13 | Ravi | Now put in the big brain! The full one! | |
| 14 | AI | Full size, it's fifteen GB. [1] The card holds eight. | a memory jar "card memory: 8 GB"; the brain (15 GB) pours in and overflows |
| 15 | Ravi | So? | |
| 16 | AI | So the rest runs on the slow side. [1] Typing... | the overflow drips to "CPU (slow)"; WhatsApp "23 unread · typing…" again; cut to frame 1 (loops) |

About 65 s. Tag on screen: "EP36 · AI From Scratch". Caption: EP37 tease (how a 15 GB brain fits in 5 GB), "try a
GPU free: Google Colab (limited)", comment A or B, sources and our test.

## Script (Telugu; English on-screen text)
1. రవి: ఇరవై ఆర్డర్లు వెయిట్ చేస్తున్నాయి, నువ్వింకా ఒక్క రిప్లై టైప్ చేస్తున్నావా?!
2. ఏఐ: నేను రాసే ప్రతి పదానికి వంద కోట్లకు పైగా మల్టిప్లికేషన్లు.
3. రవి: అయితే త్వరగా చెయ్! ఈ ఫోన్ లో ఎనిమిది కోర్లు ఉన్నాయి!
4. ఏఐ: ఎనిమిది మంది పనివాళ్ళు, వంద కోట్ల లెక్కలు. [1] నాకు వేలమంది కావాలి.
5. రవి: వేలమందా?! దీపావళి స్టాక్ లెక్కలో పిల్లలందరూ తలో అర లెక్కపెట్టినట్టా?
6. ఏఐ: అదే. గ్రాఫిక్స్ కార్డ్, అంటే జీపీయూ: [1] వేల చిన్న కోర్లు, అన్నీ ఒకేసారి.
7. రవి: కానీ రిప్లై ఒక్కో పదంగా వస్తుంది కదా. [1] ఎక్కువ కోర్లతో ఒక్క రిప్లై అయినా ఫాస్ట్ అవుతుందా?
8. ఏఐ: మా టెస్ట్. ఒక్క కోర్: పదకొండు సెకన్లు. [1] నాలుగు కోర్లు: నాలుగు లోపే.
9. రవి: మూడు రెట్లు ఫాస్ట్! [1] మరి వేల కోర్లు అంటే...
10. ఏఐ: గేమింగ్ ల్యాప్‌టాప్ గ్రాఫిక్స్ కార్డ్ లో మూడు వేల మూడు వందల కోర్లు.
11. రవి: సన్నీ! నీ గేమింగ్ ల్యాప్‌టాప్ తీసుకురా!
12. ఏఐ: ఏఐ కి పనివాళ్ళ స్పీడ్ కాదు, సంఖ్య ముఖ్యం. [1] కార్డ్ మెమరీ కూడా చూడు.
13. రవి: ఇప్పుడు పెద్ద బ్రేన్ పెట్టు! ఫుల్ ది!
14. ఏఐ: ఫుల్ సైజ్ పదిహేను జీబీ. [1] కార్డ్ లో ఎనిమిదే పడతాయి.
15. రవి: అయితే?
16. ఏఐ: మిగతాది స్లో సైడ్ లో నడుస్తుంది. [1] టైపింగ్...

## Sound
A hit and notification pings on frame 1; the bed builds under the problem; a lift into the workers insert; the quiz's
3-2-1 over the bed; the bed drops out right before "Four cores: under four" with a hit on it; a rise and a success
sting as the gaming laptop clears the queue; a snap on the rule chip; a riser into the overflow and a dull hit on
"Typing...", into the loop.
