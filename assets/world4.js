/* =====================================================================
   ОТКРЫТЫЙ МАРС — часть 4: движки разнообразных миссий (скилл «Разнообразные миссии»)
   мини-игра поверх мира, стелс с конусами обзора; переделка глав по docs/missii-plan-*.md
   ===================================================================== */
window.WD_PART4 = function () {
'use strict';
const W = window.WD, R = W.rover, A = W.A, byId = (id) => W.POI.find((p) => p.id === id);
const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
const clear4 = W.clear4 = W.clear4 || [];
W.part4 = true;

/* ---------- мини-игра поверх мира (мир на паузе) ---------- */
const css = document.createElement('style'); css.textContent = `
#m4{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(8,10,20,.55);font-family:inherit}
#m4.on{display:flex}
#m4 .box{width:min(94vw,520px);max-height:94vh;overflow:auto;background:#1b2033;border:2px solid #ffd27a;border-radius:16px;padding:12px 14px;color:#fff;box-shadow:0 8px 30px #0008}
#m4 h3{margin:0 0 4px;font-size:18px;color:#ffd27a}
#m4 .rules{font-size:13px;opacity:.85;margin-bottom:8px;line-height:1.35}
#m4 .say{min-height:20px;font-size:14px;margin:6px 0;color:#bfe9ff}
#m4 .st{font-size:13px;opacity:.9}
#m4 .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}
#m4 .row button{flex:1 1 30%;min-width:90px;min-height:52px;font:inherit;font-size:15px;border-radius:12px;border:0;background:#2e3a5c;color:#fff;cursor:pointer}
#m4 .row button:active{transform:scale(.97)}
#m4 .card{margin:6px auto;padding:10px;border-radius:14px;background:#26304d;text-align:center;font-size:15px;line-height:1.5;position:relative}
#m4 .card .big{font-size:46px;line-height:1.1}
#m4 .bar{height:6px;background:#0006;border-radius:3px;overflow:hidden;margin-top:6px}#m4 .bar i{display:block;height:100%;background:#ffd27a}
#m4 .x{float:right;background:none;border:0;color:#fff;font-size:13px;opacity:.7;cursor:pointer}
@media (max-height:480px){#m4 .card .big{font-size:32px}#m4 .row button{min-height:42px}}
`; document.head.appendChild(css);
const ov = document.createElement('div'); ov.id = 'm4'; ov.innerHTML = '<div class="box"><button class="x">✖ бросить</button><h3></h3><div class="rules"></div><div class="body"></div><div class="say"></div></div>'; document.body.appendChild(ov);
const q = (s) => ov.querySelector(s);
let cur = null, raf = 0, last = 0;
function loop(t) { if (!cur) return; const dt = Math.min(0.1, (t - (last || t)) / 1000); last = t; if (cur.tick) cur.tick(dt); raf = requestAnimationFrame(loop); }
W.mini = function (o) { W.mini.close(); cur = o; W.paused = true; W.busy4 = 1; q('h3').textContent = o.title; q('.rules').innerHTML = o.rules || ''; q('.say').textContent = ''; q('.body').innerHTML = '';
  ov.classList.add('on'); o.say = (t) => (q('.say').innerHTML = t); o.body = q('.body');
  o.win = (msg) => { if (cur !== o) return; W.mini.close(); sfx('j_win1'); o.onWin && o.onWin(msg); };
  o.fail = (msg) => { if (cur !== o) return; W.mini.close(); sfx('dry'); o.onFail && o.onFail(msg); };
  q('.x').onclick = (e) => { e.stopPropagation(); o.fail('бросила'); };
  o.build(o); last = 0; raf = requestAnimationFrame(loop); return o; };
W.mini.close = function () { cancelAnimationFrame(raf); if (cur) { cur = null; ov.classList.remove('on'); W.busy4 = 0; W.paused = false; } };
W.mini.cur = () => cur;
clear4.push(() => W.mini.close());
const btns = (o, list, cb) => { const r = document.createElement('div'); r.className = 'row'; list.forEach((t, i) => { const b = document.createElement('button'); b.innerHTML = t; b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); cb(i, b); }; r.appendChild(b); }); o.body.appendChild(r); return r; };

/* ---------- сортировка на ленте (гл.14: праздник арбуза) ---------- */
function sortGame(cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) {
    o.n = 0; o.err = 0; o.card = document.createElement('div'); o.card.className = 'card'; o.body.appendChild(o.card);
    o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.nextItem = () => { if (o.n >= cfg.total) return o.win(); o.it = cfg.make(o.n); o.t = 0; o.T = Math.max(cfg.tMin, cfg.t0 - o.n * cfg.dt); o.card.innerHTML = o.it.html + '<div class="bar"><i></i></div>'; o.bar = o.card.querySelector('i'); o.st.textContent = cfg.label + ': ' + o.n + ' из ' + cfg.total + ' · ошибок ' + o.err + ' из ' + cfg.maxErr; };
    o.answer = (k) => { if (!o.it) return; const ok = k === o.it.ans; o.it = null; if (ok) { sfx('coin'); o.say(pick(cfg.okSay)); } else { o.err++; sfx('caught'); o.say('❌ ' + cfg.why()); }
      if (o.err > cfg.maxErr) return setTimeout(() => o.fail(), 700); o.n++; setTimeout(() => cur === o && o.nextItem(), ok ? 350 : 900); };
    btns(o, cfg.bins, (i) => o.answer(i)); o.nextItem(); },
    tick(dt) { if (!this.it) return; this.t += dt; this.bar.style.width = Math.max(0, 100 - this.t / this.T * 100) + '%'; if (this.t > this.T) { this.say('⏰ Не успела — арбуз укатился'); this.it.ans = -1; this.answer(-2); } } });
}

/* ---------- викторина: ошибка — добавляется новый вопрос ---------- */
W.quiz4 = function (cfg, onWin, onFail) { const pool = cfg.q.slice().sort(() => Math.random() - 0.5);
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.ok = 0; o.err = 0; o.card = document.createElement('div'); o.card.className = 'card'; o.body.appendChild(o.card); o.rowW = document.createElement('div'); o.body.appendChild(o.rowW); o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.next = () => { if (o.ok >= cfg.need) return o.win(); if (!pool.length || o.err > cfg.maxErr) return o.fail(); o.cq = pool.shift(); o.card.innerHTML = '<div style="font-size:16px">' + o.cq[0] + '</div>'; o.rowW.innerHTML = ''; const ord = o.cq[1].map((t, i) => [t, i]).sort(() => Math.random() - 0.5);
      const r = document.createElement('div'); r.className = 'row'; ord.forEach(([t, i]) => { const b = document.createElement('button'); b.textContent = t; b.dataset.k = i; b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); o.answer(i, b); }; r.appendChild(b); }); o.rowW.appendChild(r); o.lock = false;
      o.st.textContent = 'Верно: ' + o.ok + ' из ' + cfg.need + ' · ошибок ' + o.err + ' из ' + cfg.maxErr; };
    o.answer = (i, b) => { if (o.lock || !o.cq) return; o.lock = true; const ok = i === o.cq[2]; o.rowW.querySelectorAll('button').forEach((x) => { if (+x.dataset.k === o.cq[2]) x.style.background = '#2f7a4a'; else if (x === b) x.style.background = '#8a2f2f'; });
      if (ok) { o.ok++; sfx('coin'); o.say(pick(cfg.okSay)); } else { o.err++; sfx('caught'); o.say('❌ ' + (o.cq[3] || 'Неверно') + ' — ещё вопрос сверху'); } setTimeout(() => cur === o && o.next(), ok ? 900 : 2200); };
    o.next(); } }); };

/* ---------- «повтори код»: робот показывает, ты повторяешь; быстрее с каждым раундом ---------- */
W.simon4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.err = 0; o.lv = 0; o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.row = btns(o, cfg.keys, (i, b) => o.tap(i)); o.row.style.display = 'grid'; o.row.style.gridTemplateColumns = 'repeat(3,1fr)'; o.bs = [...o.row.children];
    o.lit = (k, ms) => { const b = o.bs[k]; if (!b) return; b.style.background = '#ffd27a'; b.style.color = '#222'; sfx('click'); setTimeout(() => { b.style.background = ''; b.style.color = ''; }, ms); };
    o.round = () => { if (o.lv >= cfg.rounds) return o.win(); o.seq = Array.from({ length: cfg.len0 + o.lv }, () => Math.floor(Math.random() * cfg.keys.length)); o.pi = 0; o.show = true; const step = Math.max(cfg.minMs, cfg.ms - o.lv * cfg.dms);
      o.say(cfg.who + ' диктует… смотри!'); o.st.textContent = 'Раунд ' + (o.lv + 1) + ' из ' + cfg.rounds + ' · ошибок ' + o.err + ' из ' + cfg.maxErr;
      o.seq.forEach((k, i) => setTimeout(() => cur === o && o.lit(k, step * 0.7), 700 + i * step)); setTimeout(() => { if (cur === o) { o.show = false; o.say('Твоя очередь!'); } }, 800 + o.seq.length * step); };
    o.tap = (i) => { if (o.show) return; o.lit(i, 160); if (i === o.seq[o.pi] && cfg.gust && o.pi > 0 && Math.random() < cfg.gust) { o.show = true; sfx('dry'); o.say('💨 Порыв ветра! Заплатку сорвало — этот шар заново'); setTimeout(() => cur === o && o.round(), 1300); return; } if (i === o.seq[o.pi]) { o.pi++; if (o.pi >= o.seq.length) { sfx('coin'); o.lv++; o.show = true; setTimeout(() => cur === o && o.round(), 800); } }
      else { o.err++; sfx('caught'); o.show = true; if (o.err >= cfg.maxErr) { o.say('🚨 ' + cfg.alarm); setTimeout(() => o.fail(), 1200); return; } o.say('❌ Не тот! ' + cfg.who + ' повторяет'); setTimeout(() => cur === o && o.round(), 1200); } };
    o.round(); } }); };

/* ---------- фотоохота: поймать цель в кадр (по ходу «Буханки»), стоять, нажать 📷 ---------- */
const pb = document.createElement('button'); pb.id = 'ph4'; pb.textContent = '📷 Снимок'; pb.style.cssText = 'position:fixed;right:18px;bottom:150px;z-index:40;display:none;min-width:110px;min-height:64px;border-radius:32px;border:3px solid #fff;background:#3a6aff;color:#fff;font:inherit;font-size:17px;box-shadow:0 4px 14px #0007';
document.body.appendChild(pb); const fr = document.createElement('div'); fr.style.cssText = 'position:fixed;left:30%;right:30%;top:22%;bottom:38%;border:3px dashed #fff8;border-radius:12px;z-index:30;pointer-events:none;display:none'; document.body.appendChild(fr);
W.photo4 = function (o) { W.photoEnd4(); const P = W.ph4 = Object.assign({ t: o.time, got: 0, lost: 0 }, o); P.tg.forEach((q) => { q.sp = emojiSprite(q.e, 2.4); q.sp.position.set(q.x, W.H(q.x, q.z) + (q.y || 1.6), q.z); W.scene.add(q.sp); q.done = q.gone = false; }); W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); return P; };
W.photoEnd4 = function () { const P = W.ph4; pb.style.display = fr.style.display = 'none'; if (!P) return; P.tg.forEach((q) => W.scene.remove(q.sp)); W.ph4 = null; W.calm = 0; };
clear4.push(() => W.photoEnd4());
function inFrame(q) { const dx = q.x - R.x, dz = q.z - R.z, d = Math.hypot(dx, dz), da = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - R.h), Math.cos(Math.atan2(dx, dz) - R.h))); return d > 6 && d < 42 && da < 0.4 ? 1 - da / 0.4 * 0.5 : 0; }
W.photoShot4 = function () { const P = W.ph4; if (!P) return; const q = P.tg.filter((t) => !t.done && !t.gone).map((t) => [t, inFrame(t)]).filter((a) => a[1] > 0).sort((a, b) => b[1] - a[1])[0];
  flash('#ffffff', 0.35); sfx('click'); if (!q) { W.toast('📷 В кадре ничего — наведи «Буханку» прямо на 👣 или 🪞'); return; } if (Math.abs(R.v) > 3.5) { W.toast('📷 Смазалось! Остановись'); return; }
  q[0].done = true; P.got++; W.scene.remove(q[0].sp); sfx('j_found'); W.toast('📸 ' + q[0].name + (q[1] > 0.85 ? ' — отличный кадр!' : ' — снято')); };
pb.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); W.photoShot4(); };
addEventListener('keydown', (e) => { if (W.ph4 && (e.code === 'KeyE' || e.code === 'KeyP')) W.photoShot4(); });
W.photoStep4 = function (dt) { const P = W.ph4; if (!P) return; P.t -= dt; let can = false, near = null, nd = 1e9;
  for (const q of P.tg) { if (q.done || q.gone) continue; const d = Math.hypot(q.x - R.x, q.z - R.z); if (d < nd) { nd = d; near = q; } if (inFrame(q) > 0) can = true; if (q.fragile && d < 3.5) { q.gone = true; P.lost++; W.scene.remove(q.sp); sfx('dry'); W.toast('😱 Колесом по следу! ' + q.name + ' стёрт навсегда'); } }
  pb.style.display = can ? 'block' : 'none'; fr.style.display = nd < 45 ? 'block' : 'none'; fr.style.borderColor = can ? '#7aff8a' : '#fff8';
  if (near && W.obj) { W.obj.x = near.x; W.obj.z = near.z; }
  const left = P.tg.filter((q) => !q.done && !q.gone).length; $('wdObj').innerHTML = '📷 Снимки: <b>' + P.got + ' из ' + P.need + '</b> · 🌍 свет Земли ещё <b>' + Math.max(0, Math.round(P.t)) + ' с</b>' + (P.lost ? ' · стёрто ' + P.lost : '') + ' · не наезжай на следы';
  if (P.got >= P.need) { const f = P.onWin; W.photoEnd4(); f(); } else if (P.t <= 0 || left + P.got < P.need) { const f = P.onFail; W.photoEnd4(); f(P.t <= 0 ? 'time' : 'lost'); } };

/* ---------- тир с вышки: «Буханка» на площадке, крутишь башню, бьёшь дронов; дроны прячутся за укрытиями ---------- */
W.tower4 = function (o) { W.towerEnd4(); const T = W.tw4 = Object.assign({ wave: 0, wt: 2, hp: 100, kills: 0, list: [] }, o); W.noFire = 0; W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); return T; };
W.towerEnd4 = function () { const T = W.tw4; if (!T) return; T.list.forEach((e) => (e.dead = true)); W.tw4 = null; W.lockY = undefined; W.calm = 0; R.x = T.x + 12; R.z = T.z + 12; R.y = W.H(R.x, R.z); };
clear4.push(() => W.towerEnd4());
function tdroneAI(e, dt) { const T = W.tw4; if (!T) { e.dead = true; return; } const c = T.cover[e.ci]; e.tt -= dt; e.vx = e.vz = 0;
  const ax = c.x - T.x, az = c.z - T.z, al = Math.hypot(ax, az), ux = ax / al, uz = az / al; let tx, tz;
  if (e.md === 'in') { tx = c.x - ux * 5 + uz * e.side * 6; tz = c.z - uz * 5 - ux * e.side * 6; e.it = (e.it || 0) + dt; if (Math.hypot(tx - e.x, tz - e.z) < 4 || e.it > 6) { e.it = 0; e.md = 'drill'; e.tt = rnd(2.5, 4); } }
  else if (e.md === 'drill') { tx = c.x - ux * 5 + uz * e.side * 6; tz = c.z - uz * 5 - ux * e.side * 6; T.hp -= dt * T.drill; if (Math.random() < dt * 3) burst(W.scene, c.x, W.H(c.x, c.z) + 6, c.z, 'spark', '#9ad0ff', 1, 0.3); if (e.tt <= 0) { e.md = 'hide'; e.tt = rnd(2, 3); e.immune = true; } }
  else { tx = c.x + ux * 9; tz = c.z + uz * 9; if (e.tt <= 0) { e.md = 'in'; e.immune = false; e.side = -e.side; } }
  const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d > 0.3) { const sp = Math.min(d * 2, e.md === 'hide' ? 16 : 11); e.x += dx / d * sp * dt; e.z += dz / d * sp * dt; } e.h = Math.atan2(T.x - e.x, T.z - e.z); }
W.towerStep4 = function (dt) { const T = W.tw4; if (!T) return; const J = BM.JOY; R.x = T.x; R.z = T.z; R.v = 0; W.lockY = T.y; if (J && J.id != null) R.h -= J.x * dt * 1.8; if (W.keys) { if (W.keys.has('ArrowLeft') || W.keys.has('KeyA')) R.h += dt * 1.8; if (W.keys.has('ArrowRight') || W.keys.has('KeyD')) R.h -= dt * 1.8; }
  T.list = T.list.filter((e) => { if (e.dead) { T.kills++; return false; } return true; });
  if (!T.list.length) { if (T.wave >= T.waves.length) { const f = T.onWin; W.towerEnd4(); f(); return; } T.wt -= dt; if (T.wt <= 0) { const n = T.waves[T.wave++]; T.wt = 3; if (T.wave > 1) { T.hp = Math.min(100, T.hp + 15); W.toast('🔧 Ремонтники подлатали тарелки: +15%'); } W.toast('📡 Волна ' + T.wave + ' из ' + T.waves.length + ': дронов ' + n); for (let k = 0; k < n; k++) { const ci = k % T.cover.length, c = T.cover[ci], a = Math.atan2(c.x - T.x, c.z - T.z) + rnd(-0.4, 0.4); const e = W.spawn(T.type, T.x + Math.sin(a) * 75, T.z + Math.cos(a) * 75, { keep: 1, hpK: (T.hpK || 1) * A.bossK() / 3, ai: tdroneAI, ci, md: 'in', side: k % 2 ? 1 : -1, tt: 0, immMsg: '🛡 за тарелкой! жди, высунется' }); if (e) T.list.push(e); } } }
  T.hp = Math.max(0, T.hp); $('wdObj').innerHTML = '📡 ' + T.label + ': <b style="color:' + (T.hp < 35 ? '#ff6a4a' : '#9f9') + '">' + Math.round(T.hp) + '%</b> · волна ' + T.wave + ' из ' + T.waves.length + ' · крути башню джойстиком, бей тех, кто сверлит';
  if (T.hp <= 0) { const f = T.onFail; W.towerEnd4(); f(); } };

