import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Garden,Action} from './shared.jsx';
let render,opener;
function Viewer() {
  const [item,setItem]=useState(null);render=setItem;
  function close(open){if(open)return;setItem(null);requestAnimationFrame(()=>opener?.focus({preventScroll:true}));}
  return <Garden><Dialog isOpen={Boolean(item)} onOpenChange={close} width="min(1120px, 96vw)" maxHeight="92svh" padding={0} purpose="info" className="image-viewer garden-image-viewer" data-viewer aria-labelledby="viewer-title" aria-describedby="viewer-caption">
    <div className="viewer-toolbar"><p className="garden-kicker">PROJECT / 原始证据</p><Action label="关闭预览" data-viewer-close onClick={()=>close(false)}/></div><h2 id="viewer-title">{item?.title}</h2>
    <img data-viewer-image src={item?.image} alt={item?item.title+' — '+item.caption:''}/><p id="viewer-caption" data-viewer-caption>{item?.caption}</p>
    <div className="viewer-actions"><Action label="打开原图 ↗" href={item?.image} target="_blank" rel="noopener noreferrer" data-viewer-original/><Action label="阅读案例与来源 ↗" href={item?.case} data-viewer-case variant="primary"/></div>
  </Dialog></Garden>;
}
export function openPreview(button){
  if(!render){const host=document.querySelector('[data-ui-lightbox]');flushSync(()=>createRoot(host).render(<Viewer/>));}
  opener=button;flushSync(()=>render({image:button.dataset.preview,title:button.dataset.title||'项目证据',caption:button.dataset.caption||'',case:button.dataset.case||'/projects.html'}));
  requestAnimationFrame(()=>document.querySelector('[data-viewer-close]')?.focus({preventScroll:true}));
}
