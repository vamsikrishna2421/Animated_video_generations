# HOW TO 05 "Fake-video check": we make a fake ourselves, then run the checks on it. Committed before it ran.
#   HF_HUB_CACHE=/home/user/hfcache python3 pipeline/howto05/fake_demo.py make   # models on disk, not in RAM     # the AI clip (3 shots), timed
#   python3 pipeline/howto05/fake_demo.py label                             # check 2: does the file carry any AI label?
#   python3 pipeline/howto05/fake_demo.py sheets                            # check 1: every frame, for a hand check (HAND)
# The fake: a "flood at Ameerpet, right now" clip, the kind forwarded with a relief-fund UPI ID. Made with a free
# model on this machine's CPU (4 cores, no GPU): AnimateDiff-Lightning (ByteDance, 4-step, CreativeML OpenRAIL-M) on
# the epiCRealism base (Stable Diffusion 1.5, CreativeML OpenRAIL-M). Seeds, prompts and settings fixed below; we keep
# every shot it makes (no re-rolling for a better or worse fake). No real person, place footage or brand is copied.
# A real clip for comparison was planned (backlog row 05); Wikimedia Commons refused this machine's shared network
# (HTTP 429) and there is no camera here, so this run tests the fake only, and the reel says so.
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/howto05_demo"
BASE, MOTION = "emilianJR/epiCRealism", ("ByteDance/AnimateDiff-Lightning", "animatediff_lightning_4step_diffusers.safetensors")
W, H, FRAMES, FPS, STEPS = 432, 768, 16, 8, 4
SHOTS = [   # (seed, prompt): a phone video of a flooded street; shot 1 asks for a readable sign (check 1 looks at it)
    (1119, "phone video of a flooded street in Hyderabad, India, heavy monsoon rain, brown water up to the car doors, "
           "auto rickshaws stuck in water, people wading, a shop signboard that says AMEERPET, overcast, realistic, amateur footage"),
    (2219, "phone video, flood water rushing down a city road in India, a white car floating, buildings on both sides, "
           "heavy rain, realistic, amateur footage"),
    (3319, "phone video, people standing on a flooded street in India holding umbrellas, rain, water up to the knees, "
           "shop signs, realistic, amateur footage"),
]
HAND = {}   # check 1, filled in by hand after looking at every frame (sheets): what a pause shows


def make():
    import torch
    from diffusers import AnimateDiffPipeline, EulerDiscreteScheduler, MotionAdapter
    from huggingface_hub import hf_hub_download, snapshot_download
    from safetensors.torch import load_file
    torch.set_num_threads(4)
    t0 = time.time()
    base = snapshot_download(BASE, allow_patterns=["model_index.json", "scheduler/*", "tokenizer/*", "text_encoder/config.json",
                                                   "text_encoder/model.safetensors", "unet/config.json", "unet/diffusion_pytorch_model.safetensors",
                                                   "vae/config.json", "vae/diffusion_pytorch_model.safetensors", "feature_extractor/*"])
    mot = hf_hub_download(*MOTION)
    dl = time.time() - t0
    dt = torch.bfloat16
    adapter = MotionAdapter().to(dtype=dt)
    adapter.load_state_dict(load_file(mot))
    pipe = AnimateDiffPipeline.from_pretrained(base, motion_adapter=adapter, torch_dtype=dt)
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing", beta_schedule="linear")
    pipe.enable_attention_slicing(4)   # first try was killed for memory (full 5,184-token attention for 16 frames at once)
    pipe.enable_vae_slicing()          # decode one frame at a time
    load = time.time() - t0 - dl
    res = {"model": f"{MOTION[0]} ({MOTION[1]}) on {BASE}", "licence": "CreativeML OpenRAIL-M (both)", "device": "CPU, 4 cores, bfloat16",
           "size": [W, H], "frames": FRAMES, "fps": FPS, "steps": STEPS, "download_s": round(dl, 1), "load_s": round(load, 1), "shots": []}
    for i, (seed, prompt) in enumerate(SHOTS, 1):
        t = time.time()
        out = pipe(prompt=prompt, guidance_scale=1.0, num_inference_steps=STEPS, num_frames=FRAMES, height=H, width=W,
                   generator=torch.Generator("cpu").manual_seed(seed))
        sec = time.time() - t
        d = OUT / f"shot{i}"
        d.mkdir(parents=True, exist_ok=True)
        for k, im in enumerate(out.frames[0]):
            im.save(d / f"f{k:02d}.png")
        res["shots"].append({"shot": i, "seed": seed, "prompt": prompt, "seconds": round(sec, 1)})
        print(f"shot {i}: {sec:.0f} s", flush=True)
        (OUT / "make.json").write_text(json.dumps(res, indent=1))
    res["make_s"] = round(sum(s["seconds"] for s in res["shots"]), 1)
    (OUT / "make.json").write_text(json.dumps(res, indent=1))
    import subprocess
    lst = OUT / "frames.txt"
    lst.write_text("".join(f"file 'shot{s}/f{k:02d}.png'\nduration {1 / FPS}\n" for s in (1, 2, 3) for k in range(FRAMES)))
    subprocess.run(["/tmp/claude-0/ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-vf", "fps=24,format=yuv420p",
                    "-c:v", "libx264", "-crf", "20", str(OUT / "fake_flood.mp4")], check=True)
    print("made", OUT / "fake_flood.mp4", res["make_s"], "s")


def label():
    """Check 2. YouTube and Meta add an AI label when the creator discloses it, or when the file carries an industry
    signal (C2PA Content Credentials, IPTC 'trainedAlgorithmicMedia'). Does ours? Scan the clip and one frame."""
    import subprocess
    marks = [b"c2pa", b"C2PA", b"jumb", b"trainedAlgorithmicMedia", b"compositeSynthetic", b"DigitalSourceType", b"SynthID"]
    res = {}
    for f in [OUT / "fake_flood.mp4", OUT / "shot1/f00.png"]:
        b = f.read_bytes()
        tags = json.loads(subprocess.run(["/tmp/claude-0/ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(f)],
                                         capture_output=True, text=True).stdout)
        res[f.name] = {"bytes": len(b), "ai_marks_found": [m.decode() for m in marks if m in b],
                       "format_tags": tags.get("format", {}).get("tags", {}),
                       "stream_tags": [s.get("tags", {}) for s in tags.get("streams", [])]}
    (OUT / "label.json").write_text(json.dumps(res, indent=1))
    print(json.dumps(res, indent=1))


def sheets():
    from PIL import Image
    for s in (1, 2, 3):
        fr = [Image.open(OUT / f"shot{s}/f{k:02d}.png") for k in range(FRAMES)]
        w, h = fr[0].size
        sh = Image.new("RGB", (w * 8, h * 2))
        for k, im in enumerate(fr):
            sh.paste(im, ((k % 8) * w, (k // 8) * h))
        sh.save(OUT / f"sheet{s}.jpg", quality=85)
    print("sheets in", OUT)


if __name__ == "__main__":
    {"make": make, "label": label, "sheets": sheets}[sys.argv[1]]()
