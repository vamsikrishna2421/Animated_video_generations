# Creative 14 demo, "the references" (written and committed before it ran): a chat AI writes links the way it writes
# words, so a link can look right and lead nowhere. A small free AI, offline, asked for sources for a college project,
# ten replies each way:
#   gst   : "I'm a B.Com student in Hyderabad writing a college project on GST in India. Give me 5 links to sources I can
#            cite. Just the 5 links, one per line."
#   upi   : the same, on UPI payments in India
#   sure  : the GST prompt + "Only give links you are sure exist. If you are not sure, say so." (the popular fix)
# Then every link is opened from this machine (a plain HTTP client, its own user agent, no browser), and sorted, as
# fixed before the run:
#   loads  : the page itself answers 200 (after redirects) at a path other than the site's front page
#   home   : the site answers, but sends a deep link to its front page (the page isn't there)
#   dead   : no such site (DNS), connection refused, or 404 / 410
#   unclear: anything else (401, 403, 429, 5xx, timeouts): not counted as dead
# Every reply and every "loads" page title is read by hand (HAND below: the hand reading wins).
# Added after the first check, stricter than the plan above: this machine reaches the web through a proxy, and the proxy
# says "unable to connect" both for sites that don't exist and for real sites that refuse us (www.gov.in did). So a
# connection failure counts as dead only when public DNS (dns.google) says the domain doesn't exist (NXDOMAIN); any
# other connection failure is "unclear".
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check); the link check runs afterwards,
# online. Writes series/scripts/creative14_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative14/links_demo.py run     (generates offline)
#   python3 pipeline/creative14/links_demo.py --check                           (opens every link)
#   python3 pipeline/creative14/links_demo.py --summary
import importlib.util
import json
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative14_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
BASE = ("I'm a B.Com student in Hyderabad writing a college project on {topic}. Give me 5 links to sources I can cite. "
        "Just the 5 links, one per line.")
WAYS = {"gst": BASE.format(topic="GST in India"), "upi": BASE.format(topic="UPI payments in India"),
        "sure": BASE.format(topic="GST in India") + " Only give links you are sure exist. If you are not sure, say so."}
TRIES = 10


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def links(text):
    return [u.rstrip(".,);]>\"'") for u in re.findall(r"https?://[^\s<>\"\)\]]+", text)]


