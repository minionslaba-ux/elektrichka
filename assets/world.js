/* =====================================================================
   «Бабуля на Марсе» — ОТКРЫТЫЙ МАРС
   Часть 1: рельеф, места, марсоход, три вида (сзади / кабина / турель деда), управление, приборы.
   Файл грузится по требованию (после первого кадра) и пользуется общими объектами index.html.
   ===================================================================== */
(function () {
'use strict';
const W = window.WD = { active: false, view: 0, t: 0, ready: false };
const SIZE = 1400, HALF = SIZE / 2, GRID = 128;

/* ---------- шум и высота ---------- */
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, z) { let s = 0, a = 1, f = 1; for (let k = 0; k < 4; k++) { s += a * vnoise(x * f, z * f); a *= 0.5; f *= 2.03; } return s / 1.875; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// места главы 1 (x, z, радиус плато, высота плато)
// ===== главы: у каждой свой рельеф, места, дороги и цвета =====
const POI = W.POI = [], ROADS = W.ROADS = []; let CRATERS = [], CHC = null; W.ch = 1;
function genCraters(n, avoid) { const out = []; for (let k = 0; k < n; k++) { const x = (hash(k, 3 + W.ch) - 0.5) * SIZE * 0.9, z = (hash(k, 7 + W.ch) - 0.5) * SIZE * 0.9; if (avoid && avoid(x, z)) continue; if (POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + 60)) continue; out.push({ x, z, R: 14 + hash(k, 11) * 46, d: 3 + hash(k, 13) * 7 }); } return out; }
const craterH = (x, z) => { let h = 0; for (const c of CRATERS) { const d = Math.hypot(x - c.x, z - c.z); if (d < c.R * 1.6) h += d < c.R ? -c.d * (1 - (d / c.R) ** 2) : 0; h += c.d * 0.55 * Math.exp(-(((d - c.R) / (c.R * 0.22)) ** 2)); } return h; };
// глава 1: равнины у колонии с извилистым оврагом
const canyonZ = (x) => -120 + Math.sin(x / 210) * 90 + Math.sin(x / 77) * 18;
// глава 2: Долины Маринер — гигантский каньон с террасами, на востоке сужается в ущелье «Глотка»
const zc2 = (x) => 40 * Math.sin(x / 260) + 15 * Math.sin(x / 97);
const hw2 = (x) => { const hw = 150 + 45 * Math.sin(x / 190), g = sstep(140, 200, x) * (1 - sstep(300, 360, x)); return hw * (1 - g) + 24 * g; };
const floor2 = (x, z) => -62 + (fbm(x / 90, z / 90) - 0.5) * 6 + Math.sin(x / 11 + Math.sin(z / 19) * 2) * 0.5;
const plateau2 = (x, z) => 14 + (fbm(x / 150 + 3, z / 150 - 5) - 0.5) * 24 + (fbm(x / 35, z / 35) - 0.5) * 3;
W.CHzc = zc2; W.river2 = (x, z) => Math.abs(z - (zc2(x) + 25 * Math.sin(x / 120))) < 9;
const CH = W.CH = {
  1: { name: 'Колония «Заречная»', fog: '#9a5a4a', pal: ['#c0603a', '#e8a070', '#6a2e24', '#4a2028', '#3a2a30'],
    pois: [
      { id: 'colony', name: 'Колония «Заречная»', e: '🏡', x: 0, z: 0, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'farm', name: 'Теплицы колонии', e: '🌱', x: -150, z: 120, r: 40, col: '#9aff6a', kind: 'farm' },
      { id: 'station', name: 'Заправка «У Петровича»', e: '⛽', x: 260, z: 170, r: 35, col: '#ffd24a', kind: 'fuel' },
      { id: 'liner', name: 'Лайнер «Комсомолец-7»', e: '🛸', x: -330, z: 300, r: 55, col: '#7fe8ff', kind: 'wreck' },
      { id: 'nest', name: 'Гнездо клопов', e: '🪲', x: 330, z: -300, r: 45, col: '#ff6ad5', kind: 'lair' },
      { id: 'rzhav', name: 'Ржавобург', e: '🏭', x: -400, z: -260, r: 75, col: '#ffb04a', kind: 'city' },
      { id: 'camp', name: 'Логово Бешеного Коляна', e: '🏴‍☠️', x: 470, z: 440, r: 60, col: '#ff4a3a', kind: 'boss' }],
    roads: [[[0, 0], [-60, 70], [-150, 120]], [[0, 0], [120, 60], [260, 170]], [[0, 0], [-180, -90], [-400, -260]], [[260, 170], [380, 330], [470, 440]], [[-150, 120], [-260, 230], [-330, 300]], [[0, 0], [170, -150], [330, -300]]],
    start: [6, 50, Math.PI],
    raw(x, z) { let h = (fbm(x / 170 + 11, z / 170 - 7) - 0.45) * 46 + (fbm(x / 40, z / 40) - 0.5) * 4.2; const mesa = fbm(x / 120 - 31, z / 120 + 17); if (mesa > 0.62) h += Math.min(1, (mesa - 0.62) * 9) * 16;
      h += Math.abs(fbm(x / 60 + 5, z / 60 + 9) - 0.5) * -10 + 2.5; h += Math.sin(x / 9 + Math.sin(z / 23) * 2) * 0.35; h += Math.max(0, (Math.abs(x) + Math.abs(z)) - 520) * 0.12;
      const cd = Math.abs(z - canyonZ(x)); h -= (1 - sstep(14, 44, cd)) * 24; return h + craterH(x, z); },
    road(x, z, h, k) { h = h * (1 - k * 0.65) + (fbm(x / 300, z / 300) - 0.45) * 12 * k * 0.65; if (Math.abs(z - canyonZ(x)) < 46) h += k * (1 - sstep(14, 44, Math.abs(z - canyonZ(x)))) * 24; return h; },
    poiH: (p) => CH[1].raw(p.x, p.z) * 0.6, craters: 26 },
  2: { name: 'Долины Маринер', fog: '#a86048', pal: ['#b0503a', '#d89068', '#5a2420', '#3a1820', '#2e2228'],
    pois: [
      { id: 'rim', name: 'Лагерь на краю Маринер', e: '⛺', x: -560, z: 0, r: 55, col: '#7aff8a', kind: 'city', side: 'n' },
      { id: 'grave', name: 'Кладбище кораблей', e: '🚀', x: -300, z: 0, r: 75, col: '#7fe8ff', kind: 'wreck', side: 'f' },
      { id: 'pip', name: 'Сбитый корабль марсианина', e: '🛸', x: -40, z: 0, r: 40, col: '#9aff6a', kind: 'wreck', side: 'f', dz: -40 },
      { id: 'noctis', name: 'Колодцы Лабиринта Ночи', e: '🕳', x: 40, z: 0, r: 60, col: '#b07aff', kind: 'lair', side: 's' },
      { id: 'gorge', name: 'Ущелье «Глотка»', e: '🪨', x: 250, z: 0, r: 26, col: '#ffb04a', kind: 'pass', side: 'f' },
      { id: 'tower', name: 'Пиратская вышка', e: '📡', x: 240, z: 0, r: 30, col: '#ff6a4a', kind: 'outpost', side: 'n' },
      { id: 'dock', name: 'Пиратская пристань', e: '⚓', x: 520, z: 0, r: 70, col: '#ff4a3a', kind: 'boss', side: 'f' }],
    start: null,
    raw(x, z) { const zc0 = zc2(x), hw = hw2(x), t = Math.abs(z - zc0) / hw, pl = plateau2(x, z) + Math.max(0, Math.abs(x) - 560) * 0.2; if (t >= 1.25) return pl + craterH(x, z) * 0.6;
      const fl = floor2(x, z), rv = (1 - sstep(5, 14, Math.abs(z - (zc0 + 25 * Math.sin(x / 120))))) * -3.5; if (t < 0.55) return fl + rv;
      const u = (t - 0.55) / 0.7, st = u * 4, f0 = Math.floor(st), fr = st - f0; return fl + (pl - fl) * ((f0 + sstep(0.55, 0.95, fr)) / 4); },
    road(x, z, h, k, y) { return h * (1 - k) + y * k; },
    poiH: (p) => CH[2].raw(p.x, p.z), craters: 18 },
};
// расставить места по каньону и проложить дороги главы 2
(function () { const C = CH[2]; for (const p of C.pois) { const zc = zc2(p.x), hw = hw2(p.x); p.z = p.side === 'n' ? zc - hw * 1.25 - p.r - 20 : p.side === 's' ? zc + hw * 1.25 + p.r + 30 : zc + (p.dz || 0); }
  const P = (id) => C.pois.find((q) => q.id === id), rim = P('rim'), fl = (x, dz = 0) => [x, zc2(x) + dz, 'raw'];
  C.start = [rim.x + 10, rim.z + 30, Math.PI * 0.5];
  C.roads = [ // серпантин с северного края вниз, дорога по дну, подъём на южный край к Лабиринту Ночи
    [[rim.x, rim.z, 'raw'], [-480, zc2(-480) - hw2(-480) * 1.3, 'raw'], [-430, zc2(-430) - hw2(-430) * 0.75, -26], [-360, zc2(-360) - 18, 'raw']],
    [fl(-360, -18), fl(-300), fl(-200), fl(-100), fl(-40, -40), fl(60), fl(150), fl(250), fl(350), fl(450), fl(520)],
    [fl(-60, 20), [-20, zc2(-20) + hw2(-20) * 0.75, -24], [20, zc2(20) + hw2(20) * 1.3, 'raw'], [P('noctis').x, P('noctis').z, 'raw']]];
})();
function setChapter(n) { CHC = CH[n]; W.ch = n; POI.length = 0; CHC.pois.forEach((p) => POI.push(Object.assign({}, p))); ROADS.length = 0; CHC.roads.forEach((r) => ROADS.push(r.map((q) => q.slice())));
  CRATERS = []; CRATERS = genCraters(CHC.craters, n === 2 ? (x, z) => Math.abs(z - zc2(x)) < hw2(x) * 1.3 : null);
  for (const r of ROADS) for (const q of r) { if (q[2] === 'raw') q[2] = CHC.raw(q[0], q[1]); else if (q[2] === undefined) q[2] = 0; }
  POI.forEach((p) => { p.h = CHC.poiH(p); }); W.mapImg = null; }
function segDist(px, pz, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l)); return [Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t), t]; }
function roadInfo(x, z) { let d = 1e9, y = 0; for (const r of ROADS) for (let i = 0; i < r.length - 1; i++) { const [dd, t] = segDist(x, z, r[i], r[i + 1]); if (dd < d) { d = dd; y = r[i][2] + (r[i + 1][2] - r[i][2]) * t; } } return [d, y]; }
function roadDist(x, z) { return roadInfo(x, z)[0]; }
W.roadDist = roadDist;
function rawH(x, z) { return CHC.raw(x, z); }
function H(x, z) {
  let h = rawH(x, z);
  const [rd, ry] = roadInfo(x, z); if (rd < 16) { const k = 1 - sstep(5, 16, rd); h = CHC.road(x, z, h, k, ry); }
  for (const p of POI) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * 1.8) { const k = 1 - sstep(p.r, p.r * 1.8, d); h = h * (1 - k) + p.h * k; } }
  return h;
}
setChapter(1);
W.H = H;
function normalAt(x, z) { const e = 1.5, hx = H(x + e, z) - H(x - e, z), hz = H(x, z + e) - H(x, z - e); const n = new THREE.Vector3(-hx, 2 * e, -hz); return n.normalize(); }
W.normalAt = normalAt;

