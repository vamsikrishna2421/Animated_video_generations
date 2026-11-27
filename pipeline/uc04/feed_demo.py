# UC04 test (written and committed before it ran): how a video feed picks "recommended for you", and what one video
# does to it. A small recommender built the way Google's YouTube paper describes the first stage (Covington, Adams and
# Sargin, RecSys 2016: each watched video becomes a list of numbers, an embedding; the watch history is averaged into one
# "you" vector; the videos closest to it are the candidates). Ours: the embeddings come from video titles (a small open
# embedding model, sentence-transformers' all-MiniLM-L6-v2 through transformers, mean pooling, as EP53), "closest" =
# cosine similarity, the feed = the 10 closest videos he has not watched. Everything here is made up by us: 12 topics x
# 12 video titles (144), and Ravi's watch history (12 videos: cricket, cooking, devotional, news, comedy).
# The steps (fixed before the run):
#   S0  the feed from his history (how many of 10 are quick-money trading videos?)
#   S1  + 1 trading video a friend sent ("Turn ₹5,000 into ₹50,000 in one week: my trading trick")
#   S2-S6  each step he taps the highest trading video in his feed (curious), if there is one, and we re-rank
#   S7  he removes every trading video from his watch history (YouTube Help: removed videos stop shaping recommendations)
#   S8  then he watches one warning video ("Trading tip scams: how fake gurus take your money"), to stay safe
# Also, for each step, a second way to average: the last 3 videos count 3 times (how much does "recent counts more"
# change it?). And a 2-D map of all videos and of "you" at each step (PCA of the embeddings), for the picture.
# Writes series/scripts/uc04_demo/feed.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc04/feed_demo.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/uc04_demo"
EMB = "sentence-transformers/all-MiniLM-L6-v2"
CAT = {
    "cricket": ["India vs Australia last over thriller: full highlights", "Virat-style cover drive: batting tips for beginners",
                "Top 10 sixes of the season", "IPL auction: who went for the biggest money", "How to bowl a yorker: slow motion",
                "Village cricket tournament final: tennis ball match", "Best catches in cricket history",
                "India women's team wins the series: highlights", "Test match day 5: the great escape",
                "Fastest centuries ever: ranked", "Spin bowling grip explained", "Cricket world cup memories: 2011 final"],
    "cooking": ["Andhra chicken curry: grandma's recipe", "Gongura pachadi in 10 minutes", "Perfect pesarattu at home",
                "Hyderabadi dum biryani step by step", "Tomato pappu for beginners", "Crispy dosa batter secrets",
                "Sambar powder made at home", "Pulihora for festivals", "Egg curry for bachelors", "Mango pickle the traditional way",
                "Rava upma in 5 minutes", "Sweet pongal for Sankranti"],
    "devotional": ["Venkateswara suprabhatam: morning prayer", "Hanuman Chalisa with lyrics", "Tirumala darshan: a full guide",
                   "Shiva bhajans for Monday", "Annamayya keerthanalu collection", "Sai Baba aarti live",
                   "Ayyappa songs for the mandala season", "Lakshmi pooja at home: the steps", "Srisailam temple history",
                   "Vinayaka Chavithi pooja vidhanam", "Bhadrachalam Sri Rama Navami celebrations", "Morning mantras for peace"],
    "news": ["Hyderabad rain: roads flooded, traffic jams", "State budget: what changes for farmers", "Petrol price today in Andhra Pradesh",
             "New metro line opens: the route and fares", "Election results live: counting updates", "School holidays announced for the festival",
             "Heatwave warning for Telangana districts", "Bus fare hike from next month", "Cyclone alert on the coast",
             "Ration card new rules explained", "Gold rate today: up again", "Train timings change from Monday"],
    "comedy": ["Telugu comedy scenes back to back", "Brahmanandam-style hotel comedy: a spoof", "Village panchayat comedy short",
               "Funny wedding moments caught on camera", "Mother vs son: exam results comedy", "Bus conductor comedy sketch",
               "Best Telugu movie comedy 2025", "Pranks on my brother gone wrong", "Office boss comedy short film",
               "Auto driver comedy: the meter is broken", "Comedy skit: the new son-in-law", "Grandfather and the smartphone: funny"],
    "farming": ["Paddy cultivation: the full guide", "Drip irrigation for small farms", "Organic fertiliser at home", "Chilli crop pest control",
                "Dairy farming: profit with 5 cows", "Tractor buying guide for farmers", "Cotton price this season", "Rainfed farming tips",
                "Banana farming: income per acre", "Soil test: why and how", "Poultry farming for beginners", "Turmeric harvest and boiling"],
    "phone": ["Phone battery draining fast? 7 fixes", "How to free up phone storage", "Best phone under 15,000", "WhatsApp hidden features",
              "How to take better photos on any phone", "UPI payment failed: what to do", "Phone hanging? Clear cache like this",
              "How to block spam calls", "Set up a new phone step by step", "Google Pay vs PhonePe: which is better",
              "How to find a lost phone", "Dark mode and eye strain explained"],
    "health": ["Sugar control: what to eat for breakfast", "10-minute yoga for back pain", "How much water should you drink",
               "BP high? Simple habits that help", "Walking 30 minutes a day: what happens", "Knee pain exercises for elders",
               "Good sleep: 5 tips from a doctor", "Healthy tiffin ideas for kids", "Thyroid symptoms you should not ignore",
               "Eye care for screen users", "Ragi java for weight loss", "First aid at home: the basics"],
    "trading": ["Turn ₹5,000 into ₹50,000 in one week: my trading trick", "Earn ₹10,000 a day from options trading",
                "This stock will double next month: buy now", "I quit my job: trading made me rich in 6 months",
                "Secret intraday strategy: 90% profit every day", "Crypto coin that will 100x this year",
                "Free trading tips on Telegram: join now", "How I made ₹1 lakh in one day trading", "Bank nifty option buying: sure-shot profit",
                "Small money to crorepati: my trading journey", "Trading for housewives: earn from home daily", "The one indicator that never fails"],
    "savings": ["Post office savings schemes explained", "Fixed deposit vs recurring deposit", "How to make a family budget",
                "Sukanya Samriddhi: saving for your daughter", "Emergency fund: how much to keep", "PPF account: the full guide",
                "Health insurance for parents: what to check", "How to save money on electricity bills", "Gold savings: coins or jewellery",
                "Credit card mistakes to avoid", "Mutual fund SIP for beginners", "Term insurance explained simply"],
    "study": ["Class 10 maths: important questions", "How to study for exams: a timetable", "English speaking practice for beginners",
              "Science experiments for kids at home", "Telugu grammar made easy", "Government job notification: how to apply",
              "Spoken English: 50 daily sentences", "Class 12 physics in one shot", "Memory tricks for students", "Handwriting improvement tips",
              "Computer basics for beginners", "Group 2 exam preparation plan"],
    "travel": ["Araku valley trip: the full plan", "Goa in 3 days on a budget", "Vizag beaches you must see", "Train journey to Kashi: my experience",
               "Hampi travel guide", "Ooty trip with family", "Best waterfalls near Hyderabad", "Kerala houseboat stay", "Lambasingi: Andhra's Kashmir",
               "Budget hotels in Tirupati", "Gandikota canyon camping", "Bus trip to Srisailam: the route"],
}
HISTORY = ["India vs Australia last over thriller: full highlights", "Top 10 sixes of the season", "Best catches in cricket history",
           "Andhra chicken curry: grandma's recipe", "Gongura pachadi in 10 minutes", "Hyderabadi dum biryani step by step",
           "Venkateswara suprabhatam: morning prayer", "Hanuman Chalisa with lyrics",
           "Hyderabad rain: roads flooded, traffic jams", "Petrol price today in Andhra Pradesh",
           "Telugu comedy scenes back to back", "Auto driver comedy: the meter is broken"]
