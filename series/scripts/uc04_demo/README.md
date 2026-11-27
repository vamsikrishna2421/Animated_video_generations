# UC04 test: how a video feed picks "recommended for you" and "Up next"

Made with `pipeline/uc04/feed_demo.py`, `feed_demo2.py` and `feed_demo3.py` (each committed before it ran), Nov 27.
Everything in it is made up by us: 144 video titles in 12 topics (cricket, cooking, devotional, news, comedy, farming,
phone tips, health, quick-money trading, savings, study, travel), and Ravi's watch history (12 videos: 3 cricket, 3
cooking, 2 devotional, 2 news, 2 comedy). The friend's video: "Turn ₹5,000 into ₹50,000 in one week: my trading trick".

How it ranks (a small recommender built on the idea in Google's 2016 YouTube paper, Covington, Adams and Sargin, RecSys
2016): every video becomes a list of numbers (an embedding; ours from its title, by the small open model
sentence-transformers/all-MiniLM-L6-v2 on our computer; YouTube's are learned from what people watch); the closer two
lists point, the more alike the videos (cosine similarity). Two lists:
- **Home** ("recommended for you"): "you" = the average of your watch history (the paper: "simply averaging the
  embeddings performed best"); the 10 closest videos you have not watched. A second way: the last 3 videos count 3 times
  (Netflix's help page: recent viewing outweighs older viewing).
- **Up next**: the 10 closest videos to the one playing now (YouTube's own page: Up next "suggests additional content
  based on what you're currently watching").

| step | trading videos in the 10 |
|---|---|
| Home, his history | 0/10 (both ways) |
| Home, + the friend's video (test 1) | **0/10** averaged; 2/10 with the last 3 counted 3 times |
| Home, he taps the top trading video 5 more times (test 2, last 3 counted 3 times) | 2, 1, 1, 3, 1 of 10 (6 trading videos in a history of 18) |
| Home, he removes every trading video from his history (test 2) | 0/10 |
| Home, keeps the trading history but watches 3 videos he wants (test 2) | 0/10 |
| **Up next, while the friend's video plays (test 3)** | **9/10** (the 10th: a Shiva bhajan) |
| **Autoplay: the top Up next plays, 10 in a row (test 3)** | **8/10** trading, then "Gold rate today" and "Gold savings" |
| Home after those 10 autoplays (test 3) | **0/10** averaged; **2/10** with the last 3 counted 3 times (9 trading in a history of 23) |
| Home after removing every trading video (test 3) | 1/10 averaged, 3/10 last-3: the two gold videos from the chain stayed in his history and pulled trading back |
| **Up next, while a warning video plays ("Trading tip scams: how fake gurus take your money", test 3)** | **9/10 trading tips** |

What it shows: Up next follows the one video playing now, so one trading video brings nine more, and autoplay keeps him
there (8 of 10). His home page follows his whole history: it stayed at 0 to 2 trading videos in 10. A warning about
trading scams sits next to trading videos too: closeness is about what a video is about, not why you watched it.
Limits: one small model, titles only, 144 videos; real apps use many more signals (YouTube's page: "viewing behaviour,
likes, dislikes, subscriptions and feedback, including from satisfaction surveys", and a channel's "reputation and
quality"); a 2-D map of our 384 numbers overlaps a lot, so the reel's map is drawn simplified.

Their own pages, read Nov 27:
- YouTube, How YouTube Works, "Recommendations": "Understanding a user's viewing behaviour, likes, dislikes, subscriptions
  and feedback, including from satisfaction surveys"; Up next "suggests additional content based on what you're currently
  watching"; "Users can always pause, edit or delete their YouTube search and watch history whenever they want."
- YouTube Help, "Manage your recommendations & search results" (answer 6342839): "Not interested" from More next to a
  video on Home or Watch next, then "Tell us why" ("I've already watched the video or I don't like the video"); "Don't
  recommend channel"; "You can remove specific videos from your watch history"; turning off watch history "when you
  don't want your watches or searches to influence future recommendations".
- Netflix Help, "How Netflix's Recommendations System Works" (node 100639): viewing history and ratings, "other members
  with similar tastes", title information, time of day, languages, devices, how long you watch; "the titles you engage
  with more recently will outweigh titles you engaged with in the past"; "does not include demographic information (such
  as age or gender)".
- Covington, Adams, Sargin, "Deep Neural Networks for YouTube Recommendations", RecSys 2016: "two neural networks: one
  for candidate generation and one for ranking"; "A user's watch history is represented by a variable-length sequence of
  sparse video IDs which is mapped to a dense vector representation via the embeddings ... simply averaging the
  embeddings performed best".
