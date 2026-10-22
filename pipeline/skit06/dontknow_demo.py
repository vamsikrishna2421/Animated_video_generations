# Creative 06 demo (hallucination): a free open model asked about places and events that don't exist, 10 tries each,
# then the same questions with permission to say "I don't know" (Anthropic's hallucination guide: "Allow Claude to say
# 'I don't know'"). Ramulu Tiffins and the 1998 colony final are made up by us; no search, no internet at answer time.
#   tiffin:       "What time does Ramulu Tiffins in Ameerpet, Hyderabad open on Sundays?"
#   tiffin_ok:    the same + "If you're not sure, say \"I don't know\"."
#   cricket:      "Who won the 1998 Ameerpet Colony cricket final, and who was man of the match?"
#   cricket_ok:   the same + the permission line
# Counted per try: a specific clock time given as the answer (made up), and an "I don't know" kind of answer. The
# cricket answers were read by hand (the name pattern also matched phrases like "The Ameerpet"; none named a winner). Qwen2.5-7B-Instruct (Apache 2.0), Qwen's own 4-bit GGUF, llama.cpp on the CPU,
# temperature 0.8, seeds 1-10 (the settings of pipeline/skit04/caption_demo.py). Writes series/scripts/skit06_demo/results.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit06/dontknow_demo.py [prompt keys ...]
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/skit06_demo"
REPO = "Qwen/Qwen2.5-7B-Instruct-GGUF"
OK = " If you're not sure, say \"I don't know\"."
TIFFIN = "What time does Ramulu Tiffins in Ameerpet, Hyderabad open on Sundays?"
CRICKET = "Who won the 1998 Ameerpet Colony cricket final, and who was man of the match?"
PROMPTS = {"tiffin": TIFFIN, "tiffin_ok": TIFFIN + OK, "cricket": CRICKET, "cricket_ok": CRICKET + OK}
TIME = re.compile(r"\b(1[0-2]|0?[1-9])(:[0-5]\d)?\s*(a\.?m\.?|p\.?m\.?)|\b(1[0-2]|0?[1-9]):[0-5]\d\b", re.I)
DONTKNOW = re.compile(r"i don'?t know|i do not know|not sure|don'?t have (specific |any |real-time |access|information)|"
                      r"do not have (specific |any |real-time |access|information)|no (specific |reliable )?information|"
                      r"couldn'?t find|could not find|unable to (find|provide|confirm)|not aware|cannot (confirm|provide)|"
                      r"can'?t (confirm|provide|find)|no record|not (able|available)", re.I)
NAME = re.compile(r"\b[A-Z][a-z]+ (?:[A-Z][a-z]+|XI|Eleven|Warriors|Strikers|Kings|Tigers|Lions|Club)\b")


def judge(key, text):
    t = text.strip()
    idk = bool(DONTKNOW.search(t))
    if key.startswith("tiffin"):
        made_up = bool(TIME.search(t))
    else:
        names = [m for m in NAME.findall(t) if m not in CRICKET]   # not the question's own words ("Ameerpet Colony")
        made_up = bool(names) and not re.search(r"\bfictional|made[- ]up|hypothetical\b", t, re.I)
    return {"made_up": made_up, "idk": idk}


def main(keys):
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    folder = Path(snapshot_download(REPO, allow_patterns=["*q4_k_m*.gguf"]))
    parts = sorted(folder.glob("*q4_k_m*.gguf"))
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_ctx=2048, verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    old = OUT / "results.json"
    res = json.loads(old.read_text()) if old.exists() else {"runs": {}}
    res.update({"model": REPO + " (q4_k_m)", "temperature": 0.8, "tries": 10, "prompts": PROMPTS,
                "note": "Ramulu Tiffins and the 1998 Ameerpet Colony final do not exist; we made them up."})
    for key in keys or PROMPTS:
        rows = []
        for seed in range(1, 11):
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": PROMPTS[key]}], temperature=0.8, max_tokens=140, seed=seed)
            text = out["choices"][0]["message"]["content"]
            r = {"seed": seed, "text": text, "seconds": round(time.time() - t0, 1), **judge(key, text)}
            rows.append(r)
            print(f"{key:10s} {seed:2d} made_up={r['made_up']} idk={r['idk']} | {text[:110]!r}", flush=True)
        res["runs"][key] = {"made_up": sum(r["made_up"] for r in rows), "idk": sum(r["idk"] for r in rows), "rows": rows}
        old.write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print("DEMO_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
