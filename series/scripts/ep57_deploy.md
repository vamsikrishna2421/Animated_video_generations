# EP57 "₹27,400 or ₹28? Deploy Your AI App" (Season 6, a screen tutorial) · queue 061 · script v1, Nov 20

## The one variable (Bujji's EP55 48h read, ACKed Nov 19)
Frame 1 is money-first: a stake from the viewer's own life (Ravi's monthly bill), not a count. Two money numbers on the
same item (the same shop bot): a GPU-server quote of ₹27,400 a month against ₹28 a month the cheap way. The middle stays
the Season 6 shape: one picture per step. The try-it is in the caption body, with no comment ask.

## Continuity and point family
- EP56 ended "Next: deploy your AI app". EP50 taught the API key and per-token prices; EP51 built this bot (Ravi's
  price list).
- Point family H, "Cost / speed asymmetry, who owns it", last used by EP46.

## The lesson
Deploying is moving the app from your laptop to a computer that never sleeps. There are three ways, each priced on
the company's own page:
1. Run the model yourself on a GPU server.
2. Run it on a CPU server.
3. Run a tiny server that forwards each message to an AI company's API and pays per token.

For short shop answers, the third is the cheapest by far, and even a plain CPU is fast enough. The two catches:
- the API key goes in the host's secret settings (EP50), never in the code;
- free hosts sleep, so the first reply after a nap is slow.

## Our test (`series/scripts/ep57_demo/README.md`; `pipeline/ep57/deploy_demo.py`, committed before it ran)
- **Self-hosted Qwen2.5-7B (4-bit) with EP51's prompt:**
  - 8,017 MB of memory.
  - 24 s from a cold start to the first answer.
  - Replies took 1.2-1.5 s on 4 CPU cores and 1.7-2.3 s on 2 cores. All 5 answers were right: ₹165, ₹340, out of
    stock, ₹84, ₹246.
- **The tiny forwarding server:** 21.7 MB, started in 0.2 s.
- **One chat:** about 235 tokens in, 4 out.

## Facts (the companies' own pages, read Nov 20, 2026)
- **Hugging Face pricing (huggingface.co/pricing):**
  - Nvidia T4 small: $0.40 an hour, $288 a month.
  - CPU Upgrade (8 vCPU, 32 GB): $22 a month.
  - CPU Basic (2 vCPU, 16 GB): free.
- **Hugging Face docs:** free cpu-basic Spaces "go to sleep if inactive for more than a set time (currently, 48
  hours)"; paid hardware never sleeps by default.
- **OpenAI gpt-5.4-mini (the model page, read through search):** $0.75 per 1M input tokens, $4.50 per 1M output.
- **Rupees:** ₹95.25 a dollar (the RBI reference rate of Nov 6, the latest found).
- **The arithmetic:**
  - GPU: $288 → ₹27,432 a month.
  - CPU: $22 → ₹2,096.
  - API: 1.85 paise a chat × 50 chats a day × 30 → ₹28.

## The reach stack
1. The stake: Ravi's monthly bill.
2. Frame 1, sound off: "GPU SERVER QUOTE: ₹27,400 A MONTH" (red) against "THE SAME BOT: ₹28 A MONTH" (green).
3. The injustice: Ravi is being sold a ₹27,400 machine to answer "Toor dal: ₹165".

Line 1 says both numbers within about 3 s.

## Script v1 (EN | TE). One narrator: EN on Fish (the storyteller clip), TE on Parler (Lalitha)
| # | prop | English | Telugu |
|---|---|---|---|
| 1 | hook | Twenty-seven thousand rupees a month for a GPU server, or twenty-eight rupees. [1] Same shop bot, same answers. | నెలకి ఇరవై ఏడు వేలు, జీపీయూ సర్వర్ కి. లేదా, ఇరవై ఎనిమిది రూపాయలు. [1] అదే షాప్ బాట్, అవే జవాబులు. |
| 2 | laptop | Today the bot runs on Suresh's laptop. [1] Laptop sleeps, the bot sleeps. Deploying means moving it to a computer that's always on. | ఇప్పుడు బాట్, సురేష్ ల్యాప్‌టాప్ లో నడుస్తోంది. [1] ల్యాప్‌టాప్ నిద్రపోతే, బాట్ కూడా. డిప్లాయ్ అంటే, ఎప్పుడూ ఆన్ లో ఉండే కంప్యూటర్ కి మార్చడం. |
| 3 | bars | Three ways, priced on the companies' own pages. [1] The model on a GPU server: twenty-seven thousand. [2] On a CPU server: about two thousand, and in our test it still answered in two seconds. [3] Or a tiny server that calls an AI company's API: twenty-eight rupees, at fifty chats a day. | మూడు దారులు, ఆ కంపెనీల పేజీల ధరలతో. [1] జీపీయూ సర్వర్ మీద మోడల్: ఇరవై ఏడు వేలు. [2] సీపీయూ సర్వర్ మీద: సుమారు రెండు వేలు; మా టెస్ట్ లో అది కూడా రెండు సెకన్లలో జవాబిచ్చింది. [3] లేదా, ఒక చిన్న సర్వర్, ఏదైనా కంపెనీ ఏపీఐ ని పిలుస్తుంది: రోజుకి యాభై చాట్లకి, ఇరవై ఎనిమిది రూపాయలు. |
| 4 | why | Why so cheap? [1] The model needs eight gigabytes of memory; the tiny server, twenty-two megabytes. [2] The thinking happens at the API, and you pay about two paise a chat. | ఎందుకంత చౌక? [1] మోడల్ కి ఎనిమిది జీబీ మెమరీ కావాలి; చిన్న సర్వర్ కి, ఇరవై రెండు ఎంబీ చాలు. [2] ఆలోచించడం ఏపీఐ దగ్గరే; ఒక్కో చాట్ కి సుమారు రెండు పైసలు. |
| 5 | catch | Two catches: [1] the API key goes in the host's secret settings, never in the code. [2] And free hosts sleep; the first reply after a nap is slow. | రెండు జాగ్రత్తలు: [1] ఏపీఐ కీ, హోస్ట్ సీక్రెట్ సెట్టింగ్స్ లోనే; కోడ్ లో ఎప్పుడూ కాదు. [2] ఫ్రీ హోస్ట్ లు నిద్రపోతాయి; నిద్ర లేచాక వచ్చే మొదటి జవాబు ఆలస్యం. |
| 6 | loop | So before anyone sells you a GPU, ask: [1] twenty-seven thousand, or twenty-eight? Next: your AI career roadmap. | అందుకే జీపీయూ కొనమనేవాళ్ళని అడగండి: [1] ఇరవై ఏడు వేలా, ఇరవై ఎనిమిదా? నెక్స్ట్: మీ ఏఐ కెరీర్ రోడ్‌మ్యాప్. |

