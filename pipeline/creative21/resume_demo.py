# Creative 21 demo, ".NET vs dotnet" (written and committed before it ran): a resume screen that wants the must-have
# skill ".NET". Two screens read the same 25 skills lines:
#   keyword : the exact keyword filter many hiring pipelines start with: the line passes if it contains ".NET" exactly
#             (case-sensitive substring, as a plain `".NET" in text`); code, no AI, computed exactly
#   ai      : a small free AI asked to read the line for meaning (Qwen2.5 7B, offline), 3 tries each
# 20 lines are real .NET skills written the ways developers write them; 5 are NOT .NET experience but contain the
# letters (or not). Scored, as fixed before the run: a real line REJECTED is a good developer lost; a not-.NET line
# PASSED is a wrong fit let in. The AI's reply is YES or NO (anything else read by hand; HAND below wins), every reply
# read by hand, the hand read written into the result file.
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct, llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, max 8 tokens, a fresh chat each time, generated offline (EP38's check).
# Writes series/scripts/creative21_demo/screen_7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative21/resume_demo.py run <model folder>
#   python3 pipeline/creative21/resume_demo.py --summary
import importlib.util
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative21_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
REAL = [   # real .NET experience, written 20 ways
    ".NET", "dotnet", "DotNet", "DOTNET", ".Net", "dot net", "ASP.NET Core", "C# / .NET 8", ".NET Framework 4.8",
    "VB.NET", "Dotnet Core", "NET 6", "ASP.NET MVC, Entity Framework", "Blazor (.NET)", "C#, dotnet CLI",
    "Microsoft .NET", ".NET MAUI", "dot-net", "DotNet 7", "ASP.Net Web API"]
NOT = [   # not .NET experience
    "Not familiar with .NET", "Java, Spring Boot (no .NET)", "Python, Django", "Want to learn .NET next year",
    "Network engineer (CCNA)"]
LINES = [(f"r{i + 1:02d}", t, True) for i, t in enumerate(REAL)] + [(f"n{i + 1:02d}", t, False) for i, t in enumerate(NOT)]
TRIES = 3
ASK = ("A job needs this must-have skill: .NET (Microsoft's software development platform). Here is the skills line from "
       "a candidate's resume: \"{line}\". Does this candidate have .NET experience? Answer with just YES or NO.")
HAND = {}  # (id, try): "YES" / "NO" for replies that aren't a plain YES or NO


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def keyword(line):
    return ".NET" in line


def verdict(reply):
    r = reply.strip().upper().rstrip(".!")
    return r if r in ("YES", "NO") else None


def offline_run(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=1024, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "screen_7B.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 8 tokens",
        "ask": ASK, "rows": []}
    done = {(r["id"], r["try"]) for r in res["rows"]}
    for lid, line, real in LINES:
        for n in range(1, TRIES + 1):
            if (lid, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": ASK.format(line=line)}], temperature=0.7, top_p=0.9,
                                             max_tokens=8, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"id": lid, "line": line, "real": real, "try": n, "reply": reply, "keyword_pass": keyword(line),
                                "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(lid, n, line, "->", reply, flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "screen_7B.json").read_text())
    for r in res["rows"]:
        r["hand"] = HAND.get((r["id"], r["try"]), verdict(r["reply"]))
    (OUT / "screen_7B.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    kw_rej = [t for _, t, real in LINES if real and not keyword(t)]
    kw_in = [t for _, t, real in LINES if not real and keyword(t)]
    print(f"keyword: real .NET lines rejected {len(kw_rej)}/{len(REAL)} {kw_rej}; not-.NET lines passed {len(kw_in)}/{len(NOT)} {kw_in}")
    rows = res["rows"]
    real_no = [r for r in rows if r["real"] and r["hand"] == "NO"]
    not_yes = [r for r in rows if not r["real"] and r["hand"] == "YES"]
    print(f"ai: real lines answered NO {len(real_no)}/{sum(1 for r in rows if r['real'])} {[(r['line'], r['try']) for r in real_no]}")
    print(f"ai: not-.NET lines answered YES {len(not_yes)}/{sum(1 for r in rows if not r['real'])} {[(r['line'], r['try']) for r in not_yes]}")
    lost = sorted({r["line"] for r in real_no})
    print("ai: real lines rejected at least once:", len(lost), lost)


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
