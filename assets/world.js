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

// глава 3: Кидония — равнина со столовыми горами, «Лицо на Марсе», кратер-смайлик, столица марсиан Ксар-Тала
const base3 = (x, z) => (fbm(x / 220 + 40, z / 220 - 13) - 0.45) * 30 + (fbm(x / 45, z / 45) - 0.5) * 3.5 + Math.max(0, Math.max(Math.abs(x), Math.abs(z)) - 600) * 0.25;
const FACE = { x: 300, z: -250 }, SMILE = { x: -430, z: -330 };
W.FACE = FACE;
function face3(x, z, b) { const dx = (x - FACE.x) / 1.3, dz = (z - FACE.z) / 1.3, e = Math.sqrt((dx / 100) ** 2 + (dz / 130) ** 2); if (e > 1.08) return b;
  const f = 1 - sstep(0.62, 1.08, e); let top = 34;
  for (const sx of [-1, 1]) { const ed = Math.hypot(dx - sx * 34, dz + 34); top -= (1 - sstep(8, 19, ed)) * 13; top += Math.exp(-(((dx - sx * 34) / 20) ** 2) - (((dz + 62) / 7) ** 2)) * 6; } // глаза и брови
  if (Math.abs(dx) < 9 && dz > -22 && dz < 30) top += (1 - sstep(4, 9, Math.abs(dx))) * (2 + (dz + 22) / 52 * 7) * (1 - sstep(22, 30, dz)); // нос-трамплин
  const mz = 62 + dx * dx / 260; if (Math.abs(dx) < 46) top -= (1 - sstep(3, 9, Math.abs(dz - mz))) * 8; // рот
  return b * (1 - f) + (b + top) * f; }
function smile3(x, z, h) { const dx = x - SMILE.x, dz = z - SMILE.z, d = Math.hypot(dx, dz); if (d > 85) return h;
  h += d < 55 ? -9 * (1 - (d / 55) ** 2) : 0; h += 7 * Math.exp(-(((d - 55) / 12) ** 2));
  for (const sx of [-1, 1]) h += 5 * Math.exp(-((Math.hypot(dx - sx * 17, dz + 14) / 6) ** 2));
  if (dz > 0 && d < 55) h += 4 * Math.exp(-(((d - 30) / 4) ** 2)) * sstep(0, 12, dz); return h; }

// глава 4: Кристальные пещеры — сеть тоннелей в скале, залы, подземное море, шахта «Глубинная-3»
const WALL4 = 46, WL4 = -3, SEA4 = { x: 120, z: 40, r: 175 }, ISLE4 = { x: 150, z: 60, r: 30 };
const floor4 = (x, z) => (fbm(x / 70 + 9, z / 70 - 4) - 0.5) * 7;
function cave4(x, z) { let c = 0; for (const r of ROADS) for (let i = 0; i < r.length - 1; i++) { const [d] = segDist(x, z, r[i], r[i + 1]); const hw = r.hw || 13; if (d < hw + 8) c = Math.max(c, 1 - sstep(hw, hw + 8, d)); }
  for (const p of POI) { if (p.id === 'island') continue; const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * 1.25) c = Math.max(c, 1 - sstep(p.r * 0.85, p.r * 1.25, d)); } return c; }
W.cave = (x, z) => W.ch === 4 ? cave4(x, z) : 1;

// глава 5: Северная полярная шапка — ледяной купол со спиральной долиной, кратер Королёв со льдом, гейзеры, каньон дракона
const D5 = { x: 330, z: -330 }, KOR5 = { x: -250, z: 250 }, GEY5 = { x: 300, z: 250 };
const spiral5 = (u) => { const th = u * Math.PI * 3.5, r = 50 + 195 * u; return [D5.x + Math.cos(th) * r, D5.z + Math.sin(th) * r]; };
W.spiral5 = spiral5; W.D5 = D5; W.KOR5 = KOR5; W.GEY5 = GEY5;
const SP5 = []; for (let i = 0; i <= 70; i++) SP5.push(spiral5(i / 70));
W.spiralD = (x, z) => { let d = 1e9; for (let i = 0; i < SP5.length - 1; i++) { const a = SP5[i], b = SP5[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)), q = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); if (q < d) d = q; } return d; };
const dome5 = (x, z) => { const r = Math.hypot(x - D5.x, z - D5.z); return r < 430 ? 72 * (1 - (r / 430) ** 2) ** 1.4 : 0; };
const base5 = (x, z) => (fbm(x / 200 + 3, z / 200 + 8) - 0.5) * 14 + (fbm(x / 30, z / 30) - 0.5) * 1.6 + dome5(x, z) + Math.max(0, Math.max(Math.abs(x), Math.abs(z)) - 610) * 0.3;
function korolev5(x, z, h) { const d = Math.hypot(x - KOR5.x, z - KOR5.z); if (d > 130) return h; const fl = -8, k = 1 - sstep(80, 96, d); h = h * (1 - k) + fl * k; return h + 12 * Math.exp(-(((d - 100) / 12) ** 2)); }

// глава 6: Фобос — маленький спутник-картофелина: горизонт загибается, гравитация слабая, борозды, кратер Стикни, в небе — огромный Марс
const STK6 = { x: -260, z: 210 }, DECK6 = { x: -260, z: 210, hl: 110, hw: 24 };
W.STK6 = STK6; W.DECK6 = DECK6;
const curve6 = (x, z) => -(x * x + z * z) / (2 * 1500);
const base6 = (x, z) => (fbm(x / 120 + 21, z / 120 - 9) - 0.5) * 22 + (fbm(x / 28, z / 28) - 0.5) * 2.6 + curve6(x, z) - 2.4 * Math.max(0, Math.sin((x * 0.8 + z * 0.6) / 9)) ** 10 - 1.8 * Math.max(0, Math.sin((x * 0.3 - z * 0.95) / 11)) ** 10;
function stickney6(x, z, h) { const d = Math.hypot(x - STK6.x, z - STK6.z); if (d > 230) return h; const fl = base6(STK6.x, STK6.z) - 34, k = 1 - sstep(130, 175, d); return h * (1 - k) + (fl + (d / 175) ** 2 * 10) * k + 16 * Math.exp(-(((d - 185) / 20) ** 2)); }
W.deckY = () => stickney6(STK6.x, STK6.z, base6(STK6.x, STK6.z)) + 26;
function deck6(x, z, h) { if (W.ch !== 6 || !W.deckOn) return h; const dx = x - DECK6.x, dz = z - DECK6.z, Y = W.deckY(); if (Math.abs(dx) <= DECK6.hl && Math.abs(dz) <= DECK6.hw) return Math.max(h, Y);
  if (dx > DECK6.hl && dx < DECK6.hl + 80 && Math.abs(dz) < 14) { const k = (dx - DECK6.hl) / 80; return Math.max(h, Y * (1 - k) + h * k); } return h; }

// глава 7: Фарсида и Олимп — три вулкана, реки лавы, обрыв Олимпа, кальдера на вершине
const OLY7 = { x: 250, z: -150 }, CONES7 = [{ id: 'arsia', x: -470, z: 330 }, { id: 'pavonis', x: -430, z: 0 }, { id: 'ascraeus', x: -390, z: -330 }], RIV7 = [3.5, 4.4, 5.6];
W.OLY7 = OLY7;
const base7 = (x, z) => (fbm(x / 200 + 61, z / 200 - 17) - 0.5) * 16 + (fbm(x / 35, z / 35) - 0.5) * 2.4;
function lava7(x, z) { const dx = x - OLY7.x, dz = z - OLY7.z, r = Math.hypot(dx, dz); if (r < 80 || r > 520) return 99; const a = Math.atan2(dz, dx); let best = 99;
  for (const ra of RIV7) { let da = a - (ra + Math.sin(r / 60 + ra) * 0.08); da = Math.atan2(Math.sin(da), Math.cos(da)); best = Math.min(best, Math.abs(da) * r); } return best; }
W.lava7 = (x, z) => W.ch === 7 && (lava7(x, z) < 6 || (!W.flags.done && Math.hypot(x - OLY7.x, z - OLY7.z) < 20)) && roadDist(x, z) > 8;
function raw7(x, z) { let h = base7(x, z);
  for (const c of CONES7) { const d = Math.hypot(x - c.x, z - c.z); if (d < 130) h += 42 * Math.max(0, 1 - d / 125) ** 1.25 - (d < 14 ? 7 * (1 - (d / 14) ** 2) : 0); }
  const r = Math.hypot(x - OLY7.x, z - OLY7.z); if (r < 360) { const top = 45 + 90 * Math.max(0, 1 - r / 330) ** 1.3, k = 1 - sstep(320, 340, r); h = h * (1 - k) + (top + base7(x, z) * 0.3) * k; if (r < 80) h -= 28 * (1 - (r / 80) ** 2) * sstep(0, 1, 1); }
  const lv = lava7(x, z); if (lv < 9) h -= (1 - sstep(4, 9, lv)) * 2.2; return h; }

// глава 8: Церера — карликовая планета в поясе астероидов: лёд и соль, кратер Оккатор с яркими пятнами, гора Ахуна
const OCC8 = { x: -320, z: 200 }, AHU8 = { x: 300, z: 260 }, RIG8 = { x: 330, z: -330 }, MINE8 = { x: -250, z: -300 };
W.OCC8 = OCC8; W.AHU8 = AHU8; W.MINE8 = MINE8;
const base8 = (x, z) => (fbm(x / 160 - 41, z / 160 + 23) - 0.5) * 18 + (fbm(x / 30, z / 30) - 0.5) * 2 - (x * x + z * z) / (2 * 2200);
function raw8(x, z) { let h = base8(x, z) + craterH(x, z) * 0.9; const od = Math.hypot(x - OCC8.x, z - OCC8.z);
  if (od < 170) { const k = 1 - sstep(95, 125, od); h = h * (1 - k) + (base8(OCC8.x, OCC8.z) - 18) * k + 14 * Math.exp(-(((od - 128) / 14) ** 2)) + (od < 22 ? 9 * (1 - (od / 22) ** 2) : 0); }
  const ad = Math.hypot(x - AHU8.x, z - AHU8.z); if (ad < 90) h += 55 * (1 - sstep(38, 70, ad)); return h; }
W.salt8 = (x, z) => { const od = Math.hypot(x - OCC8.x, z - OCC8.z); return od < 26 || (Math.hypot(x - OCC8.x - 45, z - OCC8.z + 20) < 16) || (Math.hypot(x - OCC8.x + 40, z - OCC8.z - 30) < 12); };
// глава 9: Венера — город на воздушных шарах в 50 км над поверхностью: внизу море жёлтых облаков, платформы и мосты висят на шарах
const cloud9 = (x, z) => -40 + (fbm(x / 90 + 7, z / 90 - 3) - 0.5) * 26 + (fbm(x / 26, z / 26) - 0.5) * 5;
W.deck9 = (x, z) => W.ch === 9 && (POI.some((p) => Math.hypot(x - p.x, z - p.z) < p.r) || roadDist(x, z) < 6.5);
// глава 10: Европа, спутник Юпитера — гладкий лёд с рыжими трещинами-линиями, «хаос» из ледяных глыб, под льдом океан; в небе — огромный Юпитер
const LIN10 = [0, 1, 2, 3, 4, 5, 6].map((k) => ({ a: hash(k, 301) * Math.PI, c: (hash(k, 303) - 0.5) * 1100, w: 40 + hash(k, 305) * 60 })), CHAOS10 = { x: -60, z: -300, r: 130 }, LAIR10 = { x: 300, z: -320 };
W.LAIR10 = LAIR10;
const line10 = (x, z) => { let best = 99; for (const L of LIN10) { const ca = Math.cos(L.a), sa = Math.sin(L.a), u = x * ca + z * sa, v = -x * sa + z * ca; best = Math.min(best, Math.abs(u - L.c - Math.sin(v / L.w * 0.6) * 18)); } return best; };
W.line10 = line10;
// глава 11: Титан, спутник Сатурна — оранжевая дымка, тёмные дюны, метановое море Кракена с островом-причалом; в небе — Сатурн с кольцами
const SEA11 = { x: 0, z: -440, r: 170 }, ISLE11 = { x: 0, z: -440, r: 44 }; W.SEA11 = SEA11; W.ISLE11 = ISLE11;
const dune11 = (x, z) => Math.pow(Math.max(0, Math.sin(z / 16 + Math.sin(x / 90) * 1.6 + fbm(x / 70, z / 70) * 2)), 2) * (0.45 + 0.55 * sstep(-40, -260, x)); W.dune11 = dune11;
const sea11 = (x, z) => Math.hypot(x - SEA11.x, (z - SEA11.z) * 0.85); W.sea11 = sea11;
// глава 12: Луна — серый реголит, тёмные «моря», кратеры, борозда Хэдли поперёк карты (перепрыгнуть с трамплина); в небе — Земля
const rille12 = (x) => -250 + Math.sin(x / 90) * 18 + Math.sin(x / 37) * 5, RAMP12 = { x: 0, z0: -196, z1: -224, h: 4.2 }; W.rille12 = rille12; W.RAMP12 = RAMP12;
const rilleK12 = (x, z) => { const d = Math.abs(z - rille12(x)); return (1 - sstep(16, 24, d)) * (1 - sstep(430, 520, Math.abs(x))); }; W.rilleK12 = rilleK12;
// глава 13: Земля — казахская степь у Байконура: ровная, жёлто-зелёная, сухие овраги; железная дорога от монтажного корпуса к Гагаринскому старту
const RAIL13 = [[-260, -60], [-60, -230], [200, -330]]; W.RAIL13 = RAIL13;
// глава 14: Волга у Камышина — широкая река с юга на север, высокий правый (западный) берег, низкий левый, песчаная коса посреди реки
const riverX14 = (z) => 40 + Math.sin(z / 230) * 70 + Math.sin(z / 90) * 12, KOSA14 = { x: 0, z: -330, r: 40 }; W.riverX14 = riverX14; W.KOSA14 = KOSA14;
function raw14(x, z) { const xc = riverX14(z), d = x - xc, ad = Math.abs(d); let h = (fbm(x / 200 + 3, z / 200 - 2) - 0.5) * 8 + (fbm(x / 35, z / 35) - 0.5) * 1.2;
  if (d < 0) h += sstep(-95, -170, d) * 14 + (fbm(x / 80, z / 80) - 0.5) * 6 * sstep(-110, -200, d); // правый берег — высокий
  if (ad < 110) { const k = 1 - sstep(70, 110, ad); h = h * (1 - k) - 9 * k; }
  const kd = Math.hypot(x - riverX14(KOSA14.z) - KOSA14.x, (z - KOSA14.z) * 0.6); if (kd < KOSA14.r + 20) { const k = 1 - sstep(KOSA14.r, KOSA14.r + 20, kd); h = h * (1 - k) + 0.8 * k; } return h; }
function raw13(x, z) { let h = (fbm(x / 230 + 4, z / 230 - 6) - 0.5) * 9 + (fbm(x / 40, z / 40) - 0.5) * 1.3; const g = Math.abs(Math.sin(x / 140 + Math.sin(z / 90) * 1.2) * 60 + z * 0.15 - 40); if (g < 14) h -= (1 - g / 14) ** 2 * 5; return h; }
function raw12(x, z) { let h = (fbm(x / 160 + 2, z / 160 + 7) - 0.5) * 12 + (fbm(x / 22, z / 22) - 0.5) * 1.2 + craterH(x, z); const cd = Math.hypot(x + 340, z + 80); if (cd < 110) h += -12 * (1 - (cd / 70) ** 2) * (cd < 70 ? 1 : 0) + 7 * Math.exp(-(((cd - 74) / 12) ** 2)); return h; }
// после дорог: трамплин и борозда (дорога их не сглаживает)
function post12(x, z, h) { const k = rilleK12(x, z); return k > 0 ? h - 20 * k : h; }
function solid12(x, z) { const R = RAMP12, u = (R.z0 - z) / (R.z0 - R.z1); return Math.abs(x - R.x) < 6.5 && u > 0 && u < 1.12 ? (u <= 1 ? R.h * u : R.h * (1 - (u - 1) / 0.12)) : 0; }
function raw11(x, z) { let h = (fbm(x / 170 + 9, z / 170 - 4) - 0.5) * 10 + (fbm(x / 26, z / 26) - 0.5) * 1.1 + dune11(x, z) * 4.5; const d = sea11(x, z); if (d < SEA11.r + 50) { const k = sstep(SEA11.r - 30, SEA11.r + 50, d); h = h * k - 14 * (1 - k); }
  const di = Math.hypot(x - ISLE11.x, z - ISLE11.z); if (di < ISLE11.r + 26) { const k = sstep(ISLE11.r, ISLE11.r + 26, di); h = h * k + 1.5 * (1 - k); } return h; }
