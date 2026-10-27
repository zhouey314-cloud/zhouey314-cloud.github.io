/*
 * Small, optional navigation feedback adapted from ThreeUI AnimatedTopDock.
 * Copyright (c) 2026 Meng To — MIT.
 * Upstream: MengTo/threeui@68802d5428071ada5c20db8094b1649e6bb770ed
 * Full notice and adaptation details: /public/vendor/threeui/top-dock-source.md
 *
 * Links, their hit areas, focus outlines and native activation never move.
 * Only an inner label rises, by at most two pixels. No click/key interception.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const precise = matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = matchMedia('(min-width: 1000px)');
  const connection = navigator.connection;
  const clamp = value => Math.max(0, Math.min(1, value));
  let release = null;

  function mount() {
    if (release) return;
    const nav = document.querySelector('.portfolio-home .site-nav');
    if (!nav) return;
    const links = [...nav.querySelectorAll(':scope > a[href]')];
    if (!links.length) return;

    const originalState = nav.getAttribute('data-dock-state');
    const items = links.map(link => {
      const label = document.createElement('span');
      label.setAttribute('data-dock-label', '');
      label.style.display = 'inline-block';
      label.append(...link.childNodes);
      link.append(label);
      return {
        link, label, center: 0, value: 0, velocity: 0, target: 0,
        near: link.getAttribute('data-dock-near'),
        proximity: link.style.getPropertyValue('--dock-proximity'),
        proximityPriority: link.style.getPropertyPriority('--dock-proximity')
      };
    });

    let frame = 0;
    let lastTime = 0;
    let disposed = false;
    const allowed = () => !disposed && desktop.matches && precise.matches &&
      !reduced.matches && root.dataset.motion !== 'off' &&
      !connection?.saveData && !document.hidden && nav.clientWidth > 0;
    const focused = () => nav.contains(document.activeElement);

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      items.forEach(item => {
        item.value = item.velocity = item.target = 0;
        item.label.style.removeProperty('transform');
        item.link.style.removeProperty('--dock-proximity');
        item.link.removeAttribute('data-dock-near');
      });
      nav.dataset.dockState = allowed() ? (focused() ? 'focus' : 'idle') : 'static';
    }

    function measure() {
      if (disposed) return;
      stop();
      items.forEach(item => {
        const bounds = item.link.getBoundingClientRect();
        item.center = bounds.left + bounds.width * .5;
      });
    }

    function draw(now) {
      frame = 0;
      if (!allowed() || focused()) { stop(); return; }
      const delta = lastTime ? Math.min(2, Math.max(.25, (now - lastTime) / (1000 / 60))) : 1;
      lastTime = now;
      let moving = false;
      let active = false;
      items.forEach(item => {
        // Upstream's spring and damping, constrained to a stationary link box.
        item.velocity += (item.target - item.value) * .19 * delta;
        item.velocity *= Math.pow(.7, delta);
        item.value += item.velocity * delta;
        if (Math.abs(item.target - item.value) < .001 && Math.abs(item.velocity) < .001) {
          item.value = item.target;
          item.velocity = 0;
        } else moving = true;
        const value = clamp(item.value);
        if (value) {
          item.label.style.transform = `translateY(${(-2 * value).toFixed(3)}px)`;
          item.link.style.setProperty('--dock-proximity', value.toFixed(3));
        } else {
          item.label.style.removeProperty('transform');
          item.link.style.removeProperty('--dock-proximity');
        }
        active ||= item.target > 0;
      });
      nav.dataset.dockState = active ? 'active' : 'idle';
      // Unlike the demo controller, a resting dock consumes no animation frames.
      if (moving) frame = requestAnimationFrame(draw);
      else lastTime = 0;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function onPointerMove(event) {
      if (event.pointerType === 'touch' || !allowed() || focused()) return;
      let changed = false;
      items.forEach(item => {
        const proximity = clamp(1 - Math.abs(event.clientX - item.center) / 100);
        // ThreeUI's smoothstep proximity field: gentle influence on neighbours.
        const influence = proximity * proximity * (3 - 2 * proximity);
        changed ||= Math.abs(influence - item.target) > .0001;
        item.target = influence;
        if (influence > .08) item.link.setAttribute('data-dock-near', 'true');
        else item.link.removeAttribute('data-dock-near');
      });
      if (changed) schedule();
    }

    function leave() {
      if (!allowed() || focused()) { stop(); return; }
      const moving = items.some(item => item.value || item.velocity || item.target);
      items.forEach(item => {
        item.target = 0;
        item.link.removeAttribute('data-dock-near');
      });
      if (moving) schedule();
    }

    // Keyboard focus immediately returns every label to its reading position.
    const onFocusOut = () => queueMicrotask(() => { if (!disposed) measure(); });
    const motionObserver = new MutationObserver(measure);
    motionObserver.observe(root, {attributes: true, attributeFilter: ['data-motion']});
    const sizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    sizeObserver?.observe(nav);
    nav.addEventListener('pointerenter', measure, {passive: true});
    nav.addEventListener('pointermove', onPointerMove, {passive: true});
    nav.addEventListener('pointerleave', leave, {passive: true});
    nav.addEventListener('pointercancel', stop, {passive: true});
    nav.addEventListener('focusin', stop);
    nav.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', measure, {passive: true});
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', measure);
    reduced.addEventListener('change', measure);
    precise.addEventListener('change', measure);
    desktop.addEventListener('change', measure);
    connection?.addEventListener?.('change', measure);
    document.fonts?.ready.then(() => { if (!disposed) measure(); });
    measure();

    release = () => {
      disposed = true;
      stop();
      motionObserver.disconnect();
      sizeObserver?.disconnect();
      nav.removeEventListener('pointerenter', measure);
      nav.removeEventListener('pointermove', onPointerMove);
      nav.removeEventListener('pointerleave', leave);
      nav.removeEventListener('pointercancel', stop);
      nav.removeEventListener('focusin', stop);
      nav.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', measure);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', measure);
      reduced.removeEventListener('change', measure);
      precise.removeEventListener('change', measure);
      desktop.removeEventListener('change', measure);
      connection?.removeEventListener?.('change', measure);
      items.forEach(item => {
        item.label.replaceWith(...item.label.childNodes);
        if (item.near !== null) item.link.setAttribute('data-dock-near', item.near);
        else item.link.removeAttribute('data-dock-near');
        if (item.proximity) item.link.style.setProperty('--dock-proximity', item.proximity, item.proximityPriority);
        else item.link.style.removeProperty('--dock-proximity');
      });
      if (originalState !== null) nav.setAttribute('data-dock-state', originalState);
      else nav.removeAttribute('data-dock-state');
      release = null;
    };
  }

  window.addEventListener('pagehide', () => release?.());
  window.addEventListener('pageshow', mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
})();
