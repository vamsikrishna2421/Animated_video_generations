# HOW TO 06 "A free AI on your laptop, Wi-Fi off": writes reels/howto06v1.json (English) and reels/howto06te.json
# (Telugu). Lines from series/scripts/howto06_free_llm_laptop.md (v2 after the script review); [n] marks the words the
# pictures wait for; " | " = two takes with a beat. One narrator. Voices: pipeline/howto06/voice.py. Scene:
# Llm06Crayon.tsx. Every number from our run (series/scripts/howto06_demo).
#   python3 pipeline/howto06/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu)
    1: ("hook", "A free AI that answers with the Wi-Fi off. [1] It's small, not ChatGPT. But your words never leave your laptop.",
        "వైఫై ఆఫ్ లో కూడా జవాబు ఇచ్చే, ఒక ఫ్రీ చాట్‌బాట్. [1] ఇది చిన్నది, చాట్‌జీపీటీ కాదు. కానీ మీ మాటలు, మీ లాప్‌టాప్ దాటి బయటికి వెళ్ళవు."),
    2: ("result", "This letter took two seconds. [1] One download first, about one gigabyte, like a movie. Then no internet.",
        "ఈ లెటర్, రెండు సెకన్లలో వచ్చింది. [1] ముందు ఒక్కసారి, ఒక సినిమా అంత, ఒక గిగాబైట్ డౌన్‌లోడ్. తర్వాత, ఇంటర్నెట్ అక్కర్లేదు."),
    3: ("install", "Step one: open Terminal on a Mac, or PowerShell on Windows. [1] Paste the install line from llama dot cpp's official page.",
        "ఒకటో స్టెప్: మ్యాక్ లో టెర్మినల్, విండోస్ లో పవర్‌షెల్ ఓపెన్ చేసి, [1] లామా అఫీషియల్ పేజీలో ఉన్న, ఇన్‌స్టాల్ లైన్ పేస్ట్ చేసుకోండి."),
    4: ("model", "Step two: paste this. It fetches a free model, Qwen. [1] The first time, it downloads. After that, it opens in three seconds.",
        "రెండో స్టెప్: ఈ లైన్ పేస్ట్ చేస్తే, ఒక ఫ్రీ మోడల్ వస్తుంది. [1] డౌన్‌లోడ్ ఒక్కసారే. తర్వాత, మూడు సెకన్లలో ఓపెన్."),
    5: ("chat", "Step three: type your question. [1] Or run llama serve, and open the address it shows in your browser.",
        "మూడో స్టెప్: మీ ప్రశ్న అడగండి. [1] లేదా లామా సర్వ్ అని టైప్ చేసి, అది చూపించే అడ్రస్, బ్రౌజర్ లో ఓపెన్ చేసుకోండి."),
    6: ("honest", "Good for drafts: the letter was fine, the maths was right, about fifteen words a second. [1] Not for Telugu: it wrote nonsense.",
        "డ్రాఫ్ట్‌లకి బాగుంది: లెటర్ బాగుంది, లెక్క సరిగ్గా చేసింది, సెకనుకి దాదాపు పదిహేను పదాలు. [1] కానీ తెలుగులో అడిగితే, అర్థం లేని మాటలు."),
    7: ("needs", "It needs about three gigabytes of free memory. Most eight-gigabyte laptops are fine. [1] Add dash dash offline, and it never goes online.",
        "దీనికి మూడు గిగాబైట్ల ఖాళీ మెమరీ కావాలి; ఎనిమిది గిగాబైట్ల లాప్‌టాప్ సరిపోతుంది. [1] లైన్ చివర, డాష్ డాష్ ఆఫ్‌లైన్ అని టైప్ చేస్తే, ఇంటర్నెట్ కి వెళ్ళదు."),
    8: ("save", "Save this. [1] And send it to the friend who pastes office data into ChatGPT.",
        "ఇది సేవ్ చేసుకోండి. [1] ఆఫీస్ డేటా, చాట్‌జీపీటీ లో పేస్ట్ చేసే ఫ్రెండ్ కి, ఇది పంపండి."),
    9: ("loop", "Wi-Fi off, [1] and it still answers.", "వైఫై ఆఫ్, [1] అయినా జవాబు ఇస్తుంది."),
}
SHOW = {3: "Step one: open Terminal on a Mac, or PowerShell on Windows. Paste the install line from llama.cpp's official page.",
        6: "Good for drafts: the letter was fine, the maths was right, about 15 words a second. Not for Telugu: it wrote nonsense.",
        7: "It needs about 3 GB of free memory. Most 8 GB laptops are fine. Add --offline, and it never goes online."}
