# HOW TO 01 "Make an AI voice on your laptop, free and offline" (local text-to-speech), script v1

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
5. On a fresh computer pip also fetches PyTorch first (its size depends on the system; the default Linux build is over
   1 GB). Disk: about 2 GB for Kokoro, about 6 GB for Indic Parler. Memory: 8 GB is comfortable.

## Script (English), v1
| # | Who | Line | On screen |
|---|---|---|---|
| 1 | laptop (Kokoro, our file) | Hello! This voice was made on a laptop, with no internet. | frame 1: Chintu's laptop on the counter, a waveform, Wi-Fi OFF; block "MADE ON THIS LAPTOP · NO INTERNET · FREE" |
| 2 | Ravi | Who's inside Chintu's laptop?! The Wi-Fi is off! | Ravi leaning over the laptop |
| 3 | AI | Nobody. A free voice model, running on the laptop itself. | "HOW TO 01" tag |
| 4 | Ravi | Free? I pay an app every month for my offer announcements! | |
| 5 | AI | Step one: install it. | terminal: `pip install kokoro soundfile` → "Successfully installed kokoro-0.9.4 ..." (15 s); `sudo apt install espeak-ng` (Windows: the .msi installer); "Python 3.10-3.12" |
| 6 | Ravi | Type it?! I type with one finger! | |
| 7 | AI | Then copy this. Seven lines. Your sentence goes here. | speak.py, the text line lit |
| 8 | Ravi | And then? | |
| 9 | AI | Run it. The first time, it downloads the voice: 313 MB. | terminal: `python speak.py` → the real output line (letters → sounds) → 0.wav |
| 10 | Ravi | And after that, no internet? | |
| 11 | AI | Wi-Fi off: one point four seconds for a four-second sentence. | card: "Wi-Fi OFF · 1.4 s to make 4 s of speech · 1.2 GB memory · no graphics card" |
| 12 | Ravi | But my customers speak Telugu! | |
| 13 | AI | This one doesn't. For Telugu: Indic Parler TTS. You describe the voice in words. | model card: "ai4bharat/indic-parler-tts · Apache 2.0 · 21 Indian languages · 3.75 GB · free login"; the description line lit |
| 14 | laptop (Indic Parler, our file) | నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది. | caption: "Namaskaram! This voice was made on a laptop, with no internet." |
| 15 | Ravi | Telugu! How long did that take? | |
| 16 | AI | Twenty-eight seconds a sentence, and five GB of memory. Still free, still offline. | card: "28 s for 5 s of Telugu · 4.6 GB memory · 3.75 GB download" |
| 17 | Ravi | Chintu! Save this! | "SAVE THIS" checklist: the commands; "every command in the caption" |

## Script (Telugu; English on-screen text), v1
1. ల్యాప్‌టాప్ (Kokoro): Hello! This voice was made on a laptop, with no internet.
2. రవి: చింటూ ల్యాప్‌టాప్ లో ఎవరున్నారు?! వైఫై కూడా ఆఫ్!
3. ఏఐ: ఎవరూ లేరు. ఫ్రీ వాయిస్ మోడల్, ల్యాప్‌టాప్ లోనే నడుస్తుంది.
4. రవి: ఫ్రీ నా? నా ఆఫర్ అనౌన్స్‌మెంట్ల కోసం ప్రతి నెలా ఒక యాప్ కి కడుతున్నా!
5. ఏఐ: మొదటి స్టెప్: ఇన్‌స్టాల్ చెయ్.
6. రవి: టైప్ చెయ్యాలా?! నేను ఒక్క వేలితో టైప్ చేస్తా!
7. ఏఐ: అయితే ఇది కాపీ చెయ్. ఏడు లైన్లు. నీ మాట ఇక్కడ పెట్టు.
8. రవి: తర్వాత?
9. ఏఐ: రన్ చెయ్. మొదటిసారి వాయిస్ డౌన్‌లోడ్ అవుతుంది: మూడు వందల పదమూడు ఎంబీ.
10. రవి: ఆ తర్వాత ఇంటర్నెట్ అక్కర్లేదా?
11. ఏఐ: వైఫై ఆఫ్. నాలుగు సెకన్ల మాటకి, ఒకటిన్నర సెకన్ల లోపే.
12. రవి: కానీ నా కస్టమర్లు తెలుగు మాట్లాడతారు!
13. ఏఐ: ఇది తెలుగు మాట్లాడదు. తెలుగుకి ఇండిక్ పార్లర్ టీటీఎస్. గొంతు ఎలా ఉండాలో మాటల్లో చెప్తావు.
14. ల్యాప్‌టాప్ (Indic Parler): నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది.
15. రవి: తెలుగు! ఎంత టైం పట్టింది?
16. ఏఐ: ఒక్కో వాక్యానికి ఇరవై ఎనిమిది సెకన్లు, ఐదు జీబీ మెమరీ. అయినా ఫ్రీ, ఆఫ్‌లైన్.
17. రవి: చింటూ! ఇది సేవ్ చెయ్!

## Sound
A soft chime and the laptop's voice on frame 1 (the hook is the voice itself); keyboard clicks under the terminal
screens; a lift into each step card; a pop on each stat card; the bed drops out under the Telugu demo voice (the
payoff) and comes back on Ravi's "Telugu!"; a rise into "Save this!" and a snap on the checklist.
