# EP55 demo (written and committed before it ran): one MCP server, two bots of the same shop.
# EP54 built the order tool by hand inside one bot. Here the tool lives in an MCP server (orders_server.py, the official
# Python SDK), and two bots of the same made-up shop (a "website bot" and a "WhatsApp bot": two system prompts, the same
# small free AI as EP51-54, Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on our computer) connect to it with the same few lines
# of generic MCP client code. Nothing about orders is written in the bots: each asks the server (list_tools) and builds
# the tool description from what comes back (name, description, inputs). The AI asks with one JSON line, as in EP54;
# our client code calls the tool through MCP (call_tool) and sends the result back.
# Runs (temperature 0.2, seed 1, one fresh chat per question, EP54's 10 customers and 10 orders):
#   R1 website bot, no server        R2 WhatsApp bot + the server        R3 website bot + the same server
#   R4 change one record on the server (order 4417: return received, refund approved), then ask both bots about 4417
# Writes series/scripts/ep55_demo/mcp.json (and orders.json, the server's data). Every reply read by hand (HAND).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep55/mcp_demo.py
import asyncio
import json
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/ep52"))
sys.path.insert(0, str(ROOT / "pipeline/ep54"))
import rag_demo as d  # noqa: E402  (model_file, PORT)
import agent_demo as e54  # noqa: E402  (ORDERS, QS)

OUT = ROOT / "series/scripts/ep55_demo"
SERVER = ROOT / "pipeline/ep55/orders_server.py"
BOTS = {"website": "You are the website chat assistant of Kiran Mobiles, an online shop. Answer the customer in one or two short lines.",
        "whatsapp": "You reply to Kiran Mobiles' customers on WhatsApp. Answer in one or two short lines."}
UPDATE = {"4417": {"item": "Bluetooth earphones", "amount": "Rs 1,299", "status": "returned, received at our warehouse on Nov 17",
                   "refund": "Rs 1,299 approved on Nov 17; reaches the bank in 5-7 working days"}}
HAND = {}   # filled in after the run


def call(key, messages):
    body = json.dumps({"model": "ai", "messages": messages, "temperature": 0.2, "seed": 1, "max_tokens": 150}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"].strip()


def find_json(reply):   # the same as EP54: the first {...} that names a tool
    m = re.search(r"\{[^{}]*\"tool\"[^{}]*(\{[^{}]*\})?[^{}]*\}", reply)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


# ---- the generic MCP glue: the same code for any MCP server, nothing about orders in it ----
def tool_text(tools):
    lines = []
    for t in tools:
        args = ", ".join(t.input_schema.get("properties", {}))
        lines.append(f"- {t.name}({args}): {t.description}")
    return ("You can use these tools:\n" + "\n".join(lines) + "\nTo use one, reply with only this JSON and nothing else: "
            "{\"tool\": \"<tool name>\", \"args\": {<the inputs>}}\nAfter you get the tool result, answer only from it.")


async def ask(key, system, question, session=None, tools=None):
    msgs = [{"role": "system", "content": system + ("\n" + tool_text(tools) if tools else "")}, {"role": "user", "content": question}]
    trace, final = [], ""
    for _ in range(3):
        reply = call(key, msgs)
        trace.append({"ai": reply})
        c = find_json(reply) if session else None
        if not c:
            final = reply
            break
        res = await session.call_tool(c["tool"], c.get("args") or {k: v for k, v in c.items() if k != "tool"})
        text = res.content[0].text if res.content else ""
        trace.append({"tool_result": text})
        msgs += [{"role": "assistant", "content": reply}, {"role": "user", "content": "Tool result: " + text}]
    return final, trace


def right(final, trace, must):
    called = any("tool_result" in t for t in trace)
    return called, called and any(w.lower() in final.lower() for w in must)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "orders.json").write_text(json.dumps(e54.ORDERS, indent=1))
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows, listing = [], []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for oid, q, must in e54.QS:   # R1: the website bot alone
            final, trace = await ask(key, BOTS["website"], q)
            rows.append({"run": "R1 website, no server", "order": oid, "q": q, "final": final, "trace": trace})
            print("R1", oid, "|", final.replace("\n", " ")[:150], flush=True)
        params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
        async with stdio_client(params) as (r, w):
            async with ClientSession(r, w) as session:
                await session.initialize()
                tools = (await session.list_tools()).tools
                listing = [{"name": t.name, "description": t.description, "inputs": t.input_schema} for t in tools]
                print("discovered", listing, flush=True)
                for run, bot in (("R2 whatsapp + server", "whatsapp"), ("R3 website + server", "website")):
                    for oid, q, must in e54.QS:
                        final, trace = await ask(key, BOTS[bot], q, session, tools)
                        called, ok = right(final, trace, must)
                        rows.append({"run": run, "order": oid, "q": q, "final": final, "trace": trace, "called": called, "right_auto": ok})
                        print(run[:2], oid, "called" if called else "NO CALL", "right" if ok else "-", "|", final.replace("\n", " ")[:150], flush=True)
                        (OUT / "mcp.json").write_text(json.dumps({"tools": listing, "rows": rows}, indent=1, ensure_ascii=False))
                orders = json.loads((OUT / "orders.json").read_text())
                orders.update(UPDATE)   # R4: one change, on the server's data only
                (OUT / "orders.json").write_text(json.dumps(orders, indent=1))
                q4417 = e54.QS[0][1]
                for bot in ("website", "whatsapp"):
                    final, trace = await ask(key, BOTS[bot], q4417, session, tools)
                    called, ok = right(final, trace, ["approved", "1,299", "1299"])
                    rows.append({"run": f"R4 {bot} after the update", "order": "4417", "q": q4417, "final": final, "trace": trace,
                                 "called": called, "right_auto": ok})
                    print("R4", bot, "called" if called else "NO CALL", "right" if ok else "-", "|", final.replace("\n", " ")[:150], flush=True)
    finally:
        srv.terminate()
        srv.wait(timeout=60)
        (OUT / "orders.json").write_text(json.dumps(e54.ORDERS, indent=1))   # back to the EP54 data
    (OUT / "mcp.json").write_text(json.dumps({"tools": listing, "rows": rows}, indent=1, ensure_ascii=False))
    for run in ("R2", "R3"):
        rr = [r for r in rows if r["run"].startswith(run)]
        print(run, "called", sum(r["called"] for r in rr), "right (auto)", sum(r["right_auto"] for r in rr), "of", len(rr))


if __name__ == "__main__":
    asyncio.run(main())
