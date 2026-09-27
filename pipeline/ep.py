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


def quizq(n: int, total: int, q_spoken: str, q: str, options: list, answer: int, reveal: str, think: float = 4.5) -> dict:
    """One question of a quiz-only reel: numbered badge, 'keep score' prompt, longer think time."""
    return S("quiz", f"Question {n}. {q_spoken} [1] Five seconds. Keep score! <pause {think}> [2] {reveal}",
             question=q, options=options, answer=answer, badge=f"QUESTION {n}/{total}", commentPrompt="Keep score!")


def quiz_reel(qid: str, num: int, span: str, eps: str, buzz: list, questions: list, post_extra: str = "") -> None:
    """Quiz-only reel: banner, numbered questions, score bands + comment prompt."""
    n = len(questions)
    scenes = [S("banner", f"Quiz time! {n} tricky questions, from episodes {eps}. [1] Five seconds each. Count how many you get right. [2] Ready? Let's go!",
                kicker=f"QUIZ #{num}", title=["Quiz", "Time"], subtitle=f"Episodes {span} · {n} tricky questions", buzzwords=buzz)]
    scenes += [quizq(i + 1, n, *q) for i, q in enumerate(questions)]
    scenes.append(S("score", f"So, how many did you get? [1] {n} out of {n}? You're a true AI Maastaaru! [2] {n - 2} or {n - 1}, great work. [3] {n - 3} or less? Rewatch episodes {eps}, and try again. [4] Comment your score below!",
                    heading="How many did you get?", bands=[[f"{n}/{n}", "True AI Maastaaru!", "Trophy"], [f"{n - 2}–{n - 1}", "Great work!", "ThumbsUp"], [f"0–{n - 3}", "Rewatch & retry", "RefreshCw"]],
                    prompt=f"Comment your score /{n}"))
    save(qid, dict(episode=num, label=f"QUIZ #{num}", title=f"Quiz #{num}: Episodes {span}"), scenes, post=dict(
        caption=f"""Think you've really learned it? {n} tricky questions from episodes {span}. 5 seconds each.

Keep count, then comment your score out of {n}!
{post_extra}
Follow @ai_maastaaru to learn AI from scratch.""",
        tags="#AIMaastaaru #AIQuiz #LearnAI #QuizTime #AIForBeginners",
        pinned=f"Comment your score out of {n}! Which question got you? Missed some? Rewatch episodes {span} on our page.",
        cover=f"'Quiz Time #{num}' title card",
        alt=f"Animated quiz reel with {n} multiple-choice questions on AI concepts from episodes {span}."))
