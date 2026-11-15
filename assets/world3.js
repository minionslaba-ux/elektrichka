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
/* ===== ГЛАВА 2 «Ржавый каньон» — Долины Маринер ===== */
const STEPS2 = [
  { id: 'descent', start() { titleCard('ГЛАВА 2', 'Ржавый каньон', 'Долины Маринер — самый большой каньон Солнечной системы: 4000 км в длину и до 7 км в глубину. Если положить его на Землю — от Москвы до Новосибирска. Где-то внизу пиратская баржа увозит огород бабы Тани.<br><br>Спускайся по серпантину. Осторожно: в каньоне пыльная река — в ней вязнут колёса.', 'Вниз!', () => {
      W.talk([['ded', 'Таня… это не каньон. Это дырка в планете. Я туда не поеду. Ладно, поеду. Держи руль крепче.'], ['gena', '<b>Марс-ФМ</b>: внимание, в Долинах Маринер замечены пираты на ховербайках! Бабушки, берегите пирожки и нервы.']], () => {
        setObj('Спустись в каньон по серпантину', byId('grave')); for (let k = 0; k < 3; k++) W.spawn('pirate', R.x + rnd(-60, 60), R.z + rnd(40, 80), { ai: pirateAI }); }); }); },
    arrive: 'grave', onArrive() { W.talk([['tanya', 'Сколько кораблей… Как будто тут парковались без разметки.'], ['ded', 'Таня, в трюмах может быть что полезное. Обыщи, а я покараулю. Кстати, вон кости. Большие. Надеюсь, бывшие.']], () => {
      const g = byId('grave'); W.crates = []; [[-30, -20], [28, 18], [-8, 34]].forEach(([ox, oz], k) => { const x = g.x + ox + 8, z = g.z + oz + 8; W.crates.push({ x, z, real: k === 1, done: false }); W.dropBox(x, z, k); });
      W.spawn('dino', g.x + 40, g.z - 30); for (let k = 0; k < 6; k++) W.spawn('bug2', g.x + rnd(-40, 40), g.z + rnd(-40, 40)); setObj('Обыщи 3 трюма разбитых кораблей', g); }); },
    tick() { if (W.crates && W.crates.every((c) => c.done)) { W.crates = null; W.give('parts', 4); W.give('ammo', 60);
      W.talk([['tanya', 'Нашла бортовой журнал баржи! «Груз: огород, бабкин, 1 шт. Курс — Ксар-Тала». Ах вы, ворюги!'], ['ded', 'Таня… а что это там крутится?..'], ['gena', 'Пылевой вихрь в Долинах Маринер! Высота — как три пятиэтажки. Бабушки, держите шляпы!']], () => {
        W.lift = 14; sfx('warn'); W.toast('🌪 СМЕРЧ ПОДНЯЛ МАРСОХОД!'); for (let k = 0; k < 10; k++) W.spawn('glub', R.x + rnd(-25, 25), R.z + rnd(-25, 25)); setObj('Отстреливайся в воздухе!', null);
        setTimeout(() => { W.say('<b>Баба Таня:</b> Ваня, открывай зонтик! Мягкая посадка!'); }, 13000); setTimeout(() => adv(), 16000); }); } } },
  { id: 'pip', start() { setObj('Сбитый корабль марсианина', byId('pip')); }, arrive: 'pip',
    onArrive() { W.talk([['pip', 'О, земляне! Благодарю за спасение. Я — Пип, марсианин. Да, я кактус. Нет, не надо меня поливать при всех.'], ['pip', 'Баржу вашу я видел: она прячется за ущельем «Глотка», у пиратской пристани. Возьмите меня с собой — я перевожу пиратскую ругань, они от этого смущаются.'], ['ded', 'Таня, у нас пассажир. Колючий.'],
      { who: 'pip', text: 'Я умею: переводить, колоться и петь марсианские песни на четыре голоса. Одновременно.', ch: [{ t: '🌵 Пип, садись!', sub: 'урон всего оружия +10%', fn() { W.flags.pip = 1; W.toast('🌵 Пип в экипаже: урон +10%'); } }] }], () => adv()); } },
  { id: 'gorge', start() { setObj('Проскочи ущелье «Глотка»', byId('gorge')); }, arrive: 'gorge',
    onArrive() { const tw = byId('tower'); W.snipers = []; for (let k = 0; k < 3; k++) { const e = W.spawn('sniper', tw.x - 20 + k * 20, tw.z + 8 + (k % 2) * 6, { keep: 1 }); if (e) W.snipers.push(e); } W.rockfall = 1;
      W.talk([['pip', 'Пираты на вышке наверху! Это снайперские турели. Ругаются они, кстати, очень некрасиво.'], ['ded', 'Таня, переключи меня на турель — 🎯! Я их сверху сниму. А ты — газуй через камнепад!']], () => setObj('Пройди ущелье (камнепад!) · турели сверху', { x: 350, z: W.CHzc(350) })); },
    tick() { const ex = 350; if (W.rockfall && R.x > ex) { W.rockfall = 0; W.give('money', 150 + (W.snipers || []).filter((e) => e.dead).length * 80); W.talk([['tanya', 'Проскочили! Ваня, ты жив?'], ['ded', 'Жив. Камень в кепку прилетел. Кепка — не выжила.'], ['pip', 'Впереди пристань. И баржа. Большая. Очень большая. Пип немного боится, но колется храбро.']], () => adv()); } } },
  { id: 'dock', start() { setObj('Пиратская пристань: баржа «ТрансГалактик»', byId('dock')); }, arrive: 'dock',
    onArrive() { const d = byId('dock'); W.lastSafe = { x: d.x - 120, z: d.z, r: 20 }; W.ckpt = JSON.parse(localStorage.getItem('bm_world') || 'null');
      W.talk([['kolyan', '<i>(по громкой связи)</i> Это баржа «ТрансГалактик», капитан Толян! Брат Коляна! Бабка, ты за огородом? Он теперь наш. Мы на нём кабачки растим!'], ['tanya', 'Кабачки — на моём огороде?! Ваня, заряжай!'], ['pip', 'Сначала двигатели — 2 штуки по бокам. Потом пушка. Потом корпус. Это я перевёл с пиратского.']], () => { bargeStart(d); setObj('Баржа: двигатели → пушка → корпус', null); sfx('j_boss'); }); },
    tick() { const b = W.boss; if (b) { const tg = b.parts.find((q) => !q.dead) || b; W.obj.x = tg.x; W.obj.z = tg.z; bossBar(tg, tg === b ? 'Баржа «ТрансГалактик»' : tg.cannon ? 'Пушка баржи' : 'Двигатель баржи');
      if (b.dead) { W.boss = null; bossBar(null); W.give('money', 900); W.give('parts', 8); chapterEnd(); } } } },
];
const CHAPTERS = { 1: null, 2: STEPS2 };
function pirateAI(e, dt, d, dx, dz) { e.a = (e.a === undefined ? Math.atan2(e.x - R.x, e.z - R.z) : e.a) + dt * 0.7 * (e.dir || (e.dir = Math.random() < 0.5 ? -1 : 1)); const rr = 15 + Math.sin(e.age) * 4, tx = R.x + Math.sin(e.a) * rr + Math.sin(R.h) * R.v * 0.6, tz = R.z + Math.cos(e.a) * rr + Math.cos(R.h) * R.v * 0.6;
  e.vx += ((tx - e.x) * 2 - e.vx) * dt * 2; e.vz += ((tz - e.z) * 2 - e.vz) * dt * 2; const sp = Math.hypot(e.vx, e.vz); if (sp > 26) { e.vx *= 26 / sp; e.vz *= 26 / sp; }
  e.sh = (e.sh === undefined ? rnd(1, 3) : e.sh) - dt; if (e.sh <= 0 && d < 45) { e.sh = rnd(2.2, 3.6); W.enemyShoot(e, 30, 6); }
  e.mn = (e.mn === undefined ? rnd(5, 9) : e.mn) - dt; if (e.mn <= 0) { e.mn = rnd(6, 10); W.spawn('mine', e.x, e.z); } if (Math.random() < 0.3) burst(W.scene, e.x, e.y, e.z, 'smoke', '#ffb080', 1.2, 0.3); }
