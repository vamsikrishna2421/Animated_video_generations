"""Instagram post copy per episode, written to out/<id>_captions.txt next to each video.
Format (for upload automation): a VIDEO line, then sections headed '=== NAME ==='.
Run: python3 pipeline/captions_data.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEXT = "Follow @ai_maastaaru for the full series."
QUIZ = "Quiz at the end. Got it right? Comment below."

POSTS = {
"ep00": dict(
 caption="""Want to learn AI but don't know where to start?

Welcome to AI From Scratch, a new series on AI Maastaaru.

Every episode:
- Under 3 minutes
- Plain words, no jargon
- Real examples from apps you already use
- A quick quiz at the end

Season 1: Foundations (AI vs ML, LLMs, tokens, prompts, embeddings)
Season 2: Build with AI (RAG, tools, agents, MCP)
Season 3: Hands-on (build your own AI apps)

No coding needed to start. Just curiosity.

Follow @ai_maastaaru and turn on notifications so you don't miss an episode.

Comment "AI" if you're in.""",
 tags="#AIMaastaaru #AIFromScratch #LearnAI #AIForBeginners #ArtificialIntelligence",
 pinned="Which topic should I explain first after the basics: RAG, AI agents, or prompt engineering? Comment below.",
 cover="'Learn AI from scratch' title frame (first 2 seconds)",
 alt="Animated teacher introducing the AI From Scratch series: 3-minute AI lessons for beginners."),
"ep01": dict(
 caption=f"""AI, ML, Deep Learning, GenAI. Everyone uses these words. What's the actual difference?

Episode 1 of AI From Scratch, in under 3 minutes:

- AI: the big idea, machines doing things that need human intelligence
- Machine Learning: learns patterns from data instead of hand-written rules
- Deep Learning: neural networks with many layers
- Generative AI: creates new text, images, music, code, even voices

Real examples inside: Gmail spam filter, Netflix recommendations, face unlock, ChatGPT.

Quick quiz at the end: is face unlock Generative AI? Comment your answer.

Save this for later. Next episode: What is an LLM?
Follow @ai_maastaaru so you don't miss it.""",
 tags="#AIMaastaaru #LearnAI #AIForBeginners #MachineLearning #GenerativeAI",
 pinned="Quiz answer: Face unlock is Deep Learning, not Generative AI. It recognises your face, it doesn't create one. How many did you get right?",
 cover="'AI vs ML vs Deep Learning vs GenAI' title card",
 alt="Animated lesson explaining the difference between AI, machine learning, deep learning and generative AI with real-world examples."),
"ep02": dict(
 caption=f"""How does ChatGPT actually "think"?

It plays one game, again and again: guess the next word.

Episode 2 of AI From Scratch:
- What an LLM (Large Language Model) really is
- The next-word prediction trick, shown live
- How LLMs are made: pre-training, fine-tuning, human feedback
- Jargon buster: parameters, training, inference, prompt
- The big myth: "LLMs are always right"

{QUIZ}

Next: Tokens and context window, or why AI forgets things in long chats.
{NEXT}""",
 tags="#AIMaastaaru #LearnAI #LLM #ChatGPT #AIForBeginners",
 pinned="Quiz answer: An LLM writes by predicting the next word, again and again. It is not searching Google each time. Did you get it?",
 cover="'What is an LLM?' title card",
 alt="Animated lesson explaining what a large language model is and how it predicts the next word."),
"ep03": dict(
 caption=f"""Ever had a long chat with ChatGPT and it forgot what you said at the start?

That's not a bug. It's tokens and the context window.

Episode 3 of AI From Scratch:
- Tokens: how AI actually reads text
- 1 token = about 3/4 of a word
- Context window: the AI's working memory
- Why old messages "fall out" in long chats
- Why tokens decide your AI bill

{QUIZ}

Next: Prompt engineering, or how to get great answers from AI.
{NEXT}""",
 tags="#AIMaastaaru #LearnAI #ChatGPT #AIForBeginners #PromptEngineering",
 pinned="Quiz answer: Your name fell out of the context window. Tip: when a long chat starts acting weird, start a fresh chat or ask for a summary.",
 cover="'Tokens & Context' title card",
 alt="Animated lesson explaining tokens and the context window in AI chatbots."),
