/* =====================================================================
   ОТКРЫТЫЙ МАРС — часть 2: твари, оружие деда, опыт и карточки, урон, конец экспедиции
   ===================================================================== */
window.WD_PART2 = function () {
'use strict';
const W = window.WD, R = W.rover, V3 = THREE.Vector3;
let MON = null; const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), SC = new V3(), P = new V3(), CW = new THREE.Color(1, 1, 1), CH = new THREE.Color(3, 3, 3), CF = new THREE.Color(1.6, 0.6, 0.6);
const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)], dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

/* ---------- виды тварей ---------- */
const T = W.TYPES = {
  bug: { m: 'm_armabee', name: 'жук-броненосец', h: 1.5, hp: 3, sp: 8, dmg: 3, xp: 1, r: 1.1, ground: 1 },
  bug2: { m: 'm_armabee_evolved', name: 'жук-бронебой', h: 1.9, hp: 9, sp: 6.5, dmg: 9, xp: 3, r: 1.3, ground: 1 },
  jumper: { m: 'm_greenspikyblob', name: 'колючий прыгун', h: 1.7, hp: 6, sp: 5, dmg: 11, xp: 3, r: 1.2, ground: 1, buried: 1 },
  squid: { m: 'm_squidle', name: 'летучий кальмар', h: 2.2, hp: 8, sp: 9, dmg: 7, xp: 4, r: 1.5, fly: 5 },
  glub: { m: 'm_glub', name: 'рыба-пузырь', h: 1.4, hp: 2, sp: 13, dmg: 3, xp: 1, r: 1, fly: 3 },
  whirl: { m: 'm_hywirl', name: 'пылевой вихрь', h: 3.6, hp: 50, sp: 5, dmg: 14, xp: 18, r: 2.4, ground: 1, elite: 1 },
  ghost: { m: 'm_ghost', name: 'марсианский призрак', h: 2.4, hp: 10, sp: 7, dmg: 0, nerve: 6, xp: 5, r: 1.4, fly: 2 },
  gole: { m: 'm_goleling', name: 'страж гнезда', h: 2.4, hp: 22, sp: 4, dmg: 10, xp: 8, r: 1.6, fly: 2.5, shoots: 1 },
  pink: { m: 'm_pinkblob', name: 'слизень-делитель', h: 1.8, hp: 6, sp: 6, dmg: 4, xp: 2, r: 1.2, ground: 1, split: 1 },
  mush: { m: 'm_mushnub', name: 'гриб-путаник', h: 1.8, hp: 6, sp: 5, dmg: 5, xp: 3, r: 1.2, ground: 1, spore: 1 },
  pirate: { m: 'r_craft_speederA', name: 'пират на ховербайке', h: 1.5, hp: 12, sp: 18, dmg: 7, xp: 6, r: 2, fly: 1.2, rot: Math.PI },
  mine: { m: 'r_barrel', name: 'пиратская мина', h: 1.2, hp: 2, sp: 0, dmg: 16, xp: 1, r: 1.2, ground: 1, mine: 1 },
  sniper: { m: 'r_turret_single', name: 'пиратская турель', h: 3.4, hp: 30, sp: 0, dmg: 0, xp: 10, r: 2, ground: 1, still: 1 },
  dino: { m: 'm_dino', name: 'ящер-камнеед', h: 3.4, hp: 45, sp: 7, dmg: 14, xp: 14, r: 2.4, ground: 1, elite: 1 },
  barge: { m: 'r_craft_cargoB', name: 'Баржа «ТрансГалактик»', h: 9, hp: 700, sp: 9, dmg: 20, xp: 250, r: 9, fly: 8, boss: 1, rot: Math.PI },
  bpart: { m: 'r_turret_double', name: 'двигатель баржи', h: 3, hp: 170, sp: 0, dmg: 0, xp: 30, r: 2.4, fly: 8, boss: 1 },
  queen: { m: 'm_mushroomking', name: 'Королева гнезда', h: 6.5, hp: 420, sp: 4, dmg: 20, xp: 120, r: 4, ground: 1, boss: 1 },
  kolyan: { m: 'm_orc_skull', name: 'Бешеный Колян', h: 5.5, hp: 500, sp: 13, dmg: 16, xp: 200, r: 3.5, ground: 1, boss: 1 },
};
const EN = W.EN = []; const IM = {};
function initMon() { if (MON) return Promise.resolve(); return getPack('mars_mon').then((k) => { MON = Object.assign({}, k); for (const n in MODELS) if (n.startsWith('r_') || n.startsWith('s_') || n.startsWith('k_')) MON[n] = MODELS[n];
  for (const [id, t] of Object.entries(T)) { const g = MON[t.m]; if (!g) continue; g.computeBoundingBox(); const bb = g.boundingBox, hgt = bb.max.y - bb.min.y; t.sc = t.h / hgt; t.y0 = -bb.min.y * t.sc;
    const im = new THREE.InstancedMesh(g, MAT, t.boss ? 3 : t.elite ? 6 : 60); im.count = 0; im.frustumCulled = false; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.count * 3 + 180 * 3), 3); im.userData.keep = true; W.scene.add(im); IM[id] = im; } }); }
