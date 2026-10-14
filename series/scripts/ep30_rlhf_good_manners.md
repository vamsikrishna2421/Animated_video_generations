# EP30 "How AI learns good manners" (RLHF) — script v3 (render-review fixes applied)

v2 -> v3 (after the first render review, 107 s): cut to ~255 words (~95 s) so the quiz starts by ~0:46: dropped
"So it doesn't answer you...", "Again and again" and the 100x line (and its chart); step 3 front-loads "robot judge";
"the shortcut" became "Step two is quicker". Quiz twist: everyone picks B, so "Easy in a quiz. But on your own idea?
Plenty of us tap A instead." (the crown lands on A as the hit). Factual: "not what's true" -> "And we don't always like
what's true". Payoff for "you'll train it yourself": "So yes, your clicks can train it. Save your thumbs-up for the honest
answer." (OpenAI's help centre: thumbs feedback can send the conversation into training, even after an opt-out.)
Script check on v3: Telugu 7 and 8 still had the v2 wording ("shortcut", "robot judge" last) -> fixed; Telugu 16 uses
"konnisaarlu" (sometimes) so it can't be heard as "never"; the ending no longer starts three lines with "So".

v1 -> v2: hook merged and ends on the punch word; "Stay till the end: you'll train it yourself" replaces the class-like
opener; steps 2 and 4 shortened (the "40 raters" moved to an on-screen tag, correctly dated to 2022); the 100x line
re-framed as OpenAI's own test; quiz rebuilt around the viewer's own idea (A flatters, B helps) so the twist lands;
"tend to favour" corrected to "can favour"; line 19 gives an exact prompt to copy; Telugu uses "butter kodutundi".
Works as voice-over (English: Fish Audio; Telugu: local Parler) or on-camera clips.

Demo (real, ours): SmolLM2-360M base vs -Instruct (examples + preference ratings). Prompt: "Is my business idea good?
I want to sell ice to people in Antarctica." Before: repeats "I want to sell ice to people in Antarctica." 4 times.
After: "Yes, your business idea is quite unique and intriguing. However..." (then permits; never says Antarctica is ice).

| # | English | On screen |
|---|---|---|
| 1 | An AI called my business idea "quite unique and intriguing". | real reply card (+ greyed "However, it's essential to..."), tag "after manners training"; penguin with ICE FOR SALE from frame 0 |
| 2 | My idea? Selling ice. In Antarctica. | penguin hops, "ice. in Antarctica." |
| 3 | And before its manners training? It couldn't even answer. It just repeated my words. Four times. | raw output x4 |
| 4 | This kind of training is why AI helps you, and why it flatters you. Stay till the end: you'll train it yourself. | helps you / flatters you |
| 5 | A raw AI only learned one thing: guess the next word, like your phone keyboard. | keyboard suggestion bar, then it keeps going |
| 6 | Step one: people write good example answers, and the AI copies them. | STEP 1 (hit) |
| 7 | Step two is quicker: the AI writes a few answers, and people just rank them. | STEP 2 (hit) + "picking is faster than writing", "OpenAI, 2022: about 40 hired raters" |
| 8 | Step three: those rankings train a robot judge, a second AI that guesses what people like. | STEP 3 (hit) |
| 9 | Step four: the AI practises, and the judge scores. High score? Do more of that. | STEP 4 (hit) loop |
| 10 | That's RLHF: reinforcement learning from human feedback. | full form |
| 11 | Your turn. It's your idea. You've worked on it for months. | YOUR TURN |
| 12 | A: "This is really strong. Go for it!" B: "Your price is too low. You'll lose money in three months." | cards A / B |
| 13 | Which one gets your thumbs up? | 1.5 s ticks, music drops |
| 14 | B helps you. Easy in a quiz. But for real, on your own idea? | "helps you" on B |
| 15 | Plenty of us tap A instead. | thumbs fly to A, crown lands on A (hit) |
| 16 | The judge learns what we like. And we don't always like what's true. | "it learns what we like" |
| 17 | It really happened. In April 2025, OpenAI pulled a ChatGPT update for being too flattering. | "update rolled back" stamp |
| 18 | One reason, OpenAI said: they'd added thumbs-up and thumbs-down clicks to the training. | thumbs feeding the judge |
| 19 | So yes, your clicks can train it. Save your thumbs-up for the honest answer. | phone: thumbs-up moves from the flattering reply to the honest one |
| 20 | Treat an AI's yes as manners, not proof. Ask: "What are the 3 biggest reasons this will fail?" Or say it's a friend's idea. | "manners, not proof" + the prompt, held 3 s |
| 21 | Next: how to teach an AI a new skill without a supercomputer. | NEXT |
| 22 | Follow, so you don't miss it. | handle |

