/* =====================================================================
   ОТКРЫТЫЙ МАРС — часть 3: сюжет главы 1, места, диалоги, магазины, события, погода, сохранение
   ===================================================================== */
window.WD_PART3 = function () {
'use strict';
const W = window.WD, R = W.rover, POI = W.POI, byId = (id) => POI.find((p) => p.id === id);
const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
W.part3 = true;

/* ---------- диалоги и выборы ---------- */
const css = document.createElement('style'); css.textContent = `
#rdlg{position:fixed;left:0;right:0;bottom:0;z-index:16;display:none;padding:14px 14px calc(16px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(10,4,10,0),rgba(10,4,10,.92) 22%);font-family:system-ui;color:#ffe8d0}#rdlg.on{display:block;animation:pop .3s both}
#rdlg .wrap{max-width:520px;margin:0 auto}#rdlg .who{display:flex;align-items:center;gap:10px;margin-bottom:6px}#rdlg .who i{font-style:normal;font-size:44px;filter:drop-shadow(0 0 10px rgba(255,200,120,.5))}#rdlg .who b{font-size:18px;color:#ffd27a}
#rdlg .txt{font-size:16px;line-height:1.4;min-height:44px;background:rgba(40,18,30,.85);border:1px solid rgba(255,210,140,.25);border-radius:14px;padding:12px 14px}
#rdlg .ch{display:grid;gap:8px;margin-top:10px}#rdlg .ch button{border:1px solid rgba(255,210,140,.35);background:linear-gradient(90deg,rgba(90,45,60,.95),rgba(50,22,36,.95));color:#fff;border-radius:12px;padding:12px;font:700 15px system-ui;text-align:left;cursor:pointer}#rdlg .ch button small{display:block;font-weight:500;color:#ffcf8a;font-size:12px;margin-top:2px}#rdlg .ch button:disabled{opacity:.4}
#rtitle{position:fixed;inset:0;z-index:17;display:none;align-items:center;justify-content:center;flex-direction:column;background:radial-gradient(ellipse at 50% 45%,rgba(60,20,40,.6),rgba(5,2,6,.95));color:#ffe8d0;font-family:system-ui;text-align:center;padding:20px}#rtitle.on{display:flex}#rtitle small{letter-spacing:.3em;color:#ff9a6a;font-weight:800}#rtitle h1{font-size:34px;margin:8px 0;color:#ffd27a;text-shadow:0 0 30px rgba(255,180,80,.6);animation:pop .6s both}#rtitle p{max-width:420px;opacity:.85;line-height:1.4}#rtitle button{margin-top:16px;border:0;border-radius:16px;padding:14px 26px;font:900 18px system-ui;background:linear-gradient(90deg,#ffd24a,#ff7a3a);color:#2a1406}
#rtoast{position:fixed;left:50%;top:calc(130px + env(safe-area-inset-top));transform:translateX(-50%);z-index:9;pointer-events:none;font-family:system-ui;text-align:center}#rtoast div{background:rgba(20,8,16,.8);border:1px solid rgba(255,210,140,.4);border-radius:14px;padding:8px 14px;color:#ffe0a0;font-weight:800;margin-bottom:6px;animation:pop .35s both}
#wdObj b{color:#fff}`; document.head.appendChild(css);
const dl = document.createElement('div'); dl.id = 'rdlg'; dl.innerHTML = '<div class="wrap"><div class="who"><i></i><b></b></div><div class="txt"></div><div class="ch"></div></div>'; document.body.appendChild(dl);
const tt = document.createElement('div'); tt.id = 'rtitle'; document.body.appendChild(tt);
const toastB = document.createElement('div'); toastB.id = 'rtoast'; document.body.appendChild(toastB);
const WHO = { tanya: ['👵', 'Баба Таня'], ded: ['👴', 'Дед Ваня'], gosha: ['🐱', 'Кот Гоша'], valya: ['🔭', 'Соседка Валя'], petr: ['🧔', 'Петрович'], lyokha: ['🧑‍🔧', 'Внук Лёха'], kolyan: ['🏴‍☠️', 'Бешеный Колян'], gena: ['📻', 'Гена, «Марс-ФМ»'], pip: ['🌵', 'Марсианин Пип'], robot: ['🤖', 'Робот-коллектор'], queen: ['🍄', 'Королева гнезда'], none: ['❔', ''] };
// очередь реплик: [[кто, текст], ...] или выбор {who, text, ch:[{t, sub, ok?, fn}]}
let dq = [], dcb = null;
W.talk = function (lines, cb) { dq = lines.slice(); dcb = cb || null; W.paused = true; next(); };
function next() { if (!dq.length) { dl.classList.remove('on'); W.paused = !!W.st.dead || (document.getElementById('rcards') && document.getElementById('rcards').classList.contains('on')); const c = dcb; dcb = null; if (c) c(); return; }
  const it = dq.shift(), isCh = !Array.isArray(it), who = WHO[isCh ? it.who : it[0]] || WHO.none, text = isCh ? it.text : it[1];
  dl.querySelector('.who i').textContent = who[0]; dl.querySelector('.who b').textContent = who[1]; dl.querySelector('.txt').innerHTML = text;
  const ch = dl.querySelector('.ch'); ch.innerHTML = '';
  if (isCh) it.ch.forEach((c) => { const b = document.createElement('button'); b.innerHTML = c.t + (c.sub ? `<small>${c.sub}</small>` : ''); if (c.ok && !c.ok()) b.disabled = true; b.onclick = (e) => { e.stopPropagation(); sfx('click'); const r = c.fn && c.fn(); if (r) { dq = r.concat(dq); } next(); }; ch.appendChild(b); });
  else { const b = document.createElement('button'); b.textContent = dq.length ? 'Дальше ▸' : 'Поехали ▸'; b.onclick = (e) => { e.stopPropagation(); sfx('click', { vol: 0.5 }); next(); }; ch.appendChild(b); }
  dl.classList.add('on'); }
W.say = (line) => radio(line);
W.toast = function (t) { const d = document.createElement('div'); d.innerHTML = t; toastB.appendChild(d); setTimeout(() => d.remove(), 2600); };
function titleCard(sm, h, p, btn, cb) { tt.innerHTML = `<small>${sm}</small><h1>${h}</h1><p>${p}</p><button>${btn}</button>`; tt.classList.add('on'); W.paused = true; sfx('j_start');
  tt.querySelector('button').onclick = (e) => { e.stopPropagation(); tt.classList.remove('on'); W.paused = false; sfx('click'); cb && cb(); }; }

/* ---------- цели (миссии главы 1) ---------- */
const st = () => W.st;
function setObj(text, at, extra) { W.obj = Object.assign({ text, at }, extra || {}); if (at && at.x !== undefined) { W.obj.x = at.x; W.obj.z = at.z; } $('wdObj').innerHTML = '🎯 ' + text; W.toast('Новая цель: <b>' + text + '</b>'); sfx('j_found', { vol: 0.6 }); save(); }
const STEPS = [
  { id: 'drone', start() { const c = byId('colony'); const e = W.spawn('glub', c.x + 25, c.z - 30, { hpK: 12, keep: 1, drone: 1, ai: droneAI }); W.droneE = e; if (e) e.scl = 1.7;
      setObj('Сбей дрон Вали — он уносит рассаду!', null); W.talk([['valya', 'Таня, это не я! Это мой дрон сам! Он у меня… <i>самостоятельный</i>.'], ['ded', 'Таня, газуй! Я его солью! Палец влево — руль, остальное — моё!']]); },
    tick() { const e = W.droneE; if (!e || e.dead) { W.give('food', 3); W.give('money', 60); W.talk([['tanya', 'Рассада спасена! Хоть один помидор доживёт до свадьбы внука.'], ['gena', '<b>Марс-ФМ</b> на связи! Слышу, в «Заречной» сбили дрон. Кстати, у теплиц колонии замечены жуки. Целые колонны!']], () => adv()); return; } W.obj.x = e.x; W.obj.z = e.z; } },
  { id: 'farm', start() { setObj('Теплицы колонии: отбей жуков', byId('farm')); },
    arrive: 'farm', onArrive() { W.talk([['ded', 'Вон они, Таня! С транспарантами! «Ботва — народу!»'], ['tanya', 'Держи круг у теплиц, Ваня. Ни одного огурца врагу!']], () => { W.mwave = { left: 50, at: byId('farm'), mix: ['bug', 'bug', 'pink', 'bug'], every: 2.4, n: 3 }; setObj('Удержи теплицы: <b>55 с</b>', byId('farm')); }); },
    tick() { const w = W.mwave; if (w && w.left <= 0) { W.mwave = null; W.give('food', 4); W.give('money', 120); W.give('ammo', 40); W.talk([['gena', 'Колония празднует! Теплицы целы. А у Петровича на заправке, говорят, топливо по старой цене… пока.'], ['ded', 'Таня, у нас бак как моя пенсия — почти пустой. Едем к Петровичу.']], () => adv()); } } },
  { id: 'station', start() { setObj('Доберись до заправки «У Петровича»', byId('station')); }, arrive: 'station',
    onArrive() { W.talk([['petr', 'О, Таня! Топлива — завались. Но насос сломан: деталь лежит в разбитом лайнере «Комсомолец-7». Там кальмары… летают.'],
      { who: 'petr', text: 'Принесёшь деталь — заправлю бесплатно. Или плати по-рыночному.', ch: [{ t: '⛽ Купить 30% за 60 ₽', sub: 'чтобы хватило до лайнера', ok: () => st().money >= 60, fn() { st().money -= 60; W.give('fuel', 30); } }, { t: '🤝 Договорились, привезём деталь', fn() { } }] }], () => adv()); } },
  { id: 'liner', start() { setObj('Лайнер «Комсомолец-7»: найди насос', byId('liner')); }, arrive: 'liner',
    onArrive() { const l = byId('liner'); W.crates = []; for (let k = 0; k < 4; k++) { const a = k * 1.6 + 0.4, x = l.x + Math.cos(a) * 28, z = l.z + Math.sin(a) * 28, real = k === 2;
        W.crates.push(W.obj3 = { x, z, real, done: false }); W.dropBox(x, z, k); }
      for (let k = 0; k < 4; k++) W.spawn('squid', l.x + rnd(-30, 30), l.z + rnd(-30, 30)); W.spawn('ghost', l.x, l.z + 20);
      W.talk([['gosha', 'Мрр. (Кот Гоша нюхает воздух и смотрит на ящики. В одном пахнет машинным маслом.)'], ['ded', 'Обыщи ящики, Таня. Я прикрою. Кальмары, ко мне!']], () => setObj('Обыщи ящики у лайнера (4)', l)); },
    tick() { if (W.crates && W.crates.every((c) => c.done)) { W.crates = null; W.give('parts', 3); W.talk([['tanya', 'Насос! И ещё… карта? «Логово Коляна. Не входить. Злая собака». Собаки нет, есть Колян.'], ['gena', 'Внимание, колонисты! Пираты Бешеного Коляна снова грабят караваны. Говорят, лагерь у них на северо-востоке. А в Ржавобурге ищут храбрых пенсионеров.'], ['ded', 'Сначала Ржавобург, Таня. Там внук Лёха механиком работает. Пусть броню нам сварит.']], () => adv()); } } },
  { id: 'rzhav', start() { setObj('Доберись до Ржавобурга', byId('rzhav')); }, arrive: 'rzhav',
    onArrive() { W.flags.workshop = 1; W.talk([['lyokha', 'Ба! Дед! На этом вы приехали?! Это не марсоход, это кастрюля на колёсах. Ладно, сварю что-нибудь.'], ['lyokha', 'Мастерская открыта — приносите детали ⚙. И ещё: гнездо клопов на юго-востоке мешает караванам. А Колян… Колян вас уже ищет.']], () => { openCity(byId('rzhav')); adv(); }); } },
  { id: 'boss', start() { setObj('Логово Бешеного Коляна', byId('camp')); W.flags.nestOpt = 1; W.toast('По желанию: <b>Гнездо клопов</b> — там сильное оружие'); }, arrive: 'camp',
    onArrive() { const c = byId('camp'); W.lastSafe = { x: c.x - 80, z: c.z - 80, r: 20 }; W.ckpt = JSON.parse(localStorage.getItem('bm_world') || 'null'); W.talk([['kolyan', 'Бабка?! На кастрюле?! Пацаны, это шутка? Где караван?!'], ['tanya', 'Караван — это я. А это — мой дед. И у него соль.'], ['kolyan', 'Ну всё, бабка. Сейчас прокачу. С ветерком!']], () => { const b = W.spawn('kolyan', c.x + 20, c.z + 20, { keep: 1, ai: kolyanAI }); W.boss = b; for (let k = 0; k < 6; k++) W.spawn('bug2', c.x + rnd(-30, 30), c.z + rnd(-30, 30)); setObj('Победи Бешеного Коляна', null); sfx('j_boss'); }); },
    tick() { const b = W.boss; if (b) { W.obj.x = b.x; W.obj.z = b.z; bossBar(b); if (b.dead) { W.boss = null; bossBar(null); W.give('money', 600); W.give('parts', 6); chapterEnd(); } } } },
];
W.flags = {}; let stepI = 0;
function adv() { stepI++; save(); W.ckpt = JSON.parse(localStorage.getItem('bm_world') || 'null'); if (STEPS[stepI]) STEPS[stepI].start(); }
function curStep() { return STEPS[stepI]; }
W.dropBox = function (x, z, k) { const sp = emojiSprite('📦', 1.8); sp.position.set(x, W.H(x, z) + 1.2, z); W.scene.add(sp); (W.boxes = W.boxes || []).push({ sp, x, z, k }); };

/* ---------- повадки особых тварей ---------- */
function droneAI(e, dt, d, dx, dz) { const c = byId('liner'), tx = c.x - e.x, tz = c.z - e.z, td = Math.hypot(tx, tz) || 1; const sp = d < 30 ? 9 : 4; e.vx += ((tx / td) * sp - e.vx) * dt * 2; e.vz += ((tz / td) * sp - e.vz) * dt * 2; if (td < 20) { e.x = byId('colony').x + 40; e.z = byId('colony').z - 40; W.say('<b>Соседка Валя:</b> Он вернулся домой… Ой, то есть он ничей!'); } }
function kolyanAI(e, dt, d, dx, dz) { e.p = e.p || 'circle'; e.pt = (e.pt || 0) - dt; const hpK = e.hp / e.max;
  if (e.p === 'circle') { const a = Math.atan2(e.x - R.x, e.z - R.z) + dt * 0.6, r = 26; const tx = R.x + Math.sin(a) * r, tz = R.z + Math.cos(a) * r; e.vx += ((tx - e.x) * 1.5 - e.vx) * dt * 2; e.vz += ((tz - e.z) * 1.5 - e.vz) * dt * 2; if (e.pt <= 0) { e.p = 'warn'; e.pt = 1.1; W.toast('⚠ Колян разгоняется!'); sfx('warn'); } }
  else if (e.p === 'warn') { e.vx *= 0.9; e.vz *= 0.9; if (e.pt <= 0) { e.p = 'ram'; e.pt = 1.3; const n = d || 1; e.rx = dx / n; e.rz = dz / n; sfx('turbo', { rate: 0.7 }); } }
  else if (e.p === 'ram') { const sp = hpK < 0.5 ? 34 : 28; e.vx = e.rx * sp; e.vz = e.rz * sp; if (Math.random() < 0.5) burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#c88060', 4, 0.5); if (e.pt <= 0) { e.p = 'stun'; e.pt = 2.2; e.vx = e.vz = 0; W.toast('💫 Колян оглушён — бей! Урон ×2'); sfx('thud'); if (hpK < 0.6) for (let k = 0; k < 3; k++) W.spawn('bug', e.x + rnd(-6, 6), e.z + rnd(-6, 6)); } }
  else if (e.p === 'stun') { e.vx *= 0.8; e.vz *= 0.8; if (Math.random() < 0.3) burst(W.scene, e.x, e.y + e.t.h + 0.5, e.z, 'spark', '#ffe08a', 1.5, 0.3); if (e.pt <= 0) { e.p = 'circle'; e.pt = hpK < 0.5 ? 2.5 : 4; } } }
function bossBar(b) { let el = document.getElementById('bossBar'); if (!b) { if (el) el.remove(); return; } if (!el) { el = document.createElement('div'); el.id = 'bossBar'; el.style.cssText = 'position:fixed;left:50%;top:calc(126px + env(safe-area-inset-top));transform:translateX(-50%);width:min(360px,86vw);z-index:7;font:800 13px system-ui;color:#fff;text-align:center;text-shadow:0 1px 3px #000'; el.innerHTML = '<div>☠ ' + b.t.name + '</div><div style="height:12px;border-radius:7px;background:rgba(0,0,0,.6);border:1px solid #ff6a4a;overflow:hidden"><i style="display:block;height:100%;background:linear-gradient(90deg,#ff3a2a,#ffb04a)"></i></div>'; document.body.appendChild(el); } el.querySelector('i').style.width = Math.max(0, b.hp / b.max * 100) + '%'; }

/* ---------- город: рынок и мастерская ---------- */
function openCity(p) { const s = st(); const items = [
    { t: '⛽ Топливо +25%', sub: '40 ₽', ok: () => s.money >= 40 && s.fuel < 100, fn() { s.money -= 40; W.give('fuel', 25); return reopen(); } },
    { t: '🥟 Пирожки +2', sub: '30 ₽', ok: () => s.money >= 30, fn() { s.money -= 30; W.give('food', 2); return reopen(); } },
    { t: '🧂 Соль +40', sub: '35 ₽', ok: () => s.money >= 35, fn() { s.money -= 35; W.give('ammo', 40); return reopen(); } },
    { t: '🛠 Ремонт +40', sub: '1 ⚙ или 50 ₽', ok: () => s.hull < s.hullMax && (s.parts >= 1 || s.money >= 50), fn() { if (s.parts >= 1) s.parts--; else s.money -= 50; W.give('hull', 40); return reopen(); } }];
  if (W.flags.workshop) items.push({ t: '🔧 Мастерская Лёхи', sub: 'броня, слоты, бак', fn() { return [workshop()]; } });
  items.push({ t: '🚗 Ехать дальше', fn() { } });
  function reopen() { return [{ who: p.id === 'rzhav' ? 'lyokha' : 'tanya', text: 'Что ещё? ⛽ ' + Math.round(s.fuel) + '% · 🥟 ' + s.food + ' · 🧂 ' + s.ammo + ' · ⚙ ' + s.parts + ' · ₽ ' + s.money, ch: items }]; }
  W.talk([{ who: p.id === 'rzhav' ? 'lyokha' : 'tanya', text: p.name + '. ' + (p.id === 'colony' ? 'Дома. Рынок колонии открыт.' : 'Рынок и мастерская. Тут всё из старых кораблей.') + '<br>₽ ' + s.money + ' · ⚙ ' + s.parts, ch: items }]); }
function workshop() { const s = st(); return { who: 'lyokha', text: 'Мастерская. Детали ⚙: ' + s.parts, ch: [
  { t: '🛡 Броня из кастрюль +30 корпуса (' + (W.flags.armor || 0) + '/5)', sub: (3 + (W.flags.armor || 0) * 2) + ' ⚙', ok: () => (W.flags.armor || 0) < 5 && s.parts >= 3 + (W.flags.armor || 0) * 2, fn() { s.parts -= 3 + (W.flags.armor || 0) * 2; W.flags.armor = (W.flags.armor || 0) + 1; s.hullMax += 30; s.hull += 30; return [workshop()]; } },
  { t: '🔫 Ещё одна турель (+1 оружие)', sub: '5 ⚙', ok: () => s.parts >= 5 && W.slots < 6, fn() { s.parts -= 5; W.slots++; return [workshop()]; } },
  { t: '🛢 Бак побольше (расход −20%)', sub: '4 ⚙', ok: () => s.parts >= 4 && !W.flags.tank, fn() { s.parts -= 4; W.flags.tank = 1; return [workshop()]; } },
  { t: '🃏 Дед тренируется (новая карточка)', sub: (2 + (W.flags.train || 0)) + ' ⚙', ok: () => s.parts >= 2 + (W.flags.train || 0), fn() { s.parts -= 2 + (W.flags.train || 0); W.flags.train = (W.flags.train || 0) + 1; W.pendingLv = (W.pendingLv || 0) + 1; setTimeout(() => W.showCards(), 300); } },
  { t: '◂ Назад', fn() { } }] }; }

function addShopBtn() { if ($('wdShop')) return; const b = document.createElement('button'); b.id = 'wdShop'; b.textContent = '🏪'; b.style.display = 'none'; $('wdBtns').prepend(b); b.onclick = (e) => { e.stopPropagation(); const p = W.shopAt; if (!p) return; sfx('open'); R.v = 0;
  if (p.id === 'station') W.talk([{ who: 'petr', text: 'Насос работает! Заправлю, сколько влезет, по-соседски.', ch: [{ t: '⛽ Полный бак', sub: 'бесплатно, спасибо за насос', fn() { W.give('fuel', 100); } }, { t: '◂ Не надо', fn() {} }] }]); else openCity(p); }; }
/* ---------- случайные события на карте ---------- */
const EVENTS = [
  { e: '🧳', name: 'Марсианин-автостопщик', lines: () => [{ who: 'pip', text: 'Земляне! Подвезите до Ржавобурга. Заплачу кристаллом. Или песней. Кристалл лучше, поверьте.', ch: [{ t: '🚗 Подвезти', sub: '+80 ₽, он поёт всю дорогу (−5 нервов)', fn() { W.give('money', 80); W.nerve(-5); } }, { t: '🎵 Пусть споёт тут', sub: '+10 нервов: песня оказалась хорошей', fn() { W.nerve(10); } }] }] },
  { e: '☄️', name: 'Метеорит с клеймом', lines: () => [{ who: 'ded', text: 'Таня, тут метеорит. На нём написано «Сделано на Фобосе. ОТК пройден».', ch: [{ t: '⚙ Разобрать на детали', sub: '+3 ⚙', fn() { W.give('parts', 3); } }, { t: '💰 Продать туристам', sub: '+120 ₽', fn() { W.give('money', 120); } }] }] },
  { e: '🤖', name: 'Сломанный робот-коллектор', lines: () => [{ who: 'robot', text: 'Гражданка… Ваш долг за кислород… *бзз*… Батарейка… села… Помогите… и я… забуду… ваш… долг…', ch: [{ t: '🔋 Отдать деталь', sub: '−1 ⚙, долг прощён: +150 ₽ «возврат переплаты»', ok: () => st().parts >= 1, fn() { st().parts--; W.give('money', 150); } }, { t: '🧂 Посолить и уехать', sub: '+2 ⚙ с робота', fn() { W.give('parts', 2); W.nerve(-3); } }] }] },
  { e: '🧺', name: 'Пикник медведей', lines: () => [{ who: 'ded', text: 'Таня… это медведи. С полюса. У них пикник. Они машут… банкой.', ch: [{ t: '🫙 Обменять варенье на рыбу', sub: '−1 🥟, +3 🥟 (рыба)', ok: () => st().food >= 1, fn() { st().food -= 1; W.give('food', 3); } }, { t: '👋 Помахать и проехать', sub: '+5 нервов', fn() { W.nerve(5); } }] }] },
  { e: '📡', name: 'Антенна Вали', lines: () => [{ who: 'valya', text: 'Таня! Это моя антенна! Я тут… смотрю погоду. На твоём огороде.', ch: [{ t: '🔧 Переключить на «Марс-ФМ»', sub: 'Гена благодарит: +100 ₽', fn() { W.give('money', 100); } }, { t: '🧂 Сбить солью', sub: '+2 ⚙, Валя обиделась', fn() { W.give('parts', 2); } }] }] },
  { e: '⛽', name: 'Брошенная канистра', lines: () => [{ who: 'gosha', text: 'Мяу? (Гоша сидит на канистре и смотрит так, будто это он её нашёл.)', ch: [{ t: '⛽ Залить в бак', sub: '+30% топлива', fn() { W.give('fuel', 30); } }, { t: '🐟 Дать Гоше рыбку', sub: '−1 🥟, Гоша находит тайник: +4 ⚙', ok: () => st().food >= 1, fn() { st().food--; W.give('parts', 4); } }] }] },
];
function placeEvents() { W.evs = []; for (let k = 0; k < 6; k++) { let x, z; do { x = rnd(-560, 560); z = rnd(-560, 560); } while (POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + 60) || W.evs.some((q) => Math.hypot(q.x - x, q.z - z) < 140)); const ev = EVENTS[k % EVENTS.length], sp = emojiSprite('❔', 2.6, 'rgba(255,230,120,.95)'); sp.position.set(x, W.H(x, z) + 3, z); W.scene.add(sp); W.evs.push({ x, z, ev, sp, used: false }); } }

/* ---------- режиссёр: тварей больше вдали и ночью, волны миссий, метеориты, день и ночь ---------- */
let spawnT = 2, meteorT = 70, foodT = 70, dayT = 0, lastX = 0, lastZ = 0;
const MET = [];
W.director = function (dt) { const s = st(); if (s.dead) return;
  // день и ночь (6 минут сутки)
  dayT += dt; const day = (Math.sin(dayT / 360 * Math.PI * 2) + 1) / 2, night = day < 0.25; W.night = night;
  W.scene.fog.color.setRGB(0.6 * (0.25 + day * 0.75), 0.35 * (0.25 + day * 0.75), 0.3 * (0.3 + day * 0.7)); W.scene.background = W.scene.fog.color; skyG.traverse((o) => { if (o.material && o.material.color && o.material.vertexColors) o.material.color.setScalar(0.25 + day * 0.75); });
  if (night !== W.wasNight) { W.wasNight = night; if (night) W.say('<b>Марс-ФМ:</b> над «Заречной» ночь. Две луны, звёзды — и призраки на дорогах. Едьте с фарами, бабушки!'); }
  // топливо по пройденному пути, еда по времени
  const moved = Math.hypot(R.x - lastX, R.z - lastZ); lastX = R.x; lastZ = R.z; if (moved < 20) s.fuel = Math.max(0, s.fuel - moved * 0.05 * (W.flags.tank ? 0.8 : 1)); W.fuelOut = s.fuel <= 0;
  if (W.fuelOut && !W.fuelWarn) { W.fuelWarn = 1; W.say('<b>Дед:</b> Таня, бензин всё! Ползём на парах. До заправки или канистры!'); } if (!W.fuelOut) W.fuelWarn = 0;
  foodT -= dt; if (foodT <= 0) { foodT = 70; if (s.food > 0) { s.food--; W.nerve(4); W.toast('🥟 Обед в пути: бабуля и дед поели'); } else { W.nerve(-15, '<b>Баба Таня:</b> Ваня, у меня от голода нервы шалят! Где пирожки?!'); } }
  // окружающие твари
  const danger = Math.min(1.6, Math.hypot(R.x, R.z) / 450) + (night ? 0.5 : 0) + 0; spawnT -= dt;
  const alive = W.EN.filter((e) => !e.dead).length; if (spawnT <= 0 && alive < (W.mwave || W.boss || W.queen ? 6 : 22 + danger * 10) && !W.inCity) { spawnT = Math.max(0.6, 3.2 - danger * 1.4); const n = 2 + Math.floor(Math.random() * (3 + danger * 4));
    const a = R.h + rnd(-1.2, 1.2) + (Math.random() < 0.25 ? Math.PI : 0), r = rnd(55, 85), cx = R.x + Math.sin(a) * r, cz = R.z + Math.cos(a) * r;
    const pool = night ? ['ghost', 'glub', 'bug', 'squid'] : danger > 1 ? ['bug2', 'jumper', 'squid', 'pink', 'mush', 'bug'] : ['bug', 'bug', 'jumper', 'pink', 'glub'];
    const type = pick(pool); for (let k = 0; k < (type === 'squid' || type === 'ghost' ? Math.min(2, n) : n); k++) W.spawn(type, cx + rnd(-8, 8), cz + rnd(-8, 8));
    if (danger > 0.8 && Math.random() < 0.06) { W.spawn('whirl', cx, cz); W.toast('🌪 Пылевой вихрь!'); } }
  // волна миссии
  const w = W.mwave; if (w) { w.left -= dt; w.t = (w.t || 0) - dt; if (w.t <= 0) { w.t = w.every; for (let k = 0; k < w.n; k++) { const a = rnd(0, 6.28); W.spawn(pick(w.mix), w.at.x + Math.sin(a) * 45, w.at.z + Math.cos(a) * 45); } } $('wdObj').innerHTML = '🎯 Удержи теплицы: <b>' + Math.ceil(w.left) + ' с</b>'; }
  // метеоритный дождь
  meteorT -= dt; if (meteorT <= 0 && !W.inCity) { meteorT = rnd(90, 150); W.meteor = 14; W.toast('☄️ МЕТЕОРИТНЫЙ ДОЖДЬ!'); sfx('warn'); flash('#ff6a3a', 0.3); W.say('<b>Марс-ФМ:</b> метеоритный дождь! Красные круги на земле — туда прилетит. Остывшие метеориты — это металл!'); }
  if (W.meteor > 0) { W.meteor -= dt; if (Math.random() < dt * 2.2) { const x = R.x + Math.sin(R.h) * rnd(8, 40) + rnd(-16, 16), z = R.z + Math.cos(R.h) * rnd(8, 40) + rnd(-16, 16); const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 24), new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, W.H(x, z) + 0.2, z); W.scene.add(ring); MET.push({ x, z, t: 1.6, ring }); } }
  for (let i = MET.length - 1; i >= 0; i--) { const m = MET[i]; m.t -= dt; m.ring.scale.setScalar(0.6 + (1.6 - m.t) * 0.3); if (m.t <= 0) { W.scene.remove(m.ring); MET.splice(i, 1); burst(W.scene, m.x, W.H(m.x, m.z) + 1, m.z, 'smoke', '#ff8a4a', 6, 0.8); burst(W.scene, m.x, W.H(m.x, m.z) + 1, m.z, 'spark', '#ffd27a', 4, 0.5); sfx('boom', { vol: 0.5 });
      if (Math.hypot(R.x - m.x, R.z - m.z) < 3.2) W.hurt(18, 'метеорит'); for (const e of W.EN) if (!e.dead && Math.hypot(e.x - m.x, e.z - m.z) < 3.5) W.hitEnemy(e, 30); if (Math.random() < 0.5) { const pr = Math.random() < 0.4; W.dropLoot('🌠', m.x, m.z, pr ? 'parts' : 'money', pr ? 1 : 30); } } }
  // события «❔», ящики лайнера
  for (const q of W.evs) { if (q.used) continue; q.sp.position.y = W.H(q.x, q.z) + 3 + Math.sin(W.t * 2) * 0.4; if (Math.hypot(R.x - q.x, R.z - q.z) < 7) { q.used = true; W.scene.remove(q.sp); R.v *= 0.2; sfx('open'); W.talk(q.ev.lines()); } }
  if (W.boxes) for (let i = W.boxes.length - 1; i >= 0; i--) { const b = W.boxes[i]; if (Math.hypot(R.x - b.x, R.z - b.z) < 5) { W.scene.remove(b.sp); W.boxes.splice(i, 1); const c = W.crates && W.crates[b.k]; if (c) { c.done = true; if (c.real) { W.toast('🔧 Насос найден!'); sfx('j_found'); } else { W.give(pick(['ammo', 'money', 'food']), pick([20, 40, 1])); } } } }
  // приезд в места
  const cur = curStep(); W.inCity = false; W.shopAt = null;
  for (const p of POI) { const d = Math.hypot(R.x - p.x, R.z - p.z); if (d < p.r * 0.75) { if (p.kind === 'city' || p.kind === 'fuel' || p.kind === 'farm') W.lastSafe = p; if (p.kind === 'city') W.inCity = true; if (!p.seen) { p.seen = 1; W.toast(p.e + ' ' + p.name); }
      if (cur && cur.arrive === p.id && !cur.arrived) { cur.arrived = 1; R.v *= 0.3; cur.onArrive(); }
      else if (p.id === 'nest' && W.flags.nestOpt && !W.flags.nestDone && !W.queen) { W.queen = W.spawn('queen', p.x, p.z, { keep: 1 }); for (let k = 0; k < 10; k++) W.spawn('bug2', p.x + rnd(-25, 25), p.z + rnd(-25, 25)); W.talk([['queen', 'Кто посмел наступить на мой огород… то есть гнездо?!'], ['ded', 'Таня, это гриб. Огромный злой гриб. Держи руль!']]); sfx('j_boss'); }
      if (p.kind === 'city' || (p.id === 'station' && stepI > 3)) W.shopAt = p; }
  }
  { const b = $('wdShop'); const show = !!W.shopAt && !W.paused; b.style.display = show ? '' : 'none'; if (show) b.textContent = W.shopAt.id === 'station' ? '⛽' : '🏪'; }
  if (W.queen) { bossBar(W.queen); if (W.queen.dead) { W.queen = null; W.flags.nestDone = 1; bossBar(null); W.give('parts', 5); W.pendingLv = (W.pendingLv || 0) + 2; W.showCards(); W.say('<b>Гена:</b> Гнездо клопов пало! Караваны снова ездят. Ура пенсионерам!'); } }
  if (cur && cur.tick) cur.tick(dt);
};

