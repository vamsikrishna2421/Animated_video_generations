"""Transcribe what people say in the footage (faster-whisper, runs locally, no upload).

  python scripts/transcribe.py <project_dir> [--lang te|en|auto] [--model small|medium|large-v3] [--ids ...] [--min-speech 0.05]

Only recordings the inventory flagged with some speech are processed (use --all to force every one).
Writes transcripts/<id>.json (segments + words, seconds into the recording), transcripts/<id>.srt and
transcripts/ALL.md (every line with recording id + timestamp, for finding quotes, jokes and explanations).
Telugu tip: 'large-v3' is far better than 'small' for Telugu and code-mixed Telugu+English; it needs ~4 GB RAM and is slow
on CPU, so run it overnight or only on the recordings you plan to use.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import vlog  # noqa: E402


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--lang", default="auto")
    ap.add_argument("--model", default="small")
    ap.add_argument("--ids", default="")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--min-speech", type=float, default=0.05)
    a = ap.parse_args()
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit(f"faster-whisper missing: {sys.executable} -m pip install faster-whisper")
    proj = Path(a.project)
    inv = vlog.load_json(proj / "inventory.json")
    want = {x for x in a.ids.split(",") if x}
    model = WhisperModel(a.model, device="auto", compute_type="int8")
    out_dir = proj / "transcripts"
    out_dir.mkdir(exist_ok=True)
    for r in inv:
        if want and r["id"] not in want:
            continue
        an_p = proj / "analysis" / f"{r['id']}.json"
        sp = vlog.load_json(an_p).get("summary", {}).get("speech", 0) if an_p.exists() else 1
        if not (a.all or want) and (sp < a.min_speech or not r["has_audio"]):
            continue
        src = r.get("proxy") or r["chapters"][0]
        print(f"{r['id']} ({r['duration']:.0f}s, speech {sp:.0%}) ...", flush=True)
        segs, info = model.transcribe(src, language=None if a.lang == "auto" else a.lang, vad_filter=True, word_timestamps=True,
                                      condition_on_previous_text=False)
        segs = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                 "words": [{"w": w.word, "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]} for s in segs]
        vlog.save_json(out_dir / f"{r['id']}.json", {"language": info.language, "segments": segs})
        with open(out_dir / f"{r['id']}.srt", "w", encoding="utf-8") as f:
            for i, s in enumerate(segs, 1):
                f.write(f"{i}\n{srt_time(s['start'])} --> {srt_time(s['end'])}\n{s['text']}\n\n")
    lines = ["# Everything said in the footage\n"]
    for r in inv:
        p = out_dir / f"{r['id']}.json"
        if p.exists():
            j = vlog.load_json(p)
            lines.append(f"\n## {r['id']} ({j['language']}, shot {r['shot_at'][:16]})\n")
            lines += [f"- [{vlog.hms(s['start'])}-{vlog.hms(s['end'])}] {s['text']}" for s in j["segments"]]
    (out_dir / "ALL.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out_dir / 'ALL.md'}")


if __name__ == "__main__":
    main()
