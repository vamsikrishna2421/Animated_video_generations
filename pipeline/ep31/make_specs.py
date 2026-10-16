# Writes reels/ep31v1.json (English: Fish voice) and reels/ep31te.json (Telugu: local Parler voice, English captions).
# Script: series/scripts/ep31_lora_new_skill.md. Demo numbers come from our run (series/scripts/ep31_demo/results.json,
# samples.json; pipeline/ep31/lora_demo.py).   python3 pipeline/ep31/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/ep31_demo"
RES = json.loads((DEMO / "results.json").read_text())

AFTER = RES.get("after_16bit", RES["after"])   # scores with the skill file saved in 16-bit (what we show and ship)
N = {"before": RES["before"]["all"], "after": AFTER["all"], "test": RES["test_examples"], "train": RES["train_examples"],
     "minutes": round(RES["train_seconds"] / 60), "pct": f"{RES['trainable_pct']:.1f}",
     "adapterMB": f"{RES.get('adapter16_mb', RES['adapter_mb']):.0f}", "modelMB": f"{RES['model_mb']:.0f}", "params": "360 million",
     "fewShot": RES["few_shot_untrained"]["all"]}
_miss_phone, _miss_items = RES["test_examples"] - AFTER["phone"], RES["test_examples"] - AFTER["items"]
N["miss"] = (f"{N['test'] - N['after']} wrong: " + ", ".join(x for x in [
    f"{_miss_phone} phone number" + ("s" if _miss_phone > 1 else "") if _miss_phone else "",
    f"{_miss_items} item list" + ("s" if _miss_items > 1 else "") if _miss_items else "",
    f"{N['test'] - AFTER['name']} name" if N["test"] - AFTER["name"] else "",
    f"{N['test'] - AFTER['address']} address" if N["test"] - AFTER["address"] else ""] if x))


def hook_data():   # the order in the hook: its own run (pipeline/ep31/hook_example.py), a phone number no phone can have
    ex = json.loads((DEMO / "hook_example.json").read_text())
    assert ex["score_before"]["all"] == 0 and ex["score_after"]["all"] == 1
    raw = " ".join(ex["before"].split())
    words, lines, cur = raw.split(" "), [], ""
    for w in words:   # the base model's real reply, cut into bubble lines
        if len(cur) + len(w) + 1 > 40:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    g = json.loads(ex["after"])
    slip = {"name": g["name"], "phone": g["phone"], "items": [f"{i['item']} · {i['qty']}" for i in g["items"]], "address": g["address"]}
    L = RES["losses"]
    return {"order": ex["msg"], "beforeLines": lines, "slip": slip, "n": N, "losses": [[i + 1, L[i]] for i in range(4, len(L), 5)]}


BASE = {"label": "EP 31", "banner": "Teach an AI a new skill", "topic": "", "look": "classic", "gap": 0.3, "lead": 0.3,
        "music": "lofi", "musicVol": [0.42, 1.3], "musicEQ": [[260, -4, 0.9]], "musicLift": 2.3, "musicPad": True, "hardCuts": True,
        "beatSnap": True, "hideTimerInHook": True, "hideTimer": True}

# Filled from the run: {TEST} {BEFORE} {AFTER} {MIN} {MB} {MODEL_MB} (English) and the Telugu number words below.
TE_NUM = {0: "సున్నా", 1: "ఒకటి", 2: "రెండు", 3: "మూడు", 4: "నాలుగు", 5: "ఐదు", 6: "ఆరు", 7: "ఏడు", 8: "ఎనిమిది", 9: "తొమ్మిది",
          10: "పది", 11: "పదకొండు", 12: "పన్నెండు", 13: "పదమూడు", 14: "పద్నాలుగు", 15: "పదిహేను", 16: "పదహారు", 17: "పదిహేడు",
          18: "పద్దెనిమిది", 19: "పందొమ్మిది", 20: "ఇరవై", 30: "ముప్పై"}
EN_NUM = {0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
          11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen",
          19: "nineteen", 20: "twenty", 30: "thirty"}


