"""Find the beat grid and energy sections of a music track, so cuts, titles and speed ramps can land on the beat.

  python scripts/beats.py music/track.mp3 [--bpm 120]     -> music/track.beats.json

Output: bpm, beats (seconds), bars (every 4th beat, best guess at the downbeat), energy per beat (0..1) and
"lifts" (beats where the track gets clearly louder: good places for a reveal, a new chapter or a drone shot).
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import vlog  # noqa: E402


def analyse(path, bpm_hint=None):
    import numpy as np
    sr, hop = 22050, 220  # ~100 onset frames per second
    y = vlog.audio_mono(path, sr)
    if len(y) < sr:
        raise SystemExit("track too short or unreadable")
    n = (len(y) - 2048) // hop
    idx = np.arange(2048)[None, :] + hop * np.arange(n)[:, None]
    S = np.log1p(np.abs(np.fft.rfft(y[idx] * np.hanning(2048), axis=1)))
    flux = np.r_[0, np.maximum(0, np.diff(S, axis=0)).sum(axis=1)]
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    fps = sr / hop
    ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    lags = np.arange(len(ac))
    lo, hi = int(fps * 60 / 180), int(fps * 60 / 70)
    w = np.exp(-0.5 * (np.log2((60 * fps / np.maximum(lags, 1)) / 120)) ** 2)  # prefer ~120 bpm when ambiguous
    if bpm_hint:
        period = fps * 60 / bpm_hint
    else:
        lag = lo + int(np.argmax((ac * w)[lo:hi]))
        period = lag
        # refine with parabolic interpolation
        if lo < lag < hi - 1:
            a, b, c = ac[lag - 1], ac[lag], ac[lag + 1]
            period = lag + 0.5 * (a - c) / (a - 2 * b + c + 1e-9)
    phases = np.arange(int(period))
    k = np.arange(0, n - period, period)
    best = max(phases, key=lambda p: flux[np.clip((k + p).astype(int), 0, n - 1)].sum())
    beats = []
    t = float(best)
    while t < n:  # walk the grid, snapping each beat to the strongest onset within +-6% of a period
        r = int(period * 0.06)
        i0, i1 = max(0, int(t) - r), min(n, int(t) + r + 1)
        j = i0 + int(np.argmax(flux[i0:i1])) if i1 > i0 else int(t)
        beats.append(j / fps)
        t = j + period
    beats = np.array(beats)
    rms = np.array([np.sqrt(np.mean(y[int(b * sr): int(b * sr) + int(period / fps * sr)] ** 2) + 1e-12) for b in beats])
    e = 20 * np.log10(rms + 1e-9)
    e = np.clip((e - np.percentile(e, 5)) / (np.percentile(e, 95) - np.percentile(e, 5) + 1e-9), 0, 1)
    acc = [flux[min(n - 1, int(b * fps))] for b in beats]
    down = max(range(4), key=lambda o: sum(acc[o::4]))
    es = np.convolve(e, np.ones(8) / 8, mode="same")
    lifts = [round(float(beats[i]), 3) for i in range(8, len(beats) - 1) if es[i] - es[i - 8] > 0.25 and (i - down) % 4 == 0]
    dedup = []
    for L in lifts:
        if not dedup or L - dedup[-1] > 8:
            dedup.append(L)
    return {"file": str(path), "duration": round(len(y) / sr, 3), "bpm": round(60 * fps / period, 2),
            "beats": [round(float(b), 3) for b in beats], "bars": [round(float(b), 3) for b in beats[down::4]],
            "energy": [round(float(x), 3) for x in e], "lifts": dedup}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("track")
    ap.add_argument("--bpm", type=float)
    a = ap.parse_args()
    res = analyse(a.track, a.bpm)
    out = Path(a.track).with_suffix(".beats.json")
    vlog.save_json(out, res)
    print(f"{out}: {res['bpm']} bpm, {len(res['beats'])} beats, lifts at {res['lifts'][:8]}")


if __name__ == "__main__":
    main()