/* ---------- ритм: бегунок ходит по полосе, жми, когда он в зелёной зоне ---------- */
W.rhythm4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.hit = 0; o.miss = 0; o.x = 0; o.dir = 1; o.cd = 0;
    o.card = document.createElement('div'); o.card.className = 'card'; o.card.innerHTML = '<div class="big">' + (cfg.icon || '🎵') + '</div><div style="position:relative;height:34px;background:#0006;border-radius:17px;margin:8px 4px;overflow:hidden"><div class="zn" style="position:absolute;top:0;bottom:0;background:#2f7a4a"></div><div class="mk" style="position:absolute;top:2px;width:14px;height:30px;border-radius:7px;background:#ffd27a"></div></div>'; o.body.appendChild(o.card);
    o.zn = o.card.querySelector('.zn'); o.mk = o.card.querySelector('.mk'); o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.zone = () => { const w = Math.max(cfg.zMin, cfg.z0 - o.hit * cfg.dz); o.zc = 0.25 + Math.random() * 0.5; o.zw = w; o.zn.style.left = (o.zc - w / 2) * 100 + '%'; o.zn.style.width = w * 100 + '%'; };
    o.info = () => (o.st.textContent = 'Попаданий: ' + o.hit + ' из ' + cfg.need + ' · мимо ' + o.miss + ' из ' + cfg.maxMiss);
    o.tap = () => { if (o.cd > 0) return; o.cd = 0.25; if (Math.abs(o.x - o.zc) <= o.zw / 2) { o.hit++; sfx('coin'); o.say(pick(cfg.okSay)); if (o.hit >= cfg.need) return o.win(); o.zone(); } else { o.miss++; sfx('caught'); o.say(cfg.missSay); if (o.miss > cfg.maxMiss) return o.fail(); } o.info(); };
    btns(o, [cfg.btn || '🎵 Сейчас!'], () => o.tap()); o.zone(); o.info(); },
    tick(dt) { this.cd -= dt; const sp = cfg.sp + this.hit * cfg.dsp; this.x += this.dir * sp * dt; if (this.x > 1) { this.x = 1; this.dir = -1; } if (this.x < 0) { this.x = 0; this.dir = 1; } this.mk.style.left = 'calc(' + this.x * 100 + '% - 7px)'; } }); };

/* ---------- гонка с соперником-объектом (смерч, поезд…): кто первым к цели ---------- */
W.chase4 = function (o) { W.chaseEnd4(); const C = W.ch4 = Object.assign({ s: 0, seg: [] }, o); let L = 0; for (let i = 0; i < o.path.length - 1; i++) { const l = Math.hypot(o.path[i + 1][0] - o.path[i][0], o.path[i + 1][1] - o.path[i][1]); C.seg.push(l); L += l; } C.L = L;
  C.m = o.mesh(); W.scene.add(C.m); C.goalSp = emojiSprite(o.goalE || '🏁', 5); C.goalSp.position.set(o.goal.x, W.H(o.goal.x, o.goal.z) + 5, o.goal.z); W.scene.add(C.goalSp); return C; };
W.chaseEnd4 = function () { const C = W.ch4; if (!C) return; W.scene.remove(C.m); W.scene.remove(C.goalSp); W.ch4 = null; W.windX = W.windZ = 0; };
clear4.push(() => W.chaseEnd4());
W.chaseStep4 = function (dt) { const C = W.ch4; if (!C) return; C.s = Math.min(C.L, C.s + C.sp * dt); let s = C.s, i = 0; while (i < C.seg.length - 1 && s > C.seg[i]) { s -= C.seg[i]; i++; } const k = Math.min(1, s / C.seg[i]), a = C.path[i], b = C.path[i + 1];
  C.x = a[0] + (b[0] - a[0]) * k; C.z = a[1] + (b[1] - a[1]) * k; C.m.position.set(C.x, W.H(C.x, C.z), C.z); C.m.rotation.y += dt * 4;
  const dx = R.x - C.x, dz = R.z - C.z, d = Math.hypot(dx, dz) || 1; if (d < 40) { const f = (1 - d / 40) * 9; W.windX = -dz / d * f + -dx / d * f * 0.4; W.windZ = dx / d * f + -dz / d * f * 0.4; if (d < 8 && (C.hurtT = (C.hurtT || 0) - dt) <= 0) { C.hurtT = 1; W.hurt(6, C.name); } } else W.windX = W.windZ = 0;
  C.rt = (C.rt || 1) - dt; if (C.rain && C.rt <= 0 && !W.paused) { C.rt = 1.3; const [x, z] = [R.x + Math.sin(R.h) * R.v * 1.2 + rnd(-5, 5), R.z + Math.cos(R.h) * R.v * 1.2 + rnd(-5, 5)]; A.drop11(x, z); }
  const me = Math.hypot(R.x - C.goal.x, R.z - C.goal.z), it = C.L - C.s; if (W.obj) { W.obj.x = C.goal.x; W.obj.z = C.goal.z; }
  $('wdObj').innerHTML = C.label + ': тебе <b>' + Math.round(me) + ' м</b> · ' + C.name + 'у <b style="color:' + (it < me ? '#ff6a4a' : '#9f9') + '">' + Math.round(it) + ' м</b>';
  if (me < 14) { const f = C.onWin; W.chaseEnd4(); f(); } else if (it <= 1) { const f = C.onFail; W.chaseEnd4(); f(); } };

/* ---------- пешая вылазка: «Буханка» стоит, бабуля идёт сама; тепло кончается, греться у тёплых камней ---------- */
W.foot4 = function (o) { W.footEnd4(true); const F = W.ft4 = Object.assign({ warm: 100, park: { x: R.x, z: R.z, h: R.h } }, o);
  F.g = personMesh('#c84a6a'); F.g.scale.setScalar(1.2); W.scene.add(F.g); F.lamp = new THREE.PointLight('#fff2c0', 1.4, 26); W.scene.add(F.lamp);
  F.car = new THREE.Group(); const cm = W.roverG.clone(); F.car.add(cm); F.car.position.set(R.x, R.y, R.z); F.car.rotation.y = R.h; W.scene.add(F.car);
  F.spots.forEach((q) => { q.ring = A.ring11(q.x, q.z, '#ff9a4a', 5); }); F.goalSp = emojiSprite(o.goalE, 3); F.goalSp.position.set(o.goal.x, W.H(o.goal.x, o.goal.z) + 2.5, o.goal.z); W.scene.add(F.goalSp);
  W.foot = 1; W.vmaxCap = 5.5; W.noFire = 1; W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); R.x += Math.sin(R.h + 1.57) * 4; R.z += Math.cos(R.h + 1.57) * 4; R.v = 0; return F; };
W.footEnd4 = function (stay) { const F = W.ft4; if (!F) return; W.scene.remove(F.g); W.scene.remove(F.lamp); W.scene.remove(F.car); W.scene.remove(F.goalSp); F.spots.forEach((q) => q.ring && W.scene.remove(q.ring)); W.ft4 = null; W.foot = 0; W.vmaxCap = 0; W.noFire = 0; W.calm = 0;
  if (!stay) { R.x = F.park.x; R.z = F.park.z; R.h = F.park.h; R.y = W.H(R.x, R.z); R.v = 0; } };
clear4.push(() => W.footEnd4());
W.footStep4 = function (dt) { const F = W.ft4; if (!F) return; const y = W.H(R.x, R.z); F.g.position.set(R.x, y + Math.abs(Math.sin(W.t * 8)) * 0.25 * Math.min(1, Math.abs(R.v) / 3), R.z); F.g.rotation.y = R.h; F.lamp.position.set(R.x + Math.sin(R.h) * 3, y + 3, R.z + Math.cos(R.h) * 3);
  let hot = null; for (const q of F.spots) if (Math.hypot(q.x - R.x, q.z - R.z) < 6) hot = q; F.warm = Math.max(0, Math.min(100, F.warm + (hot ? 30 : -F.drain) * dt));
  const gd = Math.hypot(F.goal.x - R.x, F.goal.z - R.z), near = F.spots.filter((q) => Math.hypot(q.x - F.goal.x, q.z - F.goal.z) < gd - 4).sort((a, b) => Math.hypot(a.x - R.x, a.z - R.z) - Math.hypot(b.x - R.x, b.z - R.z))[0];
  if (W.obj) { const t = F.warm < 45 && near ? near : F.goal; W.obj.x = t.x; W.obj.z = t.z; }
  if (F.noWarm) { F.warm = 100; if (F.extra) F.extra(dt, F); if (F.dead) { const f = F.onFail; W.footEnd4(); f(); return; } if (gd < 5) { const f = F.onWin; W.footEnd4(); f(); } return; } $('wdObj').innerHTML = '🚶‍♀️ ' + F.label + ' · ' + Math.round(gd) + ' м · 🌡 <b style="color:' + (F.warm < 30 ? '#7fc8ff' : '#ffd27a') + '">' + Math.round(F.warm) + '%</b>' + (hot ? ' · греемся у камня 🔥' : ' · грейся у 🔥 тёплых камней');
  if (gd < 5) { const f = F.onWin; W.footEnd4(); f(); } else if (F.warm <= 0) { const f = F.onFail; W.footEnd4(); f(); } };

/* ---------- оборона с заграждениями: между волнами ставишь 🧱, черви грызут их, а не ворота ---------- */
const bb = document.createElement('button'); bb.textContent = '🧱 Поставить'; bb.style.cssText = pb.style.cssText.replace('#3a6aff', '#a8642a'); bb.style.display = 'none'; document.body.appendChild(bb);
W.def4 = function (o) { W.defEnd4(); const D = W.df4 = Object.assign({ wave: 0, hp: 100, phase: 'build', t: o.build, left: o.per, bars: [], list: [] }, o); D.slots.forEach((q) => { q.ring = A.ring11(q.x, q.z, '#ffd27a', 3.2); q.bar = null; }); W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); return D; };
W.defEnd4 = function () { const D = W.df4; if (!D) return; D.slots.forEach((q) => { if (q.ring) W.scene.remove(q.ring); if (q.bar) W.scene.remove(q.bar.m); }); D.list.forEach((e) => (e.dead = true)); W.df4 = null; W.calm = 0; bb.style.display = 'none'; };
clear4.push(() => W.defEnd4());
W.defPlace4 = function () { const D = W.df4; if (!D || D.left <= 0) return; const q = D.slots.filter((s) => !s.bar && Math.hypot(s.x - R.x, s.z - R.z) < 7)[0]; if (!q) return;
  const m = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 1.4), new THREE.MeshLambertMaterial({ color: '#8a5a30' })); const a = Math.atan2(D.gate.x - q.x, D.gate.z - q.z); m.position.set(q.x, W.H(q.x, q.z) + 1.1, q.z); m.rotation.y = a; W.scene.add(m);
  q.bar = { m, hp: 100 }; D.left--; sfx('thud'); W.toast('🧱 Заграждение! Осталось ящиков: ' + D.left); };
bb.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); W.defPlace4(); };
addEventListener('keydown', (e) => { if (W.df4 && e.code === 'KeyE') W.defPlace4(); });
function defAI(e, dt) { const D = W.df4; if (!D) { e.dead = true; return; } e.vx = e.vz = 0; const dx = D.gate.x - e.x, dz = D.gate.z - e.z, d = Math.hypot(dx, dz) || 1;
  const bq = D.slots.find((q) => q.bar && Math.hypot(q.x - e.x, q.z - e.z) < 4.5); if (bq) { bq.bar.hp -= dt * D.chew; if (Math.random() < dt * 2) burst(W.scene, bq.x, W.H(bq.x, bq.z) + 1.5, bq.z, 'smoke', '#8a5a30', 1.5, 0.4); if (bq.bar.hp <= 0) { W.scene.remove(bq.bar.m); bq.bar = null; W.toast('💥 Заграждение прогрызли!'); } return; }
  if (d < 7) { D.hp -= dt * D.bite; return; } const sp = e.t.sp * 0.8; e.x += dx / d * sp * dt; e.z += dz / d * sp * dt; e.h = Math.atan2(dx, dz); }
W.defStep4 = function (dt) { const D = W.df4; if (!D) return; D.list = D.list.filter((e) => !e.dead); D.hp = Math.max(0, D.hp);
  const near = D.slots.some((s) => !s.bar && Math.hypot(s.x - R.x, s.z - R.z) < 7); bb.style.display = D.left > 0 && near ? 'block' : 'none';
  D.slots.forEach((q) => { if (q.ring) q.ring.visible = !q.bar && D.left > 0; });
  if (D.phase === 'build') { D.t -= dt; const free = D.slots.filter((s) => !s.bar).sort((a, b) => Math.hypot(a.x - R.x, a.z - R.z) - Math.hypot(b.x - R.x, b.z - R.z))[0]; if (W.obj && free && D.left > 0) { W.obj.x = free.x; W.obj.z = free.z; }
    $('wdObj').innerHTML = '🧱 Ставь заграждения на 🟡 кругах: ящиков <b>' + D.left + '</b> · волна ' + (D.wave + 1) + ' через <b>' + Math.ceil(D.t) + ' с</b> · ' + D.label + ' ' + Math.round(D.hp) + '%';
    if (D.t <= 0) { D.phase = 'fight'; const n = D.waves[D.wave++]; W.toast('🪱 Волна ' + D.wave + ' из ' + D.waves.length + '!'); sfx('warn'); for (let k = 0; k < n; k++) { const sp = D.spawns[k % D.spawns.length]; const e = W.spawn(D.type, sp[0] + rnd(-6, 6), sp[1] + rnd(-6, 6), { keep: 1, ai: defAI, hpK: A.bossK() / 3 * (D.hpK || 1) }); if (e) D.list.push(e); } } }
  else { if (W.obj) { const e = D.list.slice().sort((a, b) => Math.hypot(a.x - D.gate.x, a.z - D.gate.z) - Math.hypot(b.x - D.gate.x, b.z - D.gate.z))[0]; if (e) { W.obj.x = e.x; W.obj.z = e.z; } }
    $('wdObj').innerHTML = '🪱 Волна ' + D.wave + ' из ' + D.waves.length + ': червей <b>' + D.list.length + '</b> · ' + D.label + ' <b style="color:' + (D.hp < 35 ? '#ff6a4a' : '#9f9') + '">' + Math.round(D.hp) + '%</b>';
    if (!D.list.length) { if (D.wave >= D.waves.length) { const f = D.onWin; W.defEnd4(); f(); return; } D.phase = 'build'; D.t = D.build; D.left += D.per; W.toast('🧱 Передышка! +' + D.per + ' ящика на заграждения'); } }
  if (D.hp <= 0) { const f = D.onFail; W.defEnd4(); f(); } };

/* ---------- настройка: совмести свою волну с эталоном (частота и сила), пока не пришла помеха ---------- */
W.tune4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.i = 0; o.t = cfg.time;
    o.cv = document.createElement('canvas'); o.cv.width = 480; o.cv.height = 150; o.cv.style.cssText = 'width:100%;background:#0b1020;border-radius:12px;display:block'; o.body.appendChild(o.cv); o.g = o.cv.getContext('2d');
    o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.next = () => { if (o.i >= cfg.n) return o.win(); o.tf = 1 + Math.floor(Math.random() * 7) * 0.5; o.ta = 0.3 + Math.floor(Math.random() * 7) * 0.1; do { o.f = 1 + Math.floor(Math.random() * 7) * 0.5; o.a = 0.3 + Math.floor(Math.random() * 7) * 0.1; } while (Math.abs(o.f - o.tf) < 0.4 && Math.abs(o.a - o.ta) < 0.15); o.hold = 0; };
    btns(o, ['〰 реже', '〰 чаще', '🔉 тише', '🔊 громче'], (k) => { if (k === 0) o.f = Math.max(1, o.f - 0.5); if (k === 1) o.f = Math.min(4, o.f + 0.5); if (k === 2) o.a = Math.max(0.3, +(o.a - 0.1).toFixed(1)); if (k === 3) o.a = Math.min(0.9, +(o.a + 0.1).toFixed(1)); sfx('click'); });
    o.next(); },
    tick(dt) { const o = this, g = o.g, W2 = o.cv.width, H2 = o.cv.height; o.t -= dt; const ok = Math.abs(o.f - o.tf) < 0.01 && Math.abs(o.a - o.ta) < 0.01; o.hold = ok ? o.hold + dt : 0;
      g.clearRect(0, 0, W2, H2); const wave = (f, a, col, w, jit) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (let x = 0; x <= W2; x += 4) { const y = H2 / 2 - Math.sin(x / W2 * Math.PI * 2 * f + W.t * 2) * a * H2 * 0.42 + (jit ? (Math.random() - 0.5) * jit : 0); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
      wave(o.tf, o.ta, '#2f9a5a', 7, 0); wave(o.f, o.a, ok ? '#7aff8a' : '#ffd27a', 3, o.t < 8 ? 10 : 2);
      o.st.innerHTML = 'Антенна ' + (o.i + 1) + ' из ' + cfg.n + ' · ☢ до волны <b style="color:' + (o.t < 8 ? '#ff6a4a' : '#9f9') + '">' + Math.max(0, Math.ceil(o.t)) + ' с</b>' + (ok ? ' · держу сигнал…' : '');
      if (o.hold > 0.8) { o.i++; sfx('j_found'); o.say(pick(cfg.okSay)); o.t = Math.min(cfg.time, o.t + cfg.bonus); o.next(); }
      if (o.t <= 0) o.fail(); } }); };

