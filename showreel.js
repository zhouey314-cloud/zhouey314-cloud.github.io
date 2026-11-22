(() => {
  const section = document.getElementById('showreel');
  if (!section) return;
  const frame = section.querySelector('[data-showreel-frame]');
  const status = section.querySelector('[data-showreel-status]');
  const edits = Array.from(section.querySelectorAll('[data-showreel-edit]'));
  const narrow = matchMedia('(max-width: 600px)');
  let player;
  let selected;

  function markCurrent(edit) {
    for (const link of edits) {
      if (link.dataset.showreelEdit === edit) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  }
  function syncCover() {
    if (!player) markCurrent(narrow.matches ? 'portrait' : 'landscape');
  }
  function offerDirectLink(link) {
    const direct = document.createElement('a');
    direct.href = link.href;
    direct.textContent = '直接打开视频';
    status.replaceChildren('如无法在此播放，可', direct, '。');
  }
  function play(edit) {
    const link = edits.find(item => item.dataset.showreelEdit === edit);
    if (!link) return;
    if (!player) {
      player = document.createElement('video');
      player.controls = true;
      player.playsInline = true;
      player.preload = 'none';
      player.tabIndex = 0;
      player.addEventListener('error', () => offerDirectLink(edits.find(item => item.dataset.showreelEdit === selected)));
      frame.replaceChildren(player);
    }
    if (selected !== edit || player.error) {
      selected = edit;
      markCurrent(edit);
      frame.dataset.layout = edit === 'portrait' ? 'portrait' : 'landscape';
      status.replaceChildren();
      player.setAttribute('aria-label', '个人作品短片，' + link.textContent.trim());
      player.poster = link.dataset.poster;
      const track = document.createElement('track');
      track.kind = 'captions';
      track.label = '中文画面与声音说明';
      track.srclang = 'zh';
      track.src = link.dataset.captions;
      player.replaceChildren(track);
      player.src = link.href;
    }
    player.focus({preventScroll:true});
    player.play().catch(error => {
      if (selected !== edit || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') status.textContent = '点播放器的播放键即可观看。';
      else offerDirectLink(link);
    });
  }
  section.addEventListener('click', event => {
    const link = event.target.closest('a[data-showreel-play], a[data-showreel-edit]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    play(link.dataset.showreelPlay || link.dataset.showreelEdit);
  });
  narrow.addEventListener('change', syncCover);
  syncCover();
})();
