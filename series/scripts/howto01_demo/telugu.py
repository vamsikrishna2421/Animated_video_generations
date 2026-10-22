import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf
model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts")
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
prompt = "రవి కిరాణా లో దీపావళి ఆఫర్! ప్రతి కొనుగోలు మీద పది శాతం తగ్గింపు."
description = "Lalitha speaks in a clear, friendly voice at a moderate pace. The recording is very clear, with no background noise."
desc = description_tokenizer(description, return_tensors="pt")
prom = tokenizer(prompt, return_tensors="pt")
generation = model.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask, prompt_input_ids=prom.input_ids, prompt_attention_mask=prom.attention_mask)
sf.write("telugu.wav", generation.cpu().numpy().squeeze(), model.config.sampling_rate)
