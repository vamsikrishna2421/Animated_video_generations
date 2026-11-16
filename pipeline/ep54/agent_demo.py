# EP54 demo (written and committed before it ran): an AI agent with one tool, built by hand.
# A made-up online phone-accessories shop, "Kiran Mobiles", with 10 orders in its system (ORDERS: every item, amount,
# status and refund is ours). Ten customers ask about their own order, the way people ask a shop's chat bot.
# Two runs, one fresh chat per question, temperature 0.2, seed 1, the same small free AI as EP51-53 (Qwen2.5-7B-Instruct,
# 4-bit, llama.cpp, on our computer, no web):
#   plain : a support-bot system prompt, no tools. Does it make up a status, a date or a refund?
#   tool  : the same prompt plus one tool, get_order(order_id). The AI can reply with only a JSON line,
#           {"tool": "get_order", "order_id": "4417"}; our code (not the AI) looks the order up and sends the result back
#           as "Tool result: {...}"; the AI then answers. Up to 3 rounds. This is the loop the vendors' own docs describe
#           (OpenAI "Function calling", Google "Function calling with the Gemini API"): the model only asks; your code runs it.
# Auto labels (made_up / called / right) are a first pass; every reply is read by hand (HAND).
# Writes series/scripts/ep54_demo/agent.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep54/agent_demo.py
import json
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/ep52"))
import rag_demo as d  # noqa: E402  (model_file, PORT)

OUT = ROOT / "series/scripts/ep54_demo"
ORDERS = {   # the shop's system (made up by us)
    "4417": {"item": "Bluetooth earphones", "amount": "Rs 1,299", "status": "returned, not yet received at our warehouse",
             "refund": "not started: it starts when the return reaches us"},
    "4502": {"item": "20,000 mAh power bank", "amount": "Rs 1,799", "status": "packed, not shipped yet", "refund": "none"},
    "4388": {"item": "smartwatch", "amount": "Rs 3,499", "status": "shipped Nov 13, expected Nov 18", "refund": "none"},
    "4290": {"item": "33 W phone charger", "amount": "Rs 899", "status": "delivered Nov 10", "refund": "none"},
    "4611": {"item": "tablet cover", "amount": "Rs 649", "status": "cancelled by the customer on Nov 12",
             "refund": "Rs 649 sent on Nov 13; banks take 5-7 working days"},
    "4475": {"item": "wireless mouse", "amount": "Rs 749", "status": "out for delivery today", "refund": "none"},
    "4533": {"item": "phone tripod", "amount": "Rs 1,099", "status": "delivery failed: address not found, call us",
             "refund": "none"},
    "4362": {"item": "USB-C cable, pack of 2", "amount": "Rs 399", "status": "delivered Nov 9", "refund": "none"},
    "4588": {"item": "smart speaker", "amount": "Rs 2,999", "status": "returned and received Nov 14",
             "refund": "Rs 2,999 approved Nov 15; reaches the bank in 5-7 working days"},
    "4650": {"item": "screen guard", "amount": "Rs 299", "status": "payment pending: not confirmed yet", "refund": "none"},
}
QS = [   # (order, the customer's question, words a right answer must carry)
    ("4417", "I returned my earphones, order 4417. Has my refund of Rs 1,299 come?", ["not started", "not yet", "not received"]),
    ("4502", "Order 4502: has my power bank shipped?", ["not shipped", "packed"]),
    ("4388", "When will my smartwatch arrive? Order 4388.", ["18"]),
    ("4290", "Did my charger get delivered? Order 4290.", ["delivered"]),
    ("4611", "I cancelled order 4611. Where is my money?", ["649", "13"]),
    ("4475", "Order 4475, when is my mouse coming?", ["today"]),
    ("4533", "Why hasn't order 4533 reached me?", ["address"]),
    ("4362", "Was order 4362 delivered?", ["delivered"]),
    ("4588", "My speaker return, order 4588: refund done?", ["approved", "2,999"]),
    ("4650", "Is my order 4650 confirmed?", ["pending", "not confirmed"]),
]
SYSTEM = "You are the customer support assistant of Kiran Mobiles, an online shop. Answer the customer's question in one or two short lines."
TOOL = ("You can use one tool:\n"
        "get_order(order_id): returns the order's item, amount, status and refund from the shop's system.\n"
        "To use it, reply with only this JSON and nothing else: {\"tool\": \"get_order\", \"order_id\": \"<the order number>\"}\n"
        "After you get the tool result, answer the customer in one or two short lines, only from the result.")
