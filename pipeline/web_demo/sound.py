# Original soundtrack for the website demo reel: intro sting (hit, shimmer, whoosh), a cinematic pulse bed in D minor,
# impacts on cuts, soft UI clicks on taps, a riser into the end card. python3 sound.py out.wav cues.json
import json, sys
import numpy as np
SR = 48000
rng = np.random.default_rng(3)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    e = np.full(n, s, dtype=np.float32)
    e[:a] = np.linspace(0, 1, a, endpoint=False) if a else e[:a]
    e[a:a + d] = np.linspace(1, s, d, endpoint=False)[: max(0, min(d, n - a))]
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1]:
        return
    sig = sig[: buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * gain * l * 1.414
    buf[1, i:i + len(sig)] += sig * gain * r * 1.414


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def onepole_lp(x, fc):                          # vectorised enough for short sounds
    from scipy.signal import lfilter
    a = np.exp(-2 * np.pi * fc / SR)
    return lfilter([1 - a], [1, -a], x).astype(np.float32)


def highpass(x, fc):
    return (x - onepole_lp(x, fc)).astype(np.float32)


def boom(dur=2.2, f0=95, f1=34):
    t = np.arange(int(dur * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 3.2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 1.9)
    s += 0.35 * np.tanh(3 * np.sin(ph)) * np.exp(-t * 6)           # a little grit on the attack
    nz = onepole_lp(rng.standard_normal(len(t)).astype(np.float32), 380) * np.exp(-t * 9) * 2.2
    return (s + nz).astype(np.float32)


def impact(dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    body = boom(dur, 120, 42) * 0.9
    crack = highpass(rng.standard_normal(len(t)).astype(np.float32), 1800) * np.exp(-t * 28) * 0.5
    return (body + crack).astype(np.float32)


def whoosh(dur=1.1, rise=True):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = rng.standard_normal(n).astype(np.float32)
    out = np.zeros(n, np.float32)
    for k, (lo, hi) in enumerate([(300, 2500), (600, 5000)]):     # a sweeping band of noise
        fc = lo + (hi - lo) * (t if rise else 1 - t) ** 1.5
        seg = 2400
        for i in range(0, n, seg):
            out[i:i + seg] += highpass(onepole_lp(nz[i:i + seg], fc[i] * 1.6), fc[i] * 0.5)
    shape = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.4 if rise else np.exp(-t * 4)
    return (out * shape * 0.9).astype(np.float32)


def shimmer(dur, freqs=(146.83, 220.0, 293.66, 349.23, 440.0, 587.33)):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros(len(t), np.float32)
    for k, f in enumerate(freqs):
        for det in (-0.004, 0.004):
            ph = 2 * np.pi * f * (1 + det) * t
            s += (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.06            # saw
    s = highpass(onepole_lp(s, 2600), 500)
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * 7 * t)
    swell = (t / dur) ** 2.2
    return (s * trem * swell).astype(np.float32)


def swell(dur, floor=0.25):
    """A reversed-cymbal style rise into the first hit, so the reel never opens on dead air (floor = level at the start)."""
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = highpass(rng.standard_normal(n).astype(np.float32), 2500) * 0.6
    tone = np.sin(2 * np.pi * np.cumsum(40 + 50 * t) / SR) * 0.5
    return ((nz + tone) * (floor + (1 - floor) * t ** 1.5)).astype(np.float32)


def rumble(dur):
    """Low filtered noise plus a 41 Hz drone that swells under the intro zoom."""
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = onepole_lp(onepole_lp(rng.standard_normal(n).astype(np.float32), 180), 180) * 3.0
    drone = np.sin(2 * np.pi * 41 * np.arange(n) / SR) * 0.6 + np.sin(2 * np.pi * 82 * np.arange(n) / SR) * 0.25
    return ((nz + drone) * (t ** 1.6) * (1 - np.clip((t - 0.92) / 0.08, 0, 1))).astype(np.float32)


def pluck(dur, f):
    """A short bright pluck for mid-range presence on phone speakers."""
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * f * t
    s = (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.5 + np.sin(ph) * 0.5
    return (onepole_lp(s.astype(np.float32), 2600) * np.exp(-t * 9)).astype(np.float32)


def click():
    t = np.arange(int(0.05 * SR)) / SR
    return (np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 160) * 0.5 + highpass(rng.standard_normal(len(t)).astype(np.float32), 3000) * np.exp(-t * 300) * 0.25).astype(np.float32)


def kick():
    t = np.arange(int(0.45 * SR)) / SR
    f = 50 + 110 * np.exp(-t * 30)
    body = np.tanh(2.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)) / np.tanh(2.6)   # saturated: harmonics carry on small speakers
    tick = highpass(rng.standard_normal(len(t)).astype(np.float32), 2500) * np.exp(-t * 220) * 0.6
    return (body * 0.9 + tick).astype(np.float32)


def snap():
    """Bright transient on the name landing: a clap-like noise burst plus a short high ping."""
    t = np.arange(int(0.35 * SR)) / SR
    nz = highpass(rng.standard_normal(len(t)).astype(np.float32), 1800) * (np.exp(-t * 38) + 0.4 * np.exp(-np.maximum(t - 0.012, 0) * 45) * (t > 0.012))
    ping = np.sin(2 * np.pi * 2349 * t) * np.exp(-t * 14) * 0.35 + np.sin(2 * np.pi * 1174.7 * t) * np.exp(-t * 9) * 0.35
    return (nz * 0.8 + ping).astype(np.float32)


def hat():
    t = np.arange(int(0.06 * SR)) / SR
    return (highpass(rng.standard_normal(len(t)).astype(np.float32), 6000) * np.exp(-t * 70) * 0.5).astype(np.float32)


def pad_chord(dur, root):
    t = np.arange(int(dur * SR)) / SR
    notes = [root, root * 1.5, root * 2, root * 2 * 1.189]     # root, fifth, octave, minor third above
    s = np.zeros(len(t), np.float32)
    for f in notes:
        for det in (-0.003, 0.0, 0.003):
            ph = 2 * np.pi * f * (1 + det) * t
            s += (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.04
    s = onepole_lp(onepole_lp(s, 1400), 1400)
    return (s * env_adsr(len(t), 0.4, 0.3, 0.85, 0.5)).astype(np.float32)


def bass_note(dur, f):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return (s * env_adsr(len(t), 0.005, 0.08, 0.7, 0.05) * 0.5).astype(np.float32)


def main(out, cues_path):
    C = json.load(open(cues_path))
    total = C["total"]
    mus = np.zeros((2, int(total * SR) + SR), np.float32)
    sfx = np.zeros_like(mus)
    # intro stings (the name intro plays twice: the real name, then the renamed one)
    for st in C["stings"]:
        place(sfx, swell(st["hit"] - st["start"], st.get("floor", 0.25)), st["start"], 1.0)
        place(sfx, boom(), st["hit"], 0.95)
        place(sfx, snap(), st["hit"], 0.8)
        place(sfx, pad_chord(st["land"] - st["hit"] + 0.3, 73.42 * 2), st["hit"] + 0.05, 0.95)
        place(sfx, rumble(st["land"] - st["hit"]), st["hit"], 0.95)
        place(sfx, shimmer(st["zoom"] - st["shimmer"] + 0.25), st["shimmer"], 2.0)
        place(sfx, whoosh(1.15, True), st["zoom"], 1.15)
        if st["land"] < C["end"] - 0.1:
            place(sfx, impact(), st["land"], 0.6)
    # the bed: one window (bed_start..bed_end), or several ("beds": [[a, b], ...]) so it can come back under the end card
    bpm, beat = 100, 0.6
    roots = [73.42, 58.27, 87.31, 65.41]                       # D, Bb, F, C
    bar = 4 * beat
    beds = C.get("beds") or [[C["bed_start"], C["bed_end"]]]
    lifts = C.get("lifts") or ([C["lift"]] if "lift" in C else [])
    steps = C.get("steps", [])   # a mid-range pluck layer (0.5-3 kHz) that lifts the middle of the tour a notch
    k = 0
    for t0, t1 in beds:
        t = t0
        while t < t1:
            r = roots[(k // 2) % 4]
            place(mus, pad_chord(min(bar + 0.6, t1 - t + 0.6), r * 2), t, 0.55)
            for b in range(8):                                      # eighth-note bass pulse
                tb = t + b * beat / 2
                if tb < t1:
                    place(mus, bass_note(beat / 2 * 0.9, r), tb, 0.4 if b % 2 == 0 else 0.26)
                    arp = [r * 4, r * 4 * 1.189, r * 4 * 1.5, r * 8][b % 4]
                    place(mus, pluck(beat / 2, arp), tb, 0.32, pan=(-0.35 if b % 2 else 0.35))
            for b in range(4):
                tb = t + b * beat
                if tb < t1:
                    place(mus, kick(), tb, 0.75 if b % 2 == 0 else 0.45)
                    place(mus, hat(), tb + beat / 2, 0.22, pan=0.3)
            sw = next((w for w in steps if w[0] <= t < w[1]), None)
            if sw:
                for b in range(8):
                    tb = t + b * beat / 2
                    if tb < min(t1, sw[1]):
                        place(mus, pluck(beat / 2, [r * 8, r * 8 * 1.5, r * 8 * 1.189, r * 16][b % 4]), tb, 0.28, pan=(0.3 if b % 2 else -0.3))
            lw = next((w for w in lifts if w[0] <= t < w[1]), None)
            if lw:
                for b in range(16):
                    tb = t + b * beat / 4
                    if tb < min(t1, lw[1]):
                        place(mus, hat(), tb, 0.16 if b % 2 else 0.24, pan=(-0.4 if b % 4 == 1 else 0.4))
                        if b % 2 == 0:
                            place(mus, pluck(beat / 4, [r * 8, r * 8 * 1.189, r * 8 * 1.5, r * 16][(b // 2) % 4]), tb, 0.22, pan=0.2)
            t += bar
            k += 1
    for a, b in zip(C.get("rattle", [])[::2], C.get("rattle", [])[1::2]):
        tt = a
        while tt < b:
            place(sfx, click(), tt, 0.35)
            tt += 0.05
    if "lift_riser" in C:
        place(sfx, whoosh(lifts[0][0] - C["lift_riser"], True), C["lift_riser"], 0.9)
    if "stab" in C:
        place(sfx, impact(), C["stab"], 0.75)
        place(sfx, snap(), C["stab"], 0.6)
    for c in C["cuts"]:
        place(sfx, impact(), c, 0.55)
        if C.get("snaps"):
            place(sfx, snap(), c, 0.3)                         # mid-range attack so the hit survives a phone speaker
    for c in C["clicks"]:
        place(sfx, click(), c, 0.6)
    place(sfx, boom(3.0, 80, 30), C["end"], 0.9)
    if C.get("snaps"):
        place(sfx, snap(), C["end"], 0.7)
    place(sfx, shimmer(2.2), C["end"] + 0.1, 0.8)
    place(sfx, pad_chord(total - C["end"] + 0.2, 73.42 * 2), C["end"] + 0.05, 0.85)
    # the arc: the bed sits lower through the feature tour and steps up for each lift ("lift_gain" per window)
    if lifts or steps:
        base = C.get("bed_gain", 0.8)
        g = np.ones(mus.shape[1], np.float32) * base
        for la, lb in steps:
            g[int(la * SR):int(lb * SR)] = C.get("step_gain", 0.95)
        for i, (la, lb) in enumerate(lifts):
            a, b = int(la * SR), int(lb * SR)
            hi = (C.get("lift_gain") or [1.2] * len(lifts))[i]
            ramp = int(0.3 * SR)
            g[max(0, a - ramp):a] = np.linspace(g[max(0, a - ramp)], hi, a - max(0, a - ramp))
            g[a:b] = hi
        mus *= g
    if not C.get("hold_end"):
        # fade the bed out just before the end card, then a short tail
        fade = np.ones(mus.shape[1], np.float32)
        a, b = int((C["end"] - 0.25) * SR), int(C["end"] * SR)
        fade[a:b] = np.linspace(1, 0.15, b - a)
        fade[b:] = 0.15
        mus *= fade
    mix = mus + sfx
    mix = mix[:, : int(total * SR)]
    tail = int((0.12 if C.get("hold_end") else 0.6) * SR)   # hold_end: the music stays up under the call to action
    mix[:, -tail:] *= np.linspace(1, 0, tail)
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.89        # gentle soft-clip, peak about -1 dB
    import soundfile as sf
    sf.write(out, mix.T, SR, subtype="PCM_16")
    print(out, f"{mix.shape[1] / SR:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
