# AI Maastaaru: content syllabus

Goal: teach every AI fundamental first, then use those fundamentals to explain real products,
brand-new technology and daily news. A viewer who follows from Episode 1 can understand any AI
headline.

Four tracks run on the page:

| Track | Label on screen | Length | Purpose |
|---|---|---|---|
| **1. AI From Scratch** | `EP 12` | 2–3 min | The fundamentals course, in order. Topics too big for 3 min become Part 1/2/3. |
| **2. Real World AI** | `USE CASE 01` | 2–3 min | How a real product works, end to end, built from the fundamentals. |
| **3. New in AI** | `NEW IN AI` | 1.5–3 min | A new model, tool or technique, with links to the fundamentals it builds on. |
| **4. AI News** | `AI NEWS · <date>` | 60–90 s | Daily roundup of 3–5 verified stories with why each one matters. |

Suggested weekly rhythm once all four run: 4 fundamentals, 2 use cases, 1 "New in AI", and news
daily (news can start as 3x a week). Track 1 always keeps moving, so the foundation stays ahead
of the use cases.

---

## Track 1: AI From Scratch (fundamentals)

### Season 1: Foundations (done)
| EP | Topic |
|---|---|
| 01 | AI vs ML vs Deep Learning vs GenAI |
| 02 | What is an LLM |
| 03 | Tokens & context window |
| 04 | Prompt engineering |
| 05 | Temperature & hallucinations |
| 06 | Embeddings & vector search |

### Season 2: Building with AI
| EP | Topic | Status |
|---|---|---|
| 07 | RAG | done |
| 08 | Prompting vs RAG vs fine-tuning | done |
| 09 | Tool use / function calling | done |
| 10 | AI agents | done |
| 11 | MCP (Model Context Protocol) | done |
| 12 | Multimodal AI: how AI sees, hears and speaks | next |
| 13 | Speech AI: speech-to-text and text-to-speech | |
| 14 | Image generation, Part 1: how diffusion turns noise into pictures | |
| 15 | Image & video generation, Part 2: video models and prompting for visuals | |
| 16 | Reasoning models: when AI "thinks" before answering | |
| 17 | Memory & context engineering: how assistants remember you | |
| 18 | Multi-agent systems: teams of AI agents | |
| 19 | AI coding assistants: how they read and write code | |
| 20 | AI security: prompt injection and jailbreaks | |

### Season 3: How AI learns (the engine room)
| EP | Topic |
|---|---|
| 21 | How a neural network learns, Part 1: neurons, weights and biases |
| 22 | Part 2: loss and gradient descent (a ball rolling downhill) |
| 23 | Part 3: backpropagation, explained without maths |
| 24 | Supervised vs unsupervised vs reinforcement learning |
| 25 | Training data: datasets, labels and data quality |
| 26 | Overfitting vs underfitting: memorising vs understanding |
| 27 | Transformers, Part 1: attention, the idea that changed AI |
| 28 | Transformers, Part 2: how a transformer builds an answer |
| 29 | Computer vision: how AI sees images |
| 30 | RLHF & reward models: how AI learns manners |
| 31 | Fine-tuning deep dive: LoRA and efficient training |
| 32 | RAG, Part 2: chunking, vector databases and reranking |
| 33 | RAG, Part 3: hybrid search and measuring RAG quality |

### Season 4: Models & infrastructure
| EP | Topic |
|---|---|
| 34 | Open vs closed models |
| 35 | Model size & small language models |
| 36 | GPUs and AI chips: why hardware decides AI |
| 37 | Quantization: big models on small devices |
| 38 | Running AI locally on your laptop |
| 39 | Inference: speed, latency and cost per token |
| 40 | Benchmarks & evaluations: how models are compared |
| 41 | How to choose the right model |

### Season 5: Responsible AI
| EP | Topic |
|---|---|
| 42 | Bias & fairness |
| 43 | AI safety & alignment |
| 44 | Privacy: what happens to your data |
| 45 | Deepfakes and how to spot them |
| 46 | Copyright & AI |
| 47 | Guardrails in real products |
| 48 | AI laws: EU AI Act, India and the rest |
| 49 | AI and jobs: what really changes |

### Season 6: Hands-on (build it yourself)
| EP | Topic |
|---|---|
| 50 | Your first AI API call |
| 51 | Build a chatbot with a system prompt |
| 52 | Build RAG over your PDFs, Part 1 |
| 53 | Build RAG over your PDFs, Part 2 |
| 54 | Build an agent with tools |
| 55 | Build your own MCP server |
| 56 | Build a voice assistant |
| 57 | Deploy your AI app |
| 58 | AI career roadmap: prompt engineer, AI engineer, ML engineer |

Order rule: an episode may only use ideas taught in earlier episodes. If a topic needs something
not yet covered, it moves later, or the missing piece gets its own episode first.

---