function bargeStart(d) { const b = W.spawn('barge', d.x + 30, d.z, { keep: 1, ai: bargeAI, immune: true, immMsg: '🛡 броня! сначала двигатели и пушка' }); if (!b) return; W.boss = b; b.parts = [];
  [[-7, -10], [7, -10]].forEach(([ox, oz]) => { const p = W.spawn('bpart', b.x, b.z, { keep: 1, ai: partAI, ox, oz, host: b }); if (p) { p.hp = p.max = 140; b.parts.push(p); } });
  const c = W.spawn('bpart', b.x, b.z, { keep: 1, ai: partAI, ox: 0, oz: 8, host: b, cannon: 1, immune: true, immMsg: '🛡 щит! сначала двигатели' }); if (c) { c.hp = c.max = 150; b.parts.push(c); } b.hp = b.max = 420; }
function bargeAI(e, dt, d, dx, dz) { const eng = e.parts.filter((p) => !p.dead && !p.cannon).length, can = e.parts.find((p) => p.cannon); e.parts.forEach((p) => { if (p.dead && !p.dropped) { p.dropped = 1; W.dropLoot('🔧', p.x, p.z, 'hull', 45); W.dropLoot('🧂', p.x + 3, p.z, 'ammo', 30); } });
  if (!eng && can && can.immune) { can.immune = false; W.toast('💥 Двигатели сбиты! Бей пушку!'); W.say('<b>Капитан Толян:</b> Ты что творишь, бабка?! Это же кредитная баржа!'); }
  if (!eng && can && can.dead && e.immune) { e.immune = false; e.t = Object.assign({}, e.t, { fly: 3 }); W.toast('🔥 Пушка сбита! Добивай баржу!'); }
  const want = eng ? 42 : 26, a = Math.atan2(e.x - R.x, e.z - R.z) + dt * (eng ? 0.25 : 0.4), tx = R.x + Math.sin(a) * want, tz = R.z + Math.cos(a) * want; const sp = eng ? 1 : 0.6;
  e.vx += ((tx - e.x) * sp - e.vx) * dt; e.vz += ((tz - e.z) * sp - e.vz) * dt; e.h = Math.atan2(-dx, -dz);
  e.sp2 = (e.sp2 || 12) - dt; if (e.sp2 <= 0) { e.sp2 = eng ? 14 : 20; if (W.EN.filter((q) => !q.dead && q.type === 'pirate').length < 4) for (let k = 0; k < 2; k++) W.spawn('pirate', e.x + rnd(-6, 6), e.z + rnd(-6, 6), { ai: pirateAI }); W.say(pick(['<b>Капитан Толян:</b> Ребята, на выход! Бабка борзеет!', '<b>Пип:</b> Он сказал «бабка борзеет». Это комплимент на пиратском. Почти.'])); }
  e.mn2 = (e.mn2 || 5) - dt; if (e.mn2 <= 0) { e.mn2 = 4; W.spawn('mine', e.x, e.z); } if (!e.immune && Math.random() < 0.4) burst(W.scene, e.x + rnd(-5, 5), e.y + 4, e.z + rnd(-5, 5), 'smoke', '#5a4a4a', 6, 1); }
