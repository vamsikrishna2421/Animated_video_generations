# Creative 33 test (written and committed before it ran): how little of a voice does a cloning service need?
# "Kittu" is not a real person: a computer voice (Parler, on our machine) recording a voice note to his mother, sentence
# by sentence. A second computer voice is "someone else". Then a voice-cloning service (Fish Audio, the one this channel
# uses for its narrator) copies Kittu from the first 3 s, 10 s and 30 s of his voice note (whole sentences, with their
# words), and each copy says two sentences Kittu also said (held out of every reference) and the scam line.
# Scored by a speaker-recognition model (SpeechBrain ECAPA, VoxCeleb; cosine similarity of voice embeddings):
#   each copy vs Kittu's held-out sentences; "someone else" vs Kittu (the floor); Kittu vs Kittu (the ceiling).
# Telugu: the same, with the 10 s reference only (a Telugu computer voice as Kittu, another as someone else).
#   step 1 (Parler):  HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative33/clone_demo.py voices
#   step 2 (Fish + scoring): HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative33/clone_demo.py clone
# Writes series/scripts/creative33_demo/{audio/*.wav, clone.json}.
import json
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
OUT = ROOT / "series/scripts/creative33_demo"
A = OUT / "audio"
NOTE = {   # Kittu's voice note, sentence by sentence (the references are cut from these, whole sentences only)
    "en": ["Hi Amma, I reached the hostel.", "The bus was two hours late, so I'm tired.", "The food here is okay, but I miss your pulihora.",
           "Tell Nanna I will call him on Sunday morning.", "My exams start next week, so I'll be busy.",
           "Don't worry about me, I'm eating properly.", "Send me a photo of the new scooter when it comes.",
           "And tell Chinni to stop using my cycle.", "Okay Amma, I'll sleep now. Good night."],
    "te": ["అమ్మా, హాస్టల్ కి చేరుకున్నాను.", "బస్సు రెండు గంటలు లేట్, అందుకే అలసిపోయాను.", "ఇక్కడ తిండి పర్లేదు, కానీ నీ పులిహోర గుర్తొస్తోంది.",
           "నాన్న కి చెప్పు, ఆదివారం పొద్దున్న ఫోన్ చేస్తాను.", "వచ్చే వారం నుంచి పరీక్షలు, బిజీగా ఉంటాను.",
           "నా గురించి కంగారు పడకు, బాగానే తింటున్నాను."],
}
HELD = {"en": ["Amma, did you take your tablets today?", "I will come home for Sankranti."],
        "te": ["అమ్మా, ఈరోజు టాబ్లెట్లు వేసుకున్నావా?", "సంక్రాంతి కి ఇంటికి వస్తాను."]}
SCAM = {"en": "Amma, it's me, Kittu. I had a small accident. Please send fifty thousand rupees to this number, right now. Don't tell Nanna.",
        "te": "అమ్మా, నేను కిట్టుని. చిన్న యాక్సిడెంట్ అయింది. ఈ నంబర్ కి యాభై వేలు పంపు, ఇప్పుడే. నాన్న కి చెప్పకు."}
VOICE = {   # Parler speakers: Kittu and someone else, per language
    ("en", "kittu"): "Tarun speaks English with an Indian accent in a young, warm, casual voice, like a college student sending a voice note to his mother, at a natural pace. The recording is very clear, close-up, with no background noise.",
    ("en", "other"): "Dinesh speaks English with an Indian accent in a calm, mature voice, at a natural pace. The recording is very clear, close-up, with no background noise.",
    ("te", "kittu"): "Kiran speaks in a young, warm, casual voice, like a college student sending a voice note to his mother, at a natural pace. The recording is very clear, close-up, with no background noise.",
    ("te", "other"): "Prakash speaks in a calm, mature voice, at a natural pace. The recording is very clear, close-up, with no background noise.",
}
REFS = {"en": [3, 10, 30], "te": [10]}   # seconds of Kittu's voice note given to the cloning service (whole sentences, at least this long)
HAND = {}   # filled after the run


def mono16(path):
    a, sr = sf.read(path)
    if a.ndim > 1:
        a = a.mean(axis=1)
    if sr != 16000:
        a = resample_poly(a, 16000, sr)
    return a.astype(np.float32)


