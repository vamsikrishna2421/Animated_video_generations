"""Transcribe WAVs with an offline Whisper (sherpa-onnx) to sanity-check TTS pronunciation.
Usage: python3 pipeline/asr_check.py <model_dir> file1.wav [file2.wav ...]
Model: https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-base.en.tar.bz2
"""
import sys
from pathlib import Path

import numpy as np
import sherpa_onnx
import soundfile as sf


def recognizer(model_dir: Path):
    return sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(model_dir / "base.en-encoder.int8.onnx"),
        decoder=str(model_dir / "base.en-decoder.int8.onnx"),
        tokens=str(model_dir / "base.en-tokens.txt"),
        num_threads=4,
    )


def transcribe(rec, audio: np.ndarray, sr: int) -> str:
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if sr != 16000:
        audio = np.interp(np.arange(0, len(audio), sr / 16000), np.arange(len(audio)), audio)
    s = rec.create_stream()
    s.accept_waveform(16000, audio.astype(np.float32))
    rec.decode_stream(s)
    return s.result.text.strip()


if __name__ == "__main__":
    rec = recognizer(Path(sys.argv[1]))
    for f in sys.argv[2:]:
        a, sr = sf.read(f)
        print(f"{Path(f).name}: {transcribe(rec, a, sr)}")
