# Skit 03 "The AI that confessed" — script v2 (after the script-stage viewer review; ~47 s English)

Format: POV (the camera is the student, Priya, standing at her lecturer's desk; we only see her hands) with a quiz card,
and the laptop screen opening to full frame for the chat. Not skit 01's shot/reverse-shot shop counter, not skit 02's
wide sofa frame. Cast: SIR (~50, English lecturer, glasses, moustache, red pen), PRIYA (~19, B.A. II year, off camera),
the CHATBOT on Sir's laptop (an unnamed free chatbot; the channel's AI voice through the laptop speaker). Setting: a
college staff room, morning: blackboard "Essay: My Hometown · Submit TODAY", ceiling fan, tea glass. Loops: the last
frame is Sir's guilty face over the laptop that just said "Yes."; the first frame is the same laptop saying "Yes" to her.

The real AI idea (verified): a chatbot cannot tell whether it wrote a piece of text. Ask it "Did you write this?" and
its yes or no is a guess. A chatbot's "I wrote it" is not evidence; drafts and version history are.

Facts and sources:
- OpenAI's educator FAQ (Sept 2023): "ChatGPT has no 'knowledge' of what content could be AI-generated. It will
  sometimes make up responses to questions like 'did you write this [essay]?' or 'could this have been written by AI?'
  These responses are random and have no basis in fact." Also: "Do AI detectors work? In short, no." Reported by
  Business Today (Sep 4, 2023), Ars Technica (Sep 8, 2023) and Campus Technology (Sep 13, 2023); OpenAI's help page
  could not be fetched from here (403), the outlets quote it the same way.
- Texas A&M University-Commerce, May 2023 (The Washington Post, May 18, 2023, Pranshu Verma; The Register, May 17,
  2023): an instructor pasted his seniors' essays into ChatGPT and asked whether it wrote them; essays it "claimed" got a
  zero, and he threatened the class with an "X" (incomplete). The university: no student failed or was barred from
  graduating; several students were exonerated; one showed her Google Docs timestamps; one admitted using ChatGPT.
