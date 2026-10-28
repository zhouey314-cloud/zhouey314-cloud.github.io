/* Native controls for the garden's project window and long-form case reading. */
(() => {
  'use strict';
  const motionAllowed = () => document.documentElement.dataset.motion === 'on' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const windowCard = document.querySelector('[data-hero-projects]');
  if (windowCard) {
    const stage = windowCard.querySelector('[data-hero-stage]');
    const buttons = [...windowCard.querySelectorAll('[data-hero-select]')];
    function select(button) {
      if (button.getAttribute('aria-pressed') === 'true') return;
      const template = windowCard.querySelector(`[data-hero-template="${button.dataset.heroSelect}"]`);
      if (!template) return;
      stage.getAnimations().forEach(animation => animation.cancel());
      stage.replaceChildren(template.content.cloneNode(true));
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      windowCard.querySelector('[data-hero-number]').textContent = String(buttons.indexOf(button) + 1).padStart(2, '0');
      windowCard.querySelector('[data-hero-status]').textContent = button.getAttribute('aria-label');
      if (motionAllowed()) stage.animate([{opacity: .35, transform: 'translateY(5px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 240, easing: 'ease-out'});
    }
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    windowCard.querySelector('.hero-project-switches').addEventListener('keydown', event => {
      if (!buttons.includes(event.target) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = buttons.indexOf(event.target);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus(); select(buttons[next]);
    });
    new MutationObserver(() => { if (!motionAllowed()) stage.getAnimations().forEach(a => a.cancel()); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion']});
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) stage.getAnimations().forEach(a => a.cancel()); });
  }

  const toc = document.querySelector('.case-toc');
  if (!toc) return;
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const chapters = links.map(link => document.getElementById(link.hash.slice(1)));
  const percent = toc.querySelector('[data-case-percent]');
  const progress = toc.querySelector('[data-case-progress]');
  let pending = 0;
  function update() {
    pending = 0;
    let current = 0;
    chapters.forEach((section, index) => { if (section && section.getBoundingClientRect().top <= 190) current = index; });
    links.forEach((link, index) => { if (index === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    const extent = document.documentElement.scrollHeight - innerHeight;
    const value = extent > 0 ? Math.max(0, Math.min(1, scrollY / extent)) : 1;
    if (percent) percent.textContent = Math.round(value * 100) + '%';
    if (progress) progress.style.transform = `scaleX(${value})`;
  }
  const request = () => { if (!pending) pending = requestAnimationFrame(update); };
  addEventListener('scroll', request, {passive: true});
  addEventListener('resize', request, {passive: true});
  addEventListener('pageshow', request);
  update();
})();
