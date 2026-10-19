# EP34 "Rent a brain or own one?" (open vs closed models): script v2 (AI voices)

v1 -> v2 (script review: both viewers gone by 0:03, the rule didn't match the test): "rent" in the first 3 s (sticker
"HE DOESN'T OWN HIS AI. HE RENTS IT.", line 2 "You rent me"); "closed" said out loud; privacy set up in line 4; a
mid-size free brain added to the test (18/20) so owning isn't judged by toys alone; Ravi's guess fills the quiz (no
silent hold); the AI never has more than two lines in a row; a rule that matches the test, then a straight answer for
Ravi's bills; the ending stays with rent vs own ("So... renting again") and uses a checked price; Telugu less bookish,
-ండి kept, "medadu konandi" (heard as an insult) and "naa numbers" (heard as a phone number) gone.

Teaching skit in Ravi anna's shop (cast of skit 01 and EP33). The plot carries the topic:
- **Failure (frame 1):** Saturday rush, the shop AI goes silent: no internet, and he only rents it.
- **Mechanism:** a closed model lives on the company's computers, every order goes to them, you pay per question. An
  open model's numbers (the weights) are published: download it, run it on your own computer.
- **Demo:** our offline bill test, three free open models on a plain computer: 1, 9 and 18 bills right out of 20.
- **Rule:** rent = no computer, pay per question; own = data stays home, you buy the computer; test on twenty bills.
- **Twist:** the big free brains need a graphics card worth about ₹25 lakh; renting one is renting again.

Length goal about 70 s. Voices as EP33's published English: Ravi on Parler "Thoma", the shop AI on Fish (the narrator)
through the phone sound; Telugu on Parler (Ravi = Prakash, AI = Kiran).

## Our demo (real, run by us: `pipeline/ep34/bill_demo.py`, data in `series/scripts/ep34_demo/`)
Ravi's billing job: 20 WhatsApp orders ("anna 2 kg tomato, 1 dozen eggs pls") against a 15-line price board, totals
worked out in advance. Free open-weights models (Apache 2.0) from Hugging Face on 4 CPU cores, no graphics card, nothing
fetched from the internet during the test. Greedy decoding; the model may show its working; scored: the bill it gives
(the last number on its last "total" line), exact rupees.

| Model | Download | Bills right (of 20) | Seconds per bill |
|---|---|---|---|
| Qwen2.5-0.5B-Instruct (0.49 B numbers, 32-bit) | 1.0 GB | 1 | 1.4 |
| Qwen2.5-1.5B-Instruct (1.54 B numbers, 32-bit) | 3.1 GB | 9 | 14.3 |
| Qwen2.5-7B-Instruct, Qwen's 4-bit GGUF (q4_k_m) via llama.cpp | 4.7 GB | 18 | 15.0 |

How they went wrong: the 1 GB one blurts a total without adding (often "19"). The 3 GB one shows its working but adds
items nobody ordered ("1 kg rice, 1 kg toor dal, 2 milk packets" became tomato + onion + potato + rice + dal + milk = 363
instead of 258), reads "3 bath soaps" as 1, slips in sums. The 4.7 GB one missed two: "3 biscuits, 1 tea powder, 1 kg
sugar" (566 for 231) and "1 kg each tomato onion potato rice" (177 for 167).
Not tested: rented (closed) models; they can't run offline here, which is the point of the episode.
The first scorer read the first number on a total line ("Total: Rs 80 + Rs 78 = Rs 158" scored 80); re-scored from the
saved replies (`bill_demo.py --rescore`).

## Script (English)
Lines of 1-3 s; never more than two AI lines in a row; Ravi asks what the viewer would ask.

| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | AI! Ten customers waiting and you've gone SILENT?! | shop, wide: a queue at the counter; the phone on the counter: "No internet ✕"; Ravi slams the counter; big sticker from frame 1: "HE DOESN'T OWN HIS AI. HE RENTS IT."; tag "EP34 · AI From Scratch" |
| 2 | AI | No internet. You rent me, anna. My brain isn't here. | the phone: the AI's face, a crossed cloud, a "RENTED" tag |
| 3 | Ravi | Rent?! I rented this shop for twenty years. Then I bought it! | the shop board: "RAVI KIRANA · own shop since 2006" |
| 4 | AI | My brain sits on a company's computers. [1] Every order you type goes to them. [2] Closed model: you pay per question. | insert: the phone, a tower, a far-off building full of computers; on [1] an order bubble "2 kg tomato, 1 dozen eggs" flies to the building; on [2] a taxi meter "₹ per question" and a padlock "CLOSED: its numbers stay secret" |
| 5 | Ravi | Then I'll buy my own brain! | |
| 6 | AI | Some companies give theirs away: open models. [1] Even ChatGPT's maker. | insert OPEN MODELS: a brain made of numbers slides down into a laptop: "OPEN: the numbers are published, download them"; three chips: Llama · Meta, Gemma · Google, gpt-oss · OpenAI ("even ChatGPT's maker") |
| 7 | Ravi | Free?! | |
| 8 | AI | The brain is free. [1] The skull is sold separately. | a computer with a big price tag: "free to download ≠ free to run" |
| 9 | Ravi | Arey, can a free brain make my bills? | |
| 10 | AI | We tested three free ones. [1] Twenty WhatsApp orders, internet off, a plain computer. | OUR REAL TEST: a stack of WhatsApp orders, each with its right total ticked; Wi-Fi off; "4 cores, no graphics card" |
| 11 | Ravi | Eighteen! It's a computer! | quiz card: "How many bills right, out of 20? Your guess?"; Ravi's bubble "18" |
| 12 | AI | One gigabyte: one right. [1] Three gigabytes: nine. [2] It added tomatoes nobody ordered. | bars: "1 GB free brain 1/20", "3 GB free brain 9/20"; on [2] its real bill: tomato, onion, potato circled red: ₹363, right ₹258 |
| 13 | Ravi | And the biggest? | |
| 14 | AI | Five gigabytes: [1] eighteen. | the music drops out before [1]; "4.7 GB free brain 18/20" with a hit |
| 15 | Ravi | Eighteen! I said eighteen! | |
| 16 | AI | Fifteen seconds a bill. [1] Your queue is waiting. | a stopwatch "15 s a bill"; the queue grows |
| 17 | Ravi | Then you come into my laptop. | |
| 18 | AI | Rented brains don't do home delivery. | the padlock again: "CLOSED: you can't download it" |
| 19 | Ravi | So which one do I use?! | |
| 20 | AI | Rent: no computer, pay per question. [1] Own: your data stays home, you buy the computer. [2] Test on twenty bills. | RULE CARD (big, stays): RENT · no computer, pay per question / OWN · data stays home, buy the computer / TEST · 20 bills you know |
| 21 | AI | Your bills? Rent. [1] Net down? Calculator. | a calculator pops up next to the card |
| 22 | Ravi | I don't RENT! I'll own the biggest free brain! | Ravi opens a laptop |
| 23 | AI | The big ones need a twenty-five-lakh graphics card. | a graphics card with a price tag "about ₹25 lakh (80 GB, one H100)" |
| 24 | Ravi | Then I'll rent a big computer. | |
| 25 | AI | So... renting again. | the phone's "RENTED" tag again; loops to frame 1 |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | అరే ఏఐ, పది మంది కస్టమర్లు వెయిటింగ్, నువ్వు మాట్లాడవేంటి?! | Arey AI, padi mandi customers waiting, nuvvu maatlaadaventi?! |
| 2 | AI | ఇంటర్నెట్ లేదండి. మీరు నన్ను అద్దెకు తీసుకున్నారు. నా బ్రెయిన్ ఇక్కడ లేదు. | Internet ledandi. Meeru nannu addeku teesukunnaaru. Naa brain ikkada ledu. |
| 3 | Ravi | అద్దెకా?! ఇరవై ఏళ్లు ఈ షాప్ అద్దెకు ఉన్నా. తర్వాత కొనేశా! | Addekaa?! Iravai ellu ee shop addeku unnaa. Tarvaata konesaa! |
| 4 | AI | నా బ్రెయిన్ ఒక కంపెనీ కంప్యూటర్లలో ఉంటుందండి. [1] మీరు టైప్ చేసే ప్రతి ఆర్డర్ వాళ్ళకి వెళ్తుంది. [2] క్లోజ్డ్ మోడల్, క్వశ్చన్ కి ఇంత. | Naa brain oka company computerlalo untundandi. Meeru type chese prati order vaallaki veltundi. Closed model, question ki intha. |
| 5 | Ravi | అయితే నేనే సొంత బ్రెయిన్ కొంటా! | Ayite nene sontha brain kontaa! |
| 6 | AI | కొన్ని కంపెనీలు ఫ్రీగా ఇస్తాయండి, ఓపెన్ మోడల్స్. [1] చాట్‌జీపీటీ కంపెనీ కూడా. | Konni companylu freega istaayandi, open models. ChatGPT company kooda. |
| 7 | Ravi | ఫ్రీగా ఇస్తారా?! | Freega istaaraa?! |
| 8 | AI | సిమ్ ఫ్రీ అండి. [1] ఫోన్ మీరే కొనుక్కోవాలి. | SIM free andi. Phone meere konukkovaali. |
| 9 | Ravi | అరే, ఫ్రీ బ్రెయిన్ నా బిల్లులు వేస్తుందా? | Arey, free brain naa billulu vestundaa? |
| 10 | AI | మూడు ఫ్రీ బ్రెయిన్లు టెస్ట్ చేశామండి. [1] ఇరవై వాట్సాప్ ఆర్డర్లు, ఇంటర్నెట్ ఆఫ్. | Moodu free brainlu test chesaamandi. Iravai WhatsApp orders, internet off. |
| 11 | Ravi | పద్దెనిమిది! కంప్యూటర్ కదా! | Paddenimidi! Computer kadaa! |
| 12 | AI | వన్ జీబీ, ఒక్కటే. [1] త్రీ జీబీ, తొమ్మిది. [2] ఎవరూ అడగని టమాటాలు కూడా బిల్లులో వేసిందండి. | One GB, okkate. Three GB, tommidi. Evaroo adagani tamaatalu kooda billulo vesindandi. |
| 13 | Ravi | మరి పెద్దది? | Mari peddadi? |
| 14 | AI | ఫైవ్ జీబీ, [1] పద్దెనిమిది. | Five GB, paddenimidi. |
| 15 | Ravi | పద్దెనిమిది! నేను చెప్పానా! | Paddenimidi! Nenu cheppaanaa! |
| 16 | AI | ఒక్కో బిల్లుకి పదిహేను సెకన్లు. [1] మీ క్యూ వెయిటింగ్ అండి. | Okko billuki padihenu secondlu. Mee queue waiting andi. |
| 17 | Ravi | అయితే నువ్వే నా ల్యాప్‌టాప్ లోకి రా. | Ayite nuvve naa laptop loki raa. |
| 18 | AI | అద్దె బ్రెయిన్ కి హోమ్ డెలివరీ లేదండి. | Adde brain ki home delivery ledandi. |
| 19 | Ravi | మరి నేను ఏది వాడాలి?! | Mari nenu edi vaadaali?! |
| 20 | AI | అద్దెకైతే, కంప్యూటర్ అక్కర్లేదు, క్వశ్చన్ కి ఇంత. [1] సొంతమైతే, డేటా ఇంట్లోనే, కంప్యూటర్ మీదే. [2] ఇరవై బిల్లులతో టెస్ట్ చేయండి. | Addekaite, computer akkarledu, question ki intha. Sonthamaite, data intlone, computer meede. Iravai billulatho test cheyandi. |
| 21 | AI | మీ బిల్లులకి అద్దెదే. [1] నెట్ పోతే, కాలిక్యులేటర్. | Mee billulaki addede. Net pote, calculator. |
| 22 | Ravi | నేను అద్దెకు తీసుకోను! పెద్ద ఫ్రీ బ్రెయిన్ నే సొంతం చేసుకుంటా! | Nenu addeku teesukonu! Pedda free brain ne sontham chesukuntaa! |
| 23 | AI | పెద్దవాటికి పాతిక లక్షల గ్రాఫిక్స్ కార్డ్ కావాలండి. | Peddavaatiki paatika lakshala graphics card kaavaalandi. |
| 24 | Ravi | అయితే పెద్ద కంప్యూటర్ అద్దెకు తీసుకుంటా. | Ayite pedda computer addeku teesukuntaa. |
| 25 | AI | అంటే... మళ్ళీ అద్దెకేనండి. | Ante... malli addekenandi. |

