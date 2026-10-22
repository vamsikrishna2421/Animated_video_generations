from kokoro import KPipeline
import soundfile as sf

pipeline = KPipeline(lang_code='a')   # 'a' = American English
text = "Hello! This voice was made on a laptop, with no internet."
for i, (gs, ps, audio) in enumerate(pipeline(text, voice='af_heart')):
    print(i, gs, ps)
    sf.write(f'{i}.wav', audio, 24000)
