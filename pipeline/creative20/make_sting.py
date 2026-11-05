# Creative 20: a TV-news sting (our own synth: a fast rising arpeggio, a low hit and a bright chord tail), for the
# breaking-news parody. Writes video/public/audio/sfx_newssting.wav.
#   python3 pipeline/creative20/make_sting.py
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
SR = 44100


def tone(f, dur, decay, harm=(1.0, 0.4, 0.2)):
    t = np.arange(int(SR * dur)) / SR
    x = sum(a * np.sin(2 * np.pi * f * (q + 1) * t) for q, a in enumerate(harm))
    return x * np.exp(-t * decay) * np.minimum(1, t / 0.004)


out = np.zeros(int(SR * 1.6))
for q, f in enumerate([392.0, 523.25, 659.25, 783.99]):   # G4 C5 E5 G5, 70 ms apart
    s = tone(f, 0.4, 9.0)
    i = int(SR * 0.07 * q)
    out[i:i + len(s)] += 0.5 * s
hit_t = np.arange(int(SR * 0.5)) / SR
hit = np.sin(2 * np.pi * 70 * hit_t * (1 - 0.4 * hit_t)) * np.exp(-hit_t * 7)
i = int(SR * 0.3)
out[i:i + len(hit)] += 0.9 * hit
for f in [523.25, 659.25, 783.99, 1046.5]:   # the chord tail
    s = tone(f, 1.3, 3.2)
    out[i:i + len(s)] += 0.25 * s[:len(out) - i]
out = 0.85 * out / np.max(np.abs(out))
sf.write(ROOT / "video/public/audio/sfx_newssting.wav", np.stack([out, out], 1).astype(np.float32), SR)
print("wrote video/public/audio/sfx_newssting.wav", round(len(out) / SR, 2), "s")