"ep04": dict(
 caption=f"""Same AI. Same question. So why do some people get amazing answers and others get junk?

It's all in the prompt.

Episode 4 of AI From Scratch: Prompt Engineering
- The recipe: Role + Context + Task + Format
- Watch a lazy prompt turn into a great one, live
- 4 power moves: examples, step by step, clear limits, iterate
- Use it today: resume review, polite WhatsApp replies, meeting notes

{QUIZ}

Save this and try it on your next prompt.
Next: Temperature and hallucinations, or why AI confidently makes things up.
{NEXT}""",
 tags="#AIMaastaaru #PromptEngineering #LearnAI #ChatGPT #AIForBeginners",
 pinned="Quiz answer: B. It has a role, context, a clear task and a format. Try the recipe on your next ChatGPT prompt and tell me the difference.",
 cover="'Prompt Engineering' title card",
 alt="Animated lesson showing how to write better AI prompts using role, context, task and format."),
"ep05": dict(
 caption=f"""Why does AI sometimes make things up, and say them with total confidence?

Episode 5 of AI From Scratch: Temperature and Hallucinations
- Temperature: the creativity dial inside every AI
- Watch the same prompt at 0, 0.7 and 1
- Cheat sheet: when to go low, when to go high
- Why hallucinations happen
- 3 ways to protect yourself from fake answers

{QUIZ}

Next: Embeddings, or how AI understands meaning.
{NEXT}""",
 tags="#AIMaastaaru #LearnAI #ChatGPT #AIForBeginners #GenerativeAI",
 pinned="Quiz answer: Low temperature. For banking code you want precise answers that repeat every time. Have you ever caught AI making something up? Share below.",
 cover="'Temperature & Hallucinations' title card",
 alt="Animated lesson explaining AI temperature settings and why AI hallucinates."),
"ep06": dict(
 caption=f"""How does Google Photos find your dog when you just type "dog"?

Episode 6 of AI From Scratch: Embeddings
- Embeddings: turning meaning into numbers
- A map of meaning, where "puppy" lands next to dog and cat
- Vector search, step by step
- Where you already use it: photo search, similar songs, "you may also like"
- Why search now matches meaning, not just keywords

{QUIZ}

Next: RAG, or how to make AI answer from your own documents.
{NEXT}""",
 tags="#AIMaastaaru #LearnAI #Embeddings #AIForBeginners #MachineLearning",
 pinned="Quiz answer: Queen. Similar meaning, so they sit close together on the map. What's a search that surprised you by finding exactly what you meant?",
 cover="'Embeddings' title card",
 alt="Animated lesson explaining embeddings and vector search with a map of word meanings."),
"ep07": dict(
 caption=f"""Ask ChatGPT about your company's leave policy and it has no idea. The fix is called RAG.

Episode 7 of AI From Scratch: RAG (Retrieval-Augmented Generation)
- Closed book vs open book exam: the easiest way to understand RAG
- Retrieve, Augment, Generate, explained simply
- A real HR policy bot, step by step
- Where companies use RAG today
- Why it's so popular: fresh, private, cites sources, cheap

This is the most used AI pattern in companies right now. Save it.

{QUIZ}

Next: Prompting vs RAG vs Fine-tuning, and which one to use when.
{NEXT}""",
 tags="#AIMaastaaru #RAG #LearnAI #GenerativeAI #AIForBeginners",
 pinned="Quiz answer: R stands for Retrieval. Find the right information first, then answer. Where would you use a RAG bot at your workplace?",
 cover="'RAG' title card",
 alt="Animated lesson explaining retrieval-augmented generation with an HR policy chatbot example."),
"ep08": dict(
 caption=f"""You want an AI that knows your business. Better prompt, RAG, or fine-tuning?

Episode 8 of AI From Scratch: Prompting vs RAG vs Fine-tuning
- What fine-tuning actually is
- The new-employee analogy that makes it click
- Cheat sheet: cost, fresh info, custom style, time to start
- Real examples: startup captions, law firm Q&A, brand-tone support
- Rule of thumb: prompt first, RAG for knowledge, fine-tune for behaviour

{QUIZ}

Next: Tool use, or how AI checks the weather, books a cab, or sends an email.
{NEXT}""",
 tags="#AIMaastaaru #LearnAI #RAG #FineTuning #AIForBeginners",
 pinned="Quiz answer: RAG. Update the documents and the answers update instantly, no retraining needed. Which one would your business need first?",
 cover="'Prompt vs RAG vs Fine-tune' title card",
 alt="Animated lesson comparing prompting, RAG and fine-tuning with a cheat sheet and real examples."),
