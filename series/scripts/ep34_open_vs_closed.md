# EP34 "Rent a brain or own one?" (open vs closed models): script v1 (AI voices)

Teaching skit in Ravi anna's shop (cast of skit 01 and EP33). The plot carries the topic:
- **Failure (frame 1):** Saturday rush, the shop AI goes silent. The internet is down, and its brain is not in the phone.
- **Mechanism:** a closed model lives on the company's computers and you rent it per question; its numbers (the weights)
  stay secret. An open model's weights are published, so you can download it and run it on your own computer.
- **Demo:** our offline bill test, two free open models on a plain computer.
- **Rule:** rent for hard jobs, own when the data must stay with you, test both first.
- **Twist (sets up EP35, model size):** a free brain big enough for the bills needs an 80 GB graphics card, and the
  laptop has none.

Length goal 60-70 s. Voices as EP33's published English: Ravi on Parler "Thoma", the shop AI on Fish (the narrator) through
the phone sound; Telugu on Parler (Ravi = Prakash, AI = Kiran).

## The real AI idea (verified)
(see "Facts and sources" at the end; every claim in the lines is listed there)

## Our demo (real, run by us: `pipeline/ep34/bill_demo.py`, data in `series/scripts/ep34_demo/`)
Ravi's billing job: 20 WhatsApp orders ("anna 2 kg tomato, 1 dozen eggs pls") against a 15-line price board, totals
worked out in advance. Two free open-weights models (Apache 2.0) from Hugging Face run on 4 CPU cores with no graphics
card and nothing fetched from the internet during the test. Greedy decoding; the model may show its working; scored is the
bill it gives (the last number on its last "total" line), exact rupees.

| Model | Download | Bills right (of 20) | Seconds per bill |
|---|---|---|---|
| Qwen2.5-0.5B-Instruct (0.49 B numbers) | 1.0 GB | 1 | 1.4 |
| Qwen2.5-1.5B-Instruct (1.54 B numbers) | 3.1 GB | 9 | 14.3 |

How they went wrong: the small one blurts a total without adding (often "19"). The 3 GB one shows its working but adds
items nobody ordered ("1 kg rice, 1 kg toor dal, 2 milk packets" became tomato + onion + potato + rice + dal + milk = 363
instead of 258), reads "3 bath soaps" as 1, and slips in sums ("2 curd 2 milk" = 210 instead of 126).
Not tested: rented (closed) models. They can't run offline on this computer, and that is the point of the episode.

## Script (English)
Lines of 1-3 s; the AI never says two sentences of explanation in a row; Ravi asks what the viewer would ask.

| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | AI! Ten customers waiting and you've gone SILENT?! | shop, wide: a queue of customers at the counter; the phone on the counter shows "No internet ✕ can't reach my brain"; Ravi slams the counter; sticker "SATURDAY RUSH. AI: SILENT"; tag "EP34 · AI From Scratch" |
| 2 | AI | No internet. My brain isn't in this phone. | phone screen: the AI's face, a crossed cloud |
| 3 | Ravi | Then where is it?! | |
| 4 | AI | On a company's computers, far away. [1] You rent me, one question at a time. | insert: the phone, a tower, a far-off building full of computers; on [1] a taxi meter on the phone: "₹ per question"; a padlock on the building: "its numbers: SECRET" |
| 5 | Ravi | Rent?! I rented this shop for twenty years. Then I bought it! | the shop board: "RAVI KIRANA, own shop" |
| 6 | AI | Then buy a brain. [1] Some companies give theirs away: open models. | insert OPEN MODELS: a brain made of numbers comes down an arrow into a laptop: "the numbers are published: download them"; chips: Llama (Meta), Qwen (Alibaba), Mistral, Gemma (Google), gpt-oss (OpenAI) |
| 7 | Ravi | Free?! | |
| 8 | AI | The download is free. [1] The computer to run it isn't. | the laptop gets a price tag; "free to download ≠ free to run" |
| 9 | Ravi | Can a free brain make my bills? | |
| 10 | AI | Test it. Twenty WhatsApp orders, every total known. | insert OUR REAL TEST: a stack of WhatsApp orders, each with its right total ticked; "answers you already know (EP33)" |
| 11 | AI | Internet off. A plain computer, no graphics card. | Wi-Fi icon off; a plain CPU box: "4 cores, no graphics card" |
| 12 | AI | Guess first: the bigger free brain, how many bills right? | QUIZ card: "3 GB free brain: bills right out of 20?" options 18 / 9 / 2; a ticking 2 s hold |
| 13 | AI | The one-gigabyte brain: one out of twenty. [1] The three-gigabyte brain: nine. | bars: "1 GB brain 1/20 · 1.4 s a bill" then "3 GB brain 9/20 · 14 s a bill"; "our test, small demo" |
| 14 | Ravi | Nine?! Half my customers get a wrong bill! | |
| 15 | AI | It added tomatoes nobody ordered. | the 3 GB brain's real bill: "rice, dal, 2 milk" → its bill lists tomato, onion, potato too, circled red: ₹363, right ₹258 |
| 16 | Ravi | Then you do it. Come into my laptop. | |
| 17 | AI | Not allowed. My makers keep my numbers secret. | the padlock again: "closed model: you can't download it" |
| 18 | Ravi | So which one do I use?! | |
| 19 | AI | Rent for hard jobs. [1] Own when the data must stay with you. [2] Test both first. | RULE CARD (big, stays): RENT: hard jobs · OWN: private data, no internet · TEST both: 20 known answers |
| 20 | Ravi | Then I'll own a big free brain. For my bills. | Ravi opens a laptop: "downloading a big free model..." |
| 21 | AI | A big one needs an eighty-gigabyte graphics card. [1] Your laptop has none. | the laptop: "Not enough memory: needs one 80 GB graphics card"; Ravi frozen; loops to frame 1 (another device that can't think) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | ఏఐ, పది మంది కస్టమర్లు నిలబడి ఉన్నారు, నువ్వు మాట్లాడవేంటి?! | AI, padi mandi customers nilabadi unnaaru, nuvvu maatlaadaventi?! |
| 2 | AI | ఇంటర్నెట్ లేదండి. నా మెదడు ఈ ఫోన్ లో లేదు. | Internet ledandi. Naa medadu ee phone lo ledu. |
| 3 | Ravi | మరి ఎక్కడుంది?! | Mari ekkadundi?! |
| 4 | AI | దూరంగా ఒక కంపెనీ కంప్యూటర్లలో. [1] మీరు నన్ను అద్దెకు తీసుకున్నారు, ఒక్కో ప్రశ్నకు. | Dooranga oka company computerlalo. Meeru nannu addeku teesukunnaaru, okko prashnaku. |
| 5 | Ravi | అద్దెకా?! ఇరవై ఏళ్లు ఈ షాప్ అద్దెకు తీసుకున్నా. తర్వాత కొనేశా! | Addekaa?! Iravai ellu ee shop addeku teesukunnaa. Tarvaata konesaa! |
| 6 | AI | అయితే ఒక మెదడు కొనండి. [1] కొన్ని కంపెనీలు ఫ్రీగా ఇస్తాయి: ఓపెన్ మోడల్స్. | Ayite oka medadu konandi. Konni companylu freega istaayi: open models. |
| 7 | Ravi | ఫ్రీగా ఇస్తారా?! | Freega istaaraa?! |
| 8 | AI | డౌన్‌లోడ్ ఫ్రీ. [1] దాన్ని నడిపే కంప్యూటర్ ఫ్రీ కాదు. | Download free. Daanni nadipe computer free kaadu. |
| 9 | Ravi | ఫ్రీ మెదడు నా బిల్లులు వేయగలదా? | Free medadu naa billulu veyagaladaa? |
| 10 | AI | టెస్ట్ చేద్దాం. ఇరవై వాట్సాప్ ఆర్డర్లు, ప్రతి టోటల్ మనకు తెలుసు. | Test cheddaam. Iravai WhatsApp orders, prati total manaku telusu. |
| 11 | AI | ఇంటర్నెట్ ఆఫ్. మామూలు కంప్యూటర్, గ్రాఫిక్స్ కార్డ్ లేదు. | Internet off. Maamoolu computer, graphics card ledu. |
| 12 | AI | ముందు మీరు గెస్ చేయండి: పెద్ద ఫ్రీ మెదడు ఎన్ని బిల్లులు కరెక్ట్ వేసింది? | Mundu meeru guess cheyandi: pedda free medadu enni billulu correct vesindi? |
| 13 | AI | ఒక జీబీ మెదడు: ఇరవైలో ఒక్కటే. [1] మూడు జీబీ మెదడు: తొమ్మిది. | Oka GB medadu: iravailo okkate. Moodu GB medadu: tommidi. |
| 14 | Ravi | తొమ్మిదా?! సగం మంది కస్టమర్లకు తప్పు బిల్లు! | Tommidaa?! Sagam mandi customerlaku tappu billu! |
| 15 | AI | ఎవరూ అడగని టమాటాలు కూడా కలిపేసింది. | Evaroo adagani tamaatalu kooda kalipesindi. |
| 16 | Ravi | అయితే నువ్వే చెయ్. నా ల్యాప్‌టాప్ లోకి రా. | Ayite nuvve chey. Naa laptop loki raa. |
| 17 | AI | నాకు పర్మిషన్ లేదండి. నా నంబర్లు మా కంపెనీ సీక్రెట్. | Naaku permission ledandi. Naa numbers maa company secret. |
| 18 | Ravi | మరి నేను ఏది వాడాలి?! | Mari nenu edi vaadaali?! |
| 19 | AI | కష్టమైన పనులకు అద్దెకు తీసుకోండి. [1] డేటా మీ దగ్గరే ఉండాలంటే, సొంతం చేసుకోండి. [2] ముందు రెండూ టెస్ట్ చేయండి. | Kashtamaina panulaku addeku teesukondi. Data mee daggare undaalante, sontham chesukondi. Mundu rendoo test cheyandi. |
| 20 | Ravi | అయితే పెద్ద ఫ్రీ మెదడే సొంతం చేసుకుంటా. నా బిల్లుల కోసం. | Ayite pedda free medade sontham chesukuntaa. Naa billula kosam. |
| 21 | AI | పెద్దదానికి ఎయిటీ జీబీ గ్రాఫిక్స్ కార్డ్ కావాలి. [1] మీ ల్యాప్‌టాప్ లో అసలు లేదు. | Peddadaaniki eighty GB graphics card kaavaali. Mee laptop lo asalu ledu. |

## Sound
Hit on the slam in the first second; a lift into each insert (4, 6, 10); the bed dips under the quiz hold and drops out
right before "nine"; a sting after "tomatoes nobody ordered"; the bed rises under the rule card; the laptop's error beep
at the end, which loops into the opening slam.

## Caption notes
Hook: "Ravi anna found out he doesn't own his shop AI. He rents it." Next: EP35, model size and small language models
(how small can a brain get and still make the bills?).

## Facts and sources
(filled in from the fact-check before voicing)
