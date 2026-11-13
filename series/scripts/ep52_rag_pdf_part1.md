# EP52 "Build RAG over your PDFs, Part 1" (Season 6, a screen tutorial) · queue 056 · script v1, Nov 13

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

## The code on screen (the steps our test ran, Python)
```
from pypdf import PdfReader
pages = [p.extract_text() for p in PdfReader("warranty.pdf").pages]
doc = "\n".join(f"--- page {i+1} ---\n{t}" for i, t in enumerate(pages))
rules = "Answer only from the document. Say the page. If it isn't there, say: Not in the document."
messages = [{"role": "system", "content": rules},
            {"role": "user", "content": doc + "\n\nQuestion: " + question}]
```

## Hook options
1. **(v1)** The chat: "My mixer's motor burnt out at 2 years. Covered?" -> our first bot: "Not in the document. (page
   1)", stamped; beside it the PDF's page 3 lit: "The motor is covered for 5 years". Blocks: "OUR FIRST BOT: pay ₹1,450" vs
   "PAGE 3 OF YOUR PDF: ₹0". Line 1 says both within 2 s.
2. "9 of 10 times it read the cover page": a number, no stake.
3. The code first: no.

## Script (English, v1; narrator) · ~65 s
| # | Line | Picture |
|---|---|---|
| 1 | Fourteen hundred and fifty rupees, or free? [1] Our first bot read the warranty PDF and said: not in the document. | the chat, the stamp, the blocks |
| 2 | Page three says the motor is covered for five years. [1] The bot had read the cover page. | page 3 lit; page 1 with an arrow |
| 3 | Let's build it right: [1] an AI that answers from your own PDF, and shows the page. | title, 3 steps |
| 4 | Step one: read the PDF, page by page. [1] Two lines of Python. | the editor: pypdf |
| 5 | Step two: give it the right pages. [1] Our first try searched for the best page, and picked the cover nine times out of ten. | the cover page winning, 9 of 10 |
| 6 | A short PDF? Don't search. [1] Send every page, each marked with its number. | the doc string with page markers |
| 7 | Step three: the rules. [1] Answer only from the document, say the page, and if it isn't there, say so. | the rules line |
| 8 | Our test, ten questions. [1] No PDF: zero. Our first search: one. [2] All five pages: nine of ten, with the page. | the test card |
| 9 | The one it missed said "not in the document", [1] but page four had it. So when it says that, open the PDF yourself. | the miss card |
| 10 | A three-hundred-page manual won't fit: that's Part 2. [1] Now ask again: fourteen fifty, or free? | -> frame 1 |

## Script (Telugu, v1)
| # | Telugu |
|---|---|
| 1 | వెయ్యి నాలుగు వందల యాభై రూపాయలా, లేక ఫ్రీ నా? [1] మా మొదటి బాట్ వారంటీ పీడీఎఫ్ చదివి, డాక్యుమెంట్ లో లేదు అంది. |
| 2 | మూడో పేజీ చెప్తోంది: మోటార్ కి ఐదేళ్ళ వారంటీ. [1] బాట్ చదివింది కవర్ పేజీ. |
| 3 | సరిగ్గా తయారు చేద్దాం: [1] మీ సొంత పీడీఎఫ్ నుంచి జవాబు చెప్పి, పేజీ చూపించే బాట్. |
| 4 | స్టెప్ వన్: పీడీఎఫ్ ని పేజీ పేజీగా చదవండి. [1] రెండు లైన్ల పైథాన్. |
| 5 | స్టెప్ టూ: సరైన పేజీలు ఇవ్వండి. / [1] మా మొదటి ప్రయత్నం బెస్ట్ పేజీ వెతికింది, పదిలో తొమ్మిది సార్లు కవర్ పేజీనే తీసుకుంది. |
| 6 | చిన్న పీడీఎఫ్ అయితే వెతకొద్దు. [1] ప్రతి పేజీ, దాని నంబర్ తో సహా పంపండి. |
| 7 | స్టెప్ త్రీ: రూల్స్. / [1] డాక్యుమెంట్ నుంచే జవాబు చెప్పు, పేజీ చెప్పు, లేకపోతే లేదని చెప్పు. |
| 8 | మా టెస్ట్, పది ప్రశ్నలు. [1] పీడీఎఫ్ లేకుండా: సున్నా. మొదటి సెర్చ్: ఒకటి. / [2] ఐదు పేజీలూ ఇస్తే: పదిలో తొమ్మిది, పేజీ తో సహా. |
| 9 | మిస్ అయిన ఒక్కటి, డాక్యుమెంట్ లో లేదు అంది, [1] కానీ నాలుగో పేజీలో ఉంది. అలా అంటే, పీడీఎఫ్ మీరే తెరిచి చూడండి. |
| 10 | మూడొందల పేజీల మాన్యువల్ పట్టదు: అది పార్ట్ టూ. [1] ఇప్పుడు మళ్ళీ అడగండి: వెయ్యి నాలుగు వందల యాభై, లేక ఫ్రీ? |

## Caption ask (a try-it test)
"Try it: paste one page of your own warranty card or bill into an AI chat and ask a question about it, with 'answer only
from this, say the page'. Did it quote the page? Comment PAGE or NO PAGE."