def te_num(n):
    if n in TE_NUM:
        return TE_NUM[n]
    t, u = divmod(n, 10)
    return f"{TE_NUM[t * 10]} {TE_NUM[u]}"


def en_num(n):
    if n in EN_NUM:
        return EN_NUM[n]
    t, u = divmod(n, 10)
    return f"{EN_NUM[t * 10]}-{EN_NUM[u]}"


def fill(s, te=False):
    if s is None:
        return None
    m = {"TEST": str(N["test"]), "BEFORE": str(N["before"]), "AFTER": str(N["after"]), "MIN": str(N["minutes"]),
         "MB": N["adapterMB"], "MODEL_MB": N["modelMB"], "TRAIN": str(N["train"]), "FEW": str(N["fewShot"]), "MISS": N["miss"]}
    if te:
        m.update({"TEST": te_num(N["test"]), "AFTER": te_num(N["after"]), "MIN": te_num(N["minutes"]), "MB": te_num(int(N["adapterMB"])),
                  "FEW": te_num(N["fewShot"])})
    for k in sorted(m, key=len, reverse=True):
        s = s.replace("{" + k + "}", m[k])
    return s


def fill_spoken(s):   # numbers as words for the English TTS text
    m = {"TEST": en_num(N["test"]), "BEFORE": en_num(N["before"]), "AFTER": en_num(N["after"]), "MIN": en_num(N["minutes"]),
         "MB": en_num(int(N["adapterMB"])), "MODEL_MB": N["modelMB"], "FEW": en_num(N["fewShot"])}
    for k in sorted(m, key=len, reverse=True):
        s = s.replace("{" + k + "}", m[k])
    return re.sub(r"([.?!] )([a-z])", lambda g: g.group(1) + g.group(2).upper(), s)


