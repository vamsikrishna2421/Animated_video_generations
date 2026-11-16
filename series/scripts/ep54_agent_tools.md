# EP54 "Build an AI Agent with Tools" (Season 6, a screen tutorial) · queue 058 · script v1, Nov 16

## The format
A screen tutorial (Season 6), one narrator, the chat and one code line per step drawn in our crayon style. Verdict first:
the clash in frame 1, then three steps, the test, the rule, the loop. One variable vs EP53 (Bujji's EP52 48h read: the
code middle lost everyone, ~6% watched): each step shows ONE big code line; the full runnable code is in the pinned
comment only. Hook shape (a same-item number clash from frame 0) and the ask (post your answer) stay as EP53.

## The lesson
An agent = an AI that can ask your code to do things. You describe a tool; the AI answers with one JSON line asking for
it; your code runs the tool (the AI never touches your system) and sends the result back; the AI answers from it.
OpenAI's "Function calling" guide and Google's "Function calling with the Gemini API" describe the same loop: the model
returns the function name and arguments, your application runs it and sends the result back.

## Point family
New family N, "Give it a tool: the AI asks, your code does". Last two posts: Creative 30 (B), EP53 (M).

## Frame 1 (the reach stack + the same-item clash)
The same refund, order 4417 (Bluetooth earphones, ₹1,299): "THE BOT SAID ₹1,299 REFUNDED" (red) vs "THE SHOP'S RECORD
₹0 · not started" (green). The person at stake: a customer waiting for ₹1,299; the AI the culprit (it had no way to look
and wrote what refund replies usually say). Line 1 says both numbers in ~3 s, EN and TE.

## Our test (pipeline/ep54/agent_demo.py; series/scripts/ep54_demo/agent.json; committed before it ran)
A made-up shop (Kiran Mobiles) with 10 orders in its system; 10 customers ask about their own order. The same small
free AI as EP51-53 (Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on our computer), temperature 0.2, one fresh chat each.
| run | result |
|---|---|
| no tool (a support-bot prompt) | answered 10 of 10 without any way to check; 6 wrong (4417 "refund of Rs 1,299 has been processed": not started; 4502 "shipped": packed; 4475 "ships in 2-3 days": out for delivery today; 4650 "confirmed": payment pending; 4362 "delivered on March 15th": Nov 9; 4388 "5-7 business days": Nov 18); 3 right by luck; 1 pretended "We're checking" |
| one tool, get_order(order_id) | called it 10 of 10 with the right number; 10 of 10 answers right from the record |

## The code on screen (one line per step) and in the pinned comment (all of it)
- step 1: `TOOL = "get_order(order_id): status and refund from our system"`
- step 2: `result = get_order(json.loads(reply)["order_id"])`
- step 3: `messages.append({"role": "user", "content": f"Tool result: {result}"})`

## Script (English, v1; narrator)
1. (hook) One thousand two hundred ninety-nine rupees refunded, said the shop's bot. The shop's own record: zero. The refund hasn't even started.
2. (why) The bot had no way to look. So it wrote what a refund reply usually says.
3. (title) Today: give it one tool. An agent is an AI that can ask your code to do things.
4. (step1) Step one: describe the tool: get order, by order number. To use it, the AI replies with one line of JSON.
5. (step2) Step two: your code reads that line and looks the order up. The AI never touches your system. Your code does.
6. (step3) Step three: send the result back. Now it answers from the shop's record.
7. (test) Our test, ten customers. Without the tool, it answered all ten without checking, and six were wrong. | With the tool, it looked up all ten, and all ten were right.
8. (rule) If you build one: the AI only asks; your code decides what runs. If you use one: check your refund on the shop's own order page.
9. (loop) Next: build your own MCP server. And order forty-four seventeen? Zero rupees. Refund not started.

## Script (Telugu, v1)
1. వెయ్యి రెండు వందల తొంభై తొమ్మిది రూపాయలు రిఫండ్ అయింది, అంది షాప్ చాట్‌బాట్. షాప్ రికార్డ్ లో: సున్నా. రిఫండ్ ఇంకా స్టార్ట్ కూడా కాలేదు.
2. చాట్‌బాట్ కి చూసే దారే లేదు. అందుకే, రిఫండ్ జవాబు మామూలుగా ఎలా ఉంటుందో, అలా రాసేసింది.
3. ఈ రోజు: దానికి ఒక టూల్ ఇద్దాం. ఏజెంట్ అంటే, మీ కోడ్ ని పనులు చేయమని అడగగలిగే చాట్‌బాట్.
4. స్టెప్ వన్: టూల్ గురించి చెప్పండి: ఆర్డర్ నంబర్ తో ఆర్డర్ వివరాలు. వాడాలంటే, చాట్‌బాట్ ఒక్క జేసన్ లైన్ తో జవాబిస్తుంది.
5. స్టెప్ టూ: మీ కోడ్ ఆ లైన్ చదివి, ఆర్డర్ వెతుకుతుంది. చాట్‌బాట్ మీ సిస్టమ్ ని తాకదు; మీ కోడే తాకుతుంది.
6. స్టెప్ త్రీ: ఆ రిజల్ట్ తిరిగి పంపండి. ఇప్పుడు, షాప్ రికార్డ్ నుంచే జవాబిస్తుంది.
7. మా టెస్ట్, పది మంది కస్టమర్లు. టూల్ లేకుండా, చూడకుండానే పదింటికీ జవాబిచ్చింది; ఆరు తప్పు. | టూల్ తో, పదీ చూసింది; పదీ కరెక్ట్.
8. మీరు తయారు చేస్తే: చాట్‌బాట్ అడుగుతుంది, ఏది రన్ అవ్వాలో మీ కోడే నిర్ణయిస్తుంది. | మీరు వాడితే: రిఫండ్ ని, షాప్ ఆర్డర్ పేజీలోనే చూసుకోండి.
9. తర్వాత: మీ సొంత ఎం సి పి సర్వర్. | మరి ఆర్డర్ నలభై నాలుగు పదిహేడు? సున్నా రూపాయలు. రిఫండ్ ఇంకా స్టార్ట్ కాలేదు.

## Caption ask (post your answer)
"Ask any shop's chat bot about a made-up order number, like 12345: 'Has my refund for order 12345 come?' Post its answer."
