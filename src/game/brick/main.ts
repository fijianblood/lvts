// Noqublox brick test: walk around a McFarlane Road street in the realistic
// toy-brick look, get into a brick car or the LvTS pickup, and drive.
// Keyboard: WASD / arrows to move, E to get in or out, drag to look around.
// Phone: joystick bottom-left, Drive button bottom-right, drag to look.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, type Box } from './world.ts';
import { makeFigure, makeCar, makeTruck, type Vehicle } from './models.ts';
import { buildGames, type Solid } from './games.ts';

type Quality = 'low' | 'high';
const QKEY = 'noqublox-brick-quality';

function loadQuality(): Quality {
  try {
    const q = localStorage.getItem(QKEY);
    if (q === 'low' || q === 'high') return q;
  } catch { /* storage blocked */ }
  return matchMedia('(pointer: coarse)').matches ? 'low' : 'high';
}

const CSS = `
.nb-ui{position:absolute;inset:0;pointer-events:none;font:600 14px/1.3 system-ui,sans-serif;color:#fff;user-select:none;-webkit-user-select:none}
.nb-ui *{pointer-events:auto}
.nb-help{position:absolute;left:12px;top:12px;background:rgba(19,37,74,.78);padding:8px 12px;border-radius:12px;max-width:62vw}
.nb-help b{color:#ffd23f}
.nb-help small{display:block;font-weight:500;opacity:.85;margin-top:2px}
.nb-q{position:absolute;right:12px;top:12px;background:rgba(19,37,74,.78);border:0;color:#fff;font:inherit;padding:8px 12px;border-radius:12px}
.nb-act{position:absolute;right:16px;bottom:var(--act-b,24px);background:#ffd23f;color:#13254a;border:0;font:800 16px system-ui,sans-serif;padding:14px 18px;border-radius:16px;box-shadow:0 4px 0 #c9a21a;display:none}
.nb-speed{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:rgba(19,37,74,.78);padding:6px 12px;border-radius:12px;display:none}
.nb-jump{position:absolute;right:16px;bottom:24px;width:76px;height:76px;border-radius:50%;border:0;background:#2fae4a;color:#fff;font:800 15px system-ui,sans-serif;box-shadow:0 4px 0 #1f7a33}
.nb-hud{position:absolute;right:12px;top:54px;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.nb-hud span{background:rgba(19,37,74,.78);padding:6px 10px;border-radius:12px;white-space:nowrap}
.nb-toast{position:absolute;left:50%;top:34%;transform:translateX(-50%);background:#ffd23f;color:#13254a;font:800 16px system-ui,sans-serif;padding:10px 16px;border-radius:14px;text-align:center;max-width:86vw;opacity:0;transition:opacity .3s;pointer-events:none}
.nb-riddle{position:absolute;left:50%;bottom:110px;transform:translateX(-50%);width:min(440px,90vw);background:rgba(91,42,134,.94);border-radius:16px;padding:12px 14px;display:none;text-align:center}
.nb-riddle p{margin:0 0 10px;font-size:16px}
.nb-riddle button{display:block;width:100%;margin:6px 0 0;border:0;border-radius:12px;padding:10px;font:700 15px system-ui,sans-serif;background:#fff;color:#13254a}
.nb-joy{position:absolute;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.5);display:none;pointer-events:none}
.nb-knob{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,210,63,.9)}
.nb-load{position:absolute;inset:0;display:grid;place-items:center;background:#13254a;font:700 18px system-ui,sans-serif;color:#ffd23f}
`;

