#!/usr/bin/env bash
# Render a news/spotlight episode from its spec: narration + timeline, NewsReel render, -14 LUFS.
# Usage: pipeline/render_news.sh news/<spec>.json [en|te] [handle]
#   COMP=NewsYT renders the 16:9 YouTube edition of the same timeline to out/news/<id>-<lang>-yt.mp4;
#   SKIP_BUILD=1 reuses the existing timeline (no narration rebuild).
set -e
cd "$(dirname "$0")/.."
SPEC=$1; LANG_=${2:-en}; HANDLE=${3:-@ai_maastaaru}; COMP=${COMP:-NewsReel}
ID=$(python3 -c "import json,sys;print(json.load(open('$SPEC'))['id'])")
[ -n "$SKIP_BUILD" ] || python3 pipeline/news_build.py "$SPEC" "$LANG_" | grep -E "^(timeline)" || true
SUF=""; [ "$COMP" = NewsYT ] && SUF="-yt"
OUT="out/news/$ID-$LANG_$SUF.mp4"
mkdir -p out/news
python3 -c "import json;tl=json.load(open('video/src/news/timelines/$ID-$LANG_.json'));json.dump({'tl':tl,'handle':'$HANDLE'},open('out/news/.$ID-$LANG_.props.json','w'))"
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
(cd video && npx remotion render src/index.ts $COMP "../$OUT" --props="../out/news/.$ID-$LANG_.props.json" --overwrite --browser-executable=$B --concurrency=4 --log=error)
python3 pipeline/loudnorm.py "$OUT"
echo "NEWS_DONE $OUT"
