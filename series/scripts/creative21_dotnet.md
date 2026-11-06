# Creative 21 "Not On The List" (.NET vs dotnet) · script v3 (as rendered), Nov 6 (the Nov 6 creative slot)

**Brief:** Vamsi's, via Bujji (handoff, Nov 5): a story from a LinkedIn post: a company couldn't fill a role for ~8
months; its resume pipeline treated ".NET" as a must-have keyword, candidates wrote "dotnet", every one was rejected;
when they debugged the matching, they hired. Moral: don't trust the AI blindly, look at what it rejects. Debatable
closer: should an AI be allowed to reject a resume no human ever sees? Our usual crayon style; a hand-drawn moment
only where it carries the idea (the matcher comparing ".NET" with "dotnet"); generic American English voices (Vamsi;
the RestaurantOS demo's built-in voices aren't reachable from here, so American reference clips made on our machine
with Kokoro, voiced through Fish).
**Format:** a nightclub-bouncer parody at an office door: a velvet rope, a "VIP: INTERVIEWS" sign, the screening AI as
a bouncer bot in sunglasses with a clipboard ("THE LIST: .NET") and a REJECTED stamp; a hand-drawn whiteboard insert;
test cards. New in the creative log (last 7 days: a projector, an FM phone-in, a cake, a crime show, a railway
announcement, a boxing ring, breaking news). Creative 12 (Oct 28) was also about resume screening (hidden white text):
a different failure (an exact keyword match), a new cast and format.
**Cast:** Shalini (HR manager, 40s), Naveen (26, a .NET developer), the bouncer bot (the screener). The company is made
up. Telugu: Shalini = Lalitha, Naveen = Kiran, the bot = Prakash.
**AI idea:** a screen that matches keywords compares letters, not meaning: ".NET" and "dotnet" are different strings,
so real developers bounce and "Not familiar with .NET" walks in. Even a small AI that reads meaning still bounced
"DotNet". The fix is a human: read a sample of the reject pile; and for job seekers: copy the job post's spelling.
**The reach stack:** stake: a job (every job seeker has been silently rejected by a pipeline); frame 1: "OPEN: 8 MONTHS"
/ "HIRED: 0" over the stamp landing on "5 yrs dotnet" next to the list's ".NET"; injustice: rejected over one dot.
Line 1 says the clash in ~2 s. Telugu line 1 starts on the clash.

## Our demo (pipeline/creative21/resume_demo.py, series/scripts/creative21_demo/screen_7B.json)
Committed before it ran (commit 92c9fad). 25 skills lines: 20 real .NET experience written the ways developers write it
(".NET", "dotnet", "DotNet", "DOTNET", ".Net", "dot net", "ASP.NET Core", "C# / .NET 8", "VB.NET", "Dotnet Core", "NET 6",
"dot-net", "DotNet 7", "ASP.Net Web API"...), 5 not .NET ("Not familiar with .NET", "Java, Spring Boot (no .NET)",
"Python, Django", "Want to learn .NET next year", "Network engineer (CCNA)").

| screen | real .NET lines rejected | not-.NET lines let in |
|---|---|---|
| exact keyword ".NET" (code) | **11 of 20** (every "dotnet", "DotNet", "DOTNET", ".Net", "dot net", "NET 6", "ASP.Net"...) | **3 of 5**, incl. "Not familiar with .NET" |
| a small AI reading for meaning (Qwen2.5 7B, offline, 3 tries each, read by hand) | 13 of 60 answers said NO: "DotNet" 3 of 3, "dot net" 3 of 3, "dotnet" 2 of 3, "DOTNET" 2 of 3, ".NET" itself 1 of 3 | **0 of 15** |

