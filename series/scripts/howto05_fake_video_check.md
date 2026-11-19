# HOW TO 05 "Fake-video check: 3 checks before you forward" · Thu Nov 19 · script v2

## The format and the one variable
A screen tutorial, as HOW TO 04 was: one narrator, phone screens drawn in our crayon style, Ravi's shop in the
corner. It is not a dialogue skit. The real run is a fake we made ourselves: a "flood at Ameerpet, right now" clip
made with a free video model on this machine's CPU. The three checks were then run on it
(`series/scripts/howto05_demo/`).
- **Bujji's EP54 48h read: the one variable is length and middle.** The tutorial middle held about 10% watched in
  both EP53 and EP54, so this tutorial has:
  - 3 checks, not the 5 in the backlog row;
  - the first check's result on screen before 10 s;
  - a target of about 45 s, against EP54's 73 s.
- **Unchanged:** frame 1 keeps the same-item clash, the tutorial control (EP47 66.3%, EP49 64.2%, EP50 64.8%). The
  try-it is in the caption body, and there is no comment ask.
- **Point family G, "Scams dressed as AI".** The neighbouring posts are Creative 30 (family B, last night) and
  Creative 31 (family C, tonight).

## Frame 1 (the reach stack)
Ravi's phone shows a forwarded WhatsApp video: our real AI clip, playing. It carries the message "Ameerpet RIGHT NOW,
water up to the doors. Send ₹2,000 per family for relief" and a "Forwarded many times" tag. Big, readable with the
sound off:
- "MADE IN 4.5 MIN, FREE AI"
- "ASKS ₹2,000 PER FAMILY"
- Small tag: "we made this fake ourselves".

The three parts of the stack:
- The stake: Ravi's ₹2,000.
- Two numbers on the same video: 4.5 minutes, ₹2,000.
- The injustice: Ravi is about to pay for a flood that a computer drew.

Line 1 says both numbers within about 2 s.

## The real run (results in `series/scripts/howto05_demo/README.md`)
- **The fake:**
  - Model: AnimateDiff-Lightning, 4 steps (ByteDance, CreativeML OpenRAIL-M), on the epiCRealism base (Stable
    Diffusion 1.5, CreativeML OpenRAIL-M).
  - 3 shots x 16 frames at 432 x 768, 8 frames a second = 6 s of video.
  - CPU only (4 cores, no graphics card): 268 s, about 4.5 minutes. Every shot made is kept.
- **Check 1, pause:**
  - We asked for a sign that says AMEERPET. In 48 of 48 frames the sign text is not a word.
  - Shot 3, frame 8 -> 9: one blue umbrella becomes two.
  - Two walkers melt into one shape, and a head rises from the bottom edge with no body.
- **Check 2, label:**
  - Our file carries no C2PA Content Credentials, no IPTC AI tag and no SynthID mark.
  - YouTube labels a video as AI when:
    - the creator discloses it;
    - it carries C2PA data;
    - it was made with YouTube's own tools;
    - or YouTube's systems detect it.
  - Meta adds "AI info" when it detects industry-standard AI indicators, or when people disclose it.
  - So ours would be labelled only if a platform's own detector caught it: no label proves nothing.
- **Check 3, ask:** PIB Fact Check, WhatsApp +91-8799711259. "Any Suspicious News of information can be fact checked
  through the following number" (factcheck.pib.gov.in, read Nov 19).
- **Honest limits (in the reel and the caption):**
  - Paid video tools make cleaner fakes, with fewer clues to pause on.
  - We tested no real clip (Wikimedia Commons refused this network; there is no camera here).
  - We tested no detector apps.

## Script review (human-viewer, v1), what changed for v2
All three viewers (a shop owner in seven family groups, a fast forwarder, a Telugu-first mother) stopped on frame 1,
called the umbrella "the reel", and lost the thread at check two.
- **Check two didn't fit a WhatsApp forward**, and "NO LABEL ≠ REAL" reads as "=" at phone size. It is rebuilt in
  words:
  - "On Instagram or YouTube, an AI label means AI. But Meta's labels don't cover WhatsApp. So no label? It can still
    be fake."
  - Meta's own labelling posts name Facebook, Instagram and Threads (Feb 6, 2024, updated Apr 1, 2025; Apr 5, 2024,
    updated Oct 23, 2025). WhatsApp is not named.
  - The card is three short rows.
- **The 48-frame claim was wrong:** only shot 1's prompt asked for the AMEERPET sign. The voice now says "in every
  frame", and the screen says "every frame of that shot".
- **The umbrella comes first now** (about 7-8 s), so check one's result lands before 10 s. The sign follows.
- **Frame 1:**
  - ₹2,000 comes first, as line 1 says it.
  - The forward carries a masked UPI ID and a QR, not a "Pay" button.
  - The message is cut to one line.
  - "FAKE · MADE BY US" is burned onto the clip every time it is shown, so a screen recording can't pass as a real flood.
- **"So which one do I do?"** The last line is now "If you do one thing: never pay a UPI ID from a forward", and the
  save card reads PAUSE · LABEL · ASK PIB.
