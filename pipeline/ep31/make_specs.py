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
SAMPLES = json.loads((DEMO / "samples.json").read_text())
SAMPLE = 1   # the test order shown in the hook (one the base model failed and the LoRA model got exactly right)

N = {"before": RES["before"]["all"], "after": RES["after"]["all"], "test": RES["test_examples"],
     "minutes": round(RES["train_seconds"] / 60), "pct": f"{RES['trainable_pct']:.1f}",
     "adapterMB": f"{RES['adapter_mb']:.0f}", "modelMB": f"{RES['model_mb']:.0f}", "params": "360 million"}


def hook_data():
    b, a = SAMPLES["before"][SAMPLE], SAMPLES["after"][SAMPLE]
    assert b["msg"] == a["msg"] and a["score"]["all"] == 1 and b["score"]["all"] == 0
    raw = " ".join(b["out"].split())
    words, lines, cur = raw.split(" "), [], ""
    for w in words:   # the base model's real reply, cut into a few bubble lines
        if len(cur) + len(w) + 1 > 34:
            lines.append(cur)
            cur = w
            if len(lines) == 4:
                break
        else:
            cur = (cur + " " + w).strip()
    cut = len(lines) == 4
    if not cut and cur:
        lines.append(cur)
    if cut:
        lines[-1] = lines[-1] + " …"
    g = json.loads(a["out"]) if a["out"].strip().startswith("{") else a["gold"]
    slip = {"name": g["name"], "phone": g["phone"], "items": [f"{i['item']} · {i['qty']}" for i in g["items"]], "address": g["address"]}
    return {"order": a["msg"], "beforeLines": lines, "slip": slip, "n": N}


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
         "MB": N["adapterMB"], "MODEL_MB": N["modelMB"]}
    if te:
        m.update({"TEST": te_num(N["test"]), "AFTER": te_num(N["after"]), "MIN": te_num(N["minutes"]), "MB": te_num(int(N["adapterMB"]))})
    for k in sorted(m, key=len, reverse=True):
        s = s.replace("{" + k + "}", m[k])
    return s


def fill_spoken(s):   # numbers as words for the English TTS text
    m = {"TEST": en_num(N["test"]), "BEFORE": en_num(N["before"]), "AFTER": en_num(N["after"]), "MIN": en_num(N["minutes"]),
         "MB": en_num(int(N["adapterMB"])), "MODEL_MB": N["modelMB"]}
    for k in sorted(m, key=len, reverse=True):
        s = s.replace("{" + k + "}", m[k])
    return re.sub(r"([.?!] )([a-z])", lambda g: g.group(1) + g.group(2).upper(), s)


