# HOW TO 02 "Make AI reply faster: 3 settings" · script v2, Oct 29

Thursday HOW TO (run of Oct 29, 2026; the agreed 4-week calendar, W1). Cast: Ravi anna and the shop AI (phone), a phone
job: Ravi waits a minute for his AI app to write a two-line WhatsApp message.
Bujji's notes applied (handoff Oct 28-29): the measured result in frame 1 and the first setting with its own number by
~10 s (this reel's one changed variable: hook/pacing); ~60 s; a one-ask comment prompt.

## The three settings (what each one changes)
1. Ask for a short reply: fewer words to write (EP39: the reply is written one token at a time).
2. New topic, new chat: a long chat is read again before every reply (EP39: the month of chat in front pushed the first
   word from 4 to 92 s on our laptop).
3. The fast mode, not the thinking one: a thinking mode writes hidden tokens before the answer.

## Facts and sources (checked Oct 29, 2026)
- Claude Help Center, "Change the model, effort, and thinking settings" (support.claude.com/en/articles/8664678,
  "Updated over 3 weeks ago"): "Click the model name next to the send button." "Mouse over 'Effort.'" The levels: Low,
  Medium, High, Extra high, Max. "Higher effort means more thorough responses, but they take longer and use more
  tokens." In the app, thinking can't be turned off on its current models (the page lists them): the lever there is
  the effort level. On screen: "Claude: model name → Effort → Low".
- Claude Help Center, "How do usage and length limits work?" (support.claude.com/en/articles/11647753, "Updated over 2
  weeks ago"): "Try starting a new conversation if you're approaching your usage limit in a longer chat." "Longer
  conversations that trigger automatic context management consume more of your usage limit." On extended thinking:
  "Turn off this feature when you don't need Claude's enhanced reasoning for a particular task." Caption.
- Google, Gemini app release notes (gemini.google/release-notes): 2026.07.21 "To access, select '3.6 Flash' in the model
  drop down", "an upgraded version of our Flash model, to help you tackle everyday tasks"; 2026.05.19 3.5 Flash "our best
  model yet for getting challenging tasks done quickly and efficiently". 9to5Google (May 17, 2026): a "Thinking level"
  menu at the bottom of the model picker (Standard, Extended). Later reports give other labels and plan limits (free
  users: one model from Oct 9, per secondary sites): the caption says "pick Flash; if you see a thinking level, the
  lowest". On screen: "Gemini: model menu → Flash".
- ChatGPT: OpenAI's help pages refused our fetch today (403; the routine does not work around a bot check). Search
  results quoting OpenAI's help article on the models in ChatGPT: the model menu's levels are Instant, Medium, High and
  Extra High (Pro separate); on Free and Go, Instant is the default and a "Think" option turns deeper reasoning on for a
  message. TechRadar ("here's when to use Instant, Thinking, or Pro") and pondero.ai (Jun 14, 2026: the picker
  simplified to Instant, Medium, High, Extra High) agree on "Instant". On screen: "ChatGPT: model menu → Instant".
  Personalization (search results quoting OpenAI's help article; Engadget, Dec 21, 2025: "Base style and tone" in the
  Personalization tab): Settings → Personalization → Base style and tone → Efficient. Caption only.
- What carries over from our test to the apps: the apps run on big servers and are much faster than our computer, but
  the same three things add time there: hidden thinking tokens, a longer chat to read (apps cache some of it; Claude's
  page: long chats use more of your limit) and a longer reply to write. Said on screen: "our test: a small free AI,
  offline · apps are faster, the same 3 things slow them".

## Our real run (pipeline/howto02/speed_settings.py, series/scripts/howto02_demo/)
Committed before it ran (commit 9e939f2). Qwen's own 4-bit GGUF of Qwen3-4B (Q4_K_M, Apache 2.0; it can think or not:
"/no_think"), llama.cpp, 4 CPU cores, no graphics card, the internet cut for every run, Qwen's recommended sampling,
3 runs per setting (seeds 1-3, the median kept), every run from an empty cache. The job: "Write a WhatsApp message for my
shop's customers: the shop is closed this Sunday for a family function, and open again on Monday at 7 am." Pass mark
(fixed before the run): it says closed this Sunday and open again Monday at 7 am; every reply read by hand.
Smoke test before the run (not recorded): the template, the switch, the prompt counter (the 30-message chat was 677
tokens, so the long chat became 90 messages: 2,151 tokens).

Results (medians of 3; series/scripts/howto02_demo/results.json; the internet cut before and after):

| setting | reading (first token) | first word of the answer | whole reply | hidden thinking | answer | ready to send as written* |
|---|---|---|---|---|---|---|
| default: thinking on, fresh chat | 1.0 s | 51.4 s | 71.2 s (65.9-76.3) | 395 tokens | 151 tokens | 0 of 3 |
| + "Keep it to 2 short lines." (thinking on) | 1.5 s | 32.8 s | 35.6 s (28.6-89.8) | 257 | 23 | 3 of 3 |
| the job at the end of a 90-message chat (thinking on) | 54.5 s | 123.6 s | 131.8 s (122.5-181.9) | 423 | 51 | 1 of 3 |
| thinking off ("/no_think") | 1.5 s | 2.0 s | 15.1 s (13.8-16.1) | 0 | 106 | 0 of 3 |
| all three: thinking off + short + fresh chat | 1.6 s | 2.1 s | 5.0 s (5.0-5.0) | 0 | 23 | 3 of 3 |

- Pass mark (fixed before the run): all 15 replies say closed (this) Sunday and open again Monday at 7 am.
- *Noted while reading, not a pass mark fixed before the run: the long replies carry "[Your Shop Name]" placeholders,
  "Subject:" lines, "Sure! Here's..." and a note about the message; the short ones are ready to send.
- The short ask alone, with thinking still on, was erratic: 28.6 / 35.6 / 89.8 s (one run thought for 670 tokens).
  Thinking off first, then the short ask: 15.1 s → 5.0 s every time.
- The long chat read for 54.5 s before anything (2,151 tokens; a fresh chat: 39-51 tokens, 1-1.6 s). Its replies were
  shorter (the old answers were short) and two of three signed "Ravi Kirana": the old chat knew the shop's name, a
  fresh chat doesn't (the fix on screen: type the one detail it needs).
- Our machine is a 4-core server CPU, offline: the apps run on big servers and are much faster. What carries over is
  which settings cost time, not these seconds (on screen).

## Hook options
1. **(kept)** Frame 1: Ravi's phone, an unbranded AI chat app: his job typed, "Thinking... 0:51" and no answer yet; over
   it the result stamp "SAME MESSAGE · OUR TEST: 71 s → 5 s"; Ravi behind the counter, arms up. Ravi: "Seventy-one
   seconds for a two-line WhatsApp message?!"
2. A race: two phones, the same message, one done at 5 s while the other still says "Thinking...".
3. Ravi's customer waiting at the counter while the phone thinks.
Kept 1: the number and the clash (a two-line message, a minute of thinking) in one look; Bujji: the result in frame 1.

## Viewer notes on v1 and what changed (v2)
- Both: step 1 crammed too much (71, 15, 51, 395 tokens and three menus in one card), "fast mode" is no button's name,
  and two clocks were mixed (51 s to the first word vs 71/15/5 s whole replies). v2: one clock (the whole reply:
  71 → 15 → 5, the long chat 132 s); the menus are said out loud ("Instant on ChatGPT, Flash on Gemini, low effort on
  Claude") in their own line, the result in the next; no token counts on screen; "all 3 ready to paste".
- Both: frame 1 must say what the test is: "OUR TEST · a small free AI, offline" big from frame 1, voiced at ~0:03
  ("With three settings, the same message took five seconds" + the tag); the phone shows "Thinking..." with no timer.
- Priya: Claude's thinking can't be switched off on its current models, so step 1 is "less thinking" (Claude: low
  effort); free ChatGPT is already on Instant ("free: don't tap Think"); Gemini's free plan may show no model menu
  (caption); the long chat's seconds carry over least (apps cache chats): "long chats also eat your limit" (Claude's
  page). The pass mark said "this Sunday": 6 of 15 replies say exactly that, the other 9 "Sunday"/"on Sunday" (a
  customer reads them the same); the caption says so instead of "all 15 pass".
- Sandeep (Telugu): "డెబ్బై ఒక్క సెకనా" ends like "just ONE second?!": "సెకన్లా"; line 5 told viewers to type a Telugu
  line the screen shows in English, and "రెండు" twice ("two: two lines"): the steps are "మొదటిది / రెండో సెట్టింగ్ /
  మూడోది" and the voice says the English line the screen shows.
- Comment ask: "1, 2 or 3" told us nothing; v2 asks for the app ("Which app do you use? Comment ChatGPT, Gemini or
  Claude."), and the pinned comment gives each app's exact taps.

## Script (English) · ~60 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Seventy-one seconds [1] for a two-line WhatsApp message?! | frame 1: the app "Thinking..." (no timer); the stamp "SAME MESSAGE: 71 s → 5 s"; "OUR TEST · a small free AI, offline" |
| 2 | AI | With three settings, [1] the same message took five seconds. | the stamp holds; the three steps small: 1 less thinking · 2 short reply · 3 new chat |
| 3 | AI | One: less thinking. Instant on ChatGPT, Flash on Gemini, [1] low effort on Claude. | STEP 1 · LESS THINKING: three rows "ChatGPT → Instant (free: don't tap Think)" · "Gemini → Flash" · "Claude → Effort: Low" |
| 4 | AI | Seventy-one seconds, [1] down to fifteen. | bars: thinking on 71 s · off 15 s |
| 5 | Ravi | All that thinking, [1] for "shop closed"?! | bubble |
| 6 | AI | Two: ask for a short reply. "Keep it to two short lines." [1] Fifteen seconds, down to five. | STEP 2 · SHORT REPLY: the typed line; bars 15 s → 5 s; "all 3 ready to paste" |
| 7 | AI | Three: new topic, new chat. [1] In a month-long chat, the same job took over two minutes. | STEP 3 · NEW CHAT: bars "fresh chat 71 s · month-long chat 132 s (thinking on)"; small: "apps keep long chats faster, but they eat your limit" |
| 8 | Ravi | But the old chat [1] knew my shop's name! | bubble; the old reply signed "Ravi Kirana" |
| 9 | AI | So type it in the new chat. [1] One line beats a month of chat. | the new chat's first line: "My shop: Ravi Kirana." |
| 10 | AI | Thinking is for hard problems, like maths. [1] For a WhatsApp message, fast is enough. | "THINKING: hard sums, planning · FAST: messages, replies" |
| 11 | Ravi | Chintu! [1] Save this! | SAVE THIS card: 1 less thinking (ChatGPT Instant · Gemini Flash · Claude Effort Low) · 2 "Keep it to 2 short lines." · 3 new topic → New chat (+ the one detail) · "our test: 71 s → 5 s · a small free AI, offline · apps are faster" |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | రెండు లైన్ల వాట్సాప్ మెసేజ్ కి [1] డెబ్బై ఒక్క సెకన్లా?! | Rendu lainla WhatsApp message ki debbai okka secanlaa?! |
| 2 | AI | మూడు సెట్టింగ్స్ తో, [1] అదే మెసేజ్ ఐదు సెకన్లలో వచ్చింది. | Moodu settings to, ade message aidu secanlalo vachchindi. |
| 3 | AI | మొదటిది: థింకింగ్ తగ్గించండి. చాట్ జీపీటీ లో ఇన్స్టంట్, జెమిని లో ఫ్లాష్, [1] క్లాడ్ లో తక్కువ ఎఫర్ట్. | Modatidi: thinking tagginchandi. ChatGPT lo Instant, Gemini lo Flash, Claude lo takkuva effort. |
| 4 | AI | టైం: డెబ్బై ఒక్క సెకన్ల నుంచి [1] పదిహేను సెకన్లకి. | Time: debbai okka secanla nunchi padihenu secanlaki. |
| 5 | Ravi | "షాప్ బంద్" కి [1] అంత ఆలోచనా?! | "Shop bandh" ki anta aalochanaa?! |
| 6 | AI | రెండో సెట్టింగ్: చిన్న రిప్లై. ఇలా రాయండి: [1] కీప్ ఇట్ టు టూ షార్ట్ లైన్స్. పదిహేను సెకన్లు, ఐదు అయ్యాయి. | Rendo setting: chinna reply. Ilaa raayandi: keep it to two short lines. Padihenu secanlu, aidu ayyaayi. |
| 7 | AI | మూడోది: కొత్త విషయానికి కొత్త చాట్. [1] నెల రోజుల చాట్ లో, అదే పనికి రెండు నిమిషాలు పైనే పట్టింది. | Moododi: kotta vishayaaniki kotta chat. Nela rojula chat lo, ade paniki rendu nimishaalu paine pattindi. |
| 8 | Ravi | కానీ పాత చాట్ కి [1] నా షాప్ పేరు తెలుసు! | Kaani paata chat ki naa shop peru telusu! |
| 9 | AI | కొత్త చాట్ లో పేరు రాయండి. [1] ఒక్క లైన్ చాలు. | Kotta chat lo peru raayandi. Okka line chaalu. |
| 10 | AI | లెక్కల లాంటి కష్టమైన పనులకే థింకింగ్. [1] వాట్సాప్ మెసేజ్ కి ఫాస్ట్ చాలు. | Lekkala laanti kashtamaina panulake thinking. WhatsApp message ki fast chaalu. |
| 11 | Ravi | చింటూ! [1] ఇది సేవ్ చెయ్! | Chintoo! Idi save chey! |

Telugu notes: the numbers mid-line, never opening a line (Creative 12: a bare opening "డెబ్బై!" was clipped); "క్లాడ్ లో
తక్కువ ఎఫర్ట్" (not "లో ఎఫర్ట్": "lo lo"); no "ఏఐ" in voiced text; no zero-width joiners; no word one slipped letter
away from a swear word.

## Caption ask
Which app do you use? Comment ChatGPT, Gemini or Claude. (The pinned comment: each app's exact taps.)
