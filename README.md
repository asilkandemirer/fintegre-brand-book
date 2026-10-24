# Fintegre Brand Book

The Fintegre brand book as one self-contained HTML file: `dist/fintegre-brand-book.html`.

It plays like a film on a fixed stage. Scrolling never moves the page; it moves time. Nothing travels up or down: elements arrive by opening, turning, zooming or typing, and leave to the left or by shrinking away with a small bounce. Wheel, touch and arrow keys all drive the same clock, with a speed limit, and the galleries have their own pace that a hard flick cannot rush.

## Story

Intro (the mark assembles, the photo opens through it) · 01 What is Fintegre · 02 Values · 03 Apple ecosystem · 04 Logo (3D mark that turns into digits, then a valuation screen) and logo system · 05 Colour · 06 Typography (weights, italic, card system, what breaks it) · 07 Photography (paced gallery) · 08 Photo and type · 09 Icons (sketch to final, colour and angle from the mark) · 10 Illustration · 11 Social (post to Reel to profile grid) · 12 In use (fashion strip, billboard, campaign film, brand objects film, devices in 3D) · Closing

## Structure

- `src/template.html`: every scene's copy, markup and CSS. Timed elements carry `data-t="in,out"` in scene beats (and `data-tm` for phones), an entry (`data-e`: pop, open, flip, zoom, right, wipe, draw, tilt) and an exit (`data-x`: left, shrink, cut, flip, zoom, fade). Text with `data-fx` is typed in and blown out to the left.
- `src/main.js`: the timeline, element states, background colour, nav, index and every continuous motion (intro mask zoom, galleries, ratio morph, icon build, reel, billboard, brand film, devices). The brand film is scrubbed, not played: scroll sets its time, one seek at a time, and on narrow screens the crop pans to follow the subject
- `src/engine.js`: the clock: input to beats, speed limits, paced regions (`data-slow` on a scene)
- `src/stage3d.js`: Three.js for the mark (assembly, sweep line, digit cloud) and the devices (laptop, phones)
- `src/ascii.js`: digits under the pointer and short number streams (desktop only), and the drawing of the digit mark
- `src/i18n.js`: the Turkish layer. English in the template is the master copy; each Turkish string is keyed by its exact English text, so meaning is always checked against English. The page opens in Turkish; the TR / EN button (or the L key) switches language and remembers the choice. Names, colour and font names, sizes and codes stay in English on purpose. Run `__fb.missing()` in the console to list English text that has no Turkish entry.
- `src/textfx.js`: the typing and wind effects; `src/icons.js`: icons and illustrations; `src/logo.js`: the mark geometry; `src/audio.js`: the one chime
- `assets/images/` source images, `assets/web/` their WebP versions embedded by the build; `pack/` logo files and the image prompt pack
- `assets/film/objects-film.mp4`: the brand objects film (notebook, pen, mug, stickers; generated with Higgsfield). `assets/film/kampanya-filmi.mp4`: the campaign film (earbuds, billboard, bus, ad column, facade, closing billboard), cut from four Kling parts with short dissolves, with sound. `scripts/web-film.sh` encodes both for scrubbing (H.264 and VP9, short keyframe interval, no sound); the page uses the first codec the browser can play
- The build writes two pages. `dist/fintegre-brand-book.html` is the artifact page: the campaign film is not inside it but published next to it as `media/kampanya.mp4` and `media/kampanya.webm`, which keeps the page under the 16 MB artifact limit. `dist/fintegre-brand-book-tek-dosya.html` (also `dist/test.html`) embeds everything and works anywhere, offline included

## Build

```sh
npm install
npm run images   # only after changing assets/images (needs Python with Pillow)
sh scripts/web-film.sh   # only after changing assets/film (needs ffmpeg with libx264 and libvpx)
npm run build    # writes dist/fintegre-brand-book.html and dist/test.html (local preview)
```

To swap the hero photo for a video later, replace the `<img>` inside `#heroph` with a muted, looping `<video>`; the intro mask works on either.

## Genjutsu blockout (30 s · 20 fps)

`video/` holds the rough source video for Higgsfield Genjutsu: boxes, lines and dots that fix the camera, timing and staging, so Genjutsu can replace each simple shape with a reference image.

- `video/blockout.js`: the scene. Every frame is a pure function of its time (`renderAt(frame)`), and `SHOTS` lists the 16 shots with their seconds.
- `video/render.mjs`: renders frames with headless Chromium (`node video/render.mjs <outDir> 0 599`, or a comma list such as `0,150,300` for a quick look).
- `video/encode.py`: writes `blockout.mp4` (clean, for Genjutsu) and `blockout-etiketli.mp4` (shot, time and frame stamped, for review).
- `video/devices.js`: a 20 s device chain for Kling 4.0. The mark stays fixed in the centre while one object turns from an old phone into a new phone, iPad, MacBook Air, MacBook Pro, iMac, Mac mini, Mac Studio, earbuds and Watch, each time with the mark on that device's logo spot. Render with `ENTRY=video/devices.js node video/render.mjs <outDir> 0 399`, then `python3 video/encode.py <outDir> video/devices.js cihazlar`.
