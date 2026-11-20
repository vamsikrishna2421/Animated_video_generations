# EP57 test: putting the shop bot online (Nov 20, 2026)
Script: `pipeline/ep57/deploy_demo.py` (committed before it ran). EP51's shop bot (Ravi's kirana price list as the
system prompt), Qwen2.5-7B-Instruct 4-bit (llama.cpp) on this machine (4 CPU cores), 5 customer questions,
temperature 0, max 60 tokens. Results in `deploy.json`.

| | memory | start | reply time (5 questions) | answers |
|---|---|---|---|---|
| A. the model on your own server, 4 CPU cores | 8,017 MB | 24.2 s to the first answer | 1.2 to 1.5 s | ₹165, ₹340, Out of stock, ₹84, ₹246 (all right) |
| A. the same on 2 CPU cores (like a free 2-vCPU box) | 8,017 MB | 14.9 s (model already in the file cache) | 1.7 to 2.3 s | same |
| B. a tiny server that forwards each message to an API | 21.7 MB | 0.2 s | the API's time (here our 7B stood in: ₹165) | |

- A shop chat used 226 to 237 tokens in (the price list is most of it) and 3 to 4 tokens out. The answers are short,
  which is why a CPU is fast enough here; long answers would be much slower.
- **Costs, from the companies' own pages (read Nov 20):**
  - Hugging Face pricing (huggingface.co/pricing): Nvidia T4 small $0.40 an hour, $288 a month; CPU Basic (2 vCPU,
    16 GB) free; CPU Upgrade (8 vCPU, 32 GB) $22 a month.
  - Hugging Face docs (spaces-gpus): free cpu-basic Spaces sleep after 48 hours without use, and the next visitor wakes
    them; paid hardware never sleeps by default.
  - OpenAI's gpt-5.4-mini model page: $0.75 per 1M input tokens, $4.50 per 1M output (read through search: OpenAI's
    pages refuse automated fetches).
  - Rupees at ₹95.25 a dollar (the RBI reference rate of Nov 6, 2026, the latest found).
- **The arithmetic:**
  - GPU server 24×7: $288 × 95.25 = ₹27,432 a month.
  - API: 235 in + 4 out tokens = $0.000194 = 1.85 paise a chat. 50 chats a day × 30 = ₹27.8 a month, plus a free or
    small host for the 22 MB server.
- **Not tested:** a real cloud deploy (no accounts from this machine), real API latency, a GPU.
