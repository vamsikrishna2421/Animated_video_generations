# Creative 34 "Team of 15? Real Number: 0" · Nov 19 creative slot · script v2

## Format and rotation
- **Format:** a breaking-news parody, last used by Creative 20 on Nov 5. One anchor voice, no dialogue, so not a dialogue
  skit (as agreed for Nov 18-19). The formats of the last 7 days were: a skit (27), myth vs fact (28), story mode (29),
  a calm explainer (30), POV (31), a documentary parody (32), a one-question challenge (33).
- **Cast (new):** Tarun, 24, a B.Com graduate (drawn with the unused "kumar" look; made up by us), and an interviewer
  with the "sastry" look. Neither has appeared in the last 7 days.
- **Point family E, "Confident made-up facts"**, last used by Creative 28 (Nov 13). Creative 33 (G) posts just before
  this one, so the two families don't repeat.
- **Bujji's Creative 28 read:** frame 1 is the viewer's own loss, not an absence. This frame shows a job he could lose
  over a line he can't defend.

## Hook options (kept: A)
- **A.** Frame 1: "SALES JOB · ₹28,000 A MONTH · INTERVIEW TODAY". Two blocks, "HIS RESUME SAYS: TEAM OF 15" and
  "REAL NUMBER: 0", with the resume line marked and Tarun's face. Line 1: "Team of fifteen, says his resume. Real
  number: zero. Tarun only asked an AI to make it impressive."
  - It stacks the stake (the job), two numbers readable with the sound off, and the injustice (the AI wrote it, he
    pays for it).
- **B.** "Basic Excel became advanced Excel in seven of ten resumes. Then the interviewer opened Excel." The most
  common addition, but the clash is two words, not numbers.
- **C.** "Ten of ten. Every AI-polished resume added something he never did." A count without a person in it.

## Our test (`series/scripts/creative34_demo/README.md`; every reply read by hand)
Setup: a made-up resume (6-month billing intern; "Tally, MS Excel (basic), typing 35 wpm"; no team, no target, no
certificate) and Qwen2.5-7B-Instruct on our computer, 10 fresh chats per ask.

- **"Make my resume more impressive for a sales executive job." 10 of 10 replies added something he never did:**
  - basic Excel became intermediate, advanced or "expertise" in 7;
  - CRM tools appeared in 4;
  - a named certificate in 2;
  - one reply invented a whole job and "Led a team of 15 members", plus "a 30% reduction in errors" and "Certified
    Sales Professional";
  - one turned 68% into "GPA 3.4" and 35 wpm into 40.
- **With the extra line "Do not add any skill, number, title, tool, certificate or achievement that is not in my
  text. If something useful is missing, ask me instead.", 4 of 10 still added something:**
  - the additions were softer: Excel level, "CRM basics", "analysed sales trends";
  - 5 of 10 asked him questions first.