## Sound
Hit on the slam in the first second; a lift into each insert (4, 6, 10); the bed dips while Ravi guesses and drops out
right before "eighteen" (14), with a hit on it; a sting after "tomatoes nobody ordered"; the bed rises under the rule
card; a riser into "So... renting again", which loops into the opening slam.

## Caption notes
Hook: "Ravi anna found out he doesn't own his shop AI. He rents it." Pinned comment: the three models, the method, the
two misses of the 18/20 one, what wasn't tested (rented models), the GPU price source. Next: EP35, model size and small
language models (how small can a brain get and still make the bills?).

## Facts and sources (checked 19 Oct 2026)
- Closed models are used through an app or an API and billed per token: OpenAI "Prices per 1M tokens"
  (developers.openai.com/api/docs/pricing); Google Gemini API "per 1M tokens in USD" (ai.google.dev/gemini-api/docs/pricing,
  updated 2026-10-16); Anthropic "MTok: Million tokens" (platform.claude.com/docs/en/about-claude/pricing). They run on the
  company's or its cloud partners' servers, and the weights are not released.
- Open-weights models: OpenAI's gpt-oss (Aug 2025, "Permissive Apache 2.0 license", github.com/openai/gpt-oss;
  openai.com/index/introducing-gpt-oss: gpt-oss-120b "running efficiently on a single 80 GB GPU", gpt-oss-20b "can run on
  edge devices with just 16 GB of memory"; The Register, 5 Aug 2025). Google Gemma ("our most capable open models",
  deepmind.google/models/gemma); Meta's Llama models (Meta's newest flagships are proprietary, so "Meta's Llama", not
  "Meta"); Mistral ("open-weight and commercial", docs.mistral.ai); DeepSeek (MIT on Hugging Face).
