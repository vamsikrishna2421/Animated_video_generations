# EP55 "1 Right or 10? Build Your Own MCP Server" (Season 6, a screen tutorial): writes reels/ep55v1.json (English) and
# reels/ep55te.json (Telugu). Lines from series/scripts/ep55_mcp_server.md; [n] marks the words the picture waits for;
# " | " = two takes with a beat of silence. One narrator. Voices: pipeline/ep55/voice.py. Scene: Mcp55Crayon.tsx.
# Texts on screen (data.t) come from our test (series/scripts/ep55_demo/mcp.json, mcp_fix.json). Same hook shape and
# one-code-line middle as EP54 (Bujji's reads pending).
#   python3 pipeline/ep55/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "Same bot, same ten customers. [1] Plugged into our new MCP server: one right. | [2] After we fixed its input: ten.",
        "అదే చాట్‌బాట్, అదే పది మంది కస్టమర్లు. [1] మా కొత్త ఎమ్‌సీపీ సర్వర్ కి కలిపితే: ఒక్కటే కరెక్ట్. | [2] ఇన్‌పుట్ సరిచేశాక: పదికి పది."),
    2: ("what", "MCP is a standard plug for AI apps. [1] Put a tool, like our order lookup, in a server once, and any app that speaks MCP can find it and use it.",
        "ఎమ్‌సీపీ, చాట్‌బాట్ యాప్ లకి ఒక స్టాండర్డ్ ప్లగ్. [1] మా ఆర్డర్ లుకప్ లాంటి టూల్ ని, ఒక్కసారి సర్వర్ లో పెడితే; ఎమ్‌సీపీ తెలిసిన ప్రతి యాప్, దాన్ని కనుక్కొని వాడగలదు."),
    3: ("who", "Anthropic released it as an open standard in 2024. [1] OpenAI added it to its Agents SDK in 2025.",
        "ఆంత్రోపిక్, రెండు వేల ఇరవై నాలుగులో దీన్ని ఓపెన్ స్టాండర్డ్ గా విడుదల చేసింది. [1] చాట్‌జీపీటీ కంపెనీ కూడా, రెండు వేల ఇరవై ఐదులో దీన్ని తన డెవలపర్ టూల్స్ లో చేర్చింది."),
    4: ("step1", "Step one: the server. Twelve lines: [1] one function, a one-line description, and its input: the order number, as text.",
        "స్టెప్ వన్: సర్వర్. పన్నెండు లైన్లు: [1] ఒక ఫంక్షన్, ఒక లైన్ వివరణ, దాని ఇన్‌పుట్: ఆర్డర్ నంబర్, టెక్స్ట్ గా."),
    5: ("step2", "Step two: the bot asks the server what tools it has. [1] Nothing about orders is written in the bot.",
        "స్టెప్ టూ: చాట్‌బాట్, సర్వర్ దగ్గర ఉన్న టూల్స్ గురించి అడుగుతుంది. [1] ఆర్డర్ల గురించి, చాట్‌బాట్ లో ఒక్క లైన్ కూడా లేదు."),
    6: ("bug", "Our test: one right. [1] The AI sent the order number as a number. [2] The server wanted text, and refused it, every time. [3] The one time the AI sent text, it worked.",
        "మా టెస్ట్: ఒక్కటే కరెక్ట్. [1] చాట్‌బాట్ ఆర్డర్ నంబర్ ని అంకెగా పంపింది. [2] సర్వర్ టెక్స్ట్ అడిగింది, ప్రతిసారీ రిజెక్ట్ చేసింది. [3] టెక్స్ట్ గా పంపిన ఒక్కసారి మాత్రం, పని చేసింది."),
    7: ("fix", "The fix: accept a number or text, and show the AI the types. [1] Ten out of ten. | [2] Our second bot: zero before, seven now; three times it wrote broken JSON.",
        "ఫిక్స్: అంకె అయినా, టెక్స్ట్ అయినా తీసుకోవాలి; చాట్‌బాట్‌కి టైప్స్ కూడా చూపించాలి. [1] పదికి పది. | [2] మా రెండో చాట్‌బాట్: ముందు సున్నా, ఇప్పుడు ఏడు; మూడుసార్లు తప్పు ఫార్మాట్‌లో రాసింది."),
    8: ("update", "Then one change on the server, the refund approved, [1] and our WhatsApp bot said so, with no change to the bot.",
        "తర్వాత, సర్వర్ లో ఒక్క మార్పు: రిఫండ్ అప్రూవ్డ్. [1] చాట్‌బాట్ ని మార్చకుండానే, వాట్సాప్ బాట్ రిఫండ్ అప్రూవ్ అయిందని చెప్పింది."),
    9: ("loop", "One app? A plain tool is enough. [1] Two or more? Make it a server. [2] Accept what the AI sends, and test ten real questions. | [3] Next: a voice assistant.",
        "ఒక్క యాప్ కి, మామూలు టూల్ చాలు. [1] రెండు, అంతకంటే ఎక్కువ యాప్స్ కి, సర్వర్ గా రాసుకోండి. [2] చాట్‌బాట్ పంపేది తీసుకునేలా రాసుకోండి; పది నిజమైన ప్రశ్నలతో టెస్ట్ చేసుకోండి. | [3] తర్వాత: వాయిస్ అసిస్టెంట్."),
}
SHOW = {1: "Same bot, same 10 customers. Plugged into our new MCP server: 1 right. <pause 0.5> After we fixed its input: 10.",
        4: "Step 1: the server. 12 lines: one function, a one-line description, and its input: the order number, as text.",
        6: "Our test: 1 right. The AI sent the order number as a number. The server wanted text, and refused it, every time. The one time the AI sent text, it worked.",
        7: "The fix: accept a number or text, and show the AI the types. 10 out of 10. <pause 0.5> Our second bot: 0 before, 7 now; 3 times it wrote broken JSON.",
        9: "One app? A plain tool is enough. Two or more? Make it a server. Accept what the AI sends, and test 10 real questions. <pause 0.4> Next: a voice assistant."}
