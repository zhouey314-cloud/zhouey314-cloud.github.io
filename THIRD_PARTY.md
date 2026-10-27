# Portfolio official reference audit

Verified 2026-10-23; ThreeUI edition added 2026-10-27 (Asia/Shanghai). Official-source verification and actual runtime integration.

The official runtime and license notice are vendored under `public/`; integration is scoped to the homepage.

## Vendored assets

- `public/vendor/gsap-3.15.0/gsap.min.js`: 72,927 bytes; exact upstream Git blob SHA `3c73d761a9a7dbd166549451ba7afd62dc7121d0`; SHA-256 `92bb9a96476f983d212a2bc4f54c889039c1696dd4461d40a736860938570fbb`.
- `public/vendor/gsap-3.15.0/ScrollTrigger.min.js`: 44,575 bytes; exact upstream Git blob SHA `35d4ab7dc31dd859f44e5460ac6a5e8a0f0660c2`; SHA-256 `b0b14d67b55b0c43c756ac0b106cfcb09d0879945f6ead64451065b0672916a2`.
- Files fetched via GitHub connector from tag `3.15.0`, original copyright headers and bytes preserved. `git hash-object` matches official Git tree entries. Both pass `node --check`.
- `public/licenses/gsap-standard-license.txt` records source/commit plus the license terms I–VI, effective/modified dates, copyright and canonical URL. FAQ/site navigation omitted. Hyperlink labels rendered with destination URLs where relevant.
- Runtime integration: `home.js` loads both scripts only at ≥1000 CSS px when system/manual motion preferences allow. CSS sticky owns layout; ScrollTrigger calls selection for `[data-story-step]` and opacity transitions on `[data-story-panel]`. No pin or scroll replacement.


## Smallest dependency set

Keep native HTML/CSS/JS, CSS Grid/Flex/sticky, native scrolling, dialog, video and anchors. GSAP core plus ScrollTrigger **3.15.0** continue to enhance the three-step narrative. The owner's October 27 request adds a real ThreeUI-derived **Three.js r186** scene to the hero and a small ThreeUI-derived navigation response. Each is optional and self-hosted. No React migration, smooth-scroll replacement, runtime CDN, paid ThreeUI component or extra carousel library is needed.

## ThreeUI edition: sources and integration

- **ThreeUI Community Gallery**: `public/js/threeui-gallery.js` adapts the open-cylinder screenshot geometry and scene lifecycle from [Gallery.tsx at 68802d5](https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/src/shaders/gallery/Gallery.tsx). The native bootstrap is `hero-scene.js`. Full MIT license and adaptation record: `public/vendor/threeui/LICENSE` and `SOURCE.md`.
- **ThreeUI AnimatedTopDock**: `dock.js` adapts the proximity/spring controller to the existing semantic navigation. Only an inner text label moves by at most two pixels; the link hit area and keyboard focus stay fixed. Full source/notice: `public/vendor/threeui/top-dock-source.md`.
- **Three.js r186**: a locally served, tree-shaken ESM build containing the required exports. Pinned upstream hashes, esbuild version and reproduction command are in `public/vendor/threejs/SOURCE.md`; upstream MIT license is retained alongside it. The shipped engine is 536,219 bytes (133,616 bytes with local gzip); hosting transfer size depends on server compression.
- The three scene images are the portfolio's existing RAG screenshot, synthetic RelayAudit report and original programmatic video poster. No third-party demo media, external fonts or Pro/Beta assets were copied.
- A single decorative canvas sits beside normal HTML identity, text and links. A complete static screenshot composition remains visible until the first successful render and whenever motion is disabled or rendering fails. Canvas content is not the only way to access a project.
- The renderer stops when the hero is offscreen, the tab is hidden, system reduced motion is enabled or the existing manual switch is off. Initial reduced motion/manual-off/data-saving mode avoids downloading the engine. Desktop draw-buffer cap is 1.5 million pixels; narrow-screen cap is 900,000. These are configured budgets, not physical-device speed guarantees.
- New lifecycle regression suite: `npm run test:threeui`. It observes real WebGL draw calls, dynamic motion preferences, native mobile scrolling, failed modules/context creation, and keyboard-safe dock behavior. The browser report states whether software WebGL or injected visibility events were used.

## Runtime version and license

