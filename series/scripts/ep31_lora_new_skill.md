# EP31 "Teach an AI a new skill without a supercomputer" (LoRA) — script v1

Promised by EP30's outro ("Next: how to teach an AI a new skill without a supercomputer"). Crayon style, real demo.
Next (EP32, syllabus): RAG part 2, how AI finds the right page in your documents.

Demo (real, ours; pipeline/ep31/lora_demo.py, results in series/scripts/ep31_demo/): SmolLM2-360M-Instruct (Hugging Face,
Apache-2.0). Skill: turn a messy WhatsApp order into an order slip (JSON: name, phone, items with quantities, address).
240 synthetic training orders, 2 passes, LoRA rank 8 on all linear layers (1.2% of the numbers), 4 CPU threads,
no GPU, 14 minutes of training. Scored on 30 orders it never saw; "perfect" = name, phone, every item with its
quantity, and the address all exactly right. Before: 0/30 (valid JSON 0/30;
mostly the order copied back). After: 27/30 (valid JSON 30/30; misses: one phone number short a digit, two
orders with an item or quantity wrong). Skill file 17 MB; model file 724 MB.

| # | English | On screen |
|---|---|---|
| 1 | We asked this free AI to turn WhatsApp orders into order slips. It just copied them back. | the real order (WhatsApp green) + its real reply (the order copied back), greyed; tag "a small free AI · run by us" |
| 2 | Zero out of 30. | stamp "0 / 30 usable" |
| 3 | So we taught it with 240 examples. 14 minutes, on four ordinary CPU cores. No GPU. | laptop with a scrolling training log, stopwatch "14 min", tag "4 CPU cores · no GPU" |
| 4 | Now? 27 out of 30, perfect. Here's the trick. | the same order -> the filled ORDER SLIP; stamp "27 / 30 perfect", small tag "new orders it never saw · 3 had small mistakes" (music drops before it) |
| 5 | Normally, teaching an AI changes every number inside it. Ours has 360 million. | grid of numbers filling; tag "ours: about 360 million numbers" |
| 6 | The big ones have hundreds of billions. Training those takes servers full of AI chips. | GPU racks lighting up |
| 7 | Even a 7-billion model needs over 100 GB of chip memory to train. | tag "a 7B model: 100+ GB of chip memory" |
| 8 | LoRA's trick: freeze the original. | LoRA; the "book" of numbers gets an ice tint + padlock |
| 9 | Clip on thin strips of new numbers, like sticky notes in a textbook, and train only those. | sticky notes land on the book |
| 10 | In our test, that's 1.2% of the numbers. | stamp "1.2% of the numbers" (music drops before it) |
| 11 | And the skill saves as its own small file: 17 MB, next to a 724 MB model. | two files to scale: "17 MB the skill" / "724 MB the model" |
| 12 | Your turn. Your shop's prices change every week. | YOUR TURN |
| 13 | A: train a LoRA on this week's price list. B: hand the AI the price list with every question. Which one? | cards A / B; 1.5 s countdown, music drops |
| 14 | B. A LoRA would bake in old prices. | crown on B; "old prices baked in" / "always this week's" (hit) |
| 15 | LoRA for skills and style. Facts that change? Give them to the AI each time. | "skills & style: LoRA" / "facts that change: give them each time" |
| 16 | And one model can carry many skill files: orders, your shop's tone, quizzes from class notes. Swap them in a second. | robot + three sticky-note skill cards dropping into its slot one by one |
| 17 | This isn't just a lab trick. Apple says its phone AI plugs in small adapters like these, one per feature. | phone with three adapter cards |
| 18 | Image AIs learn a new drawing style from one small file. | four style swatches |
| 19 | And a cousin called QLoRA fine-tuned a 65-billion model on a single GPU. | "65B model, fine-tuned" stamp, "1 GPU", tag "QLoRA (Dettmers et al., 2023)" |
| 20 | So before you train anything: try a good prompt. Facts that change? Give them each time. A skill or a style? A small LoRA. | three cards 1-2-3; stamp "ours: 14 min · 17 MB" |
| 21 | Next: how AI finds the right page in your documents. | NEXT |
| 22 | Follow, so you don't miss it. | handle |

