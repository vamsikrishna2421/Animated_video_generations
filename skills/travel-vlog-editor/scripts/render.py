"""Render an edit decision list (edit.json) into a finished video with ffmpeg.

  python scripts/render.py <project>/edit.json --preview          fast 540p check (seconds-to-minutes)
  python scripts/render.py <project>/edit.json                    full quality master
  python scripts/render.py <project>/edit.json --only 5-12        just segments 5..12 (preview a section)
  python scripts/render.py <project>/shorts/short1.json           9:16 Shorts use the same engine (canvas [1080,1920])

Every segment is rendered to a cached intermediate (re-used until that segment changes), joined with cuts or
transitions, then the music is mixed under the voice (sidechain ducking) and the whole mix is normalised to YouTube
loudness (-14 LUFS, true peak -1 dB). Writes <output>.mp4 and <output>.timeline.json (where each segment, chapter
and text landed in the final video; publish_kit.py and review_pack.py read it). See reference/edit_format.md.
"""
import argparse
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import cards  # noqa: E402
import vlog  # noqa: E402

GRADES = {
    "none": "",
    "natural": "eq=contrast=1.04:saturation=1.08",
    "flat": "eq=contrast=1.14:saturation=1.22:gamma=0.98",  # GoPro Protune/Flat footage
    "warm": "eq=contrast=1.06:saturation=1.12,colorbalance=rs=0.04:gs=0.01:bs=-0.05:rm=0.03:bm=-0.03",
    "golden": "eq=contrast=1.08:saturation=1.18:gamma=0.97,colorbalance=rs=0.07:gs=0.02:bs=-0.07:rm=0.05:bm=-0.05:rh=0.03:bh=-0.03",
    "cool": "eq=contrast=1.05:saturation=1.05,colorbalance=rs=-0.03:bs=0.05:rm=-0.02:bm=0.03",
    "vivid": "eq=contrast=1.10:saturation=1.30",
    "night": "hqdn3d=3:3:6:6,eq=brightness=0.03:gamma=1.12:contrast=1.04:saturation=0.95",
    "bw": "hue=s=0,eq=contrast=1.15",
}
XFADES = {"fade", "dissolve", "fadeblack", "fadewhite", "wipeleft", "wiperight", "wipeup", "wipedown", "slideleft", "slideright",
          "slideup", "slidedown", "circleopen", "circleclose", "smoothleft", "smoothright", "zoomin", "radial", "pixelize", "hblur", "distance"}


class Ctx:
    def __init__(self, edit_path, preview, hw):
        self.path = Path(edit_path).resolve()
        self.e = vlog.load_json(self.path)
        self.base = self.path.parent
        proj = self.e.get("project")
        self.proj = (self.base / proj).resolve() if proj else self.base
        inv = self.proj / "inventory.json"
        self.inv = {r["id"]: r for r in vlog.load_json(inv)} if inv.exists() else {}
        W, H = self.e.get("canvas", [1920, 1080])
        self.fps = float(self.e.get("fps", 30))
        self.preview = preview
        if preview:
            s = 540 / min(W, H)
            W, H = int(round(W * s / 2) * 2), int(round(H * s / 2) * 2)
        self.W, self.H = W, H
        self.brand = cards.load_brand(self.rel(self.e["brand"]) if self.e.get("brand") else "")
        self.cache = self.proj / ".render_cache" / ("preview" if preview else "master")
        self.cache.mkdir(parents=True, exist_ok=True)
        self.hw = hw

    def rel(self, p):
        p = Path(p)
        return p if p.is_absolute() else (self.base / p).resolve()

    def source(self, src):
        """Recording id (from inventory) -> (input args, info); a plain path also works."""
        if src in self.inv:
            r = self.inv[src]
            if len(r["chapters"]) == 1:
                return ["-i", r["chapters"][0]], r
            lst = self.cache / f"{src}.concat.txt"
            lst.write_text("".join(f"file '{Path(c).resolve().as_posix()}'\n" for c in r["chapters"]), encoding="utf-8")
            return ["-f", "concat", "-safe", "0", "-i", str(lst)], r
        p = self.rel(src)
        if not p.exists():
            raise SystemExit(f"segment source not found: {src}")
        return ["-i", str(p)], vlog.probe(p)

    def venc(self):
        if self.preview:
            q = ["-preset", "ultrafast", "-crf", "28"]
        else:
            q = ["-preset", "medium", "-crf", "14"]
        # identical stream parameters in every intermediate, so lossless concat of cuts keeps exact timing
        return ["-c:v", "libx264", *q, "-pix_fmt", "yuv420p", "-video_track_timescale", "90000", "-bf", "0", "-g", str(int(self.fps))]


