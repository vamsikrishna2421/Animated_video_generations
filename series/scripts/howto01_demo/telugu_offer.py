# HOW TO 01 demo, take 2: the Telugu line is Ravi's own offer (the reel's payoff). The model card's example, loaded once,
# several seeds, each generation timed. Same mirror note as telugu_timed.py. Usage: python telugu_offer.py <repo> <seeds...>
import json, resource, sys, time
t0 = time.time()
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf
repo, seeds = sys.argv[1], [int(x) for x in sys.argv[2:]]
model = ParlerTTSForConditionalGeneration.from_pretrained(repo).to("cpu")
tokenizer = AutoTokenizer.from_pretrained(repo)
description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
t1 = time.time()
prompt = "రవి కిరాణా లో దీపావళి ఆఫర్! ప్రతి కొనుగోలు మీద పది శాతం తగ్గింపు."
description = "Lalitha speaks in a clear, friendly voice at a moderate pace. The recording is very clear, with no background noise."
desc = description_tokenizer(description, return_tensors="pt")
prom = tokenizer(prompt, return_tensors="pt")
out = {"import_and_load_s": round(t1 - t0, 2), "runs": []}
for sd in seeds:
    torch.manual_seed(sd)
    a = time.time()
    g = model.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask, prompt_input_ids=prom.input_ids, prompt_attention_mask=prom.attention_mask)
    audio = g.cpu().numpy().squeeze()
    sf.write(f"offer_{sd}.wav", audio, model.config.sampling_rate)
    out["runs"].append({"seed": sd, "generate_s": round(time.time() - a, 2), "audio_s": round(len(audio) / model.config.sampling_rate, 2)})
    print(json.dumps(out["runs"][-1]), flush=True)
out["peak_ram_mb"] = round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024)
json.dump(out, open("telugu_offer.json", "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "runs"}))
