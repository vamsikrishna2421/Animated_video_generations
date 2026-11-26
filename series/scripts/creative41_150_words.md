# Creative 41 "Asked for 150 Words" (Nov 26 creative slot)

Format: **a one-question challenge** (last used by Creative 33, Nov 18; not a dialogue skit: myth vs fact returns Nov 27).
One narrator, phone and notebook screens, no other characters. Frame 1 is a **count clash** (Bujji, Creative 31 7-day:
the 0-vs-89 count clash is the control; judge the EN hold against 66.6%). Point family **B. AI can't do what it looks
like it does** (last: Creative 30, Nov 15); the posts before it are Creative 40 (A) and HOW TO 06 (F).

## Facts (series/scripts/creative41_demo/README.md)
- Our test: Qwen2.5-7B-Instruct (4-bit) on our computer, "Write a 150-word answer for a Class 8 exam: Why should we save
  water?", 10 fresh chats each, words counted as a teacher counts, read by hand:
  - plain: 102, 121, 110, 128, 112, 120, 127, 113, 127, 122 words (0/10 within 135-165);
  - "Count your words and make sure the answer is exactly 150 words.": 104-146 (2/10 within);
  - "10 sentences of about 15 words each": 62-101 words (10 sentences in 8/10, ~7 words a sentence);
  - told its real count ("Your answer has N words. I need 150 words. Rewrite it to 150 words."): 162-234 (1/10 within);
    the first answer 102 -> 185; the most, 112 -> 234.
- Qwen's own tokenizer: the answer's first 12 words are 14 tokens ("reasons", ".", "Firstly", "," ...); the 102-word
  answer is 124 tokens.
- OpenAI, "Understanding and counting tokens": "Tokens are the units that OpenAI models use to process text"; "1 token is
  approximately three-quarters of a word."

## Hook options
1. **Chosen: the count clash.** Frame 1: the homework line "Why should we save water? (150 words)" and the AI's answer
   with a word-counter badge; two blocks: "ASKED: 150 WORDS" vs "THE AI WROTE: 102". The question for the viewer comes
   after: "we told it the real count; guess what it wrote".
2. "10 TRIES, 0 HIT 150": a count, but no single clash a phone viewer reads in one glance.
3. The overshoot first ("ASKED 150 · GOT 234"): bigger gap, but it hides the twist.

## Script v1 (EN: the narrator on Fish with the storyteller clip; TE: Parler, Lalitha). [n] = picture cue.
| # | beat | EN | TE |
|---|---|---|---|
| 1 | hook | Asked for a hundred and fifty words. [1] The AI wrote a hundred and two. | నూట యాభై వర్డ్స్ అడిగాం. [1] చాట్‌బాట్ రాసింది, నూట రెండు. |
| 2 | tries | Ten tries on a free AI on our computer: [1] a hundred and two to a hundred and twenty-eight. Short, every time. | మా కంప్యూటర్ లోని ఫ్రీ చాట్‌బాట్ ని, పది సార్లు అడిగాం. [1] నూట రెండు నుంచి, నూట ఇరవై ఎనిమిది. ప్రతిసారీ, తక్కువే. |
| 3 | count | We told it: count your words, exactly one fifty. [1] Two out of ten came close. | వర్డ్స్ లెక్కపెట్టు, సరిగ్గా నూట యాభై, అని చెప్పాం. [1] పదిలో రెండు మాత్రమే, దగ్గరికి వచ్చాయి. |
| 4 | question | Then we gave it the real count: you wrote a hundred and two, I need one fifty. [1] Guess what it wrote. | తర్వాత అసలు లెక్క చెప్పాం: నువ్వు రాసింది నూట రెండు, నూట యాభై కావాలి. [1] ఏం రాసిందో, ఊహించండి. |
| 5 | reveal | [1] A hundred and eighty-five. [2] Once, two hundred and thirty-four. Too short became too long. | [1] నూట ఎనభై ఐదు. [2] ఒకసారి, రెండు వందల ముప్పై నాలుగు. తక్కువ నుంచి, ఎక్కువకి. |
| 6 | why | It writes in tokens, small pieces, about three quarters of a word each. [1] It never keeps a word count. | ఇది టోకెన్లలో రాస్తుంది: చిన్న ముక్కలు, ఒక్కోటి ముప్పావు వర్డ్ అంత. [1] మొత్తం వర్డ్స్, అది లెక్కపెట్టకుండానే రాస్తుంది. |
| 7 | rule | So count it yourself, with your app's word counter. [1] Then trim or add the last lines yourself. | అందుకే, మీరే లెక్కపెట్టండి: మీ యాప్ లో వర్డ్ కౌంట్. [1] చివరి లైన్లు, మీరే తీసేయండి, లేదా కలపండి. |
| 8 | loop | Asked for a hundred and fifty. [1] Got a hundred and two. | నూట యాభై అడిగాం. [1] వచ్చింది, నూట రెండు. |

