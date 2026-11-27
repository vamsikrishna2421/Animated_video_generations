# UC04 test 3 (written and committed before it ran, after feed_demo.py and feed_demo2.py). Tests 1-2 ranked the HOME
# feed from the whole watch history ("you" = the average): one trading video changed nothing (0/10), and even 6 taps
# kept the feed at 1-3 of 10 trading. YouTube's own page describes a second list: Up next "suggests additional content
# based on what you're currently watching". So test 3 ranks Up next by closeness to the ONE video playing now (the same
# catalogue, history, embedding model and friend's video as test 1):
#   U1  Up next while the friend's video plays: the 10 closest videos he has not watched. How many are trading?
#   U2  autoplay: the top Up next plays, then the top Up next of that one, 10 times. How many of the 10 are trading?
#   U3  his home feed after the 10 autoplays (test 1's average, and test 2's "last 3 count 3 times")
#   U4  he removes every trading video from his watch history: the home feed again
#   U5  Up next while the warning video plays ("Trading tip scams: how fake gurus take your money")
# Writes series/scripts/uc04_demo/feed3.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc04/feed_demo3.py
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/uc04_demo"
spec = importlib.util.spec_from_file_location("uc04_feed1", Path(__file__).with_name("feed_demo.py"))
d1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d1)
PLAYS = 10


def main():
    import torch
    titles = [t for ts in d1.CAT.values() for t in ts] + [d1.WARNING]
    topic = {t: c for c, ts in d1.CAT.items() for t in ts} | {d1.WARNING: "warning"}
    V = d1.embedder()(titles)
    idx = {t: i for i, t in enumerate(titles)}

    def ranked(vec, seen, k=10):
        sims = (V @ vec).tolist()
        cand = [i for i in range(len(titles)) if titles[i] not in seen and titles[i] != d1.WARNING]
        top = sorted(cand, key=lambda i: -sims[i])[:k]
        return [{"title": titles[i], "topic": topic[titles[i]], "sim": round(sims[i], 3)} for i in top]

    def home(hist, recent=False):
        w = torch.ones(len(hist))
        if recent:
            w[-3:] = 3.0
        u = (V[[idx[h] for h in hist]] * w[:, None]).sum(0) / w.sum()
        return ranked(torch.nn.functional.normalize(u, dim=0), hist)

    def upnext(now, hist):
        return ranked(V[idx[now]], set(hist) | {now})

    def tr(lst):
        return sum(x["topic"] == "trading" for x in lst)

    def show(name, lst, note):
        print(f"{name}: trading {tr(lst)}/10  {note}")
        for x in lst:
            print("    ", x["sim"], x["topic"], "|", x["title"])

    out = {"model": d1.EMB}
    hist = list(d1.HISTORY) + [d1.FRIEND]
    u1 = upnext(d1.FRIEND, hist)
    show("U1", u1, "Up next while the friend's video plays")
    out["U1"] = {"up_next": u1, "trading": tr(u1)}
    played, now = [], d1.FRIEND
    for _ in range(PLAYS):
        nxt = upnext(now, hist)[0]
        played.append(nxt)
        hist.append(nxt["title"])
        now = nxt["title"]
    print(f"U2: autoplay {PLAYS}: trading {tr(played)}/{PLAYS}")
    for x in played:
        print("    ", x["sim"], x["topic"], "|", x["title"])
    out["U2"] = {"played": played, "trading": tr(played)}
    h3, h3r = home(hist), home(hist, recent=True)
    show("U3", h3, f"home feed after the autoplays (average); history {len(hist)}, trading {sum(topic[h] == 'trading' for h in hist)}")
    show("U3r", h3r, "home feed after the autoplays (last 3 count 3 times)")
    out["U3"] = {"history": hist, "home": h3, "trading": tr(h3), "home_recent": h3r, "trading_recent": tr(h3r)}
    clean = [h for h in hist if topic[h] != "trading"]
    h4, h4r = home(clean), home(clean, recent=True)
    show("U4", h4, "home feed after removing every trading video from his history (average)")
    show("U4r", h4r, "the same, last 3 count 3 times")
    out["U4"] = {"history": clean, "home": h4, "trading": tr(h4), "home_recent": h4r, "trading_recent": tr(h4r)}
    u5 = upnext(d1.WARNING, clean)
    show("U5", u5, "Up next while the warning video plays")
    out["U5"] = {"up_next": u5, "trading": tr(u5)}
    (OUT / "feed3.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print("DONE")


if __name__ == "__main__":
    main()
