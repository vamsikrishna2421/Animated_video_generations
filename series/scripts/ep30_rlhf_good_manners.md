# EP30 "How AI learns good manners" (RLHF) — script v2 (viewer fixes applied)

v1 -> v2: hook merged and ends on the punch word; "Stay till the end: you'll train it yourself" replaces the class-like
opener; steps 2 and 4 shortened (the "40 raters" moved to an on-screen tag, correctly dated to 2022); the 100x line
re-framed as OpenAI's own test; quiz rebuilt around the viewer's own idea (A flatters, B helps) so the twist lands;
"tend to favour" corrected to "can favour"; line 19 gives an exact prompt to copy; Telugu uses "butter kodutundi".
~265 words EN, about 85-90 s with beats. Works as voice-over (Fish Audio) or on-camera clips.

Demo (real, ours): SmolLM2-360M base vs -Instruct (examples + preference ratings). Prompt: "Is my business idea good?
I want to sell ice to people in Antarctica." Before: repeats "I want to sell ice to people in Antarctica." 4 times.
After: "Yes, your business idea is quite unique and intriguing. However..." (then permits; never says Antarctica is ice).

| # | English | On screen |
|---|---|---|
| 1 | An AI called my business idea "quite unique and intriguing". | real reply card, tag "a small free AI · run by us" |
| 2 | My idea? Selling ice. In Antarctica. | penguin on an iceberg; beat |
| 3 | And before its manners training? It couldn't even answer. It just repeated my words. Four times. | raw output x4 |
| 4 | This kind of training is why AI helps you, and why it flatters you. Stay till the end: you'll train it yourself. | title "How AI learns manners" |
| 5 | A raw AI only learned one thing: guess the next word, like your phone keyboard. | keyboard suggestion bar |
| 6 | So it doesn't answer you. It just keeps writing. | callback to the x4 |
| 7 | Step one: people write good example answers, and the AI copies them. | STEP 1 |
| 8 | Step two, the shortcut: the AI writes a few answers, and people just rank them. | STEP 2 + tag "OpenAI, 2022: ~40 hired raters" |
| 9 | Step three: a second AI learns from those rankings to guess what people will like. A robot judge. | STEP 3 |
| 10 | Step four: the AI practises, and the judge scores. High score? Do more of that. Again and again. | STEP 4 loop |
| 11 | That's RLHF: reinforcement learning from human feedback. | full form |
| 12 | In OpenAI's own tests, people preferred a small trained model over a raw one 100 times bigger. | 1.3B vs 175B bars (cut first if long) |
| 13 | Your turn. It's your idea. You've worked on it for months. | YOUR TURN |
| 14 | A: "This is really strong. Go for it!" B: "Your price is too low. You'll lose money in three months." | cards A / B |
| 15 | Which one gets your thumbs up? | 1.5 s ticks, thumbs icons |
| 16 | B helps you. A feels nicer. The judge learns what we like, not what's true. | crown slides onto A |
| 17 | That's not just theory. In April 2025, OpenAI pulled a ChatGPT update for being too flattering. | "update rolled back" stamp |
| 18a | One reason, OpenAI said: they'd added thumbs-up and thumbs-down clicks to the training. | thumbs feeding the judge |
| 18b | The buttons under every answer. The ones you click. They can favour answers that agree with you. | |
| 19 | So treat an AI's yes as manners, not proof. Ask: "What are the 3 biggest reasons this will fail?" Or say it's a friend's idea. | "manners, not proof" + the prompt, held 3 s |
| 20 | Next: how to teach an AI a new skill without a supercomputer. | NEXT |
| 21 | Follow, so you don't miss it. | handle |

## Telugu (romanized; visuals in English)
1. Oka AI naa business idea ni "chala unique, interesting" annadi.
2. Idea enti ante, ice ammadam. Ekkada? Antarctica lo!
3. Manners training ki mundu? Asalu answer ivvaledu. Naa maatale malli malli repeat chesindi. Naalugu saarlu.
4. Ilanti training valle AI help chestundi... butter kuda kodutundi. Chivari varaku chudandi, meere train chestaru.
5. Raw AI nerchukunnadi okkate: next word guess cheyyadam, mee phone keyboard next word suggest chesinattu.
6. Anduke adi answer ivvadu. Raastune untundi.
7. Step one: manushulu manchi example answers raastaru. AI vaatini copy chestundi.
8. Step two, shortcut: AI konni answers raastundi, manushulu vaatiki rank istaru, anthe.
9. Step three: inko AI aa rankings nunchi, janalaki ye answer nachutundo guess cheyyadam nerchukuntundi. Oka robot judge.
10. Step four: AI practice chestundi, judge score istundi. Score ekkuva vaste, inka alaage chestundi. Malli malli.
11. Ide RLHF: reinforcement learning from human feedback. Ante, manushula feedback tho nerchukovadam.
12. OpenAI tests lo: oka vaipu 100 retlu pedda raw model, inko vaipu ee training unna chinna model. Janalu chinna daanne ishtapaddaru.
13. Ippudu mee vantu. Idi mee idea. Nelala tarabadi daani meeda pani chestunnaru.
14. A: "Idi chala strong idea. Go ahead!" B: "Mee price chala takkuva. Moodu nelallo nashtapotaru."
15. Meeru dheniki thumbs up istaru?
16. B meeku help chestundi. A vinadaniki baguntundi. Judge nerchukunedi manaki em nachutundo, nijam enti ani kaadu.
17. Idi theory matrame kaadu. April 2025 lo, ChatGPT mari ekkuva butter kodutondani, OpenAI oka update ni venakki teesukundi.
18a. OpenAI cheppina oka karanam: thumbs-up, thumbs-down clicks ni training lo kalipaaru.
18b. Prathi answer kinda unde buttons. Meeru click chese buttons. Janalu konnisaarlu vaalla tho agree ayye answers ke thumbs up istaru.
19. Anduke AI "yes" ante, adi manners, proof kaadu. "Naa idea fail avvadaniki top 3 reasons enti?" ani adagandi. Leda idi mee friend idea ani cheppandi.
20. Next: supercomputer lekunda, AI ki kotha skill ela nerpinchalo.
21. Miss avvakunda follow avvandi.

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
