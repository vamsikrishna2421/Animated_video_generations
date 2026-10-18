# EP33 "We don't sell headaches" (RAG part 3: hybrid search and measuring it) — script v2, for the user's recording

First teaching-skit episode (ROUTINE.md run 1) and the first one voiced by the user: the user records every line, both
characters, English and (if possible) Telugu; we cut the recording into lines and build the video on it. The AI's lines
get the phone-speaker sound in the mix (skit 02's caller filter), so one voice can play both parts. Loops like skit 01.

v1 -> v2 (viewer script review: both would stop on the hook and laughed at "We don't sell headaches"; they would
swipe in the joke-less test stretch): "three pages" explained (chip "reads 3 of 15 pages", "the three closest to the
order"); "Both" no longer sounds like reading six pages ("Still three pages", STILL 3 PAGES on the merge and the bar);
"OUR REAL TEST" on the sheet; the quiz is an overlay with no hold (the hold sat between the setup and the best joke);
the end card is three words, up from line 22; "fifteen out of twenty" (the phone sound can turn -teen into -ty); the
delivery-boy line for the test; Ravi's "Eighteen" counts lost customers; a real loop: writing the two facts in gives
20/20, then Ravi switches keyword search off and the next order is E-1203, which is frame 1; the code moved out of
Ravi's shouted line 1 into the AI's calm line 2. Telugu: "artham emundi", "exact ga", "order ki daggaraga unna",
"word" for "padam", "meaning search" in line 17, -andi on line 2, "eppudoo"/"okkatee" spelled for long vowels.

Cast: RAVI ANNA, kirana shop owner, Hyderabad (skit 01). The shop's AI: the channel's student robot on a phone on the
counter, calm and deadpan; since skit 01 it reads the stock book before every order instead of remembering prices.
Ravi talks to it informally; it answers him politely (Telugu: మీరు / -ండి, as in skit 01).

## The real AI idea (verified)
- Keyword search (BM25) finds the exact words you typed; meaning search (embeddings) finds text that means something
  close. Anthropic, "Introducing Contextual Retrieval" (Sep 19, 2024): "While embedding models excel at capturing
  semantic relationships, they can miss crucial exact matches"; an embedding model "could miss the exact 'TS-999'
  match"; BM25 "is particularly effective for queries that include unique identifiers or technical terms".
- Hybrid search runs both and merges the two ranked lists. Microsoft Learn, Azure AI Search "Hybrid search overview"
  (updated Aug 31, 2026): it "runs full-text search and vector search in parallel" and "merges results from each query
  by using Reciprocal Rank Fusion (RRF)"; "querying over product codes, highly specialized jargon, dates, and people's
  names, perform better with keyword search because it can identify exact matches". RRF: Cormack, Clarke and Büttcher,
  SIGIR 2009 (score = sum of 1 / (60 + rank)).
- Measuring retrieval: a test set of questions whose right document you know, and the hit rate (did a right piece come
  back in the top k?). Standard practice; see the RAG evaluation survey arXiv:2504.14891 (2025).

## Our demo (real, run by us: `pipeline/ep33/hybrid_demo.py`, data in `series/scripts/ep33_demo/`)
Ravi's made-up stock book: 114 lines (code, item, pack, price), cut into notebook pages of 8 lines in book order (15
pages; EP32: RAG reads pieces, not the whole book). 20 test orders whose right item we know: 4 item codes, 4 local names,
8 that describe the thing, 3 mixed, 1 whose answer is written nowhere. The AI reads the top 3 pages for each order; a hit
= a page holding a right item is among them. Same small free models as EP32 (BAAI/bge-small-en-v1.5, BM25), CPU only.

| Search | Right page in the 3 read (of 20) | Right page first |
|---|---|---|
| Meaning only | 15 | 12 |
| Keyword only | 13 | 12 |
| Both (hybrid, RRF) | 18 | 14 |
| Both, after writing the two missing facts into the book | 20 | 15 |

- "E-1203" (AAA batteries): meaning search's 3 pages don't hold it (it sits on page 14); keyword search finds page 14.
- "something for a headache": keyword search finds zero matches (no line says "headache"); meaning search brings the
  page with "Pain relief balm" first.
- Hybrid misses two: "something to wash vessels" (keyword search grabs the page with "Hand wash" for the word "wash";
  neither search brings the dishwash page) and "Ramesh garu's usual" (written nowhere). Adding "(for washing vessels)"
  to the dishwash bar line and "(Ramesh garu's usual)" to R-1724 gives 20/20.
- Honest caveat for the pinned comment: with one item per piece (no pages), meaning search found all four codes and
  hybrid added nothing (14, 11, 14 first-hit). Hybrid pays off when codes and names sit inside longer pieces, which is
  how RAG usually reads documents. Small demo, not a benchmark.

## Script (English)
★ = record twice; for the AI the second take is slower with a longer pause (not bigger). "E-1203" = "E twelve zero three".
Ravi stays gruff even on his calm lines (7, 14, 23).

| # | Who | Line | On screen |
|---|---|---|---|
| 1 ★ | Ravi | AI! You told him "out of stock"?! The batteries are right there! | Ravi slams the phone on the counter; phone chat: order "E-1203", reply "Out of stock, sorry"; an arrow to the batteries on the shelf; sticker "The AI said OUT OF STOCK. It's RIGHT THERE"; small tag "EP33 · AI From Scratch" from 2 s |
| 2 | AI | E-1203 wasn't on the three pages I read. | three stock-book pages fan out: p.15, p.12, p.13, each ✗; "E-1203 is on p.14"; chip "The AI reads 3 of the book's 15 pages per order" |
| 3 | Ravi | Which three pages?! | |
| 4 | AI | The three closest to the order. I search by meaning. | insert MEANING SEARCH: pages as dots on a map; the "E-1203" dot lands among look-alike pages full of codes; "To meaning search, codes look alike" |
| 5 | Ravi | A code has no meaning! It has to match exactly! | |
| 6 | AI | Then use keyword search. Exact words only. | insert KEYWORD SEARCH: a find bar types "E-1203"; page 14 lights up, the line highlighted ✓ |
| 7 | Ravi | Good. Only that from now on. | thumbs up |
| 8 | AI | Next order: "something for a headache." | order bubble; quiz overlay (no hold) "Will KEYWORD search find the pain balm?" |
| 9 ★ | AI | No match. We don't sell headaches. | "0 matches"; the comic sting after the line, not on it |
| 10 | Ravi | The pain balm is right there! | shelf: "Pain relief balm" |
| 11 | AI | He never said "balm". | the order's words "something · for · a · headache" against "Pain relief balm": no word in common, red ✗ |
| 12 | Ravi | So which search do I use?! | |
| 13 | AI | Both. Merge the two lists. Still three pages. | insert HYBRID SEARCH: the MEANING list and the KEYWORD list slide together; pages near the top of either list rise; big "STILL 3 PAGES" |
| 14 | Ravi | And how do I know it works? | arms crossed |
| 15 | AI | Test me like a new delivery boy. | a delivery boy sent to houses whose addresses Ravi already knows; ticks |
| 16 | AI | Twenty orders you already know the answers to. | test sheet "OUR REAL TEST · 20 orders · right item known"; rows tick ✓/✗ |
| 17 | AI | Meaning only: fifteen out of twenty. Keyword only: thirteen. | bars MEANING 15/20, KEYWORD 13/20, "3 pages read each" |
| 18 ★ | AI | Both: eighteen. | music drops out before it; bar BOTH 18/20, stamp; chip "Helps most when codes hide in long pages" |
| 19 | Ravi | Eighteen. So two customers went home empty. Which two? | flat, counting losses; "Guess ↓" |
| 20 | AI | "Something to wash vessels." And "Ramesh garu's usual." | two red rows: "something to wash vessels: keyword grabbed 'Hand wash' ✗", "Ramesh garu's usual ✗" |
| 21 | Ravi | Everyone knows those! | Ravi waves at the street |
| 22 ★ | AI | Everyone except your stock book. | the find bar searches the book: "vessels" not found, "Ramesh" not found; rule card "BOTH. TEST. WRITE IT DOWN." stays up through line 24 |
| 23 | Ravi | Written. Test again. | Ravi scribbles "Dishwash bar: for washing vessels" and "Ramesh garu's usual: R-1724" into the book |
| 24 | AI | Twenty out of twenty. | stamp 20/20 "after writing it down" |
| 25 | Ravi | Super! Now switch one off. One is enough. | |
| 26 ★ | AI | Okay. Keyword off. Next order: E-1203. | the KEYWORD switch flips off; order bubble "E-1203"; Ravi lifts the phone to slam it; hard cut to frame 1 (the loop) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 ★ | Ravi | AI! స్టాక్ లేదని చెప్పావా?! బ్యాటరీలు ఇక్కడే ఉన్నాయి! | AI! Stock ledani cheppaavaa?! Batteries ikkade unnaayi! |
| 2 | AI | E-1203 నేను చదివిన మూడు పేజీల్లో లేదండి. | E-1203 nenu chadivina moodu pageslo ledandi. |
| 3 | Ravi | ఏ మూడు పేజీలు?! | Ae moodu pages?! |
| 4 | AI | ఆర్డర్ కి దగ్గరగా ఉన్న మూడు. నేను అర్థం బట్టి వెతుకుతాను. | Order ki daggaraga unna moodu. Nenu artham batti vetukutaanu. |
| 5 | Ravi | కోడ్ కి అర్థం ఏముంది?! అది ఎగ్జాక్ట్ గా మ్యాచ్ అవ్వాలి! | Code ki artham emundi?! Adi exact ga match avvaali! |
| 6 | AI | అయితే keyword search. అదే word ఉంటేనే దొరుకుతుంది. | Ayithe keyword search. Ade word untene dorukutundi. |
| 7 | Ravi | సూపర్. ఇకనుంచి అదే. | Super. Ikanunchi ade. |
| 8 | AI | తర్వాతి ఆర్డర్: "తలనొప్పికి ఏదైనా." | Tarvaati order: "talanoppiki edaina." |
| 9 ★ | AI | ఒక్కటీ దొరకలేదు. మనం తలనొప్పులు అమ్మం. | Okkatee dorakaledu. Manam talanoppulu ammam. |
| 10 | Ravi | పెయిన్ బామ్ ఇక్కడే ఉంది కదా! | Pain balm ikkade undi kadaa! |
| 11 | AI | ఆయన "బామ్" అనలేదు కదండీ. | Aayana "balm" analedu kadandi. |
| 12 | Ravi | మరి ఏ సెర్చ్ వాడాలి?! | Mari ae search vaadaali?! |
| 13 | AI | రెండూ. రెండు లిస్టులు కలిపి. అయినా మూడు పేజీలే. | Rendoo. Rendu lists kalipi. Ainaa moodu pagese. |
| 14 | Ravi | పని చేస్తుందని నాకెలా తెలుస్తుంది? | Pani chestundani naakelaa telustundi? |
| 15 | AI | కొత్త డెలివరీ బాయ్ ని టెస్ట్ చేసినట్టు చేయండి. | Kotta delivery boy ni test chesinattu cheyandi. |
| 16 | AI | జవాబు ముందే తెలిసిన ఇరవై ఆర్డర్లు ఇవ్వండి. | Javaabu munde telisina iravai orders ivvandi. |
| 17 | AI | Meaning search మాత్రమే: ఇరవైకి పదిహేను. Keyword మాత్రమే: పదమూడు. | Meaning search maatrame: iravaiki padihenu. Keyword maatrame: padamoodu. |
| 18 ★ | AI | రెండూ కలిపి: పద్దెనిమిది. | Rendoo kalipi: paddenimidi. |
| 19 | Ravi | పద్దెనిమిది. అంటే ఇద్దరు కస్టమర్లు ఉత్త చేతులతో వెళ్ళారు. ఏ రెండు? | Paddenimidi. Ante iddaru customers utta chetulatho vellaaru. Ae rendu? |
| 20 | AI | "గిన్నెలు కడగడానికి ఏదైనా." ఇంకా "రమేష్ గారు ఎప్పుడూ తీసుకునేది." | "Ginnelu kadagadaaniki edaina." Inkaa "Ramesh garu eppudoo teesukunedi." |
| 21 | Ravi | అవి అందరికీ తెలుసు! | Avi andariki telusu! |
| 22 ★ | AI | మీ స్టాక్ బుక్ కి తప్ప. | Mee stock book ki tappa. |
| 23 | Ravi | రాశా. మళ్ళీ టెస్ట్ చెయ్. | Raashaa. Malli test chey. |
| 24 | AI | ఇరవైకి ఇరవై. | Iravaiki iravai. |
| 25 | Ravi | సూపర్! ఇప్పుడు ఒకటి ఆపెయ్. ఒక్కటి చాలు. | Super! Ippudu okati aapey. Okkati chaalu. |
| 26 ★ | AI | సరే. Keyword ఆఫ్. తర్వాతి ఆర్డర్: E-1203. | Sare. Keyword off. Tarvaati order: E-1203. |

## Recording guide (for the user)
- Two files: English, then Telugu (Telugu is optional; a language not recorded is voiced with TTS as before).
- You play both: RAVI loud, fast, gruff, even when calm; the AI calm, flat, a little slower, polite. The AI's lines are
  made to sound like a phone speaker afterwards (lighter on the numbers).
- Before each line say its number in English, wait a second, say the line, wait two seconds. A slip: pause and say the
  line again; the last take is kept. ★ lines twice.
- 5 seconds of silence at the start (used to remove room noise). Small room with curtains or clothes, fan and AC off,
  phone on Do Not Disturb, 20-30 cm from the mouth, slightly to the side, same distance throughout.
- Send the original file from the phone's voice recorder (m4a or wav), not a WhatsApp voice note (it is compressed).
- Words can change to how you would really say them; the on-screen text follows the meaning.

## Sound
A hit with the phone slam in the first second; a lift into the meaning-search insert and another into the keyword
insert; a comic sting right after "We don't sell headaches" (never on it); the bed builds under the delivery boy and the
test sheet (keep the phone voice clear: it is thin), drops out before "Both: eighteen", a hit on 18; quiet under
"Everyone knows those!"; a small lift on 20/20; the switch click on "Keyword off", a riser under "E-1203" and a hard cut
on Ravi's raised phone so the loop snaps into the slam of frame 1.

## Caption notes
Episode number and series name; the practical rule (hybrid search is a setting in most search tools: Azure AI Search,
Elasticsearch, OpenSearch, Weaviate; test with ~20 questions you know the answers to, before and after every change;
write down what "everyone knows"); when hybrid helps (codes, names, rare words inside longer pieces; our one-item-per-
line run gained nothing); hybrid vs a re-ranker (EP32): hybrid finds what each search misses, a re-ranker reorders what
came back, many use both; different data from EP32 (a manual of full sentences vs a stock book of codes), so different
numbers; meaning search is good, not perfect (our small model missed vessels = dishwash: that is what the test is for);
answers for the questions the viewers would ask (does ChatGPT's file upload use both, Postgres/pgvector, cost) only
after checking each vendor's own docs; next episode: EP34 open vs closed models. Pinned comment: the demo numbers with
the caveat above, and the sources.
