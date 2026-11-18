# EP56 test notes

First attempt of step 2 (Nov 18, before any result was kept): two faults in our set-up, fixed before the run that counts.
1. The English clips: Parler read the digits in the English questions ("order 4417", "Rs 1,299") in Hindi, so
   Whisper heard e.g. "ordered Chalgarhita patient". Our test audio's fault, not the ears'. make_questions.py now writes
   the English numbers as words ("forty-four seventeen"), the way people say them, and remade only the English clips.
2. voice_demo.py ran out of memory loading Whisper large-v3 while Whisper small was still loaded (ears D). Now one ears
   model is in memory at a time.
What the first attempt showed before it stopped (Telugu clips, unchanged): Whisper small writing Telugu speech in Hindi
letters (B: 6 of 10) or looping text (B: 4 of 10, 45-50 s each); small translating to English (C) got "Order 40, 417",
"4295", "43rd January"; large-v3 (D) wrote "ఆల్డార్ 40, 4, 17 ..." for 4417. These are re-run below, unchanged.

Second attempt (the English clips remade): the ears A, B, C ran; it ran out of memory again at D (Whisper large-v3
loading while the AI model sat in the RAM disk). voice_demo.py now runs as two steps, `ears` then `brain`, with the AI
model downloaded only for the brain. Nothing else changed.