function raw10(x, z) { let h = (fbm(x / 180 + 5, z / 180 - 11) - 0.5) * 9 + (fbm(x / 30, z / 30) - 0.5) * 1.2; const d = line10(x, z); if (d < 12) h += 2.2 * (Math.exp(-(((d - 3.5) / 1.6) ** 2)) + Math.exp(-(((d + 3.5) / 1.6) ** 2))) - (d < 1.5 ? 0.6 : 0);
  const cd = Math.hypot(x - CHAOS10.x, z - CHAOS10.z); if (cd < CHAOS10.r) { const k = 1 - sstep(CHAOS10.r * 0.7, CHAOS10.r, cd), b = hash(Math.floor(x / 14), Math.floor(z / 14)); h += k * (b > 0.55 ? (b - 0.55) * 14 : -1); } return h; }
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
  3: { name: 'Кидония и Ксар-Тала', fog: '#a87452', pal: ['#b0603a', '#dca878', '#7a4634', '#46262a', '#3a2c30'],
    pois: [
      { id: 'customs', name: 'Таможня Ксар-Талы', e: '🛃', x: -540, z: 420, r: 36, col: '#7fe8ff', kind: 'gate' },
      { id: 'ksar', name: 'Ксар-Тала, столица марсиан', e: '🏙', x: -200, z: 150, r: 85, col: '#7aff8a', kind: 'city' },
      { id: 'museum', name: 'Музей землян', e: '🏛', x: -40, z: 250, r: 30, col: '#ffd24a', kind: 'museum' },
      { id: 'face', name: 'Лицо Кидонии', e: '🗿', x: FACE.x, z: FACE.z, r: 150, col: '#ff9a4a', kind: 'face', flat: 0 },
      { id: 'ant1', name: 'Антенна «Привет-1»', e: '📡', x: 380, z: 300, r: 22, col: '#9aff6a', kind: 'antenna' },
      { id: 'ant2', name: 'Антенна «Привет-2»', e: '📡', x: 120, z: 540, r: 22, col: '#9aff6a', kind: 'antenna' },
      { id: 'ant3', name: 'Антенна «Привет-3»', e: '📡', x: 580, z: 60, r: 22, col: '#9aff6a', kind: 'antenna' },
      { id: 'smile', name: 'Кратер-смайлик', e: '😊', x: SMILE.x, z: SMILE.z, r: 60, col: '#ffe07a', kind: 'smile', flat: 0 },
      { id: 'zurga', name: 'Дворец тёщи Зурги', e: '🫖', x: 60, z: -540, r: 70, col: '#ff4a8a', kind: 'boss' }],
    roads: [[[-600, 560], [-540, 420], [-420, 320], [-300, 220], [-200, 150]], [[-200, 150], [-90, 210], [-40, 250]], [[-200, 150], [-40, 40], [120, -80], [200, -110]],
      [[-200, 150], [-140, -100], [-40, -330], [60, -540]], [[-90, 210], [120, 300], [380, 300], [580, 60]], [[120, 300], [120, 540]], [[-200, 150], [-380, -80], [SMILE.x, SMILE.z - 70]]],
    start: [-600, 560, Math.PI * 0.8],
    raw(x, z) { let h = base3(x, z); const m = fbm(x / 110 + 70, z / 110 - 50); if (m > 0.6) h += Math.min(1, (m - 0.6) * 12) * 22; return smile3(x, z, face3(x, z, h)) + craterH(x, z); },
    road(x, z, h, k, y) { return h * (1 - k) + y * k; },
    poiH: (p) => base3(p.x, p.z) + 1, craters: 16 },
  4: { name: 'Кристальные пещеры', fog: '#1e1630', fogNear: 30, fogFar: 210, dark: 1, water: WL4, pal: ['#7a5c80', '#a08aa8', '#5a4466', '#2e2236', '#3a3040'],
    pois: [
      { id: 'lift', name: 'Ствол шахты «Глубинная-3»', e: '🛗', x: -520, z: -480, r: 40, col: '#ffd24a', kind: 'gate' },
      { id: 'grib', name: 'Грибоград, город гномов', e: '🍄', x: -250, z: -200, r: 75, col: '#7aff8a', kind: 'city' },
      { id: 'shtrek', name: 'Штреки «Глубинной-3»', e: '⛏', x: -470, z: 150, r: 60, col: '#ffb04a', kind: 'mine' },
      { id: 'sea', name: 'Подземное море', e: '🌊', x: SEA4.x, z: SEA4.z, r: SEA4.r, col: '#4ad8ff', kind: 'sea' },
      { id: 'island', name: 'Маяк на острове', e: '🗼', x: ISLE4.x, z: ISLE4.z, r: ISLE4.r, col: '#fff07a', kind: 'isle' },
      { id: 'grot', name: 'Кристальный грот', e: '💎', x: 430, z: -330, r: 60, col: '#b07aff', kind: 'lair' },
      { id: 'lair', name: 'Логово червя', e: '🪱', x: 470, z: 420, r: 95, col: '#ff4a6a', kind: 'boss' }],
    roads: [[[-520, -480], [-420, -380], [-330, -280], [-250, -200]], [[-250, -200], [-330, -60], [-430, 60], [-470, 150]],
      [[-470, 150], [-570, 230]], [[-470, 150], [-400, 260]], [[-470, 150], [-590, 90]], [[-470, 150], [-360, 190]],
      [[-250, -200], [-140, -130], [-60, -60]], [[280, 110], [430, -330]], [[280, 110], [380, 260], [470, 420]],
      Object.assign([[430, -330], [560, -170], [610, 60], [580, 260], [470, 420]], { hw: 8 })],
    start: [-512, -468, Math.PI * 0.75],
    raw(x, z) { const c = cave4(x, z), f = floor4(x, z) - (Math.hypot(x - SEA4.x, z - SEA4.z) < SEA4.r * 1.1 ? (1 - sstep(SEA4.r * 0.7, SEA4.r * 1.05, Math.hypot(x - SEA4.x, z - SEA4.z))) * 14 : 0) + (1 - sstep(ISLE4.r * 0.6, ISLE4.r, Math.hypot(x - ISLE4.x, z - ISLE4.z))) * 15;
      const wall = WALL4 + (fbm(x / 30, z / 30) - 0.5) * 22; return wall * (1 - c) + f * c; },
    road(x, z, h, k, y) { return h * (1 - k * 0.7) + y * k * 0.7; },
    poiH: (p) => floor4(p.x, p.z), craters: 0 },
  5: { name: 'Полярная шапка', fog: '#3a4a70', fogNear: 60, fogFar: 380, ice: 1, aurora: 1, pal: ['#9fb4d0', '#d4e0f0', '#62789e', '#3e4c6e', '#8296b6'],
    pois: [
      { id: 'ldinsk', name: 'Станция «Льдинск»', e: '🏕', x: -450, z: -150, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'korolev', name: 'Кратер Королёв — каток', e: '🏒', x: KOR5.x, z: KOR5.z, r: 95, col: '#7fe8ff', kind: 'rink', flat: 0 },
      { id: 'geyser', name: 'Поле гейзеров', e: '⛲', x: GEY5.x, z: GEY5.z, r: 80, col: '#bfefff', kind: 'geyser' },
      { id: 'pass', name: 'Перевал Йети', e: '⛰', x: 9, z: -256, r: 30, col: '#ffd24a', kind: 'pass', flat: 0 },
      { id: 'top', name: 'Вершина купола', e: '🏔', x: D5.x, z: D5.z, r: 40, col: '#ffffff', kind: 'top', flat: 0 },
      { id: 'dragon', name: 'Каньон Северный — логово дракона', e: '🐉', x: 330, z: -610, r: 75, col: '#4ad8ff', kind: 'boss' }],
    roads: [[[-450, -150], [-380, 60], [-300, 190]], [[-450, -150], [-200, -210], [9, -256], [200, -300], [D5.x, D5.z]], [[-200, 250], [0, 300], [GEY5.x, GEY5.z]], [[GEY5.x, GEY5.z], [-50, 60], [-450, -150]], SP5.filter((q, i) => i % 2 === 0 || i === 70).map((q) => [q[0], q[1], 'raw'])],
    start: [-430, -110, Math.PI * 0.9],
    raw(x, z) { let h = korolev5(x, z, base5(x, z)); const sd = W.spiralD ? W.spiralD(x, z) : 99; h -= (1 - sstep(6, 16, sd)) * 7;
      const al = (x - 9) * 0.976 - (z + 256) * 0.219, pe = Math.abs((x - 9) * 0.219 + (z + 256) * 0.976); if (Math.abs(al) < 80 && pe < 170) h += 30 * Math.exp(-((al / 22) ** 2)) * sstep(12, 26, pe) * (1 - sstep(120, 170, pe)); // перевал: хребет с проходом
      const ld = Math.hypot(x - 330, z + 610); if (ld < 120) h = h * sstep(60, 120, ld) + (-16) * (1 - sstep(60, 120, ld)); return h; },
    road(x, z, h, k, y) { return h * (1 - k * 0.8) + y * k * 0.8; },
    poiH: (p) => base5(p.x, p.z), craters: 8 },
  6: { name: 'Фобос', fog: '#05060c', fogNear: 320, fogFar: 1100, far: 1800, space: 1, g: 3.6, pal: ['#5c5652', '#7e7670', '#46403e', '#2a2628', '#56504c'],
    pois: [
      { id: 'port', name: 'Космопорт «Фобос-Узловая»', e: '🛰', x: 0, z: -40, r: 80, col: '#7aff8a', kind: 'city' },
      { id: 'hangar', name: 'Ангар тарелок', e: '🛸', x: 170, z: -150, r: 40, col: '#9aff6a', kind: 'hangar' },
      { id: 'tail', name: 'Под хвостом кометы', e: '☄️', x: 380, z: 300, r: 90, col: '#7fe8ff', kind: 'comet' },
      { id: 'stickney', name: 'Кратер Стикни — флагман', e: '🏴‍☠️', x: STK6.x, z: STK6.z, r: 175, col: '#ff4a3a', kind: 'boss', flat: 0 }],
    roads: [[[0, -40], [170, -150]], [[0, -40], [150, 120], [380, 300]], [[0, -40], [-120, 80], [-90, 210]], [[0, -40], [-300, -250]], [[0, -40], [300, -350]]],
    start: [10, 20, Math.PI],
    raw(x, z) { return stickney6(x, z, base6(x, z)) + craterH(x, z) * 0.8; },
    road(x, z, h, k, y) { return h * (1 - k * 0.8) + y * k * 0.8; },
    poiH: (p) => base6(p.x, p.z), craters: 30 },
  7: { name: 'Олимп', fog: '#7a3a2a', fogNear: 120, fogFar: 620, far: 900, lava: 1, pal: ['#a84a2a', '#d07a48', '#5a2a22', '#2a1414', '#4a2a22'],
    pois: [
      { id: 'arsia', name: 'Гора Арсия', e: '🌋', x: -470, z: 330, r: 22, col: '#ffb04a', kind: 'peak', flat: 0 },
      { id: 'pavonis', name: 'Гора Павлина', e: '🌋', x: -430, z: 0, r: 22, col: '#ff6a4a', kind: 'peak', flat: 0 },
      { id: 'ascraeus', name: 'Аскрийская гора', e: '🌋', x: -390, z: -330, r: 22, col: '#ffd24a', kind: 'peak', flat: 0 },
      { id: 'village', name: 'Посёлок «Подножье»', e: '🏘', x: -60, z: 260, r: 60, col: '#7aff8a', kind: 'city' },
      { id: 'pad', name: 'Стартовая площадка у обрыва', e: '🚀', x: -125, z: -120, r: 30, col: '#7fe8ff', kind: 'pad' },
      { id: 'caldera', name: 'Кальдера Олимпа', e: '🔥', x: OLY7.x, z: OLY7.z, r: 70, col: '#ff3a1a', kind: 'boss', flat: 0 }],
    roads: [[[-560, 600], [-500, 460], [-470, 330]], [[-470, 330], [-470, 160], [-430, 0]], [[-430, 0], [-430, -170], [-390, -330]], [[-390, -330], [-250, -40], [-60, 260]], [[-60, 260], [-120, 80], [-125, -120]], [[-40, -125], [100, -140], [180, -150]]],
    start: [-555, 590, Math.PI * 0.9],
    raw: raw7,
    road(x, z, h, k, y) { return h * (1 - k * 0.6) + y * k * 0.6; },
    poiH: (p) => raw7(p.x, p.z), craters: 14 },
  8: { name: 'Церера', fog: '#06070e', fogNear: 320, fogFar: 1100, far: 1800, space: 1, mars: 0, belt: 1, g: 5, pal: ['#4e4e56', '#6a6a74', '#3a3a42', '#222228', '#4a4a52'],
    pois: [
      { id: 'transit', name: 'Станция «Церера-Транзит»', e: '🛰', x: 0, z: 0, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'occator', name: 'Кратер Оккатор — соляные пятна', e: '⚪', x: OCC8.x, z: OCC8.z, r: 110, col: '#ffffff', kind: 'salt', flat: 0 },
      { id: 'ahuna', name: 'Гора Ахуна — ледяной вулкан', e: '🗻', x: AHU8.x, z: AHU8.z, r: 70, col: '#7fe8ff', kind: 'ice', flat: 0 },
      { id: 'mine', name: 'Шахта гномов «Ледяная»', e: '⛏', x: MINE8.x, z: MINE8.z, r: 60, col: '#ffd24a', kind: 'mine' },
      { id: 'rig', name: 'Камнедробилка Толяна', e: '🏴‍☠️', x: RIG8.x, z: RIG8.z, r: 90, col: '#ff4a3a', kind: 'boss' }],
    roads: [[[0, 0], [-160, 100], [-230, 160]], [[0, 0], [150, 130], [240, 210]], [[0, 0], [-120, -150], [-250, -300]], [[0, 0], [170, -170], [330, -330]]],
    start: [10, 30, Math.PI],
    raw: raw8,
    road(x, z, h, k, y) { return h * (1 - k * 0.8) + y * k * 0.8; },
    poiH: (p) => base8(p.x, p.z), craters: 34 },
  9: { name: 'Венера', fog: '#c8964a', fogNear: 90, fogFar: 560, far: 900, clouds: 1, cloud: cloud9, pal: ['#e8c47a', '#f4dca0', '#b88a48', '#8a6a3a', '#6a6470'],
    pois: [
      { id: 'cafe', name: 'Кафе «Облачко» — Аэроград', e: '☕', x: 0, z: 0, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'garden', name: 'Висячие сады', e: '🌱', x: -330, z: 230, r: 60, col: '#9aff6a', kind: 'farm' },
      { id: 'port', name: 'Причал дирижаблей', e: '🎈', x: 320, z: 260, r: 55, col: '#ffd24a', kind: 'city' },
      { id: 'meteo', name: 'Метеостанция «Ветер»', e: '⚡', x: -320, z: -300, r: 55, col: '#7fe8ff', kind: 'meteo' },
      { id: 'zina', name: 'Пиратская платформа мамаши Зины', e: '🏴‍☠️', x: 330, z: -320, r: 85, col: '#ff4a3a', kind: 'boss' }],
    roads: [[[0, 0], [-330, 230]], [[0, 0], [320, 260]], [[0, 0], [-320, -300]], [[0, 0], [330, -320]], [[-320, -300], [0, -330], [330, -320]]],
    start: [0, 40, Math.PI],
    raw: () => 0,
    road: (x, z, h) => h,
    poiH: () => 0, craters: 0 },
  10: { name: 'Европа', fog: '#0a0c14', fogNear: 260, fogFar: 1000, far: 1800, space: 1, mars: 0, jup: 1, ice: 1, g: 4, pal: ['#c8d6e6', '#eef4fa', '#9aaabb', '#5a6878', '#8a9aac'],
    pois: [
      { id: 'station', name: 'Станция «Европа-Пересадочная»', e: '🚉', x: 0, z: 0, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'antenna', name: 'Антенное поле', e: '📡', x: -300, z: 250, r: 90, col: '#ffd24a', kind: 'field' },
      { id: 'crack', name: 'Трещина «Рыбное место»', e: '🎣', x: 320, z: 240, r: 70, col: '#7fe8ff', kind: 'fish' },
      { id: 'chaos', name: 'Хаос Коннемара — ледяные глыбы', e: '🧊', x: CHAOS10.x, z: CHAOS10.z, r: 70, col: '#c8e8ff', kind: 'view', flat: 0 },
      { id: 'lair', name: 'Логово Царь-рыбы', e: '🐟', x: LAIR10.x, z: LAIR10.z, r: 95, col: '#ff4a3a', kind: 'boss' }],
    roads: [[[0, 0], [-160, 120], [-300, 250]], [[0, 0], [170, 130], [320, 240]], [[320, 240], [400, 0], [300, -320]], [[0, 0], [150, -170], [300, -320]], [[0, 0], [-40, -180], [-60, -300]]],
    start: [10, 30, Math.PI],
    raw: raw10,
    road(x, z, h, k, y) { return h * (1 - k * 0.8) + y * k * 0.8; },
    poiH: (p) => raw10(p.x, p.z) * 0.5, craters: 6 },
  11: { name: 'Титан', fog: '#c8883a', fogNear: 70, fogFar: 640, far: 1800, sat: 1, mars: 0, g: 5, water: -3, sea: SEA11, waterC: '#2a1a0e', pal: ['#8a5a30', '#b08050', '#6a4428', '#3a2618', '#4a3424'],
    pois: [
      { id: 'port', name: 'Космопорт «Титан-Кольцевой»', e: '🪐', x: 0, z: 60, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'dunes', name: 'Дюны Шангри-Ла', e: '🏜', x: -340, z: 230, r: 90, col: '#ffd24a', kind: 'field' },
      { id: 'huygens', name: 'Равнина «Гюйгенса»', e: '🛰', x: 330, z: 250, r: 80, col: '#7fe8ff', kind: 'view' },
      { id: 'sotra', name: 'Ледяной вулкан Сотра', e: '🌋', x: -330, z: -250, r: 60, col: '#c8e8ff', kind: 'view' },
      { id: 'shore', name: 'Берег моря Кракена', e: '⛵', x: 0, z: -170, r: 45, col: '#ffb04a', kind: 'fuel', flat: 0 },
      { id: 'pier', name: 'Причал лайнера «Сатурн — Земля»', e: '🦑', x: ISLE11.x, z: ISLE11.z, r: 44, col: '#ff4a3a', kind: 'boss', flat: 0 }],
    roads: [[[0, 60], [-170, 150], [-340, 230]], [[0, 60], [170, 150], [330, 250]], [[0, 60], [0, -60], [0, -170]], [[-340, 230], [-380, 0], [-330, -250]], [[-330, -250], [-160, -170], [0, -170]], [[330, 250], [380, 0], [180, -150], [0, -170]]],
    start: [10, 100, Math.PI],
    raw: raw11,
    road(x, z, h, k, y) { return h * (1 - k * 0.85) + y * k * 0.85; },
    poiH: (p) => raw11(p.x, p.z) * 0.6, craters: 3 },
  12: { name: 'Луна', fog: '#05060c', fogNear: 320, fogFar: 1100, far: 1800, space: 1, mars: 0, earth: 1, g: 4, pal: ['#8a8a8e', '#b4b4b8', '#6a6a70', '#3a3a40', '#5a5a60'],
    pois: [
      { id: 'station', name: 'Станция «Последняя пересадка»', e: '🌙', x: 0, z: 60, r: 70, col: '#7aff8a', kind: 'city' },
      { id: 'apollo', name: 'Море Спокойствия — «Аполлон-11»', e: '👣', x: -330, z: 230, r: 80, col: '#ffd24a', kind: 'view' },
      { id: 'luno', name: 'Море Дождей — «Луноход-1»', e: '🚙', x: 340, z: 240, r: 70, col: '#7fe8ff', kind: 'view' },
      { id: 'copern', name: 'Кратер Коперник', e: '🕳', x: -340, z: -80, r: 70, col: '#c8c8d0', kind: 'view', flat: 0 },
      { id: 'tele', name: 'Радиотелескоп', e: '📡', x: 330, z: -350, r: 50, col: '#9ad0ff', kind: 'view' },
      { id: 'port', name: 'Космодром «Луна — Земля»', e: '🚀', x: 0, z: -470, r: 90, col: '#ff4a3a', kind: 'boss' }],
    roads: [[[0, 60], [-170, 150], [-330, 230]], [[0, 60], [170, 150], [340, 240]], [[0, 60], [0, -100], [0, -170], [0, -330], [0, -470]], [[-330, 230], [-400, 70], [-420, -80]], [[-420, -80], [-250, -110], [0, -100]], [[340, 240], [380, 40], [160, -90], [0, -100]], [[0, -330], [170, -360], [330, -350]]],
    start: [10, 110, Math.PI],
    raw: raw12, post: post12, solid: solid12,
    road(x, z, h, k, y) { return h * (1 - k * 0.85) + y * k * 0.85; },
    poiH: (p) => raw12(p.x, p.z) * 0.6, craters: 40 },
  13: { name: 'Степь у Байконура', fog: '#9ccbf0', fogNear: 200, fogFar: 900, far: 1400, blue: 1, mars: 0, pal: ['#7a7e40', '#94904e', '#5e6234', '#454028', '#6a5a3a'],
    pois: [
      { id: 'capsule', name: 'Место посадки капсулы', e: '🪂', x: -330, z: 300, r: 60, col: '#ffd24a', kind: 'view' },
      { id: 'town', name: 'Город Байконур', e: '🏙', x: 0, z: 80, r: 75, col: '#7aff8a', kind: 'city' },
      { id: 'mik', name: 'Монтажный корпус', e: '🏭', x: RAIL13[0][0], z: RAIL13[0][1], r: 55, col: '#c8c8d0', kind: 'view' },
      { id: 'gagarin', name: 'Гагаринский старт', e: '🚀', x: RAIL13[2][0], z: RAIL13[2][1], r: 70, col: '#ff9a4a', kind: 'view' },
      { id: 'aul', name: 'Аул у колодца', e: '⛺', x: 340, z: 260, r: 70, col: '#ffd24a', kind: 'farm' },
      { id: 'tyuratam', name: 'Станция Тюратам', e: '🚉', x: 360, z: -40, r: 85, col: '#ff4a3a', kind: 'boss' }],
    roads: [[[-330, 300], [-170, 200], [0, 80]], [[0, 80], [-130, 10], [-260, -60]], [[0, 80], [170, 170], [340, 260]], [[0, 80], [180, 20], [360, -40]], [[340, 260], [380, 110], [360, -40]], [[360, -40], [300, -200], [200, -330]], RAIL13.map((q) => q.slice())],
    start: [-320, 280, Math.PI * 0.75],
    raw: raw13,
    road(x, z, h, k, y) { return h * (1 - k * 0.85) + y * k * 0.85; },
    poiH: (p) => raw13(p.x, p.z) * 0.6, craters: 0 },
  14: { name: 'Волга у Камышина', fog: '#a8d0ec', fogNear: 200, fogFar: 900, far: 1400, blue: 1, mars: 0, water: -2.5, sea: { x: 0, z: 0, r: 700 }, waterC: '#3a6a8a', pal: ['#6e8040', '#8a9450', '#5a6434', '#4a4228', '#6a5a3a'],
    pois: [
      { id: 'kam', name: 'Камышин — арбузная столица', e: '🍉', x: -260, z: 160, r: 75, col: '#7aff8a', kind: 'city' },
      { id: 'bahcha', name: 'Бахча Михалыча', e: '🌱', x: -380, z: -160, r: 70, col: '#9aff6a', kind: 'farm' },
      { id: 'ferryW', name: 'Паромная пристань', e: '⛴', x: riverX14(420) - 120, z: 420, r: 45, col: '#7fe8ff', kind: 'fuel', flat: 0 },
      { id: 'mayak', name: 'Маяк на левом берегу', e: '🗼', x: riverX14(420) + 150, z: 420, r: 55, col: '#ffd24a', kind: 'view' },
      { id: 'brak', name: 'Лагерь браконьеров', e: '🎣', x: 300, z: 0, r: 60, col: '#c08aff', kind: 'view' },
      { id: 'kosa', name: 'Песчаная коса — логово Сома', e: '🐟', x: riverX14(KOSA14.z) + KOSA14.x, z: KOSA14.z, r: 40, col: '#ff4a3a', kind: 'boss', flat: 0 }],
    roads: [[[-260, 160], [-330, 0], [-380, -160]], [[-260, 160], [-200, 260], [-120, 380], [riverX14(420) - 120, 420]], [[riverX14(420) + 130, 420], [riverX14(330) + 150, 300], [riverX14(330) + 160, 120], [riverX14(-330) + 170, -330]], [[-380, -160], [-260, -300], [riverX14(-330) - 130, -330]]],
    start: [-250, 220, Math.PI * 0.8],
    raw: raw14,
    road(x, z, h, k, y) { return h * (1 - k * 0.85) + y * k * 0.85; },
    poiH: (p) => raw14(p.x, p.z) * 0.6, craters: 0 },
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
(function () { const C = CH[3]; C.roads = C.roads.map((r) => { const out = []; for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 25)); for (let k = 0; k < n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; out.push([x, z, base3(x, z) + 0.5]); } } const l = r[r.length - 1]; out.push([l[0], l[1], base3(l[0], l[1]) + 0.5]); return out; }); })();
(function () { const C = CH[4]; C.roads = C.roads.map((r) => { const out = []; for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 25)); for (let k = 0; k < n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; out.push([x, z, floor4(x, z) + 0.3]); } } const l = r[r.length - 1]; out.push([l[0], l[1], floor4(l[0], l[1]) + 0.3]); if (r.hw) out.hw = r.hw; return out; }); })();
(function () { for (const C of [CH[5], CH[6], CH[7], CH[8], CH[10], CH[11], CH[12], CH[13], CH[14]]) C.roads = C.roads.map((r) => { if (r[0][2] === 'raw') return r; const out = []; for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 20)); for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, 'raw']); } const l = r[r.length - 1]; out.push([l[0], l[1], 'raw']); return out; }); })();
function setChapter(n) { MG = null; CHC = CH[n]; W.ch = n; W.deckOn = n === 6; POI.length = 0; CHC.pois.forEach((p) => POI.push(Object.assign({}, p))); ROADS.length = 0; CHC.roads.forEach((r) => { const c = r.map((q) => q.slice()); if (r.hw) c.hw = r.hw; ROADS.push(c); });
  CRATERS = []; CRATERS = genCraters(CHC.craters, n === 2 ? (x, z) => Math.abs(z - zc2(x)) < hw2(x) * 1.3 : null);
  for (const r of ROADS) for (const q of r) { if (q[2] === 'raw') q[2] = CHC.raw(q[0], q[1]); else if (q[2] === undefined) q[2] = 0; }
  POI.forEach((p) => { p.h = CHC.poiH(p); }); W.mapImg = null; }
