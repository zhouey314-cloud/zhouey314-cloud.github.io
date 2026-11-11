import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve,source,mkdir,writeFile,resolve,assert} from './support.mjs';

const site=await serve(),out=resolve(process.env.MOBILE_CONTACT_REPORT_DIR||'test-results/mobile-contact');
await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),base:site.base,source:source(),scope:'Chromium/WebKit touch viewport emulation, not physical iOS/Android or WeChat. Actual PNG popup and file download. No messages, emails or friend requests sent.',cases:[],failures:[]};
const expected=await readFile(resolve('public/contact/wechat-qr.png'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
try {
  for (const [engineName,engine] of Object.entries({chromium,webkit})) {
    const browser=await engine.launch();
    try {
      for (const width of [320,390]) for (const js of [false,true]) for (const path of ['/#contact','/collaborate.html#brief']) {
        const entry={engine:engineName,browser:browser.version(),width,js,path};
        const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,javaScriptEnabled:js,reducedMotion:'reduce',acceptDownloads:true});
        const errors=[],httpErrors=[];
        context.on('page',page=>{
          page.on('pageerror',e=>errors.push(e.message));
          page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
          page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
        });
        try {
          const page=await context.newPage();
          await page.goto(site.base+path,{waitUntil:'load'});
          const figure=page.locator(path.startsWith('/#')?'.garden-qr':'.collaborate-qr');
          await figure.scrollIntoViewIfNeeded();
          assert(await figure.locator('svg').isVisible(),'inline QR visible');
          const box=await figure.locator('svg').boundingBox();
          assert(box.width>=147&&Math.abs(box.width-box.height)<1,'scan area is a readable square');
          assert((await figure.innerText()).includes('扫一扫 → 相册'),'same-phone instructions visible');
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
          const opener=figure.locator(':scope > a');
          assert(await opener.getAttribute('data-wechat-profile')==='https://u.wechat.com/MJNJhDRZFiAFKD09uKIRGvM?s=3','canonical account retained');
          const [popup]=await Promise.all([page.waitForEvent('popup'),opener.tap()]);
          await popup.waitForLoadState('load');
          const image=popup.locator('img');
          await image.waitFor();
          await popup.waitForFunction(()=>document.querySelector('img')?.complete&&document.querySelector('img').naturalWidth===784);
          assert(new URL(popup.url()).pathname==='/public/contact/wechat-qr.png','tap opens the static PNG, not a generic WeChat redirect');
          const response=await context.request.get(popup.url());
          assert(response.status()===200&&response.headers()['content-type'].includes('image/png'),'raster image served as PNG');
          assert(sha(await response.body())===sha(expected),'served image matches the verified matrix');
          await popup.close();
          const [download]=await Promise.all([page.waitForEvent('download'),figure.locator('a[download]').tap()]);
          assert(download.suggestedFilename()==='enyu-wechat-qr.png','saveable filename');
          const saved=resolve(out,`${engineName}-${width}-${js}-${path.startsWith('/#')?'home':'cooperation'}.png`);
          await download.saveAs(saved);
          assert(sha(await readFile(saved))===sha(expected),'actual browser download preserves the approved code');
          await figure.locator('.qr-original').focus();
          const [keyboardPopup]=await Promise.all([page.waitForEvent('popup'),page.keyboard.press('Enter')]);
          await keyboardPopup.waitForLoadState('load');
          assert(new URL(keyboardPopup.url()).pathname==='/public/contact/wechat-qr.png','keyboard opens the same PNG');
          await keyboardPopup.close();
          await page.screenshot({path:resolve(out,`${engineName}-${width}-${js}-${path.startsWith('/#')?'home':'cooperation'}-viewport.png`)});
          assert(!errors.length&&!httpErrors.length,'no browser runtime, console or HTTP errors');
          entry.status='PASS';entry.imageSha256=sha(expected);entry.pngBytes=expected.length;
        } catch(e) {entry.status='FAIL';entry.error=e.stack;report.failures.push(entry);}
        finally {entry.errors=errors;entry.httpErrors=httpErrors;await context.close();report.cases.push(entry);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(entry.status,engineName,width,js,path,entry.error||'');}
      }
    } finally {await browser.close();}
  }
} finally {await site.close();}
if(report.failures.length) process.exitCode=1;