def offline_run(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=1024, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "7B.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 300 tokens",
        "prompts": WAYS, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for way, text in WAYS.items():
        for n in range(1, TRIES + 1):
            if (way, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=300, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"way": way, "try": n, "reply": reply, "links": links(reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(way, n, len(links(reply)), flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("DEMO_DONE", flush=True)


def check_one(url):
    import requests
    try:
        r = requests.get(url, timeout=15, allow_redirects=True, stream=True)
        final = r.url
        code = r.status_code
        title = ""
        if code == 200 and "html" in r.headers.get("content-type", ""):
            body = r.raw.read(200000, decode_content=True).decode("utf-8", "replace")
            m = re.search(r"<title[^>]*>(.*?)</title>", body, re.S | re.I)
            title = re.sub(r"\s+", " ", m.group(1)).strip()[:160] if m else ""
        r.close()
    except requests.exceptions.ConnectionError as e:
        return {"verdict": "dead", "why": "no such site or refused: " + str(e)[:120]}
    except requests.exceptions.RequestException as e:
        return {"verdict": "unclear", "why": str(e)[:120]}
    asked, got = urlparse(url), urlparse(final)
    deep = asked.path.strip("/") != ""
    if code in (404, 410):
        return {"verdict": "dead", "code": code, "final": final}
    if code == 200:
        if deep and got.path.strip("/") == "":
            return {"verdict": "home", "code": code, "final": final, "title": title}
        return {"verdict": "loads", "code": code, "final": final, "title": title}
    return {"verdict": "unclear", "code": code, "final": final}


def check():
    dest = OUT / "7B.json"
    res = json.loads(dest.read_text())
    seen = res.get("checks", {})
    for r in res["rows"]:
        for u in r["links"]:
            if u not in seen:
                seen[u] = check_one(u)
                print(seen[u]["verdict"], u, flush=True)
    res["checks"] = seen
    res["checked"] = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("CHECK_DONE", flush=True)


def dns_check():
    """For every link that failed to connect: does its domain exist at all? (public DNS over HTTPS)"""
    import requests
    dest = OUT / "7B.json"
    res = json.loads(dest.read_text())
    hosts = {}
    for u, c in res["checks"].items():
        if c["verdict"] == "dead" and "code" not in c:
            h = urlparse(u).hostname
            if h not in hosts:
                r = None
                for k in range(4):   # dns.google, then Cloudflare's resolver; a short wait between tries
                    try:
                        if k % 2 == 0:
                            r = requests.get("https://dns.google/resolve", params={"name": h, "type": "A"}, timeout=15).json()
                        else:
                            r = requests.get("https://cloudflare-dns.com/dns-query", params={"name": h, "type": "A"},
                                             headers={"accept": "application/dns-json"}, timeout=15).json()
                        break
                    except (ValueError, requests.exceptions.RequestException):
                        time.sleep(2 + 2 * k)
                hosts[h] = {"status": r.get("Status") if r else None, "answers": len(r.get("Answer", [])) if r else 0}
                print(h, hosts[h], flush=True)
            c["dns"] = hosts[h]
            if hosts[h]["status"] == 3:   # NXDOMAIN: no such domain
                c["why"] = "no such domain (DNS NXDOMAIN)"
            else:
                c["verdict"] = "unclear"
                c["why"] = "the domain exists but this machine couldn't connect: " + c["why"][:80]
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("DNS_DONE", flush=True)


# url: (verdict, why), where the hand reading of the page differs from the first pass (read Nov 2): "wrong" = the link
# loads, but no source is there (an empty page, or a different page). gst.gov.in (the GST portal's front page, asked for
# as the front page) and an Indian Kanoon search page are the two that load and fit.
HAND = {
    "https://www.respective.org/gst-exemptions/": ("wrong", "an empty page (no text)"),
    "https://www.respective.org/gst-in-india/": ("wrong", "an empty page (no text)"),
    "https://www.taxmann.com/en/article-38271/Goods-and-Services-Tax-GST-India-Introduction-And-Features": ("unclear", "a script-built site: the page shows only \"Taxmann\" to a plain client"),
    "https://www.taxmann.com/en/gst": ("unclear", "a script-built site: the page shows only \"Taxmann\" to a plain client"),
    "https://www.respective.org/articles/what-is-gst-in-india/": ("wrong", "an empty page (no text)"),
    "https://www.statista.com/statistics/1127765/upi-transactions-in-india/": ("wrong", "a different statistic: \"Police departments: approval of abolishing by ethnicity U.S. 2020\""),
    "https://www.rbi.org.in/scripts/BS_ViewPressRelease.aspx?prid=38716": ("wrong", "RBI's site, no press release on the page"),
    "https://www.indiatoday.in/money/story/upi-payment-system-india-growth-statistics-1856819-2023-01-12": ("wrong", "a different article: \"Your Weekend Planner September 24...\""),
    "https://www.indiatoday.in/india/story/upi-transaction-count-touches-2-billion-mark-1715848-2022-01-27": ("wrong", "a different article: \"Cricket South Africa terminates employment of CEO...\""),
    "https://www.rbi.org.in/Scripts/LatestPressRelease.aspx?prid=254": ("wrong", "RBI's site, no press release on the page"),
    "https://www.bankingrepublic.com/2021/09/how-upi-is-transforming-transaction-landscape-in-india/": ("wrong", "an empty page (no text)"),
    "https://www.rbi.org.in/scripts/FAQView.aspx?id=136": ("wrong", "RBI FAQ on Indian currency, not UPI"),
    "https://www.taxmann.com/gst/gst-faq": ("unclear", "a script-built site: the page shows only \"Taxmann\" to a plain client"),
    "https://www.respective.com/gst-in-india/": ("wrong", "an empty page (no text)"),
    "https://www.taxationindia.com/gst-in-india/": ("wrong", "an empty page (no text)"),
}


def summarize():
    dest = OUT / "7B.json"
    res = json.loads(dest.read_text())
    out = {}
    for way in WAYS:
        rows = [r for r in res["rows"] if r["way"] == way]
        counts = {"loads": 0, "wrong": 0, "home": 0, "dead": 0, "unclear": 0}
        n_links = 0
        for r in rows:
            for u in r["links"]:
                n_links += 1
                counts[HAND[u][0] if u in HAND else res["checks"][u]["verdict"]] += 1
        out[way] = {"replies": len(rows), "links": n_links, **counts,
                    "replies_without_links": sum(1 for r in rows if not r["links"])}
    res["summary"] = out
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    if sys.argv[1:2] == ["--summary"]:
        summarize()
    elif sys.argv[1:2] == ["--check"]:
        check()
    elif sys.argv[1:2] == ["--dns"]:
        dns_check()
    elif sys.argv[1:2] == ["--offline"]:
        offline_run(sys.argv[2])
    else:
        from huggingface_hub import snapshot_download
        folder = snapshot_download(REPO, allow_patterns=[PATTERN])
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", folder], check=True)