/* ---------- слежка: едь за целью, не отставай; когда она оглядывается (👀) — замри или будь далеко ---------- */
W.tail4 = function (o) { W.tailEnd4(); const T = W.tl4 = Object.assign({ s: 0, seg: [], sus: 0, lost: 0, chk: rnd(8, 12), look: 0, warn: 0 }, o); let L = 0; for (let i = 0; i < o.path.length - 1; i++) { const l = Math.hypot(o.path[i + 1][0] - o.path[i][0], o.path[i + 1][1] - o.path[i][1]); T.seg.push(l); L += l; } T.L = L;
  T.m = o.mesh(); W.scene.add(T.m); T.eye = emojiSprite('👀', 3); T.eye.visible = false; W.scene.add(T.eye); T.cone = coneMesh(T.see, 0.45); T.cone.visible = false; W.scene.add(T.cone); return T; };
W.tailEnd4 = function () { const T = W.tl4; if (!T) return; [T.m, T.eye, T.cone].forEach((m) => W.scene.remove(m)); W.tl4 = null; };
clear4.push(() => W.tailEnd4());
W.tailStep4 = function (dt) { const T = W.tl4; if (!T) return; T.chk -= dt;
  if (T.chk <= 1.2 && T.chk > 0 && !T.warn) { T.warn = 1; sfx('warn', { vol: 0.5 }); W.toast('👀 Курьер сейчас оглянется — замри!'); }
  if (T.chk <= 0 && !T.look) { T.look = 2.6; } if (T.look > 0) { T.look -= dt; if (T.look <= 0) { T.look = 0; T.warn = 0; T.chk = rnd(8, 13); } } else T.s = Math.min(T.L, T.s + T.sp * dt);
  let s = T.s, i = 0; while (i < T.seg.length - 1 && s > T.seg[i]) { s -= T.seg[i]; i++; } const k = Math.min(1, s / T.seg[i]), a = T.path[i], b = T.path[i + 1]; T.x = a[0] + (b[0] - a[0]) * k; T.z = a[1] + (b[1] - a[1]) * k; const fh = Math.atan2(b[0] - a[0], b[1] - a[1]), h = T.look > 0 ? fh + Math.PI : fh;
  const y = W.H(T.x, T.z); T.m.position.set(T.x, y, T.z); T.m.rotation.y = h; T.eye.visible = T.look > 0 || T.warn; T.eye.position.set(T.x, y + 7, T.z); T.cone.visible = T.look > 0; T.cone.position.set(T.x, y + 1, T.z); T.cone.rotation.y = h;
  const dx = R.x - T.x, dz = R.z - T.z, d = Math.hypot(dx, dz), da = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - h), Math.cos(Math.atan2(dx, dz) - h)));
  const seen = T.look > 0 && d < T.see && da < 0.5 && Math.abs(R.v) > 2, close = d < T.near; T.sus = Math.max(0, Math.min(100, T.sus + (seen ? 70 : close ? 25 : -8) * dt)); T.lost = d > T.far ? T.lost + dt : 0;
  if (W.obj) { W.obj.x = T.x; W.obj.z = T.z; }
  $('wdObj').innerHTML = '🕵 ' + T.label + ': <b>' + Math.round(d) + ' м</b> (держи ' + T.near + '–' + T.far + ') · 👁 <b style="color:' + (T.sus > 60 ? '#ff6a4a' : T.sus > 25 ? '#ffc04a' : '#9f9') + '">' + Math.round(T.sus) + '%</b>' + (T.look > 0 ? ' · <b style="color:#ffd24a">👀 оглядывается — стой!</b>' : '') + (T.lost > 0 ? ' · <b style="color:#7fc8ff">отстаёшь! ' + Math.ceil(T.lostMax - T.lost) + ' с</b>' : '');
  if (T.sus >= 100) { const f = T.onFail; W.tailEnd4(); f('seen'); } else if (T.lost > T.lostMax) { const f = T.onFail; W.tailEnd4(); f('lost'); } else if (T.s >= T.L) { const f = T.onWin; W.tailEnd4(); f(); } };

/* ---------- переключатели: вентиль крутит себя и соседей; открыть все за N ходов ---------- */
W.valves4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { const n = cfg.n; o.v = Array(n).fill(true); o.moves = 0; const press = (i) => [i - 1, i, i + 1].forEach((k) => { const j = (k + n) % n; o.v[j] = !o.v[j]; });
    let tries = 0; do { o.v.fill(true); for (let k = 0; k < cfg.scramble; k++) press(Math.floor(Math.random() * n)); tries++; } while (o.v.every(Boolean) && tries < 20);
    o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st); o.row = btns(o, o.v.map(() => ''), (i) => { if (o.done) return; press(i); o.moves++; sfx('click'); o.draw(); if (o.v.every(Boolean)) { o.done = 1; o.say('✅ ' + cfg.okSay); setTimeout(() => o.win(), 900); } else if (o.moves >= cfg.max) { o.done = 1; o.say('🌊 ' + cfg.failSay); setTimeout(() => o.fail(), 1200); } });
    o.press = (i) => o.row.children[i].dispatchEvent(new PointerEvent('pointerdown'));
    o.draw = () => { [...o.row.children].forEach((b, i) => { b.innerHTML = (o.v[i] ? '🟢' : '🔴') + '<br><small>вентиль ' + (i + 1) + '</small>'; }); o.st.textContent = 'Ходов: ' + o.moves + ' из ' + cfg.max + ' · открыто ' + o.v.filter(Boolean).length + ' из ' + n; };
    o.say(cfg.hint); o.draw(); } }); };

/* ---------- торг: цена, терпение, хитрости ---------- */
W.trade4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.price = cfg.price; o.pat = cfg.patience; o.card = document.createElement('div'); o.card.className = 'card'; o.body.appendChild(o.card);
    o.draw = () => (o.card.innerHTML = '<div class="big">' + cfg.icon + '</div><div>Цена: <b>' + o.price + ' ₽</b></div><div>Терпение: <b>' + '❤'.repeat(Math.max(0, o.pat)) + '🖤'.repeat(Math.max(0, cfg.patience - o.pat)) + '</b></div><div style="font-size:13px;opacity:.8">у вас ' + W.st.money + ' ₽ · 🥟 ' + W.st.food + '</div>');
    const acts = cfg.acts(o); o.acts = acts; btns(o, acts.map((a) => a.t), (i) => { if (o.done) return; const r = acts[i].fn(); sfx('click'); if (r) o.say(r); o.draw(); if (o.pat <= 0 && !o.done) { o.done = 1; setTimeout(() => o.fail(), 1300); } });
    o.draw(); o.say(cfg.hello); } }); };

/* ---------- готовка: рецепт по памяти, потом печь — вынуть вовремя ---------- */
W.cook4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.err = 0; o.ph = 'show'; o.card = document.createElement('div'); o.card.className = 'card'; o.body.appendChild(o.card); o.rowW = document.createElement('div'); o.body.appendChild(o.rowW); o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.rec = cfg.recipe.slice(); o.t = cfg.showT; o.card.innerHTML = '<div style="font-size:14px">Рецепт бабушки — запоминай!</div><div style="font-size:34px;letter-spacing:6px">' + o.rec.map((r) => r[0]).join(' → ') + '</div><div style="font-size:12px;opacity:.8">' + o.rec.map((r) => r[1]).join(' → ') + '</div>';
    o.mix = () => { o.ph = 'mix'; o.i = 0; o.card.innerHTML = '<div class="big">🥣</div><div>Клади по рецепту: шаг 1 из ' + o.rec.length + '</div>'; const all = cfg.recipe.concat(cfg.extra).sort(() => Math.random() - 0.5); o.opts = all; o.rowW.innerHTML = '';
      const r = document.createElement('div'); r.className = 'row'; all.forEach((it) => { const b = document.createElement('button'); b.innerHTML = it[0] + '<br><small>' + it[1] + '</small>'; b.style.flex = '1 1 22%'; b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); o.put(it); }; r.appendChild(b); }); o.rowW.appendChild(r); };
    o.put = (it) => { if (o.ph !== 'mix') return; if (it === o.rec[o.i]) { o.i++; sfx('pick'); o.say(it[0] + ' — да!'); o.card.innerHTML = '<div class="big">🥣</div><div>Шаг ' + Math.min(o.i + 1, o.rec.length) + ' из ' + o.rec.length + '</div>'; if (o.i >= o.rec.length) o.oven(); } else { o.err++; sfx('caught'); o.say('❌ Не то! Бабушка: «' + cfg.hint + '»'); if (o.err > cfg.maxErr) { o.ph = 'x'; setTimeout(() => o.fail('mix'), 1000); } } o.st.textContent = 'Ошибок ' + o.err + ' из ' + cfg.maxErr; };
    o.oven = () => { o.ph = 'oven'; o.batch = 0; o.ok = 0; o.rowW.innerHTML = ''; btns(o, ['🧤 Вынуть!'], () => o.take()); o.bake(); };
    o.bake = () => { o.heat = 0; o.sp = cfg.bake[0] + Math.random() * (cfg.bake[1] - cfg.bake[0]); o.card.innerHTML = '<div class="big">🔥🥟</div><div>Противень ' + (o.batch + 1) + ' из ' + cfg.batches + '</div><div style="position:relative;height:26px;background:#0006;border-radius:13px;margin:8px 4px;overflow:hidden"><div style="position:absolute;left:62%;width:18%;top:0;bottom:0;background:#c8902a"></div><div class="mk" style="position:absolute;top:0;bottom:0;width:0;background:#ffd27a55"></div></div><div style="font-size:12px">золотистые — в жёлтой зоне</div>'; o.mk = o.card.querySelector('.mk'); };
    o.take = () => { if (o.ph !== 'oven' || o.heat <= 0.05) return; const h = o.heat; o.batch++; if (h >= 0.62 && h <= 0.8) { o.ok++; sfx('coin'); o.say('🥟 Золотистые!'); } else { sfx('caught'); o.say(h < 0.62 ? '🥟 Сырые внутри…' : '🔥 Подгорели!'); } o.st.textContent = 'Удачных противней: ' + o.ok + ' из ' + cfg.batches + ' (нужно ' + cfg.need + ')'; if (o.batch >= cfg.batches) { o.ph = 'x'; setTimeout(() => (o.ok >= cfg.need ? o.win() : o.fail('oven')), 900); } else o.bake(); };
    o.st.textContent = 'Смотри внимательно…'; },
    tick(dt) { const o = this; if (o.ph === 'show') { o.t -= dt; if (o.t <= 0) o.mix(); } else if (o.ph === 'oven') { o.heat += o.sp * dt; o.mk.style.width = Math.min(100, o.heat * 100) + '%'; if (o.heat >= 1) { o.heat = 0.99; o.take(); } } } }); };

/* ---------- сборка по чертежу: на каждом шаге выбери нужную деталь среди похожих ---------- */
W.assemble4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.cfg = cfg; o.i = 0; o.err = 0; o.card = document.createElement('div'); o.card.className = 'card'; o.body.appendChild(o.card); o.rowW = document.createElement('div'); o.body.appendChild(o.rowW); o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.step = () => { if (o.i >= cfg.parts.length) return o.win(); const P = cfg.parts[o.i]; o.card.innerHTML = '<div style="font-size:13px;opacity:.8">Чертёж, шаг ' + (o.i + 1) + ' из ' + cfg.parts.length + ':</div><div style="font-size:17px"><b>' + P.need + '</b></div><div style="font-size:24px">' + cfg.parts.slice(0, o.i).map((q) => q.e).join('') + '⬜</div>';
      const opts = [P.ok].concat(P.bad).concat(Math.random() < cfg.gosha ? [cfg.goshaItem] : []).sort(() => Math.random() - 0.5); o.cur = opts; o.rowW.innerHTML = '';
      const r = document.createElement('div'); r.className = 'row'; opts.forEach((t) => { const b = document.createElement('button'); b.textContent = t; b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); o.pick(t); }; r.appendChild(b); }); o.rowW.appendChild(r);
      o.st.textContent = 'Ошибок ' + o.err + ' из ' + cfg.maxErr; };
    o.pick = (t) => { const P = cfg.parts[o.i]; if (t === P.ok) { o.i++; sfx('thud'); o.say('🔩 ' + pick(cfg.okSay)); o.step(); } else { o.err++; sfx('caught'); o.say(t === cfg.goshaItem ? '🐱 Это Гоша подсунул!' : '❌ Не та деталь — читай чертёж'); if (o.err > cfg.maxErr) return setTimeout(() => o.fail(), 900); o.st.textContent = 'Ошибок ' + o.err + ' из ' + cfg.maxErr; } };
    o.step(); } }); };

/* ---------- прожектор-конус (крутится над целью; пока горит — цели под защитой) ---------- */
W.spot4 = function (o) { W.spotEnd4(); const P = W.sp4 = Object.assign({ a: 0, hold: 0, on: true }, o); P.cone = coneMesh(o.L, 0.32); P.cone.material.color.set('#fff6b0'); W.scene.add(P.cone); P.gen = emojiSprite('🔦', 3); P.gen.position.set(o.gx, W.H(o.gx, o.gz) + 2.5, o.gz); W.scene.add(P.gen); P.ring = A.ring11(o.gx, o.gz, '#ffd24a', 6); return P; };
W.spotEnd4 = function () { const P = W.sp4; if (!P) return; W.scene.remove(P.cone); W.scene.remove(P.gen); if (P.ring) W.scene.remove(P.ring); W.sp4 = null; };
clear4.push(() => W.spotEnd4());
W.spotStep4 = function (dt) { const P = W.sp4; if (!P || !P.on) return; P.a += dt * P.spd; P.cone.position.set(P.x, W.H(P.x, P.z) + 6, P.z); P.cone.rotation.y = P.a;
  const dx = R.x - P.x, dz = R.z - P.z, d = Math.hypot(dx, dz), da = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - P.a), Math.cos(Math.atan2(dx, dz) - P.a)));
  if (d < P.L && da < 0.36) { P.ht = (P.ht || 0) - dt; if (P.ht <= 0) { P.ht = 0.8; W.hurt(P.dmg, 'прожектор навёл снайперов'); } P.cone.material.color.set('#ff7a5a'); } else P.cone.material.color.set('#fff6b0');
  if (Math.hypot(R.x - P.gx, R.z - P.gz) < 8 && Math.abs(R.v) < 6) { P.hold += dt; if (P.hold > 2) { P.on = false; const f = P.onOff; W.spotEnd4(); sfx('j_found'); f(); } } else P.hold = Math.max(0, P.hold - dt); };

/* ---------- порядок справок: у каждой — условия; робот меняет правила на ходу ---------- */
W.docs4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.cfg = cfg; o.have = {}; o.err = 0; o.dep = JSON.parse(JSON.stringify(cfg.dep)); o.changed = 0; o.card = document.createElement('div'); o.card.className = 'card'; o.card.style.textAlign = 'left'; o.card.style.fontSize = '14px'; o.body.appendChild(o.card); o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    const nm = (k) => cfg.docs[k][0] + ' ' + cfg.docs[k][1];
    o.draw = () => { o.card.innerHTML = '<b>Правила окошек:</b><br>' + Object.keys(cfg.docs).map((k) => (o.have[k] ? '✅ ' : '▫ ') + nm(k) + (o.dep[k].length ? ' — <span style="opacity:.8">нужно: ' + o.dep[k].map((d) => cfg.docs[d][0]).join(' ') + '</span>' : ' — без условий') + (o.changed === k ? ' <b style="color:#ffd24a">(новое!)</b>' : '')).join('<br>'); o.st.textContent = 'Ошибок ' + o.err + ' из ' + cfg.maxErr; [...o.row.children].forEach((b, i) => { const k = Object.keys(cfg.docs)[i]; b.style.opacity = o.have[k] ? 0.4 : 1; }); };
    o.get = (k) => { if (o.have[k] || o.done) return; const miss = o.dep[k].filter((d) => !o.have[d]); if (miss.length) { o.err++; sfx('caught'); o.say('🤖 «Окно закрыто. Сначала: ' + miss.map(nm).join(', ') + '»'); if (o.err > cfg.maxErr) { o.done = 1; o.say('🤖 «Обед. Приходите в 2087 году»'); setTimeout(() => o.fail(), 1300); } o.draw(); return; }
      o.have[k] = 1; sfx('coin'); o.say('🤖 «Шлёп!» ' + nm(k) + ' — выдана'); const n = Object.keys(o.have).length;
      if (n >= Object.keys(cfg.docs).length) { o.done = 1; setTimeout(() => o.win(), 900); }
      else if (n === cfg.changeAt && !o.changed) { const [k2, add] = cfg.change(o); if (k2) { o.dep[k2].push(add); o.changed = k2; setTimeout(() => { sfx('warn'); o.say('🤖 «ВНИМАНИЕ. Новые правила: ' + nm(k2) + ' — только после ' + nm(add) + '»'); o.draw(); }, 700); } }
      o.draw(); };
    o.row = btns(o, Object.keys(cfg.docs).map((k) => cfg.docs[k][0] + '<br><small>' + cfg.docs[k][1] + '</small>'), (i) => o.get(Object.keys(cfg.docs)[i])); o.draw(); o.say(cfg.hello); } }); };

