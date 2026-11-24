# UC02 test: search, read, cite (and what a link proves)

Made with `pipeline/uc02/search_demo.py`, `search_demo2.py` and `search_demo3.py` (each committed before it ran), Nov 24. A small
made-up "web" of six dated pages (every page, link and price made up by us), a keyword search tool (BM25) returning the
top 3, and Qwen2.5-7B-Instruct (4-bit, llama.cpp) on our computer; one fresh chat per run, temperature 0.7, seeds
1-10. The question: "What is today's wholesale price of toor dal in Hyderabad?" The right answer: ₹142 a kg, from the
page dated Tuesday 24 November 2026. The top search result is an old page whose title says "today": ₹168.

Search results, in order: [1] "Toor dal wholesale price in Hyderabad today" (₹168, the old page), [2] "Today's wholesale
rates in Hyderabad: Begum Bazar, Tuesday 24 November 2026" (₹142), [3] a toor dal recipe.

| setup | answer | the link it cited |
|---|---|---|
| no search, the AI told today's date | 10/10 "I don't have real-time access to current market prices" (no price) | none |
| search; the old page says "Last updated 12 November 2025"; the AI told today's date | 10/10 ₹142 | today's page in 9 (1 named it without the link) |
| search; the old page has **no date**; the AI told today's date | 10/10 ₹142 | today's page in 9 (1 without the link) |
| search; the old page has **no date**; the AI **not told today's date** | **10/10 ₹168** | **10/10 the old page, which really does say ₹168** |
| search; the old page has no date; nothing in the AI's instructions, but **the user types today's date** into the question (`search_demo3.py`, after the viewers asked what a user can do) | **10/10 ₹142** | today's page in 8 (2 named it by its title without the link) |

Read by hand. What it shows: with search, the AI reads pages and cites the one it used; its link was real every time
(the page did say the price it gave). Whether it picked the right page came down to dates: told today's date, it
chose the page dated today, even over an undated page that says "today"; not told the date, it trusted the top result
that said "today" every time; the date typed into the question by the user worked as well as the app's own. A link shows where the AI read it, not that it's current: open it and check the date.

Big apps (the Tow Center for Digital Journalism, Columbia Journalism Review, March 2025): eight AI search tools, asked
to name the source of news quotes, were wrong in more than 60% of 1,600 queries (Perplexity 37%, Grok 3 94%); ChatGPT
got 134 of 200 wrong and signalled doubt in only 15 (also Nieman Lab, Fortune).
