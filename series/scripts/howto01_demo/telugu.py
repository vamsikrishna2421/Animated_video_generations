import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

device = "cuda:0" if torch.cuda.is_available() else "cpu"
model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts").to(device)
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

prompt = "నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది."
description = "Lalitha speaks in a clear, friendly voice at a moderate pace. The recording is very clear, with no background noise."
desc = description_tokenizer(description, return_tensors="pt").to(device)
prom = tokenizer(prompt, return_tensors="pt").to(device)
generation = model.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask,
                            prompt_input_ids=prom.input_ids, prompt_attention_mask=prom.attention_mask)
audio = generation.cpu().numpy().squeeze()
sf.write("telugu.wav", audio, model.config.sampling_rate)