W.spawn = function (type, x, z, o = {}) { const t = T[type]; if (!t || !IM[type]) return null; if (EN.filter((e) => e.type === type && !e.dead).length >= (t.boss ? 3 : t.elite ? 6 : 60)) return null;
  const e = Object.assign({ type, t, x, z, y: W.H(x, z), vx: 0, vz: 0, h: rnd(0, 6), hp: t.hp * (o.hpK || 1), max: t.hp * (o.hpK || 1), hit: 0, cd: 0, ph: rnd(0, 6), st: t.buried ? 'buried' : 'go', age: 0 }, o); EN.push(e); return e; };

/* ---------- оружие деда ---------- */
const WEAP = W.WEAP = {
  salt: { name: 'Солевой дробовик', e: '🧂', d: 'Веер соли по ближайшим. Соль у деда не кончается', lv: 0, cost: 0, cd: [0.75, 0.68, 0.6, 0.52, 0.45], n: [5, 6, 7, 8, 10], dmg: [1.2, 1.4, 1.6, 1.9, 2.3], range: 26 },
  jam: { name: 'Варенье-гранаты', e: '🫙', d: 'Липкий взрыв: урон и замедление', lv: 0, cost: 3, cd: [2.6, 2.4, 2.1, 1.9, 1.6], dmg: [5, 7, 9, 12, 16], rad: [3.6, 4, 4.5, 5, 5.6], range: 30 },
  slip: { name: 'Тапок-бумеранг', e: '🩴', d: 'Летит, бьёт всех в линию и возвращается. Бесплатно', lv: 0, cost: 0, cd: [1.9, 1.7, 1.5, 1.3, 1.1], dmg: [2.5, 3, 3.6, 4.3, 5], n: [1, 1, 2, 2, 3], range: 18 },
  cuc: { name: 'Огурцы-ракеты', e: '🥒', d: 'Самонаводятся и взрываются', lv: 0, cost: 2, cd: [2.2, 1.9, 1.7, 1.5, 1.2], dmg: [6, 8, 10, 13, 17], n: [1, 2, 2, 3, 4], range: 40 },
  samo: { name: 'Самовар-огнемёт', e: '♨️', d: 'Конус кипятка вперёд, жжёт всех', lv: 0, cost: 1, cd: [0.22, 0.2, 0.18, 0.16, 0.14], dmg: [1.6, 2, 2.5, 3.1, 3.8], range: 11 },
  bayan: { name: 'Баян деда', e: '🪗', d: 'Звуковая волна вокруг марсохода. Бесплатно', lv: 0, cost: 0, cd: [5, 4.5, 4, 3.5, 3], dmg: [4, 6, 8, 11, 15], rad: [9, 10, 11, 12.5, 14] },
};
const PERK = W.PERK = {
  glasses: { name: 'Дед протёр очки', e: '👓', d: '+12% шанс крита (двойной урон)', lv: 0, max: 5 },
  salt: { name: 'Соль крупного помола', e: '💪', d: '+15% урон всему оружию', lv: 0, max: 5 },
  hands: { name: 'Быстрые руки деда', e: '✋', d: '−10% перезарядка', lv: 0, max: 5 },
  magnet: { name: 'Подкова-магнит', e: '🧲', d: '+40% радиус сбора', lv: 0, max: 4 },
  pots: { name: 'Броня из кастрюль', e: '🍲', d: '−12% урона марсоходу', lv: 0, max: 4 },
  pie: { name: 'Пирожок в дорогу', e: '🥟', d: '+25 к корпусу и макс. корпусу', lv: 0, max: 5 },
  thrift: { name: 'Запасливая бабка', e: '🧺', d: 'Шанс найти патроны в твари +8%', lv: 0, max: 4 },
  engine: { name: 'Мотор с самовара', e: '🔥', d: '+8% скорость марсохода', lv: 0, max: 3 },
  gosha: { name: 'Гоша на разведке', e: '🐱', d: 'Твари чаще роняют детали ⚙', lv: 0, max: 3 },
};
W.slots = 4;
const prj = []; // снаряды
const PG = {}; function prjMesh(id, geo, col, n = 120) { const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: col }), n); m.count = 0; m.frustumCulled = false; m.userData.keep = true; W.scene.add(m); PG[id] = m; }
function initPrj() { if (PG.salt) return; prjMesh('salt', new THREE.SphereGeometry(0.16, 6, 4), '#fffbe8', 200); prjMesh('jam', new THREE.CylinderGeometry(0.28, 0.28, 0.5, 8), '#d0303a', 30); prjMesh('slip', new THREE.BoxGeometry(0.9, 0.12, 0.38), '#4a8adf', 20); prjMesh('cuc', new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.2, 0.7, 3, 6) : new THREE.CylinderGeometry(0.2, 0.2, 1, 6), '#4ab84a', 40); prjMesh('spit', new THREE.SphereGeometry(0.35, 8, 6), '#9aff6a', 40); prjMesh('bolt', new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.16, 1.2, 3, 6) : new THREE.CylinderGeometry(0.16, 0.16, 1.4, 6), '#ff4a3a', 60);
  const gg = new THREE.OctahedronGeometry(0.35); W.gems = new THREE.InstancedMesh(gg, new THREE.MeshBasicMaterial({ color: '#7fe8ff' }), 300); W.gems.count = 0; W.gems.frustumCulled = false; W.gems.userData.keep = true; W.scene.add(W.gems);
  const rg = new THREE.RingGeometry(0.9, 1, 48); rg.rotateX(-Math.PI / 2); W.wave = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); W.wave.userData.keep = true; W.scene.add(W.wave); }