SHOW_TE = {
    1: "Same chatbot, same 10 customers. Plugged into our new MCP server: just 1 right. <pause 0.5> After fixing the input: 10 out of 10.",
    2: "MCP is a standard plug for chatbot apps. Put a tool like our order lookup in a server once; every app that knows MCP can find it and use it.",
    3: "Anthropic released it as an open standard in 2024. The ChatGPT company also added it to its developer tools in 2025.",
    4: "Step 1: the server. 12 lines: one function, a one-line description, its input: the order number, as text.",
    5: "Step 2: the chatbot asks the server what tools it has. Not one line about orders is in the chatbot.",
    6: "Our test: just 1 right. The chatbot sent the order number as a number. The server asked for text and rejected it every time. The one time it sent text, it worked.",
    7: "The fix: take a number or text; show the chatbot the types too. 10 out of 10. <pause 0.5> Our second chatbot: 0 before, 7 now; 3 times it wrote the wrong format.",
    8: "Then one change on the server: refund approved. Without changing the chatbot, the WhatsApp bot said the refund was approved.",
    9: "For one app, a plain tool is enough. For two or more apps, write it as a server. Write it to accept what the chatbot sends; test with 10 real questions. <pause 0.4> Next: a voice assistant.",
}
SPLIT_PAUSE = {1: 0.5, 7: 0.5, 9: 0.4}
SPLIT_PAUSE_TE = {1: 0.5, 7: 0.5, 9: 0.4}
TTS_EN = {}
T = {   # on screen: our test (series/scripts/ep55_demo/); the shop and its orders are made up
    "blame": "Your order ID is numeric. Please provide the correct alphanumeric order ID for tracking.",
    "q": "When will my smartwatch arrive? Order 4388.",
    "server": ["mcp = MCPServer(\"shop-orders\")", "@mcp.tool()", "def get_order(order_id: str) -> dict:",
               "    \"\"\"Look up one order: item, amount, status and refund.\"\"\""],
    "list": "client.list_tools()",
    "listing": "get_order(order_id): Look up one order in the shop's system: item, amount, status and refund.",
    "right": "{\"order_id\": \"4502\"}",
    "call": "{\"tool\": \"get_order\", \"args\": {\"order_id\": 4388}}",
    "error": "Input should be a valid string · input_value=4388, input_type=int",
    "fixLine": "def get_order(order_id: str | int) -> dict:",
    "fixList": "get_order(order_id: string or integer)",
    "broken": "{\"order_id\": 4417\"}",
    "update": "Your refund of Rs 1,299 has been approved and will reach your bank account in 5-7 working days.",
    "who": [["Anthropic", "introduced MCP as an open standard · Nov 2024"], ["OpenAI", "added MCP to its Agents SDK · Mar 2025"]],
    "full": "full code: in the pinned comment",
}
# Sound (CLAUDE.md arc): a boom on frame 1 and a buzz on "one right"; a drop and a boom on "ten"; pops as each code line
# types; a buzz on the refusal; a ding on "ten out of ten"; a ding on the update; a riser and the slam.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.2, "drop_at": [[0, 2, 0.4]], "tail": 0.0}),
          ("s_b", (4, 5), {"boost": 0.85, "lift": 0.5, "tail": 0.0}),
          ("s_c", (6, 7, 8), {"boost": 1.4, "lift": 0.7, "drop_at": [[1, 1, 0.3]], "tail": 0.0}),
          ("s_d", (9,), {"outro": True, "pre": 0.4, "boost": 2.2, "lift": 0.8, "rise": 2.6, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.3, 3: 0.35, 4: 0.3, 5: 0.35, 6: 0.35, 7: 0.4, 8: 0.4, 9: 0.0}
FLAGS_TE = {"s_c": {"boost": 1.6}, "s_d": {"boost": 2.5, "rise": 2.9}}
YT = {"s_a": "1 right or 10?", "s_b": "The server, the client", "s_c": "The bug, the fix", "s_d": "Next: a voice assistant"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep55te" if te else "ep55v1"
    s = {"id": sid, "title": "1 Right or 10? Build Your Own MCP Server (EP55)" + (" (Telugu audio)" if te else ""), "label": "EP55",
         "banner": "Build your own MCP server", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.12, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2, "captionMode": "phrase",
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
        scenes.append({"id": scid, "type": "sk_mcp55", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
