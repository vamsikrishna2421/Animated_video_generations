# EP52 "Build RAG over your PDFs, Part 1" (Season 6, a screen tutorial) · queue 056 · script v3, Nov 13

## The format
A screen tutorial (Season 6), one narrator, the code and a chat drawn in our crayon style (as EP51). Verdict first
(HOW TO 03's losing middle, Bujji Nov 12): the result in frame 1, then three short steps, the test, the one miss.

## The lesson
RAG = give the AI the right part of your own document with the question, and make it answer only from that, with the
page. Part 1: a short PDF. Read it page by page; if it is short, send all of it, each page marked with its number (our
first try searched for "the best page" and picked the cover 9 times out of 10); tell it to answer only from the
document, say the page, and say "not in the document" when it isn't there. Then check the page it gives. Part 2:
PDFs too big to send whole (search by meaning).

## Bujji's notes applied
- Frame 1: a same-item money clash from our own test (EP47's control shape): the same repair, "₹1,450" vs "₹0".
  A stake from the viewer's life (an appliance warranty), the injustice (paying for a free repair), the AI culprit
  (our first bot read the cover page and said "Not in the document").
- No opinion or one-word ask: a try-it test in the caption. Verdict-first; Telugu line 1 on the clash.

## Our test (pipeline/ep52/: rag_demo.py, rag_fix.py, rag_full.py; series/scripts/ep52_demo/; each committed before it ran)
A 5-page warranty card we wrote for a made-up mixer grinder (MG-750, Sample Appliances: the motor 5 years, jars 1 year,
coupler 6 months; running over 3 minutes and dropped jars not covered; motor rewinding Rs 1,450 outside the warranty;
a technician within 72 hours; register within 30 days for one more year). The same small free AI as EP51 (Qwen2.5-7B,
4-bit, llama.cpp, on our computer, no web search), temperature 0.2. Ten questions, answers fixed first, read by hand:
| run | right | what happened |
|---|---|---|
| no PDF | 0 of 10 | 9 asked for the warranty card; 1 guessed "generally 30 days" (right by luck) |
| search: the page with the most words in common | 1 of 10 | it picked the cover page 9 times (every question says "MG-750 mixer"; so does the cover, and only the cover): 9 x "Not in the document. (page 1)" |
| search: rare words count more | 1 of 10 | still the cover ("MG-750" is only on the cover, so it counts as rare) |
| send all 5 pages, each marked "--- page N ---" | 9 of 10 | right with the right page 7 times; q8 right but "page 3" (it's page 4); q10 "Not in the document" (right: the power cord isn't in it); the miss, q3 "I ran it 10 minutes non-stop, is it covered?": "Not in the document", but page 4 says it isn't covered. About 450 prompt tokens a question |

## The code on screen (the steps our test ran, Python; pypdf's own docs: PdfReader, page.extract_text())
```
from pypdf import PdfReader
reader = PdfReader("warranty.pdf")
pages = [p.extract_text() for p in reader.pages]
doc = "".join(f"--- page {i+1} ---\n{t}\n"
              for i, t in enumerate(pages))
rules = ("Answer only from the document. "
         "Say the page. If it isn't there, "
         "say: Not in the document.")
messages = [{"role": "system", "content": rules},
  {"role": "user", "content": doc + question}]
```
Anthropic's prompting guide: "Place your long documents and inputs near the top of your prompt, above your query" (our
prompt: the pages first, then the question).

## Hook options
1. **(v1)** The chat: "My mixer's motor burnt out at 2 years. Covered?" -> our first bot: "Not in the document. (page
   1)", stamped; beside it the PDF's page 3 lit: "The motor is covered for 5 years". Blocks: "OUR FIRST BOT: pay ₹1,450" vs
   "PAGE 3 OF YOUR PDF: ₹0". Line 1 says both within 2 s.
2. "9 of 10 times it read the cover page": a number, no stake.
3. The code first: no.

