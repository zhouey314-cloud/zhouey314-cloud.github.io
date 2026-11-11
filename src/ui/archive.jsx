import React,{useEffect,useMemo,useState} from 'react';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Garden,Action,useReady} from './shared.jsx';
import Fuse from '../../public/vendor/fuse/fuse.js';

export default function Archive({filters,count=16}) {
  const ready=useReady();const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[total,setTotal]=useState(count),[engine,setEngine]=useState(null),[initialized,setInitialized]=useState(false);
  const records=useMemo(()=> typeof document==='undefined'?[]:[...document.querySelectorAll('[data-category]')].map((row,index)=>({row,index,name:row.dataset.projectName,text:row.innerText})),[]);
  useEffect(()=>{
    const p=new URLSearchParams(location.search);setQuery((p.get('q')||'').slice(0,100));setCategory(filters.some(f=>f.value===p.get('category'))?p.get('category'):'all');setInitialized(true);
    // The fixed public search engine ships with this island. Do not start a
    // second module graph after links and search have become interactive.
    setEngine(new Fuse(records,{keys:[{name:'name',weight:.6},{name:'text',weight:.4}],threshold:.3,ignoreLocation:true}));
  },[]);
  useEffect(()=>{
    if(!initialized)return;
    const q=query.trim();const ids=new Set(q?(engine?engine.search(q).map(r=>r.item.index):records.filter(r=>r.text.toLowerCase().includes(q.toLowerCase())).map(r=>r.index)):records.map(r=>r.index));let n=0;
    records.forEach(r=>{r.row.hidden=!ids.has(r.index)||(category!=='all'&&r.row.dataset.category!==category);if(!r.row.hidden)n++;});setTotal(n);
    document.querySelector('[data-archive-empty]').hidden=n>0;
    const url=new URL(location.href);q?url.searchParams.set('q',q):url.searchParams.delete('q');category!=='all'?url.searchParams.set('category',category):url.searchParams.delete('category');history.replaceState(null,'',url);
  },[query,category,engine,initialized]);
  return <Garden><form className="archive-search" role="search" onSubmit={e=>e.preventDefault()} onReset={()=>{setQuery('');setCategory('all')}}>
    <TextInput id="project-search" type="search" label="搜索项目与实现" value={query} onChange={v=>setQuery(v.slice(0,100))} hasClear placeholder="例如：知识检索、RelayAudit、视频" isDisabled={!ready} disabledMessage="交互正在准备，所有项目已完整显示。" maxLength={100} width="100%"/>
    <Action label="重置筛选" type="reset" variant="ghost" isDisabled={!ready}/>
  </form><div className="archive-filters" role="group" aria-label="按项目方向筛选">{filters.map(f=><Action key={f.value} label={f.label} variant={category===f.value?'primary':'ghost'} data-filter={f.value} aria-pressed={category===f.value} onClick={()=>setCategory(f.value)} isDisabled={!ready}/>)}</div>
  <p className="archive-result" data-filter-result role="status">显示 {total} 个项目{query.trim()?' · 搜索：'+query.trim():''}</p>
  {!ready&&<p className="ui-fallback-note">所有项目都在下面。搜索需要 JavaScript，也可以使用浏览器查找。</p>}
  </Garden>;
}
