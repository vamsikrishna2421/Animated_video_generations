# HOW TO 01 "Make an AI voice on your laptop, free and offline" (local text-to-speech), script v2

Thursday HOW TO (run of Oct 22, 2026). Kokoro for English, Indic Parler-TTS for Telugu. Cast: Ravi anna, the shop AI
(phone), Chintu's laptop on the counter (the voices in the reel's demo lines are the real files our run made).

## Our real run (Oct 22, 2026; a 4-core Intel Xeon at 2.1 GHz, no graphics card, Python 3.11, Linux)
Files: `series/scripts/howto01_demo/` (speak.py, telugu.py, the timed versions, results).

Docs checked on the day: github.com/hexgrad/kokoro (README), pypi.org/project/kokoro (0.9.4, Apr 5 2025, Python
>=3.10,<3.13), huggingface.co/ai4bharat/indic-parler-tts (model card).

1. Kokoro (English; Apache 2.0; languages: American and British English, Spanish, French, Hindi, Italian, Japanese,
   Brazilian Portuguese, Mandarin; no Telugu). In a fresh virtual environment:
   ```
   $ pip install kokoro soundfile          # the README: kokoro>=0.9.4
   Successfully installed ... kokoro-0.9.4 ... misaki-0.9.4 ... spacy-3.8.16 ...      (14.7 s; 320 MB of packages)
   $ sudo apt-get install espeak-ng          # Linux; Windows: the espeak-ng .msi installer (README); Mac: not covered
   eSpeak NG text-to-speech: 1.51            (13 s)
   ```
