"""Branded graphics as transparent PNGs (drawn with Pillow, so no ffmpeg drawtext/freetype build is needed).

Overlays (sit on top of footage, animated in by render.py):
  location  pin + place name + small line (city / date)          bottom-left
  lower     name/fact lower third                                   bottom-left
  big       large centred hook/title text with outline              centre
  step      numbered step badge + instruction (guide videos)        top-left
  tip       highlighted tip/cost/time box                           top-right
  caption   subtitle-style line (e.g. English for Telugu speech)    bottom-centre
  route     stops with a line, current stop highlighted (transit)   top
  counter   big number + label ("$2.40", "45 min")                  right
Full-frame cards (over blurred footage or the brand colour):
  intro     channel name sting           chapter   "DAY 2" / chapter title
  title     video title card             outro     end screen with two video slots + subscribe area (YouTube end screen)

  python scripts/cards.py --brand brand/brand.json --demo out/cards_demo      renders every style for a quick look
"""
import argparse
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import vlog  # noqa: E402

DEFAULT_BRAND = {"channel": "My Channel", "handle": "", "tagline": "",
                 "colors": {"primary": "#FFC83D", "accent": "#19B5A5", "dark": "#0E1A24", "light": "#FFFFFF"}}


def rgb(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def load_brand(path):
    b = dict(DEFAULT_BRAND)
    if path and Path(path).exists():
        j = vlog.load_json(path)
        b.update(j)
        b["colors"] = {**DEFAULT_BRAND["colors"], **j.get("colors", {})}
        base = Path(path).parent
        for k in ("font_file", "font_file_regular", "logo"):
            if b.get(k) and not Path(b[k]).is_absolute() and (base / b[k]).exists():
                b[k] = str(base / b[k])
            elif b.get(k) and not Path(b[k]).is_absolute() and (base.parent / b[k]).exists():
                b[k] = str(base.parent / b[k])
    return b


def F(brand, px, bold=True):
    if not bold and brand.get("font_file_regular"):
        return vlog.font(px, {"font_file": brand["font_file_regular"]})
    return vlog.font(px, brand, bold)


def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def text_block(d, xy, lines, font, fill, stroke=0, stroke_fill=(0, 0, 0, 255), spacing=1.12, anchor="la"):
    x, y = xy
    asc, desc = font.getmetrics()
    lh = int((asc + desc) * spacing)
    for i, ln in enumerate(lines):
        d.text((x, y + i * lh), ln, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill, anchor=anchor)
    return lh * len(lines)


def shadowed(img, box, radius, fill, shadow=0.35, blur=None):
    from PIL import Image, ImageDraw, ImageFilter
    W, H = img.size
    s = max(4, int(min(W, H) / 120))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([box[0] + s, box[1] + s * 1.5, box[2] + s, box[3] + s * 1.5], radius, fill=(0, 0, 0, int(255 * shadow)))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur or s * 2)))
    ImageDraw.Draw(img).rounded_rectangle(box, radius, fill=fill)


def pin(d, cx, cy, r, fill, hole):
    d.ellipse([cx - r, cy - r * 1.6, cx + r, cy + r * 0.4], fill=fill)
    d.polygon([(cx - r * 0.82, cy - r * 0.2), (cx + r * 0.82, cy - r * 0.2), (cx, cy + r * 1.35)], fill=fill)
    d.ellipse([cx - r * 0.42, cy - r * 1.02, cx + r * 0.42, cy - r * 0.18], fill=hole)


