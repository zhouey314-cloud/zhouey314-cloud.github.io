/* Native scrolling owns the page. Only small visual states follow it. */
(() => {
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('[data-reading-progress]');
  const sections = [...document.querySelectorAll('section[data-chapter]')];
  let frame = 0;
  function update() {
    frame = 0;
    const extent = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${extent > 0 ? scrollY / extent : 0})`;
    const section = sections.find(s => { const r = s.getBoundingClientRect(); return r.top <= 54 && r.bottom > 54; }) || sections[0];
    const onPaper = ['work', 'about'].includes(section?.dataset.chapter);
    header?.classList.toggle('is-on-paper', onPaper);
    if (section) document.documentElement.dataset.chapter = section.dataset.chapter;
    header?.querySelectorAll('.site-nav a[href^="#"]').forEach(a => {
      if (a.hash === '#' + section?.id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  const request = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', request, { passive: true }); addEventListener('resize', request, { passive: true });
  addEventListener('pageshow', request); update();
  const copy = document.querySelector('[data-copy-email]');
  const feedback = document.querySelector('[data-copy-feedback]');
  copy?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable');
      await navigator.clipboard.writeText(document.querySelector('.email-row a').textContent.trim());
      feedback.textContent = '邮箱已复制，可以粘贴到你的邮件应用。';
    } catch {
      feedback.textContent = '可长按或选中邮箱地址复制，也可以点击地址直接发邮件。';
    }
  });
})();
