# Creative 11 "The AI confirmed Goa" (an AI summary of a group chat invents a decision) · script v2, as rendered Oct 27

**Format:** a family video call (a 2x2 grid of tiles, the speaker's tile goes big), the family group chat in the fourth
tile, phone-chat inserts, a test card, a copy-paste card, a quiz, loops (the last line is the first frame's).
**Cast / setting:** Prasad mavayya (55, books things first), Lakshmi pinni (48, wanted Ooty), Harika (22, the niece who
reads the chat), on a video call from three homes; the family group "Trip plan 2026" in the fourth tile. The AI is an
unbranded "AI summary" in the chat app (text only). New cast, new format, new topic for the week (creative log).
**AI idea:** asked "What did we decide?", an AI summary of a chat where nothing was decided can turn a suggestion into a
decision. The fix: "What did we decide? Quote the message for each decision. If nothing was decided, say 'not decided'."
The limit (twist): a quote shows who said it, not that everyone agreed.

## Facts and sources (checked Oct 27, 2026)
- Apple switched off its Apple Intelligence notification summaries for news and entertainment apps in January 2025
  after summaries put false headlines on phones (the BBC complained about one saying Luigi Mangione "had shot himself");
  Apple: "Apple Intelligence features are in beta". TechCrunch and Engadget, Jan 16, 2025. Caption only.
- Microsoft's own Copilot page: "in summarizing content from various sources, Microsoft Copilot may include information in
  its response that isn't present in its input sources", which is why its answers carry references "for users to verify"
  (learn.microsoft.com, Microsoft 365 Copilot application card; it lists summarizing Teams chats). Caption.
- Anthropic's guide: "ask Claude to extract word-for-word quotes first before performing its task. This grounds its
  responses in the actual text"; "If it can't find a quote, it must retract the claim"; and let it say "I don't know"
  (platform.claude.com, Reduce hallucinations; stated for long documents). Caption, with Microsoft's.
- Vectara's hallucination leaderboard (a vendor's test, github.com/vectara/hallucination-leaderboard, Oct 22, 2026):
  models add made-up details to 1.8%-24.2% of single-article summaries. Caption only, attributed.
- WhatsApp's own Message Summaries (Meta AI, blog.whatsapp.com, Jun 2025) rolled out in select markets in English; not
  confirmed for India. The reel's app is unbranded and the chat is made up: an example, not a reported event.

## Our demo (pipeline/creative11/summary_demo.py, series/scripts/creative11_demo/results.json)
A made-up family chat (28 messages, Sunday 7:02-7:23 pm) in which nothing was decided: Goa, Ooty and Araku argued for,
the 14th and the 21st both clash with someone, Prasad's "40k max" answered "plenty for Ooty" and "tight for Goa", "Not
decided yet mavayya. Poll tomorrow." Qwen2.5-7B-Instruct (Qwen's own 4-bit file), llama.cpp on this machine's CPU, no
internet, temperature 0.7, ten tries each, every reply read by hand:
| asked | made up a decision | said "not decided" |
|---|---|---|
| "Summarize this chat. What did we decide?" | 4 of 10 (the budget "set at 40,000" in 4; once also "The last message confirmed that Goa would be the chosen destination") | 3 of 10 |
| the line (quote the message for each decision, else "not decided") | 0 of 10 | 10 of 10 |
| Prasad then posts "OK DECIDED: Goa, 14th. Everyone agreed." + the line | 10 of 10 "We decided to go to Goa on the 14th", quoting his message | 0 of 10 |
- Frame 1's phone shows try 1, word for word (shortened): "The budget was set at 40,000 rupees per family." ... "The
  last message confirmed that Goa would be the chosen destination."

## Hook options
1. **(kept)** Frame 1: the video call; Prasad's tile big, him beaming with a fan of 12 printed tickets ("GOA · 14 DEC ·
  ₹48,000"); Lakshmi's tile: jaw dropped; Harika's tile: facepalm; the fourth tile, the group chat with the AI summary,
  "Goa: confirmed" circled. Prasad: "The AI says Goa is confirmed! I've booked twelve tickets!"
2. A family WhatsApp group exploding with 40 "WHAT?!" messages under one AI summary bubble.
3. Prasad at the airport check-in with the family, nobody else packed.
Kept 1: money already spent on a decision nobody made, every family's group chat, and a number.

## Viewer notes on v1 and what changed (v2)
- Both: frame 1 stops them ("every family has this mavayya"); the twist ("a quote shows who said it") is what Priya
  would save. Sandeep: line 5 circled the budget when the story was Goa: the circle is on "confirmed that Goa" now.
- Both: the test card's "4 of 10" next to "x4" and "x1" read as 5: one number on the card, "4 of 10 made one up" (the
  breakdown goes to the caption). Priya: frame 1 is the rare case (Goa in 1 of 10): the card says 4 of 10 made up a
  decision and the caption says which.
