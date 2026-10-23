/* Native reading first. GSAP is a desktop-only, optional enhancement. */
(() => {
  'use strict';
  const root = document.documentElement;
  const story = document.querySelector('#story');
  const stage = document.querySelector('[data-story-stage]');
  const steps = [...document.querySelectorAll('[data-story-step]')];
  const panels = [...document.querySelectorAll('[data-story-panel]')];
  const chapters = [...document.querySelectorAll('[data-chapter-link]')].map(link => ({link, section:document.getElementById(link.hash.slice(1))}));
  const progress = document.querySelector('[data-reading-progress]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1000px)');
  let frame = 0, media = null, loading = null, active = -1;
  const allowMotion = () => root.dataset.motion !== 'off' && !reduced.matches && !navigator.connection?.saveData;

  function movePanel(panel, destination) {
    const focus = panel.contains(document.activeElement) ? document.activeElement : null;
    panel.hidden = false;
    destination.append(panel);
    focus?.focus({preventScroll:true});
  }
  function choose(index) {
    if (!story?.hasAttribute('data-story-enhanced')) return;
    // Keep the focused screenshot visible across responsive DOM moves.
    const focused = panels.findIndex(panel => panel.contains(document.activeElement));
    if (focused >= 0) index = focused;
    if (active === index) return;
    active = index;
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    steps.forEach((step, i) => step.classList.toggle('is-current', i === index));
    if (allowMotion()) window.gsap.fromTo(panels[index], {opacity:.75}, {opacity:1,duration:.28,overwrite:true,clearProps:'opacity'});
  }
  function updateReading() {
    frame = 0;
    if (document.hidden) return;
    const range = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0})`;
    const line = Math.min(240, innerHeight * .3);
    const current = chapters.find(({section}) => { const r=section.getBoundingClientRect();return r.top<=line && r.bottom>line; });
    chapters.forEach(({link}) => {if (link === current?.link) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');});
    document.querySelectorAll('.site-nav a[href^="#"]').forEach(link => {if (link.hash === current?.link.hash) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');});
  }
  const schedule = () => { if (!frame && !document.hidden) frame=requestAnimationFrame(updateReading); };
  function nearestStep() {
    const line=innerHeight*.5;
    let index=0, distance=Infinity;
    steps.forEach((step,i) => {const r=step.getBoundingClientRect();const d=Math.max(r.top-line,line-r.bottom,0);if(d<distance){distance=d;index=i;}});
    choose(index);
  }
  function reset() {
    media?.revert(); media=null;
    panels.forEach((panel,i) => { movePanel(panel,steps[i]);panel.style.removeProperty('opacity'); });
    steps.forEach(step=>step.classList.remove('is-current'));
    story?.removeAttribute('data-story-enhanced'); active=-1;
  }
  function setup() {
    reset();
    if (!allowMotion() || !window.gsap || !window.ScrollTrigger || !stage) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    media=window.gsap.matchMedia();
    media.add({desktop:'(min-width: 1000px)',reduced:'(prefers-reduced-motion: reduce)'}, context => {
      if (!context.conditions.desktop || context.conditions.reduced || !allowMotion()) return;
      story.setAttribute('data-story-enhanced','');
      panels.forEach(panel=>movePanel(panel,stage));
      const trigger=window.ScrollTrigger.create({trigger:'.story-steps',start:'top center',end:'bottom center',onUpdate:nearestStep,onRefresh:nearestStep});
      nearestStep();
      return () => {
        trigger.kill();
        panels.forEach((panel,i) => {window.gsap.killTweensOf(panel);movePanel(panel,steps[i]);panel.style.removeProperty('opacity');});
        steps.forEach(step=>step.classList.remove('is-current'));
        story.removeAttribute('data-story-enhanced');active=-1;
      };
    });
  }
  function loadScript(src) {
    return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('Optional animation unavailable'));};document.head.append(script);});
  }
  async function updateMotion() {
    if (!desktop.matches || !allowMotion()) {reset();schedule();return;}
    if (!window.gsap || !window.ScrollTrigger) {
      loading ||= (async()=>{await loadScript('/public/vendor/gsap-3.15.0/gsap.min.js');await loadScript('/public/vendor/gsap-3.15.0/ScrollTrigger.min.js');})();
      try {await loading;} catch {reset();return;}
    }
    if (desktop.matches && allowMotion()) setup();
    schedule();
  }
  new MutationObserver(updateMotion).observe(root,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change',updateMotion);
  desktop.addEventListener('change',updateMotion);
  stage?.addEventListener('focusout',()=>requestAnimationFrame(nearestStep));
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('pageshow',()=>{updateMotion();schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else schedule();});
  window.addEventListener('pagehide',reset);
  updateReading();
  if ('requestIdleCallback' in window) requestIdleCallback(updateMotion,{timeout:1200}); else setTimeout(updateMotion,200);

  const copy=document.querySelector('[data-copy-email]');
  const feedback=document.querySelector('[data-copy-feedback]');
  copy?.addEventListener('click',async()=>{
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable');
      const email=document.querySelector('.email-row a').textContent.trim();
      await navigator.clipboard.writeText(email);
      feedback.textContent='邮箱已复制，可以粘贴到你的邮件应用。';
    } catch {feedback.textContent='可长按或选中邮箱地址复制，也可以点击地址直接发邮件。';}
  });
})();