## Telugu (romanized; visuals in English)
1. Ee free AI ki WhatsApp orders ni order slips ga maarchamani cheppaam. Adi vaatine malli copy chesi ichindi.
2. Muppai lo sunna.
3. Anduke rendu vandala nalabhai examples tho nerpinchaam. Padnaalugu nimishaalu, naalugu maamulu CPU cores meeda. GPU ledu.
4. Ippudu? Muppai lo iravai edu, perfect. Aa trick enti choodandi.
5. Maamuluga, AI ki edaina nerpiste, daani lopala unna prati number maarutundi. Maadi muppai aaru kotla numbers.
6. Pedda models lo vela kotla numbers untaayi. Vaatini train cheyyaalante, servers nindaa AI chips kaavaali.
7. Edu vandala kotla numbers unna model ki kuda, training ki vanda GB ki paigaa chip memory kaavaali.
8. LoRA trick: original ni freeze cheyyandi.
9. Daani meeda kotha numbers unna sannani strips atikinchandi, textbook lo sticky notes laaga. Vaatine train cheyyandi.
10. Maa test lo, adi kevalam okati point rendu percent numbers.
11. Kotha skill, separate chinna file ga save avutundi: Padihedu MB. Model emo edu vandala iravai naalugu MB.
12. Ippudu mee vantu. Mee shop lo dharalu prati vaaram maarutaayi.
13. A: ee vaaram price list meeda LoRA train cheyyadam. B: prati prashna tho paatu price list AI ki ivvadam. Edi correct?
14. B. LoRA paata dharalane gurtupettukuntundi.
15. Skills, style ki LoRA. Maare facts ni, prati saari AI ki ivvandi.
16. Oke model ki chaala skill files undochu: orders ki okati, mee shop tone ki okati, class notes nunchi quizzes ki okati. Second lo maarcheyochu.
17. Idi lab trick maatrame kaadu. Apple cheppindi, vaalla phone AI, okko feature ki okko chinna adapter vaadutundi ani.
18. Image AI lu, oka chinna file tho kotha drawing style nerchukuntaayi.
19. QLoRA ane daani cousin tho, researchers oka aravai aidu billion model ni, okka GPU meeda fine-tune chesaaru.
20. Anduke, edaina train chese mundu: mundu manchi prompt try cheyyandi. Maare facts? Prati saari ivvandi. Skill leda style? Oka chinna LoRA.
21. Taruvaati episode lo: mee documents lo sariaina page ni AI ela vetukutundo chooddam.
22. Miss avvakunda follow avvandi.

## Facts (checked 2026-10-16; quotes in the research notes)
- LoRA: Hu et al., Microsoft, arXiv 2106.09685 (ICLR 2022). "W0 is frozen and does not receive gradient updates, while A and
  B contain trainable parameters." GPT-3 175B: trainable parameters down 10,000x, GPU memory down 3x (1.2 TB -> 350 GB);
  checkpoint 350 GB -> 35 MB (r = 4, query/value only), still needs the base model. Merged: no extra inference latency.
- Full fine-tuning memory: ~16 bytes/parameter with mixed-precision Adam (ZeRO, Rajbhandari et al.); ~18 bytes/parameter
  (Hugging Face "GPU memory usage" docs), before activations -> a 7B model ~110-130 GB. PEFT README: bloomz-7b1 full
  fine-tune OOM on an A100 80 GB; LoRA 32 GB.
- QLoRA: Dettmers et al., arXiv 2305.14314 (May 2023): "finetune a 65B parameter model on a single 48GB GPU"; regular 16-bit
  fine-tuning of LLaMA 65B "requires more than 780 GB of GPU memory".
- Apple (machinelearning.apple.com, 10 Jun 2024): "Apple Intelligence includes a broad set of adapters, each fine-tuned for a
  specific feature"; LoRA adapters on the ~3B on-device model, "10s of megabytes" each (2025 update: rank-32 adapter toolkit,
  since retired for OS 27; say "Apple says", present tense only for how Apple Intelligence is built).
- Image LoRAs: Hugging Face (Jan 2023) "~3 MB ... about one thousand times smaller than the original size of the UNet";
  real files range from a few MB to hundreds of MB vs several GB for the model (e.g. Stability AI's SDXL example LoRA
  49.6 MB vs 6.94 GB). Style swatches only on screen (no real people or characters).
- Prompt -> context -> fine-tune: OpenAI "Optimizing LLM accuracy" (context for missing/out-of-date/proprietary knowledge;
  fine-tuning for format, tone, consistency; "additive, not exclusive"); Google Cloud tuning docs ("starting with
  prompting"); Microsoft Foundry ("doesn't replace retrieval for current information"); Apple ("try ... prompt engineering
  or tool calling" first).
- Honesty limits: our 360M model could also be fully fine-tuned on a CPU (16-18 bytes x 362M ~ 6-7 GB + activations), so the
  script never says our model needed a supercomputer; the supercomputer framing is for 7B+ and the QLoRA 65B example.
  LoRA doesn't always match full fine-tuning (Biderman et al., TMLR 2024: weaker on code and maths), so no "always as good".
- Demo model: SmolLM2-360M-Instruct, 361,821,120 parameters, Apache-2.0 (Allal et al., 2025).
