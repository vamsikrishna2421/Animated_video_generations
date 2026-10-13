// Deterministic browser time for screen recordings: Playwright's fake clock drives JS timers/rAF; every CSS animation
// and transition is paused and set to the virtual time before each screenshot.
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

async function open({ url, width = 1280, height = 720, scale = 1.5, mobile = false }) {
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--hide-scrollbars"] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-10-13T10:00:00Z") });
  await page.addInitScript(() => { window.__noAutoIntro = true; window.__vt = 0; });
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await page.clock.pauseAt(new Date("2026-10-13T10:01:00Z"));   // from here on, time only moves in step()
  await page.evaluate(() => {
    const c = document.createElement("div");
    c.id = "__cursor";
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l16 9.2-7 1.6 4.2 7.4-2.6 1.4-4.1-7.4L5 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg><i></i>';
    c.style.cssText = "position:fixed;left:-60px;top:-60px;z-index:2147483647;pointer-events:none;width:30px;height:30px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));";
    const r = c.querySelector("i");
    r.style.cssText = "position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.55);transform:scale(0);opacity:0;";
    document.body.appendChild(c);
  });
  return { browser, page };
}

async function step(page, dt) {
  await page.clock.runFor(dt);
  await page.evaluate((dt) => {
    window.__vt += dt;
    const all = document.getAnimations();
    // A script-paused CSS animation is not cancelled when its rule stops applying, so cancel it here; likewise an
    // older transition on the same element and property once a newer one exists.
    const latest = new Map();
    for (const a of all) {
      const el = a.effect && a.effect.target;
      if (!el) continue;
      if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) {
        const names = getComputedStyle(el).animationName.split(",").map((n) => n.trim());
        if (!names.includes(a.animationName)) { a.cancel(); continue; }
      }
      if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) {
        const key = a.transitionProperty;
        const m = latest.get(el) || {};
        if (m[key]) { m[key].cancel(); }
        m[key] = a;
        latest.set(el, m);
      }
    }
    for (const a of document.getAnimations()) {
      if (a.__t0 === undefined) a.__t0 = window.__vt - (a.currentTime || 0);
      a.pause();
      a.currentTime = window.__vt - a.__t0;
    }
  }, dt);
}

async function hideUI(page) {
  await page.addStyleTag({ content: ".sound-btn,.skip-btn{display:none!important}" });
}

async function cursor(page, x, y, ripple = null) {
  await page.evaluate(([x, y, ripple]) => {
    const c = document.getElementById("__cursor");
    c.style.left = x - 4 + "px"; c.style.top = y - 2 + "px";
    const r = c.querySelector("i");
    if (ripple == null) { r.style.opacity = 0; return; }
    r.style.opacity = String(0.9 * (1 - ripple)); r.style.transform = `scale(${0.4 + ripple * 1.6})`;
  }, [x, y, ripple]);
  await page.mouse.move(x, y);
}

module.exports = { open, step, cursor, hideUI };
