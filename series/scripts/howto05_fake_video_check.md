# HOW TO 05 "Fake-video check: 3 checks before you forward" · Thu Nov 19 · script v1

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

## Script v1 (EN | TE). One narrator: EN on Fish (the storyteller clip), TE on Parler (Lalitha)
| # | prop | English | Telugu |
|---|---|---|---|
| 1 | hook | Two thousand rupees asked, for a video made in four and a half minutes. [1] We made this flood video ourselves, with a free AI. | రెండు వేల రూపాయలు అడుగుతోంది; ఈ వీడియో చేయడానికి పట్టింది నాలుగున్నర నిమిషాలు. [1] ఈ వరద వీడియో, మేమే ఒక ఫ్రీ టూల్ తో, కంప్యూటర్ లో చేశాం. |
| 2 | pause | Check one: pause it. [1] We asked for a sign that says Ameerpet. In all forty-eight frames, it's not a word. [2] And here, one umbrella turns into two. | ఒకటో చెక్: పాజ్ చేసి చూడండి. [1] అమీర్‌పేట్ అని బోర్డ్ అడిగాం. నలభై ఎనిమిది ఫ్రేముల్లోనూ, అది ఒక్క పదం కూడా కాదు. [2] ఇక్కడ, ఒక గొడుగు రెండు అవుతుంది. |
| 3 | label | Check two: look for an AI label. [1] Our file carries no AI tag, so Instagram or YouTube label it only if their own systems catch it. [2] No label doesn't mean real. | రెండో చెక్: కంప్యూటర్ చేసిందని లేబుల్ ఉందా చూడండి. [1] మా ఫైల్ లో అలాంటి ట్యాగ్ లేదు; ఇన్స్టాగ్రామ్, యూట్యూబ్ సొంతంగా పట్టుకుంటేనే లేబుల్ వస్తుంది. [2] లేబుల్ లేదంటే, నిజమని కాదు. |
| 4 | ask | Check three: before you forward or pay, [1] send it to PIB Fact Check on WhatsApp: eight seven nine nine seven, one one two five nine. | మూడో చెక్: ఫార్వర్డ్ చేసే ముందు, డబ్బులు పంపే ముందు, [1] పీఐబీ ఫ్యాక్ట్ చెక్ వాట్సాప్ కి పంపండి: ఎనిమిది ఏడు తొమ్మిది తొమ్మిది ఏడు, ఒకటి ఒకటి రెండు ఐదు తొమ్మిది. |
| 5 | loop | Paid tools make cleaner fakes, with less to pause on. So do all three: [1] pause, label, ask. | డబ్బులు కట్టే టూల్స్ ఇంకా శుభ్రమైన ఫేక్ లు చేస్తాయి. అందుకే మూడూ చేసుకోండి: [1] పాజ్, లేబుల్, అడగడం. |

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
