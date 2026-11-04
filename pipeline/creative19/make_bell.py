# Creative 19: a boxing-ring bell ("ding-ding", our own synth: two strikes of a metal bell with inharmonic partials and a
# long ring), for the ring parody. Writes video/public/audio/sfx_ringbell.wav.
#   python3 pipeline/creative19/make_bell.py
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
SR = 44100


def strike(f0, dur):
    t = np.arange(int(SR * dur)) / SR
    out = np.zeros_like(t)
    for ratio, amp, decay in [(1.0, 1.0, 2.2), (2.76, 0.55, 3.5), (5.40, 0.30, 5.0), (8.93, 0.15, 7.0)]:   # a struck metal bell
        out += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * decay)
    click = np.random.default_rng(19).standard_normal(len(t)) * np.exp(-t * 400) * 0.4   # the hammer
    return (out + click) * np.minimum(1, t / 0.002)


out = np.zeros(int(SR * 2.2))
for at in (0.0, 0.26):
    s = strike(1180.0, 1.9)
    i = int(SR * at)
    out[i:i + len(s)] += s[:len(out) - i]
out = 0.8 * out / np.max(np.abs(out))
sf.write(ROOT / "video/public/audio/sfx_ringbell.wav", np.stack([out, out], 1).astype(np.float32), SR)
print("wrote video/public/audio/sfx_ringbell.wav", round(len(out) / SR, 2), "s")
