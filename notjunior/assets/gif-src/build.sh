#!/bin/sh
# Rebuilds ../../notjunior.gif. Needs: Google Chrome, node >= 22, ffmpeg, curl.
# 1. fetch Fraunces + JetBrains Mono from Google Fonts and inline them
# 2. wrap anim-body.html into a standalone page
# 3. capture 330 frames at 10 fps through headless Chrome (DevTools protocol)
# 4. assemble a looping GIF with a generated 128-color palette
set -e
cd "$(dirname "$0")"
W=$(mktemp -d)
curl -sS -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap" \
  -o "$W/fonts.css"
python3 - "$W" <<'PY'
import re, base64, urllib.request, sys
w=sys.argv[1]; css=open(f"{w}/fonts.css").read(); out=[]
# each @font-face, with the subset comment Google puts before it when it serves woff2
for subset, body in re.findall(r"(?:/\* ([\w-]+) \*/\s*)?@font-face \{(.*?)\}", css, re.S):
    if subset and subset not in ("latin", "latin-ext"): continue
    url=re.search(r"url\((https://[^)]+)\)", body).group(1)
    mime="font/woff2" if url.endswith(".woff2") else "font/ttf"
    data=urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})).read()
    out.append("@font-face {"+body.replace(url,f"data:{mime};base64,"+base64.b64encode(data).decode())+"}")
assert out, "no font faces found in the Google Fonts response"
open(f"{w}/inline.css","w").write("\n".join(out))
PY
{ printf '<!doctype html><meta charset="utf-8"><title>notjunior anim</title><style>'; cat "$W/inline.css"; printf '</style>'; cat anim-body.html; } > "$W/anim.html"
node capture.mjs "$W/anim.html" "$W/frames" 10 33000
ffmpeg -y -loglevel error -framerate 10 -i "$W/frames/f%04d.png" -vf "palettegen=max_colors=128:stats_mode=full" "$W/palette.png"
ffmpeg -y -loglevel error -framerate 10 -i "$W/frames/f%04d.png" -i "$W/palette.png" -lavfi "paletteuse=dither=none" -loop 0 ../../notjunior.gif
echo "wrote ../../notjunior.gif"; rm -rf "$W"
