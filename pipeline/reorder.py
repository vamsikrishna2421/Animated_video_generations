"""Upload order + first-second hooks + 'Next' links for everything not yet posted.

Serials: series/upload_order.json lists every upload in posting order (serial = index + 1).
Items up to `posted_through` are already on Instagram. Run after editing the order:
    python3 pipeline/reorder.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from captions_data import POSTS  # noqa: E402

POSTED = [f"ep{i:02d}" for i in range(0, 23)]
EPS = [f"ep{i:02d}" for i in range(23, 59)]
QUIZ_AFTER = {"ep30": "q03", "ep40": "q04", "ep49": "q05", "ep58": "q06"}
UCS = [f"uc{i:02d}" for i in range(1, 25)]
ORDER = POSTED + [x for e in EPS for x in ([e] + ([QUIZ_AFTER[e]] if e in QUIZ_AFTER else []))] + UCS

HOOKS = {
    "ep23": "How AI *fixes its own mistakes*", "ep24": "3 ways machines learn, *just like kids*",
    "ep25": "*Bad data* makes dumb AI", "ep26": "Memorising is *not* learning. Even for AI.",
    "ep27": "The *one idea* behind ChatGPT", "ep28": "What's *inside* ChatGPT's brain?",
    "ep29": "How AI *sees* a photo", "ep30": "Raw AI is *rude*. So who fixed it?",
    "ep31": "Train your own AI on *one GPU*", "ep32": "How AI finds *1 line* in 1,000 pages",
    "ep33": "Your RAG bot is *failing*. Here's why.", "ep34": "*Free* AI vs *paid* AI",
    "ep35": "A ChatGPT that *fits in your phone*", "ep36": "Why AI needs *gaming chips*",
    "ep37": "Shrink a *140 GB* AI to 35 GB", "ep38": "Run AI *free*, on your laptop",
    "ep39": "Every AI reply *costs money*. Who pays?", "ep40": "Can you trust *AI launch charts*?",
    "ep41": "Stop using the *biggest* AI model", "ep42": "Why AI thinks *doctors are men*",
    "ep43": "Tell AI to win. *It cheats.*", "ep44": "Stop pasting *this* into ChatGPT",
    "ep45": "That call from your cousin? *AI.*", "ep46": "Who *owns* AI art?",
    "ep47": "How companies stop AI *going rogue*", "ep48": "Who makes the *rules* for AI?",
    "ep49": "Will AI *take your job*?", "ep50": "Talk to AI in *10 lines* of code",
    "ep51": "Build your own ChatGPT in *13 lines*", "ep52": "Chat with *any PDF*", "ep53": "Your PDF now *answers back*",
    "ep54": "Give your AI *real superpowers*", "ep55": "Plug your tools into *any AI*",
    "ep56": "Build your own *talking AI*", "ep57": "Put your AI app *online, free*", "ep58": "How to get an *AI job*",
    "q03": "Can you get *6/6*?", "q04": "Can you get *6/6*?", "q05": "Can you get *6/6*?", "q06": "Can you get *6/6*?",
    "uc01": "This clinic receptionist *is AI*", "uc02": "How ChatGPT knows *today's news*",
    "uc03": "1-hour meeting. *Notes in seconds.*", "uc04": "How YouTube *reads your mind*",
    "uc05": "*Erase anyone* from a photo", "uc06": "Your bank's *2 AM* support agent",
    "uc07": "How your phone *guesses your reply*", "uc08": "Speak Telugu. *They hear Japanese.*",
    "uc09": "Watch AI *build a feature*", "uc10": "Why you *can't stop* scrolling Reels",
    "uc11": "Point your camera. *Get answers.*", "uc12": "An AI tutor that *won't give answers*",
    "uc13": "A full song from *one sentence*", "uc14": "How banks catch fraud *in milliseconds*",
    "uc15": "How apps know *'32 minutes'*", "uc16": "Why your cab costs more *in rain*",
    "uc17": "How your phone knows *it's you*", "uc18": "How self-driving cars *see*",
    "uc19": "KYC in *seconds*. How?", "uc20": "A plant doctor *in your pocket*",
    "uc21": "Is your phone *always listening*?", "uc22": "A *bot* rejected your CV",
    "uc23": "AI reading *X-rays*", "uc24": "Can AI catch *AI fakes*?",
}

# Spoken 'Next' line and end-card label for each item, by what follows it.
EP_NEXT = {
    "ep24": ("Next, we'll learn the three ways machines learn, supervised, unsupervised and reinforcement.", "EP 24 · Types of learning"),
    "ep25": ("Next, we'll learn why data is the real fuel of AI.", "EP 25 · Training data"),
    "ep26": ("Next, we'll learn the difference between a model that memorises, and one that truly understands.", "EP 26 · Overfitting"),
    "ep27": ("Next, the idea that changed AI forever, transformers and attention, part one.", "EP 27 · Transformers, Part 1"),
    "ep30": ("Next, we'll learn how AI learns good manners, with human feedback.", "EP 30 · RLHF"),
}
UC_SPOKEN = {
    "uc01": "how an AI phone call assistant works", "uc02": "how ChatGPT searches the web", "uc03": "how AI meeting notes work",
    "uc04": "how Netflix and YouTube recommend videos", "uc05": "how magic eraser works", "uc06": "how a bank support bot works",
    "uc07": "how smart replies work", "uc08": "how live translation works", "uc09": "how an AI coding assistant builds a feature",
    "uc10": "how the Instagram Reels feed works", "uc11": "how Google Lens works", "uc12": "how AI tutor apps work",
    "uc13": "how AI creates music", "uc14": "how UPI and card fraud detection works", "uc15": "how delivery apps predict arrival time",
    "uc16": "how ride apps set arrival times and surge prices", "uc17": "how face unlock works", "uc18": "how self driving cars see the road",
    "uc19": "how KYC document scanning works", "uc20": "how crop disease detection apps work", "uc21": "how wake words like, hey Siri, work",
    "uc22": "how resume screening software works", "uc23": "how AI helps doctors read X-rays", "uc24": "how deepfake detection works",
}
UC_LABEL = {
    "uc01": "Phone assistants", "uc02": "ChatGPT web search", "uc03": "Meeting notes", "uc04": "Recommendations", "uc05": "Magic eraser",
    "uc06": "Bank support bot", "uc07": "Smart replies", "uc08": "Live translation", "uc09": "AI coding", "uc10": "Reels feed",
    "uc11": "Google Lens", "uc12": "AI tutors", "uc13": "AI music", "uc14": "Fraud detection", "uc15": "Delivery ETA", "uc16": "Ride surge",
    "uc17": "Face unlock", "uc18": "Self-driving cars", "uc19": "KYC scanning", "uc20": "Crop doctor", "uc21": "Wake words",
    "uc22": "Resume screening", "uc23": "X-rays", "uc24": "Deepfake detection",
}


def next_for(i: str):
    """(spoken sentence, end-card label, caption line) for the item that follows i in the story."""
    if i.startswith("ep"):
        n = int(i[2:])
        if n == 58:
            return ("Next, a brand new series, real world AI, starting with " + UC_SPOKEN["uc01"] + ".",
                    "REAL WORLD AI · Use cases", "Next: Real World AI, how AI powers the apps you use every day.")
        nxt = f"ep{n + 1:02d}"
        if nxt in EP_NEXT:
            s, lab = EP_NEXT[nxt]
            return s, lab, "Next: " + s.split("Next, ", 1)[1].replace("we'll learn ", "").rstrip(".") + "."
        return None
    n = int(i[2:])
    if n == 24:
        return ("More real world breakdowns are coming.", "More coming · Stay tuned", "More real world breakdowns coming soon.")
    nxt = f"uc{n + 1:02d}"
    return (f"Next, use case {n + 1}, {UC_SPOKEN[nxt]}.", f"USE CASE {n + 1} · {UC_LABEL[nxt]}", f"Next: {UC_SPOKEN[nxt][0].upper() + UC_SPOKEN[nxt][1:]}.")


def main() -> None:
    posted_through = len(POSTED)
    (ROOT / "series" / "upload_order.json").write_text(json.dumps({"posted_through": posted_through, "order": ORDER}, indent=1) + "\n")
    for i in ORDER[posted_through:]:
        p = ROOT / "episodes" / f"{i}.json"
        d = json.loads(p.read_text())
        d["scenes"][0]["data"]["hook"] = HOOKS[i]
        nx = next_for(i) if not i.startswith("q") else None
        if nx:
            spoken, label, cap = nx
            r = d["scenes"][-1]
            t = r["text"]
            # Replace the 'Next ...' sentence (or uc01's 'Which app...' ask) that precedes the follow line.
            t2 = re.sub(r"(\[\d+\] )(Next,[^\[]*?|Which app should I break down next\? Comment below, and |Thank you for learning AI from scratch with us! More real world breakdowns, and AI news, are coming\. |More real world breakdowns are coming\. )(Follow AI Maastaaru!|follow AI Maastaaru!)",
                        lambda m: m.group(1) + spoken + " Follow AI Maastaaru!" if i != "ep58" else m.group(1) + "Thank you for learning AI from scratch with us! " + spoken + " Follow AI Maastaaru!", t)
            assert t2 != t or spoken in t, (i, t[-200:])
            r["text"] = t2
            r["data"]["next"] = label
            post = d.get("post") or dict(POSTS[i])
            lines = post["caption"].split("\n")
            idx = [k for k, l in enumerate(lines) if l.startswith(("Next:", "Next episode", "More real world"))]
            if idx:
                lines[idx[-1]] = cap
            else:
                lines.insert(len(lines) - 1, cap)
            post["caption"] = "\n".join(lines)
            d["post"] = post
        p.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n")
    print(len(ORDER), "uploads;", len(ORDER) - posted_through, "to go")


if __name__ == "__main__":
    main()
