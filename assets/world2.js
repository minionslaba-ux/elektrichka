/* =====================================================================
   ОТКРЫТЫЙ МАРС — часть 2: твари, оружие деда, опыт и карточки, урон, конец экспедиции
   ===================================================================== */
window.WD_PART2 = function () {
'use strict';
const W = window.WD, R = W.rover, V3 = THREE.Vector3;
let MON = null; const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), SC = new V3(), P = new V3(), CW = new THREE.Color(1, 1, 1), CH = new THREE.Color(3, 3, 3), CF = new THREE.Color(1.6, 0.6, 0.6), CS = new THREE.Color(0.55, 0.65, 1.1);
const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)], dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

/* ---------- виды тварей ---------- */
const T = W.TYPES = {
  bug: { m: 'm_armabee', name: 'жук-броненосец', h: 1.5, hp: 3, sp: 8, dmg: 3, xp: 1, r: 1.1, ground: 1 },
  bug2: { m: 'm_armabee_evolved', name: 'жук-бронебой', h: 1.9, hp: 9, sp: 6.5, dmg: 9, xp: 3, r: 1.3, ground: 1 },
  jumper: { m: 'm_greenspikyblob', name: 'колючий прыгун', h: 1.7, hp: 6, sp: 5, dmg: 11, xp: 3, r: 1.2, ground: 1, buried: 1 },
  squid: { m: 'm_squidle', name: 'летучий кальмар', h: 2.2, hp: 8, sp: 9, dmg: 7, xp: 4, r: 1.5, fly: 5 },
  glub: { m: 'm_glub', name: 'рыба-пузырь', h: 1.4, hp: 2, sp: 13, dmg: 3, xp: 1, r: 1, fly: 3 },
  whirl: { m: 'm_hywirl', name: 'пылевой вихрь', h: 3.6, hp: 50, sp: 5, dmg: 14, xp: 18, r: 2.4, ground: 1, elite: 1 },
  ghost: { m: 'm_ghost', name: 'марсианский призрак', h: 2.4, hp: 10, sp: 7, dmg: 0, nerve: 5, xp: 5, r: 1.4, fly: 2 },
  gole: { m: 'm_goleling', name: 'страж гнезда', h: 2.4, hp: 22, sp: 4, dmg: 10, xp: 8, r: 1.6, fly: 2.5, shoots: 1 },
  pink: { m: 'm_pinkblob', name: 'слизень-делитель', h: 1.8, hp: 6, sp: 6, dmg: 4, xp: 2, r: 1.2, ground: 1, split: 1 },
  mush: { m: 'm_mushnub', name: 'гриб-путаник', h: 1.8, hp: 6, sp: 5, dmg: 5, xp: 3, r: 1.2, ground: 1, spore: 1 },
  pirate: { m: 'r_craft_speederA', name: 'пират на ховербайке', h: 1.5, hp: 12, sp: 18, dmg: 7, xp: 6, r: 2, fly: 1.2, rot: Math.PI },
  mine: { m: 'r_barrel', name: 'пиратская мина', h: 1.2, hp: 2, sp: 0, dmg: 16, xp: 1, r: 1.2, ground: 1, mine: 1 },
  sniper: { m: 'r_turret_single', name: 'пиратская турель', h: 3.4, hp: 30, sp: 0, dmg: 0, xp: 10, r: 2, ground: 1, still: 1 },
  dino: { m: 'm_dino', name: 'ящер-камнеед', h: 3.4, hp: 45, sp: 7, dmg: 10, xp: 14, r: 2.4, ground: 1, elite: 1 },
  barge: { m: 'r_craft_cargoB', name: 'Баржа «ТрансГалактик»', h: 9, hp: 700, sp: 9, dmg: 20, xp: 250, r: 9, fly: 8, boss: 1, rot: Math.PI },
  bpart: { m: 'r_turret_double', name: 'двигатель баржи', h: 3, hp: 170, sp: 0, dmg: 0, xp: 30, r: 2.4, fly: 8, boss: 1 },
  police: { m: 'k_alien', name: 'марсианский полицейский', h: 2.6, hp: 14, sp: 9, dmg: 6, xp: 5, r: 1.3, ground: 1 , rot: Math.PI },
  thief: { m: 'k_craft_cargoA', name: 'фургон похитителей', h: 3.2, hp: 170, sp: 14, dmg: 0, xp: 60, r: 3.5, fly: 1.4, elite: 1, rot: Math.PI },
  umb: { m: 'k_satelliteDish', name: 'зонтик-щит', h: 3.2, hp: 55, sp: 0, dmg: 0, xp: 20, r: 2.2, fly: 7, elite: 1 },
  pusik: { m: 'm_dragon', name: 'Пусик, дракончик Зурги', h: 4, hp: 150, sp: 10, dmg: 12, xp: 60, r: 2.5, fly: 4, elite: 1, shoots: 1 },
  zurga: { m: 'k_alien', name: 'Тёща Зурга', h: 9, hp: 650, sp: 5, dmg: 12, xp: 300, r: 4, ground: 1, boss: 1 , rot: Math.PI },
  angler: { m: 'f_Anglerfish', name: 'рыба-удильщик', h: 2.4, hp: 16, sp: 9, dmg: 8, xp: 6, r: 1.6, fly: 2.6 },
  gshark: { m: 'f_GoblinShark', name: 'акула-гоблин', h: 2.4, hp: 28, sp: 12, dmg: 12, xp: 9, r: 2, fly: -0.4 },
  catf: { m: 'f_ArmoredCatfish', name: 'сом-броненосец', h: 2.6, hp: 45, sp: 6, dmg: 14, xp: 12, r: 2.2, fly: -0.3, elite: 1 },
  larva: { m: 'f_Worm', name: 'червячок', h: 1.3, hp: 5, sp: 7, dmg: 4, xp: 1, r: 0.9, ground: 1 },
  worm: { m: 'k_wormhead', name: 'Червь-картофелеед', h: 5, hp: 600, sp: 0, dmg: 18, xp: 350, r: 3.5, boss: 1 },
  yeti: { m: 'p_animal-polar', name: 'медведь-йети', h: 3, hp: 40, sp: 9, dmg: 12, xp: 12, r: 2, ground: 1 },
  hbear: { m: 'p_animal-polar', name: 'медведь-хоккеист', h: 3.2, hp: 9999, sp: 0, dmg: 0, xp: 0, r: 2, ground: 1 },
  idragon: { m: 'm_dragon', name: 'Ледяной дракон', h: 8, hp: 700, sp: 0, dmg: 16, xp: 400, r: 4.5, fly: 12, boss: 1, tint: '#a8e0ff' },
  fighter: { m: 'r_craft_racer', name: 'пиратский истребитель', h: 2, hp: 20, sp: 20, dmg: 8, xp: 8, r: 2, fly: 13, rot: Math.PI },
  deng: { m: 'r_turret_double', name: 'двигатель флагмана', h: 3.4, hp: 150, sp: 0, dmg: 0, xp: 30, r: 2.6, ground: 1, still: 1 },
  admiral: { m: 'm_orc_skull', name: 'Адмирал Галина', h: 6.5, hp: 700, sp: 0, dmg: 16, xp: 450, r: 3.5, ground: 1, boss: 1, tint: '#ffb0e0' },
  olymp: { m: 'm_goleling', name: 'Дух Олимпа', h: 10, hp: 600, sp: 0, dmg: 20, xp: 600, r: 5, ground: 1, boss: 1, tint: '#ff9a5a' },
  rig: { m: 'k_craft_miner', name: 'Камнедробилка Толяна', h: 12, hp: 700, sp: 0, dmg: 20, xp: 500, r: 7, ground: 1, boss: 1 },
  drill: { m: 'r_turret_double', name: 'бур камнедробилки', h: 3.4, hp: 120, sp: 0, dmg: 0, xp: 30, r: 2.6, elite: 1, fly: 8 },
  zina: { m: 'p_airship', name: 'Дирижабль мамаши Зины', h: 10, hp: 800, sp: 0, dmg: 0, xp: 600, r: 9, fly: 9, boss: 1 },
  gasbag: { m: 'p_gasbag', name: 'баллон с краденым газом', h: 4.2, hp: 130, sp: 0, dmg: 0, xp: 30, r: 2.8, elite: 1, fly: 10 },
  tanker: { m: 'k_craft_cargoA', name: 'газовоз пиратов', h: 3.4, hp: 240, sp: 14, dmg: 0, xp: 80, r: 3.6, fly: 1.4, elite: 1, rot: Math.PI, tint: '#ff9ab8' },
  acidj: { m: 'm_squidle', name: 'кислотная медуза', h: 2.4, hp: 12, sp: 8, dmg: 8, xp: 5, r: 1.6, fly: 5, tint: '#d8ff6a' },
  methw: { m: 'f_Worm', name: 'метановый червь', h: 1.9, hp: 26, sp: 8, dmg: 8, xp: 7, r: 1.3, ground: 1, tint: '#ff9a4a' },
  kraken: { m: 'm_squidle', name: 'Метановый Кракен', h: 11, hp: 900, sp: 0, dmg: 18, xp: 700, r: 7, fly: 1, boss: 1, tint: '#c8603a' },
  tent: { m: 'p_tentacle', name: 'щупальце Кракена', h: 9, hp: 150, sp: 0, dmg: 0, xp: 40, r: 2.2, elite: 1 },
  vzysk: { m: 'p_robot', name: 'Взыскатель-3000', h: 13, hp: 1000, sp: 0, dmg: 20, xp: 800, r: 5, ground: 1, boss: 1 },
  bdrone: { m: 'r_craft_racer', name: 'дрон-коллектор', h: 1.8, hp: 26, sp: 18, dmg: 8, xp: 9, r: 1.8, fly: 9, rot: Math.PI, tint: '#9ad0ff' },
  pet13: { m: 'm_pinkblob', name: 'марсианская зверушка', h: 1.7, hp: 999999, sp: 0, dmg: 0, xp: 0, r: 1.3, ground: 1, tint: '#ffc0e0' },
  gdino: { m: 'm_dino', name: 'Ящер-переросток', h: 8, hp: 900, sp: 0, dmg: 10, xp: 700, r: 4.5, ground: 1, boss: 1, tint: '#9ad06a' },
  som: { m: 'f_ArmoredCatfish', name: 'Сом-Батюшка', h: 9, hp: 900, sp: 0, dmg: 0, xp: 700, r: 5, fly: -0.5, boss: 1, tint: '#7a6a4a' },
  tsar: { m: 'f_GoblinShark', name: 'Царь-рыба Европы', h: 8, hp: 700, sp: 0, dmg: 18, xp: 600, r: 6, boss: 1, tint: '#bfe6ff' },
  rival: { m: 'r_craft_racer', name: 'Колян на гоночном байке', h: 2.2, hp: 9999, sp: 0, dmg: 0, xp: 0, r: 2, fly: 13, rot: Math.PI, elite: 1 },
  queen: { m: 'm_mushroomking', name: 'Королева гнезда', h: 6.5, hp: 420, sp: 4, dmg: 20, xp: 120, r: 4, ground: 1, boss: 1 },
  kolyan: { m: 'm_orc_skull', name: 'Бешеный Колян', h: 5.5, hp: 400, sp: 13, dmg: 16, xp: 200, r: 3.5, ground: 1, boss: 1 },
};
const EN = W.EN = []; const IM = {}; W.monGeo = (n) => MON && MON[n]; W.IM = IM;
/* ---------- свои чудовища на каждой планете (у каждой главы — свой набор, вид, цвет и вред) ---------- */
Object.assign(T, {
  sandsq: { m: 'm_squidle', name: 'песчаный кальмар', h: 2.2, hp: 9, sp: 9, dmg: 7, xp: 4, r: 1.5, fly: 5, tint: '#e8b878' },
  crmoth: { m: 'm_glub', name: 'кристальная моль', h: 1.5, hp: 5, sp: 12, dmg: 3, xp: 2, r: 1, fly: 3, tint: '#c08aff', fx: 'blind' },
  icehog: { m: 'm_greenspikyblob', name: 'ледяной ёж', h: 1.7, hp: 10, sp: 6, dmg: 6, xp: 3, r: 1.2, ground: 1, buried: 1, tint: '#bfe8ff', fx: 'freeze' },
  snowslug: { m: 'm_pinkblob', name: 'снежный слизень', h: 2, hp: 9, sp: 5, dmg: 5, xp: 3, r: 1.3, ground: 1, split: 'snowslug', tint: '#f4f8ff', fx: 'freeze' },
  meteor: { m: 'k_meteor_detailed', name: 'живой метеорит', h: 2.2, hp: 8, sp: 11, dmg: 14, xp: 3, r: 1.5, ground: 1, boom: 1, tint: '#c89a7a' },
  trooper: { m: 'k_astronautA', name: 'пират-десантник', h: 2.4, hp: 14, sp: 6, dmg: 5, xp: 5, r: 1.2, ground: 1, shoots: 1, tint: '#ff9a9a' , rot: Math.PI },
  magma: { m: 'm_pinkblob', name: 'лавовый слизень', h: 2, hp: 12, sp: 5, dmg: 8, xp: 4, r: 1.3, ground: 1, split: 'magma', tint: '#ff6a2a' },
  fdrag: { m: 'm_dragon', name: 'огненный дракончик', h: 2.6, hp: 30, sp: 10, dmg: 9, xp: 10, r: 1.6, fly: 6, elite: 1, shoots: 1, tint: '#ff5a3a' },
  saltbug: { m: 'm_armabee_evolved', name: 'соляной жук', h: 1.8, hp: 12, sp: 7, dmg: 7, xp: 4, r: 1.3, ground: 1, tint: '#f4f0e8' },
  mimic: { m: 'k_rock_crystals', name: 'камень-мимик', h: 2.2, hp: 16, sp: 7, dmg: 10, xp: 5, r: 1.5, ground: 1, buried: 1, tint: '#d8c8ff' },
  minedr: { m: 'r_craft_speederC', name: 'дрон-старатель', h: 1.4, hp: 10, sp: 15, dmg: 5, xp: 4, r: 1.5, fly: 4, rot: Math.PI, tint: '#ffd27a' },
  bolt9: { m: 'm_ghost', name: 'шаровая молния', h: 1.8, hp: 7, sp: 11, dmg: 6, xp: 4, r: 1.2, fly: 4, tint: '#fff27a', fx: 'zap' },
  sulf: { m: 'm_hywirl', name: 'серный вихрь', h: 3.4, hp: 40, sp: 6, dmg: 10, xp: 14, r: 2.4, ground: 1, elite: 1, tint: '#e8e05a', fx: 'fuel' },
  puffer: { m: 'f_Puffer', name: 'ледяной фугу', h: 1.6, hp: 8, sp: 8, dmg: 6, xp: 3, r: 1.2, fly: 1.5, tint: '#9ae8ff', fx: 'freeze' },
  krill: { m: 'f_Goldfish', name: 'светорачок', h: 1, hp: 2, sp: 14, dmg: 2, xp: 1, r: 0.8, fly: 1.2, tint: '#b8fff0' },
  perch: { m: 'f_RedSnapper', name: 'подлёдный окунь-кусака', h: 1.8, hp: 12, sp: 10, dmg: 7, xp: 4, r: 1.3, fly: 1.4, tint: '#6ab0ff' },
  mbub: { m: 'm_glub', name: 'метановый пузырь', h: 1.8, hp: 4, sp: 7, dmg: 16, xp: 3, r: 1.3, fly: 1.5, boom: 1, tint: '#ff9a3a' },
  tholin: { m: 'm_mushnub', name: 'толиновый гриб', h: 2, hp: 12, sp: 4, dmg: 6, xp: 4, r: 1.3, ground: 1, spore: 1, tint: '#a0603a' },
  selen: { m: 'k_alien', name: 'селенит', h: 2.2, hp: 12, sp: 8, dmg: 6, xp: 4, r: 1.2, ground: 1, tint: '#b8c8e8', fx: 'nerve' , rot: Math.PI },
  rego: { m: 'm_armabee', name: 'реголитовый жук', h: 1.4, hp: 5, sp: 9, dmg: 4, xp: 2, r: 1.1, ground: 1, buried: 1, tint: '#b8b8b8' },
  lrover: { m: 'r_craft_speederD', name: 'луноход-дикарь', h: 1.6, hp: 22, sp: 16, dmg: 8, xp: 7, r: 2, fly: 1, rot: Math.PI, tint: '#d8d8c8' },
  locust: { m: 'm_armabee', name: 'саранча-переросток', h: 1.1, hp: 2, sp: 14, dmg: 2, xp: 1, r: 0.9, ground: 1, tint: '#8ac84a' },
  varan: { m: 'm_dino', name: 'степной варан', h: 2.6, hp: 30, sp: 9, dmg: 9, xp: 9, r: 2, ground: 1, elite: 1, tint: '#d8b87a' },
  crow: { m: 'm_glub', name: 'ворона-хулиганка', h: 1.4, hp: 4, sp: 15, dmg: 1, xp: 2, r: 1, fly: 5, tint: '#2a2a30', fx: 'steal' },
  pike: { m: 'f_GoblinShark', name: 'щука-переросток', h: 2, hp: 14, sp: 12, dmg: 8, xp: 5, r: 1.6, fly: 0.6, tint: '#6a9a4a' },
  mosq: { m: 'm_squidle', name: 'комар-мутант', h: 1.3, hp: 3, sp: 13, dmg: 1, xp: 1, r: 0.9, fly: 3, tint: '#4a4a3a', fx: 'nerve' },
  somik: { m: 'f_ArmoredCatfish', name: 'сомёнок-кусака', h: 1.6, hp: 12, sp: 7, dmg: 7, xp: 4, r: 1.3, ground: 1, tint: '#8a7a5a' },
});
T.acidj.fx = 'fuel';
for (const [id, k] of [['catf', 3], ['som', 3], ['somik', 3], ['gshark', 2], ['tsar', 2], ['pike', 2], ['angler', 2.2], ['perch', 1.6]]) if (T[id]) T[id].bright = k;
// набор тварей по главам: [вид, вес]; элитные — реже
W.ROSTER = { 1: [['bug', 4], ['pink', 3], ['jumper', 2]], 2: [['bug2', 4], ['dino', 1], ['pirate', 2]], 3: [['mush', 4], ['ghost', 2], ['sandsq', 3]], 4: [['angler', 3], ['larva', 4], ['crmoth', 3]],
  5: [['yeti', 2], ['icehog', 4], ['snowslug', 3]], 6: [['meteor', 3], ['trooper', 3], ['fighter', 2]], 7: [['gole', 2], ['magma', 4], ['fdrag', 1]], 8: [['saltbug', 4], ['mimic', 3], ['minedr', 3]],
  9: [['acidj', 4], ['bolt9', 3], ['sulf', 1]], 10: [['puffer', 3], ['krill', 4], ['perch', 3]], 11: [['methw', 3], ['mbub', 4], ['tholin', 3]], 12: [['selen', 3], ['rego', 4], ['lrover', 2]],
  13: [['locust', 5], ['varan', 1], ['crow', 3]], 14: [['pike', 3], ['mosq', 4], ['somik', 3]] };
