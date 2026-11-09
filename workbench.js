// Native multi-page/fragment navigation. React owns each panel interior.
const links=[...document.querySelectorAll('.wb-tabs [data-workspace]')],panels=[...document.querySelectorAll('.wb-panel')];
document.querySelector('.wb-tabs').setAttribute('role','tablist');
links.forEach(link=>{link.id='tab-'+link.dataset.workspace;link.setAttribute('role','tab');link.setAttribute('aria-controls',link.dataset.workspace);});
panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+panel.id);panel.tabIndex=0;});
function selectWorkspace(id){
 if(!panels.some(p=>p.id===id))id='rag';
 links.forEach(link=>{const selected=link.dataset.workspace===id;link.setAttribute('aria-selected',String(selected));link.tabIndex=selected?0:-1;});
 panels.forEach(panel=>{panel.hidden=panel.id!==id;if(panel.hidden)panel.querySelectorAll('video').forEach(video=>video.pause());});
 document.documentElement.dataset.activeWorkspace=id;
 dispatchEvent(new CustomEvent('workbench:select',{detail:id}));
}
links.forEach((link,index)=>{
 link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.pushState(null,'','#'+link.dataset.workspace);selectWorkspace(link.dataset.workspace);});
 link.addEventListener('keydown',event=>{const i=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;if(i===null)return;event.preventDefault();links[i].focus();links[i].click();});
});
addEventListener('hashchange',()=>selectWorkspace(location.hash.slice(1)));
addEventListener('popstate',()=>selectWorkspace(location.hash.slice(1)));
selectWorkspace(location.hash.slice(1));

// Keep the movie URL inert until explicit playback intent, independently of
// React. preload=none is only a hint and Linux WebKit can otherwise fetch it.
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-start-video]');if(!button)return;
 const video=button.closest('.film-player').querySelector('video'),source=video.querySelector('source');
 if(!source.hasAttribute('src')){source.src=source.dataset.src;video.preload='metadata';video.load();}
 video.focus();
 video.play().catch(error=>{console.error('Workbench playback failed:',error);const status=button.closest('.film-stage').querySelector('[data-video-status]');status.textContent='视频播放失败，可使用下载原片或刷新页面重试。';status.dataset.error='true';});
});