"ep09": dict(
 caption=f"""On its own, an AI can only write text. So how does it check the weather or book a cab?

Episode 9 of AI From Scratch: Tool Use (Function Calling)
- What function calling really means
- Live demo: "Should I carry an umbrella in Hyderabad today?"
- Who does what: the AI asks, your app runs it
- Where you already see it: calendars, flight prices, order tracking
- The big myth: "AI is logged into my apps"

{QUIZ}

Next: AI Agents, when AI plans and uses tools on its own.
{NEXT}""",
 tags="#AIMaastaaru #LearnAI #FunctionCalling #AIAgents #AIForBeginners",
 pinned="Quiz answer: Your app runs the function. The AI only asks. That's what keeps you in control. What task would you give an AI with tools?",
 cover="'Tool Use' title card",
 alt="Animated lesson explaining AI tool use and function calling with a live weather example."),
"ep10": dict(
 caption=f"""A chatbot answers. An agent gets things done.

Episode 10 of AI From Scratch: AI Agents
- What an AI agent is: an LLM + tools + a loop
- Plan, act, observe: watch an agent plan a Goa trip under 15,000 rupees
- Chatbot vs agent, side by side
- Agents at work: coding, research, customer service
- Why good agents still check with a human

{QUIZ}

Next: MCP, the universal connector for AI tools.
{NEXT}""",
 tags="#AIMaastaaru #AIAgents #LearnAI #GenerativeAI #AIForBeginners",
 pinned="Quiz answer: An agent works in a loop, using tools, toward a goal. What's one task you'd hand over to an AI agent?",
 cover="'AI Agents' title card",
 alt="Animated lesson explaining AI agents with a plan-act-observe loop and a trip-planning example."),
"ep11": dict(
 caption=f"""How does one AI connect to Gmail, your calendar, GitHub and your company data?

Episode 11 of AI From Scratch: MCP (Model Context Protocol)
- Why AI needed a "USB-C port"
- What MCP is, in plain words
- How it flows: host, MCP client, MCP server, your data
- MCP in 4 words: host, server, tools, resources
- Where it's used today: assistants, coding tools, company data

{QUIZ}

Next: Multimodal AI, or how AI sees, hears and speaks.
{NEXT}""",
 tags="#AIMaastaaru #MCP #LearnAI #AIAgents #AIForBeginners",
 pinned="Quiz answer: An MCP server is a connector for one app or data source, like Gmail or GitHub. Which app would you connect your AI to first?",
 cover="'MCP' title card",
 alt="Animated lesson explaining the Model Context Protocol, the open standard that connects AI apps to tools and data."),
"uc01": dict(
 caption="""You call a clinic and an AI voice books your appointment. How does that actually work?

Real World AI, Use Case 01: the AI phone call assistant
- The loop: listen, think, speak, repeat
- Stage 1: speech to text
- Stage 2: an LLM with tools decides the reply
- Stage 3: text to speech
- The hard parts: speed, interruptions, turn taking, human hand-off

Quiz at the end. Got it right? Comment below.

Which app should I break down next? Comment it below.
Follow @ai_maastaaru for more real world AI breakdowns.""",
 tags="#AIMaastaaru #VoiceAI #LearnAI #AIAgents #AIForBeginners",
 pinned="Quiz answer: Speech to text, then the LLM, then text to speech. Drop the app you want me to break down next!",
 cover="'AI Phone Assistant' title card",
 alt="Animated breakdown of how an AI phone call assistant works: speech to text, an LLM with tools, and text to speech in a loop."),
}


def all_posts() -> dict:
    """Posts defined here, plus any episode JSON with a "post" object (newer episodes)."""
    import json
    posts = dict(POSTS)
    for f in sorted((ROOT / "episodes").glob("*.json")):
        spec = json.loads(f.read_text())
        if "post" in spec:
            posts[spec["id"]] = spec["post"]
    return posts


