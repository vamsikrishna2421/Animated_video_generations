# EP40 demo (benchmarks & evaluations: how models are compared). The makers' charts score their brains on famous public
# exams; GSM8K (OpenAI, 2021, MIT licence: grade-school maths word problems, 1,319 test questions, online since 2021) is
# the maths one on Qwen2.5's own chart. What does that score say about a shop? Two tests on the brains Ravi anna's shop
# already ran (EP38's files: Qwen's own 4-bit GGUF, q4_k_m, llama.cpp, 4 threads, greedy, offline):
#   famous  : the first 30 questions of GSM8K's test set, word for word
#   changed : the same 30 with only the names and numbers changed (new answers worked out by us, `CHANGED` below),
#             the way Apple's GSM-Symbolic study (2024) re-wrote GSM8K
# Each reply is solved step by step and ends "Answer: <number>"; the number is read by `answer()` and every reply is
# also read by hand (`HAND` overrides, with the reason). EP38's bill test (EP34's 20 orders against the 15-line price
# board) is the shop's own exam: those scores come from series/scripts/ep38_demo/.
# Rows save one by one; a re-run skips the done ones. Writes series/scripts/ep40_demo/<size>.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep40/bench_demo.py 1.5B 3B 7B
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep40_demo"
GSM8K = OUT / "gsm8k_test_first30.jsonl"   # github.com/openai/grade-school-math, data/test.jsonl, lines 1-30 (MIT)
REPOS = {"1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "3B": "Qwen/Qwen2.5-3B-Instruct-GGUF",
         "7B": "Qwen/Qwen2.5-7B-Instruct-GGUF"}
PATTERN = "*q4_k_m*.gguf"
ASK = "\nSolve it step by step, then write the final answer on its own line as: Answer: <number>"

