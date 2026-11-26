"""Does YouTube let this (cloud) computer download? Prints a short report.

Test video: "Big Buck Bunny" by the Blender Foundation (Creative Commons BY), official upload.
Steps: 1) read the video page, 2) download a small audio stream, 3) download ~10 s of 720p
video+sound joined into an MP4 (the same format choice as the LvTS notebook).
"""
import json, os, sys, tempfile, time, urllib.request

import yt_dlp

VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ"


def where_am_i():
    try:
        with urllib.request.urlopen("https://ipinfo.io/json", timeout=10) as r:
            d = json.load(r)
        return f"{d.get('ip')} · {d.get('org')} · {d.get('city')}, {d.get('country')}"
    except Exception as e:
        return f"unknown ({type(e).__name__})"


class Quiet:
    def __init__(self): self.errors = []
    def debug(self, m): pass
    def info(self, m): pass
    def warning(self, m): pass
    def error(self, m): self.errors.append(m)


def attempt(label, opts):
    log = Quiet()
    base = {"logger": log, "quiet": True, "no_warnings": True, "noprogress": True, "noplaylist": True}
    base.update(opts)
    t = time.time()
    try:
        with yt_dlp.YoutubeDL(base) as ydl:
            info = ydl.extract_info(VIDEO, download=bool(opts.get("outtmpl")))
        took = time.time() - t
        heights = sorted({f.get("height") for f in info.get("formats", []) if f.get("height")})
        files = [d.get("filepath") for d in info.get("requested_downloads", []) or [] if d.get("filepath")]
        size = sum(os.path.getsize(p) for p in files if os.path.exists(p))
        extra = f", saved {size/1e6:.1f} MB" if files else ""
        print(f"  OK    {label}: '{info.get('title')}' · heights {heights[:1]}..{heights[-1:]}{extra} ({took:.0f}s)")
        return True
    except Exception as e:
        msg = str(e).replace("\n", " ")
        print(f"  FAIL  {label}: {msg[:230]}")
        return False


def main():
    print("yt-dlp", yt_dlp.version.__version__, "| network:", where_am_i())
    tmp = tempfile.mkdtemp()
    clients = sys.argv[1:] or ["default"]
    for client in clients:
        extra = {} if client == "default" else {"extractor_args": {"youtube": {"player_client": [client]}}}
        print(f"[player client: {client}]")
        if not attempt("1 read video page", dict(extra)):
            continue
        attempt("2 download small audio", dict(extra, format="worstaudio", outtmpl=os.path.join(tmp, f"{client}-a.%(ext)s")))
        attempt("3 download 10 s of 720p MP4", dict(
            extra,
            format="bestvideo[height<=720][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]",
            merge_output_format="mp4",
            download_ranges=yt_dlp.utils.download_range_func(None, [(30, 40)]),
            force_keyframes_at_cuts=False,
            outtmpl=os.path.join(tmp, f"{client}-v.%(ext)s"),
        ))


if __name__ == "__main__":
    main()
