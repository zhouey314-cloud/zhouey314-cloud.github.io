import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
export async function buildUI({checking=false}={}) {
  execFileSync(process.execPath,['node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs','theme','build','src/ui/garden-theme.mjs','--out','src/ui/generated/garden.css',...(checking?['--check']:[])],{cwd:root,stdio:'pipe'});
  const cache=resolve(root,'.cache');mkdirSync(cache,{recursive:true});
  // The official reset is restricted to component-theme roots; prose and the
  // forest iframe keep their existing cascade, fonts and native semantics.
  const reset=readFileSync(require.resolve('@astryxdesign/core/reset.css'),'utf8');
  // Theme also mirrors its attribute onto <html> for portal tokens. Requiring
  // our island wrapper prevents that attribute from resetting the entire page.
  writeFileSync(resolve(cache,'reset-scoped.css'),'@scope (.garden-ui [data-astryx-theme]) {\n'+reset+'\n}');
  writeFileSync(resolve(cache,'astryx.entry.css'),'@layer reset, astryx-base, astryx-theme;\n@import "./reset-scoped.css";\n@import "@astryxdesign/core/astryx.css";\n@import "../src/ui/generated/garden.css";\n@import "../src/ui/ui.css";\n');
  const out=resolve(root,'public/ui');mkdirSync(out,{recursive:true});
  const result=await build({absWorkingDir:root,entryPoints:{bootstrap:'src/ui/bootstrap.js',astryx:'.cache/astryx.entry.css'},outdir:out,bundle:true,splitting:true,format:'esm',target:'es2022',minify:true,write:false,metafile:true,entryNames:'[name]-[hash]',chunkNames:'chunks/[name]-[hash]',external:['/public/*'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked',logLevel:'warning'});
  writeFileSync(resolve(cache,'ui-metafile.json'),JSON.stringify(result.metafile));
  const generated=result.outputFiles.map(f=>relative(root,f.path).replaceAll('\\','/'));
  const previous=existsSync(resolve(out,'manifest.json'))?JSON.parse(readFileSync(resolve(out,'manifest.json'),'utf8')):null;
  for(const f of result.outputFiles){if(checking){if(!existsSync(f.path)||!readFileSync(f.path).equals(f.contents))throw Error(relative(root,f.path)+' is stale. Run npm run build');}else{mkdirSync(dirname(f.path),{recursive:true});writeFileSync(f.path,f.contents);}}
  const entries=Object.entries(result.metafile.outputs),bootstrap='/'+entries.find(([,m])=>m.entryPoint==='src/ui/bootstrap.js')[0],css='/'+entries.find(([p,m])=>m.entryPoint==='.cache/astryx.entry.css'&&p.endsWith('.css'))[0];
  const manifest={core:'0.7.11',theme:'0.7.11',cli:'0.7.11',react:'19.3.1',stylex:'0.19.1',bootstrap,css,generated};
  const text=JSON.stringify(manifest,null,2)+'\n';
  if(checking){if(readFileSync(resolve(out,'manifest.json'),'utf8')!==text)throw Error('UI manifest is stale');}
  else{writeFileSync(resolve(out,'manifest.json'),text);for(const path of previous?.generated||[]){const file=resolve(root,path);if(file.startsWith(out+'/')&&!generated.includes(path)&&existsSync(file))unlinkSync(file);}}
  const ssr=await build({absWorkingDir:root,entryPoints:['src/ui/render.jsx'],bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',external:['/public/*'],write:false,logLevel:'warning'});
  const code=ssr.outputFiles[0].text,hash=createHash('sha256').update(code).digest('hex').slice(0,12),renderPath=resolve(cache,'ui-render-'+hash+'.mjs');writeFileSync(renderPath,code);
  const render=await import(pathToFileURL(renderPath));
  const script=`<script type="module" src="${bootstrap}" data-astryx-css="${css}"></script>`;
  return {...render,manifest,assets:`<!-- astryx:assets -->\n<link rel="stylesheet" href="${css}" />\n${script}\n<!-- /astryx:assets -->`,lazyAssets:`<!-- astryx:assets -->\n${script}\n<!-- /astryx:assets -->`};
}
