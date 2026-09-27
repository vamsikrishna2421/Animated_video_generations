"""Tiny helpers for writing episode JSON files from Python.

    from ep import S, save
    save("ep12", dict(title=..., episode=12), [S("banner", "...", ...), ...], post=dict(...))
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULTS = {
    "series": "AI FROM SCRATCH", "handle": "@ai_maastaaru", "host": "female", "voice": "af_heart",
    "speed": 0.92, "lang": "en-us", "fps": 30, "flow": "continuous",
    "music": {"bpm": 90, "volume": 0.16, "duckedVolume": 0.07},
}
NEXT = "Follow @ai_maastaaru for the full series."
QUIZ = "Quiz at the end. Got it right? Comment below."


def S(type_: str, text: str, **data) -> dict:
    return {"type": type_, "text": text, "data": data}


def quiz(q_spoken: str, q: str, options: list, answer: int, reveal: str) -> dict:
    return S("quiz", f"Quick quiz! {q_spoken} [1] Pause and think, and if you get it right, comment below! <pause 3.2> [2] {reveal}",
             question=q, options=options, answer=answer)


def save(ep_id: str, meta: dict, scenes: list, post: dict) -> Path:
    spec = {"id": ep_id, **DEFAULTS, **meta, "scenes": scenes, "post": post}
    order = ["id", "episode", "series", "label", "handle", "title", "host", "voice", "speed", "lang", "fps", "flow", "music", "scenes", "post"]
    spec = {k: spec[k] for k in order if k in spec} | {k: v for k, v in spec.items() if k not in order}
    assert len(post["tags"].split()) <= 5, "max 5 hashtags"
    path = ROOT / "episodes" / f"{ep_id}.json"
    path.write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")
    return path
