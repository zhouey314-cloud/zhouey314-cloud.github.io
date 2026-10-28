// Fuse searches only the public portfolio index. It never changes RAG retrieval.
const form = document.querySelector('.archive-search');
if (form) {
  const input = form.querySelector('input');
  const rows = [...document.querySelectorAll('[data-category]')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const records = rows.map((row, index) => ({index, name:row.dataset.projectName, text:row.innerText}));
  let engine;
  // Exact substring matching remains available if the optional fuzzy module fails.
  import('/public/vendor/fuse/fuse.js').then(({default:Fuse}) => {
    engine = new Fuse(records, {keys:[{name:'name',weight:.6},{name:'text',weight:.4}], threshold:.3, ignoreLocation:true});
    update();
  }).catch(error => {console.warn('Portfolio fuzzy search unavailable; using exact matching.', error);});
  function update() {
    const query = input.value.trim();
    const category = buttons.find(b => b.getAttribute('aria-pressed') === 'true')?.dataset.filter || 'all';
    const indices = new Set(query ? (engine ? engine.search(query).map(r => r.item.index) : records.filter(r => r.text.toLowerCase().includes(query.toLowerCase())).map(r => r.index)) : rows.map((_,i)=>i));
    let count=0;
    rows.forEach((row,i) => {row.hidden = !indices.has(i) || (category !== 'all' && row.dataset.category !== category); if(!row.hidden)count++;});
    document.querySelector('[data-filter-result]').textContent = `显示 ${count} 个项目${query ? ' · 搜索：'+query : ''}`;
    document.querySelector('[data-archive-empty]').hidden = count > 0;
    const url = new URL(location.href); query ? url.searchParams.set('q',query) : url.searchParams.delete('q');
    category !== 'all' ? url.searchParams.set('category',category) : url.searchParams.delete('category');
    history.replaceState(null,'',url);
  }
  form.addEventListener('submit',e=>{e.preventDefault();update();});
  form.addEventListener('reset',()=>{input.value='';buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));update();});
  input.addEventListener('input',update);
  buttons.forEach(b=>b.addEventListener('click',update));
  const params = new URLSearchParams(location.search); input.value = (params.get('q') || '').slice(0,100);
  const category = params.get('category'); if(buttons.some(b=>b.dataset.filter===category))buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
  update();
}
