"""ElevenLabs text-to-speech for reels: expressive voices, audio tags, word timings.

Needs ELEVENLABS_API_KEY in the environment and api.elevenlabs.io allowed by the network policy.

  python3 pipeline/eleven.py check                 # key + connectivity + quota
  python3 pipeline/eleven.py voices [search]       # voices in your account (+ shared library search)
  python3 pipeline/eleven.py say <voice_id> "text" # quick test -> scratch wav

Audio tags (eleven_v3): [excited] [laughs] [whispers] [sighs] [sarcastic] [dramatic] [shouts] ...
"""
import base64
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

import numpy as np
import soundfile as sf

API = "https://api.elevenlabs.io"
TAG = re.compile(r"\[[^\]]*\]")


def _req(path, body=None, method=None):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY is not set in this environment")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method or ("POST" if body is not None else "GET"),
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def tts(text, voice_id, model="eleven_v3", settings=None, language=None):
    """Returns (audio float32 mono, sr, words[(word, start_s, end_s)]). Tags like [laughs] are not captioned."""
    body = {"text": text, "model_id": model,
            "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, **(settings or {})}}
    if language:
        body["language_code"] = language
    try:
        out = _req(f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128", body)
    except urllib.error.HTTPError as e:
        if model == "eleven_v3" and e.code in (400, 422):  # model without timestamps: fall back, drop tags
            return tts(TAG.sub("", text).strip(), voice_id, "eleven_multilingual_v2", settings, language)
        raise SystemExit(f"ElevenLabs error {e.code}: {e.read()[:300]!r}")
    a, sr = sf.read(io.BytesIO(base64.b64decode(out["audio_base64"])))
    if a.ndim > 1:
        a = a.mean(axis=1)
    al = out.get("normalized_alignment") or out.get("alignment") or {}
    chars = al.get("characters", [])
    st, en = al.get("character_start_times_seconds", []), al.get("character_end_times_seconds", [])
    words, cur, s0, e0, depth = [], "", None, None, 0
    for c, s, e in zip(chars, st, en):
        if c == "[":
            depth += 1
        if depth:
            if c == "]":
                depth -= 1
            continue
        if c.isspace():
            if cur.strip():
                words.append((cur, s0, e0))
            cur, s0 = "", None
            continue
        if s0 is None:
            s0 = s
        cur += c
        e0 = e
    if cur.strip():
        words.append((cur, s0, e0))
    return a.astype(np.float32), sr, words


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    if cmd == "check":
        u = _req("/v1/user/subscription")
        print("ok:", u.get("tier"), f"{u.get('character_count')}/{u.get('character_limit')} characters used")
    elif cmd == "voices":
        q = sys.argv[2] if len(sys.argv) > 2 else ""
        for v in _req("/v1/voices").get("voices", []):
            lab = v.get("labels", {})
            print(f"{v['voice_id']}  {v['name']:24} {lab.get('accent', ''):12} {lab.get('gender', ''):7} {lab.get('age', ''):12} {lab.get('description', lab.get('descriptive', ''))}")
        if q:
            print("\nshared library:", q)
            res = _req("/v1/shared-voices?page_size=20&search=" + urllib.parse.quote(q))
            for v in res.get("voices", []):
                print(f"{v['voice_id']}  {v['name'][:24]:24} {v.get('accent', ''):12} {v.get('gender', ''):7} {v.get('age', ''):12} {v.get('descriptive', '')} [{v.get('public_owner_id', '')}]")
    elif cmd == "say":
        a, sr, words = tts(sys.argv[3], sys.argv[2])
        sf.write("/tmp/eleven_test.wav", a, sr)
        print(len(a) / sr, words)


if __name__ == "__main__":
    main()
