# HOW TO 02 "Make AI reply faster: 3 settings" · script v2.1 (as rendered), Oct 29

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

## Build and render review notes (v2 -> v2.1, as rendered)
- Bujji (Oct 29): the first setting's number by ~10 s: step 1 says "One: less thinking. Seventy-one seconds, down to
  fifteen." (the bars) and the next line the menus; the reel runs ~51 s English.
- Stills: a tag under the stamp covered Ravi's eyes (the test line moved inside the stamp: "OUR TEST · a small free AI,
  offline"), the step chips covered his face (on the counter now), the phone screens were too small to read (big typed
  panels instead).
- Both render viewers: frame 1 works and reads as a test; step 3's 71 came back unexplained ("BOTH WITH THINKING ON");
  the save card's taps were its smallest text (now its headings, "Instant · Flash · Effort Low", held ~4 s); step 1's
  rows held ~1 s longer and "free plan: don't tap Think" readable; the words to type lit on their own.
- Priya (factual): our test switched thinking off, and Claude's Low still thinks: the bar says "thinking off (our test)"
  and the caption says Claude's cut is smaller; the post's first line says "in our test".
- Sound: a beat after "One / Two / Three"; a drop and a hit in a beat before the long chat's number; the English last
  quarter dipped (the bed swells into the save card); the riser before "Chintu! Save this!" masked "Chin" (it ends in the
  gap now).
- Telugu: "మొదటిది" can be heard with a doubled d (a vulgar word): "ఒకటి". The voice could not say "సెట్టింగ్స్" ("sticks"),
  "ఎఫర్ట్" ("apt", 8 takes), "నిమిషాలు" or "ఫాస్ట్" ("past", "fos"), or the English line in Telugu script (babble): line 2
  "మూడు చిన్న మార్పులతో", line 4 "క్లాడ్: తక్కువ ఆలోచన" (the screen names the tap), line 6 "తెర మీద ఉన్న లైన్" (the line
  lit on screen), line 7 "డబుల్ టైం", line 10 "తక్కువ థింకింగ్ చాలు"; a pause after each app (it fell after "లో").

## Script (English, as rendered) · ~51 s
| # | Who | Line | Shot / prop |
|---|---|---|---|
| 1 | Ravi | Seventy-one seconds [1] for a two-line WhatsApp message?! | app / hook |
| 2 | AI | With three settings, [1] the same message took five seconds. | wide / three |
| 3 | AI | One: [2] less thinking. [1] Seventy-one seconds, down to fifteen. | app / step1 |
| 4 | AI | Instant on ChatGPT, Flash on Gemini, [1] low effort on Claude. | app / step1m |
| 5 | Ravi | All that thinking, [1] just for "shop closed"?! | ravi / thinking |
| 6 | AI | Two: [2] ask for a short reply. "Keep it to two short lines." [1] Fifteen seconds, down to five. | app / step2 |
| 7 | AI | Three: [2] new topic, new chat. [1] In a month-long chat, the same job took [3] over two minutes. | app / step3 |
| 8 | Ravi | But the old chat [1] knew my shop's name! | ravi / oldname |
| 9 | AI | So type it in the new chat. [1] One line beats a month of chat. | app / typename |
| 10 | AI | Thinking is for hard problems, like maths. [1] For a WhatsApp message, fast is enough. | wide / hard |
| 11 | Ravi | Chintu! [1] Save this! | wide / save |

## Script (Telugu, as rendered; on-screen text stays English)
| # | Who | Telugu | English caption |
|---|---|---|---|
| 1 | Ravi | రెండు లైన్ల వాట్సాప్ మెసేజ్ కి [1] డెబ్బై ఒక్క సెకన్లా?! | 71 seconds for a two-line WhatsApp message?! |
| 2 | AI | మూడు చిన్న మార్పులతో, [1] అదే మెసేజ్ ఐదు సెకన్లలో వచ్చింది. | With three small changes, the same message came in 5 seconds. |
| 3 | AI | ఒకటి: [2] థింకింగ్ తగ్గించండి. [1] టైం: డెబ్బై ఒక్క సెకన్ల నుంచి [3] పదిహేను సెకన్లకి. | One: less thinking. <pause 0.25> Time: from 71 seconds to 15. |
| 4 | AI | చాట్ జీపీటీ: ఇన్స్టంట్. జెమిని: ఫ్లాష్. [1] క్లాడ్: తక్కువ ఆలోచన. | ChatGPT: Instant. Gemini: Flash. Claude: Effort Low. |
| 5 | Ravi | "షాప్ బంద్" కి [1] అంత ఆలోచనా?! | All that thinking, for "shop closed"?! |
| 6 | AI | రెండో సెట్టింగ్: చిన్న రిప్లై. ఇలా రాయండి: [1] తెర మీద ఉన్న లైన్. పదిహేను సెకన్ల నుంచి ఐదు సెకన్లకి. | Second setting: a short reply. Type this: <pause 0.25> the line on the screen. From 15 seconds to 5. |
| 7 | AI | మూడోది: కొత్త విషయానికి కొత్త చాట్. [1] నెల రోజుల చాట్ లో, అదే పనికి [3] డబుల్ టైం పట్టింది. | Third: a new topic, a new chat. <pause 0.25> In a month-long chat, the same job took double the time. |
| 8 | Ravi | కానీ పాత చాట్ కి [1] నా షాప్ పేరు తెలుసు! | But the old chat knew my shop's name! |
| 9 | AI | కొత్త చాట్ లో పేరు రాయండి. [1] ఒక్క లైన్ చాలు. | Type the name in the new chat. One line is enough. |
| 10 | AI | లెక్కల లాంటి కష్టమైన పనులకే థింకింగ్. [1] వాట్సాప్ మెసేజ్ కి, తక్కువ థింకింగ్ చాలు. | Thinking is only for hard jobs like maths. <pause 0.25> For a WhatsApp message, less thinking is enough. |
| 11 | Ravi | చింటూ! [1] ఇది సేవ్ చెయ్! | Chintu! Save this! |

Telugu notes: the numbers mid-line, never opening a line; "ఒకటి", not "మొదటిది" (a doubled d is a vulgar word); no "ఏఐ" in voiced text; no zero-width joiners; the English names the voice can't say (effort, fast, the typed line) live on the screen.

## Caption ask
Which app do you use? Comment ChatGPT, Gemini or Claude. (The pinned comment: each app's exact taps.)