def overlay(kind, brand, W, H, text="", sub="", **kw):
    """Return an RGBA canvas-size image with the overlay drawn in its position."""
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = brand["colors"]
    P, A, D, L = rgb(c["primary"]), rgb(c["accent"]), rgb(c["dark"]), rgb(c["light"])
    u = min(W, H) / 1080  # 1 unit = 1 px at 1080p
    portrait = H > W
    m = int((90 if portrait else 70) * u)  # safe margin
    if kind == "location":
        f1, f2 = F(brand, int(64 * u)), F(brand, int(34 * u), bold=False)
        maxw = W * (0.8 if portrait else 0.55)
        l1 = wrap(d, text.upper(), f1, maxw)
        tw = max(d.textlength(x, font=f1) for x in l1)
        sw = d.textlength(sub, font=f2) if sub else 0
        bw = int(max(tw, sw) + 150 * u)
        bh = int(len(l1) * 74 * u + (52 * u if sub else 0) + 48 * u)
        x0, y1 = m, H - int((330 if portrait else 110) * u)
        y0 = y1 - bh
        shadowed(img, [x0, y0, x0 + bw, y1], int(22 * u), D)
        d.rounded_rectangle([x0, y0, x0 + int(14 * u), y1], int(7 * u), fill=P)
        pin(d, x0 + int(62 * u), y0 + int(70 * u), int(22 * u), P, D)
        text_block(d, (x0 + int(105 * u), y0 + int(24 * u)), l1, f1, L)
        if sub:
            d.text((x0 + int(105 * u), y0 + int(24 * u) + len(l1) * int(74 * u)), sub, font=f2, fill=P)
    elif kind == "lower":
        f1, f2 = F(brand, int(52 * u)), F(brand, int(34 * u), bold=False)
        tw = max(d.textlength(text, font=f1), d.textlength(sub, font=f2) if sub else 0)
        x0, y1 = m, H - int((330 if portrait else 120) * u)
        bw, bh = int(tw + 70 * u), int((150 if sub else 96) * u)
        shadowed(img, [x0, y1 - bh, x0 + bw, y1], int(16 * u), L)
        d.rectangle([x0, y1 - int(10 * u), x0 + bw, y1], fill=P)
        d.text((x0 + int(35 * u), y1 - bh + int(18 * u)), text, font=f1, fill=D)
        if sub:
            d.text((x0 + int(35 * u), y1 - bh + int(84 * u)), sub, font=f2, fill=A)
    elif kind == "big":
        f1 = F(brand, int(kw.get("size", 120) * u))
        lines = wrap(d, text.upper(), f1, W * 0.86)
        asc, desc = f1.getmetrics()
        lh = int((asc + desc) * 1.05)
        y = int(H * kw.get("y", 0.5) - lh * len(lines) / 2)
        for i, ln in enumerate(lines):
            d.text((W / 2, y + i * lh), ln, font=f1, fill=P if i == len(lines) - 1 and len(lines) > 1 else L, anchor="ma",
                   stroke_width=int(10 * u), stroke_fill=D)
        if sub:
            d.text((W / 2, y + len(lines) * lh + int(16 * u)), sub, font=F(brand, int(48 * u)), fill=L, anchor="ma", stroke_width=int(6 * u), stroke_fill=D)
    elif kind == "step":
        n = str(kw.get("n", ""))
        f0, f1 = F(brand, int(30 * u)), F(brand, int(50 * u))
        lines = wrap(d, text, f1, W * (0.78 if portrait else 0.5))
        tw = max(d.textlength(x, font=f1) for x in lines)
        x0, y0 = m, int((260 if portrait else 70) * u)
        bh = int(len(lines) * 62 * u + 96 * u)
        shadowed(img, [x0, y0, x0 + int(tw + 80 * u), y0 + bh], int(18 * u), (*D[:3], 235))
        badge = f"STEP {n}" if n else kw.get("label", "NEXT")
        bw = d.textlength(badge, font=f0) + 36 * u
        d.rounded_rectangle([x0 + int(26 * u), y0 + int(20 * u), x0 + int(26 * u + bw), y0 + int(62 * u)], int(10 * u), fill=P)
        d.text((x0 + int(44 * u), y0 + int(25 * u)), badge, font=f0, fill=D)
        text_block(d, (x0 + int(40 * u), y0 + int(76 * u)), lines, f1, L)
    elif kind == "tip":
        label = kw.get("label", "TIP")
        f0, f1 = F(brand, int(30 * u)), F(brand, int(44 * u))
        maxw = W * (0.8 if portrait else 0.38)
        lines = wrap(d, text, f1, maxw)
        tw = max(max(d.textlength(x, font=f1) for x in lines), d.textlength(label, font=f0))
        bw, bh = int(tw + 70 * u), int(len(lines) * 56 * u + 100 * u)
        x1, y0 = W - m, int((260 if portrait else 115) * u)
        if portrait and kw.get("below_step"):
            y0 += int(260 * u)
        shadowed(img, [x1 - bw, y0, x1, y0 + bh], int(18 * u), P)
        d.text((x1 - bw + int(35 * u), y0 + int(22 * u)), label.upper(), font=f0, fill=D)
        text_block(d, (x1 - bw + int(35 * u), y0 + int(66 * u)), lines, f1, D)
    elif kind == "caption":
        f1 = F(brand, int(kw.get("size", 46) * u))
        lines = wrap(d, text, f1, W * 0.84)
        asc, desc = f1.getmetrics()
        lh = int((asc + desc) * 1.15)
        y1 = H - int((420 if portrait else 70) * u)
        y0 = y1 - lh * len(lines)
        for i, ln in enumerate(lines):
            tw = d.textlength(ln, font=f1)
            d.rounded_rectangle([W / 2 - tw / 2 - 18 * u, y0 + i * lh - 6 * u, W / 2 + tw / 2 + 18 * u, y0 + (i + 1) * lh - 2 * u], int(10 * u), fill=(0, 0, 0, 170))
            d.text((W / 2, y0 + i * lh), ln, font=f1, fill=L, anchor="ma")
    elif kind == "route":
        stops = kw.get("stops") or [s.strip() for s in text.split(">")]
        cur = int(kw.get("current", 0))
        f1 = F(brand, int(30 * u))
        x0, x1, y = m + int(30 * u), W - m - int(30 * u), int((250 if portrait else 175) * u)
        shadowed(img, [m, y - int(60 * u), W - m, y + int(110 * u)], int(20 * u), (*D[:3], 225))
        n = len(stops)
        xs = [x0 + (x1 - x0) * (i / (n - 1) if n > 1 else 0.5) for i in range(n)]
        d.line([xs[0], y, xs[-1], y], fill=(*L[:3], 120), width=int(8 * u))
        if cur > 0:
            d.line([xs[0], y, xs[min(cur, n - 1)], y], fill=P, width=int(8 * u))
        for i, (x, s) in enumerate(zip(xs, stops)):
            r = int((20 if i == cur else 13) * u)
            d.ellipse([x - r, y - r, x + r, y + r], fill=P if i <= cur else L, outline=D, width=int(4 * u))
            lab = wrap(d, s, f1, (x1 - x0) / max(1, n - 1) * 0.95 if n > 1 else W)
            text_block(d, (x, y + int(34 * u)), lab, f1, P if i == cur else L, anchor="ma", spacing=1.0)
    elif kind == "counter":
        f1, f2 = F(brand, int(110 * u)), F(brand, int(38 * u), bold=False)
        x1, y = W - m, int(H * (0.42 if portrait else 0.38))
        d.text((x1, y), text, font=f1, fill=P, anchor="ra", stroke_width=int(8 * u), stroke_fill=D)
        if sub:
            d.text((x1, y + int(130 * u)), sub, font=f2, fill=L, anchor="ra", stroke_width=int(5 * u), stroke_fill=D)
    else:
        raise ValueError(f"unknown overlay kind {kind}")
    return img