/* ---------- заслонки: закрытая заслонка гонит давление по своей трубе в открытую; не туда — пшик ---------- */
W.dampers4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.cfg = cfg; o.tries = 0;
    o.reset = () => { const n = cfg.names.length; o.ord = [...Array(n).keys()].sort(() => Math.random() - 0.5); o.pipe = {}; for (let i = 0; i < n; i++) o.pipe[o.ord[i]] = i + 1 < n ? o.ord[i + 1] : 'T'; o.p = Array(n).fill(1); o.open = Array(n).fill(true); o.pT = 0; o.draw(); };
    o.card = document.createElement('div'); o.card.className = 'card'; o.card.style.fontSize = '14px'; o.body.appendChild(o.card); o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.row = btns(o, cfg.names.map((nm) => nm), (i) => o.shut(i)); btns(o, ['↺ Открыть все заново'], () => { o.tries++; sfx('click'); o.say('Заслонки открыты. Давление вернулось.'); o.reset(); });
    o.draw = () => { const nm = (k) => (k === 'T' ? '🚙 под «Буханкой»' : cfg.names[k]); o.card.innerHTML = '<b>Трубы:</b><br>' + Object.keys(o.pipe).map((k) => nm(+k) + ' → ' + nm(o.pipe[k])).join('<br>') + '<div style="margin-top:6px">Давление под «Буханкой»: <b>' + '💨'.repeat(o.pT) + '</b> ' + o.pT + ' из ' + cfg.names.length + '</div>';
      [...o.row.children].forEach((b, i) => { b.innerHTML = (o.open[i] ? '🟢 ' : '⛔ ') + cfg.names[i] + '<br><small>давление ' + o.p[i] + '</small>'; }); o.st.textContent = 'Попыток: ' + (o.tries + 1); };
    o.shut = (i) => { if (!o.open[i] || o.done) return; o.open[i] = false; const to = o.pipe[i], amt = o.p[i]; o.p[i] = 0; sfx('thud');
      if (to === 'T') { o.pT += amt; } else if (o.open[to]) { o.p[to] += amt; } else { o.say('💨 Пшик! Труба ведёт в закрытую заслонку — давление ушло'); sfx('dry'); }
      o.draw(); if (o.open.every((x) => !x)) { if (o.pT >= cfg.names.length) { o.done = 1; o.say('🌋 Ба-бах! Гейзер подбросил «Буханку»!'); setTimeout(() => o.win(), 900); } else o.say('Мало давления… Открой все и попробуй в другом порядке'); } };
    o.reset(); o.say(cfg.hint); } }); };

/* ---------- стелс: охрана с фонарями и конусами обзора ---------- */
function personMesh(col) { const g = new THREE.Group(), m = (c) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.9, 8), m(col)); body.position.y = 1.15; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), m('#e9b48a')); head.position.y = 2.4; g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8), m('#3a3a3a')); hat.position.y = 2.8; g.add(hat);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' })); lamp.position.set(0.4, 1.6, 0.6); g.add(lamp);
  g.scale.setScalar(1.6); return g; }
function coneMesh(L, half) { const n = 12, pos = [0, 0, 0]; for (let i = 0; i <= n; i++) { const a = -half + 2 * half * i / n; pos.push(Math.sin(a) * L, 0, Math.cos(a) * L); } const idx = []; for (let i = 1; i <= n; i++) idx.push(0, i, i + 1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff27a', transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide })); }
W.stealth4 = function (o) { W.stealthEnd4(); const S = W.st4 = Object.assign({ sus: 0, L: 28, half: 0.5, got: 0, hold: 0 }, o);
  S.guards = o.guards.map((gd) => { const m = personMesh(gd.col || '#5a6a3a'), c = coneMesh(S.L, S.half); W.scene.add(m); W.scene.add(c); const [x, z] = gd.path[0]; return Object.assign({ x, z, h: 0, wi: 1, wait: 0, m, c, sp: 2.4, look: 0 }, gd); });
  S.items.forEach((it) => { it.sp = emojiSprite(it.e, 2.6); it.sp.position.set(it.x, W.H(it.x, it.z) + 2.2, it.z); W.scene.add(it.sp); it.done = false; });
  W.calm = 1; W.noFire = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); return S; };
W.stealthEnd4 = function () { const S = W.st4; if (!S) return; S.guards.forEach((g) => { W.scene.remove(g.m); W.scene.remove(g.c); }); S.items.forEach((it) => W.scene.remove(it.sp)); W.st4 = null; W.calm = 0; W.noFire = 0; };
clear4.push(() => W.stealthEnd4());
function guardStep(g, dt, S) { const P = g.path;
  if (g.look > 0) { g.look -= dt; const want = Math.atan2(R.x - g.x, R.z - g.z); g.h += Math.atan2(Math.sin(want - g.h), Math.cos(want - g.h)) * Math.min(1, dt * 3); }
  else if (g.wait > 0) { g.wait -= dt; g.h = g.h0 + Math.sin((g.wait) * 1.6) * 0.9; }
  else { const [tx, tz] = P[g.wi], dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz); if (d < 1) { g.wi = (g.wi + 1) % P.length; g.wait = g.pause || 2; g.h0 = g.h; } else { g.x += dx / d * g.sp * dt; g.z += dz / d * g.sp * dt; const want = Math.atan2(dx, dz); g.h += Math.atan2(Math.sin(want - g.h), Math.cos(want - g.h)) * Math.min(1, dt * 4); } }
  const y = W.H(g.x, g.z); g.m.position.set(g.x, y, g.z); g.m.rotation.y = g.h; g.c.position.set(g.x, y + 0.9, g.z); g.c.rotation.y = g.h;
  const rx = R.x - g.x, rz = R.z - g.z, d = Math.hypot(rx, rz), da = Math.abs(Math.atan2(Math.sin(Math.atan2(rx, rz) - g.h), Math.cos(Math.atan2(rx, rz) - g.h)));
  const sp = Math.abs(R.v), seen = d < S.L && da < S.half + 0.08, loud = sp > S.quiet && d < (sp > 12 ? 40 : 26);
  if (loud && g.look <= 0) { g.look = 2.2; W.toast('👂 Сторож слышит мотор — тише! (меньше газа)'); }
  if (loud) S.sus += dt * (sp > 12 ? 22 : 10); g.c.material.color.set(seen ? '#ff5a3a' : g.look > 0 ? '#ffb03a' : '#fff27a'); return seen ? (1.2 - d / S.L * 0.7) * (sp > S.quiet ? 3 : 1) : 0; }
W.stealthStep4 = function (dt) { const S = W.st4; if (!S) return; let see = 0; S.guards.forEach((g) => (see += guardStep(g, dt, S))); S.sus = Math.max(0, Math.min(100, S.sus + (see > 0 ? see * 60 * dt : -14 * dt)));
  let near = null; for (const it of S.items) if (!it.done && Math.hypot(it.x - R.x, it.z - R.z) < 6) near = it;
  if (near && Math.abs(R.v) < 2.5) { S.hold += dt; if (S.hold > S.take) { near.done = true; S.got++; S.hold = 0; W.scene.remove(near.sp); sfx('coin'); W.toast(near.e + ' ' + near.name + ' — у нас!'); } } else S.hold = Math.max(0, S.hold - dt * 2);
  const left = S.items.filter((it) => !it.done), go = left[0] ? left.slice().sort((a, b) => Math.hypot(a.x - R.x, a.z - R.z) - Math.hypot(b.x - R.x, b.z - R.z))[0] : S.exit;
  if (W.obj) { W.obj.x = go.x; W.obj.z = go.z; }
  $('wdObj').innerHTML = (left.length ? S.label + ': <b>' + S.got + ' из ' + S.items.length + '</b>' + (S.hold > 0 ? ' · сматываю ' + Math.round(S.hold / S.take * 100) + '%' : '') : '🚤 Уходи к лодке Лидии') + ' · 👁 <b style="color:' + (S.sus > 60 ? '#ff6a4a' : S.sus > 25 ? '#ffc04a' : '#9f9') + '">' + Math.round(S.sus) + '%</b> · тише едешь — дальше будешь';
  if (S.sus >= 100) { S.sus = 0; sfx('caught'); S.onCaught(); return; }
  if (!left.length && Math.hypot(S.exit.x - R.x, S.exit.z - R.z) < 12) { const f = S.onWin; W.stealthEnd4(); f(); } };

/* =====================================================================
   ГЛАВА 3 — по плану: таможня (выбор) → город → слежка за фургоном → тир у кратера-смайлика → фото Лица → настройка антенн → Зурга
   ===================================================================== */
(function ch3() { const S = A.CHAPTERS[3]; if (!S) return; const mu = S.find((s) => s.id === 'museum'), fa = S.find((s) => s.id === 'face'), an = S.find((s) => s.id === 'antennas'); if (!mu || !fa || !an) return;
  function van() { let mesh; if (MODELS.spacetruck || MODELS.k_rover) { const b = new Builder([]); b.add(MODELS.spacetruck || MODELS.k_rover, mat(0, 0, 0, 5, 5, 5), null, { vcol: true, vk: 0.9 }); mesh = new THREE.Mesh(b.build(), bakedMat); } else mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 6), new THREE.MeshLambertMaterial({ color: '#4a6a8a' })); const g = new THREE.Group(); g.add(mesh); const sp = emojiSprite('🥕', 2.4); sp.position.y = 5; g.add(sp); return g; }
  mu.onArrive = function () { W.talk([['tanya', 'Здравствуйте. Это мой огород. Верните, пожалуйста.'], ['pip', 'Смотритель говорит: «Экспонат упал с неба — значит, подарок».'], ['ksar', '<b>Ксар-ФМ</b>: Ограбление в Музее землян! Фургон с огородом уходит!'], ['pip', 'Не стреляй! Проследим — узнаем, кто заказчик. Держись подальше, а когда водитель оглядывается 👀 — замри.']], () => run()); };
  function run() { const m = byId('museum'); W.tail4({ label: 'Фургон похитителей', path: [[m.x + 10, m.z - 10], [-120, 200], [-200, 150], [-290, 30], [-380, -80]], sp: 8, see: 55, near: 20, far: 100, lostMax: 7, mesh: van,
      onWin() { W.give('money', 600); W.give('parts', 3); W.talk([['tanya', 'Остановились у кратера-смайлика. Открываю… А где огород?! Тут только пугало. В моём халате. И записка.'], ['none', '<i>«Огород — у меня. Хотите обратно — сначала помойте мой портрет в Кидонии. Тёща Зурга.»</i>'], ['pip', 'Ой! Клопы лезут грызть смайлик — это гордость Ксар-Талы! Там есть вышка — защищай с неё!']], () => A.adv()); },
      onFail(why) { W.talk([['pip', why === 'seen' ? 'Водитель нас заметил и вернулся к музею! Ждём, пока поедет снова.' : 'Потеряли! Он опять у музея — пробуй ещё.']], () => run()); } }); A.setObj('Следи за фургоном', m); }
  mu.tick = (dt) => W.tl4 && W.tailStep4(dt);
  const smile = { id: 'smile3', start() { A.setObj('Кратер-смайлик: вышка', byId('smile')); }, arrive: 'smile',
    onArrive() { W.talk([['pip', 'Кратер-смайлик настоящий — на Марсе есть кратер Галле, он улыбается! Клопы лезут грызть «зубы». Заезжай на вышку: клопы прячутся за куполами, бей, когда грызут.']], () => run2()); } };
  function run2() { const c = byId('smile'), y = W.H(c.x, c.z); if (!W.tw3m) { const g = new THREE.Group(); for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.4, 0.8), new THREE.MeshLambertMaterial({ color: '#8a6a5a' })); l.position.set(c.x + dx, y + 3.2, c.z + dz); g.add(l); } const pl = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 11), new THREE.MeshLambertMaterial({ color: '#d8a43a' })); pl.position.set(c.x, y + 6.2, c.z); g.add(pl);
      for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.4, x = c.x + Math.sin(a) * 24, z = c.z + Math.cos(a) * 24, d = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.55 })); d.position.set(x, W.H(x, z), z); g.add(d); } W.scene.add(g); W.tw3m = g; }
    W.tower4({ x: c.x, z: c.z, y: y + 7, type: 'bug', waves: [4, 5, 7], drill: 2, hpK: 1.5, label: 'Смайлик', cover: [0, 1, 2, 3].map((k) => ({ x: c.x + Math.sin(k * 1.571 + 0.4) * 24, z: c.z + Math.cos(k * 1.571 + 0.4) * 24 })),
      onWin() { W.give('money', 900); W.give('ammo', 60); W.talk([['ksar', '<b>Ксар-ФМ</b>: Смайлик спасён! Город улыбается!'], ['ded', 'Портрет — это, видать, то Лицо на холме. Таня, бери фотоаппарат: Зурга хочет новый снимок для музея.']], () => A.adv()); },
      onFail() { W.talk([['pip', 'Смайлик погрызли… Марсиане подрисовали. Давай ещё раз!']], () => run2()); } }); A.setObj('Защити смайлик с вышки', c); }
  smile.tick = (dt) => W.tw4 && W.towerStep4(dt);
  clear4.push(() => { if (W.tw3m) { W.scene.remove(W.tw3m); W.tw3m = null; } });
  fa.talkFace = function () { W.talk([['pip', 'Лицо Кидонии. Земляне сфотографировали его в 1976-м и спорили 25 лет: лицо это или просто холм. Мы, марсиане, знаем — это тёща Зурга.'], ['pip', 'Зурге нужен портрет: глаза, нос, рот и бровь. Солнце садится — успей, пока светло!']], () => run3()); };
  function run3() { const F = W.FACE, k = 1.3; W.photo4({ need: 4, time: 150, tg: [[-34, -34, '👁', 'Левый глаз'], [34, -34, '👁', 'Правый глаз'], [0, -14, '👃', 'Нос'], [0, 22, '👄', 'Рот'], [-34, -64, '〰', 'Бровь (с клопами)']].map(([dx, dz, e, name]) => ({ x: F.x + dx * k, z: F.z + dz * k, e, name, y: 3 })),
      onWin() { W.give('parts', 2); W.talk([['tanya', 'Ваня… Это же ты. Нос твой. Брови твои. И рот такой, будто говорит: «Таня, где мои очки?»'], ['ded', 'Хм. На Марсе я раньше не бывал. Или бывал?.. В 1984-м был странный отпуск.'], ['pip', 'Это скандал. Тёща Зурга будет… очень… тёщей.'],
        { who: 'pip', text: 'Что скажем столице?', ch: [{ t: '🫖 «Это Зурга. Очень похожа!»', sub: '+300 ₽ от музея, Зурга довольна', fn() { W.give('money', 300); W.flags.zhappy = 1; } }, { t: '👴 «Это мой Ваня!»', sub: '+40 нервов; Зурга в ярости — но у неё будет на 1 зонтик меньше', fn() { W.nerve(40); W.flags.zangry = 1; } }] }], () => A.adv()); },
      onFail() { W.talk([['pip', 'Стемнело! Ждём утра… Утро на Марсе — через минуту, если очень попросить.']], () => run3()); } }); A.setObj('Сфотографируй Лицо: наведи, остановись, 📷', F); }
  fa.tick = (dt) => W.ph4 && W.photoStep4(dt);
  fa.start = function () { A.setObj('Лицо Кидонии: портрет для Зурги', byId('face')); };
  an.start = function () { W.talk([['gena', '<b>Марс-ФМ</b>: в эфире повторяется сигнал: три коротких, три длинных… Изобретатель Никола Тесла однажды поймал похожий сигнал и решил, что это привет с Марса!'], ['pip', 'Это старые антенны «Привет». Пульт настройки — у первой. Совмести волны всех трёх — узнаем, кто шлёт.']], () => A.setObj('Пульт антенн «Привет»', byId('ant1'))); };
  an.arrive = 'ant1'; an.onArrive = function () { run4(); };
  function run4() { W.tune4({ title: '📡 Антенны «Привет от Теслы»', rules: 'Подгони жёлтую волну к зелёной (частота и сила) для каждой из трёх антенн. Клопы грызут кабель — помехи растут!', n: 3, time: 45, bonus: 8, okSay: ['…Ва… ня…', '…ты… вы… клю…', '…чил… у… тюг…'] },
    () => { W.give('money', 500); W.give('fuel', 40); W.talk([['gena', '<b>Марс-ФМ</b>: Расшифровка сигнала: «Ваня. Ты. Выключил. Утюг?»'], ['ded', '…Таня. Я, кажется, не выключил. В 1984-м.'], ['pip', 'Сигнал идёт из дворца Зурги! Она подслушивает всё радио Марса. Едем пить чай. Тяжёлый будет чай.']], () => A.adv()); },
    () => W.talk([['pip', 'Клопы перегрызли кабель! Я скрутил изолентой — давай заново.']], () => run4())); }
  an.tick = () => {};
  S.splice(S.indexOf(fa), 0, smile);
})();

/* =====================================================================
   ГЛАВА 4 — по плану: пешком за гномом → штреки → плот гномов через море → кот Гоша + поющие кристаллы в гроте → червь
   ===================================================================== */