function partAI(e, dt) { const h = e.host; if (!h || h.dead) { e.hp = 0; e.dead = true; return; } const c = Math.cos(h.h), sn = Math.sin(h.h); e.x = h.x + e.ox * c + e.oz * sn; e.z = h.z - e.ox * sn + e.oz * c; e.vx = h.vx; e.vz = h.vz; e.h = h.h; if (e.t.fly !== (h.t.fly || 8) + 1) e.t = Object.assign({}, e.t, { fly: (h.t.fly || 8) + 1 });
  if (!e.cannon && Math.random() < 0.5) burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#7fe8ff', 2, 0.3);
  if (e.cannon) { const d2 = Math.hypot(R.x - e.x, R.z - e.z); e.cs = (e.cs || 2) - dt; if (e.cs <= 0 && d2 < 70) { e.cs = 2.6; W.enemyShoot(e, 30, 6); } } }

W.flags = {}; let stepI = 0; let STEPSC = STEPS; CHAPTERS[1] = STEPS;
function adv() { stepI++; save(); W.ckpt = JSON.parse(localStorage.getItem('bm_world') || 'null'); if (STEPSC[stepI]) STEPSC[stepI].start(); }
function curStep() { return STEPSC[stepI]; }
W.dropBox = function (x, z, k) { const sp = emojiSprite('📦', 1.8); sp.position.set(x, W.H(x, z) + 1.2, z); W.scene.add(sp); (W.boxes = W.boxes || []).push({ sp, x, z, k }); };

