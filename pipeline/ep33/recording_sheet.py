# The user's recording sheet for EP33 (recorded voice): series/scripts/ep33_recording_sheet.md, built from the script's
# English and Telugu tables so the two never drift apart.
#   python3 pipeline/ep33/recording_sheet.py
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "series/scripts/ep33_hybrid_search.md"
OUT = ROOT / "series/scripts/ep33_recording_sheet.md"
HEAD = """# EP33 recording sheet: "We don't sell headaches"

Two characters, both your voice. RAVI: loud, fast, gruff (even on calm lines). AI: calm, flat, a little slower, polite;
it gets a phone-speaker sound later.

How to record:
- Start with 5 seconds of silence.
- Say "Line 7, Ravi" (or "Line 7, AI"), wait 1 second, say the line, wait 2 seconds. The pause after the name
  matters most: with no gap, the cut can start on the name.
- Slip? Pause and say the line again. The last take is used.
- ★ lines: say them twice. For the AI, the second take slower, with a longer pause.
- "E-1203" = "E twelve zero three".
- Quiet small room, fan/AC off, phone on Do Not Disturb, 20-30 cm from your mouth, slightly to the side.
- Send the original voice-recorder file (m4a or wav), not a WhatsApp voice note: attach it in the chat, or put it in
  Google Drive with "anyone with the link" and paste the link (sharing can be turned off once it's downloaded), or upload
  it on GitHub into `incoming/` on the `sample1` branch.
- English and Telugu as two separate files. Telugu is optional.
- Change words to how you would really say them; that's fine.
"""


def table(text, title):
    body = text[text.index(title):]
    body = body[:body.index("\n## ", 3)]
    return [[c.strip() for c in ln.strip("|").split("|")] for ln in body.splitlines()
            if ln.startswith("| ") and not ln.startswith("| #") and not ln.startswith("|---")]


def main():
    s = SCRIPT.read_text()
    out = [HEAD, "## English", ""]
    for num, who, line, _ in table(s, "## Script (English)"):
        out += [f"**{num}** {who.upper()}: {line}", ""]
    out += ["## Telugu", ""]
    for num, who, tel, rom in table(s, "## Script (Telugu"):
        out += [f"**{num}** {who.upper()}: {tel}", f"&nbsp;&nbsp;&nbsp;&nbsp;_{rom}_", ""]
    OUT.write_text("\n".join(out))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