# (id, type, scene flags, yt, show (English captions, [n] cues), tts (English, spoken form), te (Telugu, [n] cues), extra)
SC = [
    ("hook", "lo_hook", {"tail": 0.3, "drop_cue": 3},
     {"chapter": "0 out of {TEST}", "title": "A free AI that couldn't read a WhatsApp order", "notes": [["A small free AI: turn a WhatsApp order into an order slip", 0], ["{BEFORE} out of {TEST} usable (real run, ours)", 1], ["{MIN} minutes of LoRA training, 4 CPU cores, no GPU", 2], ["{AFTER} out of {TEST} perfect on orders it never saw", 3]]},
     "We asked this free AI to turn WhatsApp orders into order slips. It just copied them back. [1] Zero out of {TEST}. [2] So we taught it with 240 examples. {MIN} minutes, on four ordinary CPU cores. No GPU. [3] Now? {AFTER} out of {TEST}, perfect. Here's the trick.",
     "We asked this free AI to turn WhatsApp orders into order slips. It just copied them back. Zero out of {TEST}. So we taught it with two hundred and forty examples. {MIN} minutes, on four ordinary CPU cores. No GPU. Now? {AFTER} out of {TEST}, perfect. Here's the trick.",
     "ఈ ఫ్రీ ఎ ఐ కి వాట్సాప్ ఆర్డర్స్ ని ఆర్డర్ స్లిప్స్ గా మార్చమని చెప్పాం. అది వాటినే మళ్ళీ కాపీ చేసి ఇచ్చింది. [1] {TEST} లో సున్నా. [2] అందుకే రెండు వందల నలభై ఎగ్జాంపుల్స్ తో నేర్పించాం. {MIN} నిమిషాలు, నాలుగు మామూలు సి పి యు కోర్స్ మీద. జి పి యు లేదు. [3] ఇప్పుడు? {TEST} లో {AFTER}, పర్ఫెక్ట్. ఆ ట్రిక్ ఏంటో చూడండి.",
     {"pauses": {"3": 0.35}}),
    ("hard", "lo_hard", {"tail": 0.3, "lift": True, "boost": 1.1},
     {"chapter": "Why training is hard", "title": "Normal training changes every number", "notes": [["Normal training changes every number inside the model; ours has about 360 million", 0], ["The big ones have hundreds of billions: servers full of AI chips", 1], ["Even a 7B model needs over 100 GB of GPU memory to fully fine-tune (about 16-18 bytes per parameter)", 2]]},
     "Normally, teaching an AI changes every number inside it. Ours has 360 million. [1] The big ones have hundreds of billions. Training those takes servers full of AI chips. [2] Even a 7-billion model needs over 100 GB of chip memory to train.",
     "Normally, teaching an AI changes every number inside it. Ours has three hundred and sixty million. The big ones have hundreds of billions. Training those takes servers full of AI chips. Even a seven billion model needs over a hundred gigabytes of chip memory to train.",
     "మామూలుగా, ఎ ఐ కి ఏదైనా నేర్పిస్తే, దాని లోపల ఉన్న ప్రతి నంబర్ మారుతుంది. మాది ముప్పై ఆరు కోట్ల నంబర్స్. [1] పెద్ద మోడల్స్ లో వేల కోట్ల నంబర్స్ ఉంటాయి. వాటిని ట్రైన్ చేయాలంటే, సర్వర్ల నిండా ఎ ఐ చిప్స్ కావాలి. [2] ఏడు వందల కోట్ల నంబర్స్ ఉన్న మోడల్ కి కూడా, ట్రైనింగ్ కి వంద జి బి కి పైగా చిప్ మెమరీ కావాలి.",
     {}),
    ("trick", "lo_trick", {"tail": 0.3, "lift": True, "boost": 1.2, "drop_cue": 2},
     {"chapter": "The LoRA trick", "title": "Freeze the original, train sticky notes", "notes": [["LoRA (Low-Rank Adaptation, Microsoft, 2021): freeze the original numbers", 0], ["Add thin strips of new numbers (like sticky notes in a textbook) and train only those", 1], ["In our test: {PCT}% of the numbers", 2], ["The skill is its own file: {MB} MB, next to the {MODEL_MB} MB model", 3]]},
     "LoRA's trick: freeze the original. [1] Clip on thin strips of new numbers, like sticky notes in a textbook, and train only those. [2] In our test, that's 1.2% of the numbers. [3] And the skill saves as its own small file: {MB} MB, next to a {MODEL_MB} MB model.",
     "Lora's trick: freeze the original. Clip on thin strips of new numbers, like sticky notes in a textbook, and train only those. In our test, that's one point two percent of the numbers. And the skill saves as its own small file: {MB} megabytes, next to a {MODEL_MB} megabyte model.",
     "లోరా ట్రిక్: ఒరిజినల్ ని ఫ్రీజ్ చేయండి. [1] దాని మీద కొత్త నంబర్స్ ఉన్న సన్నని స్ట్రిప్స్ అతికించండి, టెక్స్ట్ బుక్ లో స్టిక్కీ నోట్స్ లాగా. వాటినే ట్రైన్ చేయండి. [2] మా టెస్ట్ లో, అది కేవలం ఒకటి పాయింట్ రెండు పర్సెంట్ నంబర్స్. [3] కొత్త స్కిల్, సెపరేట్ చిన్న ఫైల్ గా సేవ్ అవుతుంది: {MB} ఎం బి. మోడల్ ఏమో ఏడు వందల ఇరవై నాలుగు ఎం బి.",
     {}),
    ("quiz", "lo_quiz", {"tail": 0.3, "duck": [3, 2, 0.15], "boost": 1.3, "layer": 4},
     {"chapter": "Your turn", "title": "Prices change weekly: LoRA or hand it the list?", "notes": [["Your shop's prices change every week", 0], ["A: train a LoRA on this week's price list. B: hand the AI the price list with every question", 1], ["B: a LoRA bakes in old prices", 2], ["LoRA for skills and style; facts that change go in with each question (that's RAG, next episode)", 4]]},
     "Your turn. Your shop's prices change every week. [1] A: train a LoRA on this week's price list. B: hand the AI the price list with every question. Which one? [3] <pause 1.5> [2] B. A LoRA would bake in old prices. [4] LoRA for skills and style. Facts that change? Give them to the AI each time.",
     None,
     "ఇప్పుడు మీ వంతు. మీ షాప్ లో ధరలు ప్రతి వారం మారుతాయి. [1] ఎ: ఈ వారం ప్రైస్ లిస్ట్ మీద లోరా ట్రైన్ చేయడం. బి: ప్రతి ప్రశ్నతో పాటు ప్రైస్ లిస్ట్ ఎ ఐ కి ఇవ్వడం. ఏది కరెక్ట్? [3] <pause 1.5> [2] బి. లోరా పాత ధరలనే గుర్తుపెట్టుకుంటుంది. [4] స్కిల్స్, స్టైల్ కి లోరా. మారే ఫ్యాక్ట్స్ ని, ప్రతిసారి ఎ ఐ కి ఇవ్వండి.",
     {"tts": "Your turn. Your shop's prices change every week. A: train a Lora on this week's price list. B: hand the AI the price list with every question. Which one?",
      "file2": "04_quiz_answer.wav", "tts2": "B. A Lora would bake in old prices. Lora for skills and style. Facts that change? Give them to the AI each time.",
      "te_tts": "ఇప్పుడు మీ వంతు. మీ షాప్ లో ధరలు ప్రతి వారం మారుతాయి. ఎ: ఈ వారం ప్రైస్ లిస్ట్ మీద లోరా ట్రైన్ చేయడం. బి: ప్రతి ప్రశ్నతో పాటు ప్రైస్ లిస్ట్ ఎ ఐ కి ఇవ్వడం. ఏది కరెక్ట్?",
      "te_tts2": "బి. లోరా పాత ధరలనే గుర్తుపెట్టుకుంటుంది. స్కిల్స్, స్టైల్ కి లోరా. మారే ఫ్యాక్ట్స్ ని, ప్రతిసారి ఎ ఐ కి ఇవ్వండి.",
      "pause": 1.5, "gap": 0.1, "pauses": {"4": 0.4}}),
    ("swap", "lo_swap", {"tail": 0.3, "lift": True},
     {"chapter": "One model, many skills", "title": "Swap skill files in a second", "notes": [["One base model can carry many small skill files (orders, your shop's tone, quizzes from notes)", 0], ["Swap them in a second; servers swap them per request", 1]]},
     "And one model can carry many skill files: orders, your shop's tone, quizzes from class notes. [1] Swap them in a second.",
     "And one model can carry many skill files: orders, your shop's tone, quizzes from class notes. Swap them in a second.",
     "ఒకే మోడల్ కి చాలా స్కిల్ ఫైల్స్ ఉండొచ్చు: ఆర్డర్స్ కి ఒకటి, మీ షాప్ టోన్ కి ఒకటి, క్లాస్ నోట్స్ నుంచి క్విజ్ లకి ఒకటి. [1] సెకనులో మార్చేయొచ్చు.",
     {}),
    ("real", "lo_real", {"tail": 0.3, "lift": True, "drop_cue": 2},
     {"chapter": "It's everywhere", "title": "Phones, image styles, a 65B model on one GPU", "notes": [["Apple says its on-device model plugs in small LoRA adapters, one per feature (Apple ML Research, 2024)", 0], ["Image AIs learn a style from one small LoRA file (a few MB to a few hundred MB)", 1], ["QLoRA (Dettmers et al., 2023): a 65B model fine-tuned on a single 48 GB GPU", 2]]},
     "This isn't just a lab trick. Apple says its phone AI plugs in small adapters like these, one per feature. [1] Image AIs learn a new drawing style from one small file. [2] And a cousin called QLoRA fine-tuned a 65-billion model on a single GPU.",
     "This isn't just a lab trick. Apple says its phone AI plugs in small adapters like these, one per feature. Image AIs learn a new drawing style from one small file. And a cousin called Q Lora fine-tuned a sixty-five billion model on a single GPU.",
     "ఇది ల్యాబ్ ట్రిక్ మాత్రమే కాదు. యాపిల్ చెప్పింది, వాళ్ళ ఫోన్ ఎ ఐ, ఒక్కో ఫీచర్ కి ఒక్కో చిన్న అడాప్టర్ వాడుతుంది అని. [1] ఇమేజ్ ఎ ఐ లు, ఒక చిన్న ఫైల్ తో కొత్త డ్రాయింగ్ స్టైల్ నేర్చుకుంటాయి. [2] క్యూ లోరా అనే దాని కజిన్ తో, రీసెర్చర్లు ఒక అరవై ఐదు బిలియన్ మోడల్ ని, ఒక్క జి పి యు మీద ఫైన్ ట్యూన్ చేశారు.",
     {}),
    ("close", "lo_close", {"tail": 1.2, "outro": True, "lift": True},
     {"chapter": "Prompt, look up, then LoRA", "title": "Before you train anything", "notes": [["1. Try a good prompt", 0], ["2. Facts that change? Give them each time", 0], ["3. A skill or a style? A small LoRA (ours: {MIN} min, {MB} MB)", 0], ["Next: how AI finds the right page in your documents (RAG, part 2)", 1]]},
     "So before you train anything: try a good prompt. Facts that change? Give them each time. A skill or a style? A small LoRA. [1] Next: how AI finds the right page in your documents. [2] Follow, so you don't miss it.",
     "So before you train anything: try a good prompt. Facts that change? Give them each time. A skill or a style? A small Lora. Next: how AI finds the right page in your documents. Follow, so you don't miss it.",
     "అందుకే, ఏదైనా ట్రైన్ చేసే ముందు: ముందు మంచి ప్రాంప్ట్ ట్రై చేయండి. మారే ఫ్యాక్ట్స్? ప్రతిసారి ఇవ్వండి. స్కిల్ లేదా స్టైల్? ఒక చిన్న లోరా. [1] తర్వాతి ఎపిసోడ్ లో: మీ డాక్యుమెంట్స్ లో సరైన పేజీని ఎ ఐ ఎలా వెతుకుతుందో చూద్దాం. [2] మిస్ అవ్వకుండా ఫాలో అవ్వండి.",
     {}),
]

