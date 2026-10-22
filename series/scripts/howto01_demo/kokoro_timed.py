# HOW TO 01 demo: speak.py with timings (load, generate, audio length, peak RAM). Usage: python kokoro_timed.py <out.json>
import json, resource, sys, time
t0 = time.time()
from kokoro import KPipeline
import soundfile as sf
t1 = time.time()
pipeline = KPipeline(lang_code='a')
t2 = time.time()
text = "Hello! This voice was made on a computer, with no internet."
secs, parts = 0.0, []
for i, (gs, ps, audio) in enumerate(pipeline(text, voice='af_heart')):
    parts.append({"graphemes": gs, "phonemes": ps})
    sf.write(f'kokoro_{i}.wav', audio, 24000)
    secs += len(audio) / 24000
t3 = time.time()
r = {"import_s": round(t1 - t0, 2), "load_s": round(t2 - t1, 2), "generate_s": round(t3 - t2, 2), "audio_s": round(secs, 2),
     "peak_ram_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024), "parts": parts}
print(json.dumps(r, ensure_ascii=False))
json.dump(r, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