/* ---------- сцена ---------- */
let S, sun, hemi, terrain, roadsM, beams = [];
function buildTerrain() {
  const g = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID); g.rotateX(-Math.PI / 2); const P = g.attributes.position, C = [];
  const [cRust, cDust, cRock, cDark, cRoad] = CHC.pal.map((c) => new THREE.Color(c)), t = new THREE.Color(); const cRiver = new THREE.Color('#d8b088');
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, H(x, z)); }
  g.computeVertexNormals(); const N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ny = N.getY(i), slope = 1 - ny;
    t.copy(cRust).lerp(cDust, Math.max(0, sstep(-2, 18, y) * 0.55 + (fbm(x / 25, z / 25) - 0.5) * 0.9)).lerp(cRock, sstep(0.1, 0.3, slope)).lerp(cDark, sstep(0.3, 0.55, slope) * 0.6).multiplyScalar(0.9 + (hash(Math.floor(x / 3), Math.floor(z / 3)) - 0.5) * 0.12); if (W.ch === 1 && y < -10) t.lerp(cDark, sstep(-10, -22, y) * 0.7); if (W.ch === 2) { if (y < -50) t.lerp(cDust, 0.25); if (W.river2(x, z)) t.lerp(cRiver, 0.7); if (y > -50 && y < 5) t.multiplyScalar(0.85 + 0.15 * Math.sin(y * 0.9)); } // полосы слоёв на стенах каньона
    const rd = roadDist(x, z); if (rd < 7) t.lerp(cRoad, (1 - sstep(3, 7, rd)) * 0.75);
    for (const p of POI) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r) t.lerp(new THREE.Color('#8a5048'), 0.35 * (1 - d / p.r)); }
    C.push(t.r, t.g, t.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  terrain = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); S.add(terrain);
}
function place(B, m, x, z, s, ry = 0, dy = 0) { if (!MODELS || !MODELS[m]) return; B.add(MODELS[m], mat(x, H(x, z) + dy, z, s, s, s, ry), null, { vcol: true, vk: 1.08 }); }
function buildPOIs() {
  const B = new Builder([]); W.COLL = []; const addC = (x, z, r) => W.COLL.push({ x, z, r }), byId = (id) => POI.find((p) => p.id === id);
  if (W.ch === 1) {
  // колония: купола, ангары, ветряки, площадка
    const c = POI[0];
    [['basemodule_A', -18, -10], ['basemodule_B', 14, -16], ['basemodule_C', -8, 18], ['basemodule_D', 20, 12], ['basemodule_E', -26, 10], ['basemodule_garage', 4, -30], ['structure_tall', 30, -4], ['windturbine_tall', -36, -24], ['windturbine_tall', 38, 26], ['landingpad_large', -30, 34], ['solarpanel', 10, 34], ['solarpanel', 18, 34], ['roofmodule_solarpanels', -14, -30], ['cargo_A_stacked', 30, -24]].forEach(([m, x, z], k) => place(B, m, c.x + x, c.z + z, m.startsWith('base') ? 7 : m === 'landingpad_large' ? 6 : 6, (k * 1.3) % 6.28));
    place(B, 'k_rocket_baseA', c.x - 30, c.z + 34, 5); place(B, 'k_rocket_fuelA', c.x - 30, c.z + 34, 5, 0, 8); place(B, 'k_rocket_topA', c.x - 30, c.z + 34, 5, 0, 13);
    // теплицы
    const f = POI[1]; for (let k = 0; k < 4; k++) place(B, 'k_hangar_roundGlass', f.x - 18 + k * 12, f.z + (k % 2) * 8, 6, Math.PI / 2); place(B, 'k_machine_generator', f.x + 20, f.z - 12, 5);
    // заправка
    const st = POI[2]; place(B, 'cargodepot_A', st.x, st.z, 7); place(B, 'k_machine_barrelLarge', st.x + 14, st.z + 6, 6); place(B, 'k_machine_barrelLarge', st.x + 14, st.z - 6, 6); place(B, 'lights', st.x - 10, st.z + 10, 6); place(B, 'k_barrels', st.x - 12, st.z - 8, 5);
    // лайнер
    const ln = POI[3]; place(B, 's_Spaceship3', ln.x, ln.z, 2.4, 0.6, 2); place(B, 'k_craterLarge', ln.x + 25, ln.z + 10, 14); for (let k = 0; k < 6; k++) place(B, k % 2 ? 'containers_A' : 'cargo_B_stacked', ln.x - 30 + k * 11, ln.z - 26 + (k % 3) * 6, 5, k);
    // гнездо клопов — кристаллы
    const ns = POI[4]; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', ns.x + Math.cos(a) * 26, ns.z + Math.sin(a) * 26, 8 + (k % 3) * 2, a); }
    // Ржавобург: город на остатках грузовиков и тоннелей
    const rz = POI[5]; [['spacetruck_large', -20, 0, 9], ['spacetruck', 18, -14, 9], ['tunnel_straight_A', 0, 26, 9], ['drill_structure', 30, 20, 8], ['structure_tall', -34, -24, 8], ['cargodepot_A', 8, -36, 7], ['containers_C', -10, -20, 7], ['lander_A', -40, 26, 7], ['windturbine_tall', 40, -30, 7], ['basemodule_D', -2, 0, 7]].forEach(([m, x, z, s], k) => place(B, m, rz.x + x, rz.z + z, s, k * 0.8));
    // лагерь Коляна
    const cp = POI[6]; [['k_craft_cargoA', 0, 0, 7], ['k_craft_miner', -24, 14, 6], ['containers_B', 20, 18, 6], ['k_barrels', -12, -20, 6], ['k_machine_wireless', 24, -18, 6], ['k_satelliteDish', -30, -10, 6]].forEach(([m, x, z, s], k) => place(B, m, cp.x + x, cp.z + z, s, k));
    [[-18, -10, 6], [14, -16, 6], [-8, 18, 6], [20, 12, 6], [-26, 10, 6], [4, -30, 6], [30, -4, 4]].forEach(([x, z, r]) => addC(c.x + x, c.z + z, r));
    addC(ln.x, ln.z, 14); [[-20, 0, 9], [18, -14, 8], [-2, 0, 6], [30, 20, 5]].forEach(([x, z, r]) => addC(rz.x + x, rz.z + z, r)); addC(cp.x, cp.z, 9); addC(st.x, st.z, 7); }
  if (W.ch === 2) {
    // лагерь на краю: палатки-модули, ветряк, антенна
    const rim = byId('rim'); [['basemodule_A', -14, -8, 6], ['basemodule_garage', 14, -10, 6], ['r_corridor_detailed', 0, -22, 6], ['windturbine_tall', -24, 14, 6], ['r_satelliteDish_detailed', 22, 12, 6], ['k_barrels', 6, 16, 5]].forEach(([m, x, z, sc], k) => place(B, m, rim.x + x, rim.z + z, sc, k * 0.9));
    [[-14, -8, 5], [14, -10, 5], [0, -22, 5]].forEach(([x, z, r]) => addC(rim.x + x, rim.z + z, r));
    // кладбище кораблей: лайнеры лежат на боку, кости древнего зверя, рампы-крылья
    const gv = byId('grave'); [['s_Spaceship', -30, -20, 2.6, 0.4], ['s_Spaceship2', 28, 18, 2.8, 2.2], ['s_Spaceship4', -8, 34, 2.4, 1.2], ['r_craft_cargoB', 36, -26, 9, 0.8], ['k_craft_miner', -40, 22, 7, 2.6], ['r_bones', 6, -6, 22, 0.3]].forEach(([m, x, z, sc, ry]) => { place(B, m, gv.x + x, gv.z + z, sc, ry, 1.2); addC(gv.x + x, gv.z + z, m === 'r_bones' ? 5 : 9); });
    [[-12, 10, 0.2], [20, -6, 2.6], [-26, 4, 1.4]].forEach(([x, z, ry]) => place(B, 'r_pipe_rampLarge', gv.x + x, gv.z + z, 5, ry)); W.ramps2 = [[-12, 10, 0.2], [20, -6, 2.6], [-26, 4, 1.4]].map(([x, z, ry]) => ({ x: gv.x + x, z: gv.z + z, ry }));
    // корабль марсианина Пипа
    const pp = byId('pip'); place(B, 's_Spaceship5', pp.x, pp.z, 1.8, 1.1, 1.5); for (let k = 0; k < 5; k++) place(B, 'k_rock_crystals', pp.x + Math.cos(k * 1.3) * 14, pp.z + Math.sin(k * 1.3) * 14, 5, k); addC(pp.x, pp.z, 7);
    // колодцы Лабиринта Ночи — провалы и кристаллы
    const nc = byId('noctis'); for (let k = 0; k < 7; k++) place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', nc.x + Math.cos(k * 0.9) * 40, nc.z + Math.sin(k * 0.9) * 40, 7, k);
    // пиратская вышка над ущельем и пристань
    const tw = byId('tower'); [['r_platform_high', 0, 0, 9], ['r_gate_complex', 12, 6, 7], ['r_supports_high', -10, 8, 8], ['r_satelliteDish_detailed', 8, -10, 6]].forEach(([m, x, z, sc], k) => place(B, m, tw.x + x, tw.z + z, sc, k)); addC(tw.x, tw.z, 6);
    const dk = byId('dock'); for (let k = 0; k < 4; k++) { place(B, 'r_platform_long', dk.x - 30 + k * 18, dk.z + 26, 9, 0); place(B, 'r_supports_high', dk.x - 30 + k * 18, dk.z + 34, 6); }
    [['r_craft_speederA', -20, -10, 4, 0.5], ['r_craft_speederC', -8, -16, 4, 1.4], ['r_craft_speederD', 6, -20, 4, 2.3], ['r_barrels_rail', 24, -6, 7, 0], ['k_barrels', 30, 10, 6, 1], ['r_machine_wirelessCable', -30, 14, 6, 0.4], ['r_rocket_baseB', 40, -24, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, dk.x + x, dk.z + z, sc, ry));
    place(B, 'r_rocket_fuelB', dk.x + 40, dk.z - 24, 6, 0, 7.5); place(B, 'r_rocket_topB', dk.x + 40, dk.z - 24, 6, 0, 13.5); addC(dk.x + 40, dk.z - 24, 6);
  }
  // разброс: камни, кристаллы, метеориты, кратеры-модели
  for (let k = 0; k < 220; k++) { const x = (hash(k, 21) - 0.5) * SIZE * 0.95, z = (hash(k, 23) - 0.5) * SIZE * 0.95; if (roadDist(x, z) < 9 || POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r)) continue; const r = hash(k, 29);
    place(B, r < 0.45 ? 'rocks_A' : r < 0.7 ? 'rocks_B' : r < 0.85 ? 'k_rock_largeA' : r < 0.95 ? 'k_rocks_smallA' : 'k_meteor_detailed', x, z, 3 + hash(k, 31) * 6, hash(k, 37) * 6.28, -0.3); }
  if (B.p.length) S.add(new THREE.Mesh(B.build(), bakedMat));
  // россыпь камней (по одной сетке на вид камня — один вызов отрисовки)
  [['rock_A', 600, 2, 7], ['rocks_A', 240, 2, 5]].forEach(([m, n, s0, s1], q) => { if (!MODELS || !MODELS[m]) return; const b = new Builder([]); b.add(MODELS[m], null, null, { vcol: true, vk: 0.95 }); const im = new THREE.InstancedMesh(b.build(), bakedMat, n); let c2 = 0;
    for (let k = 0; k < n * 2 && c2 < n; k++) { const x = (hash(k, 41 + q) - 0.5) * SIZE * 0.96, z = (hash(k, 43 + q) - 0.5) * SIZE * 0.96; if (roadDist(x, z) < 8 || POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r * 0.8)) continue; const sc = s0 + hash(k, 47) * (s1 - s0); im.setMatrixAt(c2++, mat(x, H(x, z) - 0.15 * sc, z, sc, sc * (0.6 + hash(k, 53)), sc, hash(k, 59) * 6.28)); }
    im.count = c2; S.add(im); });
  // световые столбы над местами
  POI.forEach((p) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 160, 10, 1, true), new THREE.MeshBasicMaterial({ color: p.col, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    m.position.set(p.x, p.h + 80, p.z); S.add(m); p.beam = m; beams.push(m); });
  // столкновения с постройками (упрощённо — круги)
}
function buildScene() {
  const old = S, keep = old ? old.children.filter((o) => o.userData.keep) : [];
  if (old) old.traverse((o) => { if (o.geometry && !o.userData.keep && o.geometry !== MODELS[o.name]) { /* общие геометрии моделей не трогаем */ } });
  S = W.scene = new THREE.Scene(); const fogC = new THREE.Color(CHC.fog); S.fog = new THREE.Fog(fogC, 120, 520); S.background = fogC;
  hemi = new THREE.HemisphereLight('#ffe0c8', '#5a2a28', 0.9); S.add(hemi); sun = new THREE.DirectionalLight('#ffd0a0', 0.8); sun.position.set(0.5, 1, 0.3); S.add(sun);
  beams = []; buildTerrain(); buildPOIs(); if (!roverG) buildRover(); else S.add(roverG); keep.forEach((o) => S.add(o)); W.ready = true;
}
W.loadChapter = function (n) { setChapter(n); buildScene(); const st = CHC.start; R.x = st[0]; R.z = st[1]; R.h = st[2]; R.v = 0; R.y = H(R.x, R.z); R.vy = 0; R.air = 0; S.add(skyG); camP.set(R.x, R.y + 8, R.z - 12); if (W.onChapter) W.onChapter(n); };

