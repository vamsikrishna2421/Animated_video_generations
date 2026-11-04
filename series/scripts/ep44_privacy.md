# EP44 "Privacy: what happens to your data" (Season 5: Responsible AI) · queue 047 · script v3 (as rendered), Nov 4

## The lesson
What you paste into an AI chat doesn't stay between you and the app. Some chats are read by human reviewers to improve
the AI, and a reviewed copy is kept apart from your account, so deleting the chat doesn't delete it. The AI almost never
needs your IDs to help: blank out names and numbers before you paste. The limit: a photo, a PDF or a screenshot carries
the numbers too.

## The reach stack (Standing Rule, Nov 3; the one changed variable: the hook is built life-first)
1. A stake from her own life: Amma's bank statement, her account number and PAN, pasted to ask where her salary goes.
2. Two clashing numbers in frame 1, readable with the sound off: DELETED "1 tap" vs A REVIEWED COPY "3 years".
3. The injustice: she deleted it and thinks it's gone; the app keeps a copy. The app is the culprit, she is wronged.
Line 1 says both numbers within ~2.5 s. Length (~45 s) and the caption shape stay as EP43's.

## Facts and sources (checked Nov 4, 2026)
- Google, Gemini Apps Privacy Hub (support.google.com/gemini/answer/13594961, updated Oct 26, 2026): "A subset of chats
  are reviewed by human reviewers" (including trained service providers) to improve Google services; "Reviewed chats are
  retained for up to three years"; chats reviewed by human reviewers "are not deleted when you delete your activity";
  "Please don't enter confidential information that you wouldn't want a reviewer to see"; temporary chats, and chats
  with Keep Activity off, are kept with the account for 72 hours; temporary chats are not used to train Google's models;
  "To stop your future chats from being reviewed to improve Google services, turn off your Keep Activity setting" (Google
  still uses chats "to respond to you and help protect Google, our users, and the public"; feedback you send is reviewed).