- Upstream current master and tag `3.15.0` both resolve to `13e2b790546426a1a2e0e9b409f3f8dc6d6611f2` (commit dated 2026-04-13). Official package.json reports 3.15.0; current README recommends the 3.15 CDN branch. This is a stable numbered tag, not an RC.
- Sources: https://github.com/greensock/GSAP/blob/3.15.0/package.json ; https://github.com/greensock/GSAP/commit/13e2b790546426a1a2e0e9b409f3f8dc6d6611f2 ; https://api.github.com/repos/greensock/GSAP/git/matching-refs/tags/3.15
- Runtime license: **Standard “No Charge” GSAP License**, not MIT. Official terms permit implementation on websites/digital interfaces, including commercial projects. Preserve proprietary notices. Visual animation builders competing with Webflow have separate restrictions; this portfolio is not such a product.
- License source: https://gsap.com/community/standard-license/ (effective 2025-04-30, last modified 2025-05-30 as displayed when checked).
- Runtime repository has no top-level LICENSE file; its README and package.json point to the official standard-license URL. Do not label copied runtime as MIT.
- GitHub releases/latest returned 404 (repository uses tags). npm registry verification was unavailable through this environment's direct network. Version evidence above comes from the official repository current source and stable tag.

## Required AI references actually read

1. Anthropic frontend-design, current main `dbd4588f9e1033efb41dad4bef2f7947c8993d44`:
   https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design/SKILL.md
   Apply deliberate hierarchy based on Ethan's real identity/work; retain the expressly requested cream/charcoal/acid-green palette. Let actual project evidence carry the visual emphasis. Keep decoration restrained, copy specific, typography readable, and inspect screenshots. The brief takes precedence over generic aesthetic preferences.

2. Official GSAP skills, current main `aed9cfd3277740755f6bfc1155c7aa645403b760`:
   - https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-core/SKILL.md
   - https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-timeline/SKILL.md
   - https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-scrolltrigger/SKILL.md
   - https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-performance/SKILL.md
   Skill repository license is MIT, Copyright 2026 GreenSock: https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/LICENSE . This does not change the runtime license.

3. Vercel review skill, current main `063bee94c3f4df8453406c830b0a7df0f2860278`:
   https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines/SKILL.md
   Actual current guidelines read at main `434b7f91364665f2f733b310ec54809bf8f37937`:
   https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md

## Implementation details worth retaining

- Register ScrollTrigger once after loading core/plugin. Use `gsap.matchMedia()` with desktop and `prefers-reduced-motion` queries. It tracks animations/triggers created during setup and reverts them when conditions change. Custom listeners, observer callbacks, classes and attributes still need explicit cleanup.
- Use `mm.revert()` before manual motion-toggle reinitialization; make setup idempotent and reset narrative visual state. `gsap.matchMediaRefresh()` is available for changing non-media preferences. Do not create a new nested gsap.context inside matchMedia.
- Official lifecycle docs: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ . Delayed/event-handler GSAP calls need context-bound registration or explicit ownership/cleanup.
- Use CSS sticky for the screenshot column; ScrollTrigger only selects/highlights the reading step. No pin spacer or artificial scroll height required. Mobile/reduced/no-JS use all three static figures in natural flow.
- Put ScrollTrigger on a top-level tween/timeline only, not a child tween already inside a timeline. Use scrub OR toggleActions, not both. If a timeline is useful, use labels/position parameter instead of delay chains. No timeline is required merely to switch active steps.
- Animate only screenshot-container transforms/opacity and the nonessential entrance. Do not animate body text or clickable targets under pointer movement. Avoid hiding essential HTML with default opacity:0. Ensure setup exceptions leave static content visible.
- On layout-changing image load call debounced ScrollTrigger.refresh(); ordinary viewport resize is already handled. Do not refresh every scroll frame. Create triggers top-to-bottom. Avoid unnecessary recurring RAF loops, broad will-change, and duplicate scroll controllers.
- Use transform scaleX for progress instead of repeated width layout updates; preserve one existing owner for progress/navigation.

## Accessibility and acceptance emphasis

- Real buttons for actions and anchors for destinations; no nested click targets; visible focus and hover; decorative icons aria-hidden; explicit image dimensions and useful alt.
- A semantic native dialog must have an accessible title, clear close button, Escape close, restored trigger focus, contained scrolling and independent full-image link. Async clipboard success/failure should be announced politely; retain selectable email/mailto fallback.
- Keep skip link, hierarchical headings, scroll-margin-top for sticky nav, browser zoom, native hash/history and keyboard scrolling intact. Sticky content must not cover focus targets.
- Above-fold critical images should not be lazy; below-fold images lazy; native video controls/playsinline/preload=none or metadata with approved poster. Meaningful video needs existing caption/transcript or description.
- Respect system reduced motion and manual switch across old and new effects; interrupted motion should be recoverable. No autoplay loops without an accessible stop mechanism.
- Test 390x844, 768x1024, 1440x900 plus 320px and 200% zoom; fast scroll, deep hash/back, dialog Escape/focus, no JS, no GSAP fetch, reduced motion, toggle/reinitialize, resize back/forth, touch and keyboard.
- Report lab metrics as lab observations; no real-user INP/CrUX claim from a local browser check. Preserve project factual limits and do not imply backend model/production capabilities from frontend motion.