(function ch4() { const S = A.CHAPTERS[4]; if (!S) return; const di = S.findIndex((s) => s.id === 'descent'), se = S.findIndex((s) => s.id === 'sea'), go = S.find((s) => s.id === 'gosha'); if (di < 0 || se < 0 || !go) return;
  const foot = { id: 'foot4', start() { A.setObj('Грибоград: тайник с картой штреков', byId('grib')); }, arrive: 'grib',
    onArrive() { W.talk([['moh', 'Карта штреков — в старом тайнике. Туда «Буханка» не пролезет: только пешком, за проводником. Не отставай — в темноте заблудишься!'], ['tanya', 'Ваня, сторожи машину. Я с фонариком.']], () => run()); } };
  function run() { const P = [[-215, -175], [-170, -150], [-140, -130], [-110, -100], [-80, -75], [-60, -60]]; const g = { x: 0, z: 0, i: 0, sp: emojiSprite('🧔', 2.6), far: 0 }; W.scene.add(g.sp);
    W.foot4({ label: 'За гномом-проводником 🧔', goal: { x: P[P.length - 1][0], z: P[P.length - 1][1] }, goalE: '🗺', spots: [], drain: 0, noWarm: 1,
      extra(dt, F) { if (!g.init) { g.init = 1; g.x = R.x + 5; g.z = R.z + 5; } const d = Math.hypot(g.x - R.x, g.z - R.z), tg = P[g.i]; if (tg && d < 16) { const tx = tg[0] - g.x, tz = tg[1] - g.z, tl = Math.hypot(tx, tz); if (tl < 1) g.i++; else { g.x += tx / tl * 4.2 * dt; g.z += tz / tl * 4.2 * dt; } }
        g.sp.position.set(g.x, W.H(g.x, g.z) + 1.6 + Math.abs(Math.sin(W.t * 7)) * 0.3, g.z); g.far = d > 32 ? g.far + dt : 0; if (W.obj) { W.obj.x = g.x; W.obj.z = g.z; }
        $('wdObj').innerHTML = '🧔 Иди за гномом: <b>' + Math.round(d) + ' м</b>' + (g.far > 0 ? ' · <b style="color:#ff6a4a">теряешь его! ' + Math.ceil(8 - g.far) + ' с</b>' : ' · не отставай, в темноте легко заблудиться'); if (g.far > 8) F.dead = 1; },
      onWin() { W.scene.remove(g.sp); W.give('money', 600); W.give('parts', 2); W.talk([['moh', 'Карта штреков! Теперь знаем, где наши застряли.'], ['moh', 'В штреках «Глубинной-3» остались четверо. Своды трещат. Вытащите их и вагонетки с рудой — и мы покажем дорогу к червю.']], () => A.adv()); },
      onFail() { W.scene.remove(g.sp); W.talk([['gosha', 'Мяу! (Гоша нашёл бабулю по запаху пирожков и привёл к «Буханке».)'], ['moh', 'Заблудилась? Бывает. Проводник подождёт — держись ближе.']], () => run()); } });
    A.setObj('Иди пешком за гномом 🧔', g); }
  foot.tick = (dt) => W.ft4 && W.footStep4(dt);
  // описание спуска: последняя реплика теперь ведёт в тайник, а не в штреки
  const raft = { id: 'raft4', start() { A.setObj('Причал гномов на Подземном море', byId('dock4')); }, arrive: 'dock4',
    onArrive() { W.talk([['moh', 'Плот с семьями гномов — к маяку на острове. Плот медленный, а акулы кусают канаты. «Буханка» плавает — плыви рядом и отгоняй!'], ['ded', 'Таня, я как конвой. Только с солью.']], () => run2()); } };
  function run2() { raftEnd(); const d = byId('dock4'), is = byId('island'), m = new THREE.Group(); const deck = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 6), new THREE.MeshLambertMaterial({ color: '#8a5a30' })); m.add(deck); const sp = emojiSprite('🧔🧔🧔', 3); sp.position.y = 2.2; m.add(sp); W.scene.add(m);
    W.raft4 = { m, x: d.x, z: d.z, hp: 100, tx: is.x - 20, tz: is.z, st: 3 }; W.calm = 1; W.st.fuel = Math.max(W.st.fuel, 70); W.toast('⛽ Гномы залили бочку топлива'); A.setObj('Сопроводи плот гномов к маяку', is); }
  function raftEnd() { if (W.raft4) { W.scene.remove(W.raft4.m); W.EN.forEach((e) => { if (e.raftB) e.dead = true; }); W.raft4 = null; W.calm = 0; } }
  clear4.push(raftEnd);
  function biteAI(e, dt) { const F = W.raft4; if (!F) { e.dead = true; return; } const dx = F.x - e.x, dz = F.z - e.z, d = Math.hypot(dx, dz) || 1; e.vx = e.vz = 0; if (d > 5) { e.x += dx / d * e.t.sp * 0.9 * dt; e.z += dz / d * e.t.sp * 0.9 * dt; e.h = Math.atan2(dx, dz); } else { F.hp -= dt * 3.2; if (Math.random() < dt * 2) burst(W.scene, F.x, -1.5, F.z, 'smoke', '#bfefff', 2, 0.4); } }
  raft.tick = function (dt) { const F = W.raft4; if (!F) return; const dx = F.tx - F.x, dz = F.tz - F.z, dl = Math.hypot(dx, dz); const bit = W.EN.some((e) => !e.dead && e.raftB && Math.hypot(e.x - F.x, e.z - F.z) < 6);
    if (dl > 2 && !bit) { F.x += dx / dl * 3.4 * dt; F.z += dz / dl * 3.4 * dt; } F.m.position.set(F.x, -2.6 + Math.sin(W.t * 2) * 0.15, F.z); F.m.rotation.y = Math.atan2(dx, dz);
    F.st -= dt; if (F.st <= 0 && dl > 25) { F.st = rnd(3, 4.2); for (let k = 0; k < 2; k++) { const a = rnd(0, 6.28); W.spawn(Math.random() < 0.7 ? 'gshark' : 'catf', F.x + Math.sin(a) * 32, F.z + Math.cos(a) * 32, { keep: 1, raftB: 1, ai: biteAI, hpK: A.bossK() * 0.7 }); } }
    if (W.obj) { const sh = W.EN.filter((e) => !e.dead && e.raftB).sort((a, b) => Math.hypot(a.x - F.x, a.z - F.z) - Math.hypot(b.x - F.x, b.z - F.z))[0]; const t = sh && Math.hypot(sh.x - F.x, sh.z - F.z) < 30 ? sh : F; W.obj.x = t.x; W.obj.z = t.z; }
    $('wdObj').innerHTML = '🛶 Плот: <b style="color:' + (F.hp < 35 ? '#ff6a4a' : '#9f9') + '">' + Math.round(F.hp) + '%</b> · до маяка ' + Math.round(dl) + ' м' + (bit ? ' · <b>акула грызёт канат — отгони!</b>' : '');
    if (dl <= 2) { raftEnd(); W.give('money', 900); W.talk([['moh', 'Доплыли! Семьи на острове. Спасибо, бабушка!'], ['pip', 'Старый маяк. Тут журнал смотрителя: «Червь боится света. Любит картошку. Главный тоннель к нему завален».'], ['gosha', 'Мяу. (Гоша нюхает воздух. Гоша что-то знает. Гоша уже на том берегу.)']], () => A.adv()); }
    else if (F.hp <= 0) { raftEnd(); W.talk([['moh', 'Плот развалился! Гномы на брёвнах доплыли обратно. Новый плот готов — давай снова, акул отгоняй раньше.']], () => run2()); } };
  // кот Гоша: в гроте кристаллы поют — повтори мелодию, иначе проход не откроется
  const gt = go.tick; go.tick = function (dt) { const c = W.cat; if (c && !c.sang && Math.hypot(c.x - 430, c.z + 330) < 24) { c.sang = 1; R.v = 0; W.talk([['pip', 'Поющие кристаллы! Проход откроется, если повторить их мелодию.'], ['tanya', 'Я в хоре пела. В 1974 году. Помню всё.']], () => sing()); return; } if (c && c.sang === 1) return; gt.call(this, dt); };
  function sing() { W.simon4({ title: '💎 Поющие кристаллы', rules: 'Кристаллы звенят по очереди — повтори мелодию. Каждый раз она длиннее.', keys: ['💎 до', '🔷 ре', '🔶 ми', '🟣 фа', '🟢 соль', '🔴 ля'], len0: 3, rounds: 3, ms: 680, dms: 60, minMs: 420, maxErr: 3, who: 'Кристаллы', alarm: 'Кристаллы обиделись и замолчали' },
    () => { W.cat.sang = 2; W.give('money', 700); W.toast('💎 Проход в кристаллах открылся!'); }, () => W.talk([['ded', 'Таня, фальшиво. Давай ещё раз — кристаллы терпеливые.']], () => sing())); }
  S.splice(di + 1, 0, foot); S.splice(S.findIndex((s) => s.id === 'sea'), 1, raft);
})();

/* =====================================================================
   ГЛАВА 5 — по плану: торг с профсоюзом медведей → хоккей → заслонки гейзеров → таран спящих медведей → спираль → дракон
   ===================================================================== */
(function ch5() { const S = A.CHAPTERS[5]; if (!S) return; const ar = S.find((s) => s.id === 'arrive'), gy = S.find((s) => s.id === 'geyser'), au = S.find((s) => s.id === 'aurora'); if (!ar || !gy || !au) return;
  ar.onArrive = function () { W.st.fuel = 100; W.give('food', 3); W.toast('⛽ Полярники заправили полный бак и дали пирожков'); W.talk([['potap', 'Профсоюз медведей Северной шапки приветствует! Лёд — наш. Хотите воды — платите: 40 банок варенья.'], ['tanya', 'Михал Потапыч?! Это ты у меня с дачи варенье унёс?!'], ['potap', 'Было дело. Вкусное. Потому и сорок. Торгуйтесь — профсоюз уважает торг.']], () => run()); };
  function run() { W.trade4({ title: '🐻‍❄️ Торг с профсоюзом медведей', icon: '🐻‍❄️🫙', price: 40, patience: 3, hello: 'Потапыч: «Сорок банок. Или хоккей — если смелые»', rules: 'Цена — в банках варенья (это патроны деда 🧂). Сбивай цену, следи за терпением ❤. Или вызови медведей на хоккей.',
      acts: (o) => [
        { t: '📉 Тридцать — и по рукам', fn() { o.pat--; if (Math.random() < 0.65) { o.price = Math.max(10, o.price - 8); return 'Потапыч: «Ладно, ' + o.price + '. Профсоюз недоволен»'; } return 'Потапыч: «Р-р-р. Нет»'; } },
        { t: '📜 Стихи деда о медведях', fn() { if (o.poem) { o.pat--; return 'Потапыч: «Второй раз не так трогательно»'; } o.poem = 1; o.price = Math.max(10, o.price - 10); return 'Дед читает… Потапыч прослезился: −10'; } },
        { t: '🥟 Пирожки профсоюзу', fn() { if (W.st.food < 2) return 'Пирожков мало'; W.st.food -= 2; o.price = Math.max(10, o.price - 6); o.pat = Math.min(3, o.pat + 1); return 'Медведи жуют: −6, подобрели'; } },
        { t: '🏒 «Сыграем в хоккей!»', fn() { o.done = 1; W.flags.hockey = 1; setTimeout(() => o.win('hockey'), 700); return 'Потапыч: «Хоккей?! Ха! Кратер Королёв, 90 секунд»'; } },
        { t: '🫙 По рукам', fn() { if (W.st.ammo < o.price) return 'Банок не хватает'; W.st.ammo -= o.price; o.done = 1; W.flags.peace = 1; W.flags.paid = 1; setTimeout(() => o.win('paid'), 700); return 'Потапыч: «Договор! Медведи — друзья»'; } }] },
    () => A.adv(), () => W.talk([['potap', 'Профсоюз ушёл на перерыв! …Вернулся. Начнём сначала.']], () => run())); }
  gy.onArrive = function () { W.talk([['pip', 'Под льдом — газ. Весной он бьёт гейзерами и подбрасывает всё, что сверху. Перекрой заслонки так, чтобы всё давление ушло под «Буханку»!'], ['ded', 'Таня, это водопровод. Я в нём сорок лет. Только трубы тут живые.']], () => run2()); };
  function run2() { W.dampers4({ title: '🌋 Заслонки гейзеров', rules: 'Закрытая заслонка гонит своё давление по трубе дальше — если там <b>открыто</b>. Если закрыто — «пшик», давление пропало. Собери всё под «Буханкой».', names: ['А', 'Б', 'В', 'Г'], hint: 'Пип: «Начинай с той, в которую ничего не ведёт»' },
    () => { burst(W.scene, R.x, R.y + 2, R.z, 'smoke', '#ffffff', 10, 1.5); R.vy = 26; R.air = 1; W.give('money', 800); W.give('food', 2); W.toast('❄ Подлетели к облакам — снег в тазу!');
      setTimeout(() => W.talk([['tanya', 'Ваня, мы летали! И снега полный таз. Это вода для огорода.'], ['pip', 'Дальше — перевал. Там медведи-хулиганы, которые не из профсоюза.']], () => A.adv()), 2500); },
    () => run2()); }
  gy.tick = () => {};
  au.onArrive = function () { const pts = []; for (let k = 0; k < 10; k++) { const t = 0.1 + (k / 10) * 0.8, x = 9 + (200 - 9) * t, z = -256 + (-300 + 256) * t, o = (k % 2 ? 1 : -1) * rnd(4, 12); pts.push([x + 0.219 * o, z + 0.976 * o]); }
    W.ram5 = { list: pts.map(([x, z]) => W.spawn('yeti', x, z, { keep: 1, hpK: 4 })).filter(Boolean), poem: 0, t: 0 }; W.calm = 1;
    W.talk([['potap', '<i>(по рации)</i> Это не наши! Хулиганы с перевала. Растолкайте их, пока спят!'], ['ded', 'Я буду читать стихи — они засыпают. Ты тарань. Между стихами у меня перерыв на вдох — они просыпаются!'], ['ded', '<i>«Над шапкой ледяной — сиянье…»</i>']], () => { W.sleepT = 14; W.ram5.t = 14; W.toast('💤 Уснули! Тарань с разгона!'); A.setObj('Растолкай 10 медведей-хулиганов тараном', { x: 100, z: -280 }); }); };
  au.tick = function (dt) { const Rm = W.ram5; if (!Rm) return; Rm.t -= dt; if (Rm.t <= 0) { if (W.sleepT > 0) return; Rm.poem++; Rm.t = 6 + 14; setTimeout(() => { if (!W.ram5) return; W.sleepT = 14; W.say('<b>Дед:</b> <i>' + pick(['«…Внизу — огород без воды…»', '«…Но если ты рядом, Танюша…»', '«…Мне не страшны никакие льды…»', '«…Медведь, усни, не буди Гошу…»']) + '</i>'); }, 6000); W.toast('⚠ Дед вдыхает — медведи просыпаются!'); }
    const left = Rm.list.filter((e) => !e.dead), n = left.length; const tg = left.sort((a, b) => Math.hypot(a.x - R.x, a.z - R.z) - Math.hypot(b.x - R.x, b.z - R.z))[0]; if (tg && W.obj) { W.obj.x = tg.x; W.obj.z = tg.z; }
    $('wdObj').innerHTML = '🐻 Медведи: <b>' + (10 - n) + ' из 10</b> · ' + (W.sleepT > 0 ? '💤 спят ещё <b>' + Math.ceil(W.sleepT) + ' с</b> — тарань!' : '⚠ <b>проснулись!</b> отъезжай, дед вдыхает');
    if (!n) { W.ram5 = null; W.calm = 0; W.give('money', 600); W.talk([['ded', 'Все растолканы! Спят в сугробе, как дети.'], ['pip', 'Вершина купола свободна. Оттуда — спуск по спирали.']], () => A.adv()); } };
  clear4.push(() => { if (W.ram5) { W.ram5.list.forEach((e) => (e.dead = true)); W.ram5 = null; } });
})();

/* =====================================================================
   ГЛАВА 6 — по плану: очередь справок (правила меняются) → фотосессия космотуриста → хвост кометы → воздушный бой на тарелке → флагман
   ===================================================================== */
(function ch6() { const S = A.CHAPTERS[6]; if (!S) return; const q6 = S.find((s) => s.id === 'queue'), wi = S.findIndex((s) => s.id === 'warehouse'); if (!q6 || wi < 0) return;
  q6.tick = () => {};
  q6.onArrive = function () { W.st.fuel = 100; W.toast('⛽ Диспетчер заправил полный бак (за справку)'); W.talk([['byuro', 'Бип. Очередь на взлёт, посадку, проход и существование. Справки выдаются в окошках по правилам. Правила висят на стене. Правила меняются.'], ['tanya', 'Ваня, держи пирожки, я пошла.']], () => run()); };
  function run() { W.docs4({ title: '🤖 Окошки космопорта', rules: 'Получи все справки. У каждой — условия (что нужно сначала). Робот может поменять правила посреди очереди!', maxErr: 3, changeAt: 2, hello: '🤖 «Следующий!»',
      docs: { pas: ['📄', 'паспорт'], med: ['🩺', 'медосмотр'], pie: ['🥟', 'справка о пирожках'], cat: ['🐱', 'справка на кота'], board: ['🎫', 'посадочный'] },
      dep: { pas: [], med: ['pas'], pie: ['pas'], cat: ['med'], board: ['med', 'cat', 'pie'] },
      change: (o) => (!o.have.cat && !o.have.pie ? ['cat', 'pie'] : !o.have.board ? ['board', 'pas'] : [null]) },
    () => { W.give('money', 400); W.talk([['byuro', 'Все справки собраны. Ой. Вы за огородом? Его погрузили на флагман в кратере Стикни. Вход — по пропуску пиратов.'], ['pip', 'Пропуск есть у космотуриста — он пиратский бухгалтер в отпуске. Сидит у старого маяка на западе и мечтает о фотографиях.']], () => A.adv()); },
    () => W.talk([['tanya', 'Ваня, они закрылись на обед! На три минуты. Это по-нашему.']], () => run())); }
  const tour = { id: 'tour6', start() { A.setObj('Старый маяк: космотурист', byId('tourist6')); }, arrive: 'tourist6',
    onArrive() { W.talk([['tourist', 'Я турист! Отпуск! А фото нет: мой дрон улетел. Снимите меня у четырёх красот Фобоса — дам пропуск. Только быстро: Фобос восходит на западе, и закат тут каждые четыре часа!'], ['ded', 'Таня, ты — фотограф. Я — штатив.']], () => run2()); } };
  function run2() { const t = byId('tourist6'); W.photo4({ need: 4, time: 140, tg: [{ x: t.x + 30, z: t.z + 10, e: '🤳', name: 'Турист у маяка', y: 2 }, { x: t.x - 25, z: t.z + 35, e: '🧍', name: 'Турист у кратера', y: 2 }, { x: t.x + 10, z: t.z - 40, e: '🙋', name: 'Турист с Марсом за спиной', y: 2 }, { x: t.x - 40, z: t.z - 15, e: '🕺', name: 'Турист в прыжке (тяжести нет!)', y: 5 }, { x: t.x + 45, z: t.z - 30, e: '🧘', name: 'Турист медитирует', y: 2 }],
      onWin() { W.give('money', 900); W.talk([['tourist', 'Шедевры! Вот пропуск: «Предъявитель сего — пират. Наверное». И ещё: над Фобосом комета! Ледяной хвост сыплет льдинками.'], ['gena', '<b>Марс-ФМ</b>: Это же чистая вода, бабушки! Ловите тазами!']], () => A.adv()); },
      onFail() { W.talk([['tourist', 'Закат! Ну вот… Подождём следующего восхода — он через пару часов. То есть через минуту. Фобос!']], () => run2()); } });
    A.setObj('Сфотографируй туриста у 4 красот: наведи, остановись, 📷', { x: t.x, z: t.z }); }
  tour.tick = (dt) => W.ph4 && W.photoStep4(dt);
  S.splice(wi, 1, tour);
  // тарелка: чистый воздушный бой — у картошки теперь нет задачи
  const sc = S.find((s) => s.id === 'saucer'); if (sc) { const oa = sc.onArrive, ot = sc.tick; sc.onArrive = oa;
    sc.tick = function (dt) { (W.pot6 || []).forEach((q) => { if (!q.done) { q.done = true; W.scene.remove(q.sp); } }); ot.call(this, dt); if (!W.pot6) return; const f = W.EN.filter((e) => !e.dead && e.fgt).sort((a, b) => Math.hypot(a.x - R.x, a.z - R.z) - Math.hypot(b.x - R.x, b.z - R.z))[0]; if (f && W.obj) { W.obj.x = f.x; W.obj.z = f.z; } $('wdObj').innerHTML = '🛸 Воздушный бой: ✈ сбито <b>' + Math.min(10, W.ftr) + ' из 10</b> · уходи от очередей, бей с хвоста'; }; }
})();