HAND = {}   # filled in after the run, from the replies in agent.json
REFUSE = re.compile(r"(don't|do not|cannot|can't|unable|no access|not able|without (the|your|more)|please (provide|check|contact)|"
                    r"recommend (checking|contacting)|I'm sorry|I am sorry)", re.I)
CLAIM = re.compile(r"(shipped|delivered|refund(ed)? (has|was|is)|processed|credited|arrive|on (its|the) way|dispatched|confirmed|"
                   r"will reach|within \d|days)", re.I)


def get_order(order_id):   # the tool: our code, not the AI
    o = ORDERS.get(str(order_id).strip().lstrip("#"))
    return {"order_id": order_id, **o} if o else {"order_id": order_id, "error": "no such order"}


def call(key, messages):
    body = json.dumps({"model": "ai", "messages": messages, "temperature": 0.2, "seed": 1, "max_tokens": 150}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=600) as r:
        out = json.loads(r.read())
    return out["choices"][0]["message"]["content"].strip(), out.get("usage", {})


def as_call(reply):
    m = re.search(r"\{[^{}]*\"tool\"[^{}]*\}", reply)
    if not m:
        return None
    try:
        c = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None
    return c if c.get("tool") == "get_order" and c.get("order_id") else None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for oid, q, must in QS:   # plain: no tools
            reply, _ = call(key, [{"role": "system", "content": SYSTEM}, {"role": "user", "content": q}])
            made_up = bool(CLAIM.search(reply)) and not REFUSE.search(reply)
            rows.append({"mode": "plain", "order": oid, "q": q, "reply": reply, "made_up_auto": made_up})
            print("plain", oid, "made_up" if made_up else "-", "|", reply.replace("\n", " ")[:170], flush=True)
        for oid, q, must in QS:   # tool: the loop
            msgs = [{"role": "system", "content": SYSTEM + "\n" + TOOL}, {"role": "user", "content": q}]
            trace, called, final = [], False, ""
            for _ in range(3):
                reply, usage = call(key, msgs)
                trace.append({"ai": reply})
                c = as_call(reply)
                if not c:
                    final = reply
                    break
                called = True
                result = get_order(c["order_id"])
                trace.append({"tool_result": result})
                msgs += [{"role": "assistant", "content": reply}, {"role": "user", "content": "Tool result: " + json.dumps(result)}]
            right = called and any(w.lower() in final.lower() for w in must)
            rows.append({"mode": "tool", "order": oid, "q": q, "trace": trace, "final": final, "called": called, "right_auto": right,
                         "must": must, "truth": ORDERS[oid]})
            print("tool", oid, "called" if called else "NO CALL", "right" if right else "-", "|", final.replace("\n", " ")[:170], flush=True)
            (OUT / "agent.json").write_text(json.dumps({"system": SYSTEM, "tool": TOOL, "orders": ORDERS, "rows": rows},
                                                      indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    (OUT / "agent.json").write_text(json.dumps({"system": SYSTEM, "tool": TOOL, "orders": ORDERS, "rows": rows}, indent=1, ensure_ascii=False))
    p = [r for r in rows if r["mode"] == "plain"]
    t = [r for r in rows if r["mode"] == "tool"]
    print("plain made_up (auto)", sum(r["made_up_auto"] for r in p), "of 10; tool called", sum(r["called"] for r in t),
          "right (auto)", sum(r["right_auto"] for r in t), "of 10")


if __name__ == "__main__":
    main()
