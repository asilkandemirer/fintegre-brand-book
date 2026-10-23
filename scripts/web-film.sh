#!/bin/sh
# Encodes assets/film/objects-film.mp4 for scrubbing: build.mjs embeds the results.
# A keyframe every 4 frames and no B-frames keep seeking cheap in both directions.
# H.264 plays in Safari, Chrome, Edge and Firefox; VP9 covers Chromium builds without H.264.
# Run: sh scripts/web-film.sh
set -e
SRC=assets/film/objects-film.mp4
OUT=assets/web
ffmpeg -v error -y -i "$SRC" -an -vf "scale=1600:900:flags=lanczos" -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
  -g 4 -keyint_min 4 -sc_threshold 0 -bf 0 -crf 24 -movflags +faststart "$OUT/film.mp4"
ffmpeg -v error -y -i "$SRC" -an -vf "scale=1600:900:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 34 -g 4 -keyint_min 4 \
  -row-mt 1 -deadline good -cpu-used 1 -pix_fmt yuv420p "$OUT/film.webm"
ffmpeg -v error -y -i "$SRC" -frames:v 1 -vf "scale=1280:720:flags=lanczos" -c:v libwebp -quality 72 "$OUT/film-poster.webp"
ls -l "$OUT"/film*
