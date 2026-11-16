# EP54 "Build an AI Agent with Tools" (Season 6, a screen tutorial) · queue 058 · script v2, Nov 16

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

## The code on screen (one line per step) and in the pinned comment (all of it, flat lines)
- step 1: `TOOL = 'get_order(order_id): the order status. To use it, reply with only: {"tool": "get_order", "order_id": "..."}'`
- step 2: `call = find_json(reply); result = get_order(call["order_id"])` (find_json = the regex the demo used: twice, orders 4388 and 4475, the AI wrote the
  JSON line and then a guess, "arrives by December 15th" / "shipped within 2-3 business days"; our code took the line and
  ignored the rest)
- step 3: `messages.append({"role": "user", "content": f"Tool result: {result}"})`

## Script review (human-viewer, v1) and what changed (v2)
Both stopped on the hook; "made up" was never said; the step-2 line on screen (json.loads(reply)) wasn't the code that
got 10/10. Changes:
1. Step 2 shows find_json (the code that ran) and the beat it earned: "Twice, the AI added a guess after the line. Our
   code ignored it." (4388's guess struck out on screen; the record: Nov 18.)
2. "A made-up shop, a real test" said in line 2; the shop's name off the screen ("Kiran Mobiles" is a real-sounding
   name; the prompt used it, the screen says "a made-up shop"); "the simplest agent" (not "an agent").
3. Hook: "Twelve ninety-nine refunded..."; one bubble in frame 1; ₹0 in amber (green read as good news).
4. Test card: two big examples (refund processed vs not started; delivered March 15th vs Nov 9), "+4 more wrong · 3
   right by luck · 1 'we're checking' (it can't check)".
5. A shop owner's card ("ask your own bot about order 12345: a sure answer = a guess"); the caption ask no longer sends
   people to real shops with made-up refund claims: "Ask any AI chat app: 'Has my refund for order 12345 come?' Post its
   answer."
6. Pinned code: every line flat (Instagram may strip indentation); get_order and find_json shown.
7. Telugu: "పన్నెండు వందల తొంభై తొమ్మిది"; "మీ కోడ్ తో ఒక పని చేయించగలిగే"; "పది మంది"; "పది ఆర్డర్లూ"; "రిఫండ్ స్టేటస్";
   "ఎం, సి, పి" with pauses.
Not done: "just tell it not to guess" (not tested, so not claimed).

## Script (English, v2; narrator)
1. (hook) Twelve ninety-nine refunded, said the shop's bot. The shop's own record: zero. The refund hasn't even started.
2. (why) A made-up shop, a real test: the bot had no way to look. So it wrote what a refund reply usually says.
3. (title) Today: the simplest agent. An AI that can ask your code to do one thing.
4. (step1) Step one: describe the tool, and say: to use it, reply with one line of JSON. Here: get order, by order number.
5. (step2) Step two: your code finds that line and runs the lookup. Twice, the AI added a guess after the line. Our code ignored it.
6. (step3) Step three: send the result back. Now it answers from the shop's record.
7. (test) Our test, ten customers. Without the tool: ten answers, no checking, six wrong. | With the tool: ten lookups, ten right.
8. (rule) If you build one: the AI only asks; your code decides what runs. If you use one: check the refund on the shop's own order page.
9. (loop) Next: your own M C P server. And order forty-four seventeen? Zero rupees. Not started.

## Script (Telugu, v2)
1. పన్నెండు వందల తొంభై తొమ్మిది రిఫండ్ అయింది, అంది షాప్ చాట్‌బాట్. షాప్ రికార్డ్ లో: సున్నా. రిఫండ్ ఇంకా స్టార్ట్ కూడా కాలేదు.
2. ఇది మేం అల్లిన షాప్, టెస్ట్ నిజం: చాట్‌బాట్ కి చూసే దారే లేదు. అందుకే, రిఫండ్ జవాబు మామూలుగా ఎలా ఉంటుందో, అలా రాసేసింది.
3. ఈ రోజు: అన్నిటికంటే సింపుల్ ఏజెంట్. మీ కోడ్ తో ఒక పని చేయించగలిగే చాట్‌బాట్.
4. స్టెప్ వన్: టూల్ గురించి చెప్పండి; వాడాలంటే, ఒక్క జేసన్ లైన్ తో అడగమనండి. ఇక్కడ: ఆర్డర్ నంబర్ తో ఆర్డర్ వివరాలు.
5. స్టెప్ టూ: మీ కోడ్ ఆ లైన్ వెతికి, ఆర్డర్ చూస్తుంది. | రెండుసార్లు, ఆ లైన్ తర్వాత ఊహ కూడా రాసింది; మా కోడ్ దాన్ని పట్టించుకోలేదు.
6. స్టెప్ త్రీ: ఆ రిజల్ట్ తిరిగి పంపండి. ఇప్పుడు, షాప్ రికార్డ్ నుంచే జవాబిస్తుంది.
7. మా టెస్ట్, పది మంది కస్టమర్లు. టూల్ లేకుండా: పది జవాబులు, ఒక్కటీ చూడలేదు, ఆరు తప్పు. | టూల్ తో: పది ఆర్డర్లూ చూసింది, పదీ కరెక్ట్.
8. మీరు తయారు చేస్తే: చాట్‌బాట్ అడుగుతుంది, ఏది రన్ అవ్వాలో మీ కోడే నిర్ణయిస్తుంది. | మీరు వాడితే: రిఫండ్ స్టేటస్, షాప్ ఆర్డర్ పేజీలోనే చూసుకోండి.
9. తర్వాత: మీ సొంత, ఎం, సి, పి, సర్వర్. | మరి ఆర్డర్ నలభై నాలుగు పదిహేడు? సున్నా రూపాయలు. ఇంకా స్టార్ట్ కాలేదు.

## Caption ask (post your answer)
"Ask any AI chat app: 'Has my refund for order 12345 come?' (a made-up number). Post its answer: did it look, or did it guess?"
