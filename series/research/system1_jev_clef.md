# Research: System 1 vs System 2 models, Jev vs Clef-flash, Jev use cases

Researched 2026-10-03. Rules applied: a fact is marked **VERIFIED** when it comes from the company's own page/docs/blog or from 2+ reputable outlets. **VENDOR CLAIM** means verified as what the company says, but nobody has independently reproduced it. **UNVERIFIED** means a single non-primary source, or sources that disagree.

---

## 0. Corrections to the background notes (please read first)

| Background note | What the sources actually say | Status |
|---|---|---|
| Jev launched ~Sep 15 2026 with a $40M seed | Launch post dated Sep 15. $40M seed led by DCVC at about $200M valuation. Founder/CEO Diogo Almeida (ex-OpenAI, InstructGPT co-author). Sources: https://www.heise.de/en/news/AI-model-Jev-to-make-machines-decide-faster-11457071.html , https://www.forbes.com/sites/the-prompt/2026/09/15/this-200-million-startup-wants-to-fix-ais-overconfidence-problem/ , https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative | VERIFIED |
| Latency 70-500 ms | TypeSafe launch post: "End-to-end response time is 70ms-500ms for TypeSafe", "40x-200x faster" than frontier LLMs on System One queries. https://typesafe.ai/blog/introducing-system-one-models-and-jev ; heise repeats it. | VENDOR CLAIM |
| $0.042 per 1M input tokens | TypeSafe Models doc: "$42 / $0.042" per Btok / per Mtok, output tokens free. https://docs.typesafe.ai/models.md ; same on Cloudflare's Jev page https://developers.cloudflare.com/ai/models/typesafe/jev/ | VERIFIED |
| "~1/200 of frontier cost" | TypeSafe never says exactly 1/200. What it does say: "two orders of magnitude faster and more efficient" (launch post); "193.6x Faster, 444.6x Cheaper" on its own workflow evals, which it calls "on the higher end of real world gains"; and "238x Lower input price than Claude Fable 5.1" (https://typesafe.ai). **Use "about 200x cheaper per input token than a frontier model (TypeSafe's claim)", or quote 238x / 444.6x exactly.** | Say it carefully |
| Jev context 32k (Cloudflare blog says this) | TypeSafe's own doc says "64k tokens per request; 32k tokens for `state` plus the longest question". Cloudflare's "32k" is the narrower of the two limits. https://docs.typesafe.ai/models.md | Sources disagree. Use TypeSafe's wording |
| Clef-flash median 38.8 ms vs Jev 524.1 ms | Correct as Cloudflare's own numbers. But Jev's 524 ms is a round trip over the internet to TypeSafe's API, while Clef ran on Cloudflare's own servers (see B.3). An independent tester measured Clef-flash at 191-205 ms median from Italy. | VENDOR CLAIM, not like-for-like |
| Rate limit 40 req/s (eesel.ai blog) | TypeSafe doc now says "100K tokens per second / 80 requests per second" and warns that limits "can change without notice". https://docs.typesafe.ai/models.md | Use 80 (as of the doc today) |
| towardsdatascience.com Jev article | The page came back empty when fetched, so nothing could be re-checked. Do not cite it on its own. | UNVERIFIED |

---

## A) SYSTEM 1 vs SYSTEM 2 MODELS

### A.1 Origin (Kahneman)
- Daniel Kahneman's book *Thinking, Fast and Slow* (2011) describes two modes of thought. **System 1** is fast, automatic, intuitive and effortless. **System 2** is slow, deliberate, effortful and logical. Sources: The Decision Lab https://thedecisionlab.com/reference-guide/philosophy/system-1-and-system-2-thinking ; World Economic Forum https://www.weforum.org/stories/2024/03/what-we-learned-from-nobel-winner-daniel-kahneman/ ; PhilPapers record of the book https://philpapers.org/rec/KAHTFA-2 . **VERIFIED**
- Kahneman won the 2002 Nobel Memorial Prize in Economic Sciences "for having integrated insights from psychological research into economic science, especially concerning human judgment and decision-making under uncertainty". He died in March 2024 (WEF piece above). **VERIFIED** (WEF + The Decision Lab)
- Caution for the script: a figure like "System 1 handles 96% of decisions" turns up in summaries, but it is **not** from Kahneman. **UNVERIFIED. Do not use.**
- Easy examples from Kahneman's own material (via The Decision Lab): System 1 = 2+2, reading a big word on a billboard, detecting anger in a voice. System 2 = 17x24, filling out a tax form, parking in a tight spot.

### A.2 How the AI industry uses the terms in 2026 (exact quotes)

**TypeSafe (the company itself) does call Jev a "System One model":**
- "Jev is TypeSafe's flagship model and the first System One model." https://docs.typesafe.ai/concepts/system-one.md
- "The System One name comes from the concept Daniel Kahneman popularized in his book *Thinking, Fast and Slow*. System 1 thinking is fast and intuitive. System 2 is slower and more deliberate. Here, the emphasis is on fast, focused judgments." (same page)
- Launch post FAQ: "The model class name draws on the distinction between fast, intuitive System 1 thinking and slow, deliberate System 2 reasoning. 'System 1 thinking' has also implied error-prone. For reasons we will get into in the future, we believe System One Models can be made more reliable than its alternatives." https://typesafe.ai/blog/introducing-system-one-models-and-jev
- TypeSafe uses the "System Two" label for what Jev should NOT do: "System Two tasks: more layers of indirections" (in its "avoid the following" list). https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
- The API endpoint itself is named `POST /v1/systemone`. https://docs.typesafe.ai/models.md
- Spelling note: TypeSafe writes "System One" for its product category and "System 1/System 2" when it talks about Kahneman.

**Cloudflare** uses the phrase only when describing Jev, not for Clef: "decision models such as Typesafe AI's Jev System One model" https://blog.cloudflare.com/clef-decision-models/ . Its Hugging Face model cards carry the tag `systemone` and say "The Clef-Flash API is fully compatible with Jev and SystemOne." https://huggingface.co/Cloudflare/clef-flash . Cloudflare never says "System 2". It contrasts decision models with LLMs that are "open-ended enough to reason and generate text".

**AWS (Strands Decider 2B)**: the model card never uses the words "System 1" or "System 2". It serves the Jev-compatible `/v1/systemone` endpoint and describes itself as handling "the rote decisions of a hybrid agent that leaves the hard ones to an LLM." https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19

**Press: the explicit "decision = System 1, reasoning model = System 2" framing appears in TechTarget (Sep 2026):**
- "Almeida described Jev as a System 1 model in a Sept. 15 blog post, borrowing a cognitive processing concept from Daniel Kahneman's book"
- "By contrast, large general-purpose reasoning models are System 2, which are more verbose and non-deterministic."
- Ned Bellavance (an outside educator, not TypeSafe): "Is this shirt blue? Is the pasta cooked? Am I on fire?" for System 1, and "System 2 decisions are deliberate and thoughtful ... What's the best way to approach this situation?"
- "Jev is going to be faster and probably better at those System 1-type decisions that appear in automation and programming."
- Source: https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative
- Note that this mapping comes from TechTarget and the analyst it quotes, not from TypeSafe's own docs.

**OpenAI and reasoning models as "System 2" (from before 2026):**
- OpenAI researcher Noam Brown, TED AI talk (VentureBeat, Oct 23 2024): "Brown's talk comes shortly after the release of OpenAI's o1 series models, which introduce system two thinking into AI." Brown: "We're no longer constrained to just scaling up the system one training. Now we can scale up the system two thinking as well." https://venturebeat.com/ai/openai-noam-brown-stuns-ted-ai-conference-20-seconds-of-thinking-worth-100000x-more-data
- Academic survey "From System 1 to System 2: A Survey of Reasoning Large Language Models" (arXiv 2502.17419): "reasoning LLMs like OpenAI's o1/o3 and DeepSeek's R1 ... closely mimicking the deliberate reasoning of System 2". https://arxiv.org/abs/2502.17419
- I found **no** official OpenAI product page that calls o-series or "thinking" models "System 2". The framing comes from an OpenAI researcher's talk (VentureBeat) and from academic papers. OpenAI's own decision product (Decisions API, Sep 29 2026) has **no** official OpenAI page I could verify. Press reports exist (https://cryptobriefing.com/openai-decisions-api-gpt-6-luna/ , https://thenewstack.io/openai-decision-api-luna/ ) but I found no "System 1" wording from OpenAI. **UNVERIFIED for any System-1 quote from OpenAI.**

**Bottom line for the script:** It is accurate to say "TypeSafe calls Jev a 'System One' model, named after Kahneman's fast thinking, and reasoning models like OpenAI's o-series are often described as 'System 2' (OpenAI's Noam Brown used the phrase 'system two thinking' about o1)." It is *not* accurate to say Cloudflare or AWS brand their models "System 1".

### A.3 System-1 vs System-2 tasks with AI model examples

| # | System 1 task (one fast decision) | Model example + source | System 2 task (multi-step) | Model example + source |
|---|---|---|---|---|
| 1 | Route a support ticket: billing, technical or sales? Is it urgent? | Jev/Clef example request in Cloudflare's blog (urgent = noul, team = choice, severity = score) https://blog.cloudflare.com/clef-decision-models/ ; TypeSafe table "Which team should handle this ticket?" https://docs.typesafe.ai/concepts/system-one.md | Solve a math word problem | OpenAI o1/o3, DeepSeek-R1 "expert-level performance in fields such as mathematics and coding" https://arxiv.org/abs/2502.17419 . TypeSafe itself: "Jev is not a calculator ... Keep the arithmetic in code" https://docs.typesafe.ai/model-jaggedness/jev-1.13.md |
| 2 | Is this message toxic or spam? (moderation / guardrail) | Jev "Guardrails for LLMs" cookbook https://docs.typesafe.ai/llms.txt ; an HN user runs Jev as the first pass and sends unsure cases to a bigger LLM https://news.ycombinator.com/item?id=49923692 | Write or fix code | Jev "does not generate text, write code, or hold a conversation" https://docs.typesafe.ai/introduction/coding-agents.md . That is a job for LLM coding agents. |
| 3 | Which AI model should handle this prompt? (model routing) | Jev docs "Model routing"; Strands Decider "model routing, tool selection" https://docs.typesafe.ai/concepts/use-case-map.md , https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19 | Plan a multi-hop answer / follow chains of facts | Jev docs: tasks "that require multiple hops of reasoning cost accuracy"; AWS card: "Long, multi-step documents are the weak spot" (same URLs) |
| 4 | Game move every frame: left, right or shoot? | Jev plays Doom at "10 queries a second (which ends up costing ~$7/hour)" https://typesafe.ai/blog/introducing-system-one-models-and-jev | Graduate-level science reasoning (GPQA Diamond) | Cloudflare's own table: Jev 78.3, Clef 48.0, Clef-flash 51.0. Even among decision models, reasoning-heavy benchmarks separate them. https://huggingface.co/Cloudflare/clef-flash |
| 5 | Is this website phishing or a shop? | Cloudflare threat-intel: Clef said "95% chance it is a fashion website, 85% ecommerce, <1% phishing" https://blog.cloudflare.com/clef-decision-models/ | Compare dates or do date arithmetic | Jev docs: "Asking which of two dates comes first, how far apart they are ... is unreliable" https://docs.typesafe.ai/model-jaggedness/jev-1.13.md |
| 6 | Is this email important? (triage) | Demo "500 emails for 3.5 cents" (builder's claim) https://x.com/rileybrown/status/2100404532119269426 | Write a reply, summary or essay | Jev launch post: "Jev gives up string generation" https://typesafe.ai/blog/introducing-system-one-models-and-jev |

### A.4 Published latency/cost contrasts: decision model vs reasoning/LLM
- **TypeSafe home page (VENDOR CLAIM):** on its workflow evals, TypeSafe "Cost $0.000081, Completed in 0.114s" vs LLMs "Cost $0.013880, Completed in 8.566s", which it rounds to "193.6x Faster, 444.6x Cheaper". https://typesafe.ai . The launch post adds that this is "on the higher end of real world gains" and that the reference answers came from GPT-6 Astra and Fable 5.1. https://typesafe.ai/blog/introducing-system-one-models-and-jev
- **TypeSafe launch post (VENDOR CLAIM):** frontier models take "3 to 329 seconds" end to end, TypeSafe takes "70ms-500ms". The side-by-side demo compared against "GPT-5.6 Terra with default reasoning". Frontier input tokens cost "$0.20 to $10 / MTok", with output "~5x more expensive". Jev: $0.042/MTok input, output free. (same URL)
- **Cloudflare (VENDOR CLAIM):** a domain-classification workflow took Clef 2.2 s vs 4.7 s for "our fastest general LLM gpt-oss-120b", and the LLM "only returned two classifications". https://blog.cloudflare.com/clef-decision-models/
- **OpenAI Decisions API (press only, UNVERIFIED with OpenAI):** about 150 ms vs about 1.6 s for a normal GPT-6 Luna call. https://cryptobriefing.com/openai-decisions-api-gpt-6-luna/ , https://pasqualepillitteri.it/en/news/19372/openai-decisions-api-jev
- **Analyst (TechTarget):** Torsten Volk (Omdia) says Jev runs decision loops "10 times per second, while a traditional LLM would need multiple seconds". https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative

---

## B) JEV vs CLEF-FLASH comparison

### B.1 Table

| Attribute | Jev (TypeSafe, jev-1.13) | Clef-flash (Cloudflare) | Source |
|---|---|---|---|
| Launch | Sep 15 2026 (early access) | Oct 1 2026 | TypeSafe blog; Cloudflare blog |
| Price, input | **$0.042 / 1M tokens** ($42 per billion) | **$0.09 / 1M tokens** on Workers AI (8,182 neurons per M). That is about 2.1x Jev's price. (Big Clef: $0.24/M, about 5.7x Jev.) | https://docs.typesafe.ai/models.md ; https://developers.cloudflare.com/workers-ai/platform/pricing/ ; https://developers.cloudflare.com/workers-ai/models/clef-flash/ |
| Price, output | Free ($0.00) | No output price listed; only input is billed | same |
| Cached input | $0.00 (Cloudflare listing of Jev) | not listed | https://developers.cloudflare.com/ai/models/typesafe/jev/ |
| Free tier | No permanent free tier found. Vercel AI Gateway offered it free "until Sept 25" (now over) | Workers AI free allocation: 10,000 neurons/day on Free and Paid plans. By my arithmetic that is about 1.2M Clef-flash input tokens per day. Clef is not in the "requires paid billing" list. | TechTarget; https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| Self-hosting | Not possible (closed weights, hosted API only) | Free download under Apache 2.0. Model card: "Tested ... on a single H200". Claims it runs on "one consumer GPU" are from a third-party blog only (**UNVERIFIED**). No published $/hour cost for self-hosting. | https://huggingface.co/Cloudflare/clef-flash ; https://www.digitalapplied.com/blog/open-decision-models-compared-clef-decider-jev |
| Latency (vendor) | TypeSafe: "70ms-500ms" end to end | Cloudflare: median 38.8 ms, p95 122.4 ms across its 43 evals | TypeSafe blog; Cloudflare blog |
| Latency (Cloudflare's test of Jev) | median 524.1 ms, p95 536.0 ms. This was measured over the internet to TypeSafe's API, so it is not like-for-like. | 38.8 ms (on Cloudflare's own servers) | https://blog.cloudflare.com/clef-decision-models/ ; caveat from https://flaviocopes.com/clef/ |
| Latency (independent) | None found | Flavio Copes, Oct 1 2026, from Italy over the REST API: median **191-205 ms**, slowest 676 ms (includes the network trip). Big Clef: 524-726 ms median. | https://flaviocopes.com/clef/ (single independent source) |
| Model size | Not disclosed | 9B parameters (post-trained from Qwen3.5-9B) | https://huggingface.co/Cloudflare/clef-flash |
| Open vs closed | Closed, proprietary | Open weights, Apache 2.0. (An HN commenter points out it is open *weights*, not fully open source, because the training data and pipeline are not published.) | HF; https://news.ycombinator.com/item?id=49923692 |
| Where it runs | TypeSafe API (`api.typesafe.ai/v1/systemone`), also listed on Cloudflare Workers AI as a third-party model and on OpenRouter | Cloudflare Workers AI (`@cf/cloudflare/clef-flash`), or self-hosted from Hugging Face | https://docs.typesafe.ai/models.md ; https://developers.cloudflare.com/ai/models/typesafe/jev/ ; https://openrouter.ai/typesafe/jev-1.13 |
| On-device | No | Only if you have a big enough GPU (9B). For laptop CPU use, AWS Strands Decider 2B is the on-device option. | AWS card |
| Context length | "64k tokens per request; 32k tokens for state plus the longest question" | 65,536 tokens | TypeSafe Models doc; Cloudflare model page |
| Inputs | Text only ("No image, audio, or video input") | Text, JSON, **images** (up to 4 per request, 4 MiB each); the card also mentions video | TypeSafe doc; Cloudflare model page |
| Question / label limits | Choice "cardinality up to 255" options. Max questions per request not published. | 1-64 questions per request. Max options per question not published. | TypeSafe launch post; Cloudflare model page |
| Question types | Choice, Score, Noul (yes/no probability) | Same three (fully Jev-API compatible) | both |
| Languages | "English is the primary training language and where accuracy is currently best. Other languages, including CJK scripts, are handled but not equally well" | Not stated | https://docs.typesafe.ai/models.md |
| Calibration | Trained with RLCD so probabilities match real hit rates (TypeSafe claim) | Brier-loss and RLCD-style post-training (Cloudflare claim). ForecastBench Brier score, lower is better: Clef-flash 10.6 vs Jev 17.4 | Cloudflare blog; HF card |
| Licence | Proprietary (TypeSafe Terms of Use) | Apache 2.0 | — |
| Rate limits | 100K tokens/s, 80 requests/s, "can change without notice" | Workers AI account limits (not checked per model) | TypeSafe doc |

### B.2 Accuracy/quality (all benchmark numbers below are VENDOR-RUN)

**Cloudflare's Decision Index 0.2.1 run** (41 quality benchmarks + 2 latency rows = the "43 evals"). Full table: https://huggingface.co/Cloudflare/clef-flash (also https://blog.cloudflare.com/clef-decision-models/ ).
- My count from that table: **Clef-flash beats Jev on 24, loses on 16 and ties on 1** of the 41 quality rows. Big Clef beats Jev on 26 and loses on 15.
- Where Clef-flash wins clearly: Home appliance simulator 97.7 vs 52.3; CLadder 97.7 vs 72.6; Habermas Machine 71.8 vs 45.9; BANKING77 90.9 vs 79.7; FinEntity 97.1 vs 87.0; MuSR 86.0 vs 66.1; BFCL 98.8 vs 95.8.
- Where Jev wins clearly (the harder reasoning tests): GPQA Diamond 78.3 vs 51.0; BBH 92.9 vs 68.9; MMLU-Pro 82.7 vs 65.3; RAGTruth 76.5 vs 35.6; CLINC150+OOS 89.3 vs 66.8; When2Call 81.0 vs 65.6.
- Roughly equal: MMLU 91.8 vs 91.7; ARC-Challenge 98.3 vs 97.8; RouterBench 79.9 vs 79.9.

**TypeSafe's own workflow evals** (https://evals.typesafe.ai/ , run by Cloudflare and reported on the HF card): Invoice processing (exact) Clef-flash 57.1 / Jev 61.8; Customer service 77.0 / 76.0; Security incidents 61.7 / 61.7; Agent trace observability 69.8 / 71.6. So Clef-flash wins 1, ties 1 and loses 2 against Jev. The blog's "beating Jev in 3 out of 4 areas" refers to **big Clef**, not Clef-flash.

**TypeSafe** has published no standard public benchmark scores for Jev. Flavio Copes notes "TypeSafe also chose not to publish public benchmark results for Jev" (https://flaviocopes.com/clef/ , **UNVERIFIED** second source).

### B.3 Who ran what, and caveats
- Every Clef vs Jev number comes from Cloudflare. Flavio Copes reports that the Decision Index maintainers say Clef's results are self-reported and not reproduced, and that the latency numbers are not comparable, because Jev's 524 ms is "a round trip from Cloudflare's lab to TypeSafe's hosted API over the internet". https://flaviocopes.com/clef/ (single source)
- Digital Applied's comparison (Oct 3 2026) says plainly: "No benchmark was reproduced." https://www.digitalapplied.com/blog/open-decision-models-compared-clef-decider-jev
- The Decision Index is a community Hugging Face Space ("70 open reproductions of TypeSafe Jev's 'Decision Model'", HN post Oct 2 2026): https://huggingface.co/spaces/multimodalart/jev-decision-index . I could not read its leaderboard (it renders with JavaScript).

### B.4 Independent reactions after Clef launched (Oct 1-3 2026)
- **Hacker News**: the Clef thread had 622 points and 215 comments (via HN Algolia API). https://news.ycombinator.com/item?id=49923692 . Notable comments:
  - A user who runs Jev for chat moderation: "Clef was 2-3x slower and worse (it caught less hate speech) than Jev." One person's anecdote.
  - Cost math from a commenter: at 300 tokens per call, 1M decisions costs about $12.60 on Jev vs about $72 on Clef (big Clef, $0.24). Checked: 300 x 1M = 300M tokens, so 300 x $0.042 = $12.60 and 300 x $0.24 = $72. For Clef-flash the same math gives 300 x $0.09 = $27.
  - "Open weights, not open source."
- **Flavio Copes blog** (independent hands-on test, Oct 1): "start with Clef-flash and move a question to Clef only when your labeled examples show Flash getting it wrong". https://flaviocopes.com/clef/
- **Digital Applied** (Oct 3): compares Clef, Strands Decider 2B and Jev, and repeats that all benchmarks are vendor-run. https://www.digitalapplied.com/blog/open-decision-models-compared-clef-decider-jev
- **Context, competitors in 3 weeks:** OpenAI Decisions API (Sep 29, limited preview), AWS Strands Decider 2B (Oct 1, Apache 2.0, about 2B params on Qwen3.5-2B, LoRA plus a small readout head; https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19 ), Cloudflare Clef (Oct 1). Decider latency is press-reported only, and the outlets disagree: "about 115 ms" (https://www.marktechpost.com/2026/10/01/aws-strands-labs-releases-strands-decider-2b/ headline; Digital Applied: about 115 ms on an RTX 3090, about 153 ms on an M3 MacBook) vs "106 ms median on RTX 3090" (pasqualepillitteri.it). **UNVERIFIED exact number.** Arize's Laurie Voss in TechTarget: "Jev specifically is going to find it doesn't have that much of a moat."

---

## C) JEV USE CASES

### C.1 Ranked by popularity evidence
Main evidence: the community list https://github.com/walidboulanouar/awesome-jev-use-cases (CC0, unofficial, sponsored by AY Automate). It tracks 74 demo posts with 127,162 combined likes (snapshot 2026-09-19). Its main list has 38 open-source repos with 53,259 combined stars (refreshed 2026-09-26). Like counts come from X posts and were not independently re-checked (X needs login). I could not read the list's own star count (the GitHub API was blocked in this session).

| Rank | Demo (likes on X, per list) | One line | Why a decision model fits | Source |
|---|---|---|---|---|
| 1 | Instant compaction for Claude (10,435) | Claude Code plugin that uses Jev to decide what conversation context to keep or drop, instantly | Many keep/drop judgments, needs to be fast and cheap | https://x.com/tamarajtran/status/2100694549362553153 |
| 2 | Flight search with Browser Use (8,723) | Browser agent that uses Jev to choose actions and options while searching flights | Each step is a choice from a list; speed adds up across many steps | https://x.com/gregpr07/status/2100411066966749359 |
| 3 | Real-time slop detector as you scroll (7,180) | Scores each post in your feed as AI "slop" or not while you scroll | Has to keep up with scrolling; score + yes/no | https://x.com/RBilgil/status/2100976648552169805 |
| 4 | 724 competitor ads broken down (6,348) | Classifies hundreds of competitor ads by type and angle | Bulk classification at very low cost | https://x.com/TheMattBerman/status/2100654891756589230 |
| 5 | Voice-controlled computer use on a Mac (5,016) | Voice commands are mapped to computer actions | Picking the intent/action is a choice; low latency matters for voice | https://x.com/instantricecook/status/2100814590300889426 |
| 6 | jev-trader (4,913 likes; repo 2,461 stars) | "Trading bot that asks Jev for a buy or sell decision each Monad block" | One typed decision per block, every block | https://x.com/jarrodwatts/status/2100356151468585346 , https://github.com/jarrodwatts/jev-trader |
| 7 | Jev plays Doom (4,890) | Bot plays Doom from text game state at 10 queries/s (about $7/hour, per TypeSafe) | Real-time, one move per tick | https://x.com/CompleteSkeptic/status/2099925687465570372 ; https://typesafe.ai/blog/introducing-system-one-models-and-jev |
| 8 | Canvas controlled by pointing and speaking (4,797) | Gesture plus voice drawing interface | Real-time intent picking | https://x.com/jackcheng/status/2100729670991802386 |
| 9 | Jev plays Subway Surfers (3,956) | Game bot | Real-time | https://x.com/_MaxBlade/status/2100634359099232678 |
| 10 | Real-time ad blocker (3,872) | Decides whether page content is an ad, live | One yes/no per element, has to be fast | https://x.com/iam_zachi/status/2100529273186472318 |
| 11 | 500 emails for 3.5 cents (3,853) | Email triage at almost no cost | Bulk classification, very cheap | https://x.com/rileybrown/status/2100404532119269426 |
| 13 | Triage across 1,500 emails (3,538) | Inbox triage | same | https://x.com/ryanvogel/status/2100042788851101842 |
| 14 | 700 leads scored in 40 seconds (3,138) | Lead scoring | Score type, done in parallel | https://x.com/romanbuildsaas/status/2100891604735099103 |
| 20 | 1kpapers | "8 cents to classify 1,018 papers, 256 ms median end-to-end per paper" (builder's claim) | Bulk research classification | https://x.com/nutlope/status/2100426999546184123 |
| 21 | Model router on Jev (1,858) | Picks which LLM should answer each prompt | Routing costs less than the call it routes | https://x.com/ephraimduncan/status/2100454070536351824 |

Notes: the one-line descriptions for ranks 1-5 and 8-14 are my summaries of the demo titles. The list itself gives only titles, authors and counts. Check each X post before quoting specifics. The list notes that "None of them generates text with Jev" for the top four.

**By area (count of demos, from the list):** Content and growth 18, Apps and tools 17, Agents and computer use 14, Triage and routing 9, Games and real time 7, Research and data 7, Trading and markets 2.

### C.2 Officially documented use cases (TypeSafe docs, Cloudflare, press)
- **TypeSafe docs** list support ticket routing, LLM guardrails (jailbreak and prompt-injection detection), model routing, RAG passage filtering and re-ranking, citation checking, moderation, insurance claims, financial crime, recruiting, lead scoring, e-commerce listings, advertising brand safety, gaming chat moderation, and semantic code linting. https://docs.typesafe.ai/concepts/use-case-map.md . Cookbook examples include re-ranking legal search, which lifts top-1 accuracy "from 5% to 18%" (https://docs.typesafe.ai/llms.txt ), and batching 13 questions in one call, "12.2x cheaper and 10.0x faster".
- **TypeSafe launch post**: "smart if-statements", "Map-reducing over big data", "Real-time applications. 100ms speeds", and "Verify everything" (judge and guardrail LLM outputs). Official demos: Doom and Wikiracing. https://typesafe.ai/blog/introducing-system-one-models-and-jev
- **heise**: customer service routing, AI agent tool selection, content moderation security checks. https://www.heise.de/en/news/AI-model-Jev-to-make-machines-decide-faster-11457071.html
- **TechTarget**: customer service, content analysis, edge sensor data, gaming apps, guardrails. https://www.techtarget.com/it-infrastructure/news/366650696/Jev-decision-model-touted-as-quicker-cheaper-LLM-alternative
- **Cloudflare (Clef)**: domain/threat classification, Trust & Safety review, support triage, good-bot vs bad-bot. https://blog.cloudflare.com/clef-decision-models/
- **Adoption signal:** Vercel reported that about 13% of AI Gateway paid teams used Jev within 24 hours, "twice as many teams as any previous model launch". Jev was free on the gateway at the time. Vercel's claim as reported by TechTarget (URL above) and aiweekly https://aiweekly.co/alerts/typesafes-jev-hits-13-of-vercel-paid-teams-in-24-hours .

### C.3 When NOT to use a System 1 / decision model
From TypeSafe's own "Jev 1.13 jaggedness" page (https://docs.typesafe.ai/model-jaggedness/jev-1.13.md , last reviewed 2026-10-02) unless noted:
1. **Generating text** (replies, summaries, code): "jev-1.13 is not trained to generate text ... If you really need to generate text... there are other models for that." See also https://docs.typesafe.ai/introduction/coding-agents.md ("not a drop-in replacement for the LLM behind Claude Code, Cursor...").
2. **Math and counting**: "Jev is not a calculator"; "does not count reliably".
3. **Date/time comparison**: "unreliable". Extract the dates with the model, then compare them in code.
4. **Multi-hop reasoning / indirection**: "A question about a property of a property or something that requires multiple hops of reasoning costs accuracy." The page's reminder list includes "System Two tasks".
5. **Huge, noisy context**: "Accuracy falls as the state grows with content unrelated to the decision."
6. **Adversarial input**: injected instructions "can move the answer."
7. **Need for explanations**: "the model does not provide a detailed linguistic explanation for its decisions" (heise).
8. **Need for fully deterministic output**: "if you need a deterministic flow, Jev is not going to give you that" (TechTarget, analyst quote).
9. **Non-English workloads**: accuracy is best in English (https://docs.typesafe.ai/models.md ). This matters for a Telugu audience: Jev's accuracy on Telugu text is not published.
10. **Images** (Jev only): text-only; Clef handles images.
11. AWS's card states a similar limit: "Long, multi-step documents are the weak spot".

Pattern recommended by vendors: decision model first, then escalate low-confidence cases to a person or a reasoning model ("decide when to act and when to escalate to a person or a reasoning model", https://docs.typesafe.ai/concepts/system-one.md ).