2. speak.py (the README's example without the notebook player):
   ```python
   from kokoro import KPipeline
   import soundfile as sf

   pipeline = KPipeline(lang_code='a')   # 'a' = American English
   text = "Hello! This voice was made on a laptop, with no internet."
   for i, (gs, ps, audio) in enumerate(pipeline(text, voice='af_heart')):
       print(i, gs, ps)
       sf.write(f'{i}.wav', audio, 24000)
   ```
3. First run (downloads the model, 313 MB from hexgrad/Kokoro-82M, and spaCy's en_core_web_sm, 12.8 MB): 23.5 s in all.
   ```
   $ python speak.py
   0 Hello! This voice was made on a laptop, with no internet. həlˈO! ðˌɪs vˈYs wʌz mˌAd ˌɔn ɐ lˈæptˌɑp, wɪð nˈO ˈɪntəɹnˌɛt.
   ```
   0.wav: 3.98 s. Then offline (`HF_HUB_OFFLINE=1`, nothing downloaded), twice: import 2.4 s, load 2.1-2.3 s,
   **generate 1.4-1.5 s for 4.0 s of speech**, peak memory 1.2 GB. Whisper hears: "Hello, this voice was made on a
   laptop with no internet."
4. Indic Parler-TTS (Telugu; Apache 2.0; 0.9B parameters; 21 languages; Telugu speakers Prakash, Lalitha, Kiran, with
   Prakash and Lalitha recommended). The model page is gated: a free Hugging Face login and "agree to share your
   information". Install: `pip install git+https://github.com/huggingface/parler-tts.git` (parler-tts 0.2.2, already
   installed here for this page's Telugu voices). telugu.py is the model card's example with our sentence:
   ```python
   prompt = "నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది."
   description = "Lalitha speaks in a clear, friendly voice at a moderate pace. The recording is very clear, with no background noise."
   ```
   We loaded the same weights from a public mirror (RXD03/indic-parler-tts; model.safetensors 3,751,321,772 bytes,
   the same size as ai4bharat's file): this machine holds no account tokens. Offline, twice: load 18.5-21 s,
   **generate 28 s for 5.1 s of Telugu**, peak memory 4.6 GB. Whisper (Hindi mode) hears "नमस्कारम, इगोंतु अंटरनेट
   लेकुन्द वोका लाप्दोप लो तायार हैंदी" (namaskaram, ee gontu internet lekunda oka laptop lo tayaraindi).
4b. Take 2 (after the script review: the demo lines must be true and the code must survive an Instagram caption):
   speak.py with the loop on one line (Instagram strips leading spaces) and "made on a computer" (our test machine is a
   server CPU, not a laptop):
   ```python
   from kokoro import KPipeline
   import soundfile as sf
   pipeline = KPipeline(lang_code='a')
   text = "Hello! This voice was made on a computer, with no internet."
   for i, (gs, ps, audio) in enumerate(pipeline(text, voice='af_heart')): print(i, gs, ps); sf.write(f'{i}.wav', audio, 24000)
   ```
   `HF_HUB_OFFLINE=1 python speak.py`: 6.6 s from a cold start; timed twice: load 1.6-1.7 s, **generate 1.1-1.2 s for
   4.05 s of speech**, 1.2 GB. Output: `0 Hello! This voice was made on a computer, with no internet. həlˈO! ðˌɪs vˈYs
   wʌz mˌAd ˌɔn ɐ kəmpjˈuTəɹ, wɪð nˈO ˈɪntəɹnˌɛt.` Whisper: "Hello, this voice was made on a computer with no internet."
   The Telugu line is Ravi's own offer (telugu_offer.py, loaded once, three seeds): "రవి కిరాణా లో దీపావళి ఆఫర్! ప్రతి
   కొనుగోలు మీద పది శాతం తగ్గింపు." Load 21.8 s; **generate 28.7-30.7 s for 5.5-5.7 s**; 4.7 GB. Seed 1 kept; Whisper
   (Hindi mode): "रवी किराना लो दीपावली आफर प्रत्ति कुनुगोलु मेदा पादिसातन तग्व्म्पु".
   The caption's telugu.py (no indented lines) ran as published, with only the repo id swapped for the mirror:
   telugu.wav, 5.49 s.
   Login for the gated Telugu model (huggingface.co/docs/huggingface_hub quick start, v2.2.0): `hf auth login` (a
   browser code, or paste a token from your settings; never show it). espeak-ng on a Mac is in neither guide; Homebrew
   has it (`brew install espeak-ng`, 1.52.0); we haven't tried a Mac.
5. On a fresh computer pip also fetches PyTorch first (its size depends on the system; the default Linux build is over
   1 GB). Disk: about 2 GB for Kokoro, about 6 GB for Indic Parler. Memory: 8 GB is comfortable.

## Script (English), v2 after the script review
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | laptop (Kokoro, our file) | Hello! This voice was made on a computer, with no internet. | frame 1: Chintu's laptop on the counter, a waveform, Wi-Fi OFF; block "THIS AI VOICE: NO INTERNET. FREE."; a hit |
| 2 | Ravi | Who's talking? The Wi-Fi is off! | |
| 3 | AI | Kokoro: a free voice model, running on Chintu's laptop. | "KOKORO · free · Apache 2.0" |
| 4 | Ravi | Free? I pay an app every month for my announcements! | |
| 5 | AI | Step one: two install commands. | "STEP 1": `pip install kokoro soundfile`, `sudo apt-get install espeak-ng`; Windows .msi, Mac (Homebrew); "+ PyTorch on a fresh computer"; Python 3.10-3.12 |
| 6 | Ravi | Type them?! I type with one finger! | |
| 7 | AI | Then copy them from the caption. Five lines. [1] Your words go here. | "STEP 2": speak.py, the text line lit |
| 8 | AI | Run it. The first time, it downloads the voice: 313 MB. | "STEP 3": `python speak.py`, the download, the real output line, 0.wav |
| 9 | Ravi | And after that, no internet? | |
| 10 | AI | None. Once it's loaded: [1] about one second for a four-second line. | card: "1.2 s per 4-second line · Wi-Fi off · 1.2 GB memory · our test: 4-core CPU, no graphics card" |
| 11 | Ravi | But my customers speak Telugu! | |
| 12 | AI | For Telugu: Indic Parler TTS. Free login, accept the terms, [1] then describe the voice in words. | model card: "Apache 2.0 · 21 languages, Telugu too · 3.75 GB · gated: hf auth login"; the description line lit |
| 13 | Ravi | Parler? Like beauty parlour? | |
| 14 | AI | French, for "to speak". Listen. | "parler = to speak (French)" |
| 15 | laptop (Indic Parler, our file) | రవి కిరాణా లో దీపావళి ఆఫర్! ప్రతి కొనుగోలు మీద పది శాతం తగ్గింపు. | caption: "Diwali offer at Ravi Kirana! 10% off every purchase." |
| 16 | Ravi | That's my Diwali offer! How long did it take? | |
| 17 | AI | About thirty seconds a line, [1] and almost five GB of memory. | English 1.2 s vs Telugu 30 s; "4.7 GB" |
| 18 | Ravi | Slow, but free! That app is cancelled! | |
| 19 | AI | English: Kokoro. Telugu: Indic Parler. Any computer with eight GB of memory. | verdict card |
| 20 | Ravi | Chintu! Save this! | "SAVE THIS": both models' commands, the login; "every command in the caption" |

Script review (two viewers, one who never typed a command, one who codes): "made on this laptop" wasn't true (our run
was on a server CPU; both demo lines re-made, "on a computer", the Telugu one is Ravi's offer); nobody said the model's
name or what computer; the Telugu voice came at 0:45 with no steps behind it (the Telugu page now opens on it, the login
step is said, the save card carries it); "copy this" from a video (now "from the caption", and the loop is on one line so
Instagram's caption can't break it); numbers clashed ("five GB" vs 4.6: now "almost five", 4.7 measured on the offer
line; "once it's loaded"; "21 languages"); the AI spoke to Ravi in the informal register in Telugu (now "-ండి"); no
verdict (now said); "And then?" cut; frame 1 didn't say it's a voice (now "THIS AI VOICE") and had no hit.

Render review (English, two viewers): both stopped at frame 1 and liked the Telugu offer best ("that one I'd forward");
both: the music never builds, and the save list was small and gone in a moment. Fixed: the YouTube text carries the code
(it pointed at "the Instagram caption"); the save card points to the pinned comment for telugu.py; "needs Git" for the
Telugu install (Windows); "install Python 3.12, tick Add to PATH" (today's python.org download is newer than Kokoro's
3.10-3.12); "any computer" (one Linux box tested) is now "8 GB of RAM, no graphics card", in both voices; "memory" reads
RAM on the cards; the code wraps at spaces with line numbers ("compu/ter" read as a typo, "five lines" counted as
eight); "32 / 313 MB"; the last scene no longer dips at the cut and lifts into "Telugu"; the music drops right out
under the Telugu voice (0.25 didn't read as a drop); a half-second beat before "About thirty seconds"; the save card
holds 2.6 s; "English + Telugu" on frame 1.

## Script (Telugu; English on-screen text), v3 as rendered (opens on the Telugu voice; the English demo plays at step 3)
1. ల్యాప్‌టాప్ (Indic Parler): రవి కిరాణా లో దీపావళి ఆఫర్! ప్రతి కొనుగోలు మీద పది శాతం తగ్గింపు.
2. రవి: నా ఆఫర్ ఎవరు చెప్తున్నారు?! వైఫై కూడా ఆఫ్!
3. ఏఐ: చింటూ ల్యాప్‌టాప్ అండి. తెలుగుకి ఇండిక్ పార్లర్, ఇంగ్లీష్ కి కోకోరో. రెండూ ఫ్రీ.
4. రవి: ఫ్రీనా?! నేను ప్రతి నెలా ఒక యాప్ కి కడుతున్నా!
5. ఏఐ: ముందు ఇంగ్లీష్ ది. పైథాన్ ఉంటే, రెండు ఇన్‌స్టాల్ కమాండ్లు.
6. రవి: టైప్ చెయ్యాలా?! నేను ఒక్క వేలితో టైప్ చేస్తా!
7. ఏఐ: క్యాప్షన్ లో నుంచి కాపీ చేయండి. ఐదు లైన్లు. [1] చెప్పాల్సింది ఇక్కడ రాయండి.
8. ఏఐ: రన్ చేయండి. మొదటిసారి వాయిస్ డౌన్‌లోడ్ అవుతుంది: మూడు వందల పదమూడు ఎంబీ.
9. ల్యాప్‌టాప్ (Kokoro): Hello! This voice was made on a computer, with no internet.
10. రవి: ఆ తర్వాత ఇంటర్నెట్ అక్కర్లేదా?
11. ఏఐ: అక్కర్లేదండి. లోడ్ అయ్యాక, [1] నాలుగు సెకన్ల లైన్ కి దాదాపు ఒక్క సెకను.
12. రవి: మరి నా తెలుగు ఆఫర్?
13. ఏఐ: తెలుగుకి ఇండిక్ పార్లర్. ఫ్రీ లాగిన్, షరతులు ఒప్పుకోండి, [1] గొంతు ఎలా ఉండాలో మాటల్లో రాయండి.
14. రవి: పార్లర్? బ్యూటీ పార్లరా?
15. ఏఐ: కాదండి. ఫ్రెంచ్ లో పార్లర్ అంటే మాట్లాడటం.
16. రవి: సరే, ఎంత టైం పడుతుంది?
17. ఏఐ: ముప్పై సెకన్లు, ఒక్కో లైన్ కి. [1] దాదాపు ఐదు జీబీ ర్యామ్.
18. రవి: నెమ్మది... కానీ ఫ్రీ! ఆ యాప్ కట్!
19. ఏఐ: తెలుగుకి ఇండిక్ పార్లర్, ఇంగ్లీష్ కి కోకోరో. ఎనిమిది జీబీ ర్యామ్, గ్రాఫిక్స్ కార్డ్ అక్కర్లేదు.
20. రవి: చింటూ! ఇది సేవ్ చెయ్!

Render review (Telugu, two viewers): both stopped on the Telugu offer at 0:00 (the part they'd forward); both: the
English middle sags and the sound never rises into "save". Fixed: "సులువు" (easy) is out, "పైథాన్ ఉంటే" in (not easy
on Windows, and the sticky says Python first); "మెమరీ" is "ర్యామ్" (heard as storage), with the number first, right
after the drop; the hook's demo voice is 3 dB up on a soft bed (the first 3 s were the quietest of the reel, with no
music); the hit before "మరి నా తెలుగు ఆఫర్?" lands 0.7 s before the voice and the bonk moved onto the cut (speech
recognition heard "తెలుగు" as "dilgo" in the mix; the isolated takes were clean); the bed rises through the last scene
and swells 7 dB into the save card; "TELUGU IN 26s →" counts down over the English steps; the laptop shows telugu.py outside
them; "TELUGU + ENGLISH" on frame 1. Captions: Kokoro is English-only, a Notepad "All files" line, "after a 22 s load"
(telugu.py loads the model on every run), close other apps on 8 GB; the Telugu YouTube text gained the run line and the
Mac note.
Second render review (Telugu): the hook, line 5, the tag and the laptop landed; "Telugu" still came out "dilgo"
(lines 12 and 19: the isolated takes said "తిల్గో"/"తిలుగు"; line 12 re-voiced until the judge heard "తెలు"; line 19
said "తిలుగుకి" mid-sentence in four more takes, so the verdict now opens on Telugu, as lines 3 and 13 do, and the card
lists Telugu first; line 12 plays at its own speed, as at 1.2x "తెలుగు" smeared again); the
caption's "English maatrame" was false (Kokoro also speaks Hindi, Spanish, French, Japanese...): now "Telugu ledu";
one big "FIRST: Python 3.12" sticky (the voice relies on it); the tag counts down to the Telugu part; the English
demo's quote is no longer on screen twice.

## Sound
A hit and a pop with the laptop's voice on frame 1 (the hook is the voice itself); keyboard clicks under the terminal
screens; a lift into each step card; a pop on each stat card; the bed drops out under the Telugu demo voice (the
payoff) and comes back on Ravi's "Telugu!"; a rise into "Save this!" and a snap on the checklist.