- OpenAI Help Center (checked Nov 2, again Nov 4 through search: the pages refuse our fetch): deleted chats are removed
  within 30 days; temporary chats are not used for training and are deleted after 30 days; turning off "Improve the model
  for everyone" stops future chats from training its models (they can still be reviewed for abuse). On screen only as
  the switch-off row and "ChatGPT: deleted chats go within 30 days" (so the 3-year copy reads as Gemini's rule).

## Our demo (pipeline/ep44/redact_demo.py, series/scripts/ep44_demo/7B.json)
Committed before it ran. Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline (an empty network
namespace), temperature 0.7, 10 replies each way, every reply read by hand. A made-up October statement (salary
₹48,500; rent, groceries, school fee, chit; 14 food-delivery orders = ₹7,380) and the ask "Where is my money going? Tell
me the one biggest thing I can cut, and how much it cost me this month."

| way | named food delivery as the cut | its total right (₹7,380) | repeated an ID |
|---|---|---|---|
| with her name, account no., PAN, mobile, branch | **8 of 10** (try 1: the chit fund; try 5: rent, food delivery only as an aside) | 0 of 10 | 0 |
| the same, blanked: [NAME] [ACCOUNT] [PAN] [MOBILE] [BRANCH] | **10 of 10** | 0 of 10 | 0 |

Its totals were wrong both ways (₹3,470 to ₹14,500): on the result card in red ("wrong every time, 0 of 20"), not a
story beat. 8 vs 10 of 10 is a tie at this size: one bar colour, "no worse without her IDs", and the voice says "with or
without your numbers, it found the food orders".

## Hook options
1. **(kept)** Frame 1: Amma's phone, her pasted statement struck through with "Chat deleted ✓"; two chips: DELETED
   "1 tap" (green) vs A REVIEWED COPY "3 years" (red); Chinnu pointing, Amma worried.
2. Amma typing her PAN into the chat while Chinnu lunges for the phone (no number: dropped).
3. "Your PAN, kept till 2029" over the chat (true only for a reviewed chat; needs the qualifier in frame 1: dropped).
Kept 1: the stake, the clash and the injustice in one look; the qualifier ("a reviewed copy") on the red chip.

## Script review (human-viewer, v1) and what changed
Both would stop (hook 6 and 6) and would blank their PAN after; Amma and the passbook loop worked. Both: the hook
overclaimed ("a copy can stay three years") and line 3 took it back; "a reviewed copy" read as a movie review; "nine of
ten! ten of ten!" oversold a tie. Sandeep: "their copy: whose?", "the app's page: which app? I use ChatGPT", the test
card a wall of text. Priya: strictly 8 of 10 (try 5 named rent); the totals wrong 20 of 20 can't hide in a footnote;
"which setting?" unanswered. Changed: line 1 "...but if a person read it, it can stay three years!" with the chips
DELETED IN "1 tap" / KEPT UP TO "3 years, if a person read it"; line 3 "Reviewers at the company read some chats... That
copy isn't deleted when you delete yours."; line 5 names Gemini's own privacy page; line 9 "With or without your
numbers, it found the food orders."; the test card halved, the IDs marked made up, the right answer shown before the
result; the rule card adds Aadhaar and the switch-off rows; a hit on "three years". Telugu: "ఎవరైనా చదివితే నీకు ఇబ్బంది
అనిపించేది" (not "చూడకూడనిది", said of adult content); "కంపెనీ మనుషులు... బెటర్ చేయడానికి"; "పాన్ కార్డ్" always;
"సరిపోతుందా?" (not "చాలా?"); "తీసేశా!" (not "అయిపోయింది!").

## Render review (human-viewer, EN + TE) and what changed
Both stopped on frame 1 (hook 7 and 6) and would blank their PAN; "And?" held them; the loop is clean. Both: "if a person
read it: which person, someone at home?"; the switch-off tip, the one thing they'd save, was on screen 2 s and tiny; the
passbook number was unreadable, so the loop's point was lost with the sound off; the music never built (quarters within
1 dB, no opening hit). Priya: Gemini big in frame 1; the red and green bars sold "blanking makes it smarter"; ChatGPT only
on the switch-off card makes people think it keeps 3 years too; "Improve the model" stops training, not review. Telugu:
"ముందే" heard with a hard ḍ, near a slur; "ప్రైవసీ" heard "ప్రవాసి" (a migrant); "చేశాం" heard "చేశావ్"; the music 12 dB
under the voice in the gaps; the salary bubble cut off at the left. Changed: line 1 "...but if Gemini's reviewers read
it..." (TE "గూగుల్ వాళ్ళు చదివుంటే"), the chip and a bigger source pill name Gemini; line 11 gains a second take, "And in
Gemini, switch off Keep Activity." with the switch-off rows on it, held ~2 s, the ChatGPT row "(stops training on your
chats, not review)"; the insert adds "(ChatGPT: deleted chats go within 30 days)"; one bar colour; "its totals: wrong
every time (0 of 20)" in red; the passbook photo full-width with its A/C number circled before the slam; a louder opening
hit, a riser into each insert, the scenes stepped 0.9 / 1.25 / 1.75 with a bigger rise; EN gap music down (0.95), TE up
(2.0); Telugu line 11 "ఇవి తీసేశాకే పేస్ట్ చెయ్", line 5 "జెమినీ సొంత పేజీలోనే ఉంది", line 7 "మేం టెస్ట్ చేశాం". Not
changed: the length (~54 s: one variable per episode, the hook); the test on a small offline model (the card says so; it
shows the IDs aren't needed, not what Gemini does).

## Script (English) · ~54 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Chinnu | One tap to delete, Amma... [1] but if Gemini's reviewers read it, it can stay three years! | frame 1: her AI chat "Where is my money going?..." with "Account no: 0123 4567 8901", "PAN: ABCDE1234F", struck through, "Chat deleted ✓"; DELETED IN "1 tap" · KEPT UP TO "3 years, if Gemini's reviewers read it" · "Gemini's own privacy page (Google, Oct 2026)" |
| 2 | Amma | With my account number? [1] And my PAN?! | her account number and PAN circled in red |
| 3 | Chinnu | Reviewers at the company read some chats, to improve the AI. [1] That copy isn't deleted when you delete yours. | insert (~6 s): WHERE YOUR CHAT GOES: YOUR CHAT → SAVED IN YOUR ACCOUNT (delete it: gone ✓) · SOME CHATS (a person reads them) → THAT COPY: KEPT UP TO 3 YEARS (even after you delete yours); Google, Gemini Apps Privacy Hub; (ChatGPT: deleted chats go within 30 days); Amma's face in the corner |
| 4 | Amma | I only asked where my salary goes! | "I only asked: where does my salary go?" |
| 5 | Chinnu | Gemini's own privacy page says: [1] don't type what you wouldn't want a reviewer to see. | THE APP'S OWN PRIVACY PAGE: "Please don't enter confidential information that you wouldn't want a reviewer to see." Google, Gemini Apps Privacy Hub |
| 6 | Amma | But it needs my details to help me! | "It needs my details to help!" |
| 7 | Chinnu | We tested it. Your statement, ten times with your numbers, / [1] ten times with them blanked out. | OUR TEST: a small free AI on a laptop, offline (Qwen2.5 7B) · 10 tries each way · HER STATEMENT + IDs (0123 4567 8901 · ABCDE1234F, made up) · THE SAME, BLANKED ([ACCOUNT] · [PAN]) |
| 8 | Amma | And? | the right answer: cut the 14 food orders (₹7,380 this month) |
| 9 | Chinnu | With or without your numbers, it found the food orders. [1] It never needed your PAN. | said "cut the food orders": with her IDs 8 of 10 · blanked 10 of 10 (one colour) · "no worse without her IDs" · "its totals: wrong every time (0 of 20)" |
| 10 | Amma | So I just blank them out? |  |
| 11 | Chinnu | Your name, your account number, your PAN: [1] blank them out before you paste. / [2] And in Gemini, switch off Keep Activity. | BEFORE YOU PASTE, BLANK: your name → [NAME] · account number → [ACCOUNT] · PAN → [PAN] · Aadhaar → [AADHAAR] · AND SWITCH OFF: Gemini → Keep Activity (no human review of your next chats) · ChatGPT → "Improve the model for everyone" (stops training on your chats, not review) |
| 12 | Amma | Done! [1] And I'll send the passbook photo too! | her chat: the blanked statement "sent ✓", then "passbook.jpg" attached |
| 13 | Chinnu | Amma, the photo has your account numb— | the passbook photo full-width, "A/C No: 0123 4567 8901" circled → frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Chinnu | అమ్మా, ఒక్క ట్యాప్ తో డిలీట్ చేశావు... [1] కానీ గూగుల్ వాళ్ళు చదివుంటే, ఆ కాపీ మూడేళ్ళ దాకా ఉండొచ్చు! |
| 2 | Amma | నా అకౌంట్ నంబరూ? [1] పాన్ కార్డ్ నంబరూ?! |
| 3 | Chinnu | కొన్ని చాట్లని కంపెనీ మనుషులు చదువుతారు, చాట్ బాట్ ని బెటర్ చేయడానికి. [1] నువ్వు డిలీట్ చేసినా, ఆ కాపీ పోదు. |
| 4 | Amma | నా జీతం ఎక్కడికి పోతుందో అడిగానంతే! |
| 5 | Chinnu | జెమినీ సొంత పేజీలోనే ఉంది: [1] ఎవరైనా చదివితే నీకు ఇబ్బంది అనిపించేది టైప్ చేయొద్దు. |
| 6 | Amma | కానీ నా వివరాలు లేకపోతే, అది ఎలా సాయం చేస్తుంది? |
| 7 | Chinnu | మేం టెస్ట్ చేశాం. నీ స్టేట్మెంట్, పది సార్లు నీ నంబర్లతో, / [1] పది సార్లు అవి తీసేసి. |
| 8 | Amma | ఏమైంది? |
| 9 | Chinnu | నంబర్లు ఉన్నా, లేకపోయినా, ఫుడ్ డెలివరీ తగ్గించమంది! [1] దానికి నీ పాన్ కార్డ్ అక్కర్లేదు. |
| 10 | Amma | అయితే తీసేస్తే సరిపోతుందా? |
| 11 | Chinnu | పేరు, అకౌంట్, పాన్ కార్డ్: [1] ఇవి తీసేశాకే పేస్ట్ చెయ్. / [2] జెమినీ లో, కీప్ యాక్టివిటీ ఆఫ్ చెయ్. |
| 12 | Amma | తీసేశా! [1] పాస్ బుక్ ఫోటో కూడా పంపిస్తా! |
| 13 | Chinnu | అమ్మా, ఆ ఫోటోలో నీ అకౌంట్ నంబ— |

Telugu notes: no "ఏఐ" in voiced text ("చాట్ బాట్"); "పాన్ కార్డ్", not "పాన్" alone (betel leaf); "మళ్ళీ" avoided (EP42:
heard near a vulgar phrase); numbers mid-line; to check on the transcripts: no word one slipped letter from a swear word.

## Caption ask (an opinion on the conflict; caption only, Standing Rule: don't design for comments)
Have you ever pasted your bank statement, Aadhaar or salary slip into an AI chat? Would you now?

## Next episode
EP45: Deepfakes and how to spot them.