export function startBrickTest(container: HTMLElement): void {
  let quality = loadQuality();
  const touch = matchMedia('(pointer: coarse)').matches;
  container.style.position = 'relative';
  container.style.touchAction = 'none';
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const load = document.createElement('div');
  load.className = 'nb-load';
  load.textContent = 'Building Noqublox…';
  container.appendChild(load);

  // ── renderer and scene ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.prepend(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const scene = new THREE.Scene();
  const sky = document.createElement('canvas');
  sky.width = 2;
  sky.height = 256;
  const sg = sky.getContext('2d')!;
  const grad = sg.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5aa9ea');
  grad.addColorStop(1, '#d9eefb');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 2, 256);
  const skyTex = new THREE.CanvasTexture(sky);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  scene.fog = new THREE.Fog('#cfe8f8', 70, 190);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight('#dcefff', '#6d7d5c', 0.7));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.6);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 140 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  let composer: EffectComposer | null = null;

  const world = buildWorld(quality);
  scene.add(world.group);

  // ── player and vehicles ──
  const fig = makeFigure({ skin: '#a8673f', hair: '#1d1f24', shirt: '#f07a1c', pants: '#2f5fd0' });
  scene.add(fig.root);
  const player = { pos: new THREE.Vector3(world.spawn.x, world.heightAt(world.spawn.x, world.spawn.z), world.spawn.z), yaw: world.spawn.yaw };
  const vehicles: Vehicle[] = world.vehicles.map((s) => {
    const v = s.kind === 'truck' ? makeTruck(s.color, s.name) : makeCar(s.color, s.name);
    v.group.position.set(s.x, world.heightAt(s.x, s.z), s.z);
    v.yaw = s.yaw;
    v.group.rotation.y = s.yaw;
    scene.add(v.group);
    return v;
  });
  let driving: Vehicle | null = null;
  const games = buildGames(quality);
  scene.add(games.group);
  const solids: Solid[] = games.solids;
  const phys = { vy: 0, onGround: true, jumpQ: 0, check: games.start.clone(), onStart: false, timer: -1, best: Infinity, solved: 0 };
  try { phys.best = Number(localStorage.getItem('noqublox-hop-best')) || Infinity; } catch { /* storage blocked */ }
  let steerAngle = 0;

  // ── quality ──
  const applyQuality = () => {
    renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1);
    const size = quality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(size, size);
    sun.shadow.radius = quality === 'high' ? 3 : 1.5;
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    resize();
  };
  const resize = () => {
    const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer?.dispose();
    composer = null;
    if (quality === 'high') {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const ao = new GTAOPass(scene, camera, w, h);
      ao.blendIntensity = 0.9;
      ao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.3, thickness: 1, scale: 1, samples: 12 });
      composer.addPass(ao);
      composer.addPass(new OutputPass());
    }
  };
  window.addEventListener('resize', resize);

  // ── UI ──
  const ui = document.createElement('div');
  ui.className = 'nb-ui';
  ui.innerHTML = `
    <div class="nb-help"><b>Noqublox</b> · brick test
      <small>${touch ? 'Joystick to move · drag to look · Jump button' : 'WASD or arrows to move · Space to jump · drag to look · E to get in or out'}</small>
      <small>Games: Hop &amp; Climb by the water (west) · find the 6 ❓ riddle posts</small></div>
    <div class="nb-hud"><span class="nb-stars">❓ Riddles 0/6</span><span class="nb-time" style="display:none"></span></div>
    <div class="nb-toast"></div>
    <div class="nb-riddle"><p></p><button data-i="0"></button><button data-i="1"></button><button data-i="2"></button></div>
    ${touch ? '<button class="nb-jump">Jump</button>' : ''}
    <button class="nb-q"></button>
    <button class="nb-act"></button>
    <div class="nb-speed"></div>
    <div class="nb-joy"><div class="nb-knob"></div></div>`;
  container.appendChild(ui);
  const qBtn = ui.querySelector<HTMLButtonElement>('.nb-q')!;
  const actBtn = ui.querySelector<HTMLButtonElement>('.nb-act')!;
  const speedEl = ui.querySelector<HTMLDivElement>('.nb-speed')!;
  const joy = ui.querySelector<HTMLDivElement>('.nb-joy')!;
  const knob = ui.querySelector<HTMLDivElement>('.nb-knob')!;
  const starsEl = ui.querySelector<HTMLSpanElement>('.nb-stars')!;
  const timeEl = ui.querySelector<HTMLSpanElement>('.nb-time')!;
  const toastEl = ui.querySelector<HTMLDivElement>('.nb-toast')!;
  const riddleEl = ui.querySelector<HTMLDivElement>('.nb-riddle')!;
  const jumpBtn = ui.querySelector<HTMLButtonElement>('.nb-jump');
  if (jumpBtn) {
    ui.style.setProperty('--act-b', '112px');
    jumpBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); phys.jumpQ = 0.18; });
  }
  let toastT = 0;
  const toast = (msg: string, secs = 2.5) => {
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    toastT = secs;
  };
  // riddles
  let openPost: (typeof games.posts)[number] | null = null;
  const answer = (i: number) => {
    const p = openPost;
    if (!p || p.solved) return;
    if (i === p.riddle.answer) {
      p.solved = true;
      p.sign.material = games.solvedMat;
      phys.solved++;
      starsEl.textContent = `⭐ Riddles ${phys.solved}/${games.posts.length}`;
      riddleEl.style.display = 'none';
      openPost = null;
      toast(phys.solved === games.posts.length ? 'Vinaka! You solved every riddle! ⭐' : `Correct! It's ${p.riddle.options[i].toLowerCase()}. ⭐`);
    } else {
      toast('Not quite. Try again!', 1.6);
    }
  };
  riddleEl.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => answer(Number(btn.dataset.i))));
  const setQLabel = () => (qBtn.textContent = `Quality: ${quality === 'high' ? 'High' : 'Low'}`);
  setQLabel();
  qBtn.onclick = () => {
    quality = quality === 'high' ? 'low' : 'high';
    try { localStorage.setItem(QKEY, quality); } catch { /* storage blocked */ }
    setQLabel();
    applyQuality();
  };

  // ── input ──
  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Enter') toggleVehicle();
    if (e.code === 'Space') { phys.jumpQ = 0.18; e.preventDefault(); }
    if (openPost && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) answer(Number(e.code.slice(5)) - 1);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  let camYaw = player.yaw, camPitch = 0.32, lastDrag = -10;
  const stick = { id: -1, x: 0, y: 0, ox: 0, oy: 0 };
  const look = { id: -1, x: 0, y: 0 };
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    const r = el.getBoundingClientRect();
    const lx = e.clientX - r.left, ly = e.clientY - r.top;
    if (e.pointerType === 'touch' && lx < r.width * 0.45 && ly > r.height * 0.4 && stick.id < 0) {
      Object.assign(stick, { id: e.pointerId, ox: lx, oy: ly, x: 0, y: 0 });
      joy.style.display = 'block';
      joy.style.left = `${lx}px`;
      joy.style.top = `${ly}px`;
      knob.style.transform = '';
    } else if (look.id < 0) {
      Object.assign(look, { id: e.pointerId, x: e.clientX, y: e.clientY });
    }
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId === stick.id) {
      const r = el.getBoundingClientRect();
      let dx = e.clientX - r.left - stick.ox, dy = e.clientY - r.top - stick.oy;
      const len = Math.hypot(dx, dy), max = 50;
      if (len > max) { dx *= max / len; dy *= max / len; }
      stick.x = dx / max;
      stick.y = -dy / max;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (e.pointerId === look.id) {
      camYaw -= (e.clientX - look.x) * 0.006;
      camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - look.y) * 0.004, 0.08, 0.95);
      look.x = e.clientX;
      look.y = e.clientY;
      lastDrag = performance.now() / 1000;
    }
  });
  const up = (e: PointerEvent) => {
    if (e.pointerId === stick.id) { stick.id = -1; stick.x = stick.y = 0; joy.style.display = 'none'; }
    if (e.pointerId === look.id) look.id = -1;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  actBtn.onclick = () => toggleVehicle();

  const input = () => {
    let x = stick.x, y = stick.y;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    return { x: THREE.MathUtils.clamp(x, -1, 1), y: THREE.MathUtils.clamp(y, -1, 1) };
  };

  // ── collisions ──
  const hitBox = (x: number, z: number, r: number, b: Box) => {
    const cx = THREE.MathUtils.clamp(x, b.x0, b.x1), cz = THREE.MathUtils.clamp(z, b.z0, b.z1);
    return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
  };
  /** A vehicle is two circles, front and back. */
  const circles = (v: Vehicle, x: number, z: number, yaw: number) => {
    const o = v.halfL - v.halfW;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    return [[x + fx * o, z + fz * o], [x - fx * o, z - fz * o]] as const;
  };
  const outOfBounds = (x: number, z: number, r: number) => {
    const b = world.bounds;
    return x - r < b.x0 || x + r > b.x1 || z - r < b.z0 || z + r > b.z1;
  };
  const blocked = (x: number, z: number, r: number, skip?: Vehicle) => {
    if (outOfBounds(x, z, r)) return true;
    if (world.colliders.some((b) => hitBox(x, z, r, b))) return true;
    for (const v of vehicles) {
      if (v === skip) continue;
      for (const [cx, cz] of circles(v, v.group.position.x, v.group.position.z, v.yaw)) {
        if ((x - cx) ** 2 + (z - cz) ** 2 < (r + v.halfW) ** 2) return true;
      }
    }
    return false;
  };
  // walking: low ledges (up to half a metre) are stepped onto, higher ones need a jump
  const STEP = 0.5;
  const walkBlocked = (x: number, z: number, feet: number) =>
    blocked(x, z, 0.35) || solids.some((s) => hitBox(x, z, 0.35, s) && s.y1 > feet + STEP && s.y0 < feet + 1.7);
  const carBlocked = (x: number, z: number, r: number, skip: Vehicle) =>
    blocked(x, z, r, skip) || games.water.some((w) => hitBox(x, z, r, w)) || solids.some((s) => hitBox(x, z, r, s));
  /** The floor under the feet: the street, or the top of a block that isn't too high to step onto. */
  const standOn = (x: number, z: number, feet: number): { y: number; s: Solid | null } => {
    let y = world.heightAt(x, z), on: Solid | null = null;
    for (const s of solids) {
      if (x > s.x0 - 0.15 && x < s.x1 + 0.15 && z > s.z0 - 0.15 && z < s.z1 + 0.15 && s.y1 <= feet + STEP && s.y1 > y) { y = s.y1; on = s; }
    }
    return { y, s: on };
  };
  const respawn = (msg: string) => {
    player.pos.copy(phys.check);
    phys.vy = 0;
    toast(msg);
  };

  // ── getting in and out ──
  const nearest = (): Vehicle | null => {
    let best: Vehicle | null = null, bd = Infinity;
    for (const v of vehicles) {
      const d = v.group.position.distanceTo(player.pos) - v.halfL;
      if (d < 1.4 && d < bd) { bd = d; best = v; }
    }
    return best;
  };
  function toggleVehicle(): void {
    if (driving) {
      const v = driving;
      if (Math.abs(v.speed) > 2) return;
      const rx = -Math.cos(v.yaw), rz = Math.sin(v.yaw);
      for (const side of [1, -1]) {
        const x = v.group.position.x + rx * side * (v.halfW + 0.7), z = v.group.position.z + rz * side * (v.halfW + 0.7);
        if (!blocked(x, z, 0.35, v) && !walkBlocked(x, z, world.heightAt(x, z))) {
          v.group.remove(fig.root);
          scene.add(fig.root);
          fig.sit(false);
          player.pos.set(x, world.heightAt(x, z), z);
          player.yaw = v.yaw;
          v.speed = 0;
          driving = null;
          return;
        }
      }
      return;
    }
    const v = nearest();
    if (!v) return;
    driving = v;
    scene.remove(fig.root);
    v.body.add(fig.root);
    fig.root.position.copy(v.seat);
    fig.root.rotation.set(0, 0, 0);
    fig.sit(true);
    camYaw = v.yaw;
  }

  // ── loop ──
  let last = performance.now();
  const camTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let first = true;
  let camDist = 5.8;
  // only buildings and long walls stop the camera, not posts and palms
  const camWalls = world.colliders.filter((b) => b.x1 - b.x0 > 1 || b.z1 - b.z0 > 1);
  if (new URLSearchParams(location.search).has('debug')) {
    (window as unknown as Record<string, unknown>).__nb = { player, phys, games, vehicles, toggleVehicle, setCam: (y: number, p: number) => { camYaw = y; camPitch = p; } };
  }

  const step = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;
    const inp = input();

    if (driving) {
      const v = driving;
      const thr = inp.y;
      if (thr !== 0 && Math.sign(thr) !== Math.sign(v.speed) && Math.abs(v.speed) > 0.2) v.speed += thr * v.accel * 2.4 * dt;
      else if (thr !== 0) v.speed += thr * v.accel * dt;
      else v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 3.5 * dt);
      v.speed = THREE.MathUtils.clamp(v.speed, -v.maxSpeed * 0.35, v.maxSpeed);
      const target = -inp.x * 0.55 * (1 - Math.min(Math.abs(v.speed) / v.maxSpeed, 1) * 0.55);
      steerAngle += (target - steerAngle) * Math.min(1, dt * 8);
      const yaw = v.yaw + (v.speed / v.base) * Math.tan(steerAngle) * dt;
      const nx = v.group.position.x + Math.sin(yaw) * v.speed * dt, nz = v.group.position.z + Math.cos(yaw) * v.speed * dt;
      if (circles(v, nx, nz, yaw).some(([cx, cz]) => carBlocked(cx, cz, v.halfW, v))) {
        v.speed *= -0.25;
      } else {
        v.group.position.x = nx;
        v.group.position.z = nz;
        v.yaw = yaw;
      }
      v.group.rotation.y = v.yaw;
      v.group.position.y += (world.heightAt(v.group.position.x, v.group.position.z) - v.group.position.y) * Math.min(1, dt * 12);
      for (const w of v.wheels) w.rotation.x += (v.speed * dt) / v.wheelR;
      for (const s of v.steer) s.rotation.y = steerAngle;
      v.body.rotation.z += (THREE.MathUtils.clamp(steerAngle * v.speed * 0.012, -0.06, 0.06) - v.body.rotation.z) * Math.min(1, dt * 6);
      v.body.rotation.x += (-thr * 0.015 - v.body.rotation.x) * Math.min(1, dt * 5);
      player.pos.copy(v.group.position);
      if (t - lastDrag > 1.5 && v.speed > -1) camYaw += Math.atan2(Math.sin(v.yaw - camYaw), Math.cos(v.yaw - camYaw)) * Math.min(1, dt * 2.5);
      speedEl.style.display = 'block';
      riddleEl.style.display = 'none';
      openPost = null;
      speedEl.textContent = `${v.name} · ${Math.round(Math.abs(v.speed) * 3.6)} km/h`;
      actBtn.style.display = Math.abs(v.speed) < 2 ? 'block' : 'none';
      actBtn.textContent = 'Get out';
    } else {
      const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      const mx = fx * inp.y - fz * inp.x, mz = fz * inp.y + fx * inp.x;
      const len = Math.hypot(mx, mz);
      let speed = 0;
      if (len > 0.05) {
        speed = 4.2 * Math.min(1, len);
        const dx = (mx / len) * speed * dt, dz = (mz / len) * speed * dt;
        if (!walkBlocked(player.pos.x + dx, player.pos.z, player.pos.y)) player.pos.x += dx;
        if (!walkBlocked(player.pos.x, player.pos.z + dz, player.pos.y)) player.pos.z += dz;
        const want = Math.atan2(mx, mz);
        player.yaw += Math.atan2(Math.sin(want - player.yaw), Math.cos(want - player.yaw)) * Math.min(1, dt * 10);
      }
      // jumping and falling
      phys.jumpQ = Math.max(0, phys.jumpQ - dt);
      if (phys.jumpQ > 0 && phys.onGround) { phys.vy = 8.5; phys.onGround = false; phys.jumpQ = 0; }
      phys.vy -= 22 * dt;
      player.pos.y += phys.vy * dt;
      const floor = standOn(player.pos.x, player.pos.z, player.pos.y);
      if (player.pos.y <= floor.y) {
        player.pos.y = floor.y;
        phys.vy = 0;
        phys.onGround = true;
      } else if (player.pos.y - floor.y > 0.05) phys.onGround = false;
      // Hop & Climb
      const on = phys.onGround ? floor.s : null;
      if (phys.onGround && player.pos.y < 0.1 && games.water.some((w) => hitBox(player.pos.x, player.pos.z, 0.01, w))) respawn('Splash! Back to the checkpoint.');
      if (on?.kind === 'start') {
        phys.onStart = true;
        phys.check.copy(games.start);
      } else if (phys.onStart && phys.onGround) {
        phys.onStart = false;
        if (on || player.pos.y > 0.3) phys.timer = 0;
      }
      if (on?.kind === 'check' && phys.check.y !== on.y1) {
        phys.check.set((on.x0 + on.x1) / 2, on.y1, (on.z0 + on.z1) / 2);
        toast('Checkpoint! ✅', 1.6);
      }
      if (on?.kind === 'finish' && phys.timer >= 0) {
        const t2 = phys.timer;
        phys.timer = -1;
        const best = t2 < phys.best;
        if (best) {
          phys.best = t2;
          try { localStorage.setItem('noqublox-hop-best', String(t2)); } catch { /* storage blocked */ }
        }
        phys.check.copy(games.start);
        toast(`You made it! ⭐ ${t2.toFixed(1)} s${best ? ' · new best!' : ` · best ${phys.best.toFixed(1)} s`}`, 4);
      }
      const sp = games.spinner;
      if (phys.onGround && Math.abs(player.pos.y - sp.top) < 0.2) {
        const a = sp.bar.rotation.y, ex = Math.cos(a) * sp.half, ez = -Math.sin(a) * sp.half;
        const px = player.pos.x - sp.cx, pz = player.pos.z - sp.cz;
        const t3 = THREE.MathUtils.clamp((px * ex + pz * ez) / (sp.half * sp.half), -1, 1);
        if ((px - ex * t3) ** 2 + (pz - ez * t3) ** 2 < 0.5 ** 2) respawn('Bonk! Jump over the spinning bar.');
      }
      if (phys.timer >= 0) {
        phys.timer += dt;
        timeEl.style.display = '';
        timeEl.textContent = `⏱ ${phys.timer.toFixed(1)} s`;
      } else timeEl.style.display = 'none';
      // riddle posts
      let post: typeof openPost = null;
      for (const p of games.posts) if (!p.solved && (p.x - player.pos.x) ** 2 + (p.z - player.pos.z) ** 2 < 2.3 ** 2) post = p;
      if (post !== openPost) {
        openPost = post;
        if (post) {
          riddleEl.querySelector('p')!.textContent = post.riddle.q;
          riddleEl.querySelectorAll('button').forEach((btn, i) => (btn.textContent = `${touch ? '' : `${i + 1}. `}${post.riddle.options[i]}`));
        }
        riddleEl.style.display = post ? 'block' : 'none';
      }
      fig.root.position.copy(player.pos);
      fig.root.rotation.y = player.yaw;
      fig.animate(speed, dt);
      speedEl.style.display = 'none';
      const near = nearest();
      actBtn.style.display = near ? 'block' : 'none';
      if (near) actBtn.textContent = touch ? `Drive the ${near.name}` : `Drive the ${near.name} (E)`;
    }

    // moving parts and messages
    games.spinner.bar.rotation.y += games.spinner.speed * dt;
    games.star.rotation.y += dt * 1.5;
    for (const p of games.posts) p.sign.rotation.y += dt * (p.solved ? 1.5 : 0.5);
    if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.opacity = '0';
    if (jumpBtn) jumpBtn.style.display = driving ? 'none' : 'block';

    // camera behind the player or vehicle, pulled in if a wall is in the way
    let dist = driving ? (driving.halfL > 2.5 ? 10 : 9) : 5.8;
    camTarget.lerp(tmp.copy(player.pos).add(new THREE.Vector3(0, driving ? 1.3 : 1.3, 0)), first ? 1 : Math.min(1, dt * 10));
    const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
    for (let d = 1.2; d < dist; d += 0.25) {
      const x = camTarget.x - Math.sin(camYaw) * d * cp, z = camTarget.z - Math.cos(camYaw) * d * cp;
      if (camWalls.some((b) => x > b.x0 - 0.2 && x < b.x1 + 0.2 && z > b.z0 - 0.2 && z < b.z1 + 0.2)) {
        dist = Math.max(1.4, d - 0.3);
        break;
      }
    }
    camDist += (dist - camDist) * Math.min(1, dt * (dist < camDist ? 14 : 3));
    dist = camDist;
    camera.position.set(camTarget.x - Math.sin(camYaw) * dist * cp, camTarget.y + dist * sp, camTarget.z - Math.cos(camYaw) * dist * cp);
    camera.position.y = Math.max(camera.position.y, 0.5);
    camera.lookAt(camTarget);

    sun.position.set(camTarget.x + 24, camTarget.y + 40, camTarget.z + 16);
    sun.target.position.copy(camTarget);

    if (composer) composer.render(dt);
    else renderer.render(scene, camera);
    if (first) {
      first = false;
      load.remove();
    }
  };
  applyQuality();
  renderer.setAnimationLoop(step);
}
