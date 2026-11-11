# Creative 26 "Hanuman Chalisa, Part 1: See His Form" (the pilot): writes reels/creative26v1.json (English page) and
# reels/creative26te.json (Telugu page). Script: series/scripts/creative26_hanuman_chalisa_part1.md. Per chaupai one
# scene: the chant (Hindi, the same takes on both pages, no subtitle: the band at the top shows the line) and the
# meaning ([n] = the words the picture waits for). Voices: pipeline/creative26/voice.py. Scene: HanumanCrayon.tsx.
# No music bed (Vamsi's taste: the line itself is the music): bells in the scene, the bed at 0.
#   python3 pipeline/creative26/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

DEVA = [["जय हनुमान ज्ञान गुन सागर।", "जय कपीस तिहुँ लोक उजागर॥"], ["राम दूत अतुलित बल धामा।", "अंजनि-पुत्र पवनसुत नामा॥"],
        ["महाबीर बिक्रम बजरंगी।", "कुमति निवार सुमति के संगी॥"], ["कंचन बरन बिराज सुबेसा।", "कानन कुंडल कुंचित केसा॥"]]
ROMAN = [["Jai Hanuman gyan gun sagar", "Jai Kapis tihun lok ujagar"], ["Ram doot atulit bal dhama", "Anjani-putra Pavan-sut nama"],
         ["Mahabir bikram Bajrangi", "Kumati nivar sumati ke sangi"], ["Kanchan baran biraj subesa", "Kanan kundal kunchit kesa"]]
CHANT_TTS = ["जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥", "राम दूत अतुलित बल धामा। अंजनि पुत्र पवनसुत नामा॥",
             "महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी॥", "कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥"]
# v2 (script review): Kapis in line 1 ("greatest of the vanaras"); Telugu in a devotional register (పుత్రుడు, మనసులో
# దర్శించుకోండి, చదివేటప్పుడు, శ్రీరాముని దూత, వజ్రదేహం, ముంగురులు); the ending "Next time you chant or hear it, see this face."
MEAN = {   # chaupai: (English, its Fish spelling, Telugu)
    1: ("Victory to Hanuman, ocean of wisdom and goodness. [1] Greatest of the vanaras, his light fills all three worlds. [2] Picture him shining over a sea of light.",
        "Victory to Hanumaan, ocean of wisdom and goodness. Greatest of the vaanaras, his light fills all three worlds. Picture him shining over a sea of light.",
        "హనుమంతుడికి జయం: జ్ఞానానికి, మంచి గుణాలకి ఆయన సముద్రం. [1] వానర శ్రేష్ఠుడు, మూడు లోకాలకీ ఆయనే వెలుగు. | [2] వెలుగుల సముద్రం మీద, ఆయన్ని మనసులో దర్శించుకోండి."),
    2: ("Ram's messenger, with strength no one can match. [1] Son of Anjani, son of the Wind. [2] Picture him riding the wind.",
        "Raam's messenger, with strength no one can match. Son of Anjani, son of the Wind. Picture him riding the wind.",
        "శ్రీరాముని దూత, ఎవరికీ లేనంత బలం. [1] అంజనీ పుత్రుడు, వాయు పుత్రుడు. | [2] గాలి మీద ఎగురుతున్న ఆయన్ని, మనసులో దర్శించుకోండి."),
    3: ("The great hero, with a body strong as a thunderbolt. [1] He drives away bad thoughts, and stays with the good. [2] Picture him clearing the dark clouds from your mind.",
        None,
        "మహావీరుడు, వజ్రదేహం. [1] చెడు ఆలోచనలు తరిమేసి, మంచి ఆలోచనలకి తోడుగా ఉంటాడు. | [2] మనసులో చీకటి మబ్బులు తరిమేస్తున్న ఆయన్ని దర్శించుకోండి."),
    4: ("Golden in colour, in fine clothes; [1] earrings in his ears, and curly hair. [2] Next time you chant or hear it, see this face.",
        None,
        "బంగారు రంగు, అందమైన వస్త్రాలు. [1] చెవులకు కుండలాలు, ఉంగరాల ముంగురులు. | [2] చాలీసా చదివేటప్పుడు, ఈ రూపాన్నే దర్శించుకోండి."),
}
SHOW_TE = {   # English subtitles of the Telugu narration (the channel rule: on-screen text in English)
    1: "Victory to Hanuman: an ocean of wisdom and good qualities. Greatest of the vanaras, he is the light of the three worlds. <pause 0.4> Over a sea of light, see him in your mind.",
    2: "Sri Ram's messenger, with strength no one else has. Son of Anjani, son of Vayu, the Wind. <pause 0.4> See him in your mind, flying on the wind.",
    3: "The great hero, a body like a thunderbolt. He drives bad thoughts away and stays beside good ones. <pause 0.4> See him driving the dark clouds from your mind.",
    4: "Golden colour, beautiful clothes. Earrings in his ears, curly locks. <pause 0.4> When you read the Chalisa, see this form.",
}
HOOK = "You know these words. Now see them."
SPLIT_PAUSE_TE = 0.4
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative26te" if te else "creative26v1"
    s = {"id": sid, "title": "Hanuman Chalisa, Part 1: See His Form" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "format": "devotional", "look": "classic", "gap": 0.16, "lead": 0.45, "music": "none", "musicVol": [0.0, 0.0],
         "endPad": 1.4, "captionMode": "phrase", "hardCuts": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1520}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for p in range(1, 5):
        en, en_tts, tel = MEAN[p]
        chant = {"who": "chant", "file": f"{2 * p - 1:02d}_chant.wav", "text": CHANT_TTS[p - 1], "tts": CHANT_TTS[p - 1],
                 "show": " ".join(ROMAN[p - 1]), "nocap": True, "maxgap": 0.4, "gap": 0.5, "tempo": 1.0}
        raw = tel if te else en
        mean = {"who": "storyteller", "file": f"{2 * p:02d}_storyteller.wav", "text": raw, "maxgap": 0.4, "gap": 0.7, "tempo": 1.0,
                "show": SHOW_TE[p] if te else MARK.sub("", en)}
        if not te and en_tts:
            mean["tts"] = en_tts
        if " | " in raw:
            p1, p2 = raw.split(" | ")
            mean.update({"text": f"{p1} <pause {SPLIT_PAUSE_TE}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{2 * p:02d}b_storyteller.wav",
                         "tts2": MARK.sub("", p2).strip(), "pause": SPLIT_PAUSE_TE})
        data = {"part": p, "deva": DEVA[p - 1], "roman": ROMAN[p - 1], "hook": HOOK if p == 1 else None, "captionTop": 1520,
                "beats": [{"prop": "chant", "n": 2 * p - 1}, {"prop": "mean", "n": 2 * p}],
                "yt": {"chapter": f"Chaupai {p}", "title": f"Chaupai {p}", "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": f"c{p}", "type": "sk_hanuman", "tail": 0.5 if p < 4 else 0.8, "data": data, "lines": [chant, mean]})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
