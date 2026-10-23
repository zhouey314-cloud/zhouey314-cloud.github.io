/* Optional motion and reading cues. All identity and evidence remain in HTML. */
(() => {
  'use strict';
  const root = document.documentElement;
  const progress = document.querySelector('[data-reading-progress]');
  const story = document.querySelector('.practice-story');
  const stage = story?.querySelector('[data-practice-stage]');
  const steps = [...(story?.querySelectorAll('[data-practice-step]') || [])];
  const panels = [...(stage?.querySelectorAll('[data-scene-panel]') || [])];
  const sceneLinks = [...(story?.querySelectorAll('[data-scene-link]') || [])];
  const chapterLinks = [...document.querySelectorAll('[data-chapter-link]')]
    .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(({ section }) => section);
  const art = document.querySelector('[data-field-art]');
  const sculpture = art?.querySelector('.art-sculpture');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  let scrollFrame = 0;
  let pointerFrame = 0;
  let activeScene = null;
  let activeChapter = null;
  let artBounds = null;
  let pointerPosition = null;

  const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

  function selectScene(scene) {
    if (!stage || !scene || activeScene === scene) return;
    activeScene = scene;
    stage.dataset.scene = scene;
    panels.forEach((panel) => { panel.hidden = panel.dataset.scenePanel !== scene; });
    sceneLinks.forEach((link) => {
      if (link.dataset.sceneLink === scene) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  }

  function updateStory() {
    if (!stage || !steps.length) return;
    const readingLine = innerHeight * 0.5;
    let nearestStep = steps[0];
    let nearestDistance = Infinity;
    steps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      // A chapter spanning the reading line wins; gaps use the nearest edge.
      const distance = Math.max(rect.top - readingLine, readingLine - rect.bottom, 0);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStep = step;
      }
    });
    selectScene(nearestStep.dataset.practiceStep);
  }

  function updateChapters() {
    if (!chapterLinks.length) return;
    const readingLine = Math.min(240, innerHeight * 0.3);
    const current = chapterLinks.find(({ section }) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= readingLine && rect.bottom > readingLine;
    })?.section.id || null;
    if (activeChapter === current) return;
    activeChapter = current;
    chapterLinks.forEach(({ link, section }) => {
      if (section.id === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function updateReading() {
    scrollFrame = 0;
    if (document.hidden) return;
    const range = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${range > 0 ? clamp(scrollY / range, 0, 1) : 0})`;
    updateStory();
    updateChapters();
  }

  function scheduleReading() {
    artBounds = null;
    if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(updateReading);
  }

  function mayTilt() {
    return sculpture && finePointer.matches && !reduced.matches
      && root.dataset.motion !== 'off' && !document.hidden
      && !navigator.connection?.saveData;
  }

  function resetSculpture() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerPosition = null;
    artBounds = null;
    ['--pointer-x', '--pointer-y', '--pointer-r'].forEach((property) => {
      sculpture?.style.removeProperty(property);
    });
  }

  function updateSculpture() {
    pointerFrame = 0;
    if (!mayTilt() || !pointerPosition) {
      resetSculpture();
      return;
    }
    const rect = artBounds || (artBounds = art.getBoundingClientRect());
    if (!rect.width || !rect.height) return;
    const x = clamp(((pointerPosition.x - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = clamp(((pointerPosition.y - rect.top) / rect.height) * 2 - 1, -1, 1);
    // Only the artwork moves; links and other interaction targets never shift.
    sculpture.style.setProperty('--pointer-x', `${(x * 8).toFixed(2)}px`);
    sculpture.style.setProperty('--pointer-y', `${(y * 8).toFixed(2)}px`);
    sculpture.style.setProperty('--pointer-r', `${(x * 3).toFixed(2)}deg`);
  }

  art?.addEventListener('pointermove', (event) => {
    if (!mayTilt() || event.pointerType === 'touch') return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updateSculpture);
  }, { passive: true });
  art?.addEventListener('pointerleave', resetSculpture);
  art?.addEventListener('pointercancel', resetSculpture);

  function updateMotion() {
    if (!mayTilt()) resetSculpture();
    scheduleReading();
  }

  reduced.addEventListener('change', updateMotion);
  finePointer.addEventListener('change', updateMotion);
  if ('MutationObserver' in window) {
    new MutationObserver(updateMotion).observe(root, {
      attributes: true,
      attributeFilter: ['data-motion'],
    });
  }

  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', () => {
    resetSculpture();
    scheduleReading();
  }, { passive: true });
  window.addEventListener('load', scheduleReading, { once: true });
  window.addEventListener('pageshow', scheduleReading);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      resetSculpture();
    } else scheduleReading();
  });
  // Keep anchors native: scroll, focus, keyboard access and history stay intact.
  updateReading();

  const copyButton = document.querySelector('[data-copy-email]');
  const feedback = document.querySelector('[data-copy-feedback]');
  copyButton?.addEventListener('click', async () => {
    if (!feedback) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText('zhouey314@gmail.com');
      feedback.textContent = '邮箱已复制，可以粘贴到你的邮件应用。';
    } catch {
      feedback.textContent = '可长按或选中邮箱地址复制，也可以点击地址直接发邮件。';
    }
  });
})();
