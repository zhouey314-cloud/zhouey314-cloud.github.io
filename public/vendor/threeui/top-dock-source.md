# ThreeUI AnimatedTopDock source and adaptation

`/dock.js` contains a native JavaScript adaptation of the proximity field and spring integration in ThreeUI's AnimatedTopDock controller.

- Upstream project: https://github.com/MengTo/threeui
- Pinned commit: `68802d5428071ada5c20db8094b1649e6bb770ed`
- Original source: https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/src/shaders/animated-top-dock/topDockController.ts
- Original component: https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/src/shaders/animated-top-dock/AnimatedTopDock.tsx
- Original license: https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/LICENSE
- License: MIT, copyright 2026 Meng To.

## What was adapted

The upstream smoothstep proximity field and spring/damping behaviour are retained. The site's version limits the effect to a two-pixel lift of text inside each existing navigation link. It removes width/height magnification, demo branding, selection-only buttons, click interception, keyboard interception, and the continuously running animation loop. No React or Three.js runtime is required for this adaptation.

The existing anchors keep their original destinations, accessible names, focus order, hit areas, native activation and focus outlines. No navigation handlers are replaced. Labels immediately return to their reading positions when the navigation receives keyboard focus. The effect runs only on a sufficiently wide screen with a precise hovering pointer. It respects both the site's `data-motion="off"` preference and the system's reduced-motion setting. Pointer exit settles to rest. Resizing, hiding the document or disabling motion cancels frames and resets visual state. Page teardown removes listeners, observers and label wrappers; back/forward-cache restoration reinitializes them.

## Integration

Load `/dock.js` with `defer` after the site's existing scripts. It selects `.portfolio-home .site-nav > a[href]`; no additional HTML hooks are required. It adds a nonsemantic `span[data-dock-label]` to animate only the visual label. Optional styling can use `data-dock-near="true"` or the numeric `--dock-proximity` custom property. Do not transform the anchor itself, hide its focus outline, or animate its width or height.

## MIT License

Copyright (c) 2026 Meng To

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
