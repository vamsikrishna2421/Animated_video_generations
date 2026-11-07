# Creative 22 demo, "the meter photo" (written and committed before it ran): can a small AI that reads photos read an
# electricity meter? We draw 24 meter photos ourselves (so the true reading is known): a seven-segment kWh display with
# 5 digits, in two conditions fixed before the run:
#   clean : straight-on, sharp, even light (12 photos)
#   real  : the same kind of photo as a phone takes at a meter box: a slight tilt, a little blur, a glare patch (12)
# Each photo is read once by a small free vision AI, offline, temperature 0: "Read the kWh reading on this electricity
# meter's display. Answer with only the digits." Scored, as fixed before the run: exact match, else the number of
# digits wrong; any reply that isn't a number is read by hand (HAND below; the hand read goes into the result file).
# Brain: Qwen2.5-VL-3B-Instruct (llama.cpp's own GGUF, ggml-org, Q4_K_M + its f16 mmproj), llama.cpp, 4 threads,
# generated offline (EP38's network check).
# Writes series/scripts/creative22_demo/meters.json and the photos to series/scripts/creative22_demo/photos/.
#   python3 pipeline/creative22/meter_demo.py photos
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative22/meter_demo.py run <model folder>
#   python3 pipeline/creative22/meter_demo.py --summary
import base64
import importlib.util
import json
import random
import re
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative22_demo"
PHOTOS = OUT / "photos"
ASK = "Read the kWh reading on this electricity meter's display. Answer with only the digits."
HAND = {}  # photo id: the number the reply means, for replies that aren't plain digits
SEG = {"0": "abcfed", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc",
       "8": "abcdefg", "9": "abcdfg"}


def digit(d, x, y, w, h, t, on, off):
    pts = {"a": [(x + t, y), (x + w - t, y), (x + w - 2 * t, y + t), (x + 2 * t, y + t)],
           "b": [(x + w, y + t), (x + w, y + h / 2 - t / 2), (x + w - t, y + h / 2 - t), (x + w - t, y + 2 * t)],
           "c": [(x + w, y + h / 2 + t / 2), (x + w, y + h - t), (x + w - t, y + h - 2 * t), (x + w - t, y + h / 2 + t)],
           "d": [(x + t, y + h), (x + w - t, y + h), (x + w - 2 * t, y + h - t), (x + 2 * t, y + h - t)],
           "e": [(x, y + h / 2 + t / 2), (x, y + h - t), (x + t, y + h - 2 * t), (x + t, y + h / 2 + t)],
           "f": [(x, y + t), (x, y + h / 2 - t / 2), (x + t, y + h / 2 - t), (x + t, y + 2 * t)],
           "g": [(x + t, y + h / 2), (x + 2 * t, y + h / 2 - t / 2), (x + w - 2 * t, y + h / 2 - t / 2), (x + w - t, y + h / 2),
                 (x + w - 2 * t, y + h / 2 + t / 2), (x + 2 * t, y + h / 2 + t / 2)]}
    return [(pts[s], on if s in SEG[d] else off) for s in "abcdefg"]


def photo(reading, real, rnd):
    img = Image.new("RGB", (640, 480), (180, 178, 170))
    dr = ImageDraw.Draw(img)
    dr.rounded_rectangle((60, 40, 580, 440), 30, fill=(225, 225, 220), outline=(90, 90, 90), width=6)   # the meter body
    dr.text((90, 70), "SINGLE PHASE STATIC ENERGY METER", fill=(60, 60, 60))
    dr.rectangle((120, 150, 520, 290), fill=(150, 170, 120), outline=(40, 40, 40), width=5)                # the LCD
    for i, d in enumerate(reading):
        for poly, col in digit(d, 140 + i * 74, 170, 54, 100, 9, (25, 30, 20), (143, 163, 114)):
            dr.polygon(poly, fill=col)
    dr.text((470, 265), "kWh", fill=(20, 20, 20))
    dr.text((100, 330), "IMP/kWh 3200    240V  5-30A    50Hz", fill=(70, 70, 70))
    if real:
        img = img.rotate(rnd.uniform(-7, 7), resample=Image.BICUBIC, fillcolor=(150, 148, 140))
        glare = Image.new("L", img.size, 0)
        gd = ImageDraw.Draw(glare)
        cx = rnd.randint(200, 440)
        gd.ellipse((cx - 70, 140, cx + 70, 280), fill=150)
        glare = glare.filter(ImageFilter.GaussianBlur(28))
        img = Image.composite(Image.new("RGB", img.size, (255, 255, 250)), img, glare)
        img = img.filter(ImageFilter.GaussianBlur(rnd.uniform(1.2, 2.0)))
    return img


