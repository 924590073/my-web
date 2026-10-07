import { canUseFinePointer } from "../utils/motion.js";

/**
 * Custom cursor + magnetic pull toward interactive targets.
 */
export function initCursor() {
  if (!canUseFinePointer()) return { destroy() {} };

  const el = document.getElementById("cursor");
  if (!el) return { destroy() {} };

  document.body.classList.add("has-custom-cursor");

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  let raf = 0;
  let hovering = false;

  const magnetTargets = Array.from(
    document.querySelectorAll("[data-magnet], .btn, .nav-links a, .brand")
  );

  function loop() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = requestAnimationFrame(loop);
  }

  function onMove(e) {
    tx = e.clientX;
    ty = e.clientY;

    // Magnetic offset toward nearest CTA
    let pullX = 0;
    let pullY = 0;
    for (const target of magnetTargets) {
      const r = target.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width, r.height) * 0.9;
      if (dist < radius) {
        const strength = (1 - dist / radius) * 10;
        pullX -= dx * strength * 0.04;
        pullY -= dy * strength * 0.04;
      }
    }
    tx += pullX;
    ty += pullY;
  }

  function setHover(on) {
    hovering = on;
    el.classList.toggle("is-hover", on);
  }

  function onOver(e) {
    if (e.target.closest("a, button, .btn, [data-magnet]")) setHover(true);
  }

  function onOut(e) {
    if (e.target.closest("a, button, .btn, [data-magnet]")) setHover(false);
  }

  function onLeave() {
    el.classList.add("is-hidden");
  }

  function onEnter() {
    el.classList.remove("is-hidden");
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);
  document.documentElement.addEventListener("mouseleave", onLeave);
  document.documentElement.addEventListener("mouseenter", onEnter);
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    },
  };
}
