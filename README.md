# Fintegre Brand Book

Brand book v2 for Fintegre, built into one self-contained HTML file: `dist/fintegre-brand-book.html`.

It reads as one editorial scroll. A fixed backdrop moves from photography to Night Indigo, Deep Indigo, Ice Blue, White Smoke and white. Pinned scenes appear only where motion explains something: the cover, the 3D mark, type growing from a skeleton, and an icon going from sketch to final.

## Chapters

Cover · 01 What is Fintegre · 02 Values · 03 Apple ecosystem · 04 Logo (3D) and logo system · 05 Colour · 06 Typography · 07 Graphic language · 08 Icons · 09 Illustration · 10 Card patterns · 11 Photography · 12 Tone of voice · 13 Instagram · 14 Merchandise · 15 Devices · Closing

## Structure

- `src/template.html`: all copy, markup and CSS, with build tokens such as `{{img:A1}}`, `{{lockup:white}}` and `{{icon:trade}}`
- `src/main.js`: scroll loop (backdrop tone, nav, progress), pinned scenes, carousels, index and sound
- `src/logo3d.js`: the Three.js logo scene, the only 3D in the book
- `src/icons.js`: the 12-icon set (24 px grid, 1.75 px stroke) and the three spot illustrations
- `src/logo.js`: the mark geometry, measured from the master artwork
- `src/audio.js`: the single signature chime, off by default
- `assets/images/`: source images, named by prompt-pack shot ID; `assets/web/`: their WebP versions, embedded by the build
- `pack/`: logo files and the GPT Image prompt pack
- `docs/V2-PLAN.md`: the production plan behind v2

## Build

```sh
npm install
npm run images   # only after adding or changing files in assets/images (needs Python with Pillow)
npm run build    # writes dist/fintegre-brand-book.html and dist/test.html (local preview)
```

To replace the cover photo with the Higgsfield video later, swap the `<img>` in `.cover-media` for a muted, looping `<video>` with the photo as its poster.
