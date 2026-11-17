# EP55 "1 Right or 10? Build Your Own MCP Server" (Season 6, a screen tutorial) · queue 059 · script v1, Nov 17

## The format
A screen tutorial, one narrator, code one line per step (EP54's middle), the hook a same-item count clash from frame 0
(EP53/54's shape; Bujji's reads on both are pending, so EP55 changes nothing in either).

## The lesson
MCP (the Model Context Protocol) is a standard plug: write a tool once as a server; any app that speaks MCP can ask it
what tools it has (name, description, inputs) and call them. The server checks every call against its input schema, a
contract: accept what the AI will really send, show it the types, and test with real questions.

## Point family
N, "Give it a tool: the AI asks, your code does" (EP54). Last two posts: Creative 31 (C), EP54 (N); not consecutive.

## Facts
- Anthropic, "Introducing the Model Context Protocol" (Nov 25, 2024): an open standard for connecting AI tools to data
  sources; spec, SDKs, open-source servers.
- modelcontextprotocol.io: "an open protocol"; "like a USB-C port for AI applications".
- OpenAI added MCP support to its Agents SDK in March 2025 (TechCrunch, Mar 26 2025; DeepLearning.AI The Batch).
- The official Python SDK (mcp 2.3.0, MCPServer): tools from typed Python functions; the inputs are validated (pydantic).

## Our test (pipeline/ep55/: orders_server.py, mcp_demo.py, then orders_server_v2.py, mcp_fix.py; each committed first)
EP54's made-up shop and 10 customers; two bots of the same shop ("website" and "WhatsApp": two system prompts) on the
same small free AI (Qwen2.5-7B-Instruct, 4-bit, llama.cpp); the same generic MCP client code in both; the tool listing
discovered from the server (list_tools).
| run | right | what happened |
|---|---|---|
| website bot, no server | 0 checked | answered all 10 without checking (4417: "processing, 3-5 business days"; the record: not started) |
| WhatsApp bot + server | 1 of 10 | the AI sent {"order_id": 4388} (a number); the schema said text; the SDK refused every call; the bot blamed the customer: "Your order ID is numeric. Please provide the correct alphanumeric order ID" |
| website bot + server | 0 of 10 | the same refusal |
| the fix: order_id: str OR int (+ one docstring sentence), and the types shown | WhatsApp 10 of 10; website 7 of 10 | website's 3 misses: broken JSON from the AI ({"order_id": 4417"}), no call made |
| one change on the server (4417 refund approved) | WhatsApp bot said it | "Your refund of Rs 1,299 has been approved..." with no change to the bot |
The server: 12 lines of code (not counting comments and blank lines).

## Script review (human-viewer, v1), what changed for v2
- "One-word fix" dropped (it was three changes: str | int, one docstring sentence, the client showing the types; none
  tested on its own): "after we fixed its input" / "AFTER FIXING THE INPUT".
- "Refused every call" was wrong: every NUMBER was refused (7), 2 were broken JSON, and the 1 right (4502) was the one
  time the AI sent text. Said and shown.
- The server is 12 lines, not 11. Both bots before and after on screen (WhatsApp 1 -> 10, website 0 -> 7); the update
  names the WhatsApp bot (the website bot broke the JSON again). Step 2 shows that our client code passed the name, not
  the type (the setup for the bug). "Any MCP app" -> "other MCP apps" (we tested only our 2 bots).
- "So which one do I use?": one app, a plain tool (EP54); two or more, a server.
- Telugu: one tight "ఎమ్‌సీపీ" (an "ఎమ్ సీ" break can be heard as an abuse); L3 now the sourced fact on screen
  (the ChatGPT company, its developer tools, 2025), not "many big companies"; రిజెక్ట్ for తిరస్కరించింది; "తప్పు
  ఫార్మాట్‌లో" for "జేసన్" (heard as a name); L8 "రిఫండ్ అప్రూవ్ అయిందని చెప్పింది" ("అదే చెప్పింది" can mean "the same old thing").
- Not taken: leading the caption with "has a bot ever blamed you?" (opinion/experience asks are retired, Standing Rules);
  the ask stays a try-it with a posted answer, made lower-effort (below).

## Script (English, v2; narrator)
1. (hook) Same bot, same ten customers. Plugged into our new MCP server: one right. | After we fixed its input: ten.
2. (what) MCP is a standard plug for AI apps. Put a tool, like our order lookup, in a server once, and any app that speaks MCP can find it and use it.
3. (who) Anthropic released it as an open standard in 2024. OpenAI added it to its Agents SDK in 2025.
4. (step1) Step one: the server. Twelve lines: one function, a one-line description, and its input: the order number, as text.
5. (step2) Step two: the bot asks the server what tools it has. Nothing about orders is written in the bot.
6. (bug) Our test: one right. The AI sent the order number as a number. The server wanted text, and refused it, every time. The one time the AI sent text, it worked.
7. (fix) The fix: accept a number or text, and show the AI the types. Ten out of ten. | Our second bot: zero before, seven now; three times it wrote broken JSON.
8. (update) Then one change on the server, the refund approved, and our WhatsApp bot said so, with no change to the bot.
9. (loop) One app? A plain tool is enough. Two or more? Make it a server. Accept what the AI sends, and test ten real questions. | Next: a voice assistant.

## Script (Telugu, v2)
1. అదే చాట్‌బాట్, అదే పది మంది కస్టమర్లు. మా కొత్త ఎమ్‌సీపీ సర్వర్ కి కలిపితే: ఒక్కటే కరెక్ట్. | ఇన్‌పుట్ సరిచేశాక: పదికి పది.
2. ఎమ్‌సీపీ, చాట్‌బాట్ యాప్ లకి ఒక స్టాండర్డ్ ప్లగ్. మా ఆర్డర్ లుకప్ లాంటి టూల్ ని, ఒక్కసారి సర్వర్ లో పెడితే; ఎమ్‌సీపీ తెలిసిన ప్రతి యాప్, దాన్ని కనుక్కొని వాడగలదు.
3. ఆంత్రోపిక్, రెండు వేల ఇరవై నాలుగులో దీన్ని ఓపెన్ స్టాండర్డ్ గా విడుదల చేసింది. చాట్‌జీపీటీ కంపెనీ కూడా, రెండు వేల ఇరవై ఐదులో దీన్ని తన డెవలపర్ టూల్స్ లో చేర్చింది.
4. స్టెప్ వన్: సర్వర్. పన్నెండు లైన్లు: ఒక ఫంక్షన్, ఒక లైన్ వివరణ, దాని ఇన్‌పుట్: ఆర్డర్ నంబర్, టెక్స్ట్ గా.
5. స్టెప్ టూ: చాట్‌బాట్, సర్వర్ దగ్గర ఉన్న టూల్స్ గురించి అడుగుతుంది. ఆర్డర్ల గురించి, చాట్‌బాట్ లో ఒక్క లైన్ కూడా లేదు.
6. మా టెస్ట్: ఒక్కటే కరెక్ట్. చాట్‌బాట్ ఆర్డర్ నంబర్ ని అంకెగా పంపింది. సర్వర్ టెక్స్ట్ అడిగింది, ప్రతిసారీ రిజెక్ట్ చేసింది. టెక్స్ట్ గా పంపిన ఒక్కసారి మాత్రం, పని చేసింది.
7. ఫిక్స్: అంకె అయినా, టెక్స్ట్ అయినా తీసుకోవాలి; చాట్‌బాట్‌కి టైప్స్ కూడా చూపించాలి. పదికి పది. | మా రెండో చాట్‌బాట్: ముందు సున్నా, ఇప్పుడు ఏడు; మూడుసార్లు తప్పు ఫార్మాట్‌లో రాసింది.
8. తర్వాత, సర్వర్ లో ఒక్క మార్పు: రిఫండ్ అప్రూవ్డ్. చాట్‌బాట్ ని మార్చకుండానే, వాట్సాప్ బాట్ రిఫండ్ అప్రూవ్ అయిందని చెప్పింది.
9. ఒక్క యాప్ కి, మామూలు టూల్ చాలు. రెండు, అంతకంటే ఎక్కువ యాప్స్ కి, సర్వర్ గా రాసుకోండి. చాట్‌బాట్ పంపేది తీసుకునేలా రాసుకోండి; పది నిజమైన ప్రశ్నలతో టెస్ట్ చేసుకోండి. | తర్వాత: వాయిస్ అసిస్టెంట్.

## Render review (human-viewer, EN v1), what changed
- A contradiction: "the bot now shows the AI the type" vs "no change to the bot". The type display is a one-time change in
  the generic client code (for every tool, nothing about orders); labelled so, and the update chip says "only the server
  data" changed. "orders_server.py · the one change" -> "· the fix" (the docstring changed too).
- Subtitles were under the Instagram overlay (top 1500): moved to 1360, into the empty band. Grey footnotes enlarged.
- The bug at phone size: the wrapped JSON replaced by two big cards, 4388 (a number) vs "4502" (text, the 1 right), and
  a tally under 1/10 that adds up (7 refused, 2 broken JSON, 1 right). The unspoken "name, not the type" chip moved to
  the fix frame's label.
- Step 1's docstring now matches the server's real description (cut with "…"); the card says "4 of its 12 lines".
- End card: no doubled "1 1 app"; one size for all three rows; "one app: the tool inside the bot (EP54)"; the try-it
  (4388 and #4388) on the card.
- Sound: drops before "ten out of ten" (0.45 s) and before "approved" (0.4 s), a boom and ding on "approved"; music in
  the gaps 0.3 -> 0.22 (it jumped above the voice between lines); the hook louder (boost 1.6), the middle lower, a swell
  from the update into the end (my own check: the arc was flat); "accept" re-voiced (heard as "except").
- A red pulse on "1/10 right" when the voice says it, so the hook moves before 0:08.

## Caption ask (a try-it with a posted answer)
"Try it: give a shop's chatbot your own order number two ways, 4388 and #4388. Post whether both worked."
Line two, for builders: "Give your tool to a small AI, send it 10 real questions, and post how many it got right before
and after you fixed the inputs."