function segDist(px, pz, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l)); return [Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t), t]; }
function roadInfo(x, z) { let d = 1e9, y = 0; for (const r of ROADS) for (let i = 0; i < r.length - 1; i++) { const [dd, t] = segDist(x, z, r[i], r[i + 1]); if (dd < d) { d = dd; y = r[i][2] + (r[i + 1][2] - r[i][2]) * t; } } return [d, y]; }
function roadDist(x, z) { return roadInfo(x, z)[0]; }
W.roadDist = roadDist;
function rawH(x, z) { return CHC.raw(x, z); }
// следы колёс: две колеи за задними колёсами, одним набором на всю карту (старые перезаписываются новыми)
const TRK_N = 700; let TRK = null, trkI = 0, trkX = 0, trkZ = 0; const trkQ = new THREE.Quaternion(), trkQ2 = new THREE.Quaternion(), trkUp = new THREE.Vector3(0, 1, 0);
function buildTracks() { const g = new THREE.PlaneGeometry(0.55, 1.15); g.rotateX(-Math.PI / 2); TRK = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: CHC.ice || CHC.earth ? '#3a3f4a' : '#1a0e08', transparent: true, opacity: CHC.ice ? 0.32 : 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), TRK_N); TRK.count = 0; TRK.frustumCulled = false; TRK.renderOrder = 1; S.add(TRK); trkI = 0; trkX = R.x; trkZ = R.z; }
function tracksStep() { if (!TRK || W.foot || R.air > 0 || W.swim || W.lockY !== undefined || (CHC.cloud && !(W.deck9 && W.deck9(R.x, R.z))) || CHC.dark && false) { trkX = R.x; trkZ = R.z; return; } const d = Math.hypot(R.x - trkX, R.z - trkZ); if (d < 0.9) return; if (d > 6) { trkX = R.x; trkZ = R.z; return; } trkX = R.x; trkZ = R.z;
  const n = normalAt(R.x, R.z); trkQ.setFromUnitVectors(trkUp, n); trkQ2.setFromAxisAngle(trkUp, R.h); trkQ.multiply(trkQ2); const sn = Math.sin(R.h), cs = Math.cos(R.h);
  for (const sd of [-1.42, 1.42]) { const x = R.x + cs * sd - sn * 1.6, z = R.z - sn * sd - cs * 1.6; TRK.setMatrixAt(trkI, new THREE.Matrix4().compose(new THREE.Vector3(x, H(x, z) + 0.05, z), trkQ, new THREE.Vector3(1, 1, 1))); trkI = (trkI + 1) % TRK_N; TRK.count = Math.max(TRK.count, trkI === 0 ? TRK_N : trkI); }
  TRK.instanceMatrix.needsUpdate = true; }
// высота для езды и расстановки: по нарисованной сетке земли (марсоход стоит ровно на видимой поверхности) + твёрдые постройки (трамплины)
let MG = null; const CELL = SIZE / GRID;
function meshH(x, z) { const fx = Math.max(0, Math.min(GRID - 1e-4, (x + HALF) / CELL)), fz = Math.max(0, Math.min(GRID - 1e-4, (z + HALF) / CELL)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, N = GRID + 1;
  const h00 = MG[j * N + i], h10 = MG[j * N + i + 1], h01 = MG[(j + 1) * N + i], h11 = MG[(j + 1) * N + i + 1]; return u + v <= 1 ? h00 + (h10 - h00) * u + (h01 - h00) * v : h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v); }
function H(x, z) { if (!MG || (W.ch === 6 && W.deckOn && Math.abs(x - DECK6.x) <= DECK6.hl + 3 && Math.abs(z - DECK6.z) <= DECK6.hw + 3)) return Hx(x, z) + (CHC.solid ? CHC.solid(x, z) : 0); return meshH(x, z) + (CHC.solid ? CHC.solid(x, z) : 0); }
function Hx(x, z) {
  let h = deck6(x, z, rawH(x, z));
  const [rd, ry] = roadInfo(x, z); if (rd < 16) { const k = 1 - sstep(5, 16, rd); h = CHC.road(x, z, h, k, ry); }
  for (const p of POI) { if (p.flat === 0 || CHC.dark) continue; const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * 1.8) { const k = 1 - sstep(p.r, p.r * 1.8, d); h = h * (1 - k) + p.h * k; } }
  if (CHC.post) h = CHC.post(x, z, h);
  return h;
}
setChapter(1);
W.H = H;
function normalAt(x, z) { const e = 2.5, hx = H(x + e, z) - H(x - e, z), hz = H(x, z + e) - H(x, z - e); const n = new THREE.Vector3(-hx, 2 * e, -hz); return n.normalize(); }
W.normalAt = normalAt;

/* ---------- сцена ---------- */
let S, sun, hemi, terrain, roadsM, beams = [];
function buildTerrain() {
  const g = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID); g.rotateX(-Math.PI / 2); const P = g.attributes.position, C = [];
  const [cRust, cDust, cRock, cDark, cRoad] = CHC.pal.map((c) => new THREE.Color(c)), t = new THREE.Color(); const cRiver = new THREE.Color('#d8b088');
  MG = null; const MGn = new Float32Array((GRID + 1) * (GRID + 1)); for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = CHC.cloud ? CHC.cloud(x, z) : Hx(x, z); P.setY(i, y); MGn[Math.round((z + HALF) / CELL) * (GRID + 1) + Math.round((x + HALF) / CELL)] = y; }
  g.computeVertexNormals(); const N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ny = N.getY(i), slope = 1 - ny;
    t.copy(cRust).lerp(cDust, Math.max(0, sstep(-2, 18, y) * 0.55 + (fbm(x / 25, z / 25) - 0.5) * 0.9)).lerp(cRock, sstep(0.1, 0.3, slope)).lerp(cDark, sstep(0.3, 0.55, slope) * 0.6).multiplyScalar(0.9 + (hash(Math.floor(x / 3), Math.floor(z / 3)) - 0.5) * 0.12); if (W.ch === 1 && y < -10) t.lerp(cDark, sstep(-10, -22, y) * 0.7); if (W.ch === 10) { t.set('#aebccc').lerp(new THREE.Color('#8a9cb2'), fbm(x / 60, z / 60) * 0.9).lerp(new THREE.Color('#8a4a2e'), (1 - sstep(2, 9, line10(x, z))) * 0.85); const cd = Math.hypot(x - CHAOS10.x, z - CHAOS10.z); if (cd < CHAOS10.r) t.lerp(new THREE.Color('#b88a74'), (1 - sstep(CHAOS10.r * 0.6, CHAOS10.r, cd)) * 0.35 * hash(Math.floor(x / 14), Math.floor(z / 14))); t.lerp(new THREE.Color('#5a6878'), sstep(0.25, 0.55, slope) * 0.6); }
    if (W.ch === 8) { if (W.salt8(x, z)) t.set('#f4f6ff'); const ad = Math.hypot(x - AHU8.x, z - AHU8.z); if (ad < 72) t.lerp(new THREE.Color('#c8dcf0'), 0.35 + 0.3 * Math.max(0, Math.sin(Math.atan2(z - AHU8.z, x - AHU8.x) * 9))); } if (W.ch === 7) { const lv = lava7(x, z); if (lv < 6) t.set('#ff6a1a').lerp(new THREE.Color('#ffd24a'), (1 - lv / 6) * 0.6 * (0.5 + 0.5 * Math.sin(x * 0.3 + z * 0.2))); const r7 = Math.hypot(x - OLY7.x, z - OLY7.z); if (r7 < 340 && lv >= 6) t.lerp(new THREE.Color('#4a2420'), 0.45 * (1 - sstep(320, 340, r7))); if (r7 < 80 && lv >= 6) t.lerp(new THREE.Color('#2a1210'), 0.5); } if (W.ch === 5) { const kd = Math.hypot(x - KOR5.x, z - KOR5.z); if (kd < 90) t.lerp(new THREE.Color('#9ccff5'), (1 - sstep(70, 90, kd)) * 0.7); if (W.spiralD(x, z) < 12) t.lerp(new THREE.Color('#a8c8f0'), 0.45); } if (W.ch === 3) { const fx = (x - FACE.x) / 130, fz = (z - FACE.z) / 169, fe = Math.hypot(fx, fz); if (fe < 1) t.lerp(new THREE.Color('#8a6e64'), (1 - sstep(0.7, 1, fe)) * 0.55); } if (W.ch === 2) { if (y < -50) t.lerp(cDust, 0.25); if (W.river2(x, z)) t.lerp(cRiver, 0.7); if (y > -50 && y < 5) t.multiplyScalar(0.85 + 0.15 * Math.sin(y * 0.9)); } // полосы слоёв на стенах каньона
    if (W.ch === 14) { t.lerp(new THREE.Color('#4a7030'), sstep(0.45, 0.65, fbm(x / 60 + 2, z / 60)) * 0.6); if (y < 0.5) t.lerp(new THREE.Color('#d8c890'), sstep(0.5, -1.5, y) * 0.8); if (y < -3) t.lerp(new THREE.Color('#6a6048'), 0.6); }
    if (W.ch === 13) { t.lerp(new THREE.Color('#5a7a32'), sstep(0.45, 0.65, fbm(x / 70 + 8, z / 70)) * 0.7).lerp(new THREE.Color('#b0a066'), sstep(0.55, 0.7, fbm(x / 30 - 3, z / 30 + 5)) * 0.45); if (y < -2.5) t.lerp(new THREE.Color('#9a8458'), 0.5); }
    if (W.ch === 12) { t.set('#9a9a9e').lerp(new THREE.Color('#5c5c64'), sstep(0.5, 0.62, fbm(x / 210 + 11, z / 210 - 3)) * 0.75).lerp(new THREE.Color('#c8c8cc'), sstep(0.15, 0.4, slope) * 0.5).multiplyScalar(0.92 + (hash(Math.floor(x / 4), Math.floor(z / 4)) - 0.5) * 0.12); if (rilleK12(x, z) > 0.3) t.lerp(new THREE.Color('#3a3a42'), 0.6); }
    if (W.ch === 11) { t.lerp(new THREE.Color('#3a2214'), Math.min(1, dune11(x, z) * 0.9)).lerp(new THREE.Color('#c09060'), (fbm(x / 40 + 3, z / 40) - 0.45) * 0.6); if (y < 0) t.lerp(new THREE.Color('#2e1a10'), sstep(0, -6, y)); if (Math.hypot(x - CHC.pois[3].x, z - CHC.pois[3].z) < 70) t.lerp(new THREE.Color('#d8e4ee'), 0.5 * (1 - sstep(30, 70, Math.hypot(x - CHC.pois[3].x, z - CHC.pois[3].z)))); }
    if (CHC.clouds) { t.set('#f2d48e').lerp(new THREE.Color('#a8763a'), sstep(-36, -58, y) * 0.8).lerp(new THREE.Color('#fff0c8'), sstep(-34, -24, y) * 0.6); C.push(t.r, t.g, t.b); continue; }
    const rd = roadDist(x, z); if (rd < 7) t.lerp(cRoad, (1 - sstep(3, 7, rd)) * 0.75);
    for (const p of POI) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r) t.lerp(new THREE.Color(W.ch === 13 || W.ch === 14 ? '#a8a070' : W.ch === 8 || W.ch === 12 ? '#5a5a62' : W.ch === 10 ? '#8a9aac' : W.ch === 11 ? '#6a4a30' : '#8a5048'), 0.35 * (1 - d / p.r)); }
    C.push(t.r, t.g, t.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); if (!CHC.cloud) MG = MGn;
  terrain = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); S.add(terrain);
}
// столкновения у всего крупного: по габаритам модели (длинное — цепочкой кругов); трава, грядки, мелочь, площадки и трамплины — проходимы
const NOCOLL = /roundGlass|grass|crop|Crop|flower|path|planter|plant|_[1-4]$|mushroom|^o_|^m_(apple|banana|beet|bread|cabbage|carrot|corn|fish|honey|pumpkin|strawberry|tomato|can)|lights|crater|landingpad|platform|ramp|astronaut|alien|bench|chair|table|bucket|tool|^s_fish|campfire|signpost|solarpanel|Spaceship5|cone|stump/;
function autoColl(m, x, z, s, ry) { if (!W.COLL || NOCOLL.test(m)) return; const g = MODELS[m]; if (!g.boundingBox) g.computeBoundingBox(); if (!g.userData.base) { const P = g.attributes.position, gb = g.boundingBox, lim = gb.min.y + (gb.max.y - gb.min.y) * 0.3, mn = [1e9, 1e9], mx = [-1e9, -1e9]; for (let i = 0; i < P.count; i++) { if (P.getY(i) > lim) continue; const x = P.getX(i), z = P.getZ(i); mn[0] = Math.min(mn[0], x); mn[1] = Math.min(mn[1], z); mx[0] = Math.max(mx[0], x); mx[1] = Math.max(mx[1], z); } g.userData.base = { min: { x: mn[0], z: mn[1], y: gb.min.y }, max: { x: mx[0], z: mx[1], y: gb.max.y } }; } // габарит у земли (лопасти мельницы, крыши не в счёт)
  const bb = g.userData.base, w = (bb.max.x - bb.min.x) * s, d = (bb.max.z - bb.min.z) * s, h = (bb.max.y - bb.min.y) * s; if (h < 1.3 || Math.max(w, d) < 1.4) return;
  const cx = (bb.max.x + bb.min.x) / 2 * s, cz = (bb.max.z + bb.min.z) / 2 * s, c = Math.cos(ry), sn = Math.sin(ry), px = x + cx * c + cz * sn, pz = z - cx * sn + cz * c, soft = h < 6, long = Math.max(w, d), short = Math.max(0.6, Math.min(w, d)), r = short / 2 * 0.9;
  if (long / short < 1.6) { W.COLL.push({ x: px, z: pz, r: Math.max(w, d) / 2 * 0.82 * (/Spaceship|craft_cargo|hangar_large|spacetruck/.test(m) ? 0.55 : 1), soft }); return; }
  const ax = w > d ? c : sn, az = w > d ? -sn : c, n = Math.ceil(long / short), kk = /Spaceship|craft_cargo|hangar_large|spacetruck/.test(m) ? 0.55 : 1; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n - 0.5; W.COLL.push({ x: px + ax * t * long * kk, z: pz + az * t * long * kk, r: r * kk, soft }); } }
