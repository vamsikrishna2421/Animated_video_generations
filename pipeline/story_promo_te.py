"""Telugu channel promo: Telugu narration (video/public/story_te/vo_<beat>.wav, from parler_tts_local),
same hip-hop score, English on-screen text (video/src/story/StoryTe.tsx). Writes story_timeline_te.json."""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from story_promo import FPS, SR, score  # noqa: E402

OUT = ROOT / "video" / "public" / "story_te"
TL = ROOT / "video" / "src" / "story" / "story_timeline_te.json"
# Beat id and minimum on-screen seconds (the meme beat needs time for all three panels).
BEATS = [("fast", 3.0), ("flood", 3.8), ("lost", 2.8), ("panik", 8.0), ("reveal", 3.6), ("pillars", 7.4), ("cta", 5.2)]


def main():
    beats, t = [], 0.0
    for bid, mn in BEATS:
        a, sr = sf.read(OUT / f"vo_{bid}.wav")
        a = a.mean(axis=1) if a.ndim > 1 else a
        idx = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
        a = np.tanh(a / (np.sqrt(np.mean(a ** 2)) + 1e-9) * 10 ** (-15 / 20) * 1.2) / np.tanh(1.2)
        sf.write(OUT / f"vo_{bid}_n.wav", a.astype(np.float32), sr)
        dur = len(a) / sr
        length = max(mn, dur + 0.9)
        beats.append({"id": bid, "text": "", "from": round(t * FPS), "frames": round(length * FPS),
                      "voiceFrom": round((t + 0.2) * FPS), "voiceFrames": round(dur * FPS), "audio": f"story_te/vo_{bid}_n.wav"})
        t += length
    sf.write(OUT / "score.wav", score([(b["id"], b["from"] / FPS) for b in beats], t).astype(np.float32), SR)
    TL.write_text(json.dumps({"fps": FPS, "totalFrames": round(t * FPS), "music": "story_te/score.wav", "beats": beats}, indent=1) + "\n")
    print(f"total {t:.1f}s", [(b["id"], round(b["frames"] / FPS, 1)) for b in beats])


if __name__ == "__main__":
    main()
