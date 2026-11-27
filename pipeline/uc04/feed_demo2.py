# UC04 test 2 (written and committed before it ran, after feed_demo.py). Test 1 averaged the whole watch history the
# way Google's 2016 YouTube paper describes: one trading video in 13 changed nothing (0/10 in the feed), so there was
# nothing to tap. Test 1's second way, "the last 3 videos count 3 times", put 2 of 10 trading videos in the feed.
# Netflix's help page says recent viewing outweighs older viewing ("the titles you engage with more recently will
# outweigh titles you engaged with in the past"). So test 2 runs the same steps on that feed (the same rule, no new
# weights): the same catalogue, history, embedding model and friend's video as test 1.
#   T1  + the friend's video
#   T2-T6  each step he taps the highest trading video in his feed, if there is one
#   T7  he removes every trading video from his watch history
#   T8  instead of T7: he keeps the history and watches 3 videos he wants (cricket, cooking, devotional, not yet watched)
#   T9  after T7: he watches the warning video ("Trading tip scams: how fake gurus take your money")
# Writes series/scripts/uc04_demo/feed2.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc04/feed_demo2.py
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/uc04_demo"
spec = importlib.util.spec_from_file_location("uc04_feed1", Path(__file__).with_name("feed_demo.py"))
d1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d1)
TAPS = 5
WANT = ["India women's team wins the series: highlights", "Sweet pongal for Sankranti", "Tirumala darshan: a full guide"]


def main():
    import torch
    titles = [t for ts in d1.CAT.values() for t in ts] + [d1.WARNING]
    topic = {t: c for c, ts in d1.CAT.items() for t in ts} | {d1.WARNING: "warning"}
    V = d1.embedder()(titles)
    idx = {t: i for i, t in enumerate(titles)}

    def you(hist):
        w = torch.ones(len(hist))
        w[-3:] = 3.0
        u = (V[[idx[h] for h in hist]] * w[:, None]).sum(0) / w.sum()
        return torch.nn.functional.normalize(u, dim=0)

    def feed(hist, k=10):
        sims = (V @ you(hist)).tolist()
        cand = [i for i in range(len(titles)) if titles[i] not in hist and titles[i] != d1.WARNING]
        top = sorted(cand, key=lambda i: -sims[i])[:k]
        return [{"title": titles[i], "topic": topic[titles[i]], "sim": round(sims[i], 3)} for i in top]

    def step(name, hist, note=""):
        f = feed(hist)
        n = sum(x["topic"] == "trading" for x in f)
        money = sum(x["topic"] in ("trading", "savings") for x in f)
        print(f"{name}: history {len(hist)} ({sum(topic[h] == 'trading' for h in hist)} trading) -> feed trading {n}/10 (money {money})  {note}")
        for x in f:
            print("    ", x["sim"], x["topic"], "|", x["title"])
        return {"step": name, "note": note, "history": list(hist), "history_trading": sum(topic[h] == "trading" for h in hist),
                "feed": f, "trading_in_feed": n, "you": you(hist)}

    steps = [step("T0", list(d1.HISTORY), "his history")]
    hist = list(d1.HISTORY) + [d1.FRIEND]
    steps.append(step("T1", hist, "+ the video a friend sent"))
    for k in range(TAPS):
        tr = [x for x in feed(hist) if x["topic"] == "trading"]
        if not tr:
            steps.append(step(f"T{k + 2}", hist, "no trading video in the feed to tap"))
            break
        hist.append(tr[0]["title"])
        steps.append(step(f"T{k + 2}", hist, f"taps: {tr[0]['title']}"))
    tapped = list(hist)
    clean = [h for h in tapped if topic[h] != "trading"]
    steps.append(step("T7", clean, "removes every trading video from his watch history"))
    steps.append(step("T8", tapped + WANT, "keeps the history, watches 3 videos he wants"))
    steps.append(step("T9", clean + [d1.WARNING], "after T7, watches the warning video"))

    X = V - V.mean(0)
    _, _, Vt = torch.linalg.svd(X, full_matrices=False)
    P = Vt[:2]
    pts = (X @ P.T).tolist()
    mp = {"videos": [{"title": t, "topic": topic[t], "x": round(p[0], 4), "y": round(p[1], 4)} for t, p in zip(titles, pts)],
          "you": [{"step": s["step"], "xy": [round(v, 4) for v in ((s["you"] - V.mean(0)) @ P.T).tolist()]} for s in steps]}
    for s in steps:
        s.pop("you")
    (OUT / "feed2.json").write_text(json.dumps({"model": d1.EMB, "weights": "the last 3 videos count 3 times", "steps": steps, "map": mp},
                                               indent=1, ensure_ascii=False))
    print("DONE")


if __name__ == "__main__":
    main()
