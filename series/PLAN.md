# AI From Scratch — series plan (@ai_maastaaru)

Format: Instagram Reels, 1080×1920, **2:00–2:45 each** (hard cap 3:00). English narration
(Kokoro, local). One concept per episode, each explained with at least one analogy and 2–3
real use cases. Every episode ends with a teaser for the next one, which keeps people
following along.

## Episode formula (same beats every time, so viewers learn the rhythm)

| Beat | Time | Purpose |
|---|---|---|
| Hook + banner | 0–8 s | A question the viewer already has, with the episode title card |
| Plain-words definition | ~15 s | One sentence, no jargon |
| Analogy / how it works | 30–45 s | Everyday comparison, animated diagram |
| Real use cases | 20–30 s | 2–3 products they already use |
| Myth or pro tip | ~15 s | Corrects a misconception |
| Quick quiz | ~15 s | "Pause and comment": drives comments and saves |
| Recap + next episode | ~15 s | 3–4 bullets, teaser, follow CTA |

## Sequence

### Season 1: Foundations (vocabulary)
| # | Title | Core idea | Real examples |
|---|---|---|---|
| 01 | AI vs ML vs Deep Learning vs GenAI | Nested circles; rules vs learning from data | Spam filter, Netflix recs, Face unlock, ChatGPT |
| 02 | What is an LLM? | Next-word prediction at huge scale; training vs using | Autocomplete, ChatGPT/Claude/Gemini, email drafting |
| 03 | Tokens & context window | Models read in chunks; memory has a size limit | Why long chats "forget", pricing per token |
| 04 | Prompts & prompt engineering | Role, context, examples, format | Resume review, WhatsApp reply drafts |
| 05 | Temperature & hallucinations | Creativity dial; confident guesses | Fake citations, poems vs invoices |
| 06 | Embeddings & vector search | Meaning as coordinates; similar = close | Spotify "similar songs", Google Photos search |

### Season 2: Building with AI (the architectures)
| # | Title | Core idea | Real examples |
|---|---|---|---|
| 07 | RAG (Retrieval-Augmented Generation) | Open-book exam: retrieve, then answer | Company HR-policy bot, bank support bot |
| 08 | Prompting vs RAG vs Fine-tuning | Which tool when (cost, freshness, style) | Legal firm, customer-care tone |
| 09 | Tool use / function calling | AI asks your code to do things | Weather lookup, booking a cab |
| 10 | AI Agents | Plan → act → observe loop | Travel planner, coding agents |
| 11 | MCP (Model Context Protocol) | USB-C port for AI tools | Claude connecting to Gmail/Drive/GitHub |
| 12 | Multimodal & image generation | Diffusion: noise to picture | Qwen-Image, Midjourney, Google Lens |

### Season 3: Hands-on
| # | Title | Core idea | Real examples |
|---|---|---|---|
| 13 | Your first AI app with an API | Request → response, system prompt | 10-line chatbot |
| 14 | Build a RAG over your PDFs | Chunk → embed → store → retrieve | Chat with your college notes |
| 15 | Run AI locally | Open-weight models on a laptop | This series' voice (Kokoro) |
| 16 | Evals, guardrails & AI safety | Test like software; limit harm | Moderation, PII redaction |
| 17 | Choosing a model & cost math | Quality vs speed vs price | Small vs large model trade-offs |
| 18 | Recap & roadmap | What to learn next | Learning path |

## Production pipeline (per episode)

`episodes/epNN.json` (scenes + narration + cue markers) → Kokoro voice per sentence
→ timeline (scene lengths and visual cues follow the speech) → lo-fi bed + SFX → Remotion
vertical render → `out/epNN_*.mp4`. Optional: `pipeline/lesson_images.py` renders Qwen-Image
illustrations on a GPU machine; scenes use them automatically when present.
