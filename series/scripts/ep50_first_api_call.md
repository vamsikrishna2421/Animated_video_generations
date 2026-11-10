# EP50 "Your first AI API call" (Season 6 opener: hands-on) · queue 054 · script v2, Nov 10

## The lesson
An app that "has AI inside" makes API calls: it sends your message and a secret API key over the internet to the AI
company's computer, which answers and bills whoever owns the key. Each call costs a tiny amount, paid per token (a
shop reply: about 3 paise). The key is the only thing that proves it's you, so whoever has it spends your money. Keep it
like an ATM PIN: in a locked setting the app reads (an environment variable), never in code, a screenshot or a chat; turn
on a hard spend limit; if it leaks, delete it and make a new one.

## Bujji's notes applied
- Skit 19 48h #3: the test result inside the first 25 s, and a visual reset about every 4 s in the middle third.
- Skit 13 7-day #2: Telugu line 1 says a number in the first 2 s ("నెలకి నలభై ఏడు రూపాయలే...").
- Voice standard (Vamsi, Nov 8): English on Fish with the Creative 21 reference voices (Ravi, Suresh, the shop AI
  through the phone sound); Telugu on Parler (Ravi = Prakash, Suresh = Kiran, the AI = Lalitha).
- Continuity: EP49 ended with Suresh running the shop's AI app; EP50 is the app he built.
- Point family: new, "K. the plumbing: what an AI app really does".

## The reach stack (Standing Rule)
1. Stake: Ravi's money (the month's AI bill on his card).
2. Frame 1, sound off: "EXPECTED: ₹47 A MONTH" vs "THE BILL: ₹8,600", Ravi with the bill on his phone, Suresh at the
   laptop.
3. Injustice: a stranger ran up Ravi's bill with a key copied from a screenshot.
Line 1 says both numbers within 2 s, EN and TE.

## Facts and sources (checked Nov 10, 2026)
- OpenAI, "Conversation state" (developers.openai.com/api/docs/guides/conversation-state): "each text generation request
  is independent and stateless" (background; not in the reel).
- OpenAI, API pricing (developers.openai.com/api/docs/pricing, standard tier): gpt-5.4-mini $0.75 per 1M input tokens,
  $4.50 per 1M output tokens (gpt-5-nano $0.05 / $0.40; gpt-4o-mini $0.15 / $0.60). Google, Gemini API pricing
  (aistudio.google.com/docs/pricing): gemini-3.1-flash-lite $0.25 / $1.50, with a free tier ("Free of charge").
- Key safety: OpenAI, "API keys" (developers.openai.com/api/docs/guides/api-keys): "Keep secret keys out of browser code,
  mobile apps, source control, logs, and customer-facing responses." "To rotate a key, issue a replacement, update the
  workload, verify that it works, and revoke the previous key." OpenAI, "Production best practices": "expose your keys to
  your application using environment variables or secret management service". Google (aistudio.google.com/docs/api-key):
  "Treat your Gemini API key like a password." "Never check API keys into source control systems like Git."
- Spend limits: OpenAI, "Spend limits" (developers.openai.com/api/docs/guides/spend-limits): "Spend alerts do not enforce a
  cap"; a hard limit is turned on ("turn on Enforce a hard limit"), then requests fail with a 429; "Enforcement is not
  instantaneous". Google (aistudio.google.com/docs/billing): prepay stops all keys at $0; project spend caps (experimental).
- GitGuardian, "The State of Secrets Sprawl 2026" (gitguardian.com): 28,649,024 new secrets detected in public GitHub
  commits in 2025; 1,275,105 AI-service secrets exposed; +81% year on year for AI-service secrets. Caption only.
- Rupees: ₹95.25 a dollar, the RBI reference rate of Nov 6, 2026 (MSEI's archive of RBI reference rates; markets near ₹94).
- The story's ₹8,600 bill (about $90) is made up, kept under the usage caps a new account gets (Google lists $250 for its
  tier 1).

