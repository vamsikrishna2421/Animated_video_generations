// Everything on the page comes from this file. Change the name, the profiles, the rows and the items; no other file
// needs editing. Images go in assets/ (16:9 works best; 720 x 405 or bigger).
window.PORTFOLIO = {
  name: "VAMSI KRISHNA",          // the intro wordmark and the logo in the top bar
  accent: "#e50914",              // wordmark and highlight colour

  profiles: [
    { name: "Recruiter", color: "#e50914" },
    { name: "Developer", color: "#1f6feb" },
    { name: "Student", color: "#f5b400" },
    { name: "Curious", color: "#12a150" }
  ],

  hero: {
    kicker: "S E R I E S",
    title: "AI From Scratch",
    image: "assets/hero.jpg",
    meta: ["New episode", "2026", "3 seasons", "English · Telugu"],
    rating: "13+",
    text: "A free photo AI was 99.99% sure a golden retriever was a banana. One short reel at a time, this series shows how AI really works, with tests we run ourselves.",
    play: "https://www.instagram.com/ai_maastaaru/",
    more: "ep29"
  },

  // {profile} is replaced by the profile the visitor picked. "numbered: true" draws the big numbers.
  rows: [
    { title: "Continue watching for {profile}", items: ["ep29", "ep28", "ep27", "distill", "cheap"], progress: [72, 40, 88, 18, 55] },
    { title: "Start here: watch in this order", numbered: true, items: ["intro", "ep25", "ep26", "ep27", "ep28", "ep29", "distill", "cheap", "laya1", "laya2"] },
    { title: "AI From Scratch: season 3", items: ["ep25", "ep26", "ep27", "ep28", "ep29"] },
    { title: "Specials", items: ["distill", "cheap", "laya1", "laya2"] },
    { title: "Behind the scenes", items: ["bts1", "bts2", "bts3", "bts4"] }
  ],

  items: {
    intro: { title: "Start Here", image: "assets/intro.jpg", meta: "Intro · 51s", tags: ["Basics"],
      text: "AI sounds like a different language. The plan: learn it like a game, one level at a time." },
    ep25: { title: "The AI That Cheated", image: "assets/ep25.jpg", meta: "EP 25 · 1m 43s", tags: ["Data", "Case file"],
      text: "Researchers built an AI that could tell a husky from a wolf. Then they checked what it was actually looking at. It wasn't the animal." },
    ep26: { title: "The AI That Memorised", image: "assets/ep26.jpg", meta: "EP 26 · 1m 56s", tags: ["Overfitting", "Quiz"],
      text: "100% in practice, 52% in the real exam. It hadn't learned anything. It had memorised." },
    ep27: { title: "How AI Pays Attention", image: "assets/ep27.jpg", meta: "EP 27 · 1m 45s", tags: ["Transformers", "Attention"],
      text: "Change one word and 'it' means something else. How does an AI know which word 'it' points to?" },
    ep28: { title: "Words Into Numbers", image: "assets/ep28.jpg", meta: "EP 28 · 1m 35s", tags: ["Transformers", "Tokens"],
      text: "ChatGPT never sees your words. 'The Statue of Liberty is in' reaches it as six numbers. So how do they turn into 'New York'?" },
    ep29: { title: "How AI Sees a Photo", image: "assets/ep29.jpg", meta: "EP 29 · 1m 44s", tags: ["Computer vision", "Real test"],
      text: "Before we touched the photo, the AI said golden retriever. We changed its colours by a shade you can't see. Now it says banana, 99.99% sure." },
    distill: { title: "Under $50", image: "assets/distill.jpg", meta: "Special · 1m 52s", tags: ["Distillation", "Cheap models"],
      text: "Under 30 minutes and under $50 of rented GPUs: how a small open model learned competition math from a smarter one." },
    cheap: { title: "Dirt-Cheap AI", image: "assets/cheap.jpg", meta: "Special · 1m 13s", tags: ["Costs", "Free tools"],
      text: "$1,200 or $12 for the same job. Five everyday jobs, four with a free option." },
    laya1: { title: "1 Upvote to 1,363", image: "assets/laya1.jpg", meta: "Spotlight · 1m 39s", tags: ["Open source", "Builders"],
      text: "His first post got one upvote: his own. In 2026, his free model got 1,363." },
    laya2: { title: "The AI That Can't Write", image: "assets/laya2.jpg", meta: "Hands-on · 1m 37s", tags: ["Open source", "Real test"],
      text: "A free model that never writes a sentence, only picks an answer. We ran it ourselves." },
    bts1: { title: "Real Tests", image: "assets/ep29.jpg", meta: "How it's made", tags: ["Method"],
      text: "Every number on screen comes from a test we ran or a source we checked." },
    bts2: { title: "Drawn in Code", image: "assets/ep27b.jpg", meta: "How it's made", tags: ["Animation"],
      text: "The crayon pages are drawn by code, frame by frame, so every chart is the real data." },
    bts3: { title: "Two Languages", image: "assets/ep28b.jpg", meta: "How it's made", tags: ["English", "Telugu"],
      text: "Every episode ships in English and Telugu, with the same visuals." },
    bts4: { title: "Viewer Panel", image: "assets/ep25b.jpg", meta: "How it's made", tags: ["Scripts"],
      text: "Scripts go past a panel of test viewers before they are voiced." }
  },

  links: [
    { label: "Instagram", url: "https://www.instagram.com/ai_maastaaru/" },
    { label: "Instagram · Telugu", url: "https://www.instagram.com/ai_maastaaru_telugu/" },
    { label: "GitHub", url: "https://github.com/vamsikrishna2421" }
  ]
};