- Both: which AI, and do real apps do this? The card names "a free AI model on our computer, offline" and carries
  "Apple paused its AI news summaries over false headlines (Jan 2025)"; the caption names the model and Microsoft's own
  Copilot note.
- Priya: ₹48,000 on the tickets clashed with "40k max": the price is off the tickets.
- Sandeep: "we tried it": "I tested our chat ten times"; a silence before "Four"; a hit on "Quote: mavayya".
- Telugu (Sandeep): "నిర్ణయించాం" sounded like a newsreader: "ఫిక్స్ చేశాం" / "ఏదీ ఫిక్స్ కాలేదు"; line 13 "...మాత్రమే".

## Render review 1 (Sandeep, Priya) and what changed
- Both: the quiz went by too fast (the 3-2-1 was on "1" before A-B-C could be read) and covered his "OK DECIDED"
  message: the hold is 4.8 s (was 3.4), the card comes up after his message has been on screen and sits above it (the
  message stays undimmed), the count is inside the card.
- Both: the sound never lifted when he gets caught; the Telugu end was the quietest part. The middle bed sits lower;
  the answer is its own scene: the bed out after the count, a boom and clap on the cut to the answer, the brighter bed
  layer and the hats and claps from there, the bed rising into "See? The AI says Goa!" with a riser; a beat after
  "Mavayya!".
- Both: "Four summaries made up a decision" right after the Goa circle read as Goa four times, and the chat shows 40k:
  the card says "all 4: the budget 'set at 40,000' (nobody agreed) · 1 of them also: 'Goa confirmed'"; the caption
  says mavayya's "40k max" got "plenty for Ooty" and "tight for Goa", no yes.
- Sandeep: "our chat" vs the card's "our made-up chat": "the chat in this video (we wrote it)". Priya: the Apple line
  sat on OUR REAL TEST: its own card, "IN THE NEWS (not our test)"; the model line is readable (34 px, light).
- Priya: the pinned comment's list of chat apps invited "fake": it says our test was one small offline model, not the
  AI in your phone's apps; #ChatGPT is off; a line for apps with no summary button (paste the chat into a chat AI).
- Sandeep: frame 1's Lakshmi and Harika were too small and sat on his ticket arm; "GOA" was cut off by the tile edge:
  both tiles bigger on the left wall, the ticket fan inside the tile with a bigger "GOA". The comment prompt leads with
  "tag the mavayya" (the reel shows the quiz answer).
- Telugu: "కోట్ చేయమనండి" squashed to "cheye-maindi": "కోట్ చేయమని చెప్పండి" (four takes of "అనమని చెప్పండి" were worse than the first take of "అనమనండి": kept); the last word
  "కన్ఫర్మ్" ended "-rp": another take with "కనఫమ్". Kept: "ఫిక్స్" written "पिक्स" by the recogniser in some lines
  (a ఫ/ప spelling, said as Telugu speakers say it); the per-line check of the final mix found no stutter in line 6.
  English: "Confirmed?!" was heard "Confirm?": re-voiced.