# The same 30 questions, only names and numbers changed (the wording, units and typos kept), with the new answers.
CHANGED = [
    ("Lakshmi’s ducks lay 22 eggs per day. She eats five for breakfast every morning and bakes muffins for her friends every day with three. She sells the remainder at the farmers' market daily for $3 per fresh duck egg. How much in dollars does she make every day at the farmers' market?", (22 - 5 - 3) * 3),
    ("A robe takes 4 bolts of blue fiber and half that much white fiber.  How many bolts in total does it take?", 4 + 2),
    ("Suresh decides to try flipping a house.  He buys a house for $60,000 and then puts in $40,000 in repairs.  This increased the value of the house by 120%.  How much profit did he make?", 60000 * 2.2 - 100000),
    ("Ravi decides to run 4 sprints 5 times a week.  He runs 50 meters each sprint.  How many total meters does he run a week?", 4 * 5 * 50),
    ("Every day, Kavya feeds each of her chickens four cups of mixed chicken feed, containing seeds, mealworms and vegetables to help keep them healthy.  She gives the chickens their feed in three separate meals. In the morning, she gives her flock of chickens 30 cups of feed.  In the afternoon, she gives her chickens another 25 cups of feed.  How many cups of feed does she need to give her chickens in the final meal of the day if the size of Kavya's flock is 25 chickens?", 25 * 4 - 30 - 25),
    ("Arjun went to the store to buy glasses for his new apartment. One glass costs $8, but every second glass costs only 50% of the price. Arjun wants to buy 12 glasses. How much does he need to pay for them?", 6 * 8 + 6 * 4),
    ("Nellore has three times as many sheep as Guntur. Guntur has 5 times as many sheep as Ongole. How many sheep do Nellore, Guntur, and Ongole have together if Ongole has 12 sheep?", 12 + 60 + 180),
    ("Priya is downloading a 300 GB file. Normally she can download 3 GB/minute, but 60% of the way through the download, Windows forces a restart to install updates, which takes 15 minutes. Then Priya has to restart the download from the beginning. How load does it take to download the file?", 180 / 3 + 15 + 300 / 3),
    ("Kiran drives for 2 hours at a speed of 70 mph and then turns around because he realizes he forgot something very important at home.  He tries to get home in 4 hours but spends the first 2 hours in standstill traffic.  He spends the next half-hour driving at a speed of 40mph, before being able to drive the remaining time of the 4 hours going at 60 mph.  How far is he from home at the end of those 4 hours?", 140 - (0.5 * 40 + 1.5 * 60)),
    ("Meena's rate per hour for the first 40 hours she works each week is $12. She also receives an overtime pay of 1.5 times her regular hourly rate. If Meena worked for 50 hours this week, how much are her earnings for this week?", 40 * 12 + 10 * 18),
    ("A new program had 80 downloads in the first month. The number of downloads in the second month was twice as many as the downloads in the first month, but then reduced by 25% in the third month. How many downloads did the program have total over the three months?", 80 + 160 + 120),
    ("Sravani went to the bakery and bought various types of pastries. She bought 2 dozen donuts which cost $45 per dozen, 3 dozen mini cupcakes which cost $60 per dozen, and 4 dozen mini cheesecakes for $35 per dozen. How much was the total cost?", 2 * 45 + 3 * 60 + 4 * 35),
    ("Venkat is planting a lemon tree. The tree will cost $60 to plant. Each year it will grow 8 lemons, which he can sell for $1.5 each. It costs $2 a year to water and feed the tree. How many years will it take before he starts earning money on the lemon tree?", 60 / (8 * 1.5 - 2) + 1),
    ("Anjali is a door-to-door saleswoman. She sold a third of her vacuum cleaners at the green house, 4 more to the red house, and half of what was left at the orange house. If Anjali has 6 vacuum cleaners left, how many did she start with?", 24),
    ("In a dance class of 40 students, 30% enrolled in contemporary dance, 50% of the remaining enrolled in jazz dance, and the rest enrolled in hip-hop dance. What percentage of the entire students enrolled in hip-hop dance?", (40 - 12 - 14) / 40 * 100),
    ("A merchant wants to make a choice of purchase between 2 purchase plans: jewelry worth $4,000 or electronic gadgets worth $6,000. His financial advisor speculates that the jewelry market will go up 3% while the electronic gadgets market will rise 1.5% within the same month. If the merchant is looking to maximize profit at the end of this month by making a choice, how much profit would this be?", max(4000 * 0.03, 6000 * 0.015)),
    ("Two trains leave Vijayawada at the same time. They begin traveling westward, both traveling for 90 miles. The next day, they travel northwards, covering 120 miles. What's the distance covered by each train in the two days?", 90 + 120),
    ("Lalitha gets paid $25 per hour to teach and $40 to be a cheerleading coach. If she works 48 weeks a year, 30 hours a week as a teacher and 10 hours a week as a coach, what's her annual salary?", 48 * (30 * 25 + 10 * 40)),
    ("Swathi makes a 4 egg omelet every morning for breakfast.  How many dozens of eggs will she eat in 6 weeks?", 4 * 42 / 12),
    ("Harini is hiking a 20-mile trail. She took 1 hour to walk the first 4 miles, then another hour to walk the next two miles. If she wants her average speed to be 5 miles per hour, what speed (in miles per hour) does she need to walk the remaining distance?", (20 - 6) / (20 / 5 - 2)),
    ("I have 12 liters of orange drink that are two-thirds water and I wish to add it to 20 liters of pineapple drink that is three-fifths water. But as I pour it, I spill three liters of the orange drink. How much water is in the remaining 29 liters?", 9 * 2 / 3 + 20 * 3 / 5),
    ("Rahul and Divya are cousins. Rahul was born 4 years before Divya. Rahul had a son at the age of 26. If Divya is now 35, how many years ago was Rahul's son born?", 35 + 4 - 26),
    ("Mahesh sells DVDs. He has 9 customers on Tuesday. His first 4 customers buy one DVD each.  His next 3 customers buy 2 DVDs each.  His last 2 customers don't buy any DVDs. How many DVDs did Mahesh sell on Tuesday?", 4 + 3 * 2),
    ("A candle melts by 3 centimeters every hour that it burns. How many centimeters shorter will a candle be after burning from 2:00 PM to 7:00 PM?", 3 * 5),
    ("Srinu bought last year's best-selling book for $18.00. This is with a 40% discount from the original price. What was the original price of the book?", 18 / 0.6),
    ("Padma ordered one chicken meal that costs $10, 4 packs of milk that costs $2 each, 6 apples that cost $1.50 each, and some boxes of pizza. Padma paid a total of $57. How many boxes of pizza did Padma order if each box costs $7.50?", (57 - 10 - 8 - 9) / 7.5),
    ("Ramya bought 2 pairs of shorts, 4 pairs of pants, and 2 pairs of shoes. One pair of shorts costs $14.50. One pair of pants costs $20.50 and one pair of shoes costs $38. How many dollars did Ramya spend on all the clothing items?", 2 * 14.5 + 4 * 20.5 + 2 * 38),
    ("Deepika eats one serving of ice cream every night.  She buys cartons of ice cream with 12 servings of ice cream per carton at a cost of $5.00 per carton.  After 72 days, how much will she spend on ice cream?", 72 / 12 * 5),
    ("Naresh made two stops during his 80-mile bike trip. He first stopped after 25 miles. His second stop was 20 miles before the end of the trip. How many miles did he travel between his first and second stops?", 80 - 20 - 25),
    ("Geetha is shoe shopping when she comes across a pair of boots that fit her shoe budget. However, she has to choose between the boots and two pairs of high heels that together cost seven dollars less than the boots. If one pair of heels costs $28 and the other costs twice as much, how many dollars are the boots?", 28 + 56 + 7),
]
# Hand reading of every reply: (size, test, index) -> (counts as right, why), where the regex got it wrong.
HAND = {
    ("1.5B", "famous", 23): (False, "final answer 'L - 8 centimeters shorter' (and '92 cm shorter'): the regex caught the 8"),
    ("1.5B", "changed", 23): (False, "final answer 'L - 15 centimeters shorter' (and '85 cm shorter'): the regex caught the 15"),
}


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def famous():
    rows = [json.loads(line) for line in GSM8K.read_text().splitlines()]
    return [(r["question"], float(r["answer"].split("####")[-1].strip().replace(",", ""))) for r in rows]


