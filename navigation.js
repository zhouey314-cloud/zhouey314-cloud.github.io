// Runs before first paint so the mobile header never changes height on hydration.
// The menu works independently even when the enhancement script is unavailable.
(() => {
  const close = (focus = false) => {
    const header = document.querySelector(".site-header");
    const button = document.querySelector(".menu-toggle");
    header?.classList.remove("menu-open");
    button?.setAttribute("aria-expanded", "false");
    if (button) button.lastElementChild.textContent = "＋";
    if (focus) button?.focus();
  };
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".menu-toggle");
    if (button) {
      const open = button.getAttribute("aria-expanded") !== "true";
      document
        .querySelector(".site-header")
        ?.classList.toggle("menu-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.lastElementChild.textContent = open ? "−" : "＋";
    } else if (event.target.closest(".site-nav a")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      document.querySelector(".site-header.menu-open")
    )
      close(true);
  });
  matchMedia("(min-width: 761px)").addEventListener("change", () => close());
  window.addEventListener("pageshow", () => close());
  document.documentElement.classList.add("nav-ready");
})();
