# Portfolio official reference audit

Verified 2026-10-23 (Asia/Shanghai). Official-source verification and actual runtime integration.

The official runtime and license notice are vendored under `public/`; integration is scoped to the homepage.

## Vendored assets

- `public/vendor/gsap-3.15.0/gsap.min.js`: 72,927 bytes; exact upstream Git blob SHA `3c73d761a9a7dbd166549451ba7afd62dc7121d0`; SHA-256 `92bb9a96476f983d212a2bc4f54c889039c1696dd4461d40a736860938570fbb`.
- `public/vendor/gsap-3.15.0/ScrollTrigger.min.js`: 44,575 bytes; exact upstream Git blob SHA `35d4ab7dc31dd859f44e5460ac6a5e8a0f0660c2`; SHA-256 `b0b14d67b55b0c43c756ac0b106cfcb09d0879945f6ead64451065b0672916a2`.
- Files fetched via GitHub connector from tag `3.15.0`, original copyright headers and bytes preserved. `git hash-object` matches official Git tree entries. Both pass `node --check`.
- `public/licenses/gsap-standard-license.txt` records source/commit plus the license terms I–VI, effective/modified dates, copyright and canonical URL. FAQ/site navigation omitted. Hyperlink labels rendered with destination URLs where relevant.
- Runtime integration: `home.js` loads both scripts only at ≥1000 CSS px when system/manual motion preferences allow. CSS sticky owns layout; ScrollTrigger calls selection for `[data-story-step]` and opacity transitions on `[data-story-panel]`. No pin or scroll replacement.


## Smallest dependency set

Keep native HTML/CSS/JS, CSS Grid/Flex/sticky, native scrolling, dialog, video and anchors. Add only GSAP core plus ScrollTrigger **3.15.0**, exact version pinned. Prefer self-hosting the two minified distributions with upstream notices preserved so core navigation and evidence do not depend on a runtime CDN. Skip Lenis, ScrollSmoother, Motion, React component kits, PhotoSwipe, carousel and WebGL: this three-step narrative has no demonstrated need for them.

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