def make_photos():
    rnd = random.Random(2211)
    PHOTOS.mkdir(parents=True, exist_ok=True)
    rows = []
    for k in range(24):
        reading = f"{rnd.randint(0, 99999):05d}"
        real = k >= 12
        pid = f"{'real' if real else 'clean'}_{k % 12 + 1:02d}"
        photo(reading, real, rnd).save(PHOTOS / f"{pid}.png")
        rows.append({"id": pid, "truth": reading, "real": real})
    (OUT / "truth.json").write_text(json.dumps(rows, indent=1))
    print("made", len(rows), "photos")


# Added after the first 8 answers (every clean meter photo misread, e.g. 66114 -> ".86111"), committed before it runs:
#   printed : the same 12 clean readings, the same meter body and LCD, but the digits in a plain printed font instead of
#             seven segments. If it reads these, the trouble is the meter-style digits, not our drawing.
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def make_printed():
    from PIL import ImageFont
    truth = json.loads((OUT / "truth.json").read_text())
    font = ImageFont.truetype(FONT, 96)
    rows = []
    for r in truth:
        if r["real"]:
            continue
        img = Image.new("RGB", (640, 480), (180, 178, 170))
        dr = ImageDraw.Draw(img)
        dr.rounded_rectangle((60, 40, 580, 440), 30, fill=(225, 225, 220), outline=(90, 90, 90), width=6)
        dr.text((90, 70), "SINGLE PHASE STATIC ENERGY METER", fill=(60, 60, 60))
        dr.rectangle((120, 150, 520, 290), fill=(150, 170, 120), outline=(40, 40, 40), width=5)
        dr.text((150, 168), r["truth"], font=font, fill=(25, 30, 20))
        dr.text((470, 265), "kWh", fill=(20, 20, 20))
        dr.text((100, 330), "IMP/kWh 3200    240V  5-30A    50Hz", fill=(70, 70, 70))
        pid = r["id"].replace("clean", "printed")
        img.save(PHOTOS / f"{pid}.png")
        rows.append({"id": pid, "truth": r["truth"], "real": False, "printed": True})
    (OUT / "truth_printed.json").write_text(json.dumps(rows, indent=1))
    print("made", len(rows), "printed photos")


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def offline_run(folder):
    from llama_cpp import Llama
    from llama_cpp.llama_chat_format import Qwen25VLChatHandler
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    folder = Path(folder)
    model = sorted(folder.glob("*Q4_K_M*.gguf"))[0]
    mmproj = sorted(folder.glob("mmproj*.gguf"))[0]
    llm = Llama(model_path=str(model), chat_handler=Qwen25VLChatHandler(clip_model_path=str(mmproj), verbose=False),
                n_ctx=4096, n_threads=4, n_threads_batch=4, verbose=False, seed=0)
    printed = len(sys.argv) > 3 and sys.argv[3] == "printed"
    truth = json.loads((OUT / ("truth_printed.json" if printed else "truth.json")).read_text())
    dest = OUT / ("printed.json" if printed else "meters.json")
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": "ggml-org/Qwen2.5-VL-3B-Instruct-GGUF (Q4_K_M, mmproj f16)", "network": net,
        "settings": "temperature 0, max 16 tokens, one read per photo", "ask": ASK, "rows": []}
    done = {r["id"] for r in res["rows"]}
    for row in truth:
        if row["id"] in done:
            continue
        uri = "data:image/png;base64," + base64.b64encode((PHOTOS / f"{row['id']}.png").read_bytes()).decode()
        t0 = time.time()
        out = llm.create_chat_completion(messages=[{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": uri}}, {"type": "text", "text": ASK}]}],
            temperature=0.0, max_tokens=16)
        reply = out["choices"][0]["message"]["content"].strip()
        res["rows"].append({**row, "reply": reply, "seconds": round(time.time() - t0, 1)})
        dest.write_text(json.dumps(res, indent=1))
        print(row["id"], row["truth"], "->", reply, flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1))


def summary():
    res = json.loads((OUT / "meters.json").read_text())
    for cond in (False, True):
        rows = [r for r in res["rows"] if r["real"] == cond]
        right, wrong = 0, []
        for r in rows:
            got = HAND.get(r["id"], re.sub(r"\D", "", r["reply"]))
            r["hand"] = got
            if got == r["truth"]:
                right += 1
            else:
                diff = sum(1 for a, b in zip(got.zfill(5), r["truth"]) if a != b) if len(got) <= 5 else None
                wrong.append((r["id"], r["truth"], got, diff))
        print("real" if cond else "clean", f"{right}/{len(rows)} right", wrong)
    (OUT / "meters.json").write_text(json.dumps(res, indent=1))


if __name__ == "__main__":
    {"photos": make_photos, "printed": make_printed, "run": lambda: offline_run(sys.argv[2]), "--summary": summary}[sys.argv[1]]()
