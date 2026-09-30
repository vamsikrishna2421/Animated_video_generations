"""Voice lines for the page mascot (cartoon kid). Telugu uses the approved "sidekick" cast; English uses a
matching cartoon description. Writes video/public/mascot/cta_{te,en}.wav."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parler_tts_local import CAST, ROOT, post, say  # noqa: E402

LINES = {
    "te": "హాయ్ ఫ్రెండ్స్! ఎ ఐ ని ఈజీగా నేర్చుకోవాలా? ఎ ఐ మాస్టారు ని ఫాలో అవ్వండి! "
          "ఎ ఐ ని మొదటి నుండి నేర్చుకోండి. లేటెస్ట్ ఎ ఐ టాపిక్స్, న్యూస్ తో, ఎప్పుడూ అప్డేట్ గా ఉండండి!",
    "en": "Hey friends! Want to learn AI the easy way? Follow AI Maastaaru! "
          "Learn AI from scratch, and stay updated with the latest AI topics and news!",
}
EN_KID = ("Mary speaks in a very excited, high-pitched, animated and cheerful voice, fast and bouncy, like a funny cartoon "
          "character. The recording is very clear, close-up, with no background noise.")

if __name__ == "__main__":
    out = ROOT / "video" / "public" / "mascot"
    for lang in sys.argv[1:] or ["te", "en"]:
        f = out / f"cta_{lang}.wav"
        say(lang, LINES[lang], f, CAST["sidekick"]["voice"] if lang == "te" else EN_KID)
        post(f, CAST["sidekick"]["post"] if lang == "te" else "asetrate=44100*1.18,aresample=44100,atempo=0.95")
        print("wrote", f, flush=True)
