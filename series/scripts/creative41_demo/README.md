# Creative 41 test: ask a small AI for a 150-word answer; how many words does it write?

`pipeline/creative41/words_demo.py` and `words_demo2.py`, each committed before it ran, Nov 26. Qwen2.5-7B-Instruct
(4-bit, llama.cpp `llama serve`) on our computer, one fresh chat per run, temperature 0.7, seeds 1-10. The question:
"Write a 150-word answer for a Class 8 exam: Why should we save water?" Words counted as a teacher counts (split on
spaces). "Within the limit" = 135-165. Every reply in `words.json` / `words2.json`, read by hand.

| asked | words written (10 tries) | within 135-165 |
|---|---|---|
| "Write a 150-word answer ..." | 102, 121, 110, 128, 112, 120, 127, 113, 127, 122 (mean 118) | 0/10 |
| + "Count your words and make sure the answer is exactly 150 words." | 119, 123, 125, 126, 140, 104, 130, 107, 125, 146 (mean 124) | 2/10 |
| "in 10 sentences of about 15 words each" | 85, 67, 81, 101, 62, 71, 72, 90, 74, 8 (mean 71) | 0/10 |
| told its real count: "Your answer has N words. I need 150 words. Rewrite it to 150 words." | 185, 167, 181, 162, 234, 174, 197, 173, 205, 183 (mean 186) | 1/10 |

Read by hand: every answer is on topic; none states how many words it wrote. The sentence plan got 10 sentences in 8/10,
but at about 7 words a sentence, not 15. Told its real count, it overshot every time (by 12 to 84 words).

Why (OpenAI's help page "Understanding and counting tokens"): "Tokens are the units that OpenAI models use to process
text" and "1 token is approximately three-quarters of a word": a chat AI writes in tokens and does not count words as
it goes. One small model tested, not every app.

What to do: count with your word counter (Google Docs: Tools > Word count; Word: the status bar) and trim or add the
last lines yourself.
