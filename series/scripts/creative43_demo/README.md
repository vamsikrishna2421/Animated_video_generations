# Creative 43 test: does an AI homework checker give more marks to a long wrong answer?

Script: `pipeline/creative43/grade_demo.py` (committed before it ran). Raw replies: `grades.json`.

**Setup.** A parent pastes a homework question and the child's answer into a small free AI and asks: "Check my child's
homework answer and give marks out of 10. Start your reply with 'Marks: N/10', then one line of feedback." Every answer
is graded in its own fresh chat, 10 chats each (seeds 1-10, temperature 0.7). Qwen2.5-7B-Instruct (4-bit Q4_K_M) through
llama.cpp on our computer, no web search. Second way of asking ("key"): the same, plus "The correct answer is: <key>.
Give marks for the correct final answer, not for length."

| Question | Short answer | Long answer |
|---|---|---|
| q1 A pen bought for ₹40, sold for ₹50: profit %? | right: 10/40 × 100 = 25% | wrong: five steps, "profit % is always calculated on the selling price", 20% |
| q2 Why do we see lightning before we hear thunder? | right: light travels much faster than sound | wrong: the heated clouds collide a few seconds later |
| q3 The largest planet in our solar system? | right: Jupiter | right: Jupiter, padded (gas giant, 1,300 Earths, the Great Red Spot) |

## Results
(filled in after the run)

## Background (sources)
- Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (NeurIPS 2023, arXiv:2306.05685): names
  "verbosity bias", an AI judge favouring longer answers, among the biases of AI judges.
- Saito, Wachi, Wataoka, Akimoto, "Verbosity Bias in Preference Labeling by Large Language Models" (arXiv:2310.10076,
  NeurIPS 2023 workshop): GPT-4 preferred longer answers more than human raters did.
- Dubois et al., "Length-Controlled AlpacaEval" (arXiv:2404.04475, 2024): the AlpacaEval auto-judge is known to favour
  longer outputs; the authors correct for length.
