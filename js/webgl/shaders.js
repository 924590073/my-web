/** GLSL for Three.js ShaderMaterial (background field). */

export const FIELD_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FIELD_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uQuality;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(1.6, 1.0);
  vec2 mouse = (uMouse - 0.5) * vec2(1.6, 1.0);
  float mouseInfluence = 1.0 - smoothstep(0.0, 0.9, length(p - mouse));

  float t = uTime * 0.12;
  vec2 flow = vec2(
    fbm(p * 1.4 + vec2(t, 0.0)),
    fbm(p * 1.4 + vec2(0.0, t * 1.3))
  );

  float field = fbm(p * 2.2 + flow * 1.1 + mouse * 0.18);
  field += mouseInfluence * 0.2;

  vec3 cCold = vec3(0.78, 0.82, 0.87);
  vec3 cMid  = vec3(0.68, 0.72, 0.78);
  vec3 cWarm = vec3(0.77, 0.42, 0.22);
  vec3 cDeep = vec3(0.55, 0.58, 0.64);

  float bands = smoothstep(0.35, 0.65, field);
  vec3 col = mix(cCold, cMid, bands);
  col = mix(col, cWarm, smoothstep(0.55, 0.85, field) * (0.5 + mouseInfluence * 0.4));
  col = mix(col, cDeep, smoothstep(0.65, 1.0, length(p) * 0.85) * 0.35);

  float vig = 1.0 - 0.3 * length(uv - 0.5);
  float grain = (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.03 * uQuality;
  col = col * vig + grain;

  gl_FragColor = vec4(col, 1.0);
}
`;