const gems = []; const loot = [];
function muzzle() { const b = W.barrel; b.updateMatrixWorld(); return new V3(0, 0.8, 0).applyMatrix4(b.matrixWorld); }
function aimDir(t) { const m = muzzle(); return new V3(t.x - m.x, (t.y + t.t.h * 0.5) - m.y, t.z - m.z).normalize(); }
function nearest(range, from) { const o = from || R; let b = null, bd = range * range; for (const e of EN) { if (e.dead || e.st === 'buried') continue; const d = dist2(e, o); if (d < bd) { bd = d; b = e; } } return b; }
function dmgMul() { return (1 + PERK.salt.lv * 0.15) * (W.flags && W.flags.pip ? 1.1 : 1); }
function crit() { return Math.random() < PERK.glasses.lv * 0.12 ? 2 : 1; }
W.hitEnemy = function (e, d, kx, kz) { if (e.dead) return; if (e.immune) { if (!W.immT || W.t - W.immT > 3) { W.immT = W.t; floatText(e.immMsg || '🛡 броня!', e.x, e.y + e.t.h, e.z, '#9fd8ff'); } return; } const c = crit(); d *= c * dmgMul() * (e.p === 'stun' ? 2 : 1); e.hp -= d; e.hit = 0.12; if (kx !== undefined && !e.t.boss) { e.vx += kx; e.vz += kz; }
  if (c > 1 || d >= 8) floatText((c > 1 ? '💥' : '') + Math.round(d), e.x, e.y + e.t.h + 0.5, e.z, c > 1 ? '#ffcf3a' : '#fff');
  if (e.hp <= 0) kill(e); };
