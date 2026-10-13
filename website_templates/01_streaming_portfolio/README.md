# Streaming-style portfolio

A portfolio that opens like a movie: your name as the intro, a "Who's watching?" profile picker, then your work as
rows of shows with hover cards and a details pop-up. Plain HTML, CSS and JavaScript: no frameworks, no build step.

**Demo content:** the episodes of the AI From Scratch series (@ai_maastaaru). Swap in your own projects.

## Make it yours (5 minutes)
1. Open `config.js` and change `name` (the intro and the logo), `profiles`, `hero`, `rows` and `items`.
2. Put your images in `assets/` (16:9, at least 720 x 405) and point the items at them.
3. Open `index.html` through a local server (fonts do not load from `file://`):
   `python3 -m http.server` and visit http://localhost:8000.

## Put it online for free (GitHub Pages)
Push the folder to a GitHub repository, then **Settings → Pages → Deploy from a branch → main / root**. Your site
appears at `https://<your-username>.github.io/<repo>/`.

## What's inside
| File | What it does |
|---|---|
| `index.html` | page structure: intro, profiles, home, modal |
| `style.css` | the look, all animations, phone layout |
| `app.js` | builds the page from `config.js`; intro timing; the intro sound (made in the browser) |
| `config.js` | all your content |

- **Intro:** the letters land from a blur, glow, then the camera dives into the first letter through streaks of light.
  The intro sound plays when a visitor presses **Sound on** (browsers block sound until you tap).
- **Rows:** hover a card to expand it; arrows scroll the row; `numbered: true` draws the big numbers.
- **Phones:** one column of rows you can swipe; hover cards are turned off.

## Credits and licences
- Code: MIT. Use it for anything.
- Fonts: Bebas Neue and Inter (SIL Open Font License), served from `assets/fonts/`.
- Hero photo: "Golden Retriever 88.JPG" by Mtlchung, CC0 (Wikimedia Commons), graded and stamped; licence plate blurred.
- Thumbnails: frames from the AI From Scratch reels (@ai_maastaaru). Replace them with your own.
- Inspired by streaming apps. Not affiliated with, or endorsed by, any streaming service; no logos, fonts or sounds
  from one are used.