/* ---------- конец главы, конец экспедиции ---------- */
function chapterEnd() { sfx('j_win3'); confetti(); titleCard('ГЛАВА 1 ПРОЙДЕНА', 'Колян повержен!', 'Пираты разбежались, караваны вернулись, колония празднует. А в лагере Коляна нашлась карта… в Ксар-Талу, город марсиан. Туда утащили ваш огород!<br><br>⭐ Глава 2 «Ржавый каньон» — скоро', 'Кататься дальше', () => {}); W.flags.ch1 = 1; save(); }
W.onGameOver = function (why) { const s = st(); const stars = Math.floor((s.kills || 0) / 15) + stepI * 2; titleCard('ЭКСПЕДИЦИЯ ОКОНЧЕНА', why, `Уровень деда: ${s.lvl} · тварей повержено: ${s.kills || 0} · пройдено миссий: ${stepI}<br>Бабуля уехала отдохнуть к сестре. Вернётся к ужину — с новыми силами.`, '🔁 Снова в путь (с последней точки)', () => restart()); };
function restart() { const sv = W.ckpt || load(); W.resetCombat(); W.EN.forEach((e) => (e.dead = true)); W.st = Object.assign(fresh(), sv ? sv.st : {}); W.st.dead = false; W.st.hull = W.st.hullMax; W.st.nerves = Math.max(60, W.st.nerves); if (sv) { stepI = sv.step; Object.assign(W.flags, sv.flags); applyWeapons(sv.w, sv.p); }
  const c = W.lastSafe || byId('colony'); R.x = c.x + 6; R.z = c.z + c.r * 0.6; R.v = 0; R.h = Math.PI; W.st.fuel = Math.max(40, W.st.fuel); W.paused = false; W.boss = null; W.queen = null; W.mwave = null; bossBar(null); STEPS.forEach((s) => (s.arrived = 0)); if (STEPS[stepI]) STEPS[stepI].start(); }
