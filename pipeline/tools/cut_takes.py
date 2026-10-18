# Cut the user's voice recording into one clip per script line (recorded-voice episodes, ROUTINE.md run 1).
# The recording (the guide in the script file): about 5 s of room tone, then for each line its number said in English,
# a short pause, the line, a longer pause; a slip is followed by the line again, and the last take wins. The whole file
# is cleaned first (high-pass 80 Hz, FFT noise reduction set from the room tone, clicks, gentle compression), split at
# silences, and the spoken numbers are found with Whisper (English, short segments only). Every take is kept in
# <out>/takes/ with its transcript in <out>/report.json; the chosen take of each line is written as <out>/NN.wav, trimmed
# (60 ms before the first sound, 100 ms after the last) and level-matched to the other lines.
# With --spec, the clips also go where reel_build reads them (video/public/reel/<id>/src/<line file>), and the
# characters named by --phone (default "ai") get the phone-speaker sound from pipeline/skit02/voice.py.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/tools/cut_takes.py <recording> <out dir> [--lang en|te]
#       [--spec reels/<id>.json] [--phone ai] [--pick 7:0 --pick 12:1]   (take index per line, from report.json)
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
FFMPEG = "/tmp/claude-0/ffmpeg" if Path("/tmp/claude-0/ffmpeg").exists() else \
    str(ROOT / "video/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg")
SR = 48000
HOP = 0.02
WORDS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen "
                                    "fourteen fifteen sixteen seventeen eighteen nineteen twenty".split())}
TENS = {"twenty": 20, "thirty": 30, "forty": 40}
ASR = None


def ff(*args):
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", *args], check=True)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


def frames_rms(a):
    hop = int(HOP * SR)
    n = len(a) // hop
    return np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(axis=1))


def asr(a, lang):
    global ASR
    if ASR is None:
        from faster_whisper import WhisperModel
        ASR = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    segs, _ = ASR.transcribe(a.astype(np.float32) if SR == 16000 else resample16(a), language=lang, vad_filter=False,
                             without_timestamps=True, condition_on_previous_text=False)
    return " ".join(s.text.strip() for s in segs).strip()


def resample16(a):
    from scipy.signal import resample_poly
    return resample_poly(a, 1, 3).astype(np.float32)   # 48 kHz -> 16 kHz for Whisper


def as_number(text):
    t = re.sub(r"[^a-z0-9 ]", " ", text.lower()).split()
    t = [w for w in t if w not in ("number", "line", "no", "and", "the", "take")]
    if len(t) == 1 and t[0].isdigit():
        return int(t[0])
    if len(t) == 1 and t[0] in WORDS:
        return WORDS[t[0]]
    if len(t) == 2 and t[0] in TENS and t[1] in WORDS and WORDS[t[1]] < 10:
        return TENS[t[0]] + WORDS[t[1]]
    if len(t) == 1 and t[0] in TENS:
        return TENS[t[0]]
    return None


def clean(src, dst, tone_s):
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "raw.wav"
        ff("-i", str(src), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_f32le", str(raw))
        a, _ = sf.read(raw)
        tone = a[int(0.5 * SR): int(tone_s * SR)]
        nf = float(np.clip(rms_db(tone) + 3, -80, -20)) if len(tone) > SR // 2 else -50.0
        ff("-i", str(raw), "-af", f"highpass=f=80,afftdn=nf={nf:.1f}:tn=1,adeclick,"
           "acompressor=threshold=-22dB:ratio=2.5:attack=5:release=90:makeup=1.5", "-c:a", "pcm_f32le", str(dst))
    return nf


def phone(path):
    """The phone-speaker sound of skit 02's caller (pipeline/skit02/voice.py, copied: that module loads the TTS models)."""
    from scipy.signal import butter, sosfilt
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    x = sosfilt(butter(2, [300, 4000], "bp", fs=sr, output="sos"), a)
    x = x + 0.3 * sosfilt(butter(2, [1500, 3200], "bp", fs=sr, output="sos"), x)
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.5) / np.tanh(1.5)
    sf.write(path, (x * 0.9).astype(np.float32), sr)


