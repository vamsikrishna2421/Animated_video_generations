# Narration style guide (spoken, not written)

Goal: sound like a friendly teacher talking to one person, not a slide being read aloud.

1. **Talk to "you".** Use contractions: it's, you'll, don't, that's, here's.
2. **Connect ideas.** Use joining words: *so, now, and, but, here's the thing, that's why, in other words.*
3. **Full sentences over fragment strings.** Not "Better input. Better output. Fewer retries."
   but "You get better answers, and you spend less time retrying."
4. **Vary sentence length.** A short punchy line after a longer one. Avoid three one-word
   sentences in a row.
5. **Commas = breaths.** Put a comma where a person would naturally pause. Don't sprinkle commas
   inside short phrases.
6. **Ask, then answer.** "So why does this happen? Because..."
7. **Speak numbers and symbols the way people say them:** "twenty four days", "under fifteen
   thousand rupees". No slashes, brackets or symbols.
8. **Acronyms:** write LLM, RAG, API, PDF, HR, MCP; plural LLMs as "L L Ms" (see the lexicon).
9. **Avoid starting a take with a word the voice struggles with.** Known ones: Myth, Today,
   Fake, Fresh. Use "Here's a common myth", "In this episode", "made up", "it stays fresh".
10. **Cue markers `[n]`** go right before the word that should trigger the visual.
    `<pause N>` is for deliberate silence (the quiz countdown).
11. After building, run `pipeline/voice_qa.py` and read the list of words the recogniser missed.

Episodes 04+ set `"flow": "continuous"`: each scene is voiced as one continuous take (split
only at `<pause>`), with word timings taken from the model, so intonation carries across
sentences.