- **The PIB line:**
  - PIB is introduced as "the government's" (the central government's, on screen).
  - The number is on screen and held, not read out: ten spoken digits sounded like a bank phone menu.
  - "Screenshot the number" is spoken.
  - The paid-tools line moved here, as the reason check three matters most.
- **Telugu:**
  - "who is asking?" is fixed: "రెండు వేలు అడిగే వరద వీడియో".
  - "అమీర్‌పేట్ అని రాసిన బోర్డ్".
  - "లేబుల్ లేకపోయినా, ఫేక్ అవ్వొచ్చు", where "లేబుల్ లేదంటే, నిజమని కాదు" flipped the meaning.
  - "ఆ వీడియోని" before "పంపండి" (it sounded like "send the money to PIB").
  - "డబ్బులు పెట్టి వాడే టూల్స్, ఇంకా నిజంలా కనిపించే ఫేక్‌లు".
  - "గుర్తుపెట్టుకోండి".
  - "పాజ్, లేబుల్, పీఐబీ".
- **Sound:**
  - A glitch and a hit on the umbrella frames.
  - A 0.6 s silence and a music drop before "So no label?".
  - A swell under the number card, which holds 3 s or more.

## Script v2 (EN | TE). One narrator: EN on Fish (the storyteller clip), TE on Parler (Lalitha)
| # | prop | English | Telugu |
|---|---|---|---|
| 1 | hook | Two thousand rupees per family, for a flood video made in four and a half minutes. [1] We made this fake ourselves. | రెండు వేలు అడిగే వరద వీడియో; చేసింది నాలుగున్నర నిమిషాల్లో. [1] ఈ ఫేక్ ని, మేమే చేశాం. |
| 2 | pause | Check one: pause it. [1] One umbrella turns into two. [2] And the sign we asked to say Ameerpet? In every frame, not a word. | ఒకటో చెక్: పాజ్ చేసి చూడండి. [1] ఒక గొడుగు, రెండు అవుతుంది. [2] అమీర్‌పేట్ అని రాసిన బోర్డ్ అడిగాం; ప్రతి ఫ్రేమ్ లోనూ, అది అసలు పదమే కాదు. |
| 3 | label | Check two: the label. [1] On Instagram or YouTube, an AI label means AI. But Meta's labels don't cover WhatsApp. / [2] So no label? It can still be fake. | రెండో చెక్: లేబుల్. [1] ఇన్స్టాగ్రామ్, యూట్యూబ్ లో, కంప్యూటర్ తో చేశారని లేబుల్ ఉంటే, నమ్మొచ్చు. కానీ మెటా లేబుల్స్, వాట్సాప్ లో రావు. / [2] లేబుల్ లేకపోయినా, ఫేక్ అవ్వొచ్చు. |
| 4 | ask | Paid AI leaves fewer clues, so check three matters most. [1] Before you forward or pay, send the video to the government's PIB Fact Check, on WhatsApp. [2] Screenshot the number. | డబ్బులు పెట్టి వాడే టూల్స్, ఇంకా నిజంలా కనిపించే ఫేక్‌లు చేస్తాయి. అందుకే మూడో చెక్ ముఖ్యం. [1] ఫార్వర్డ్ చేసే ముందు, డబ్బులు పంపే ముందు, ఆ వీడియోని, కేంద్ర ప్రభుత్వ పీఐబీ ఫ్యాక్ట్ చెక్ కి, వాట్సాప్ లో పంపండి. [2] నంబర్ స్క్రీన్‌షాట్ తీసుకోండి. |
| 5 | loop | If you do one thing: never pay a UPI ID from a forward. [1] Pause, label, ask PIB. | ఒక్కటే గుర్తుపెట్టుకోండి: ఫార్వర్డ్ లో వచ్చిన యూపీఐ ఐడీ కి, ఎప్పుడూ డబ్బులు పంపకండి. [1] పాజ్, లేబుల్, పీఐబీ. |

## On screen (English in both versions)
- **1:** Ravi's phone with the WhatsApp forward. The clip plays (shot 1, then 2, then 3), with the message, the
  ₹2,000 and a "Pay" button. The two big numbers. The tag "we made this fake ourselves".
- **2:** a freeze on shot 1 with a zoom on the sign: "ASKED FOR: AMEERPET" / "GOT:" (the real crop) /
  "0 of 48 frames: a real word". Then shot 3, frames 8 and 9 side by side, ringed: "1 umbrella -> 2".
- **3:** a file card: "Content Credentials (C2PA): none · AI tag: none". Under it: "Apps label a video when: the maker
  says so · the file carries a tag · their own systems catch it". Stamp: "NO LABEL ≠ REAL".
- **4:** a PIB Fact Check card: "WhatsApp +91 87997 11259", "before you forward or pay".
- **5:** a save card ("PAUSE · LABEL · ASK") and the note "paid AI video: cleaner, fewer clues". The loop returns to
  the forward.

## Caption try-it (no comment ask)
"Next flood or accident video in your family group: pause it on a sign or a hand, look under it for an AI label, and
send it to PIB Fact Check (WhatsApp +91 87997 11259) before you forward or pay."
