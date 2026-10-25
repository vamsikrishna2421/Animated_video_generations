# EP38 "Not enough memory" (Running AI locally on your laptop) · script as rendered (v2.2), Oct 25

**Slot:** queue 040, replaces the lesson-format `040_ep38_how_to_run_ai_on_your_own_laptop.mp4`.
**Cast / setting:** Ravi anna's kirana shop (the series' shop), the shop AI (the student robot on his phone, calm,
deadpan). Ravi has bought a laptop for the AI, picked by the biggest number on the box.
**The AI's mistake:** it downloaded the full brain (15 GB) onto the new laptop because the laptop "has 512 GB".
**Topic as plot:** storage (the SSD, 512 GB) is the godown: it keeps the file. RAM (8 GB) is the counter: the whole
brain has to sit there while it answers (it reads every number for every word, EP37). Failure: "NOT ENOUGH MEMORY" on
a 512 GB laptop. Rescue: a brain file that fits the RAM (the squeezed 7B, EP37), free apps (Ollama, LM Studio),
download once, then no internet. Twist: Ravi buys a 2 TB disk for "the biggest brain": a bigger godown, the same counter.
EP34 already did "internet down, rent vs own"; EP35 phone storage; EP36 graphics cards; EP37 squeezing. New here: RAM vs
storage, the RAM a brain really needs (measured), and how to start (apps, where to check your RAM).

## Facts and sources
- Ollama library (ollama.com/library/qwen2.5): qwen2.5:1.5b 986 MB, 3b 1.9 GB, 7b 4.7 GB, 14b 9.0 GB, 32b 20 GB
  (Q4_K_M, EP37). The 7B's 16-bit file: 15.23 GB, four files (Qwen's own GGUF repo, measured in EP37).
- Ollama FAQ (docs.ollama.com/faq): "Ollama runs locally. We don't see your prompts or data when you run locally."
  Default context window 4096 tokens. Ollama also offers cloud models; local-only mode turns them off.
- LM Studio docs, offline (lmstudio.ai/docs/app/offline): "In general, LM Studio does not require the internet in order
  to work." "Nothing you enter into LM Studio when chatting with LLMs leaves your device." Searching and downloading
  models need the internet.
- LM Studio system requirements (lmstudio.ai/docs/app/system-requirements): "LLMs can consume a lot of RAM. At least 16GB
  of RAM is recommended" (Windows); Macs "16GB+ RAM recommended", on 8 GB Macs "stick to smaller models and modest
  context sizes".
- LM Studio is free at home and at work (lmstudio.ai/blog/free-for-work, Jul 8 2025). Ollama is free to download; its
  local models cost nothing to run.
- When a model needs more memory than is free, the apps stop before loading: LM Studio "Model loading was stopped due to
  insufficient system resources... would likely overload your system and cause it to freeze" (its guardrail message,
  quoted in LM Studio bug reports); Ollama "model requires more system memory ... than is available" (user reports).
  The skit's dialog is generic: "NOT ENOUGH MEMORY".
- Where to see your RAM: Windows Settings > System > About > "Installed RAM"; Mac: Apple menu > About This Mac > Memory.
- Ollama's desktop app for macOS and Windows (ollama.com/blog/new-app, Jul 30 2025) chats with local models without the
  command line; local use is free and needs no account. LM Studio is a desktop app too.