/* =====================================================================
   ГЛАВА 7 — по плану: пирожки на Арсии (готовка) → штурм Павлины (прожектор) → сборка двигателя и спуск → эвакуация → прыжок → Дух Олимпа
   ===================================================================== */
(function ch7() { const S = A.CHAPTERS[7]; if (!S) return; const a7 = S.find((s) => s.id === 'arsia'), p7 = S.find((s) => s.id === 'pavonis'), s7 = S.find((s) => s.id === 'ascraeus'); if (!a7 || !p7 || !s7) return;
  a7.tick = () => { if (W.st.fuel < 25) W.st.fuel = 25; if (W.cans7) { W.cans7.forEach((q) => !q.done && W.scene.remove(q.sp)); W.cans7 = null; } };
  a7.onArrive = function () { W.give('fuel', 60); W.talk([['babka2', 'Пирожки! Только печь некому: руки трясутся, вулкан трясётся. Внученька, напеки сама — рецепт покажу один раз.'], ['ded', 'Таня, это экзамен. Я в тебя верю. И я голодный.']], () => run()); };
  function run() { W.cook4({ title: '🥟 Пирожки бабушки с Арсии', rules: 'Запомни рецепт, положи всё по порядку, потом вынимай противни, когда пирожки <b>золотистые</b>.', showT: 4.5, maxErr: 2, hint: 'Сначала тесто, потом начинка!',
      recipe: [['🥚', 'яйцо'], ['🥛', 'молоко'], ['🌾', 'мука'], ['🧈', 'масло'], ['🥔', 'картошка']], extra: [['🧂', 'соль деда'], ['🐟', 'рыба Гоши'], ['🌶', 'перец']], bake: [0.16, 0.24], batches: 3, need: 2 },
    () => { W.give('food', 4); W.give('money', 600); W.talk([['babka2', 'Ох, лучше моих! Бензин — к пирожкам бесплатно. Дальше — гора Павлина: там пираты засели, и у них прожектор.']], () => A.adv()); },
    (why) => W.talk([['babka2', why === 'oven' ? 'Подгорели… Ничего, тесто ещё есть — давай снова.' : 'Перепутала! Смотри ещё раз.']], () => run())); }
  const po = p7.onArrive; p7.onArrive = function () { po.call(this); const pv = byId('pavonis'); (W.gar7 || []).forEach((e) => { e.immune = true; e.immMsg = '💡 прожектор слепит — выключи генератор 🔦'; });
    W.spot4({ x: pv.x, z: pv.z, L: 60, spd: 0.9, dmg: 5, gx: pv.x + 52, gz: pv.z - 30, onOff() { (W.gar7 || []).forEach((e) => (e.immune = false)); W.toast('🔦 Прожектор погас! Турели ослепли — бей!'); } });
    W.say && W.say('<b>Пип:</b> Прожектор наводит снайперов. Сначала выключи генератор 🔦 — постой у него две секунды!'); };
  const pt = p7.tick; p7.tick = function (dt) { if (W.sp4) { W.spotStep4(dt); if (W.obj && !W.paused) { W.obj.x = W.sp4.gx; W.obj.z = W.sp4.gz; } $('wdObj').innerHTML = '🔦 Выключи прожектор: постой у генератора' + (W.sp4 && W.sp4.hold > 0 ? ' · ' + Math.round(W.sp4.hold / 2 * 100) + '%' : '') + ' · в луче — по тебе стреляют'; return; } pt.call(this, dt); };
  s7.onArrive = function () { W.talk([['babka2', 'Пирожки! И ракетный двигатель — вчерашний, в разобранном виде. Чертёж — вот. Собирай, а Гоша поможет… или помешает.']], () => run3()); };
  function run3() { W.assemble4({ title: '🚀 Сборка ракетного двигателя', rules: 'На каждом шаге чертёж называет деталь — выбери именно её. Детали похожи! Гоша иногда подсовывает своё.', maxErr: 2, gosha: 0.4, goshaItem: '🐟 «деталь» от Гоши', okSay: ['Встала как родная', 'Дед: «Затянул!»', 'Щёлк!'],
      parts: [{ need: 'Сопло большое Ø3', ok: 'Сопло Ø3', bad: ['Сопло Ø2', 'Воронка'], e: '🔻' }, { need: 'Камера сгорания, двойная стенка', ok: 'Камера двойная', bad: ['Камера одинарная', 'Кастрюля'], e: '🛢' },
        { need: 'Насос топлива — синий', ok: 'Насос синий', bad: ['Насос красный', 'Насос от самовара'], e: '🔵' }, { need: 'Бак на 40 литров', ok: 'Бак 40 л', bad: ['Бак 4 л', 'Бак 400 л'], e: '⛽' }, { need: 'Обтекатель — острый', ok: 'Обтекатель острый', bad: ['Обтекатель тупой', 'Ведро'], e: '🔺' }] },
    () => { W.flags.rocket = 1; W.nobrake = 30; W.give('parts', 4); W.toast('🚀 Ракетный двигатель! Тормоза — сняты на 30 секунд'); W.talk([['babka2', 'Ракета стоит! Только тормоза пришлось снять — места не хватило. Вниз — с ветерком!']], () => { A.setObj('Спуск без тормозов — в посёлок «Подножье»', byId('village')); A.adv(); }); },
    () => W.talk([['ded', 'Таня, у нас лишние детали. Это плохой знак. Разбираем и заново.']], () => run3())); }
})();

/* =====================================================================
   ГЛАВА 8 — по плану: шлюзы соляной шахты (переключатели) → гонка → торг с гномом → оборона купола с заграждениями → Толян
   ===================================================================== */
(function ch8() { const S = A.CHAPTERS[8]; if (!S) return; const si = S.findIndex((s) => s.id === 'salt'), ai = S.findIndex((s) => s.id === 'ahuna'), mi = S.findIndex((s) => s.id === 'storm'), ri = S.findIndex((s) => s.id === 'rig'); if (si < 0 || ai < 0 || mi < 0 || ri < 0) return;
  const salt = { id: 'valves8', start() { A.setObj('Кратер Оккатор: соляная шахта гномов', byId('occator')); }, arrive: 'occator',
    onArrive() { W.talk([['pip', 'Яркие пятна Оккатора — это соль: она поднялась из-под земли с водой и осталась, когда вода испарилась.'], ['moh', '<i>(по рации)</i> Шлюзы соляной шахты заело! Пять вентилей по кругу, крутишь один — соседи тоже крутятся. Открой все, пока рассол не затопил штрек.'], ['ded', 'Таня, это как краны на даче. Только кран пять, и все хулиганы.']], () => run()); } };
  function run() { W.valves4({ title: '🔧 Шлюзы соляной шахты', rules: 'Нажатие поворачивает вентиль <b>и двух соседей</b> (по кругу). Открой все 🟢 не больше чем за <b>8 ходов</b>.', n: 5, scramble: 3, max: 8, hint: 'Гном Мох: «Ищи, где два красных рядом — крути между ними»', okSay: 'Шлюзы открыты! Рассол ушёл', failSay: 'Рассол прибывает! Гномы откачают — пробуй заново' },
    () => { const sw = W.WEAP.salt; if (sw.lv < 5) sw.lv++; else W.PERK.salt.lv = Math.min(W.PERK.salt.max, W.PERK.salt.lv + 1); W.give('ammo', 120); W.toast('🧂 Соль Цереры: солевой дробовик сильнее!');
      W.talk([['moh', 'Шахта дышит! Бери соль — сколько унесёшь.'], ['kolyan', '<i>(подлетает на гоночном байке)</i> Бабка! Опять ты! Спорим, до горы Ахуна я тебя сделаю? На тарелке — слабо?'], ['tanya', 'Колян, я на тарелке летала, когда ты ещё под стол пешком ходил.'], ['pip', 'Гномы залатали тарелку. Немножко. Хватит на гонку.']], () => A.adv()); },
    () => run()); }
  const trade = { id: 'trade8', start() { A.setObj('Гора Ахуна: гном-старатель со льдом', byId('ahuna')); }, arrive: 'ahuna',
    onArrive() { W.talk([['pip', 'Ахуна — ледяной вулкан: вместо лавы из него выдавливается солёный лёд. Тарелке нужен лёд как топливо.'], ['gnome', 'Лёд? Есть лёд. Чистейший, вулканический. Дорого. Торгуемся?']], () => run2()); } };
  function run2(ang) { const base = ang ? 3600 : 3000;
    W.trade4({ title: '⛏ Торг с гномом-старателем', icon: '🧊⛏', price: base, patience: 3, hello: ang ? 'Гном (обиженно): «Опять вы. Теперь дороже!»' : 'Гном: «Три тыщи — и лёд ваш. Ну или удивите меня»', rules: 'Сбивай цену, но следи за терпением ❤. Кончится — гном уйдёт. Обмануть можно… но гномы всё помнят.',
      acts: (o) => [
        { t: '📉 Давай дешевле', fn() { o.pat--; if (Math.random() < 0.7) { o.price = Math.max(800, o.price - 500); return 'Гном: «Ладно… ' + o.price + '. Но ты меня утомляешь»'; } return 'Гном: «Нет!» (терпение тает)'; } },
        { t: '🥟 Пирожок в придачу', fn() { if (W.st.food < 1) return 'Пирожков нет 😢'; W.st.food--; o.pat = Math.min(3, o.pat + 1); o.price = Math.max(800, o.price - 300); return 'Гном жуёт: «М-м… −300. И я подобрел»'; } },
        { t: '🧔 Похвалить бороду', fn() { if (o.beard) { o.pat--; return 'Гном: «Ты уже говорила» (терпение тает)'; } o.beard = 1; o.price = Math.max(800, o.price - 400); return 'Гном краснеет: «Правда? −400»'; } },
        { t: '🧂 Подсунуть «кристаллы» из соли', fn() { o.done = 1; W.flags.gnomeCheat = 1; W.flags.gnomeHelp = 0; setTimeout(() => o.win('cheat'), 900); return 'Гном: «О, кристаллы! Беру!» (он ещё не знает, что это соль)'; } },
        { t: '🤝 По рукам', fn() { if (W.st.money < o.price) { return 'Денег не хватает: ' + W.st.money + ' ₽'; } W.st.money -= o.price; o.done = 1; W.flags.gnomeHelp = 1; W.flags.gnomeCheat = 0; setTimeout(() => o.win('fair'), 700); return 'Гном: «Честная сделка! Гномы такое помнят»'; } }] },
      (how) => { W.give('fuel', 100); W.talk(how === 'cheat' ? [['tanya', 'Ваня, мне стыдно. Немножко.'], ['ded', 'Таня, это была очень хорошая соль.'], ['pip', 'Гномы узнают… Помощи от них теперь не жди.'], ['moh', '<i>(по рации)</i> Над шахтой метеоритный шторм! Твари лезут к куполу!']] : [['gnome', 'Ты честная бабка. Позовёшь — гномы придут с кирками.'], ['moh', '<i>(по рации)</i> Над шахтой метеоритный шторм! Твари лезут к куполу! Ящики у ворот — ставь заграждения!']], () => A.adv()); },
      () => W.talk([['gnome', 'Всё! Ухожу! …Ладно, вернулся. Но теперь дороже.']], () => run2(1))); }
  const def = { id: 'def8', start() { A.setObj('Шахта «Ледяная»: защити купол', byId('mine')); }, arrive: 'mine',
    onArrive() { W.talk([['moh', 'Твари проснулись от тряски и лезут к куполу! Между волнами ставь ящики на жёлтых кругах — пока грызут ящик, бей их.']], () => run3()); } };
  function run3() { const m = byId('mine'), g = { x: m.x, z: m.z }, slots = [], spawns = []; [[1, 0.3], [-0.2, 1], [0.7, -0.8]].forEach(([ax, az]) => { const l = Math.hypot(ax, az); ax /= l; az /= l; slots.push({ x: g.x + ax * 24, z: g.z + az * 24 }, { x: g.x + ax * 46, z: g.z + az * 46 }); spawns.push([g.x + ax * 95, g.z + az * 95]); });
    W.def4({ gate: g, slots, spawns, waves: [5, 7, 9], per: 2, build: 13, type: 'jumper', chew: 14, bite: 4, hpK: 3, label: '⛏ Купол',
      onWin() { W.give('money', 1200); W.give('parts', 4); W.talk([['moh', 'Отбились! Купол цел! Бабушка, вы — почётный гном. Борода выдаётся отдельно.'], ['pip', 'А теперь — Толян. Его камнедробилка ловит глыбы лучом… и марсоходы тоже.']], () => A.adv()); },
      onFail() { W.talk([['moh', 'Купол пробили! Гномы залатали — давай заново, ящики ставь, откуда лезут.']], () => run3()); } }); A.setObj('Ставь заграждения 🧱 на жёлтых кругах', g); }
  def.tick = (dt) => W.df4 && W.defStep4(dt);
  // Толян: честная сделка — гномы помогают кирками
  const rig = S[ri], rt = rig.tick; rig.tick = function (dt) { rt && rt.call(this, dt); const G = W.boss; if (!G || G.dead) return; if (!G.gn) { G.gn = 1; G.gt = 10; if (W.flags.gnomeHelp) W.toast('⛏ Гномы пришли на помощь!'); else if (W.flags.gnomeCheat) W.toast('🧂 Гномы узнали про соль и не пришли…'); }
    if (W.flags.gnomeHelp && !W.paused) { G.gt -= dt; if (G.gt <= 0) { G.gt = 12; const tg = (G.parts || []).find((q) => !q.dead) || (G.immune ? null : G); if (tg) { W.hitEnemy(tg, tg.max * 0.12); burst(W.scene, tg.x, (tg.y || 0) + 3, tg.z, 'spark', '#ffd24a', 4, 0.6); W.toast('⛏ Гномы ударили кирками!'); } } } };
  S.splice(si, 1, salt); S.splice(S.findIndex((s) => s.id === 'ahuna'), 1, trade); S.splice(S.findIndex((s) => s.id === 'storm'), 1, def);
})();

/* =====================================================================
   ГЛАВА 9 — по плану: заплатки на ветру (повтори) → песня для семян (ритм) → слежка за курьером → погоня за газовозом → Зина
   ===================================================================== */
