# Voice cast (Telugu + English)

All voices are free and local (AI4Bharat Indic Parler-TTS, `pipeline/parler_tts_local.py`) unless marked ElevenLabs. A voice = speaker name + delivery description (+ optional post-processing). Re-use the exact descriptions below so a character always sounds the same.

## Approved by the user
| Character | Lang | Speaker | Status | Description / processing |
|---|---|---|---|---|
| **Main narrator (Telugu)** | te | Prakash | Picked: voice OK; wants more energy (energetic test pending) | "Prakash speaks like an energetic FM radio host explaining a topic: confident, expressive and upbeat, with a lively but clear pace. The recording is very clear, close-up, studio quality, with no background noise." |
| **Young RJ (Telugu)** | te | Kiran | Liked ("Kiran young also good") | "Kiran speaks like a young, friendly radio host chatting with listeners: casual, cheerful and expressive, at a lively but clear pace. The recording is very clear, close-up, studio quality, with no background noise." |
| **Chirpy sidekick (Telugu)** | te | Kiran | Liked (cartoon sample A) | "Kiran speaks in a very excited, high-pitched, animated and expressive voice, fast and bouncy, like a funny cartoon character. The recording is very clear, close-up, with no background noise." + post: `asetrate=44100*1.32,aresample=44100,atempo=0.9` (pitch up ~5 semitones) |
| **English narrator** | en | Mary (Indian English) | Liked ("voice is nice") | Default `VOICES["en"]`; "AI" is written as "A.I." for pronunciation |
| Telugu narrator (ElevenLabs) | te | Nitya A (`54PRhiFo9gt3cL6Jh53g`) | Liked most, but paid only (free tier disabled) | eleven_v3 |
| English narrator (ElevenLabs) | en | Pooja (`fydPJq00SigRIaPxWgiS`) | Liked, paid only | eleven_v3 |

## Tried, not picked
| Character | Speaker | Verdict |
|---|---|---|
| Female teacher / RJ (Telugu) | Lalitha (teacher, bright RJ, warm RJ) | Rejected: "not nice" and mispronounces |
| Prakash deep RJ | Prakash | Not chosen over the energetic version |
| Kiran storyteller | Kiran | No verdict |
| Robot buddy (cartoon B) | Prakash + ring-mod + lower pitch | No verdict |
| Funny grandpa (cartoon C) | Prakash + 6 Hz vibrato | No verdict |

## Pronunciation rules
- Telugu text in Telugu script, including English loanwords. The model mispronounces Latin letters, and even "ఏఐ" came out wrong for AI; the spelling test ("ఏ ఐ", "ఏ.ఐ.", "ఎ ఐ", "ఏయ్ ఐ") is pending a pick.
- English: "AI" is sent as "A.I.", "LLM" as "L.L.M.", "MCP" as "M.C.P." (`EN_FIX` in `parler_tts_local.py`).

## Using several characters
Conversation scenes can mix characters: the narrator teaches, the chirpy sidekick asks the viewer's question or reacts in one short line, and the young RJ can co-host. Keep the lesson decent: the sidekick gets short reactions or questions, never slang fillers. Spec lines take `"parler_voice"` per line (to add) and `who` for the caption name pill.

## Gaps
- There is no approved Telugu female voice yet (Lalitha was rejected). Options: IndicF5 with a consenting person's voice sample, or test other Indic Parler speakers with a Telugu description.