## Script review (human-viewer, v1) and what changed (v2)
Both: the ₹ stake hooks; the loop didn't pay off ("free" given away at 0:02, the fixed bot never answered the hook
question). Priya: the hook's question was never asked in the test; "₹0" for a burnt motor ignores page 4's exclusions;
the bot never said "pay"; "nine of ten, with the page" hid that 7 had the right page (q8 said page 3, it's page 4); the
habit must cover wrong pages too; "won't fit" only holds for a small model (the issue is sending it every time).
Sandeep: say "mixie"; the code loses him; Telugu "చెప్పు" three times sounds like scolding; "పద్నాలుగు వందల యాభై".
Changed (v2): frame 1 shows the real q1 and its real reply ("Not in the document. (page 1)"), blocks "OUR FIRST BOT:
'not in it' ₹1,450?" vs "PAGE 3: THE MOTOR · 5 YEARS"; line 2 "you might pay for a repair that's covered"; line 5 says why
the cover won; line 8 "nine right, seven with the right page"; line 9 "open the page it gives, every time, and the PDF
when it says it's not there"; line 10 "too big to send with every question" and the fixed bot's real answer ("covered for
5 years ... (page 3)") before the loop; step 2 "send every page, numbered"; the code wrapped for a portrait screen;
Telugu "బాట్ కి ఇలా చెప్పండి: ... చెప్పాలి", "పద్నాలుగు వందల యాభై"; the caption's try-it uses 2-3 labelled pages.

## v3 (length): the English ran 85.5 s, so lines 2, 5, 6 and 9 went back to their core and the detail moved on screen
- line 2 "The bot had read the cover page." (chip: "trust the bot → pay ₹1,450 for a covered repair")
- line 5 "...and picked the cover nine times out of ten." (chip: every question said "MG-750": only the cover did too)
- line 6 "Send every page, numbered." (chip: 5 pages ≈ 450 tokens a question)
- line 9 "So open the page it gives, every time." (chip: "not there"? open the PDF yourself)
- gaps 0.3-0.4 s, end pad 1.2 s; the Telugu lines trimmed the same way. Result: 71.5 s EN, 74.7 s TE.
- Telugu: Parler said "బాట్" as "bod"/"vaad" (the review transcript), so line 2 says "అది చదివింది కవర్ పేజీ" and line 7
  "దానికి ఇలా చెప్పండి".

## Script (English, v3; narrator)
| # | Line |
|---|---|
| 1 | Five years of warranty, or fourteen hundred and fifty rupees? [1] We asked our first PDF bot about a mixer's motor. It said: not in the document. |
| 2 | Page three says: covered for five years. [1] The bot had read the cover page. |
| 3 | Let's build it right: [1] a bot that answers from your own PDF, and shows the page. |
| 4 | Step one: read the PDF, page by page. [1] Three lines of code. |
| 5 | Our first try searched for the best page, [1] and picked the cover nine times out of ten. |
| 6 | Step two, for a short PDF: don't search. [1] Send every page, numbered. |
| 7 | Step three: give it the rules. [1] Answer only from the document, say the page, and if it isn't there, say so. |
| 8 | Our test, ten questions. [1] No PDF: zero. First search: one. / [2] All five pages: nine right, seven with the right page. |
| 9 | One said not in the document, but page four had it. [1] So open the page it gives, every time. |
| 10 | A three-hundred-page manual is too big to send with every question: that's Part 2. [1] And the motor question now? Five years, page three. |

## Script (Telugu, v3)
| # | Telugu |
|---|---|
| 1 | ఐదేళ్ళ వారంటీయా, లేక పద్నాలుగు వందల యాభై రూపాయలా? [1] మిక్సీ మోటార్ గురించి మా మొదటి పీడీఎఫ్ బాట్ ని అడిగాం. డాక్యుమెంట్ లో లేదు అంది. |
| 2 | మూడో పేజీలో ఉంది: మోటార్ కి ఐదేళ్ళ వారంటీ. [1] అది చదివింది కవర్ పేజీ. |
| 3 | సరిగ్గా తయారు చేద్దాం: [1] మీ సొంత పీడీఎఫ్ నుంచి జవాబు చెప్పి, పేజీ చూపించే బాట్. |
| 4 | స్టెప్ వన్: పీడీఎఫ్ ని పేజీ పేజీగా చదవండి. [1] మూడు లైన్ల కోడ్. |
| 5 | మా మొదటి ప్రయత్నం బెస్ట్ పేజీ కోసం వెతికింది, [1] పదిలో తొమ్మిది సార్లు కవర్ పేజీనే తీసుకుంది. |
| 6 | స్టెప్ టూ, చిన్న పీడీఎఫ్ అయితే: వెతకొద్దు. [1] ప్రతి పేజీని నంబర్ తో పంపండి. |
| 7 | స్టెప్ త్రీ: దానికి ఇలా చెప్పండి: / [1] డాక్యుమెంట్ లో ఉన్నదే చెప్పాలి, పేజీ నంబర్ చెప్పాలి, లేకపోతే లేదని చెప్పాలి. |
| 8 | మా టెస్ట్, పది ప్రశ్నలు. [1] పీడీఎఫ్ లేకుండా: సున్నా. మొదటి సెర్చ్: ఒకటి. / [2] ఐదు పేజీలూ ఇస్తే: తొమ్మిది సరైనవి, ఏడింటిలో పేజీ కూడా సరైనదే. |
| 9 | ఒక జవాబు డాక్యుమెంట్ లో లేదు అంది, కానీ నాలుగో పేజీలో ఉంది. / [1] అందుకే, అది చెప్పిన పేజీ ప్రతిసారీ తెరిచి చూడండి. |
| 10 | మూడొందల పేజీల మాన్యువల్ ని ప్రతి ప్రశ్నకీ పంపలేం: అది పార్ట్ టూ. / [1] ఇప్పుడు మోటార్ ప్రశ్న? ఐదేళ్ళు, మూడో పేజీ. |

## Caption ask (a try-it test)
"Try it: paste 2-3 pages of your own warranty card or bill into an AI chat, each labelled 'page 1', 'page 2'..., and
ask a question with 'answer only from this, say the page'. Did it give the right page? Comment PAGE or NO PAGE."