/* ---------- марсоход ---------- */
const R = W.rover = { x: 6, z: 50, y: 0, h: Math.PI, v: 0, steer: 0, pitch: 0, roll: 0, sy: 0, svy: 0, air: 0, vy: 0 };
let roverG, dedT, gunT, wheels = [];
function buildRover() {
  roverG = new THREE.Group(); const body = new THREE.Group(); roverG.add(body); W.body = body;
  const B = new Builder(null), sh = (hex) => (cx, cy, cz, nx, ny, nz) => TC.set(hex).multiplyScalar(0.55 + 0.35 * Math.max(0, ny) + 0.18 * Math.max(0, nz) + 0.1 * Math.abs(nx));
  const box = (x, y, z, w, h, d, col, rx = 0) => B.add(BOX, mat(x, y, z, w, h, d, 0, rx), sh(col), { emit: true });
  box(0, 0.85, 0, 2.5, 0.45, 4.8, '#3a3438');                 // рама
  box(0, 1.75, 0.15, 2.3, 1.45, 3.6, '#b8c890');              // кузов «буханки»
  box(0, 2.5, 0.15, 2.2, 0.12, 3.4, '#a8b880');               // крыша
  box(0, 1.95, 1.98, 2.1, 0.62, 0.08, '#1a2a38');             // лобовое стекло
  for (const sd of [-1, 1]) { box(sd * 1.16, 2.0, 0.6, 0.06, 0.5, 1.2, '#1a2a38'); box(sd * 1.16, 2.0, -0.9, 0.06, 0.5, 1.0, '#1a2a38'); box(sd * 0.72, 1.32, 2.08, 0.42, 0.28, 0.06, '#fff4c0'); } // окна, фары
  box(0, 1.3, 2.1, 1.0, 0.5, 0.06, '#5a6448');                // решётка
  box(0, 1.1, 2.45, 2.6, 0.22, 0.25, '#2a2428'); box(0, 1.1, -2.45, 2.6, 0.22, 0.25, '#2a2428'); // бамперы
  box(0, 2.7, -0.9, 1.9, 0.08, 1.6, '#5a4a3a');               // багажник
  for (let k = 0; k < 5; k++) B.add(CYL, mat(-0.7 + k * 0.35, 2.92, -0.4, 0.13, 0.32, 0.13), sh(k % 2 ? '#d0303a' : '#e8803a'), { emit: true }); // банки варенья
  B.add(CYL, mat(0, 2.0, -2.55, 0.62, 0.3, 0.62, 0, Math.PI / 2), sh('#1e1a1c'), { emit: true }); // запаска
  B.add(CYL, mat(-1.0, 3.6, 1.2, 0.03, 2.2, 0.03), sh('#ccc'), { emit: true }); box(-0.82, 4.55, 1.2, 0.36, 0.22, 0.02, '#ff7a3a'); // антенна с флажком
  box(0.65, 2.62, 1.3, 0.9, 0.05, 0.7, '#2a3a6a');            // солнечная панель
  const bm = new THREE.Mesh(B.build(), new THREE.MeshBasicMaterial({ vertexColors: true })); body.add(bm); W.bodyMesh = bm;
  // колёса: одна сетка на 6 штук, у каждого своя подвеска и вращение
  const wg = new THREE.CylinderGeometry(0.62, 0.62, 0.5, 14); wg.rotateZ(Math.PI / 2); const wb = new Builder(null); wb.add(wg, null, (cx, cy, cz, nx, ny, nz) => TC.set(Math.abs(nx) > 0.7 ? '#4a4448' : '#1e1a1c').multiplyScalar(0.7 + 0.3 * Math.max(0, ny)), { emit: true });
  wb.add(BOX, mat(0.26, 0, 0, 0.04, 0.5, 0.12), '#888', { emit: true });
  W.wheels = new THREE.InstancedMesh(wb.build(), new THREE.MeshBasicMaterial({ vertexColors: true }), 6); W.wheels.frustumCulled = false; S.add(W.wheels);
  W.wpos = [[-1.42, -1.6], [1.42, -1.6], [-1.42, 0], [1.42, 0], [-1.42, 1.6], [1.42, 1.6]]; W.wsus = [0, 0, 0, 0, 0, 0]; W.wrot = 0;
  // турель деда на крыше
  dedT = new THREE.Group(); dedT.position.set(0, 2.6, -0.6); body.add(dedT);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.35, 12), new THREE.MeshLambertMaterial({ color: '#5a5a66' })); dedT.add(base);
  gunT = new THREE.Group(); gunT.position.y = 0.4; dedT.add(gunT);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.5, 8), new THREE.MeshLambertMaterial({ color: '#2a2a30' })); barrel.rotation.x = Math.PI / 2; barrel.position.set(0.32, 0.25, 0.75); gunT.add(barrel); W.barrel = barrel;
  if (FX.ded) { const d = FX.ded.clone(true); d.position.set(0, -0.1, -0.1); d.rotation.set(0, 0, 0); d.scale.setScalar(0.95); gunT.add(d); W.dedFig = d; }
  roverG.userData.keep = true; W.wheels.userData.keep = true; S.add(roverG); W.roverG = roverG; W.dedT = dedT; W.gunT = gunT;
}
function wheelsStep(dt) { const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(); W.wrot += R.v * dt / 0.62; roverG.updateMatrixWorld();
  W.wpos.forEach(([lx, lz], k) => { p.set(lx, 0.62, lz).applyMatrix4(roverG.matrixWorld); const gy = H(p.x, p.z) + 0.62, t = R.air > 0 ? -0.25 : Math.max(-0.35, Math.min(0.35, gy - p.y)); W.wsus[k] += (t - W.wsus[k]) * Math.min(1, dt * 18);
    p.set(lx, 0.62 + W.wsus[k], lz).applyMatrix4(roverG.matrixWorld); e.set(roverG.rotation.x, R.h + (lz > 1 ? R.steer * 0.35 : 0), roverG.rotation.z, 'YXZ'); q.setFromEuler(e); const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), W.wrot); q.multiply(q2); M.compose(p, q, sc); W.wheels.setMatrixAt(k, M); });
  W.wheels.instanceMatrix.needsUpdate = true; }
