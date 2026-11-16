# EP54 "Build an AI Agent with Tools" (Season 6, a screen tutorial): writes reels/ep54v1.json (English) and
# reels/ep54te.json (Telugu). Lines from series/scripts/ep54_agent_tools.md; [n] marks the words the picture waits for;
# " | " = two takes with a beat of silence. One narrator. Voices: pipeline/ep54/voice.py. Scene: Agent54Crayon.tsx.
# Texts on screen (data.t) come from our test (series/scripts/ep54_demo/agent.json). One variable vs EP53 (Bujji's
# EP52 48h read): the middle shows one code line per step; the full runnable code lives in the pinned comment.
#   python3 pipeline/ep54/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "One thousand two hundred ninety-nine rupees refunded, said the shop's bot. [1] The shop's own record: zero. The refund hasn't even started.",
        "వెయ్యి రెండు వందల తొంభై తొమ్మిది రూపాయలు రిఫండ్ అయింది, అంది షాప్ చాట్‌బాట్. [1] షాప్ రికార్డ్ లో: సున్నా. రిఫండ్ ఇంకా స్టార్ట్ కూడా కాలేదు."),
    2: ("why", "The bot had no way to look. [1] So it wrote what a refund reply usually says.",
        "చాట్‌బాట్ కి చూసే దారే లేదు. [1] అందుకే, రిఫండ్ జవాబు మామూలుగా ఎలా ఉంటుందో, అలా రాసేసింది."),
    3: ("title", "Today: give it one tool. [1] An agent is an AI that can ask your code to do things.",
        "ఈ రోజు: దానికి ఒక టూల్ ఇద్దాం. [1] ఏజెంట్ అంటే, మీ కోడ్ ని పనులు చేయమని అడగగలిగే చాట్‌బాట్."),
    4: ("step1", "Step one: describe the tool: get order, by order number. [1] To use it, the AI replies with one line of JSON.",
        "స్టెప్ వన్: టూల్ గురించి చెప్పండి: ఆర్డర్ నంబర్ తో ఆర్డర్ వివరాలు. [1] వాడాలంటే, చాట్‌బాట్ ఒక్క జేసన్ లైన్ తో జవాబిస్తుంది."),
    5: ("step2", "Step two: your code reads that line and looks the order up. [1] The AI never touches your system. Your code does.",
        "స్టెప్ టూ: మీ కోడ్ ఆ లైన్ చదివి, ఆర్డర్ వెతుకుతుంది. [1] చాట్‌బాట్ మీ సిస్టమ్ ని తాకదు; మీ కోడే తాకుతుంది."),
    6: ("step3", "Step three: send the result back. [1] Now it answers from the shop's record.",
        "స్టెప్ త్రీ: ఆ రిజల్ట్ తిరిగి పంపండి. [1] ఇప్పుడు, షాప్ రికార్డ్ నుంచే జవాబిస్తుంది."),
    7: ("test", "Our test, ten customers. [1] Without the tool, it answered all ten without checking, and six were wrong. | [2] With the tool, it looked up all ten, and all ten were right.",
        "మా టెస్ట్, పది మంది కస్టమర్లు. [1] టూల్ లేకుండా, చూడకుండానే పదింటికీ జవాబిచ్చింది; ఆరు తప్పు. | [2] టూల్ తో, పదీ చూసింది; పదీ కరెక్ట్."),
    8: ("rule", "If you build one: the AI only asks; your code decides what runs. [1] If you use one: check your refund on the shop's own order page.",
        "మీరు తయారు చేస్తే: చాట్‌బాట్ అడుగుతుంది, ఏది రన్ అవ్వాలో మీ కోడే నిర్ణయిస్తుంది. | [1] మీరు వాడితే: రిఫండ్ ని, షాప్ ఆర్డర్ పేజీలోనే చూసుకోండి."),
    9: ("loop", "Next: build your own MCP server. [1] And order forty-four seventeen? Zero rupees. Refund not started.",
        "తర్వాత: మీ సొంత ఎం సి పి సర్వర్. | [1] మరి ఆర్డర్ నలభై నాలుగు పదిహేడు? సున్నా రూపాయలు. రిఫండ్ ఇంకా స్టార్ట్ కాలేదు."),
}
SHOW = {1: "₹1,299 refunded, said the shop's bot. The shop's own record: ₹0. The refund hasn't even started.",
        7: "Our test, 10 customers. Without the tool, it answered all 10 without checking, and 6 were wrong. <pause 0.5> With the tool, it looked up all 10, and all 10 were right.",
        9: "Next: build your own MCP server. And order 4417? ₹0. Refund not started."}
