# EP33 voice from the user's recording (recorded-voice trial, ROUTINE.md run 1). Takes the clips cut by
# pipeline/tools/cut_takes.py (one per line, cleaned and level-matched) and edits them for the reel: edges trimmed to the
# voice, long pauses inside a line shortened, a beat inserted where the script wants one ("Both: ... eighteen"), and the
# AI's lines given the phone-speaker sound (lighter on the numbers line, where "thirteen" must not turn into "thirty").
# Writes video/public/reel/<id>/src/NN_<who>.wav, the files reels/ep33v1.json points at, and a dialogue-only preview.
#   python3 pipeline/ep33/voice_rec.py [cut dir, default video/public/reel/ep33v1/rec/cut1]
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "series/scripts/ep33_hybrid_search.md"
H = 0.01
MAX_PAUSE = 0.28          # a pause inside a line longer than this is shortened to it (the take was read slowly)
KEEP = {1: 0.32, 19: 0.4, 26: 0.32}   # lines whose pauses are part of the joke keep a little more
INSERT = {18: ("both", 0.45), 25: ("two", 0.15)}   # a beat after this word: the drop before "eighteen"; "Why two?
                                                  # Switch one off" ran together as "why to switch one off"
LIGHT = {13, 17, 20, 24}                # numbers, and "vessels" (heard "results" through the full phone sound)
DROP_FIRST = set()   # lines whose clip still opens on the name read before the line (fixed in cut_takes for take 1)
TEMPO = 1.07   # take 1 was read at about 2 words a second; rubberband keeps pitch and formants (reel spec tempo stays 1.0)
FFMPEG = "/tmp/claude-0/ffmpeg"
SLOW = {13, 20}   # "Merge" (heard "must") and "vessels" (heard "results") keep their own pace


def rms(a):
    hop = int(H * SR)
    n = len(a) // hop
    return np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1))


def runs(on):
    out, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            out.append((i, j))
            i = j
        else:
            i += 1
    return out