const keys = new Set(); addEventListener('keydown', (e) => keys.add(e.code)); addEventListener('keyup', (e) => keys.delete(e.code));
function roverStep(dt) {
  // ввод: джойстик (x — руль, y — газ/тормоз-назад), клавиатура WASD/стрелки
  let thr = 0, st = 0; if (JOY.id != null) { const jy = -JOY.y, jx = JOY.x; thr = Math.abs(jy) > 0.12 ? jy : 0; st = Math.abs(jx) > 0.1 ? -jx : 0; if (W.autoFwd && thr === 0 && Math.hypot(jx, jy) > 0.1) thr = 0.6; }
  if (keys.has('KeyW') || keys.has('ArrowUp')) thr = 1; if (keys.has('KeyS') || keys.has('ArrowDown')) thr = -1; if (keys.has('KeyA') || keys.has('ArrowLeft')) st = 1; if (keys.has('KeyD') || keys.has('ArrowRight')) st = -1;
  if (W.view === 2 && W.auto) { const a = W.auto; thr = a.thr; st = a.st; } // в турели ведёт бабка
  if (W.lock > 0) { thr = 0; st = 0; }
  const onRoad = roadDist(R.x, R.z) < 7, vmax = (W.vmax || 17) * (onRoad ? 1.18 : 1) * (W.fuelOut ? 0.3 : 1) * (W.slow || 1) * (W.ch === 2 && W.river2(R.x, R.z) && R.air <= 0 ? 0.55 : 1), n = normalAt(R.x, R.z);
  const fwd = new THREE.Vector3(Math.sin(R.h), 0, Math.cos(R.h)), slope = fwd.x * n.x + fwd.z * n.z; // спуск разгоняет, подъём тормозит
  if (R.air <= 0) { if (thr > 0) R.v += (thr * 9 - (R.v < 0 ? -6 : 0)) * dt; else if (thr < 0) R.v += thr * (R.v > 0 ? 14 : 6) * dt; else R.v -= Math.sign(R.v) * Math.min(Math.abs(R.v), (onRoad ? 2 : 4) * dt);
    R.v += slope * 9.8 * 0.55 * dt; R.v = Math.max(-6, Math.min(vmax, R.v)); if (R.v > vmax) R.v += (vmax - R.v) * dt * 2; }
  R.steer += (st - R.steer) * Math.min(1, dt * (Math.abs(st) > Math.abs(R.steer) ? 5 : 9));
  R.h += R.steer * dt * 1.7 * Math.min(1, Math.abs(R.v) / 6) * Math.sign(R.v || 1) * (R.air > 0 ? 0.2 : 1);
  let nx = R.x + Math.sin(R.h) * R.v * dt, nz = R.z + Math.cos(R.h) * R.v * dt;
  for (const c of W.COLL) { const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), rr = c.r + 1.6; if (d < rr) { nx = c.x + dx / d * rr; nz = c.z + dz / d * rr; if (Math.abs(R.v) > 9) { W.hurt && W.hurt(Math.abs(R.v) * 0.35, 'Бум! Постройка'); shake = 0.4; } R.v *= 0.5; } }
  nx = Math.max(-HALF + 20, Math.min(HALF - 20, nx)); nz = Math.max(-HALF + 20, Math.min(HALF - 20, nz)); R.x = nx; R.z = nz;
  // высота: подвеска и прыжки с бугров
  const gy = H(R.x, R.z);
  if (W.lift > 0) { W.lift -= dt; const ty = gy + 17 + Math.sin(W.t * 2) * 1.5; R.y += (ty - R.y) * Math.min(1, dt * 1.4); R.vy = 0; R.air = 1; R.h += dt * 0.9; R.v = Math.min(Math.max(R.v, 4), 7); if (Math.random() < 0.5) burst(S, R.x + (Math.random() - 0.5) * 8, R.y - 3, R.z + (Math.random() - 0.5) * 8, 'smoke', '#c88060', 5, 0.8); }
  else if (R.air > 0 || R.y > gy + 0.6) { R.vy -= 16 * dt; R.y += R.vy * dt; R.air = 1; if (R.y <= gy) { const imp = -R.vy; R.y = gy; R.vy = 0; R.air = 0; R.svy -= imp * 0.3; if (imp > 5) { shake = Math.min(0.6, imp * 0.05); sfx('thud', { vol: Math.min(1, imp / 12) }); buzz(Math.min(60, imp * 4)); } } }
  else { const prevY = R.y; R.y = gy; const climb = (gy - prevY) / dt; if (climb < -7 && R.v > 9) { R.vy = -climb * 0.35 + 2; R.air = 1; R.y = prevY; } } // слетели с гребня — полёт
  R.svy += (-R.sy * 80 - R.svy * 9) * dt; R.sy += R.svy * dt;
  // наклон по рельефу + крен в повороте
  const right = new THREE.Vector3(Math.cos(R.h), 0, -Math.sin(R.h)), tp = Math.asin(Math.max(-0.8, Math.min(0.8, -(fwd.x * n.x + fwd.z * n.z)))), tr = Math.asin(Math.max(-0.8, Math.min(0.8, right.x * n.x + right.z * n.z)));
  R.pitch += (tp - R.pitch) * Math.min(1, dt * 8); R.roll += (tr - R.steer * 0.08 * Math.min(1, R.v / 12) - R.roll) * Math.min(1, dt * 8);
  roverG.position.set(R.x, R.y + R.sy + 0.05, R.z); roverG.rotation.set(0, 0, 0); roverG.rotation.order = 'YXZ'; roverG.rotation.y = R.h; roverG.rotation.x = R.pitch; roverG.rotation.z = R.roll;
  // пыль из-под колёс
  if (Math.abs(R.v) > 8 && R.air <= 0 && Math.random() < 0.35 && !onRoad) burst(S, R.x - Math.sin(R.h) * 2, R.y + 0.5, R.z - Math.cos(R.h) * 2, 'smoke', '#c88060', 2.2, 0.6);
  W.speed = R.v; W.onRoad = onRoad; wheelsStep(dt);
}