function place(B, m, x, z, s, ry = 0, dy = 0) { if (!MODELS || !MODELS[m]) return; autoColl(m, x, z, s, ry); B.add(MODELS[m], mat(x, H(x, z) + dy, z, s, s, s, ry), null, { vcol: true, vk: CHC.dark && !/crystal|mushroom|lights|^o_|crops/.test(m) ? 0.55 : CHC.dark ? 1.35 : 1.08 }); }
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
  if (W.ch === 3) {
    // таможня: ворота поперёк дороги, турели, робот-таможенник (марсиане)
    const cu = byId('customs'); [['r_gate_complex', 0, 0, 16, 0.9], ['k_machine_wireless', 16, -10, 6, 0], ['r_turret_single', -16, 12, 5, 2], ['r_turret_single', 18, 14, 5, 3], ['k_barrels', -14, -14, 5, 1], ['r_corridor_detailed', 24, 2, 6, 0.9]].forEach(([m, x, z, sc, ry]) => place(B, m, cu.x + x, cu.z + z, sc, ry));
    [[-16, 12, 2], [18, 14, 2], [24, 2, 5]].forEach(([x, z, r]) => addC(cu.x + x, cu.z + z, r));
    // Ксар-Тала: висячие башни на опорах, стеклянные купола, монорельс, кристаллы, жители
    const kt = byId('ksar');
    [[-40, -30], [42, -36], [-50, 34], [46, 40], [0, -60]].forEach(([x, z], k) => { place(B, 'r_supports_high', kt.x + x, kt.z + z, 13, k); place(B, 'r_platform_high', kt.x + x, kt.z + z, 13, k, 13); place(B, k % 2 ? 'k_hangar_roundGlass' : 'k_hangar_smallA', kt.x + x, kt.z + z, 7, k, 21); addC(kt.x + x, kt.z + z, 5); });
    [['k_hangar_roundGlass', -16, 0, 15, 0], ['k_hangar_largeA', 24, 6, 10, 1.6], ['r_pipe_ring', 0, 34, 14, 0], ['structure_tall', -30, -60, 10, 0.4], ['structure_tall', 34, 60, 10, 2], ['k_satelliteDish_large', 60, 0, 6, 2], ['windturbine_tall', -66, -4, 7, 0]].forEach(([m, x, z, sc, ry]) => { place(B, m, kt.x + x, kt.z + z, sc, ry); if (m !== 'r_pipe_ring') addC(kt.x + x, kt.z + z, m === 'windturbine_tall' ? 2 : sc >= 10 ? 11 : 8); });
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; place(B, 'r_monorail_trackSupport', kt.x + Math.cos(a) * 72, kt.z + Math.sin(a) * 72, 7, a + 1.57); }
    for (let k = 0; k < 10; k++) { const a = k * 2.4, r = 28 + (k % 3) * 12; place(B, 'k_alien', kt.x + Math.cos(a) * r, kt.z + Math.sin(a) * r, 2.6, a); }
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.3; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', kt.x + Math.cos(a) * 95, kt.z + Math.sin(a) * 95, 9, a); }
    // музей землян
    const mu = byId('museum'); place(B, 'k_hangar_largeA', mu.x, mu.z - 26, 10, 0); place(B, 'r_pipe_ring', mu.x, mu.z + 4, 10, 0); place(B, 'k_alien', mu.x - 8, mu.z + 14, 2.6, 0.4); place(B, 'k_alien', mu.x + 8, mu.z + 14, 2.6, -0.4); addC(mu.x, mu.z - 26, 12);
    // лицо: кристаллы по контуру
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; place(B, 'k_rock_crystals', FACE.x + Math.cos(a) * 150, FACE.z + Math.sin(a) * 195, 8, a); }
    // антенны «Привет»
    for (const id of ['ant1', 'ant2', 'ant3']) { const an = byId(id); place(B, 'k_satelliteDish_large', an.x, an.z, 7, 0.5); place(B, 'k_machine_generator', an.x + 9, an.z - 6, 5); place(B, 'r_machine_wirelessCable', an.x - 9, an.z + 5, 5, 1); addC(an.x, an.z, 5); }
    // дворец тёщи Зурги: купол, четыре башни, ворота, кристальный сад
    const zg = byId('zurga'); place(B, 'k_hangar_roundA', zg.x, zg.z - 30, 22, 0); addC(zg.x, zg.z - 30, 22);
    [[-40, -40], [40, -40], [-46, 10], [46, 10]].forEach(([x, z], k) => { place(B, 'r_supports_high', zg.x + x, zg.z + z, 8, k); place(B, 'r_platform_high', zg.x + x, zg.z + z, 8, k, 8); addC(zg.x + x, zg.z + z, 4); });
    place(B, 'r_gate_complex', zg.x, zg.z + 40, 16, 0); for (let k = 0; k < 8; k++) place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', zg.x - 60 + k * 17, zg.z + 64, 6, k);
  }
  if (W.ch === 4) {
    // ствол шахты: копёр, опоры, лампы
    const lf = byId('lift'); { const g = new THREE.CylinderGeometry(30, 30, 220, 18, 1, true), sm = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#4a3a40', side: THREE.BackSide })); sm.position.set(lf.x, 120, lf.z); S.add(sm);
      for (let k = 0; k < 7; k++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(29, 0.5, 6, 32), new THREE.MeshBasicMaterial({ color: k % 2 ? '#ffd27a' : '#ff9a4a' })); rg.rotation.x = Math.PI / 2; rg.position.set(lf.x, 50 + k * 26, lf.z); S.add(rg); } } [['drill_structure', 0, -18, 9, 0], ['r_supports_high', -16, 6, 9, 0.6], ['r_supports_high', 16, 6, 9, 2.2], ['lights', -10, -26, 6, 0], ['lights', 12, -26, 6, 1], ['r_barrels_rail', 20, -10, 6, 1.2], ['containers_A', -22, -12, 5, 0.4]].forEach(([m, x, z, sc, ry]) => place(B, m, lf.x + x, lf.z + z, sc, ry)); addC(lf.x, lf.z - 18, 7);
    // Грибоград: дома-грибы, палатки, костры, гномы, фонари, кристаллы
    const gb = byId('grib'); [[-30, -24, 16], [28, -30, 13], [-40, 22, 12], [34, 26, 15], [0, -48, 11], [-6, 44, 10]].forEach(([x, z, sc], k) => { place(B, 'n_mushroom_redGroup', gb.x + x, gb.z + z, sc, k * 1.3); addC(gb.x + x, gb.z + z, sc * 0.55); });
    [['s_tent', -12, 6, 6, 0.5], ['s_tent-canvas', 16, -4, 6, 2], ['s_campfire-pit', 2, 12, 5, 0], ['s_workbench', -20, -6, 5, 1], ['s_chest', 22, 12, 4, 2.5], ['lights', -50, -4, 6, 0], ['lights', 50, 0, 6, 0], ['s_barrel', 10, -16, 4, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, gb.x + x, gb.z + z, sc, ry));
    for (let k = 0; k < 8; k++) { const a = k * 0.8; place(B, k % 2 ? 'k_astronautA' : 'k_astronautB', gb.x + Math.cos(a) * 18, gb.z + Math.sin(a) * 18, 1.6, a + 3); }
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + 0.2; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', gb.x + Math.cos(a) * 66, gb.z + Math.sin(a) * 66, 8, a); }
    // штреки: крепь, вагонетки, бочки, буры
    const sh = byId('shtrek'); [[-40, 30], [30, 40], [-60, -30], [40, -20]].forEach(([x, z], k) => place(B, 'tunnel_straight_A', sh.x + x, sh.z + z, 7, k * 1.1));
    [['r_barrels_rail', 8, -12, 6, 0.3], ['drill_structure', -16, 18, 6, 1], ['s_barrel', 18, 16, 4, 0], ['containers_C', -24, -18, 5, 2], ['lights', 0, 0, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, sh.x + x, sh.z + z, sc, ry));
    // подземное море: маяк на острове, кристаллы по берегу
    const il = byId('island'); place(B, 'structure_tall', il.x, il.z, 9, 0); place(B, 'lights', il.x, il.z, 7, 0, 18); place(B, 'r_pipe_ring', il.x + 10, il.z + 8, 5, 1); place(B, 's_chest', il.x - 8, il.z + 6, 4, 0.5); addC(il.x, il.z, 5);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28; place(B, k % 3 ? 'k_rock_crystals' : 'k_rock_crystalsLargeA', SEA4.x + Math.cos(a) * SEA4.r * 1.06, SEA4.z + Math.sin(a) * SEA4.r * 1.06, 9, a); }
    // кристальный грот
    const gr = byId('grot'); for (let k = 0; k < 12; k++) { const a = k * 0.53, r = 20 + (k % 3) * 14; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', gr.x + Math.cos(a) * r, gr.z + Math.sin(a) * r, 7 + (k % 4) * 2, a); }
    // логово червя: огород бабы Тани посреди пещеры, кости, завал главного тоннеля
    const lr = byId('lair'); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { place(B, 'c_planter', lr.x - 15 + j * 10, lr.z - 8 + i * 8, 4, 0); place(B, ['o_cabbage', 'o_carrot', 'o_pumpkin', 'n_crops_leafsStageB'][(i + j) % 4], lr.x - 15 + j * 10, lr.z - 8 + i * 8, 4, i + j, 0.8); }
    place(B, 'r_bones', lr.x + 40, lr.z - 30, 18, 0.7); place(B, 'r_bones', lr.x - 44, lr.z + 30, 14, 2.4); addC(lr.x + 40, lr.z - 30, 5);
    [[380, 260], [372, 250], [390, 270]].forEach(([x, z], k) => { place(B, 'k_rock_largeA', x, z, 9 + k * 2, k); addC(x, z, 9); });
  }
  if (W.ch === 5) {
    // Льдинск: купола полярников, ветряки, антенна, костёр, медведи-профсоюзники
    const ld = byId('ldinsk'); [['basemodule_A', -20, -12, 7, 0], ['basemodule_C', 18, -20, 7, 1], ['basemodule_garage', -6, 24, 7, 2], ['basemodule_E', 26, 16, 6, 0.5], ['windturbine_tall', -40, 10, 7, 0], ['windturbine_tall', 40, -36, 7, 1], ['k_satelliteDish_large', -34, -34, 6, 0.8], ['s_campfire-pit', 4, 4, 5, 0], ['solarpanel', 0, -38, 6, 0], ['solarpanel', 10, -38, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, ld.x + x, ld.z + z, sc, ry));
    [[-20, -12, 6], [18, -20, 6], [-6, 24, 6], [26, 16, 5]].forEach(([x, z, r]) => addC(ld.x + x, ld.z + z, r));
    for (let k = 0; k < 3; k++) place(B, 'p_animal-polar', ld.x + 12 + k * 5, ld.z + 6 - k * 3, 2.2, -0.8 + k * 0.3); for (let k = 0; k < 3; k++) place(B, 'k_astronautB', ld.x - 8 + k * 3, ld.z + 8, 1.6, 2.6);
    // каток в кратере Королёв: ворота, скамейки, прожекторы
    const kr = byId('korolev'); place(B, 'r_gate_complex', kr.x - 64, kr.z, 9, Math.PI / 2); place(B, 'r_gate_complex', kr.x + 64, kr.z, 9, Math.PI / 2);
    [[-30, -70], [30, -70], [-30, 70], [30, 70]].forEach(([x, z], k) => place(B, 'lights', kr.x + x, kr.z + z, 6, k)); for (let k = 0; k < 4; k++) place(B, 'f_bench', kr.x - 15 + k * 10, kr.z - 76, 4, 0);
    // поле гейзеров: ледяные кристаллы
    const gy = byId('geyser'); for (let k = 0; k < 9; k++) { const a = k * 0.7; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', gy.x + Math.cos(a) * 78, gy.z + Math.sin(a) * 78, 6, a); }
    // вершина купола: старый полярный аппарат
    const tp = byId('top'); place(B, 'lander_A', tp.x, tp.z, 6, 0.4); place(B, 'k_satelliteDish', tp.x + 10, tp.z - 6, 4, 1); addC(tp.x, tp.z, 5);
    // логово дракона: ледяные кристаллы кольцом, трубы-отдушины
    const dr = byId('dragon'); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; place(B, k % 3 ? 'k_rock_crystals' : 'k_rock_crystalsLargeA', dr.x + Math.cos(a) * 70, dr.z + Math.sin(a) * 70, 9, a); }
    W.vents5 = [0, 1, 2, 3].map((k) => { const a = k / 4 * 6.28 + 0.4; return { x: dr.x + Math.cos(a) * 38, z: dr.z + Math.sin(a) * 38 }; }); W.vents5.forEach((v) => place(B, 'r_pipe_ring', v.x, v.z, 4, 0, -1));
  }
  if (W.ch === 6) {
    // космопорт: площадки, модули, ракеты, очередь из марсиан и роботов
    const pt = byId('port'); [['landingpad_large', -40, -30, 7, 0], ['landingpad_large', 40, -36, 7, 0], ['basemodule_A', -24, 26, 7, 0], ['basemodule_B', 2, 34, 7, 1], ['basemodule_D', 28, 24, 7, 2], ['structure_tall', -50, 20, 8, 0], ['k_hangar_largeA', 56, 30, 7, 3.1], ['k_satelliteDish_large', -62, -6, 6, 0.6], ['spacetruck', 14, -6, 7, 1.2], ['lights', -12, 6, 6, 0], ['lights', 22, 10, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, pt.x + x, pt.z + z, sc, ry));
    [[-24, 26, 6], [2, 34, 6], [28, 24, 6], [56, 30, 8], [-50, 20, 3]].forEach(([x, z, r]) => addC(pt.x + x, pt.z + z, r));
    [[-40, -30], [40, -36]].forEach(([x, z]) => { place(B, 'k_rocket_baseA', pt.x + x, pt.z + z, 6); place(B, 'k_rocket_fuelA', pt.x + x, pt.z + z, 6, 0, 9.6); place(B, 'k_rocket_topA', pt.x + x, pt.z + z, 6, 0, 15.6); addC(pt.x + x, pt.z + z, 5); });
    for (let k = 0; k < 9; k++) place(B, k % 3 === 2 ? 'k_astronautA' : 'k_alien', pt.x - 16 + k * 3.2, pt.z + 12, 2.2, Math.PI / 2);
    // ангар тарелок
    const hg = byId('hangar'); place(B, 'k_hangar_roundA', hg.x, hg.z - 20, 12, 0); addC(hg.x, hg.z - 20, 12); place(B, 's_Spaceship5', hg.x - 16, hg.z + 10, 1.4, 0.6, 1); place(B, 's_Spaceship5', hg.x + 18, hg.z + 6, 1.4, 2.2, 1); place(B, 'r_craft_racer', hg.x + 4, hg.z + 22, 4, 1.4);
    // под хвостом кометы — ледяные глыбы
    const tl = byId('tail'); for (let k = 0; k < 10; k++) { const a = k * 0.63; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', tl.x + Math.cos(a) * (50 + (k % 3) * 15), tl.z + Math.sin(a) * (50 + (k % 3) * 15), 6, a); }
    // флагман «ТрансГалактик» в кратере Стикни: корпус-палуба, мостик на носу, двигатели на корме, трап
    { const D = DECK6, Y = W.deckY(), B2 = new Builder(null); B2.add(BOX, mat(D.x, Y - 5, D.z, D.hl * 2, 10, D.hw * 2), '#5a5c6c'); B2.add(BOX, mat(D.x + 6, Y - 15, D.z, D.hl * 2 - 20, 10, D.hw * 1.3), '#3a3c48');
      B2.add(BOX, mat(D.x - D.hl - 12, Y - 8, D.z, 26, 12, D.hw * 1.2), '#4a4c5a'); for (let k = -4; k <= 4; k++) B2.add(BOX, mat(D.x + k * 24, Y + 0.06, D.z, 1.2, 0.12, D.hw * 2 - 4), k % 2 ? '#c84a3a' : '#e8d24a');
      for (const sd of [-1, 1]) B2.add(BOX, mat(D.x, Y + 0.6, D.z + sd * (D.hw - 0.5), D.hl * 2, 1.2, 1), '#2a2c36'); for (let k = 0; k < 10; k++) B2.add(BOX, mat(D.x + D.hl + 5 + k * 8, Y * (1 - (k + 0.5) / 10) + W.H(D.x + D.hl + 5 + k * 8, D.z) * ((k + 0.5) / 10) - 0.5, D.z, 8, 1, 28), '#4a4c58');
      for (const sd of [-1, 1]) B2.add(CYL, mat(D.x + D.hl - 6, Y - 6, D.z + sd * 16, 9, 14, 9), '#2a2a30'); S.add(new THREE.Mesh(B2.build(), bakedMat));
      place(B, 'structure_tall', D.x - D.hl + 14, D.z, 8, 0); place(B, 'r_corridor_detailed', D.x - 40, D.z - 10, 6, 0); place(B, 'r_corridor_detailed', D.x + 20, D.z + 12, 6, Math.PI); place(B, 'k_barrels', D.x - 10, D.z + 16, 4, 0); place(B, 'r_satelliteDish_detailed', D.x - D.hl + 30, D.z - 14, 5, 1); }
  }
  if (W.ch === 7) {
    // вершины Фарсиды: лоток с пирожками (одна и та же бабушка), на Павлине — пиратский гарнизон
    for (const c of CONES7) { place(B, 'k_barrels', c.x + 8, c.z + 6, 4, 0.4); place(B, 'lights', c.x - 8, c.z + 6, 5, 0); }
    const pv = byId('pavonis'); [['r_platform_high', -14, -10, 7, 0], ['r_supports_high', 14, -12, 7, 1], ['r_gate_complex', 0, 16, 7, 0], ['r_barrels_rail', 16, 10, 5, 2]].forEach(([m, x, z, sc, ry]) => place(B, m, pv.x + x, pv.z + z, sc, ry));
    // посёлок у подножья
    const vl = byId('village'); [['basemodule_A', -22, -10, 7, 0], ['basemodule_C', 20, -18, 7, 1], ['basemodule_garage', -4, 24, 7, 2], ['windturbine_tall', 36, 14, 7, 0], ['solarpanel', -34, 20, 6, 0], ['lights', 0, -4, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, vl.x + x, vl.z + z, sc, ry)); [[-22, -10, 6], [20, -18, 6], [-4, 24, 6]].forEach(([x, z, r]) => addC(vl.x + x, vl.z + z, r));
    // стартовая площадка у обрыва
    const pd = byId('pad'); place(B, 'landingpad_large', pd.x, pd.z, 6, 0); place(B, 'k_rocket_baseA', pd.x - 18, pd.z + 14, 5); place(B, 'k_rocket_fuelA', pd.x - 18, pd.z + 14, 5, 0, 8); place(B, 'k_rocket_topA', pd.x - 18, pd.z + 14, 5, 0, 13); addC(pd.x - 18, pd.z + 14, 4); place(B, 'lights', pd.x + 14, pd.z - 12, 6, 0);
    // упавший флагман на склоне Олимпа
    place(B, 'r_craft_cargoB', 70, -40, 14, 2.2, -2); addC(70, -40, 16); for (let k = 0; k < 5; k++) place(B, 'k_rock_largeA', 70 + Math.cos(k) * 24, -40 + Math.sin(k) * 24, 5, k);
    // светящиеся реки лавы и озеро в кальдере
    { const P = [], C = [], col = new THREE.Color(); for (const ra of RIV7) { let prev = null; for (let r = 84; r <= 520; r += 7) { const a = ra + Math.sin(r / 60 + ra) * 0.08, x = OLY7.x + Math.cos(a) * r, z = OLY7.z + Math.sin(a) * r, nx = -Math.sin(a) * 4.5, nz = Math.cos(a) * 4.5, rd = roadDist(x, z) < 9;
        const cur = [x + nx, H(x + nx, z + nz) + 0.35, z + nz, x - nx, H(x - nx, z - nz) + 0.35, z - nz]; if (prev && !rd) { const q = [prev, cur]; const v = (i, j) => P.push(q[i][j * 3], q[i][j * 3 + 1], q[i][j * 3 + 2]); v(0, 0); v(0, 1); v(1, 0); v(0, 1); v(1, 1); v(1, 0); for (let k = 0; k < 6; k++) { col.set(k % 3 === 1 ? '#ffd24a' : '#ff5a12'); C.push(col.r, col.g, col.b); } } prev = rd ? null : cur; } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false })); S.add(m); W.lavaM = m;
      const lk = new THREE.Mesh(new THREE.CircleGeometry(20, 28), new THREE.MeshBasicMaterial({ color: '#ff6a1a', fog: false })); lk.rotation.x = -Math.PI / 2; lk.position.set(OLY7.x, H(OLY7.x, OLY7.z) + 0.6, OLY7.z); S.add(lk); }
    // кальдера: тёмные глыбы по краю
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; place(B, k % 2 ? 'k_rock_largeA' : 'rocks_B', OLY7.x + Math.cos(a) * 76, OLY7.z + Math.sin(a) * 76, 6 + (k % 3) * 2, a); }
  }
  if (W.ch === 8) {
    // станция «Церера-Транзит»: модули, антенна, ракета, гномы-шахтёры
    const tr = byId('transit'); [['basemodule_A', -22, -14, 7, 0], ['basemodule_B', 20, -20, 7, 1], ['basemodule_garage', -6, 26, 7, 2], ['structure_tall', 34, 12, 8, 0], ['k_satelliteDish_large', -36, 14, 6, 0.6], ['landingpad_large', 30, 40, 6, 0], ['lights', 0, 0, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, tr.x + x, tr.z + z, sc, ry)); [[-22, -14, 6], [20, -20, 6], [-6, 26, 6], [34, 12, 3]].forEach(([x, z, r]) => addC(tr.x + x, tr.z + z, r));
    place(B, 's_Spaceship5', tr.x + 30, tr.z + 40, 1.4, 0.8, 1.5); for (let k = 0; k < 6; k++) place(B, k % 2 ? 'k_astronautA' : 'k_astronautB', tr.x - 12 + k * 4, tr.z + 10, 1.6, 2.8);
    // кратер Оккатор: кристаллы соли
    for (let k = 0; k < 10; k++) { const a = k * 0.63; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', OCC8.x + Math.cos(a) * (30 + (k % 3) * 18), OCC8.z + Math.sin(a) * (30 + (k % 3) * 18), 6, a); }
    // шахта гномов «Ледяная»: купол, буры, бочки
    const mn = byId('mine'); place(B, 'k_hangar_roundGlass', mn.x, mn.z, 12, 0); addC(mn.x, mn.z, 12); [['drill_structure', -26, 18, 7, 0], ['drill_structure', 24, -20, 7, 2], ['k_barrels', 18, 18, 5, 0], ['r_barrels_rail', -20, -18, 6, 1]].forEach(([m, x, z, sc, ry]) => place(B, m, mn.x + x, mn.z + z, sc, ry));
    // камнедробилка: площадка пиратов
    const rg = byId('rig'); [['r_platform_long', -40, 40, 8, 0], ['r_platform_long', 40, 40, 8, 0], ['k_rocket_baseA', -50, -40, 6, 0], ['r_satelliteDish_detailed', 50, -40, 6, 1], ['k_barrels', 0, 55, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, rg.x + x, rg.z + z, sc, ry));
  }
  if (W.ch === 9) buildCity9(B, addC, byId);
  if (W.ch === 10) {
    const st = byId('station'); [['basemodule_A', -22, -14, 7, 0], ['basemodule_B', 20, -20, 7, 1], ['basemodule_C', -6, 26, 7, 2], ['structure_tall', 34, 12, 8, 0], ['k_satelliteDish_large', -36, 14, 6, 0.6], ['landingpad_large', 30, 40, 6, 0], ['lights', 0, 0, 6, 0], ['basemodule_garage', -34, -34, 6, 0.4]].forEach(([m, x, z, sc, ry]) => place(B, m, st.x + x, st.z + z, sc, ry)); [[-22, -14, 6], [20, -20, 6], [-6, 26, 6], [34, 12, 3], [-34, -34, 6]].forEach(([x, z, r]) => addC(st.x + x, st.z + z, r));
    place(B, 's_Spaceship5', st.x + 30, st.z + 40, 1.4, 0.8, 1.5); for (let k = 0; k < 5; k++) place(B, k % 2 ? 'k_astronautA' : 'k_astronautB', st.x - 10 + k * 4, st.z + 12, 1.6, 2.8);
    const an = byId('antenna'); [[-40, -30, 0.3], [35, -40, 2], [10, 45, 4.4]].forEach(([x, z, ry], k) => { place(B, 'r_satelliteDish_detailed', an.x + x, an.z + z, 8, ry); addC(an.x + x, an.z + z, 4); }); W.SHEL10 = [[-70, 10], [70, 20], [0, -75], [-10, 80]].map(([x, z]) => ({ x: an.x + x, z: an.z + z })); W.SHEL10.forEach((q) => place(B, 'k_hangar_roundGlass', q.x, q.z, 9, 0));
    const cr = byId('crack'); [['basemodule_D', -30, -26, 5, 0.5], ['k_barrels', 26, -30, 5, 0], ['k_machine_generator', -36, 20, 5, 1]].forEach(([m, x, z, sc, ry]) => place(B, m, cr.x + x, cr.z + z, sc, ry)); addC(cr.x - 30, cr.z - 26, 5);
    for (let k = 0; k < 10; k++) { const a = k * 0.63; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_crystals', LAIR10.x + Math.cos(a) * 92, LAIR10.z + Math.sin(a) * 92, 7 + (k % 3) * 2, a); }
    for (let k = 0; k < 14; k++) { const a = hash(k, 401) * 6.28, r = hash(k, 403) * CHAOS10.r * 0.8; place(B, k % 3 ? 'k_rock_largeA' : 'k_rock_crystalsLargeA', CHAOS10.x + Math.cos(a) * r, CHAOS10.z + Math.sin(a) * r, 6 + hash(k, 405) * 8, a); }
  }
  if (W.ch === 11) {
    const pt = byId('port'); [['basemodule_A', -24, -16, 7, 0], ['basemodule_B', 22, -22, 7, 1], ['basemodule_C', -8, 28, 7, 2], ['structure_tall', 36, 10, 8, 0], ['k_satelliteDish_large', -38, 12, 6, 0.6], ['landingpad_large', 32, 42, 6, 0], ['lights', 0, 0, 6, 0], ['basemodule_garage', -36, -36, 6, 0.4], ['windturbine_tall', 44, -40, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, pt.x + x, pt.z + z, sc, ry)); [[-24, -16, 6], [22, -22, 6], [-8, 28, 6], [36, 10, 3], [-36, -36, 6]].forEach(([x, z, r]) => addC(pt.x + x, pt.z + z, r));
    place(B, 's_Spaceship5', pt.x + 32, pt.z + 42, 1.4, 0.8, 1.5); for (let k = 0; k < 5; k++) place(B, k % 2 ? 'k_astronautA' : 'k_astronautB', pt.x - 12 + k * 4, pt.z + 14, 1.6, 2.8);
    const dn = byId('dunes'); [['drill_structure', -20, -30, 7, 0], ['k_machine_barrelLarge', 24, -26, 6, 1], ['k_barrels', 30, 20, 5, 0], ['basemodule_D', -30, 26, 5, 2]].forEach(([m, x, z, sc, ry]) => place(B, m, dn.x + x, dn.z + z, sc, ry)); addC(dn.x - 20, dn.z - 30, 5);
    const hy = byId('huygens'); place(B, 'r_satelliteDish_detailed', hy.x - 30, hy.z - 30, 7, 0.4); place(B, 'basemodule_E', hy.x + 34, hy.z - 26, 5, 1); addC(hy.x - 30, hy.z - 30, 4); for (let k = 0; k < 14; k++) { const a = hash(k, 611) * 6.28, r = 20 + hash(k, 613) * 55; place(B, 'k_rocks_smallA', hy.x + Math.cos(a) * r, hy.z + Math.sin(a) * r, 3 + hash(k, 617) * 2, a); }
    const so = byId('sotra'); for (let k = 0; k < 9; k++) { const a = k * 0.7; place(B, k % 2 ? 'k_rock_crystalsLargeA' : 'k_rock_largeA', so.x + Math.cos(a) * 48, so.z + Math.sin(a) * 48, 6 + (k % 3) * 2, a); }
    const sh = byId('shore'); [['basemodule_D', -26, 10, 5, 0.3], ['k_barrels', 22, 14, 5, 0], ['r_platform_long', 0, -26, 6, 0], ['lights', 14, -8, 5, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, sh.x + x, sh.z + z, sc, ry)); addC(sh.x - 26, sh.z + 10, 5);
    const pr = byId('pier'); [['r_platform_long', -16, 30, 7, 0], ['r_platform_long', 16, -30, 7, Math.PI], ['lights', 0, 0, 6, 0], ['k_barrels', -20, -12, 5, 1]].forEach(([m, x, z, sc, ry]) => place(B, m, pr.x + x, pr.z + z, sc, ry)); place(B, 's_Spaceship3', pr.x + 34, pr.z + 4, 3.2, 1.2, 0.5);
  }
  if (W.ch === 14) {
    const km = byId('kam'); [['c_building-type-a', -26, -20, 9, 0], ['c_building-type-a', 26, -26, 9, 1.6], ['c_building-type-a', -14, 30, 9, 3.1], ['m_tent-canvas', 8, 6, 5, 0.3], ['m_structure-canvas', -6, -4, 5, 1], ['m_tent-canvas', 20, 18, 5, 2], ['lights', 0, 0, 6, 0], ['b_Windmill', 44, 20, 7, 0.4]].forEach(([m, x, z, sc, ry]) => place(B, m, km.x + x, km.z + z, sc, ry)); [[-26, -20, 7], [26, -26, 7], [-14, 30, 7]].forEach(([x, z, r]) => addC(km.x + x, km.z + z, r));
    for (let k = 0; k < 14; k++) place(B, 'n_crop_melon', km.x - 20 + (k % 7) * 6, km.z + 8 + Math.floor(k / 7) * 6, 3, k);
    const bh = byId('bahcha'); for (let k = 0; k < 40; k++) place(B, k % 4 ? 'n_crop_melon' : 'q_Watermelon_Crop', bh.x - 45 + (k % 8) * 12, bh.z - 30 + Math.floor(k / 8) * 13, k % 4 ? 3 : 2.2, k * 0.7); place(B, 'b_SmallBarn', bh.x + 50, bh.z + 30, 6, 2.4); place(B, 'a_tractor', bh.x + 40, bh.z - 30, 4, 1); addC(bh.x + 50, bh.z + 30, 8);
    const fw = byId('ferryW'); place(B, 'r_platform_long', fw.x + 20, fw.z, 7, 1.57); place(B, 'basemodule_D', fw.x - 24, fw.z - 14, 5, 0.3); place(B, 'lights', fw.x + 8, fw.z + 12, 5, 0);
    const my = byId('mayak'); place(B, 'structure_tall', my.x, my.z, 10, 0); place(B, 'lights', my.x, my.z, 12, 0, 9); place(B, 'n_tent_detailedOpen', my.x + 20, my.z - 16, 4, 1); addC(my.x, my.z, 5);
    const bk = byId('brak'); [['n_tent_detailedOpen', 22, -12, 4, 2.2], ['n_tent_detailedOpen', -6, -22, 4, 0.6], ['s_campfire-pit', 0, 0, 4, 0], ['n_log_stack', -18, 16, 3, 1], ['lights', 30, 20, 4, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, bk.x + x, bk.z + z, sc, ry));
    const ks = byId('kosa'); for (let k = 0; k < 8; k++) { const a = k * 0.8; place(B, k % 2 ? 'n_log_stack' : 'n_rock_largeA', ks.x + Math.cos(a) * 30, ks.z + Math.sin(a) * 30, 3, a); }
    // мост на опорах через Волгу (закрыт): пролёты и фермы
    { const zb = 60, x0 = riverX14(zb) - 115, x1 = riverX14(zb) + 115; for (let x = x0; x <= x1; x += 23) { B.add(BOX, mat(x, 2, zb, 3, 22, 4), () => TC.set('#9a9aa4'), { emit: true }); addC(x, zb, 2.2); } B.add(BOX, mat((x0 + x1) / 2, 12.6, zb, x1 - x0 + 6, 1.2, 8), () => TC.set('#5a5a62'), { emit: true }); for (let x = x0; x < x1; x += 23) B.add(BOX, mat(x + 11.5, 15, zb, 22, 0.5, 0.5, 0, 0, 0), () => TC.set('#c84a3a'), { emit: true }); }
  }
  if (W.ch === 13) {
    const tw = byId('town'); [['c_building-type-a', -26, -18, 9, 0], ['c_building-type-a', 24, -24, 9, 1.6], ['c_building-type-a', -10, 30, 9, 3.1], ['basemodule_A', 34, 14, 6, 0], ['k_satelliteDish_large', -40, 14, 6, 0.6], ['lights', 0, 0, 6, 0], ['m_tent-canvas', 10, -4, 5, 0.3], ['m_structure-canvas', -8, 8, 5, 1]].forEach(([m, x, z, sc, ry]) => place(B, m, tw.x + x, tw.z + z, sc, ry)); [[-26, -18, 7], [24, -24, 7], [-10, 30, 7], [34, 14, 5]].forEach(([x, z, r]) => addC(tw.x + x, tw.z + z, r));
    const mk = byId('mik'); place(B, 'k_hangar_largeA', mk.x - 10, mk.z + 20, 14, 0.8); addC(mk.x - 10, mk.z + 20, 14); place(B, 'structure_tall', mk.x + 28, mk.z + 22, 8, 0);
    const gg = byId('gagarin'); [['r_platform_high', 0, 0, 10, 0], ['r_supports_high', -16, 6, 9, 0], ['r_supports_high', 16, 6, 9, 0], ['structure_tall', 30, -20, 9, 0.4], ['lights', -26, 24, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, gg.x + x, gg.z + z, sc, ry)); addC(gg.x, gg.z, 8);
    const au = byId('aul'); [['k_hangar_roundA', -24, -18, 7, 0], ['k_hangar_roundA', 22, -26, 7, 1], ['k_hangar_roundA', -6, 30, 7, 2], ['s_campfire-pit', 0, 0, 5, 0], ['b_Windmill', 40, 20, 7, 0.4], ['s_signpost', -30, 14, 5, 1]].forEach(([m, x, z, sc, ry]) => place(B, m, au.x + x, au.z + z, sc, ry)); [[-24, -18, 6], [22, -26, 6], [-6, 30, 6]].forEach(([x, z, r]) => addC(au.x + x, au.z + z, r));
    W.PEN13 = { x: au.x - 46, z: au.z - 40, r: 12 }; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; if (k === 4 || k === 5) continue; place(B, 'n_fence_simple', W.PEN13.x + Math.cos(a) * 13, W.PEN13.z + Math.sin(a) * 13, 4, -a + Math.PI / 2); }
    const ty = byId('tyuratam'); [['c_building-type-a', -30, -30, 10, 0.5], ['r_platform_long', 0, 26, 8, 1.57], ['lights', 20, 0, 6, 0], ['spacetruck_large', 40, -20, 7, 1.2]].forEach(([m, x, z, sc, ry]) => place(B, m, ty.x + x, ty.z + z, sc, ry)); addC(ty.x - 30, ty.z - 30, 8);
    W.PIL13 = [[-30, 18], [30, 22], [-24, -10], [28, -34]].map(([x, z]) => ({ x: ty.x + x, z: ty.z + z, hp: 2 })); W.PIL13.forEach((q) => { B.add(BOX, mat(q.x, H(q.x, q.z) + 3, q.z, 4, 6, 4), (cx, cy, cz, nx, ny) => TC.set(Math.abs(Math.round(cy)) % 2 ? '#b8b4a8' : '#d8a43a').multiplyScalar(0.7 + 0.3 * Math.max(0, ny)), { emit: true }); addC(q.x, q.z, 3); });
    const cp = byId('capsule'); place(B, 'k_rocket_topA', cp.x + 8, cp.z - 6, 5, 0.6); place(B, 'n_tent_detailedOpen', cp.x - 14, cp.z + 10, 4, 1);
    // рельсы: две нитки и шпалы вдоль пути поезда с ракетой
    for (let i = 0; i < RAIL13.length - 1; i++) { const [ax, az] = RAIL13[i], [bx, bz] = RAIL13[i + 1], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az), n = Math.floor(L / 3); for (const sd of [-1.1, 1.1]) for (let k = 0; k < Math.ceil(L / 30); k++) { const t0 = k * 30 / L, t1 = Math.min(1, (k + 1) * 30 / L), mx = ax + (bx - ax) * (t0 + t1) / 2 + Math.cos(a) * sd, mz = az + (bz - az) * (t0 + t1) / 2 - Math.sin(a) * sd; B.add(BOX, mat(mx, H(mx, mz) + 0.25, mz, 0.18, 0.18, (t1 - t0) * L, a), () => TC.set('#9a9aa4'), { emit: true }); }
      for (let k = 0; k < n; k++) { const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; B.add(BOX, mat(x, H(x, z) + 0.08, z, 3.2, 0.14, 0.5, a), () => TC.set('#5a4030'), { emit: true }); } }
  }
  if (W.ch === 12) {
    const st = byId('station'); [['basemodule_A', -24, -16, 7, 0], ['basemodule_B', 22, -22, 7, 1], ['basemodule_C', -8, 28, 7, 2], ['k_hangar_roundGlass', 36, 10, 9, 0], ['k_satelliteDish_large', -38, 12, 6, 0.6], ['landingpad_large', 32, 42, 6, 0], ['lights', 0, 0, 6, 0], ['roofmodule_solarpanels', -36, -36, 6, 0.4], ['solarpanel', 44, -40, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, st.x + x, st.z + z, sc, ry)); [[-24, -16, 6], [22, -22, 6], [-8, 28, 6], [36, 10, 8]].forEach(([x, z, r]) => addC(st.x + x, st.z + z, r));
    for (let k = 0; k < 5; k++) place(B, k % 2 ? 'k_astronautA' : 'k_astronautB', st.x - 12 + k * 4, st.z + 14, 1.6, 2.8);
    const ap = byId('apollo'); place(B, 'lander_A', ap.x, ap.z, 6, 0.3); addC(ap.x, ap.z, 5); place(B, 'k_satelliteDish', ap.x + 14, ap.z - 8, 3, 1);
    const cn = byId('copern'); place(B, 'basemodule_D', cn.x - 20, cn.z - 14, 6, 0.4); place(B, 'k_machine_generator', cn.x + 16, cn.z - 18, 4, 1); place(B, 'lights', cn.x, cn.z - 4, 5, 0);
    const te = byId('tele'); for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.4; place(B, 'k_satelliteDish_large', te.x + Math.sin(a) * 24, te.z + Math.cos(a) * 24, 7, a + Math.PI); } for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { B.add(BOX, mat(te.x + dx, H(te.x + dx, te.z + dz) + 3.2, te.z + dz, 0.8, 6.4, 0.8), () => TC.set('#8a8a92'), { emit: true }); addC(te.x + dx, te.z + dz, 0.5); } B.add(BOX, mat(te.x, H(te.x, te.z) + 6.2, te.z, 11, 0.4, 11), () => TC.set('#d8a43a'), { emit: true });
    const ln = byId('luno'); place(B, 'basemodule_E', ln.x + 30, ln.z - 26, 5, 1); place(B, 'k_crater', ln.x - 30, ln.z + 20, 6, 0);
    const pt = byId('port'); [['landingpad_large', -30, 10, 8, 0], ['k_rocket_baseA', -30, 10, 8, 0], ['k_rocket_fuelA', -30, 10, 8, 0, 4.6], ['k_rocket_topA', -30, 10, 8, 0, 9.2], ['structure_tall', 36, -30, 8, 0], ['k_machine_generator', 40, 26, 6, 1], ['lights', 0, 30, 6, 0]].forEach(([m, x, z, sc, ry, dy]) => place(B, m, pt.x + x, pt.z + z, sc, ry, dy || 0)); addC(pt.x - 30, pt.z + 10, 8);
    { const R12 = RAMP12, L = R12.z0 - R12.z1, a = Math.atan2(R12.h, L), hy = H(R12.x, (R12.z0 + R12.z1) / 2); B.add(BOX, mat(R12.x, hy - 0.25, (R12.z0 + R12.z1) / 2, 12, 0.5, Math.hypot(L, R12.h) + 0.4, 0, a), (cx, cy, cz, nx, ny) => TC.set(Math.abs(Math.round(cx / 2)) % 2 ? '#d8a43a' : '#3a3a42').multiplyScalar(0.7 + 0.3 * Math.max(0, ny)), { emit: true });
      for (const sd of [-1, 1]) place(B, 'lights', R12.x + sd * 8, R12.z1 + 2, 4, 0); }
  }
  // разброс: камни, кристаллы, метеориты, кратеры-модели
  if (!CHC.clouds) for (let k = 0; k < 220; k++) { const x = (hash(k, 21) - 0.5) * SIZE * 0.95, z = (hash(k, 23) - 0.5) * SIZE * 0.95; if ((W.ch === 10 && k % 3) || (W.ch === 11 && (k % 2 || H(x, z) < 0)) || (W.ch === 12 && (k % 2 || rilleK12(x, z) > 0)) || (W.ch === 13 && k % 3) || (W.ch === 14 && (k % 2 || H(x, z) < 0.5)) || roadDist(x, z) < 9 || POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r) || (CHC.dark && cave4(x, z) < 0.7)) continue; const r = hash(k, 29);
    place(B, W.ch >= 13 ? (r < 0.4 ? 'n_grass_large' : r < 0.7 ? 'n_plant_bush' : r < 0.85 ? 'n_rock_smallA' : 'n_plant_bushLarge') : W.ch === 10 ? (r < 0.6 ? 'k_rock_crystals' : 'k_rock_crystalsLargeA') : r < 0.45 ? 'rocks_A' : r < 0.7 ? 'rocks_B' : r < 0.85 ? 'k_rock_largeA' : r < 0.95 ? 'k_rocks_smallA' : 'k_meteor_detailed', x, z, 3 + hash(k, 31) * 6, hash(k, 37) * 6.28, -0.3); }
  if (B.p.length) S.add(new THREE.Mesh(B.build(), bakedMat));
  // россыпь камней (по одной сетке на вид камня — один вызов отрисовки)
  [['rock_A', 600, 2, 7], ['rocks_A', 240, 2, 5]].forEach(([m, n, s0, s1], q) => { if (!MODELS || !MODELS[m] || CHC.clouds || W.ch >= 10) return; const b = new Builder([]); b.add(MODELS[m], null, null, { vcol: true, vk: CHC.dark ? 0.5 : 0.95 }); const im = new THREE.InstancedMesh(b.build(), bakedMat, CHC.dark ? n >> 2 : n); let c2 = 0;
    for (let k = 0; k < n * 2 && c2 < im.count; k++) { const x = (hash(k, 41 + q) - 0.5) * SIZE * 0.96, z = (hash(k, 43 + q) - 0.5) * SIZE * 0.96; if (roadDist(x, z) < 8 || POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r * 0.8) || (CHC.dark && cave4(x, z) < 0.6)) continue; const sc = s0 + hash(k, 47) * (s1 - s0); im.setMatrixAt(c2++, mat(x, H(x, z) - 0.15 * sc, z, sc, sc * (0.6 + hash(k, 53)), sc, hash(k, 59) * 6.28)); if (sc > 4 && W.COLL) W.COLL.push({ x, z, r: sc * 0.35, soft: true }); }
    im.count = c2; S.add(im); });
  // световые столбы над местами
  POI.forEach((p) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 160, 10, 1, true), new THREE.MeshBasicMaterial({ color: p.col, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    m.position.set(p.x, p.h + 80, p.z); S.add(m); p.beam = m; beams.push(m); });
  // столкновения с постройками (упрощённо — круги)
}
// Аэроград: платформы-диски на шарах, мосты с перилами, тросы, облачные башни
const BALLC9 = ['#f4ecd8', '#ef9a6a', '#f4d27a', '#bcdcf0', '#e88aa0'];
function buildCity9(B, addC, byId) { const col = (h) => h;
  for (const p of POI) { const r = p.r; B.add(CYL2, mat(p.x, -1.1, p.z, r * 2, 2, r * 2), p.kind === 'boss' ? '#6a5a5a' : '#c4bec8'); B.add(CYL2, mat(p.x, -4.5, p.z, r * 1.5, 5, r * 1.5), '#6a6470'); B.add(CYL2, mat(p.x, 0.05, p.z, r * 1.6, 0.1, r * 1.6), p.kind === 'boss' ? '#8a6a5a' : '#ddd4c2');
    const nb = p.kind === 'boss' ? 4 : 5; for (let k = 0; k < nb; k++) { const a = k / nb * 6.28 + 0.4, bx = p.x + Math.cos(a) * r * 0.7, bz = p.z + Math.sin(a) * r * 0.7, by = 34 + (k % 2) * 6, br = 9 + (k % 3) * 2; B.add(BALL2, mat(bx, by, bz, br, br * 1.15, br), p.kind === 'boss' ? '#4a3a40' : BALLC9[k % 5], SMOOTH); B.add(CYL, mat((p.x + Math.cos(a) * r * 0.85 + bx) / 2, by / 2 - 3, (p.z + Math.sin(a) * r * 0.85 + bz) / 2, 0.25, by - 6, 0.25), '#4a4448'); } }
  for (const r of ROADS) for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz), ux = dz / L, uz = -dx / L, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    B.add(BOX, mat(mx, -0.55, mz, 10, 1, L, ry), '#9a94a0'); for (const sd of [-1, 1]) { B.add(BOX, mat(mx + ux * 5 * sd, 0.6, mz + uz * 5 * sd, 0.3, 0.3, L, ry), '#d8c8a0'); }
    const n = Math.floor(L / 55); for (let k = 1; k < n; k++) { const t = k / n, x = a[0] + dx * t, z = a[1] + dz * t; for (const sd of [-1, 1]) B.add(CYL, mat(x + ux * 5 * sd, 0.3, z + uz * 5 * sd, 0.25, 1.4, 0.25), '#d8c8a0'); const bx = x + ux * 9 * (k % 2 ? 1 : -1), bz = z + uz * 9 * (k % 2 ? 1 : -1); B.add(BALL2, mat(bx, 20, bz, 5, 6, 5), BALLC9[k % 5], SMOOTH); B.add(CYL, mat((x + bx) / 2, 9, (z + bz) / 2, 0.15, 19, 0.15), '#4a4448'); } }
  const cf = byId('cafe'); [['basemodule_A', -24, -16, 7, 0], ['basemodule_B', 22, -22, 7, 1], ['basemodule_C', -20, 24, 7, 2], ['structure_tall', 36, 10, 8, 0], ['lights', 0, -8, 6, 0], ['k_satelliteDish_large', -40, 2, 5, 0.6], ['landingpad_large', 26, 30, 6, 0]].forEach(([m, x, z, sc, ry]) => place(B, m, cf.x + x, cf.z + z, sc, ry)); [[-24, -16, 6], [22, -22, 6], [-20, 24, 6], [36, 10, 3]].forEach(([x, z, r]) => addC(cf.x + x, cf.z + z, r));
  for (let k = 0; k < 6; k++) { const a = k * 1.05, x = cf.x + Math.cos(a) * 12, z = cf.z + 10 + Math.sin(a) * 8; B.add(CYL2, mat(x, 0.9, z, 2.4, 0.15, 2.4), '#f4ecd8'); B.add(CYL, mat(x, 0.45, z, 0.25, 0.9, 0.25), '#4a4448'); B.add(CYL2, mat(x, 3.2, z, 3.2, 0.12, 3.2), BALLC9[k % 5]); B.add(CYL, mat(x, 2, z, 0.12, 2.4, 0.12), '#ccc'); }
  const gd = byId('garden'); for (let k = 0; k < 4; k++) place(B, 'k_hangar_roundGlass', gd.x - 24 + k * 16, gd.z - 14 + (k % 2) * 10, 6, Math.PI / 2); for (let k = 0; k < 8; k++) { const x = gd.x - 30 + k * 8, z = gd.z + 24; B.add(BOX, mat(x, 0.4, z, 5, 0.8, 9), '#6a4a32'); B.add(BALL2, mat(x, 1.4, z, 1.8, 1.2, 3.6), '#5aa04a', SMOOTH); } place(B, 'k_machine_generator', gd.x + 30, gd.z - 10, 5); addC(gd.x + 30, gd.z - 10, 3);
  const pt = byId('port'); place(B, 'landingpad_large', pt.x, pt.z + 10, 7); place(B, 's_Spaceship5', pt.x - 20, pt.z - 15, 1.6, 0.8, 1.5); place(B, 'cargodepot_A', pt.x + 26, pt.z - 20, 6, 1); addC(pt.x + 26, pt.z - 20, 6); place(B, 'k_barrels', pt.x + 20, pt.z + 26, 5);
  const mt = byId('meteo'); place(B, 'structure_tall', mt.x, mt.z, 9); addC(mt.x, mt.z, 4); place(B, 'k_satelliteDish_large', mt.x + 24, mt.z + 10, 6, 1); place(B, 'windturbine_tall', mt.x - 24, mt.z - 16, 7); place(B, 'windturbine_tall', mt.x + 18, mt.z - 26, 7, 1); for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.5; B.add(CYL, mat(mt.x + Math.cos(a) * 34, 7, mt.z + Math.sin(a) * 34, 0.5, 14, 0.5), '#c8c0b0'); B.add(BALL2, mat(mt.x + Math.cos(a) * 34, 14.5, mt.z + Math.sin(a) * 34, 1.2, 1.2, 1.2), '#7fe8ff'); }
  const zn = byId('zina'); [['r_platform_long', -40, 40, 8, 0], ['r_platform_long', 40, 40, 8, 0], ['k_barrels', 0, 60, 6, 0], ['r_satelliteDish_detailed', 50, -40, 6, 1], ['cargo_A_stacked', -50, -36, 6, 0.5]].forEach(([m, x, z, sc, ry]) => place(B, m, zn.x + x, zn.z + z, sc, ry));
  // облачные башни — один набор шаров
  const N = 46, im = new THREE.InstancedMesh(BALL, new THREE.MeshLambertMaterial({ color: '#f6dea4' }), N); for (let i = 0; i < N; i++) { let x, z, q = 0; do { x = (hash(i + q * 97, 61) - 0.5) * SIZE * 0.95; z = (hash(i + q * 97, 67) - 0.5) * SIZE * 0.95; q++; } while (q < 9 && (POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + 40) || roadDist(x, z) < 30)); const sc = 14 + hash(i, 71) * 26; im.setMatrixAt(i, mat(x, -30 + hash(i, 73) * 18, z, sc * 1.4, sc, sc * 1.2)); } S.add(im);
}
function buildSpace() { if (CHC.blue) return buildClouds13(); if (CHC.sat) return buildSaturn(); if (CHC.earth) return buildEarth(); if (!CHC.space) return; if (CHC.belt) buildBelt(); if (CHC.jup) return buildJupiter(); if (CHC.mars === 0) return; const g = new THREE.SphereGeometry(330, 48, 32), P = g.attributes.position, C = [], sd = new THREE.Vector3(-0.6, 0.5, 0.6).normalize();
  for (let i = 0; i < P.count; i++) { const nx = P.getX(i) / 330, ny = P.getY(i) / 330, nz = P.getZ(i) / 330, n = fbm(nx * 3 + 7, nz * 3 + ny * 2), n2 = fbm(nx * 9 - 2, nz * 9 + ny * 5); const c = new THREE.Color('#c8643a').lerp(new THREE.Color('#e8a070'), n2 * 0.6).lerp(new THREE.Color('#5a2a22'), sstep(0.55, 0.7, n) * 0.8);
    if (Math.abs(ny) > 0.86) c.lerp(new THREE.Color('#f4f4ff'), sstep(0.86, 0.92, Math.abs(ny))); if (Math.abs(nz * 0.6 + nx * 0.8) < 0.05 && ny > -0.3 && ny < 0.3) c.multiplyScalar(0.6); const l = Math.max(0.08, nx * sd.x + ny * sd.y + nz * sd.z) * 0.9 + 0.1; c.multiplyScalar(l); C.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); m.renderOrder = -1; S.add(m); W.marsBall = m; }
