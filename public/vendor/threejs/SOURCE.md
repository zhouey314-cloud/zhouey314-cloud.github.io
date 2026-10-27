# Three.js runtime provenance

This is an optional, locally served WebGL2 runtime for the portfolio hero. It is
the official Three.js **r186** release, tree-shaken to the exports used by
`public/js/threeui-gallery.js` and minified with **esbuild 0.28.2**. No CDN request,
package install script, global installation, or newer Three.js release is needed
at runtime. The upstream MIT license is retained in `LICENSE`.

## Pinned inputs

- Release: <https://github.com/mrdoob/three.js/releases/tag/r186>
- `three.module.js`: <https://raw.githubusercontent.com/mrdoob/three.js/r186/build/three.module.js>
  - SHA-256: `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea`
- `three.core.js`: <https://raw.githubusercontent.com/mrdoob/three.js/r186/build/three.core.js>
  - SHA-256: `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6`
- License: <https://raw.githubusercontent.com/mrdoob/three.js/r186/LICENSE>
  - SHA-256: `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc`
- Build tool: <https://github.com/evanw/esbuild/releases/tag/v0.28.2>

## Reproduce the shipped module

Place the two verified upstream files in an empty build directory. Create
`entry.js` in that directory with the following contents:

```js
export { Scene, PerspectiveCamera, WebGLRenderer, Group, CylinderGeometry, BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, Mesh, LineBasicMaterial, LineLoop, PointsMaterial, Points, CanvasTexture, SRGBColorSpace, DoubleSide, AdditiveBlending, Vector3 } from './three.module.js';
```

Run the pinned esbuild binary (the binary path can be changed):

```sh
esbuild entry.js --bundle --format=esm --minify --legal-comments=inline --target=es2020 --outfile=three.shipped.js
```

Copy `three.shipped.js` to this directory as `three.module.js`. There are no
remaining runtime imports, so the unminified upstream files are not shipped.
esbuild's standard tree shaking is the only build transform
besides bundling and minification; no upstream source code was hand-edited.

## Shipped output

- `three.module.js`: **536,219 bytes**, approximately **133,616 bytes gzip**.
- SHA-256: `d4a3a942d9ccc385a4c9fe1ebdbaeeb91de11b9728bd0652664781190a617b87`
- The small bootstrap avoids importing this module when system reduced motion,
  the site's manual motion switch, or data-saving mode disables the hero.

Sizes are measurements of this build, not a hosting compression guarantee.
