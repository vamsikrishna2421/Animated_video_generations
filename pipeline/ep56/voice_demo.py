# EP56 test, step 2 (written and committed before it ran): a voice assistant for EP54/55's made-up shop.
#   ears  = Whisper on our computer (faster-whisper, int8, CPU): speech -> text
#   brain = EP55's WhatsApp bot (Qwen2.5-7B-Instruct, 4-bit, llama.cpp) + EP55's fixed MCP server (orders_server_v2.py),
#           the typed tool listing (mcp_fix.py), temperature 0.2, seed 1, one fresh chat per question
#   mouth = timed in step 1 (make_questions.py), not part of the score
# The 20 recorded questions from step 1 (10 English, 10 Telugu; computer voices) go through 5 ears:
#   A English audio, small, transcribe (language en)      B Telugu audio, small, transcribe (te)
#   C Telugu audio, small, translate to English (te)      D Telugu audio, large-v3, transcribe (te)
#   E Telugu audio, large-v3, translate to English (te)
# Scored per question: did the right order number reach the shop's system (the first tool call's order_id equals the
# order)? Also kept: the transcript, the bot's final answer (auto check: EP54's words; every reply read by hand: HAND),
# seconds for the ears and for the brain.
# Writes series/scripts/ep56_demo/voice.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep56/voice_demo.py ears     (then, with the AI model downloaded:)
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep56/voice_demo.py brain
import asyncio
import gc
import json
import re
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

from faster_whisper import WhisperModel
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/ep55"))
import mcp_demo as m  # noqa: E402  (BOTS, ask, right, d.model_file, d.PORT, e54.QS)
import mcp_fix as fx  # noqa: E402  (the typed tool listing)

OUT = ROOT / "series/scripts/ep56_demo"
SERVER = ROOT / "pipeline/ep55/orders_server_v2.py"
EARS = [("A", "en", "small", "transcribe"), ("B", "te", "small", "transcribe"), ("C", "te", "small", "translate"),
        ("D", "te", "large-v3", "transcribe"), ("E", "te", "large-v3", "translate")]
HAND = {   # read by hand after the run (series/scripts/ep56_demo/voice.json)
    "A": "English, small ears: 7 of 10 order numbers reached the shop right; 3 came out like money ('$44.17', '42.90', "
         "'46.11'): for 4417 the AI sent a made-up 'OR123456'; 4290 and 4611 went as 42.9 and 46.11, 'no such order'. "
         "The 7 answers were right. Ears 1.5 s, brain 10.4 s a question.",
    "B": "Telugu, small ears, transcribe: 0 of 10. 6 transcripts in Hindi letters, 4 looping junk (37-46 s each). The AI "
         "made up order numbers: '12345' 4 times, also 'R123456', 'N0123456789', '20231012123456'; 3 replies in Hindi "
         "letters, 1 in Marathi, 1 broken Telugu.",
    "C": "Telugu, small ears, translate: 0 of 10 ('Order 40, 417', '43rd January', 'August 5th, 2017'); the AI sent 40417, "
         "43, 40, 45, 403, 51708, '12345'.",
    "D": "Telugu, large-v3, transcribe: 3 of 10 (4388, 4611, 4588); numbers in Telugu script came out as '40, 4, 17', "
         "'40475', '45, 30, 3'; '12345' 3 times; replies in Telugu (often broken), Hindi letters, and once Chinese "
         "claiming 4502 had shipped (the record: packed, not shipped). Ears 12.5 s a question.",
    "E": "Telugu, large-v3, translate to English: 5 of 10 (4502, 4611, 4475, 4588, 4650), all 5 answers right; misses: "
         "'40, 4, 17' (sent 40), '43.88', '429', '4530', '43-62'; no made-up numbers. Ears 5.4 s, brain 9.5 s.",
    "all": "'12345' sent as the order number 8 times in 50 (B 4, C 1, D 3). Mouth (our Parler voice): 15.7-23.5 s to say "
           "one answer on our CPU (average 20.2 s). So one answer took about 5 + 10 + 20 = 35 s on our computer.",
}


def first_call_id(trace):
    for t in trace:
        if "ai" in t:
            c = m.find_json(t["ai"])
            if c:
                args = c.get("args") or {k: v for k, v in c.items() if k != "tool"}
                return str(args.get("order_id", "")).strip().lstrip("#")
    return None


async def main(step):
    m.tool_text = fx.tool_text   # EP55's fix: the AI sees each input's type
    if step == "brain":   # the ears and the brain run as two processes (two runs ran out of memory with both loaded)
        heard = json.loads((OUT / "voice.json").read_text())["rows"]
        return await brain(heard)
    qs = json.loads((OUT / "questions.json").read_text())["rows"]
    heard = []
    models = {}
    for tag, lang, size, task in EARS:   # 1. the ears
        if size not in models:   # one ears model in memory at a time (the first run ran out of memory at D)
            models.clear()
            gc.collect()
            models[size] = WhisperModel(size, device="cpu", compute_type="int8", cpu_threads=4)
        for q in [r for r in qs if r["lang"] == lang]:
            t0 = time.time()
            segs, _ = models[size].transcribe(str(ROOT / q["file"]), language=lang, task=task, beam_size=5)
            text = " ".join(s.text.strip() for s in segs).strip()
            heard.append({"ears": tag, "lang": lang, "model": size, "task": task, "order": q["order"], "said": q["text"],
                          "heard": text, "ears_seconds": round(time.time() - t0, 2)})
            print(tag, q["order"], heard[-1]["ears_seconds"], "|", text, flush=True)
    models.clear()
    (OUT / "voice.json").write_text(json.dumps({"rows": heard}, indent=1, ensure_ascii=False))


async def brain(heard):
    key = "sk-" + secrets.token_hex(20)   # 2. the brain, on what the ears heard
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(m.d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(m.d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", m.d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        (m.OUT / "orders.json").write_text(json.dumps(m.e54.ORDERS, indent=1))   # the server's data: EP54's orders
        must = {oid: w for oid, _, w in m.e54.QS}
        params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
        async with stdio_client(params) as (r, w):
            async with ClientSession(r, w) as session:
                await session.initialize()
                tools = (await session.list_tools()).tools
                for h in heard:
                    t0 = time.time()
                    final, trace = await m.ask(key, m.BOTS["whatsapp"], h["heard"], session, tools)
                    called, ok = m.right(final, trace, must[h["order"]])
                    got = first_call_id(trace)
                    h.update({"brain_seconds": round(time.time() - t0, 1), "final": final, "trace": trace, "called": called,
                              "order_sent": got, "right_number": got == h["order"], "right_auto": ok})
                    print(h["ears"], h["order"], "sent", got, "OK" if got == h["order"] else "--", "|", final.replace("\n", " ")[:140], flush=True)
                    (OUT / "voice.json").write_text(json.dumps({"rows": heard}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    for tag, *_ in EARS:
        rr = [h for h in heard if h["ears"] == tag]
        print(tag, "right number", sum(h.get("right_number", False) for h in rr), "of", len(rr),
              "| ears s", round(sum(h["ears_seconds"] for h in rr) / len(rr), 1),
              "| brain s", round(sum(h.get("brain_seconds", 0) for h in rr) / len(rr), 1))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "ears"))
