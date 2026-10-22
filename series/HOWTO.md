# HOW TO: hands-on tutorials (Thursday slot of the daily new episode)

The user's ask (Oct 20): besides the syllabus and the weekly news, "some useful how to install open-weight LLMs, how to
generate audio locally, how to make videos with Claude" etc. One HOW TO a week, every Thursday (series/ROUTINE.md,
Run 1). Label on screen: `HOW TO 01`, ... Posted on the day it is made (not in the serial upload queue).

## Format
- The skit world, so it looks like the rest of the page: someone asks the shop AI to set a thing up (Ravi's nephew
  Chintu for laptop jobs, Ravi for phone jobs, an office for work tools), and the AI walks them through it.
- 3-4 steps, each a real screen from our own run: the command as typed, its real output, the real numbers (download
  size, minutes, words per second, RAM used). Terminal and app screens are drawn in the crayon style from the captured
  run (commands and outputs copied exactly, never invented).
- Frame 1 shows the result first ("this voice was made on a laptop, no internet"), then the steps. The last beat is a
  "save this" checklist card (the commands), so viewers save the reel.
- 60-90 s. EN + TE (Telugu voice; commands and screens stay in English).
- Caption: every command to copy, the official download links, what you need (RAM, disk, OS), the licence of the model,
  what can go wrong and the fix, and the next HOW TO.

## Rules
- Steps checked against the official docs on the day (installers change); versions named. We run on Linux: the
  Windows and Mac steps come from the official docs and the caption says so.
- Only free tools, or the price said up front. Model licences named (Apache 2.0, MIT, Llama licence...); nothing
  non-commercial on a monetised page unless the reel says so.
- Never show API keys, tokens or account pages. No celebrity voices, no voice of anyone who has not agreed.
- Human-viewer review at the script and render stage, as for every reel; also ask: could you follow these steps
  without pausing?

## Backlog (in order; the run takes the first "planned" row whose "Needs" are out)
| # | Topic | Our real run | Needs | Status |
|---|---|---|---|---|
| 01 | Make an AI voice on your laptop, free and offline (local text-to-speech) | Kokoro (English) and Indic Parler-TTS (Telugu), the voices this page uses: install, one sentence, seconds per sentence on a CPU | EP13 | in progress (Thu Oct 22) |
| 02 | Install a free open-weight LLM on your laptop (Ollama / LM Studio / llama.cpp) | llama.cpp with Qwen2.5 1.5B (4-bit): install, download, chat; tokens per second, RAM used | EP34, EP35, EP37, EP38 | planned (Thu Oct 29) |
| 03 | Make videos with Claude: how this page's reels are made | this repo: Claude Code writes the script and the animation code, local voices, Remotion renders; minutes per render, what it costs | EP19 | planned (Thu Nov 5) |
| 04 | Turn any audio or video into text, offline (Whisper) | faster-whisper on a CPU: minutes per hour of audio; how well it does Telugu (honestly) | EP13 | planned |
| 05 | Build a website with Claude | the web templates made in this repo: prompt, preview, publish free | EP19 | planned |
| 06 | Translate English to Telugu offline | IndicTrans2 (MIT) on a CPU: install, a paragraph, speed and mistakes | EP02, EP13 | planned |
| 07 | Clean up a noisy voice recording with free AI | a phone recording through a local noise remover (DeepFilterNet), before and after | EP13 | planned |
| 08 | Make AI pictures on your laptop | a free image model with its licence checked (diffusers or ComfyUI): one picture, minutes on a CPU | EP14 | planned |
| 09 | Teach a small model a new skill on your laptop (LoRA, step by step) | EP31's real LoRA run as copy-paste steps | EP31 | planned |
| 10 | Make Claude do a daily job for you (scheduled tasks) | this page's own daily runs: one scheduled task, what it does, how to stop it | EP10, EP19 | planned |
| 11 | Run an AI model on your phone, offline (PocketPal AI / Google AI Edge Gallery) | needs a 30 s screen recording from the user's phone (we can't run a phone here): ask once, skip until it arrives | EP35 | waiting |

Season 6 of the syllabus (EP50-58) already builds apps step by step (first API call, chatbot, RAG over PDFs, agent,
MCP server, voice assistant, deploy), so the backlog stays on tools you install and use, not those builds.
