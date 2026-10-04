"""Turn a rendered video into a review pack the human-viewer agent can "watch":

  python3 pipeline/review_pack.py out/news/news-2026-10-02-en.mp4 [--lang en|te] [--out DIR]

  DIR/hook.png       the first 3 seconds, 6 frames (does it stop the scroll?)
  DIR/sheet.png      16 frames across the whole video, timestamped
  DIR/audio.png      loudness over time (voice vs music), spectrogram, cut markers
  DIR/pack.md        transcript with timestamps + audio/pacing numbers in plain words

The agent cannot hear, so the audio is described by measurements: tempo and beat strength, loudness arc,
music level under the voice, silent gaps, how many cuts land on a beat, brightness and low-end weight.
"""
import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FF = ROOT / "video/node_modules/@remotion/compositor-linux-x64-gnu"
ENV = dict(os.environ, LD_LIBRARY_PATH=str(FF))


def ff(*args):
    subprocess.run([str(FF / "ffmpeg"), "-y", "-loglevel", "error", *args], check=True, env=ENV)


def probe_duration(video):
    out = subprocess.run([str(FF / "ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)], capture_output=True, text=True, env=ENV)
    return float(out.stdout.strip())


def frames(video, times, w=270):
    from PIL import Image, ImageDraw
    ims = []
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(times):
            p = Path(td) / f"{i}.png"
            ff("-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1", "-vf", f"scale={w}:-2", str(p))
            im = Image.open(p).convert("RGB")
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 70, 22], fill=(0, 0, 0))
            d.text((4, 4), f"{t:5.1f}s", fill=(255, 255, 0))
            ims.append(im)
    return ims


def tile(ims, cols):
    from PIL import Image
    w, h = ims[0].size
    rows = (len(ims) + cols - 1) // cols
    s = Image.new("RGB", (w * cols, h * rows), (20, 20, 20))
    for i, im in enumerate(ims):
        s.paste(im, ((i % cols) * w, (i // cols) * h))
    return s


def cuts(video, dur):
    """Scene cuts from frame-difference spikes on a small greyscale proxy."""
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:  # the bundled ffmpeg has no rawvideo muxer, so go through tiny PNGs
        ff("-i", str(video), "-vf", "scale=64:-2", "-r", "30", str(Path(td) / "%05d.png"))  # 30 fps: a 15 fps proxy shifts cuts by up to 0.07 s
        v = np.stack([np.asarray(Image.open(p).convert("L"), dtype=np.float32).ravel() for p in sorted(Path(td).glob("*.png"))])
    n = len(v)
    if n < 3:
        return []
    d = np.abs(np.diff(v, axis=0)).mean(axis=1)
    thr = max(18.0, np.percentile(d, 97))
    idx = [i for i in range(1, len(d) - 1) if d[i] > thr and d[i] >= d[i - 1] and d[i] >= d[i + 1]]
    out = []
    for i in idx:
        t = (i + 1) / 30
        if not out or t - out[-1] > 0.4:
            out.append(round(t, 2))
    return out


def transcript(wav, lang):
    try:
        from faster_whisper import WhisperModel
        m = WhisperModel("small", device="cpu", compute_type="int8")
        segs, _ = m.transcribe(str(wav), language=lang, vad_filter=True)
        return [(round(s.start, 1), round(s.end, 1), s.text.strip()) for s in segs]
    except Exception as e:  # noqa: BLE001
        return [(0, 0, f"(transcript unavailable: {e})")]


def audio_report(wav, dur, cut_t, speech):
    import librosa
    y, sr = librosa.load(str(wav), sr=22050, mono=True)
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-7)
    t = librosa.frames_to_time(np.arange(len(db)), sr=sr, hop_length=hop)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
    tempo = float(np.atleast_1d(tempo)[0])
    beat_t = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    pulse = float(np.mean(onset[beats]) / (np.mean(onset) + 1e-9)) if len(beats) else 0.0
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    S = np.abs(librosa.stft(y, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr)
    low = float(S[freqs < 150].sum() / (S.sum() + 1e-9))
    # speech vs music-only level, using the transcript's speech spans
    mask = np.zeros_like(t, dtype=bool)
    for s0, s1, _ in speech:
        mask |= (t >= s0) & (t <= s1)
    v_db = float(np.median(db[mask])) if mask.any() else float("nan")
    m_db = float(np.median(db[~mask & (db > -60)])) if (~mask & (db > -60)).any() else float("nan")
    quiet = db < np.max(db) - 38
    gaps, start = [], None
    for i, q in enumerate(quiet):
        if q and start is None:
            start = t[i]
        if not q and start is not None:
            if t[i] - start > 0.5:
                gaps.append((round(start, 1), round(t[i] - start, 1)))
            start = None
    on_beat = sum(1 for c in cut_t if len(beat_t) and np.min(np.abs(beat_t - c)) < 0.1)
    # loudness arc in 4 quarters + the first 3 s
    q = [float(np.mean(db[(t >= dur * k / 4) & (t < dur * (k + 1) / 4)])) for k in range(4)]
    hook = float(np.mean(db[t < 3]))
    rep = {
        "tempo_bpm": round(tempo, 1), "beat_strength": round(pulse, 2), "voice_level_db": round(v_db, 1), "music_only_level_db": round(m_db, 1),
        "hook_level_db": round(hook, 1), "quarters_db": [round(x, 1) for x in q], "loudness_range_db": round(float(np.percentile(db[db > -60], 95) - np.percentile(db[db > -60], 10)), 1),
        "brightness_hz": int(np.median(cent)), "low_end_share": round(low, 3), "silent_gaps": gaps[:12], "cuts": len(cut_t),
        "cuts_on_beat": on_beat, "avg_shot_s": round(dur / max(1, len(cut_t) + 1), 1),
    }
    # plot
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(14, 6), sharex=True)
    ax[0].plot(t, db, lw=0.6, color="#3B6BFF")
    ax[0].fill_between(t, -70, db, where=mask, color="#F59E0B", alpha=0.25, label="speech")
    for c in cut_t:
        ax[0].axvline(c, color="#F43F5E", lw=0.6, alpha=0.6)
    ax[0].set_ylim(-70, 0)
    ax[0].set_ylabel("loudness dB")
    ax[0].legend(loc="upper right")
    ax[0].set_title(f"{tempo:.0f} BPM · beat strength {pulse:.2f} · red = cuts · orange = speech")
    D = librosa.amplitude_to_db(S, ref=np.max)
    librosa.display.specshow(D, sr=sr, hop_length=hop, x_axis="time", y_axis="log", ax=ax[1], cmap="magma") if hasattr(librosa, "display") else ax[1].imshow(D, aspect="auto", origin="lower")
    ax[1].set_ylabel("Hz")
    fig.tight_layout()
    return rep, fig


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--out")
    a = ap.parse_args()
    video = Path(a.video)
    out = Path(a.out) if a.out else ROOT / "out" / "review" / video.stem
    out.mkdir(parents=True, exist_ok=True)
    dur = probe_duration(video)
    tile(frames(video, [0.2, 0.7, 1.2, 1.7, 2.3, 2.9]), 6).save(out / "hook.png")
    tile(frames(video, list(np.linspace(0.5, dur - 0.5, 16))), 8).save(out / "sheet.png")
    wav = out / "audio.wav"
    ff("-i", str(video), "-ac", "1", "-ar", "16000", str(wav))
    speech = transcript(wav, a.lang)
    cut_t = cuts(video, dur)
    import librosa.display  # noqa: F401
    rep, fig = audio_report(wav, dur, cut_t, speech)
    fig.savefig(out / "audio.png", dpi=80)
    wav.unlink()
    words = sum(len(s[2].split()) for s in speech)
    lines = [f"# Review pack: {video.name}", "", f"- Duration: {dur:.1f} s · speech pace: {words / max(1, dur) * 60:.0f} words/min",
             f"- Cuts: {rep['cuts']} (one every {rep['avg_shot_s']} s) · cuts landing on a beat: {rep['cuts_on_beat']}",
             f"- Music: ~{rep['tempo_bpm']} BPM, beat strength {rep['beat_strength']} (1.0 = no pulse, 2+ = clear groove)",
             f"- Levels: voice {rep['voice_level_db']} dB vs music-only stretches {rep['music_only_level_db']} dB · loudness range {rep['loudness_range_db']} dB",
             f"- Energy arc (avg dB per quarter): {rep['quarters_db']} · first 3 s: {rep['hook_level_db']} dB",
             f"- Brightness (spectral centroid): {rep['brightness_hz']} Hz · low-end share (<150 Hz): {rep['low_end_share']}",
             f"- Silent gaps > 0.5 s: {rep['silent_gaps'] or 'none'}", "", "## Transcript", ""]
    lines += [f"[{s0:5.1f}-{s1:5.1f}] {txt}" for s0, s1, txt in speech]
    lines += ["", "## Files", "- hook.png: first 3 s · sheet.png: whole video · audio.png: loudness/speech/cuts + spectrogram"]
    (out / "pack.md").write_text("\n".join(lines))
    (out / "audio.json").write_text(json.dumps(rep, indent=1))
    print(out)


if __name__ == "__main__":
    main()
