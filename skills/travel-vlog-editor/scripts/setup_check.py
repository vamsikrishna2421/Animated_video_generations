"""Check that the laptop has everything the travel-vlog-editor skill needs, and print install steps for what is missing.

  python scripts/setup_check.py
"""
import importlib
import platform
import shutil
import sys

sys.path.insert(0, __import__("os").path.dirname(__file__))
import vlog  # noqa: E402

OS = platform.system()
ok = True


def line(good, what, fix=""):
    global ok
    ok &= bool(good) or what.startswith("(optional)")
    print(f"  [{'ok' if good else '--'}] {what}" + ("" if good else f"\n        -> {fix}"))


print(f"System: {OS} {platform.machine()}, Python {sys.version.split()[0]}")
install = {"Darwin": "brew install ffmpeg   (install Homebrew first from https://brew.sh)",
           "Windows": "winget install Gyan.FFmpeg   (then open a new terminal)",
           "Linux": "sudo apt install ffmpeg"}.get(OS, "install ffmpeg from https://ffmpeg.org/download.html")
line(vlog.FFMPEG, f"ffmpeg  {vlog.FFMPEG or ''}", install)
line(vlog.FFPROBE, f"ffprobe {vlog.FFPROBE or ''}", install)
if vlog.FFMPEG:
    for flt, why in [("xfade", "video transitions"), ("acrossfade", "audio transitions"), ("sidechaincompress", "music ducking under speech"),
                     ("loudnorm", "YouTube loudness"), ("overlay", "titles/graphics"), ("zoompan", "photo/still motion")]:
        line(vlog.has_filter(flt), f"ffmpeg filter {flt} ({why})", "install a full ffmpeg build (brew/winget versions are full)")
    for flt, why in [("vidstabdetect", "extra stabilisation"), ("subtitles", "burned-in captions"), ("lenscorrection", "fisheye fix")]:
        line(vlog.has_filter(flt), f"(optional) ffmpeg filter {flt} ({why})", "optional; the skill falls back without it")
for mod, pipname, optional in [("numpy", "numpy", False), ("PIL", "pillow", False), ("faster_whisper", "faster-whisper", True)]:
    try:
        importlib.import_module(mod)
        good = True
    except Exception:
        good = False
    line(good, ("(optional) " if optional else "") + f"python package {pipname}" + (" (speech transcripts, subtitles)" if optional else ""),
         f"{sys.executable} -m pip install {pipname}")
free = shutil.disk_usage(".").free / 1e9
line(free > 20, f"free disk here: {free:.0f} GB (proxies + renders need ~10-30 GB for a trip)", "free up space or use an external SSD for the project folder")
print("\nREADY" if ok else "\nFix the [--] items above, then re-run.")