## Our demo (pipeline/ep50/api_demo.py, series/scripts/ep50_demo/api.json)
Committed before it ran (commit 3f93e8c). A real AI API on this computer: llama.cpp's OpenAI-compatible server running
Qwen2.5-7B (4-bit), locked with a fresh API key, called over HTTP the way an app calls an AI company.
| what | result |
|---|---|
| the same request with no key | HTTP 401 (refused) |
| with the key, its last letter changed | HTTP 401 (refused) |
| with the right key | HTTP 200: "₹165 (in stock)" |
| 20 customer WhatsApp questions, one call each, the 25-line price list in the message | 20/20 right price and stock answer (read by hand), about 2 s a reply (first call 16 s) |
| tokens a call, OpenAI's tokenizer for its current models | about 396 in, 6.5 out |
| cost a reply at gpt-5.4-mini's price, ₹95.25 a dollar | 3.1 paise |
| a month at 50 replies a day | ₹46.66 (say "₹47") |

## Hook options
1. **(v1)** Frame 1: the shop; two blocks "EXPECTED: ₹47/month" (green) / "THE BILL: ₹8,600" (red); Ravi holding the phone
   bill, Suresh at a laptop on the counter. "Forty-seven rupees a month, you said! The bill is eight thousand six hundred!"
2. The leaked screenshot with the key circled as frame 1: a picture of code, no person.
3. "401 / 401 / 200" as frame 1: jargon.

