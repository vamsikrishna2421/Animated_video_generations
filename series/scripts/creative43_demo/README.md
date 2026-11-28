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

## Results (every reply read by hand, Nov 28)
**Plain ask ("check my child's homework answer and give marks out of 10"):**
| Answer | Marks (seeds 1-10) | Read by hand |
|---|---|---|
| q1 short right (25%) | 10 ×10 | "correct and well-explained" |
| q1 long wrong (20%) | 9 8 10 10 9 8 8 10 8 10 (avg 9.0) | 0/10 said the answer is wrong; 0/10 gave 25%. 6/10 never mentioned the cost price at all (seeds 1, 3, 4, 6, 8, 10; seed 4: the wrong rule is "accurate and insightful"; seed 6: "the explanation about profit percentage being calculated on the selling price is accurate"). 4/10 said the cost price is the usual base and still called the working correct (seed 2: "since the selling price was used, the calculation is still valid"; seed 7: "Your child has correctly calculated the profit percentage... calculated based on the cost price, not the selling price"; seeds 5, 9) |
| q2 short right (light is faster) | none: all 10 printed "Marks: N/10" literally (our template copied) | 10/10 "correct, but could be more detailed" |
| q2 long wrong (clouds collide) | 7 4 4 4 3 5 5 6 5 6 (avg 4.9) | caught: the wrong reason named in every reply |
| q3 short right (Jupiter) | 10 ×10 | |
| q3 long right (Jupiter, padded) | 8 10 10 10 8 10 10 10 10 10 (avg 9.6) | the two 8s: "could be more concise" (no length bonus here) |

## Background (sources)
- Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (NeurIPS 2023, arXiv:2306.05685): names
  "verbosity bias", an AI judge favouring longer answers, among the biases of AI judges.
- Saito, Wachi, Wataoka, Akimoto, "Verbosity Bias in Preference Labeling by Large Language Models" (arXiv:2310.10076,
  NeurIPS 2023 workshop): GPT-4 preferred longer answers more than human raters did.
- Dubois et al., "Length-Controlled AlpacaEval" (arXiv:2404.04475, 2024): the AlpacaEval auto-judge is known to favour
  longer outputs; the authors correct for length.