function buildBelt() { const N = 70, m = new THREE.InstancedMesh(ICO, new THREE.MeshLambertMaterial({ color: '#8a8a92', fog: false }), N), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2 + hash(i, 5) * 0.3, r = 520 + hash(i, 6) * 160, y = 140 + hash(i, 7) * 160, sc = 6 + hash(i, 8) * 26; e.set(hash(i, 9) * 6, hash(i, 10) * 6, 0); q.setFromEuler(e); M.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(sc, sc * (0.6 + hash(i, 11) * 0.5), sc * 0.8)); m.setMatrixAt(i, M); }
  m.frustumCulled = false; m.renderOrder = -1; S.add(m); W.beltM = m; }
function buildAurora() { if (!CHC.aurora) return; const g = new THREE.Group(); g.userData.aur = 1;
  for (let k = 0; k < 4; k++) { const w = 700, geo = new THREE.PlaneGeometry(w, 150, 40, 6), P = geo.attributes.position, C = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), t = (y + 75) / 150; P.setZ(i, Math.sin(x / 70 + k * 2) * 60 + Math.sin(x / 23 + k) * 14); const c = new THREE.Color(k % 2 ? '#7aff9a' : '#6af0c8').lerp(new THREE.Color('#b07aff'), t * t); const a = Math.sin(t * Math.PI) * (0.6 + 0.4 * Math.sin(x / 40 + k)); C.push(c.r * a, c.g * a, c.b * a); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(Math.cos(k * 1.6) * 380, 110 + k * 18, Math.sin(k * 1.6) * 380); m.rotation.y = -k * 1.6 + Math.PI / 2; m.renderOrder = -1; g.add(m); }
  S.add(g); W.aurora = g;
  const N = 500, sg = new THREE.BufferGeometry(), sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { sp[i * 3] = (Math.random() - 0.5) * 140; sp[i * 3 + 1] = Math.random() * 60; sp[i * 3 + 2] = (Math.random() - 0.5) * 140; }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const pts = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.35, transparent: true, opacity: 0.85, depthWrite: false })); pts.frustumCulled = false; S.add(pts); W.snowP = pts; }