def atempo_chain(speed):
    out, s = [], speed
    while s > 2.0:
        out.append("atempo=2.0")
        s /= 2.0
    while s < 0.5:
        out.append("atempo=0.5")
        s /= 0.5
    out.append(f"atempo={s:.5f}")
    return ",".join(out)


def overlays_of(seg):
    """Overlay list of a segment: "overlays", or "text" when it is a list (on cards "text" is the card's own title)."""
    if seg.get("overlays"):
        return list(seg["overlays"])
    return list(seg["text"]) if isinstance(seg.get("text"), list) else []


def text_pngs(ctx, seg, key, seg_dur):
    """Render each text overlay of a segment to PNG; return [(png, at, dur, anim)]."""
    outs = []
    items = overlays_of(seg)
    for i, t in enumerate(items):
        kind = t.get("kind", "caption")
        kw = {k: v for k, v in t.items() if k not in ("kind", "text", "sub", "at", "dur", "anim")}
        img = cards.overlay(kind, ctx.brand, ctx.W, ctx.H, text=t.get("text", ""), sub=t.get("sub", ""), **kw)
        p = ctx.cache / f"{key}_t{i}.png"
        img.save(p)
        at = float(t.get("at", 0.3))
        dur = float(t.get("dur", min(4.0, max(1.5, seg_dur - at - 0.2))))
        outs.append((p, at, min(dur, max(0.5, seg_dur - at)), t.get("anim", "slide" if kind in ("location", "lower", "step", "tip") else "fade")))
    return outs


def overlay_chain(ctx, base_label, pngs, first_input_index, wm=None):
    """Build filtergraph text that animates PNG overlays onto [base_label]; returns (graph, out_label)."""
    g, cur = [], base_label
    for j, (png, at, dur, anim) in enumerate(pngs):
        idx = first_input_index + j
        fi = min(0.35, dur / 3)
        g.append(f"[{idx}:v]format=rgba,fade=t=in:st=0:d={fi:.3f}:alpha=1,fade=t=out:st={max(0, dur - fi):.3f}:d={fi:.3f}:alpha=1,"
                 f"setpts=PTS-STARTPTS+{at:.3f}/TB[ov{j}]")
        if anim == "slide":
            x = f"'-{ctx.W * 0.06:.0f}*pow(max(0,1-(t-{at:.3f})/{fi:.3f}),3)'"
        elif anim == "pop":
            x = "0"
        else:
            x = "0"
        g.append(f"[{cur}][ov{j}]overlay=x={x}:y=0:eof_action=pass:enable='between(t,{at:.3f},{at + dur:.3f})'[v{j}]")
        cur = f"v{j}"
    if wm is not None:
        g.append(f"[{first_input_index + len(pngs)}:v]format=rgba[wm];[{cur}][wm]overlay=0:0[vwm]")
        cur = "vwm"
    return g, cur


def letterbox(ctx, seg):
    """Cinematic bars (edit-level "letterbox": 2.39 or 2.0; a segment can set "letterbox": false or its own ratio)."""
    r = seg.get("letterbox", ctx.e.get("letterbox"))
    if not r or ctx.H > ctx.W:
        return []
    bh = int(max(0, ctx.H - ctx.W / float(r)) / 2)
    if bh < 2:
        return []
    return [f"drawbox=x=0:y=0:w=iw:h={bh}:color=black:t=fill,drawbox=x=0:y=ih-{bh}:w=iw:h={bh}:color=black:t=fill"]


