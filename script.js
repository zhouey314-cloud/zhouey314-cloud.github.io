/* Static content first. Native browser APIs provide optional interaction. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const motionButton = document.querySelector("[data-motion-toggle]");
  let savedMotion = null;
  try {
    savedMotion = localStorage.getItem("ethan-motion");
  } catch {
    /* storage is optional */
  }
  let motionOff = reduced.matches || savedMotion === "off";
  const running = new Set();
  const animate = (element, frames, duration = 300, delay = 0) => {
    if (!element || motionOff || !element.animate) return null;
    element.getAnimations().forEach((animation) => animation.cancel());
    const animation = element.animate(frames, {
      duration,
      delay,
      easing: "cubic-bezier(.22,1,.36,1)",
    });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  };
  function setMotion() {
    motionOff = reduced.matches || savedMotion === "off";
    root.dataset.motion = motionOff ? "off" : "on";
    if (motionOff) {
      running.forEach((animation) => animation.cancel());
      resetDesk();
    }
    if (motionButton) {
      motionButton.setAttribute("aria-pressed", String(motionOff));
      motionButton.setAttribute(
        "aria-label",
        reduced.matches
          ? "动效 关：系统已开启减少动态效果"
          : motionOff
            ? "动效 关：开启动效"
            : "动效 开：关闭装饰动效",
      );
      motionButton.querySelector("[data-motion-label]").textContent = motionOff
        ? "关"
        : "开";
      motionButton.disabled = reduced.matches;
    }
  }

  const header = document.querySelector(".site-header");
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const closeMenu = (returnFocus = false) => {
    header?.classList.remove("menu-open");
    menu?.setAttribute("aria-expanded", "false");
    if (menu) menu.lastElementChild.textContent = "＋";
    if (returnFocus) menu?.focus();
  };
  // A. Only decorative paper moves; all hit targets stay in their layout boxes.
  const desk = document.querySelector(".creator-desk");
  const decoration = document.querySelector("[data-desk-decoration]");
  let deskRect,
    pointerFrame = 0,
    pointerPosition,
    deskVisible = true;
  function resetDesk() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    decoration?.style.removeProperty("--desk-x");
    decoration?.style.removeProperty("--desk-y");
    decoration?.style.removeProperty("--desk-r");
  }
  function mayTilt() {
    return (
      !motionOff &&
      finePointer.matches &&
      deskVisible &&
      !document.hidden &&
      (navigator.hardwareConcurrency || 2) > 4 &&
      !navigator.connection?.saveData
    );
  }
  desk?.addEventListener("pointerenter", () => {
    deskRect = desk.getBoundingClientRect();
  });
  desk?.addEventListener("pointermove", (event) => {
    if (!mayTilt() || !deskRect) return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (!mayTilt()) return;
      const x = Math.max(
        -1,
        Math.min(
          1,
          ((pointerPosition.x - deskRect.left) / deskRect.width) * 2 - 1,
        ),
      );
      const y = Math.max(
        -1,
        Math.min(
          1,
          ((pointerPosition.y - deskRect.top) / deskRect.height) * 2 - 1,
        ),
      );
      decoration.style.setProperty("--desk-x", `${x * 5}px`);
      decoration.style.setProperty("--desk-y", `${y * 5}px`);
      decoration.style.setProperty("--desk-r", `${x * 1.5}deg`);
    });
  });
  desk?.addEventListener("pointerleave", resetDesk);
  window.addEventListener(
    "resize",
    () => {
      deskRect = null;
      resetDesk();
    },
    { passive: true },
  );
  window.addEventListener(
    "scroll",
    () => {
      deskRect = null;
      resetDesk();
    },
    { passive: true },
  );
  finePointer.addEventListener("change", resetDesk);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetDesk();
      running.forEach((animation) => animation.finish());
    }
  });
  if (desk && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      deskVisible = entries[0].isIntersecting;
      if (!deskVisible) resetDesk();
    }).observe(desk);
  }
  const deskTabs = [...document.querySelectorAll("[data-desk]")];
  function selectDesk(tab, focus = false) {
    deskTabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute("aria-controls"));
      panel.getAnimations().forEach((animation) => animation.cancel());
      panel.hidden = !selected;
    });
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    animate(panel, [
      { opacity: 0.65, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ]);
    if (focus) tab.focus();
  }
  deskTabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectDesk(tab));
    tab.addEventListener("keydown", (event) => {
      const next =
        event.key === "ArrowRight"
          ? (i + 1) % deskTabs.length
          : event.key === "ArrowLeft"
            ? (i + deskTabs.length - 1) % deskTabs.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? deskTabs.length - 1
                : null;
      if (next !== null) {
        event.preventDefault();
        selectDesk(deskTabs[next], true);
      }
    });
  });

  // B. A native modal makes the document inert and contains keyboard focus.
  const viewer = document.querySelector("[data-viewer]");
  let opener,
    closing = false,
    previousOverflow = "";
  document.querySelectorAll("[data-preview]").forEach((button) =>
    button.addEventListener("click", () => {
      if (!viewer?.showModal) {
        location.href = button.dataset.preview;
        return;
      }
      opener = button;
      closing = false;
      const image = viewer.querySelector("[data-viewer-image]");
      image.src = button.dataset.preview;
      image.alt = button.dataset.title + " — " + button.dataset.caption;
      viewer.querySelector("#viewer-title").textContent = button.dataset.title;
      viewer.querySelector("[data-viewer-caption]").textContent =
        button.dataset.caption;
      viewer.querySelector("[data-viewer-original]").href =
        button.dataset.preview;
      viewer.querySelector("[data-viewer-case]").href = button.dataset.case;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      viewer.showModal();
      viewer.scrollTop = 0;
      viewer
        .querySelector("[data-viewer-close]")
        .focus({ preventScroll: true });
      animate(
        viewer,
        [
          { opacity: 0, transform: "translateY(10px) scale(.99)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        280,
      );
    }),
  );
  async function closeViewer() {
    if (!viewer?.open || closing) return;
    closing = true;
    const animation = animate(
      viewer,
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(6px)" },
      ],
      240,
    );
    if (animation) await animation.finished.catch(() => {});
    viewer.close();
  }
  viewer
    ?.querySelector("[data-viewer-close]")
    .addEventListener("click", closeViewer);
  viewer?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeViewer();
  });
  viewer?.addEventListener("click", (event) => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeViewer();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !viewer?.open) return;
    const targets = [
      ...viewer.querySelectorAll("button:not([disabled]), a[href]"),
    ].filter((element) => element.getClientRects().length);
    const first = targets[0],
      last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!viewer.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });
  viewer?.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    closing = false;
    opener?.focus({ preventScroll: true });
  });

  // C. Public example frames; never a simulated network/model execution.
  const story = document.querySelector("[data-story]");
  const steps = [...document.querySelectorAll("[data-story-step]")];
  const stage = document.querySelector("[data-story-preview]");
  const storyButtons = [...document.querySelectorAll("[data-story-select]")];
  let selectedStep = -1;
  function selectStory(index) {
    if (!stage || index === selectedStep) return;
    selectedStep = index;
    steps.forEach((step, i) =>
      step.classList.toggle("is-current", index === i),
    );
    storyButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.storySelect) === index),
      ),
    );
    stage.replaceChildren(
      steps[index].querySelector(".story-document").cloneNode(true),
    );
    animate(
      stage,
      [
        { opacity: 0.7, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      300,
    );
  }
  if (story && stage && steps.length) {
    story.classList.add("story-enhanced");
    selectStory(0);
    storyButtons.forEach((button) =>
      button.addEventListener("click", () => {
        const index = Number(button.dataset.storySelect);
        steps[index].scrollIntoView({ behavior: "instant", block: "center" });
        selectStory(index);
      }),
    );
    if ("IntersectionObserver" in window) {
      let observer;
      const observeStory = () => {
        observer?.disconnect();
        observer = new IntersectionObserver(
          (entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting);
            if (visible.length)
              selectStory(steps.indexOf(visible[visible.length - 1].target));
          },
          {
            rootMargin: `-${Math.round(innerHeight * 0.28)}px 0px -${Math.round(innerHeight * 0.4)}px 0px`,
            threshold: 0,
          },
        );
        steps.forEach((step) => observer.observe(step));
      };
      observeStory();
      window.addEventListener("resize", observeStory, { passive: true });
    }
  }

  // Archive filters enhance a complete server-readable list.
  const filters = [...document.querySelectorAll("[data-filter]")];
  const projects = [...document.querySelectorAll("[data-category]")];
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      const category = button.dataset.filter;
      filters.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      let count = 0;
      projects.forEach((project) => {
        project.hidden =
          category !== "all" && project.dataset.category !== category;
        if (!project.hidden) count++;
      });
      const result = document.querySelector("[data-filter-result]");
      if (result) result.textContent = `显示 ${count} 个项目`;
    }),
  );

  if ("IntersectionObserver" in window) {
    const sections = [
      ...document.querySelectorAll("main > section[id]"),
    ].filter((section) =>
      ["top", "practice", "work", "writing", "about", "contact"].includes(section.id),
    );
    let navObserver;
    const observeNavigation = () => {
      navObserver?.disconnect();
      navObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            nav?.querySelectorAll("a").forEach((link) => {
              if (link.hash === "#" + entry.target.id)
                link.setAttribute("aria-current", "location");
              else link.removeAttribute("aria-current");
            });
          }),
        {
          rootMargin: `-${Math.round(innerHeight * 0.15)}px 0px -${Math.round(innerHeight * 0.6)}px 0px`,
          threshold: 0,
        },
      );
      sections.forEach((section) => navObserver.observe(section));
    };
    observeNavigation();
    window.addEventListener("resize", observeNavigation, { passive: true });
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Content is visible before, during and after animation, even after script failure.
          animate(
            entry.target,
            [
              { opacity: 0.8, transform: "translateY(12px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            520,
          );
          reveal.unobserve(entry.target);
        }),
      { threshold: 0.06 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => reveal.observe(element));
  }
  motionButton?.addEventListener("click", () => {
    savedMotion = motionOff ? "on" : "off";
    try {
      localStorage.setItem("ethan-motion", savedMotion);
    } catch {
      /* optional */
    }
    setMotion();
  });
  reduced.addEventListener("change", setMotion);
  setMotion();
  root.classList.add("enhanced");
  [
    ".brand",
    ".intro-label",
    ".hero h1",
    ".hero-intro",
    ".hero-actions",
    ".desk-stage",
  ].forEach((selector, i) => {
    animate(
      document.querySelector(selector),
      [
        { opacity: 0.8, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      500,
      i * 60,
    );
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      running.forEach((animation) => animation.finish());
      resetDesk();
      closeMenu();
    }
  });
})();
