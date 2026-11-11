# Creative 26 "Hanuman Chalisa, Part 1: See His Form" (the pilot) · the Nov 11 creative slot · script v2

## Why (Bujji's [STRATEGY] Nov 9, Vamsi direct; the plan ACKed Nov 10)
Vamsi: "Insta reels became too routine... Everything is skits." And a new ask: a reel that visualises Hanuman from the
Chalisa itself, so that when someone chants a line they have a living picture of it. Not a skit, no AI point, no
family cast, no comedy: a calm devotional explainer. A pilot first (chaupais 1-4, who he is and what he looks like) for
Vamsi to judge the style; Parts 2-5 only after he approves.

## The format (per chaupai, about 14 s)
1. A soft bell; the line on screen (Devanagari, with the Roman transliteration under it) and chanted slowly in Hindi
   (the same chant voice on both pages; the line itself is never translated).
2. One or two simple sentences of meaning (EN: the clear narrator; TE: Telugu), while the animation shows exactly that
   line happening.
3. "Picture him...": the image to hold when you chant it.
No music bed (Vamsi's taste: "the line itself is the music"); a bell on every new line; a deeper bell on frame 1 and on
the loop.

## The locked Hanuman (design sheet: series/scripts/creative26_design/hanuman_sheet.jpg, committed first)
One drawing function (`hanuman()` in video/src/reel/loop/HanumanCrayon.tsx), reused unchanged in every scene and every
later part; only the pose and the scale change.
- golden skin ("kanchan baran"); a calm, kind face; a red tilak;
- dark curly hair ("kunchit kesa") under a gold crown; round gold earrings ("kanan kundal");
- a saffron dhoti with a gold border, a gold necklace and armlets ("biraj subesa", fine clothes);
- the munj sacred thread across the chest (chaupai 5, Part 2);
- the mace in his right hand, the saffron flag in his left (chaupai 5);
- a long tail curling up behind him.
Poses on the sheet: standing, flying, kneeling with folded hands, the giant form.

## Text and meanings (checked Nov 11, 2026)
The Hanuman Chalisa, by Goswami Tulsidas, in Awadhi, 16th century (Wikipedia, "Hanuman Chalisa": "written by Tulsidas
in the Awadhi language"; "40 verses"; the first chaupais describe "the auspicious form, knowledge, virtues, powers and
bravery of Hanuman"). Public domain. Meanings checked against two translations that agree:
Art of Living ("Hanuman Chalisa lyrics meaning", English) and Drik Panchang ("Shree Hanuman Chalisa translation", Hindi).
| # | Line (Devanagari) | Roman | Meaning (Art of Living's English; Drik Panchang's Hindi agrees) |
|---|---|---|---|
| 1 | जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥ | Jai Hanuman gyan gun sagar, jai Kapis tihun lok ujagar | "Victory to Lord Hanuman, the ocean of wisdom and virtue"; "supreme among the monkeys, illuminator of the three worlds" (Drik: heaven, earth and the netherworld) |
| 2 | राम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥ | Ram doot atulit bal dhama, Anjani-putra Pavan-sut nama | Ram's messenger, "the abode of matchless power"; Anjani's son, "popular as the 'Son of the Wind'" |
| 3 | महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी॥ | Mahabir bikram Bajrangi, kumati nivar sumati ke sangi | "Great hero, You are as mighty as a thunderbolt." "You remove evil intellect and are the companion of those having good ones." |
| 4 | कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥ | Kanchan baran biraj subesa, kanan kundal kunchit kesa | "Your skin is golden in color and You are adorned with beautiful clothes." "You have adorning earrings in Your ears and Your hair is curly and thick." |
Spelling: the common Awadhi text (महाबीर बिक्रम, as in the Gita Press editions; Drik Panchang writes महावीर विक्रम).

## Hook options
1. **(v1)** Frame 1: golden Hanuman standing over a sea of light, the first line in Devanagari at the top, and the
   chant starting at 0.1 s; a small tag: "You know it by heart. Can you see it?"
2. A dark screen with only the line and "When you chant this, what do you see?", then the picture blooms at 2 s.
3. The chaupai 4 portrait first ("this is the face to see"), then back to chaupai 1: gives away the payoff.
(The reach rule's numbers pair is for the AI reels; this is a different audience and format by Vamsi's ask.)

## Script review (human-viewer, v1) and what changed (v2)
A Telugu devotee (50s, chants every Tuesday) and a 25-year-old who grew up hearing it in Hindi: both pick hook 1 (the
chant in the first second); the format reads like a ritual, not tiring; nothing in the meanings is wrong, but "Kapis"
was missing; the share depends on the face (it must be a vanara face with a tilak, not a kids' cartoon) and on the
chant's pronunciation. Telugu: correct but too casual for God (కొడుకు, చూడండి, జపించు, జుట్టు).
Changed (v2): line 1 adds "greatest of the vanaras" / "వానర శ్రేష్ఠుడు"; Telugu in a devotional register (అంజనీ పుత్రుడు,
వాయు పుత్రుడు, మనసులో దర్శించుకోండి, చాలీసా చదివేటప్పుడు, శ్రీరాముని దూత, వజ్రదేహం, ఉంగరాల ముంగురులు, తోడుగా ఉంటాడు); the
ending "Next time you chant or hear it, see this face."; the frame-1 tag "You know these words. Now see them."; the face
redrawn calmer (almond eyes, lowered lids, a thin high brow: the first sheet's round eyes read like spectacles). Not
changed: the chaupai in Telugu script on the Telugu page (the channel rule keeps on-screen text in English; Vamsi's
call), a tanpura drone (Vamsi's no-bed rule; offered as an option), word-by-word glosses (Part 2 can test them).

## Script (English page; chant = Hindi voice, narrator = English) · ~60 s
| # | Who | Line | Picture |
|---|---|---|---|
| 1 | chant | जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥ | Hanuman standing on a rock over a dark sea; the sea turns to light |
| 2 | narrator | Victory to Hanuman, ocean of wisdom and goodness. [1] Greatest of the vanaras, his light fills all three worlds. [2] Picture him shining over a sea of light. | the waves glow gold; [1] three bands light up: the sky, the earth, the world below; [2] his glow fills the frame |
| 3 | chant | राम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥ | he rises into a sky of clouds |
| 4 | narrator | Ram's messenger, with strength no one can match. [1] Son of Anjani, son of the Wind. [2] Picture him riding the wind. | flying across the sky; [1] the wind wraps around him in swirls; [2] he flies on, the flag streaming |
| 5 | chant | महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी॥ | standing firm; dark clouds gather on one side, a lamp glows on the other |
| 6 | narrator | The great hero, with a body strong as a thunderbolt. [1] He drives away bad thoughts, and stays with the good. [2] Picture him clearing the dark clouds from your mind. | a thunderbolt flash across him; [1] he lifts the mace, the dark clouds ("bad thoughts") break and drift away, the lamp ("good thoughts") burns brighter beside him; [2] a clear sky |
| 7 | chant | कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥ | a slow move in to his face |
| 8 | narrator | Golden in colour, in fine clothes; [1] earrings in his ears, and curly hair. [2] Next time you chant or hear it, see this face. | the golden skin and the clothes glow; [1] the earrings and the curls catch the light; [2] hold on the face, then back to frame 1 |

## Script (Telugu page; the same chant lines, the narrator in Telugu)
| # | Telugu (narrator) |
|---|---|
| 2 | హనుమంతుడికి జయం: జ్ఞానానికి, మంచి గుణాలకి ఆయన సముద్రం. [1] వానర శ్రేష్ఠుడు, మూడు లోకాలకీ ఆయనే వెలుగు. / [2] వెలుగుల సముద్రం మీద, ఆయన్ని మనసులో దర్శించుకోండి. |
| 4 | శ్రీరాముని దూత, ఎవరికీ లేనంత బలం. [1] అంజనీ పుత్రుడు, వాయు పుత్రుడు. / [2] గాలి మీద ఎగురుతున్న ఆయన్ని, మనసులో దర్శించుకోండి. |
| 6 | మహావీరుడు, వజ్రదేహం. [1] చెడు ఆలోచనలు తరిమేసి, మంచి ఆలోచనలకి తోడుగా ఉంటాడు. / [2] మనసులో చీకటి మబ్బులు తరిమేస్తున్న ఆయన్ని దర్శించుకోండి. |
| 8 | బంగారు రంగు, అందమైన వస్త్రాలు. [1] చెవులకు కుండలాలు, ఉంగరాల ముంగురులు. / [2] చాలీసా చదివేటప్పుడు, ఈ రూపాన్నే దర్శించుకోండి. |
On-screen text in English on both pages (the channel rule); the chant lines in Devanagari with the Roman line.

## Caption (no ask: a devotional explainer)
EN: "Hanuman Chalisa, Part 1: see his form. Chaupais 1-4, the line, its meaning, and the picture to hold when you chant
it." + the four lines with meanings + "Text: Goswami Tulsidas (16th century, Awadhi). Meanings: Art of Living and Drik
Panchang translations." No comment prompt.