def seg_key(ctx, seg, extra=""):
    blob = json.dumps([seg, ctx.W, ctx.H, ctx.fps, ctx.preview, ctx.brand, extra, ctx.e.get("letterbox"), 4], sort_keys=True, default=str)
    return hashlib.sha1(blob.encode()).hexdigest()[:14]


def render_segment(ctx, i, seg):
    """Render one segment to an intermediate .mov with video + 2 audio tracks (program, voice-key). Returns (path, dur)."""
    W, H, fps = ctx.W, ctx.H, ctx.fps
    key = seg_key(ctx, seg, ctx.e.get("watermark_default", ""))
    out = ctx.cache / f"seg{key}.mov"
    meta = ctx.cache / f"seg{key}.json"
    if out.exists() and meta.exists():
        return out, vlog.load_json(meta)["dur"]
    wm = ctx.brand.get("watermark") and seg.get("watermark", True) and "card" not in seg
    args = [vlog.FFMPEG, "-hide_banner", "-loglevel", "error", "-y"]
    if ctx.hw:
        args += ["-hwaccel", "auto"]
    vf, af_prog, audio_from_src = [], [], False
    if "card" in seg:  # full-frame branded card over blurred footage or brand colour
        dur = float(seg.get("dur", 3))
        if seg.get("bg_src"):
            inp, info = ctx.source(seg["bg_src"])
            args += ["-ss", str(seg.get("bg_in", 0)), "-t", f"{dur / float(seg.get('bg_speed', 0.5)) + 0.5:.3f}", *inp]
            vf.append(f"setpts=(PTS-STARTPTS)/{seg.get('bg_speed', 0.5)},fps={fps},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                      f"gblur=sigma={max(6, W / 90):.0f},eq=brightness=-0.06,trim=duration={dur:.3f}")
        else:
            col = ctx.brand["colors"]["dark"].lstrip("#")
            args += ["-f", "lavfi", "-t", f"{dur:.3f}", "-i", f"color=c=0x{col}:s={W}x{H}:r={fps}"]
        kind = seg["card"]
        img = cards.card(kind, ctx.brand, W, H, text=seg.get("text", ""), sub=seg.get("sub", ""),
                         **{k: v for k, v in seg.items() if k in ("big",)})
        cp = ctx.cache / f"{key}_card.png"
        img.save(cp)
        pngs = [(cp, 0.0, dur, "fade")] + text_pngs(ctx, seg, key, dur)
    elif "image" in seg:  # photo with slow push-in
        dur = float(seg.get("dur", 4))
        args += ["-loop", "1", "-framerate", str(fps), "-t", f"{dur:.3f}", "-i", str(ctx.rel(seg["image"]))]
        z0, z1 = float(seg.get("zoom", 1.0)), float(seg.get("zoom_to", 1.08))
        n = int(dur * fps)
        vf.append(f"scale={W * 2}:{H * 2}:force_original_aspect_ratio=increase,crop={W * 2}:{H * 2},"
                  f"zoompan=z='{z0}+({z1}-{z0})*on/{max(1, n - 1)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={fps}")
        vf += letterbox(ctx, seg)
        pngs = text_pngs(ctx, seg, key, dur)
    else:
        inp, info = ctx.source(seg["src"])
        t_in, t_out = float(seg.get("in", 0)), float(seg.get("out", info["duration"]))
        speed = float(seg.get("speed", 1.0))
        src_len = max(0.1, t_out - t_in)
        dur = src_len / speed + float(seg.get("freeze_end", 0))
        args += ["-ss", f"{t_in:.3f}", "-t", f"{src_len:.3f}", *inp]
        if seg.get("reverse"):
            vf.append("reverse")
        if seg.get("stabilize") and vlog.has_filter("deshake"):
            vf.append("deshake=rx=32:ry=32")
        vf.append(f"setpts=(PTS-STARTPTS)/{speed}")
        if seg.get("lens_fix") and vlog.has_filter("lenscorrection"):
            vf.append("lenscorrection=k1=-0.18:k2=0.03")  # soften GoPro wide fisheye
        z0, z1 = float(seg.get("zoom", 1.0)), float(seg.get("zoom_to", seg.get("zoom", 1.0)))
        cx, cy = float(seg.get("crop_x", 0.5)), float(seg.get("crop_y", 0.5))
        vf.append(f"fps={fps}")
        if abs(z1 - z0) > 1e-3:  # animated punch-in / Ken Burns on video
            n = max(1, int(dur * fps) - 1)
            vf.append(f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})*{cx}:(ih-{H})*{cy},"
                      f"zoompan=z='{z0}+({z1}-{z0})*on/{n}':x='(iw-iw/zoom)*{cx}':y='(ih-ih/zoom)*{cy}':d=1:s={W}x{H}:fps={fps}")
        else:
            sw, sh = int(W * z0 / 2) * 2, int(H * z0 / 2) * 2
            vf.append(f"scale={sw}:{sh}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})*{cx}:(ih-{H})*{cy}")
        g = seg.get("grade", ctx.e.get("grade", "natural"))
        g = GRADES.get(g, g) if isinstance(g, str) else ""
        if g:
            vf.append(g)
        if seg.get("freeze_end"):
            vf.append(f"tpad=stop_mode=clone:stop_duration={float(seg['freeze_end']):.3f}")
        mode = seg.get("audio", "keep")
        if info.get("has_audio") and mode != "mute" and speed <= 2.5:
            audio_from_src = True
            af_prog.append(atempo_chain(speed) if abs(speed - 1) > 1e-3 else "anull")
            gain = float(seg.get("gain_db", 0 if mode == "voice" else ctx.e.get("ambient_db", -6)))
            af_prog.append(f"volume={gain}dB")
            if seg.get("freeze_end"):
                af_prog.append(f"apad=pad_dur={float(seg['freeze_end']):.3f}")
        vf += letterbox(ctx, seg)
        pngs = text_pngs(ctx, seg, key, dur)
    # assemble the filter graph
    in_count = 1
    for p, *_ in pngs:
        args += ["-loop", "1", "-framerate", str(fps), "-t", f"{dur + 0.1:.3f}", "-i", str(p)]
    in_count += len(pngs)
    if wm:
        wp = ctx.cache / f"wm_{W}x{H}.png"
        if not wp.exists():
            cards.watermark(ctx.brand, W, H).save(wp)
        args += ["-loop", "1", "-framerate", str(fps), "-t", f"{dur + 0.1:.3f}", "-i", str(wp)]
    graph = [f"[0:v]{','.join(vf) if vf else 'null'},setsar=1,format=yuv420p[b]"]
    og, vout = overlay_chain(ctx, "b", pngs, 1, wm=True if wm else None)
    graph += og
    graph.append(f"[{vout}]trim=duration={dur:.3f},setpts=PTS-STARTPTS,format=yuv420p[vo]")
    fade = 0.015
    if audio_from_src:
        graph.append(f"[0:a]asetpts=PTS-STARTPTS,{','.join(af_prog)},aresample=48000,aformat=channel_layouts=stereo,"
                     f"apad,atrim=duration={dur:.3f},afade=t=in:d={fade},afade=t=out:st={max(0, dur - fade):.3f}:d={fade}[ap]")
    else:
        graph.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={dur:.3f}[ap]")
    if audio_from_src and seg.get("audio") == "voice":
        graph.append("[ap]asplit=2[a1][a2]")
        amap = ["-map", "[a1]", "-map", "[a2]"]
    else:
        graph.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={dur:.3f}[ak]")
        amap = ["-map", "[ap]", "-map", "[ak]"]
    args += ["-filter_complex", ";".join(graph), "-map", "[vo]", *amap, "-r", str(fps), *ctx.venc(), "-c:a", "pcm_s16le", str(out)]
    vlog.run(args)
    vlog.save_json(meta, {"dur": dur})
    return out, dur