def answer(reply):
    """The number after the last 'Answer:', else the last number in the reply."""
    m = re.findall(r"Answer:\**\s*\**\s*[$₹]?\s*(-?[\d,]*\.?\d+)", reply)
    if not m:
        m = re.findall(r"-?[\d,]*\.?\d+", reply)
    if not m:
        return None
    try:
        return float(m[-1].replace(",", ""))
    except ValueError:
        return None


def run_offline(size, folder):
    """Runs inside `unshare -n` (no network)."""
    from llama_cpp import Llama
    net = load(ROOT / "pipeline/ep38/local_demo.py").network_check()
    if not net.get("offline"):
        sys.exit("network reachable: not an offline run")
    path = OUT / f"{size}.json"
    res = json.loads(path.read_text()) if path.exists() else {
        "model": f"{REPOS[size]} (q4_k_m)", "size": size, "network": net, "settings": "llama.cpp, 4 threads, greedy, "
        "context 2048, max 600 tokens, system prompt 'You are a helpful assistant.'", "ask": ASK.strip(),
        "famous": [], "changed": []}
    parts = sorted(Path(folder).glob(PATTERN))
    llm = Llama(model_path=str(parts[0]), n_ctx=2048, n_threads=4, n_threads_batch=4, verbose=False, seed=0)
    for test, qs in (("famous", famous()), ("changed", CHANGED)):
        for i, (q, want) in enumerate(qs):
            if i < len(res[test]):
                continue
            t0 = time.perf_counter()
            out = llm.create_chat_completion([{"role": "system", "content": "You are a helpful assistant."},
                                              {"role": "user", "content": q + ASK}], temperature=0.0, max_tokens=600)
            dt = time.perf_counter() - t0
            reply = out["choices"][0]["message"]["content"]
            got = answer(reply)
            ok = got is not None and abs(got - float(want)) < 0.01
            res[test].append({"i": i, "question": q, "right_answer": float(want), "model_answer": got, "ok": ok,
                              "seconds": round(dt, 1), "tokens": out["usage"]["completion_tokens"], "reply": reply})
            path.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(f"{size} {test} {i:2d} {'OK ' if ok else 'BAD'} {got} (right {float(want):g}) {dt:.0f}s", flush=True)
    res["network_after"] = load(ROOT / "pipeline/ep38/local_demo.py").network_check()
    path.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary(size):
    res = json.loads((OUT / f"{size}.json").read_text())
    for test in ("famous", "changed"):
        rows = res[test]
        right = sum(HAND.get((size, test, r["i"]), (r["ok"],))[0] for r in rows)
        res[f"{test}_right"] = right
        res[f"{test}_of"] = len(rows)
    (OUT / f"{size}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(f"{size}: famous {res['famous_right']}/{res['famous_of']}, changed {res['changed_right']}/{res['changed_of']}")


def main(sizes):
    from huggingface_hub import snapshot_download
    OUT.mkdir(parents=True, exist_ok=True)
    for size in sizes:
        folder = snapshot_download(REPOS[size], allow_patterns=[PATTERN])
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", size, folder], check=True)
        summary(size)
        shutil.rmtree(Path(folder).parents[1], ignore_errors=True)   # one brain in RAM at a time (ROUTINE.md)


if __name__ == "__main__":
    if sys.argv[1] == "--offline":
        run_offline(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "--summary":
        for s in sys.argv[2:]:
            summary(s)
    else:
        main(sys.argv[1:])
