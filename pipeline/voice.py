"""Generate per-scene narration with Kokoro (local, offline) and write the timeline
that the Remotion composition reads.

Outputs:
  video/public/audio/voice_<id>.wav
  video/src/timeline.json
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "script" / "promo.json"
MODELS = ROOT / "models"
AUDIO_OUT = ROOT / "video" / "public" / "audio"
TIMELINE_OUT = ROOT / "video" / "src" / "timeline.json"


def main() -> None:
    spec = json.loads(SCRIPT.read_text())
    fps = spec["fps"]
    pad = spec.get("padSeconds", 0.6)
    AUDIO_OUT.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))

    scenes = []
    cursor = 0
    for scene in spec["scenes"]:
        voice = scene.get("voice", spec["voice"])
        samples, sr = kokoro.create(
            scene["text"], voice=voice, speed=scene.get("speed", spec["speed"]), lang=spec["lang"]
        )
        # Trim leading/trailing near-silence so scene timing tracks the speech.
        idx = np.where(np.abs(samples) > 0.01)[0]
        if idx.size:
            samples = samples[max(idx[0] - int(0.05 * sr), 0) : idx[-1] + int(0.1 * sr)]
        # Consistent loudness across scenes: RMS to -16 dBFS, soft-limited to avoid clipping.
        samples = samples * (10 ** (-16 / 20) / (np.sqrt(np.mean(samples**2)) + 1e-9))
        samples = np.tanh(samples * 1.1) / np.tanh(1.1)
        wav = AUDIO_OUT / f"voice_{scene['id']}.wav"
        sf.write(wav, samples, sr)

        voice_frames = math.ceil(len(samples) / sr * fps)
        lead = int(0.35 * fps)  # visuals settle before the voice starts
        duration = lead + voice_frames + int(pad * fps)
        scenes.append(
            {
                "id": scene["id"],
                "caption": scene.get("caption", scene["text"]),
                "from": cursor,
                "durationInFrames": duration,
                "voiceFrom": lead,
                "voiceFrames": voice_frames,
                "audio": f"audio/voice_{scene['id']}.wav",
            }
        )
        print(f"{scene['id']:>8}: {len(samples) / sr:5.2f}s voice -> {duration} frames")
        cursor += duration

    timeline = {
        "fps": fps,
        "totalFrames": cursor,
        "music": {**spec["music"], "audio": "audio/music.wav"},
        "scenes": scenes,
    }
    TIMELINE_OUT.write_text(json.dumps(timeline, indent=2))
    print(f"total: {cursor / fps:.2f}s -> {TIMELINE_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
