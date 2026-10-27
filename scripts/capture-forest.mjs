// Regenerate only from successful WebGL frames; no remote preview or image generation.
import {webkit} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {serve,root,resolve,assert} from '../tests/support.mjs';
const server=await serve(),out=resolve(root,'test-results/forest-source');await mkdir(out,{recursive:true});const browser=await webkit.launch();const captures=[];
try{
 for(const [name,viewport] of [['desktop',{width:1600,height:880}],['mobile',{width:390,height:935}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',deviceScaleFactor:1});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(server.base+'/public/scenes/sylva/index.html#capture',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__ready===true,null,{timeout:60000});
  const gl=await page.evaluate(()=>{const c=document.querySelector('#scene'),g=c.getContext('webgl2')||c.getContext('webgl'),e=g.getExtension('WEBGL_debug_renderer_info');return {ready:window.__ready,lost:g.isContextLost(),revision:THREE.REVISION,renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)}});assert(gl.ready&&!gl.lost&&gl.revision==='149'&&!errors.length,'Actual successful forest render required');
  await page.screenshot({path:resolve(out,name+'.png')});
  execFileSync('python3',['-c','from PIL import Image; import sys; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=86,method=6)',resolve(out,name+'.png'),resolve(root,'public/scenes/sylva/forest-'+name+'.webp')]);
  const bytes=await readFile(resolve(root,'public/scenes/sylva/forest-'+name+'.webp'));captures.push({name,viewport,browser:browser.version(),gl,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});await context.close();
 }
 await writeFile(resolve(root,'public/scenes/sylva/capture.json'),JSON.stringify({at:new Date().toISOString(),upstream:'MengTo/threeui@68802d5428071ada5c20db8094b1649e6bb770ed',source:'public/landing-pages/inner-green-3d.html',method:'Actual isolated scene rendered with reduced motion, DPR1, then lossily compressed to WebP quality86. No UI, remote preview or generated imagery.',captures},null,2)+'\n');console.log(captures);
}finally{await browser.close();await server.close()}
