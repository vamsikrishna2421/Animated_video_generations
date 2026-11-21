# Creative 36 test: does "AI enhance" read a blurry number plate, or draw a new one?
# 10 made-up plates (Indian format, made-up numbers), each drawn sharp (the truth), shrunk to a CCTV-sized blur (two
# levels: FAR 36x9 px, NEAR 52x13 px of plate), then (a) plain bicubic resize and (b) the Stable Diffusion x4 upscaler
# (a generative "AI enhance" model, run on our computer), 3 seeds each. Every output is read by hand from the contact
# sheets (HAND below, filled in after the run); nothing is scored automatically.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative36/enhance_demo.py
import json, random, time
from pathlib import Path
import torch
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from diffusers import StableDiffusionUpscalePipeline

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative36_demo"
IMG = ROOT / "out/local/creative36_demo"   # images stay local (git-ignored); the sheets we read are copied to OUT
FONT = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
LEVELS = {"far": (36, 9), "near": (52, 13)}   # v2: far is blurrier (v1 at 40 px was still readable by eye)
SEEDS = [1, 2, 3]
PROMPT = "a sharp clear photo of a white Indian car number plate with black letters"


def plates(n=10, seed=36):
    r = random.Random(seed)
    L = "ABCDEFGHJKLMNPRSTUVWXYZ"
    return [f"TS {r.randint(1, 15):02d} {r.choice(L)}{r.choice(L)} {r.randint(1000, 9999)}" for _ in range(n)]


def draw(text, w=512, h=128):
    im = Image.new("RGB", (w, h), (245, 245, 240)); d = ImageDraw.Draw(im)
    d.rectangle([3, 3, w - 4, h - 4], outline=(20, 20, 20), width=6)
    size = 78
    while True:   # v2: fit inside the border (v1 clipped the first and last characters)
        f = ImageFont.truetype(FONT, size); tw = d.textlength(text, font=f)
        if tw <= w - 48:
            break
        size -= 2
    d.text(((w - tw) / 2, (h - size * 1.36) / 2), text, font=f, fill=(15, 15, 15))
    return im


def cctv(im, size):
    small = im.resize(size, Image.BOX).filter(ImageFilter.GaussianBlur(0.4))
    return small.resize((128, 32), Image.BICUBIC)   # what the phone shows when you zoom into the CCTV frame


def main():
    IMG.mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
    pipe = StableDiffusionUpscalePipeline.from_pretrained("stabilityai/stable-diffusion-x4-upscaler", variant="fp16",
                                                          torch_dtype=torch.float32)
    pipe.set_progress_bar_config(disable=True)
    rows = []
    for i, p in enumerate(plates()):
        truth = draw(p); truth.save(IMG / f"{i:02d}_truth.png")
        for lv, size in LEVELS.items():
            low = cctv(truth, size); low.save(IMG / f"{i:02d}_{lv}_cctv.png")
            low.resize((512, 128), Image.BICUBIC).save(IMG / f"{i:02d}_{lv}_bicubic.png")
            for s in SEEDS:
                t = time.time()
                g = torch.Generator().manual_seed(s)
                up = pipe(prompt=PROMPT, image=low, num_inference_steps=20, guidance_scale=7.5, noise_level=20, generator=g).images[0]
                up.save(IMG / f"{i:02d}_{lv}_ai_s{s}.png")
                rows.append({"plate": i, "truth": p, "level": lv, "seed": s, "secs": round(time.time() - t, 1)})
                print(i, p, lv, s, rows[-1]["secs"], flush=True)
    # contact sheets, one per level: truth | cctv | bicubic | ai s1 | ai s2 | ai s3
    for lv in LEVELS:
        W, H = 512, 128
        sheet = Image.new("RGB", (W * 6 + 50, H * 10 + 60), (255, 255, 255)); d = ImageDraw.Draw(sheet)
        f = ImageFont.truetype(FONT, 22)
        for c, name in enumerate(["truth", "cctv (zoomed)", "plain resize", "AI enhance s1", "AI enhance s2", "AI enhance s3"]):
            d.text((50 + c * W + 10, 15), name, font=f, fill=(0, 0, 0))
        for i in range(10):
            ims = [IMG / f"{i:02d}_truth.png", IMG / f"{i:02d}_{lv}_cctv.png", IMG / f"{i:02d}_{lv}_bicubic.png"] + [IMG / f"{i:02d}_{lv}_ai_s{s}.png" for s in SEEDS]
            d.text((10, 60 + i * H + 50), f"{i}", font=f, fill=(0, 0, 0))
            for c, pth in enumerate(ims):
                sheet.paste(Image.open(pth).convert("RGB").resize((W, H)), (50 + c * W, 50 + i * H))
        sheet.save(OUT / f"sheet_{lv}.jpg", quality=88)
    (OUT / "runs.json").write_text(json.dumps(rows, indent=1))
    print("DONE")


HAND = {}   # (plate, level, seed): what the AI-enhanced plate reads as, by hand (filled in after the run)

if __name__ == "__main__":
    main()
