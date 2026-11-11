const loaded=new WeakSet();
const modules={archive:()=>import('./archive.jsx'),cooperate:()=>import('./cooperate.jsx'),rag:()=>import('./workbench.jsx'),relay:()=>import('./workbench.jsx'),video:()=>import('./workbench.jsx')};
async function mount(root) {
  if(loaded.has(root))return;loaded.add(root);
  const initialHTML=root.innerHTML;
  let phase='props';
  function fail(error,errorPhase,info) {
    if(root.dataset.uiState==='error')return;
    root.dataset.uiState='error';root.dataset.uiErrorPhase=errorPhase;
    root.innerHTML=initialHTML;
    const note=document.createElement('p');note.className='ui-fallback-note';note.dataset.uiErrorFor=root.dataset.uiId;
    note.setAttribute('role','alert');note.textContent='交互暂时不可用。可使用下方静态说明与联系入口，刷新页面后重试。';root.before(note);
    const detail={island:root.dataset.ui,phase:errorPhase,message:error?.message||String(error),stack:error?.stack||null,componentStack:info?.componentStack||null};
    console.error('Portfolio interaction failed:',root.dataset.ui,errorPhase,error,info);
    dispatchEvent(new CustomEvent('portfolio:ui-error',{detail}));
  }
  root.dataset.uiState='loading';
  try {
    const name=root.dataset.ui,props=JSON.parse(document.querySelector(`[data-ui-props="${root.dataset.uiId}"]`).textContent);
    phase='module-import';
    const [runtime,module]=await Promise.all([import('./hydrate.jsx'),modules[name]()]);
    const Component={rag:module.RagWorkbench,relay:module.RelayWorkbench,video:module.VideoWorkbench}[name]||module.default;
    phase='hydrate-start';
    runtime.hydrate(root,Component,props,(error,info)=>fail(error,'react-uncaught',info));
    if(root.dataset.uiState!=='error')root.dataset.uiState='ready';
  } catch(error) {
    fail(error,phase);
  }
}
function workbench(){const requested=document.documentElement.dataset.activeWorkspace||location.hash.slice(1);const id=['rag','relay','video'].includes(requested)?requested:'rag';const root=document.querySelector(`[data-ui="${id}"]`);if(root)mount(root);}
document.querySelectorAll('[data-ui="archive"],[data-ui="cooperate"]').forEach(mount);
workbench();addEventListener('workbench:select',workbench);
let viewer,styles;
function ensureStyles(){
  if(document.querySelector('link[href*="/public/ui/astryx-"]'))return Promise.resolve();
  return styles||(styles=new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=document.querySelector('script[data-astryx-css]').dataset.astryxCss;link.onload=resolve;link.onerror=()=>reject(Error('Component styles failed to load'));document.head.append(link);}));
}
const preloadViewer=()=>viewer||(viewer=Promise.all([import('./viewer.jsx'),ensureStyles()]).then(([module])=>module));
document.addEventListener('pointerover',event=>{if(event.target.closest?.('[data-preview]'))preloadViewer().catch(()=>{});},{passive:true});
document.addEventListener('focusin',event=>{if(event.target.closest?.('[data-preview]'))preloadViewer().catch(()=>{});});
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-preview]');if(!button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(!document.querySelector('[data-ui-lightbox]'))return;
  event.preventDefault();try{(await preloadViewer()).openPreview(button);}catch(error){console.error('Image preview failed; opening original.',error);location.href=button.dataset.preview;}
});
