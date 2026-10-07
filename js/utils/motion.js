/** Motion preferences and page visibility helpers. */

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function onReducedMotionChange(callback) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => callback(mq.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

export function isPageVisible() {
  return document.visibilityState === "visible";
}

export function onVisibilityChange(callback) {
  const handler = () => callback(isPageVisible());
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}

export function canUseFinePointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