/* ---------- повадки особых тварей ---------- */
function droneAI(e, dt, d, dx, dz) { const c = byId('liner'), tx = c.x - e.x, tz = c.z - e.z, td = Math.hypot(tx, tz) || 1; const sp = d < 30 ? 9 : 4; e.vx += ((tx / td) * sp - e.vx) * dt * 2; e.vz += ((tz / td) * sp - e.vz) * dt * 2; if (td < 20) { e.x = byId('colony').x + 40; e.z = byId('colony').z - 40; W.say('<b>Соседка Валя:</b> Он вернулся домой… Ой, то есть он ничей!'); } }
function kolyanAI(e, dt, d, dx, dz) { e.p = e.p || 'circle'; e.pt = (e.pt || 0) - dt; const hpK = e.hp / e.max;
  if (e.p === 'circle') { const a = Math.atan2(e.x - R.x, e.z - R.z) + dt * 0.6, r = 26; const tx = R.x + Math.sin(a) * r, tz = R.z + Math.cos(a) * r; e.vx += ((tx - e.x) * 1.5 - e.vx) * dt * 2; e.vz += ((tz - e.z) * 1.5 - e.vz) * dt * 2; if (e.pt <= 0) { e.p = 'warn'; e.pt = 1.1; W.toast('⚠ Колян разгоняется!'); sfx('warn'); } }
  else if (e.p === 'warn') { e.vx *= 0.9; e.vz *= 0.9; if (e.pt <= 0) { e.p = 'ram'; e.pt = 1.3; const n = d || 1; e.rx = dx / n; e.rz = dz / n; sfx('turbo', { rate: 0.7 }); } }
  else if (e.p === 'ram') { const sp = hpK < 0.5 ? 34 : 28; e.vx = e.rx * sp; e.vz = e.rz * sp; if (Math.random() < 0.5) burst(W.scene, e.x, e.y + 1, e.z, 'smoke', '#c88060', 4, 0.5); if (e.pt <= 0) { e.p = 'stun'; e.pt = 2.2; e.vx = e.vz = 0; W.toast('💫 Колян оглушён — бей! Урон ×2'); sfx('thud'); if (hpK < 0.6) for (let k = 0; k < 3; k++) W.spawn('bug', e.x + rnd(-6, 6), e.z + rnd(-6, 6)); } }
  else if (e.p === 'stun') { e.vx *= 0.8; e.vz *= 0.8; if (Math.random() < 0.3) burst(W.scene, e.x, e.y + e.t.h + 0.5, e.z, 'spark', '#ffe08a', 1.5, 0.3); if (e.pt <= 0) { e.p = 'circle'; e.pt = hpK < 0.5 ? 2.5 : 4; } } }
function bossBar(b, title) { let el = document.getElementById('bossBar'); if (!b) { if (el) el.remove(); return; } if (!el) { el = document.createElement('div'); el.id = 'bossBar'; el.style.cssText = 'position:fixed;left:50%;top:calc(126px + env(safe-area-inset-top));transform:translateX(-50%);width:min(360px,86vw);z-index:7;font:800 13px system-ui;color:#fff;text-align:center;text-shadow:0 1px 3px #000'; el.innerHTML = '<div>☠ ' + b.t.name + '</div><div style="height:12px;border-radius:7px;background:rgba(0,0,0,.6);border:1px solid #ff6a4a;overflow:hidden"><i style="display:block;height:100%;background:linear-gradient(90deg,#ff3a2a,#ffb04a)"></i></div>'; document.body.appendChild(el); } el.querySelector('i').style.width = Math.max(0, b.hp / b.max * 100) + '%'; el.firstChild.textContent = '☠ ' + (title || b.t.name); }

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