/* ---------- камеры: 0 — сзади, 1 — кабина, 2 — турель деда ---------- */
const camP = new THREE.Vector3(), camL = new THREE.Vector3(), tmpV = new THREE.Vector3();
W.aimYaw = 0; W.aimPitch = 0.05;
function cameraStep(dt) {
  const cam = camera, port = innerWidth < innerHeight; cam.near = 0.15; cam.far = 650;
  if (W.view === 0) { const back = port ? 13 : 11, up = port ? 6.5 : 5; tmpV.set(R.x - Math.sin(R.h) * back, Math.max(H(R.x - Math.sin(R.h) * back, R.z - Math.cos(R.h) * back) + 2.5, R.y + up), R.z - Math.cos(R.h) * back);
    for (const c of W.COLL) if (Math.hypot(tmpV.x - c.x, tmpV.z - c.z) < c.r + 2.5) tmpV.y = Math.max(tmpV.y, R.y + 11); // не залезаем в постройки
    camP.lerp(tmpV, 1 - Math.exp(-dt * 5)); cam.position.copy(camP); camL.set(R.x + Math.sin(R.h) * 6, R.y + 1.6, R.z + Math.cos(R.h) * 6); cam.lookAt(camL); cam.fov += ((port ? 70 : 58) - cam.fov) * 0.1; }
  else if (W.view === 1) { roverG.updateMatrixWorld(); tmpV.set(-0.5, 2.15, 1.55).applyMatrix4(roverG.matrixWorld); cam.position.copy(tmpV); tmpV.set(-0.5, 1.6, 30).applyMatrix4(roverG.matrixWorld); cam.lookAt(tmpV); cam.fov += ((port ? 80 : 68) - cam.fov) * 0.15;
    cam.position.y += Math.sin(W.t * 20) * Math.min(0.03, Math.abs(R.v) * 0.002); }
  else { roverG.updateMatrixWorld(); dedT.updateMatrixWorld(); tmpV.set(0, 1.55, 0.1).applyMatrix4(dedT.matrixWorld); if (W.dedFig) W.dedFig.visible = false; cam.position.copy(tmpV); const yaw = R.h + W.aimYaw; tmpV.set(cam.position.x + Math.sin(yaw) * Math.cos(W.aimPitch) * 20, cam.position.y + Math.sin(W.aimPitch) * 20, cam.position.z + Math.cos(yaw) * Math.cos(W.aimPitch) * 20); cam.lookAt(tmpV); cam.fov += ((port ? 75 : 62) - cam.fov) * 0.15; }
  if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 1.6); }
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  // турель смотрит туда, куда целимся (в виде сзади/кабины — на цель, это делает боевой модуль)
  if (W.bodyMesh) W.bodyMesh.visible = W.view !== 1; if (W.view !== 2 && W.dedFig) W.dedFig.visible = true; gunT.rotation.y = W.aimYaw; W.barrel.rotation.x = Math.PI / 2 - W.aimPitch; roverG.visible = W.view !== 1 || true;
  skyG.position.copy(cam.position); S.fog.far = W.view === 0 ? 520 : 460;
}
W.setView = (v) => { W.view = v; document.body.classList.toggle('wdcab', v === 1); document.body.classList.toggle('wdtur', v === 2); $('wdView').textContent = ['🎥', '🚘', '🎯'][v]; sfx('click'); showMsg(['Вид сзади', 'Из кабины', 'Турель деда'][v], v === 2 ? 'палец справа — целься, держи — стреляй' : v === 1 ? 'баба Таня за рулём' : '', '#ffcf8a', 900); };

