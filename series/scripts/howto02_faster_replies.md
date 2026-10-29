# HOW TO 02 "Make AI reply faster: 3 settings" · script v0 (facts and the run; the script follows the run)

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

(results: below, after the run)
