"""Derive the Community scene from the pinned, reviewed complete Hero.

Run only when updating the vendored scene:
  python3 scripts/prepare-sylva.py /path/to/threeui/public/landing-pages/inner-green-3d.html
Normal site builds use the checked-in result and require no upstream checkout.
"""
from pathlib import Path
import sys
import hashlib

root = Path(__file__).resolve().parent.parent
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha1(b'blob '+str(len(original)).encode()+b'\0'+original).hexdigest() == '4128d48f50324d6ca7530c181b9c2adaad00c214', 'Use the pinned, reviewed Community source'
source = original.decode('utf-8')
start = source.index('/* ====================================================================== *\n * The moss root')
scene = source[start:source.rindex('</script>')]

def replace(before, after):
    global scene
    assert scene.count(before) == 1, before[:90]
    scene = scene.replace(before, after)

replace("  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;", """  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bridge = window.__sylvaBridge;
  var hostVisible = true, frameRequest = 0, journey = 0;
  var qualitySmall = false, geometryBytes = 0;
  function snapshot() {
    return { frames: frames || 0, time: uTime ? uTime.value : 0, small: qualitySmall,
      butterfly: !!bf, scanning: scanning, running: !REDUCED && hostVisible && !document.hidden && !bridge.failed,
      dpr: renderer ? renderer.getPixelRatio() : 0,
      geometryBytes: geometryBytes, geometries: renderer ? renderer.info.memory.geometries : 0, textures: renderer ? renderer.info.memory.textures : 0,
      calls: renderer ? renderer.info.render.calls : 0,
      triangles: renderer ? renderer.info.render.triangles : 0,
      lost: renderer ? renderer.getContext().isContextLost() : false,
      pointer: {x: pointer.x, y: pointer.y}, journey: journey };
  }
  window.addEventListener('message', function (event) {
    var d = event.data;
    if (event.source !== parent || !d || d.channel !== 'ethan-sylva' || d.token !== bridge.token) return;
    if (d.type === 'control') {
      hostVisible = d.visible === true;
      REDUCED = d.motion !== true;
      if (!hostVisible || REDUCED) {
        cancelAnimationFrame(frameRequest); frameRequest = 0;
        if (clock) clock.stop();
        if (REDUCED && renderer) {
          scanning = false; uScanOn.value = 0; uWire.value = 0;
          smooth.x = smooth.y = 0; ndc.x = 10;
          renderFrame(); if (!window.__ready) renderFrame();
        }
      } else { if (clock && !clock.running) clock.start(); startTick(); }
      bridge.post('state', snapshot());
    } else if (d.type === 'pointer' && !REDUCED) {
      var x = Math.max(0, Math.min(1, Number(d.x))), y = Math.max(0, Math.min(1, Number(d.y)));
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      pointer.x = x * 2 - 1; pointer.y = y * 2 - 1;
      ndc.x = pointer.x; ndc.y = -pointer.y;
      if (d.leave) { pointer.x = pointer.y = 0; ndc.x = 10; }
    } else if (d.type === 'journey') {
      var value = Number(d.value); if (Number.isFinite(value)) journey = Math.max(0, Math.min(1, value));
    } else if (d.type === 'pulse' && renderer && !REDUCED) {
      scanT = 0; uScanOn.value = 1; scanning = true;
    } else if (d.type === 'inspect') bridge.post('state', snapshot());
  });
  document.addEventListener('visibilitychange', function () {
    cancelAnimationFrame(frameRequest); frameRequest = 0;
    if (!document.hidden) { if (clock) clock.start(); startTick(); }
  });
""")
replace("""  function startTick() {
    if (ticking) return;
    ticking = true;
    (function loop() { requestAnimationFrame(loop); tick(); })();
  }""", """  function startTick() {
    if (frameRequest || !hostVisible || document.hidden || bridge.failed || REDUCED) return;
    frameRequest = requestAnimationFrame(function () {
      frameRequest = 0;
      if (!hostVisible || document.hidden || bridge.failed || REDUCED) return;
      tick(); startTick();
    });
  }""")
replace("    var small = narrow || (window.innerWidth * window.innerHeight) < 620000;", "    var small = narrow || (window.innerWidth * window.innerHeight) < 620000;\n    qualitySmall = small;")
replace("    renderer.setClearColor(0x000000, 0);", """    var gl = renderer.getContext();
    // Observe this renderer's compilation failures, without suppressing native errors.
    var compile = gl.compileShader.bind(gl), link = gl.linkProgram.bind(gl);
    gl.compileShader = function (shader) {
      compile(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) bridge.fail('shader-compile', gl.getShaderInfoLog(shader));
    };
    gl.linkProgram = function (program) {
      link(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) bridge.fail('shader-link', gl.getProgramInfoLog(program));
    };
    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault(); cancelAnimationFrame(frameRequest); frameRequest = 0;
      bridge.fail('context-lost', 'WebGL context lost');
    });
    canvas.addEventListener('webglcontextrestored', function () { bridge.post('restore-available', {}); });
    renderer.setClearColor(0x000000, 0);""")