- Open weights ≠ open source: OSI Open Source AI Definition 1.0 (28 Oct 2024) asks for data information, code and
  parameters (opensource.org/ai/open-source-ai-definition). Llama 3.1 Community License: over 700 million monthly active
  users "you must request a license from Meta" (github.com/meta-llama/llama-models, models/llama3_1/LICENSE).
- Qwen2.5 0.5B, 1.5B and 7B Instruct: Apache 2.0 (Hugging Face cards; Qwen blog 19 Sep 2024: "except for the 3B and 72B
  variants").
- Free to run models locally: Ollama ("Run models locally", ollama.com/pricing), LM Studio ("Run local LLMs on your
  machine", lmstudio.ai/pricing). Both also sell paid cloud plans.
- Memory: about 2 bytes per number at 16-bit: "Llama-2-70b requires 2 * 70 GB = 140 GB VRAM" (Hugging Face docs,
  huggingface.co/docs/transformers/llm_tutorial_optimization).
- 80 GB graphics card price: H100 "around $25,000 apiece" (Tom's Hardware, 15 Feb 2025); "$25,000 and $40,000 per chip,
  according to analyst estimates" (CNBC, 19 Mar 2024). About ₹95 per dollar (ECB rates, 16 Oct 2026): about ₹24 lakh or
  more, "about ₹25 lakh". Renting one: about $2.80 per GPU-hour on a one-year contract (Tom's Hardware, 5 Oct 2026,
  citing SemiAnalysis), about ₹265 an hour.
- Leaderboards (for the pinned comment only): on LMArena's text board (15 Oct 2026) the 17 models above the best open one
  are all closed; Epoch AI (29 May 2026): open models "lagged frontier closed models by an average of four months".
