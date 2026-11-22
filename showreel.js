(() => {
  const section = document.getElementById('showreel');
  if (!section) return;

  const frame = section.querySelector('[data-showreel-frame]');
  const status = section.querySelector('[data-showreel-status]');
  const replay = section.querySelector('[data-showreel-replay]');
  const direct = section.querySelector('[data-showreel-direct]');
  const coverPlay = frame.querySelector('[data-showreel-play="landscape"]');
  const edits = Array.from(section.querySelectorAll('[data-showreel-edit]'));
  let player;
  let selected;
  let attempt = 0;

  function select(link) {
    selected = link;
    direct.href = link.href;
    for (const edit of edits) {
      if (edit === link) edit.setAttribute('aria-current', 'true');
      else edit.removeAttribute('aria-current');
    }
  }

  function showControls() {
    const wasCovered = player.hidden;
    frame.dataset.layout = selected.dataset.showreelEdit;
    frame.dataset.playing = 'true';
    player.hidden = false;
    if (wasCovered && (document.activeElement === coverPlay || document.activeElement === selected)) {
      player.focus({ preventScroll: true });
    }
  }

  function restoreCover() {
    if (!player.isConnected) return;
    ++attempt;
    const hadFocus = document.activeElement === player;
    player.pause();
    player.remove();
    player.removeAttribute('src');
    player.load();
    frame.dataset.layout = 'landscape';
    delete frame.dataset.playing;
    replay.hidden = true;
    status.textContent = '短片未能在此加载。可重试，或使用“直接打开视频”。';
    if (hadFocus) coverPlay.focus({ preventScroll: true });
  }

  function play(link) {
    const request = ++attempt;
    if (!player) {
      player = document.createElement('video');
      player.controls = true;
      player.playsInline = true;
      player.preload = 'none';
      player.tabIndex = 0;
      player.addEventListener('error', restoreCover);
      player.addEventListener('playing', () => {
        if (!player.isConnected) return;
        showControls();
        replay.hidden = true;
        status.textContent = '';
      });
      player.addEventListener('ended', () => {
        if (!player.isConnected || !player.ended) return;
        replay.hidden = false;
        status.textContent = '看完还可以在工作台试问客服电话。示例资料只给了营业时间，我让工具在这种情况下提示证据不足。';
      });
      player.addEventListener('seeked', () => {
        if (player.ended || replay.hidden) return;
        replay.hidden = true;
        status.textContent = '';
      });
    }

    if (selected !== link || !player.isConnected) {
      player.pause();
      replay.hidden = true;
      select(link);
      player.setAttribute('aria-label', '个人作品短片，' + link.textContent.trim());
      player.poster = link.dataset.poster;
      const track = document.createElement('track');
      track.kind = 'captions';
      track.label = '中文画面与声音说明';
      track.srclang = 'zh';
      track.src = link.dataset.captions;
      player.replaceChildren(track);
      if (!player.isConnected) {
        player.hidden = true;
        frame.append(player);
      } else {
        frame.dataset.layout = link.dataset.showreelEdit;
      }
      status.textContent = '正在载入短片…';
      player.src = link.href;
    }

    player.play().catch(error => {
      if (request !== attempt || !player.isConnected) return;
      if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
        showControls();
        status.textContent = '可使用播放器的播放键观看。';
      } else {
        restoreCover();
      }
    });
  }

  replay.addEventListener('click', () => {
    player.focus({ preventScroll: true });
    player.currentTime = 0;
    play(selected);
  });

  section.addEventListener('click', event => {
    const link = event.target.closest('a[data-showreel-play], a[data-showreel-edit]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const edit = edits.find(item => item.dataset.showreelEdit === (link.dataset.showreelPlay || link.dataset.showreelEdit));
    if (!edit) return;
    event.preventDefault();
    play(edit);
  });

  document.addEventListener('play', event => {
    const active = event.target;
    if (!(active instanceof HTMLVideoElement) || active.paused) return;
    for (const other of document.querySelectorAll('video')) {
      if (other !== active && !other.paused) other.pause();
    }
  }, true);
  window.addEventListener('pagehide', () => {
    for (const video of document.querySelectorAll('video')) video.pause();
  });

  select(edits.find(link => link.dataset.showreelEdit === 'landscape'));
})();
