# Creative 18: a three-note station chime ("ding-dong-ding", our own synth: three bell tones with a soft decay), for the
# railway-announcement parody. Writes video/public/audio/sfx_chime.wav.
#   python3 pipeline/creative18/make_chime.py
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
SR = 44100


def bell(freq, dur):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 3.2) * np.minimum(1, t / 0.008)
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2.0 * freq * t) + 0.12 * np.sin(2 * np.pi * 3.01 * freq * t)
    return tone * env


notes = [(659.25, 0.0), (523.25, 0.42), (783.99, 0.84)]   # E5, C5, G5
out = np.zeros(int(SR * 2.4))
for f, at in notes:
    b = bell(f, 1.5)
    i = int(SR * at)
    out[i:i + len(b)] += b[:len(out) - i]
out = 0.8 * out / np.max(np.abs(out))
sf.write(ROOT / "video/public/audio/sfx_chime.wav", np.stack([out, out], 1).astype(np.float32), SR)
print("wrote video/public/audio/sfx_chime.wav", round(len(out) / SR, 2), "s")
