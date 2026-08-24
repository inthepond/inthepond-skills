#!/bin/sh
# Rebuilds ../../gnose.gif. Needs: Google Chrome, node >= 22, ffmpeg, curl.
# 1. fetch Fraunces + JetBrains Mono from Google Fonts and inline them
# 2. wrap anim-body.html into a standalone page
# 3. capture 170 frames at 10 fps through headless Chrome (DevTools protocol)
# 4. assemble a looping GIF with a generated 128-color palette
set -e
cd "$(dirname "$0")"
W=$(mktemp -d)
curl -sS -A "Mozilla/5.0 (Macintosh) Chrome/124.0" \
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=JetBrains+Mono:wght@400;500&display=swap" \
  -o "$W/fonts.css"
python3 - "$W" <<'PY'
import re, base64, urllib.request, sys
w=sys.argv[1]; css=open(f"{w}/fonts.css").read(); out=[]
for whole, subset, body in re.findall(r"(/\* ([\w-]+) \*/\n@font-face \{(.*?)\})", css, re.S):
    if subset!="latin": continue
    url=re.search(r"url\((https://[^)]+)\)", body).group(1)
    data=urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})).read()
    out.append("@font-face {"+body.replace(url,"data:font/woff2;base64,"+base64.b64encode(data).decode())+"}")
open(f"{w}/inline.css","w").write("\n".join(out))
PY
{ printf '<!doctype html><meta charset="utf-8"><title>gnose anim</title><style>'; cat "$W/inline.css"; printf '</style>'; cat anim-body.html; } > "$W/anim.html"
node capture.mjs "$W/anim.html" "$W/frames" 10 17000
ffmpeg -y -loglevel error -framerate 10 -i "$W/frames/f%04d.png" -vf "palettegen=max_colors=128:stats_mode=full" "$W/palette.png"
ffmpeg -y -loglevel error -framerate 10 -i "$W/frames/f%04d.png" -i "$W/palette.png" -lavfi "paletteuse=dither=none" -loop 0 ../../gnose.gif
echo "wrote ../../gnose.gif"; rm -rf "$W"