/* ---------- приборы и интерфейс ---------- */
function buildUI() {
  const css = document.createElement('style'); css.textContent = `
  body.world #tl,body.world #tr,body.world #turbo,body.world #prog,body.world #order,body.world #zl,body.world #zr,body.world #brk,body.world #stCard,body.world #sxHud{display:none!important}
  #wdHud{position:fixed;inset:0;pointer-events:none;z-index:6;display:none;font-family:system-ui,sans-serif}body.world #wdHud{display:block}
  #wdTop{position:absolute;left:12px;right:12px;top:calc(10px + env(safe-area-inset-top));display:flex;gap:8px;align-items:flex-start;justify-content:space-between}
  .wdBars{display:grid;gap:5px;min-width:130px}.wdBar{height:12px;border-radius:7px;background:rgba(20,8,16,.6);border:1px solid rgba(255,255,255,.15);overflow:hidden;position:relative}.wdBar i{position:absolute;inset:0;transform-origin:left;border-radius:7px}.wdBar b{position:absolute;left:6px;top:-1px;font-size:10px;color:#fff;text-shadow:0 1px 2px #000}
  #wdRes{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;max-width:58vw}#wdRes span{background:rgba(20,8,16,.62);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:3px 7px;font-weight:800;font-size:13px;color:#ffe8d0}#wdRes span.low{color:#ff7a5a;animation:flash .6s steps(2) infinite}
  #wdObj{position:absolute;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top));background:rgba(20,8,16,.66);border:1px solid rgba(255,210,120,.35);border-radius:12px;padding:5px 12px;color:#ffe0a0;font-weight:800;font-size:14px;white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis}
  #wdComp{position:absolute;left:50%;top:calc(96px + env(safe-area-inset-top));width:min(320px,80vw);height:26px;transform:translateX(-50%);overflow:hidden;border-radius:13px;background:linear-gradient(90deg,transparent,rgba(20,8,16,.5) 20%,rgba(20,8,16,.5) 80%,transparent)}#wdComp em{position:absolute;top:2px;font-style:normal;font-size:18px;transform:translateX(-50%)}#wdComp small{position:absolute;top:5px;font-size:11px;font-weight:800;color:#fff;transform:translateX(-50%)}#wdComp:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:2px;background:#ffd27a}
  #wdXp{position:absolute;left:0;right:0;top:0;height:4px;background:rgba(0,0,0,.4)}#wdXp i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7fe8ff,#b07aff);box-shadow:0 0 8px #7fe8ff}
  #wdBtns{position:absolute;right:14px;bottom:calc(18px + env(safe-area-inset-bottom));display:grid;gap:10px;pointer-events:auto}#wdBtns button{width:56px;height:56px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(30,14,22,.62);font-size:24px;color:#fff;touch-action:manipulation}
  #wdCross{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border:2px solid rgba(255,240,200,.85);border-radius:50%;display:none;box-shadow:0 0 0 1px #000 inset}#wdCross:before,#wdCross:after{content:'';position:absolute;background:rgba(255,240,200,.9)}#wdCross:before{left:50%;top:-10px;bottom:-10px;width:2px;margin-left:-1px}#wdCross:after{top:50%;left:-10px;right:-10px;height:2px;margin-top:-1px}body.wdtur #wdCross{display:block}
  #wdDash{position:absolute;left:0;right:0;bottom:0;height:32vh;display:none;background:linear-gradient(180deg,rgba(0,0,0,0),#1a1014 18%,#2a1a20);border-top:3px solid #3a2a30}body.wdcab #wdDash{display:block}
  #wdDash .glass{position:absolute;left:0;right:0;bottom:100%;height:68vh;pointer-events:none;background:radial-gradient(ellipse at 50% 120%,transparent 60%,rgba(0,0,0,.35));box-shadow:inset 0 0 0 10px #2a1a20,inset 0 0 40px rgba(0,0,0,.6);border-radius:30px 30px 0 0}
  #wdWheel{position:absolute;left:50%;bottom:-24vh;width:46vh;height:46vh;margin-left:-23vh;border-radius:50%;border:5vh solid #3a2420;box-shadow:inset 0 0 0 1vh #5a3a30,0 0 0 1vh #1a0c10}#wdWheel:before{content:'';position:absolute;left:50%;top:50%;width:70%;height:3.5vh;margin:-1.75vh 0 0 -35%;background:#3a2420;border-radius:2vh}#wdWheel:after{content:'👵';position:absolute;left:50%;top:6%;font-size:5vh;transform:translateX(-50%)}
  .dial{position:absolute;bottom:4vh;width:13vh;height:13vh;border-radius:50%;background:radial-gradient(#140a0e,#2a1a20);border:.7vh solid #5a3a30;color:#ffd27a;font:900 2.4vh system-ui;display:grid;place-items:center;text-align:center;line-height:1}.dial small{display:block;font-size:1.3vh;color:#c8a080;font-weight:700}
  #dSpd{left:6vw}#dFuel{right:6vw}#wdPie{position:absolute;left:50%;top:-58vh;font-size:5vh;transform-origin:50% 0;margin-left:-2.5vh}
  #wdCrack{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s}body.wdcab #wdCrack.on{opacity:1}
  #wdMapBox{position:fixed;inset:0;z-index:14;display:none;background:rgba(10,4,8,.92);align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#ffe0c0}#wdMapBox.on{display:flex}#wdMapBox canvas{width:min(92vw,80vh);height:min(92vw,80vh);border-radius:16px;border:2px solid #5a3a30}
  `; document.head.appendChild(css);
  const h = document.createElement('div'); h.id = 'wdHud'; h.innerHTML = `<div id="wdXp"><i></i></div>
    <div id="wdTop"><div class="wdBars"><div class="wdBar"><i id="wbHull" style="background:linear-gradient(90deg,#ff7a4a,#ffd24a)"></i><b>🛠 корпус</b></div><div class="wdBar"><i id="wbNerv" style="background:linear-gradient(90deg,#ff4a8a,#ff9ad5)"></i><b>❤ нервы бабули</b></div></div><div id="wdRes"></div></div>
    <div id="wdObj"></div><div id="wdComp"></div><div id="wdCross"></div>
    <svg id="wdCrack" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M70 20 L64 30 L72 38 L60 52 M64 30 L54 28 M72 38 L84 44" stroke="rgba(255,255,255,.7)" stroke-width=".4" fill="none"/><path d="M22 34 L30 42 L24 50 L34 60" stroke="rgba(255,255,255,.6)" stroke-width=".35" fill="none"/></svg>
    <div id="wdDash"><div class="glass"></div><div id="wdPie">🥟</div><div id="wdWheel"></div><div class="dial" id="dSpd"><div><b id="dSpdV">0</b><small>км/ч</small></div></div><div class="dial" id="dFuel"><div><b id="dFuelV">0</b><small>⛽ %</small></div></div></div>
    <div id="wdBtns"><button id="wdView">🎥</button><button id="wdJam">🫙</button><button id="wdMapB">🗺</button></div>`;
  document.body.appendChild(h);
  const mb = document.createElement('div'); mb.id = 'wdMapBox'; mb.innerHTML = '<b style="font-size:18px">Карта: окрестности «Заречной»</b><canvas id="wdMapC" width="512" height="512"></canvas><small>нажми, чтобы закрыть</small>'; document.body.appendChild(mb);
  mb.onclick = () => mb.classList.remove('on');
  $('wdView').onclick = (e) => { e.stopPropagation(); W.setView((W.view + 1) % 3); };
  $('wdMapB').onclick = (e) => { e.stopPropagation(); drawMap(); mb.classList.add('on'); sfx('open'); };
  $('wdJam').onclick = (e) => { e.stopPropagation(); W.special && W.special(); };
}
function drawMap() { const c = $('wdMapC'), x = c.getContext('2d'), N = 128, im = x.createImageData(N, N);
  if (!W.mapImg) { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const wx = (i / N - 0.5) * SIZE, wz = (j / N - 0.5) * SIZE, h = H(wx, wz), rd = roadDist(wx, wz), k = (j * N + i) * 4, sh = Math.max(0.3, Math.min(1.3, 0.85 + (H(wx + 6, wz) - h) * -0.08));
      let r = 190 + h * 2, g = 100 + h * 1.6, b = 70 + h; if (rd < 7) { r = 70; g = 50; b = 60; } im.data[k] = r * sh; im.data[k + 1] = g * sh; im.data[k + 2] = b * sh; im.data[k + 3] = 255; } W.mapImg = im; }
  const t = document.createElement('canvas'); t.width = t.height = N; t.getContext('2d').putImageData(W.mapImg, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(t, 0, 0, 512, 512);
  const P = (wx, wz) => [(wx / SIZE + 0.5) * 512, (wz / SIZE + 0.5) * 512]; x.font = '22px system-ui'; x.textAlign = 'center';
  POI.forEach((p) => { const [a, b] = P(p.x, p.z); x.fillStyle = p.col; x.globalAlpha = 0.3; x.beginPath(); x.arc(a, b, 16, 0, 7); x.fill(); x.globalAlpha = 1; x.fillText(p.e, a, b + 8); x.fillStyle = '#fff'; x.font = '12px system-ui'; x.fillText(p.name, a, b + 24); x.font = '22px system-ui'; });
  const [a, b] = P(R.x, R.z); x.save(); x.translate(a, b); x.rotate(-R.h + Math.PI); x.fillStyle = '#7fe8ff'; x.beginPath(); x.moveTo(0, -10); x.lineTo(7, 8); x.lineTo(-7, 8); x.fill(); x.restore(); }
