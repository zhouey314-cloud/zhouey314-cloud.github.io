// Workbench presentation. Retrieval is the unmodified public upstream engine.
const $ = selector => document.querySelector(selector);
const node = (tag,text,cls) => {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const status = (selector,text,error=false) => {const e=$(selector);e.textContent=text;e.dataset.error=String(error);};
const download = (name,value) => {const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
async function get(url) {const r=await fetch(url);if(!r.ok)throw Error(`HTTP ${r.status}: ${url}`);return r;}
const links=[...document.querySelectorAll('[data-workspace]')];
const panels=[...document.querySelectorAll('.wb-panel')];
$('.wb-tabs').setAttribute('role','tablist');
links.forEach(link=>{link.id='tab-'+link.dataset.workspace;link.setAttribute('role','tab');link.setAttribute('aria-controls',link.dataset.workspace);});
panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+panel.id);panel.tabIndex=0;});
const started=new Map();
function selectWorkspace(id) {
  if(!panels.some(p=>p.id===id))id='rag';
  links.forEach(link=>{const selected=link.dataset.workspace===id;link.setAttribute('aria-selected',String(selected));link.tabIndex=selected?0:-1;});
  panels.forEach(panel=>panel.hidden=panel.id!==id);
  if(id!=='video')$('#studio-video').pause();
  if(!started.has(id)){const task=({rag:initRag,relay:initRelay,video:initVideo})[id]();started.set(id,task);}
}
links.forEach((link,index)=>{
  link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.pushState(null,'','#'+link.dataset.workspace);selectWorkspace(link.dataset.workspace);});
  link.addEventListener('keydown',event=>{const i=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;if(i===null)return;event.preventDefault();links[i].focus();links[i].click();});
});
addEventListener('hashchange',()=>selectWorkspace(location.hash.slice(1)));
addEventListener('popstate',()=>selectWorkspace(location.hash.slice(1)));

async function initRag(){
 try {
  const [{explain},response]=await Promise.all([import('/public/workbench/rag.js'),get('/public/workbench/documents.json')]);
  const original=await response.json();let docs=[...original],lastResult=null,historyItems=[],importCount=0,selectedId;
  const accessible=()=>docs.filter(d=>d.access==='public'||d.access===$('#scope').value);
  function showSource(doc,excerpt=null){
   selectedId=doc.id;const box=$('[data-source]');box.replaceChildren(node('h4',doc.title),node('small',`${doc.access} · v${doc.version} · ${doc.id}:0`));
   const p=node('p');const at=excerpt?doc.text.indexOf(excerpt):-1;
   if(at>=0)p.append(document.createTextNode(doc.text.slice(0,at)),node('mark',excerpt),document.createTextNode(doc.text.slice(at+excerpt.length)));else p.textContent=doc.text;
   box.append(p,node('p','SOURCE / '+doc.id+':0 · '+(doc.id.startsWith('local-')?'本地文件，仅当前页面':'公开合成资料'),'source-citation'));
   document.querySelectorAll('[data-doc-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.docId===doc.id)));
  }
  function library(){
   const visible=accessible();$('[data-doc-count]').textContent=`${visible.length} / ${docs.length} 份可见`;
   $('[data-documents]').replaceChildren(...visible.map((doc,i)=>{const b=node('button',undefined,'document-button');b.type='button';b.dataset.docId=doc.id;b.setAttribute('aria-pressed','false');const copy=node('div');copy.append(node('strong',doc.title),node('small',`${doc.access} · v${doc.version}`));b.append(node('span',String(i+1).padStart(2,'0')),copy);b.addEventListener('click',()=>showSource(doc,lastResult?.status==='EXTRACTIVE'&&lastResult.citations[0]?.doc_id===doc.id?lastResult.answer:null));return b;}));
   if(!visible.some(d=>d.id===selectedId)){$('[data-source]').replaceChildren(node('p','选中资料或命中结果，查看原文。'));selectedId=null;}
  }
  function run(){
   const query=$('#query').value.trim();if(!query){status('[data-rag-status]','请输入问题或选择一个示例。',true);$('#query').focus();return;}
   const scope=$('#scope').value,k=Number($('#topk').value),start=performance.now(),result=explain(query,docs,scope,k);
   lastResult={...result,query,scope,top_k:k,mode:'lexical',source_commit:'5c18455fbc59a2a8ffd46eb0231434f247efce29',corpus:docs.some(d=>d.id.startsWith('local-'))?'synthetic_plus_local_text':'synthetic_unverified'};
   status('[data-rag-status]',`已检查 ${accessible().length} 份可见资料 · ${result.hits.length} 条命中 · 本机计算 ${(performance.now()-start).toFixed(1)} ms`);
   const answer=$('[data-answer]');answer.dataset.state=result.status;answer.replaceChildren(node('h3',result.status==='EXTRACTIVE'?'原文摘录 / EXTRACTIVE':'证据不足 / NO ANSWER'),node('p',result.status==='EXTRACTIVE'?result.answer:'当前可见资料不足以回答这个问题。'));
   if(result.status==='EXTRACTIVE')answer.append(node('small',`来源：${result.citations[0].title} · ${result.citations[0].chunk_id} · v${result.citations[0].version}`));
   else answer.append(node('small',result.no_answer_reason==='NO_ACCESSIBLE_LEXICAL_MATCH'?'没有匹配的可见词法片段。可调整英文关键词或资料范围。':'命中了相关资料，但原文没有满足问题的证据。相关，不等于能回答。'));
   $('[data-hit-count]').textContent=`${result.hits.length} 条命中`;
   $('[data-hits]').replaceChildren(...result.hits.map(({doc,score})=>{const b=node('button',undefined,'hit-button');b.type='button';b.dataset.docId=doc.id;b.setAttribute('aria-pressed','false');b.append(node('span',doc.title),node('small',`词法分 ${score}`));b.addEventListener('click',()=>showSource(doc,result.status==='EXTRACTIVE'&&result.citations[0]?.doc_id===doc.id?result.answer:null));return b;}));
   if(result.hits[0])showSource(result.hits[0].doc,result.status==='EXTRACTIVE'?result.answer:null);else{$('[data-source]').replaceChildren(node('p','本次没有可见来源；不会生成引用。'));selectedId=null;}
   $('[data-export-rag]').disabled=false;historyItems=[{query,scope,k},...historyItems.filter(h=>h.query!==query||h.scope!==scope)].slice(0,5);
   $('[data-query-history]').replaceChildren(...historyItems.map(h=>{const b=node('button',h.query+' · '+h.scope);b.type='button';b.addEventListener('click',()=>{$('#query').value=h.query;$('#scope').value=h.scope;$('#topk').value=h.k;library();run();});return b;}));
  }
  $('#query-form').addEventListener('submit',e=>{e.preventDefault();run();});
  $('#scope').addEventListener('change',()=>{library();run();});$('#topk').addEventListener('change',run);
  document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{$('#query').value=b.dataset.query;run();}));
  $('[data-export-rag]').addEventListener('click',()=>{if(lastResult)download('enyu-retrieval.json',lastResult);});
  $('#local-document').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;
   try{if(!/\.(txt|md)$/i.test(file.name)||file.size>200000)throw Error('请选择不超过 200 KB 的 .txt 或 .md 文件。');const text=await file.text();if(!text.trim()||text.includes('\0'))throw Error('文件为空或不是可读取的文本。');docs.push({id:'local-'+(++importCount),title:file.name,access:'public',version:1,text});library();run();status('[data-rag-status]','已加入本地文本；仅保存在当前页面内存中，未上传。');}catch(e){status('[data-rag-status]',e.message,true);}finally{event.target.value='';}
  });
  $('[data-reset-docs]').addEventListener('click',()=>{docs=[...original];historyItems=[];selectedId=null;$('#scope').value='public';$('#query').value='What is the refund policy?';library();run();status('[data-rag-status]','已移除本地文本，恢复内置合成资料。');});
  library();run();
 }catch(e){console.error('RAG workbench initialization failed',e);status('[data-rag-status]','检索组件或资料加载失败。请刷新重试，或打开下方原项目页面。',true);}
}

