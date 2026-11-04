# EP44 "Privacy: what happens to your data" (Season 5: Responsible AI) · queue 047 · script v1, Nov 4

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
  with Keep Activity off, are kept with the account for 72 hours; temporary chats are not used to train Google's models.
- OpenAI Help Center (checked Nov 2): deleted chats are removed from its systems within 30 days; temporary chats are
  not used for training and are kept up to 30 days (caption only).

## Our demo (pipeline/ep44/redact_demo.py, series/scripts/ep44_demo/7B.json)
Committed before it ran. Qwen's own 4-bit GGUF of Qwen2.5-7B-Instruct, llama.cpp, 4 CPU cores, offline (an empty network
namespace), temperature 0.7, 10 replies each way, every reply read by hand. A made-up October statement (salary
₹48,500; rent, groceries, school fee, chit; 14 food-delivery orders = ₹7,380) and the ask "Where is my money going? Tell
me the one biggest thing I can cut, and how much it cost me this month."

| way | named food delivery as the cut | its total right (₹7,380) | repeated an ID |
|---|---|---|---|
| with her name, account no., PAN, mobile, branch | **9 of 10** (try 1: the chit fund) | 0 of 10 | 0 |
| the same, blanked: [NAME] [ACCOUNT] [PAN] [MOBILE] [BRANCH] | **10 of 10** | 0 of 10 | 0 |

Its totals were wrong both ways (₹3,470 to ₹14,500): on the result card as a footnote, not a story beat.

## Hook options
1. **(kept)** Frame 1: Amma's phone, her pasted statement struck through with "Chat deleted ✓"; two chips: DELETED
   "1 tap" (green) vs A REVIEWED COPY "3 years" (red); Chinnu pointing, Amma worried.
2. Amma typing her PAN into the chat while Chinnu lunges for the phone (no number: dropped).
3. "Your PAN, kept till 2029" over the chat (true only for a reviewed chat; needs the qualifier in frame 1: dropped).
Kept 1: the stake, the clash and the injustice in one look; the qualifier ("a reviewed copy") on the red chip.

## Script (English) · ~45 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Chinnu | One tap to delete it, Amma... [1] but a copy can stay three years?! | frame 1: her AI chat "Where is my money going?..." with "Account no: 0123 4567 8901", "PAN: ABCDE1234F", struck through, "Chat deleted ✓"; DELETED "1 tap" · A REVIEWED COPY "3 years, kept, up to" · "Google's own Gemini privacy page (Oct 2026)" |
| 2 | Amma | With my account number? [1] And my PAN?! | her account number and PAN circled in red |
| 3 | Chinnu | Some chats are read by a person, to improve the AI. [1] Deleting doesn't delete their copy. | insert (~6 s): WHERE YOUR CHAT GOES: YOUR CHAT → SAVED IN YOUR ACCOUNT (delete it: gone ✓) · SOME CHATS (read by a person, a reviewer) → THEIR COPY: KEPT UP TO 3 YEARS (deleting your chat doesn't delete it); the page's words; Amma's face in the corner |
| 4 | Amma | I only asked where my salary goes! | "I only asked: where does my salary go?" |
| 5 | Chinnu | The app's own page says: [1] don't type what you wouldn't want a reviewer to see. | THE APP'S OWN PRIVACY PAGE: "Please don't enter confidential information that you wouldn't want a reviewer to see." Google, Gemini Apps Privacy Hub |
| 6 | Amma | But it needs my details to help me! | "It needs my details to help!" |
| 7 | Chinnu | We tested it. Your statement, ten times with your numbers, / [1] ten times with them blanked out. | OUR TEST: a small free AI (Qwen2.5 7B), offline · try yours · the same October statement · 10 tries each way · WITH HER IDs (Saroja Devi Kolli · 0123 4567 8901 · ABCDE1234F) · BLANKED OUT ([NAME] · [ACCOUNT] · [PAN]) |
| 8 | Amma | And? | "Which one found where her money goes?" |
| 9 | Chinnu | With them, nine of ten. Without them, ten of ten! [1] It never needed your PAN. | named food delivery (14 orders) as the thing to cut: with her IDs 9 of 10 · blanked out 10 of 10 · "it never needed her IDs" |
| 10 | Amma | So I just blank them out? |  |
| 11 | Chinnu | Name, account, PAN: [1] blank them before you paste. | BEFORE YOU PASTE, BLANK: your name → [NAME] · account number → [ACCOUNT] · PAN, Aadhaar → [PAN] · "the AI still helps: it never needed them" |
| 12 | Amma | Done! [1] And I'll send the passbook photo too! | her chat: the blanked statement "sent ✓", then "passbook.jpg" attached |
| 13 | Chinnu | Amma, the photo has your account numb— | the photo's "A/C 0123 4567 8901" circled → frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu |
|---|---|---|
| 1 | Chinnu | అమ్మా, ఒక్క ట్యాప్ తో డిలీట్ చేశావు... [1] కానీ ఒక కాపీ మూడేళ్ళు ఉండొచ్చా?! |
| 2 | Amma | నా అకౌంట్ నంబర్ తో? [1] నా పాన్ కార్డ్ తో?! |
| 3 | Chinnu | కొన్ని చాట్లు ఒక మనిషి చదువుతారు, చాట్ బాట్ ని మెరుగుపరచడానికి. [1] డిలీట్ చేసినా, వాళ్ళ కాపీ పోదు. |
| 4 | Amma | నా జీతం ఎక్కడికి పోతుందో అడిగానంతే! |
| 5 | Chinnu | ఆ యాప్ పేజీలోనే ఉంది: [1] రివ్యూయర్ చూడకూడనిది టైప్ చేయొద్దు. |
| 6 | Amma | కానీ నా వివరాలు లేకపోతే అది ఎలా హెల్ప్ చేస్తుంది? |
| 7 | Chinnu | టెస్ట్ చేశాం. నీ స్టేట్మెంట్, పది సార్లు నీ నంబర్లతో, / [1] పది సార్లు అవి తీసేసి. |
| 8 | Amma | ఏమైంది? |
| 9 | Chinnu | అవి ఉన్నప్పుడు పదిలో తొమ్మిది. లేకపోతే పదికి పది! [1] దానికి నీ పాన్ కార్డ్ అక్కర్లేదు. |
| 10 | Amma | అయితే అవి తీసేస్తే చాలా? |
| 11 | Chinnu | పేరు, అకౌంట్, పాన్: [1] పేస్ట్ చేసే ముందే తీసేయ్. |
| 12 | Amma | అయిపోయింది! [1] పాస్ బుక్ ఫోటో కూడా పంపిస్తా! |
| 13 | Chinnu | అమ్మా, ఆ ఫోటోలో నీ అకౌంట్ నంబ— |

Telugu notes: no "ఏఐ" in voiced text ("చాట్ బాట్"); "పాన్ కార్డ్", not "పాన్" alone (betel leaf); "మళ్ళీ" avoided (EP42:
heard near a vulgar phrase); numbers mid-line; to check on the transcripts: no word one slipped letter from a swear word.

## Caption ask (an opinion on the conflict; caption only, Standing Rule: don't design for comments)
Have you ever pasted your bank statement, Aadhaar or salary slip into an AI chat? Would you now?

## Next episode
EP45: Deepfakes and how to spot them.
