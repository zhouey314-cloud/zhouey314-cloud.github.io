import React,{useEffect,useMemo,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {Garden,Action,Choice,useReady,download} from './shared.jsx';

export default function Cooperate({services,email}) {
  const ready=useReady();const [intent,setIntent]=useState('project'),[topic,setTopic]=useState('other'),[values,setValues]=useState({problem:'',context:'',result:'',timing:''}),[generated,setGenerated]=useState(false),[error,setError]=useState(''),[feedback,setFeedback]=useState('');
  const problem=useRef(null),draft=useRef(null),heading=useRef(null);const options=[...services.map(s=>({value:s.topic,label:s.field})),{value:'other',label:'其他 / 还没确定'}];
  useEffect(()=>{const t=new URLSearchParams(location.search).get('topic');if(options.some(o=>o.value===t))setTopic(t);},[]);
  const valid=Boolean(values.problem.trim());
  const subject=({project:'项目合作',role:'岗位交流',exchange:'技术交流'}[intent])+' · '+options.find(o=>o.value===topic).label+' · 与恩宇交流';
  const text=useMemo(()=>['你好，恩宇：','',`想与你交流：${{project:'项目合作',role:'岗位交流',exchange:'技术交流'}[intent]}`,`方向：${options.find(o=>o.value===topic).label}`,'','【问题 / 岗位需求】',values.problem.trim(),'','【已有资料 / 系统 / 团队条件】',values.context.trim()||'沟通时补充','','【期望产物与完成标准】',values.result.trim()||'一起确认','','【时间安排 / 合作条件】',values.timing.trim()||'沟通时确认','','通过 https://zhouey314-cloud.github.io/collaborate.html 整理'].join('\n'),[intent,topic,values]);
  const mail=`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,tooLong=mail.length>1800;
  const set=(name,value)=>{const limits={problem:600,context:400,result:400,timing:160};setValues(v=>({...v,[name]:value.slice(0,limits[name])}));setFeedback('');if(name==='problem'){problem.current?.setCustomValidity('');setError('');}};
  function submit(e){e.preventDefault();if(!valid){setError('请先描述一个具体问题或岗位需求。');problem.current?.setCustomValidity('请先描述一个具体问题或岗位需求。');problem.current?.reportValidity();problem.current?.focus();return;}flushSync(()=>{setGenerated(true);setFeedback('');});heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  async function copy(){try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(text);setFeedback('提纲已复制，可以粘贴到微信或邮件中。');}catch{draft.current?.focus();draft.current?.select();setFeedback('复制未获允许，已选中提纲。请使用系统的复制操作。');}}
  return <Garden className="brief-composer"><form className="inquiry-form" data-inquiry-form hidden={!ready} onSubmit={submit}>
    <fieldset><legend>这次想聊什么</legend><div className="inquiry-intent">{[['project','项目合作'],['role','岗位交流'],['exchange','技术交流']].map(([v,label])=><label key={v}><input type="radio" name="intent" value={v} checked={intent===v} onChange={()=>setIntent(v)}/>{label}</label>)}</div></fieldset>
    <Choice id="inquiry-topic" htmlName="topic" label="最接近的方向" value={topic} options={options} onChange={setTopic}/>
    <TextArea id="inquiry-problem" ref={problem} htmlName="problem" label="你想解决的问题或岗位需求" isRequired required onInvalid={()=>setError('请先描述一个具体问题或岗位需求。')} rows={4} maxLength={600} value={values.problem} onChange={v=>set('problem',v)} placeholder="例如：内部资料分散，希望同事能找到答案并核对原文。" status={error?{type:'error',message:error}:undefined} statusVariant="detached"/>
    <TextArea id="inquiry-context" htmlName="context" label="目前有什么资料、系统或团队条件" rows={3} maxLength={400} value={values.context} onChange={v=>set('context',v)} placeholder="写可分享的概况即可；客户资料或日志暂时不放在这里。"/>
    <TextArea id="inquiry-result" htmlName="result" label="希望得到什么产物，怎样判断完成" rows={3} maxLength={400} value={values.result} onChange={v=>set('result',v)} placeholder="例如：先做一版能操作的检索工具，用常见问题核对出处。"/>
    <TextInput id="inquiry-timing" htmlName="timing" label="时间安排或合作条件" isOptional maxLength={160} value={values.timing} onChange={v=>set('timing',v)} placeholder="可补充时间、预算范围，或岗位地点与工作方式。"/>
    <p className="inquiry-local">内容只在当前页面整理，不上传、不自动发送；刷新后不会保留。</p>
    <Action label="生成沟通提纲" type="submit" variant="primary"/>
  </form>
  <div className="inquiry-fallback" data-inquiry-fallback hidden={ready}><h3>第一次联系，带上这四件事就够了。</h3><ol><li>你想解决的问题</li><li>现有资料或系统</li><li>希望得到的产物</li><li>怎样判断做完了</li></ol><a href={'mailto:'+email}>发邮件给恩宇 ↗</a></div>
  <section className="inquiry-output" data-inquiry-output aria-labelledby="inquiry-output-title" hidden={!generated||!valid}><h3 id="inquiry-output-title" ref={heading} tabIndex={-1}>提纲已整理，可以继续补充。</h3><p>先检查内容，再复制到微信或打开邮件应用。发送由你确认。</p>
    <TextArea id="inquiry-draft" ref={draft} label="沟通提纲" rows={12} value={generated&&valid?text:''} isReadOnly hasSpellCheck={false}/>
    <p className="inquiry-email-note" data-email-note hidden={!tooLong}>提纲较长，请先复制全文，再打开邮件草稿粘贴。</p>
    <div className="inquiry-actions"><Action label="复制提纲" data-copy-brief onClick={copy}/><Action label="打开邮件草稿 ↗" data-email-brief href={!generated||!valid?'mailto:'+email:tooLong?`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('你好，恩宇：\n\n我已整理沟通提纲，将在这里粘贴全文。')}`:mail}/><Action label="保存为文本 ↓" data-download-brief onClick={()=>{download('与恩宇沟通的提纲.txt',subject+'\n\n'+text+'\n','text/plain');setFeedback('提纲已准备为文本文件。');}}/></div><p role="status" data-brief-feedback>{feedback}</p>
  </section></Garden>;
}
