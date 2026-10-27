import http from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
export const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
export {mkdir, writeFile, resolve};
export function source() {
  return {revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()};
}
export async function serve() {
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.pdf':'application/pdf','.mp4':'video/mp4','.vtt':'text/vtt'};
  const server=http.createServer(async(req,res)=>{
    try{
      const path=decodeURIComponent(new URL(req.url,'http://local').pathname),file=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
      if(!file.startsWith(root+sep))throw Error('path');
      const data=await readFile(file),headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
      if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)throw Error('range');const start=+m[1],end=m[2]?Math.min(+m[2],data.length-1):data.length-1;if(start>end||start>=data.length){res.writeHead(416);res.end();return}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1))}
      else{res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data)}
    }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'404.html')))}
  });
  await new Promise((done,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',done)});
  return {base:process.env.BASE_URL?.replace(/\/$/,'')||`http://127.0.0.1:${server.address().port}`,close:async()=>{server.closeAllConnections();await new Promise(r=>server.close(r))}};
}
export async function images(page){for(const image of await page.locator('img[src]').all()){if(!await image.isVisible())continue;await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode().catch(()=>{}))}}
export async function frames(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
export function assert(value,message){if(!value)throw Error(message)}