W.rosterPick = function (ch) { const L = (W.ROSTER[ch] || W.ROSTER[1]).filter(([id]) => IM[id] && !(ch === 5 && W.flags && W.flags.peace && id === 'yeti')); if (!L.length) return 'bug'; let s = 0; for (const q of L) s += q[1]; let r = Math.random() * s; for (const q of L) { r -= q[1]; if (r <= 0) return q[0]; } return L[0][0]; };
function monFx(t, e) { const s = W.st;
  if (t.fx === 'freeze') { W.monSlow = 0.55; W.monSlowT = 2.5; flash('#bfe8ff', 0.25); if (!W.fxT || W.t - W.fxT > 8) { W.fxT = W.t; floatText('❄ примёрзли!', R.x, R.y + 3.5, R.z, '#bfe8ff'); } }
  else if (t.fx === 'fuel') { s.fuel = Math.max(0, s.fuel - 4); floatText('−4% ⛽ кислота', R.x, R.y + 3.5, R.z, '#e8e05a'); }
  else if (t.fx === 'nerve') { if (W.nerve) W.nerve(-4); }
  else if (t.fx === 'blind') flash('#b07aff', 0.6);
  else if (t.fx === 'zap') { flash('#fff27a', 0.35); s.ammo = Math.max(0, s.ammo - 6); floatText('⚡ −6 🧂', R.x, R.y + 3.5, R.z, '#fff27a'); }
  else if (t.fx === 'steal') { const n = Math.min(s.money || 0, 10); if (n > 0) { s.money -= n; floatText('🐦‍⬛ −' + n + ' ₽', R.x, R.y + 3.5, R.z, '#ffd27a'); } e.flee = 5; } }
