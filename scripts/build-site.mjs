import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,unlinkSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {profiles,profileFiles,finalizePage,writeOutput} from './page-output.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),checking=process.argv.includes('--check');
const {ui}=await import('./build-home.mjs');
const hash=content=>createHash('sha256').update(content).digest('hex');
for(const page of Object.keys(profiles))if(!['index.html','collaborate.html','workbench.html'].includes(page))writeOutput(page,finalizePage(page,readFileSync(resolve(root,page),'utf8'),ui,checking),checking);
const manifestPath='public/site/page-manifest.json';
const old=existsSync(resolve(root,manifestPath))?JSON.parse(readFileSync(resolve(root,manifestPath),'utf8')):null;
writeOutput(manifestPath,JSON.stringify({profiles:[...profileFiles].sort()},null,2)+'\n',checking);
if(!checking) {
  for(const path of old?.profiles||[])if(!profileFiles.has(path)&&/^public\/site\/page-[a-f0-9]{12}\.css$/.test(path)&&existsSync(resolve(root,path)))unlinkSync(resolve(root,path));
  const explicit=['.nojekyll','index.html','projects.html','workbench.html','collaborate.html','resume.html','404.html','robots.txt','sitemap.xml','site.webmanifest','ASSET_SOURCES.md','THIRD_PARTY.md','docs/ASTRYX.md',...readdirSync(root).filter(f=>/\.(css|js)$/.test(f))];
  const walk=dir=>readdirSync(resolve(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
  const publicFiles=walk('public').filter(p=>!p.startsWith('public/ui/')&&!/\.map$/.test(p));
  const files=[...new Set([...explicit,...walk('cases').filter(p=>p.endsWith('.html')),...walk('demos/ai-crm').filter(p=>/\.(html|css|js)$/.test(p)),...publicFiles,...ui.manifest.generated,'public/ui/manifest.json'])].sort();
  for(const f of files)if(/(^|\/)(\.git|node_modules|\.env|test-results|\.cache)(\/|$)|\.log$/.test(f))throw Error('Unsafe publish path '+f);
  const dist=resolve(root,'dist');mkdirSync(dist,{recursive:true});
  const previous=existsSync(resolve(dist,'asset-manifest.json'))?JSON.parse(readFileSync(resolve(dist,'asset-manifest.json'),'utf8')):null;
  for(const f of previous?.files||[])if(!files.includes(f.path)){const path=resolve(dist,f.path);if(path.startsWith(dist+'/')&&existsSync(path))unlinkSync(path);}
  const manifest={schema:1,base:'/',static:true,source_revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),ui:ui.manifest,files:[]};
  for(const f of files){const input=resolve(root,f),output=resolve(dist,f);mkdirSync(dirname(output),{recursive:true});copyFileSync(input,output);const bytes=readFileSync(output);manifest.files.push({path:f,bytes:bytes.length,sha256:hash(bytes)});}
  writeFileSync(resolve(dist,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('STATIC_BUILD',files.length,'public files → dist/; no runtime server');
}