def fade(x, n):
    n = min(n, len(x) // 2)
    if n:
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


def edit(a, n):
    r = rms(a)
    thr = max(np.percentile(r, 95) * 0.04, 1e-4)
    voiced = [(i, j) for i, j in runs(r > thr) if (j - i) * H >= 0.03]
    if not voiced:
        return a
    hop, cap = int(H * SR), KEEP.get(n, MAX_PAUSE)
    pieces, f8 = [], int(0.008 * SR)
    start = max(0, voiced[0][0] * hop - int(0.1 * SR))   # keeps a quiet first consonant ("Test")
    groups = [[voiced[0][0], voiced[0][1]]]
    for i, j in voiced[1:]:   # words closer than 120 ms belong together
        if (i - groups[-1][1]) * H < 0.12:
            groups[-1][1] = j
        else:
            groups.append([i, j])
    if n in DROP_FIRST:   # the first loud word and everything up to the next real pause go
        loud = r > np.percentile(r, 95) * 0.1
        i = 0
        while i < len(loud) and not loud[i]:
            i += 1
        while i < len(loud) and loud[i]:
            i += 1
        keep = [g for g in groups if g[0] > i + 10]   # groups starting after a 100 ms quiet gap
        if keep:
            groups = keep
            start = max(0, groups[0][0] * hop - int(0.08 * SR))
    for g, (i, j) in enumerate(groups):
        s0 = start if g == 0 else i * hop - int(0.03 * SR)
        s1 = (j * hop + int(0.12 * SR)) if g == len(groups) - 1 else j * hop + int(0.03 * SR)
        pieces.append(fade(a[s0:min(len(a), s1)].copy(), f8))
        if g < len(groups) - 1:
            gap = (groups[g + 1][0] - j) * H - 0.06
            pieces.append(np.zeros(int(min(gap, cap) * SR)))
    out = np.concatenate(pieces)
    if n in INSERT:   # a beat after a word: its end from the forced aligner, then the quietest frame just after it
        word, sec = INSERT[n]
        end = word_end(out, n, word)
        if end is not None:
            rr = rms(out)
            lo, hi = int((end - 0.04) / H), int((end + 0.12) / H)
            k = (lo + int(np.argmin(rr[lo:hi]))) * hop
            out = np.concatenate([fade(out[:k].copy(), f8), np.zeros(int(sec * SR)), fade(out[k:].copy(), f8)])
    return out


FA = None


def word_end(a, n, word):
    """End time of `word` in line n's clip (MMS forced aligner on the script text)."""
    global FA
    import torch
    import torchaudio
    from scipy.signal import resample_poly
    if FA is None:
        b = torchaudio.pipelines.MMS_FA
        FA = (b.get_model(with_star=False).eval(), b.get_tokenizer(), b.get_aligner())
    model, tok, aligner = FA
    text = dict((k, t) for k, _, t in table())[n]
    words = [w for w in re.findall(r"[a-z']+", text.lower().replace("!", " ").replace("?", " "))]
    if word not in words:
        return None
    x = torch.tensor(resample_poly(a, 1, SR // 16000).astype(np.float32))[None]
    with torch.inference_mode():
        em, _ = model(x)
    spans = aligner(em[0], tok(words))
    return spans[words.index(word)][-1].end * x.shape[1] / em.shape[1] / 16000


def stretch(a, tempo):
    if abs(tempo - 1) < 1e-3:
        return a
    import subprocess
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        i, o = Path(td) / "i.wav", Path(td) / "o.wav"
        sf.write(i, a.astype(np.float32), SR)
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(i), "-af",
                        f"rubberband=tempo={tempo}:formant=preserved:transients=mixed", str(o)], check=True)
        b, _ = sf.read(o)
    return b


def phone(a, light=False):
    """The phone-speaker sound (skit 02's caller filter); light: wider band and less drive, for the numbers."""
    from scipy.signal import butter, sosfilt
    lo, hi, drive, mid = (220, 6000, 1.1, 0.15) if light else (300, 4000, 1.5, 0.3)
    x = sosfilt(butter(2, [lo, hi], "bp", fs=SR, output="sos"), a)
    x = x + mid * sosfilt(butter(2, [1500, 3200], "bp", fs=SR, output="sos"), x)
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * drive) / np.tanh(drive)
    return x * 0.9


def table():
    s = SCRIPT.read_text()
    body = s[s.index("## Script (English)"):]
    body = body[:body.index("\n## ", 3)]
    rows = [[c.strip() for c in ln.strip("|").split("|")] for ln in body.splitlines()
            if ln.startswith("| ") and not ln.startswith("| #") and not ln.startswith("|---")]
    return [(int(r[0].split()[0]), r[1].lower(), r[2]) for r in rows]


def main():
    global SR
    cut = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "video/public/reel/ep33v1/rec/cut1"
    src = ROOT / "video/public/reel/ep33v1/src"
    src.mkdir(parents=True, exist_ok=True)
    preview, info = [], []
    for n, who, text in table():
        a, SR = sf.read(cut / f"{n:02d}.wav")
        a = a.mean(axis=1) if a.ndim > 1 else a
        x = stretch(edit(a, n), 1.0 if n in SLOW else TEMPO)
        if who == "ai":
            x = phone(x, n in LIGHT)
        x = x / max(1.0, np.abs(x).max() / 0.89)
        sf.write(src / f"{n:02d}_{who}.wav", x.astype(np.float32), SR)
        preview += [x, np.zeros(int(0.3 * SR))]
        info.append({"n": n, "who": who, "raw": round(len(a) / SR, 2), "edited": round(len(x) / SR, 2), "text": text})
        print(f"{n:02d} {who:4s} {len(a) / SR:5.2f} -> {len(x) / SR:5.2f} s  {re.sub(chr(34), '', text)}")
    sf.write(cut / "preview_dialogue.wav", np.concatenate(preview).astype(np.float32), SR)
    (cut / "edits.json").write_text(json.dumps(info, indent=1))
    print(f"total voice {sum(i['edited'] for i in info):.1f} s; with 0.3 s between lines "
          f"{sum(i['edited'] for i in info) + 0.3 * len(info):.1f} s")


if __name__ == "__main__":
    main()