def segments(a, nf):
    r = frames_rms(a)
    thr = max(10 ** ((nf + 14) / 20), np.percentile(r, 95) * 0.05)
    on = r > thr
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            segs.append([i * HOP, j * HOP])
            i = j
        else:
            i += 1
    merged = []
    for s in segs:   # breaths and consonant gaps inside a phrase
        if merged and s[0] - merged[-1][1] < 0.3:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] >= 0.12]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recording")
    ap.add_argument("out")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--spec")
    ap.add_argument("--phone", default="ai")
    ap.add_argument("--tone", type=float, default=4.5, help="seconds of room tone at the start")
    ap.add_argument("--take_gap", type=float, default=0.9, help="a pause this long inside a line starts a new take")
    ap.add_argument("--pick", action="append", default=[], help="line:take index override")
    args = ap.parse_args()
    out = Path(args.out)
    (out / "takes").mkdir(parents=True, exist_ok=True)
    spec = json.loads(Path(args.spec).read_text()) if args.spec else None
    lines = [ln for sc in spec["scenes"] for ln in sc["lines"]] if spec else None
    n_lines = len(lines) if lines else 99

    cleaned = out / "cleaned.wav"
    nf = clean(args.recording, cleaned, args.tone)
    a, _ = sf.read(cleaned)
    segs = segments(a, nf)
    print(f"noise floor {nf:.1f} dB, {len(segs)} speech segments, {len(a) / SR:.1f} s", flush=True)

    # spoken numbers: short segments that Whisper hears as a number, in order (a repeated number = the line again)
    marks, last = [], 0
    for k, (s0, s1) in enumerate(segs):
        if s1 - s0 > 1.4:
            continue
        text = asr(a[max(0, int((s0 - 0.1) * SR)): int((s1 + 0.1) * SR)], "en")
        n = as_number(text)
        if n is not None and 1 <= n <= n_lines and n >= last:
            marks.append((k, n))
            last = n
    print("numbers heard:", [n for _, n in marks], flush=True)

    report, picks = {"recording": str(args.recording), "noise_floor_db": nf, "lines": {}}, dict(
        tuple(map(int, p.split(":"))) for p in args.pick)
    for m, (k, n) in enumerate(marks):
        end = marks[m + 1][0] if m + 1 < len(marks) else len(segs)
        body = segs[k + 1:end]
        if not body:
            continue
        takes = [[body[0][0], body[0][1]]]
        for s in body[1:]:
            if s[0] - takes[-1][1] >= args.take_gap:
                takes.append([s[0], s[1]])
            else:
                takes[-1][1] = s[1]
        prev = report["lines"].get(str(n), {"takes": []})["takes"]   # the number said again: more takes of that line
        info = prev + [{"start": round(t0, 2), "end": round(t1, 2), "dur": round(t1 - t0, 2)} for t0, t1 in takes]
        report["lines"][str(n)] = {"takes": info}

    for key in sorted(report["lines"], key=int):
        n = int(key)
        info = report["lines"][key]["takes"]
        for i, t in enumerate(info):
            clip = a[max(0, int((t["start"] - 0.06) * SR)): int((t["end"] + 0.1) * SR)]
            sf.write(out / "takes" / f"{n:02d}_{i}.wav", clip.astype(np.float32), SR)
            t["text"] = asr(clip, args.lang)
        choice = picks.get(n, len(info) - 1)
        report["lines"][key]["chosen"] = choice
        clip, _ = sf.read(out / "takes" / f"{n:02d}_{choice}.wav")
        r = frames_rms(clip)
        level = rms_db(clip[np.repeat(r > np.percentile(r, 95) * 0.1, int(HOP * SR))[:len(clip)]])
        clip = clip * 10 ** ((-20 - level) / 20)   # every line to the same speech level
        clip = clip / max(1.0, np.abs(clip).max() / 0.89)   # peaks under -1 dB
        sf.write(out / f"{n:02d}.wav", clip.astype(np.float32), SR)
        print(f"{n:02d}: {len(info)} take(s), using {choice}: {info[choice]['dur']:.2f} s | {info[choice]['text']}", flush=True)

    missing = [i for i in range(1, n_lines + 1) if str(i) not in report["lines"]] if lines else []
    report["missing"] = missing
    (out / "report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    if missing:
        print("MISSING lines:", missing)
    if spec:
        src = ROOT / "video/public/reel" / spec["id"] / "src"
        src.mkdir(parents=True, exist_ok=True)
        for i, ln in enumerate(lines, 1):
            if (out / f"{i:02d}.wav").exists():
                shutil.copy(out / f"{i:02d}.wav", src / ln["file"])
                if ln.get("who") in args.phone.split(","):
                    phone(src / ln["file"])
        print("copied into", src)
    print("CUT_DONE", flush=True)


if __name__ == "__main__":
    main()