replace("    camera.position.y =  smooth.y * 16;", "    camera.position.y = smooth.y * 16 + journey * 48;")
replace("    if (++frames === 2) window.__ready = true;", """    ++frames;
    if (bridge.failed || renderer.getContext().isContextLost()) return;
    if (frames === 2 && renderer.info.render.calls > 0) {
      var contextError = renderer.getContext().getError();
      if (contextError !== renderer.getContext().NO_ERROR) { bridge.fail('draw-error', String(contextError)); return; }
      window.__ready = true;
      bridge.post('ready', snapshot());
    }
    if (frames === 2 || frames % 120 === 0) bridge.post('frame', snapshot());""")
replace("    renderFrame();\n    startTick();", "    renderFrame();\n    if (REDUCED) renderFrame();\n    startTick();")
replace("    catch (err) { console.error(err); }", "    catch (err) { console.error(err); bridge.fail('renderer-init', String(err)); }")

replace("    buildAmbient();\n    layout();", """    buildAmbient();
    var arrays = new Set();
    scene.traverse(function (object) {
      var geometry = object.geometry;
      if (!geometry) return;
      Object.keys(geometry.attributes).forEach(function (name) {
        var a = geometry.attributes[name]; var array = a.array || (a.data && a.data.array);
        if (array) arrays.add(array);
      });
      if (geometry.index && geometry.index.array) arrays.add(geometry.index.array);
    });
    arrays.forEach(function (array) { geometryBytes += array.byteLength; });
    layout();""")

out = root / 'public/scenes/sylva'
out.mkdir(parents=True, exist_ok=True)
(out/'scene.js').write_text("/* ThreeUI Community © 2026 Meng To — MIT.\n * Sylva Living Green, upstream 68802d5428071ada5c20db8094b1649e6bb770ed.\n * Geometry, materials, lighting and original density retained.\n * Ethan adaptation: isolated document, lifecycle, diagnostic handshake and scroll camera offset.\n * See /public/vendor/threeui/LICENSE and /THIRD_PARTY.md. */\n"+scene)
(out/'index.html').write_text('''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ethan 的数字花园 · Sylva 场景</title>
<style>
:root{--u:calc(100vw / 1600)}*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#4a4d44}
.hero{position:relative;width:100%;height:100%;isolation:isolate;background:radial-gradient(64% 52% at 27% 84%,rgba(232,238,222,.085),transparent 72%),radial-gradient(70% 60% at 92% 8%,rgba(24,28,20,.10),transparent 68%),#4a4d44}
.hero:after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(72% 44% at 50% 117%,rgba(238,243,231,.50),rgba(238,243,231,.21) 42%,rgba(238,243,231,.04) 72%,transparent 88%),linear-gradient(180deg,transparent 54%,rgba(238,243,231,.03) 78%,rgba(238,243,231,.085) 100%)}
#scene{position:absolute;inset:0;z-index:3;width:100%;height:100%}.stage{position:absolute;left:50%;top:50%;margin-left:calc(-800 * var(--u));margin-top:calc(-440 * var(--u));width:calc(1600 * var(--u));height:calc(880 * var(--u))}
@media(min-width:1900px){:root{--u:calc(1900px / 1600)}}
@media(max-width:900px){:root{--u:calc(100vw / 760)}.stage{position:relative;left:auto;top:auto;margin:0;width:100%;height:calc(1625 * var(--u))}.hero:after{background:radial-gradient(90% 30% at 50% 74%,rgba(238,243,231,.40),rgba(238,243,231,.14) 46%,transparent 82%),linear-gradient(180deg,transparent 62%,rgba(238,243,231,.05))}}
</style>
<script>
(() => {
 const token=location.hash.slice(1), channel='ethan-sylva';
 const bridge=window.__sylvaBridge={token,failed:false,post(type,payload){parent.postMessage({channel,token,type,payload},'*')},fail(code,message){if(this.failed)return;this.failed=true;this.post('error',{code,message:String(message).slice(0,1000)})}};
 addEventListener('error',event=>bridge.fail(event.target?.src?'resource-load':'uncaught',event.message||event.target?.src||'Scene error'),true);
 addEventListener('unhandledrejection',event=>bridge.fail('promise',event.reason));
 bridge.post('boot',{});
})();
</script></head><body><main class="hero" id="hero"><canvas id="scene" role="img" aria-label="苔藓根拱、蕨类、花朵与漂浮花粉"></canvas><div class="stage" id="stage" aria-hidden="true"></div></main>
<script src="/public/vendor/threejs/r149/three.min.js"></script><script src="/public/scenes/sylva/scene.js"></script></body></html>
''')
print('Prepared pinned Sylva scene with original density, shaders and lighting.')