W.drawMap = drawMap;
function hudStep() {
  const s = W.st; if (!s) return;
  $('wbHull').style.transform = `scaleX(${Math.max(0, s.hull / s.hullMax)})`; $('wbNerv').style.transform = `scaleX(${Math.max(0, s.nerves / 100)})`;
  const r = [['⛽', Math.round(s.fuel) + '%', s.fuel < 15], ['🥟', s.food, s.food <= 1], ['🧂', s.ammo, s.ammo < 20], ['⚙', s.parts], ['₽', s.money]];
  const html = r.map(([e, v, low]) => `<span class="${low ? 'low' : ''}">${e} ${v}</span>`).join(''); if (html !== W._rh) { $('wdRes').innerHTML = html; W._rh = html; }
  $('wdXp').firstChild.style.width = Math.min(100, s.xp / s.need * 100) + '%';
  // компас: цели и места
  const comp = $('wdComp'), list = []; const tgt = W.obj && W.obj.at;
  POI.forEach((p) => list.push([p.x, p.z, p.e, '', tgt === p ? 1 : 0])); if (W.obj && W.obj.x !== undefined) list.push([W.obj.x, W.obj.z, '🎯', '', 1]);
  let h = ''; for (const [x, z, e, , hot] of list) { const a = Math.atan2(x - R.x, z - R.z) - R.h - (W.view === 2 ? W.aimYaw : 0), d = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(d) > 1.2) continue; const px = 50 - d / 1.2 * 50, dist = Math.hypot(x - R.x, z - R.z);
    h += `<em style="left:${px}%;${hot ? 'font-size:22px;filter:drop-shadow(0 0 6px #ffd27a)' : 'opacity:.75'}">${e}</em>` + (hot ? `<small style="left:${px}%;top:14px">${Math.round(dist)} м</small>` : ''); }
  if (h !== W._ch) { comp.innerHTML = h; W._ch = h; }
  if (W.view === 1) { $('dSpdV').textContent = Math.round(Math.abs(R.v) * 3.6); $('dFuelV').textContent = Math.round(s.fuel); $('wdWheel').style.transform = `rotate(${-R.steer * 90}deg)`; $('wdPie').style.transform = `rotate(${Math.sin(W.t * 3) * 12 + R.steer * 20}deg)`; $('wdCrack').classList.toggle('on', s.hull < s.hullMax * 0.5); }
}
W.hudStep = hudStep;