def voices():
    from parler_tts_local import say
    A.mkdir(parents=True, exist_ok=True)
    rows = []
    for lang in ("en", "te"):
        for i, s in enumerate(NOTE[lang]):
            out = A / f"{lang}_note_{i:02d}.wav"
            say(lang, s, out, voice=VOICE[(lang, "kittu")], pause=0.12)
            rows.append({"lang": lang, "who": "kittu", "kind": "note", "i": i, "text": s, "seconds": round(len(mono16(out)) / 16000, 2)})
            print(rows[-1], flush=True)
        for who in ("kittu", "other"):
            for i, s in enumerate(HELD[lang]):
                out = A / f"{lang}_{who}_held_{i}.wav"
                say(lang, s, out, voice=VOICE[(lang, who)], pause=0.12)
                rows.append({"lang": lang, "who": who, "kind": "held", "i": i, "text": s})
                print(rows[-1], flush=True)
        out = A / f"{lang}_kittu_scam_real.wav"   # (not scored) Kittu himself saying the scam line, for the reel's Clip A
        say(lang, NOTE[lang][0] + " " + NOTE[lang][3], out, voice=VOICE[(lang, "kittu")], pause=0.12)
    (OUT / "voices.json").write_text(json.dumps({"rows": rows}, indent=1, ensure_ascii=False))


def clone():
    from fish_tts import say as fish
    from speechbrain.inference.speaker import EncoderClassifier
    enc = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb", savedir=str(Path("/dev/shm/hf/ecapa")))
    import torch

    def emb(path):
        with torch.no_grad():
            e = enc.encode_batch(torch.tensor(mono16(path))[None])[0, 0].numpy()
        return e / np.linalg.norm(e)

    vrows = json.loads((OUT / "voices.json").read_text())["rows"]
    res = {"refs": [], "scores": []}
    for lang in ("en", "te"):
        notes = [r for r in vrows if r["lang"] == lang and r["kind"] == "note"]
        truth = [emb(A / f"{lang}_kittu_held_{i}.wav") for i in range(2)]
        for secs in REFS[lang]:   # build the reference: whole sentences until at least `secs` seconds
            parts, texts, total = [], [], 0.0
            for r in notes:
                parts.append(mono16(A / f"{lang}_note_{r['i']:02d}.wav"))
                texts.append(r["text"])
                total += r["seconds"]
                if total >= secs:
                    break
            ref = A / f"{lang}_ref_{secs}s.wav"
            sf.write(ref, np.concatenate(parts), 16000)
            res["refs"].append({"lang": lang, "asked": secs, "seconds": round(total, 2), "sentences": len(texts), "text": " ".join(texts)})
            for k, text in enumerate(HELD[lang] + [SCAM[lang]]):
                out = A / f"{lang}_clone{secs}s_{'held_' + str(k) if k < 2 else 'scam'}.wav"
                t0 = time.time()
                fish(text, str(out), ref=str(ref), ref_text=" ".join(texts))
                took = round(time.time() - t0, 1)
                score = float(np.mean([emb(out) @ t for t in truth])) if k < 2 else float(np.mean([emb(out) @ t for t in truth]))
                res["scores"].append({"lang": lang, "who": f"copy from {secs} s", "text": text, "similarity": round(score, 3), "seconds_to_make": took})
                print(res["scores"][-1], flush=True)
        for i in range(2):   # the floor and the ceiling
            o = emb(A / f"{lang}_other_held_{i}.wav")
            res["scores"].append({"lang": lang, "who": "someone else", "text": HELD[lang][i], "similarity": round(float(np.mean([o @ t for t in truth])), 3)})
        res["scores"].append({"lang": lang, "who": "Kittu vs Kittu", "text": "held 0 vs held 1", "similarity": round(float(truth[0] @ truth[1]), 3)})
        res["scores"].append({"lang": lang, "who": "Kittu's real scam-line clip", "text": "note 0 + note 3",
                              "similarity": round(float(np.mean([emb(A / f"{lang}_kittu_scam_real.wav") @ t for t in truth])), 3)})
        (OUT / "clone.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    for r in res["scores"]:
        print(r["lang"], r["who"], r["similarity"], "|", r["text"][:50])


if __name__ == "__main__":
    {"voices": voices, "clone": clone}[sys.argv[1]]()
