"""Google Cloud Text-to-Speech for long-form YouTube narration (English + Telugu).

Needs GOOGLE_TTS_API_KEY in the environment (a key with the Text-to-Speech API enabled).

  python3 pipeline/google_tts.py voices te-IN          # list voices for a language
  python3 pipeline/google_tts.py say te-IN-Chirp3-HD-Aoede "text" out.mp3
  python3 pipeline/google_tts.py script reels/<id>.json  # synthesize every line's "file" that is missing

In "script" mode each line needs "file" (target mp3 under video/public/reel/<id>/src/) and "tts" text
(plain sentences, no [n] markers); the spec's "tts_voice" / "tts_lang" pick the voice. The builder then
treats these like any other pre-generated take (see reel_build.file_line).
"""
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://texttospeech.googleapis.com/v1"
MAX_BYTES = 4800  # API limit is 5000 bytes of input per request


def _req(path, body=None):
    key = os.environ.get("GOOGLE_TTS_API_KEY")
    if not key:
        raise SystemExit("GOOGLE_TTS_API_KEY is not set in this environment")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API}{path}{'&' if '?' in path else '?'}key={key}", data=data,
                                 headers={"Content-Type": "application/json"}, method="POST" if body else "GET")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Google TTS error {e.code}: {e.read()[:400]!r}")


def voices(lang):
    return [v for v in _req(f"/voices?languageCode={lang}").get("voices", [])]


def chunks(text):
    """Split long text on sentence ends so each request stays under the byte limit."""
    parts, cur = [], ""
    for s in re.split(r"(?<=[.!?।])\s+", text.strip()):
        if len((cur + " " + s).encode()) > MAX_BYTES and cur:
            parts.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        parts.append(cur)
    return parts


def say(voice, text, out: Path, rate=1.0):
    lang = "-".join(voice.split("-")[:2])
    audio = b""
    for part in chunks(text):
        r = _req("/text:synthesize", {"input": {"text": part}, "voice": {"languageCode": lang, "name": voice},
                                      "audioConfig": {"audioEncoding": "MP3", "speakingRate": rate, "sampleRateHertz": 44100}})
        audio += base64.b64decode(r["audioContent"])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    return out


def script(spec_path: Path):
    spec = json.loads(spec_path.read_text())
    src = ROOT / "video" / "public" / "reel" / spec["id"] / "src"
    voice, rate = spec["tts_voice"], spec.get("tts_rate", 1.0)
    n = 0
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            f = src / line["file"]
            if f.exists() or not line.get("tts"):
                continue
            say(voice, line["tts"], f, rate)
            n += 1
            print("wrote", f.relative_to(ROOT))
    print(n, "new takes")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "voices":
        for v in voices(sys.argv[2]):
            print(v["name"], v.get("ssmlGender"), v.get("naturalSampleRateHertz"))
    elif cmd == "say":
        print(say(sys.argv[2], sys.argv[3], Path(sys.argv[4])))
    elif cmd == "script":
        script(Path(sys.argv[2]))
    else:
        print(__doc__)
