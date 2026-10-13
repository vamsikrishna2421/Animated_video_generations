(() => {
  const C = window.PORTFOLIO;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  document.documentElement.style.setProperty("--accent", C.accent);
  const initial = C.name.trim()[0];

  const FACE = '<svg viewBox="0 0 100 100"><circle cx="34" cy="38" r="3"/><circle cx="66" cy="38" r="3"/><path d="M28 62 Q50 80 72 62"/></svg>';
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg>',
    like: '<svg viewBox="0 0 24 24"><path d="M2 21h4V9H2v12zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6c-.4.4-.6.9-.6 1.4V19a2 2 0 0 0 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2z"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z"/></svg>'
  };

  // Small tween helper (requestAnimationFrame + performance.now) for scrolling rows and the page.
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function tween(ms, step) {
    return new Promise((done) => {
      const t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        step(ease(t));
        t < 1 ? requestAnimationFrame(tick) : done();
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 1. Intro ---------- */
  const intro = $("#intro"), wm = $("#wordmark");
  const letters = [...C.name];
  const mid = (letters.length - 1) / 2;
  letters.forEach((ch, i) => {
    const s = el("span");
    s.textContent = ch === " " ? " " : ch;
    const d = Math.abs(i - mid) / Math.max(1, mid);
    s.style.setProperty("--sy", (1 + 0.22 * d * d).toFixed(3));        // taller towards the ends: a curved-screen look
    s.style.setProperty("--d", Math.round(Math.abs(i - mid) * 55) + "ms");
    wm.appendChild(s);
  });
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // same streaks every time
  const palette = [C.accent, "#ff2a4a", "#b0060f", "#ff6b6b", "#ffd1d6", "#ff8a00", "#ffffff"];
  for (let i = 0; i < 46; i++) {
    const b = el("i", "bar");
    b.style.setProperty("--w", (2 + rnd() * 26).toFixed(1) + "px");
    b.style.setProperty("--c", palette[Math.floor(rnd() * palette.length)]);
    b.style.setProperty("--x", ((rnd() - 0.5) * 120).toFixed(1) + "vw");
    b.style.setProperty("--d", Math.round(rnd() * 260) + "ms");
    b.style.setProperty("--b", (rnd() * 6).toFixed(1) + "px");
    $("#streaks").appendChild(b);
  }

  let timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  function playIntro(sound) {
    timers.forEach(clearTimeout);
    timers = [];
    intro.className = "";
    void intro.offsetWidth;                        // restart the CSS animations
    intro.hidden = false;
    at(150, () => intro.classList.add("play"));
    if (sound) at(150, sting);
    at(1500, () => intro.classList.add("glow"));
    at(2100, () => {
      const r = wm.firstElementChild.getBoundingClientRect(), R = wm.getBoundingClientRect();
      wm.style.transformOrigin = `${((r.left + r.width / 2 - R.left) / R.width) * 100}% 50%`;   // dive into the first letter
      intro.classList.add("zoom");
    });
    at(3150, () => intro.classList.add("out"));
    at(3550, endIntro);
  }
  function endIntro() {
    timers.forEach(clearTimeout);
    intro.hidden = true;
    showProfiles();
  }
  $("#soundBtn").addEventListener("click", (e) => { e.stopPropagation(); playIntro(true); });
  $("#skipBtn").addEventListener("click", (e) => { e.stopPropagation(); endIntro(); });

  // An original intro sound made in the browser: a deep hit, a thump, and a rising shimmer into the zoom.
  function sting() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC(), t = ac.currentTime + 0.45, out = ac.createGain();
    out.gain.value = 0.8;
    out.connect(ac.destination);
    const env = (g, a, peak, hold, rel) => {
      g.gain.setValueAtTime(0.0001, a);
      g.gain.exponentialRampToValueAtTime(peak, a + 0.015);
      g.gain.setValueAtTime(peak, a + hold);
      g.gain.exponentialRampToValueAtTime(0.0001, a + hold + rel);
    };
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(96, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 1.1);
    env(g, t, 0.9, 0.05, 1.6);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + 2);
    const n = ac.sampleRate * 0.6, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
    const nz = ac.createBufferSource(), lp = ac.createBiquadFilter(), ng = ac.createGain();
    nz.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 320; ng.gain.value = 0.55;
    nz.connect(lp).connect(ng).connect(out);
    nz.start(t);
    [146.8, 220, 293.7, 349.2, 440].forEach((f, k) => {
      const s = ac.createOscillator(), sg = ac.createGain(), hp = ac.createBiquadFilter();
      s.type = "sawtooth"; s.frequency.value = f; s.detune.value = (k - 2) * 7;
      hp.type = "highpass"; hp.frequency.value = 600;
      sg.gain.setValueAtTime(0.0001, t + 0.6);
      sg.gain.exponentialRampToValueAtTime(0.05, t + 1.6);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      s.connect(hp).connect(sg).connect(out);
      s.start(t + 0.6); s.stop(t + 2.7);
    });
  }

  /* ---------- 2. Who's watching ---------- */
  const list = $("#profileList");
  C.profiles.forEach((p, i) => {
    const li = el("li");
    li.style.setProperty("--d", 0.2 + i * 0.08 + "s");
    const b = el("button", "profile", `<span class="face">${FACE}</span><span>${p.name}</span>`);
    b.type = "button";
    b.querySelector(".face").style.setProperty("--pc", p.color);
    b.addEventListener("click", () => pick(p, li));
    li.appendChild(b);
    list.appendChild(li);
  });
  function showProfiles() { $("#profiles").classList.add("show"); }
  function pick(p, li) {
    const box = $("#profiles");
    li.classList.add("picked");
    box.classList.add("picking");
    setTimeout(() => {
      box.classList.remove("show", "picking");
      li.classList.remove("picked");
      openApp(p);
    }, 700);
  }

  /* ---------- 3. Home ---------- */
  function card(id, opts = {}) {
    const it = C.items[id];
    const c = el("div", "card" + (opts.number ? " numbered" : ""));
    c.tabIndex = 0;
    c.dataset.id = id;
    const info = `<div class="info"><div class="line"><span class="round solid">${ICON.play}</span><span class="round">${ICON.plus}</span>` +
      `<span class="round">${ICON.like}</span><span class="round">${ICON.down}</span></div>` +
      `<div class="meta"><span class="hot">New</span><span>${it.meta}</span><span class="pill">HD</span></div>` +
      `<div class="tags">${it.tags.map((t) => `<span>${t}</span>`).join("")}</div></div>`;
    if (opts.number) {
      c.innerHTML = `<span class="num">${opts.number}</span><div class="poster"><div class="art"></div>` +
        `<span class="brand">${initial}</span><span class="ptitle">${it.title}</span></div>${info}`;
      c.querySelector(".art").style.backgroundImage = `url("${it.image}")`;
    } else {
      c.style.backgroundImage = `url("${it.image}")`;
      c.innerHTML = `<span class="brand">${initial}</span><span class="title">${it.title}</span>` +
        (opts.progress != null ? `<span class="progress"><i style="--p:${opts.progress}%"></i></span>` : "") + info;
    }
    c.addEventListener("click", () => openModal(id));
    c.addEventListener("keydown", (e) => { if (e.key === "Enter") openModal(id); });
    return c;
  }

  function buildRows(profile) {
    const rows = $("#rows");
    rows.innerHTML = "";
    C.rows.forEach((r, i) => {
      const sec = el("section", "row");
      sec.id = "row-" + i;
      sec.style.setProperty("--rd", 0.45 + i * 0.12 + "s");
      sec.appendChild(el("h3", null, r.title.replace("{profile}", profile.name)));
      const wrap = el("div", "track-wrap"), track = el("div", "track");
      r.items.forEach((id, k) => track.appendChild(card(id, { number: r.numbered ? k + 1 : null, progress: r.progress ? r.progress[k] : null })));
      const L = el("button", "arrow left", ICON.left), R = el("button", "arrow right", ICON.right);
      L.setAttribute("aria-label", "Scroll left");
      R.setAttribute("aria-label", "Scroll right");
      const go = (dir) => {
        const from = track.scrollLeft, by = dir * track.clientWidth * 0.8;
        tween(650, (t) => { track.scrollLeft = from + by * t; });
      };
      L.addEventListener("click", () => go(-1));
      R.addEventListener("click", () => go(1));
      wrap.append(L, track, R);
      sec.appendChild(wrap);
      rows.appendChild(sec);
    });
  }

  function openApp(profile) {
    const app = $("#app");
    $("#navLogo").textContent = C.name;
    const av = $("#navAvatar");
    av.innerHTML = FACE;
    av.style.setProperty("--pc", profile.color);
    const h = C.hero;
    $("#heroBg").style.backgroundImage = `url("${h.image}")`;
    $("#kickerLogo").textContent = initial;
    $("#heroKicker").textContent = h.kicker;
    $("#heroTitle").textContent = h.title;
    $("#heroMeta").innerHTML = h.meta.map((m, i) => (i === 0 ? `<span class="hot">${m}</span>` : `<span>${m}</span>`)).join("") + '<span class="pill">HD</span>';
    $("#heroText").textContent = h.text;
    $("#heroPlay").href = h.play;
    $("#heroRating").textContent = h.rating;
    $("#heroMore").onclick = () => openModal(h.more);
    $("#socials").innerHTML = C.links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");
    buildRows(profile);
    app.hidden = false;
    window.scrollTo(0, 0);
    void app.offsetWidth;
    app.classList.add("enter");
  }
  const nav = $("#nav");
  window.addEventListener("scroll", () => nav.classList.toggle("solid", window.scrollY > 40), { passive: true });

  /* ---------- modal ---------- */
  const modal = $("#modal");
  function openModal(id) {
    const it = C.items[id];
    $("#modalArt").style.backgroundImage = `url("${it.image}")`;
    $("#modalTitle").textContent = it.title;
    $("#modalMeta").innerHTML = `<span class="hot">New</span><span>${it.meta}</span><span class="pill">HD</span>`;
    $("#modalText").textContent = it.text;
    $("#modalTags").innerHTML = it.tags.map((t) => `<span>${t}</span>`).join("");
    modal.hidden = false;
  }
  const closeModal = () => { modal.hidden = true; };
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // Start once the wordmark font is ready, so the letters don't jump.
  (document.fonts ? document.fonts.load('100px "Bebas Neue"') : Promise.resolve()).finally(() => {
    if (window.__noAutoIntro) return;               // the screen-recording script starts the intro itself
    playIntro(false);
  });
  // Hooks for the screen-recording script (harmless on the live site).
  window.__site = {
    playIntro, endIntro, openModal, closeModal, tween,
    openApp: (i) => { intro.hidden = true; $("#profiles").classList.remove("show"); openApp(C.profiles[i]); }
  };
})();