const EVENTS2 = [
  { e: '🛰', name: 'Старый марсоход', lines: () => [{ who: 'ded', text: 'Таня, тут марсоход. Старый, с солнечными крыльями. Табличка: «Работал 15 лет вместо 90 дней. Отдыхает». Уважаемый ветеран.', ch: [{ t: '🔋 Взять солнечные крылья', sub: '+35% топлива', fn() { W.give('fuel', 35); } }, { t: '🎖 Отдать честь и оставить', sub: '+15 нервов, Пип поёт гимн марсоходов', fn() { W.nerve(15); } }] }] },
  { e: '🌪', name: 'Вихрь-пылесос', lines: () => [{ who: 'pip', text: 'Пылевой вихрь! У нас говорят: проедешь по краю — он почистит солнечные панели. Но может и унести…', ch: [{ t: '🌪 Проехать по краю', sub: '+40% топлива, −15 корпуса', fn() { W.give('fuel', 40); W.hurt(15, 'вихрь'); } }, { t: '🚗 Объехать', sub: 'безопасно', fn() {} }] }] },
  { e: '🏴‍☠️', name: 'Пираты в дюне', lines: () => [{ who: 'kolyan', text: '<i>(пират застрял в пыли)</i> Бабуль… выручи, а? Мы больше не будем. Ну, сегодня — не будем.', ch: [{ t: '🤝 Вытащить тросом', sub: '+120 ₽ «за беспокойство»', fn() { W.give('money', 120); } }, { t: '🧂 Забрать их патроны', sub: '+60 🧂, но их друзья обидятся', fn() { W.give('ammo', 60); for (let k = 0; k < 3; k++) W.spawn('pirate', R.x + rnd(-60, 60), R.z + rnd(-60, 60), { ai: pirateAI }); } }] }] },
  { e: '📻', name: 'Эхо каньона', lines: () => [{ who: 'gena', text: 'Это «Марс-ФМ»! Эфир… эфир… эфир… В Долинах Маринер наш сигнал отражается семь раз. Звоните в студию! Лучший звонок — приз!', ch: [{ t: '📞 Спеть деду частушку в эфир', sub: '+60 ₽ и +10 нервов', fn() { W.give('money', 60); W.nerve(10); } }, { t: '🔇 Выключить', sub: 'дед обиделся, но тихо', fn() {} }] }] },
  { e: '🦴', name: 'Кость древнего зверя', lines: () => [{ who: 'gosha', text: 'Мрр! (Гоша тащит кость размером с марсоход. Он явно рассчитывает на похвалу.)', ch: [{ t: '😺 Похвалить Гошу', sub: 'Гоша находит тайник: +3 ⚙', fn() { W.give('parts', 3); } }, { t: '💰 Продать в музей Ксар-Талы', sub: '+150 ₽ (Гоша в трауре)', fn() { W.give('money', 150); W.nerve(-5); } }] }] },
  { e: '🧊', name: 'Лёд в тени', lines: () => [{ who: 'pip', text: 'Здесь, в тени стены каньона, лежит лёд. Настоящая вода! Марсиане за неё дают хорошие деньги. Или чай.', ch: [{ t: '🧊 Набрать льда', sub: '+90 ₽', fn() { W.give('money', 90); } }, { t: '♨️ Вскипятить самовар', sub: '+30 корпуса — дед подлатал броню горячим', fn() { W.give('hull', 30); } }] }] },
];
function placeEvents() { (W.evs || []).forEach((q) => q.sp.parent && q.sp.parent.remove(q.sp)); W.evs = []; const LIST = W.ch === 2 ? EVENTS2 : EVENTS; for (let k = 0; k < 6; k++) { let x, z; do { x = rnd(-560, 560); z = rnd(-560, 560); } while (POI.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + 60) || W.evs.some((q) => Math.hypot(q.x - x, q.z - z) < 140)); if (W.ch === 2 && Math.random() < 0.6) { const xx = rnd(-480, 480); x = xx; z = W.CHzc ? W.CHzc(xx) + rnd(-50, 50) : z; } const ev = LIST[k % LIST.length], sp = emojiSprite('❔', 2.6, 'rgba(255,230,120,.95)'); sp.position.set(x, W.H(x, z) + 3, z); W.scene.add(sp); W.evs.push({ x, z, ev, sp, used: false }); } }

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
    const type = W.ch === 2 && !night && Math.random() < 0.35 ? pick(['pirate', 'pirate', 'bug2', 'dino']) : pick(pool); if (type === 'pirate') { for (let k = 0; k < 2; k++) W.spawn('pirate', cx + rnd(-8, 8), cz + rnd(-8, 8), { ai: pirateAI }); } else for (let k = 0; k < (type === 'squid' || type === 'ghost' ? Math.min(2, n) : n); k++) W.spawn(type, cx + rnd(-8, 8), cz + rnd(-8, 8));
    if (danger > 0.8 && Math.random() < 0.06) { W.spawn('whirl', cx, cz); W.toast('🌪 Пылевой вихрь!'); } }
  // волна миссии
  const w = W.mwave; if (w) { w.left -= dt; w.t = (w.t || 0) - dt; if (w.t <= 0) { w.t = w.every; for (let k = 0; k < w.n; k++) { const a = rnd(0, 6.28); W.spawn(pick(w.mix), w.at.x + Math.sin(a) * 45, w.at.z + Math.cos(a) * 45); } } $('wdObj').innerHTML = '🎯 Удержи теплицы: <b>' + Math.ceil(w.left) + ' с</b>'; }
  // метеоритный дождь
  meteorT -= dt; if (meteorT <= 0 && !W.inCity) { meteorT = rnd(90, 150); W.meteor = 14; W.toast('☄️ МЕТЕОРИТНЫЙ ДОЖДЬ!'); sfx('warn'); flash('#ff6a3a', 0.3); W.say('<b>Марс-ФМ:</b> метеоритный дождь! Красные круги на земле — туда прилетит. Остывшие метеориты — это металл!'); }
  if (W.meteor > 0) { W.meteor -= dt; if (Math.random() < dt * 2.2) { const x = R.x + Math.sin(R.h) * rnd(8, 40) + rnd(-16, 16), z = R.z + Math.cos(R.h) * rnd(8, 40) + rnd(-16, 16); const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 24), new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, W.H(x, z) + 0.2, z); W.scene.add(ring); MET.push({ x, z, t: 1.6, ring }); } }
  for (let i = MET.length - 1; i >= 0; i--) { const m = MET[i]; m.t -= dt; m.ring.scale.setScalar(0.6 + (1.6 - m.t) * 0.3); if (m.t <= 0) { W.scene.remove(m.ring); MET.splice(i, 1); burst(W.scene, m.x, W.H(m.x, m.z) + 1, m.z, 'smoke', '#ff8a4a', 6, 0.8); burst(W.scene, m.x, W.H(m.x, m.z) + 1, m.z, 'spark', '#ffd27a', 4, 0.5); sfx('boom', { vol: 0.5 });
      if (Math.hypot(R.x - m.x, R.z - m.z) < 3.2) W.hurt(m.rock ? 13 : 18, m.rock ? 'камнепад' : 'метеорит'); if (m.rock) continue; for (const e of W.EN) if (!e.dead && Math.hypot(e.x - m.x, e.z - m.z) < 3.5) W.hitEnemy(e, 30); if (Math.random() < 0.5) { const pr = Math.random() < 0.4; W.dropLoot('🌠', m.x, m.z, pr ? 'parts' : 'money', pr ? 1 : 30); } } }
  // логово в Лабиринте Ночи (необязательное)
  if (W.ch === 2 && !W.flags.noctis) { const nx = byId('noctis'); if (nx && Math.hypot(R.x - nx.x, R.z - nx.z) < nx.r) { W.flags.noctis = 1; save();
    W.talk([['pip', 'Лабиринт Ночи! Колодцы до самого дна каньона. Тут живут призраки марсианских шахтёров. Они безобидные. Почти.'], ['ded', 'Таня, призраки — это не по моей части. По моей — соль.']], () => {
      for (let k = 0; k < 6; k++) W.spawn('ghost', nx.x + rnd(-30, 30), nx.z + rnd(-30, 30)); W.spawn('dino', nx.x + 20, nx.z + 10, { hpK: 1.4 }); W.spawn('dino', nx.x - 20, nx.z - 10);
      W.dropLoot('💰', nx.x, nx.z, 'money', 350); W.dropLoot('⚙', nx.x + 4, nx.z, 'parts', 5); W.dropLoot('🥟', nx.x - 4, nx.z, 'food', 3); W.toast('🕳 Клад шахтёров на дне колодца — забери!'); }); } }
  // камнепад в ущелье «Глотка»
  if (W.ch === 2 && W.rockfall && Math.abs(R.x - 250) < 110 && Math.random() < dt * 2.4) { const x = R.x + Math.sin(R.h) * rnd(6, 30) + rnd(-5, 5), z = R.z + Math.cos(R.h) * rnd(6, 30) + rnd(-5, 5); const ring = new THREE.Mesh(new THREE.RingGeometry(2, 2.5, 20), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, W.H(x, z) + 0.2, z); W.scene.add(ring); MET.push({ x, z, t: 1.3, ring, rock: 1 }); }
  // события «❔», ящики лайнера
  for (const q of W.evs) { if (q.used) continue; q.sp.position.y = W.H(q.x, q.z) + 3 + Math.sin(W.t * 2) * 0.4; if (Math.hypot(R.x - q.x, R.z - q.z) < 7) { q.used = true; W.scene.remove(q.sp); R.v *= 0.2; sfx('open'); W.talk(q.ev.lines()); } }
  if (W.boxes) for (let i = W.boxes.length - 1; i >= 0; i--) { const b = W.boxes[i]; if (Math.hypot(R.x - b.x, R.z - b.z) < 5) { W.scene.remove(b.sp); W.boxes.splice(i, 1); const c = W.crates && W.crates[b.k]; if (c) { c.done = true; if (c.real) { W.toast(W.ch === 2 ? '📜 Бортовой журнал найден!' : '🔧 Насос найден!'); sfx('j_found'); } else { const r = pick(['ammo', 'money', 'food']); W.give(r, r === 'food' ? 1 : pick([20, 40])); } } } }
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
function chapterEnd() { sfx('j_win3'); confetti();
  if (W.ch === 1) { W.flags.ch1 = 1; save(); titleCard('ГЛАВА 1 ПРОЙДЕНА', 'Колян повержен!', 'Пираты разбежались, колония празднует. Но в лагере Коляна нашлась накладная: огород бабы Тани продан пиратам «ТрансГалактик», и баржа увозит его через Долины Маринер — в Ксар-Талу, город марсиан.', '▶ Глава 2: в каньон', () => goChapter(2)); return; }
  W.flags.ch2 = 1; save(); titleCard('ГЛАВА 2 ПРОЙДЕНА', 'Баржа рухнула!', 'Огород бабы Тани вылетел из трюма и… улетел дальше, на парашюте, прямо в Ксар-Талу. Пип говорит, у марсиан за такое — либо орден, либо тёща.<br><br>⭐ Глава 3 «Ксар-Тала, город марсиан» — скоро', 'Кататься по каньону', () => {}); }
