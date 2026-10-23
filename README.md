# Fintegre Brand Book

The Fintegre brand book as one self-contained HTML file: `dist/fintegre-brand-book.html`.

It plays like a film on a fixed stage. Scrolling never moves the page; it moves time. Nothing travels up or down: elements arrive by opening, turning, zooming or typing, and leave to the left or by shrinking away with a small bounce. Wheel, touch and arrow keys all drive the same clock, with a speed limit, and the galleries have their own pace that a hard flick cannot rush.

## Story

Intro (the mark assembles, the photo opens through it) · 01 What is Fintegre · 02 Values · 03 Apple ecosystem · 04 Logo (3D mark that turns into digits, then a valuation screen) and logo system · 05 Colour · 06 Typography (weights, italic, card system, what breaks it) · 07 Photography (paced gallery) · 08 Photo and type · 09 Icons (sketch to final, colour and angle from the mark) · 10 Illustration · 11 Social (post to Reel to profile grid) · 12 In use (fashion strip, billboard, brand objects in 3D) · Closing

## Structure

- `src/template.html`: every scene's copy, markup and CSS. Timed elements carry `data-t="in,out"` in scene beats (and `data-tm` for phones), an entry (`data-e`: pop, open, flip, zoom, right, wipe, draw, tilt) and an exit (`data-x`: left, shrink, cut, flip, zoom, fade). Text with `data-fx` is typed in and blown out to the left.
- `src/main.js`: the timeline, element states, background colour, nav, index and every continuous motion (intro mask zoom, galleries, ratio morph, icon build, reel, billboard, objects)
- `src/engine.js`: the clock: input to beats, speed limits, paced regions (`data-slow` on a scene)
- `src/stage3d.js`: Three.js for the mark (assembly, sweep line, digit cloud) and the brand objects (notebook, laptop, mug, phones)
- `src/ascii.js`: digits under the pointer and short number streams (desktop only), and the drawing of the digit mark
- `src/i18n.js`: the Turkish layer. English in the template is the master copy; each Turkish string is keyed by its exact English text, so meaning is always checked against English. The page opens in Turkish; the TR / EN button (or the L key) switches language and remembers the choice. Names, colour and font names, sizes and codes stay in English on purpose. Run `__fb.missing()` in the console to list English text that has no Turkish entry.
- `src/textfx.js`: the typing and wind effects; `src/icons.js`: icons and illustrations; `src/logo.js`: the mark geometry; `src/audio.js`: the one chime
- `assets/images/` source images, `assets/web/` their WebP versions embedded by the build; `pack/` logo files and the image prompt pack

## Build

```sh
npm install
npm run images   # only after changing assets/images (needs Python with Pillow)
npm run build    # writes dist/fintegre-brand-book.html and dist/test.html (local preview)
```

To swap the hero photo for a video later, replace the `<img>` inside `#heroph` with a muted, looping `<video>`; the intro mask works on either.
