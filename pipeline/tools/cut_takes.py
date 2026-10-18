# Cut the user's voice recording into one clip per script line (recorded-voice episodes, ROUTINE.md run 1).
# The recording (the guide in the script file): about 5 s of room tone, then for each line its number said in English
# ("Line 7", often with the character's name), the line, a pause; a retake repeats the marker or the line, and the last
# take wins. Markers are found in Whisper's word times over the whole file and each cut lands in the quietest frame
# between the marker and the line; a file with bare numbers and long pauses falls back to silence-based cutting. The whole file
# is cleaned first (high-pass 80 Hz, FFT noise reduction set from the room tone, clicks, gentle compression), split at
# silences, and the spoken numbers are found with Whisper (English, short segments only). Every take is kept in
# <out>/takes/ with its transcript in <out>/report.json; the chosen take of each line is written as <out>/NN.wav, trimmed
# (60 ms before the first sound, 150 ms after the last) and level-matched to the other lines.
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


def whole_words(a):
    """Whisper word times over the whole file. The markers are said in English, so English even for a Telugu file."""
    asr(np.zeros(SR // 2), "en")   # loads the model
    segs, _ = ASR.transcribe(resample16(a), language="en", word_timestamps=True, vad_filter=False,
                             condition_on_previous_text=False)
    return [(w.start, w.end, w.word.strip()) for sg in segs for w in sg.words]


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def markers(words, n_lines, names):
    """(first marker word, line number, first content word) for each "Line N[, Name]" (a bare "N Name" counts too)."""
    out, last, i = [], 0, 0
    while i < len(words):
        j, n = i, None
        if norm(words[i][2]) in ("line", "lines") and i + 1 < len(words):
            j, n = i + 1, as_number(words[i + 1][2])
            if n is None and last + 1 <= n_lines:   # "line" heard but its number lost: it can only be the next line
                j, n = i, last + 1
        elif i + 1 < len(words) and norm(words[i + 1][2]) in names:
            n = as_number(words[i][2])
        if n is not None and 1 <= n <= n_lines and n >= last:
            k = j + 1 + (j + 1 < len(words) and norm(words[j + 1][2]) in names)
            out.append((i, n, k))
            last, i = n, k
            continue
        i += 1
    return out


def script_lines(path, lang):
    """{line number: text} from the script's English table (romanized column of the Telugu table for Telugu)."""
    text = Path(path).read_text()
    head = "## Script (English)" if lang == "en" else "## Script (Telugu"
    body = text[text.index(head):]
    body = body[:body.index("\n## ", 3)]
    out = {}
    for ln in body.splitlines():
        if ln.startswith("| ") and not ln.startswith("| #") and not ln.startswith("|---"):
            cells = [c.strip() for c in ln.strip("|").split("|")]
            out[int(cells[0].split()[0])] = cells[2] if lang == "en" else cells[3]
    return out


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen " \
    "sixteen seventeen eighteen nineteen".split()


def say_number(d):
    n = int(d)
    if len(d) == 4:   # item codes are read in pairs: 1203 = "twelve zero three"
        return " ".join([say_number(d[:2])] + ([ONES[int(c)] for c in d[2:]] if d[2] == "0" else [say_number(d[2:])]))
    if n < 20:
        return ONES[n]
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"][n // 10]
    return tens + ("" if n % 10 == 0 else " " + ONES[n % 10])


def tokens(text):
    out = []
    for w in re.findall(r"[a-z0-9']+", text.lower()):
        out += say_number(w).split() if w.isdigit() else [w]
    return out


FA = None


def refine(a, region_words, skip, line_text, r0, r1, pre=()):
    """Align the words Whisper heard in [r0, r1] to the audio (MMS forced aligner) and return the start of the
    line's first word and the end of its last word; heard words outside the script line (a stray "okay", the marker,
    the name) are left out."""
    global FA
    import difflib
    import torch
    import torchaudio
    if FA is None:
        b = torchaudio.pipelines.MMS_FA
        FA = (b.get_model(with_star=False).eval(), b.get_tokenizer(), b.get_aligner(), set(b.get_dict()))
    model, tok, aligner, chars = FA
    heard = [(w, -1) for w in pre] + [(w, j) for j, (_, _, t) in enumerate(region_words) for w in tokens(t)]
    heard = [(re.sub(f"[^{''.join(sorted(c for c in chars if c.isalpha() or c == chr(39)))}]", "", w), j) for w, j in heard]
    heard = [(w, j) for w, j in heard if w]
    want = tokens(line_text)
    if not heard or not want:
        return None
    x = torch.tensor(resample16(a[int(max(0, r0) * SR): int(r1 * SR)]))[None]
    with torch.inference_mode():
        em, _ = model(x)
    spans = aligner(em[0], tok([w for w, _ in heard]))
    ratio = x.shape[1] / em.shape[1] / 16000
    like = lambda u, v: u == v or difflib.SequenceMatcher(None, u, v).ratio() >= 0.6
    body = [q for q, (w, j) in enumerate(heard) if j >= skip]   # after "Line N Name"
    first = next((q for q in body[:5] if like(heard[q][0], want[0])), body[0] if body else None)
    last = body[-1] if body else None   # the last heard word, unless it is clearly a stray word after the line
    if last is not None and not any(like(heard[last][0], v) for v in want[-3:]):
        exact = [q for q in body if heard[q][0] == want[-1]]
        last = exact[-1] if exact else last
    if first is None or last is None or last < first:
        return None
    return (max(0, r0) + spans[first][0].start * ratio, max(0, r0) + spans[last][-1].end * ratio,
            max(0, r0) + spans[first][-1].end * ratio)


def dip(r, t0, t1):
    """The quietest 20 ms frame between t0 and t1 (the gap between two words)."""
    a, b = max(0, int(t0 / HOP)), min(len(r), max(int(t0 / HOP) + 1, int(t1 / HOP)))
    return (a + int(np.argmin(r[a:b]))) * HOP if b > a else t0


def onset(r, thr, t):
    i = int(t / HOP)
    while i < len(r) and r[i] <= thr:
        i += 1
    return i * HOP


def offset(r, thr, t):
    i = min(len(r) - 1, int(t / HOP))
    while i > 0 and r[i] <= thr:
        i -= 1
    return (i + 1) * HOP


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
    ap.add_argument("--names", default="ravi,ai", help="character names read after the line number")
    ap.add_argument("--script", help="script markdown with the line tables (series/scripts/epNN_*.md): exact cuts")
    args = ap.parse_args()
    out = Path(args.out)
    (out / "takes").mkdir(parents=True, exist_ok=True)
    spec = json.loads(Path(args.spec).read_text()) if args.spec else None
    lines = [ln for sc in spec["scenes"] for ln in sc["lines"]] if spec else None
    n_lines = len(lines) if lines else 99

    expected = script_lines(args.script, args.lang) if args.script else {}
    if expected:
        n_lines = max(n_lines if lines else 0, max(expected))
    cleaned = out / "cleaned.wav"
    nf = clean(args.recording, cleaned, args.tone)
    a, _ = sf.read(cleaned)
    segs = segments(a, nf)
    print(f"noise floor {nf:.1f} dB, {len(segs)} speech segments, {len(a) / SR:.1f} s", flush=True)

    report, picks = {"recording": str(args.recording), "noise_floor_db": nf, "lines": {}}, dict(
        tuple(map(int, p.split(":"))) for p in args.pick)
    r = frames_rms(a)
    thr = max(10 ** ((nf + 14) / 20), np.percentile(r, 95) * 0.05)
    cache = out / "words.json"   # Whisper's word times vary a little between runs: reuse them for the same recording
    words = [tuple(w) for w in json.loads(cache.read_text())] if cache.exists() else whole_words(a)
    cache.write_text(json.dumps(words))
    marks = markers(words, n_lines, set(args.names.split(",")))
    print("markers heard:", [n for _, n, _ in marks], flush=True)
    if marks:   # "Line 7, Ravi, ..." read before each line (EP33 take 1): cut between the spoken markers
        for m, (i, n, k) in enumerate(marks):
            nxt = marks[m + 1][0] if m + 1 < len(marks) else len(words)
            if k >= nxt:
                continue
            t0 = onset(r, thr, dip(r, words[k - 1][1] - 0.1 if k > i else words[k][0] - 0.3, words[k][0] + 0.08))
            t1 = offset(r, thr, dip(r, words[nxt - 1][1] - 0.08, words[nxt][0] + 0.1 if nxt < len(words) else len(a) / SR))
            take = {"start": round(t0, 2), "end": round(t1, 2), "dur": round(t1 - t0, 2),
                    "heard": " ".join(w[2] for w in words[k:nxt])}
            if expected and n in expected:   # exact word edges by forced alignment (skips stray words and name tails)
                r0, pre = words[i][0] - 0.15, []
                if norm(words[i][2]) not in ("line", "lines"):   # Whisper dropped the spoken "Line": it is still in the
                    r0, pre = dip(r, words[i][0] - 0.9, words[i][0] - 0.05), ["line"]   # audio, so align it too
                fit = refine(a, words[i:nxt], k - i, expected[n], r0,
                             words[nxt][0] + 0.1 if nxt < len(words) else len(a) / SR, pre)
                if fit:
                    f0, f1 = fit[0], fit[1]
                    stop = words[nxt][0] - 0.05 if nxt < len(words) else len(a) / SR
                    soft = max(10 ** ((nf + 8) / 20), np.percentile(r, 95) * 0.025)   # word tails are quiet
                    j = int(f1 / HOP)   # a word the aligner ended early: follow the voice on through gaps under 0.35 s
                    while j < len(r) and j * HOP < stop:
                        if r[j] > soft:
                            f1 = (j + 1) * HOP
                        elif j * HOP - f1 > 0.35:
                            break
                        j += 1
                    fi = min(len(r) - 1, int(f0 / HOP))   # snap the start to the voice around the aligned start
                    if r[fi] > thr:
                        s_, e_ = fi, fi
                        while s_ > 0 and r[s_ - 1] > thr:
                            s_ -= 1
                        while e_ < len(r) and r[e_] > thr:
                            e_ += 1
                        if e_ * HOP - f0 < 0.12 and fit[2] - e_ * HOP > 0.2:
                            # the aligner started the line on the tail of the name before it (EP33 lines 19, 23):
                            while e_ < len(r) and r[e_] <= thr:   # the line starts at the next onset
                                e_ += 1
                            f0 = e_ * HOP
                        elif f0 - s_ * HOP <= 0.35:   # a late start inside the first word: back to its onset
                            f0 = s_ * HOP
                    else:   # in a pause: forward to the first word
                        while fi < len(r) and r[fi] <= thr:
                            fi += 1
                        f0 = fi * HOP
                    gap = 0
                    while int(f0 / HOP) - gap - 1 > 0 and r[int(f0 / HOP) - gap - 1] <= thr:
                        gap += 1
                    take.update(start=round(f0, 2), end=round(f1, 2), dur=round(f1 - f0, 2), aligned=True,
                                pre=round(min(0.12, max(0.03, gap * HOP / 2)), 3))
            prev = report["lines"].get(str(n), {"takes": []})["takes"]
            report["lines"][str(n)] = {"takes": prev + [take]}
    else:   # numbers alone: short segments that Whisper hears as a number (a repeated number = the line again)
        marks, last = [], 0
        for k, (s0, s1) in enumerate(segs):
            if s1 - s0 > 1.4:
                continue
            n = as_number(asr(a[max(0, int((s0 - 0.1) * SR)): int((s1 + 0.1) * SR)], "en"))
            if n is not None and 1 <= n <= n_lines and n >= last:
                marks.append((k, n))
                last = n
        print("numbers heard:", [n for _, n in marks], flush=True)
        for m, (k, n) in enumerate(marks):
            end = marks[m + 1][0] if m + 1 < len(marks) else len(segs)
            body = segs[k + 1:end]
            if not body:
                continue
            takes = [[body[0][0], body[0][1]]]
            for sg in body[1:]:
                if sg[0] - takes[-1][1] >= args.take_gap:
                    takes.append([sg[0], sg[1]])
                else:
                    takes[-1][1] = sg[1]
            prev = report["lines"].get(str(n), {"takes": []})["takes"]
            report["lines"][str(n)] = {"takes": prev + [{"start": round(t0, 2), "end": round(t1, 2), "dur": round(t1 - t0, 2)}
                                                        for t0, t1 in takes]}

    for key in sorted(report["lines"], key=int):
        n = int(key)
        info = report["lines"][key]["takes"]
        for i, t in enumerate(info):
            clip = a[max(0, int((t["start"] - t.get("pre", 0.06)) * SR)): int((t["end"] + 0.15) * SR)]
            sf.write(out / "takes" / f"{n:02d}_{i}.wav", clip.astype(np.float32), SR)
            t["text"] = t.get("heard") if args.lang == "en" and t.get("heard") else asr(clip, args.lang)
        choice = picks.get(n, len(info) - 1)
        report["lines"][key]["chosen"] = choice
        clip, _ = sf.read(out / "takes" / f"{n:02d}_{choice}.wav")
        r = frames_rms(clip)
        loud = np.repeat(r > np.percentile(r, 95) * 0.1, int(HOP * SR))
        level = rms_db(clip[:len(loud)][loud[:len(clip)]])
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