def watermark(brand, W, H):
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    u = min(W, H) / 1080
    if brand.get("logo") and Path(brand["logo"]).exists():
        lg = Image.open(brand["logo"]).convert("RGBA")
        s = int(90 * u) / lg.height
        lg = lg.resize((int(lg.width * s), int(lg.height * s)))
        a = lg.getchannel("A").point(lambda v: int(v * 0.7))
        lg.putalpha(a)
        img.alpha_composite(lg, (W - lg.width - int(40 * u), int(36 * u)))
    else:
        d = ImageDraw.Draw(img)
        d.text((W - int(40 * u), int(36 * u)), brand["channel"].upper(), font=F(brand, int(30 * u)), fill=(255, 255, 255, 150), anchor="ra",
               stroke_width=int(2 * u), stroke_fill=(0, 0, 0, 90))
    return img


def card(kind, brand, W, H, text="", sub="", **kw):
    """Full-frame card art (transparent where the blurred background should show)."""
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = brand["colors"]
    P, A, D, L = rgb(c["primary"]), rgb(c["accent"]), rgb(c["dark"]), rgb(c["light"])
    u = min(W, H) / 1080
    portrait = H > W
    d.rectangle([0, 0, W, H], fill=(*D[:3], 110))
    if kind == "intro":
        name = brand["channel"].upper()
        f1 = F(brand, int((120 if not portrait else 100) * u))
        lines = wrap(d, name, f1, W * 0.8)
        asc, desc = f1.getmetrics()
        lh = int((asc + desc) * 1.02)
        y = int(H / 2 - lh * len(lines) / 2 - 30 * u)
        if brand.get("logo") and Path(brand["logo"]).exists():
            lg = Image.open(brand["logo"]).convert("RGBA")
            s = int(220 * u) / lg.height
            lg = lg.resize((int(lg.width * s), int(lg.height * s)))
            img.alpha_composite(lg, (int(W / 2 - lg.width / 2), y - lg.height - int(30 * u)))
        else:
            pin(d, W / 2, y - int(70 * u), int(38 * u), P, (*D[:3], 255))
        for i, ln in enumerate(lines):
            d.text((W / 2, y + i * lh), ln, font=f1, fill=L, anchor="ma", stroke_width=int(6 * u), stroke_fill=D)
        yb = y + len(lines) * lh + int(20 * u)
        d.rounded_rectangle([W / 2 - 160 * u, yb, W / 2 + 160 * u, yb + 12 * u], int(6 * u), fill=P)
        tag = sub or brand.get("tagline", "")
        if tag:
            d.text((W / 2, yb + int(40 * u)), tag, font=F(brand, int(44 * u), bold=False), fill=L, anchor="ma")
    elif kind == "chapter":
        big = kw.get("big", "")
        if big:
            d.text((W / 2, H / 2 - 150 * u), big.upper(), font=F(brand, int(70 * u)), fill=P, anchor="ma")
        f1 = F(brand, int(110 * u))
        lines = wrap(d, text.upper(), f1, W * 0.85)
        text_block(d, (W / 2, H / 2 - 50 * u), lines, f1, L, stroke=int(6 * u), stroke_fill=D, anchor="ma", spacing=1.02)
        if sub:
            asc, desc = f1.getmetrics()
            d.text((W / 2, H / 2 - 30 * u + len(lines) * (asc + desc)), sub, font=F(brand, int(44 * u), bold=False), fill=P, anchor="ma")
    elif kind == "title":
        f1 = F(brand, int(100 * u))
        lines = wrap(d, text, f1, W * 0.85)
        asc, desc = f1.getmetrics()
        lh = int((asc + desc) * 1.05)
        y = int(H / 2 - lh * len(lines) / 2)
        for i, ln in enumerate(lines):
            d.text((W / 2, y + i * lh), ln, font=f1, fill=L, anchor="ma", stroke_width=int(7 * u), stroke_fill=D)
        if sub:
            d.text((W / 2, y + len(lines) * lh + int(24 * u)), sub, font=F(brand, int(48 * u)), fill=P, anchor="ma")
    elif kind == "outro":
        # YouTube end screen: keep the right half free for 2 video elements, subscribe button area bottom-left
        d.rectangle([0, 0, W, H], fill=(*D[:3], 150))
        f1 = F(brand, int(84 * u))
        lines = wrap(d, (text or "THANKS FOR WATCHING").upper(), f1, W * (0.85 if portrait else 0.44))
        hh = text_block(d, (int(110 * u), int(H * 0.2)), lines, f1, L, stroke=int(5 * u), stroke_fill=D, spacing=1.05)
        d.text((int(110 * u), int(H * 0.2) + hh + int(20 * u)), sub or "Watch next  →", font=F(brand, int(52 * u)), fill=P)
        if not portrait:  # outlines only, to line up the YouTube end-screen elements (each 16:9)
            for i, (x, y) in enumerate([(0.58, 0.12), (0.58, 0.54)]):
                bx, by, bw, bh = W * x, H * y, W * 0.36, W * 0.36 * 9 / 16
                d.rounded_rectangle([bx, by, bx + bw, by + bh], int(18 * u), outline=(*L[:3], 120), width=int(4 * u))
        cx, cy, r = int(250 * u), int(H * 0.72), int(110 * u)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*P[:3], 230), width=int(6 * u))
        d.text((cx, cy + r + int(24 * u)), brand.get("handle") or brand["channel"], font=F(brand, int(36 * u), bold=False), fill=L, anchor="ma")
    else:
        raise ValueError(f"unknown card kind {kind}")
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand", default="")
    ap.add_argument("--demo", required=True, help="output folder")
    ap.add_argument("--size", default="1920x1080")
    a = ap.parse_args()
    from PIL import Image
    W, H = map(int, a.size.split("x"))
    b = load_brand(a.brand)
    out = Path(a.demo)
    out.mkdir(parents=True, exist_ok=True)
    bg = Image.new("RGBA", (W, H), (70, 110, 140, 255))
    for i in range(0, H, 8):
        bg.paste((60 + i * 60 // H, 110 + i * 40 // H, 140 - i * 60 // H, 255), (0, i, W, i + 8))
    demos = [("location", dict(text="South Station", sub="Boston, MA  ·  Day 1")), ("lower", dict(text="Silver Line SL1", sub="Free from the airport")),
             ("big", dict(text="We almost missed the flight", sub="")), ("step", dict(text="Buy a CharlieTicket at the kiosk", n=3)),
             ("tip", dict(text="Youth Pass = 50% off every ride", label="Money tip")), ("caption", dict(text="This is the cheapest way to reach the airport")),
             ("route", dict(text="Worcester > South Station > Silver Line > Logan", current=2)), ("counter", dict(text="$2.40", sub="one bus ride"))]
    for k, kw in demos:
        im = bg.copy()
        im.alpha_composite(overlay(k, b, W, H, **kw))
        im.alpha_composite(watermark(b, W, H))
        im.convert("RGB").save(out / f"overlay_{k}.jpg", quality=85)
    for k, kw in [("intro", {}), ("chapter", dict(text="Logan Airport", sub="Terminal B", big="Part 3")), ("title", dict(text="Worcester to Logan Airport by train", sub="Full guide, Telugu")),
                  ("outro", {})]:
        im = bg.copy()
        im.alpha_composite(card(k, b, W, H, **kw))
        im.convert("RGB").save(out / f"card_{k}.jpg", quality=85)
    print(f"wrote demo images to {out}")


if __name__ == "__main__":
    main()
