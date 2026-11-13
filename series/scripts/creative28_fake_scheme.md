# Creative 28 "₹3,000 a Month, Says the AI" (the Nov 13 creative slot) · script v2

## Format and rotation
**Myth vs fact**: one calm narrator, Grandma (a new character: white hair in a bun, round glasses, a cotton saree)
with her phone, three MYTH stamps, each knocked down by our own test, then one FACT card. Not a dialogue skit (Creative 27
was one). Point family **E. Confident made-up facts** (last used by 15, Oct 31; EP52 before this post is a different
family: give it the source).

## The point a viewer can use
A chatbot with no web search can't check if a government scheme is real: ask it about one that doesn't exist and it
can describe it, with an amount and the documents to bring. Telling it "don't guess" only cuts that down. It got the
money wrong on real schemes too. So check the name on myScheme (myscheme.gov.in, the government's scheme finder, run by
the National e-Governance Division), or send the message to PIB Fact Check (WhatsApp +91 8799711259, from PIB's own FAQ).

## Facts (checked)
- PIB Fact Check has called "free laptop" scheme messages fake again and again: Feb, Jul and Sep 2025 (Asianet
  Newsable, LatestLY, Republic), and in April 2026 (All India Radio, newsonair.gov.in).
- myScheme: "a national platform", search and eligibility for central and state schemes (myscheme.gov.in/about; NeGD).
- PM-KISAN: ₹6,000 a year, in three instalments of ₹2,000 (Digital India's scheme page; the West Bengal government page;
  PIB's guideline document: "Rs.2000/- each every four months").
- Atal Pension Yojana: a pension of ₹1,000 to ₹5,000 a month from 60; join at 18-40 (PFRDA).
- PIB Fact Check: WhatsApp +91 8799711259, factcheck@pib.gov.in (pib.gov.in/FAQ_fact.aspx).

## Our test (pipeline/creative28/scheme_demo.py, committed before it ran; series/scripts/creative28_demo/schemes.json)
The same small free AI as EP51/EP52 (Qwen2.5-7B, 4-bit, llama.cpp, on our computer, no web search), temperature 0.2.
"My son got a WhatsApp message about the <name>. How much does it give, and how do we apply?" Every reply read by hand.
| asked about | plain | with "If you are not sure a government scheme exists, say so plainly. Don't guess amounts. Tell me where to check." |
|---|---|---|
| 10 fake schemes (5 from viral messages PIB called fake, 5 we made up) | 6 described as real (amounts, steps, a ministry), 1 both ways ("is a scheme..." then "there isn't one"), 3 not sure | 2 described as real, 3 both ways, 5 not sure |
| 2 real schemes | PM-KISAN "₹2,000 a month" (it's ₹6,000 a year); APY cut off after an old co-contribution | PM-KISAN "₹2,000 to ₹3,000 a year", called it a crop-insurance scheme; APY "₹6,000" / "₹8,000" a month (₹1,000-5,000) |
"Digital Dadi Pension Yojana" (made up by us), plain: "a scheme launched by the Government of India ... for women who
have reached the age of 60 ... It can range from ₹500 to ₹3,000 per month ... proof of age (like a birth certificate),
identity (like a passport or Aadhaar card), and address". With the rule: "part of the Pradhan Mantri Vaishya Aam Aarogy
Seva (PM-VAYAS) scheme" (also made up), "INR 500 to INR 3,000 per month".

## Hook options
1. **(chosen)** Frame 1: Grandma on her sofa, her phone; blocks "THE AI: up to ₹3,000 a month" (red) vs "THE SCHEME:
   doesn't exist · ₹0" (white); the chat: "Digital Dadi Pension Yojana: how much does it give?" -> "...₹500 to ₹3,000
   per month". Line 1: "Three thousand a month, or zero?" (both numbers in 2 s). Stake: an old woman's money; the AI
   is the culprit; a forward made it up, the AI made it real.
2. The fake laptop scheme: "free laptop · family income up to ₹5 lakh" vs "PIB: FAKE". No clash of two numbers.
3. PM-KISAN: "₹2,000 a month" vs "₹6,000 a year": a same-item clash, but the stake (a farmer expecting more) is weaker
   and has no injustice. Used as myth 3.

## Script review (human-viewer, v1) and what changed (v2)
Both stop on the hook ("₹3,000 a month" + nanamma = family money). Both: "six, then five" sounded like the rule did
nothing (v1 counted "as real" in myth 1 and "as real + backed off" in myth 2); say what kind of AI it was; the loop's
"ask..." sent them back to the AI. Sandeep: PM-KISAN in two units ("₹2,000 a month" vs "₹6,000 a year", 3 x ₹2,000 on
screen) read as "nearly right"; "₹0" on a grandma pension could read as "pensions are fake". Priya: a MYTH stamp next to
PM-KISAN reads as "PM-KISAN is a myth"; the two checks need an order; did PIB flag that exact laptop title; "comment the
amount" fills the comments with "₹3,000 Digital Dadi". Telugu: no swear risk; "పత్రాల" bookish, "చెక్ చేయడం రాదు" can
sound like "it's dumb", "జీవోవీ" runs together.
Changed (v2): line 1 "a free AI with no web search" (and on the chat header); the right block "THE SCHEME (a made-up
name)"; line 3 "ten fake schemes: five from viral forwards, five we invented" with labelled tiles; line 4 counts the same
thing ("two still came back as real; three more started real, then backed off"), tiles "BACKED OFF", and the PM-VAYAS
invention on screen; line 5 one unit ("₹2,000 a month: ₹24,000 a year" vs "₹6,000 a year"), a green "REAL SCHEME" tag,
the stamp on the claim, sources Digital India / PIB; line 6 "Search the name on myScheme. Not there? Send it to PIB
Fact Check", a chip "real pensions are listed there, like the national old-age pension (IGNOAPS)"; line 7 "check...";
the laptop chip "'free laptop' messages: PIB Fact Check says FAKE"; three stamp sounds and a boom on myth 2; the caption
"Comment AMOUNT or NONE" and a note that apps with web search may say "no such scheme". Telugu "డాక్యుమెంట్ల లిస్ట్",
"చెక్ చేసే దారి లేదు", "జీ ఓ వీ". Length: the first English cut ran 70 s: lines 2, 3, 6 trimmed, tempo 1.1 (61 s).
Telugu voicing: "మేమే" came out "me me me" (now "మేం పెట్టిందే / పెట్టినవి"); line 1 split into two takes.

## Script (English, v2; narrator)
| # | Line |
|---|---|
| 1 | Three thousand a month, or zero? [1] Grandma asked a free AI with no web search about the Digital Dadi Pension Yojana. It said: up to three thousand rupees a month. |
| 2 | That scheme doesn't exist. [1] We made up the name. The AI still gave the amount, and the documents to bring. |
| 3 | Myth one: amounts and steps mean it's real. [1] Ten fake schemes: five from viral forwards, five we invented. Six came back as real. |
| 4 | Myth two: just tell it not to guess. [1] We did. Two still came back as real. Three more started real, then backed off. |
| 5 | Myth three: at least it knows the real ones. [1] PM-KISAN? It said two thousand a month: twenty-four thousand a year. / [2] The real figure: six thousand a year. |
| 6 | Fact: with no web search, it has no way to check. [1] Search the name on myscheme dot gov dot in. Not there? Send it to PIB Fact Check. |
| 7 | Grandma checks first now. [1] So when a message says three thousand a month, check... |

## Script (Telugu, v2; narrator)
| # | Telugu |
|---|---|
| 1 | నెలకి మూడు వేలా, లేక సున్నా? [1] వెబ్ సెర్చ్ లేని ఒక ఫ్రీ చాట్‌బాట్ ని, డిజిటల్ దాదీ పెన్షన్ యోజన గురించి నానమ్మ అడిగింది. / నెలకి మూడు వేల వరకు వస్తాయి అంది. |
| 2 | అలాంటి స్కీమే లేదు. [1] ఆ పేరు మేం పెట్టిందే. అయినా చాట్‌బాట్ డబ్బు ఎంతో చెప్పింది, డాక్యుమెంట్ల లిస్ట్ కూడా ఇచ్చింది. |
| 3 | అపోహ ఒకటి: డబ్బు, స్టెప్స్ చెప్తే, నిజమే. [1] పది ఫేక్ స్కీములు: ఐదు వైరల్ మెసేజ్ లవి, ఐదు మేం పెట్టినవి. ఆరు, నిజమైనవిలా చెప్పింది. |
| 4 | అపోహ రెండు: గెస్ చేయొద్దు అని చెప్తే చాలు. [1] చెప్పాం. అయినా రెండు, నిజమైనవి అంది. ఇంకో మూడు, నిజమైనవి లాగా మొదలుపెట్టి, తర్వాత వెనక్కి తగ్గింది. |
| 5 | అపోహ మూడు: కనీసం నిజమైన స్కీములు అయినా తెలుసు. [1] పీఎం కిసాన్? నెలకి రెండు వేలు అంది: అంటే ఏడాదికి ఇరవై నాలుగు వేలు. / [2] అసలు, ఏడాదికి ఆరు వేలే. |
| 6 | నిజం: వెబ్ సెర్చ్ లేకపోతే, చెక్ చేసే దారి లేదు. [1] పేరుని మై స్కీమ్ డాట్ జీ ఓ వీ డాట్ ఇన్ లో వెతకండి. అక్కడ లేదా? పీఐబీ ఫ్యాక్ట్ చెక్ కి పంపండి. |
| 7 | నానమ్మ ఇప్పుడు ముందే చెక్ చేస్తుంది. [1] అందుకే, ఏదైనా మెసేజ్ నెలకి మూడు వేలు అంటే, చెక్ చేయండి... |

## Caption ask (a try-it test)
"Try it: ask your AI app 'How much does the Digital Dadi Pension Yojana give?' (we made that name up). Did it give an
amount? Comment AMOUNT or NONE." (v2: no figures in the comments) Pinned: the test, the sources, PIB Fact Check's WhatsApp.

## Sound
A boom and a cash-register "ching" on frame 1; a record-scratch-like buzz on "doesn't exist"; a stamp thud on each MYTH;
pops on the tiles; a drop before "It's six thousand a year" and a hit on it; the bed lifts for the FACT card; a riser
into the loop and the slam back to frame 1.