## Our demo (pipeline/ep38/local_demo.py, series/scripts/ep38_demo/)
Qwen's own 4-bit files (q4_k_m) of Qwen2.5-7B / 3B / 1.5B-Instruct, llama.cpp on this machine's CPU (4 cores, no
graphics card, a basic laptop's class), context 4096 (Ollama's default), greedy. Every test runs in an empty network
namespace (`unshare -n`): a DNS lookup of huggingface.co and a direct connection to 1.1.1.1 both fail first ("Network is
unreachable"); only the loopback device exists.
- 7B squeezed (4.68 GB file): RAM needed 4.95 GB; 18 of 20 bills right (the same two misses as EP34), 16.2 s a bill;
  the WhatsApp reply in 16.7 s (4.5 tokens a second); loaded in 18 s. On an 8 GB laptop that leaves about 3 GB for
  Windows and other apps: it just fits.
- All three, the internet cut (RAM needed = the most memory the brain held while answering):

  | brain (squeezed, 4-bit) | file | RAM needed | bills right of 20 | a bill | WhatsApp reply |
  |---|---|---|---|---|---|
  | Qwen2.5 1.5B | 1.12 GB | 1.34 GB | 11 | 3.7 s | 3.8 s |
  | Qwen2.5 3B | 2.10 GB | 2.34 GB | 15 | 7.9 s | 6.2 s |
  | Qwen2.5 7B | 4.68 GB | 4.95 GB | 18 | 16.2 s | 16.7 s |

  RAM needed = the file + 0.2-0.3 GB at a 4096-token context (a longer context needs more). The 3B and 1.5B runs
  list only the loopback device in their network namespace.
RAM needed = a fresh process with memory-mapping off (every weight loaded once), a short reply, then the peak resident
memory. (With the file mapped from RAM the peak counts the weights twice, 7.9 GB for the 7B: llama.cpp keeps a repacked
copy of most weights.)

## Hook options
1. **(kept)** Frame 1: a new laptop on the counter, a red dialog "NOT ENOUGH MEMORY · this brain needs 15 GB"; its box
   beside it, "512 GB" in a starburst, "8 GB RAM" in small print. Ravi: "Not enough memory?! I paid for five hundred and
   twelve GB!"
2. Frame 1: Ravi feeding a giant "15 GB" sack into a laptop like a flour mill; the laptop spits it out.
3. Frame 1: the AI in the laptop, frozen mid-word, one word a minute, the queue growing.
Kept 1: a familiar confusion (every laptop box shouts the storage number), real money spent, and a question the viewer
can't answer yet.

## Viewer notes on v1 and what changed (v2)
- Both: the godown/counter idea works, the sack spill is where it clicks, the ending loops. The quiz gave itself away
  (only one option under 8 GB) and "B, seven B, GB" came in one breath: now the quiz asks how much RAM the 4.7 GB brain
  needs (A 4.7 · B about 5 · C all 8), the measured 5 GB is the reveal, and the AI says "five", not the letter.
- Both: "just fits" (line 8) against "well under it" (line 12), and the Telugu "smaller than your RAM" was wrong advice:
  one rule now, said the same way in both languages: the brain's size plus room to work; on 8 GB it just fits, close
  the other apps first.
- Priya: 18/20 bills can't prove "it works" (EP35 said bills allow zero misses): the test card shows the offline
  WhatsApp reply instead, with the 5.0 GB and the 17 s it took.
- Sandeep: why not fetch one sack at a time? Line 4: "For every word, I use every sack."
- Sandeep: frame 1 said "512" three times and nobody read "8 GB RAM": the bottom sticker is gone, "8 GB RAM" is larger.
- Both: which app if I can't code, which brain to search, the Mac path, why bother: "Free apps, no coding: Ollama or LM
  Studio", the apps card names the brain we tested (qwen2.5:7b) and says nothing leaves the laptop; the chip has the Mac path.
- Telugu: "ఫైవ్ ట్వెల్వ్ జీబీ" (how shops say it), "జస్ట్ సరిపోతుంది", "నెట్ నుంచి తెచ్చుకుంటే", "టూ టీబీ హార్డ్ డిస్క్" (next to
  "hard disk" nobody hears the disease), "అన్నిటికంటే పెద్ద".

## Viewer notes on v2 and what changed (v2.1)
- Both: the quiz is a real question now (Sandeep picked A); "about 5 GB" gave B away: the card says "5 GB", the voice
  still "About five". The offline reply answers "without internet?" (Sandeep: "17 seconds? Slow": EP39's problem).
- Both: the rule left out the computer's own share (a 7.5 GB brain would "fit" 8 GB): line 14 now "It must hold the
  brain, room to work, and the computer itself", the chip "8 GB: 4.7 GB brain, barely · 16 GB: 9 GB brain, easily".
- "Just." alone read "just what?": "Barely." Line 9 calls back line 6: "Five sacks on an eight-sack counter!"
- Priya: the reply bubble trimmed the real output: now word for word. LM Studio users search "qwen2.5 7b" and pick
  Q4_K_M (on the card and in the caption).
- Telugu: 7 "కంప్రెస్ చేసిన బ్రేన్" (not "it compressed it"), 12 "పదిహేడు సెకన్లు పట్టింది", 4 "కౌంటర్ మీద, అంటే ర్యామ్ లో",
  10 "క్లోజ్ చేయండి", 16 "ఆఫ్‌లైన్ లోనే నడుస్తుంది", 14 with the computer's share.

## Build notes (v2.2)
- English came out 66.6 s: line 15 cut (16 now follows the rule: two AI lines in a row, allowed), "no coding" moved
  to the card only, tempo 1.2 (Ravi) / 1.12 (AI), gaps trimmed: 60.8 s. Telugu 66.5 s: the same cut, tempo 1.2 / 1.14.
- Whisper heard Ravi's "sacks" as "stacks" and "eight-bag" as "8 back": "bags", "a counter for eight".

## Script (English) · ~61 s
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | Not enough memory?! I paid for five-twelve GB! | frame 1: the laptop on the counter, red dialog "NOT ENOUGH MEMORY · this brain needs 15 GB"; its box: "512 GB" starburst, "8 GB RAM" under it; tag "EP38 · AI From Scratch" |
| 2 | AI | That's storage, anna. [1] The godown. | insert: the godown, shelves of sacks (photos, songs, "brain 15 GB"); on [1] "STORAGE 512 GB = the godown: it keeps things" |
| 3 | Ravi | So? The brain's in there! | Ravi points at the laptop |
| 4 | AI | For every word, I use every bag. [1] So they all sit on the counter: RAM. | insert: a yellow glow sweeps across all 15 brain bags, tag "1 word = all 15 bags"; on [1] "RAM = the counter: where I think" |
| 5 | AI | Your counter: eight GB. [1] My brain: fifteen. | the counter "8 GB" (8 sack-spaces); on [1] a giant "15 GB" sack lands, hangs over both ends, tips off, "✕ doesn't fit" |
| 6 | Ravi | Fifteen bags on a counter for eight?! | rice sacks spill off Ravi's own counter |
| 7 | Ravi | Then the squeezed one: four point seven! [1] How much counter does it need? | the squeezed brain, five lilac sacks "4.7 GB"; after the line the QUIZ card, 3-2-1 held 2 s: "The 4.7 GB brain needs how much RAM?" A "4.7 GB" · B "5 GB" · C "all 8 GB"; "comment A, B or C" |
| 8 | AI | About five GB. [1] The file, plus room to work. | the bed drops out on the count's 1, a hit on "five", a big "B ✓ 5 GB"; five lilac bags land on the counter (4 + 0.7) plus a 0.3 sliver; on [1] "squeezed 7B: needs 5.0 GB (our test)" |
| 9 | Ravi | Five bags on a counter for eight! It fits! | bubble "5 on an 8 counter!" |
| 10 | AI | Barely. [1] Close the other apps first. | the counter bar: 5 of 8 used, "3 GB left for Windows and your apps"; on [1] app icons close one by one |
| 11 | Ravi | And without internet? | |
| 12 | AI | We cut the internet. [1] I still wrote this reply: seventeen seconds. | the phone, OUR TEST card: "internet: CUT ✕", the reply word for word in a WhatsApp bubble ("Sure, Anna! Here's your order: - 2 kg rice - 1 litre sunflower oil - 6 eggs - 1 packet of tea powder. Your order will be delivered to flat 302 within 30 minutes. Thanks for choosing us!"), on [1] "the whole reply 17 s", "RAM it needed 5.0 GB", "4-core computer, no graphics card" |
| 13 | Ravi | So which one do I use? | |
| 14 | AI | Check RAM, not storage. [1] It must hold the brain, room to work, and the computer itself. | RULE chip, held: "CHECK RAM, NOT STORAGE" · "Windows: Settings › System › About · Mac: About This Mac" · "RAM holds the brain + room to work + the computer" · "8 GB: 4.7 GB brain, barely · 16 GB: 9 GB brain, easily" |
| ~~15~~ | ~~Ravi~~ | ~~Where do I get one?~~ (cut for time: 16 follows the rule, two AI lines in a row) | |
| 16 | AI | Free apps: Ollama or LM Studio. [1] Download once, then it runs offline. ("no coding" stays on the card) | the phone: two app tiles "Ollama" · "LM Studio" (free); "Ollama: qwen2.5:7b · LM Studio: Q4_K_M · Qwen2.5 7B, 4.7 GB · the one we tested"; on [1] "download once (internet) → then offline · nothing leaves your laptop" |
| 17 | Ravi | I'll buy a two TB hard disk! [1] The biggest brain! | Ravi holds up a box "2 TB HARD DISK" |
| 18 | AI | Bigger godown. [1] Same counter. | the bed drops out under "Same counter"; after it the red "NOT ENOUGH MEMORY" dialog slams back in = frame 1 (loops) |

## Script (Telugu; on-screen text stays English)
| # | Who | Telugu | Romanized |
|---|---|---|---|
| 1 | Ravi | మెమరీ సరిపోలేదా?! ఫైవ్ ట్వెల్వ్ జీబీకి డబ్బులు కట్టా! | Memory saripoledaa?! Five twelve GB ki dabbulu kattaa! |
| 2 | AI | అది స్టోరేజ్ అండి. [1] మన గోదాం. | Adi storage andi. Mana godaam. |
| 3 | Ravi | అయితే ఏంటి? బ్రేన్ అందులోనే ఉంది కదా! | Ayite enti? Brain andulone undi kadaa! |
| 4 | AI | ప్రతి మాటకీ నేను ప్రతి బస్తా వాడతా. [1] అందుకే అన్నీ ర్యామ్ అనే కౌంటర్ మీద ఉండాలి. | Prati maataki nenu prati basta vaadataa. Anduke annee RAM ane counter meeda undaali. ("ర్యామ్ లో ఉండాలి" babbled "lo lo lo") |
| 5 | AI | మీ కౌంటర్ ఎనిమిది జీబీ. [1] నా బ్రేన్ పదిహేను. | Mee counter enimidi GB. Naa brain padihenu. |
| 6 | Ravi | ఎనిమిది బస్తాల కౌంటర్ మీద పదిహేను బస్తాలా?! | Enimidi bastaala counter meeda padihenu bastaalaa?! |
| 7 | Ravi | అయితే కంప్రెస్ చేసిన బ్రేన్, ఫోర్ పాయింట్ సెవెన్! [1] దానికి ఎంత కౌంటర్ కావాలి? | Ayite compress chesina brain, four point seven! Daaniki entha counter kaavaali? |
| 8 | AI | దాదాపు ఐదు జీబీ. [1] ఫైల్, ప్లస్ పని చేసే చోటు. | Daadaapu aidu GB. File, plus pani chese chotu. |
| 9 | Ravi | ఎనిమిదిలో ఐదు. సరిపోతుంది! | Enimidilo aidu. Saripotundi! |
| 10 | AI | జస్ట్ సరిపోతుంది. [1] ముందు మిగతా యాప్స్ క్లోజ్ చేయండి. | Just saripotundi. Mundu migataa apps close cheyandi. |
| 11 | Ravi | ఇంటర్నెట్ లేకుండా? | Internet lekundaa? |
| 12 | AI | ఇంటర్నెట్ కట్ చేశాం. [1] అయినా ఈ రిప్లై రాశానండి. పదిహేడు సెకన్లు పట్టింది. | Internet cut chesaam. Ayinaa ee reply raasaanandi. Padihedu secanlu pattindi. |
| 13 | Ravi | మరి నేను ఏది వాడాలి? | Mari nenu edi vaadaali? |
| 14 | AI | స్టోరేజ్ కాదు, ర్యామ్ చూడండి. [1] బ్రేన్ కి, పని కి, ల్యాప్‌టాప్ కి కూడా చోటు ఉండాలి. | Storage kaadu, RAM choodandi. Brain ki, pani ki, laptop ki kooda chotu undaali. ("కంప్యూటర్ కి చోటు" came out garbled) |
| ~~15~~ | ~~Ravi~~ | ~~ఎక్కడ దొరుకుతుంది?~~ (cut, as English) | |
| 16 | AI | ఫ్రీ యాప్స్: ఓలామా, ఎల్ ఎమ్ స్టూడియో. [1] ఒక్కసారి తెచ్చుకుంటే చాలు, తర్వాత నెట్ అక్కర్లేదు. | Free apps: Ollama, LM Studio. Okkasaari techchukunte chaalu, tarvaata net akkarledu. ("ఆఫ్‌లైన్ లోనే నడుస్తుంది" babbled in every take) |
| 17 | Ravi | టూ టీబీ హార్డ్ డిస్క్ కొంటా! [1] అన్నిటికంటే పెద్ద బ్రేన్ పెడతా! | Two TB hard disk kontaa! Annitikante pedda brain pedathaa! |
| 18 | AI | గోదాం పెద్దది, [1] కౌంటర్ అదే అండి. | Godaam peddadi, counter ade andi. |

Telugu notes: గోదాం is the shop word for a godown. "కంప్రెస్" for squeeze, as EP37's Telugu.

## Caption ask (draft)
Check your RAM, not your storage, before you download a brain: it needs its file size plus room to work (our 4.7 GB
brain took 5.0 GB). 8 GB: the 4.7 GB brain only just fits (close other apps); 16 GB: up to a 9 GB brain. Free apps,
no coding: Ollama, LM Studio. Comment your RAM and we'll tell you which brain fits.
Next: EP39, why one AI answers in a second and another takes 16 (speed, latency and cost per token).

## Render review
- Round 1 (both viewers): the hook stopped both; the bags spilling off the counter is where it clicked; the 2 TB
  punchline is the best line. Must-fix: "godown" heard "good on" and "TB" heard "TV" (the bed's steady low notes sat
  3-8 dB under the voice); the save-worthy lines (where to check RAM, which file to download) too small; 0:32-0:58
  rushed and flat. Changed: "terabyte" re-voiced; the bed lowered under all speech (musicVol 0.36), dipped under
  "godown" and the punchline, speech presence cut in the bed's EQ; a GODOWN sign and "STORAGE 512 GB = the godown";
  big Windows and Mac rows, "Ollama: qwen2.5:7b" big, "3 GB left for Windows + apps"; one name, "the 4.7 GB brain";
  a pause after "Barely.", more air between speakers, risers into "17 seconds" and the 2 TB twist, a quieter middle and
  a small swell into the end; the test card names the machine (4-core server).
- Telugu: line 14's "కంప్యూటర్ కి చోటు" came out garbled: "బ్రేన్ కి, పని కి, ల్యాప్‌టాప్ కి కూడా చోటు ఉండాలి".
- Round 2: English ready to post ("go-down" and "2TB" clear, the punchline lands); Telugu ready (natural shop talk,
  nothing rude-sounding; "ఓలామా" sounds like "వలామా", the tile fixes it). Their last note, the corner timer in frame 1:
  a comment in make_specs had swallowed hardCuts, beatSnap and the two timer flags; restored and re-rendered.