FRIEND = "Turn ₹5,000 into ₹50,000 in one week: my trading trick"
WARNING = "Trading tip scams: how fake gurus take your money"   # not in the catalogue's feed list; a video he searches for
TAPS = 5


def embedder():
    import torch
    from transformers import AutoModel, AutoTokenizer
    tok, model = AutoTokenizer.from_pretrained(EMB), AutoModel.from_pretrained(EMB)

    def embed(texts):
        out = []
        for i in range(0, len(texts), 32):
            b = tok(texts[i:i + 32], padding=True, truncation=True, max_length=64, return_tensors="pt")
            with torch.no_grad():
                h = model(**b).last_hidden_state
            m = b["attention_mask"].unsqueeze(-1).float()
            v = (h * m).sum(1) / m.sum(1)
            out.append(torch.nn.functional.normalize(v, dim=1))
        return torch.cat(out)
    return embed


def main():
    import torch
    OUT.mkdir(parents=True, exist_ok=True)
    titles = [t for ts in CAT.values() for t in ts] + [WARNING]
    topic = {t: c for c, ts in CAT.items() for t in ts} | {WARNING: "warning"}
    embed = embedder()
    V = embed(titles)
    idx = {t: i for i, t in enumerate(titles)}

    def you(hist, recent=False):
        w = torch.ones(len(hist))
        if recent:
            w[-3:] = 3.0
        u = (V[[idx[h] for h in hist]] * w[:, None]).sum(0) / w.sum()
        return torch.nn.functional.normalize(u, dim=0)

    def feed(hist, recent=False, k=10):
        u = you(hist, recent)
        sims = (V @ u).tolist()
        cand = [i for i in range(len(titles)) if titles[i] not in hist and titles[i] != WARNING]
        top = sorted(cand, key=lambda i: -sims[i])[:k]
        return [{"title": titles[i], "topic": topic[titles[i]], "sim": round(sims[i], 3)} for i in top]

    def step(name, hist, note=""):
        f, fr = feed(hist), feed(hist, recent=True)
        n, nr = sum(x["topic"] == "trading" for x in f), sum(x["topic"] == "trading" for x in fr)
        print(f"{name}: history {len(hist)} ({sum(topic[h] == 'trading' for h in hist)} trading) -> feed trading {n}/10, recent-weighted {nr}/10  {note}")
        for x in f:
            print("    ", x["sim"], x["topic"], "|", x["title"])
        return {"step": name, "note": note, "history": list(hist), "history_trading": sum(topic[h] == "trading" for h in hist),
                "feed": f, "trading_in_feed": n, "feed_recent": fr, "trading_in_feed_recent": nr, "you": you(hist).tolist()}

    steps = []
    hist = list(HISTORY)
    steps.append(step("S0", hist, "his history"))
    hist.append(FRIEND)
    steps.append(step("S1", hist, "+ the video a friend sent"))
    for k in range(TAPS):
        f = feed(hist)
        tr = [x for x in f if x["topic"] == "trading"]
        if not tr:
            steps.append(step(f"S{k + 2}", hist, "no trading video in the feed to tap"))
            break
        hist.append(tr[0]["title"])
        steps.append(step(f"S{k + 2}", hist, f"taps: {tr[0]['title']}"))
    clean = [h for h in hist if topic[h] != "trading"]
    steps.append(step("S7", clean, "removes every trading video from his watch history"))
    steps.append(step("S8", clean + [WARNING], "+ watches the warning video"))

    # the 2-D map (PCA of all video vectors; "you" projected the same way)
    X = V - V.mean(0)
    _, _, Vt = torch.linalg.svd(X, full_matrices=False)
    P = Vt[:2]
    pts = (X @ P.T).tolist()
    mp = {"videos": [{"title": t, "topic": topic[t], "x": round(p[0], 4), "y": round(p[1], 4)} for t, p in zip(titles, pts)],
          "you": [{"step": s["step"], "xy": [round(v, 4) for v in ((torch.tensor(s["you"]) - V.mean(0)) @ P.T).tolist()]} for s in steps]}
    for s in steps:
        s.pop("you")
    (OUT / "feed.json").write_text(json.dumps({"model": EMB, "catalogue": CAT, "warning": WARNING, "steps": steps, "map": mp},
                                              indent=1, ensure_ascii=False))
    print("DONE")


if __name__ == "__main__":
    main()