## Script review (human-viewer, v1) and what changed
Sandeep stops on frame 1 (hook 8: real money panic); Priya 6 (reads like a UPI scam until "API key" at ~0:07). Both: "And
my ₹8,600?" answered with "delete the key" felt like a dodge; "we tested a locked AI server... two seconds" read as the AI
company's speed (it was our own computer, a local model, first call 16 s, the price from another model); line 5's picture
put the key in a phone app (OpenAI says keep keys out of mobile apps); the quiz options for 1.5 s can't be read; line 1
too slow to the 8,600; the price needs "a small model's price", not a name we never explain. Sandeep: line 12 is the
lecture; "fifty a day" of what?; "Do I even have a key if I only use ChatGPT?"; "where is the hard-limit button?". Priya:
the 3.1 paise holds for one model only (gpt-5-nano about 0.2 paise; Gemini flash-lite has a free tier); a hard limit isn't
instant; mark ₹8,600 as a story number. Telugu: "ఏపీఐ" can sound like "AP-i"; "కొత్త" (twice, the punchline too); "కీ నా?";
"మీ బిల్లు మీద వాడుకోవచ్చు" (translated, "using someone"); "కంపెనీ కంప్యూటర్" (whose?); "యాప్ చదివే, లాక్ చేసిన సెట్టింగ్"
bookish; "హార్డ్ స్పెండ్ లిమిట్" three English words; "యాభై" needs "జవాబులు"; "దాదాపు" over "సుమారు". Caption: a developer
won't confess a leaked key in public.
Changed (v2): line 1 "Forty-seven rupees?! The bill is eight thousand six hundred!"; frame 1 says "the shop AI's key,
leaked in a photo"; line 5 and its picture: the customer's message reaches the shop laptop, where the key lives, and the
laptop sends message + key to the AI company; line 7 "We locked our own AI, on our own computer... The right key: it
answered" (no seconds); line 9 "at a small model's price", "fifty replies a day", the card names the model and says
cheaper models cost less; the quiz options short ("in the code / in a group chat / a locked setting"), held about 3 s;
line 14 "Ask their support; no promise. Then delete that key, make another, and set a hard spend limit"; the rule card
"a hard spend limit, not just an alert"; the twist "Key changed!". Telugu as listed (ఏ పీ ఐ, కీయా?, వేరే కీ, కీ మార్చేశా,
"మీ డబ్బుతో వాడేయొచ్చు", "చాట్ జీపీటీ లాంటి కంపెనీకి", "యాప్ మాత్రమే చూసే లాక్ సెట్టింగ్", "ఖర్చుకి గట్టి లిమిట్", "రోజుకి
యాభై జవాబులు", "దాదాపు"; line 7's "AI" as "చాట్ బాట్"). Caption: "Only use the ChatGPT app? You don't have an API key";
where the hard limit is; a try-it ask.

## Script (English, v2) · ~60 s
| # | Who | Line |
|---|---|---|
| 1 | Ravi | Forty-seven rupees?! [1] The bill is eight thousand six hundred! |
| 2 | Suresh | I only posted a photo of my code... in a help group. |
| 3 | AI | With our API key in it. [1] Whoever copies it can run AI on your money. |
| 4 | Ravi | API key? What is all this? |
| 5 | AI | Each reply I give is one API call: [1] the laptop sends the message, with the key, to the AI company. |
| 6 | Ravi | And it just trusts the key? |
| 7 | AI | We locked our own AI, on our own computer. No key: refused. One letter wrong: refused. [1] The right key: it answered. |
| 8 | Suresh | And each answer costs...? |
| 9 | AI | About three paise, at a small model's price. [1] Fifty replies a day: forty-seven rupees a month. |
| 10 | Ravi | So this key is my ATM PIN! |
| 11 | Suresh | Then where do I keep it? [1] In the code? In our group? |
| 12 | AI | C: a locked setting only the app reads. [1] Never in code, a photo or a chat. |
| 13 | Ravi | And my eight thousand six hundred? |
| 14 | AI | Ask their support; no promise. [1] Then delete that key, make another, and set a hard spend limit. |
| 15 | Ravi | Key changed! I'll keep it safe... [1] in the family WhatsApp group! |

## Script (Telugu, v2)
| # | Telugu |
|---|---|
| 1 | నలభై ఏడు రూపాయలన్నావ్?! [1] బిల్లు ఎనిమిది వేల ఆరు వందలు! |
| 2 | హెల్ప్ గ్రూప్ లో, నా కోడ్ ఫోటో పెట్టా, అంతే... |
| 3 | అందులో మన కీ ఉంది. [1] అది కాపీ చేసిన ఎవరైనా, మీ డబ్బుతో వాడేయొచ్చు. |
| 4 | ఏ పీ ఐ కీయా? ఇదంతా ఏంటి? |
| 5 | నేను ఇచ్చే ప్రతి జవాబు, ఒక ఏ పీ ఐ కాల్. [1] ల్యాప్ టాప్, మెసేజ్ తో పాటు కీ ని, చాట్ జీపీటీ లాంటి కంపెనీకి పంపుతుంది. |
| 6 | అది కీ ని అలా నమ్మేస్తుందా? |
| 7 | మా కంప్యూటర్ లో, మా సొంత చాట్ బాట్ కి తాళం వేశాం. కీ లేకపోతే: నో. ఒక్క అక్షరం తప్పైనా: నో. [1] సరైన కీ తో: జవాబు వచ్చింది. |
| 8 | ఒక్కో జవాబుకి ఖర్చు ఎంత? |
| 9 | ఒక చిన్న మోడల్ ధరకి, దాదాపు మూడు పైసలు. [1] రోజుకి యాభై జవాబులు అంటే, నెలకి నలభై ఏడు రూపాయలు. |
| 10 | అంటే ఈ కీ, నా ఏటీఎం పిన్ లాంటిది! |
| 11 | మరి కీ ఎక్కడ దాచాలి? [1] కోడ్ లోనా? గ్రూప్ లోనా? |
| 12 | సి: యాప్ మాత్రమే చూసే, లాక్ సెట్టింగ్ లో. [1] కోడ్ లో, ఫోటోలో, చాట్ లో, ఎప్పుడూ వద్దు. |
| 13 | మరి నా ఎనిమిది వేల ఆరు వందలు? |
| 14 | వాళ్ళ సపోర్ట్ ని అడగండి, గ్యారంటీ లేదు. [1] ఆ కీ డిలీట్ చేసి, వేరే కీ తీసుకోండి. ఖర్చుకి గట్టి లిమిట్ పెట్టండి. |
| 15 | కీ మార్చేశా! జాగ్రత్తగా దాస్తా... [1] ఫ్యామిలీ వాట్సాప్ గ్రూప్ లో! |

## Caption ask (a try-it test)
"Try it: search your WhatsApp chats for the word "password" or "key". Found one in a group? Delete it and comment "done"."
