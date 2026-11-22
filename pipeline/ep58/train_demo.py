# EP58 test: the ML engineer's task, done on this machine. Train a scam-SMS filter on the UCI SMS Spam Collection
# (5,574 real SMS, labelled spam / ham; UK messages, about 2012), test it on the 20% it never saw, time it, and count the
# two kinds of mistakes. Then try it on 6 Indian-style messages we wrote (made up, not real numbers or links): does a
# model trained on old UK texts catch a KYC or parcel scam? Results: series/scripts/ep58_demo/train.json.
#   python3 pipeline/ep58/train_demo.py /tmp/claude-0/c58data/SMSSpamCollection
import json
import sys
import time
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep58_demo"
OURS = [   # made up by us; (message, what it really is)
    ("Dear customer, your KYC is pending. Update today or your bank account will be blocked: bit.ly/xyz", "spam"),
    ("Your parcel is on hold at our warehouse. Pay Rs 25 now to release it: link", "spam"),
    ("Congratulations! You have won Rs 25,00,000 in the lucky draw. Call now to claim", "spam"),
    ("482910 is your OTP to log in. Do not share it with anyone.", "ham"),
    ("Your electricity bill of Rs 1,240 is due on 25 Nov. Pay on the app to avoid a late fee.", "ham"),
    ("Amma, I reached the hostel. Will call you after dinner.", "ham"),
]


def main(path):
    rows = [line.rstrip("\n").split("\t", 1) for line in Path(path).read_text(encoding="utf-8", errors="replace").splitlines() if "\t" in line]
    y = [1 if lab == "spam" else 0 for lab, _ in rows]
    X = [txt for _, txt in rows]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=58, stratify=y)
    t = time.time()
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
    clf = LogisticRegression(max_iter=1000, C=10)
    clf.fit(vec.fit_transform(Xtr), ytr)
    secs = time.time() - t
    pred = clf.predict(vec.transform(Xte))
    tp = sum(1 for p, g in zip(pred, yte) if p == 1 and g == 1)
    fn = sum(1 for p, g in zip(pred, yte) if p == 0 and g == 1)
    fp = sum(1 for p, g in zip(pred, yte) if p == 1 and g == 0)
    tn = sum(1 for p, g in zip(pred, yte) if p == 0 and g == 0)
    ours = []
    for msg, truth in OURS:
        pr = float(clf.predict_proba(vec.transform([msg]))[0][1])
        ours.append({"message": msg, "truth": truth, "spam_probability": round(pr, 3), "called": "spam" if pr >= 0.5 else "ham"})
    res = {"messages": len(X), "spam": sum(y), "train": len(Xtr), "test": len(Xte), "train_seconds": round(secs, 2),
           "test_right": tp + tn, "accuracy": round((tp + tn) / len(Xte), 4), "spam_in_test": tp + fn, "spam_caught": tp,
           "spam_missed": fn, "genuine_in_test": tn + fp, "genuine_flagged": fp, "ours": ours}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "train.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps(res, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1])