SHOW_TE = {
    1: "A free chatbot that answers even with the Wi-Fi off. It's small, it's not ChatGPT. But your words never leave your laptop.",
    2: "This letter came in 2 seconds. First, once, a 1 GB download, like a movie. After that, no internet needed.",
    3: "Step one: open Terminal on a Mac, PowerShell on Windows, and paste the install line from llama's official page.",
    4: "Step two: paste this line and a free model (Qwen) comes. The download is only once. After that, it opens in 3 seconds.",
    5: "Step three: ask your question. Or type llama serve, and open the address it shows in your browser.",
    6: "Good for drafts: the letter was good, the maths was right, about 15 words a second. But ask in Telugu, and it's meaningless words.",
    7: "It needs 3 GB of free memory; an 8 GB laptop is enough. Type --offline at the end of the line, and it won't go online.",
    8: "Save this. Send it to the friend who pastes office data into ChatGPT.",
    9: "Wi-Fi off, and it still answers.",
}
TTS_EN = {3: "Step one: open Terminal on a Mac, or PowerShell on Windows. Paste the install line from llama dot C P P's official page.",
          4: "Step two: paste this. It fetches a free model, Kwen. The first time, it downloads. After that, it opens in three seconds."}   # "Qwen" came out as "Q n"
TEMPO_EN = {"storyteller": 1.1}
TEMPO_TE = {"storyteller": 1.2}
CLI = [   # our real `llama cli ... --offline` screen (series/scripts/howto06_demo/cli_offline.txt), the logo left out
    ["$ llama cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M --offline", "#e2e8f0"],
    ["model      : Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M", "#94a3b8"],
    ["> Write a 2-line leave message to my manager. I have fever today and will be back tomorrow.", "#fde68a"],
    ["I'm terribly sorry, but I have a fever and will be back to work tomorrow. I hope to contribute to our team's success.", "#e2e8f0"],
    ["[ Prompt: 183.8 t/s | Generation: 18.5 t/s ]", "#86efac"],
]
T = {
    "lapTitle": "llama · Qwen2.5 1.5B · on this laptop",
    "letter": ["Dear Manager,", "I am sorry to inform you that I have a fever today", "and will be back to work tomorrow.", "Thank you for your understanding."],
    "letterStats": "30 tokens · 2.0 s · Wi-Fi off",
    "leftLab": "INTERNET", "leftVal": "OFF", "rightLab": "THE AI'S REPLY", "rightVal": "2 SECONDS",
    "tag": "FREE · SMALL · STAYS ON YOUR LAPTOP",
    "noNet": "1 GB DOWNLOAD, ONCE · THEN NO INTERNET",
    "step1": "STEP 1 · INSTALL", "step2": "STEP 2 · GET A MODEL", "step3": "STEP 3 · CHAT",
    "termTitle": "Terminal (Mac) · PowerShell (Windows)",
    "installRows": [["# Mac / Linux: open Terminal, paste:", "#94a3b8"], ["curl -LsSf https://llama.app/install.sh | sh", "#e2e8f0"], ["", "#000"],
                    ["# Windows: open PowerShell, paste:", "#94a3b8"], ["irm https://llama.app/install.ps1 | iex", "#e2e8f0"]],
    "installHead": "llama.cpp · free · open source (MIT)",
    "installSub": "the install lines from its official page: github.com/ggml-org/llama.cpp",
    "installNote": "we tested on Linux, building from source (3.7 min on 4 cores)",
    "modelRows": [["$ llama cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M", "#e2e8f0"], ["downloading qwen2.5-1.5b-instruct-q4_k_m.gguf ...", "#94a3b8"]],
    "first": "FIRST TIME", "firstVal": "DOWNLOAD 1.12 GB", "after": "EVERY TIME AFTER", "afterVal": "OPENS IN 3 s",
    "modelLic": "Qwen2.5 1.5B · Apache 2.0 · ours took 42 s to download",
    "cliTitle": "Terminal: llama cli", "cliRows": CLI,
    "url": "http://127.0.0.1:9931  (llama serve)",
    "question": "Write a 2-line leave message to my manager. I have fever today and will be back tomorrow.",
    "webReply": ["Dear Manager,", "I'm writing to inform you that I have a fever today", "and will return to work tomorrow."],
    "webStats": "36 tokens · 2.4 s · 15.20 t/s",
    "speed": "OR IN YOUR BROWSER · 4 CPU CORES, NO GRAPHICS CARD",
    "tiles": [["GOOD FOR DRAFTS", "the leave letter ✓ · 23 × 47 = 1081 ✓", True], ["SPEED", "≈15 words a second (17 tokens a second)", True],
              ["TELUGU", "మేము ప్రశ్నాలను మరింత పరిశోధించుకోవాలు...", False]],
    "teluguNote": "its Telugu: words that mean nothing, repeated",
    "needRows": [["MEMORY", "~3 GB free (most 8 GB laptops OK)"], ["DISK", "1.2 GB"], ["NETWORK", "only for the first download"]],
    "offlineCmd": "llama cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M --offline",
    "offlineNote": "--offline: uses the downloaded copy, no network",
    "saveHead": "SAVE THIS · 3 STEPS",
    "saveRows": [["1 · install, Mac / Linux (Terminal)", "curl -LsSf https://llama.app/install.sh | sh"],
                 ["1 · install, Windows (PowerShell)", "irm https://llama.app/install.ps1 | iex"],
                 ["2 · get the model, chat (add --offline later)", "llama cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M"],
                 ["3 · or the browser: open http://127.0.0.1:9931", "llama serve -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M"]],
    "share": "SEND THIS TO THE FRIEND WHO PASTES OFFICE DATA INTO CHATGPT",
}
# Sound (CLAUDE.md arc): a hit and a "Wi-Fi off" pop in second 1; a chime on the letter; typing ticks on each command;
# a download whoosh and a success; a chime on the browser; pops on the good tiles, a drop before "Not for Telugu" and a
# buzz on the ✗; a lift into the save card; a riser and the hit back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 2.0, "tail": 0.1}),
          ("s_b", (3, 4), {"boost": 1.6, "lift": 0.6, "tail": 0.1}),
          ("s_c", (5, 6), {"boost": 1.6, "lift": 0.6, "drop_at": [[1, "1", 0.35]], "tail": 0.1}),   # a drop before "Not for Telugu"
          ("s_d", (7,), {"boost": 1.8, "lift": 0.7, "tail": 0.15}),
          ("s_e", (8,), {"boost": 3.0, "lift": 1.1, "rise": 3.0, "tail": 0.4}),
          ("s_f", (9,), {"outro": True, "pre": 0.3, "boost": 3.0, "lift": 0.8, "rise": 3.2, "tail": 0.0})]