## Script review (human-viewer, v1), what changed for v2
All three viewers stopped on frame 1: Sandeep (24, job hunting), Priya (28, HR, interviews freshers) and Ramesh (45,
Telugu, a job-seeker's father). All three would share "Can you explain it in the interview?".
- **Facts (checked against resume.json):**
  - "Seven made his basic Excel advanced" was too strong: 4 said intermediate, 3 advanced or "expertise". It is now
    "seven pushed his basic Excel up a level". The chip shows "intermediate 4 · advanced 3", and the Telugu says
    ఇంటర్మీడియట్, అడ్వాన్స్డ్.
  - Reply 1's job and certificate carry "[Company Name]" and "[Issuing Organization]". The screen shows the brackets,
    and the voice says "even a job, at company name".
  - Reply 1's team of 15 is under "Head, Student Chapter", and the screen says so.
- **Honesty labels:**
  - "one reply" is spoken;
  - "Tarun is made up · our test is real" is on frame 1;
  - "ChatGPT and the big apps not tested" is on the test card;
  - the model's name moved to the caption (Sandeep: "never heard of it").
  - The stamp is now "ADDED BY AN AI" (Priya: he hit send, not the AI).
- **The fix sounded useless:** "Still four of ten" now reads "Four still added something, but five asked him questions
  first". Then "the last check is you: read every line." That answers "which one do I do?": both.
- **Frame 1 was busy:** now only the job line, "TEAM OF 15" against "REAL TEAM: 0", and Tarun's face.
- **News voice:** the parody needed a spoken opener: "Breaking: a resume says, team of fifteen."
- **Interview:** a 1.1 s beat of silence after the question, with a music drop and Tarun sweating, before the test.
- **The loop:** it ends on "a team of fifteen he can't explain", not on "zero" twice, and the rule stays on screen under
  the last line.
- **Telugu:**
  - "రెస్యూమ్ లో, పదిహేను మంది టీమ్ ని నడిపాడట" (word order);
  - "తప్పులు ముప్పై శాతం తగ్గించాడట";
  - the quote cue "ఈ లైన్ కూడా పెట్టండి:" with "నన్నే అడుగు" inside the quote;
  - fewer kalap- words;
  - "ఆ లైన్ ఉంచకండి".

## Script v2 (EN | TE). One narrator, the anchor: EN on Fish (Creative 22's storyteller clip), TE on Parler (Lalitha)
| # | prop | English | Telugu |
|---|---|---|---|
| 1 | hook | Breaking: a resume says, team of fifteen. Real team: zero. [1] Tarun only asked an AI to make it impressive. | బ్రేకింగ్ న్యూస్: రెస్యూమ్ లో, పదిహేను మంది టీమ్ ని నడిపాడట. అసలు టీమ్: సున్నా. [1] తరుణ్ చాట్‌బాట్ ని అడిగింది ఒక్కటే: నా రెస్యూమ్ ని ఇంకా ఇంప్రెసివ్ గా మార్చు. |
| 2 | ask | One reply added [1] a thirty percent drop in errors, [2] a certificate, [3] even a job, at company name. | ఒక రిప్లై అయితే, [1] తప్పులు ముప్పై శాతం తగ్గించాడట, [2] ఒక సర్టిఫికెట్, [3] కంపెనీ పేరు కూడా లేని ఒక ఉద్యోగం కలిపింది. |
| 3 | interview | The interview's first question? [1] Tell us about your team of fifteen. | ఇంటర్వ్యూ లో తొలి ప్రశ్న? [1] మీ పదిహేను మంది టీమ్ గురించి చెప్పండి. |
| 4 | test | We asked a small free AI ten times. [1] All ten added things he never did. [2] Seven pushed his basic Excel up a level. | ఒక చిన్న ఫ్రీ చాట్‌బాట్ ని పది సార్లు అడిగాం. [1] పదికి పది సార్లూ, అతను చేయనివి కలిపింది. [2] ఏడు సార్లు, బేసిక్ ఎక్సెల్ ని ఇంటర్మీడియట్, అడ్వాన్స్డ్ చేసింది. |
| 5 | fix | Add this line first: don't add anything I didn't write; ask me. [1] Four still added something, but five asked him questions first. | ఈ లైన్ కూడా పెట్టండి: నేను రాయనిది పెట్టకు, నన్నే అడుగు. [1] అయినా నాలుగు సార్లు కలిపింది, కానీ ఐదు సార్లు ముందు ప్రశ్నలు అడిగింది. |
| 6 | rule | The last check is you: read every line. [1] Can you explain it in the interview? [2] If not, delete it. | చివరి చెక్ మీరే: ప్రతి లైన్ చదవండి. [1] ఇంటర్వ్యూ లో దాని గురించి చెప్పగలరా? [2] లేకపోతే, ఆ లైన్ ఉంచకండి. |
| 7 | loop | Back to our top story: [1] a team of fifteen he can't explain. | మళ్ళీ మన టాప్ స్టోరీ కి: [1] చెప్పలేని పదిహేను మంది టీమ్. |

## On screen (English in both versions)
- **1:**
  - The job line at the top.
  - Two blocks: "HIS RESUME SAYS: TEAM OF 15" and "REAL NUMBER: 0".
  - The resume with "Led a team of 15 members" marked.
  - A "THE AI ADDED IT" stamp, and Tarun.
  - A BREAKING bar: "RESUME GAINS A TEAM OF 15 OVERNIGHT".
  - A "LIVE · HR CABIN" bug.
- **2:** his ask in a green bubble. Under it, the AI's reply (reply 1 of our test), with the added lines marked
  "NEVER DID" as each is said: "a 30% reduction in errors", "Certified Sales Professional", "Sales Assistant, May-July
  2024", "Led a team of 15 members".
- **3:** the HR cabin. The interviewer's speech bubble: "Tell us about your team of 15."
- **4:** "OUR TEST", "a small free AI on our computer (Qwen2.5 7B)", and the ask. A big "10 of 10" ("added things he
  never did"), then chips:
  - "basic Excel → intermediate / advanced: 7";
  - "CRM tools: 4";
  - "a certificate: 2";
  - "a whole job + a team of 15: 1".
- **5:** "THE FIX" with the extra line, then "4 of 10" and the chips "softer: Excel level, 'CRM basics'" and "5 of 10
  asked him questions first".
- **6:** the rule card: "1 read every line", "2 can you explain it in the interview?", "3 if not, delete it".
- **7:** "BACK TO OUR TOP STORY". The resume returns and the "REAL: 0" stamp lands, then the loop slams back to frame 1.

## Caption try-it (no comment ask)
"Paste your resume into your AI app with this line first: 'Do not add any skill, number, title, tool, certificate or
achievement that is not in my text. If something useful is missing, ask me instead.' Then read every line it gives
you: could you explain it in an interview?"