def join(ctx, items, out):
    """items: [(file, dur, transition, tdur)] -> one file (video + 2 audio tracks).

    Consecutive hard cuts are joined with the concat demuxer ("runs"); runs are then chained with xfade / acrossfade
    only, a few at a time, so filter graphs stay small and timestamps stay exact."""
    runs = []
    for it in items:
        if not runs or (it[2] != "cut" and float(it[3] or 0) > 0.02):
            runs.append([it])
        else:
            runs[-1].append(it)
    run_files = []
    for r_i, run in enumerate(runs):
        if len(run) == 1:
            run_files.append((run[0][0], run[0][2], run[0][3]))
            continue
        lst = out.with_name(out.stem + f"_run{r_i}.txt")
        lst.write_text("".join(f"file '{Path(f).resolve().as_posix()}'\n" for f, *_ in run), encoding="utf-8")
        rf = out.with_name(out.stem + f"_run{r_i}.mov")
        # re-encode (not stream copy): copied concat output carries timestamps that break xfade later
        vlog.run([vlog.FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-map", "0",
                  "-r", str(ctx.fps), *ctx.venc(), "-c:a", "pcm_s16le", str(rf)])
        run_files.append((rf, run[0][2], run[0][3]))
        if __import__("os").environ.get("VLOG_KEEP"):
            print("   run", r_i, [Path(f).name for f, *_ in run], vlog.probe(rf)["duration"])
    cur, cur_dur = run_files[0][0], vlog.probe(run_files[0][0])["duration"]
    k = 1
    step = 0
    while k < len(run_files):
        batch = run_files[k:k + 8]
        ins = ["-i", str(cur)]
        for f, *_ in batch:
            ins += ["-i", str(f)]
        gv, ga, v, a1, a2, acc = [], [], "0:v", "0:a:0", "0:a:1", cur_dur
        norm = f"setpts=N/FRAME_RATE/TB,fps={ctx.fps},settb=AVTB"
        for j, (f, tr, td) in enumerate(batch, 1):
            d = vlog.probe(f)["duration"]
            td = min(float(td), d / 2, acc / 2)
            name = {"dip": "fadeblack", "flash": "fadewhite"}.get(tr, tr)
            name = name if name in XFADES else "fade"
            gv.append(f"[{v}]{norm}[pv{j}];[{j}:v]{norm}[nv{j}];[pv{j}][nv{j}]xfade=transition={name}:duration={td:.3f}:offset={acc - td:.3f}[v{j}]")
            ga.append(f"[{a1}][{j}:a:0]acrossfade=d={td:.3f}:c1=tri:c2=tri[a{j}]")
            ga.append(f"[{a2}][{j}:a:1]acrossfade=d={td:.3f}:c1=tri:c2=tri[k{j}]")
            v, a1, a2, acc = f"v{j}", f"a{j}", f"k{j}", acc + d - td
        nxt = out if k + len(batch) >= len(run_files) else out.with_name(out.stem + f"_step{step}.mov")
        # video and audio in separate passes: one graph mixing xfade and acrossfade truncates output on some ffmpeg builds
        vtmp, atmp = nxt.with_name(nxt.stem + "_v.mov"), nxt.with_name(nxt.stem + "_a.mov")
        base = [vlog.FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *ins]
        vlog.run(base + ["-filter_complex", ";".join(gv), "-map", f"[{v}]", "-r", str(ctx.fps), *ctx.venc(), str(vtmp)])
        vlog.run(base + ["-filter_complex", ";".join(ga), "-map", f"[{a1}]", "-map", f"[{a2}]", "-c:a", "pcm_s16le", str(atmp)])
        vlog.ff("-i", vtmp, "-i", atmp, "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", nxt)
        vtmp.unlink(missing_ok=True)
        atmp.unlink(missing_ok=True)
        cur, cur_dur = nxt, acc
        k += len(batch)
        step += 1
    if Path(cur) != out:
        shutil.copy(cur, out)
    if not __import__("os").environ.get("VLOG_KEEP"):
        for p in out.parent.glob(out.stem + "_*"):
            p.unlink(missing_ok=True)
    return vlog.probe(out)["duration"]