GAP = {n: 0.2 for n in LINES} | {8: 0.6, 9: 0.0}
GAP_TE = {n: 0.14 for n in LINES} | {8: 0.5, 9: 0.0}
FLAGS_TE = {"s_a": {"boost": 2.4}, "s_e": {"boost": 3.4, "rise": 3.4}}
YT = {"s_a": "A free AI, Wi-Fi off", "s_b": "Install, get a model", "s_c": "Chat, and what it's good for", "s_d": "What you need",
      "s_e": "Save this", "s_f": "Wi-Fi off"}
NAMES = {"storyteller": ""}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto06te" if te else "howto06v1"
    s = {"id": sid, "title": "HOW TO 06: a free AI on your laptop, Wi-Fi off" + (" (Telugu audio)" if te else ""), "label": "HOW TO 06",
         "banner": "", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.3, "music": "lofi", "names": NAMES,
         "musicVol": [0.16, 0.4], "musicDuckRamp": 9, "musicFade": 0.05, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1390, "endPad": 0.3}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.3, "endPad": 0.2, "musicVol": [0.2, 0.46], "musicGapGain": 1.0})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "maxgap": 0.22 if te else 0.3, "gap": (GAP_TE if te else GAP).get(n, 0.3),
                  "tempo": TEMPO_TE["storyteller"] if te else TEMPO_EN["storyteller"]}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            lines.append(ln)
            beats.append({"who": "storyteller", "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1390, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_llm06", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
