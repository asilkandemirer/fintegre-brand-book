# Fintegre Brand Book

Scroll-driven 3D brand book experience for Fintegre (Three.js, bundled into a single self-contained HTML file).

- `src/` – source (chapters, world, audio, text effects)
- `build.mjs` – esbuild bundler → `dist/fintegre-brand-book.html`
- `pack/` – logo files and the GPT Image prompt pack
- `assets/images/` – generated lifestyle, merch and background images (named by prompt-pack shot ID)

Build: `npm install && node build.mjs`
