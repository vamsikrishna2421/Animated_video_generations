# EP35 "The brain that didn't fit" (model size & small language models): script v3, after the render review

v1 -> v2 (script review, a Telugu viewer and a developer; both: the bills rule contradicted the numbers, the quiz was
dead, "small language model" was never said; keep the good-morning loop): the rule now has a pass mark per job (sorting:
one miss is fine, so MEDIUM; bills: no misses allowed, none of the three passed, so a calculator, as in EP34); the quiz
asks for a number before the reveal ("MEDIUM: how many of 40?"); the AI names "small language models" and "parameters"
in one line; line 1 says why the brain must be in the phone (no internet), with the good-morning photos in frame 1 and
"needs 4.7 GB" moved to line 2; the sizes are TINY / MEDIUM / BIG (pizza sizes; "మధ్యది" was clunky); the bills come as
mistakes ("Medium: nine wrong. Big: two wrong"), the bars lose their seconds and get one "4x FASTER"; the rule card is
three short rows held 3 s; Ravi notices 1.1 GB is more than his 1 GB free before deleting the photos; the AI files the
52 good mornings under OTHER (the medium brain at work) and says "Storage full" into the loop; the jars say "4-bit
files"; the giants' graphics cards stay for EP36. Telugu: "ఏఐ" written whole (a lone "ఏ" reads "which"), "బ్రెయిన్ అంతా
నంబర్లే" (not "it learned numbers": that read as "it learned to count"), "దీపావళి కేజీ ఎంత?!", "నాలుగు రెట్లు ఫాస్ట్",
"బిల్లులు వేస్తుంది" (EP34's verb), the test numbers all in English.

v2 -> v3 (render review, the same two viewers; both: the quiz card was gone before anyone could guess, and the bills
bars read like scores, "TINY 19/20" looked good): the quiz is one line, "MEDIUM: ?/40", held 2.6 s with a 3-2-1 count
(the music drops out on the 1); the bills card says "MISTAKES, out of 20 bills" and "19 wrong / 9 wrong / 2 wrong", and
the AI says "Out of twenty, medium got nine wrong. Big got two wrong." (it had sounded like a telegram); the storage
numbers add up through the ending (1 GB free; the good mornings deleted, 1.2 GB; the medium brain in, 0.1 GB; 52 more
photos, 0 GB; the bar had shown 41 GB free after the delete); the jars name the three we tested (Qwen2.5) and the chip's
examples are Llama 3.2 1B, Gemma 3 1B and Qwen2.5 1.5B (Phi-3-mini, 3.8 billion, would not fit in 1 GB); under the
tiny one's 14, "guessing at random gets about 10"; a riser and a bonk lead into the 14 and into the bills; the jars are
on screen from the cut (the Telugu cut showed an empty screen for a second); the family-group banner no longer covers
"STORAGE FULL"; the captions use digits for the numbers ("forty of your | messages" had split). Heard back while
voicing (misheard = mispronounced): English "Fine, delete" was heard "Find", now "Okay, delete"; "Filed under OTHER" was
heard "field under", now "Those go in OTHER". Telugu: line 10 now says the medium one is the fast one ("కానీ మీడియం
నాలుగు రెట్లు వేగంగా చేసింది": "కానీ నాలుగు రెట్లు ఫాస్ట్" read as the big one, and "ఫాస్ట్" came out "forced"); "బ్రేన్"
in lines 1, 3 and 4 ("బ్రెయిన్" came out "breen"); the test numbers in Telugu words ("ఫోర్టీనా" came out "fortyna");
"మీడియం: ముప్పై తొమ్మిది కరెక్ట్" (a bare "ముప్పై తొమ్మిది." was dropped in every take). Not changed: the Telugu
music level (the pack's "15 dB under" measured only the music drop; the voice and music stems sit as in English, within
1 dB).

v3, round 2 (the same viewers on the v3 render; both: the round-1 fixes work): Telugu line 10's "ముప్పై తొమ్మిది" came
out "30, 90" or "tummidi" in eight takes, so it says "మీడియం: నలభైలో ఒక్కటే తప్పు!" (39/40 is on screen, and it sets up
the rule's "one miss is fine"); "ఒక్క తప్పు ఓకే" lost its "ఓకే", now "ఒక్క తప్పు పర్లేదు"; line 16 says the rule out
loud, "Done. The smallest one that passed is installed." ("పాస్ అయిన వాటిలో చిన్నది ఇన్స్టాల్ అయింది"; Parler drops the
opening "అయిపోయింది"); the last "Storage full" gets a sting (the bed swells from "Okay, delete", cuts out before
"Storage full" under a riser, and a louder hit lands on it); the last frame points to the caption's two free phone apps
("Try it: 2 free apps in the caption", the end held 0.8 s); random guessing is a dashed marker at 10 on the tiny bar;
the tested-models line is bigger; the captions show 39 and 4x as digits. Final length: English 71 s, Telugu 70 s.

Teaching skit in Ravi anna's shop (cast of skit 01, EP33, EP34). The plot carries the topic:
- **Failure (frame 1):** Ravi wants the shop AI's free brain (EP34) inside his phone, so it works at the counter with
  no internet. The phone says "Storage full": the brain is 4.7 GB, the phone has 1 GB free.
- **Mechanism:** a model's size is how many numbers it learned (its parameters). 7 billion numbers is a 4.7 GB file;
  1.5 billion is 1.1 GB; half a billion is half a GB. Smaller fits and runs faster, but can do less.
- **Demo:** our test, three sizes of the same free model sorting 40 of the shop's WhatsApp messages: tiny 14 right,
  middle 39, big 39; the middle one four times faster than the big one, a quarter the size. On EP34's 20 bills the
  same files got 1, 11 and 18 right.
- **Rule:** use the smallest model that passes your own test, job by job: sorting fits the phone (middle), bills need
  the big one on the laptop (or a calculator).
- **Twist:** Ravi deletes his good-morning photos to make room, installs the middle brain, and the family group sends
  52 new good-morning photos: storage full again (loops to frame 1).

Length goal about 55 s. Voices as EP34: Ravi on Parler "Thoma", the shop AI on Fish (the narrator) through the phone
sound; Telugu on Parler (Ravi = Prakash, AI = Kiran).

## Our demo (real, run by us: `pipeline/ep35/sort_demo.py`, data in `series/scripts/ep35_demo/`)
Ravi's small job: sort 40 WhatsApp messages the shop gets ("anna 2 kg rice and 1 litre oil pls", "sent 450 on UPI,
pls check", "the milk you sent yesterday was sour", "are you open on Sunday?") into ORDER / PAYMENT / COMPLAINT /
OTHER; the right label for each was written down first. Three sizes of one free model family (Qwen2.5-Instruct, Apache
2.0), each as Qwen's own 4-bit GGUF (q4_k_m), run with llama.cpp on the laptop CPU (4 threads, no graphics card).
Greedy decoding; the first label word in the reply counts.

| Model (numbers learned) | File | Messages right (of 40) | Seconds per message | EP34's 20 bills, same file |
|---|---|---|---|---|
| Qwen2.5-0.5B (0.49 billion) | 0.49 GB | 14 | 0.21 | 1 (0.7 s a bill) |
| Qwen2.5-1.5B (1.54 billion) | 1.12 GB | 39 | 0.48 | 11 (4.4 s a bill) |
| Qwen2.5-7B (7.61 billion) | 4.68 GB | 39 | 2.01 | 18 (15 s a bill, EP34) |

How they went wrong: the tiny one answered OTHER for almost everything; it filed "happy diwali anna and family", "thank
you anna, see you tomorrow" and "come home, lunch is ready" as ORDERs. The middle and big ones each missed one: "QR code
not working, what is your UPI id?" (COMPLAINT, we wrote PAYMENT). The bill numbers for the two small files come from
re-running EP34's bill test on these exact 4-bit files (EP34 had used their larger 16-bit versions: 1 and 9 right).

Facts (for the caption and the pinned comment):
- Small models made for phones: Meta's Llama 3.2 1B and 3B ("lightweight models that fit onto edge and mobile
  devices", Meta, Sept 25, 2024); Microsoft's Phi-3-mini, 3.8 billion numbers, "small enough to be deployed on a phone"
  (Phi-3 technical report, Apr 2024; 4-bit, about 1.8 GB, it ran on an iPhone 14); Apple's on-device model of about 3
  billion (Apple's foundation-model reports, 2024 and 2025); Google's Gemma 3 1B runs on a phone's CPU or GPU (Google
  Developers Blog, 2025).
- Our speeds are a laptop CPU's; a phone's will differ. The sizes are the files' real sizes; to run, a model also
  needs about that much free memory (RAM), not just storage.
- EP34 ran the two small models from their 16-bit downloads (1.0 and 3.1 GB) at 32-bit precision and got 1 and 9 bills
  right; EP35 uses Qwen's 4-bit files (0.49 and 1.12 GB): 1 and 11. Rented models come in sizes too; the small ones cost
  less per question.

## Script (English)
Lines of 1-3 s; never more than two AI lines in a row; Ravi asks what the viewer would ask.

| # | Who | Line | On screen |
|---|---|---|---|
| 1 | Ravi | AI! The free brain won't fit in my phone! | shop, wide: a queue; Ravi holds up his phone: a wall of good-morning photos (sunflowers, sunrises) under a red pop-up "Storage full"; sticker "HE WANTS AI WITHOUT INTERNET. IT DOESN'T FIT."; tag "EP35 · AI From Scratch" |
| 2 | AI | It's 4.7 GB. [1] You have 1 GB free. | the phone at full frame: storage bar, "Photos 61 GB" of good mornings, a sliver "free 1 GB"; the brain file "4.7 GB" bounces off |
| 3 | Ravi | Those are blessings! Get a smaller brain! | Ravi hugs his phone |
| 4 | AI | A brain is made of numbers: parameters. [1] Phone-size ones are small language models. | insert: three jars of numbers, BIG "7 billion · 4.7 GB", MEDIUM "1.5 billion · 1.1 GB", TINY "½ billion · 0.5 GB" ("the three we tested: Qwen2.5, 4-bit files"); on [1] a chip "Phone-size brains = SMALL LANGUAGE MODELS, e.g. Llama 3.2 1B · Gemma 3 1B · Qwen2.5 1.5B" |
| 5 | Ravi | Then the tiniest! Half a GB! | |
| 6 | AI | We tested all three on forty of your messages. [1] Tiny one: fourteen right. | the phone: WhatsApp messages dropping into four trays ORDER / PAYMENT / COMPLAINT / OTHER; a riser, then on [1] TINY 14/40 with a bonk, "guessing at random gets about 10" |
| 7 | Ravi | Fourteen?! Out of forty?! | |
| 8 | AI | It filed "Happy Diwali" as an order. | "happy diwali anna and family" lands in ORDER, a red ✕ (a real miss from our test) |
| 9 | Ravi | How much per kilo is Diwali?! [1] And the medium one? | after the line, a QUIZ card: "YOUR GUESS · MEDIUM: ?/40 · (tiny got 14)" with a 3-2-1 count, 2.6 s, a tick on each number |
| 10 | AI | [1] Thirty-nine. [2] Same as the big one. [3] Four times faster. | the music drops out on the count's 1, a hit on "Thirty-nine"; bars TINY 14/40 · MEDIUM 39/40 · BIG 39/40, sizes 0.5 / 1.1 / 4.7 GB; "= same", then "4x FASTER" |
| 11 | Ravi | Medium it is! It'll do my bills too! | |
| 12 | AI | Bills? Out of twenty, [1] medium got nine wrong. [2] Big got two wrong. | card "MISTAKES, out of 20 bills" (EP34's test, these files): TINY 19 wrong · MEDIUM 9 wrong · BIG 2 wrong, a riser into the medium one; "a wrong bill = a cheated customer" |
| 13 | Ravi | So which one do I use?! | |
| 14 | AI | Sorting? One miss is okay: medium. [1] Bills? No misses allowed: calculator. | rule card, three rows held 3 s: "SORTING: 1 miss OK → MEDIUM ✓" · "BILLS: 0 misses → none passed → CALCULATOR" · "Test each size on YOUR job. Keep the smallest that passes." |
| 15 | Ravi | Medium is 1.1. I have 1! [1] Okay, delete the good-morning photos. | the phone: "MEDIUM needs 1.1 GB · free 1 GB", then the photos fly into a bin: free 1.2 GB |
| 16 | AI | Done. The smallest one that passed is installed. | "MEDIUM ✓ 1.1 GB · works offline", the bar: free 0.1 GB |
| 17 | Ravi | (the phone buzzes: "Family group: 52 new photos") Who sent fifty-two good mornings?! | 52 good-morning photos pile up over the shop |
| 18 | AI | Those go in OTHER. [1] Storage full. | the photos drop into OTHER; the bed cuts out under a riser, a hit on "Storage full · 52 new photos · free: 0 GB"; "Try it: 2 free apps in the caption"; loops to frame 1 |

## Script (Telugu, same beats; English on-screen text)
1. ఏఐ, ఫ్రీ బ్రేన్ నా ఫోన్ లో పట్టట్లేదు!
2. అది ఫోర్ పాయింట్ సెవెన్ జీబీ. [1] మీ దగ్గర ఖాళీ వన్ జీబీనే.
3. అవి దీవెనలు! చిన్న బ్రేన్ పెట్టు!
4. బ్రేన్ అంతా నంబర్లే, పారామీటర్లు. [1] ఫోన్ సైజువి స్మాల్ లాంగ్వేజ్ మోడల్స్.
5. అయితే అన్నిటికంటే చిన్నది! హాఫ్ జీబీ!
6. మూడింటినీ మీ నలభై మెసేజ్ ల మీద టెస్ట్ చేశాం. [1] చిన్నది: పద్నాలుగే కరెక్ట్.
7. పద్నాలుగా?! నలభైలో?!
8. హ్యాపీ దీపావళి ని ఆర్డర్ అనుకుంది.
9. దీపావళి కేజీ ఎంత?! [1] మరి మీడియం?
10. [1] మీడియం: నలభైలో ఒక్కటే తప్పు! [2] పెద్దది కూడా అంతే, [3] కానీ మీడియం నాలుగు రెట్లు వేగంగా చేసింది.
11. మీడియమే! నా బిల్లులు కూడా వేస్తుంది!
12. బిల్లులా? ఇరవై బిల్లుల్లో, [1] మీడియం తొమ్మిది తప్పులు చేసింది. [2] పెద్దది రెండు తప్పులు చేసింది.
13. మరి ఏది వాడాలి?!
14. మెసేజ్ లకి ఒక్క తప్పు పర్లేదు: మీడియం. [1] బిల్లులకి ఒక్క తప్పూ కుదరదు: కాలిక్యులేటర్.
15. మీడియం వన్ పాయింట్ వన్. నా దగ్గర వన్ ఏ! [1] సరే, గుడ్ మార్నింగ్ ఫోటోలు డిలీట్ చెయ్.
16. అయిపోయింది. పాస్ అయిన వాటిలో చిన్నది ఇన్స్టాల్ అయింది.
17. యాభై రెండు గుడ్ మార్నింగ్ లు ఎవరు పంపారు?!
18. అవి అదర్ లో పెట్టాను. [1] స్టోరేజ్ ఫుల్.

## Sound
Fewer effects (script review: "busy"; half the viewers watch on mute, so every joke also works as text): a buzz and a
hit on frame 1 (the storage pop-up); the bed builds under the bad news; a lift into the test; a pop on "Happy Diwali";
the quiz holds with a ticking clock, then the music drops out before "Thirty-nine" and a hit lands on it; the bed lifts
into the rule; a whoosh as the photos go; a ding for "installed"; 52 pings speeding up into the "Storage full" hit, into
the loop.

## Caption (draft; the final text is in out/037_ep35_reel_captions.txt)
"Ravi wanted the shop's free AI brain inside his phone. The phone said: storage full. A model's size is how many numbers
it learned: our big one is 7 billion numbers (4.7 GB), the middle one 1.5 billion (1.1 GB), the tiny one half a billion.
Brains small enough for a phone are called small language models. We tested all three sizes on 40 shop messages: tiny
14 right, medium 39, big 39, and the medium one was 4x faster. On 20 bills: medium 9 wrong, big 2 wrong. Give each job a
pass mark (sorting: a miss is fine; bills: no misses) and keep the smallest model that passes. Next: why the giant
brains need graphics cards (EP36)."
