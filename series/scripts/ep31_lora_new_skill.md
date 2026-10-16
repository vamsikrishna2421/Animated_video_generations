# EP31 "Teach an AI a new skill without a supercomputer" (LoRA) — script v4 (as voiced)

Promised by EP30's outro ("Next: how to teach an AI a new skill without a supercomputer"). Crayon style, real demo.
Next (EP32, syllabus): RAG part 2, how AI finds the right page in your documents.

Telugu render review (v4): "oka chinna LoRA" came out close to a Hindi swear word ("loda": the Telugu r flapped to a d),
so every Telugu LoRA is now written "లారా" ("Laara", the sound the English voice uses) and the close says "LoRA file";
scores are said in English with a pause before each ("sixteen vachaayi", "thirty lo twenty seven"); English captions now
follow the Telugu voice (cues sit on the real sentence starts: pipeline/reel_build.py `sentence_cues`); every Telugu
sentence take is levelled before joining (the hook started soft). Also fixed: te_check named takes by position, so a new
sentence could overwrite an old take in te_chunks (EP31 caught it: the trick would have repeated the Apple sentence);
takes are now named by a hash of their text, and the colliding cache entries were dropped and re-voiced.

v3 -> v4 (render review of the first English cut): the 20 s after the quiz lost both viewers ("B" was masked by the
reveal hit, the Apple line came after "don't use LoRA here", and "So" didn't follow) -> the answer is said aloud ("The
answer is B: give it the list"), the hit lands 8 frames before it, Apple moved up to the file-size beat, and the close is
one rule then next ("Prompt first. Facts that keep changing? Put them in the prompt. A skill the prompt can't nail? A small
LoRA. Then check its work: we still got 3 wrong"). Plain words: "The trick is called LoRA", "no graphics card", "every
one of its 360 million numbers" ("all" was heard as "or"), "LoRA notes" (not "a LoRA", heard as "Alora"); the 1.2% is on
screen only. Bigger small print (prompt, training log, the 3-wrong caveat, "real chats are messier"); the model is named
on screen. The hook's order is a fresh run with a phone number no phone can have (55555 01234) and a consistent address
(a viewer caught "My Home Avatar, Guntur"). Sound: hits on 0 and 16, a lift into the trick, louder bed in the hook and
close (quarters were within 1.4 dB), and the last scene now holds to the final frame (it ended on an empty frame).

v2 -> v3 (second viewer pass: "the video peaks at the quiz"): the hook is now a scoreboard, plain prompt 0 / two examples
16 / LoRA 27 (Priya: the real LoRA gain is 16 -> 27, show it up front; Sandeep: the two-example tip is the one he'd use);
"Why not just ask ChatGPT?" moved right after the hook; "a whole new copy per skill" replaces "servers full of chips"
(no big-model claim we don't pay off); QLoRA cut; the Apple line opens the close, then the checklist, next, follow.
"30 new orders it never saw" said aloud; "made-up orders, real chats are messier" on screen; the training graphic is a
cloud machine's terminal (4 CPU cores), not a laptop; "tested by us" (not "run by us"); one name per idea (notes / skill
file); the music drop moves from 1.2% to the MB line. "ours" reworded ("in hours" in the transcript).
Telugu: "muppai lo iravai edu perfect ga vachaayi", big numbers in English ("three hundred sixty million", "seven twenty
four MB"), "mottam numbers lo one point two percent maatrame", "dummy orders", "adi ichina answers okasari check cheyyandi".

v1 -> v2 (first viewer pass): "why not just ask ChatGPT?" answered; a wrong phone number is not a "small mistake" (named
on screen + "check its work"); image-style line cut; prompt shown; better-prompt test run (16/30); skill file re-saved in
16-bit (9 MB, still 27/30) so 9/724 MB matches 1.2%; "made-up orders" said aloud.

Demo (real, ours; pipeline/ep31/lora_demo.py + extra_checks.py, results in series/scripts/ep31_demo/):
SmolLM2-360M-Instruct (Hugging Face, Apache-2.0). Skill: turn a messy WhatsApp order into an order slip (JSON: name, phone,
items with quantities, address). Prompt: "Turn this WhatsApp order into an order slip: JSON with name, phone, items (item,
qty) and address." 240 made-up (synthetic) training orders, 2 passes, LoRA rank 8 on all linear layers (1.2% of the
numbers), 4 CPU cores, no GPU, 14 minutes of training. Scored on 30 new orders it never saw; "perfect" = name, phone, every
item with its quantity, and the address all exactly right.
- Plain prompt, untrained: 0/30 perfect, 0/30 valid JSON (mostly the order copied back).
- Prompt with two worked examples, untrained: 16/30 perfect (30/30 valid).
- LoRA: 27/30 perfect (30/30 valid); misses: one phone number short a digit, two item lists wrong. Same 27/30 with the skill
  file saved in 16-bit (8.7 MB) as in 32-bit (17.4 MB). Model file 723.7 MB (16-bit).

| # | English | On screen |
|---|---|---|
| 1 | We asked a tiny free AI to turn WhatsApp orders into neat slips. It just copied them back. | tag "SmolLM2-360M by Hugging Face · tested by us"; our prompt; the order (WhatsApp green) + its real reply, greyed; stamp "COPIED BACK" |
| 2 | Zero out of 30. | scoreboard "perfect slips, out of 30 new orders": plain prompt 0 (boom) |
| 3 | A better prompt, with two examples? 16. | prompt + 2 examples: 16 (snap) |
| 4 | Then we trained it on 240 made-up orders. 14 minutes, no graphics card. | the real training log ("error going down"), stopwatch "14 min" landing on "minutes", tag "trained on 4 CPU cores · no graphics card" |
| 5 | 27 out of 30, on new orders it never saw. | the slip it writes now; LoRA, 14 min: 27 (music drops before it, boom); tag "3 wrong: 1 phone number, 2 item lists"; "made-up orders · real chats are messier" |
| 6 | Why not just ask ChatGPT? This one's free, runs on your own computer, and customer details never leave it. | laptop with a padlock; ticks: free / runs on your own computer / customer details stay with you |
| 7 | Normal training changes every one of its 360 million numbers. | grid of numbers flickering; tag "360 million numbers: every one changes" |
| 8 | And every new skill needs a whole new copy. | three 724 MB copies (orders / replies / summaries); "heavy to train, heavy to store" |
| 9 | The trick is called LoRA: freeze the original. | "the trick: LoRA"; the "book" of numbers gets an ice tint + padlock (whoosh, lift) |
| 10 | Add a few new numbers on top, like sticky notes in a textbook, and train only the notes. | sticky notes land; stamp "the notes: 1.2% of the numbers" |
| 11 | Each skill is its own 9 MB file, a short WhatsApp video. The model? 724 MB, a movie. | two files, areas to scale (music drops before it) |
| 12 | Apple says its iPhone AI does this: one model, a small skill file per feature. | phone with three skill-file cards (summaries, writing tools, replies); "Apple Machine Learning Research, 2024" |
| 13 | Your turn. Your shop's prices change every week. A: train LoRA notes on this week's prices. B: give it the price list with every question. Which one? | YOUR TURN; cards A / B; 1.5 s countdown, music drops |
| 14 | The answer is B: give it the list. LoRA notes would need retraining every week, and can still misremember a price. | crown on B (hit just before the voice); "retrain every week" / "always this week's"; "changing facts: put them in the prompt / skills & style: LoRA" |
| 15 | So: prompt first. Facts that keep changing? Put them in the prompt. A skill the prompt can't nail? A small LoRA. Then check its work: we still got 3 wrong. | cards 1-2-3 ("2 examples took ours from 0 to 16"); stamp "check its work: ours got 3 wrong" |
| 16 | Next: how AI finds the right page in your documents. | NEXT |
| 17 | Follow, so you don't miss it. | handle, held to the last frame |

## Telugu (romanized; visuals in English)
1. Oka chinna free AI ki, WhatsApp orders ni neat slips ga maarchamani cheppaam. Adi order ne malli copy chesi ichindi.
2. Thirty ki zero.
3. Rendu examples tho manchi prompt iste? Sixteen vachaayi.
4. Taruvaata, two forty dummy orders tho train chesaam. Padnaalugu nimishaalu, graphics card lekunda.
5. Adi eppudu choodani kotha orders meeda? Thirty lo twenty seven perfect ga vachaayi.
6. ChatGPT ne enduku adagakoodadu? Idi free, mee sonta computer lone nadustundi, mee customers details bayatiki vellavu.
7. Maamuluga, AI ki edaina nerpiste, daani lopala prati okka number maarutundi. Ee model lo three hundred sixty million unnaayi.
8. Prati kotha skill ki, model mottam kotha copy kaavaali.
9. Ee trick peru LoRA (said "Laara"): original ni freeze chestaam.
10. Daani meeda konni kotha numbers atikistaam, textbook meeda sticky notes laaga. Aa notes ne train chestaam.
11. Prati skill oka separate nine MB file, oka chinna WhatsApp video antha. Model emo seven twenty four MB, oka cinema antha.
12. Apple cheppindi, vaalla iPhone AI kuda ilaage: oke model, prati feature ki oka chinna skill file.
13. Ippudu mee vantu. Mee shop lo dharalu prati vaaram maarutaayi. A: ee vaaram dharala meeda Laara notes train cheyyadam. B: prati prashna tho paatu price list ivvadam. Edi correct?
14. Answer B: list ivvandi. Laara notes ayite prati vaaram malli train cheyyaali, ayinaa oka dhara tappuga gurtupettukovachu.
15. Anduke: modata prompt. Maarutoo unde facts? Prompt lone ivvandi. Prompt tho raani skill? Oka chinna Laara file. Taruvaata adi ichina answers check cheyyandi: maadi kuda moodu tappulu chesindi.
16. Taruvaati episode lo: mee documents lo sariaina page ni AI ela vetukutundo chooddam.
17. Miss avvakunda follow avvandi.

## Facts (checked 2026-10-16; quotes in the research notes)
- LoRA: Hu et al., Microsoft, arXiv 2106.09685 (ICLR 2022). "W0 is frozen and does not receive gradient updates, while A and
  B contain trainable parameters." GPT-3 175B: trainable parameters down 10,000x, GPU memory down 3x (1.2 TB -> 350 GB);
  checkpoint 350 GB -> 35 MB (r = 4, query/value only), still needs the base model. Merged: no extra inference latency.
- Full fine-tuning memory: ~16 bytes/parameter with mixed-precision Adam (ZeRO, Rajbhandari et al.); ~18 bytes/parameter
  (Hugging Face "GPU memory usage" docs), before activations.
- QLoRA (caption only, cut from the voice in v3): Dettmers et al., arXiv 2305.14314 (May 2023): "finetune a 65B parameter
  model on a single 48GB GPU"; regular 16-bit fine-tuning of LLaMA 65B "requires more than 780 GB of GPU memory".
- Apple (machinelearning.apple.com, 10 Jun 2024): "Apple Intelligence includes a broad set of adapters, each fine-tuned for a
  specific feature"; LoRA adapters on the ~3B on-device model, "10s of megabytes" each. Said as "Apple says". The phone's
  card labels (summaries, writing tools, replies) are Apple Intelligence features shown as examples.
- Prompt -> context -> fine-tune: OpenAI "Optimizing LLM accuracy" (context for missing/out-of-date/proprietary knowledge;
  fine-tuning for format, tone, consistency; "additive, not exclusive"); Google Cloud tuning docs ("starting with
  prompting"); Microsoft Foundry ("doesn't replace retrieval for current information"); Apple ("try ... prompt engineering
  or tool calling" first).
- Honesty limits: our 360M model could also be fully fine-tuned on a CPU (16-18 bytes x 362M ~ 6-7 GB + activations), so the
  script never says our model needed a supercomputer; "no GPU" and "14 minutes" are the claims, both measured.
  LoRA doesn't always match full fine-tuning (Biderman et al., TMLR 2024: weaker on code and maths): no "always as good".
  Sizes compare like for like (both 16-bit). Orders are made up, and we say so.
- The hook's order: pipeline/ep31/hook_example.py (same models; a phone number no phone can have, 55555 01234).
- Demo model: SmolLM2-360M-Instruct, 361,821,120 parameters, Apache-2.0 (Allal et al., 2025). English only (no Telugu demo).
