# EP56 test, step 1 (written and committed before it ran): the customers' voices. EP54's 10 customers (the same made-up
# shop, the same orders) ask their question out loud, once in English and once in Telugu, spoken by our computer voices
# (Parler, on our machine: no real person's voice). The Telugu questions say the order number the way people say it,
# in words ("నలభై నాలుగు పదిహేడు" for 4417). Also times the "mouth": how long Parler takes to say 3 typical answers.
# Writes series/scripts/ep56_demo/audio/{en,te}_<order>.wav (16 kHz mono) and series/scripts/ep56_demo/questions.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep56/make_questions.py [en|te]
import json
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(ROOT / "pipeline/ep54"))
sys.path.insert(0, str(ROOT / "pipeline/ep52"))
from parler_tts_local import say  # noqa: E402
import agent_demo as e54  # noqa: E402  (QS: order, English question, words a right answer contains)

OUT = ROOT / "series/scripts/ep56_demo"
TE = {
    "4417": "ఆర్డర్ నలభై నాలుగు పదిహేడు, నా ఇయర్‌ఫోన్స్ రిటర్న్ చేశాను. నా రిఫండ్ వచ్చిందా?",
    "4502": "ఆర్డర్ నలభై ఐదు సున్నా రెండు, నా పవర్ బ్యాంక్ షిప్ అయిందా?",
    "4388": "నా స్మార్ట్‌వాచ్ ఎప్పుడు వస్తుంది? ఆర్డర్ నలభై మూడు ఎనభై ఎనిమిది.",
    "4290": "నా ఛార్జర్ డెలివరీ అయిందా? ఆర్డర్ నలభై రెండు తొంభై.",
    "4611": "ఆర్డర్ నలభై ఆరు పదకొండు క్యాన్సిల్ చేశాను. నా డబ్బులు ఎక్కడ?",
    "4475": "ఆర్డర్ నలభై నాలుగు డెబ్భై ఐదు, నా మౌస్ ఎప్పుడు వస్తుంది?",
    "4533": "ఆర్డర్ నలభై ఐదు ముప్పై మూడు ఇంకా ఎందుకు రాలేదు?",
    "4362": "ఆర్డర్ నలభై మూడు అరవై రెండు డెలివరీ అయిందా?",
    "4588": "నా స్పీకర్ రిటర్న్, ఆర్డర్ నలభై ఐదు ఎనభై ఎనిమిది: రిఫండ్ అయిందా?",
    "4650": "నా ఆర్డర్ నలభై ఆరు యాభై కన్ఫర్మ్ అయిందా?",
}
# Fix after a first run (series/scripts/ep56_demo/README.md): Parler read the English questions' digits ("order 4417",
# "Rs 1,299") in Hindi, so the English clips are remade with the numbers in English words, the way people say them.
EN = {
    "4417": "I returned my earphones, order forty-four seventeen. Has my refund of twelve ninety-nine rupees come?",
    "4502": "Order forty-five oh two: has my power bank shipped?",
    "4388": "When will my smartwatch arrive? Order forty-three eighty-eight.",
    "4290": "Did my charger get delivered? Order forty-two ninety.",
    "4611": "I cancelled order forty-six eleven. Where is my money?",
    "4475": "Order forty-four seventy-five, when is my mouse coming?",
    "4533": "Why hasn't order forty-five thirty-three reached me?",
    "4362": "Was order forty-three sixty-two delivered?",
    "4588": "My speaker return, order forty-five eighty-eight: refund done?",
    "4650": "Is my order forty-six fifty confirmed?",
}
VOICE = {   # Parler speakers (one woman, one man per language would mix two variables; one voice per language)
    "en": "Mary speaks English with an Indian accent in a clear, natural voice, like a customer asking a question on the "
          "phone, at a moderate pace. The recording is very clear, close-up, with no background noise.",
    "te": "Lalitha speaks in a clear, natural voice, like a customer asking a question on the phone, at a moderate pace. "
          "The recording is very clear, close-up, with no background noise.",
}
ANSWERS = ["Your refund process will start once the earphones reach our warehouse.",
           "Your smartwatch will arrive by November 18.",
           "Your order 4650 is still pending: the payment has not been confirmed yet."]


def to16k(path):
    a, sr = sf.read(path)
    if a.ndim > 1:
        a = a.mean(axis=1)
    b = resample_poly(a, 16000, sr) if sr != 16000 else a
    sf.write(path, (b / (np.abs(b).max() + 1e-9) * 0.9).astype(np.float32), 16000)
    return round(len(b) / 16000, 2)


def main():
    (OUT / "audio").mkdir(parents=True, exist_ok=True)
    only = sys.argv[1:]   # e.g. "en": remake one language, keep the other's rows
    old = json.loads((OUT / "questions.json").read_text()) if (OUT / "questions.json").exists() else {}
    rows = [r for r in old.get("rows", []) if only and r["lang"] not in only]
    for oid, q_en, must in e54.QS:
        for lang, text in (("en", EN[oid]), ("te", TE[oid])):
            if only and lang not in only:
                continue
            out = OUT / "audio" / f"{lang}_{oid}.wav"
            t0 = time.time()
            say(lang, text, out, voice=VOICE[lang], pause=0.15)
            secs = round(time.time() - t0, 1)
            dur = to16k(out)
            rows.append({"order": oid, "lang": lang, "text": text, "must": must, "file": str(out.relative_to(ROOT)),
                         "seconds_audio": dur, "seconds_to_make": secs})
            print(lang, oid, dur, "s audio,", secs, "s to make", flush=True)
            (OUT / "questions.json").write_text(json.dumps({"rows": rows}, indent=1, ensure_ascii=False))
    if only:   # the mouth was timed on the first run
        (OUT / "questions.json").write_text(json.dumps({"rows": rows, "mouth": old.get("mouth", [])}, indent=1, ensure_ascii=False))
        return
    mouth = []
    for a in ANSWERS:   # the mouth: our TTS saying a typical answer
        out = OUT / "audio" / "_mouth.wav"
        t0 = time.time()
        say("en", a, out, voice=VOICE["en"], pause=0.15)
        mouth.append({"answer": a, "seconds_to_make": round(time.time() - t0, 1), "seconds_audio": to16k(out)})
        print("mouth", mouth[-1], flush=True)
    out.unlink()
    (OUT / "questions.json").write_text(json.dumps({"rows": rows, "mouth": mouth}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
