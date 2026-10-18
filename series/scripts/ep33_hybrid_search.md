# EP33 "We don't sell headaches" (RAG part 3: hybrid search and measuring it) — script v1, for the user's recording

First teaching-skit episode (ROUTINE.md run 1) and the first one voiced by the user: the user records every line, both
characters, English and (if possible) Telugu; we cut the recording into lines and build the video on it. The AI's lines
get the phone-speaker sound in the mix (skit 02's caller filter), so one voice can play both parts. Loops like skit 01.

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
★ = record twice, two different energies. Codes: "E-1203" = "E twelve-oh-three".

| # | Who | Line | On screen |
|---|---|---|---|
| 1 ★ | Ravi | AI! You told a customer we don't have E-1203?! The batteries are right there! | Ravi slams the phone on the counter; phone bubble "Sorry, we don't have E-1203."; on the shelf behind, "AAA batteries E-1203" with an arrow; sticker "The AI said OUT OF STOCK. It's RIGHT THERE"; tag "EP33 · AI From Scratch" |
| 2 | AI | Not on the three pages I read. | three stock-book pages fan out: p.15, p.12, p.13, each ✗; "E-1203 is on p.14" |
| 3 | Ravi | Which three pages?! | |
| 4 | AI | The ones that felt closest. I search by meaning. | insert MEANING SEARCH: pages as dots on a map; the "E-1203" dot lands among look-alike pages full of codes; "To meaning search, codes look alike" |
| 5 | Ravi | A code has no meaning! It has to match exactly! | |
| 6 | AI | Then use keyword search. Exact words only. | insert KEYWORD SEARCH: a find bar types "E-1203"; page 14 lights up, the line highlighted ✓ |
| 7 | Ravi | Good. Only that from now on. | thumbs up |
| 8 | AI | Next order: "something for a headache." | order bubble; QUIZ card "Will KEYWORD search find the pain balm? YES / NO", 2 s hold with a tick |
| 9 ★ | AI | No match. We don't sell headaches. | "0 matches" |
| 10 | Ravi | The pain balm is right there! | shelf: "Pain relief balm" |
| 11 | AI | He never said "balm". | the order's words "something · for · a · headache" against the book line "Pain relief balm": no word in common, red ✗ |
| 12 | Ravi | So which search do I use?! | |
| 13 | AI | Both. Two lists, merged into one. | insert HYBRID SEARCH: the MEANING list and the KEYWORD list slide together; pages near the top of either list rise to the top of one list |
| 14 | Ravi | And how do I know it works? | arms crossed |
| 15 | AI | Test me. Twenty orders you already know the answers to. | test sheet "20 orders · right item known"; rows tick ✓/✗ |
| 16 | AI | Meaning only: fifteen. Keyword only: thirteen. | bars MEANING 15/20, KEYWORD 13/20 ("right page in the 3 pages read") |
| 17 ★ | AI | Both: eighteen. | music drops out before it; bar BOTH 18/20, stamp |
| 18 | Ravi | Eighteen! Which two did you miss? | |
| 19 | AI | "Something to wash vessels." And "Ramesh garu's usual." | two red rows: "something to wash vessels → Hand wash ✗", "Ramesh garu's usual → ? ✗" |
| 20 | Ravi | Everyone knows those! | Ravi waves at the street |
| 21 ★ | AI | Everyone except your stock book. | the stock book opens: nothing about vessels, nothing about Ramesh garu; rule chip "Search with BOTH · Test with orders you know · Write down what 'everyone knows'"; freeze; loops to frame 1 |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 ★ | Ravi | AI! E-1203 లేదని కస్టమర్ కి చెప్పావా?! బ్యాటరీలు ఇక్కడే ఉన్నాయి! | AI! E-1203 ledani customer ki cheppaavaa?! Batteries ikkade unnaayi! |
| 2 | AI | నేను చదివిన మూడు పేజీల్లో లేదు. | Nenu chadivina moodu pageslo ledu. |
| 3 | Ravi | ఏ మూడు పేజీలు?! | Ae moodu pages?! |
| 4 | AI | దగ్గరగా అనిపించినవి. నేను అర్థం బట్టి వెతుకుతాను. | Daggaraga anipinchinavi. Nenu artham batti vetukutaanu. |
| 5 | Ravi | కోడ్ కి అర్థం ఏంటి?! అది అచ్చంగా మ్యాచ్ అవ్వాలి! | Code ki artham enti?! Adi acchanga match avvaali! |
| 6 | AI | అయితే keyword search. అదే పదం ఉంటేనే దొరుకుతుంది. | Ayithe keyword search. Ade padam untene dorukutundi. |
| 7 | Ravi | సూపర్. ఇకనుంచి అదే. | Super. Ikanunchi ade. |
| 8 | AI | తర్వాతి ఆర్డర్: "తలనొప్పికి ఏదైనా." | Tarvaati order: "talanoppiki edaina." |
| 9 ★ | AI | ఒక్కటీ దొరకలేదు. మనం తలనొప్పులు అమ్మం. | Okkati dorakaledu. Manam talanoppulu ammam. |
| 10 | Ravi | పెయిన్ బామ్ ఇక్కడే ఉంది కదా! | Pain balm ikkade undi kadaa! |
| 11 | AI | ఆయన "బామ్" అనలేదు కదండీ. | Aayana "balm" analedu kadandi. |
| 12 | Ravi | మరి ఏ సెర్చ్ వాడాలి?! | Mari ae search vaadaali?! |
| 13 | AI | రెండూ. రెండు లిస్టులు, ఒకే లిస్టుగా కలిపి. | Rendoo. Rendu lists, oke list gaa kalipi. |
| 14 | Ravi | పని చేస్తుందని నాకెలా తెలుస్తుంది? | Pani chestundani naakelaa telustundi? |
| 15 | AI | టెస్ట్ చేయండి. జవాబు ముందే తెలిసిన ఇరవై ఆర్డర్లు ఇవ్వండి. | Test cheyandi. Javaabu munde telisina iravai orders ivvandi. |
| 16 | AI | అర్థం బట్టి మాత్రమే: పదిహేను. Keyword మాత్రమే: పదమూడు. | Artham batti maatrame: padihenu. Keyword maatrame: padamoodu. |
| 17 ★ | AI | రెండూ కలిపి: పద్దెనిమిది. | Rendoo kalipi: paddenimidi. |
| 18 | Ravi | పద్దెనిమిది! మిస్ అయిన ఆ రెండు ఏంటి? | Paddenimidi! Miss ayina aa rendu enti? |
| 19 | AI | "గిన్నెలు కడగడానికి ఏదైనా." ఇంకా "రమేష్ గారు ఎప్పుడూ తీసుకునేది." | "Ginnelu kadagadaaniki edaina." Inkaa "Ramesh garu eppudu teesukunedi." |
| 20 | Ravi | అవి అందరికీ తెలుసు! | Avi andariki telusu! |
| 21 ★ | AI | మీ స్టాక్ బుక్ కి తప్ప. | Mee stock book ki tappa. |

## Recording guide (for the user)
- Two files: English, then Telugu (Telugu is optional; a language not recorded is voiced with TTS as before).
- You play both: RAVI loud, fast, frustrated; the AI calm, flat, a little slower, polite. The AI's lines are made to
  sound like a phone speaker afterwards.
- Before each line say its number in English, wait a second, say the line, wait two seconds. A slip: pause and say the
  line again; the last take is kept. ★ lines twice, the second a little bigger.
- 5 seconds of silence at the start (used to remove room noise). Small room with curtains or clothes, fan and AC off,
  phone on Do Not Disturb, 20-30 cm from the mouth, slightly to the side, same distance throughout.
- Send the original file from the phone's voice recorder (m4a or wav), not a WhatsApp voice note (it is compressed).
- Words can change to how you would really say them; the on-screen text follows the meaning.

## Sound
A hit with the phone slam in the first second; a lift into the meaning-search insert and another into the keyword
insert; a ticking clock under the quiz and a comic sting on "We don't sell headaches"; the bed builds under the test
sheet, drops out before "Both: eighteen", a hit on 18; quiet under "Everyone knows those!"; a rise under the last line
and a hard stop on the freeze so the loop snaps back to "AI!".

## Caption notes
Episode number and series name; the practical rule (hybrid search is a setting in most search tools: Azure AI Search,
Elasticsearch, OpenSearch, Weaviate; test with ~20 questions you know the answers to, before and after every change;
write down what "everyone knows"); next episode: EP34 open vs closed models. Pinned comment: the demo numbers with the
caveat above, and the sources.