# (id, type, scene flags, yt, show (English captions, [n] cues), tts (English, spoken form), te (Telugu, [n] cues), extra)
SC = [
    ("hook", "lo_hook", {"tail": 0.3, "drop_cue": 4, "boost": 1.2},
     {"chapter": "0, then 16, then 27", "title": "A tiny free AI that copied orders back", "notes": [["A tiny free AI (SmolLM2-360M by Hugging Face): turn a WhatsApp order into a slip with name, phone, items, address", 0], ["Plain prompt: it copied the order back, {BEFORE} out of {TEST} (real run, ours)", 1], ["A better prompt with two worked examples: {FEW} out of {TEST}", 2], ["LoRA training on {TRAIN} made-up orders: {MIN} minutes on 4 CPU cores (a cloud machine), no graphics card (GPU)", 3], ["{AFTER} out of {TEST} perfect on new orders it never saw ({MISS}); orders are made up, real chats are messier", 4]]},
     "We asked a tiny free AI to turn WhatsApp orders into neat slips. It just copied them back. [1] Zero out of {TEST}. [2] A better prompt, with two examples? {FEW}. [3] Then we trained it on {TRAIN} made-up orders. {MIN} minutes, no graphics card. [4] {AFTER} out of {TEST}, on new orders it never saw.",
     "We asked a tiny free AI to turn WhatsApp orders into neat slips. It just copied them back. Zero out of {TEST}. A better prompt, with two examples? {FEW}. Then we trained it on two hundred and forty made-up orders. {MIN} minutes, no graphics card. {AFTER} out of {TEST}, on new orders it never saw.",
     "ఒక చిన్న ఫ్రీ ఎ ఐ కి, వాట్సాప్ ఆర్డర్స్ ని నీట్ స్లిప్స్ గా మార్చమని చెప్పాం. అది ఆర్డర్ నే మళ్ళీ కాపీ చేసి ఇచ్చింది. [1] థర్టీ కి జీరో. [2] రెండు ఎగ్జాంపుల్స్ తో మంచి ప్రాంప్ట్ ఇస్తే? సిక్స్టీన్ వచ్చాయి. [3] తర్వాత, టూ ఫార్టీ డమ్మీ ఆర్డర్స్ తో ట్రైన్ చేశాం. {MIN} నిమిషాలు, గ్రాఫిక్స్ కార్డ్ లేకుండా. అది ఎప్పుడూ చూడని కొత్త ఆర్డర్స్ మీద? [4] థర్టీ లో ట్వెంటీ సెవెన్ పర్ఫెక్ట్ గా వచ్చాయి.",
     {"pauses": {"4": 0.35}}),
    ("why", "lo_why", {"tail": 0.3, "lift": True},
     {"chapter": "Why not just ask ChatGPT?", "title": "Free, on your computer, data stays with you", "notes": [["Why not a big chatbot? A tiny model is free, runs on your own computer (no per-message bill), and customer details never leave it", 0]]},
     "Why not just ask ChatGPT? This one's free, runs on your own computer, and customer details never leave it.",
     "Why not just ask Chat G P T? This one's free, runs on your own computer, and customer details never leave it.",
     "చాట్ జి పి టి నే ఎందుకు అడగకూడదు? ఇది ఫ్రీ, మీ సొంత కంప్యూటర్ లోనే నడుస్తుంది, మీ కస్టమర్ల డీటెయిల్స్ బయటికి వెళ్ళవు.",
     {}),
    ("hard", "lo_hard", {"tail": 0.3, "lift": True},
     {"chapter": "Why training is heavy", "title": "Normal training changes every number", "notes": [["Normal training (full fine-tuning) changes every number inside the model: all 360 million of ours", 0], ["Every new skill means retraining all of them and saving a whole new copy (724 MB here; hundreds of GB for big models)", 1]]},
     "Normal training changes every one of its 360 million numbers. [1] And every new skill needs a whole new copy.",
     "Normal training changes every one of its three hundred and sixty million numbers. And every new skill needs a whole new copy.",
     "మామూలుగా, ఎ ఐ కి ఏదైనా నేర్పిస్తే, దాని లోపల ప్రతి ఒక్క నంబర్ మారుతుంది. ఈ మోడల్ లో త్రీ హండ్రెడ్ సిక్స్టీ మిలియన్ ఉన్నాయి. [1] ప్రతి కొత్త స్కిల్ కి, మోడల్ మొత్తం కొత్త కాపీ కావాలి.",
     {}),
    ("trick", "lo_trick", {"tail": 0.3, "lift": True, "boost": 1.2, "drop_cue": 2},
     {"chapter": "The LoRA trick", "title": "Freeze the original, train sticky notes", "notes": [["The trick is called LoRA (Low-Rank Adaptation, Microsoft, 2021): freeze the original numbers", 0], ["Add a few new numbers on top (like sticky notes in a textbook) and train only those: {PCT}% of the numbers in ours", 1], ["Each skill is its own file: {MB} MB (16-bit), next to the {MODEL_MB} MB model", 2], ["Apple says its on-device model plugs in a small LoRA adapter per feature (Apple ML Research, 2024)", 3]]},
     "The trick is called LoRA: freeze the original. [1] Add a few new numbers on top, like sticky notes in a textbook, and train only the notes. [2] Each skill is its own {MB} MB file, a short WhatsApp video. The model? {MODEL_MB} MB, a movie. [3] Apple says its iPhone AI does this: one model, a small skill file per feature.",
     "The trick is called Lora: freeze the original. Add a few new numbers on top, like sticky notes in a textbook, and train only the notes. Each skill is its own {MB} megabyte file, a short WhatsApp video. The model? {MODEL_MB} megabytes, a movie. Apple says its iPhone AI does this: one model, a small skill file per feature.",
     "ఈ ట్రిక్ పేరు లారా: ఒరిజినల్ ని ఫ్రీజ్ చేస్తాం. [1] దాని మీద కొన్ని కొత్త నంబర్స్ అతికిస్తాం, టెక్స్ట్ బుక్ మీద స్టిక్కీ నోట్స్ లాగా. ఆ నోట్స్ నే ట్రైన్ చేస్తాం. [2] ప్రతి స్కిల్ ఒక సెపరేట్ నైన్ ఎం బి ఫైల్, ఒక చిన్న వాట్సాప్ వీడియో అంత. మోడల్ ఏమో సెవెన్ ట్వెంటీ ఫోర్ ఎం బి, ఒక సినిమా అంత. [3] యాపిల్ చెప్పింది, వాళ్ళ ఐఫోన్ ఎ ఐ కూడా ఇలాగే: ఒకే మోడల్, ప్రతి ఫీచర్ కి ఒక చిన్న స్కిల్ ఫైల్.",
     {}),
    ("quiz", "lo_quiz", {"tail": 0.3, "duck": [3, 2, 0.15], "boost": 1.3, "layer": 2},
     {"chapter": "Your turn", "title": "Prices change weekly: LoRA or hand it the list?", "notes": [["Your shop's prices change every week", 0], ["A: train LoRA notes on this week's prices. B: give it the price list with every question", 1], ["B: LoRA notes would need retraining every week and can still misremember a price. LoRA is for skills and style, not facts that keep changing (those go in with the question: RAG, next episode)", 2]]},
     "Your turn. Your shop's prices change every week. [1] A: train LoRA notes on this week's prices. B: give it the price list with every question. Which one? [3] <pause 2.0> [2] The answer is B: give it the list. LoRA notes would need retraining every week, and can still misremember a price.",
     None,
     "ఇప్పుడు మీ వంతు. మీ షాప్ లో ధరలు ప్రతి వారం మారుతాయి. [1] ఎ: ఈ వారం ధరల మీద లారా నోట్స్ ట్రైన్ చేయడం. బి: ప్రతి ప్రశ్నతో పాటు ప్రైస్ లిస్ట్ ఇవ్వడం. ఏది కరెక్ట్? [3] <pause 2.0> [2] ఆన్సర్ బి: లిస్ట్ ఇవ్వండి. లారా నోట్స్ అయితే ప్రతి వారం మళ్ళీ ట్రైన్ చేయాలి, అయినా ఒక ధర తప్పుగా గుర్తుపెట్టుకోవచ్చు.",
     {"tts": "Your turn. Your shop's prices change every week. A: train Lora notes on this week's prices. B: give it the price list with every question. Which one?",
      "file2": "05_quiz_answer.wav", "tts2": "The answer is B: give it the list. Lora notes would need retraining every week, and can still misremember a price.",
      "te_tts": "ఇప్పుడు మీ వంతు. మీ షాప్ లో ధరలు ప్రతి వారం మారుతాయి. ఎ: ఈ వారం ధరల మీద లారా నోట్స్ ట్రైన్ చేయడం. బి: ప్రతి ప్రశ్నతో పాటు ప్రైస్ లిస్ట్ ఇవ్వడం. ఏది కరెక్ట్?",
      "te_tts2": "ఆన్సర్ బి: లిస్ట్ ఇవ్వండి. లారా నోట్స్ అయితే ప్రతి వారం మళ్ళీ ట్రైన్ చేయాలి, అయినా ఒక ధర తప్పుగా గుర్తుపెట్టుకోవచ్చు.",
      "pause": 2.0, "gap": 0.1}),
    ("close", "lo_close", {"tail": 1.2, "outro": True, "lift": True, "boost": 1.5},
     {"chapter": "Prompt first, then LoRA", "title": "Before you train anything", "notes": [["1. Prompt first (two examples: {BEFORE} -> {FEW} out of {TEST})  2. Facts that keep changing? Put them in the prompt  3. A skill the prompt can't nail? A small LoRA. Then check its work: we still got 3 wrong", 0], ["Next: how AI finds the right page in your documents (RAG, part 2)", 1]]},
     "So: prompt first. Facts that keep changing? Put them in the prompt. A skill the prompt can't nail? A small LoRA. Then check its work: we still got 3 wrong. [1] Next: how AI finds the right page in your documents. [2] Follow, so you don't miss it.",
     "So: prompt first. Facts that keep changing? Put them in the prompt. A skill the prompt can't nail? A small Lora. Then check its work: we still got three wrong. Next: how AI finds the right page in your documents. Follow, so you don't miss it.",
     "అందుకే: మొదట ప్రాంప్ట్. మారుతూ ఉండే ఫ్యాక్ట్స్? ప్రాంప్ట్ లోనే ఇవ్వండి. ప్రాంప్ట్ తో రాని స్కిల్? ఒక చిన్న లారా ఫైల్. తర్వాత అది ఇచ్చిన ఆన్సర్స్ చెక్ చేయండి: మాది కూడా మూడు తప్పులు చేసింది. [1] తర్వాతి ఎపిసోడ్ లో: మీ డాక్యుమెంట్స్ లో సరైన పేజీని ఎ ఐ ఎలా వెతుకుతుందో చూద్దాం. [2] మిస్ అవ్వకుండా ఫాలో అవ్వండి.",
     {}),
]

