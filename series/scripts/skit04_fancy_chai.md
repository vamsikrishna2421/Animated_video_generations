# Skit 04 "The fancy chai" (creative reel 04, Oct 20): show the AI your own examples (few-shot prompting), script v2

Format: a one-question challenge inside a street moment (new for the week: Oct 17 two-character skit, Oct 18 home moment,
Oct 19 POV). Cast and setting new: Babu (owner of a roadside chai stall in Hyderabad), Raju (auto driver, his regular),
Swathi (Babu's daughter, college student). No AI voice: the AI is only text on Babu's phone (its real outputs from our
test), so the reel looks different from the shop episodes.

The idea a viewer can use tomorrow: don't describe your style to an AI, show it three of your own old posts (few-shot
prompting). And the catch: it copies everything in them, old prices too, so put today's facts in the prompt.

v1 -> v2 (script review, a Telugu viewer and a developer; both stop for the hook and both liked the Rs 10 twist; both:
the challenge card was dead weight, Swathi had just given its answer): the card now asks the twist's question after the
old posts go in ("they say Rs 10, the tea is Rs 15: what price will the AI write?"), so the reveal answers it; Swathi
says the prompt that worked in our test ("write like these, same Telugu-English mix"; plain "write like these" gave 0 of
10 in his words); the fixed Rs 15 post is shown (line 11) and the rule chip stays to the loop; "examples" became "old
posts" ("ఉదాహరణల్లో" was a textbook word); "don't describe yourself" became "don't tell it how to write" (he never
described himself); "Ten cups!" became "Give me ten!" (Telugu "పది టీలు": "కప్పులు" could flatten into "frogs");
"hotel words" became "5-star"; "sounded like Babu" became "used Babu's words" (what we counted); "₹200?!" shows by 1 s;
Swathi facepalms before the loop cut.

## Hook options (frame 1 + first line)
1. Raju holds up Babu's phone, the stall's new post on it, "Indulge in the Spice of Life! ... a taste of tradition and
   a touch of modern flair": "'Indulge in the Spice of Life'?! Babu anna, is tea two hundred rupees now?!" **(kept:
   something wrong in frame 1, a question in the first line, every chai drinker knows the price)**
2. Babu stares at his phone: "Fifty people unfollowed my tea stall today!" (no picture of why)
3. A customer sniffs his glass: "Anna, it says 'elixir'. What did you put in this?" (an alcohol joke; risky)

## Our test (real, run by us: `pipeline/skit04/caption_demo.py`, data in `series/scripts/skit04_demo/results.json`)
A free open model (Qwen2.5-7B-Instruct, Apache 2.0; Qwen's own 4-bit file, llama.cpp on the laptop CPU), temperature
0.8, 10 tries per prompt. Each prompt starts "Write an Instagram post for my roadside tea stall in Hyderabad. Today's
special: ginger tea." Babu's three old posts: "Morning 6 ki stall open! Hot hot allam tea Rs 10 only. Office ki velle
mundu oka cup taagi vellandi" · "Varsham padutundi. Mirchi bajji + tea combo Rs 30. Fast ga randi, bajji ayipotundi!"
· "Sunday special: Irani chai Rs 10. Friends tho randi, bench ready". The tea is Rs 15 now; only the last prompt says so.

| Prompt | 5-star words (indulge, elixir, delight...) | Used Babu's words (2+ of his) | Said last year's Rs 10 | Said Rs 15 |
|---|---|---|---|---|
| "... Make it fancy." | 8 of 10 | 0 | 0 | 0 |
| "... Keep it simple and friendly." | 3 of 10 | 0 | 0 | 0 |
| His 3 old posts + "write today's post in the same style and the same Telugu-English mix" | 0 | 9 of 10 | 5 of 10 (1 more made up Rs 12) | 4 (a guess) |
| The same + "Today's special: ginger tea, Rs 15." | 0 | 8 of 10 | 0 | 10 of 10 |

(A fifth run, his old posts + "write like these" without asking for the mix, came out short and plain but in English:
0 of 10 used his words, and 9 of 10 named a price we never gave: 5 said Rs 10, 4 made up Rs 12.)

Posts shown on screen, copied from the test (emojis drawn as doodles):
- fancy (try 5): "Indulge in the Spice of Life! Situated in the heart of Hyderabad, our roadside tea stall offers a taste of
  tradition and a touch of modern flair..."
- simple (try 3): "[Hyderabad's Hidden Gem] Hey there, tea lovers! Today, we're sipping on something special from our
  roadside tea stall in the heart of Hyderabad - GINGER TEA!"
- his posts (try 2): "Today special: Ginger tea Rs 10 only. Hot hot vellandi, immunity boostandi. Friends tho randi,
  ginger tea ready!"
- his posts + today's price (try 1): "Goodmorning! Today's special: Ginger tea Rs 15. Zing zing allam paani, vellandi!
  Friends tho randi, bench ready!"

Facts:
- Anthropic, Claude docs "Prompting best practices", "Use examples effectively": "Examples are one of the most reliable
  ways to steer Claude's output format, tone, and structure. A few well-crafted examples (known as few-shot or
  multishot prompting) improve accuracy and consistency"; make them diverse "so Claude doesn't pick up unintended
  patterns".
- Google, Gemini API docs "Prompt design strategies": "We recommend to always include few-shot examples in your prompts";
  examples regulate "the formatting, phrasing, scoping, or general patterning of model responses"; with too many
  examples "the model may start to overfit the response to the examples".
- Ours: a 7B open model on a laptop, 10 tries each, a small demo, not a benchmark. Bigger chatbots write better
  Telugu-English, but the copying (the old price) is the same habit the vendors warn about.

