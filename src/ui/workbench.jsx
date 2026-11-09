import React,{useEffect,useRef,useState} from 'react';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {FileInput} from '@astryxdesign/core/FileInput';
import {Banner} from '@astryxdesign/core/Banner';
import {Garden,Action,Choice,download,useReady} from './shared.jsx';

async function get(url) {const r=await fetch(url);if(!r.ok)throw Error(`HTTP ${r.status}: ${url}`);return r;}
function Status({name,message,error=false}) {return <p className="wb-status" {...{['data-'+name+'-status']:''}} data-error={String(error)} role="status">{message}</p>;}
function Failure({message}) {return message?<Banner status="error" title="这一步没有完成" description={message} container="section"/>:null;}
const defaultQuery='What is the refund policy?';
const sourceCommit='5c18455fbc59a2a8ffd46eb0231434f247efce29';

export function RagWorkbench() {
  const ready=useReady(),engine=useRef(null),original=useRef(null),imports=useRef(0),queryRef=useRef(null),importGeneration=useRef(0),current=useRef(null);
  const [docs,setDocs]=useState(null),[query,setQuery]=useState(defaultQuery),[scope,setScope]=useState('public'),[topk,setTopk]=useState('3'),[result,setResult]=useState(null),[selected,setSelected]=useState(null),[history,setHistory]=useState([]),[message,setMessage]=useState('交互准备后，在本机读取内置合成资料。'),[error,setError]=useState(false),[file,setFile]=useState(null),[reading,setReading]=useState(false);
  current.current={docs,query,scope,topk};
  const accessible=(items=docs,s=scope)=>(items||[]).filter(d=>d.access==='public'||d.access===s);
  function status(text,isError=false){setMessage(text);setError(isError);}
  function run({q=query,s=scope,k=topk,items=docs}={}) {
    q=q.trim();if(!q){status('请输入问题或选择一个示例。',true);queryRef.current?.focus();return;}
    if(!items||!engine.current)return;
    const start=performance.now(),answer=engine.current(q,items,s,Number(k));
    const next={...answer,query:q,scope:s,top_k:Number(k),mode:'lexical',source_commit:sourceCommit,corpus:items.some(d=>d.id.startsWith('local-'))?'synthetic_plus_local_text':'synthetic_unverified'};
    setResult(next);setSelected(next.hits[0]?.doc.id||null);status(`已检查 ${accessible(items,s).length} 份可见资料 · ${next.hits.length} 条命中 · 本机计算 ${(performance.now()-start).toFixed(1)} ms`);
    setHistory(old=>[{query:q,scope:s,k:String(k)},...old.filter(h=>h.query!==q||h.scope!==s)].slice(0,5));
  }
  useEffect(()=>{
    let live=true;status('正在读取内置合成资料；本地导入内容不会上传。');
    Promise.all([import('/public/workbench/rag.js'),get('/public/workbench/documents.json').then(r=>r.json())]).then(([module,items])=>{if(!live)return;engine.current=module.explain;original.current=items;setDocs(items);run({items,q:defaultQuery,s:'public',k:'3'});}).catch(e=>{if(live){console.error('RAG workbench initialization failed',e);status('检索组件或资料加载失败。请刷新重试，或打开下方原项目页面。',true);}});
    return()=>{live=false};
  },[]);
  async function importFile(value){
    const generation=++importGeneration.current;
    if(!value){setFile(null);setReading(false);return;}
    setFile(value);setReading(true);
    try{
      if(!/\.(txt|md)$/i.test(value.name)||value.size>200000)throw Error('请选择不超过 200 KB 的 .txt 或 .md 文件。');
      const text=await value.text();
      // A reset/clear/new file invalidates the previous read. Read the latest
      // query and scope after await: an old closure must never reveal a team
      // excerpt after the visitor has switched back to public.
      if(generation!==importGeneration.current)return;
      if(!text.trim()||text.includes('\0'))throw Error('文件为空或不是可读取的文本。');
      const latest=current.current,items=[...latest.docs,{id:'local-'+(++imports.current),title:value.name,access:'public',version:1,text}];
      current.current={...latest,docs:items};setDocs(items);
      run({items,q:latest.query,s:latest.scope,k:latest.topk});
      status('已加入本地文本；仅保存在当前页面内存中，未上传。');
    }catch(e){if(generation===importGeneration.current)status(e.message,true);}
    finally{if(generation===importGeneration.current){setFile(null);setReading(false);}}
  }
  function reset(){if(!original.current)return;++importGeneration.current;setReading(false);setFile(null);const items=[...original.current];setDocs(items);setQuery(defaultQuery);setScope('public');setHistory([]);run({items,q:defaultQuery,s:'public'});status('已移除本地文本，恢复内置合成资料。');}
  const visible=accessible(),doc=visible.find(d=>d.id===selected),excerpt=result?.status==='EXTRACTIVE'&&result.citations[0]?.doc_id===doc?.id?result.answer:null,at=excerpt?doc.text.indexOf(excerpt):-1;
  const disabled=!ready||!docs;
  return <Garden className="workbench-ui"><div className="rag-layout">
    <aside className="wb-surface rag-library"><div className="wb-block-label"><h3>01 / 资料</h3><span data-doc-count>{docs?`${visible.length} / ${docs.length} 份可见`:'4 份合成资料'}</span></div>
      <Choice id="scope" htmlName="scope" label="查看范围" value={scope} options={[{value:'public',label:'Public · 公开资料'},{value:'team',label:'Team · 包含合成内部资料'}]} isDisabled={disabled} disabledMessage="内置资料读取后可选择范围。" onChange={s=>{setScope(s);run({s});}}/>
      <div data-documents>{visible.length?visible.map((d,i)=><button key={d.id} className="document-button" type="button" data-doc-id={d.id} aria-pressed={selected===d.id} onClick={()=>setSelected(d.id)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{d.title}</strong><small>{d.access} · v{d.version}</small></div></button>):<p>启用 JavaScript 后读取资料，也可以打开下方原项目。</p>}</div>
      <details className="local-import"><summary>添加本地文本</summary><p>只在当前页面内存中处理，不上传。支持 .txt / .md，最多 200 KB；刷新后清除。</p><FileInput id="local-document" label="选择你的文本文件" value={file} onChange={importFile} accept=".txt,.md,text/plain,text/markdown" placeholder="选择本地文本" isDisabled={disabled} disabledMessage="先读取内置资料，再添加本地文本。" isLoading={reading}/><Action label="恢复内置资料" variant="ghost" data-reset-docs onClick={reset} isDisabled={disabled}/></details>
    </aside>
    <div className="wb-surface rag-query"><div className="wb-block-label"><h3>02 / 问题与摘录</h3><span>LEXICAL / EXTRACTIVE</span></div>
      {/* The dimmed pending wrapper also dims its counter, which is not a disabled control. Keep the counter with the editable field; the input clamp always remains 500. */}
      <form id="query-form" onSubmit={e=>{e.preventDefault();run();}}><TextArea id="query" ref={queryRef} label="用英文问题查找原文" value={query} onChange={v=>setQuery(v.slice(0,500))} rows={3} maxLength={disabled?undefined:500} placeholder={defaultQuery} isDisabled={disabled} disabledMessage="资料读取后即可检索；此处没有生成模型。"/>
        <div className="query-options"><Choice id="topk" htmlName="topk" label="最多返回" value={topk} options={['1','3','5'].map(n=>({value:n,label:n+' 条'}))} isDisabled={disabled} onChange={k=>{setTopk(k);run({k});}}/><Action type="submit" label="检索资料 ↗" variant="primary" isDisabled={disabled}/></div>
      </form><div className="query-examples" role="group" aria-label="示例问题">{[[defaultQuery,'退款政策'],['What are the support hours?','服务时间'],['What is the support phone number?','证据不足'],['internal onboarding','范围过滤']].map(([q,label])=><Action key={q} label={label} variant="ghost" data-query={q} isDisabled={disabled} onClick={()=>{setQuery(q);run({q});}}/>)}</div>
      <Status name="rag" message={message} error={error}/><Failure message={error?message:null}/>
      <div className="answer-block" data-answer data-state={result?.status}>
        <h3>{!result?'回答与来源':result.status==='EXTRACTIVE'?'原文摘录 / EXTRACTIVE':'证据不足 / NO ANSWER'}</h3>
        <p>{!result?'提交问题后，在这里查看原文摘录。':result.status==='EXTRACTIVE'?result.answer:'当前可见资料不足以回答这个问题。'}</p>
        {result&&<small>{result.status==='EXTRACTIVE'?`来源：${result.citations[0].title} · ${result.citations[0].chunk_id} · v${result.citations[0].version}`:result.no_answer_reason==='NO_ACCESSIBLE_LEXICAL_MATCH'?'没有匹配的可见词法片段。可调整英文关键词或资料范围。':'命中了相关资料，但原文没有满足问题的证据。相关，不等于能回答。'}</small>}
      </div><div className="answer-actions"><Action label="导出本次检索 JSON ↓" data-export-rag isDisabled={!result} onClick={()=>result&&download('enyu-retrieval.json',JSON.stringify(result,null,2)+'\n')}/><a href="https://github.com/zhouey314-cloud/enterprise-rag-starter" target="_blank" rel="noopener noreferrer">源码 ↗</a></div>
      <div className="rag-history"><h3>本次访问的查询</h3><div data-query-history>{history.map(h=><Action key={h.query+h.scope} label={h.query+' · '+h.scope} variant="ghost" onClick={()=>{setQuery(h.query);setScope(h.scope);setTopk(h.k);run({q:h.query,s:h.scope,k:h.k});}}/>)}</div></div>
    </div>
    <aside className="wb-surface rag-evidence"><div className="wb-block-label"><h3>03 / 来源检查</h3><span data-hit-count>{result?.hits.length||0} 条命中</span></div>
      <div data-hits>{result?.hits.map(({doc:d,score})=><button key={d.id} className="hit-button" type="button" data-doc-id={d.id} aria-pressed={selected===d.id} onClick={()=>setSelected(d.id)}><span>{d.title}</span><small>词法分 {score}</small></button>)}</div>
      <div className="source-document" data-source>{doc?<><h4>{doc.title}</h4><small>{doc.access} · v{doc.version} · {doc.id}:0</small><p>{at>=0?<>{doc.text.slice(0,at)}<mark>{excerpt}</mark>{doc.text.slice(at+excerpt.length)}</>:doc.text}</p><p className="source-citation">SOURCE / {doc.id}:0 · {doc.id.startsWith('local-')?'本地文件，仅当前页面':'公开合成资料'}</p></>:<p>{result?.hits.length===0?'本次没有可见来源；不会生成引用。':'选中资料或检索结果，查看完整原文与引用定位。'}</p>}</div>
    </aside>
  </div></Garden>;
}

export function validateEvent(event) {
  if(!event||typeof event!=='object'||Array.isArray(event)||typeof event.event_type!=='string'||event.event_type.length>100||typeof event.observed_at_utc!=='string'||!Number.isFinite(Date.parse(event.observed_at_utc))||typeof event.evidence!=='object'||!event.evidence)throw Error('需要包含 event_type、observed_at_utc 和 evidence 的 AgentGuard 事件对象。');
  if(typeof event.evidence.requested_model!=='string'||!Array.isArray(event.evidence.response_models)||!event.evidence.response_models.every(v=>typeof v==='string'))throw Error('报告缺少 requested_model 或 response_models 声明标签。');
  return event;
}
export function RelayWorkbench() {
  const requestGeneration=useRef(0);
  const [event,setEvent]=useState(null),[source,setSource]=useState('来源：2026-10-23 公开合成报告'),[message,setMessage]=useState('交互准备后读取公开报告。'),[error,setError]=useState(false),[file,setFile]=useState(null),[loading,setLoading]=useState(false);
  function status(text,failed=false){setMessage(text);setError(failed);}
  function apply(value,label){const next=validateEvent(value);setEvent(next);setSource(label);status('已从文件解析事件字段；未发送模型请求。');}
  async function load(){const generation=++requestGeneration.current;setLoading(true);try{const text=await(await get('/public/projects/relay/synthetic-report-20261023.md')).text();if(generation!==requestGeneration.current)return;const block=/```json\s*([\s\S]*?)```/.exec(text);if(!block)throw Error('原报告没有 JSON 事件。');apply(JSON.parse(block[1]),'来源：2026-10-23 公开合成报告 · synthetic_unverified');}catch(e){if(generation===requestGeneration.current){console.error('Relay report failed',e);status('公开报告读取失败，可打开下方原始 Markdown；也可点击恢复重试。',true);}}finally{if(generation===requestGeneration.current)setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function importFile(value){const generation=++requestGeneration.current;setLoading(false);if(!value){setFile(null);return;}setFile(value);try{if(value.size>200000||!value.name.endsWith('.json'))throw Error('请选择不超过 200 KB 的 JSON 事件文件。');const text=await value.text();if(generation!==requestGeneration.current)return;apply(JSON.parse(text),'来源：本地文件 '+value.name+' · 未上传，未验证外部真实性');}catch(e){if(generation===requestGeneration.current)status(e instanceof SyntaxError?'JSON 格式无法解析；当前报告保持不变。':e.message,true);}finally{if(generation===requestGeneration.current)setFile(null);}}
  const fields=event?[['时间 UTC',event.observed_at_utc],['规则',event.rule_version],['报告次数',Number.isInteger(event.occurrences)?event.occurrences:'未记录'],['请求 ID',event.evidence.request_id],['会话 ID',event.session_id],['观察事实',event.evidence.observed_fact],['可能解释',Array.isArray(event.evidence.possible_explanations)?event.evidence.possible_explanations.join('\n'):'未记录'],['报告身份字段',event.identity_status||'未记录']]:[];
  return <Garden className="workbench-ui"><div className="relay-toolbar"><span data-report-source>{source}</span><div><FileInput id="relay-file" label="打开本地事件 JSON" value={file} onChange={importFile} accept=".json,application/json" placeholder="选择事件文件"/><Action label="恢复公开报告" data-relay-reset onClick={load} isLoading={loading}/></div></div><Status name="relay" message={message} error={error}/><Failure message={error?message:null}/>
  <div className="relay-layout"><div className="wb-surface relay-event"><div className="wb-block-label"><h3>观察事件</h3><span>READ ONLY</span></div><div data-relay-summary>{event?<><p className="relay-observation">{event.event_type==='declared_model_mismatch'?'请求标签与响应标签不一致。':'已载入一条观察事件。'}</p><div className="label-comparison">{[['请求声明',event.evidence.requested_model],['响应声明',event.evidence.response_models.join(', ')||'未记录']].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><p className="identity-note">真实模型身份：未验证。报告观察的是可见声明与协议，无法由这些字段确认底层模型权重。</p></>:<p>读取报告后展示。</p>}</div>
    <div className="protocol-route" aria-label="该项目的本地调用链路"><span>Agent<small>发起请求</small></span><i aria-hidden="true">→</i><span>本地网关<small>被动观察</small></span><i aria-hidden="true">→</i><span>配置的上游<small>返回声明标签</small></span></div><p className="wb-micro">链路示意；这里没有实时请求。报告里未记录的耗时和流量不会补画成监控数据。</p></div>
    <div className="wb-surface relay-details"><div className="wb-block-label"><h3>证据字段</h3><span data-event-type>{event?.event_type}</span></div><dl data-relay-fields>{fields.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value===undefined?'未记录':String(value)}</dd></div>)}</dl><details><summary>展开原始事件 JSON</summary><pre data-relay-raw>{event?JSON.stringify(event,null,2):''}</pre></details><div className="answer-actions"><Action label="导出事件 JSON ↓" data-export-relay isDisabled={!event} onClick={()=>event&&download('agentguard-event.json',JSON.stringify(event,null,2)+'\n')}/><a href="/public/projects/relay/synthetic-report-20261023.md">原始 Markdown ↗</a></div></div>
  </div></Garden>;
}

const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const time=s=>s.split(':').reduce((a,v)=>a*60+Number(v),0);
export function VideoWorkbench() {
  const video=useRef(null),pending=useRef(null),started=useRef(false);const [cues,setCues]=useState([]),[query,setQuery]=useState(''),[position,setPosition]=useState(0),[meta,setMeta]=useState(null),[rate,setRate]=useState('1'),[message,setMessage]=useState('点击播放或章节，才读取视频。'),[error,setError]=useState(false);
  function begin(){if(!started.current){started.current=true;const source=video.current.querySelector('source');if(!source.hasAttribute('src')){source.src=source.dataset.src;video.current.preload='metadata';video.current.load();}}}
  function seek(value){if(!video.current)return;if(video.current.readyState){video.current.currentTime=Math.min(value,Number.isFinite(video.current.duration)?video.current.duration:54);setPosition(video.current.currentTime);}else{pending.current=value;begin();}}
  useEffect(()=>{let live=true;get('/public/projects/video/original-54s.vtt').then(r=>r.text()).then(vtt=>{if(!live)return;const items=[...vtt.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\s*\n([^\n]+(?:\n(?!\s*\n)[^\n]+)*)/g)].map(m=>({start:time(m[1]),end:time(m[2]),text:m[3].trim()}));if(items.length!==9)throw Error('Unexpected VTT structure');setCues(items);const p=new URLSearchParams(location.search),t=Number(p.get('t'));if(p.has('t')&&Number.isFinite(t)&&t>=0&&t<54)seek(t);}).catch(e=>{if(live){console.error('Video transcript failed',e);setError(true);setMessage('章节加载失败。视频原生播放与字幕下载仍可使用。');}});
    return()=>{live=false;};
  },[]);
  function metadata(){const v=video.current;setMeta({width:v.videoWidth,height:v.videoHeight,duration:v.duration});if(pending.current!==null){v.currentTime=Math.min(pending.current,v.duration);pending.current=null;}setPosition(v.currentTime);}
  const active=cues.findIndex(c=>position>=c.start&&position<c.end),filtered=cues.map((c,i)=>({...c,i})).filter(c=>!query.trim()||c.text.includes(query.trim()));
  async function share(){const url=new URL(location.href);url.hash='video';url.searchParams.set('t',Math.floor(video.current.currentTime));try{await navigator.clipboard.writeText(url.href);setMessage('已复制当前时间链接。');}catch{setMessage('请选中复制：'+url.href);}}
  return <Garden className="workbench-ui"><div className="video-layout"><div className="wb-surface film-stage"><div className="film-player"><video id="studio-video" ref={video} controls playsInline preload="none" poster="/public/projects/video/original-54s-poster.jpg" width={1280} height={720} aria-label="54秒原创程序动画，带中文字幕" onLoadedMetadata={metadata} onTimeUpdate={()=>setPosition(video.current.currentTime)} onSeeked={()=>setPosition(video.current.currentTime)} onError={()=>{setError(true);setMessage('视频加载失败。可下载原片或刷新页面重试。');}}><source data-src="/public/projects/video/original-54s.mp4" type="video/mp4" suppressHydrationWarning/><track kind="captions" src="/public/projects/video/original-54s.vtt" srcLang="zh" label="可选中文字幕（原片已烧录）"/><a href="/public/projects/video/original-54s.mp4">下载视频</a></video><Action label="播放原创动画" data-start-video variant="primary"/></div>
    {/* Native media remains available with JavaScript disabled. A live source in
        the enhanced SSR player can make Linux WebKit fetch despite preload=none. */}
    <noscript dangerouslySetInnerHTML={{__html:'<style>.film-player{display:none!important}</style><video controls playsinline preload="none" poster="/public/projects/video/original-54s-poster.jpg" width="1280" height="720" aria-label="54秒原创程序动画，带中文字幕"><source src="/public/projects/video/original-54s.mp4" type="video/mp4"><track kind="captions" src="/public/projects/video/original-54s.vtt" srclang="zh" label="可选中文字幕（原片已烧录）"></video>'}}/>
    <div className="film-controls"><span data-video-clock>{clock(position)} / {clock(meta?.duration||54)}</span><Choice id="video-rate" htmlName="video-rate" label="播放速度" value={rate} options={['0.75','1','1.25','1.5'].map(v=>({value:v,label:v+'×'}))} onChange={v=>{setRate(v);video.current.defaultPlaybackRate=Number(v);video.current.playbackRate=Number(v);}}/><Action label="复制当前时间链接" data-share-video onClick={share}/></div>
    <Status name="video" message={message} error={error}/><Failure message={error?message:null}/><div className="film-meta"><span data-video-meta>{meta?`${meta.width} × ${meta.height} · ${meta.duration.toFixed(2)} 秒 · MP4`:'54 秒原创样片 · 播放后核对媒体元数据'}</span><a href="/public/projects/video/original-54s.mp4" download>下载原片 ↓</a><a href="/public/projects/video/original-54s.vtt" download>下载字幕 ↓</a></div></div>
    <aside className="wb-surface film-transcript"><div className="wb-block-label"><h3>字幕与章节</h3><span>09 CHAPTERS</span></div><TextInput id="caption-search" type="search" label="查找字幕" value={query} onChange={setQuery} hasClear placeholder="试试：声音、检查、字幕"/><div data-transcript>{filtered.length?filtered.map(c=><Action key={c.i} label={c.text} className="cue-button" variant="ghost" data-cue={c.i} aria-current={c.i===active?'true':undefined} onClick={()=>seek(c.start)}><time>{clock(c.start)}</time><span>{c.text}</span></Action>):<p>{cues.length?'没有匹配的字幕。':'启用交互后浏览章节；也可直接阅读原始字幕文件。'}</p>}</div><a href="/public/projects/video/original-54s.vtt">阅读原始字幕文件 ↗</a></aside>
  </div><div className="film-timeline" data-film-timeline aria-label="视频章节缩略图">{cues.map((c,i)=><button key={i} type="button" data-cue={i} aria-current={i===active?'true':undefined} aria-label={`${clock(c.start)}：${c.text}`} onClick={()=>seek(c.start)}><img src={`/public/workbench/video-${i+1}.webp`} alt="" aria-hidden="true" width={240} height={135} loading="lazy"/><span>{String(i+1).padStart(2,'0')} / {clock(c.start)}</span></button>)}</div></Garden>;
}
