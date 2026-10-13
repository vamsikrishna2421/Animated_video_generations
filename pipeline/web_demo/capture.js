// Record the template frame by frame on a frozen clock. node capture.js phone|desk out.mp4
const { spawn } = require("child_process");
const { open, step, hideUI } = require("./vt.js");
const FFD = "/home/user/Animated_video_generations/video/node_modules/@remotion/compositor-linux-x64-gnu";
const FPS = 30, DT = 1000 / FPS;
const mode = process.argv[2], out = process.argv[3];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

(async () => {
  const phone = mode === "phone" || mode === "intro";
  if (mode === "intro") {
    // Same phone intro with another name (shows the one-line edit in config.js). NAME env var, default PRIYA.
    process.env.__NAME = process.env.NAME || "PRIYA";
  }
  const { browser, page } = await open(phone
    ? { url: "http://127.0.0.1:8765/", width: 432, height: 768, scale: 2.5, mobile: true }
    : { url: "http://127.0.0.1:8765/", width: 1280, height: 720, scale: 2 });
  await hideUI(page);
  if (mode === "intro") {
    await page.evaluate((n) => {   // rebuild the wordmark with the new name, exactly as config.js would
      const wm = document.getElementById("wordmark");
      const letters = [...n], mid = (letters.length - 1) / 2;
      wm.innerHTML = "";
      letters.forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch === " " ? "\u00a0" : ch;
        const d = Math.abs(i - mid) / Math.max(1, mid);
        s.style.setProperty("--sy", (1 + 0.22 * d * d).toFixed(3));
        s.style.setProperty("--d", Math.round(Math.abs(i - mid) * 55) + "ms");
        wm.appendChild(s);
      });
    }, process.env.__NAME);
  }
  const ff = spawn(FFD + "/ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { env: { ...process.env, LD_LIBRARY_PATH: FFD }, stdio: ["pipe", "inherit", "inherit"] });
  let frames = 0;
  // pointer: arrow cursor on desktop, a fingertip dot on the phone
  await page.evaluate((phone) => {
    const c = document.getElementById("__cursor");
    if (phone) {
      c.innerHTML = "<b></b><i></i>";
      c.querySelector("b").style.cssText = "position:absolute;left:-19px;top:-19px;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.42);border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 10px rgba(0,0,0,.45);";
      c.querySelector("i").style.cssText = "position:absolute;left:-19px;top:-19px;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.6);transform:scale(0);opacity:0;";
      c.style.filter = "none";
    }
  }, phone);
  let P = { x: -80, y: -80, vis: 0, rip: null };
  const setP = async () => {
    await page.evaluate(([x, y, vis, rip, phone]) => {
      const c = document.getElementById("__cursor");
      c.style.left = (phone ? x : x - 4) + "px"; c.style.top = (phone ? y : y - 2) + "px";
      c.style.opacity = String(vis);
      const r = c.querySelector("i");
      if (rip == null) { r.style.opacity = 0; } else { r.style.opacity = String(0.9 * (1 - rip)); r.style.transform = `scale(${0.5 + rip * 1.8})`; }
    }, [P.x, P.y, P.vis, P.rip, phone]);
    if (P.vis > 0.5) await page.mouse.move(P.x, P.y);
  };
  const shot = async () => {
    await setP();
    ff.stdin.write(await page.screenshot({ type: "jpeg", quality: 92 }));
    frames++;
  };
  const run = async (ms, fn) => {
    const n = Math.round(ms / DT);
    for (let k = 1; k <= n; k++) {
      if (fn) await fn(k / n);
      await step(page, DT);
      await shot();
    }
  };
  const box = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
  const moveTo = async (to, ms) => { const from = { x: P.x, y: P.y }; await run(ms, (k) => { const e = ease(k); P.x = lerp(from.x, to.x, e); P.y = lerp(from.y, to.y, e); }); };
  const scrollY = async (to, ms) => { const from = await page.evaluate(() => window.scrollY); await run(ms, (k) => page.evaluate((y) => window.scrollTo(0, y), lerp(from, to, ease(k)))); };
  const press = async (sel) => {
    await run(160, (k) => { P.rip = k * 0.5; });
    await page.locator(sel).first().click({ force: true, noWaitAfter: true });
    await run(260, (k) => { P.rip = 0.5 + k * 0.5; });
    P.rip = null;
  };

  if (mode === "intro") {
    await page.evaluate(() => window.__site.playIntro(false));
    await run(3600);
  } else if (phone) {
    await page.evaluate(() => window.__site.playIntro(false));
    await run(3700);                                          // the name intro
    await run(800);                                           // profiles settle
    let t = await box(".profile >> nth=0");
    P = { x: t.x + 30, y: t.y + 120, vis: 0, rip: null };
    await run(350, (k) => { P.vis = k; P.x = lerp(t.x + 30, t.x, ease(k)); P.y = lerp(t.y + 120, t.y - 10, ease(k)); });
    await press(".profile >> nth=0");
    await run(300, (k) => { P.vis = 1 - k; });
    await run(1700);                                          // home page enters
    const rowsTop = await page.evaluate(() => document.querySelector("#row-1").getBoundingClientRect().top + window.scrollY - 70);
    await scrollY(rowsTop, 2200);
    await run(300);
    const tr = await box("#row-1 .track");
    P = { x: tr.x + 120, y: tr.y, vis: 0, rip: null };
    await run(250, (k) => { P.vis = k; });
    const dist = await page.evaluate(() => document.querySelector("#row-1 .track").clientWidth * 0.9);
    await run(1100, (k) => { const e = ease(k); P.x = lerp(tr.x + 120, tr.x - 120, e); return page.evaluate((v) => { document.querySelector("#row-1 .track").scrollLeft = v; }, dist * e); });
    await run(250, (k) => { P.vis = 1 - k; });
    await run(300);
    t = await box("#row-2 .card >> nth=1");
    P = { x: t.x + 40, y: t.y + 60, vis: 0, rip: null };
    await run(350, (k) => { P.vis = k; P.x = lerp(t.x + 40, t.x, ease(k)); P.y = lerp(t.y + 60, t.y, ease(k)); });
    await press("#row-2 .card >> nth=1");
    await run(300, (k) => { P.vis = 1 - k; });
    await run(2300);                                          // the episode card
  } else {
    await page.evaluate(() => window.__site.openApp(0));
    P = { x: 1180, y: 700, vis: 1, rip: null };
    await run(1800);                                          // hero enters
    await scrollY(250, 900);                                  // bring the first row up so the hover card fits
    let t = await box("#row-0 .card >> nth=1");
    await moveTo(t, 900);
    await run(1500);                                          // card expands
    await moveTo({ x: t.x + 60, y: 690 }, 500);
    const y1 = await page.evaluate(() => document.querySelector("#row-1").getBoundingClientRect().top + window.scrollY - 110);
    await scrollY(y1, 1200);
    t = await box("#row-1 .card >> nth=2");
    await moveTo(t, 700);
    await run(1100);
    const ar = await box("#row-1 .arrow.right");
    await moveTo(ar, 600);
    await press("#row-1 .arrow.right");
    await run(800);
    const y2 = await page.evaluate(() => document.querySelector("#row-2").getBoundingClientRect().top + window.scrollY - 110);
    await moveTo({ x: 900, y: 600 }, 300);
    await scrollY(y2, 900);
    t = await box("#row-2 .card >> nth=4");
    await moveTo(t, 700);
    await run(800);
    await press("#row-2 .card >> nth=4");
    await moveTo({ x: 1150, y: 640 }, 600);
    await run(1600);                                          // the episode card
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`${mode}: ${frames} frames, ${(frames / FPS).toFixed(2)} s -> ${out}`);
})().catch((e) => { console.error(e); process.exit(1); });
