# Fish Audio text-to-speech for narration (replaces the local Parler voice when FISH_API_KEY is set).
#   python3 pipeline/fish_tts.py "Hello there." out.wav [--voice <voice id>] [--model s2.1-pro-free] [--speed 1.0]
# In code: from fish_tts import say; say("Hello there.", "out.wav", voice="<id>")
# The key is read from the environment (FISH_API_KEY) and never printed. Models: s2.1-pro-free ($0, fair use),
# s2.1-pro ($15 per million UTF-8 bytes), drama-3-preview (more emotive; check the pricing page before heavy use).
# Delivery tags work inline, e.g. "[emphasis] 99.99% sure [pause] and still wrong."
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.fish.audio/v1/tts"


def say(text, out, voice=None, model="s2.1-pro-free", speed=None, sample_rate=44100, retries=4):
    key = os.environ.get("FISH_API_KEY")
    if not key:
        raise RuntimeError("FISH_API_KEY is not set in this session (environment changes reach new sessions only)")
    body = {"text": text, "format": "wav", "sample_rate": sample_rate, "normalize": True, "latency": "normal"}
    if voice:
        body["reference_id"] = voice
    if speed:
        body["prosody"] = {"speed": speed}
    req = urllib.request.Request(API, data=json.dumps(body).encode(), method="POST", headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json", "model": model})
    for k in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
            with open(out, "wb") as f:
                f.write(data)
            return out
        except urllib.error.HTTPError as e:
            if e.code == 429 and k < retries - 1:          # concurrency limit: back off and retry
                time.sleep(2 ** (k + 1))
                continue
            raise RuntimeError(f"Fish Audio HTTP {e.code}: {e.read()[:300].decode(errors='replace')}") from None


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("text")
    ap.add_argument("out")
    ap.add_argument("--voice")
    ap.add_argument("--model", default="s2.1-pro-free")
    ap.add_argument("--speed", type=float)
    a = ap.parse_args()
    try:
        print(say(a.text, a.out, a.voice, a.model, a.speed))
    except RuntimeError as e:
        sys.exit(str(e))