function goChapter(n) { W.EN.forEach((e) => (e.dead = true)); W.boss = null; W.queen = null; W.mwave = null; bossBar(null); W.loadChapter(n); STEPSC = CHAPTERS[n]; stepI = 0; W.lastSafe = null; placeEvents(); save(); W.ckpt = JSON.parse(localStorage.getItem('bm_world') || 'null'); STEPSC[0].start(); }
W.onGameOver = function (why) { const s = st(); const stars = Math.floor((s.kills || 0) / 15) + stepI * 2; titleCard('ЭКСПЕДИЦИЯ ОКОНЧЕНА', why, `Уровень деда: ${s.lvl} · тварей повержено: ${s.kills || 0} · пройдено миссий: ${stepI}<br>Бабуля уехала отдохнуть к сестре. Вернётся к ужину — с новыми силами.`, '🔁 Снова в путь (с последней точки)', () => restart()); };
function restart() { const sv = W.ckpt || load(); W.resetCombat(); W.EN.forEach((e) => (e.dead = true)); W.st = Object.assign(fresh(), sv ? sv.st : {}); W.st.dead = false; W.st.hull = W.st.hullMax; W.st.nerves = Math.max(60, W.st.nerves); if (sv) { stepI = sv.step; Object.assign(W.flags, sv.flags); applyWeapons(sv.w, sv.p); }
  const c = W.lastSafe || POI[0]; R.x = c.x + 6; R.z = c.z + c.r * 0.6; R.v = 0; R.h = Math.PI; W.st.fuel = Math.max(40, W.st.fuel); W.paused = false; W.boss = null; W.queen = null; W.mwave = null; bossBar(null); STEPSC.forEach((s) => (s.arrived = 0)); if (STEPSC[stepI]) STEPSC[stepI].start(); }