## Script (English)
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Raju | "Indulge in the Spice of Life"?! [1] Babu anna, is tea two hundred rupees now?! | street, the stall at dusk; Raju (khaki auto uniform) holds up Babu's phone at us: the post, "Indulge in the Spice of Life! ... a taste of tradition and a touch of modern flair", sparkle doodles; a "₹200?!" bubble by 1 s |
| 2 | Babu | Same fifteen rupees! [1] I only told the AI: make it fancy. | Babu with the kettle, towel on his shoulder; the stall board "TEA ₹15"; on [1] his prompt "...ginger tea. Make it fancy." and "our test: 8 of 10 tries came out 5-star" |
| 3 | Raju | Then tell it: normal! | |
| 4 | Babu | "Keep it simple"... [1] "Hey there, tea lovers!" | the phone: "Keep it simple and friendly." → "[Hyderabad's Hidden Gem] Hey there, tea lovers! Today, we're sipping on something special..." |
| 5 | Raju | Tea lovers?! You call me "Oi, Raju"! | tag "our test: 0 of 10 used Babu's words" |
| 6 | Swathi | Nanna, don't tell it how to write. [1] Show it. | Swathi arrives with college books |
| 8 | Swathi | Paste three of your old posts. [1] Say: write like these, same Telugu-English mix. | the phone: his three old posts slide in (each "Rs 10" underlined), then on [1] the prompt "Write today's post in the same style and the same Telugu-English mix. Today's special: ginger tea." |
| 7 | (card, after line 8) | | ONE QUESTION, held 2.6 s with a 3-2-1: "His old posts say Rs 10. Today's tea is Rs 15 (he didn't type it). What price will the AI write? A) ₹15  B) ₹10" (the caption asks "comment A or B") |
| 9 | Raju | Now that's Babu anna! [1] Ten rupees?! Give me ten! | the reply: "Today special: Ginger tea Rs 10 only. Hot hot vellandi, immunity boostandi. Friends tho randi, ginger tea ready!"; "our test: 9 of 10 used Babu's words"; on [1] "Rs 10" circled red, "5 of 10 copied last year's ₹10" |
| 10 | Babu | That's last year's price! | Babu, hands up, the kettle forgotten |
| 11 | Swathi | It copies everything in your old posts. [1] Put today's price in. | the phone: the same prompt + "Rs 15"; on [1] the reply "Goodmorning! Today's special: Ginger tea Rs 15. Zing zing allam paani, vellandi! Friends tho randi, bench ready!" with "Rs 15" circled green, "our test: 10 of 10 said ₹15"; the rule chip "SHOW 3 old posts + say today's facts" stays to the end |
| 12 | Babu | Fifteen. Perfect! [1] Now... make it fancy! | wide: Babu types (his prompt on the phone inset), Swathi facepalms, Raju gapes; cut to frame 1 (loops) |

The card is numbered 7 (it was after line 6 in v1). Never more than two lines from one person in a row; the AI never
speaks; 11 voiced lines, about 45 s.

## Script (Telugu; English on-screen text)
1. రాజు: "స్పైస్ ఆఫ్ లైఫ్" అంట! [1] బాబు అన్నా, టీ రెండొందలా ఇప్పుడు?!
2. బాబు: అదే పదిహేను రూపాయలు! [1] ఏఐ కి ఫ్యాన్సీగా రాయమన్నా, అంతే.
3. రాజు: మామూలుగా రాయమను!
4. బాబు: సింపుల్ గా రాయమన్నా... [1] "టీ లవర్స్" అంట!
5. రాజు: టీ లవర్సా?! నువ్వు నన్ను "ఒరేయ్ రాజు" అంటావ్!
6. స్వాతి: నాన్నా, ఎలా రాయాలో చెప్పకు. [1] చూపించు.
8. స్వాతి: నీ పాత పోస్టులు మూడు పెట్టు. [1] ఇలాగే, తెలుగు-ఇంగ్లీష్ కలిపి రాయి అను.
9. రాజు: ఇప్పుడు బాబు అన్నే! [1] పది రూపాయలా?! పది టీలు ఇవ్వు!
10. బాబు: అది పోయిన సంవత్సరం రేటు!
11. స్వాతి: పాత పోస్టుల్లో ఉన్నదంతా కాపీ కొడుతుంది. [1] ఈరోజు రేటు కూడా చెప్పు.
12. బాబు: పదిహేను. పర్ఫెక్ట్! [1] ఇప్పుడు... ఫ్యాన్సీగా రాయి!

## Sound
A bonk as Raju reads the hotel words in frame 1; a light bed; a lift into the challenge card; the card's 3-2-1 with ticks
and the bed dropping out on the 1; a "ding" when the post sounds like Babu; a drop right before "Ten rupees?!" with a
hit on it; the bed back up into the last line and a rise into the loop.

## Caption (draft)
"Babu's chai stall asked AI for a fancy post. Customers thought tea was ₹200 now. The fix: don't tell the AI how to
write, show it 3 of your own old posts. The catch: it copies everything in them, old prices too, so say today's price.
Works for office emails and WhatsApp messages too. Comment A or B: what price did you think it would write?
Our test (a small free model on a laptop, Qwen2.5 7B, 10 tries each): 'make it fancy' 8/10 5-star words; 'keep it
simple' 0/10 used his words; his 3 old posts + 'same style, same Telugu-English mix' 9/10 used his words but 5/10 said
last year's ₹10; with today's price in the prompt 10/10 said ₹15 (8/10 still in his words)." Pinned comment: the full
prompt to copy, the vendors' own advice (Anthropic, Google), our test's limits.