def serialize(out: Path) -> dict:
    """Rename rendered videos to <serial>_<id>_<slug>.mp4 per series/upload_order.json.
    Already-posted uploads move to out/posted/. Returns {id: (serial, dir)}."""
    import json
    import re
    cfg = json.loads((ROOT / "series" / "upload_order.json").read_text())
    posted = out / "posted"
    posted.mkdir(exist_ok=True)
    where = {}
    for k, i in enumerate(cfg["order"]):
        serial = f"{k + 1:03d}"
        dest = posted if k < cfg["posted_through"] else out
        where[i] = (serial, dest)
        vids = [v for v in list(out.glob("*.mp4")) + list(posted.glob("*.mp4")) if re.match(rf"^(\d{{3}}_)?{i}_", v.name)]
        if not vids:
            continue
        newest = max(vids, key=lambda v: v.stat().st_mtime)
        spec, tl = ROOT / "episodes" / f"{i}.json", ROOT / "video" / "src" / "lesson" / "timelines" / f"{i}.json"
        if dest == out and spec.exists():
            s_m = spec.stat().st_mtime
            # Script edited after this video (or after the voice pass it used): old render, never upload it.
            if newest.stat().st_mtime < s_m or (tl.exists() and tl.stat().st_mtime < s_m):
                for v in vids:
                    v.unlink()
                continue
        slug = re.sub(rf"^(\d{{3}}_)?{i}_", "", newest.name)
        target = dest / f"{serial}_{i}_{slug}"
        if newest != target:
            newest.replace(target)
        for v in vids:
            if v != newest and v.exists() and v != target:
                v.unlink()
    return where


def main() -> None:
    import json
    out = ROOT / "out"
    where = serialize(out)
    for old in list(out.glob("*_captions.txt")) + list((out / "posted").glob("*_captions.txt")):
        old.unlink()
    rows, items = [], []
    for ep, p in all_posts().items():
        if ep not in where:
            continue  # not scheduled for upload (e.g. q01, q02)
        serial, dest = where[ep]
        videos = sorted(dest.glob(f"{serial}_{ep}_*.mp4"))
        video = videos[0].name if videos else f"{serial}_{ep}_<not rendered yet>.mp4"
        assert len(p["tags"].split()) <= 5, ep
        text = (
            f"UPLOAD: {serial}\n"
            f"VIDEO: {video}\n\n"
            f"=== CAPTION ===\n{p['caption'].strip()}\n\n"
            f"=== HASHTAGS ===\n{p['tags']}\n\n"
            f"=== PINNED_COMMENT ===\n{p['pinned']}\n\n"
            f"=== COVER ===\n{p['cover']}\n\n"
            f"=== ALT_TEXT ===\n{p['alt']}\n"
        )
        (dest / f"{serial}_{ep}_captions.txt").write_text(text)
        spec = ROOT / "episodes" / f"{ep}.json"
        title = json.loads(spec.read_text())["title"] if spec.exists() else ep
        status = "posted" if dest.name == "posted" else ("ready" if videos else "rendering soon")
        rows.append((serial, ep, title, status))
        items.append({"serial": serial, "id": ep, "title": title, "status": status,
                      "video": f"{dest.relative_to(ROOT)}/{video}" if videos else None,
                      "captions": f"{dest.relative_to(ROOT)}/{serial}_{ep}_captions.txt"})
    rows.sort()
    (out / "UPLOAD_ORDER.md").write_text(
        "# Upload order\n\nPost strictly by serial. Files: `out/<serial>_<id>_*.mp4` + `out/<serial>_<id>_captions.txt`.\n"
        "Already posted: `out/posted/`.\n\n| Serial | ID | Title | Status |\n|---|---|---|---|\n"
        + "".join(f"| {s} | {i} | {t} | {st} |\n" for s, i, t, st in rows))
    items.sort(key=lambda x: x["serial"])
    nxt = next((x for x in items if x["status"] != "posted"), None)
    (out / "upload_queue.json").write_text(json.dumps({
        "how_to_use": "Upload items in ascending serial order. Skip status 'posted'. Upload only status 'ready' (video exists); "
                      "if the next serial is 'rendering soon', wait and re-read this file. Never skip ahead past a missing serial.",
        "next_serial": nxt["serial"] if nxt else None,
        "items": items}, indent=1, ensure_ascii=False) + "\n")
    print("wrote captions for", len(rows), "uploads; see out/UPLOAD_ORDER.md")


if __name__ == "__main__":
    main()
