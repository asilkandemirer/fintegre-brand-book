# Fintegre Brand Book v2: Production Plan

Status: built. The finished book is `dist/fintegre-brand-book.html`; this plan records the decisions behind it.

Source brief: Fatih (manager) + Asilkan, Oct 2026. Goal: a brand book that is clear, persuasive and makes people dream — "a big brand can be run with this guide."

## 1. Direction

- From spectacle to a manageable brand guide. Less motion, more meaning.
- Bright, gallery-simple world. Indigo `#3047EC` and ice blue `#B7D7FF` are accents, never a black/purple "hacker" mood.
- 3D only in the Logo chapter. Everything else is flat surfaces, soft transitions, calm motion.
- 65° is the signature angle: line patterns, colour blocks, image crops, Instagram templates, icon terminals.
- Every device scene includes a premium device (no third-party logos). Official Apple product photography and partner badge come from Fintegre later; the layout reserves their place.

## 2. Colour journey (scroll-driven, continuous)

Photo (cover) → deep indigo (story + logo) → ice blue (bridge) → White Smoke (guide) → showcase carousels on white → photo (closing).

## 3. Chapter flow

| # | Chapter | Content | Assets |
|---|---|---|---|
| 0 | Cover | Full-bleed store handover photo with slow zoom, indigo scrim rising from the bottom, white slogan "Make every device / worth more." below the handover moment, minimal chapter nav, scroll cue. Crop: desktop 58% / 40%, mobile 64% / 40% | A2 now; `cover.mp4` (Higgsfield) replaces it later |
| 1 | What is Fintegre | One-sentence answer + 3 support points; photo darkens into indigo | A1 |
| 2 | Values | 4 values, each with definition + behaviour example | A4, A5, F1 |
| 3 | The Apple moment | Typographic moment + reserved slot for the official partner badge, before the visual world | — (badge from Fintegre) |
| 4 | Logo | 3D mark on indigo; 65° construction, clear space, min size, versions, misuse | `pack/` |
| 5 | Colour | Flat swatch cards, 60/30/10, approved pairs + contrast ratios, permitted gradients | — |
| 6 | Typography | Geologica + JetBrains Mono; heading/body pairing, weights, padding, centred use, skeleton → card build, 65° turn-and-fade | — |
| 7 | Graphic language | 65° lines, colour blocks, patterns and why | E1, E2 |
| 8 | Icons | 12 icons, sketch → construction → final; size and surface grid | generated SVG |
| 9 | Illustration | 3 spot illustrations from icon geometry: Bring the old · See the value · Take the new | generated SVG |
| 10 | Card patterns | 6 card types, skeleton → filled, wide carousel | mixed |
| 11 | Photography | Cast, light, places; rule set: close-up · plain text · product · graphic | A2, A3, B1–B4, F1, F2 |
| 12 | Tone of voice | Principles, do/don't, real sentences | — |
| 13 | Instagram | Rule set (logo position, angle, colour block, white type) + 9-post profile grid, wide carousel | A–F mixed |
| 14 | Merchandise | Fashion-shoot feel, wide carousel | D1–D8 |
| 15 | Devices | Phone, laptop, tablet in daily life + reserved Apple photography slots | C2, C4, F2 |
| 16 | Closing | Return to the cover photo, slogan | cover |

## 4. Values (draft, for review)

1. **Worth more** — Every device has a second value; we make it visible. *Behaviour:* show the valuation as a clear number, instantly.
2. **Within reach** — New technology is not a privilege. *Behaviour:* no flow longer than three steps.
3. **Clear by design** — No surprises in payment or operations. *Behaviour:* every fee and time is written upfront.
4. **Trusted partner** — The quiet infrastructure behind the store, the brand and the customer. *Behaviour:* the customer's happy moment takes the stage, not us.

## 5. Icons

Grid 24 × 24, 2 px padding (20 px live area), 1.75 px stroke, round caps and joins, 2 px corner radius, diagonals at 65°, one indigo accent element per icon.

Set: Trade-in · Valuation · Device check · Data wipe · Instant payment · Instalments · Store · Courier pickup · Upgrade · Partner · Secure · Support.

Animation (scroll-scrubbed, calm, one hero icon at a time):
1. **Sketch** — a slightly wobbly graphite pencil line draws itself (stroke-dashoffset), a few construction scribbles.
2. **Construction** — the 24 px grid, keylines (circle, square, 65° guides) fade in; the sketch line snaps to the grid (point interpolation: jitter → 0).
3. **Final** — clean stroke, indigo accent fills in; the full 12-icon grid lands at 16 / 24 / 48 px on White Smoke and on indigo.

## 6. Illustration

Icon stroke × 4 plus flat colour planes cut at 65°. No gradients except the approved indigo → ice. Three scenes from Fintegre's three-step device renewal: bring the old device, see its value, take the new one.

## 7. Card patterns

Photo card (65° corner crop) · Colour block card (indigo + white headline) · Pattern card (65° lines on ice) · Stat card (one big number) · Illustration card · Voice card (one sentence). Each builds from a grey skeleton into its final state.

## 8. Cut list

Montage, cubes and plaques; the unrelated phone UI (€412 screen); wind/whoosh filler sounds; long scroll padding. Text build effects only on headings, shorter and calmer. Sound: one short signature sound on the logo, off by default.

## 9. Technical

- Single self-contained HTML (`dist/fintegre-brand-book.html`): images as WebP (~1.5 MB for 23 images at 1600 px), fonts embedded, Three.js only for the Logo chapter.
- Mobile first, `prefers-reduced-motion` respected, no horizontal page scroll; carousels scroll horizontally on their own.
- QA: mobile and desktop screenshots of every chapter, contrast check of all text on colour, load time, smooth scroll.
