import { prefersReducedMotion } from "../utils/motion.js";

/** IntersectionObserver-based section reveals. */
export function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return { destroy() {} };

  if (prefersReducedMotion()) {
    nodes.forEach((n) => n.classList.add("is-visible"));
    return { destroy() {} };
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  nodes.forEach((n) => io.observe(n));

  return {
    destroy() {
      io.disconnect();
    },
  };
}