function kill(e) { e.dead = true; const t = e.t; sfx(t.boss ? 'boom' : 'pot', { rnd: 0.3, vol: t.boss ? 1 : 0.5 }); burst(W.scene, e.x, e.y + t.h * 0.5, e.z, 'smoke', t.boss ? '#ffb04a' : '#c8a0ff', t.h * 1.2, 0.5); burst(W.scene, e.x, e.y + t.h * 0.5, e.z, 'spark', '#ffe08a', t.h, 0.3);
  const n = Math.max(1, Math.round(t.xp / 3)); for (let k = 0; k < n; k++) gems.push({ x: e.x + rnd(-1, 1), z: e.z + rnd(-1, 1), y: e.y + 0.6, v: t.xp / n });
  const r = Math.random(); if (r < 0.03 + PERK.gosha.lv * 0.03) loot.push(lootItem('⚙', e.x, e.z, 'parts', 1)); else if (r < 0.08 + PERK.thrift.lv * 0.06) loot.push(lootItem('🧂', e.x, e.z, 'ammo', 12)); else if (r < 0.14) loot.push(lootItem('⛽', e.x, e.z, 'fuel', 8)); else if (r < 0.13) loot.push(lootItem('🥟', e.x, e.z, 'food', 1));
  if (t.split && !e.small) for (let k = 0; k < 2; k++) { const s = W.spawn('pink', e.x + rnd(-1.5, 1.5), e.z + rnd(-1.5, 1.5), { hpK: 0.4, small: 1 }); if (s) s.scl = 0.6; }
  if (t.spore) { W.spore = 3.5; burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#b07aff', 6, 1.2); W.say && W.say('<b>Дед:</b> Таня, споры! Руль заело! Право — это лево!'); }
  W.st.kills = (W.st.kills || 0) + 1; if (W.onKill) W.onKill(e); }
function lootItem(e, x, z, res, n) { const sp = emojiSprite(e, 1.3); sp.position.set(x, W.H(x, z) + 1, z); W.scene.add(sp); return { sp, x, z, res, n, t: 0 }; }
W.dropLoot = (e, x, z, res, n) => loot.push(lootItem(e, x, z, res, n));
function fire(dt) { const st = W.st;
  for (const [id, w] of Object.entries(WEAP)) { if (!w.lv) continue; w.t = (w.t || 0) - dt; if (w.t > 0) continue; const L = w.lv - 1, cdm = 1 - PERK.hands.lv * 0.1;
    if (w.cost && st.ammo < w.cost) { if (!w.warn) { w.warn = 1; W.say && W.say('<b>Дед:</b> Таня, ' + w.name.toLowerCase() + ' — без патронов! Ищи ящики 🧂'); } continue; } w.warn = 0;
    const manual = W.view === 2 && (W.firing || W.manual > 0); let tgt = manual ? null : W.focus && !W.focus.dead && dist2(W.focus, R) < (w.range || 20) ** 2 ? W.focus : nearest(w.range || 20);
    if (id === 'bayan') { if (!nearest(w.rad[L])) continue; w.t = w.cd[L] * cdm; sfx('turbo', { vol: 0.5, rate: 0.6 }); W.waveT = 0; W.waveR = w.rad[L]; for (const e of EN) if (!e.dead && dist2(e, R) < w.rad[L] ** 2) { const d = Math.hypot(e.x - R.x, e.z - R.z) || 1; W.hitEnemy(e, w.dmg[L], (e.x - R.x) / d * 9, (e.z - R.z) / d * 9); } continue; }
    if (!manual && !tgt) continue; if (manual && !W.firing) continue;
    const m = muzzle(); let dir;
    if (manual) { const yaw = R.h + W.aimYaw; dir = new V3(Math.sin(yaw) * Math.cos(W.aimPitch), Math.sin(W.aimPitch), Math.cos(yaw) * Math.cos(W.aimPitch)); }
    else { dir = aimDir(tgt); const ya = Math.atan2(dir.x, dir.z) - R.h; W.aimYaw += Math.atan2(Math.sin(ya - W.aimYaw), Math.cos(ya - W.aimYaw)) * 0.6; W.aimPitch = Math.asin(Math.max(-0.4, Math.min(0.5, dir.y))) * 0.6; }
    w.t = w.cd[L] * cdm; st.ammo -= w.cost;
    if (id === 'salt') { for (let k = 0; k < w.n[L]; k++) { const d2 = dir.clone(); d2.x += rnd(-0.12, 0.12); d2.y += rnd(-0.05, 0.08); d2.z += rnd(-0.12, 0.12); d2.normalize(); prj.push({ k: 'salt', p: m.clone(), v: d2.multiplyScalar(55), life: w.range / 55, dmg: w.dmg[L] }); } sfx('shot', { rnd: 0.2, vol: 0.55 }); burst(W.scene, m.x, m.y, m.z, 'muzzle', '#fff2c0', 1.6, 0.08); shake = Math.max(shake, 0.06); }
    if (id === 'jam') { const to = tgt || { x: m.x + dir.x * 22, z: m.z + dir.z * 22 }, dx = to.x - m.x, dz = to.z - m.z, d = Math.hypot(dx, dz), T0 = Math.max(0.5, d / 22); prj.push({ k: 'jam', p: m.clone(), v: new V3(dx / T0, 9, dz / T0), g: 18, life: 3, dmg: w.dmg[L], rad: w.rad[L] }); sfx('jar', { vol: 0.5 }); }
    if (id === 'slip') throwSlip(w.n[L], w.dmg[L], w.range, dir);
    if (id === 'cuc') { for (let k = 0; k < w.n[L]; k++) prj.push({ k: 'cuc', p: m.clone(), v: new V3(dir.x * 14 + rnd(-6, 6), 10, dir.z * 14 + rnd(-6, 6)), life: 4, dmg: w.dmg[L], tgt: manual ? null : nearest(w.range) , home: 1 }); sfx('turbo', { vol: 0.35, rate: 1.6 }); }
    if (id === 'samo') { for (const e of EN) { if (e.dead) continue; const dx = e.x - m.x, dz = e.z - m.z, d = Math.hypot(dx, dz); if (d > w.range) continue; if ((dx * dir.x + dz * dir.z) / (d || 1) > 0.8) W.hitEnemy(e, w.dmg[L]); } if (Math.random() < 0.7) burst(W.scene, m.x + dir.x * 4, m.y + dir.y * 4, m.z + dir.z * 4, 'smoke', '#ffd8a0', 3, 0.4); if (Math.random() < 0.2) sfx('turbo', { vol: 0.2, rate: 2 }); }
  } }
function throwSlip(n, dmg, range, dir) { const m = muzzle(); for (let k = 0; k < n; k++) { const t = nearest(range); const d = dir ? dir.clone() : t ? aimDir(t) : new V3(Math.sin(R.h), 0, Math.cos(R.h)); const a = Math.atan2(d.x, d.z) + (k - (n - 1) / 2) * 0.4; prj.push({ k: 'slip', p: m.clone(), v: new V3(Math.sin(a) * 26, 0, Math.cos(a) * 26), life: 1.6, t: 0, dmg, back: 1, hitset: new Set() }); } sfx('slap', { vol: 0.4 }); }
function stepPrj(dt) { const cnt = { salt: 0, jam: 0, slip: 0, cuc: 0, spit: 0, bolt: 0 };
  for (let i = prj.length - 1; i >= 0; i--) { const p = prj[i]; p.life -= dt; p.t = (p.t || 0) + dt;
    if (p.k === 'slip' && p.t > 0.65) { const m = muzzle(), dx = m.x - p.p.x, dz = m.z - p.p.z, d = Math.hypot(dx, dz) || 1; p.v.set(dx / d * 30, 0, dz / d * 30); if (d < 1.5) p.life = 0; }
    if (p.home) { if (!p.tgt || p.tgt.dead) p.tgt = nearest(40, p.p); if (p.tgt && p.t > 0.3) { const d = new V3(p.tgt.x - p.p.x, p.tgt.y + p.tgt.t.h * 0.5 - p.p.y, p.tgt.z - p.p.z).normalize().multiplyScalar(30); p.v.lerp(d, Math.min(1, dt * 4)); } else p.v.y -= 6 * dt; }
    if (p.g) p.v.y -= p.g * dt; p.p.addScaledVector(p.v, dt);
    const gy = W.H(p.p.x, p.p.z);
    if (p.k === 'spit' || p.k === 'bolt') { if (Math.hypot(p.p.x - R.x, p.p.z - R.z) < 2 && Math.abs(p.p.y - R.y - 1.5) < 2) { W.hurt(p.dmg, p.k === 'bolt' ? 'пиратский бластер' : 'Плевок стража!'); p.life = 0; } }
    else if (p.k === 'jam') { if (p.p.y <= gy + 0.2 || p.life <= 0) { for (const e of EN) if (!e.dead && dist2(e, p.p) < p.rad * p.rad) { W.hitEnemy(e, p.dmg); e.slow = 2.5; } burst(W.scene, p.p.x, gy + 0.6, p.p.z, 'smoke', '#e0304a', p.rad * 1.4, 0.7); sfx('glass', { vol: 0.5, rnd: 0.2 }); shake = Math.max(shake, 0.12); p.life = 0; } }
    else { for (const e of EN) { if (e.dead || e.st === 'buried') continue; const ey = e.y + e.t.h * 0.5, rr = e.t.r * (e.scl || 1) + 0.4; if (Math.abs(p.p.x - e.x) > rr || Math.abs(p.p.z - e.z) > rr || Math.abs(p.p.y - ey) > e.t.h * 0.7 + 0.5) continue;
        if (p.k === 'slip') { if (p.hitset.has(e)) continue; p.hitset.add(e); W.hitEnemy(e, p.dmg, p.v.x * 0.15, p.v.z * 0.15); continue; }
        if (p.k === 'cuc') { for (const e2 of EN) if (!e2.dead && dist2(e2, p.p) < 9) W.hitEnemy(e2, p.dmg); burst(W.scene, p.p.x, p.p.y, p.p.z, 'spark', '#9aff6a', 4, 0.4); sfx('boom', { vol: 0.35, rate: 1.5 }); p.life = 0; break; }
        W.hitEnemy(e, p.dmg, p.v.x * 0.04, p.v.z * 0.04); p.life = 0; break; }
      if (p.p.y < gy && p.k !== 'slip') p.life = 0; }
    if ((p.k === 'spit' || p.k === 'bolt') && p.p.y < gy) p.life = 0;
    if (p.life <= 0) { prj.splice(i, 1); continue; }
    const m = PG[p.k]; if (!m || cnt[p.k] >= m.instanceMatrix.count) continue; E.set(p.t * (p.k === 'slip' ? 0 : 6), p.k === 'slip' ? p.t * 18 : Math.atan2(p.v.x, p.v.z), 0); Q.setFromEuler(E); SC.set(1, 1, 1); M4.compose(p.p, Q, SC); m.setMatrixAt(cnt[p.k]++, M4); }
  for (const k in PG) { PG[k].count = cnt[k] || 0; PG[k].instanceMatrix.needsUpdate = true; }
  if (W.waveT !== undefined && W.waveT < 0.5) { W.waveT += dt; W.wave.position.set(R.x, R.y + 0.6, R.z); W.wave.scale.setScalar(W.waveR * (W.waveT / 0.5)); W.wave.material.opacity = 0.8 * (1 - W.waveT / 0.5); } else if (W.wave) W.wave.material.opacity = 0; }

W.enemyShoot = function (e, spd = 26, dmg = 8) { const dx = R.x + Math.sin(R.h) * R.v * 0.5 - e.x, dz = R.z + Math.cos(R.h) * R.v * 0.5 - e.z, dy = R.y + 1.5 - (e.y + 1), d = Math.hypot(dx, dz, dy) || 1; prj.push({ k: 'bolt', p: new V3(e.x, e.y + 1, e.z), v: new V3(dx / d * spd, dy / d * spd, dz / d * spd), life: 3, dmg }); sfx('shot', { rate: 1.8, vol: 0.3 }); };
const reach0 = (e) => e.t.r * (e.scl || 1) + 1.7;
/* ---------- твари: повадки ---------- */
function stepEnemies(dt) { const cnt = {}; for (const id in IM) cnt[id] = 0; const fwdx = Math.sin(R.h), fwdz = Math.cos(R.h);
  for (let i = EN.length - 1; i >= 0; i--) { const e = EN[i], t = e.t; e.age += dt; e.ph += dt * 6;
    if (e.dead) { e.dt = (e.dt || 0) + dt; if (e.dt > 0.25) { EN.splice(i, 1); continue; } }
    else {
      const dx = R.x - e.x, dz = R.z - e.z, d = Math.hypot(dx, dz) || 1; if (d > 230 && !t.boss && !e.keep) { EN.splice(i, 1); continue; }
      const slow = e.slow > 0 ? 0.45 : 1; e.slow = (e.slow || 0) - dt;
      if (e.st === 'buried') { if (d < 16) { e.st = 'leap'; e.lt = 0; e.l0 = { x: e.x, z: e.z }; e.l1 = { x: R.x + fwdx * R.v * 0.6, z: R.z + fwdz * R.v * 0.6 }; sfx('jump', { vol: 0.6 }); burst(W.scene, e.x, e.y + 0.4, e.z, 'smoke', '#c88060', 3, 0.5); } }
      else if (e.st === 'leap') { e.lt += dt / 0.8; const k = Math.min(1, e.lt); e.x = e.l0.x + (e.l1.x - e.l0.x) * k; e.z = e.l0.z + (e.l1.z - e.l0.z) * k; e.jy = Math.sin(k * Math.PI) * 5; if (k >= 1) { e.st = 'go'; e.jy = 0; } }
      else if (e.ai) e.ai(e, dt, d, dx, dz);
      else if (t.still || t.mine) { e.vx = 0; e.vz = 0; if (t.m === 'r_turret_single') { e.st3 = (e.st3 || 2) - dt; e.h = Math.atan2(dx, dz); if (e.st3 <= 0 && d < 130) { e.st3 = 2.6; W.enemyShoot(e, 34, 9); } } }
      else { const sp = t.sp * slow * (e.age < 0.6 ? 0.3 : 1); let tx = dx / d, tz = dz / d;
        if (t.fly && d < 8) { tx += fwdx * 0.8; tz += fwdz * 0.8; } // летающие держатся над марсоходом
        e.vx += (tx * sp - e.vx) * Math.min(1, dt * 3); e.vz += (tz * sp - e.vz) * Math.min(1, dt * 3); if (d < 30 && R.v > 4) { e.vx += fwdx * R.v * 0.5 * dt; e.vz += fwdz * R.v * 0.5 * dt; } }
      e.x += e.vx * dt; e.z += e.vz * dt; if (!t.still) e.h = Math.atan2(e.vx, e.vz) || e.h;
      e.y = W.H(e.x, e.z) + (t.fly ? t.fly + Math.sin(e.ph * 0.5) * 0.6 : 0) + (e.jy || 0);
      if (t.fly === 5 && d < 3.2) e.y -= 2.5; // кальмар опускается и бьёт током
      if (t.mine && d < reach0(e)) { W.hurt(t.dmg, 'мина'); e.hp = 0; kill(e); burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#ff6a3a', 6, 0.7); shake = 0.5; sfx('boom'); continue; }
      // касание марсохода
      const reach = t.r * (e.scl || 1) + 1.7, spd = Math.abs(R.v);
      if (d < reach && spd > 7 && !t.boss && !t.elite && !t.fly && Math.abs(e.y - R.y) < 2.5 && (e.ram || 0) <= 0) { e.ram = 0.4; const fx = Math.sin(R.h), fz = Math.cos(R.h); if ((-dx * fx - dz * fz) / d > 0.3) { W.hitEnemy(e, spd * 0.9, fx * spd * 1.2 + (-dz / d) * 6, fz * spd * 1.2 + (dx / d) * 6); e.cd = 0.6; sfx('slap', { vol: 0.6, rnd: 0.3 }); burst(W.scene, e.x, e.y + 1, e.z, 'spark', '#ffd27a', 2, 0.25); if (!W.ramT || W.t - W.ramT > 6) { W.ramT = W.t; if (Math.random() < 0.4) W.say && W.say(pick(['<b>Баба Таня:</b> Посторонись, членистоногие!', '<b>Дед:</b> Таня, это таран! Как в 72-м на тракторе!', '<b>Баба Таня:</b> Пешеходам — дорогу. Жукам — нет!'])); } } }
      e.ram = (e.ram || 0) - dt;
      e.cd -= dt; if (d < reach && e.cd <= 0 && Math.abs(e.y - R.y) < 4.5) { e.cd = t.boss ? 1.2 : 0.9; if (t.dmg) W.hurt(t.dmg, t.name); if (t.nerve) W.nerve(-t.nerve, 'Призрак шепчет: «Тань, а газ ты выключила?»'); if (!t.boss) { e.vx -= dx / d * 10; e.vz -= dz / d * 10; } if (t.fly === 5) { W.flashCol = '#7fe8ff'; flash('#7fe8ff', 0.35); sfx('warn', { vol: 0.4 }); } }
      if (t.shoots) { e.st2 = (e.st2 || rnd(1, 3)) - dt; if (e.st2 <= 0 && d < 40) { e.st2 = rnd(2.2, 3.5); const v = new V3(dx, 0, dz).normalize().multiplyScalar(18); v.y = 4; prj.push({ k: 'spit', p: new V3(e.x, e.y + 1.5, e.z), v, g: 4, life: 3, dmg: 8 }); sfx('jump', { vol: 0.3, rate: 0.7 }); } }
      if (t.elite && d < 14 && t.m === 'm_hywirl') { R.v *= 1 - dt * 0.6; R.h += dt * 0.7; if (Math.random() < 0.3) burst(W.scene, e.x, e.y + 2, e.z, 'smoke', '#c88060', 5, 0.8); } // вихрь крутит и тормозит
      e.hit = Math.max(0, e.hit - dt);
    }
    // рисуем
    const im = IM[e.type]; if (!im || cnt[e.type] >= 60 && !t.boss) continue; const s = t.sc * (e.scl || 1), sq = e.dead ? 1 + e.dt * 4 : 1, bob = t.ground ? Math.abs(Math.sin(e.ph * 1.6)) * 0.12 : 0;
    E.set(t.fly ? Math.sin(e.ph) * 0.1 : 0, e.h + (t.rot || 0), e.st === 'leap' ? -0.4 : 0, 'YXZ'); Q.setFromEuler(E); SC.set(s * sq * (1 + (t.ground ? Math.sin(e.ph * 3.2) * 0.05 : 0)), s * (e.dead ? Math.max(0.05, 1 - e.dt * 4) : 1 + (t.ground ? Math.sin(e.ph * 3.2 + 1.5) * 0.07 : Math.sin(e.ph * 2) * 0.05)), s * sq);
    if (e.st === 'buried') { SC.multiplyScalar(0.35); P.set(e.x, e.y - 0.5, e.z); } else P.set(e.x, e.y + t.y0 * (e.scl || 1) + bob, e.z);
    M4.compose(P, Q, SC); const k = cnt[e.type]++; im.setMatrixAt(k, M4); im.setColorAt(k, e.hit > 0 ? CH : e.slow > 0 ? CF : CW); }
  for (const id in IM) { IM[id].count = cnt[id]; IM[id].instanceMatrix.needsUpdate = true; if (IM[id].instanceColor) IM[id].instanceColor.needsUpdate = true; } }

/* ---------- опыт, находки, магнит ---------- */
function stepGems(dt) { const st = W.st, mr = 5 * (1 + PERK.magnet.lv * 0.4); let n = 0;
  for (let i = gems.length - 1; i >= 0; i--) { const g = gems[i], dx = R.x - g.x, dz = R.z - g.z, d = Math.hypot(dx, dz); if (d < mr) { const sp = 28 * (1 - d / mr) + 8; g.x += dx / d * sp * dt; g.z += dz / d * sp * dt; }
    if (d < 1.8) { gems.splice(i, 1); st.xp += g.v; W.combo = (W.combo || 0) + 1; W.comboT = 0.6; sfx('coin', { vol: 0.25, rate: 1 + Math.min(1, W.combo * 0.03) }); if (st.xp >= st.need) levelUp(); continue; }
    if (d > 260) { gems.splice(i, 1); continue; } if (n < 300) { P.set(g.x, W.H(g.x, g.z) + 0.6 + Math.sin(W.t * 4 + i) * 0.15, g.z); E.set(0, W.t * 2 + i, 0); Q.setFromEuler(E); SC.set(1, 1, 1); M4.compose(P, Q, SC); W.gems.setMatrixAt(n++, M4); } }
  W.gems.count = n; W.gems.instanceMatrix.needsUpdate = true; W.comboT -= dt; if (W.comboT <= 0) W.combo = 0;
  for (let i = loot.length - 1; i >= 0; i--) { const l = loot[i]; l.t += dt; l.sp.position.y = W.H(l.x, l.z) + 1.1 + Math.sin(l.t * 3) * 0.2; const d = Math.hypot(R.x - l.x, R.z - l.z);
    if (d < mr * 0.8) { l.x += (R.x - l.x) * dt * 4; l.z += (R.z - l.z) * dt * 4; l.sp.position.x = l.x; l.sp.position.z = l.z; }
    if (d < 2.2) { W.give(l.res, l.n); W.scene.remove(l.sp); loot.splice(i, 1); } else if (l.t > 60) { W.scene.remove(l.sp); loot.splice(i, 1); } } }
W.give = function (res, n, silent) { const st = W.st; if (res === 'hull') st.hull = Math.min(st.hullMax, st.hull + n); else if (res === 'fuel') st.fuel = Math.min(100, st.fuel + n); else st[res] = (st[res] || 0) + n;
  if (!silent) { const em = { fuel: '⛽', food: '🥟', ammo: '🧂', parts: '⚙', money: '₽', hull: '🛠' }[res] || ''; floatText('+' + n + ' ' + em, R.x, R.y + 3.5, R.z, '#9aff8a'); sfx('pick', { vol: 0.6 }); } };

/* ---------- урон, нервы, конец ---------- */
W.hurt = function (d, who) { const st = W.st; if (W.god || st.dead || (W.iframe || 0) > 0) return; W.iframe = 0.45; d *= 1 - PERK.pots.lv * 0.12; st.hull -= d; W.hurtT = 0.3; flash('#ff3a2a', 0.22 + Math.min(0.3, d / 60)); shake = Math.max(shake, 0.2 + d * 0.01); buzz(30 + d * 2); sfx('thud', { vol: 0.6 + Math.min(0.4, d / 30) });
  if (Math.random() < 0.18) W.say && W.say(pick(['<b>Баба Таня:</b> Ваня, по нам стреляют! В смысле — грызут!', '<b>Дед:</b> Не бойся, Таня! Это они нас боятся!', '<b>Баба Таня:</b> Кастрюли держат! Пока…', '<b>Гоша:</b> МЯ-А-АУ!']));
  if (st.hull <= 0) W.gameOver('Марсоход разбит: ' + (who || '')); };
W.nerve = function (d, why) { const st = W.st; st.nerves = Math.max(0, Math.min(100, st.nerves + d)); if (d < 0 && why && Math.random() < 0.5) W.say && W.say(why); if (st.nerves <= 0) W.gameOver('У бабули кончились нервы'); };
W.gameOver = function (why) { const st = W.st; if (st.dead) return; st.dead = true; W.paused = true; sfx('j_fail'); W.onGameOver && W.onGameOver(why); };

/* ---------- новый уровень: три карточки ---------- */
function levelUp() { const st = W.st; st.xp -= st.need; st.lvl++; st.need = Math.round(6 + st.lvl * 4 + st.lvl * st.lvl * 0.3); W.pendingLv = (W.pendingLv || 0) + 1; if (!W.paused) showCards(); }
function cardPool() { const own = Object.values(WEAP).filter((w) => w.lv).length, out = [];
  for (const [id, w] of Object.entries(WEAP)) if (w.lv < 5 && (w.lv || own < W.slots)) out.push({ kind: 'w', id, e: w.e, name: w.name, lv: w.lv, d: w.lv ? 'Уровень ' + (w.lv + 1) + ': ' + upText(id, w.lv) : w.d, rare: w.lv ? 0 : 1 });
  for (const [id, p] of Object.entries(PERK)) if (p.lv < p.max) out.push({ kind: 'p', id, e: p.e, name: p.name, lv: p.lv, d: p.d, rare: 0 });
  if (!out.length) out.push({ kind: 'h', id: 'heal', e: '🍵', name: 'Чай из самовара', d: '+40 корпуса и +20 нервов', lv: 0 }); return out; }
function upText(id, lv) { return { salt: 'больше дробин и быстрее', jam: 'больше урон и радиус', slip: 'тапки сильнее, их больше', cuc: 'больше огурцов', samo: 'кипяток горячее', bayan: 'волна шире и чаще' }[id] || 'сильнее'; }
function showCards() { W.paused = true; W.pendingLv--; const pool = cardPool(), ch = []; while (ch.length < 3 && pool.length) ch.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  let box = document.getElementById('rcards'); if (!box) { box = document.createElement('div'); box.id = 'rcards'; document.body.appendChild(box); const css = document.createElement('style'); css.textContent = `#rcards{position:fixed;inset:0;z-index:15;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:radial-gradient(ellipse at 50% 40%,rgba(60,20,50,.75),rgba(10,4,10,.92));padding:16px;color:#ffe8d0;font-family:system-ui}#rcards.on{display:flex}#rcards h2{margin:0;font-size:24px;color:#ffd27a;text-shadow:0 0 18px rgba(255,200,100,.6);animation:pop .4s both}#rcards .cs{display:grid;gap:10px;width:min(440px,100%)}
    #rcards button{display:grid;grid-template-columns:54px 1fr;gap:4px 12px;align-items:center;text-align:left;border-radius:16px;padding:12px 14px;border:2px solid rgba(255,210,140,.35);background:linear-gradient(135deg,rgba(80,40,60,.95),rgba(40,18,30,.95));color:#ffe8d0;font:600 13px/1.3 system-ui;cursor:pointer;animation:pop .35s cubic-bezier(.2,1.5,.4,1) both}#rcards button:nth-child(2){animation-delay:.08s}#rcards button:nth-child(3){animation-delay:.16s}
    #rcards button i{grid-row:span 2;font-style:normal;font-size:40px;text-align:center;filter:drop-shadow(0 0 10px rgba(255,220,140,.5))}#rcards button b{font-size:17px;color:#fff}#rcards button.new{border-color:#7fe8ff;box-shadow:0 0 22px rgba(127,232,255,.35)}#rcards button.new b:after{content:' НОВОЕ';font-size:11px;color:#7fe8ff;margin-left:6px}#rcards small{opacity:.7}`; document.head.appendChild(css); }
  box.innerHTML = `<h2>Уровень ${W.st.lvl}! Дед выбирает…</h2><div class="cs">${ch.map((c, k) => `<button data-k="${k}" class="${c.rare ? 'new' : ''}"><i>${c.e}</i><b>${c.name}${c.lv ? ' ' + '★'.repeat(c.lv) : ''}</b><span>${c.d}</span></button>`).join('')}</div><small>оружие стреляет само · выбери улучшение</small>`;
  box.classList.add('on'); sfx('j_found'); box.querySelectorAll('button').forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); const c = ch[+b.dataset.k]; applyCard(c); sfx('click'); box.classList.remove('on'); if (W.pendingLv > 0) setTimeout(showCards, 250); else { W.paused = false; } })); }