function buildJupiter() { const g = new THREE.SphereGeometry(330, 56, 36), P = g.attributes.position, C = [], sd = new THREE.Vector3(-0.75, 0.25, 0.62).normalize(), B = ['#efe4cc', '#c89a6a', '#e8d4b0', '#a8704a', '#f4ecd8', '#b88458'].map((c) => new THREE.Color(c));
  for (let i = 0; i < P.count; i++) { const nx = P.getX(i) / 330, ny = P.getY(i) / 330, nz = P.getZ(i) / 330, lat = Math.asin(Math.max(-1, Math.min(1, ny))), lon = Math.atan2(nx, nz), w = lat * 7 + (fbm(lon * 3 + 4, lat * 6) - 0.5) * 1.4, k = ((Math.floor(w) % 6) + 6) % 6, f = w - Math.floor(w);
    const c = B[k].clone().lerp(B[(k + 1) % 6], sstep(0.75, 1, f)); const sx = (lon + 0.4) / 0.2, sy = (lat + 0.32) / 0.09, sp = sx * sx + sy * sy; if (sp < 1) c.lerp(new THREE.Color(sp < 0.4 ? '#c04a30' : '#d8784a'), 0.85); if (Math.abs(ny) > 0.88) c.lerp(new THREE.Color('#8a7a6a'), 0.4);
    const l = Math.max(0.05, nx * sd.x + ny * sd.y + nz * sd.z) * 0.95 + 0.05; c.multiplyScalar(l); C.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); m.renderOrder = -1; m.scale.setScalar(1.6); S.add(m); W.marsBall = m; W.jupBall = 1; }
// голубое небо Земли: облака одним набором (свет в цвете вершин)
function buildClouds13() { const N = 34, im = new THREE.InstancedMesh(BALL, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.92, fog: false }), N * 4); let k = 0; for (let c = 0; c < N; c++) { const x = (hash(c, 901) - 0.5) * 2200, z = (hash(c, 903) - 0.5) * 2200, y = 150 + hash(c, 905) * 60, s = 18 + hash(c, 907) * 22; for (let j = 0; j < 4; j++) im.setMatrixAt(k++, mat(x + (j - 1.5) * s * 0.8, y + (j % 2) * s * 0.25, z + Math.sin(j * 2.1) * s * 0.4, s * (j % 3 ? 1 : 1.3), s * 0.45, s * 0.8)); } im.frustumCulled = false; S.add(im); }
// Земля в чёрном небе Луны: океаны, материки, облака, ледяные шапки; свет запечён в цвет вершин
function buildEarth() { const G = new THREE.Group(), g = new THREE.SphereGeometry(200, 56, 36), P = g.attributes.position, C = [], sd = new THREE.Vector3(-0.8, 0.3, 0.52).normalize(), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const nx = P.getX(i) / 200, ny = P.getY(i) / 200, nz = P.getZ(i) / 200, lon = Math.atan2(nx, nz), land = fbm(lon * 1.6 + 3, ny * 2.6 + 1) + (fbm(lon * 5, ny * 6) - 0.5) * 0.3, cl = fbm(lon * 3.4 + 9, ny * 7 - 2);
    if (land > 0.55) c.set(Math.abs(ny) < 0.35 && land < 0.62 ? '#c8b07a' : '#4a8a3a').lerp(new THREE.Color('#3a6a2a'), (land - 0.55) * 3); else c.set('#1e4ea0').lerp(new THREE.Color('#3a7ad0'), sstep(0.4, 0.55, land));
    if (Math.abs(ny) > 0.86) c.set('#f0f4ff'); if (cl > 0.58) c.lerp(new THREE.Color('#ffffff'), Math.min(0.9, (cl - 0.58) * 5)); const l = nx * sd.x + ny * sd.y + nz * sd.z; c.multiplyScalar(Math.max(0.03, l) * 1.05 + 0.03); if (l > -0.1 && l < 0.15) c.lerp(new THREE.Color('#ff9a5a'), 0.12); C.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); const ball = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); ball.renderOrder = -2; G.add(ball);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(212, 32, 20), new THREE.MeshBasicMaterial({ color: '#5aa0ff', transparent: true, opacity: 0.22, side: THREE.BackSide, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); halo.renderOrder = -1; G.add(halo);
  G.rotation.z = 0.41; S.add(G); W.marsBall = G; W.earthBall = 1; }