const fresh = () => ({ hull: 120, hullMax: 120, nerves: 100, fuel: 100, food: 6, ammo: 160, parts: 0, money: 150, xp: 0, need: 8, lvl: 1, kills: 0 });
function save() { try { const w = {}, p = {}; for (const [k, v] of Object.entries(W.WEAP)) w[k] = v.lv; for (const [k, v] of Object.entries(W.PERK)) p[k] = v.lv; localStorage.setItem('bm_world', JSON.stringify({ step: stepI, flags: W.flags, st: Object.assign({}, W.st, { dead: false }), w, p, x: R.x, z: R.z })); } catch (e) {} }
function load() { try { return JSON.parse(localStorage.getItem('bm_world') || 'null'); } catch (e) { return null; } }
function applyWeapons(w, p) { for (const [k, v] of Object.entries(w || {})) if (W.WEAP[k]) W.WEAP[k].lv = v; for (const [k, v] of Object.entries(p || {})) if (W.PERK[k]) W.PERK[k].lv = v; }
W.save = save; setInterval(() => W.active && !W.st.dead && save(), 15000);

/* ---------- старт экспедиции ---------- */
W.onStart = function () { W.paused = true; addShopBtn();
  W.initCombat().then(() => { if (!W.evs) placeEvents(); const sv = load();
    if (sv && sv.step > 0) { W.resetCombat(); W.st = Object.assign(fresh(), sv.st); stepI = sv.step; Object.assign(W.flags, sv.flags); applyWeapons(sv.w, sv.p); R.x = sv.x; R.z = sv.z; R.y = W.H(R.x, R.z); W.paused = false; if (STEPS[stepI]) STEPS[stepI].start(); else chapterEnd(); return; }
    W.resetCombat(); W.st = fresh(); stepI = 0;
    titleCard('ГЛАВА 1', 'Пенсия на Марсе', 'Колония «Заречная». Билет до Земли стоит 30 000 ₽. В копилке — пусто. У бабы Тани есть марсоход «Буханка-М», у деда — ружьё с солью, у кота Гоши — своё мнение.<br><br>Левый палец — руль и газ. Дед стреляет сам. Тапни по твари — он ударит её первой.', 'Завести мотор', () => {
      W.talk([['tanya', 'Ваня, просыпайся. Едем зарабатывать на билет к внукам.'], ['ded', 'Таня, я не сплю, я целюсь. Ружьё заряжено, соль крупная.'], ['gosha', 'Мяу. (Гоша занял место штурмана. Карта у него под лапой.)']], () => STEPS[0].start()); }); }); };
};