W.monFx = monFx;

function initMon() { if (MON) { W.addMon(); return Promise.resolve(); } return getPack('mars_mon').then((k) => { MON = Object.assign({}, k); W.addMon(); }); }

/* ---------- морды тварям: у кого нет глаз или вместо глаз щель — мультяшные глаза с бликом, брови, рот с зубами ----------
   Отдельная InstancedMesh на вид, те же матрицы, что у тела. Точку на «лице» ищем по вершинам модели. */
const FM = {}; W.FM = FM;
const FACES = {
  jumper: { fy: 0.6, fx: 0.16, r: 0.085, glow: '#ffe14a', brow: 1 }, icehog: { fy: 0.6, fx: 0.16, r: 0.085, glow: '#8af0ff', brow: 1 },
  meteor: { fy: 0.58, fx: 0.2, r: 0.12, brow: 1, mouth: 1 }, mimic: { fy: 0.62, fx: 0.11, r: 0.09, mouth: 1, brow: 1 },
  larva: { head: 1, r: 0.07 }, methw: { head: 1, r: 0.07, brow: 1 }, pink: { fy: 0.45, mouthOnly: 1, r: 0.1 }, snowslug: { fy: 0.45, mouthOnly: 1, r: 0.1 }, magma: { fy: 0.45, mouthOnly: 1, r: 0.1, angry: 1 }, pet13: { fy: 0.45, mouthOnly: 1, r: 0.1 } };