// Сатурн с кольцами сквозь оранжевую дымку Титана; свет запечён в цвет вершин
function buildSaturn() { const G = new THREE.Group(), g = new THREE.SphereGeometry(250, 48, 32), P = g.attributes.position, C = [], sd = new THREE.Vector3(-0.7, 0.35, 0.62).normalize(), B = ['#f0dca8', '#d8b878', '#ead2a0', '#c8a468', '#f4e6c0'].map((c) => new THREE.Color(c));
  for (let i = 0; i < P.count; i++) { const nx = P.getX(i) / 250, ny = P.getY(i) / 250, nz = P.getZ(i) / 250, lat = Math.asin(Math.max(-1, Math.min(1, ny))), w = lat * 9 + (fbm(Math.atan2(nx, nz) * 2, lat * 5) - 0.5) * 0.6, k = ((Math.floor(w) % 5) + 5) % 5; const c = B[k].clone().lerp(B[(k + 1) % 5], sstep(0.7, 1, w - Math.floor(w))); if (ny > 0.9) c.lerp(new THREE.Color('#8aa0a8'), 0.4); c.multiplyScalar(Math.max(0.06, nx * sd.x + ny * sd.y + nz * sd.z) * 0.95 + 0.05); C.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); const ball = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); G.add(ball);
  const rg = new THREE.RingGeometry(320, 590, 120, 6), RP = rg.attributes.position, RC = [], RB = [['#8a7a60', 0.25], ['#d8c8a0', 0.75], ['#e8dcb8', 0.9], ['#1a1410', 0.05], ['#c8b890', 0.7], ['#a89878', 0.45]];
  for (let i = 0; i < RP.count; i++) { const r = Math.hypot(RP.getX(i), RP.getY(i)), f = (r - 320) / 270, b = f < 0.18 ? 0 : f < 0.42 ? 1 : f < 0.62 ? 2 : f < 0.67 ? 3 : f < 0.88 ? 4 : 5, c = new THREE.Color(RB[b][0]).multiplyScalar(0.55 + 0.45 * RB[b][1] + Math.sin(r * 0.35) * 0.04); RC.push(c.r, c.g, c.b); }
  rg.setAttribute('color', new THREE.Float32BufferAttribute(RC, 3)); const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); ring.rotation.x = -Math.PI / 2 + 0.42; ring.rotation.y = 0.3; G.add(ring);
  G.rotation.z = 0.35; ball.renderOrder = -2; ring.renderOrder = -1; G.scale.setScalar(0.9); S.add(G); W.marsBall = G; W.satBall = 1;
  const N = 420, sg = new THREE.BufferGeometry(), sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { sp[i * 3] = (Math.random() - 0.5) * 140; sp[i * 3 + 1] = Math.random() * 60; sp[i * 3 + 2] = (Math.random() - 0.5) * 140; } // метановая морось: капли падают медленно
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const pts = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffd090', size: 0.3, transparent: true, opacity: 0.7, depthWrite: false })); pts.frustumCulled = false; S.add(pts); W.snowP = pts; }
// ночь на Земле (глава 14, бакены): k от 0 (день) до 1 (ночь)
W.setNight = function (k) { if (!S || !CHC.blue) return; const day = new THREE.Color(CHC.fog), night = new THREE.Color('#0a1424'); S.fog.color.copy(day).lerp(night, k); S.background = S.fog.color; hemi.intensity = 0.6 * (1 - k * 0.75); sun.intensity = 0.8 * (1 - k * 0.85); if (W.head) W.head.intensity = k * 2.6; };
W.snowStep = function (dt) { if (W.beltM) { W.beltM.position.set(camera.position.x, 0, camera.position.z); W.beltM.rotation.y += dt * 0.01; } if (W.marsBall) { W.marsBall.position.set(camera.position.x + 420, camera.position.y + 210, camera.position.z - 860); if (!CHC.jup && !CHC.sat) W.marsBall.rotation.y += dt * (CHC.earth ? 0.006 : 0.004); } const p = W.snowP; if (!p) return; const a = p.geometry.attributes.position.array, cx = camera.position.x, cz = camera.position.z; p.position.set(0, 0, 0);
  for (let i = 0; i < a.length; i += 3) { a[i + 1] -= dt * 4; a[i] += Math.sin(W.t + i) * dt * 0.6; let x = a[i], z = a[i + 2]; if (x - cx > 70) x -= 140; if (x - cx < -70) x += 140; if (z - cz > 70) z -= 140; if (z - cz < -70) z += 140; a[i] = x; a[i + 2] = z;
    if (a[i + 1] < H(x, z) + 9) { a[i + 1] = camera.position.y + 30 + Math.random() * 25; } } p.geometry.attributes.position.needsUpdate = true; if (W.aurora) W.aurora.position.set(cx, 0, cz); if (W.aurora) W.aurora.children.forEach((m, k) => (m.material.opacity = 0.6 + 0.3 * Math.sin(W.t * 0.5 + k * 1.3))); }
function buildWater() { if (CHC.water === undefined) return; const SE = CHC.sea || SEA4, g = new THREE.CircleGeometry(SE.r * (CHC.sea ? 1.45 : 1.08), 48); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: CHC.waterC || '#1a6a8a', transparent: true, opacity: CHC.sea ? 0.9 : 0.72, depthWrite: false })); m.position.set(SE.x, CHC.water, SE.z); m.renderOrder = 1; S.add(m); W.waterM = m; }
W.Hs = (x, z) => { const h = H(x, z); return CHC.water !== undefined && h < CHC.water ? CHC.water : h; };
function buildScene() {
  const old = S, keep = old ? old.children.filter((o) => o.userData.keep) : [];
  if (old) old.traverse((o) => { if (o.geometry && !o.userData.keep && o.geometry !== MODELS[o.name]) { /* общие геометрии моделей не трогаем */ } });
  S = W.scene = new THREE.Scene(); const fogC = new THREE.Color(CHC.fog); S.fog = new THREE.Fog(fogC, CHC.fogNear || 120, CHC.fogFar || 520); S.background = fogC;
  hemi = CHC.blue ? new THREE.HemisphereLight('#dcecff', '#5a4a30', 0.6) : CHC.earth ? new THREE.HemisphereLight('#e4eaf4', '#2a2a32', 0.62) : CHC.sat ? new THREE.HemisphereLight('#ffd8a0', '#3a2414', 0.7) : CHC.clouds ? new THREE.HemisphereLight('#fff0c8', '#a87a3a', 1.0) : CHC.dark ? new THREE.HemisphereLight('#c0a8f0', '#4a3050', 1.0) : CHC.ice ? new THREE.HemisphereLight('#dce8ff', '#3a4868', 0.8) : new THREE.HemisphereLight('#ffe0c8', '#5a2a28', 0.9); S.add(hemi); sun = new THREE.DirectionalLight(CHC.blue ? '#fff4e0' : CHC.earth ? '#ffffff' : CHC.sat ? '#ffc890' : CHC.dark ? '#7a90ff' : CHC.ice ? '#cfe0ff' : '#ffd0a0', CHC.dark ? 0.35 : 0.8); sun.position.set(0.5, 1, 0.3); S.add(sun);
  beams = []; W.snowP = null; W.aurora = null; W.marsBall = null; W.beltM = null; buildTerrain(); buildPOIs(); buildWater(); buildAurora(); buildSpace(); buildTracks(); if (!roverG) buildRover(); else S.add(roverG); if (!W.saucer && MODELS.s_Spaceship5) { const b = new Builder([]); b.add(MODELS.s_Spaceship5, mat(0, -1.2, 0, 1.1, 1.1, 1.1), null, { vcol: true, vk: 1.1 }); W.saucer = new THREE.Mesh(b.build(), bakedMat); W.saucer.visible = false; roverG.add(W.saucer); }
  if (!W.head) { const L = new THREE.SpotLight('#ffe8c0', 0, 120, 0.62, 0.5, 1); L.position.set(0, 2.2, 2.6); L.target.position.set(0, -1, 30); roverG.add(L); roverG.add(L.target); W.head = L; } W.head.intensity = CHC.dark ? 2.6 : 0; keep.forEach((o) => S.add(o)); W.ready = true;
}
// модели для глав догружаются по требованию (не на старте игры): пещерам нужны дачные модели Kenney и рыбы Quaternius
W.needPacks = (n) => n >= 13 ? Promise.all([MODELS.n_fence_simple ? null : (typeof KD !== 'undefined' && KD ? KD : getPack('kn_dacha')), MODELS.b_Windmill ? null : (typeof QC !== 'undefined' && QC ? QC : getPack('qt_crops')), MODELS.f_Anglerfish ? null : getPack('qt_fish')]).then(([d, c, f]) => { Object.assign(MODELS, d || {}, c || {}, f || {}); W.addMon && W.addMon(); }).catch(() => {}) : (n !== 4 && n !== 5 && n !== 10 && n !== 11) || MODELS.f_Anglerfish ? Promise.resolve() : Promise.all([typeof KD !== 'undefined' && KD ? KD : getPack('kn_dacha'), typeof QF !== 'undefined' && QF ? QF : getPack('qt_fish')]).then(([d, f]) => { Object.assign(MODELS, d, f); W.addMon && W.addMon(); }).catch(() => {});
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
  const wg = new THREE.CylinderGeometry(0.62, 0.62, 0.5, 16); wg.rotateZ(Math.PI / 2); const wb = new Builder(null); wb.add(wg, null, (cx, cy, cz, nx, ny, nz) => TC.set(Math.abs(nx) > 0.7 ? '#3a3438' : Math.floor((Math.atan2(cy, cz) + 3.1416) / 0.3927) % 2 ? '#141012' : '#2e2a2c').multiplyScalar(0.7 + 0.3 * Math.max(0, ny)), { emit: true });
  for (const sx of [-0.26, 0.26]) { for (let k = 0; k < 3; k++) wb.add(BOX, mat(sx, 0, 0, 0.06, 0.9, 0.13, 0, k * Math.PI / 3), () => TC.set('#c8c0b0'), { emit: true }); wb.add(CYL, mat(sx, 0, 0, 0.3, 0.07, 0.3, 0, 0, Math.PI / 2), () => TC.set('#d8a43a'), { emit: true }); } // спицы и ступица — видно, как крутится
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
const keys = W.keys = new Set(); addEventListener('keydown', (e) => keys.add(e.code)); addEventListener('keyup', (e) => keys.delete(e.code)); addEventListener('blur', () => keys.clear()); addEventListener('visibilitychange', () => document.hidden && keys.clear());
function roverStep(dt) {
  // ввод: джойстик (x — руль, y — газ/тормоз-назад), клавиатура WASD/стрелки
  let thr = 0, st = 0; if (JOY.id != null) { const jy = -JOY.y, jx = JOY.x; thr = Math.abs(jy) > 0.12 ? jy : 0; st = Math.abs(jx) > 0.1 ? -jx : 0; if (W.autoFwd && thr === 0 && Math.hypot(jx, jy) > 0.1) thr = 0.6; }
  if (keys.has('KeyW') || keys.has('ArrowUp')) thr = 1; if (keys.has('KeyS') || keys.has('ArrowDown')) thr = -1; if (keys.has('KeyA') || keys.has('ArrowLeft')) st = 1; if (keys.has('KeyD') || keys.has('ArrowRight')) st = -1;
  if (W.view === 2 && W.auto) { const a = W.auto; thr = a.thr; st = a.st; } // в турели ведёт бабка
  if (W.lock > 0) { thr = 0; st = 0; }
  if (W.nobrake > 0 && thr < 0) thr = 0; // ракетный двигатель вместо тормозов
  const onRoad = roadDist(R.x, R.z) < 7, vmax = (W.vmax || 17) * (onRoad ? 1.18 : 1) * (W.fuelOut ? 0.3 : 1) * (W.slow || 1) * (W.ch === 2 && W.river2(R.x, R.z) && R.air <= 0 ? 0.55 : 1) * (W.swim ? 0.62 : 1) * (W.flyMode ? 1.5 : 1) * (W.vmaxCap ? Math.min(1, W.vmaxCap / ((W.vmax || 17) * (onRoad ? 1.18 : 1))) : 1), n = normalAt(R.x, R.z);
  const fwd = new THREE.Vector3(Math.sin(R.h), 0, Math.cos(R.h)), slope = fwd.x * n.x + fwd.z * n.z; // спуск разгоняет, подъём тормозит
  if (R.air <= 0) { if (thr > 0) R.v += (thr * 9 - (R.v < 0 ? -6 : 0)) * dt; else if (thr < 0) R.v += thr * (R.v > 0 ? 14 : 6) * dt; else R.v -= Math.sign(R.v) * Math.min(Math.abs(R.v), (onRoad ? 2 : 4) * dt);
    R.v += slope * 9.8 * 0.55 * dt * (CHC.g ? 0.35 : 1); R.v = Math.max(-6, Math.min(vmax, R.v)); if (R.v > vmax) R.v += (vmax - R.v) * dt * 2; }
  R.steer += (st - R.steer) * Math.min(1, dt * (Math.abs(st) > Math.abs(R.steer) ? 5 : 9));
  R.h += R.steer * dt * 1.7 * Math.min(1, Math.abs(R.v) / 6) * Math.sign(R.v || 1) * (R.air > 0 ? (CHC.g ? 0.6 : 0.2) : 1);
  const gx = Math.sin(R.h) * R.v, gz = Math.cos(R.h) * R.v; if (CHC.ice && R.air <= 0 && !W.swim) { const grip = W.flags && W.flags.spikes ? 5 : 2.4; R.mx = (R.mx || 0) + (gx - (R.mx || 0)) * Math.min(1, dt * grip); R.mz = (R.mz || 0) + (gz - (R.mz || 0)) * Math.min(1, dt * grip); if (Math.hypot(R.mx - gx, R.mz - gz) > 5 && Math.random() < 0.3) burst(S, R.x, R.y + 0.3, R.z, 'smoke', '#e8f4ff', 2, 0.4); } else if (R.air <= 0 || !CHC.ice) { R.mx = gx; R.mz = gz; }
  let nx = R.x + R.mx * dt + (W.windX || 0) * dt, nz = R.z + R.mz * dt + (W.windZ || 0) * dt;
  if (!W.flyMode) for (const c of W.COLL) { const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), rr = c.r + 1.6; if (d < rr) { nx = c.x + dx / d * rr; nz = c.z + dz / d * rr; const sg = Math.sign(R.v) || 1, hx = Math.sin(R.h) * sg, hz = Math.cos(R.h) * sg, into = -(hx * dx + hz * dz) / d; if (Math.abs(R.v) > (c.soft ? 99 : 9) && into > 0.6) { W.hurt && W.hurt(Math.abs(R.v) * 0.35, 'Бум! Постройка'); shake = 0.4; }
      if (into > 0.2) { const tx = dz / d, tz = -dx / d, s1 = hx * tx + hz * tz, ta = Math.atan2(s1 >= 0 ? tx : -tx, s1 >= 0 ? tz : -tz) + (sg < 0 ? Math.PI : 0), da = Math.atan2(Math.sin(ta - R.h), Math.cos(ta - R.h)); R.h += da * 0.25; R.v *= into > 0.8 ? 0.7 : 0.92; } } } // упёрлись — скользим вдоль препятствия
  if (W.deckOn && !W.flyMode) { const inD = (x, z) => Math.abs(x - DECK6.x) <= DECK6.hl + 1 && Math.abs(z - DECK6.z) <= DECK6.hw + 1, Y = W.deckY(); if (inD(nx, nz) && !inD(R.x, R.z) && R.y < Y - 2.5) { nx = R.x; nz = R.z; if (Math.abs(R.v) > 9) { W.hurt && W.hurt(Math.abs(R.v) * 0.3, 'Бум! Борт флагмана'); shake = 0.4; } R.v *= -0.3; } } // борт флагмана: только по трапу
  nx = Math.max(-HALF + 20, Math.min(HALF - 20, nx)); nz = Math.max(-HALF + 20, Math.min(HALF - 20, nz)); R.x = nx; R.z = nz;
  // высота: подвеска и прыжки с бугров
  let gy = H(R.x, R.z); W.swim = CHC.water !== undefined && gy < CHC.water - 1.2 ? 1 : 0; if (W.swim) { gy = CHC.water - 1.2 + Math.sin(W.t * 2.4) * 0.22; if (Math.abs(R.v) > 4 && Math.random() < 0.4) burst(S, R.x - Math.sin(R.h) * 2.5, CHC.water + 0.2, R.z - Math.cos(R.h) * 2.5, 'smoke', '#bfefff', 2, 0.4); }
  if (W.flyMode) { const ty = gy + 13 + Math.sin(W.t * 2) * 0.8; R.y += (ty - R.y) * Math.min(1, dt * 3); R.vy = 0; R.air = 0; if (W.saucer) W.saucer.rotation.y += dt * 4; }
  else if (W.lift > 0) { W.lift -= dt; const ty = gy + 17 + Math.sin(W.t * 2) * 1.5; R.y += (ty - R.y) * Math.min(1, dt * 1.4); R.vy = 0; R.air = 1; R.h += dt * 0.9; R.v = Math.min(Math.max(R.v, 4), 7); if (Math.random() < 0.5) burst(S, R.x + (Math.random() - 0.5) * 8, R.y - 3, R.z + (Math.random() - 0.5) * 8, 'smoke', '#c88060', 5, 0.8); }
  else if (R.air > 0 || R.y > gy + 0.6) { R.vy -= (CHC.g || 16) * dt; R.y += R.vy * dt; R.air = 1; if (R.y <= gy) { const imp = -R.vy; R.y = gy; R.vy = 0; R.air = 0; R.svy -= imp * 0.3; if (imp > 5) { shake = Math.min(0.6, imp * 0.05); sfx('thud', { vol: Math.min(1, imp / 12) }); buzz(Math.min(60, imp * 4)); } } }
  else { const prevY = R.y; R.y = gy; const climb = (gy - prevY) / dt; if (climb < -7 && R.v > 9) { R.vy = -climb * 0.35 + 2; R.air = 1; R.y = prevY; } } // слетели с гребня — полёт
  R.svy += (-R.sy * 80 - R.svy * 9) * dt; R.sy += R.svy * dt;
  // наклон по рельефу + крен в повороте
  const right = new THREE.Vector3(Math.cos(R.h), 0, -Math.sin(R.h)), tp = Math.asin(Math.max(-0.8, Math.min(0.8, -(fwd.x * n.x + fwd.z * n.z)))), tr = Math.asin(Math.max(-0.8, Math.min(0.8, right.x * n.x + right.z * n.z)));
  R.pitch += (tp - R.pitch) * Math.min(1, dt * 8); R.roll += (tr - R.steer * 0.08 * Math.min(1, R.v / 12) - R.roll) * Math.min(1, dt * 8);
  roverG.position.set(R.x, R.y + R.sy + 0.05, R.z); roverG.rotation.set(0, 0, 0); roverG.rotation.order = 'YXZ'; roverG.rotation.y = R.h; roverG.rotation.x = R.pitch; roverG.rotation.z = R.roll;
  // пыль из-под колёс
  if (Math.abs(R.v) > 8 && R.air <= 0 && Math.random() < 0.35 && !onRoad && !CHC.clouds) burst(S, R.x - Math.sin(R.h) * 2, R.y + 0.5, R.z - Math.cos(R.h) * 2, 'smoke', '#c88060', 2.2, 0.6);
  if (W.lockY !== undefined) { R.y = W.lockY; R.vy = 0; R.air = 0; } // стоим на пароме
  tracksStep();
  W.speed = R.v; W.onRoad = onRoad; wheelsStep(dt);
}

