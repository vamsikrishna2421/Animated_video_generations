#!/usr/bin/env bash
# Render the brand kit (showreel + reusable stings/outros) into out/brand/, loudness-normalised to -14 LUFS.
# Usage: pipeline/render_brand.sh [composition ...]   (no args = everything)
set -e
cd "$(dirname "$0")/.."
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p out/brand
declare -A OUT=(
  [Brand-Showreel]=brand_showreel [Brand-Sting]=sting_dark [Brand-Sting-Light]=sting_light [Brand-Sting-Te]=sting_te
  [Brand-Sting-YT]=sting_yt [Brand-Follow]=follow_outro [Brand-Follow-Te]=follow_outro_te [Brand-Subscribe]=subscribe_yt
  [Brand-Captions]=captions_demo
)
ITEMS=("$@")
[ ${#ITEMS[@]} -eq 0 ] && ITEMS=(Brand-Showreel Brand-Sting Brand-Sting-Light Brand-Sting-Te Brand-Sting-YT Brand-Follow Brand-Follow-Te Brand-Subscribe Brand-Captions)
python3 pipeline/brand_audio.py >/dev/null
for c in "${ITEMS[@]}"; do
  f="out/brand/${OUT[$c]}.mp4"
  (cd video && npx remotion render src/index.ts "$c" "../$f" --overwrite --browser-executable=$B --concurrency=4 --log=error)
  python3 pipeline/loudnorm.py "$f"
done
echo BRAND_DONE