function faceGeo(id) { const t = T[id], F = FACES[id], g = MON && MON[t.m]; if (!F || !g) return null; g.computeBoundingBox(); const bb = g.boundingBox, P = g.attributes.position, h = bb.max.y - bb.min.y, w = bb.max.x - bb.min.x, B = new Builder(null), r = F.r * h;
  const surf = (x, y) => { let best = -1e9; for (let i = 0; i < P.count; i++) { const vx = P.getX(i), vy = P.getY(i); if (Math.abs(vx - x) < w * 0.1 && Math.abs(vy - y) < h * 0.1) best = Math.max(best, P.getZ(i)); } return best > -1e8 ? best : bb.max.z; };
  let cx = (bb.min.x + bb.max.x) / 2, cy = bb.min.y + (F.fy || 0.6) * h, ex = (F.fx || 0.15) * w, zL, zR;
  if (F.head) { let hi = 0; for (let i = 1; i < P.count; i++) if (P.getY(i) > P.getY(hi)) hi = i; cx = P.getX(hi); cy = P.getY(hi) - r * 0.6; ex = r * 1.2; zL = zR = P.getZ(hi) + r * 0.4; }
  else { zL = surf(cx - ex, cy); zR = surf(cx + ex, cy); }
  const em = { emit: true };
  if (!F.mouthOnly) for (const [s, z] of [[-1, zL], [1, zR]]) { const x = cx + s * ex, ez = z + r * 0.25;
    if (F.glow) { B.add(BALL2, mat(x, cy, ez, r * 1.05, r * 0.8, r * 0.5), F.glow, em); B.add(BALL2, mat(x, cy, ez + r * 0.35, r * 0.35, r * 0.6, r * 0.25), '#1a1008', em); B.add(BALL2, mat(x - r * 0.3, cy + r * 0.25, ez + r * 0.5, r * 0.18, r * 0.18, r * 0.1), '#ffffff', em); }
    else { B.add(BALL2, mat(x, cy, ez, r, r * 1.15, r * 0.6), '#fbfaf6', em); B.add(BALL2, mat(x + s * r * 0.1, cy - r * 0.1, ez + r * 0.4, r * 0.55, r * 0.65, r * 0.35), '#24160e', em); B.add(BALL2, mat(x - r * 0.2, cy + r * 0.25, ez + r * 0.7, r * 0.2, r * 0.2, r * 0.1), '#ffffff', em); }
    if (F.brow) B.add(BOX, mat(x, cy + r * 1.25, ez + r * 0.2, r * 1.5, r * 0.32, r * 0.3, 0, 0, s * 0.42), '#2a1a12', em); }
  if (F.mouth || F.mouthOnly) { const my = F.mouthOnly ? cy : cy - r * 1.8, mz = surf(cx, my) + r * 0.15, mw = F.mouthOnly ? r * 0.9 : r * 1.6;
    if (F.mouthOnly && !F.angry) { B.add(new THREE.TorusGeometry(mw, r * 0.16, 5, 12, Math.PI), mat(cx, my, mz, 1, 1, 1, 0, 0, Math.PI), '#5a1a22', em); B.add(BALL2, mat(cx - mw * 1.7, my + r * 0.2, mz - r * 0.1, r * 0.5, r * 0.32, r * 0.2), '#ff9ab0', em); B.add(BALL2, mat(cx + mw * 1.7, my + r * 0.2, mz - r * 0.1, r * 0.5, r * 0.32, r * 0.2), '#ff9ab0', em); }
    else { B.add(BALL2, mat(cx, my, mz, mw, r * 0.55, r * 0.3), '#3a0e12', em); for (let k = -2; k <= 2; k++) { const c = new THREE.ConeGeometry(r * 0.2, r * 0.42, 4); B.add(c, mat(cx + k * mw * 0.36, my + r * 0.3, mz + r * 0.22, 1, 1, 1, 0, 0, Math.PI), '#fffbea', em); } } }
  return B.build(); }
W.faceFor = (id) => { const g = faceGeo(id); return g ? new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true })) : null; };
// подключить к бою новые модели (паки догружаются по главам): только виды, у которых ещё нет InstancedMesh
W.addMon = function () { if (!MON) return; for (const n in MODELS) if (/^(r|s|k|f|n|o|p)_/.test(n)) MON[n] = MODELS[n];
  for (const [id, t] of Object.entries(T)) { if ((t.tint || t.bright) && !t.tintC) t.tintC = new THREE.Color(t.tint || '#ffffff').multiplyScalar(t.bright || 1); if (IM[id]) continue; const g = MON[t.m]; if (!g) continue; if (!g.attributes.normal) g.computeVertexNormals(); /* у самодельных моделей (дирижабль, баллоны, щупальца, робот) нет нормалей — были чёрными */ g.computeBoundingBox(); const bb = g.boundingBox, hgt = bb.max.y - bb.min.y; t.sc = t.h / hgt; t.y0 = -bb.min.y * t.sc;
    const im = new THREE.InstancedMesh(g, MAT, t.boss ? 3 : t.elite ? 6 : 60); im.count = 0; im.frustumCulled = false; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.count * 3 + 180 * 3), 3); im.userData.keep = true; W.scene.add(im); if (FACES[id]) { const fg = faceGeo(id); if (fg) { const fm = new THREE.InstancedMesh(fg, new THREE.MeshBasicMaterial({ vertexColors: true }), im.instanceMatrix.count); fm.count = 0; fm.frustumCulled = false; fm.userData.keep = true; W.scene.add(fm); FM[id] = fm; } } IM[id] = im; } };
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
const gems = []; const loot = []; W.loot = loot; W.gemList = gems; // помощники из магазина подбирают находки
function muzzle() { const b = W.barrel; b.updateMatrixWorld(); return new V3(0, 0.8, 0).applyMatrix4(b.matrixWorld); }
function aimDir(t) { const m = muzzle(); return new V3(t.x - m.x, (t.y + t.t.h * 0.5) - m.y, t.z - m.z).normalize(); }
function nearest(range, from) { const o = from || R; let b = null, bd = range * range; for (const e of EN) { if (e.dead || e.st === 'buried') continue; const d = dist2(e, o); if (d < bd) { bd = d; b = e; } } return b; }
function dmgMul() { return (W.shopDmg || 1) * (1 + PERK.salt.lv * 0.15) * (W.flags && W.flags.pip ? 1.1 : 1) * (1 + (W.dmgBonus || 0)); }
function crit() { return Math.random() < PERK.glasses.lv * 0.12 ? 2 : 1; }
W.hitEnemy = function (e, d, kx, kz) { if (e.dead) return; if (e.immune) { if (!W.immT || W.t - W.immT > 3) { W.immT = W.t; floatText(e.immMsg || '🛡 броня!', e.x, e.y + e.t.h, e.z, '#9fd8ff'); } return; } const c = crit(); d *= c * dmgMul() * (e.p === 'stun' ? 2 : 1); e.hp -= d; e.hit = 0.12; if (kx !== undefined && !e.t.boss) { e.vx += kx; e.vz += kz; }
  if (c > 1 || d >= 8) floatText((c > 1 ? '💥' : '') + Math.round(d), e.x, e.y + e.t.h + 0.5, e.z, c > 1 ? '#ffcf3a' : '#fff');
  if (e.hp <= 0) kill(e); };