/* ---------- камеры: 0 — сзади, 1 — кабина, 2 — турель деда ---------- */
const camP = new THREE.Vector3(), camL = new THREE.Vector3(), tmpV = new THREE.Vector3();
W.aimYaw = 0; W.aimPitch = 0.05;
function cameraStep(dt) {
  const cam = camera, port = innerWidth < innerHeight; cam.near = 0.15; cam.far = CHC.far || 650;
  if (W.view === 0) { const back = port ? 13 : 11, up = port ? 6.5 : 5; tmpV.set(R.x - Math.sin(R.h) * back, Math.max(H(R.x - Math.sin(R.h) * back, R.z - Math.cos(R.h) * back) + 2.5, R.y + up), R.z - Math.cos(R.h) * back);
    for (const c of W.COLL) if (Math.hypot(tmpV.x - c.x, tmpV.z - c.z) < c.r + 2.5) tmpV.y = Math.max(tmpV.y, R.y + 11); // не залезаем в постройки
    camP.lerp(tmpV, 1 - Math.exp(-dt * 5)); cam.position.copy(camP); camL.set(R.x + Math.sin(R.h) * 6, R.y + 1.6, R.z + Math.cos(R.h) * 6); cam.lookAt(camL); cam.fov += ((port ? 70 : 58) - cam.fov) * 0.1; }
  else if (W.view === 1) { roverG.updateMatrixWorld(); tmpV.set(-0.5, 2.15, 1.55).applyMatrix4(roverG.matrixWorld); cam.position.copy(tmpV); tmpV.set(-0.5, 1.6, 30).applyMatrix4(roverG.matrixWorld); cam.lookAt(tmpV); cam.fov += ((port ? 80 : 68) - cam.fov) * 0.15;
    cam.position.y += Math.sin(W.t * 20) * Math.min(0.03, Math.abs(R.v) * 0.002); }
  else { roverG.updateMatrixWorld(); dedT.updateMatrixWorld(); tmpV.set(0, 1.55, 0.1).applyMatrix4(dedT.matrixWorld); if (W.dedFig) W.dedFig.visible = false; cam.position.copy(tmpV); const yaw = R.h + W.aimYaw; tmpV.set(cam.position.x + Math.sin(yaw) * Math.cos(W.aimPitch) * 20, cam.position.y + Math.sin(W.aimPitch) * 20, cam.position.z + Math.cos(yaw) * Math.cos(W.aimPitch) * 20); cam.lookAt(tmpV); cam.fov += ((port ? 75 : 62) - cam.fov) * 0.15; }
  if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 1.6); }
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  // турель смотрит туда, куда целимся (в виде сзади/кабины — на цель, это делает боевой модуль)
  if (W.bodyMesh) W.bodyMesh.visible = W.view !== 1; if (W.view !== 2 && W.dedFig) W.dedFig.visible = true; gunT.rotation.y = W.aimYaw; W.barrel.rotation.x = Math.PI / 2 - W.aimPitch; roverG.visible = !W.foot; if (W.wheels) W.wheels.visible = !W.foot;
  skyG.position.copy(cam.position); W.fogK = (W.fogK || 1) + ((W.fog11 ? 0.2 : 1) - (W.fogK || 1)) * 0.03; S.fog.near = (CHC.fogNear || 120) * W.fogK; S.fog.far = CHC.fogFar ? CHC.fogFar * (W.dark2 > 0 ? 0.45 : 1) * W.fogK : W.view === 0 ? 520 : 460; skyG.visible = !CHC.dark && !CHC.clouds && !CHC.sat && !CHC.blue;
  const F = W.camFly; if (F) { F.t += dt; const k = Math.min(1, F.t / F.dur), a = F.a0 + k * 0.9; cam.far = 1400; if (F.fn) { const o = F.fn(k); cam.position.copy(o.p); cam.lookAt(o.l); } else { cam.position.set(F.x + Math.sin(a) * F.r, F.y, F.z + Math.cos(a) * F.r); cam.lookAt(F.x, F.ly, F.z); } cam.fov = 55; cam.updateProjectionMatrix(); S.fog.far = 1300; skyG.position.copy(cam.position); if (k >= 1) { W.camFly = null; F.cb && F.cb(); } }
}
W.setView = (v) => { W.view = v; document.body.classList.toggle('wdcab', v === 1); document.body.classList.toggle('wdtur', v === 2); $('wdView').textContent = ['🎥', '🚘', '🎯'][v]; sfx('click'); showMsg(['Вид сзади', 'Из кабины', 'Турель деда'][v], v === 2 ? 'веди пальцем справа — целься, «ОГОНЬ» — стреляй' : v === 1 ? 'баба Таня за рулём' : '', '#ffcf8a', 900); };

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
  #wdCross.lock{border-color:#ff4a3a;box-shadow:0 0 12px #ff4a3a,0 0 0 1px #000 inset;transform:scale(.8)}#wdCross{transition:transform .12s}#wdCross.lock:before,#wdCross.lock:after{background:#ff4a3a}
  #wdFire{position:absolute;right:84px;bottom:calc(30px + env(safe-area-inset-bottom));width:96px;height:96px;border-radius:50%;border:3px solid #ffd27a;background:radial-gradient(circle at 50% 40%,#ff7a3a,#b8281a);color:#fff;font:900 15px system-ui;text-shadow:0 1px 2px #000;pointer-events:auto;touch-action:none;display:none;box-shadow:0 6px 20px rgba(255,90,40,.5);user-select:none;-webkit-user-select:none}#wdFire b{display:block;font-size:30px;line-height:1}#wdFire.on{transform:scale(.92);background:radial-gradient(circle at 50% 40%,#ffb03a,#e0401a)}
  #wdCross{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border:2px solid rgba(255,240,200,.85);border-radius:50%;display:none;box-shadow:0 0 0 1px #000 inset}#wdCross:before,#wdCross:after{content:'';position:absolute;background:rgba(255,240,200,.9)}#wdCross:before{left:50%;top:-10px;bottom:-10px;width:2px;margin-left:-1px}#wdCross:after{top:50%;left:-10px;right:-10px;height:2px;margin-top:-1px}
  #wdDash{position:absolute;left:0;right:0;bottom:0;height:32vh;display:none;background:linear-gradient(180deg,rgba(0,0,0,0),#1a1014 18%,#2a1a20);border-top:3px solid #3a2a30}body.wdcab #wdDash{display:block}
  #wdDash .glass{position:absolute;left:0;right:0;bottom:100%;height:68vh;pointer-events:none;background:radial-gradient(ellipse at 50% 120%,transparent 60%,rgba(0,0,0,.35));box-shadow:inset 0 0 0 10px #2a1a20,inset 0 0 40px rgba(0,0,0,.6);border-radius:30px 30px 0 0}
  #wdWheel{position:absolute;left:50%;bottom:-24vh;width:46vh;height:46vh;margin-left:-23vh;border-radius:50%;border:5vh solid #3a2420;box-shadow:inset 0 0 0 1vh #5a3a30,0 0 0 1vh #1a0c10}#wdWheel:before{content:'';position:absolute;left:50%;top:50%;width:70%;height:3.5vh;margin:-1.75vh 0 0 -35%;background:#3a2420;border-radius:2vh}#wdWheel:after{content:'👵';position:absolute;left:50%;top:6%;font-size:5vh;transform:translateX(-50%)}
  .dial{position:absolute;bottom:4vh;width:13vh;height:13vh;border-radius:50%;background:radial-gradient(#140a0e,#2a1a20);border:.7vh solid #5a3a30;color:#ffd27a;font:900 2.4vh system-ui;display:grid;place-items:center;text-align:center;line-height:1}.dial small{display:block;font-size:1.3vh;color:#c8a080;font-weight:700}
  #dSpd{left:6vw}#dFuel{right:6vw}#wdPie{position:absolute;left:50%;top:-58vh;font-size:5vh;transform-origin:50% 0;margin-left:-2.5vh}
  #wdCrack{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s}body.wdcab #wdCrack.on{opacity:1}
  #wdMapBox{position:fixed;inset:0;z-index:14;display:none;background:rgba(10,4,8,.92);align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#ffe0c0}#wdMapBox.on{display:flex}#wdMapBox{overflow:auto;justify-content:flex-start!important;padding:calc(10px + env(safe-area-inset-top)) 10px 16px}#wdMapBox canvas{position:relative!important;inset:auto!important;z-index:auto!important;width:min(94vw,58vh);height:min(94vw,58vh);border-radius:16px;border:2px solid #5a3a30;flex:none}#wdMapL{display:grid;gap:6px;width:min(94vw,520px)}#wdMapL h5{margin:6px 0 0;font-size:13px;color:#ffd27a}#wdMapL button{display:flex;align-items:center;gap:8px;text-align:left;border:1px solid rgba(255,210,140,.3);background:rgba(60,28,42,.92);color:#ffe8d0;border-radius:12px;padding:9px 11px;font:700 14px system-ui}#wdMapL button small{margin-left:auto;opacity:.75;font-size:12px;white-space:nowrap}#wdMapL button.cur{border-color:#ffd27a;box-shadow:0 0 12px rgba(255,210,120,.45)}#wdMapL div.lk{opacity:.5;padding:4px 11px;font-size:13px}#wdMapL div.dn{opacity:.6;padding:4px 11px;font-size:13px}#wdMapX{flex:none;border:0;border-radius:14px;padding:10px 26px;font:800 15px system-ui;background:#ffd27a;color:#2a1406}
  `; document.head.appendChild(css);
  const h = document.createElement('div'); h.id = 'wdHud'; h.innerHTML = `<div id="wdXp"><i></i></div>
    <div id="wdTop"><div class="wdBars"><div class="wdBar"><i id="wbHull" style="background:linear-gradient(90deg,#ff7a4a,#ffd24a)"></i><b>🛠 корпус</b></div><div class="wdBar"><i id="wbNerv" style="background:linear-gradient(90deg,#ff4a8a,#ff9ad5)"></i><b>❤ нервы бабули</b></div></div><div id="wdRes"></div></div>
    <div id="wdObj"></div><div id="wdComp"></div><div id="wdCross"></div><button id="wdFire"><b>🎯</b>ОГОНЬ</button>
    <svg id="wdCrack" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M70 20 L64 30 L72 38 L60 52 M64 30 L54 28 M72 38 L84 44" stroke="rgba(255,255,255,.7)" stroke-width=".4" fill="none"/><path d="M22 34 L30 42 L24 50 L34 60" stroke="rgba(255,255,255,.6)" stroke-width=".35" fill="none"/></svg>
    <div id="wdDash"><div class="glass"></div><div id="wdPie">🥟</div><div id="wdWheel"></div><div class="dial" id="dSpd"><div><b id="dSpdV">0</b><small>км/ч</small></div></div><div class="dial" id="dFuel"><div><b id="dFuelV">0</b><small>⛽ %</small></div></div></div>
    <div id="wdBtns"><button id="wdView">🎥</button><button id="wdJam">🫙</button><button id="wdMapB">🗺</button></div>`;
  document.body.appendChild(h);
  const mb = document.createElement('div'); mb.id = 'wdMapBox'; mb.innerHTML = '<b id="wdMapT" style="font-size:17px">Карта</b><canvas id="wdMapC" width="512" height="512"></canvas><div id="wdMapL"></div><button id="wdMapX">✕ Закрыть</button>'; document.body.appendChild(mb);
  mb.onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) { e.stopPropagation(); W.pickMission && W.pickMission(b.dataset.m); mb.classList.remove('on'); return; } if (e.target.closest('#wdMapX') || e.target === mb) mb.classList.remove('on'); };
  $('wdMapC').onclick = (e) => { e.stopPropagation(); const r = e.target.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 512, y = (e.clientY - r.top) / r.height * 512; let best = null, bd = 34; for (const m of W.mapMarks || []) { const d = Math.hypot(m.px - x, m.py - y); if (d < bd && m.id) { bd = d; best = m; } } if (best) { W.pickMission && W.pickMission(best.id); mb.classList.remove('on'); } };
  $('wdView').onclick = (e) => { e.stopPropagation(); W.setView((W.view + 1) % 3); };
  $('wdMapB').onclick = (e) => { e.stopPropagation(); drawMap(); mb.classList.add('on'); sfx('open'); };
  $('wdJam').onclick = (e) => { e.stopPropagation(); W.special && W.special(); };
}
function drawMap() { const c = $('wdMapC'), x = c.getContext('2d'), N = 128, im = x.createImageData(N, N);
  if (!W.mapImg) { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const wx = (i / N - 0.5) * SIZE, wz = (j / N - 0.5) * SIZE, h = H(wx, wz), rd = roadDist(wx, wz), k = (j * N + i) * 4, sh = Math.max(0.3, Math.min(1.3, 0.85 + (H(wx + 6, wz) - h) * -0.08));
      let r = 190 + h * 2, g = 100 + h * 1.6, b = 70 + h; if (W.ch === 8) { r = 90 + h * 1.5; g = 90 + h * 1.5; b = 105 + h * 1.5; if (W.salt8(wx, wz)) { r = g = b = 250; } } if (W.ch === 10) { r = 200 + h * 3; g = 212 + h * 3; b = 228 + h * 2; if (line10(wx, wz) < 4) { r = 170; g = 100; b = 70; } } if (W.ch === 13) { r = 140 + h * 3; g = 150 + h * 3; b = 80 + h * 2; } if (W.ch === 14) { r = 120 + h * 3; g = 150 + h * 3; b = 80 + h * 2; if (h < CHC.water) { r = 70; g = 120; b = 170; } } if (W.ch === 12) { r = g = 150 + h * 2.5; b = 158 + h * 2.5; if (rilleK12(wx, wz) > 0.3) { r = g = 50; b = 60; } } if (W.ch === 11) { r = 180 + h * 2; g = 128 + h * 1.6; b = 70 + h; const dd = dune11(wx, wz); r -= dd * 50; g -= dd * 40; b -= dd * 25; if (h < CHC.water) { r = 50; g = 34; b = 22; } } if (CHC.clouds) { const cy = cloud9(wx, wz); r = 230 + cy; g = 195 + cy; b = 120 + cy * 0.5; if (W.deck9(wx, wz)) { r = 150; g = 145; b = 160; } } if (CHC.lava) { r = 120 + h * 0.9; g = 60 + h * 0.6; b = 50 + h * 0.4; if (lava7(wx, wz) < 6) { r = 255; g = 120; b = 30; } } if (CHC.ice) { r = 140 + h; g = 160 + h; b = 195 + h * 0.8; } if (CHC.dark) { const c = cave4(wx, wz); r = 30 + c * 140; g = 22 + c * 110; b = 36 + c * 130; if (h < CHC.water) { r = 40; g = 120; b = 170; } } if (rd < 7) { r = 70; g = 50; b = 60; } im.data[k] = r * sh; im.data[k + 1] = g * sh; im.data[k + 2] = b * sh; im.data[k + 3] = 255; } W.mapImg = im; }
  const t = document.createElement('canvas'); t.width = t.height = N; t.getContext('2d').putImageData(W.mapImg, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(t, 0, 0, 512, 512);
  const P = (wx, wz) => [(wx / SIZE + 0.5) * 512, (wz / SIZE + 0.5) * 512]; x.font = '22px system-ui'; x.textAlign = 'center';
  POI.forEach((p) => { const [a, b] = P(p.x, p.z); x.fillStyle = p.col; x.globalAlpha = 0.3; x.beginPath(); x.arc(a, b, 16, 0, 7); x.fill(); x.globalAlpha = 1; x.fillText(p.e, a, b + 8); x.fillStyle = '#fff'; x.font = '12px system-ui'; x.fillText(p.name, a, b + 24); x.font = '22px system-ui'; });
  // миссии главы: номера сюжета и ⭐ открытые задания
  W.mapMarks = (W.missionMarks ? W.missionMarks() : []).map((m) => { const [a, b] = P(m.x, m.z); x.save(); x.globalAlpha = m.st === 'lock' ? 0.55 : 1; x.fillStyle = m.st === 'cur' ? '#ffd27a' : m.st === 'done' ? '#5a8a5a' : m.side ? '#7a3aa8' : '#4a3a44'; x.strokeStyle = m.st === 'cur' ? '#fff' : 'rgba(255,255,255,.7)'; x.lineWidth = m.st === 'cur' ? 3 : 1.5;
    const ox = m.side ? 0 : 18, oy = m.side ? 0 : -18; x.beginPath(); x.arc(a + ox, b + oy, 12, 0, 7); x.fill(); x.stroke(); x.fillStyle = m.st === 'cur' ? '#2a1406' : '#fff'; x.font = 'bold 13px system-ui'; x.fillText(m.mark, a + ox, b + oy + 5); x.restore(); return Object.assign({ px: a + ox, py: b + oy }, m); });
  x.font = '22px system-ui'; $('wdMapT').textContent = 'Карта: ' + (CHC.name || '') + ' — нажми на миссию, чтобы ехать к ней'; $('wdMapL').innerHTML = W.missionList ? W.missionList() : '';
  const [a, b] = P(R.x, R.z); x.save(); x.translate(a, b); x.rotate(-R.h + Math.PI); x.fillStyle = '#7fe8ff'; x.beginPath(); x.moveTo(0, -10); x.lineTo(7, 8); x.lineTo(-7, 8); x.fill(); x.restore(); }
W.drawMap = drawMap;
function hudStep() {
  const s = W.st; if (!s) return;
  $('wbHull').style.transform = `scaleX(${Math.max(0, s.hull / s.hullMax)})`; $('wbNerv').style.transform = `scaleX(${Math.max(0, s.nerves / 100)})`;
  const r = [['⛽', Math.round(s.fuel) + '%', s.fuel < 15], ['🥟', s.food, s.food <= 1], ['🧂', Math.floor(s.ammo), s.ammo < 20], ['⚙', s.parts], ['₽', s.money]];
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
    let svch = 1; try { const sv = JSON.parse(localStorage.getItem('bm_world') || 'null'); if (sv && sv.ch) svch = sv.ch; } catch (e) {}
    if (svch >= 13 && !MODELS.b_Windmill) { if (!W.packLoading13) { W.packLoading13 = 1; showMsg('Садимся в степь…', '', '#ffcf8a', 1200); W.needPacks(13).then(W.start); } return; }
    if ((svch === 4 || svch === 5 || svch >= 10) && !MODELS.f_Anglerfish) { if (!W.packLoading) { W.packLoading = 1; showMsg(svch === 11 ? 'Садимся на Титан…' : svch === 10 ? 'Садимся на Европу…' : 'Спускаемся в пещеры…', '', '#ffcf8a', 1200); W.needPacks(4).then(W.start); } return; }
    setChapter(svch); buildScene(); buildUI(); }
  W.active = true; document.body.classList.add('world'); $('end').classList.remove('on');
  S.add(skyG); skyG.visible = true; babka.visible = false; R.y = H(R.x, R.z); camP.set(R.x, R.y + 8, R.z - 12);
  W.st = W.st || { hull: 120, hullMax: 120, nerves: 100, fuel: 100, food: 6, ammo: 160, parts: 0, money: 150, xp: 0, need: 8, lvl: 1 };
  if (W.onStart) W.onStart();
};
W.stop = function () { if (!W.active) return; W.active = false; document.body.classList.remove('world', 'wdcab', 'wdtur'); scene.add(skyG); babka.visible = true; };
W.frame = function (dt, now) {
  W.t += dt; if (!W.paused) { roverStep(dt); if (W.combat) W.combat(dt); if (W.logic) W.logic(dt); }
  cameraStep(dt); hudStep(); if (W.snowP || W.marsBall || W.beltM) W.snowStep(dt); beams.forEach((b, k) => (b.material.opacity = 0.14 + Math.sin(W.t * 2 + k) * 0.05));
  if (CHC.sat) sun.position.set(0.9, 0.42, 0.25); else if (CHC.earth) sun.position.set(-0.8, 0.5, 0.35); else sun.position.set(Math.sin(W.t * 0.01) * 0.6 + 0.3, 1, 0.3);
  renderer.render(S, camera);
};
// касания: левая часть — джойстик, правая — прицел/выстрел
W.pointer = function (e) {
  if (e.target.closest('#wdFire')) { e.preventDefault(); W.aimId = e.pointerId; W.aimX = e.clientX; W.aimY = e.clientY; W.firing = true; return; }
  if (e.target.closest('#wdBtns') || e.target.closest('#wdMapBox') || e.target.closest('#rcards') || e.target.closest('#rdlg')) return;
  if (e.clientX < innerWidth * 0.48) { joyStart(e); return; }
  W.aimId = e.pointerId; W.aimX = e.clientX; W.aimY = e.clientY; W.firing = true; if (W.tap) W.tap(e.clientX, e.clientY);
};
addEventListener('pointermove', (e) => { if (!W.active || e.pointerId !== W.aimId) return; const dx = e.clientX - W.aimX, dy = e.clientY - W.aimY; W.aimX = e.clientX; W.aimY = e.clientY;
  W.aimYaw -= dx * (W.view === 2 ? 0.006 : 0.008); W.aimPitch = Math.max(-0.35, Math.min(0.6, W.aimPitch - dy * 0.005)); W.manual = 1.2; });
// компьютер: пробел или F — огонь
addEventListener('keydown', (e) => { if (W.active && (e.code === 'Space' || e.code === 'KeyF')) { W.firing = true; W.keyFire = 1; e.preventDefault(); } }); addEventListener('keyup', (e) => { if (W.active && (e.code === 'Space' || e.code === 'KeyF') && W.keyFire) { W.keyFire = 0; if (W.aimId == null) W.firing = false; } });
const upAim = (e) => { if (e.pointerId === W.aimId) { W.aimId = null; W.firing = false; } }; addEventListener('pointerup', upAim); addEventListener('pointercancel', upAim);
})();