/* ---------- вход и выход из режима ---------- */
W.start = function () {
  if (!W.ready) { if (!MODELS) { showMsg('Марс загружается…', '', '#ffcf8a', 900); setTimeout(W.start, 600); return; }
    if (!MODELS.r_craft_speederA) { if (!W.runLoading) { W.runLoading = 1; getPack('kn_run').then((k) => { Object.assign(MODELS, k); W.start(); }).catch(() => { MODELS.r_craft_speederA = MODELS.k_rover; W.start(); }); } return; }
    try { const sv = JSON.parse(localStorage.getItem('bm_world') || 'null'); if (sv && sv.ch) setChapter(sv.ch); } catch (e) {} buildScene(); buildUI(); }
  W.active = true; document.body.classList.add('world'); $('end').classList.remove('on');
  S.add(skyG); skyG.visible = true; babka.visible = false; R.y = H(R.x, R.z); camP.set(R.x, R.y + 8, R.z - 12);
  W.st = W.st || { hull: 120, hullMax: 120, nerves: 100, fuel: 100, food: 6, ammo: 160, parts: 0, money: 150, xp: 0, need: 8, lvl: 1 };
  if (W.onStart) W.onStart();
};
W.stop = function () { if (!W.active) return; W.active = false; document.body.classList.remove('world', 'wdcab', 'wdtur'); scene.add(skyG); babka.visible = true; };
W.frame = function (dt, now) {
  W.t += dt; if (!W.paused) { roverStep(dt); if (W.combat) W.combat(dt); if (W.logic) W.logic(dt); }
  cameraStep(dt); hudStep(); beams.forEach((b, k) => (b.material.opacity = 0.14 + Math.sin(W.t * 2 + k) * 0.05));
  sun.position.set(Math.sin(W.t * 0.01) * 0.6 + 0.3, 1, 0.3);
  renderer.render(S, camera);
};
// касания: левая часть — джойстик, правая — прицел/выстрел
W.pointer = function (e) {
  if (e.target.closest('#wdBtns') || e.target.closest('#wdMapBox') || e.target.closest('#rcards') || e.target.closest('#rdlg')) return;
  if (e.clientX < innerWidth * 0.48) { joyStart(e); return; }
  W.aimId = e.pointerId; W.aimX = e.clientX; W.aimY = e.clientY; W.firing = true; if (W.tap) W.tap(e.clientX, e.clientY);
};
addEventListener('pointermove', (e) => { if (!W.active || e.pointerId !== W.aimId) return; const dx = e.clientX - W.aimX, dy = e.clientY - W.aimY; W.aimX = e.clientX; W.aimY = e.clientY;
  if (W.view === 2) { W.aimYaw -= dx * 0.006; W.aimPitch = Math.max(-0.35, Math.min(0.6, W.aimPitch - dy * 0.005)); W.manual = 2.5; } });
const upAim = (e) => { if (e.pointerId === W.aimId) { W.aimId = null; W.firing = false; } }; addEventListener('pointerup', upAim); addEventListener('pointercancel', upAim);
})();
