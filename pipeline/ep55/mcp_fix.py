# EP55 follow-up (written and committed before it ran). mcp_demo.py: with the MCP server plugged in, the WhatsApp bot got
# 1 of 10 right and the website bot 0 of 10. The traces: the AI sent {"order_id": 4417} (a number); the server's schema
# said text and refused every call; twice it also wrote broken JSON ({"order_id": 4417"}).
# Two changes, nothing else: (1) the server accepts a number or text (orders_server_v2.py); (2) the generic client shows
# the AI each input's type from the schema ("order_id: string or integer"). Same bots, model, settings, questions:
#   F2 WhatsApp bot + server v2    F3 website bot + server v2    F4 the 4417 update, both bots
# Writes series/scripts/ep55_demo/mcp_fix.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep55/mcp_fix.py
import asyncio
import json
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mcp_demo as m  # noqa: E402

SERVER = m.ROOT / "pipeline/ep55/orders_server_v2.py"
HAND = {   # read by hand after the run (series/scripts/ep55_demo/mcp_fix.json)
    "F2": "WhatsApp bot + server v2: called 10 of 10, 10 of 10 right (the auto check missed 4417: 'Your refund process hasn't "
          "started yet as your return is still in transit' is right)",
    "F3": "website bot + server v2: 7 of 10 right; the other 3 (4417, 4533, 4588) the AI wrote broken JSON, "
          "{\"order_id\": 4417\"} (a missing quote), so no call was made",
    "F4": "after one change on the server only (4417: return received, refund approved): the WhatsApp bot answered 'Your refund "
          "of Rs 1,299 has been approved and will reach your bank account in 5-7 working days' with no change to the bot; the "
          "website bot wrote the broken JSON again",
}


def kind(p):
    if "anyOf" in p:
        return " or ".join(x.get("type", "?") for x in p["anyOf"])
    return p.get("type", "?")


def tool_text(tools):   # the generic glue, now with each input's type
    lines = []
    for t in tools:
        props = t.input_schema.get("properties", {})
        args = ", ".join(f"{k}: {kind(v)}" for k, v in props.items())
        lines.append(f"- {t.name}({args}): {t.description}")
    return ("You can use these tools:\n" + "\n".join(lines) + "\nTo use one, reply with only this JSON and nothing else: "
            "{\"tool\": \"<tool name>\", \"args\": {<the inputs>}}\nAfter you get the tool result, answer only from it.")


async def main():
    m.tool_text = tool_text   # the one client-side change
    (m.OUT / "orders.json").write_text(json.dumps(m.e54.ORDERS, indent=1))
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(m.d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(m.d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows, listing = [], []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", m.d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        params = StdioServerParameters(command=sys.executable, args=[str(SERVER)])
        async with stdio_client(params) as (r, w):
            async with ClientSession(r, w) as session:
                await session.initialize()
                tools = (await session.list_tools()).tools
                listing = [{"name": t.name, "description": t.description, "inputs": t.input_schema} for t in tools]
                print("discovered", tool_text(tools), flush=True)
                for run, bot in (("F2 whatsapp + server v2", "whatsapp"), ("F3 website + server v2", "website")):
                    for oid, q, must in m.e54.QS:
                        final, trace = await m.ask(key, m.BOTS[bot], q, session, tools)
                        called, ok = m.right(final, trace, must)
                        rows.append({"run": run, "order": oid, "q": q, "final": final, "trace": trace, "called": called, "right_auto": ok})
                        print(run[:2], oid, "called" if called else "NO CALL", "right" if ok else "-", "|", final.replace("\n", " ")[:150], flush=True)
                        (m.OUT / "mcp_fix.json").write_text(json.dumps({"tools": listing, "rows": rows}, indent=1, ensure_ascii=False))
                orders = json.loads((m.OUT / "orders.json").read_text())
                orders.update(m.UPDATE)
                (m.OUT / "orders.json").write_text(json.dumps(orders, indent=1))
                q4417 = m.e54.QS[0][1]
                for bot in ("website", "whatsapp"):
                    final, trace = await m.ask(key, m.BOTS[bot], q4417, session, tools)
                    called, ok = m.right(final, trace, ["approved", "1,299", "1299"])
                    rows.append({"run": f"F4 {bot} after the update", "order": "4417", "q": q4417, "final": final, "trace": trace,
                                 "called": called, "right_auto": ok})
                    print("F4", bot, "called" if called else "NO CALL", "right" if ok else "-", "|", final.replace("\n", " ")[:150], flush=True)
    finally:
        srv.terminate()
        srv.wait(timeout=60)
        (m.OUT / "orders.json").write_text(json.dumps(m.e54.ORDERS, indent=1))
    (m.OUT / "mcp_fix.json").write_text(json.dumps({"tools": listing, "rows": rows}, indent=1, ensure_ascii=False))
    for run in ("F2", "F3"):
        rr = [r for r in rows if r["run"].startswith(run)]
        print(run, "called", sum(r["called"] for r in rr), "right (auto)", sum(r["right_auto"] for r in rr), "of", len(rr))


if __name__ == "__main__":
    asyncio.run(main())
