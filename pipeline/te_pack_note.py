# Whisper can't transcribe Telugu reliably (it stops or babbles), so a Telugu review pack gets an editor's note:
# speech coverage from a voice-activity check, a phonetic transcript in 15-second windows (Telugu speech written in
# Devanagari, language "hi"), and the Telugu lines as written.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/te_pack_note.py out/telugu_page/031_ep30_insta_te.mp4 reels/ep30te.json
import json
import re
import sys
from pathlib import Path

from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
from faster_whisper.vad import VadOptions, get_speech_timestamps

ROOT = Path(__file__).resolve().parents[1]


def main(video, spec_path, out_dir=None):
    video = Path(video)
    pack = Path(out_dir) if out_dir else ROOT / "out/review" / video.stem
    a = decode_audio(str(video), sampling_rate=16000)
    dur = len(a) / 16000
    ts = get_speech_timestamps(a, VadOptions(min_silence_duration_ms=300))
    speech = sum(t["end"] - t["start"] for t in ts) / 16000
    gaps = [(round(ts[i]["end"] / 16000, 1), round(ts[i + 1]["start"] / 16000, 1)) for i in range(len(ts) - 1)
            if (ts[i + 1]["start"] - ts[i]["end"]) / 16000 >= 0.5]
    m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    rows = []
    for t0 in range(0, int(dur) + 1, 15):
        seg = a[t0 * 16000:(t0 + 15) * 16000]
        if len(seg) < 16000:
            break
        segs, _ = m.transcribe(seg, language="hi", vad_filter=True)
        rows.append(f"[{t0:3d}-{t0 + 15:3d}] " + " ".join(s.text.strip() for s in segs)[:150])
    spec = json.loads(Path(spec_path).read_text())
    lines = [f"- {sc['id']}: " + re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", sc["lines"][0]["text"])).strip()[:160]
             for sc in spec["scenes"]]
    note = ["## Note from the editor",
            f"Whisper's Telugu transcript above is unreliable (an ASR limit, not missing audio). A voice-activity check finds "
            f"speech in {speech:.1f} of {dur:.1f} s; gaps of 0.5 s or more: {', '.join(f'{x}-{y} s' for x, y in gaps) or 'none'}.",
            "Below: a 15-second-window phonetic transcript (Telugu speech written in Devanagari by the speech recogniser; "
            "window edges cut words; some windows may be recogniser noise), then the Telugu lines as written.", ""] + rows + \
           ["", "### Telugu lines as written (English captions on screen)"] + lines
    md = pack / "pack.md"
    text = md.read_text()
    text = text.split("## Note from the editor")[0].rstrip() + "\n" + "\n".join(note) + "\n"
    md.write_text(text)
    print("note added to", md)


if __name__ == "__main__":
    main(*sys.argv[1:])
