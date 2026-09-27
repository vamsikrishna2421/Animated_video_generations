"""Mark rows in series/PRODUCTION_QUEUE.md as done when out/<id>_*.mp4 exists."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
q = ROOT / "series" / "PRODUCTION_QUEUE.md"
text = q.read_text()


def mark(m):
    num, ep_id, title, status = m.group(1), m.group(2), m.group(3), m.group(4)
    done = any((ROOT / "out").glob(f"{ep_id}_*.mp4"))
    return f"| {num} | {ep_id} | {title} | {'done' if done else status.strip()} |"


text = re.sub(r"^\| (\d+) \| ((?:ep|uc)\d\d) \| (.+?) \| (.*?)\|$", mark, text, flags=re.M)
q.write_text(text)
print(sum(1 for l in text.splitlines() if l.endswith("| done |")), "done")