(function ch9() { const S = A.CHAPTERS[9]; if (!S) return; const si = S.findIndex((s) => s.id === 'seeds'), ci = S.findIndex((s) => s.id === 'chase'); if (si < 0 || ci < 0) return;
  W.patch9 = function (q) { if (q.busy || W.mini.cur()) return; q.busy = 1; R.v = 0; const n = W.leak9.filter((x) => x.done).length;
    W.simon4({ title: '🩹 Заплатка на шар ' + (n + 1) + ' из 5', rules: 'Дед клеит заплатку слоями: повтори порядок цветов. <b>Порыв ветра</b> может сорвать заплатку — тогда этот шар заново.', keys: ['🟥', '🟨', '🟩', '🟦', '⬜', '🟪'], len0: 3 + Math.min(2, n), rounds: 1, ms: 650, dms: 0, minMs: 400, maxErr: 3, gust: 0.12, who: 'Дед', alarm: 'Заплатка не держится! Подлети ещё раз' },
      () => { q.done = true; W.scene.remove(q.sp); sfx('j_found'); W.toast('🩹 Шар залатан!'); },
      () => { q.busy = 0; const a = Math.atan2(R.x - q.x, R.z - q.z); R.x = q.x + Math.sin(a) * 14; R.z = q.z + Math.cos(a) * 14; }); };
  const seeds = S[si]; seeds.onArrive = function () { W.talk([['varya', 'Я садовница Варя. Мамаша Зина украла газ из садов — семена завяли в облачных грядках.'], ['varya', 'Венерианские семена растут под песню. Пою я — а вы поливайте в такт! Мимо такта — семечко обижается.'], ['tanya', 'Петь и поливать — это я с молодости умею.']], () => run()); };
  function run() { W.rhythm4({ title: '🌱 Песня для семян', icon: '🌱', btn: '💧 Полить', rules: 'Варя поёт, бегунок ходит в такт. Жми «💧 Полить», когда он в <b>зелёной</b> зоне. 10 поливов — и сад взойдёт.', need: 10, maxMiss: 4, z0: 0.26, zMin: 0.13, dz: 0.012, sp: 0.75, dsp: 0.05, okSay: ['Росток!', 'Варя: «Ля-ля-ля!»', 'Листик развернулся', 'Гоша нюхает цветок'], missSay: '❌ Мимо такта — семечко надулось' },
    () => { W.give('food', 4); W.give('ammo', 60); W.nerve(30); W.talk([['varya', 'Взошло! Картошка в облаках! Спасибо, бабушка!'], ['pip', 'А на Причале дирижаблей замечен курьер Зины. Проследим — найдём, где она прячет газ. Только не спугни!']], () => A.adv()); },
    () => W.talk([['varya', 'Семена обиделись… Ничего, начнём песню сначала.']], () => run())); }
  seeds.tick = () => {};
  const tail = { id: 'tail9', start() { A.setObj('Причал дирижаблей: курьер Зины', byId('port')); }, arrive: 'port',
    onArrive() { W.talk([['pip', 'Вон курьер с баллонами. Едь следом, но не близко. Когда он оглядывается 👀 — замри: на мосту не спрячешься.'], ['ded', 'Таня, как в кино про шпионов. Я — в шляпе.']], () => run2()); } };
  function courier() { let mesh; if (MODELS.k_rover) { const b = new Builder([]); b.add(MODELS.k_rover, mat(0, 0, 0, 4.5, 4.5, 4.5), null, { vcol: true, vk: 0.8 }); mesh = new THREE.Mesh(b.build(), bakedMat); } else mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 5), new THREE.MeshLambertMaterial({ color: '#6a4a8a' })); const g = new THREE.Group(); g.add(mesh); const sp = emojiSprite('🎈', 2.4); sp.position.y = 5; g.add(sp); return g; }
  function run2() { const pt = byId('port'), m = byId('meteo'); R.x = pt.x - 10; R.z = pt.z - 10; R.y = W.H(R.x, R.z); R.v = 0;
    W.tail4({ label: 'Курьер Зины', path: [[pt.x - 30, pt.z - 25], [0, 0], [m.x, m.z]], sp: 8.5, see: 60, near: 22, far: 110, lostMax: 6, mesh: courier,
      onWin() { W.give('money', 1200); W.give('parts', 4); W.talk([['pip', 'Курьер привёл на метеостанцию! Там газовоз пиратов — он перекачивает газ Аэрограда.'], ['ded', 'Таня, мы его выследили. Теперь — догнать.']], () => A.adv()); },
      onFail(why) { W.talk([['pip', why === 'seen' ? 'Он нас заметил и удрал обратно на причал! Подождём, пока выедет снова.' : 'Потеряли! Он вернулся на причал. Ещё раз, ближе держись.']], () => run2()); } });
    A.setObj('Следи за курьером', { x: pt.x, z: pt.z }); }
  tail.tick = (dt) => W.tl4 && W.tailStep4(dt);
  S.splice(ci, 0, tail);
  // погоня начинается там, где закончилась слежка — метеостанция; переписываем «прибытие», чтобы не ждать
})();

/* =====================================================================
   ГЛАВА 10 — по плану: выбор с Аркадием → настройка антенн → рыбалка → охота на удильщика → бегство от трещины (от развилки) → Царь-рыба
   ===================================================================== */
(function ch10() { const S = A.CHAPTERS[10]; if (!S) return; const ai = S.findIndex((s) => s.id === 'antenna'), ri = S.findIndex((s) => s.id === 'run'); if (ai < 0 || ri < 0) return;
  const land = S[0]; land.onArrive = function () { W.st.fuel = 100; const fine = () => W.st.money >= 1500;
    W.talk([['arkady', 'Контролёр Аркадий. Предъявите билеты на пересадку до Сатурна.'], ['tanya', 'Сейчас, сейчас… Вот они… Гоша?!'], ['ded', 'Таня, Гоша доедает билеты. С аппетитом.'],
      { who: 'arkady', text: 'Без билетов — не положено. Штраф 1500 ₽. Или отработать: станции нужна рыба. Или… вы же с удочкой? Я люблю рыбу.', ch: [
        { t: '💸 Заплатить штраф 1500 ₽', sub: 'рыбалка обычная: 5 рыб', ok: fine, fn() { W.st.money -= 1500; W.flags.ark10 = 'fine'; } },
        { t: '🧹 Отработать на рыбалке', sub: 'Аркадий подсветит лунки: рыба дольше, но нужно 6', fn() { W.flags.ark10 = 'work'; } },
        { t: '🐟 «Договоримся рыбкой»', sub: 'Аркадий берёт 2 рыбы себе: нужно 7, зато +800 ₽ «за находчивость»', fn() { W.flags.ark10 = 'bribe'; W.give('money', 800); } }] },
      ['vnuki', 'Бабуль, мы с вами! Только Аркадию не говорите, что мы тоже без билетов.'], ['arkady', 'И ещё: буря с Юпитера сбила настройку антенн. Без связи — никак.']], () => A.adv()); };
  const fix = () => { const k = W.flags.ark10 || 'fine'; W.fishNeed10 = { fine: 5, work: 6, bribe: 7 }[k]; W.fishAt10 = k === 'work' ? 6 : 4.2; };
  const tune = { id: 'tune10', start() { A.setObj('Антенное поле', byId('antenna')); }, arrive: 'antenna',
    onArrive() { W.talk([['pip', 'Юпитер — как огромный магнит, он гонит волны радиации. Антенны сбились: совмести их волну с эталоном, пока не пришла следующая волна.'], ['ded', 'Таня, это как радио на даче крутить. Только радио — размером с дом.']], () => run()); } };
  function run() { W.tune4({ title: '📡 Настройка антенн', rules: 'Зелёная волна — эталон. Кнопками подгони свою жёлтую: <b>частоту</b> (чаще/реже) и <b>силу</b> (громче/тише). Совпало — держи секунду.', n: 3, time: 40, bonus: 8, okSay: ['Есть сигнал!', 'Сатурн на проводе!', 'Пип: «Чисто, как в Заречной»'] },
    () => { W.give('money', 900); W.give('ammo', 60); W.talk([['arkady', 'Связь есть! Сатурн на проводе: говорит, ждёт. Теперь — рыба. Станции на ужин.'], ['ded', 'Таня, удочка — это я. Я и есть удочка.']], () => { fix(); A.adv(); }); },
    () => W.talk([['pip', 'Волна радиации сбила всё обратно! Переждали под куполом — давай снова, быстрее.']], () => run())); }
  const fish = S.find((s) => s.id === 'fish'); const fa = fish.onArrive; fish.onArrive = function () { fix(); fa.call(this); };
  const hunt = { id: 'hunt10', start() { A.setObj('Хаос Коннемара: удильщик с уловом', byId('chaos')); }, arrive: 'chaos',
    onArrive() { W.talk([['pip', 'Хаос Коннемара — ледяные плиты, которые океан снизу ломает и переворачивает. Удильщик ныряет из трещины в трещину.'], ['pip', 'Под водой он светится — видно, где вынырнет. Вынырнул — бей!']], () => huntStart()); } };
  function huntStart() { huntEnd(); const c = byId('chaos'), cr = [[0, 0], [40, 30], [-45, 25], [30, -45], [-35, -40], [70, -5], [-70, -10]].map(([x, z]) => ({ x: c.x + x, z: c.z + z }));
    const H = W.hunt10 = { cr, t: 120, ci: 0, up: 0, glow: emojiSprite('💡', 3), ring: null }; W.scene.add(H.glow);
    H.e = W.spawn('angler', cr[0].x, cr[0].z, { keep: 1, hpK: A.bossK() * 6, ai: huntAI, immMsg: '🌊 он под водой' }); W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); dive(H); A.setObj('Лови удильщика, когда вынырнет', cr[0]); }
  function dive(H) { const e = H.e; let k; do { k = Math.floor(Math.random() * H.cr.length); } while (k === H.ci); H.ci = k; H.up = 0; H.ut = rnd(2.2, 3.4); e.immune = true; if (H.ring) W.scene.remove(H.ring); H.ring = A.ring11(H.cr[k].x, H.cr[k].z, '#7fe8ff', 6); }
  function huntEnd() { const H = W.hunt10; if (!H) return; W.scene.remove(H.glow); if (H.ring) W.scene.remove(H.ring); if (H.e) H.e.dead = true; W.hunt10 = null; W.calm = 0; }
  clear4.push(huntEnd);
  function huntAI(e, dt) { const H = W.hunt10; if (!H) { e.dead = true; return; } const q = H.cr[H.ci]; e.vx = e.vz = 0;
    if (!H.up) { e.jy = -14; e.x += (q.x - e.x) * Math.min(1, dt * 1.5); e.z += (q.z - e.z) * Math.min(1, dt * 1.5); H.ut -= dt; H.glow.position.set(e.x, W.H(e.x, e.z) + 0.6, e.z); H.ring.material.opacity = 0.5 + Math.sin(W.t * 10) * 0.4; if (H.ut <= 0) { H.up = 1; H.ut = rnd(2.6, 3.6); e.immune = false; e.jy = 0; sfx('splash', { vol: 0.6 }); burst(W.scene, q.x, W.H(q.x, q.z) + 1, q.z, 'smoke', '#bfefff', 4, 0.6); W.scene.remove(H.ring); H.ring = null; } }
    else { e.jy = 0; const dx = R.x - e.x, dz = R.z - e.z; e.h = Math.atan2(-dx, -dz); H.glow.position.set(e.x, W.H(e.x, e.z) + 5, e.z); H.ut -= dt; if (H.ut <= 0) dive(H); } }
  hunt.tick = function (dt) { const H = W.hunt10; if (!H) return; H.t -= dt; const e = H.e, q = H.cr[H.ci]; if (W.obj) { W.obj.x = q.x; W.obj.z = q.z; } if (!W.focus || W.focus.dead) W.focus = e;
    $('wdObj').innerHTML = '🐟 Удильщик: <b>' + Math.max(0, Math.round(e.hp / e.max * 100)) + '%</b> · ' + (H.up ? '🎯 <b>вынырнул — бей!</b>' : '💡 светится — вынырнет тут') + ' · уйдёт через <b>' + Math.ceil(H.t) + ' с</b>';
    if (e.dead) { huntEnd(); W.give('money', 1200); W.give('food', 3); W.talk([['vnuki', 'Улов вернули! И удильщик сам теперь на ужин.'], ['arkady', 'Рыба — по билету. Осталась большая проблема… Слышите? У развилки лёд трещит!'], ['pip', 'Это Царь-рыба бьётся снизу! Езжайте к развилке — оттуда дорога к её логову.']], () => A.adv()); }
    else if (H.t <= 0) { huntEnd(); W.talk([['pip', 'Ушёл в глубину… Но он вернётся за наживкой. Давай ещё раз!']], () => huntStart()); } };
  const runS = { id: 'fork10', start() { A.setObj('Развилка — лёд трещит', byId('fork10')); }, arrive: 'fork10', onArrive() { W.runWay10 = [[R.x, R.z], [430, -150], [W.LAIR10.x, W.LAIR10.z]]; W.talk([['ded', 'Таня, лёд под нами поёт!'], ['pip', 'Трещина пошла! Гони к логову, не останавливайся!']], () => A.adv()); } };
  S.splice(ai, 1, tune); const fi = S.findIndex((s) => s.id === 'fish'); S.splice(fi + 1, 0, hunt); const ri2 = S.findIndex((s) => s.id === 'run'); S.splice(ri2, 0, runS);
})();

/* =====================================================================
   ГЛАВА 11 — по плану: наперегонки со смерчем → зонд → пешком к Сотре → оборона космопорта → берег → переправа → Кракен (+колыбельная)
   ===================================================================== */