def timeline(ctx, segs, durs):
    t, rows = 0.0, []
    for i, (s, d) in enumerate(zip(segs, durs)):
        tr, td = s.get("transition", "cut"), float(s.get("tdur", 0.5)) if s.get("transition", "cut") != "cut" else 0
        if i == 0:
            td = 0
        td = min(td, d / 2, (rows[-1]["dur"] / 2) if rows else 0)
        start = t - td
        rows.append({"i": i, "start": round(start, 3), "end": round(start + d, 3), "dur": round(d, 3), "src": s.get("src") or s.get("card") or s.get("image"),
                     "in": s.get("in"), "out": s.get("out"), "speed": s.get("speed", 1), "chapter": s.get("chapter"), "audio": s.get("audio", "keep"),
                     "text": [{**x, "abs_at": round(start + float(x.get("at", 0.3)), 3)} for x in overlays_of(s)]})
        t = start + d
    return rows, t


def mix(ctx, joined, total, rows, out, tl_path):
    e = ctx.e
    args = [vlog.FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(joined)]
    g = ["[0:a:0]aresample=48000[prog]", "[0:a:1]aresample=48000,pan=mono|c0=0.5*c0+0.5*c1,asplit=2[key][keyv]"]
    mus, n_in = [], 1
    for j, m in enumerate(e.get("music", [])):
        at = float(m.get("at", 0))
        if "at_seg" in m:
            at = rows[int(m["at_seg"])]["start"] + float(m.get("offset", 0))
        frm = float(m.get("from", 0))
        to_end = m.get("to_end", m.get("to") is None and j == len(e.get("music", [])) - 1)
        length = (total - at) if to_end else float(m.get("to", frm + 600)) - frm
        if m.get("loop"):
            args += ["-stream_loop", "-1"]
        args += ["-i", str(ctx.rel(m["file"]))]
        fi, fo = float(m.get("fade_in", 0.3)), float(m.get("fade_out", 2.5 if to_end else 1.0))
        g.append(f"[{n_in}:a]atrim=start={frm:.3f}:duration={length:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,"
                 f"volume={float(m.get('gain_db', e.get('music_db', -14)))}dB,afade=t=in:d={fi:.3f},afade=t=out:st={max(0, length - fo):.3f}:d={fo:.3f},"
                 f"adelay={int(at * 1000)}|{int(at * 1000)}[m{j}]")
        mus.append(f"[m{j}]")
        n_in += 1
    sfx = []
    for j, s in enumerate(e.get("sfx", [])):
        at = float(s.get("at", 0)) if "at_seg" not in s else rows[int(s["at_seg"])]["start"] + float(s.get("offset", 0))
        args += ["-i", str(ctx.rel(s["file"]))]
        g.append(f"[{n_in}:a]aresample=48000,aformat=channel_layouts=stereo,volume={float(s.get('gain_db', -6))}dB,adelay={int(at * 1000)}|{int(at * 1000)}[s{j}]")
        sfx.append(f"[s{j}]")
        n_in += 1
    duck = e.get("duck", {})
    parts = ["[prog]"]
    if mus:
        g.append(f"{''.join(mus)}amix=inputs={len(mus)}:normalize=0:duration=longest[mall]" if len(mus) > 1 else f"{mus[0]}anull[mall]")
        # duck music under speech: ~10 dB of reduction while someone talks, back up in the gaps
        g.append(f"[mall][key]sidechaincompress=threshold={duck.get('threshold', 0.015)}:ratio={duck.get('ratio', 9)}:attack={duck.get('attack', 25)}:"
                 f"release={duck.get('release', 450)}:makeup=1:level_sc={duck.get('level_sc', 2)}[mduck]")
        parts.append("[mduck]")
    else:
        g.append("[key]anullsink")
    g.append("[keyv]anullsink")
    parts += sfx
    g.append(f"{''.join(parts)}amix=inputs={len(parts)}:normalize=0:duration=first,atrim=duration={total:.3f}[mixed]")
    target = float(e.get("loudness", -14))
    # pass 1: measure loudness
    m_args = [x if x != "error" else "info" for x in args] + ["-nostats", "-filter_complex", ";".join(g + [f"[mixed]loudnorm=I={target}:TP=-1.0:LRA=11:print_format=json[o]"]), "-map", "[o]", "-f", "null", "-"]
    r = vlog.run(m_args)
    txt = r.stderr.decode(errors="replace")
    blk = txt[txt.rfind("Parsed_loudnorm"):] if "Parsed_loudnorm" in txt else txt
    js = json.loads(blk[blk.find("{"): blk.rfind("}") + 1])
    ln = (f"loudnorm=I={target}:TP=-1.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    final = args + ["-filter_complex", ";".join(g + [f"[mixed]{ln},aresample=48000,alimiter=limit=0.79:attack=3:release=60:level=disabled[o]"]), "-map", "0:v", "-map", "[o]"]
    if ctx.preview:
        final += ["-c:v", "copy"]
    else:
        crf = 17 if ctx.W * ctx.H <= 1920 * 1080 else 18
        enc = e.get("encoder", "libx264")
        if enc == "libx264":
            final += ["-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", str(int(ctx.fps * 2))]
        else:  # e.g. h264_videotoolbox / h264_nvenc for speed
            final += ["-c:v", enc, "-b:v", "45M" if ctx.W * ctx.H > 1920 * 1080 else "16M", "-pix_fmt", "yuv420p"]
    final += ["-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", str(out)]
    vlog.run(final)
    return js


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("edit")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--only", default="", help="segment range like 5-12 (0-based, inclusive)")
    ap.add_argument("--hwaccel", action="store_true", help="hardware decoding (helps 4K HEVC on Macs / NVIDIA)")
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    vlog.need_ffmpeg()
    ctx = Ctx(a.edit, a.preview, a.hwaccel)
    segs = ctx.e["segments"]
    lo, hi = 0, len(segs) - 1
    if a.only:
        lo, _, h = a.only.partition("-")
        lo, hi = int(lo), int(h or lo)
    out = Path(a.out) if a.out else ctx.rel(ctx.e.get("output", "out/final.mp4"))
    if a.preview:
        out = out.with_name(out.stem + "_preview" + out.suffix)
    if a.only:
        out = out.with_name(out.stem + f"_seg{lo}-{hi}" + out.suffix)
    out.parent.mkdir(parents=True, exist_ok=True)
    files, durs = [], []
    for i in range(lo, hi + 1):
        s = segs[i]
        print(f"  segment {i + 1}/{len(segs)} {s.get('src') or s.get('card') or s.get('image')} ...", end="", flush=True)
        f, d = render_segment(ctx, i, s)
        print(f" {d:.1f}s", flush=True)
        files.append(f)
        durs.append(d)
    rows, total = timeline(ctx, segs[lo:hi + 1], durs)
    items = [(f, d, s.get("transition", "cut") if k else "cut", float(s.get("tdur", 0.5))) for k, (f, d, s) in enumerate(zip(files, durs, segs[lo:hi + 1]))]
    joined = ctx.cache / f"joined_{hashlib.sha1(json.dumps([str(x[0]) for x in items] + [x[2:] for x in items]).encode()).hexdigest()[:10]}.mov"
    print("  joining ...", flush=True)
    real = join(ctx, items, joined)
    if abs(real - total) > 0.1:
        print(f"  note: joined length {real:.2f}s vs timeline {total:.2f}s")
        total = real
    print("  mixing music + loudness ...", flush=True)
    meas = mix(ctx, joined, total, rows, out, None)
    tl = {"output": str(out), "duration": round(total, 3), "canvas": [ctx.W, ctx.H], "fps": ctx.fps, "segments": rows,
          "loudness_before_norm": meas.get("input_i"), "title": ctx.e.get("title", "")}
    vlog.save_json(out.with_suffix(".timeline.json"), tl)
    for p in ctx.cache.glob("joined_*"):
        if p != joined:
            p.unlink(missing_ok=True)
    print(f"done: {out}  ({vlog.hms(total)}, {ctx.W}x{ctx.H})")


if __name__ == "__main__":
    main()
