import * as THREE from "three";
import { FIELD_VERTEX, FIELD_FRAGMENT } from "./shaders.js";
import {
  prefersReducedMotion,
  onReducedMotionChange,
  isPageVisible,
  onVisibilityChange,
} from "../utils/motion.js";

/**
 * Three.js hero: shader field plane + interactive lattice mesh.
 */
export function createFieldRenderer(canvas, options = {}) {
  const onStats = options.onStats || (() => {});
  const hero = canvas.closest(".hero");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
      alpha: false,
    });
  } catch (err) {
    console.warn("[quantum] Three.js renderer failed:", err);
    hero?.classList.add("is-fallback");
    return null;
  }

  if (!renderer.capabilities.isWebGL2 && !renderer.getContext()) {
    hero?.classList.add("is-fallback");
    renderer.dispose();
    return null;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xd8dde3, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd8dde3, 8, 22);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 6.2);

  const fieldUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uQuality: { value: 1 },
  };

  const fieldMat = new THREE.ShaderMaterial({
    uniforms: fieldUniforms,
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT,
    depthWrite: false,
  });

  const field = new THREE.Mesh(new THREE.PlaneGeometry(24, 14), fieldMat);
  field.position.z = -4;
  scene.add(field);

  const ambient = new THREE.AmbientLight(0xc5ccd6, 0.85);
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(2.5, 3.5, 4);
  const accent = new THREE.PointLight(0xc45c26, 12, 18, 2);
  accent.position.set(-1.2, 0.6, 2.5);
  scene.add(ambient, key, accent);

  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.IcosahedronGeometry(1.35, 1);
  const shell = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0xb8c0cb,
      metalness: 0.55,
      roughness: 0.35,
      transparent: true,
      opacity: 0.22,
      flatShading: true,
    })
  );
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({
      color: 0xc45c26,
      transparent: true,
      opacity: 0.85,
    })
  );
  group.add(shell, wire);

  const orbitGeo = new THREE.TorusGeometry(2.05, 0.018, 12, 96);
  const orbit = new THREE.Mesh(
    orbitGeo,
    new THREE.MeshBasicMaterial({
      color: 0x12151a,
      transparent: true,
      opacity: 0.28,
    })
  );
  orbit.rotation.x = Math.PI / 2.4;
  group.add(orbit);

  let rafId = 0;
  let running = true;
  let reduced = prefersReducedMotion();
  let visible = isPageVisible();
  const start = performance.now();
  let last = start;
  let frames = 0;
  let fps = 0;
  let fpsAccum = 0;
  let quality = 1;
  let dprCap = Math.min(window.devicePixelRatio || 1, 2);
  let mouseNX = 0.5;
  let mouseNY = 0.5;
  let targetNX = 0.5;
  let targetNY = 0.5;
  let frozenTime = 1.2;
  const targetRot = { x: 0, y: 0 };

  function cssSize() {
    return {
      w: canvas.clientWidth || window.innerWidth,
      h: canvas.clientHeight || window.innerHeight,
    };
  }

  function resize() {
    const { w, h } = cssSize();
    const dpr = dprCap * (reduced ? 1 : quality);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }

  function paint(timeSec) {
    fieldUniforms.uTime.value = timeSec;
    fieldUniforms.uMouse.value.set(mouseNX, 1 - mouseNY);
    fieldUniforms.uQuality.value = reduced ? 1 : quality;

    group.rotation.x = targetRot.x + Math.sin(timeSec * 0.35) * 0.08;
    group.rotation.y = targetRot.y + timeSec * 0.22;
    orbit.rotation.z = timeSec * 0.15;
    accent.position.x = THREE.MathUtils.lerp(-1.5, 1.5, mouseNX);
    accent.position.y = THREE.MathUtils.lerp(-0.4, 1.2, 1 - mouseNY);

    camera.position.x = THREE.MathUtils.lerp(-0.35, 0.35, mouseNX);
    camera.position.y = 0.15 + THREE.MathUtils.lerp(-0.2, 0.2, 1 - mouseNY);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function emitStats(timeSec) {
    onStats({
      fps: reduced ? 0 : fps,
      quality: Math.round((reduced ? 1 : quality) * 100),
      backend: "Three.js",
      time: timeSec,
    });
  }

  function draw(now) {
    if (!running) return;
    rafId = requestAnimationFrame(draw);
    if (!visible || reduced) return;

    const dt = now - last;
    last = now;

    if (dt > 22) quality = Math.max(0.5, quality - 0.05);
    else if (dt < 14 && quality < 1) quality = Math.min(1, quality + 0.02);

    frames += 1;
    fpsAccum += dt;
    if (fpsAccum >= 500) {
      fps = Math.round((frames * 1000) / fpsAccum);
      frames = 0;
      fpsAccum = 0;
      emitStats((now - start) / 1000);
    }

    mouseNX += (targetNX - mouseNX) * 0.08;
    mouseNY += (targetNY - mouseNY) * 0.08;
    targetRot.x = THREE.MathUtils.lerp(0.35, -0.35, mouseNY);
    targetRot.y = THREE.MathUtils.lerp(-0.45, 0.45, mouseNX);

    resize();
    paint((now - start) / 1000);
  }

  function paintStatic() {
    resize();
    mouseNX = 0.5;
    mouseNY = 0.45;
    targetRot.x = 0.12;
    targetRot.y = 0.35;
    paint(frozenTime);
    emitStats(frozenTime);
  }

  function onPointerMove(e) {
    if (reduced) return;
    const rect = canvas.getBoundingClientRect();
    targetNX = (e.clientX - rect.left) / Math.max(rect.width, 1);
    targetNY = (e.clientY - rect.top) / Math.max(rect.height, 1);
  }

  function onResize() {
    dprCap = Math.min(window.devicePixelRatio || 1, 2);
    if (reduced) paintStatic();
    else resize();
  }

  function startLoop() {
    cancelAnimationFrame(rafId);
    last = performance.now();
    rafId = requestAnimationFrame(draw);
  }

  function stopLoopToStatic() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    frozenTime = (performance.now() - start) / 1000 || 1.2;
    paintStatic();
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize);

  const unsubMotion = onReducedMotionChange((value) => {
    reduced = value;
    if (reduced) stopLoopToStatic();
    else startLoop();
  });

  const unsubVis = onVisibilityChange((v) => {
    visible = v;
    if (reduced) return;
    if (v) {
      last = performance.now();
      startLoop();
    } else {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });

  if (reduced) {
    paintStatic();
  } else if (visible) {
    resize();
    emitStats(0);
    startLoop();
  } else {
    resize();
    emitStats(0);
  }

  return {
    ok: true,
    getStats: () => ({
      fps: reduced ? 0 : fps,
      quality: Math.round((reduced ? 1 : quality) * 100),
      backend: "Three.js",
      time: reduced ? frozenTime : (performance.now() - start) / 1000,
    }),
    destroy() {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      unsubMotion();
      unsubVis();
      geo.dispose();
      wire.geometry.dispose();
      orbitGeo.dispose();
      shell.material.dispose();
      wire.material.dispose();
      orbit.material.dispose();
      field.geometry.dispose();
      fieldMat.dispose();
      renderer.dispose();
    },
  };
}