SHOW_TE = {
    1: "₹1,299 refunded, said the shop's chatbot. In the shop's record: ₹0. The refund hasn't even started.",
    2: "The chatbot had no way to look. So it wrote what a refund reply usually sounds like.",
    3: "Today: let's give it one tool. An agent is a chatbot that can ask your code to do things.",
    4: "Step 1: describe the tool: order details by order number. To use it, the chatbot replies with one JSON line.",
    5: "Step 2: your code reads that line and looks the order up. The chatbot doesn't touch your system; your code does.",
    6: "Step 3: send that result back. Now it answers from the shop's record.",
    7: "Our test, 10 customers. Without the tool, it answered all 10 without looking; 6 wrong. <pause 0.5> With the tool, it looked up all 10; all 10 right.",
    8: "If you build one: the chatbot asks, your code decides what runs. <pause 0.4> If you use one: check the refund on the shop's order page.",
    9: "Next: your own MCP server. <pause 0.4> And order 4417? ₹0. The refund hasn't started yet.",
}
SPLIT_PAUSE = {7: 0.5}
SPLIT_PAUSE_TE = {7: 0.5, 8: 0.4, 9: 0.4}
TTS_EN = {}
T = {   # on screen: our test (series/scripts/ep54_demo/agent.json); the shop and its orders are made up
    "shop": "Kiran Mobiles · order help",
    "q": "I returned my earphones, order 4417. Has my refund of Rs 1,299 come?",
    "plain": "Yes, your refund of Rs 1,299 for order 4417 has been processed.",
    "call": "{\"tool\": \"get_order\", \"order_id\": \"4417\"}",
    "result": ["\"item\": \"Bluetooth earphones\"", "\"amount\": \"Rs 1,299\"", "\"status\": \"returned, not yet received at our warehouse\"",
               "\"refund\": \"not started: it starts when the return reaches us\""],
    "final": "Your refund process will start once the earphones reach our warehouse.",
    "code": {"step1": "TOOL = \"get_order(order_id): status and refund from our system\"",
             "step2": "result = get_order(json.loads(reply)[\"order_id\"])",
             "step3": "messages.append({\"role\": \"user\", \"content\": f\"Tool result: {result}\"})"},
    "wrong": [["4417", "refund processed", "not started"], ["4502", "shipped", "packed, not shipped"],
              ["4475", "ships in 2-3 days", "out for delivery today"], ["4650", "confirmed", "payment pending"],
              ["4362", "delivered March 15", "delivered Nov 9"], ["4388", "5-7 business days", "arrives Nov 18"]],
    "docs": "OpenAI's and Google's own docs: the model returns the tool name and arguments; your code runs it",
}
# Sound (CLAUDE.md arc): a boom on frame 1 and a buzz on "zero"; pops as each step's line types; a whoosh on the tool
# call; a drop before "all ten were right" and a boom on it; a ding on the final answer; a riser and the slam.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.2, "tail": 0.0}),
          ("s_b", (4, 5, 6), {"boost": 0.85, "lift": 0.5, "tail": 0.0}),
          ("s_c", (7, 8), {"boost": 1.4, "lift": 0.7, "drop_at": [[0, 2, 0.4]], "tail": 0.0}),
          ("s_d", (9,), {"outro": True, "pre": 0.4, "boost": 2.0, "lift": 0.8, "rise": 2.3, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.3, 3: 0.35, 4: 0.3, 5: 0.35, 6: 0.3, 7: 0.4, 8: 0.4, 9: 0.0}
FLAGS_TE = {"s_d": {"boost": 2.2, "rise": 2.5}}
YT = {"s_a": "₹1,299 or ₹0?", "s_b": "One tool: 3 steps", "s_c": "Our test", "s_d": "Next: MCP"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep54te" if te else "ep54v1"
    s = {"id": sid, "title": "₹1,299 or ₹0? Build an AI Agent with Tools (EP54)" + (" (Telugu audio)" if te else ""), "label": "EP54",
         "banner": "Build an AI agent with tools", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.1 if te else 1.08}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_agent54", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
