/* Native scrolling owns the page. Only small visual states follow it. */
(() => {
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('[data-reading-progress]');
  const sections = [...document.querySelectorAll('section[data-chapter]')];
  const selectedProjects = document.getElementById('selected-projects');
  const garden = document.getElementById('top');
  let frame = 0;
  function update() {
    frame = 0;
    const extent = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${extent > 0 ? scrollY / extent : 0})`;
    // Native anchors stop below scroll-padding. Use that same reading line for
    // the active chapter, rather than the old 54px point above the destination.
    const readingLine = Math.max(header?.getBoundingClientRect().bottom || 0, parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) + 8;
    const section = sections.find(s => { const r = s.getBoundingClientRect(); return r.top <= readingLine && r.bottom > readingLine; }) || sections[0];
    const onPaper = ['work', 'engineering', 'about'].includes(section?.dataset.chapter);
    header?.classList.toggle('is-on-paper', onPaper);
    header?.classList.toggle('is-outside-garden', garden.getBoundingClientRect().bottom <= readingLine);
    if (section) document.documentElement.dataset.chapter = section.dataset.chapter;
    const currentId = section?.id === 'work' && selectedProjects?.getBoundingClientRect().top <= readingLine ? 'selected-projects' : section?.id;
    header?.querySelectorAll('.site-nav a[href^="#"]').forEach(a => {
      if (a.hash === '#' + currentId) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  const request = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', request, { passive: true }); addEventListener('resize', request, { passive: true });
  addEventListener('pageshow', request); addEventListener('hashchange', request); update();
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