function applyCard(c) { const st = W.st; if (c.kind === 'w') WEAP[c.id].lv++; else if (c.kind === 'p') { PERK[c.id].lv++; if (c.id === 'pie') { st.hullMax += 25; st.hull += 25; } if (c.id === 'engine') W.vmax = 17 * (1 + PERK.engine.lv * 0.08); } else { st.hull = Math.min(st.hullMax, st.hull + 40); W.nerve(20); }
  showMsg(c.e + ' ' + c.name, '', '#ffd27a', 1000); }
W.showCards = showCards; W.levelUp = levelUp;

/* ---------- специальный удар: банка варенья по нажатию кнопки ---------- */
W.special = function () { const st = W.st; if (st.ammo < 4) { sfx('dry'); W.say && W.say('<b>Дед:</b> Банок нет, Таня!'); return; } const t = nearest(35); if (!t) { sfx('dry'); return; } st.ammo -= 4; const m = muzzle(), dx = t.x - m.x, dz = t.z - m.z, d = Math.hypot(dx, dz), T0 = Math.max(0.5, d / 22); prj.push({ k: 'jam', p: m.clone(), v: new V3(dx / T0, 9, dz / T0), g: 18, life: 3, dmg: 18, rad: 5.5 }); sfx('jar'); };
W.tap = function (x, y) { if (W.view === 2) return; // тап по твари — дед бьёт её первой
  let best = null, bd = 70; for (const e of EN) { if (e.dead) continue; P.set(e.x, e.y + e.t.h * 0.5, e.z).project(camera); const sx = (P.x + 1) / 2 * innerWidth, sy = (1 - P.y) / 2 * innerHeight, d = Math.hypot(sx - x, sy - y); if (P.z < 1 && d < bd) { bd = d; best = e; } }
  if (best) { W.focus = best; burst(W.scene, best.x, best.y + best.t.h + 0.6, best.z, 'spark', '#ff5a4a', 1.4, 0.3); } };

/* ---------- кадр боя ---------- */
W.combat = function (dt) { if (W.manual > 0) W.manual -= dt; W.iframe = (W.iframe || 0) - dt; if (W.spore > 0) { W.spore -= dt; W.sxs = -1; } else W.sxs = 1;
  if (W.focus && (W.focus.dead || Math.hypot(W.focus.x - R.x, W.focus.z - R.z) > 40)) W.focus = null;
  fire(dt); stepPrj(dt); stepEnemies(dt); stepGems(dt); if (W.director) W.director(dt);
  if (W.pendingLv > 0 && !W.paused && !(document.getElementById('rcards') || {}).classList?.contains('on')) showCards(); };
W.initCombat = () => { initPrj(); return initMon(); };
W.resetCombat = function () { EN.length = 0; prj.length = 0; gems.length = 0; loot.forEach((l) => W.scene.remove(l.sp)); loot.length = 0; for (const w of Object.values(WEAP)) { w.lv = 0; w.t = 0; } for (const p of Object.values(PERK)) p.lv = 0; WEAP.salt.lv = 1; W.vmax = 17; };
};
