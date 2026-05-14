import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// -------- Hero parallax tilt (subtle) --------
const heroTilt = document.getElementById("heroTilt");
const tiltState = { x: 0, y: 0, tx: 0, ty: 0 };
let tiltEnabled = matchMedia("(hover: hover) and (pointer: fine)").matches;

function onPointerMove(e) {
  if (!tiltEnabled || !heroTilt) return;
  const r = heroTilt.getBoundingClientRect();
  const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
  const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
  tiltState.tx = THREE.MathUtils.clamp(nx, -1, 1);
  tiltState.ty = THREE.MathUtils.clamp(ny, -1, 1);
}
function onPointerLeave() {
  tiltState.tx = 0;
  tiltState.ty = 0;
}
window.addEventListener("pointermove", onPointerMove, { passive: true });
heroTilt?.addEventListener("pointerleave", onPointerLeave);

// -------- Three.js 3D Hero --------
const canvas = document.getElementById("heroCanvas");
if (!canvas) throw new Error("Missing #heroCanvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0d0d0d, 7.0, 18.0);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0.6, 1.25, 7.8);

// Main rig: abstract premium orb + rings + particles
const rig = new THREE.Group();
scene.add(rig);

// Soft "stage" plane for depth
const stage = new THREE.Mesh(
  new THREE.CircleGeometry(6.2, 64),
  new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 1,
    metalness: 0,
  })
);
stage.rotation.x = -Math.PI / 2;
stage.position.y = -1.35;
scene.add(stage);

// Center orb
const orb = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.35, 4),
  new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.32,
    metalness: 0.62,
  })
);
orb.position.set(0, 0.15, 0);
rig.add(orb);

// Inner glow shell
const glow = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 48, 48),
  new THREE.MeshBasicMaterial({
    color: 0xe8a020,
    transparent: true,
    opacity: 0.12,
  })
);
glow.position.copy(orb.position);
rig.add(glow);

// Rings
const ringMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.22,
  metalness: 0.78,
  emissive: 0x2a1806,
  emissiveIntensity: 0.22,
});
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.06, 18, 140), ringMat);
ring1.rotation.set(Math.PI / 2.8, 0.2, 0.15);
rig.add(ring1);

const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.045, 18, 140), ringMat);
ring2.rotation.set(Math.PI / 2.2, -0.6, 0.5);
rig.add(ring2);

// Floating shards (subtle geometry accents)
const shardGeo = new THREE.TetrahedronGeometry(0.18, 0);
const shardMat = new THREE.MeshStandardMaterial({
  color: 0x101010,
  roughness: 0.45,
  metalness: 0.65,
  emissive: 0x1f1205,
  emissiveIntensity: 0.15,
});
const shards = new THREE.Group();
for (let i = 0; i < 24; i++) {
  const m = new THREE.Mesh(shardGeo, shardMat);
  const a = (i / 24) * Math.PI * 2;
  const r = 2.8 + Math.random() * 1.1;
  m.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 1.2, Math.sin(a) * r);
  m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  shards.add(m);
}
rig.add(shards);

// Particles
const pCount = 900;
const pos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  const r = 3.6 + Math.random() * 4.6;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
  pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
  pos[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
  pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
const pMat = new THREE.PointsMaterial({
  color: 0xffce73,
  size: 0.018,
  transparent: true,
  opacity: 0.75,
  depthWrite: false,
});
const particles = new THREE.Points(pGeo, pMat);
rig.add(particles);

// Lighting: warm amber + dim fill
scene.add(new THREE.AmbientLight(0xffffff, 0.18));

const key = new THREE.PointLight(0xe8a020, 3.7, 20, 1.6);
key.position.set(2.2, 2.6, 3.0);
scene.add(key);

const rim = new THREE.PointLight(0xffce73, 1.0, 26, 1.4);
rim.position.set(-3.2, 1.2, -2.8);
scene.add(rim);

const coolFill = new THREE.PointLight(0xb9c7ff, 0.35, 22, 1.2);
coolFill.position.set(0.0, 2.0, -6.8);
scene.add(coolFill);

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener("resize", resize);

const clock = new THREE.Clock();
const camBasePos = camera.position.clone();
const lookAt = new THREE.Vector3(0, 0.1, 0);
const tmp = new THREE.Vector3();

function tick() {
  const t = clock.getElapsedTime();

  // Auto-rotation (slow, premium)
  rig.rotation.y = t * 0.18;
  rig.rotation.x = Math.sin(t * 0.33) * 0.06;

  // Subtle float
  rig.position.y = Math.sin(t * 0.85) * 0.08;

  // Glow breathing
  glow.material.opacity = 0.10 + Math.sin(t * 1.2) * 0.03;
  key.intensity = 3.5 + Math.sin(t * 1.7) * 0.25;

  // Shards drift
  shards.rotation.y = -t * 0.12;
  shards.rotation.x = t * 0.06;
  particles.rotation.y = t * 0.06;

  // Smooth parallax tilt (CSS) + gentle camera drift for depth
  tiltState.x += (tiltState.tx - tiltState.x) * 0.06;
  tiltState.y += (tiltState.ty - tiltState.y) * 0.06;

  const rx = -tiltState.y * 3.0;
  const ry = tiltState.x * 4.0;
  if (heroTilt) heroTilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;

  tmp.copy(camBasePos);
  tmp.x += tiltState.x * 0.22;
  tmp.y += -tiltState.y * 0.14 + Math.sin(t * 0.55) * 0.03;
  camera.position.lerp(tmp, 0.06);
  camera.lookAt(lookAt);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
