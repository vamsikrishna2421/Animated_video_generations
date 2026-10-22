# HOW TO 01 demo: telugu.py with timings. Our run loads the same weights from a public mirror (RXD03/indic-parler-tts,
# model.safetensors 3,751,321,772 bytes, the same size as ai4bharat's file): the official repo needs a logged-in account,
# and this machine holds no tokens. Usage: python telugu_timed.py <repo> <out.json> [seed]
import json, resource, sys, time
t0 = time.time()
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf
repo, out = sys.argv[1], sys.argv[2]
torch.manual_seed(int(sys.argv[3]) if len(sys.argv) > 3 else 0)
t1 = time.time()
model = ParlerTTSForConditionalGeneration.from_pretrained(repo).to("cpu")
tokenizer = AutoTokenizer.from_pretrained(repo)
description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
t2 = time.time()
prompt = "నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది."
description = "Lalitha speaks in a clear, friendly voice at a moderate pace. The recording is very clear, with no background noise."
desc = description_tokenizer(description, return_tensors="pt")
prom = tokenizer(prompt, return_tensors="pt")
generation = model.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask,
                            prompt_input_ids=prom.input_ids, prompt_attention_mask=prom.attention_mask)
audio = generation.cpu().numpy().squeeze()
t3 = time.time()
sf.write(out.replace(".json", ".wav"), audio, model.config.sampling_rate)
r = {"import_s": round(t1 - t0, 2), "load_s": round(t2 - t1, 2), "generate_s": round(t3 - t2, 2),
     "audio_s": round(len(audio) / model.config.sampling_rate, 2), "sr": model.config.sampling_rate,
     "peak_ram_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024), "threads": torch.get_num_threads()}
print(json.dumps(r))
json.dump(r, open(out, "w"), indent=1)