## On screen (English in both versions)
- Frame 1: a Class 8 notebook page ("Q. Why should we save water? (150 words)") beside a phone with the AI's real answer
  (seed 1) and a word-counter badge; two blocks: "ASKED: 150 WORDS" (blue) vs "THE AI WROTE: 102" (red).
- Line 2: ten bars (102-128) under a dashed 150 line; chip "a free AI on our computer · 10 tries · counted by us".
- Line 3: the "count your words" note on the phone; the ten new bars, two (140, 146) reach the green band.
- Line 4: the follow-up bubble, "Your answer has 102 words. I need 150 words. Rewrite it to 150 words."; a big "?"
  counter with a 3-tick wait.
- Line 5: the counter rolls 102 -> 185 (red, over the line); a "234" chip drops in; the ten feedback bars all above the
  150 line.
- Line 6: the first line of the answer split into Qwen's real tokens ("Water | conservation | is | ... | reasons | . |
  Firstly | ,"), "12 WORDS = 14 TOKENS"; small "OpenAI: 1 token ≈ ¾ of a word"; a meter "WORD COUNT: not kept".
- Line 7: rule card: "COUNT IT YOURSELF: Google Docs: Tools > Word count · Word: the bar at the bottom" and "TRIM OR ADD
  THE LAST LINES YOURSELF".
- Line 8: back to frame 1 (loops).

Sound: a pencil tick and a hit on 150 vs 102 in second 1; ten pops on the bars; a ding on the two close ones; three ticks
and a silence before the reveal, then a hit and a rising counter tick; a whoosh into the tokens; a lift into the rule;
a riser and the hit back to frame 1.
Caption try-it (no comment ask): "Ask your AI app for exactly 150 words on anything, paste it into a word counter, and
see how close it gets."

## Script review (human-viewer, v1) and what changed
- Both: the reveal (185, then 234, right after "we told it the count") is the reel; "THE AI" and "never" overclaimed from
  one small model -> "A FREE AI WROTE: 102", "one small model on our laptop", no "never"; the tokens line -> our own
  numbers ("those 102 words were 124 tokens") and "told it was short, it just guessed long" (why it overshot); the vague
  "word counter" -> "paste it into Google Docs or Word, check the count" (Google: Tools > Word count; Microsoft: the status
  bar; both read on their own help pages).
- Priya: "Class 8 exam" read as a homework-cheat tip -> the notebook shows only "Why should we save water? (150 words)" and
  the rule is "any word limit: a form, an essay, a post" (the real prompt, with "Class 8 exam", is in the pinned comment);
  "came close" -> "within 15" with the 135-165 band on screen; "too long" -> "nine of ten went over" (162 was inside).
- Sandeep: the guess -> "You'd just tell it the real count, right? We did. Spot on? Still short? Or..." with a beat; one
  pop set, a bigger hit on 234.
- Telugu (Sandeep): నూట ఎనభై ఐదు could be heard as నూట యాభై ఐదు (155) -> "నూట ఎనభై ఐదు! ముప్పై ఐదు ఎక్కువ."; "రెండొందల";
  "తక్కువైందన్నామని, ఏకంగా ఎక్కువ రాసేసింది!"; "కలపండి" (mix) -> "తక్కువైతే ఒక లైన్ మీరే రాయండి"; no "కౌంట్" (a clipped
  vowel could be heard as an English swear word) and no "గూగుల్" (heard as "Gokul" before): "డాక్స్ లో గానీ, వర్డ్ లో గానీ".

## Render review (human-viewer, EN + TE) and what changed
- Both (factual): "nine of ten went over" contradicted the chart (162 is over 150; it was only inside our 135-165 band)
  -> "All ten went over" (voice, chart label "ALL 10 WENT OVER 150", caption, README, log).
- Both: the how-to line was unreadable and the rule card sat empty while the rule was said -> the card is up on "any word
  limit"; "Google Docs: Tools > Word count" and "Word: the bar at the bottom" at 52 px.
- English: "within fifteen" -> "within fifteen words"; the hook's counter counts up to 102; the 185 counter lands on the
  word with a "+35"; the reveal header says "TOLD ITS REAL COUNT" (234 came from the 112-word try, not the 102 one); a
  ~1 s silence before the reveal; the model named on the tries chip (Qwen2.5 7B); a builder line in the caption.
- Telugu: "told short, it guessed long" was said twice (lines 5 and 6) -> line 5 ends "పదికి పది, నూట యాభై దాటాయి."; the
  bed ~16 dB under the voice -> louder, with a bigger lift into the rule. The chunk reads of 0-30 s were checked by us
  (Whisper's whole-file pass failed there).

## Final check
- Both viewers: READY. The one Telugu listen they asked for (~41 s, the whole-file pass heard "తక్కువైతే" twice) was checked
  against the chunk read of the pinned take: "ఎక్కువైతే చివరి లైన్ తీసేయండి" comes as its own piece after a pause, then
  "తక్కువైతే ఒక లైన్ మీరే రాయండి". Final: EN 50.6 s, TE 48.6 s.
