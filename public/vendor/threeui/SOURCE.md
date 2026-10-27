# ThreeUI Community Gallery — native portfolio adaptation

Upstream: https://github.com/MengTo/threeui

Pinned source commit: `68802d5428071ada5c20db8094b1649e6bb770ed`

Adapted source: https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/src/shaders/gallery/Gallery.tsx

Upstream file blob: `8a0cc802b5bef7e43d123faed37a5191a70e4112`

License: MIT; copyright 2026 Meng To. The complete license accompanies this file.

## What was adapted

`/public/js/threeui-gallery.js` adapts the Community Gallery's Three.js scene,
open-cylinder screenshot surfaces, texture/material setup, responsive camera,
time-based animation, visibility-aware lifecycle and explicit resource disposal.
The React effect/ref wrapper has been replaced by a small native ESM API. The
website remains a static HTML/CSS/JavaScript site with one optional WebGL canvas.

The original 16-panel image spiral has become three selected-project cards with
restrained orbital linework. The screenshots are existing assets from this
portfolio. Their complete image bounds, including evidence qualifiers and source
notes, are contained in the texture without cropping. Frame labels identify the
RAG public demo, RelayAudit local fixture, and original programmatic video frame.
The renderer reuses the static fallback's 640px `*-preview.webp` derivatives
(84,682 bytes combined), so activating WebGL does not fetch a second set of large
source images. These previews retain the original screenshot bounds. Original
assets remain unchanged. GPU textures are three fixed 1024×680 canvases, including
their labels and frames. No ThreeUI demo images, restricted fonts, Pro code, or
private source are used.

The native adaptation adds lazy import, live motion preferences, a persistent
static DOM fallback, texture-load failures/timeouts, context-loss handling,
draw-buffer limits, pointer/scroll motion, and pause on hidden/offscreen states.
Old `outputEncoding`/texture `encoding` calls have been migrated to the current
Three.js color-space APIs. Runtime: Three.js r186, MIT, served locally.

The adaptation is a real ThreeUI-derived Three.js renderer. CSS-only fallback
composition is not presented as a running WebGL or ThreeUI integration.