# Spoken form of the English captions (numbers as words), used for word timing where it differs from `show`.
SPOKEN = {
    "hook": "We asked a tiny free AI to turn WhatsApp orders into neat slips. It just copied them back. [1] Zero out of {TEST}. [2] A better prompt, with two examples? {FEW}. [3] Then we trained it on two hundred and forty made-up orders. {MIN} minutes, no graphics card. [4] {AFTER} out of {TEST}, on new orders it never saw.",
    "hard": "Normal training changes every one of its three hundred and sixty million numbers. [1] And every new skill needs a whole new copy.",
    "trick": "The trick is called LoRA: freeze the original. [1] Add a few new numbers on top, like sticky notes in a textbook, and train only the notes. [2] Each skill is its own {MB} megabyte file, a short WhatsApp video. The model? {MODEL_MB} megabytes, a movie. [3] Apple says its iPhone AI does this: one model, a small skill file per feature.",
}


def deep_fill(o):
    if isinstance(o, str):
        return fill(o).replace("{PCT}", N["pct"])
    if isinstance(o, list):
        return [deep_fill(x) for x in o]
    if isinstance(o, dict):
        return {k: deep_fill(v) for k, v in o.items()}
    return o


def spec(lang):
    te = lang == "te"
    s = {"id": "ep31te" if te else "ep31v1", "title": "Teach an AI a new skill (LoRA)" + (" (Telugu audio)" if te else ""), **BASE,
         "tempo": 1.1 if te else 1.2, "parler_lang": lang}
    if te:
        s.update({"captionMode": "phrase", "handle": "@ai_maastaaru_telugu"})
    scenes = []
    for i, (sid, typ, flags, yt, show, tts, tel, extra) in enumerate(SC):
        line = {"who": "maastaaru", "maxgap": 0.32 if te else 0.3, "file": f"{i + 1:02d}_{sid}.wav"}
        ex = dict(extra)
        te_tts, te_tts2 = ex.pop("te_tts", None), ex.pop("te_tts2", None)
        show = fill(show)
        if te:
            line.update({"text": fill(tel, te=True), "show": show.replace("360 million", "360-million"), "sentence_cues": True})
            if "file2" in ex:
                ex["tts"], ex["tts2"] = te_tts, te_tts2
        else:
            line.update({"text": fill(SPOKEN[sid]) if sid in SPOKEN else show, "show": show})
            if tts:
                line["tts"] = fill_spoken(tts)
            if "tts" in ex:
                ex["tts"] = fill_spoken(ex["tts"])
        line.update(ex)
        data = {"yt": deep_fill(yt), "n": N}
        if sid == "hook":
            data.update(hook_data())
        if sid == "close":
            data["handle"] = "@ai_maastaaru_telugu" if te else "@ai_maastaaru"
        scenes.append({"id": sid, "type": typ, **flags, "data": data, "lines": [line]})
    s["scenes"] = scenes
    out = R / f"{s['id']}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
