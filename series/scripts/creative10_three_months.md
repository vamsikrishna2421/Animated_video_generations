# Creative 10 "The AI gave me three months" (script v2, Oct 26)

**Format:** a Telugu TV-serial parody: every shock gets the serial treatment (three snap zooms on the face, a thunder
crack, "dhan dhan dhan" hits, red and blue flashes), in one living room. Phone-chat inserts (the AI's real replies), a
copy-paste card, a test card, a study chip; loops (the last beat repeats the mistake; the replay's first frame is his
panic).
**Cast / setting:** Thathayya (Subbarao garu, 72, white kurta, glasses, a sugar patient, on the sofa, his phone's font at
maximum), Kamala (his daughter-in-law, 45, saree, a ladle, rushes in from the kitchen), Sravani (his granddaughter, 19,
engineering student, hoodie, one earphone in, deadpan) and Tommy (the family dog). The AI is an unbranded chat app ("AI
chat") on Thathayya's phone.
**AI idea:** ask an AI about a report in four words and it answers like a textbook for doctors (jargon, guidelines,
targets), easy to misread. Tell it who's reading and turn it into questions for the doctor: "Explain this to my
72-year-old grandfather in simple words. Then give 3 questions to ask his doctor." The AI explains; the doctor decides.
**Why it travels:** every family has an elder who asks the phone about a report and panics, and a grandchild who reads it
for them; "It's a test, Thathayya. Not a countdown." and "You're not dying. Your laddus are." are lines to send; the line
is one sentence to copy, for any report.

## Facts (verified Oct 26)
- HbA1c: "measures your average blood sugar levels over the past 3 months"; normal below 5.7%, prediabetes 5.7-6.4%,
  diabetes 6.5% or above (CDC, "A1C Test for Diabetes and Prediabetes", cdc.gov). Targets for people who already have
  diabetes vary with age and health (the doctor's call: the skit never says what 7.2 means for him).
- Study: Bean et al., "Reliability of LLMs as medical assistants for the general public: a randomized preregistered
  study", Nature Medicine 32(2):609-615, Feb 9, 2026 (Oxford Internet Institute; PMC12920132). 1,298 UK participants,
  ten medical scenarios, GPT-4o / Llama 3 / Command R+ or their usual resources. The models alone named the condition in
  94.9% of cases; participants using them identified relevant conditions in fewer than 34.5%, no better than the control
  group. "Users often failed to provide the models with sufficient information"; 16 of 30 sampled first messages held
  only part of the story. On screen: "AI alone: 95% · people using AI: under 35% · no better than without AI".
- OpenAI, ChatGPT Health (Jan 7-8, 2026): "It is not intended for diagnosis or treatment"; "designed to support, not
  replace" care; more than 230 million people a week ask ChatGPT health and wellness questions; it lists "understanding
  test results" and "preparing for appointments with a doctor" (TechCrunch Jan 7, pharmaphorum Jan 8, Smithsonian Jan
  12, 2026; openai.com refused our fetch). Caption only.
- Our test (pipeline/creative10/report_demo.py, results in series/scripts/creative10_demo/results.json): Qwen2.5-7B
  Instruct (Qwen's own 4-bit file) on this machine's CPU, in a network namespace with no internet, one lab value
  (HbA1c 7.2%), ten replies each way, temperature 0.7, the same seed per try. Every reply read by hand.

## Our test (results.json, every reply read by hand)
PENDING (the run is going): "HbA1c 7.2 meaning" vs the line + "HbA1c 7.2%". So far (5 of 20): the four words gave
176-230 words of doctor-talk ("glycated hemoglobin", ADA and EASD targets, "hypoglycemia", "comorbidities", "a shorter
life expectancy"), every one saying "over the past 2 to 3 months"; with the line, 126-137 words, "like a report card for
his diabetes", "higher than ideal, but not extremely high", and three questions for the doctor.

## Hook options
1. **(kept)** Frame 1: Thathayya on the sofa in a serial zoom, tears, the phone held up: the AI's wall of text with
   "over the past 2 to 3 months" circled red; thunder. "The AI gave me two to three months!"
2. Frame 1: Thathayya dictating his will to Kamala: "The gold to Sravani, the scooter to..." Kamala: "Mavayya, it's one
   sugar test!"
3. Frame 1: Thathayya reading aloud, horrified: "Glycated... haemoglobin... hypoglycaemia... Kamala, call the
   ambulance!"
Kept 1: a misread anyone recognises, taken from the AI's real reply (every four-word reply says "the past two to three
months"), a death sentence in frame 1 the viewer can't explain until 0:08, and the serial zoom says "comedy" at once.

## Viewer notes on v1 and what changed (v2)
- Both: "HbA1c 7.2 meaning" is three words, not four: "three" everywhere (Telugu మూడు మాటలు), and the phone shows what he
  typed.
- Both: the study line contradicted its own chip ("one time in three" heard next to "AI alone: 95%"), and Priya: it
  tested symptoms-to-diagnosis, not reading reports. Two stat beats in a row lost both of them. The study moved to the
  caption and the pinned comment; the video keeps one stat beat (our test).
- Both: too long (60-67 s). Cut Kamala's "But can we trust it?", the AI's answer trimmed to its gist plus question 1, the
  test said in one breath.
- "Explain this": what, and when? The card now says "before the doctor visit", shows "+ HbA1c 7.2%" under the line and
  "(then the report's numbers; hide the name)", stays up for the whole line; "change the who" comes in late.
- The reassurance came before the rule. New order: the line, the answer, our test, the rule (Kamala: "So the AI
  explains..." Sravani: "...and the doctor decides."), then "So... I'm not dying?" / "You'll live. Your laddus won't."
  and the loop: the laughs come last.
- "A free AI" sounded like ChatGPT: "a small free AI" with "Qwen 7B, offline" on the card; "zero" is said as zero
  doctor-talk on the card.
- Frame 1 circles "a shorter life expectancy" (in its real reply 1) as well as "2 to 3 months": the panic comes from the
  doctor-talk, not from plain English.
- The AI's spoken answer ends on question 1, "what does it mean for his health?": what 7.2 means for him is the doctor's
  call (the simple reply compares him to the 5.7% normal).
- Telugu: one register with Thathayya (informal: ఇటివ్వు, నువ్వు... చేశావ్, నువ్వు బతుకుతావ్); line 1 names the AI the
  serial way ("ఏ ఐ నాకు రెండు మూడు నెలలే టైం ఇచ్చింది!"); ఏ ఐ and ఆక్స్ ఫర్డ్ spaced for the TTS; the card's English
  says "seventy-two" and "three" in words.
- Sound: a hit on the test card's number, a drop before "zero", a boom and clap on "the doctor decides", the laddu zoom's
  thunder; the end runs into frame 1's thunder (no slam of its own).
- Caption: "hide the name before pasting"; the comment questions they'd ask ("Which app?", "Same on ChatGPT?", "Can I type
  in Telugu?") are answered in the pinned comment without claiming what we didn't test.

## Script (English) · v2
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Thathayya | The AI gave me two to three months! | frame 1: a serial triple zoom on his face, tears; his phone, huge font: "...a shorter life expectancy..." and "over the past 2 to 3 months", both circled red; thunder 0.1 s in; banner "AI and your report"; EPISODE 1,247 |
| 2 | Kamala | Three months?! Mavayya! | she drops the ladle; triple zoom on her; dhan dhan dhan; then Tommy's triple zoom and a whimper (no line) |
| 3 | Sravani | Thathayya. Give me that. | wide: she walks in, one earphone, reaches for his phone; the serial bed stops |
| 4 | Sravani | "Average blood sugar over the past two to three months." It's a test, Thathayya. Not a countdown. | the phone: "HbA1c 7.2 meaning" and its real reply; the sentence highlighted, PAST underlined; chip "a report on the PAST 3 months, not a countdown" |
| 5 | Thathayya | Then what's "glycated haemoglobin"? And "shorter life expectancy"?! | the jargon circled one by one |
| 6 | Sravani | You typed three words, so it wrote for doctors. Tell it who's reading. | chip "3 words → it wrote for doctors" |
| 7 | Sravani | Before the doctor visit, type this: Explain this to my seventy-two-year-old grandfather in simple words. Then give three questions to ask his doctor. | TYPE THIS card for the whole line: the line, "+ HbA1c 7.2%", "(then the report's numbers; hide the name)", late: "change the who: Amma, me, a 10-year-old" |
| 8 | AI | It's like a report card for his sugar: higher than ideal, but not extremely high. Ask his doctor: what does it mean for his health? | the phone: the line on top, its real reply (try 1) shortened, then its 3 questions |
| 9 | Sravani | I tested a small free AI ten times. Three words: doctor-talk every time. With the line: zero. Plus three questions for the doctor. | OUR REAL TEST card (Qwen 7B, offline, 10 tries each); rows land on "three words", "zero", "three questions" |
| 10 | Kamala | So the AI explains... | chip "AI EXPLAINS." |
| 11 | Sravani | ...and the doctor decides. | chip "AI EXPLAINS. THE DOCTOR DECIDES."; boom and clap |
| 12 | Thathayya | So... I'm not dying? | |
| 13 | Sravani | You'll live. Your laddus won't. | the laddu box glows; then he hugs it: triple zoom, thunder |
| 14 | Thathayya | Just one small question... about laddus. | he types "laddu sugar patient" (three words again); its real reply comes back; the replay opens on frame 1 |

## Script (Telugu) · v2, English on-screen text
| # | Who | Line |
|---|---|---|
| 1 | Thathayya | ఏ ఐ నాకు రెండు మూడు నెలలే టైం ఇచ్చింది! |
| 2 | Kamala | మూడు నెలలా?! మావయ్యా! |
| 3 | Sravani | తాతయ్యా, ఫోన్ ఇటివ్వు. |
| 4 | Sravani | గత రెండు మూడు నెలల షుగర్ సగటు అని రాసుంది. ఇది టెస్ట్ తాతయ్యా, కౌంట్ డౌన్ కాదు. |
| 5 | Thathayya | మరి గ్లైకేటెడ్ హీమోగ్లోబిన్ ఏంటి? షార్టర్ లైఫ్ ఎక్స్పెక్టెన్సీ ఏంటి?! |
| 6 | Sravani | నువ్వు మూడు మాటలే టైప్ చేశావ్, అందుకే డాక్టర్ల కోసం రాసింది. ఎవరు చదువుతున్నారో చెప్పాలి. |
| 7 | Sravani | డాక్టర్ దగ్గరికి వెళ్ళే ముందు, ఇలా టైప్ చేయాలి: Explain this to my seventy-two-year-old grandfather in simple words. Then give three questions to ask his doctor. |
| 8 | AI | ఇది షుగర్ కి రిపోర్ట్ కార్డ్ లాంటిది. ఉండాల్సిన దానికంటే ఎక్కువ, కానీ మరీ ఎక్కువ కాదు. డాక్టర్ ని అడగండి: దీని అర్థం ఆయన ఆరోగ్యానికి ఏంటి? |
| 9 | Sravani | ల్యాప్టాప్ లో చిన్న ఫ్రీ ఏ ఐ ని పది సార్లు టెస్ట్ చేశా. మూడు మాటలకి: ప్రతిసారీ డాక్టర్ భాష. ఈ లైన్ తో: సున్నా. ఇంకా డాక్టర్ కి మూడు ప్రశ్నలు. |
| 10 | Kamala | అంటే, ఏ ఐ వివరిస్తుంది... |
| 11 | Sravani | డాక్టర్ నిర్ణయిస్తారు. |
| 12 | Thathayya | అంటే... నేను బతుకుతానా? |
| 13 | Sravani | నువ్వు బతుకుతావ్. నీ లడ్డూలే బతకవు. |
| 14 | Thathayya | ఒక్క చిన్న ప్రశ్న... లడ్డూల గురించి. |

## Caption ask (draft)
Asking an AI about a report? Before the doctor visit, type: "Explain this to my [72-year-old grandfather] in simple
words. Then give 3 questions to ask his doctor." Then paste the numbers (hide the name). The AI explains; the doctor
decides. Comment prompt: "Who reads the reports in your house: you, or the phone?"
