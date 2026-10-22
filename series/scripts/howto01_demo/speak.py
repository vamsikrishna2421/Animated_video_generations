from kokoro import KPipeline
import soundfile as sf
pipeline = KPipeline(lang_code='a')
text = "Hello! This voice was made on a computer, with no internet."
for i, (gs, ps, audio) in enumerate(pipeline(text, voice='af_heart')): print(i, gs, ps); sf.write(f'{i}.wav', audio, 24000)
