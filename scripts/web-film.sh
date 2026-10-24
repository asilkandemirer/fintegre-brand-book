#!/bin/sh
# Encodes the films in assets/film for scrubbing; build.mjs embeds the results.
# A keyframe every few frames and no B-frames keep seeking cheap in both directions.
# H.264 plays in Safari, Chrome, Edge and Firefox; VP9 covers Chromium builds without H.264.
# No audio: the page scrubs the footage with the scroll clock.
# Run: sh scripts/web-film.sh
set -e
OUT=assets/web
enc() { # source, output name, width:height, H.264 crf, VP9 crf, keyframe interval, poster time
  ffmpeg -v error -y -i "$1" -an -vf "scale=$3:flags=lanczos" -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
    -g "$6" -keyint_min "$6" -sc_threshold 0 -bf 0 -crf "$4" -movflags +faststart "$OUT/$2.mp4"
  ffmpeg -v error -y -i "$1" -an -vf "scale=$3:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf "$5" -g "$6" -keyint_min "$6" \
    -row-mt 1 -deadline good -cpu-used 1 -pix_fmt yuv420p "$OUT/$2.webm"
  ffmpeg -v error -y -ss "$7" -i "$1" -frames:v 1 -vf "scale=1280:720:flags=lanczos" -c:v libwebp -quality 72 "$OUT/$2-poster.webp"
}
enc assets/film/objects-film.mp4 film 1600:900 24 34 4 0
enc assets/film/kampanya-filmi.mp4 kampanya 1280:720 29 40 6 0
ls -l "$OUT"/film* "$OUT"/kampanya*
