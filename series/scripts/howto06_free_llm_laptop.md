# HOW TO 06 "A free AI on your laptop, Wi-Fi off" · Thu Nov 26

## The format and the one variable
A screen tutorial, as HOW TO 04 and 05: one narrator, screens drawn in our crayon style from the real run, Chintu's
laptop on Ravi anna's counter (HOW TO 01's setting). Not a dialogue skit.
- **One variable (Bujji, Creative 34 48h, suggestion 2):** an explicit share line in the reel, on the last card ("Send
  this to the friend who says AI needs the internet"), not only a try-it in the caption. No comment ask.
- **Unchanged:** frame 1 is a money clash on the viewer's own money; the commands card at the end (the HOW TO format);
  about 60 s (HOW TO 05's shorter middle).

## Facts (series/scripts/howto06_demo/README.md, run.json)
- llama.cpp (MIT), commit 9c003a9 (Nov 25, 2026). The official install, README of the day: Mac / Linux
  `curl -LsSf https://llama.app/install.sh | sh`; Windows `irm https://llama.app/install.ps1 | iex`; or llama.app,
  Docker, pre-built binaries, build from source. The model page adds `winget install llama.cpp` / `brew install llama.cpp`.
  Then: `llama cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M` (chat in the terminal) or `llama serve -hf ...` (chat in
  the browser; default port 9931 in this build).
- We built from source (this machine would not run a piped install script): about 3.7 minutes on 4 cores.
- Qwen2.5-1.5B-Instruct Q4_K_M: 1.12 GB, Apache 2.0. First start (download + load) 42 s here; after that 3.0 s.
- 4 CPU cores, no graphics card: ~17 tokens a second, 14-16 words a second; the leave letter in 2.0 s (30 tokens).
  `llama cli --offline`: "Generation: 18.5 t/s". The browser chat: 36 tokens in 2.4 s, 15.20 t/s.
- RAM: 2.8 GB peak (default context), 2.1 GB with `-c 4096`.
- Read by hand: leave letter good; EMI explanation right; 23 x 47 = 1081 right; Telugu: meaningless and repeated.
- `--offline` ("forces use of cache, prevents network access"): both the terminal and the browser chat worked with it.
- Price for the clash: ChatGPT Plus in India is ₹1,999 a month incl. GST (Croma; Storyboard18; NewsBytes). The reel
  says "a paid AI app", the caption names it.

## Hook options
1. **Chosen: the bill vs the laptop.** Frame 1: Chintu's laptop on the counter, Wi-Fi icon crossed out, the real leave
   letter on screen; two blocks: "PAID AI APP: ₹1,999 A MONTH" vs "THIS ONE: ₹0 · WI-FI OFF". Line 1 says both.
2. Speed first: "15 WORDS A SECOND · NO GRAPHICS CARD": numbers, but no stake from the viewer's own money.
3. The Telugu fail first ("it can't speak Telugu"): honest, but it opens on what it can't do.

## Script v1 (EN: the narrator on Fish with the storyteller clip; TE: Parler, Lalitha). [n] = picture cue.
| # | beat | EN | TE |
|---|---|---|---|
| 1 | hook | Nineteen ninety-nine rupees a month for an AI app? [1] This one is free, and the Wi-Fi is off. | నెలకి దాదాపు రెండు వేల రూపాయలు కట్టాలా? [1] ఇది ఫ్రీ. వైఫై కూడా ఆఫ్. |
| 2 | result | A leave letter in two seconds, on a plain laptop. [1] No internet, no account. | మామూలు లాప్‌టాప్ లో, రెండు సెకన్లలో ఒక లీవ్ లెటర్. [1] ఇంటర్నెట్ లేదు, అకౌంట్ లేదు. |
| 3 | install | Step one: install the free llama app. [1] One line, from its official page. | స్టెప్ వన్: లామా అనే ఫ్రీ ప్రోగ్రామ్, ఒక్క లైన్ తో ఇన్‌స్టాల్. [1] దాని సొంత పేజీ నుంచే. |
| 4 | model | Step two: one command downloads a free model. [1] One point one gigabytes. Forty-two seconds here; after that, three. | స్టెప్ టూ: ఒక్క కమాండ్, ఒక ఫ్రీ మోడల్ ని డౌన్‌లోడ్ చేస్తుంది. [1] ఒక గిగాబైట్ పైన. మాకు నలభై రెండు సెకన్లు. తర్వాత, మూడు సెకన్లే. |
| 5 | chat | Step three: chat in the terminal, or in your browser. [1] About fifteen words a second, with no graphics card. | స్టెప్ త్రీ: టెర్మినల్ లో గానీ, బ్రౌజర్ లో గానీ చాట్. [1] గ్రాఫిక్స్ కార్డ్ లేకుండా, సెకనుకి దాదాపు పదిహేను పదాలు. |
| 6 | honest | It's small. The letter was good, and the maths was right. [1] But its Telugu was nonsense. | ఇది చిన్న మోడల్. లెటర్ బాగుంది, లెక్క కూడా సరిగ్గా చేసింది. [1] కానీ దాని తెలుగు, అర్థం లేని మాటలు. |
| 7 | needs | You need about three gigabytes of free RAM. [1] Once it's downloaded, add offline, and it needs no internet. | మూడు గిగాబైట్ల ఖాళీ ర్యామ్ కావాలి. [1] డౌన్‌లోడ్ అయ్యాక, ఆఫ్‌లైన్ అని కలిపితే, ఇంటర్నెట్ అక్కర్లేదు. |
| 8 | save | Save the three commands. [1] And send this to the friend who says AI needs the internet. | మూడు కమాండ్స్ సేవ్ చేసుకోండి. [1] చాట్‌బాట్ కి ఇంటర్నెట్ కావాలి అనే ఫ్రెండ్ కి, ఇది పంపండి. |
| 9 | loop | Nineteen ninety-nine a month, [1] or zero. | నెలకి రెండు వేలు, [1] లేదా సున్నా. |

## On screen (English in both versions; every command and output copied from our run)
- Frame 1: Ravi's counter, Chintu's laptop, a crossed Wi-Fi icon; on the laptop, the real leave letter from our run;
  two blocks: "PAID AI APP: ₹1,999 A MONTH" (red) vs "THIS ONE: ₹0 · WI-FI OFF" (green). Tag "HOW TO 06".
- Line 2: the letter fills the screen with "30 tokens · 2.0 s" (run.json) and chips "NO INTERNET · NO ACCOUNT".
- Line 3: STEP 1 card: "Mac / Linux: curl -LsSf https://llama.app/install.sh | sh" and "Windows: irm
  https://llama.app/install.ps1 | iex"; small "llama.cpp · free · MIT · github.com/ggml-org/llama.cpp".
- Line 4: STEP 2 terminal: "llama cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M"; a download bar to "1.12 GB";
  stat chips "FIRST TIME: 42 s · AFTER: 3 s"; small "Qwen2.5 1.5B · Apache 2.0".
- Line 5: STEP 3: the real `llama cli` screen (banner, our question, its reply, "[ Prompt: 183.8 t/s | Generation:
  18.5 t/s ]") beside the browser chat (36 tokens · 2.4 s · 15.20 t/s); a chip "4 CPU CORES · NO GRAPHICS CARD".
- Line 6: three result tiles: "LEAVE LETTER ✓", "23 × 47 = 1081 ✓", "TELUGU ✗" with its real Telugu line struck through.
- Line 7: a needs card: "RAM: ~3 GB free (2.1 GB with -c 4096) · DISK: 1.2 GB"; then "--offline" typed onto the
  command.
- Line 8: the save card (the 3 commands) and, big, the share line "SEND THIS TO THE FRIEND WHO SAYS AI NEEDS THE
  INTERNET".
- Line 9: back to frame 1 (loops).

Sound: a till "ka-ching" and a hit on the ₹1,999 in second 1, a Wi-Fi "off" blip; typing ticks on each command; a
download whoosh; a ding on the letter; a drop before "its Telugu was nonsense" and a buzz on the ✗; a lift into the save
card; a riser and the hit back to frame 1.
Caption: every command, links, needs, licences, the ChatGPT Plus price with sources, the Telugu caveat, the next HOW TO.
