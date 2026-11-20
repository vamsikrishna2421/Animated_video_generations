# EP57 "₹27,400 or ₹0? Deploy Your AI App" (Season 6, a screen tutorial): writes reels/ep57v1.json (English) and
# reels/ep57te.json (Telugu). Lines from series/scripts/ep57_deploy.md; [n] marks the words the picture waits for; " | " =
# two takes with a beat of silence. One narrator. Voices: pipeline/ep57/voice.py. Scene: Deploy57Crayon.tsx. Numbers on
# screen (data.t) come from our test (series/scripts/ep57_demo/deploy.json) and the companies' pages (read Nov 20).
#   python3 pipeline/ep57/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu). v2 (script review): ₹0 on a free 2-core box (our own test), a pick and where,
    # three steps, "a month" every time, the break-even, "same questions", no API / ఏఐ / మొదటి in Telugu, no next-episode tease
    1: ("hook", "A GPU server for a shop bot: twenty-seven thousand four hundred rupees a month. | [1] A free CPU box: zero. Same bot, same questions.",
        "షాప్ బాట్ కి జీపీయూ సర్వర్: నెలకి ఇరవై ఏడు వేల నాలుగు వందలు. | [1] ఫ్రీ కంప్యూటర్ లో: సున్నా. అదే బాట్, అవే ప్రశ్నలు."),
    2: ("laptop", "Today the bot runs on Suresh's laptop. [1] Laptop sleeps, the bot sleeps. Deploying means moving it to a computer that's always on.",
        "ఇప్పుడు బాట్, సురేష్ ల్యాప్‌టాప్ లో నడుస్తోంది. | [1] ల్యాప్‌టాప్ నిద్రపోతే, బాట్ కూడా నిద్రపోతుంది. డిప్లాయ్ అంటే, ఎప్పుడూ ఆన్ లో ఉండే కంప్యూటర్ కి మార్చడం."),
    3: ("bars", "Prices from the companies' own pages. [1] A GPU server, all month: twenty-seven thousand four hundred. [2] A free two-core box: zero, and our bot still answered in about two seconds, because shop answers are short. [3] Or a tiny server that sends each message to an AI company: about twenty-eight rupees a month.",
        "ధరలు, ఆ కంపెనీల సొంత పేజీల నుంచే. [1] జీపీయూ సర్వర్, నెలంతా: ఇరవై ఏడు వేల నాలుగు వందలు. [2] రెండు కోర్ల ఫ్రీ కంప్యూటర్: సున్నా; షాప్ జవాబులు చిన్నవి కాబట్టి, రెండు సెకన్లలో జవాబిచ్చింది. [3] లేదా, ప్రతి మెసేజ్ ని ఒక పెద్ద కంపెనీ మోడల్ కి పంపే చిన్న సర్వర్: నెలకి సుమారు ఇరవై ఎనిమిది రూపాయలు."),
    4: ("pick", "For a shop: the free box, or twenty-eight a month for a smarter model. [1] A GPU only pays off above about fifty thousand chats a day.",
        "షాప్ కి: ఫ్రీ కంప్యూటర్, లేదా తెలివైన మోడల్ కోసం నెలకి ఇరవై ఎనిమిది. [1] రోజుకి యాభై వేల చాట్లు దాటితేనే, జీపీయూ లాభం."),
    5: ("steps", "Three steps: [1] put the bot's code on a free Hugging Face Space. [2] Any key goes in its Secrets, never in the code. [3] Paste the Space's link into WhatsApp's callback URL.",
        "మూడు స్టెప్స్ ఇవే, [1] కోడ్ ని ఫ్రీ సర్వర్ లో పెట్టండి. | [2] కీ ని సీక్రెట్స్ లో పెట్టండి. [3] సర్వర్ లింక్ ని, వాట్సాప్ సెట్టింగ్స్ లో పేస్ట్ చేసుకోండి."),   # render review: the English names babbled; they stay on screen
    6: ("loop", "One catch: after two days with no messages, the free box sleeps, and the next reply waits while it wakes up; loading our model alone took twenty-four seconds. [1] So before anyone rents you a GPU: twenty-seven thousand four hundred a month, or zero?",
        "ఒక్క జాగ్రత్త: రెండు రోజులు మెసేజ్ రాకపోతే, ఫ్రీ కంప్యూటర్ నిద్రపోతుంది; అది లేచేదాకా జవాబు ఆగుతుంది. | [1] అందుకే జీపీయూ అడిగే ముందు, ఒక్క ప్రశ్న: ఇరవై ఏడు వేల నాలుగు వందలా, లేక సున్నానా?"),
}
TTS_EN = {}
SHOW = {}
SHOW_TE = {}
SPLIT_PAUSE = {1: 0.5}   # render review: a beat before "zero"
SPLIT_PAUSE_TE = {1: 0.5, 2: 0.3, 5: 0.3, 6: 0.4}   # render-stage voice: the long Telugu lines lost their opening / babbled in one take
T = {
    "gpu": "₹27,400", "zero": "₹0", "zeroSub": "our 2-core test: ~2 s a reply", "api": "₹28",
    "src": "Hugging Face pricing · OpenAI gpt-5.4-mini pricing · ₹95.25 a dollar (RBI, Nov 6)",
    "bars": [["GPU server (Nvidia T4), all month", "Hugging Face: $288 × ₹95.25", "₹27,400", 1.0, "#dc2626"],
             ["free 2-core box (16 GB)", "our test: ~2 s a reply · short shop answers", "₹0", 0.0, "#16a34a"],
             ["tiny server + an AI company's model", "1.85 paise a chat × 50 chats a day", "₹28", 0.004, "#16a34a"]],
    "pickA": ["FREE CPU BOX", "₹0", "the bot with its model inside: 8 GB of 16"], "pickB": ["TINY SERVER", "₹28/mo", "the bot calls a company's smarter model"],
    "breakeven": "a GPU beats the API only above ~50,000 chats a day",
    "steps": [["Put the code on a host", "huggingface.co › New Space › CPU basic (free)"], ["Any key in its Secrets", "Settings › Variables and secrets › New secret"],
              ["Give WhatsApp its link", "WhatsApp › Configuration › Callback URL"]],
    "sleep": "free CPU box: sleeps after 48 h with no messages", "wake": "the next reply waits while it wakes · our model took 24 s to load",
    "ask": "₹27,400 a month, or ₹0?",
}
SCENES = [("s_a", (1,), {"boost": 2.6, "drop_at": [[0, 1, 0.6]], "tail": 0.0}),   # review: a drop before "zero"
          ("s_b", (2,), {"boost": 0.6, "lift": 0.5, "tail": 0.2}),   # render v3: a deeper dip
          ("s_c", (3, 4), {"boost": 0.75, "lift": 0.6, "tail": 0.3}),   # render v1: quarters 1-3 flat; a dip under the bars
          ("s_d", (5,), {"boost": 2.4, "lift": 0.7, "tail": 1.6}),   # render review: hold the full steps list 4 s+   # a lift under the steps
          ("s_e", (6,), {"outro": True, "pre": 0.3, "boost": 3.6, "lift": 0.8, "rise": 3.6, "drop_at": [[0, 1, 0.5]], "tail": 0.0})]
GAP = {1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.4, 6: 0.0}
FLAGS_TE = {"s_e": {"boost": 3.4, "rise": 3.6}}
YT = {"s_a": "₹27,400 or ₹0?", "s_b": "Deploy = always on", "s_c": "Three ways, priced", "s_d": "Three steps", "s_e": "The catch"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep57te" if te else "ep57v1"
    s = {"id": sid, "title": "EP57: Deploy Your AI App" + (" (Telugu audio)" if te else ""), "label": "EP57",
         "banner": "Deploy your AI app", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.28], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1440}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5, "musicVol": [0.18, 0.24]})   # render review: the TE bed sat at voice level in the gaps   # render review (TE): bare between lines
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.3,
                  "gap": GAP.get(n, 0.3), "tempo": 1.12 if te else 1.08}   # render review: "Check one." "Pause it." were slow
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1440, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_deploy57", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
