# UC01 test: how long does the caller wait?

Made with `pipeline/uc01/call_demo.py` (committed before it ran), Nov 23. Everything on our computer: 4 CPU threads, no
GPU. One phone order (`caller.wav`, a Kokoro computer voice, 9 s): "Hello, is this Ravi anna's shop? I want one
twenty-five kilo bag of sona masoori rice, two litres of sunflower oil, and two dozen eggs. Please deliver by six."
Made-up price list: rice bag ₹1,450, oil ₹155 a litre, eggs ₹84 a dozen; the right total is ₹1,928.

Stages, timed with a stopwatch; medians of 6 runs (a 7th warm-up run not counted):
- Ears, faster-whisper small: 1.79 s. It heard every item right in all 7 runs ("Ravi anna's" as "Raviana").
- Brain, Qwen2.5-7B-Instruct (4-bit), streamed: first sentence ("Hello!") written in 0.41 s; the whole reply (79-97
  words, the sum worked out line by line) in 29.6 s, about 3 words a second.
- Mouth, Kokoro: the whole reply made into speech in 10.1 s; the first sentence in 0.32 s.

| setup | silence before the caller hears anything | total right (₹1,928) |
|---|---|---|
| A: 7B, wait for the whole reply, then speak | 41.7 s (1.8 + 29.6 + 10.1) | 6 of 6 |
| B: 7B, speak the first sentence while the rest is written | 2.5 s (1.8 + 0.4 + 0.3) | 6 of 6 (the same replies) |
| C: 7B told "reply in at most two short sentences" | 7.4 s (4.7 s streamed) | 0 of 6: ₹2,259, ₹2,450, ₹2,156, ₹2,159, ₹2,259, ₹2,359 |
| D: the 1.5B model, same ask | 12.2 s (2.7 s streamed) | 1 of 6: ₹1,450 (the rice alone) 3 times, ₹1,605, ₹1,760 |

Read by hand: every A reply lists the three items with their prices, adds them, and confirms 6 PM. Every C reply is a
bare total with no working, and every one is wrong (₹228 to ₹522 too high). The 1.5B model writes 13 words a second but
dropped items from the sum in 5 of 6; one said delivery "by 6 AM".

What it shows: the slow part is the brain writing the whole reply (30 of 42 s). Cutting the reply or the model makes it
faster and wrong. Speaking the first sentence while the rest is written cuts the silence to 2.5 s with the working
(and the right total) intact; the brain writes about as fast as the voice speaks (~3 words a second), so the rest keeps
up. Not tested: interruptions (the caller talking over the AI), and big apps on fast chips: OpenAI's own page puts its
old three-model voice mode at 2.8-5.4 s on average and GPT-4o at 0.32 s (May 2024). People leave about 0.2 s between
turns (Stivers et al., PNAS 2009, 10 languages; Scientific American, National Geographic).