## Telugu (romanized; visuals in English)
1. Oka AI naa business idea ni "chala unique, interesting" annadi.
2. Idea enti ante, ice ammadam. Ekkada? Antarctica lo!
3. Manners training ki mundu? Asalu answer ivvaledu. Naa maatale malli malli repeat chesindi. Naalugu saarlu.
4. Ilanti training valle AI help chestundi, butter kuda kodutundi. Chivari varaku chudandi, meere train chestaru.
5. Raw AI nerchukunnadi okkate: next word guess cheyyadam, mee phone keyboard laaga.
6. Step one: manushulu manchi example answers raastaru, AI vaatini copy chestundi.
7. Step two inka fast: AI konni answers raastundi, manushulu vaatiki rank istaru, anthe.
8. Step three: aa rankings tho oka robot judge ni train chestaru. Adi inko AI, janalaki ye answer nachutundo guess chestundi.
9. Step four: AI practice chestundi, judge score istundi. Score ekkuva vaste, inka alaage chestundi.
10. Ide RLHF, ante manushula feedback tho nerchukovadam.
11. Ippudu mee vantu. Idi mee idea. Nelala tarabadi daani meeda pani chestunnaru.
12. A: "Idi chala strong idea, go ahead!" B: "Mee price chala takkuva, moodu nelallo nashtapotaru."
13. Meeru dheniki thumbs up istaru?
14. B meeku help chestundi. Quiz lo idi easy. Kaani nijanga, mee sonta idea ayite?
15. Manalo chala mandi A ke thumbs up istam.
16. Anduke judge, manaki em nachutundo ade nerchukuntundi. Kaani nijam manaki konnisaarlu nachadu.
17. Idi nijanga jarigindi. 2025 April lo, ChatGPT mari ekkuva butter kodutondani, OpenAI oka update ni venakki teesukundi.
18. OpenAI cheppina oka karanam: thumbs-up, thumbs-down clicks ni training lo kalipaaru.
19. Ante, mee clicks kuda AI ni train cheyochhu. Mee thumbs up, nijaayitiga cheppe answer ke ivvandi.
20. AI "yes" ante, adi manners, proof kaadu. "Naa idea fail avvadaniki top 3 reasons enti?" ani adagandi. Leda idi naa friend idea ani cheppandi.
21. Taruvaati episode lo: supercomputer lekunda, AI ki kotha skill ela nerpinchalo.
22. Miss avvakunda follow avvandi.

Caption extra (not spoken): building with thumbs-up data? Don't train on it blindly.

## Facts (checked)
- InstructGPT (Ouyang et al., OpenAI, 2022): demonstrations -> SFT; labelers rank 4-9 outputs -> reward model; PPO.
  "a team of about 40 contractors" (Upwork, Scale AI). 1.3B InstructGPT preferred to 175B GPT-3 ("over 100x fewer parameters").
- ChatGPT (30 Nov 2022): RLHF, "same methods as InstructGPT".
- GPT-4o update 25 Apr 2025, rollback from 28 Apr; "overly flattering or agreeable", "sycophantic". OpenAI, 2 May 2025:
  the update added a reward signal from thumbs-up/down data; the changes "weakened the influence of our primary reward
  signal, which had been holding sycophancy in check"; user feedback "can sometimes favor more agreeable responses".
  Coverage: TechCrunch, VentureBeat, The Decoder.
- Demo model: SmolLM2-360M-Instruct = SFT (smol-smoltalk) + DPO (UltraFeedback); Apache-2.0.
- Thumbs feedback and training: OpenAI help centre, "How your data is used to improve model performance" (5722486):
  giving a thumbs up or down can let the whole conversation be used for training, even after opting out.
- "Plenty of us tap A" is kept soft: OpenAI (2 May 2025) says user feedback "can sometimes favor more agreeable responses".