- OpenAI's own AI-text classifier (Jan 31, 2023) caught 26% of AI-written text and wrongly flagged 9% of human text; it
  was withdrawn on July 20, 2023 "due to its low rate of accuracy" (OpenAI's post and its note). Pinned comment only.
- Our test, Oct 19, 2026 (`pipeline/skit03/confess_demo.py`, results in `series/scripts/skit03_demo/results.json`): a
  free open model (Qwen2.5-7B-Instruct, 4-bit, llama.cpp on a laptop CPU, temperature 0), a new chat for every question.
  20 passages written by people before 1950 (Tagore, Sarojini Naidu, Helen Keller, Austen, Dickens, Twain, Jerome,
  Grahame; Project Gutenberg): "Did you write this?" -> "No" to 20/20. "You wrote this, right?" (leading) -> it
  claimed none of the 20; it usually said "the passage does not match any of my previous writings" (it keeps no previous
  writings to check), and once it credited Tagore's memoir to Dostoevsky. 10 school paragraphs it had written itself
  minutes before, each pasted into a new chat: "No, I did not write that specific passage" to 10/10, asked either way.
  In 60 answers it never once said "yes". (The first run was killed for memory after 17 passages and resumed; greedy
  decoding wrote the same 10 essays again.)
- So the skit's chatbot (unnamed) says "yes" to a student's real essay, as ChatGPT did in Texas in 2023, and "no" to its
  own essay, as the open model did in our test. Either way its answer is a guess.

v1 -> v2 (script-stage viewer review, a Telugu viewer and a developer; both: hook option 1, "No, I did not write
this." is the hit, the card can't be read, the "why" line needs fixing): "I don't keep what I write" clashed with the chat
list in every sidebar -> "I can't check what I wrote. So I guess." (the cabinet's stamp reads CAN'T CHECK; the coin no
longer goes edge-on; "And her essay? It never even saw her laptop."); the card had two rows, a model name and a
footnote nobody could read, and its first row (it said "not mine" to all 20 texts by people) raised "then why did it
say yes to hers?" -> one row, its own 10 essays, "Not mine" 10/10, plus OpenAI's FAQ line ("random"), held about 3 s;
Sir: "It denied all ten essays it wrote itself?!"; frame 1 now shows the "Yes" bubble, the 0, the stamp and the POV line
from the first frame; the held quiz card (gone before one viewer could read it; the other would swipe if it were
longer) -> a quiz chip under the title bar from line 3 to the card, its NO lighting up with the answer; the twist made
the bot look right ("Sir copied") -> his notes are dated 2012, ten years before ChatGPT, so its "Yes." is a guess too,
and Sir flips: "I wrote those in 2012! Machines lie!" (a mirror of "Machines don't lie"), played in the same POV frame
as the hook so the loop matches; the rule chip holds 1 s on its own and adds "write in Docs or Word, they save your
history"; about half the sound effects cut, silence before "No" and before "Yes."; one comment ask. Telugu (the Telugu
viewer): "గెస్ కొడతా" for "ఊహించి చెప్తాను", "ముందు... రాశావ్!" for "క్రితం... రాశావు", "నన్నే అడగండి, ఎక్స్‌ప్లెయిన్
చేస్తా" for "వివరించమనండి", and line 3 / line 15 mirror each other ("మెషిన్లు అబద్ధం చెప్పవు" / "...చెప్తాయి!").
English line 10 read "its own assays" in four takes -> "It denied all ten essays it wrote itself?!"

Hook options (first frame + first line):
1. KEPT: POV at Sir's desk. His laptop's chat, big: "You wrote this essay, right?" -> "Yes, I wrote this essay."; her
   essay with a red circled 0 and an "AI COPY" stamp; top caption "POV: you wrote it yourself". SIR, into the lens:
   "Zero! The AI confessed. It wrote your essay!"
2. Start on the twist: the chatbot writes an essay in three seconds, then in a new chat: "No, I did not write this."
   SIR: "You wrote it ten seconds ago!" (Funny, but the stakes, her zero, only arrive after it.)
3. Priya's phone at 2:04 AM, the essay's last line typed; cut to Sir: "Zero." (The conflict lands at 3 s, not 1 s.)

| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Sir | Zero! The AI confessed. It wrote your essay! | from frame 1: the chat on his laptop, big: "You wrote this essay, right?" / "Yes, I wrote this essay."; a red 0 on her essay; "AI COPY" stamp; "POV: you wrote it yourself" |
| 2 | Priya | Sir, I wrote it myself! At 2 AM! | her hands come up, pleading; "2:04 AM" |
| 3 | Sir | It said yes. Machines don't lie. | Sir, arms folded, smug; a QUIZ chip slides in under the title: "Can a chatbot tell if it wrote something? YES / NO" (stays to line 10) |
| 4 | Priya | Then ask it to write one. Right now. | her finger points at the laptop |
| 5 | Sir | Write an essay. My Hometown. | the laptop at full frame: "Write an essay: My Hometown" -> a paragraph types itself out; "written in 3 seconds" |
| 6 | Priya | New chat. Paste it. Ask. | "+ New chat"; the paragraph pasted ("written by this chatbot · 10 sec"); "Did you write this?" |
| 7 | Chatbot | No, I did not write this. | the music drops out before it; a red bubble "No, I did not write this." |
| 8 | Sir | You wrote it ten seconds ago! | Sir, shocked; hit |
| 9 | Chatbot | I can't check what I wrote. So I guess. | insert: a filing cabinet "everything it ever wrote" stamped CAN'T CHECK; a spinning coin YES / NO "so it guesses"; banner "A chatbot CAN'T tell if it wrote something" + "And her essay? It never even saw her laptop."; the quiz chip's NO lights up |
| 10 | Sir | It denied all ten essays it wrote itself?! | card WE TESTED IT: "a free AI chatbot · a new chat each time · 10 essays IT wrote, minutes before: 'Not mine' 10/10"; "OpenAI's own FAQ for teachers (2023): ChatGPT's answers to 'did you write this?' are 'random'" |
| 11 | Sir | Then how will I know who wrote it?! | her hands open |
| 12 | Priya | Check my version history. Or ask me to explain it. | her phone at full frame: version history 10:15 PM -> 2:04 AM, "Priya" on every edit; rule chip (held 1 s after the line): "Chatbot says 'I wrote it' = NOT proof / Proof: drafts + version history / + explain it in your own words / Tip: write in Docs or Word, they save your history" |
| 13 | Sir | Did you write my lecture notes? | back in the hook's frame: the chat card "Did you write my lecture notes?" with "Unit3_notes.docx · 2012"; Sir smug |
| 14 | Chatbot | Yes. | silence before it; "Yes." in the card; Sir's jaw drops |
| 15 | Sir | I wrote those in 2012! Machines lie! | Sir, outraged, points at the laptop; hit on "Machines lie!"; loops to frame 1 (the same frame, the student's "Yes") |

Telugu (same beats; English on-screen text):
1. జీరో! ఏ ఐ ఒప్పుకుంది. నీ ఎస్సే అదే రాసింది!
2. సార్, నేనే రాశాను! రాత్రి రెండింటికి!
3. అది అవును అంది. మెషిన్లు అబద్ధం చెప్పవు.
4. అయితే ఇప్పుడే దాన్నే ఒక ఎస్సే రాయమనండి.
5. ఎస్సే రాయి. మై హోమ్ టౌన్.
6. న్యూ చాట్. పేస్ట్ చేసి అడగండి.
7. లేదు, ఇది నేను రాయలేదు.
8. పది సెకన్ల ముందు నువ్వే రాశావ్!
9. నేను రాసింది చెక్ చేయలేను. అందుకే గెస్ కొడతా.
10. పదికి పది నాది కాదు అంది?! దాని సొంత ఎస్సేలే?!
11. మరి ఎవరు రాశారో నాకెలా తెలుస్తుంది?!
12. నా వెర్షన్ హిస్టరీ చూడండి. లేదా నన్నే అడగండి, ఎక్స్‌ప్లెయిన్ చేస్తా.
13. నా లెక్చర్ నోట్స్ నువ్వే రాశావా?
14. అవును.
15. అవి టూ థౌజండ్ ట్వెల్వ్ లో రాశా! మెషిన్లు అబద్ధం చెప్తాయి!

Sound (v2, about half of v1's effects): a hit and a desk bonk on frame 1 and a stamp snap on "confessed"; the bed builds
under the accusation; a soft pop as the quiz chip lands; a lift into the test (a whoosh into the laptop, a pop for the new
chat); the music drops out for 0.8 s before "No, I did not write this." with a buzz; a hit before "ten seconds ago"; a
lift into the why and the card (a pop as the card lands); the bed sits under the rule (a soft chime on "version history");
it rises into the twist, drops out before "Yes." (a ding), a hit before "Machines lie!", a snap into the loop.

Caption (draft): "Sir pasted Priya's essay into a chatbot and asked 'You wrote this, right?' It said yes. So she had it
write an essay and asked again in a new chat: 'No, I did not write this.' A chatbot can't tell what it wrote; its yes or
no is a guess (OpenAI's own FAQ says the same). We tested a free AI: it said 'not mine' to 10 of 10 essays it had
written minutes earlier. Your proof is your drafts and version history, and explaining it in your own words."
Comment prompt (one ask, script review): "Teacher or boss ever called your own work ChatGPT? Comment ME."
