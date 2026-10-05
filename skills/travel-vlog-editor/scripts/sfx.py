"""Generate licence-free sound effects for modern edits (synthesised, so no copyright questions).

  python scripts/sfx.py <project>/sfx            -> whoosh.wav, whoosh_short.wav, hit.wav, boom.wav, riser.wav,
                                                    riser_long.wav, suck.wav, click.wav, shutter.wav, swish.wav

Use them in edit.json "sfx": whoosh on a slide/zoom transition (start ~0.2 s before the cut), hit/boom on the first
frame and on big reveals, riser into a drop or the end card (ends exactly on the cut), suck (reverse riser) before a
hard cut to silence, click/shutter on photo freeze-frames, swish on text pop-ins. Keep them 6-12 dB under the music.
"""
import sys
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(3)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def bandnoise(n, f0, f1, q=0.25):
    """Noise whose band centre sweeps f0 -> f1 (simple FFT filtering in chunks)."""
    out = np.zeros(n)
    hop = 2048
    noise = rng.standard_normal(n + hop)
    for i in range(0, n, hop):
        fc = f0 + (f1 - f0) * (i / max(1, n - 1))
        seg = noise[i:i + hop * 2] * np.hanning(min(hop * 2, len(noise) - i))
        S = np.fft.rfft(seg)
        f = np.fft.rfftfreq(len(seg), 1 / SR)
        S *= np.exp(-0.5 * (np.log(np.maximum(f, 1) / fc) / q) ** 2)
        y = np.fft.irfft(S, len(seg))
        m = min(len(y), n - i)
        out[i:i + m] += y[:m]
    return out / (np.abs(out).max() + 1e-9)


def stereo(x, width=0.0):
    if width:
        d = int(SR * 0.012)
        return np.stack([x, np.r_[np.zeros(d), x[:-d]] * (1 - width) + x * width], 1)
    return np.stack([x, x], 1)


def norm(x, peak=0.89):
    return x / (np.abs(x).max() + 1e-9) * peak


def write(path, x):
    x = np.clip(x, -1, 1)
    try:
        import soundfile as sf
        sf.write(path, x.astype(np.float32), SR)
    except ImportError:
        import wave
        with wave.open(str(path), "wb") as w:
            w.setnchannels(x.shape[1] if x.ndim > 1 else 1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((x * 32767).astype(np.int16).tobytes())


def make(out):
    out.mkdir(parents=True, exist_ok=True)
    fx = {}
    for name, dur, f0, f1 in [("whoosh", 0.9, 300, 3500), ("whoosh_short", 0.45, 500, 5000), ("swish", 0.25, 2000, 8000)]:
        n = int(dur * SR)
        t = np.linspace(0, 1, n)
        shape = np.sin(np.pi * t ** 0.7) ** 2
        fx[name] = stereo(norm(bandnoise(n, f0, f1, 0.35) * shape), 0.5)
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    kick = np.sin(2 * np.pi * np.cumsum(45 + 120 * np.exp(-t * 25)) / SR) * env(n, 0.001, 0.35)
    fx["hit"] = stereo(norm(kick + 0.4 * bandnoise(n, 3000, 1500, 0.6) * env(n, 0.001, 0.08)))
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(35 + 60 * np.exp(-t * 8)) / SR) * env(n, 0.002, 0.9)
    fx["boom"] = stereo(norm(np.tanh(boom * 2.5) + 0.25 * bandnoise(n, 800, 200, 0.7) * env(n, 0.002, 0.4)))
    for name, dur in [("riser", 2.0), ("riser_long", 4.0)]:
        n = int(dur * SR)
        t = np.arange(n) / SR
        u = t / dur
        tone = np.sin(2 * np.pi * np.cumsum(180 + 1400 * u ** 2.2) / SR) * u ** 2
        fx[name] = stereo(norm(0.55 * tone + 0.6 * bandnoise(n, 400, 7000, 0.5) * u ** 2.5), 0.6)
    fx["suck"] = fx["riser"][::-1].copy() * np.linspace(0, 1, len(fx["riser"]))[:, None] ** 0.5
    n = int(0.06 * SR)
    fx["click"] = stereo(norm(bandnoise(n, 4000, 3000, 0.4) * env(n, 0.0005, 0.008)))
    n = int(0.35 * SR)
    c1 = bandnoise(n, 3500, 2500, 0.5) * env(n, 0.0005, 0.012)
    c2 = np.r_[np.zeros(int(0.09 * SR)), (bandnoise(n, 2500, 2000, 0.5) * env(n, 0.0005, 0.02))[: n - int(0.09 * SR)]]
    fx["shutter"] = stereo(norm(c1 + 0.8 * c2))
    for k, x in fx.items():
        write(out / f"{k}.wav", norm(x))
    print(f"wrote {len(fx)} effects to {out}: {', '.join(sorted(fx))}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    make(Path(sys.argv[1]))
