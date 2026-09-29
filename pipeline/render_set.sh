#!/usr/bin/env bash
# Render every format of the given items. Usage: pipeline/render_set.sh promo intro ep01
# Outputs: out/insta_en/, out/telugu_page/ (Insta Telugu), out/youtube/ (YouTube EN + TE).
set -e
cd "$(dirname "$0")/.."
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p out/insta_en out/telugu_page out/youtube
render() { (cd video && npx remotion render src/index.ts "$1" "../$2" --overwrite --browser-executable=$B --concurrency=3 --log=error) && echo "rendered $2"; }
for item in "$@"; do
  case $item in
    promo)
      python3 pipeline/story_promo_te.py te && python3 pipeline/story_promo_te.py en
      render ChannelStoryEn out/insta_en/00_promo_insta_en.mp4
      render ChannelStoryTe out/telugu_page/00_promo_insta_te.mp4
      render ChannelStoryEnYT out/youtube/00_promo_yt_en.mp4
      render ChannelStoryTeYT out/youtube/00_promo_yt_te.mp4 ;;
    intro|ep*)
      id=$([ "$item" = intro ] && echo ep00 || echo "$item"); n=$([ "$item" = intro ] && echo 01_intro || echo "02_${item}")
      python3 pipeline/reel_build.py "reels/${id}v2.json" && python3 pipeline/reel_build.py "reels/${id}te.json"
      render "Reel-${id}v2" "out/insta_en/${n}_insta_en.mp4"
      render "Reel-${id}te" "out/telugu_page/${n}_insta_te.mp4"
      render "YT-${id}v2" "out/youtube/${n}_yt_en.mp4"
      render "YT-${id}te" "out/youtube/${n}_yt_te.mp4" ;;
  esac
done
echo RENDER_SET_DONE
