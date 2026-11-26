# HOW TO 06 real run: a free open-weight LLM on a laptop-class CPU (Nov 26, 2026)

Machine: 4 CPU cores (Intel Xeon @ 2.10 GHz), no graphics card, Linux. llama.cpp built from source at commit 9c003a9
(2026-11-25, version 1.1.0-dev), MIT licence. Model: Qwen2.5-1.5B-Instruct, 4-bit Q4_K_M, 1,117,320,736 bytes (1.12 GB),
Apache 2.0, fetched by llama.cpp itself (`-hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M`).

## Install (the official ways, README of the day)
- Mac / Linux: `curl -LsSf https://llama.app/install.sh | sh`; Windows (PowerShell): `irm https://llama.app/install.ps1 | iex`.
  Also: llama.app, Docker, pre-built binaries from the releases page, or build from source. The model page adds
  `winget install llama.cpp` and `brew install llama.cpp`.
- Our run: this machine's safety rules would not run a piped install script, so we built from source, the README's last
  option: `cmake -B build` (4 s), then the library (77 s) and the `llama` app (141 s) on 4 cores: about 3.7 minutes.
  The script itself was read first: it downloads one `llama` file from Hugging Face into `~/.llama-app` and
  `~/.local/bin`, no admin rights.

## Run (`pipeline/howto06/run_demo.py`, committed before it ran; `run.json`)
| step | result |
|---|---|
| first start, `llama serve -hf ...` (downloads 1.12 GB, loads) | 42 s on this connection |
| every start after that | 3.0 s |
| speed (server timings, 4 questions) | 16.6-17.6 tokens a second on replies (22.6 on a 5-token answer); 14-16 words a second |
| `llama cli ... --offline` (the terminal chat) | "Generation: 18.5 t/s" |
| browser chat (`llama serve ... --offline`, its built-in page) | 36 tokens in 2.4 s, 15.20 t/s (`ui_answer.png`) |
| peak RAM | 2.8 GB with the default 32,768-token context; 2.1 GB with `-c 4096` (same speed) |

## The replies (read by hand)
- Leave message: good ("Dear Manager, I am sorry to inform you that I have a fever today and will be back to work
  tomorrow. Thank you for your understanding.").
- EMI in 3 lines: right (Equated Monthly Installment; principal plus interest).
- 23 x 47: 1081, right.
- Telugu ("introduce yourself in Telugu"): useless: Telugu-looking words that mean nothing ("we should research the
  questions more"), repeated. A 1.5B model is not a Telugu tool.
- `--offline` worked for both the terminal and the browser: once downloaded, no internet is needed.