# Spoken form of the English captions (numbers as words), used for word timing where it differs from `show`.
SPOKEN = {
    "hook": "We asked this free AI to turn WhatsApp orders into order slips. It just copied them back. [1] Zero out of {TEST}. [2] So we taught it with two hundred and forty examples. {MIN} minutes, on four ordinary CPU cores. No GPU. [3] Now? {AFTER} out of {TEST}, perfect. Here's the trick.",
    "hard": "Normally, teaching an AI changes every number inside it. Ours has three hundred and sixty million. [1] The big ones have hundreds of billions. Training those takes servers full of AI chips. [2] Even a seven billion model needs over a hundred gigabytes of chip memory to train.",
    "trick": "LoRA's trick: freeze the original. [1] Clip on thin strips of new numbers, like sticky notes in a textbook, and train only those. [2] In our test, that's one point two percent of the numbers. [3] And the skill saves as its own small file: {MB} megabytes, next to a {MODEL_MB} megabyte model.",
    "real": "This isn't just a lab trick. Apple says its phone AI plugs in small adapters like these, one per feature. [1] Image AIs learn a new drawing style from one small file. [2] And a cousin called QLoRA fine-tuned a sixty-five billion model on a single GPU.",
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
            line.update({"text": fill(tel, te=True), "show": show})
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