## Track 2: Real World AI (use cases)

Each use case breaks one product into its stages, names the fundamental behind each stage, and
shows the numbers that matter (speed, accuracy, cost). "Needs" lists the episodes a viewer
should have seen first.

| # | How it works | Stages shown | Needs |
|---|---|---|---|
| UC01 | **AI phone call assistant** | speech-to-text → LLM → text-to-speech, repeat; latency; interruptions | EP 02, 12, 13 |
| UC02 | ChatGPT answering with web search | search tool → read pages → cite answer | EP 07, 09 |
| UC03 | AI meeting notes (Zoom, Meet) | speech-to-text → who spoke → summary → action items | EP 13, 04 |
| UC04 | Netflix / YouTube recommendations | embeddings of you and videos, similarity, ranking | EP 06 |
| UC05 | Magic eraser in photo apps | inpainting with diffusion | EP 14 |
| UC06 | Customer support bot for a bank | RAG + tools + human handoff | EP 07, 09, 10 |
| UC07 | Smart replies in Gmail and WhatsApp | short LLM suggestions | EP 02 |
| UC08 | Live translation (Google Translate conversation mode) | speech-to-text → translate → text-to-speech | EP 13 |
| UC09 | AI coding assistant building a feature | read repo → plan → edit → test | EP 10, 19 |
| UC10 | Instagram Reels feed ranking | signals → prediction → ranking | EP 01, 06 |
| UC11 | Google Lens / visual search | image embedding → search → answer | EP 06, 12 |
| UC12 | AI tutor apps | RAG + memory + quizzes | EP 07, 17 |
| UC13 | AI music generation | text → music model | EP 14 |
| UC14 | UPI and card fraud detection | normal pattern → anomaly score → block or allow | EP 01, 24 |
| UC15 | Swiggy / Zomato delivery time prediction | features → prediction model → ETA | EP 01, 24 |
| UC16 | Uber / Ola ETA and surge pricing | demand forecast → pricing | EP 01 |
| UC17 | Face unlock | face embedding → match → liveness check | EP 06, 29 |
| UC18 | Self-driving car perception | cameras → detection → planning | EP 29 |
| UC19 | KYC and document scanning (OCR) | image → text → checks | EP 29 |
| UC20 | Crop disease detection app for farmers | photo → vision model → advice | EP 29 |
| UC21 | Alexa / Siri wake word | tiny on-device model → cloud AI | EP 13, 35 |
| UC22 | Resume screening (ATS) | parsing → matching → ranking; bias risks | EP 06, 42 |
| UC23 | Medical X-ray screening | vision model → doctor review | EP 29, 43 |
| UC24 | Deepfake detection | artefact detection | EP 45 |

The first use case can go out any time. The rest are released when their "Needs" episodes are
out.

---

## Track 3: New in AI (new technology explained)

When something new launches, explain it in this structure:

1. **What launched**, in one sentence: who, what, when.
2. **What it builds on:** name 2–3 earlier episodes ("remember agents from EP 10?").
3. **What's actually new**, shown with one animated diagram.
4. **Who can use it, and how**: free or paid, app or API.
5. **Limits and hype check:** what it can't do yet.
6. **Quiz + follow.**

If a new technology needs a fundamental that hasn't been covered yet, that fundamental episode is
made first (or the same week), and the "New in AI" reel links to it.

---

## Track 4: AI News (daily roundup)

**Format (60–90 s):** date card → 3–5 story cards (headline, one-line what happened, one-line
why it matters, source name on screen) → "which one matters most to you? comment" → follow.

**Rules for accuracy:**
- Every story needs an official announcement or at least two reputable outlets.
- The source name is shown on screen, and the source links go in the caption.
- No rumours or leaks presented as facts; label anything unconfirmed as "reported".
- A human approves the script before rendering. News is never auto-posted without review.

**Workflow:** research the last 24 hours → draft the script with sources → you approve →
render (about 3 minutes) → captions file with source links → upload.

---

## Production notes
- Script style rules: [`SCRIPT_STYLE.md`](SCRIPT_STYLE.md).
- One render at a time; each episode gets `out/<id>_captions.txt` for upload automation.
- Every script passes `pipeline/voice_qa.py` before posting.

---

## Track 5: Quiz reels
Quiz-only reels, one per ~10 episodes. 6 harder questions, 4 options each, answer position varied,
5-second countdown with a "Keep score!" prompt, answer reveal with a one-line explanation after each
question, then a score screen ("6/6 True AI Maastaaru · 4–5 Great work · 0–3 Rewatch") asking viewers to
comment their score. Built with `quiz_reel()` in `pipeline/ep.py`; ids `q01`, `q02`, ...
Question rules: test understanding, not recall of a definition. Use traps (spelling vs meaning, jailbreak vs
injection, keyword vs semantic), small calculations (tokens → words, bits → GB), and scenario questions.
