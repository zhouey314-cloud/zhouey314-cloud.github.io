/* Synthetic, in-memory interaction study. No network, storage or model calls. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stages = [['Qualified','初步确认'],['Solution fit','方案沟通'],['Proposal','报价'],['Negotiation','协商'],['Won','已完成'],['Lost','未继续']];
  const labels = {dashboard:['工作概览','OVERVIEW'],pipeline:['销售管线','PIPELINE'],opportunity:['商机记录','RECORDS'],quotation:['报价跟进','PROPOSAL'],contract:['协商与确认','NEGOTIATION'],delivery:['交付跟进','HANDOFF'],analytics:['阶段分布','ANALYTICS'],assistant:['规则助手示例','FIXED EXAMPLE']};
  const stageName = value => stages.find(([id]) => id === value)?.[1] || value;
  const initial = [
    ['Qualified','Confirm solution scope'],['Qualified','Discovery follow-up'],['Solution fit','Confirm user roles'],['Solution fit','Verify integration scope'],['Proposal','Quotation review'],['Negotiation','Contract redline']
  ];
  const records = initial.map(([stage,action],i) => ({id:`sample-${i+1}`,title:`Demo Opportunity 0${i+1}`,account:`Sample Account 0${i+1}`,owner:'Ethan',stage,action,updated:Date.UTC(2026,9,30,10,i),notes:[],lossReason:''}));
  let sequence = 0, clock = Date.now(), selectedId = records[0].id, currentView = 'dashboard', menuOpen = false, addedFocus = null;
  const drawer = $('[data-drawer]'), addDialog = $('[data-add-dialog]'), commandDialog = $('[data-command-dialog]');
  const search = $('#crm-search'), filter = $('#crm-stage-filter'), sort = $('#crm-sort');
  const sidebar = $('[data-sidebar]'), workspace = $('#workspace'), menuButton = $('[data-menu]');
  const mobile = matchMedia('(max-width:760px)');
  const say = text => { $('[data-status]').textContent = text; };
  const currentRecord = () => records.find(r => r.id === selectedId) || records[0];
  const updated = value => new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  const stageOptions = stages.map(([id,label]) => `<option value="${id}">${label}</option>`).join('');
  filter.insertAdjacentHTML('beforeend',stageOptions);
  $('#detail-stage').innerHTML = stageOptions;
  $('#add-stage').innerHTML = stages.filter(([id]) => id !== 'Lost').map(([id,label])=>`<option value="${id}">${label}</option>`).join('');

  function visibleRecords() {
    const query = search.value.trim().toLocaleLowerCase();
    return records.filter(r => (filter.value === 'all' || r.stage === filter.value) && `${r.title} ${r.account} ${r.owner} ${r.action}`.toLocaleLowerCase().includes(query)).sort((a,b) => sort.value === 'title' ? a.title.localeCompare(b.title,'zh-CN') : sort.value === 'stage' ? stages.findIndex(([id])=>id===a.stage)-stages.findIndex(([id])=>id===b.stage) || b.updated-a.updated : b.updated-a.updated);
  }
  function renderTable() {
    const list = visibleRecords();
    $('[data-opportunity-rows]').innerHTML = list.map(r => `<tr><td><button class="record-open" type="button" data-open-id="${r.id}">${escape(r.title)}</button></td><td>${escape(r.account)}</td><td><span class="status">${stageName(r.stage)}</span></td><td data-column="owner">${escape(r.owner)}</td><td data-column="action">${escape(r.action)}</td><td data-column="updated">${updated(r.updated)}</td></tr>`).join('');
    $('[data-empty]').hidden = list.length !== 0;
    $('[data-result-count]').textContent = `显示 ${list.length} / ${records.length} 条商机`;
    $('[data-export]').disabled = list.length === 0;
    for (const checkbox of $$('[data-column-toggle]')) for (const cell of $$(`[data-column="${checkbox.dataset.columnToggle}"]`)) cell.hidden = !checkbox.checked;
  }
  const card = r => `<article class="record-card"><span>${stageName(r.stage)} / SYNTHETIC</span><h3>${escape(r.title)}</h3><p>${escape(r.account)} · ${escape(r.owner)}</p><p>${escape(r.action)}</p><p>${r.notes.length} 条跟进备注</p><button class="record-open" type="button" data-open-id="${r.id}">打开与更新记录 ↗</button></article>`;
  function renderContext() {
    const r = currentRecord(); $('[data-assistant-title]').textContent = r.title;
    $('[data-assistant-context]').innerHTML = [['账户',r.account],['阶段',stageName(r.stage)],['下一步',r.action]].map(([k,v])=>`<div><dt>${k}</dt><dd>${escape(v)}</dd></div>`).join('');
  }
  function render() {
    const counts = new Map(stages.map(([id])=>[id,records.filter(r=>r.stage===id).length]));
    const noteCount = records.reduce((n,r)=>n+r.notes.length,0);
    for (const [name,value] of Object.entries({active:records.filter(r=>!['Won','Lost'].includes(r.stage)).length,proposal:counts.get('Proposal'),negotiation:counts.get('Negotiation'),notes:noteCount})) $(`[data-metric="${name}"]`).textContent = String(value).padStart(2,'0');
    const bars = stages.map(([id,label])=>`<div><span>${label}</span><i style="--w:${counts.get(id)/records.length*100}%"></i><b data-stage-count="${id}">${counts.get(id)}</b></div>`).join('');
    $('[data-stage-bars]').innerHTML = bars; $('[data-distribution]').innerHTML = bars;
    $('[data-total]').textContent = `共 ${records.length} 条合成商机`;
    $('[data-queue-count]').textContent = `${records.length} 条记录`;
    $('[data-action-list]').innerHTML = [...records].sort((a,b)=>b.updated-a.updated).slice(0,4).map(r=>`<li><div><strong>${escape(r.action)}</strong><small>${escape(r.title)} · ${stageName(r.stage)}</small></div><button type="button" data-open-id="${r.id}" aria-label="打开 ${escape(r.title)}">查看 ↗</button></li>`).join('');
    $('[data-board]').innerHTML = stages.map(([id,label])=>`<section class="board-column"><header><span>${label}</span><b data-board-count="${id}">${counts.get(id)}</b></header>${records.filter(r=>r.stage===id).map(r=>`<button class="deal-card" type="button" data-open-id="${r.id}"><span>${escape(r.account)}</span><h3>${escape(r.title)}</h3><p>${escape(r.action)}</p><small>${escape(r.owner)} · ${updated(r.updated)}</small></button>`).join('') || '<p class="column-empty">暂无记录</p>'}</section>`).join('');
    for (const [selector,allowed] of [['[data-quotation]',['Proposal','Negotiation','Won']],['[data-contract]',['Negotiation','Won']],['[data-delivery]',['Won']]]) {
      const matches = records.filter(r=>allowed.includes(r.stage));
      $(selector).innerHTML = matches.length ? matches.map(card).join('') : '<p class="empty-state">当前没有对应阶段的商机。可从商机记录更新阶段与下一步。</p>';
    }
    $('[data-followup]').innerHTML = [['全部商机',records.length],['已完成',counts.get('Won')],['未继续',counts.get('Lost')],['跟进备注',noteCount]].map(([label,n])=>`<li><b>${label}</b><span>${n}</span></li>`).join('');
    renderTable(); renderContext();
  }
  function renderDrawerSummary() {
    const r = currentRecord(); $('[data-drawer-title]').textContent = r.title;
    $('[data-drawer-facts]').innerHTML = [['账户',r.account],['负责人',r.owner],['最近更新',updated(r.updated)]].map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('');
    $('[data-notes]').innerHTML = r.notes.length ? r.notes.map(n=>`<li><p>${escape(n.text)}</p><small>${updated(n.at)}</small></li>`).join('') : '<li>还没有跟进备注。</li>';
  }
  function renderDrawer() {
    const r = currentRecord(); renderDrawerSummary();
    $('#detail-stage').value = r.stage; $('#detail-action').value = r.action; $('#detail-loss').value = r.lossReason;
    $('#detail-loss').required = r.stage === 'Lost';
  }
  function setMenu(open, restore = false) {
    menuOpen = mobile.matches && open;
    sidebar.classList.toggle('open',menuOpen); sidebar.inert = mobile.matches && !menuOpen;
    workspace.inert = menuOpen; $('[data-menu-close].menu-scrim').hidden = !menuOpen;
    menuButton.setAttribute('aria-expanded',String(menuOpen));
    if (menuOpen) { sidebar.setAttribute('role','dialog'); sidebar.setAttribute('aria-modal','true'); $('[data-menu-close]').focus(); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); if (restore && mobile.matches) menuButton.focus(); }
  }
  function switchView(name, changeURL = true, focus = true) {
    currentView = Object.hasOwn(labels,name) ? name : 'dashboard';
    for (const panel of $$('[data-panel]')) panel.classList.toggle('active',panel.dataset.panel === currentView);
    for (const link of $$('[data-view]')) { const active = link.dataset.view === currentView; link.classList.toggle('active',active); if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); }
    $('[data-title]').textContent = labels[currentView][0]; $('[data-crumb]').textContent = labels[currentView][1];
    if (changeURL && location.hash !== '#'+currentView) history.pushState(null,'','#'+currentView);
    setMenu(false); window.scrollTo({top:0,behavior:'instant'});
    if (focus) { $('[data-title]').tabIndex = -1; $('[data-title]').focus({preventScroll:true}); }
  }
  function openRecord(id) {
    if (!records.some(r=>r.id===id)) return;
    selectedId=id; renderDrawer(); renderContext(); $('[data-note-form]').reset(); $('[data-detail-feedback]').textContent='';
    drawer.showModal();
  }
  function openAdd() { $('[data-add-form]').reset(); for (const input of $$('[data-add-form] [required]')) input.setCustomValidity(''); addDialog.showModal(); }
  function commandResults() {
    const query = $('#command-search').value.trim().toLocaleLowerCase();
    const matching = Object.entries(labels).filter(([id,[label]])=>(id+' '+label).toLocaleLowerCase().includes(query));
    $('[data-command-results]').innerHTML = matching.map(([id,[label]])=>`<button type="button" data-command-view="${id}">${label} <span aria-hidden="true">↗</span></button>`).join('');
    $('[data-command-empty]').hidden = matching.length !== 0;
  }
  function openCommand() { if ($('dialog[open]')) return; $('#command-search').value=''; commandResults(); commandDialog.showModal(); $('#command-search').focus(); }
  const requiredText = form => { for (const input of form.querySelectorAll('input[required],textarea[required]')) input.setCustomValidity(input.value.trim() ? '' : '请填写具体内容，不能只输入空白。'); return form.reportValidity(); };

  document.addEventListener('click',event=>{
    const view = event.target.closest('[data-view],[data-view-link]');
    if (view) { event.preventDefault(); switchView(view.dataset.view || view.dataset.viewLink); }
    const record = event.target.closest('[data-open-id]'); if (record) openRecord(record.dataset.openId);
    if (event.target.closest('[data-open-first]')) openRecord(records[0].id);
    if (event.target.closest('[data-add]')) openAdd();
    if (event.target.closest('[data-command]')) openCommand();
    const command = event.target.closest('[data-command-view]'); if (command) { commandDialog.close(); switchView(command.dataset.commandView); }
    if (event.target.closest('[data-close-dialog]')) event.target.closest('dialog').close();
    if (event.target.closest('[data-menu]')) setMenu(!menuOpen);
    if (event.target.closest('[data-menu-close]')) setMenu(false,true);
  });
  document.addEventListener('keydown',event=>{
    if ((event.metaKey||event.ctrlKey) && event.key.toLowerCase()==='k') { event.preventDefault(); openCommand(); }
    if (menuOpen && event.key==='Escape') { event.preventDefault(); setMenu(false,true); }
    if (menuOpen && event.key==='Tab') {
      const focusable=[...sidebar.querySelectorAll('a,button')].filter(e=>e.getClientRects().length);const first=focusable[0],last=focusable.at(-1);
      if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
    }
  });
  for (const form of $$('form')) form.addEventListener('input',()=>{for (const input of form.querySelectorAll('input,textarea')) input.setCustomValidity('');});
  $('[data-add-form]').addEventListener('submit',event=>{
    event.preventDefault(); const form=event.currentTarget; if (!requiredText(form)) return;
    const values=new FormData(form),title=values.get('title').trim(),account=values.get('account').trim();
    if (records.some(r=>r.title.toLocaleLowerCase()===title.toLocaleLowerCase() && r.account.toLocaleLowerCase()===account.toLocaleLowerCase())) { $('#add-title-input').setCustomValidity('同一账户已有这个名称的商机，请换一个名称。');form.reportValidity();return; }
    const record={id:`local-${++sequence}`,title,account,owner:values.get('owner').trim(),stage:values.get('stage'),action:values.get('action').trim(),updated:++clock,notes:[],lossReason:''};
    records.push(record); selectedId=record.id; addedFocus=record.id; search.value='';filter.value='all';sort.value='updated';render();addDialog.close();switchView('opportunity');say('已加入本次工作区：'+title+'。刷新后恢复初始样本。');
  });
  addDialog.addEventListener('close',()=>{if(addedFocus){$(`[data-opportunity-rows] [data-open-id="${addedFocus}"]`)?.focus();addedFocus=null;}});
  $('[data-detail-form]').addEventListener('submit',event=>{
    event.preventDefault(); const form=event.currentTarget;if(!requiredText(form))return;
    const values=new FormData(form),r=currentRecord();r.stage=values.get('stage');r.action=values.get('action').trim();r.lossReason=r.stage==='Lost'?values.get('lossReason').trim():'';r.updated=++clock;render();renderDrawer();$('[data-detail-feedback]').textContent='已更新本次记录；概览、管线和阶段图同步。';
  });
  $('#detail-stage').addEventListener('change',()=>{$('#detail-loss').required=$('#detail-stage').value==='Lost';$('#detail-loss').setCustomValidity('');});
  $('[data-note-form]').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget;if(!requiredText(form))return;const r=currentRecord();r.notes.push({text:$('#crm-note').value.trim(),at:++clock});r.updated=clock;form.reset();render();renderDrawerSummary();$('[data-detail-feedback]').textContent='备注已加入这条商机。';$('#crm-note').focus();
  });
  drawer.addEventListener('close',()=>{const trigger=$$(`[data-panel="${currentView}"] [data-open-id="${selectedId}"]`).find(e=>e.getClientRects().length);if(trigger)trigger.focus();else $('[data-title]').focus({preventScroll:true});});
  search.addEventListener('input',renderTable);filter.addEventListener('change',renderTable);sort.addEventListener('change',renderTable);
  for(const checkbox of $$('[data-column-toggle]'))checkbox.addEventListener('change',renderTable);
  $('[data-reset-filters]').addEventListener('click',()=>{search.value='';filter.value='all';sort.value='updated';renderTable();search.focus();});
  $('[data-export]').addEventListener('click',()=>{
    const list=visibleRecords();if(!list.length)return;
    const blob=new Blob([JSON.stringify({scope:'synthetic_in_memory',exported_at:new Date().toISOString(),filters:{query:search.value,stage:filter.value,sort:sort.value},records:list},null,2)+'\n'],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='enyu-crm-synthetic.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say(`已导出当前 ${list.length} 条合成商机，包含跟进备注。`);
  });
  $('#command-search').addEventListener('input',commandResults);
  commandDialog.addEventListener('keydown',event=>{
    if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
    const buttons=$$('[data-command-view]');if(!buttons.length)return;
    event.preventDefault();const index=buttons.indexOf(document.activeElement);
    if(index<0)buttons[event.key==='ArrowDown'?0:buttons.length-1].focus();
    else if(event.key==='ArrowUp' && index===0)$('#command-search').focus();
    else buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
  });
  for(const button of $$('[data-prompt]'))button.addEventListener('click',()=>{$('#assistant-input').value=button.dataset.prompt;$('#assistant-input').focus();});
  $('[data-assistant-form]').addEventListener('submit',event=>{event.preventDefault();if(!requiredText(event.currentTarget))return;$('[data-assistant-question]').textContent=$('#assistant-input').value.trim();$('[data-assistant-feedback]').textContent='已显示固定规则文案；没有模型请求，也没有修改或发送商机内容。';});
  mobile.addEventListener('change',()=>setMenu(false));
  window.addEventListener('popstate',()=>switchView(location.hash.slice(1),false));window.addEventListener('hashchange',()=>switchView(location.hash.slice(1),false));
  render();document.documentElement.classList.add('crm-ready');$('[data-static-fallback]').hidden=true;switchView(location.hash.slice(1),false,false);
})();