async function initRelay(){
 let current;
 function validate(event){
  if(!event||typeof event!=='object'||Array.isArray(event)||typeof event.event_type!=='string'||event.event_type.length>100||typeof event.observed_at_utc!=='string'||!Number.isFinite(Date.parse(event.observed_at_utc))||typeof event.evidence!=='object'||!event.evidence)throw Error('需要包含 event_type、observed_at_utc 和 evidence 的 AgentGuard 事件对象。');
  if(typeof event.evidence.requested_model!=='string'||!Array.isArray(event.evidence.response_models)||!event.evidence.response_models.every(v=>typeof v==='string'))throw Error('报告缺少 requested_model 或 response_models 声明标签。');
  return event;
 }
 function render(event,source){
  current=validate(event);$('[data-report-source]').textContent=source;$('[data-event-type]').textContent=event.event_type;
  const summary=$('[data-relay-summary]');summary.replaceChildren(node('p',event.event_type==='declared_model_mismatch'?'请求标签与响应标签不一致。':'已载入一条观察事件。','relay-observation'));
  const pair=node('div',undefined,'label-comparison');for(const[label,value]of[['请求声明',event.evidence.requested_model],['响应声明',event.evidence.response_models.join(', ')||'未记录']]){const div=node('div');div.append(node('small',label),node('strong',value));pair.append(div);}summary.append(pair,node('p','真实模型身份：未验证。报告观察的是可见声明与协议，无法由这些字段确认底层模型权重。','identity-note'));
  const fields=[['时间 UTC',event.observed_at_utc],['规则',event.rule_version],['报告次数',Number.isInteger(event.occurrences)?event.occurrences:'未记录'],['请求 ID',event.evidence.request_id],['会话 ID',event.session_id],['观察事实',event.evidence.observed_fact],['可能解释',Array.isArray(event.evidence.possible_explanations)?event.evidence.possible_explanations.join('\n'):'未记录'],['报告身份字段',event.identity_status||'未记录']];
  $('[data-relay-fields]').replaceChildren(...fields.map(([key,value])=>{const row=node('div');row.append(node('dt',key),node('dd',value===undefined?'未记录':String(value)));return row;}));
  $('[data-relay-raw]').textContent=JSON.stringify(event,null,2);$('[data-export-relay]').disabled=false;status('[data-relay-status]','已从文件解析事件字段；未发送模型请求。');
 }
 async function loadPublic(){try{const text=await(await get('/public/projects/relay/synthetic-report-20261023.md')).text();const block=/```json\s*([\s\S]*?)```/.exec(text);if(!block)throw Error('原报告没有 JSON 事件。');render(JSON.parse(block[1]),'来源：2026-10-23 公开合成报告 · synthetic_unverified');}catch(e){console.error('Relay report failed',e);status('[data-relay-status]','公开报告读取失败，可打开下方原始 Markdown；也可点击恢复重试。',true);}}
 $('#relay-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000||!file.name.endsWith('.json'))throw Error('请选择不超过 200 KB 的 JSON 事件文件。');render(JSON.parse(await file.text()),'来源：本地文件 '+file.name+' · 未上传，未验证外部真实性');}catch(error){status('[data-relay-status]',error instanceof SyntaxError?'JSON 格式无法解析；当前报告保持不变。':error.message,true);}finally{e.target.value='';}});
 $('[data-relay-reset]').addEventListener('click',loadPublic);$('[data-export-relay]').addEventListener('click',()=>{if(current)download('agentguard-event.json',current);});await loadPublic();
}

async function initVideo(){
 const video=$('#studio-video'),clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;let cues=[],active=-1;
 const time=s=>s.split(':').reduce((a,v)=>a*60+Number(v),0);
 function seek(value){const apply=()=>{video.currentTime=Math.min(value,Number.isFinite(video.duration)?video.duration:54);update();};if(video.readyState)apply();else{video.addEventListener('loadedmetadata',apply,{once:true});video.load();}}
 function update(){
  const t=video.currentTime; $('[data-video-clock]').textContent=clock(t)+' / '+clock(Number.isFinite(video.duration)?video.duration:54);
  const index=cues.findIndex(c=>t>=c.start&&t<c.end);
  if(index!==active){active=index;document.querySelectorAll('[data-cue]').forEach(b=>{if(Number(b.dataset.cue)===index)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});}
 }
 function transcript(){const q=$('#caption-search').value.trim();const filtered=cues.map((c,i)=>({...c,i})).filter(c=>!q||c.text.includes(q));$('[data-transcript]').replaceChildren(...filtered.map(c=>{const b=node('button',undefined,'cue-button');b.type='button';b.dataset.cue=c.i;b.append(node('time',clock(c.start)),node('span',c.text));b.addEventListener('click',()=>seek(c.start));return b;}));if(!filtered.length)$('[data-transcript]').append(node('p','没有匹配的字幕。'));active=-1;update();}
 video.addEventListener('timeupdate',update);video.addEventListener('seeked',update);
 const metadata=()=>{$('[data-video-meta]').textContent=`${video.videoWidth} × ${video.videoHeight} · ${video.duration.toFixed(2)} 秒 · MP4`;update();};video.addEventListener('loadedmetadata',metadata);if(video.readyState)metadata();
 video.addEventListener('error',()=>status('[data-video-status]','视频加载失败。可下载原片或刷新页面重试。',true));
 $('#video-rate').addEventListener('change',e=>video.playbackRate=Number(e.target.value));
 $('[data-share-video]').addEventListener('click',async()=>{const url=new URL(location.href);url.hash='video';url.searchParams.set('t',Math.floor(video.currentTime));try{await navigator.clipboard.writeText(url.href);status('[data-video-status]','已复制当前时间链接。');}catch{status('[data-video-status]','请选中复制：'+url.href);}});
 $('#caption-search').addEventListener('input',transcript);
 try{const vtt=await(await get('/public/projects/video/original-54s.vtt')).text();cues=[...vtt.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\s*\n([^\n]+(?:\n(?!\s*\n)[^\n]+)*)/g)].map(m=>({start:time(m[1]),end:time(m[2]),text:m[3].trim()}));if(cues.length!==9)throw Error('Unexpected VTT structure');
  transcript();$('[data-film-timeline]').replaceChildren(...cues.map((c,i)=>{const b=node('button');b.type='button';b.dataset.cue=i;b.setAttribute('aria-label',`${clock(c.start)}：${c.text}`);const img=node('img');img.src=`/public/workbench/video-${i+1}.webp`;img.alt='';img.setAttribute('aria-hidden','true');img.width=240;img.height=135;img.loading='lazy';b.append(img,node('span',`${String(i+1).padStart(2,'0')} / ${clock(c.start)}`));b.addEventListener('click',()=>seek(c.start));return b;}));
  video.load();
  const t=Number(new URLSearchParams(location.search).get('t'));if(Number.isFinite(t)&&t>=0&&t<54)seek(t);update();
 }catch(e){console.error('Video transcript failed',e);status('[data-video-status]','章节加载失败。视频原生播放与字幕下载仍可使用。',true);}
}
selectWorkspace(location.hash.slice(1));
