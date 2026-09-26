"""Optional: render scene illustrations with Qwen-Image (needs a CUDA GPU, roughly 24 GB+ VRAM for
full precision; use CPU offload or a quantised build on smaller cards).

For each scene with an "image" prompt, writes video/public/lessons/<id>/img_<n>.png. Then
lesson_voice.py records the image in the timeline and scenes that support images show it.

Usage: python3 pipeline/lesson_images.py episodes/ep01.json [--model Qwen/Qwen-Image]
Install: pip install torch diffusers transformers accelerate
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STYLE = ", vertical composition, clean modern flat illustration, soft lighting, high detail, no text"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("spec", type=Path)
    ap.add_argument("--model", default="Qwen/Qwen-Image", help="any diffusers text-to-image repo, e.g. a newer Qwen-Image release")
    ap.add_argument("--steps", type=int, default=40)
    ap.add_argument("--offload", action="store_true", help="enable CPU offload for smaller GPUs")
    args = ap.parse_args()

    import torch
    from diffusers import DiffusionPipeline

    if not torch.cuda.is_available():
        raise SystemExit("No CUDA GPU found. Skipping image generation; scenes use code-drawn visuals instead.")

    spec = json.loads(args.spec.read_text())
    out = ROOT / "video" / "public" / "lessons" / spec["id"]
    out.mkdir(parents=True, exist_ok=True)
    pipe = DiffusionPipeline.from_pretrained(args.model, torch_dtype=torch.bfloat16)
    if args.offload:
        pipe.enable_model_cpu_offload()
    else:
        pipe.to("cuda")

    for i, scene in enumerate(spec["scenes"], start=1):
        prompt = scene.get("image")
        if not prompt:
            continue
        path = out / f"img_{i:02d}.png"
        image = pipe(
            prompt=prompt + STYLE,
            width=928,
            height=1664,
            num_inference_steps=args.steps,
            generator=torch.Generator("cuda").manual_seed(42 + i),
        ).images[0]
        image.save(path)
        print("wrote", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