Notes for Telugu: line 5 "మొదటి" must change (banned spoken word), and line 6 "ఏఐ" must change ("చాట్‌బాట్" / "ఆర్టిఫిషియల్").

## On screen (English in both versions)
- **1:**
  - Ravi at the counter holding a quote: "GPU SERVER · ₹27,400 A MONTH" (red block).
  - A green block: "THE SAME BOT · ₹28 A MONTH".
  - His phone shows the bot: "Toor dal 1 kg entha?" → "₹165".
- **2:** Suresh's laptop with the bot running. The lid closes, ZZZ, and a customer's message waits with one grey tick.
  Then a server rack with "ALWAYS ON".
- **3:** three bars, monthly:
  - "GPU server (Nvidia T4): ₹27,432";
  - "CPU server (8 cores): ₹2,096 · replied in ~2 s";
  - "tiny server + API: ₹28 (50 chats a day)".
  - Source line: "Hugging Face pricing · OpenAI pricing · ₹95.25/$".
- **4:** two memory boxes: "the model: 8,017 MB" (big) and "tiny server: 22 MB" (a dot). A chip: "~1.85 paise a chat
  (235 tokens in, 4 out)".
- **5:** a code editor with the key line crossed out, and the host's "Secrets" settings with API_KEY = ••••. Then a
  sleeping host icon: "free hosts sleep (Hugging Face free CPU: after 48 h idle)".
- **6:** the two frame-1 blocks back, then the loop.

## Caption try-it (no comment ask)
"Before you pay for any server, count your chats: tokens per chat × chats per day × your API's price. Ours: 1.85 paise
a chat, ₹28 a month at 50 chats a day."

## Script review (human-viewer, v1), what changed for v2
All three viewers stopped on frame 1: Kiran (26, built the EP51 bot), Arjun (30, a developer) and Narsimha (50, a
kirana owner, Telugu). None of them knew where to deploy afterwards.
- **Honesty (Arjun, checked against our own README):**
  - The CPU bar paired an 8-core price with a 2-core speed. Our test ran on 2 cores, and a free 2-core, 16 GB box
    (Hugging Face CPU Basic, free on its pricing page) fits the 8 GB model.
  - So the clash is now ₹27,400 against ₹0, and ₹28 a month is the smarter-model option.
  - "Same answers" is now "same questions" (gpt-5.4-mini never answered our 5).
  - A break-even is on screen: a GPU pays off only above ~50,000 chats a day (₹27,432 ÷ 1.85 paise ÷ 30).
- **"Which one, and where?":**
  - The pick is said ("for a shop: the free box, or ₹28 a month for a smarter model").
  - Three steps follow:
    1. A free Hugging Face Space.
    2. Any key in its Secrets: the HF docs, "Secrets to store access tokens, API keys".
    3. Its link pasted into WhatsApp's Callback URL: Meta's docs, the Callback URL field in the app's WhatsApp
       Configuration.
- **Numbers:** "a month" every time ₹28 comes up. The pile of "twos" is gone (no ₹2,096 bar, no "two catches").
- **The catch tied to the host:** "after two days with no messages, the free box sleeps; the next reply takes half a
  minute or more" (HF: 48 h; our cold start: 24 s).
- **No next-episode tease** (the career roadmap felt like a different show). It goes in the caption.
- **Telugu:**
  - no ఏపీఐ (each started with a lone ఏ): "ఒక పెద్ద కంపెనీ మోడల్ కి పంపే చిన్న సర్వర్";
  - "బాట్ కూడా నిద్రపోతుంది";
  - "ధరలు, ఆ కంపెనీల సొంత పేజీల నుంచే";
  - "నెలకి" every time;
  - "నిద్ర లేపిన మెసేజ్ కి జవాబు" (not మొదటి);
  - "అద్దెకి ఇస్తామనేవాళ్ళని" (rent, not buy);
  - no ఏఐ.
- **Sound (for the build):** a drop before "zero" in lines 1 and 6, and a hit when the green block lands.

## Script v2 (as voiced): see pipeline/ep57/make_specs.py (LINES)