const fresh = () => ({ hull: 120, hullMax: 120, nerves: 100, fuel: 100, food: 6, ammo: 160, parts: 0, money: 150, xp: 0, need: 8, lvl: 1, kills: 0 });
function save() { try { const w = {}, p = {}; for (const [k, v] of Object.entries(W.WEAP)) w[k] = v.lv; for (const [k, v] of Object.entries(W.PERK)) p[k] = v.lv; localStorage.setItem('bm_world', JSON.stringify({ ch: W.ch, step: stepI, flags: W.flags, st: Object.assign({}, W.st, { dead: false }), w, p, x: R.x, z: R.z })); } catch (e) {} }
function load() { try { return JSON.parse(localStorage.getItem('bm_world') || 'null'); } catch (e) { return null; } }
function applyWeapons(w, p) { for (const [k, v] of Object.entries(w || {})) if (W.WEAP[k]) W.WEAP[k].lv = v; for (const [k, v] of Object.entries(p || {})) if (W.PERK[k]) W.PERK[k].lv = v; }
W.save = save; setInterval(() => W.active && !W.st.dead && save(), 15000);

/* ---------- старт экспедиции ---------- */
W.onStart = function () { W.paused = true; addShopBtn();
  W.initCombat().then(() => { const sv = load(); if (!sv || !sv.ch || sv.ch === 1) placeEvents();
    if (sv && (sv.step > 0 || sv.ch > 1)) { W.resetCombat(); W.st = Object.assign(fresh(), sv.st); stepI = sv.step; Object.assign(W.flags, sv.flags); applyWeapons(sv.w, sv.p); STEPSC = CHAPTERS[sv.ch || 1]; if ((sv.ch || 1) !== W.ch) W.loadChapter(sv.ch); placeEvents(); R.x = sv.x; R.z = sv.z; R.y = W.H(R.x, R.z); W.paused = false; W.ckpt = sv; if (STEPSC[stepI]) STEPSC[stepI].start(); else chapterEnd(); return; }
    W.resetCombat(); W.st = fresh(); stepI = 0;
    titleCard('ГЛАВА 1', 'Пенсия на Марсе', 'Колония «Заречная». Билет до Земли стоит 30 000 ₽. В копилке — пусто. У бабы Тани есть марсоход «Буханка-М», у деда — ружьё с солью, у кота Гоши — своё мнение.<br><br>Левый палец — руль и газ. Дед стреляет сам. Тапни по твари — он ударит её первой.', 'Завести мотор', () => {
      W.talk([['tanya', 'Ваня, просыпайся. Едем зарабатывать на билет к внукам.'], ['ded', 'Таня, я не сплю, я целюсь. Ружьё заряжено, соль крупная.'], ['gosha', 'Мяу. (Гоша занял место штурмана. Карта у него под лапой.)']], () => STEPS[0].start()); }); }); };
};
