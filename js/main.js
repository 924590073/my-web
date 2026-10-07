import { createFieldRenderer } from "./webgl/renderer.js";
import { initCursor } from "./ui/cursor.js";
import { initReveal } from "./ui/reveal.js";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0.0";
  return seconds.toFixed(1);
}

function bindStats() {
  const fpsEl = document.getElementById("stat-fps");
  const qualityEl = document.getElementById("stat-quality");
  const backendEl = document.getElementById("stat-backend");
  const timeEl = document.getElementById("stat-time");

  return (stats) => {
    if (fpsEl) fpsEl.textContent = String(stats.fps);
    if (qualityEl) qualityEl.textContent = String(stats.quality);
    if (backendEl) backendEl.textContent = stats.backend;
    if (timeEl) timeEl.textContent = formatTime(stats.time);
  };
}

function init() {
  const canvas = document.getElementById("hero-canvas");
  const onStats = bindStats();

  let renderer = null;
  if (canvas) {
    renderer = createFieldRenderer(canvas, { onStats });
    if (!renderer) {
      onStats({ fps: 0, quality: 0, backend: "CSS", time: 0 });
    }
  }

  const cursor = initCursor();
  const reveal = initReveal();

  window.addEventListener(
    "pagehide",
    () => {
      renderer?.destroy();
      cursor.destroy();
      reveal.destroy();
    },
    { once: true }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