(function ch11() { const S = A.CHAPTERS[11]; if (!S) return; const ri = S.findIndex((s) => s.id === 'rain'), pi = S.findIndex((s) => s.id === 'probe'); if (ri < 0 || pi < 0) return;
  const FUEL = { x: -380, z: 0 };
  function tornado() { const g = new THREE.Group(); for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.ConeGeometry(3 + k * 2.2, 8, 12, 1, true), new THREE.MeshBasicMaterial({ color: k % 2 ? '#8a5a30' : '#c8883a', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = Math.PI; m.position.y = 4 + k * 6.5; g.add(m); } return g; }
  const race = { id: 'race11', start() { A.setObj('Дюны Шангри-Ла', byId('dunes')); }, arrive: 'dunes',
    onArrive() { W.talk([['pip', 'Дюны Титана — не из песка, а из крупинок льда и смолы. А вон — смерч! Он идёт прямо на метановую заправку.'], ['lyuba', 'Если смерч дойдёт до заправки первым — засыплет её дюной, и мы без топлива. Газуй по дороге на юг, обгони его!'], ['ded', 'Таня, это гонка с погодой. Погода не жульничает? Погода жульничает.']], () => run()); } };
  function run() { const dn = byId('dunes'); R.x = dn.x; R.z = dn.z; R.y = W.H(R.x, R.z); R.h = Math.atan2(FUEL.x - R.x, FUEL.z - R.z); R.v = 0;
    W.chase4({ name: 'смерч', label: '🌪 До заправки', path: [[-560, 140], [-470, 20], [FUEL.x, FUEL.z]], sp: 17, goal: FUEL, goalE: '⛽', rain: 1, mesh: tornado,
      onWin() { W.give('fuel', 100); W.give('money', 900); W.give('ammo', 60); W.talk([['lyuba', 'Успели! Заправка цела, бак полный. Смерч обиделся и ушёл в дюны.'], ['lyuba', 'Теперь «Гюйгенс». Зонд сел на Титан в 2005 году — дальше от Земли никто никогда не садился. Где-то на равнине его маяк.']], () => A.adv()); },
      onFail() { W.talk([['lyuba', 'Засыпало! Ничего, заправщики откопают… Смерч разворачивается — давай ещё раз, срезай где можно.']], () => run()); } });
    A.setObj('Обгони смерч до заправки ⛽', FUEL); }
  race.tick = (dt) => { A.hits11Step(dt); if (W.ch4) W.chaseStep4(dt); };
  const foot = { id: 'foot11', start() { A.setObj('Ледяной вулкан Сотра', byId('sotra')); }, arrive: 'sotra',
    onArrive() { W.talk([['pip', 'Сотра — ледяной вулкан: он извергает не лаву, а холодную воду с аммиаком. Дальше камни и лёд — «Буханка» застрянет.'], ['tanya', 'Иду пешком. С фонариком и термосом.'], ['pip', 'Тут минус 180! Грейся у тёплых камней 🔥 — они от вулкана. На вершине — раковина-эхо, в ней песня Сотры.']], () => run2()); } };
  function run2() { const so = byId('sotra'), dx = so.x - R.x, dz = so.z - R.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, gx = so.x + ux * 45, gz = so.z + uz * 45, L = Math.hypot(gx - R.x, gz - R.z), spots = [];
    for (let k = 1; k <= 3; k++) { const t = k / 4, sd = k % 2 ? 9 : -9; spots.push({ x: R.x + (gx - R.x) * t - uz * sd, z: R.z + (gz - R.z) * t + ux * sd }); }
    W.foot4({ label: 'К раковине-эху', goal: { x: gx, z: gz }, goalE: '🐚', spots, drain: 100 / (L / 4 / 5.5 + 9),
      onWin() { W.give('money', 900); W.give('parts', 3); W.talk([['tanya', 'Записала! Песня — как колыбельная. «Баю-баюшки-баю, не ложися на краю…» Только на метановом.'], ['ded', 'Таня, ты вернулась! Я грел тебе пирожок на моторе.'], ['lyuba', 'Беда! Метановые черви ползут на космопорт! Возвращайтесь — у ворот ящики, стройте заграждения!']], () => A.adv()); },
      onFail() { W.talk([['gosha', 'Мяу! (Гоша привёл деда. Дед на руках донёс бабулю до «Буханки» и укутал пледом.)'], ['ded', 'Таня, грейся у каждого камня. Давай ещё раз — я подсвечу фарами.']], () => run2()); } });
    A.setObj('Дойди пешком до раковины 🐚 · грейся у 🔥', { x: gx, z: gz }); }
  foot.tick = (dt) => W.ft4 && W.footStep4(dt);
  const def = { id: 'def11', start() { A.setObj('Космопорт «Титан-Кольцевой»: черви идут', byId('port')); }, arrive: 'port',
    onArrive() { W.talk([['lyuba', 'Черви ползут с трёх сторон! У ворот — ящики. Ставь заграждения на жёлтых кругах — пока черви грызут ящик, бей их.'], ['ded', 'Таня, я как на даче: забор, грядки, и кто-то лезет. Только тут черви с меня ростом.']], () => run3()); } };
  function run3() { const pt = byId('port'), g = { x: pt.x, z: pt.z }, dirs = [[1, 0], [-1, 0], [0, -1]], slots = [], spawns = [];
    dirs.forEach(([ax, az]) => { slots.push({ x: g.x + ax * 26, z: g.z + az * 26 }, { x: g.x + ax * 50, z: g.z + az * 50 }); spawns.push([g.x + ax * 95, g.z + az * 95]); });
    W.def4({ gate: g, slots, spawns, waves: [5, 8, 10], per: 2, build: 14, type: 'methw', chew: 12, bite: 4, hpK: 3, label: '🛡 Ворота',
      onWin() { W.give('money', 1500); W.give('parts', 5); W.talk([['lyuba', 'Отбились! Порт цел. Теперь — к морю Кракена. Рыбаки на берегу ждут.']], () => A.adv()); },
      onFail() { W.talk([['lyuba', 'Ворота прогрызли! Ремонтники заделали дыру — давай снова, ставь ящики там, откуда их больше.']], () => run3()); } });
    A.setObj('Ставь заграждения 🧱 на жёлтых кругах', g); }
  def.tick = (dt) => W.df4 && W.defStep4(dt);
  S.splice(ri, 1, race); const pi2 = S.findIndex((s) => s.id === 'probe'); S.splice(pi2 + 1, 0, foot, def);
  // Кракен: на 20% здоровья — колыбельная (ритм), после неё он засыпает
  const kr = S.find((s) => s.id === 'kraken'); const t0 = kr.tick; kr.tick = function (dt) { t0.call(this, dt); const K = W.boss; if (!K || K.dead || K.immune || K.lull || K.hp > K.max * 0.2) return; K.lull = 1; K.immune = true; K.immMsg = '🎵 он слушает…';
    W.talk([['pip', 'Он устал! Пой ему песню Сотры — в такт, как записала!'], ['tanya', 'Баю-баю, Кракен…']], () => W.rhythm4({ title: '🎵 Колыбельная для Кракена', icon: '🦑', rules: 'Бегунок ходит по полосе. Жми «🎵», когда он в <b>зелёной</b> зоне. 8 нот — и Кракен уснёт.', need: 8, maxMiss: 4, z0: 0.24, zMin: 0.12, dz: 0.015, sp: 0.9, dsp: 0.06, okSay: ['Кракен зевнул', 'Щупальца обмякли', 'Капитан: «Тише, тише…»', 'Буль… (сонно)'], missSay: '❌ Фальшиво — Кракен приоткрыл глаз' },
      () => { K.immune = false; W.hitEnemy(K, K.hp * 10 + 999); W.toast('😴 Кракен уснул!'); },
      () => { K.immune = false; K.lull = 0; K.hp = Math.min(K.max, K.hp + K.max * 0.15); W.toast('🦑 Кракен проснулся и разозлился!'); })); };
})();

/* =====================================================================
   ГЛАВА 12 — по плану: фото следов «Аполлона» → буксир «Лунохода» → код шлюза в Копернике (повтор) → прыжок → тир у радиотелескопа → Взыскатель
   ===================================================================== */
(function ch12() { const S = A.CHAPTERS[12]; if (!S) return; const mi = S.findIndex((s) => s.id === 'mirror'), ji = S.findIndex((s) => s.id === 'jump'), ri = S.findIndex((s) => s.id === 'robot'); if (mi < 0 || ji < 0 || ri < 0) return;
  const photo = { id: 'photo12', start() { A.setObj('Море Спокойствия: следы «Аполлона-11»', byId('apollo')); }, arrive: 'apollo',
    onArrive() { W.talk([['pip', 'Здесь в 1969 году высадились Армстронг и Олдрин. Ветра на Луне нет — их следы лежат уже больше 50 лет, как вчера.'], ['vp', 'Земля просит снимки: отражатель и следы. По ним поймут, куда светить лазером, — и найдут станцию.'], ['pip', 'Наведи «Буханку» прямо на цель, остановись и жми 📷. И не наезжай на следы — сотрёшь историю!'], ['ded', 'Таня, я буду в кадре. Сзади. Помашу.']], () => run()); } };
  function run() { const ap = byId('apollo'); W.photo4({ need: 4, time: 150, tg: [{ x: ap.x + 20, z: ap.z - 18, e: '🪞', name: 'Отражатель «Аполлона»', y: 1.2 }, { x: ap.x - 26, z: ap.z + 6, e: '👣', name: 'След Армстронга', fragile: 1, y: 0.8 }, { x: ap.x - 8, z: ap.z + 30, e: '👣', name: 'След Олдрина', fragile: 1, y: 0.8 }, { x: ap.x + 34, z: ap.z + 26, e: '👣', name: 'Колея ровера', fragile: 1, y: 0.8 }, { x: ap.x - 40, z: ap.z - 30, e: '🚩', name: 'Флаг экспедиции', y: 2.5 }],
      onWin() { W.give('money', 900); W.st.fuel = Math.max(W.st.fuel, 80); W.talk([['gena', '<b>Марс-ФМ</b> с Земли: «Видим снимки! Лазер нашёл отражатель — станция на связи!»'], ['vp', 'Нас видят! Теперь «Луноход-1» в Море Дождей: его аккумуляторы нужны шаттлу.']], () => A.adv()); },
      onFail(why) { W.talk([['vp', why === 'time' ? 'Земля ушла за горизонт кратера… Подождём следующего окна — снимай быстрее.' : 'Ой, следы стёрты. Ничего, рядом есть ещё — Пип нашёл. Попробуй снова, аккуратнее.']], () => run()); } });
    A.setObj('Сними отражатель и следы: наведи, остановись, 📷', { x: ap.x, z: ap.z }); }
  const code = { id: 'code12', start() { A.setObj('Кратер Коперник: старая база «Заря»', byId('copern')); }, arrive: 'copern',
    onArrive() { W.talk([['pip', 'Кратер Коперник — 93 километра в поперечнике, его видно с Земли в бинокль. На дне — старая база «Заря». Там запасной прожектор для прыжка через борозду.'], ['vzysk', '<i>(робот-охранник базы)</i> ВВЕДИТЕ КОД. Я ПОКАЖУ. ПОВТОРИТЕ. ТРИ ОШИБКИ — ТРЕВОГА.']], () => run2()); } };
  function run2() { W.simon4({ title: '🔐 Код шлюза базы «Заря»', rules: 'Робот зажигает кнопки по очереди — нажми их <b>в том же порядке</b>. Код длиннее и быстрее с каждым раундом.', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], len0: 3, rounds: 4, ms: 700, dms: 90, minMs: 380, maxErr: 3, who: 'Робот', alarm: 'ТРЕВОГА! Шлюз заблокирован' },
    () => { W.give('money', 800); W.give('parts', 3); W.talk([['vzysk', '<i>(охранник)</i> КОД ВЕРНЫЙ. ДОБРО ПОЖАЛОВАТЬ. ЧАЙ В ШКАФУ. СРОК ГОДНОСТИ — 1987.'], ['pip', 'Прожектор есть! Теперь — к борозде Хэдли. Перелетим её с трамплина.']], () => A.adv()); },
    () => W.talk([['tanya', 'Сирена! Ваня, жми ты.'], ['ded', 'Таня, у меня пальцы толстые. Давай ещё раз, медленно.']], () => run2())); }
  const tele = { id: 'tele12', start() { A.setObj('Радиотелескоп за бороздой', byId('tele')); }, arrive: 'tele',
    onArrive() { W.talk([['vp', 'Радиотелескоп — наша связь с Землёй. На обратной стороне Луны тихо: нет земных радиопомех, — поэтому телескопы строят тут.'], ['eduard', '<i>(по громкой связи)</i> Дроны «ТрансГалактик» отключат вам связь. Ничего личного.'], ['pip', 'Заезжай на вышку! Дроны сверлят тарелки, а как подстрелишь — прячутся за ними. Бей, когда сверлят.']], () => run3()); } };
  function run3() { const t = byId('tele'); W.tower4({ x: t.x, z: t.z, y: W.H(t.x, t.z) + 7, type: 'bdrone', waves: [4, 5, 7], drill: 2, hpK: 1.5, label: 'Телескоп', cover: [0, 1, 2, 3].map((k) => ({ x: t.x + Math.sin(k * 1.571 + 0.4) * 24, z: t.z + Math.cos(k * 1.571 + 0.4) * 24 })),
      onWin() { W.give('money', 1500); W.give('ammo', 60); W.talk([['gena', '<b>Марс-ФМ</b>: «Связь есть! Внуки передают: ждём, пирожки не забудьте!»'], ['vp', 'Спасибо! Космодром — на юг. Там Взыскатель сторожит шаттл.']], () => A.adv()); },
      onFail() { W.talk([['vp', 'Тарелки разбиты… Ремонтники уже чинят. Попробуй ещё раз — бей дронов, пока сверлят.']], () => run3()); } }); A.setObj('Защити телескоп с вышки', { x: t.x, z: t.z }); }
  const towerTick = (dt) => W.tw4 && W.towerStep4(dt);
  photo.tick = (dt) => W.ph4 && W.photoStep4(dt); tele.tick = towerTick;
  S.splice(mi, 1, photo); const ti = S.findIndex((s) => s.id === 'tow'); S.splice(ti + 1, 0, code); const ji2 = S.findIndex((s) => s.id === 'jump'); S.splice(ji2 + 1, 0, tele); })();

/* =====================================================================
   ГЛАВА 13 — по плану: перекати-поле (ловля) → город → поезд с ракетой → экзамен в музее (викторина) → загон → Ящер
   ===================================================================== */
(function ch13() { const S13 = A.CHAPTERS[13]; if (!S13) return; const hi = S13.findIndex((s) => s.id === 'herd'); if (hi < 0) return;
  const Q = [['В каком году с Байконура запустили первый в мире искусственный спутник?', ['1957', '1961', '1969'], 0, 'В 1957-м, 4 октября'],
    ['Как Гагарин сказал на старте?', ['«Поехали!»', '«Ну, с Богом!»', '«Ключ на старт!»'], 0, 'Он сказал «Поехали!»'],
    ['Сколько длился полёт Гагарина вокруг Земли?', ['108 минут', '24 часа', '3 дня'], 0, 'Один виток — 108 минут'],
    ['Как назывался корабль Гагарина?', ['«Восток-1»', '«Союз-1»', '«Буран»'], 0, 'Это был «Восток-1»'],
    ['Как ракету везут к стартовому столу?', ['Лёжа, на поезде', 'Стоя, на вертолёте', 'Своим ходом'], 0, 'Лёжа, по рельсам — вы же сами охраняли'],
    ['В какой стране находится Байконур?', ['Казахстан', 'Россия', 'Узбекистан'], 0, 'В Казахстане, Россия его арендует'],
    ['Кто первые вернулись живыми с орбиты в 1960 году?', ['Белка и Стрелка', 'Лайка и Жучка', 'кот Феликс'], 0, 'Собаки Белка и Стрелка'],
    ['Первая женщина в космосе (1963)?', ['Валентина Терешкова', 'Светлана Савицкая', 'баба Таня'], 0, 'Валентина Терешкова, «Чайка»'],
    ['Как садится капсула «Союз»?', ['На парашюте в степь', 'На крылья, как самолёт', 'В океан'], 0, 'На парашюте, двигатели мягкой посадки включаются у земли'],
    ['Какого размера был первый спутник?', ['Шар 58 см', 'С автобус', 'С пятиэтажку'], 0, 'Шар 58 см с четырьмя антеннами'],
    ['Как звали главного конструктора первых ракет?', ['Сергей Королёв', 'Вернер фон Браун', 'Михалыч'], 0, 'Сергей Павлович Королёв'],
    ['Зачем космодром строили в степи?', ['Ровно и мало людей вокруг', 'Там теплее', 'Так ближе к Луне'], 0, 'Ровная безлюдная степь — ступени падают безопасно']];
  const quiz = { id: 'quiz13', start() { A.setObj('Музей у Гагаринского старта', byId('gagarin')); }, arrive: 'gagarin',
    onArrive() { W.talk([['asel', 'Экзамен для гостей космодрома! Шесть верных ответов — и значок ваш. Ошибётесь — получите вопрос сверху.'], ['ded', 'Таня, отвечай ты. Я в 1961-м был в армии, мне не рассказывали.']], () => run()); } };
  function run() { W.quiz4({ title: '🚀 Экзамен в музее космодрома', rules: 'Нужно <b>6 верных</b> ответов. Ошибка — добавят вопрос. Больше 3 ошибок — пересдача.', need: 6, maxErr: 3, q: Q,
      okSay: ['Асель: «Верно!»', 'Дед: «Таня, ты космический профессор»', 'Внуки: «Бабуля знает!»', 'Гоша: «Мяу» (одобрительно)'] },
    () => { W.give('money', 1200); W.give('parts', 3); W.talk([['asel', 'Сдано! Значок «Почётный космонавт» — ваш. И сувенирные баурсаки.'], ['asel', 'А теперь — аул у колодца: ата Нурлан звонил, к нему прибежали ваши зверушки.']], () => A.adv()); },
    () => W.talk([['asel', 'Пересдача! Не страшно — Гагарин тоже учился. Давайте ещё раз.']], () => run())); }
  S13.splice(hi, 0, quiz); })();

/* =====================================================================
   ГЛАВА 14 — по плану: арбузы (хрупкий груз) → сортировка на празднике → паром (тир) → кража сетей (стелс) → Сом
   ===================================================================== */
(function ch14() { const S14 = A.CHAPTERS[14]; if (!S14) return;
  const bi = S14.findIndex((s) => s.id === 'buoys');
  const sortStep = { id: 'sort14', start() { A.setObj('Праздник арбуза на площади Камышина', byId('kam')); }, arrive: 'kam',
    onArrive() { W.talk([['mikh', 'Праздник! Только арбузы с поезда перемешались: спелые, неспелые и марсианские — со слизью. Сортируй на ленте!'], ['vnuki', 'Бабуль, марсианские светятся. Их — в отдельный ящик, а то народ светиться начнёт.']], () => run()); }, };
  function run() { sortGame({ title: '🍉 Лента праздника арбуза', label: 'Арбузов', total: 14, maxErr: 3, t0: 6.5, tMin: 3.2, dt: 0.25,
      rules: 'Спелый — <b>хвостик сухой</b> и <b>стук глухой</b>. Если хвостик зелёный или звенит — <b>неспелый</b>. Светится фиолетовым — <b>марсианский</b>, что бы ни было.',
      bins: ['✅ Спелый', '🟩 Неспелый', '🟣 Марсианский'], okSay: ['Михалыч: «Глаз — алмаз!»', 'Внуки: «Ура!»', 'Дед: «Таня, ты арбузный профессор»', 'Верно!'],
      why: () => 'Михалыч: «Эх… смотри на хвостик и слушай стук»',
      make() { const mars = Math.random() < 0.25, dry = Math.random() < 0.55, dull = Math.random() < 0.6; const ans = mars ? 2 : dry && dull ? 0 : 1;
        return { ans, html: `<div class="big" style="${mars ? 'filter:drop-shadow(0 0 10px #c060ff)' : ''}">🍉</div>${mars ? '<div style="color:#d9a0ff">✨ светится фиолетовым</div>' : ''}<div>хвостик: <b>${dry ? '🟫 сухой' : '🌿 зелёный'}</b></div><div>стук: <b>${dull ? '🔉 глухо «бум»' : '🔔 звонко «динь»'}</b></div>` }; } },
    () => { W.give('money', 1500); W.give('food', 2); W.talk([['mikh', 'Рассортировали! Марсианские — в музей, спелые — народу. Вот выручка с праздника.'], ['lida', 'А теперь — на мой паром. Пристань севернее, у старой ветлы.']], () => A.adv()); },
    () => W.talk([['mikh', 'Перепутала много — давай сначала, я лентой не тороплю… почти.']], () => run())); }
  const nets = { id: 'nets14', start() { A.setObj('Лагерь браконьеров на левом берегу', byId('brak')); }, arrive: 'brak',
    onArrive() { W.talk([['lida', 'Тсс. Это браконьеры. Они утащили сети рыбаков и эхолот — без эхолота омут Сома не найти.'], ['lida', 'Сторожа с фонарями. В жёлтый свет не заезжай, газ не жми — услышат мотор. Встань у сети и подожди — Гоша смотает.'], ['gosha', 'Мяу. (Гоша надел чёрную шапочку.)']], () => start14()); },
    tick(dt) { if (W.st4) W.stealthStep4(dt); } };
  function start14() { const b = byId('brak'); W.setNight(0.8); R.v = 0;
    W.stealth4({ label: '🕸 Сети и эхолот', quiet: 7.5, take: 2,
      guards: [{ path: [[b.x - 70, b.z - 60], [b.x - 70, b.z + 60]], sp: 2.6, pause: 2.5 }, { path: [[b.x - 25, b.z - 25], [b.x + 25, b.z - 25], [b.x + 25, b.z + 25], [b.x - 25, b.z + 25]], sp: 2.2, pause: 1.5, col: '#6a4a3a' }],
      items: [{ x: b.x - 85, z: b.z - 30, e: '🕸', name: 'Сеть' }, { x: b.x - 55, z: b.z + 70, e: '🕸', name: 'Вторая сеть' }, { x: b.x + 8, z: b.z + 4, e: '📡', name: 'Эхолот' }],
      exit: { x: b.x - 110, z: b.z + 120 },
      onCaught() { W.talk([['lida', 'Заметили! Отъезжай, пусть успокоятся… Сети они перепрятали обратно.']], () => { W.stealthEnd4(); R.x = b.x + 40; R.z = b.z + 130; R.y = W.H(R.x, R.z); R.v = 0; start14(); }); },
      onWin() { W.setNight(0); W.give('money', 1200); W.give('parts', 4); W.talk([['lida', 'Ушли тихо! Эхолот показывает: омут Сома — у песчаной косы. Рыбакам сети вернём утром.'], ['ded', 'Таня, я первый раз в жизни что-то украл. И то — обратно.']], () => A.adv()); } });
    A.setObj('Тихо забери 2 сети и эхолот', { x: b.x, z: b.z }); }
  clear4.push(() => { if (W.setNight && W.ch === 14) W.setNight(0); });
  if (bi >= 0) S14.splice(bi, 1, nets); const fi = S14.findIndex((s) => s.id === 'ferry'); S14.splice(fi, 0, sortStep);
})();
};