function kill(e) { e.dead = true; const t = e.t; sfx(t.boss ? 'boom' : 'pot', { rnd: 0.3, vol: t.boss ? 1 : 0.5 }); burst(W.scene, e.x, e.y + t.h * 0.5, e.z, 'smoke', t.boss ? '#ffb04a' : '#c8a0ff', t.h * 1.2, 0.5); burst(W.scene, e.x, e.y + t.h * 0.5, e.z, 'spark', '#ffe08a', t.h, 0.3);
  const n = Math.max(1, Math.round(t.xp / 3)); for (let k = 0; k < n; k++) gems.push({ x: e.x + rnd(-1, 1), z: e.z + rnd(-1, 1), y: e.y + 0.6, v: t.xp / n });
  const r = Math.random(); if (r < 0.015 + PERK.gosha.lv * 0.015) loot.push(lootItem('⚙', e.x, e.z, 'parts', 1)); else if (r < 0.08 + PERK.thrift.lv * 0.06) loot.push(lootItem('🧂', e.x, e.z, 'ammo', 12)); else if (r < 0.14) loot.push(lootItem('⛽', e.x, e.z, 'fuel', 8)); else if (r < 0.13) loot.push(lootItem('🥟', e.x, e.z, 'food', 1));
  if (t.split && !e.small) for (let k = 0; k < 2; k++) { const s = W.spawn(t.split === 1 ? 'pink' : t.split, e.x + rnd(-1.5, 1.5), e.z + rnd(-1.5, 1.5), { hpK: 0.4, small: 1 }); if (s) s.scl = 0.6; }
  if (t.spore) { W.spore = 3.5; burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#b07aff', 6, 1.2); W.say && W.say('<b>Дед:</b> Таня, споры! Руль заело! Право — это лево!'); }
  W.st.kills = (W.st.kills || 0) + 1; if (W.onKill) W.onKill(e); }
function lootItem(e, x, z, res, n) { const sp = emojiSprite(e, 1.3); sp.position.set(x, W.H(x, z) + 1, z); W.scene.add(sp); return { sp, x, z, res, n, t: 0 }; }
W.dropLoot = (e, x, z, res, n) => loot.push(lootItem(e, x, z, res, n));
function fire(dt) { const st = W.st; if (W.noFire) return;
  for (const [id, w] of Object.entries(WEAP)) { if (!w.lv) continue; w.t = (w.t || 0) - dt; if (w.t > 0) continue; const L = w.lv - 1, cdm = 1 - PERK.hands.lv * 0.1;
    if (w.cost && st.ammo < w.cost) { if (!w.warn) { w.warn = 1; W.say && W.say('<b>Дед:</b> Таня, ' + w.name.toLowerCase() + ' — без патронов! Ищи ящики 🧂'); } continue; } w.warn = 0;
    const manual = !W.autoFire, lk = W.lock && !W.lock.dead && dist2(W.lock, R) < ((w.range || 20) * 1.4) ** 2 ? W.lock : null; let tgt = manual ? lk : W.focus && !W.focus.dead && dist2(W.focus, R) < (w.range || 20) ** 2 ? W.focus : nearest(w.range || 20);
    if (id === 'bayan') { if (!nearest(w.rad[L]) || (manual && !W.firing)) continue; w.t = w.cd[L] * cdm; sfx('turbo', { vol: 0.5, rate: 0.6 }); W.waveT = 0; W.waveR = w.rad[L]; for (const e of EN) if (!e.dead && dist2(e, R) < w.rad[L] ** 2) { const d = Math.hypot(e.x - R.x, e.z - R.z) || 1; W.hitEnemy(e, w.dmg[L], (e.x - R.x) / d * 9, (e.z - R.z) / d * 9); } continue; }
    if (!manual && !tgt) continue; if (manual && !W.firing) continue;
    const m = muzzle(); let dir;
    if (manual && tgt) dir = aimDir(tgt); else if (manual) { const yaw = R.h + W.aimYaw; dir = new V3(Math.sin(yaw) * Math.cos(W.aimPitch), Math.sin(W.aimPitch), Math.cos(yaw) * Math.cos(W.aimPitch)); }
    else { dir = aimDir(tgt); const ya = Math.atan2(dir.x, dir.z) - R.h; W.aimYaw += Math.atan2(Math.sin(ya - W.aimYaw), Math.cos(ya - W.aimYaw)) * 0.6; W.aimPitch = Math.asin(Math.max(-0.4, Math.min(0.5, dir.y))) * 0.6; }
    w.t = w.cd[L] * cdm; st.ammo = Math.max(0, st.ammo - w.cost * (manual ? 0.5 : 1)); // сам целишься — промахи бывают, соль тратится вдвое экономнее
    if (id === 'salt') { for (let k = 0; k < w.n[L]; k++) { const d2 = dir.clone(); d2.x += rnd(-0.12, 0.12); d2.y += rnd(-0.05, 0.08); d2.z += rnd(-0.12, 0.12); d2.normalize(); prj.push({ k: 'salt', p: m.clone(), v: d2.multiplyScalar(55), life: w.range / 55, dmg: w.dmg[L] }); } sfx('shot', { rnd: 0.2, vol: 0.55 }); burst(W.scene, m.x, m.y, m.z, 'muzzle', '#fff2c0', 1.6, 0.08); shake = Math.max(shake, 0.06); }
    if (id === 'jam') { const to = tgt || { x: m.x + dir.x * 22, z: m.z + dir.z * 22 }, dx = to.x - m.x, dz = to.z - m.z, d = Math.hypot(dx, dz), T0 = Math.max(0.5, d / 22); prj.push({ k: 'jam', p: m.clone(), v: new V3(dx / T0, 9, dz / T0), g: 18, life: 3, dmg: w.dmg[L], rad: w.rad[L] }); sfx('jar', { vol: 0.5 }); }
    if (id === 'slip') throwSlip(w.n[L], w.dmg[L], w.range, dir);
    if (id === 'cuc') { for (let k = 0; k < w.n[L]; k++) prj.push({ k: 'cuc', p: m.clone(), v: new V3(dir.x * 14 + rnd(-6, 6), 10, dir.z * 14 + rnd(-6, 6)), life: 4, dmg: w.dmg[L], tgt: manual ? tgt : nearest(w.range) , home: 1 }); sfx('turbo', { vol: 0.35, rate: 1.6 }); }
    if (id === 'samo') { for (const e of EN) { if (e.dead) continue; const dx = e.x - m.x, dz = e.z - m.z, d = Math.hypot(dx, dz); if (d > w.range) continue; if ((dx * dir.x + dz * dir.z) / (d || 1) > 0.8) W.hitEnemy(e, w.dmg[L]); } if (Math.random() < 0.7) burst(W.scene, m.x + dir.x * 4, m.y + dir.y * 4, m.z + dir.z * 4, 'smoke', '#ffd8a0', 3, 0.4); if (Math.random() < 0.2) sfx('turbo', { vol: 0.2, rate: 2 }); }
  } }
function throwSlip(n, dmg, range, dir) { const m = muzzle(); for (let k = 0; k < n; k++) { const t = nearest(range); const d = dir ? dir.clone() : t ? aimDir(t) : new V3(Math.sin(R.h), 0, Math.cos(R.h)); const a = Math.atan2(d.x, d.z) + (k - (n - 1) / 2) * 0.4; prj.push({ k: 'slip', p: m.clone(), v: new V3(Math.sin(a) * 26, 0, Math.cos(a) * 26), life: 1.6, t: 0, dmg, back: 1, hitset: new Set() }); } sfx('slap', { vol: 0.4 }); }
function stepPrj(dt) { const cnt = { salt: 0, jam: 0, slip: 0, cuc: 0, spit: 0, bolt: 0 };
  for (let i = prj.length - 1; i >= 0; i--) { const p = prj[i]; p.life -= dt; p.t = (p.t || 0) + dt;
    if (p.k === 'slip' && p.t > 0.65) { const m = muzzle(), dx = m.x - p.p.x, dz = m.z - p.p.z, d = Math.hypot(dx, dz) || 1; p.v.set(dx / d * 30, 0, dz / d * 30); if (d < 1.5) p.life = 0; }
    if (p.home) { if (!p.tgt || p.tgt.dead) p.tgt = nearest(40, p.p); if (p.tgt && p.t > 0.3) { const d = new V3(p.tgt.x - p.p.x, p.tgt.y + p.tgt.t.h * 0.5 - p.p.y, p.tgt.z - p.p.z).normalize().multiplyScalar(30); p.v.lerp(d, Math.min(1, dt * 4)); } else p.v.y -= 6 * dt; }
    if (p.g) p.v.y -= p.g * dt; p.p.addScaledVector(p.v, dt);
    const gy = W.H(p.p.x, p.p.z);
    if (p.k === 'spit' || p.k === 'bolt') { if (Math.hypot(p.p.x - R.x, p.p.z - R.z) < 2 && Math.abs(p.p.y - R.y - 1.5) < 2) { W.hurt(p.dmg, p.k === 'bolt' ? (p.src || 'пиратский бластер') : 'Плевок стража!'); p.life = 0; } }
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

W.enemyShoot = function (e, spd = 26, dmg = 8) { if (W.sleepT > 0 && !e.t.boss) return; const dx = R.x + Math.sin(R.h) * R.v * 0.5 - e.x, dz = R.z + Math.cos(R.h) * R.v * 0.5 - e.z, dy = R.y + 1.5 - (e.y + 1), d = Math.hypot(dx, dz, dy) || 1; prj.push({ k: 'bolt', p: new V3(e.x, e.y + 1, e.z), v: new V3(dx / d * spd, dy / d * spd, dz / d * spd), life: 3, dmg, src: e.srcName || e.t.name }); sfx('shot', { rate: 1.8, vol: 0.3 }); };
const reach0 = (e) => e.t.r * (e.scl || 1) + 1.7;
/* ---------- твари: повадки ---------- */

/* ---------- мягкие тени-пятна под тварями (одна InstancedMesh на всех) ---------- */
let SHD = null; W.shadowTex = function () { if (W._shT) return W._shT; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 1, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,0.72)'); g.addColorStop(0.5, 'rgba(0,0,0,0.42)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (W._shT = new THREE.CanvasTexture(c)); };
function shadowIM() { if (SHD && SHD.parent) return SHD; const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2); SHD = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: W.shadowTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), 160); SHD.count = 0; SHD.frustumCulled = false; SHD.renderOrder = 1; SHD.userData.keep = true; W.scene.add(SHD); return SHD; }
const P2 = new THREE.Vector3(), SC2 = new THREE.Vector3(), Q0 = new THREE.Quaternion(), M5 = new THREE.Matrix4();
function stepEnemies(dt) { const SH = shadowIM(); let nsh = 0; if (W.monSlowT > 0) { W.monSlowT -= dt; if (W.monSlowT <= 0) W.monSlow = 1; } const cnt = {}; for (const id in IM) cnt[id] = 0; const fwdx = Math.sin(R.h), fwdz = Math.cos(R.h);
  for (let i = EN.length - 1; i >= 0; i--) { const e = EN[i], t = e.t; e.age += dt; e.ph += dt * 6;
    if (e.dead) { e.dt = (e.dt || 0) + dt; if (e.dt > 0.25) { EN.splice(i, 1); continue; } }
    else {
      const dx = R.x - e.x, dz = R.z - e.z, d = Math.hypot(dx, dz) || 1; if (d > 230 && !t.boss && !e.keep) { EN.splice(i, 1); continue; }
      const slow = e.slow > 0 ? 0.45 : 1; e.slow = (e.slow || 0) - dt;
      if (W.sleepT > 0 && !t.boss) { e.vx *= 0.8; e.vz *= 0.8; if (Math.random() < 0.01) floatText('💤', e.x, e.y + t.h + 0.5, e.z, '#bfe8ff'); }
      else if (e.st === 'buried') { if (d < 16) { e.st = 'leap'; e.lt = 0; e.l0 = { x: e.x, z: e.z }; e.l1 = { x: R.x + fwdx * R.v * 0.6, z: R.z + fwdz * R.v * 0.6 }; sfx('jump', { vol: 0.6 }); burst(W.scene, e.x, e.y + 0.4, e.z, 'smoke', '#c88060', 3, 0.5); } }
      else if (e.st === 'leap') { e.lt += dt / 0.8; const k = Math.min(1, e.lt); e.x = e.l0.x + (e.l1.x - e.l0.x) * k; e.z = e.l0.z + (e.l1.z - e.l0.z) * k; e.jy = Math.sin(k * Math.PI) * 5; if (k >= 1) { e.st = 'go'; e.jy = 0; } }
      else if (e.flee > 0) { e.flee -= dt; e.vx = -dx / d * t.sp * 1.3; e.vz = -dz / d * t.sp * 1.3; }
      else if (e.ai) e.ai(e, dt, d, dx, dz);
      else if (t.still || t.mine) { e.vx = 0; e.vz = 0; if (t.m === 'r_turret_single') { e.st3 = (e.st3 || 2) - dt; e.h = Math.atan2(dx, dz); if (e.st3 <= 0 && d < 130) { e.st3 = 2.6; W.enemyShoot(e, 34, 9); } } }
      else { const sp = t.sp * slow * (e.age < 0.6 ? 0.3 : 1); let tx = dx / d, tz = dz / d;
        if (t.fly && d < 8) { tx += fwdx * 0.8; tz += fwdz * 0.8; } // летающие держатся над марсоходом
        e.vx += (tx * sp - e.vx) * Math.min(1, dt * 3); e.vz += (tz * sp - e.vz) * Math.min(1, dt * 3); if (d < 30 && R.v > 4) { e.vx += fwdx * R.v * 0.5 * dt; e.vz += fwdz * R.v * 0.5 * dt; } }
      e.x += e.vx * dt; e.z += e.vz * dt; if (!t.still) e.h = Math.atan2(e.vx, e.vz) || e.h;
      e.y = (W.Hs || W.H)(e.x, e.z) + (t.fly ? t.fly + Math.sin(e.ph * 0.5) * 0.6 : 0) + (e.jy || 0);
      if (t.fly === 5 && d < 3.2) e.y -= 2.5; // кальмар опускается и бьёт током
      if (t.boom && d < reach0(e) + 0.6) { W.hurt(t.dmg, t.name); kill(e); burst(W.scene, e.x, e.y + 1, e.z, 'smoke', t.tint || '#ff6a3a', 6, 0.7); shake = 0.45; sfx('boom', { vol: 0.7 }); continue; }
      if (t.mine && d < reach0(e)) { W.hurt(t.dmg, 'мина'); e.hp = 0; kill(e); burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#ff6a3a', 6, 0.7); shake = 0.5; sfx('boom'); continue; }
      // касание марсохода
      const reach = t.r * (e.scl || 1) + 1.7, spd = Math.abs(R.v);
      if (d < reach && spd > 7 && !t.boss && !t.elite && !t.fly && Math.abs(e.y - R.y) < 2.5 && (e.ram || 0) <= 0) { e.ram = 0.4; const fx = Math.sin(R.h), fz = Math.cos(R.h); if ((-dx * fx - dz * fz) / d > 0.3) { W.hitEnemy(e, spd * 0.9, fx * spd * 1.2 + (-dz / d) * 6, fz * spd * 1.2 + (dx / d) * 6); e.cd = 0.6; sfx('slap', { vol: 0.6, rnd: 0.3 }); burst(W.scene, e.x, e.y + 1, e.z, 'spark', '#ffd27a', 2, 0.25); if (!W.ramT || W.t - W.ramT > 6) { W.ramT = W.t; if (Math.random() < 0.4) W.say && W.say(pick(['<b>Баба Таня:</b> Посторонись, членистоногие!', '<b>Дед:</b> Таня, это таран! Как в 72-м на тракторе!', '<b>Баба Таня:</b> Пешеходам — дорогу. Жукам — нет!'])); } } }
      e.ram = (e.ram || 0) - dt;
      e.cd -= dt; if (d < reach && e.cd <= 0 && Math.abs(e.y - R.y) < 4.5 && !(W.sleepT > 0 && !t.boss) && !e.nohurt) { e.cd = t.boss ? 1.2 : 0.9; if (t.dmg) W.hurt(t.dmg, t.name); if (t.fx) monFx(t, e); if (t.nerve && (W.nT || 0) < W.t) { W.nT = W.t + 1.2; W.nerve(-t.nerve, 'Призрак шепчет: «Тань, а газ ты выключила?»'); } if (!t.boss) { e.vx -= dx / d * 10; e.vz -= dz / d * 10; } if (t.fly === 5) { W.flashCol = '#7fe8ff'; flash('#7fe8ff', 0.35); sfx('warn', { vol: 0.4 }); } }
      if (t.shoots && !(W.sleepT > 0)) { e.st2 = (e.st2 || rnd(1, 3)) - dt; if (e.st2 <= 0 && d < 40) { e.st2 = rnd(2.2, 3.5); const v = new V3(dx, 0, dz).normalize().multiplyScalar(18); v.y = 4; prj.push({ k: 'spit', p: new V3(e.x, e.y + 1.5, e.z), v, g: 4, life: 3, dmg: 8 }); sfx('jump', { vol: 0.3, rate: 0.7 }); } }
      if (t.elite && d < 14 && t.m === 'm_hywirl') { R.v *= 1 - dt * 0.6; R.h += dt * 0.7; if (Math.random() < 0.3) burst(W.scene, e.x, e.y + 2, e.z, 'smoke', '#c88060', 5, 0.8); } // вихрь крутит и тормозит
      e.hit = Math.max(0, e.hit - dt);
    }
    // рисуем
    const im = IM[e.type]; if (!im || cnt[e.type] >= 60 && !t.boss) continue; const s = t.sc * (e.scl || 1), sq = e.dead ? 1 + e.dt * 4 : 1, bob = t.ground ? Math.abs(Math.sin(e.ph * 1.6)) * 0.12 : 0;
    E.set(t.fly ? Math.sin(e.ph) * 0.1 : 0, e.h + (t.rot || 0), e.st === 'leap' ? -0.4 : 0, 'YXZ'); Q.setFromEuler(E); SC.set(s * sq * (1 + (t.ground ? Math.sin(e.ph * 3.2) * 0.05 : 0)), s * (e.dead ? Math.max(0.05, 1 - e.dt * 4) : 1 + (t.ground ? Math.sin(e.ph * 3.2 + 1.5) * 0.07 : Math.sin(e.ph * 2) * 0.05)), s * sq);
    if (e.st === 'buried') { SC.multiplyScalar(0.35); P.set(e.x, e.y - 0.5, e.z); } else P.set(e.x, e.y + t.y0 * (e.scl || 1) + bob, e.z);
    M4.compose(P, Q, SC); const k = cnt[e.type]++; im.setMatrixAt(k, M4); if (FM[e.type]) FM[e.type].setMatrixAt(k, M4); if (!e.dead && e.st !== 'buried' && nsh < 160 && !t.boss) { const gy = W.H(e.x, e.z), hg = Math.max(0, e.y - gy), ss = t.r * 2.4 * (e.scl || 1) * Math.max(0.35, 1 - hg / 22); P2.set(e.x, gy + 0.12, e.z); SC2.set(ss, 1, ss); M5.compose(P2, Q0, SC2); SH.setMatrixAt(nsh++, M5); } im.setColorAt(k, e.hit > 0 ? CH : e.slow > 0 ? CF : W.sleepT > 0 && !t.boss ? CS : t.tintC || CW); }
  SH.count = nsh; SH.instanceMatrix.needsUpdate = true; for (const id in FM) { FM[id].count = cnt[id] || 0; FM[id].instanceMatrix.needsUpdate = true; } for (const id in IM) { IM[id].count = cnt[id]; IM[id].instanceMatrix.needsUpdate = true; if (IM[id].instanceColor) IM[id].instanceColor.needsUpdate = true; } }

/* ---------- опыт, находки, магнит ---------- */
function stepGems(dt) { const st = W.st, mr = 5 * (1 + PERK.magnet.lv * 0.4) * (W.shopMag || 1); let n = 0;
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
function showCards() { W.paused = true; W.pendingLv--; const pool = cardPool(), ch = []; while (ch.length < 3 && pool.length) ch.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); { const up = pool.filter((c) => c.kind === 'w' && c.lv > 0); if (up.length && !ch.some((c) => c.kind === 'w' && c.lv > 0)) ch[ch.length - 1] = up[Math.floor(Math.random() * up.length)]; } /* в каждой тройке — улучшение своего оружия */
  let box = document.getElementById('rcards'); if (!box) { box = document.createElement('div'); box.id = 'rcards'; document.body.appendChild(box); const css = document.createElement('style'); css.textContent = `#rcards{position:fixed;inset:0;z-index:15;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:radial-gradient(ellipse at 50% 40%,rgba(60,20,50,.75),rgba(10,4,10,.92));padding:16px;color:#ffe8d0;font-family:system-ui}#rcards.on{display:flex}#rcards h2{margin:0;font-size:24px;color:#ffd27a;text-shadow:0 0 18px rgba(255,200,100,.6);animation:pop .4s both}#rcards .cs{display:grid;gap:10px;width:min(440px,100%)}
    #rcards button{display:grid;grid-template-columns:54px 1fr;gap:4px 12px;align-items:center;text-align:left;border-radius:16px;padding:12px 14px;border:2px solid rgba(255,210,140,.35);background:linear-gradient(135deg,rgba(80,40,60,.95),rgba(40,18,30,.95));color:#ffe8d0;font:600 13px/1.3 system-ui;cursor:pointer;animation:pop .35s cubic-bezier(.2,1.5,.4,1) both}#rcards button:nth-child(2){animation-delay:.08s}#rcards button:nth-child(3){animation-delay:.16s}
    #rcards button i{grid-row:span 2;font-style:normal;font-size:40px;text-align:center;filter:drop-shadow(0 0 10px rgba(255,220,140,.5))}#rcards button b{font-size:17px;color:#fff}#rcards button.new{border-color:#7fe8ff;box-shadow:0 0 22px rgba(127,232,255,.35)}#rcards button.new b:after{content:' НОВОЕ';font-size:11px;color:#7fe8ff;margin-left:6px}#rcards small{opacity:.7}`; document.head.appendChild(css); }
  box.innerHTML = `<h2>Уровень ${W.st.lvl}! Дед выбирает…</h2><div class="cs">${ch.map((c, k) => `<button data-k="${k}" class="${c.rare ? 'new' : ''}"><i>${c.e}</i><b>${c.name}${c.lv ? ' ' + '★'.repeat(c.lv) : ''}</b><span>${c.d}</span></button>`).join('')}</div><small>оружие стреляет по кнопке «ОГОНЬ» · выбери улучшение</small>`;
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
// ручной прицел: игрок наводит пальцем, «магнит» помогает поймать тварь рядом с перекрестьем
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function aimStep(dt) { const cr = document.getElementById('wdCross'), fb = document.getElementById('wdFire'); if (!cr) return; if (W.noFire) { cr.style.display = 'none'; fb.style.display = 'none'; W.firing = false; return; }
  let best = null, bs = 0.36; const yaw = R.h + W.aimYaw; for (const e of EN) { if (e.dead || e.st === 'buried') continue; const dx = e.x - R.x, dz = e.z - R.z, d = Math.hypot(dx, dz); if (d > 60 || d < 1) continue; const da = Math.abs(wrapA(Math.atan2(dx, dz) - yaw)) - (e === W.focus ? 0.08 : 0); if (da < bs) { bs = da; best = e; } }
  W.lock = W.autoFire ? null : best; if (!W.autoFire && W.st.ammo < 25 && !W.st.dead) { W.st.ammo += dt * 3; if (!W.saltTip && W.st.ammo < 5) { W.saltTip = 1; W.say && W.say('<b>Дед:</b> Таня, соль на донышке! Подсыпаю из запасов по щепотке. Ищи ящики 🧂'); } } /* соль не кончается насовсем: бой не застрянет */ const near = nearest(55), show = !W.autoFire && !W.paused && !W.st.dead && !!(near || W.boss); W.aimOn = show;
  if (!show) { cr.style.display = 'none'; fb.style.display = 'none'; W.firing = W.firing && W.aimId != null; return; } fb.style.display = 'block'; if (W.flags && !W.flags.aimTip) { W.flags.aimTip = 1; W.toast && W.toast('🎯 Твари рядом! Держи <b>ОГОНЬ</b>, веди пальцем справа — целься'); }
  if (best && W.firing) { const a = wrapA(Math.atan2(best.x - R.x, best.z - R.z) - R.h); W.aimYaw += wrapA(a - W.aimYaw) * Math.min(1, dt * 5); } // держит цель, пока жмёшь «огонь»
  else if (!W.firing && !(W.manual > 0) && W.view !== 2) W.aimYaw *= 1 - Math.min(1, dt * 1.2); // отпустил — турель смотрит вперёд
  if (W.view !== 2) W.aimYaw = Math.max(-1.7, Math.min(1.7, W.aimYaw));
  if (best) { const t = aimDir(best); W.aimPitch += (Math.asin(Math.max(-0.35, Math.min(0.6, t.y))) - W.aimPitch) * Math.min(1, dt * 6); P.set(best.x, best.y + best.t.h * 0.5, best.z); }
  else { const m = muzzle(), y2 = R.h + W.aimYaw; P.set(m.x + Math.sin(y2) * 26, m.y + Math.sin(W.aimPitch) * 26, m.z + Math.cos(y2) * 26); }
  P.project(camera); const on = P.z < 1, sx = Math.max(30, Math.min(innerWidth - 30, (P.x + 1) / 2 * innerWidth)), sy = Math.max(120, Math.min(innerHeight - 60, (1 - P.y) / 2 * innerHeight));
  cr.style.display = on && !W.noFire ? 'block' : 'none'; cr.style.left = sx + 'px'; cr.style.top = sy + 'px'; cr.classList.toggle('lock', !!best); fb.classList.toggle('on', !!W.firing); }
W.combat = function (dt) { if (W.manual > 0) W.manual -= dt; aimStep(dt); W.iframe = (W.iframe || 0) - dt; if (W.spore > 0) { W.spore -= dt; W.sxs = -1; } else W.sxs = 1;
  if (W.focus && (W.focus.dead || Math.hypot(W.focus.x - R.x, W.focus.z - R.z) > 40)) W.focus = null;
  fire(dt); stepPrj(dt); stepEnemies(dt); stepGems(dt); if (W.director) W.director(dt);
  if (W.pendingLv > 0 && !W.paused && !(document.getElementById('rcards') || {}).classList?.contains('on')) showCards(); };
W.initCombat = () => { initPrj(); return initMon(); };
W.resetCombat = function () { EN.length = 0; prj.length = 0; gems.length = 0; loot.forEach((l) => W.scene.remove(l.sp)); loot.length = 0; for (const w of Object.values(WEAP)) { w.lv = 0; w.t = 0; } for (const p of Object.values(PERK)) p.lv = 0; WEAP.salt.lv = 1; W.vmax = 17; };
};