## Facts and sources
- The 8-month story: a LinkedIn post Vamsi saw; no company named, so the reel tells it as our own made-up company ("a
  story like one going around LinkedIn"), and every number in the reel is from our test.
- Microsoft calls the platform ".NET" (dotnet.microsoft.com); its command-line tool is literally named `dotnet`: both
  spellings are standard.

## Hook options
1. **(v1)** Frame 1: the office door with a velvet rope; a wall board "OPEN: 8 MONTHS" (amber) / "HIRED: 0" (red); the
   bouncer bot's stamp REJECTED landing on Naveen's resume "5 yrs dotnet"; the clipboard "THE LIST: .NET"; Shalini's hands
   on her head. "Eight months open. Zero hires. Where are the .NET developers?!"
2. Close-up: ".NET" vs "dotnet" with a red ≠ and "REJECTED: 1 DOT" (the injustice first; no stake number).
3. Naveen at the rope: "Rejected for a dot?!" (no number).

## Script review (human-viewer, v1) and what changed
Both like the bouncer ("pub bouncer, got it, funny"; Priya smirks: she types `dotnet build` daily); hooks 6 and 7.
Both: ".NET" vs "dotnet" was tiny and far apart in frame 1, and by ear the two are the same word (Sandeep read ".NET" as
a website ending); lines 7-11 were a pile of numbers ("Qwen2.5 7B, 0/15, NO NO NO": what is Qwen, why 15); "twenty real
developers" were twenty lines we wrote; "fakes" is wrong (the one who wrote "Not familiar with .NET" was honest); no tag
saying the company is made up, so 8 months read as fact. Priya: the filter let 9 of 20 through, so why zero hires? (the
story needs everyone writing "dotnet"); the closer "should a bot reject...?" gets only "no": make it two-sided; the
recruiter rule needs a size; add "add every spelling to the list". Sandeep: make the job-seeker rule general (B.Com vs
BCom). Telugu: "జాయిన్ అవలేదు" sounded like dropouts; "అక్షరాల్లో" like a cheque in words: spell both out; "అర్థం కాదు" =
"I don't understand"; "బాట్ పెట్టు" an order to the candidate; "రాలేదు" = didn't show up; "రెండు రకాలుగా": which two?
Changed (v2): frame 1 ".NET ≠ dotnet" big under the two numbers, the stamp on "dotnet"; a tag "a made-up company · inspired
by a LinkedIn story" on lines 2-3; line 4 spells both ("dot, N, E, T" / "D, O, T, N, E, T"); line 7 "Twenty ways to write
.NET. Eleven bounced."; line 8 "And everyone here writes dotnet!"; line 11 "Nobody without .NET got in" and, on screen,
"real .NET answers it bounced: 13 of 60, about 1 in 5", no model name on screen (in the pinned comment); the rules
"Copy the job post's exact words, letter for letter" (cards: .NET, B.Com) and "Read twenty rejects every week, and add
every spelling to the list"; the closer "A bot that reads you in one second... or a human, in three weeks?"; Telugu as
listed below.

## Render review (human-viewer, EN + TE) and what changed
Both stop on frame 1 (hook 7 and 8) and would share it (office group, team chat); the B.Com tip and "LET IN: Not
familiar with .NET" landed; the American voices read clean ("feels dubbed" for a kurta aunty, Sandeep; fine for Priya).
Both: by ear "dotnet" = ".NET" at 0:07, 0:24 and 0:36 ("everyone here writes .NET": so what's the problem?); frame 1's
card hid the bouncer's face; the made-up-company tag and the 20-chip grid too small; flat energy, the stamps didn't stand
out; near-empty frames at 0:32 (the AI card) and 0:44 (one rule panel). Priya: "13 of 60" never seen or said, so
"DotNet 3/3" looked cherry-picked; the either/or closer fights our own "bot + 20 rejects" rule (expect BOTH). Sandeep:
who is who (Shalini read as a candidate); a stray ")" in a caption. Telugu: "చుక్క" means a drink in a pub skit; "బాట్"
came out "bod" three times; "అలాగే రాస్తారు": like what?; 71 s, cut the spoken half of the hiring rule and the card holds.
Changed: "one word" said on lines 8 and 11 ("everyone here writes it as one word", "DotNet, one word? Three times out
of three"); line 11 says "it bounced thirteen of sixty real ones" and the AI card shows 13/60 big from the start with
"Skills: DotNet (one word)" and the NO stamps; frame 1's card shorter and the bouncer lower (his face shows); labels HR:
SHALINI / CANDIDATE: NAVEEN; the tag 38 px; bigger chips; both rule panels on screen from line 14; louder stamp hits
with a buzz, hits on 11/20 and 13/60; music ~10 dB under speech, the gaps no louder than the voice (a first fix
overshot to 6 dB over), the middle lifted, a dip before the key numbers, a rise into the close; Telugu "డాట్, ఎన్, ఈ, టీ",
"రోబో" for the bot, "కలిపే రాస్తారు", "ఐదేళ్ళ డాట్ నెట్ అనుభవం", the hiring line's second half on the card only (67 s);
the caption ask "BOT, HUMAN or BOTH". Not changed: the either/or line itself (the caption lets "both" in).

## Script (English, v3) · 63 s
| # | Who | Line |
|---|---|---|
| 1 | shalini | Eight months open. [1] Zero hires. [2] Where are the .NET developers?! |
| 2 | bouncer | Rejected. [1] Not on the list. |
| 3 | naveen | Five years of dotnet! [1] I'm exactly who you need! |
| 4 | bouncer | The list says dot, N, E, T. [1] You wrote D, O, T, N, E, T. |
| 5 | shalini | It's the same skill! |
| 6 | bouncer | I match letters, [1] not meaning. |
| 7 | naveen | I tested a filter like yours. [1] Twenty ways to write .NET. [2] Eleven bounced. |
| 8 | shalini | Eleven?! [1] And everyone here writes it as one word! |
| 9 | naveen | And "Not familiar with .NET"? [1] It let that one in. |
| 10 | shalini | Then let an AI read the meaning! |
| 11 | naveen | I tried a small one. Nobody without .NET got in, but it bounced thirteen of sixty real ones. / [1] "DotNet", one word? Three times out of three. |
| 12 | shalini | So for eight months, [1] nobody read the reject pile? |
| 13 | bouncer | Nobody asked. |
| 14 | naveen | Job hunting? [1] Copy the job post's exact words, letter for letter. |
| 15 | shalini | Hiring? [1] Read twenty rejects every week, and add every spelling to the list. |
| 16 | shalini | A bot that reads you in one second... [1] or a human, in three weeks? |
| 17 | bouncer | Next! [1] Rejected. |

## Script (Telugu, v3; on-screen text stays English) · 67 s
| # | Who | Telugu |
|---|---|---|
| 1 | shalini | ఎనిమిది నెలలు! [1] ఒక్కరినీ తీసుకోలేదు! [2] డాట్ నెట్ డెవలపర్స్ ఎక్కడ?! |
| 2 | bouncer | రిజెక్టెడ్. [1] లిస్ట్ లో లేదు. |
| 3 | naveen | ఐదేళ్ళ డాట్ నెట్ అనుభవం! [1] మీకు కావాల్సింది నేనే! |
| 4 | bouncer | లిస్ట్ లో డాట్, ఎన్, ఈ, టీ. [1] నువ్వు రాసింది డీ, ఓ, టీ, ఎన్, ఈ, టీ. |
| 5 | shalini | రెండూ ఒకటే కదా! |
| 6 | bouncer | నేను అక్షరాలు చూస్తా, [1] అర్థం చూడను. |
| 7 | naveen | మీలాంటి ఫిల్టర్ తో టెస్ట్ చేశా. [1] డాట్ నెట్ ని ఇరవై రకాలుగా రాశా. [2] పదకొండు రిజెక్ట్. |
| 8 | shalini | పదకొండా?! [1] ఇక్కడ అందరూ కలిపే రాస్తారు! |
| 9 | naveen | "నాకు డాట్ నెట్ తెలియదు" అని రాసినవాడు? [1] లోపలికి వెళ్ళిపోయాడు. |
| 10 | shalini | అయితే అర్థం చేసుకునే రోబో పెడదాం! |
| 11 | naveen | చిన్న రోబో తో ట్రై చేశా. డాట్ నెట్ రానివాళ్ళు ఒక్కరూ లోపలికి రాలేదు. / [1] కానీ కలిపి రాసిన డాట్ నెట్? మూడుకి మూడు సార్లు రిజెక్ట్. |
| 12 | shalini | అంటే ఎనిమిది నెలలు, [1] రిజెక్ట్ అయినవి ఎవరూ చదవలేదా? |
| 13 | bouncer | ఎవరూ అడగలేదు. |
| 14 | naveen | ఉద్యోగం వెతుకుతున్నారా? [1] జాబ్ పోస్ట్ లో ఉన్న మాటలే, అక్షరం మార్చకుండా రాయండి. |
| 15 | shalini | రిక్రూట్ చేస్తున్నారా? [1] ప్రతి వారం ఇరవై రిజెక్ట్ లు మనిషి చదవాలి. |
| 16 | shalini | ఒక్క సెకనులో చదివే రోబో కావాలా... [1] మూడు వారాలు తీసుకునే మనిషా? |
| 17 | bouncer | నెక్స్ట్! [1] రిజెక్టెడ్. |

## Caption ask (the debatable one; Vamsi: "AI judges you" topics draw comments)
A bot reads your resume in 1 second. A human takes 3 weeks. Which one do you want reading yours? Comment BOT, HUMAN or BOTH,
and why. (script review: two-sided; render review: let BOTH in)