## Render review 2 and what changed
- Landed (both): the quiz hold and placement, the stop and the boom on the answer, frame 1's tiles and "GOA", the Apple
  card, the pinned comment, English "Confirmed?!". Both would share it; Sandeep would post the English as it was.
- Both: "budget set at 40,000" needed its proof: the test card shows the chat on the budget (Prasad "40k max.", Lakshmi
  "40k for Ooty is plenty.", Kiran "Goa 40k is tight.": nobody said yes) and "all 4: 'budget set at 40,000'" in big type.
  Priya: "4 of 10" came up before "Four": it lands on the word now.
- Telugu (both): the music in the gaps sat ~12 dB under the voice (English ~3) and the end under the start: louder gaps
  (musicGapGain 3 dB) and a louder answer scene; the bed still dips under the last line, whose last word it masked.
  Line 13 "కోట్ చెప్పేది ఎవరు అన్నారో మాత్రమే", "అనమనండి" and line 6's "చేశా": the per-line check of the final mix heard
  each clean (the pack's transcript windows cut them), so no re-voice. Caption 13 lost "only" ("it." sat alone).
- English: "See? The AI says Goa!" +1.5 dB. The comment prompt no longer says "before the answer shows".
- Kept (one viewer): 0:19-0:35 at 105 words a minute (Priya would cut 2-3 s; the copy card is the save).

## Script (English) · ~55 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Prasad | The AI says Goa is confirmed! [1] I've booked twelve tickets! | frame 1: the AI summary across the top (try 1, word for word: "...The budget was set at 40,000 rupees per family. ...The last message confirmed that Goa would be the chosen destination."), "confirmed ... Goa" circled red; Prasad's tile big with a fan of 12 tickets ("GOA · 14 DEC · x12"); Lakshmi (jaw dropped) and Harika (facepalm) small |
| 2 | Lakshmi | Confirmed?! [1] I said Ooty! | Lakshmi's tile big; "I said OOTY!" |
| 3 | Harika | Nobody confirmed anything, mavayya. [1] We said poll tomorrow. | the group chat's last messages, "Not decided yet mavayya. Poll tomorrow." ringed |
| 4 | Prasad | The AI read the whole chat! | Prasad's tile big |
| 5 | Harika | You asked what we decided. [1] So it picked one: Goa. | insert: his question "Summarize this chat. What did we decide?" underlined; the summary, "confirmed that Goa" circled; "you asked for a decision: it found one" |
| 6 | Harika | I tested our chat ten times. [1] Four summaries made up a decision. | test card OUR REAL TEST: "the chat in this video (we wrote it) · a free AI model on our computer, offline · 10 tries each", the row "What did we decide?"; on [1] "4 of 10 made one up", "all 4: the budget 'set at 40,000' (nobody agreed) · 1 of them also: 'Goa confirmed'"; a card IN THE NEWS (not our test): "Apple paused its AI news summaries over false headlines (Jan 2025)" |
| 7 | Lakshmi | So how do we check?! | Lakshmi big |
| 8 | Harika | Make it quote the message for each decision. [1] If there's none: not decided. | COPY card "TYPE THIS: What did we decide? Quote the message for each decision. If nothing was decided, say 'not decided'."; "no message = no decision" |
| 9 | Harika | Ten out of ten: not decided. | test card row 2: "with the quote line: 10 of 10: not decided" |
| 10 | Prasad | Fine. [1] I'll decide! | he types in the group: "OK DECIDED: Goa, 14th. Everyone agreed."; his message stays on screen; QUIZ (above it, 4.8 s hold) with a 3-2-1: "He asks with the quote line. The AI says?" A not decided · B decided: Goa · C it catches him; then a stop |
| 11 | Harika | Decided: Goa. [1] Quote: mavayya. | the reply (our test): "We decided to go to Goa on the 14th. Quote: Prasad: 'OK DECIDED: Goa, 14th. Everyone agreed.'"; "B ✓ 10 of 10 tries"; "the quote is mavayya's own message" |
| 12 | Lakshmi | Mavayya! | the grid; "MAVAYYA!" |
| 13 | Harika | A quote shows who said it. [1] Not that everyone agreed. | Harika big; chip "check WHO said it" |
| 14 | Prasad | See? [1] The AI says Goa! | Prasad big, then the snap back to frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | English caption on the Telugu reel |
|---|---|---|---|
| 1 | Prasad | గోవా కన్ఫర్మ్ అని సమ్మరీ చెప్పింది! [1] పన్నెండు టికెట్లు బుక్ చేశా! | The summary said Goa is confirmed! I've booked 12 tickets! |
| 2 | Lakshmi | కన్ఫర్మా?! [1] నేను ఊటీ అన్నాను! | Confirmed?! I said Ooty! |
| 3 | Harika | ఎవరూ ఏమీ కన్ఫర్మ్ చేయలేదు మావయ్య. [1] రేపు పోల్ అన్నాం. | Nobody confirmed anything, mavayya. We said poll tomorrow. |
| 4 | Prasad | సమ్మరీ మొత్తం చాట్ చదివింది! | The summary read the whole chat! |
| 5 | Harika | మనం ఏం ఫిక్స్ చేశాం అని అడిగారు. [1] అందుకే ఒకటి ఫిక్స్ చేసింది: గోవా. | You asked what we fixed. So it fixed one: Goa. |
| 6 | Harika | మన చాట్ ని పది సార్లు టెస్ట్ చేశా. [1] నాలుగు సార్లు లేని నిర్ణయం రాసింది. | I tested our chat 10 times... 4 times it wrote a decision that didn't exist. |
| 7 | Lakshmi | మరి ఎలా చెక్ చేయాలి?! | So how do we check?! |
| 8 | Harika | ప్రతి నిర్ణయానికీ మెసేజ్ కోట్ చేయమని చెప్పండి. [1] లేకపోతే ఏదీ ఫిక్స్ కాలేదు అనమనండి. | Tell it to quote the message for each decision. Otherwise: nothing was fixed. |
| 9 | Harika | పదికి పది: ఏదీ ఫిక్స్ కాలేదు. | 10 out of 10: nothing was fixed. |
| 10 | Prasad | సరే. [1] నేనే ఫిక్స్ చేస్తా! | Fine. I'll fix it myself! |
| 11 | Harika | ఫిక్స్: గోవా. [1] కోట్: మావయ్య మెసేజ్. | Fixed: Goa. Quote: mavayya's message. |
| 12 | Lakshmi | అయ్యో, మావయ్యా! | Ayyo, mavayya! |
| 13 | Harika | కోట్ చెప్పేది ఎవరు అన్నారో మాత్రమే. [1] అందరూ ఓకే అన్నారని కాదు. | A quote shows who said it. Not that everyone said OK. |
| 14 | Prasad | చూశారా? [1] గోవా కన్ఫర్మ్! | See? Goa confirmed! |

Telugu notes: no "ఏఐ" (Parler stutters on it): "సమ్మరీ"; no "డిసైడ్" (it came out "dish" in Creative 10): "ఫిక్స్" / "నిర్ణయం";
no zero-width joiners in the voiced text.

## Caption ask (draft)
Asked "what did we decide?", an AI summary of a chat where nothing was decided can turn a suggestion into a decision.
Our test: 4 of 10 summaries of our family chat did. Before you act on a summary, type: "What did we decide? Quote the
message for each decision. If nothing was decided, say 'not decided'." (ours: 10 of 10 "not decided"). And check WHO
said the quoted message.
