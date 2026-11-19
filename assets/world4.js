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
  for (const q of P.tg) { if (q.done || q.gone) continue; const d = Math.hypot(q.x - R.x, q.z - R.z); if (d < nd) { nd = d; near = q; } if (inFrame(q) > 0) can = true; if (q.fragile && d < 3.5) { q.gone = true; P.lost++; W.scene.remove(q.sp); sfx('dry'); W.toast('😱 ' + (W.rd4 ? 'Наступила на след! ' : 'Колесом по следу! ') + q.name + ' стёрт навсегда'); } }
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
  F.g = VEH.granny(); W.scene.add(F.g); F.lamp = new THREE.PointLight('#fff2c0', 1.4, 26); W.scene.add(F.lamp);
  F.car = new THREE.Group(); const cm = W.roverG.clone(); F.car.add(cm); F.car.position.set(R.x, R.y, R.z); F.car.rotation.y = R.h; W.scene.add(F.car);
  F.spots.forEach((q) => { q.ring = A.ring11(q.x, q.z, '#ff9a4a', 5); }); F.goalSp = emojiSprite(o.goalE, 3); F.goalSp.position.set(o.goal.x, W.H(o.goal.x, o.goal.z) + 2.5, o.goal.z); W.scene.add(F.goalSp);
  W.foot = 1; W.camK = 0.55; W.vmaxCap = 5.5; W.noFire = 1; W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); R.x += Math.sin(R.h + 1.57) * 4; R.z += Math.cos(R.h + 1.57) * 4; R.v = 0; return F; };
W.footEnd4 = function (stay) { const F = W.ft4; if (!F) return; W.scene.remove(F.g); W.scene.remove(F.lamp); W.scene.remove(F.car); W.scene.remove(F.goalSp); F.spots.forEach((q) => q.ring && W.scene.remove(q.ring)); W.ft4 = null; W.foot = 0; W.camK = 0; W.vmaxCap = 0; W.noFire = 0; W.calm = 0;
  if (!stay) { R.x = F.park.x; R.z = F.park.z; R.h = F.park.h; R.y = W.H(R.x, R.z); R.v = 0; } };
clear4.push(() => W.footEnd4());
W.footStep4 = function (dt) { const F = W.ft4; if (!F) return; const y = W.H(R.x, R.z); if (F.g.anim) { F.g.anim.userData.mixer.update(dt); const w = Math.abs(R.v) > 1.2 ? F.g.clipWalk : F.g.clipIdle; if (w) F.g.anim.userData.play(w); } F.g.position.set(R.x, y + Math.abs(Math.sin(W.t * 8)) * 0.25 * Math.min(1, Math.abs(R.v) / 3), R.z); F.g.rotation.y = R.h; F.lamp.position.set(R.x + Math.sin(R.h) * 3, y + 3, R.z + Math.cos(R.h) * 3);
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
    o.cv = document.createElement('canvas'); o.cv.width = 480; o.cv.height = 150; o.cv.style.cssText = 'position:relative;inset:auto;width:100%;background:#0b1020;border-radius:12px;display:block'; o.body.appendChild(o.cv); o.g = o.cv.getContext('2d');
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
    o.draw = () => (o.card.innerHTML = '<div class="big">' + cfg.icon + '</div><div>Цена: <b>' + o.price + (cfg.unit || ' ₽') + '</b></div><div>Терпение: <b>' + '❤'.repeat(Math.max(0, o.pat)) + '🖤'.repeat(Math.max(0, cfg.patience - o.pat)) + '</b></div><div style="font-size:13px;opacity:.8">у вас ' + (cfg.have ? cfg.have() : W.st.money + ' ₽') + ' · 🥟 ' + W.st.food + '</div>');
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

/* ---------- транспорт: «Буханка» прячется, игрок ведёт другой аппарат (полёт, лодка, коньки, кот, верблюд…) ---------- */
const LM = (c) => new THREE.MeshLambertMaterial({ color: c });
const tanyaMesh = () => { let o = { skirt: '#3a5a8a', coat: '#7a3a6a', scarf: '#d8302a', dots: '#ffe08a', glass: '#a8823a' }; try { o = Object.assign(o, GRAN[granId()], { glass: '#a8823a' }); } catch (e) {} return personMesh(o); }; // бабуля в своём наряде
const VEH = {
  drone() { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), LM('#d8d8e0')); g.add(b); for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 12), LM('#3a3a44')); r.position.set(x, 0.35, z); g.add(r); const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.9), LM('#8a8a94')); a.position.set(x / 2, 0.1, z / 2); a.rotation.y = Math.atan2(x, z); g.add(a); } const e = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: '#7aff8a' })); e.position.set(0, -0.2, 0.8); g.add(e); g.scale.setScalar(1.6); return g; },
  saucer() { const g = new THREE.Group(), d = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 2.2, 1.2, 20), LM('#b8c4d0')); g.add(d); const c = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#9ad8ff', transparent: true, opacity: 0.7 })); c.position.y = 0.5; g.add(c); const p = tanyaMesh(); p.scale.setScalar(0.6); p.position.y = 0.2; g.add(p); for (let k = 0; k < 8; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 4), new THREE.MeshBasicMaterial({ color: k % 2 ? '#ffd24a' : '#7aff8a' })); l.position.set(Math.sin(k * 0.785) * 4, -0.1, Math.cos(k * 0.785) * 4); g.add(l); } return g; },
  balloon() { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), LM('#e85a4a')); b.scale.y = 1.2; b.position.y = 9; g.add(b); for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 4), LM('#4a3a2a')); st.position.set(Math.sin(k * 1.57 + 0.78) * 1.2, 4, Math.cos(k * 1.57 + 0.78) * 1.2); g.add(st); } const bk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.4), LM('#a8743a')); bk.position.y = 0.7; g.add(bk); const p = tanyaMesh(); p.scale.setScalar(0.55); p.position.y = 0.8; g.add(p); const st = new THREE.Mesh(new THREE.SphereGeometry(5.05, 16, 12, 0, Math.PI * 2, 1.2, 0.5), LM('#ffd24a')); st.scale.y = 1.2; st.position.y = 9; g.add(st); return g; },
  heli() { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 4), LM('#e8e8f0')); b.position.y = 1; g.add(b); g.rotors = []; for (const [x, z] of [[-2.4, -2], [2.4, -2], [-2.4, 2], [2.4, 2]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.35), LM('#2a2a34')); r.position.set(x, 1.9, z); g.add(r); g.rotors.push(r); } const w = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 0.3), LM('#8a8a94')); w.position.y = 1.6; w.position.z = -2; g.add(w); const w2 = w.clone(); w2.position.z = 2; g.add(w2); return g; },
  rocket() { const g = new THREE.Group(); if (MODELS.k_rocket_baseA) { const b = new Builder([]); b.add(MODELS.k_rocket_baseA, mat(0, 0, 0, 3, 3, 3), null, { vcol: true }); b.add(MODELS.k_rocket_topA || MODELS.k_rocket_baseA, mat(0, 4.6, 0, 3, 3, 3), null, { vcol: true }); g.add(new THREE.Mesh(b.build(), bakedMat)); } else { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 12), LM('#e8e8f0')); c.position.y = 3; g.add(c); const t = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 12), LM('#e85a4a')); t.position.y = 7.2; g.add(t); } const f = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 10), new THREE.MeshBasicMaterial({ color: '#ffb04a' })); f.rotation.x = Math.PI; f.position.y = -1.2; g.add(f); g.flame = f; return g; },
  glider() { const g = new THREE.Group(), w = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 2.2, 16, 1, true, -0.9, 1.8), new THREE.MeshLambertMaterial({ color: '#ff8a3a', side: THREE.DoubleSide })); w.rotation.z = Math.PI / 2; w.rotation.y = Math.PI / 2; w.position.y = 2; g.add(w); const p = tanyaMesh(); p.scale.setScalar(0.7); p.position.y = -4.5; g.add(p); return g; },
  jet() { const g = personMesh('#e8e8f0'); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 8), LM('#8a8a94')); t.position.set(0, 1.3, -0.6); g.add(t); const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 8), new THREE.MeshBasicMaterial({ color: '#7fe8ff' })); f.rotation.x = Math.PI; f.position.set(0, 0.2, -0.6); g.add(f); g.flame = f; const h = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshLambertMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.5 })); h.position.y = 2.4; g.add(h); return g; },
  granny() { return tanyaMesh(); },
  suit() { const g = personMesh('#f0f0f4'); const h = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), new THREE.MeshLambertMaterial({ color: '#ffd27a', transparent: true, opacity: 0.6 })); h.position.y = 2.4; g.add(h); return g; },
  cat() { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), LM('#e8963a')); b.scale.set(1, 0.8, 1.6); b.position.y = 0.8; g.add(b); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), LM('#e8963a')); hd.position.set(0, 1.4, 1.2); g.add(hd); for (const x of [-0.3, 0.3]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 4), LM('#c8762a')); e.position.set(x, 2, 1.2); g.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: '#b8ff6a' })); ey.position.set(x * 0.8, 1.5, 1.75); g.add(ey); } const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 1.6, 6), LM('#e8963a')); t.position.set(0, 1.3, -1.4); t.rotation.x = -0.6; g.add(t); g.scale.setScalar(1.3); return g; },
  camel() { const g = new THREE.Group(), c = '#c8a064', b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 3.4), LM(c)); b.position.y = 2.6; g.add(b); for (const z of [-0.7, 0.6]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), LM(c)); h.position.set(0, 3.5, z); g.add(h); } const n = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), LM(c)); n.position.set(0, 3.6, 2); n.rotation.x = 0.5; g.add(n); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.1), LM(c)); hd.position.set(0, 4.5, 2.6); g.add(hd); for (const [x, z] of [[-0.6, -1.3], [0.6, -1.3], [-0.6, 1.3], [0.6, 1.3]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2, 0.35), LM('#a8804a')); l.position.set(x, 1, z); g.add(l); } const p = tanyaMesh(); p.scale.setScalar(0.55); p.position.set(0, 3.9, -0.1); g.add(p); return g; },
  boat() { const g = new THREE.Group(), h = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 7), LM('#e8e8f0')); h.position.y = 0.4; g.add(h); const n = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 4), LM('#e8e8f0')); n.rotation.x = Math.PI / 2; n.rotation.y = Math.PI / 4; n.position.set(0, 0.4, 4.6); g.add(n); const s = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.3, 7.1), LM('#3a6aff')); s.position.y = 0.9; g.add(s); const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), LM('#3a3a44')); m.position.set(0, 1.2, -3.6); g.add(m); const p = tanyaMesh(); p.scale.setScalar(0.55); p.position.set(0, 1, -2); g.add(p); for (let k = 0; k < 6; k++) { const w = emojiSprite('🍉', 1); w.position.set((k % 3 - 1) * 0.8, 1.6, 0.5 + Math.floor(k / 3) * 1); g.add(w); } return g; },
};
W.VEH = VEH;
// настоящие модели вместо самоделок: бабуля (Quaternius), кот Гоша (герой с «Буханки»), лама, аппараты Kenney
function kmodel(name, sc, ry = 0, dy = 0) { if (!MODELS || !MODELS[name]) return null; const b = new Builder([]); b.add(MODELS[name], mat(0, dy, 0, sc, sc, sc, ry), null, { crease: 0.6, vcol: true, vk: 1.05 }); return new THREE.Mesh(b.build(), bakedMat); }
function animModel(g, name, h, fallback, dy = 0) { const fb = fallback; if (fb) g.add(fb); if (!BM.monster) return g; BM.monster(name, h).then((r) => { if (!g.parent) return; if (fb) g.remove(fb); r.position.y = dy; g.add(r); g.anim = r; const A2 = r.userData.acts, pickC = (re) => Object.keys(A2).find((k) => re.test(k)); g.clipWalk = pickC(/walk/i) || pickC(/run/i); g.clipIdle = pickC(/idle/i) || g.clipWalk; if (g.clipIdle) r.userData.play(g.clipIdle, 0); }).catch(() => {}); return g; }
const oldGranny = VEH.granny, oldCat = VEH.cat, oldCamel = VEH.camel;
VEH.granny = () => tanyaMesh(); // наша Таня в своём наряде (раньше — чужая модель старушки из пака)
VEH.suit = () => { const g = VEH.granny(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshLambertMaterial({ color: '#cfefff', transparent: true, opacity: 0.3, depthWrite: false })); h.position.y = 1.72; g.add(h); const pk = kmodel('k_rocket_fuelA', 0.35, 0, 0.7); if (pk) { pk.position.z = -0.35; g.add(pk); } return g; };
VEH.jet = () => { const g = VEH.suit(); const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 10), new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.85 })); f.rotation.x = Math.PI; f.position.set(0, 0.3, -0.38); g.add(f); g.flame = f; return g; };
VEH.cat = () => { const g = new THREE.Group(); const src = BM.FX && BM.FX.cat; if (src) { const c = src.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, Math.PI, 0); c.scale.setScalar(5.5); g.add(c); g.bob = 1; return g; } return oldCat(); };
VEH.camel = () => { const g = animModel(new THREE.Group(), 'llama', 2.6, oldCamel()); BM.monster && BM.monster('h_oldclassy_female', 1.6).then((r) => { if (!g.parent) return; r.position.set(0, 1.55, -0.2); g.add(r); const A2 = r.userData.acts, k = Object.keys(A2).find((q) => /sit/i.test(q)) || Object.keys(A2).find((q) => /idle/i.test(q)); if (k) r.userData.play(k, 0); g.rider = r; }).catch(() => {}); return g; };
VEH.drone = (() => { const old = VEH.drone; return () => { const m = kmodel('r_craft_speederD', 1.6) || kmodel('r_craft_racer', 1.4); if (!m) return old(); const g = new THREE.Group(); g.add(m); const e = new THREE.PointLight('#7aff8a', 0.8, 12); e.position.y = -1; g.add(e); return g; }; })();
VEH.saucer = (() => { const old = VEH.saucer; return () => { const m = kmodel('s_Spaceship', 1.6); if (!m) return old(); const g = new THREE.Group(); g.add(m); return g; }; })();
VEH.balloon = (() => { const old = VEH.balloon; return () => { const bag = kmodel('p_gasbag', 3.2); if (!bag) return old(); const g = new THREE.Group(); bag.position.y = 7; g.add(bag); for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5, 4), LM('#5a4a3a')); st.position.set(Math.sin(k * 1.57 + 0.78) * 1.1, 3.2, Math.cos(k * 1.57 + 0.78) * 1.1); g.add(st); } const bk = kmodel('o_crate', 1.2) || new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), LM('#a8743a')); bk.position.y = 0.3; g.add(bk); const gr = VEH.granny(); gr.scale.setScalar(0.9); gr.position.y = 0.9; g.add(gr); g.sub = gr; return g; }; })();
VEH.heli = (() => { const old = VEH.heli; return () => { const m = kmodel('k_craft_cargoA', 2.2) || kmodel('r_craft_cargoB', 2.2); if (!m) return old(); const g = new THREE.Group(); g.add(m); g.rotors = []; for (const [x, z] of [[-2.6, -2.2], [2.6, -2.2], [-2.6, 2.2], [2.6, 2.2]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, 0.3), LM('#2a2a34')); r.position.set(x, 2.6, z); g.add(r); g.rotors.push(r); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 6), LM('#8a8a94')); hub.position.set(x, 2.1, z); g.add(hub); } return g; }; })();
VEH.glider = (() => { const old = VEH.glider; return () => { const g = old(); g.children.filter((c) => c !== g.children[0]).forEach((c) => g.remove(c)); const gr = VEH.granny(); gr.position.y = -4.6; g.add(gr); g.sub = gr; return g; }; })();
VEH.boat = (() => { const old = VEH.boat; return () => { const g = old(); const p = g.children.find((c) => c.isGroup); if (p) g.remove(p); const gr = VEH.granny(); gr.scale.setScalar(0.85); gr.position.set(0, 0.6, -2); g.add(gr); g.sub = gr; return g; }; })();

W.ride4 = function (o) { W.rideEnd4(); const V = W.rd4 = Object.assign({ park: { x: R.x, z: R.z, h: R.h, y: R.y } }, o); V.m = typeof o.mesh === 'string' ? VEH[o.mesh]() : o.mesh; W.scene.add(V.m); if (W.shadowTex && !o.fly) { const r = (o.rad || 1.6) * 2.2, sg = new THREE.PlaneGeometry(r, r * 1.5); sg.rotateX(-Math.PI / 2); const sm = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: W.shadowTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); sm.position.y = 0.06; sm.renderOrder = 1; V.m.add(sm); V.shadow = sm; }
  if (o.parked) { V.car = new THREE.Group(); V.car.add(W.roverG.clone()); V.car.position.set(R.x, R.y, R.z); V.car.rotation.y = R.h; W.scene.add(V.car); }
  W.collR = o.rad || (typeof o.mesh === 'string' ? ({ granny: 0.6, suit: 0.6, jet: 0.6, cat: 0.8, camel: 1.4 })[o.mesh] : 0) || 1.6; W.foot = 1; W.camK = o.cam || ({ granny: 0.55, suit: 0.55, cat: 0.5, jet: 0.6, camel: 0.8, boat: 0.75, drone: 0.9, glider: 1.1, balloon: 1.3, heli: 1.1, rocket: 1.2, saucer: 1 })[o.mesh] || 1; if (o.fly) { W.flyMode = 1; W.flyAlt = o.alt || 13; W.flyK = o.flyK || 1.2; } if (o.vmax) W.vmaxCap = o.vmax; if (o.glide) W.glide = o.glide; if (o.swimK) W.swimK = o.swimK; if (o.noFire) W.noFire = 1; W.hover = o.hover != null ? o.hover : /^(heli|drone|jet|balloon|cat|granny|suit)$/.test(o.mesh) ? 1 : 0; return V; };
W.rideEnd4 = function (back) { const V = W.rd4; if (!V) return; W.scene.remove(V.m); if (V.car) W.scene.remove(V.car); W.rd4 = null; W.collR = 0; W.foot = 0; W.camK = 0; W.hover = 0; W.flyMode = 0; W.flyAlt = W.flyK = undefined; W.flyY = undefined; W.vmaxCap = 0; W.glide = 0; W.swimK = 0; if (V.noFire) W.noFire = 0;
  if (back) { R.x = V.park.x; R.z = V.park.z; R.h = V.park.h; } R.y = W.H(R.x, R.z); R.v = 0; R.vy = 0; R.mx = R.mz = 0; };
clear4.push(() => W.rideEnd4());
(function rideFrame() { const d0 = W.director; W.director = function (dt) { d0 && d0(dt); const V = W.rd4; if (!V) return; const m = V.m; m.position.set(R.x, R.y + (V.dy || 0) + (V.bob ? Math.abs(Math.sin(W.t * 8)) * 0.25 * Math.min(1, Math.abs(R.v) / 3) : 0), R.z); m.rotation.order = 'YXZ'; m.rotation.y = R.h + (V.spin ? W.t * V.spin : 0); const tilt = !V.fly && !W.flyMode && !V.upright; m.rotation.x = tilt ? R.pitch : 0; m.rotation.z = (tilt ? R.roll : 0) + (V.bank ? -(R.steer || 0) * V.bank : 0); /* транспорт ложится на склон, а не уходит в него */
  if (m.rotors) m.rotors.forEach((r, k) => (r.rotation.y += dt * 30 * (k % 2 ? 1 : -1))); for (const q of [m, m.sub, m.rider]) { const an = q && (q.anim || (q.isGroup && q.userData && q.userData.mixer ? q : null)); if (q && q.anim) { q.anim.userData.mixer.update(dt); const want = Math.abs(R.v) > 1.2 && q === m && !V.fly ? q.clipWalk : q.clipIdle; if (want) q.anim.userData.play(want); } } if (m.rider) m.rider.userData.mixer.update(dt); if (V.shadow) V.shadow.position.y = 0.06 - (m.position.y - R.y); if (m.flame) m.flame.visible = !!V.burn; { const u = m.userData; if (u && u.legL && !V.fly && !W.flyMode) { const k = Math.min(1, Math.abs(R.v) / 4), a = Math.sin(W.t * 9) * 0.6 * k; u.legL.rotation.x = a; u.legR.rotation.x = -a; u.armL.rotation.x = -a * 0.7; u.armR.rotation.x = a * 0.7; } } /* шагает ногами */ if (V.tick) V.tick(dt, V); }; })();

/* ---------- спуск в разрезе (бур в недрах, батискаф подо льдом): ◀ ▶ — в сторону, глубина растёт сама ---------- */
W.dive4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.cfg = cfg; o.x = 0.5; o.depth = 0; o.meter = cfg.meter0; o.hull = 100; o.got = 0; o.objs = []; o.spawnT = 0; o.left = o.right = 0;
    o.cv = document.createElement('canvas'); o.cv.width = 360; o.cv.height = 420; o.cv.style.cssText = 'position:relative;inset:auto;height:min(40vh,420px);width:auto;max-width:100%;margin:0 auto;background:' + cfg.bg + ';border-radius:12px;display:block;touch-action:none'; o.body.appendChild(o.cv); o.g = o.cv.getContext('2d');
    o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    const r = document.createElement('div'); r.className = 'row'; [['◀', -1], ['▶', 1]].forEach(([t, d]) => { const b = document.createElement('button'); b.textContent = t; b.style.fontSize = '26px'; const on = (e) => { e.preventDefault(); e.stopPropagation(); if (d < 0) o.left = 1; else o.right = 1; }, off = () => { if (d < 0) o.left = 0; else o.right = 0; }; b.onpointerdown = on; b.onpointerup = b.onpointerleave = b.onpointercancel = off; r.appendChild(b); }); o.body.appendChild(r);
    o.kd = (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') o.left = 1; if (e.code === 'ArrowRight' || e.code === 'KeyD') o.right = 1; }; o.ku = (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') o.left = 0; if (e.code === 'ArrowRight' || e.code === 'KeyD') o.right = 0; };
    addEventListener('keydown', o.kd); addEventListener('keyup', o.ku); const ow = o.win, of = o.fail; const unb = () => { removeEventListener('keydown', o.kd); removeEventListener('keyup', o.ku); }; o.win = (m) => { unb(); ow(m); }; o.fail = (m) => { unb(); of(m); };
    o.say(cfg.hello); },
    tick(dt) { const o = this, c = o.cfg, g = o.g, Wc = o.cv.width, Hc = o.cv.height; if (o.done) return;
      const steer = (o.right - o.left) + (o.auto || 0); o.x = Math.max(0.05, Math.min(0.95, o.x + steer * dt * c.side)); const vs = c.speed * (1 + o.depth / c.goal * 0.6); o.depth += vs * dt;
      o.spawnT -= dt; if (o.spawnT <= 0) { o.spawnT = c.every * (1 - Math.min(0.5, o.depth / c.goal * 0.5)); const k = c.kinds[Math.floor(Math.random() * c.kinds.length)]; o.objs.push(Object.assign({ x: 0.08 + Math.random() * 0.84, y: Hc + 30 }, k)); }
      const py = Hc * 0.28; o.meter = Math.max(0, Math.min(100, o.meter + c.meterRate * dt));
      for (let i = o.objs.length - 1; i >= 0; i--) { const q = o.objs[i]; q.y -= vs * dt * 6; if (q.drift) q.x = Math.max(0.05, Math.min(0.95, q.x + Math.sin(W.t * 2 + i) * q.drift * dt)); if (q.y < -40) { o.objs.splice(i, 1); continue; }
        if (Math.abs(q.y - py) < q.r + 10 && Math.abs(q.x - o.x) * Wc < q.r + 12) { o.objs.splice(i, 1); if (q.meter) o.meter = Math.max(0, Math.min(100, o.meter + q.meter)); if (q.hull) { o.hull -= q.hull; sfx('thud'); } if (q.push) o.x = Math.max(0.05, Math.min(0.95, o.x + q.push)); if (q.got) { o.got++; sfx('coin'); } else sfx(q.meter < 0 ? 'pick' : 'caught', { vol: 0.5 }); if (q.say) o.say(q.say); } }
      // рисуем
      g.clearRect(0, 0, Wc, Hc); for (let k = 0; k < 6; k++) { const yy = ((k * 90 - o.depth * 6) % 540 + 540) % 540 - 60; g.fillStyle = c.layers[k % c.layers.length]; g.fillRect(0, yy, Wc, 50); }
      for (const q of o.objs) { g.font = (q.r * 1.6) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(q.e, q.x * Wc, q.y); }
      g.font = '34px serif'; g.fillText(c.me, o.x * Wc, py); if (c.light) { const gr = g.createRadialGradient(o.x * Wc, py, 20, o.x * Wc, py, 160); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc); }
      g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.textAlign = 'left'; g.fillText('↓ ' + Math.round(o.depth) + ' м', 8, 18);
      o.st.innerHTML = c.meterName + ': <b style="color:' + (c.meterBad(o.meter) ? '#ff6a4a' : '#9f9') + '">' + Math.round(o.meter) + '%</b> · корпус ' + Math.max(0, Math.round(o.hull)) + '%' + (c.need ? ' · ' + c.gotName + ' <b>' + o.got + ' из ' + c.need + '</b>' : ' · до цели ' + Math.max(0, Math.round(c.goal - o.depth)) + ' м');
      const winNow = c.need ? o.got >= c.need : o.depth >= c.goal; if (winNow) { o.done = 1; o.say(c.okSay); setTimeout(() => o.win(), 900); return; }
      if (o.hull <= 0 || c.meterBad(o.meter, true)) { o.done = 1; o.say(c.failSay); setTimeout(() => o.fail(), 1200); } } }); };

/* ---------- вагонетка: схема штреков, стрелки на развилках, завалы; забрать шахтёров и вывезти ---------- */
W.cart4 = function (cfg, onWin, onFail) {
  return W.mini({ title: cfg.title, rules: cfg.rules, onWin, onFail, build(o) { o.cfg = cfg; const N = o.N = cfg.nodes, E = o.E = cfg.edges; o.adj = {}; E.forEach(([a, b]) => { (o.adj[a] = o.adj[a] || []).push(b); (o.adj[b] = o.adj[b] || []).push(a); });
    o.sw = {}; Object.keys(o.adj).forEach((k) => { if (o.adj[k].length >= 3) o.sw[k] = 0; }); o.from = cfg.start; o.to = o.adj[cfg.start][0]; o.k = 0; o.carry = 0; o.saved = 0; o.t = cfg.time; o.miners = {}; cfg.stations.forEach((k) => (o.miners[k] = 1)); o.block = {}; o.bt = 4; o.wait = 0;
    o.cv = document.createElement('canvas'); o.cv.width = 360; o.cv.height = 420; o.cv.style.cssText = 'position:relative;inset:auto;height:min(46vh,420px);width:auto;max-width:100%;margin:0 auto;background:#1e1630;border-radius:12px;display:block;touch-action:none'; o.body.appendChild(o.cv); o.g = o.cv.getContext('2d');
    o.st = document.createElement('div'); o.st.className = 'st'; o.body.appendChild(o.st);
    o.opts = (n, came) => o.adj[n].filter((x) => x !== came);
    o.cv.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); const r = o.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 360, y = (e.clientY - r.top) / r.height * 420; for (const k in o.sw) { const [nx, ny] = N[k]; if (Math.hypot(nx - x, ny - y) < 34) { o.toggle(k); return; } } };
    o.toggle = (k) => { o.sw[k] = (o.sw[k] + 1) % 2; sfx('click'); };
    o.say(cfg.hello); },
    tick(dt) { const o = this, c = o.cfg, N = o.N, g = o.g; if (o.done) return; o.t -= dt;
      o.bt -= dt; if (o.bt <= 0) { o.bt = c.collapse; const cand = o.E.filter(([a, b]) => !(a === c.start || b === c.start)); const [a, b] = cand[Math.floor(Math.random() * cand.length)]; o.block[a + '-' + b] = o.block[b + '-' + a] = 6; sfx('thud'); o.say('💥 Обвал на штреке! Красный путь закрыт на 6 с'); }
      for (const k in o.block) { o.block[k] -= dt; if (o.block[k] <= 0) delete o.block[k]; }
      if (o.wait > 0) o.wait -= dt; else if (o.block[o.from + '-' + o.to] && o.k < 0.05) { o.wait = 0.3; } else {
        const [ax, ay] = N[o.from], [bx, by] = N[o.to], L = Math.hypot(bx - ax, by - ay); o.k += c.speed * dt / L;
        if (o.k >= 1) { const n = o.to, came = o.from; o.k = 0; o.from = n;
          if (o.miners[n]) { o.miners[n] = 0; o.carry++; sfx('coin'); o.say('⛑ Шахтёр в вагонетке! Везём к выходу'); }
          if (n === c.start && o.carry) { o.saved += o.carry; o.carry = 0; sfx('j_found'); o.say('🚪 Шахтёры спасены: ' + o.saved + ' из ' + c.stations.length); if (o.saved >= c.stations.length) { o.done = 1; setTimeout(() => o.win(), 800); return; } }
          const op = o.opts(n, came); o.to = op.length === 0 ? came : op.length === 1 ? op[0] : op[o.sw[n] % op.length]; } }
      // рисуем
      g.clearRect(0, 0, 360, 420); g.lineWidth = 8; g.lineCap = 'round'; for (const [a, b] of o.E) { g.strokeStyle = o.block[a + '-' + b] ? '#ff4a3a' : '#8a7a9a'; g.beginPath(); g.moveTo(...N[a]); g.lineTo(...N[b]); g.stroke(); }
      g.font = '24px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const k in N) { const [x, y] = N[k]; if (k === c.start) g.fillText('🚪', x, y + 2); else if (c.stations.includes(k)) g.fillText(o.miners[k] ? '⛑' : '✅', x, y); }
      for (const k in o.sw) { const [x, y] = N[k], op = o.opts(k, null); g.fillStyle = '#2e3a5c'; g.beginPath(); g.arc(x, y, 18, 0, 6.3); g.fill(); g.strokeStyle = '#ffd27a'; g.lineWidth = 4; const cameNow = o.from === k ? null : null; const all = o.adj[k], sel = all[(o.sw[k]) % all.length]; }
      // стрелки: показываем, куда уйдёт вагонетка из развилки (относительно пути, откуда она приедет)
      for (const k in o.sw) { const [x, y] = N[k]; const came = o.to === k ? o.from : o.adj[k][0]; const op = o.opts(k, came), nx = op[o.sw[k] % op.length], [tx, ty] = N[nx], a = Math.atan2(ty - y, tx - x); g.strokeStyle = '#ffd27a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); g.stroke(); g.fillStyle = '#ffd27a'; g.font = '12px sans-serif'; g.fillText('⇄', x, y); }
      const [ax, ay] = N[o.from], [bx, by] = N[o.to]; g.font = '26px serif'; g.fillText('🛒', ax + (bx - ax) * o.k, ay + (by - ay) * o.k - 4); if (o.carry) { g.font = '13px sans-serif'; g.fillStyle = '#fff'; g.fillText('⛑×' + o.carry, ax + (bx - ax) * o.k, ay + (by - ay) * o.k - 24); }
      o.st.innerHTML = '⛑ Спасено <b>' + o.saved + ' из ' + c.stations.length + '</b> · в вагонетке ' + o.carry + ' · ⏱ <b style="color:' + (o.t < 20 ? '#ff6a4a' : '#9f9') + '">' + Math.max(0, Math.ceil(o.t)) + ' с</b> · жми на стрелки ⇄';
      if (o.t <= 0) { o.done = 1; o.say('⏱ Своды рушатся — назад к выходу!'); setTimeout(() => o.fail(), 1200); } } }); };

/* ---------- стелс: охрана с фонарями и конусами обзора ---------- */
function guardMesh(col) { const g = new THREE.Group(), m = (c) => new THREE.MeshLambertMaterial({ color: c }); // сторож с фонарём (запасной, пока грузится модель)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.9, 8), m(col)); body.position.y = 1.15; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), m('#e9b48a')); head.position.y = 2.4; g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8), m('#3a3a3a')); hat.position.y = 2.8; g.add(hat);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' })); lamp.position.set(0.4, 1.6, 0.6); g.add(lamp);
  g.scale.setScalar(1.6); return g; }
function coneMesh(L, half) { const n = 12, pos = [0, 0, 0]; for (let i = 0; i <= n; i++) { const a = -half + 2 * half * i / n; pos.push(Math.sin(a) * L, 0, Math.cos(a) * L); } const idx = []; for (let i = 1; i <= n; i++) idx.push(0, i, i + 1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff27a', transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide })); }
W.stealth4 = function (o) { W.stealthEnd4(); const S = W.st4 = Object.assign({ sus: 0, L: 28, half: 0.5, got: 0, hold: 0 }, o);
  S.guards = o.guards.map((gd, gi) => { const m = animModel(new THREE.Group(), gi % 2 ? 'h_worker_male' : 'h_cowboy_male', 1.85, guardMesh(gd.col || '#5a6a3a')); const lamp = new THREE.PointLight('#fff3a0', 1.2, 22); lamp.position.set(0.4, 1.4, 0.8); m.add(lamp); const c = coneMesh(S.L, S.half); W.scene.add(m); W.scene.add(c); const [x, z] = gd.path[0]; return Object.assign({ x, z, h: 0, wi: 1, wait: 0, m, c, sp: 2.4, look: 0 }, gd); });
  S.items.forEach((it) => { it.sp = emojiSprite(it.e, 2.6); it.sp.position.set(it.x, W.H(it.x, it.z) + 2.2, it.z); W.scene.add(it.sp); it.done = false; });
  W.calm = 1; W.noFire = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); return S; };
W.stealthEnd4 = function () { const S = W.st4; if (!S) return; S.guards.forEach((g) => { W.scene.remove(g.m); W.scene.remove(g.c); }); S.items.forEach((it) => W.scene.remove(it.sp)); W.st4 = null; W.calm = 0; W.noFire = 0; };
clear4.push(() => W.stealthEnd4());
function guardStep(g, dt, S) { const P = g.path;
  if (g.look > 0) { g.look -= dt; const want = Math.atan2(R.x - g.x, R.z - g.z); g.h += Math.atan2(Math.sin(want - g.h), Math.cos(want - g.h)) * Math.min(1, dt * 3); }
  else if (g.wait > 0) { g.wait -= dt; g.h = g.h0 + Math.sin((g.wait) * 1.6) * 0.9; }
  else { const [tx, tz] = P[g.wi], dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz); if (d < 1) { g.wi = (g.wi + 1) % P.length; g.wait = g.pause || 2; g.h0 = g.h; } else { g.x += dx / d * g.sp * dt; g.z += dz / d * g.sp * dt; const want = Math.atan2(dx, dz); g.h += Math.atan2(Math.sin(want - g.h), Math.cos(want - g.h)) * Math.min(1, dt * 4); } }
  const y = W.H(g.x, g.z); g.m.position.set(g.x, y, g.z); g.m.rotation.y = g.h; if (g.m.anim) { g.m.anim.userData.mixer.update(dt); const w = g.wait > 0 || g.look > 0 ? g.m.clipIdle : g.m.clipWalk; if (w) g.m.anim.userData.play(w); } g.c.position.set(g.x, y + 0.9, g.z); g.c.rotation.y = g.h;
  const rx = R.x - g.x, rz = R.z - g.z, d = Math.hypot(rx, rz), da = Math.abs(Math.atan2(Math.sin(Math.atan2(rx, rz) - g.h), Math.cos(Math.atan2(rx, rz) - g.h)));
  const sp = Math.abs(R.v), seen = d < S.L && da < S.half + 0.08, loud = sp > S.quiet && d < (sp > 12 ? 40 : 26);
  if (loud && g.look <= 0) { g.look = 2.2; W.toast('👂 Сторож слышит мотор — тише! (меньше газа)'); }
  if (loud) S.sus += dt * (sp > 12 ? 22 : 10); g.c.material.color.set(seen ? '#ff5a3a' : g.look > 0 ? '#ffb03a' : '#fff27a'); return seen ? (1.2 - d / S.L * 0.7) * (sp > S.quiet ? 3 : 1) : 0; }
W.stealthStep4 = function (dt) { const S = W.st4; if (!S) return; let see = 0; S.guards.forEach((g) => (see += guardStep(g, dt, S))); S.sus = Math.max(0, Math.min(100, S.sus + (see > 0 ? see * 60 * dt : -14 * dt)));
  let near = null; for (const it of S.items) if (!it.done && Math.hypot(it.x - R.x, it.z - R.z) < (S.pickR || 6)) near = it;
  if (near && Math.abs(R.v) < 2.5) { S.hold += dt; if (S.hold > S.take) { near.done = true; S.got++; S.hold = 0; W.scene.remove(near.sp); sfx('coin'); W.toast(near.e + ' ' + near.name + ' — у нас!'); } } else S.hold = Math.max(0, S.hold - dt * 2);
  const left = S.items.filter((it) => !it.done), go = left[0] ? left.slice().sort((a, b) => Math.hypot(a.x - R.x, a.z - R.z) - Math.hypot(b.x - R.x, b.z - R.z))[0] : S.exit;
  if (W.obj) { W.obj.x = go.x; W.obj.z = go.z; }
  $('wdObj').innerHTML = (left.length ? S.label + ': <b>' + S.got + ' из ' + S.items.length + '</b>' + (S.hold > 0 ? ' · сматываю ' + Math.round(S.hold / S.take * 100) + '%' : '') : '🚤 Уходи к лодке Лидии') + ' · 👁 <b style="color:' + (S.sus > 60 ? '#ff6a4a' : S.sus > 25 ? '#ffc04a' : '#9f9') + '">' + Math.round(S.sus) + '%</b> · тише едешь — дальше будешь';
  if (S.sus >= 100) { S.sus = 0; sfx('caught'); S.onCaught(); return; }
  if (!left.length && Math.hypot(S.exit.x - R.x, S.exit.z - R.z) < 12) { const f = S.onWin; W.stealthEnd4(); f(); } };

/* =====================================================================
   ГЛАВА 1 — по плану: дрон Вали с рассадой (погоня, горшки на ходу) → оборона теплиц с заграждениями → турель у Лёхи (сборка) → королева гнезда (выбор) → Колян
   ===================================================================== */
(function ch1() { const S = A.CHAPTERS[1]; if (!S) return; const fi = S.findIndex((s) => s.id === 'farm'), rz = S.find((s) => s.id === 'rzhav'), bo = S.find((s) => s.id === 'boss'); if (fi < 0 || !rz || !bo) return;
  const drone = { id: 'drone1', start() { A.setObj('Заправка «У Петровича»: за топливом', byId('station')); W.toast('👆 Левый палец — руль и газ. Едем к Петровичу!'); }, arrive: 'station',
    onArrive() { W.st.fuel = 100; W.talk([['petr', 'О, Таня! Бак залил — за счёт заведения. Ой… смотри, дрон Вали тащит твою рассаду!'], ['valya', 'Таня, это не я! Это мой дрон сам! Он у меня… <i>самостоятельный</i>.'], ['ded', 'Таня, газуй за ним! Горшки роняет — лови на ходу. А я его солью!']], () => run()); } };
  function run() { dEnd(); const st = byId('station'); const lx = byId('liner'), a0 = Math.atan2(lx.x - st.x, lx.z - st.z), e = W.spawn('glub', st.x + Math.sin(a0) * 40, st.z + Math.cos(a0) * 40, { hpK: 12, keep: 1, drone: 1, ai: dAI, immune: true, immMsg: '🛸 высоко! догоняй и лови горшки' }); if (e) e.scl = 1.7; W.dr1 = { e, t: 2, pots: [], got: 0 }; A.setObj('Догони дрон: лови горшки 🪴, сбей дрон', null); }
  function dEnd() { if (W.dr1) { W.dr1.pots.forEach((q) => !q.done && W.scene.remove(q.sp)); if (W.dr1.e) W.dr1.e.dead = true; W.dr1 = null; } }
  clear4.push(dEnd);
  function dAI(e, dt, d) { const c = byId('liner'), tx = c.x - e.x, tz = c.z - e.z, td = Math.hypot(tx, tz) || 1, sp = d < 25 ? 10 : d > 70 ? 4 : 7; e.vx += ((tx / td) * sp - e.vx) * dt * 2; e.vz += ((tz / td) * sp - e.vz) * dt * 2; if (td < 25 && W.dr1) W.dr1.esc = 1; }
  drone.tick = function (dt) { const D = W.dr1; if (!D) return; const e = D.e; D.t -= dt; D.it = (D.it || 0) + dt; if (e && e.immune && D.it > 8) { e.immune = false; W.toast('🛸 Дрон снизился — стреляй!'); }
    if (e && !e.dead && D.t <= 0) { D.t = 2.6; D.pots.push(A.mkPick(e.x, e.z, '🪴', 'pot')); }
    for (const q of D.pots) if (!q.done && Math.hypot(q.x - R.x, q.z - R.z) < 5.5) { q.done = true; W.scene.remove(q.sp); D.got++; W.give('money', 40); if (D.got % 2 === 0) W.give('food', 1); sfx('j_found', { vol: 0.5 }); W.toast('🪴 Горшок пойман! +40 ₽'); }
    if (e && W.obj) { W.obj.x = e.x; W.obj.z = e.z; } $('wdObj').innerHTML = '🛸 Дрон Вали: <b>' + (e ? Math.max(0, Math.round(e.hp / e.max * 100)) : 0) + '%</b> · 🪴 поймано: <b>' + D.got + '</b> · не дай улететь к лайнеру';
    if (!e || e.dead) { const g = D.got; dEnd(); W.give('food', 2); W.give('money', 60); W.talk([['tanya', 'Рассада спасена! ' + (g ? 'И ' + g + ' горшков — на ходу поймали!' : 'Хоть один помидор доживёт до свадьбы внука.')], ['gena', '<b>Марс-ФМ</b> на связи! У теплиц колонии замечены жуки. Целые колонны! С транспарантами!']], () => A.adv()); }
    else if (D.esc) { dEnd(); W.talk([['valya', 'Улетел к лайнеру… Ой, вернулся! Сам. На заправку. Он у меня домашний.'], ['ded', 'Таня, второй раунд. Жми, я целюсь.']], () => run()); } };
  const fa = S[fi]; fa.onArrive = function () { W.talk([['ded', 'Вон они, Таня! С транспарантами! «Ботва — народу!»'], ['tanya', 'Ящики у теплиц — ставь заграждения на жёлтых кругах, пока жуки далеко. Ни одного огурца врагу!']], () => run2()); };
  function run2() { const f = byId('farm'), g = { x: f.x, z: f.z }, slots = [], spawns = []; [[1, 0.2], [-0.3, 1], [0.2, -1]].forEach(([ax, az]) => { const l = Math.hypot(ax, az); ax /= l; az /= l; slots.push({ x: g.x + ax * 22, z: g.z + az * 22 }, { x: g.x + ax * 42, z: g.z + az * 42 }); spawns.push([g.x + ax * 85, g.z + az * 85]); });
    W.def4({ gate: g, slots, spawns, waves: [4, 6, 8], per: 2, build: 14, type: 'bug', chew: 16, bite: 4, hpK: 1.2, label: '🌱 Теплицы',
      onWin() { W.give('food', 4); W.give('money', 200); W.give('ammo', 40); W.talk([['gena', 'Колония празднует! Теплицы целы.'], ['ded', 'Таня, Колян грабит караваны. Надо в Ржавобург — там внук Лёха механиком. Пусть турель мне соберёт.']], () => A.adv()); },
      onFail() { W.talk([['valya', 'Теплицу прогрызли! Мы залатали плёнкой — давай снова, ставь ящики, где жуков больше.']], () => run2()); } }); A.setObj('Ставь заграждения 🧱, потом отбей жуков', g); }
  fa.tick = function (dt) { const D = W.df4; if (!D) return; W.defStep4(dt); const D2 = W.df4; if (!D2) { if (W.roof1) { W.roof1 = null; W.lockY = undefined; R.x = byId('farm').x + 18; R.z = byId('farm').z + 18; R.y = W.H(R.x, R.z); } W.rideEnd4(); return; }
    if (D2.phase === 'build') { if (W.roof1) { W.roof1 = null; W.lockY = undefined; R.x = D2.gate.x + 6; R.z = D2.gate.z + 8; R.y = W.H(R.x, R.z); } if (!W.rd4) { W.ride4({ mesh: 'granny', parked: 1, vmax: 8, noFire: 1, bob: 1 }); W.toast('🚶‍♀️ Бабуля таскает ящики на руках — к жёлтым кругам!'); } }
    else { if (W.rd4) { W.rideEnd4(); W.roof1 = 1; W.toast('👴 Дед на крыше теплицы! Крути джойстиком и стреляй'); } const g = D2.gate; R.x = g.x; R.z = g.z; R.v = 0; W.lockY = W.H(g.x, g.z) + 6; const J = BM.JOY; if (J && J.id != null) R.h -= J.x * dt * 1.8; if (W.keys) { if (W.keys.has('ArrowLeft') || W.keys.has('KeyA')) R.h += dt * 1.8; if (W.keys.has('ArrowRight') || W.keys.has('KeyD')) R.h -= dt * 1.8; } } };
  clear4.push(() => { if (W.roof1) { W.roof1 = null; W.lockY = undefined; } });
  rz.onArrive = function () { W.flags.workshop = 1; W.talk([['lyokha', 'Ба! Дед! На этом вы приехали?! Это не марсоход, это кастрюля на колёсах.'], ['lyokha', 'Турель на крышу? Соберём! Только детали все похожие — держи чертёж. А Гоша опять что-то притащил.']], () => run3()); };
  function run3() { W.assemble4({ title: '🔧 Мастерская Лёхи: турель для деда', rules: 'Чертёж называет деталь — выбери именно её. Лишние детали подсовывает Гоша.', maxErr: 2, gosha: 0.45, goshaItem: '🐟 рыбья косточка от Гоши', okSay: ['Лёха: «Во!»', 'Дед: «Красота»', 'Щёлк!'],
      parts: [{ need: 'Поворотный круг большой', ok: 'Круг большой', bad: ['Круг малый', 'Сковородка'], e: '⭕' }, { need: 'Стойка с двумя болтами', ok: 'Стойка 2 болта', bad: ['Стойка 3 болта', 'Ножка табурета'], e: '🔩' }, { need: 'Ствол для соли, широкий', ok: 'Ствол широкий', bad: ['Ствол узкий', 'Труба самовара'], e: '🧂' }, { need: 'Прицел с красной точкой', ok: 'Прицел красный', bad: ['Прицел зелёный', 'Очки деда'], e: '🎯' }] },
    () => { const w = W.WEAP.salt; if (w.lv < 5) w.lv++; W.give('parts', 3); W.toast('🔧 Турель на крыше: солевой дробовик сильнее!'); W.talk([['lyokha', 'Готово! Мастерская открыта — приносите детали ⚙.'], ['lyokha', 'И ещё: гнездо клопов на юго-востоке мешает караванам. Королева там… разговорчивая. Сходите, поговорите — от неё зависит, с кем будет Колян.']], () => { A.save(); A.adv(); }); },
    () => W.talk([['lyokha', 'Лишние детали остались — значит, неправильно. Разбираем!']], () => run3())); }
  const nest = { id: 'nest1', start() { A.setObj('Гнездо клопов: поговорить с королевой', byId('nest')); }, arrive: 'nest',
    onArrive() { W.flags.nestDone = 1; const p = byId('nest'); W.talk([['ded', 'Таня, «Буханка» в гнездо не пролезет. Ходы узкие.'], ['tanya', 'Пойду сама. С пирожками. Клопы — они как куры: не беги, и не тронут.']], () => { W.ride4({ mesh: 'granny', parked: 1, vmax: 7, noFire: 1, bob: 1 }); W.calm = 1; W.qbugs = []; for (let k = 0; k < 10; k++) { const a = k * 0.63, r = 10 + (k % 3) * 6; const e = W.spawn('bug2', p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, { keep: 1, ai: qbugAI }); if (e) W.qbugs.push(e); } W.qwalk = 1; A.setObj('Подойди к королеве пешком · не беги!', p); }); },
    talkQ() { W.talk([['queen', 'Кто посмел наступить на мой огород… то есть гнездо? А-а, бабка с солью. Колян обещал нам ваши огурцы.'],
      { who: 'queen', text: 'Ну? Что предложишь, чтобы мы ушли?', ch: [
        { t: '🫙 Банку варенья — и уходите', sub: '−20 соли; в бою с Коляном жуков не будет', ok: () => W.st.ammo >= 20, fn() { W.st.ammo -= 20; W.flags.q1 = 'gift'; } },
        { t: '🏘 Переезжайте в Ржавобург — там тепло', sub: 'рой королевы будет кусать Коляна', fn() { W.flags.q1 = 'ally'; } },
        { t: '⚔ Уходите, а то дед!', sub: 'бой с королевой сейчас; потом жуков у Коляна не будет', fn() { W.flags.q1 = 'fight'; } }] }], () => { W.rideEnd4(true); W.calm = 0; (W.qbugs || []).forEach((e) => (e.dead = true)); W.qbugs = null;
        if (W.flags.q1 === 'fight') { const p = byId('nest'); W.q1 = W.spawn('queen', p.x, p.z, { keep: 1 }); for (let k = 0; k < 8; k++) W.spawn('bug2', p.x + rnd(-25, 25), p.z + rnd(-25, 25)); sfx('j_boss'); A.setObj('Победи королеву гнезда', null); }
        else W.talk([['queen', W.flags.q1 === 'gift' ? 'Варенье! Уходим. Коляну передайте — пусть сам копает.' : 'В Ржавобург? С отоплением? Мы с вами, бабка! А Коляна мы покусаем.']], () => A.adv()); }); } };
  function qbugAI(e, dt) { e.vx = e.vz = 0; const d = Math.hypot(R.x - e.x, R.z - e.z); e.h = Math.atan2(R.x - e.x, R.z - e.z); if (d < 7 && Math.abs(R.v) > 4 && (e.bt = (e.bt || 0) - dt) <= 0) { e.bt = 1; W.hurt(6, 'клоп (бабуля бежала)'); W.toast('🪲 Не беги! Клопы кусают тех, кто бежит'); } }
  nest.tick = function (dt) { if (W.qwalk) { const p = byId('nest'), d = Math.hypot(R.x - p.x, R.z - p.z); $('wdObj').innerHTML = '🚶‍♀️ К королеве: <b>' + Math.round(d) + ' м</b> · иди тихо (не жми газ до упора)'; if (W.obj) { W.obj.x = p.x; W.obj.z = p.z; } if (d < 7) { W.qwalk = 0; R.v = 0; this.talkQ(); } return; } const q = W.q1; if (!q) return; if (W.obj) { W.obj.x = q.x; W.obj.z = q.z; } A.bossBar(q, 'Королева гнезда'); if (q.dead) { W.q1 = null; A.bossBar(null); W.give('money', 400); W.give('parts', 4); W.talk([['queen', 'Сдаюсь! Уходим за горизонт. Коляну не помогаем.']], () => A.adv()); } };
  clear4.push(() => { if (W.q1) { W.q1.dead = true; W.q1 = null; } });
  const bo0 = bo.onArrive; bo.onArrive = function () { bo0.call(this); };
  const bt = bo.tick; bo.tick = function (dt) { const b = W.boss; if (b && !b.q1) { b.q1 = 1; if (W.flags.q1 === 'gift' || W.flags.q1 === 'fight') { W.EN.forEach((e) => { if (e.type === 'bug2') e.dead = true; }); W.toast(W.flags.q1 === 'gift' ? '🫙 Жуки ушли за вареньем — Колян один!' : '🍄 Королева не пришла на помощь Коляну'); } else if (W.flags.q1 === 'ally') { W.toast('🍄 Рой королевы на твоей стороне!'); b.qt = 8; } }
    if (b && !b.dead && W.flags.q1 === 'ally' && !W.paused) { b.qt -= dt; if (b.qt <= 0) { b.qt = 9; W.hitEnemy(b, b.max * 0.06); burst(W.scene, b.x, b.y + 2, b.z, 'spark', '#ff6ad5', 4, 0.6); W.toast('🪲 Рой покусал Коляна!'); } } bt.call(this, dt); };
  bo.start = function () { A.setObj('Логово Бешеного Коляна', byId('camp')); };
  // новый порядок: дрон на заправке → теплицы → Ржавобург → гнездо → Колян
  const order = [drone, S[fi], rz, nest, bo]; S.length = 0; order.forEach((q) => S.push(q));
})();

/* =====================================================================
   ГЛАВА 2 — по плану: серпантин без бортов (точность, ветер) → торг с мародёрами → смерч (бой в воздухе) → шлюзы Лабиринта Ночи → баржа
   ===================================================================== */
(function ch2() { const S = A.CHAPTERS[2]; if (!S) return; const de = S.find((s) => s.id === 'descent'), gi = S.findIndex((s) => s.id === 'gorge'), pi = S.findIndex((s) => s.id === 'pip'); if (!de || gi < 0 || pi < 0) return;
  // серпантин: порывы ветра сбоку; съехал с дороги — сорвался, возвращаемся на последнюю точку
  de.tick = function (dt) { if (this.arrived || W.paused || !W.obj || W.mini.cur()) return; const G = W.ser2 = W.ser2 || { t: 5, on: 0, off: 0, last: { x: R.x, z: R.z, h: R.h }, lt: 0, falls: 0 };
    const ri = W.roadInfo(R.x, R.z), rd = ri[0], drop = ri[1] - R.y; if (rd < 5) { G.seen = 1; G.lt -= dt; if (G.lt <= 0) { G.lt = 1; G.last = { x: R.x, z: R.z, h: R.h }; } G.off = 0; } else if (G.seen && rd > 7 && drop > 4) G.off += dt; else G.off = Math.max(0, G.off - dt);
    G.t -= dt; if (G.t <= 1.5 && !G.warn) { G.warn = 1; W.toast('💨 Сейчас дунет ветер — держи руль!'); sfx('warn', { vol: 0.4 }); } if (G.t <= 0) { G.on = 2.2; G.t = rnd(6, 9); G.warn = 0; G.dir = Math.random() < 0.5 ? -1 : 1; }
    if (G.on > 0) { G.on -= dt; const f = 7 * G.dir; W.windX = Math.cos(R.h) * f; W.windZ = -Math.sin(R.h) * f; } else W.windX = W.windZ = 0;
    if (G.off > 1.6) { G.off = 0; G.falls++; W.windX = W.windZ = 0; R.x = G.last.x; R.z = G.last.z; R.h = G.last.h; R.v = 0; R.y = W.H(R.x, R.z); W.hurt(8, 'сорвался с серпантина'); flash('#ffffff', 0.3); W.toast('😱 Сорвались! Кран поднял обратно на дорогу'); }
    $('wdObj').innerHTML = '🛣 Серпантин без бортов: держись дороги' + (G.on > 0 ? ' · <b style="color:#ffd24a">💨 ВЕТЕР!</b>' : '') + (G.falls ? ' · срывов ' + G.falls : ''); };
  clear4.push(() => { W.ser2 = null; });
  de.onArrive = function () { W.windX = W.windZ = 0; W.ser2 = null; W.talk([['tanya', 'Сколько кораблей… Как будто тут парковались без разметки.'], ['ded', 'Таня, тут мародёры. У них что-то с баржи — бумажки какие-то.'], ['marod', 'Бортовой журнал баржи «ТрансГалактик»! Там написано, куда везут ваш огород. Продаём. За соль.']], () => run()); };
  function run() { W.trade4({ title: '🦴 Торг с мародёрами', icon: '📜🦴', price: 50, unit: ' 🧂', have: () => '🧂 ' + W.st.ammo, patience: 3, hello: 'Мародёр: «Полсотни соли — и журнал ваш»', rules: 'Цена — в соли деда 🧂. Сбивай, но не зли их. Можно подсунуть «журнал-фальшивку» — но пираты у пристани узнают.',
      acts: (o) => [
        { t: '📉 Это же макулатура!', fn() { o.pat--; if (Math.random() < 0.7) { o.price = Math.max(10, o.price - 12); return 'Мародёр: «Ладно, ' + o.price + '»'; } return 'Мародёр: «Сама ты макулатура»'; } },
        { t: '🥟 Пирожок в придачу', fn() { if (W.st.food < 1) return 'Пирожков нет'; W.st.food--; o.price = Math.max(10, o.price - 8); o.pat = Math.min(3, o.pat + 1); return 'Мародёр жуёт: «−8. Вкусно, бабка»'; } },
        { t: '💬 «Пип вам привет передавал»', fn() { if (o.pip) { o.pat--; return 'Мародёр: «Какой ещё Пип?»'; } o.pip = 1; o.price = Math.max(10, o.price - 10); return 'Мародёр: «Пип?! Кактус? Он мне должен… ну ладно, −10»'; } },
        { t: '🧾 Обменять на «журнал» деда', fn() { o.done = 1; W.flags.cheat2 = 1; setTimeout(() => o.win(), 900); return 'Мародёр: «Журнал на журнал? Беру!» (это был журнал «Огородник» 1987 года)'; } },
        { t: '🤝 По рукам', fn() { if (W.st.ammo < o.price) return 'Соли не хватает'; W.st.ammo -= o.price; o.done = 1; W.flags.cheat2 = 0; setTimeout(() => o.win(), 700); return 'Мародёр: «Честная бабка!»'; } }] },
    () => { W.give('parts', 3); W.give('hull', 60); W.talk([['tanya', 'Журнал баржи! «Груз: огород, бабкин, 1 шт. Курс — Ксар-Тала». Ах вы, ворюги!'], ['ded', 'Таня, в кустах кто-то стонет. Кажется, марсианин.']], () => A.adv()); },
    () => W.talk([['marod', 'Всё, обиделись! …Ладно, вернулись. Торгуемся снова.']], () => run())); }
  const tw = { id: 'twister2', start() { A.setObj('Пыльная равнина за кораблём Пипа', byId('tw2')); }, arrive: 'tw2',
    onArrive() { W.talk([['gena', 'Пылевой вихрь в Долинах Маринер! Высота — как три пятиэтажки. Бабушки, держите шляпы!'], ['pip', 'Он нас поднимет! В воздухе вокруг — пузыри-летуны. Стреляй на лету!']], () => { W.lift = 14; W.liftEnd = W.t + 16; W.tw2 = { k: 0 }; sfx('warn'); W.toast('🌪 СМЕРЧ ПОДНЯЛ МАРСОХОД!'); for (let k = 0; k < 10; k++) W.spawn('glub', R.x + rnd(-25, 25), R.z + rnd(-25, 25), { tw2: 1 }); A.setObj('Отстреливайся в воздухе: сбей 8 летунов', null); }); },
    tick() { if (!W.tw2) return; const k = W.EN.filter((e) => e.tw2 && e.dead && !e.cnt2).length; W.EN.forEach((e) => { if (e.tw2 && e.dead) e.cnt2 = 1; }); W.tw2.k += k; const al = W.EN.filter((e) => e.tw2 && !e.dead); if (al[0] && W.obj) { W.obj.x = al[0].x; W.obj.z = al[0].z; } $('wdObj').innerHTML = '🌪 Бой в воздухе: сбито <b>' + Math.min(8, W.tw2.k) + ' из 8</b>' + (W.liftEnd ? ' · смерч ещё ' + Math.max(0, Math.ceil(W.liftEnd - W.t)) + ' с' : '');
      if (W.liftEnd && W.t > W.liftEnd - 3 && !W.liftSaid) { W.liftSaid = 1; W.say('<b>Баба Таня:</b> Ваня, открывай зонтик! Мягкая посадка!'); }
      if (W.liftEnd && W.t > W.liftEnd) { W.liftEnd = 0; W.liftSaid = 0; const ok = W.tw2.k >= 8; W.tw2 = null; W.EN.forEach((e) => { if (e.tw2) e.dead = true; });
        if (ok) { W.give('money', 700); W.give('ammo', 40); W.talk([['ded', 'Сели. Зонтик — в клочья. Летуны — тоже.'], ['pip', 'Впереди Лабиринт Ночи: колодцы, шлюзы шахтёров. Баржа ушла туда — шлюзы затопили, чтобы нас задержать.']], () => A.adv()); }
        else W.talk([['pip', 'Мало сбили — летуны гонятся! Смерч возвращается… держитесь!']], () => this.onArrive()); } } };
  const lab = { id: 'drill2', start() { A.setObj('Колодцы Лабиринта Ночи: бур «Крот»', byId('noctis')); }, arrive: 'noctis',
    onArrive() { W.talk([['pip', 'Лабиринт Ночи — сеть провалов и колодцев. Пираты завалили проход. Но у шахтёров тут бур «Крот» — пойдём под землёй!'], ['tanya', 'Ваня, держи Гошу. Я за рычаги.']], () => run2()); } };
  function run2() { W.dive4({ title: '🔩 Бур «Крот»: в недра Лабиринта Ночи', rules: 'Бур идёт вниз сам. ◀ ▶ — в сторону. Лава 🔥 и газ 💨 — в обход, бур греется; водяные жилы 💧 охлаждают. Пробейся на 300 м к подземной реке.', bg: '#3a1a10', layers: ['#5a2a1a', '#6a3420', '#4a2216', '#7a4026'], me: '🔩', side: 0.9, speed: 9, goal: 300, every: 0.5, meter0: 25, meterRate: 3.4, meterName: '🌡 нагрев бура', meterBad: (m, end) => (end ? m >= 100 : m > 70),
      kinds: [{ e: '🔥', r: 16, meter: 22, say: '🔥 Лава! Бур раскалился' }, { e: '💨', r: 14, hull: 12, say: '💨 Газовый карман!' }, { e: '💧', r: 14, meter: -28, say: '💧 Водяная жила — остываем' }, { e: '🪨', r: 18, hull: 8, say: '🪨 Твёрдая порода' }, { e: '💎', r: 12, meter: -5, say: '💎 Кристалл! (в копилку)' }, { e: '🔥', r: 16, meter: 22 }],
      hello: 'Пип: «Шахтёрский бур! Внизу — подземная река, по ней обойдём затворы»', okSay: '🌊 Пробились к подземной реке!', failSay: '💥 Бур перегрелся / разбит — поднимаем и чиним' },
    () => { W.give('money', 800); W.give('parts', 4); W.talk([['pip', 'Подземная река! По ней — прямо к пристани, мимо затворов пиратов.'], ['ded', 'Таня, мы теперь шахтёры. С бородой мне пойдёт.']], () => A.adv()); }, () => run2()); }
  // баржа: обман мародёров всплывает — пираты знают, что журнал у вас
  const dk = S.find((s) => s.id === 'dock'); if (dk) { const oa = dk.onArrive; dk.onArrive = function () { oa.call(this); if (W.flags.cheat2) { setTimeout(() => { const d = byId('dock'); for (let k = 0; k < 4; k++) W.spawn('pirate', d.x + rnd(-50, 50), d.z + rnd(-50, 50), { ai: W.pirateAI || undefined }); W.toast('🦴 Мародёры нажаловались пиратам: «Бабка с фальшивым журналом!» +4 пирата'); }, 1500); } }; }
  S.splice(gi, 1); const pi2 = S.findIndex((s) => s.id === 'pip'); S.splice(pi2 + 1, 0, tw, lab);
})();

/* =====================================================================
   ГЛАВА 3 — по плану: таможня (выбор) → город → слежка за фургоном → тир у кратера-смайлика → фото Лица → настройка антенн → Зурга
   ===================================================================== */
(function ch3() { const S = A.CHAPTERS[3]; if (!S) return; const mu = S.find((s) => s.id === 'museum'), fa = S.find((s) => s.id === 'face'), an = S.find((s) => s.id === 'antennas'); if (!mu || !fa || !an) return;
  function van() { let mesh; if (MODELS.spacetruck || MODELS.k_rover) { const b = new Builder([]); b.add(MODELS.spacetruck || MODELS.k_rover, mat(0, 0, 0, 5, 5, 5), null, { vcol: true, vk: 0.9 }); mesh = new THREE.Mesh(b.build(), bakedMat); } else mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 6), new THREE.MeshLambertMaterial({ color: '#4a6a8a' })); const g = new THREE.Group(); g.add(mesh); const sp = emojiSprite('🥕', 2.4); sp.position.y = 5; g.add(sp); return g; }
  mu.onArrive = function () { W.talk([['tanya', 'Здравствуйте. Это мой огород. Верните, пожалуйста.'], ['pip', 'Смотритель говорит: «Экспонат упал с неба — значит, подарок».'], ['ksar', '<b>Ксар-ФМ</b>: Ограбление в Музее землян! Фургон с огородом уходит!'], ['pip', 'Не стреляй! Запускаю дрон — проследим сверху, узнаем заказчика. Держись подальше, а когда водитель оглядывается 👀 — зависни.']], () => run()); };
  function dronePads(m) { (W.pads3 || []).forEach((q) => W.scene.remove(q.ring)); W.pads3 = [[-110, 225], [-190, 175], [-250, 80], [-330, -20]].map(([x, z]) => ({ x, z, ring: A.ring11(x, z, '#ffd24a', 7) })); }
  clear4.push(() => { (W.pads3 || []).forEach((q) => W.scene.remove(q.ring)); W.pads3 = null; W.bat3 = null; });
  function run() { const m = byId('museum'); W.rideEnd4(); W.ride4({ mesh: 'drone', fly: 1, alt: 24, flyK: 1.05, parked: 1, noFire: 1, bank: 0.3 }); W.bat3 = 100; dronePads(m); W.toast('🛸 Ты ведёшь дрон Пипа! Батарея садится — подзаряжайся над 🟡 солнечными крышами');
    W.tail4({ label: 'Фургон похитителей', path: [[m.x + 10, m.z - 10], [-120, 200], [-200, 150], [-290, 30], [-380, -80]], sp: 8, see: 55, near: 20, far: 100, lostMax: 7, mesh: van,
      onWin() { const tx = R.x, tz = R.z; W.rideEnd4(); R.x = tx + 10; R.z = tz + 10; R.y = W.H(R.x, R.z); (W.pads3 || []).forEach((q) => W.scene.remove(q.ring)); W.pads3 = null; W.bat3 = null; W.give('money', 600); W.give('parts', 3); W.talk([['ded', 'Дрон сел, я подогнал «Буханку» следом.'], ['tanya', 'Остановились у кратера-смайлика. Открываю… А где огород?! Тут только пугало. В моём халате. И записка.'], ['none', '<i>«Огород — у меня. Хотите обратно — сначала помойте мой портрет в Кидонии. Тёща Зурга.»</i>'], ['pip', 'Ой! Клопы лезут грызть смайлик — это гордость Ксар-Талы! Там есть вышка — защищай с неё!']], () => A.adv()); },
      onFail(why) { W.rideEnd4(true); W.talk([['pip', why === 'battery' ? 'Батарея села — дрон спланировал к музею. Заряжаем и снова!' : why === 'seen' ? 'Водитель нас заметил и вернулся к музею! Ждём, пока поедет снова.' : 'Потеряли! Он опять у музея — пробуй ещё.']], () => run()); } }); A.setObj('Следи за фургоном', m); }
  mu.tick = function (dt) { if (!W.tl4) return; if (W.bat3 != null) { const pad = (W.pads3 || []).find((q) => Math.hypot(q.x - R.x, q.z - R.z) < 10); W.bat3 = Math.max(0, Math.min(100, W.bat3 + (pad ? 18 : -1.6) * dt)); if (W.bat3 <= 0) { const f = W.tl4.onFail; W.tailEnd4(); f('battery'); return; } } W.tailStep4(dt); if (W.tl4 && W.bat3 != null) $('wdObj').innerHTML += ' · 🔋 <b style="color:' + (W.bat3 < 25 ? '#ff6a4a' : '#9f9') + '">' + Math.round(W.bat3) + '%</b>'; };
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
  function run() { const P = [[-215, -175], [-170, -150], [-140, -130], [-110, -100], [-80, -75], [-60, -60]]; const g = { x: 0, z: 0, i: 0, sp: animModel(new THREE.Group(), 'h_worker_male', 1.3, personMesh('#6a4a2a')), far: 0 }; W.scene.add(g.sp);
    W.foot4({ label: 'За гномом-проводником 🧔', goal: { x: P[P.length - 1][0], z: P[P.length - 1][1] }, goalE: '🗺', spots: [], drain: 0, noWarm: 1,
      extra(dt, F) { if (!g.init) { g.init = 1; g.x = R.x + 5; g.z = R.z + 5; } const d = Math.hypot(g.x - R.x, g.z - R.z), tg = P[g.i]; if (tg && d < 16) { const tx = tg[0] - g.x, tz = tg[1] - g.z, tl = Math.hypot(tx, tz); if (tl < 1) g.i++; else { g.x += tx / tl * 4.2 * dt; g.z += tz / tl * 4.2 * dt; } }
        g.sp.position.set(g.x, W.H(g.x, g.z), g.z); if (tg) g.sp.rotation.y = Math.atan2(tg[0] - g.x, tg[1] - g.z); if (g.sp.anim) { g.sp.anim.userData.mixer.update(dt); const w = d < 16 && tg ? g.sp.clipWalk : g.sp.clipIdle; if (w) g.sp.anim.userData.play(w); } g.far = d > 32 ? g.far + dt : 0; if (W.obj) { W.obj.x = g.x; W.obj.z = g.z; }
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
  // играешь за кота Гошу: щель, куда «Буханка» не пролезет; в гроте поют кристаллы
  go.start = function () { W.talk([['gosha', 'Мяу. (Гоша нашёл щель в скале. Узкую. Пахнет картошкой.)'], ['ded', 'Таня, «Буханка» туда не пролезет. А кот пролезет. Пусть ведёт — а мы по его следу объедем.'], ['pip', 'Теперь ты — Гоша! Беги по запаху 🟡, в тёмном гроте кошачьи глаза видят.']], () => catGo()); };
  function catGo() { const pts = [[285, 105], [430, -330], [560, -170], [610, 60], [580, 260], [470, 395]]; W.ride4({ mesh: W.catVeh ? W.catVeh('helmet') : 'cat', parked: 0, hover: 1, cam: 0.55, vmax: 14, noFire: 1, bob: 1 }); const pa = Math.atan2(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]); R.x = pts[0][0] + Math.sin(pa) * 12; R.z = pts[0][1] + Math.cos(pa) * 12; R.h = pa; R.y = W.H(R.x, R.z); W.noColl = 1; W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; });
    W.cat4 = { pts, i: 1, ring: A.ring11(pts[1][0], pts[1][1], '#ffd24a', 6) }; A.setObj('🐱 Беги по запаху картошки', { x: pts[1][0], z: pts[1][1] }); }
  function catEnd() { const C = W.cat4; if (!C) return; if (C.ring) W.scene.remove(C.ring); W.cat4 = null; W.noColl = 0; W.calm = 0; }
  clear4.push(catEnd);
  go.tick = function (dt) { const C = W.cat4; if (!C || W.paused) return; const p = C.pts[C.i], d = Math.hypot(p[0] - R.x, p[1] - R.z); if (W.obj) { W.obj.x = p[0]; W.obj.z = p[1]; }
    $('wdObj').innerHTML = '🐱 Ты — Гоша: запах картошки <b>' + Math.round(d) + ' м</b>' + (W.dark2 > 0 ? ' · 🌑 темно — кошачьи глаза видят' : '');
    if (d < 9) { if (C.i === 1 && !C.sang) { C.sang = 1; W.dark2 = 12; R.v = 0; W.talk([['pip', 'Грот! Темно — фары тут не нужны, у Гоши глаза светятся. Слышишь? Кристаллы поют.'], ['tanya', '<i>(по рации)</i> Гоша, повтори за ними — я в хоре пела, подскажу!']], () => sing()); return; } if (C.sang === 1) return;
      W.scene.remove(C.ring); C.i++; if (C.i >= C.pts.length) { const x = R.x, z = R.z; catEnd(); W.rideEnd4(); R.x = x - 8; R.z = z - 8; R.y = W.H(R.x, R.z); W.give('parts', 3); W.talk([['gosha', 'Мяу! (Гоша сидит у входа в огромную пещеру. Изнутри пахнет картошкой.)'], ['ded', 'Догнали по следу! Умница, Гоша. Вечером — сметана. Двойная.']], () => A.adv()); return; }
      C.ring = A.ring11(C.pts[C.i][0], C.pts[C.i][1], '#ffd24a', 6); sfx('pick', { vol: 0.5 }); } };
  function sing() { W.simon4({ title: '💎 Поющие кристаллы', rules: 'Кристаллы звенят по очереди — повтори мелодию. Каждый раз она длиннее.', keys: ['💎 до', '🔷 ре', '🔶 ми', '🟣 фа', '🟢 соль', '🔴 ля'], len0: 3, rounds: 3, ms: 680, dms: 60, minMs: 420, maxErr: 3, who: 'Кристаллы', alarm: 'Кристаллы обиделись и замолчали' },
    () => { if (W.cat4) W.cat4.sang = 2; W.give('money', 700); W.toast('💎 Проход в кристаллах открылся!'); }, () => W.talk([['ded', 'Таня, фальшиво. Давай ещё раз — кристаллы терпеливые.']], () => sing())); }
  // штреки — на вагонетке со стрелками
  const sht = S.find((s) => s.id === 'shtrek'); if (sht) { sht.onArrive = function () { W.talk([['kirka', '<i>(из-за завала)</i> Эй! Мы тут! Нас четверо, в разных штреках!'], ['moh', '«Буханка» в штреки не пролезет — садитесь в вагонетку! Стрелки переводите на ходу, своды трещат.'], ['ded', 'Таня, я толкаю, ты рулишь стрелками.']], () => runC()); }; sht.tick = () => {}; }
  function runC() { W.cart4({ title: '🛒 Вагонетка по штрекам', rules: 'Вагонетка едет сама. Жми на развилки ⇄ — стрелка покажет, куда она свернёт. Собери 4 шахтёров ⛑ и привези к выходу 🚪. Красный путь — обвал, вагонетка ждёт.', time: 110, speed: 75, collapse: 7, start: 'E', stations: ['A', 'B', 'C', 'D'],
      nodes: { E: [180, 395], J1: [180, 315], J2: [95, 245], J3: [265, 245], A: [40, 140], B: [140, 120], C: [225, 110], D: [325, 150], J4: [150, 200] },
      edges: [['E', 'J1'], ['J1', 'J2'], ['J1', 'J3'], ['J2', 'A'], ['J2', 'J4'], ['J4', 'B'], ['J4', 'C'], ['J3', 'C'], ['J3', 'D']], hello: 'Кирка: «Я в штреке слева! Тюбик — справа, Лом — где-то посередине…»' },
    () => { W.give('money', 500); W.give('parts', 5); W.give('fuel', 30); W.talk([['kirka', 'Все живы! Бабушка, вы — легенда шахты. Вот вам бочка топлива и детали.'], ['moh', 'Червь живёт за Подземным морем. Наши семьи как раз плывут туда на плоту — проводите?']], () => A.adv()); },
    () => W.talk([['kirka', 'Не успели — завалило! Мы откопались, вагонетка цела. Давай снова!']], () => runC())); }
  S.splice(di + 1, 0, foot); S.splice(S.findIndex((s) => s.id === 'sea'), 1, raft);
})();

/* =====================================================================
   ГЛАВА 5 — по плану: торг с профсоюзом медведей → хоккей → заслонки гейзеров → таран спящих медведей → спираль → дракон
   ===================================================================== */
(function ch5() { const S = A.CHAPTERS[5]; if (!S) return; const ar = S.find((s) => s.id === 'arrive'), gy = S.find((s) => s.id === 'geyser'), au = S.find((s) => s.id === 'aurora'); if (!ar || !gy || !au) return;
  ar.onArrive = function () { W.st.fuel = 100; W.give('food', 3); W.toast('⛽ Полярники заправили полный бак и дали пирожков'); W.talk([['potap', 'Профсоюз медведей Северной шапки приветствует! Лёд — наш. Хотите воды — платите: 40 банок варенья.'], ['tanya', 'Михал Потапыч?! Это ты у меня с дачи варенье унёс?!'], ['potap', 'Было дело. Вкусное. Потому и сорок. Торгуйтесь — профсоюз уважает торг.']], () => run()); };
  function run() { W.trade4({ title: '🐻‍❄️ Торг с профсоюзом медведей', icon: '🐻‍❄️🫙', price: 40, unit: ' 🫙', have: () => '🫙 ' + W.st.ammo, patience: 3, hello: 'Потапыч: «Сорок банок. Или хоккей — если смелые»', rules: 'Цена — в банках варенья (это патроны деда 🧂). Сбивай цену, следи за терпением ❤. Или вызови медведей на хоккей.',
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
  // хоккей — бабуля на коньках; спуск по спирали — на параплане
  const hk = S.find((s) => s.id === 'hockey'), sp = S.find((s) => s.id === 'spiral');
  if (hk) { hk.onArrive = function () { W.talk([['valera', 'Я — судья Валерий. Шайба — замороженная банка варенья. Ворота медведей — справа, ваши — слева. 90 секунд.'], ['tanya', 'Ваня, давай коньки. Я в 1971-м в «Золотой шайбе» за вратаря стояла.'], ['ded', 'Таня, на льду не затормозишь — разгоняйся заранее!']], () => { A.hockey5(); W.ride4({ mesh: 'granny', parked: 1, vmax: 14, glide: 1.3, noFire: 1, bank: 0.25 }); W.toast('⛸ Бабуля на коньках! Скользит — тормози заранее'); }); };
    hk.tick = function (dt) { if (W.hk) A.hockeyStep5(dt); else if (W.rd4) W.rideEnd4(true); }; }
  if (sp) { sp.onArrive = function () { W.talk([['pip', 'Отсюда вниз ведёт спиральная долина — её прорезал ветер, стекая с купола. Внизу — каньон Северный и… пар.'], ['valera', 'Десять колец, сто тридцать секунд. Вниз — на параплане! Ветер сдувает к краю.'], ['ded', 'Таня, я держу «Буханку» на тросе снизу. Ты лети.']], () => { A.race5(); W.ride4({ mesh: 'glider', fly: 1, alt: 30, flyK: 1.05, bank: 0.5 }); W.toast('🪂 Параплан! Кольца ведут вниз по спирали'); }); };
    sp.tick = function (dt) { if (W.race) { A.raceStep5(dt); if (W.rd4 && W.race) W.flyAlt = 7 + 23 * (1 - W.race.i / 10); } else if (W.rd4) { W.rideEnd4(); } }; }

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
  // хвост кометы — бабуля в скафандре с джетпаком, невесомость
  const cm = S.find((s) => s.id === 'comet'); if (cm) { const oa = cm.onArrive, ot = cm.tick; cm.onArrive = function () { W.talk([['pip', 'Хвост кометы — в открытом космосе над Фобосом. «Буханка» туда не взлетит. Бабуля, скафандр и ранец — в багажнике!'], ['tanya', 'В невесомости я ещё не летала. Только в автобусе на кочках.']], () => { oa.call(this); W.ride4({ mesh: 'jet', parked: 1, fly: 1, alt: 5, flyK: 0.9, glide: 1.1, vmax: 13, noFire: 1 }); W.toast('🧑‍🚀 Невесомость! Толкнулась — летишь, пока не затормозишь'); }); };
    cm.tick = function (dt) { if (W.rd4) W.rd4.burn = Math.abs(R.v) > 2; ot.call(this, dt); if (!W.ice6 && W.rd4) W.rideEnd4(true); }; }

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
  const cl = S.find((s) => s.id === 'cliff');
  const tb = document.createElement('button'); tb.textContent = '🔥 Тяга'; tb.style.cssText = 'position:fixed;right:18px;bottom:150px;z-index:40;display:none;min-width:120px;min-height:72px;border-radius:36px;border:3px solid #fff;background:#ff7a2a;color:#fff;font:inherit;font-size:18px'; document.body.appendChild(tb);
  const thr = { on: 0 }; tb.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); thr.on = 1; }; tb.onpointerup = tb.onpointerleave = tb.onpointercancel = () => (thr.on = 0);
  addEventListener('keydown', (e) => { if (W.rk7 && (e.code === 'Space' || e.code === 'KeyE')) thr.on = 1; }); addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'KeyE') thr.on = 0; });
  W.rkThr = thr;
  function rkStart() { const pd = byId('pad'); W.rideEnd4(); R.x = pd.x; R.z = pd.z; R.y = W.H(R.x, R.z); R.v = 0; R.h = Math.atan2(-40 - R.x, -125 - R.z); W.ride4({ mesh: 'rocket', fly: 1, flyK: 0.8, vmax: 14, noFire: 1 }); W.rk7 = { y: R.y, vy: 0, fuel: 100, up: 0 }; W.flyY = R.y; tb.style.display = 'block'; thr.on = 0;
    W.rk7.ring = A.ring11(-40, -125, '#7aff8a', 16); A.setObj('Долети ракетой на край обрыва и сядь мягко', { x: -40, z: -125 }); }
  function rkEnd() { tb.style.display = 'none'; if (W.rk7 && W.rk7.ring) W.scene.remove(W.rk7.ring); W.rk7 = null; }
  clear4.push(() => { rkEnd(); });
  if (cl) { cl.onArrive = function () { W.talk([['ded', 'Таня, обрыв. До верха — как до Луны. Ну, не до Луны. До Фобоса.'], ['pip', 'Ракета на «Буханке» больше не держится — садись в саму ракету! Держи 🔥 тягу — летишь вверх, отпустишь — падаешь. Топлива мало. Садись мягко на зелёный круг.'], ['tanya', 'Держись за Гошу. Ракета — пуск!']], () => rkStart()); };
    cl.tick = function (dt) { const K = W.rk7; if (!K) return; const gy = W.H(R.x, R.z); const on = thr.on && K.fuel > 0; if (on) { K.fuel = Math.max(0, K.fuel - dt * 6.5); K.vy += 15 * dt; K.up = 1; } K.vy -= 6 * dt; K.vy = Math.max(-30, Math.min(14, K.vy)); K.y += K.vy * dt; if (W.rd4) W.rd4.burn = on;
      if (K.y <= gy) { K.y = gy; const hard = K.vy < -10; K.vy = 0; if (K.up) { const d = Math.hypot(R.x + 40, R.z + 125); if (hard) { W.hurt(25, 'жёсткая посадка ракеты'); burst(W.scene, R.x, gy + 1, R.z, 'smoke', '#ffb04a', 10, 1.2); sfx('boom'); rkEnd(); W.rideEnd4(true); W.talk([['ded', 'Бум! Таня, мы целы, ракета — нет. Механики Петровича соберут новую.']], () => rkStart()); return; }
          if (d < 18 && Math.abs(K.vy) < 9) { rkEnd(); W.rideEnd4(); R.y = gy; W.give('money', 900); sfx('j_win1'); W.say('<b>Дед:</b> Сели! Мягко! Таня, ты лётчик-испытатель. Шапку я уже на Фобосе оставил — тут нечего терять.'); W.toast('🫧 Воздуха почти нет: собирай пузыри!'); A.adv(); return; }
          if (K.fuel <= 0) { rkEnd(); W.rideEnd4(true); W.talk([['pip', 'Топливо кончилось внизу. Заправляем — и снова, поднимайся раньше, а над кругом — отпускай.']], () => rkStart()); return; } } }
      W.flyY = K.y; const d = Math.hypot(R.x + 40, R.z + 125);
      $('wdObj').innerHTML = '🚀 Высота <b>' + Math.round(K.y - gy) + ' м</b> · скорость вниз <b style="color:' + (K.vy < -8 ? '#ff6a4a' : '#9f9') + '">' + Math.max(0, Math.round(-K.vy)) + '</b> · ⛽ <b>' + Math.round(K.fuel) + '%</b> · до круга ' + Math.round(d) + ' м · держи 🔥'; }; }
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
  let run2 = function () { const pt = byId('port'), m = byId('meteo'); R.x = pt.x - 10; R.z = pt.z - 10; R.y = W.H(R.x, R.z); R.v = 0;
    W.tail4({ label: 'Курьер Зины', path: [[pt.x - 30, pt.z - 25], [0, 0], [m.x, m.z]], sp: 7, see: 60, near: 10, far: 120, lostMax: 9, mesh: courier,
      onWin() { const x = R.x, z = R.z; W.rideEnd4(); R.x = x; R.z = z; W.bal9b = null; ab.style.display = 'none'; W.calm = 0; W.give('money', 1200); W.give('parts', 4); W.talk([['ded', 'Сели. «Буханку» Пип пригнал по мосту.'], ['pip', 'Курьер привёл на метеостанцию! Там газовоз пиратов — он перекачивает газ Аэрограда.'], ['ded', 'Таня, мы его выследили. Теперь — догнать.']], () => A.adv()); },
      onFail(why) { W.rideEnd4(true); W.bal9b = null; ab.style.display = 'none'; W.calm = 0; W.talk([['pip', why === 'seen' ? 'Он нас заметил и удрал обратно на причал! Подождём, пока выедет снова.' : 'Потеряли! Он вернулся на причал. Ещё раз, ближе держись.']], () => run2()); } });
    A.setObj('Следи за курьером', { x: pt.x, z: pt.z }); }
  const ab = document.createElement('div'); ab.style.cssText = 'position:fixed;right:16px;bottom:140px;z-index:40;display:none;flex-direction:column;gap:8px'; ab.innerHTML = '<button data-d="1" style="min-width:96px;min-height:56px;border-radius:28px;border:3px solid #fff;background:#3a8aff;color:#fff;font:inherit;font-size:16px">⬆ выше</button><button data-d="-1" style="min-width:96px;min-height:56px;border-radius:28px;border:3px solid #fff;background:#3a6a9a;color:#fff;font:inherit;font-size:16px">⬇ ниже</button>'; document.body.appendChild(ab);
  const WL = [{ y: 12, x: -4.5, z: -4.5, n: 'низ: на юго-запад ↙' }, { y: 24, x: -6.5, z: 1, n: 'середина: на запад ←' }, { y: 36, x: 1, z: -6.5, n: 'верх: на юг ↓' }];
  ab.querySelectorAll('button').forEach((b) => (b.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); const B = W.bal9b; if (!B) return; B.lv = Math.max(0, Math.min(2, B.lv + +b.dataset.d)); sfx('click'); W.toast('🎈 Слой ветра — ' + WL[B.lv].n); }));
  addEventListener('keydown', (e) => { const B = W.bal9b; if (!B) return; if (e.code === 'KeyQ') B.lv = Math.min(2, B.lv + 1); if (e.code === 'KeyZ') B.lv = Math.max(0, B.lv - 1); });
  clear4.push(() => { ab.style.display = 'none'; W.bal9b = null; });
  const r2 = run2; run2 = function () { W.rideEnd4(); r2(); W.ride4({ mesh: 'balloon', fly: 1, alt: 24, flyK: 1, vmax: 4, parked: 1, noFire: 1 }); W.bal9b = { lv: 1 }; W.calm = 1; ab.style.display = 'flex'; W.toast('🎈 Воздушный шар! Сам он почти не рулит — выбирай слой ветра ⬆⬇'); };
  tail.tick = function (dt) { const B = W.bal9b; if (B && !W.paused) { const L = WL[B.lv]; W.flyAlt += (L.y - W.flyAlt) * Math.min(1, dt * 0.8); R.x += L.x * dt; R.z += L.z * dt; }
    if (!W.tl4) { if (B) { W.bal9b = null; ab.style.display = 'none'; W.calm = 0; } return; } W.tailStep4(dt); if (W.tl4 && B) $('wdObj').innerHTML += ' · 🎈 ' + WL[B.lv].n; };
  const tw = tail.onArrive; tail.onArrive = function () { W.talk([['pip', 'Курьер на причале. Поедем следом — заметит. Полетим на шаре! Ветер на Венере на разной высоте дует в разные стороны — выбирай слой.'], ['ded', 'Таня, это как на даче флюгер. Только флюгер — это мы.']], () => run2()); };

  S.splice(ci, 0, tail);
  // погоня за газовозом — на тарелке над облаками
  const chs = S.find((s) => s.id === 'chase'); if (chs) { const oa = chs.onArrive, ot = chs.tick; chs.onArrive = function () { oa.call(this); setTimeout(() => { if (W.tank9) { W.ride4({ mesh: 'saucer', fly: 1, alt: 14, flyK: 1.25, parked: 0 }); W.toast('🛸 Тарелка метеорологов! Газовоз — внизу, молнии — вокруг'); } }, 0); };
    chs.tick = function (dt) { ot.call(this, dt); if (!W.tank9 && W.rd4) W.rideEnd4(); }; }
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
  const fish = S.find((s) => s.id === 'fish'); fish.tick = () => {};
  fish.onArrive = function () { fix(); W.st.fuel = Math.max(W.st.fuel, 80); W.talk([['pip', 'Подо льдом Европы — целый океан, глубже земного. Рыбаки дали батискаф! Опускайся, лови светящуюся рыбу 🐟.'], ['pip', 'Воздуха мало — собирай пузыри 🫧. Удильщики 🦑 кусают, течения 🌀 сносят, ледяные сосульки ❄ царапают.'], ['ded', 'Таня, я на тросе наверху. Дёрнешь три раза — тяну.']], () => runF()); };
  function runF() { const need = W.fishNeed10 || 5; W.dive4({ title: '🌊 Батискаф под лёд Европы', rules: 'Батискаф опускается сам. ◀ ▶ — в сторону. Лови 🐟, собирай 🫧 воздух. Нужно ' + need + ' рыб.', bg: '#06142a', layers: ['#0a1c38', '#0c2244', '#081830', '#0e2850'], me: '🛸', light: 1, side: 0.8, speed: 5, goal: 99999, every: 0.6, meter0: 100, meterRate: -2.2, meterName: '🫧 воздух', meterBad: (m, end) => (end ? m <= 0 : m < 25), need, gotName: '🐟 рыба',
      kinds: [{ e: '🐟', r: 13, got: 1, say: '🐟 Поймала! Светится, как ночник' }, { e: '🐟', r: 13, got: 1, drift: 0.25 }, { e: '🫧', r: 12, meter: 22, say: '🫧 Воздух!' }, { e: '🦑', r: 16, hull: 14, drift: 0.2, say: '🦑 Удильщик укусил!' }, { e: '🌀', r: 18, push: 0.3, say: '🌀 Течение сносит!' }, { e: '❄', r: 14, hull: 10, say: '❄ Ледяная сосулька!' }, { e: '🫧', r: 12, meter: 22 }],
      hello: 'Пип: «Фонарь включён. Внизу темно — смотри на огоньки»', okSay: '🐟 Улов есть — дед тянет трос!', failSay: '🫧 Воздух кончился / батискаф помят — всплываем' },
    () => { W.give('food', 3); W.nerve(30); W.talk([['gosha', 'Мрррр! (Гоша съел одну рыбу. Целиком. Вместе с билетами внутри у него теперь всё сходится.)'], ['vnuki', 'Бабуль! Удильщик утащил весь улов — вон, светится, нырнул в трещину!'], ['pip', 'Удильщики живут в Хаосе Коннемара, среди ледяных глыб. Он выныривает подышать — там его и лови. Смотри на свечение под льдом!']], () => A.adv()); },
    () => W.talk([['ded', 'Вытянул! Таня, ты синяя, но живая. Подышим — и снова.']], () => runF())); }

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
  // зонд «Гюйгенс» — с винтокрыла «Стрекоза» (как настоящий Dragonfly НАСА); найти можно, только сев на ровное
  const pr = S.find((s) => s.id === 'probe'); if (pr) { const oa = pr.onArrive, ot = pr.tick; pr.onArrive = function () { W.talk([['pip', 'НАСА готовит к Титану винтокрыл «Стрекоза» — у нас есть такой же! Плотный воздух и слабая тяжесть: летать тут легче, чем на Земле.'], ['tanya', 'Ваня, я в вертолёте никогда… Ну, всё бывает впервые.']], () => { oa.call(this); W.ride4({ mesh: 'heli', fly: 1, alt: 9, flyK: 1.15, parked: 1, noFire: 1, bank: 0.35 }); W.toast('🚁 Ищи по писку. Найдёшь — сядь рядом на ровное место'); }); };
    pr.tick = function (dt) { const P = W.probe11; if (!P) { if (W.rd4) W.rideEnd4(true); return ot.call(this, dt); } const d = Math.hypot(R.x - P.x, R.z - P.z), e = 3, flat = Math.abs(W.H(R.x + e, R.z) - W.H(R.x - e, R.z)) + Math.abs(W.H(R.x, R.z + e) - W.H(R.x, R.z - e)) < 2.4;
      if (W.rd4) W.flyAlt = d < 14 && Math.abs(R.v) < 3 ? Math.max(1, W.flyAlt - dt * 6) : Math.min(9, W.flyAlt + dt * 6);
      if (d < 12 && Math.abs(R.v) < 3) P.nf = (P.nf || 0) + dt; else P.nf = 0; if (P.nf > 7 && !flat) { W.toast('🪢 Неровно — Пип спустился к зонду на тросе!'); R.x = P.x + 4; R.z = P.z + 4; W.flyAlt = 1; } const ok = d < 9 && (flat || P.nf > 7) && W.flyAlt < 2; if (d < 9 && !ok) { const sx = P.x; P.x += 5000; ot.call(this, dt); P.x = sx; if (!flat && (P.wt = (P.wt || 0) - dt) <= 0) { P.wt = 3; W.toast('⛰ Тут неровно — «Стрекоза» не сядет. Сдвинься на ровное'); } else if (flat && (P.wt2 = (P.wt2 || 0) - dt) <= 0) { P.wt2 = 3; W.toast('🛬 Зависни — садимся (отпусти газ)'); } } else ot.call(this, dt); }; }
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
    onArrive() { W.talk([['pip', 'Здесь в 1969 году высадились Армстронг и Олдрин. Ветра на Луне нет — их следы лежат уже больше 50 лет, как вчера.'], ['vp', 'Земля просит снимки: отражатель и следы. По ним поймут, куда светить лазером, — и найдут станцию.'], ['pip', 'Колёсами тут нельзя — сотрём историю. Бабуля, скафандр! Прыгай, как астронавты «Аполлона», наведи камеру и жми 📷. На следы не наступай!'], ['ded', 'Таня, я буду в кадре. Сзади. Помашу.']], () => run()); } };
  function run() { const ap = byId('apollo'); W.rideEnd4(); W.ride4({ mesh: 'suit', parked: 1, vmax: 6, noFire: 1, tick(dt, V) { V.dy = Math.abs(R.v) > 1 ? Math.abs(Math.sin(W.t * 3.2)) * 1.6 : 0; } }); W.photo4({ need: 4, time: 150, tg: [{ x: ap.x + 20, z: ap.z - 18, e: '🪞', name: 'Отражатель «Аполлона»', y: 1.2 }, { x: ap.x - 26, z: ap.z + 6, e: '👣', name: 'След Армстронга', fragile: 1, y: 0.8 }, { x: ap.x - 8, z: ap.z + 30, e: '👣', name: 'След Олдрина', fragile: 1, y: 0.8 }, { x: ap.x + 34, z: ap.z + 26, e: '👣', name: 'Колея ровера', fragile: 1, y: 0.8 }, { x: ap.x - 40, z: ap.z - 30, e: '🚩', name: 'Флаг экспедиции', y: 2.5 }],
      onWin() { W.rideEnd4(true); W.give('money', 900); W.st.fuel = Math.max(W.st.fuel, 80); W.talk([['gena', '<b>Марс-ФМ</b> с Земли: «Видим снимки! Лазер нашёл отражатель — станция на связи!»'], ['vp', 'Нас видят! Теперь «Луноход-1» в Море Дождей: его аккумуляторы нужны шаттлу.']], () => A.adv()); },
      onFail(why) { W.rideEnd4(true); W.talk([['vp', why === 'time' ? 'Земля ушла за горизонт кратера… Подождём следующего окна — снимай быстрее.' : 'Ой, следы стёрты. Ничего, рядом есть ещё — Пип нашёл. Попробуй снова, аккуратнее.']], () => run()); } });
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
  const rk = S13.find((s) => s.id === 'rocket'), hd = S13.find((s) => s.id === 'herd');
  if (rk) { const ot = rk.tick; rk.tick = function (dt) { ot.call(this, dt); const T = W.train13; if (T && !T.up) { const px = T.px === undefined ? T.x : T.px, pz = T.pz === undefined ? T.z : T.pz, dx = T.x - px, dz = T.z - pz, dl = Math.hypot(dx, dz); if (dl > 0.01) T.dir = Math.atan2(dx, dz); T.px = T.x; T.pz = T.z; const a = T.dir || 0; R.x = T.x - Math.sin(a) * 26; R.z = T.z - Math.cos(a) * 26; R.v = 0; W.lockY = W.H(R.x, R.z) + 2.6; W.onTrain = 1;
        const J = BM.JOY; if (J && J.id != null) R.h -= J.x * dt * 1.8; if (W.keys) { if (W.keys.has('ArrowLeft') || W.keys.has('KeyA')) R.h += dt * 1.8; if (W.keys.has('ArrowRight') || W.keys.has('KeyD')) R.h -= dt * 1.8; } }
      else if (W.onTrain) { W.onTrain = 0; W.lockY = undefined; R.x += 14; R.y = W.H(R.x, R.z); } };
    const oa = rk.onArrive; rk.onArrive = function () { oa.call(this); W.toast('🚂 «Буханка» на платформе поезда! Крути башню джойстиком'); }; }
  clear4.push(() => { if (W.onTrain) { W.onTrain = 0; W.lockY = undefined; } });
  if (hd) { const oa = hd.onArrive, ot = hd.tick; hd.onArrive = function () { W.talk([['nurlan', 'Зверушки пугаются мотора. Садись на мою ламу — подарок друга из Перу. Она упрямая, но зверушки её любят.'], ['tanya', 'Лама так лама. В 1975-м я на ишаке в Бухаре каталась.']], () => { oa.call(this); W.ride4({ mesh: 'camel', parked: 1, vmax: 12, noFire: 1 }); W.ll13 = { t: 6 }; W.calm = 1; W.EN.forEach((e) => { if (!e.keep && !e.pet) e.dead = true; }); }); };
    hd.tick = function (dt) { const L = W.ll13; if (L && W.herd13 && !W.paused) { L.t -= dt; if (L.t <= 0 && !L.on) { L.on = 1; L.t = rnd(12, 16); L.dir = Math.random() < 0.5 ? -1 : 1; W.toast('🦙 Лама увидела колючку и тянет в сторону!'); } if (L.on > 0) { L.on -= dt; R.h += L.dir * dt * 1.4; if (L.on <= 0) L.on = 0; } }
      ot.call(this, dt); if (!W.herd13 && W.rd4) { W.rideEnd4(true); W.ll13 = null; W.calm = 0; } }; }
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
  // арбузы — на моторке по Волге: волны от барж бьют арбузы
  const ml = S14.find((s) => s.id === 'melon');
  if (ml) { ml.onArrive = function () { W.talk([['mikh', 'Грузим десять штук в мою моторку — по Волге до пристани Камышина быстрее. Волны от барж — арбуз бьётся. Довези хотя бы семь.'], ['ded', 'Таня, я держу арбузы. Двумя руками. Ты рули.']], () => boatGo()); };
    ml.tick = function (dt) { const M = W.melon14; if (!M) return; M.cd -= dt; M.wt -= dt; if (M.wt <= 0 && !W.paused) { M.wt = rnd(2.4, 3.6); const a = R.h + rnd(-0.5, 0.5), d = Math.max(18, Math.abs(R.v) * 2), x = R.x + Math.sin(a) * d, z = R.z + Math.cos(a) * d; A.drop11(x, z, { r: 5, dmg: 4, col: '#bfe8ff', why: 'волна от баржи', t: 1.6, t0: 1.6 }); }
      A.hits11Step(dt); let lost = 0; if (W.st.hull < M.hull - 0.5) lost = 1; M.hull = W.st.hull; if (!W.swim && Math.abs(R.v) > 2) { R.v *= 0.85; if ((M.mt = (M.mt || 0) - dt) <= 0) { M.mt = 2; W.toast('⚓ Мель! Держись воды'); } }
      if (lost && M.cd <= 0) { M.cd = 0.8; M.n--; sfx('pot', { vol: 0.6 }); burst(W.scene, R.x, R.y + 2, R.z, 'smoke', '#ff4a6a', 3, 0.5); W.toast('🍉 Арбуз разбился о волну! Осталось ' + M.n); }
      const pr = M.pier; if (W.obj) { W.obj.x = pr.x; W.obj.z = pr.z; } $('wdObj').innerHTML = '🚤 Арбузы: <b>' + M.n + ' из 10</b> · нужно 7 · до пристани ' + Math.round(Math.hypot(R.x - pr.x, R.z - pr.z)) + ' м · волны — в обход';
      if (M.n < 7) { W.melon14 = null; W.rideEnd4(); W.talk([['mikh', 'Слишком много разбилось… Ничего, на бахче ещё есть. Грузим заново.']], () => boatGo()); return; }
      if (Math.hypot(R.x - pr.x, R.z - pr.z) < 16) { const n = M.n; W.melon14 = null; W.rideEnd4(); const km = byId('kam'); R.x = km.x + 30; R.z = km.z + 20; R.y = W.H(R.x, R.z); W.give('money', 300 * n); W.give('food', 3); sfx('j_win1'); confetti && confetti();
        W.talk([['mikh', 'Довезли ' + n + ' штук! А «Буханку» мой племянник пригнал по берегу. Праздник спасён!'], ['tanya', 'Михалыч, а праздник-то когда?'], ['mikh', 'Да прямо сейчас, на площади! Только помоги с лентой.']], () => A.adv()); } }; }
  function boatGo() { const zs = -160, x0 = W.riverX14(zs) - 60, zp = 140, pier = { x: W.riverX14(zp) - 62, z: zp }; R.x = x0; R.z = zs; R.y = W.H(R.x, R.z); R.h = 0; R.v = 0; W.ride4({ mesh: 'boat', vmax: 15, swimK: 1.1, noFire: 1, cam: 0.8 }); W.melon14 = { n: 10, air: 0, hull: W.st.hull, vy: 0, cd: 0, wt: 3, pier }; W.calm = 1; A.setObj('Довези арбузы на моторке до пристани Камышина', pier); }
  clear4.push(() => { if (W.melon14 && W.rd4) W.rideEnd4(); });
  if (bi >= 0) S14.splice(bi, 1, nets); const fi = S14.findIndex((s) => s.id === 'ferry'); S14.splice(fi, 0, sortStep);
})();

/* ---------- световые столбы: яркий — только над текущей целью; города — тусклые; остальные спрятаны ---------- */
(function beams4() { const d0 = W.director; let bt = 0; const told = {};
  W.director = function (dt) { d0 && d0(dt); bt -= dt; if (bt > 0) return; bt = 0.25;
    const L = A.STEPSC || [], si = A.stepI, cur = L[si], tgt = W.side ? null : cur && cur.arrive, later = {}; L.forEach((q, i) => { if (q.arrive && i > si) later[q.arrive] = i + 1; });
    for (const p of W.POI) { if (!p.beam) continue; const isT = p.id === tgt && !cur.arrived, city = p.kind === 'city';
      p.beam.visible = isT || city; p.beam.scale.set(isT ? 2.2 : 1, 1, isT ? 2.2 : 1);
      if (!isT && !W.paused && later[p.id] && Math.hypot(R.x - p.x, R.z - p.z) < p.r * 0.75 && !told[W.ch + p.id]) { told[W.ch + p.id] = 1; W.toast('🔒 ' + p.e + ' ' + p.name.split(' —')[0] + ': сюда — позже (миссия ' + later[p.id] + '). Сейчас цель — ' + (cur && cur.arrive ? '🎯 на стрелке' : 'на экране')); } } };
  W.beamsGlow = 1; })();
(function hintFix() { const d0 = W.director; let ht = 0; W.director = function (dt) { d0 && d0(dt); const h = document.getElementById('hint'); if (!h || !h.classList.contains('on')) { ht = 0; return; } ht += dt; if (W.foot || W.mini.cur() || ht > 9) h.classList.remove('on'); }; })();

/* =====================================================================
   МИССИИ КОТА ГОШИ (гл. 1, 6, 9, 13) + дым и искры у огня
   ===================================================================== */
(function gosha4() {
  const insertAfter = (S, id, step) => { const i = S.findIndex((s) => s.id === id); if (i >= 0) S.splice(i + 1, 0, step); else S.splice(S.length - 1, 0, step); };
  // Гоша едет без «Буханки» и деда: у каждой его миссии свой транспорт (лапы, реактивный ранец, зонтик, игрушечная машинка)
  const LMc = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  function catVeh(kit) { const g = new THREE.Group(), c = (typeof catMesh === 'function' ? catMesh() : null); if (c) { c.scale.setScalar(3.4); g.add(c); }
    const add = (geo, col, x, y, z, o) => { const m = new THREE.Mesh(geo, LMc(col, o)); m.position.set(x, y, z); g.add(m); return m; };
    if (kit === 'jet') { add(new THREE.SphereGeometry(0.9, 16, 12), '#cfe9ff', 0, 1.5, 1.0, { transparent: true, opacity: 0.3, depthWrite: false }); add(new THREE.TorusGeometry(0.7, 0.08, 6, 16), '#e8e8f0', 0, 1.15, 1.0).rotation.x = Math.PI / 2 - 0.4; for (const x of [-0.35, 0.35]) { add(new THREE.CylinderGeometry(0.22, 0.26, 0.9, 10), '#c8ccd8', x, 1.35, -0.2); const f = add(new THREE.ConeGeometry(0.2, 0.7, 8), '#7fe8ff', x, 0.6, -0.2, { transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }); f.rotation.x = Math.PI; } }
    if (kit === 'umbrella') { const st = add(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), '#3a2a20', 0.3, 2.3, 0.2); st.rotation.z = -0.2; const dm = add(new THREE.SphereGeometry(1.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), '#e0303a', 0.52, 3.3, 0.2, { side: THREE.DoubleSide }); dm.rotation.z = -0.2; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; add(new THREE.SphereGeometry(0.12, 6, 4), '#ffffff', 0.52 + Math.cos(a) * 1.0, 3.25, 0.2 + Math.sin(a) * 1.0); } }
    if (kit === 'car') { if (c) c.position.y = 0.68; add(new THREE.BoxGeometry(1.7, 0.45, 2.6), '#3a8adf', 0, 0.45, 0); add(new THREE.BoxGeometry(1.5, 0.12, 0.7), '#ffd24a', 0, 0.72, 1.0); for (const [x, z] of [[-0.9, -0.85], [0.9, -0.85], [-0.9, 0.85], [0.9, 0.85]]) add(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12), '#1a1a1e', x, 0.35, z).rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), '#888', -0.6, 1.3, -1.0); add(new THREE.SphereGeometry(0.1, 6, 4), '#ff4a4a', -0.6, 2.0, -1.0); }
    if (kit === 'helmet') { add(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#ffcf3a', 0, 1.95, 1.0); add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10), '#fff8c0', 0, 2.15, 1.5, { emissive: '#fff4a0' }).rotation.x = Math.PI / 2; const L = new THREE.SpotLight('#fff4c0', 2.5, 30, 0.5, 0.5); L.position.set(0, 2.15, 1.6); L.target.position.set(0, 0, 12); g.add(L); g.add(L.target); }
    return g; } W.catVeh = catVeh;
  const catRide = (o) => W.ride4(Object.assign({ mesh: catVeh(o && o.kit), rad: o && o.kit === 'car' ? 1.2 : 0.8, upright: o && o.kit === 'car' ? 0 : 1, parked: 0, vmax: 13, noFire: 1, cam: 0.55, hover: o && o.kit === 'car' ? 0 : 1 }, o || {}));
  // --- гл.1: стелс в караване Коляна
  const S1 = A.CHAPTERS[1]; if (S1) { const cv = { id: 'cat1', start() { A.setObj('Привал каравана Коляна', byId('caravan1')); }, arrive: 'caravan1',
      onArrive() { W.talk([['petr', '<i>(по рации)</i> Таня, караван Коляна встал на привал. У них в клетке — рассада всей колонии!'], ['ded', 'На «Буханке» не подъедешь — услышат. А кот пролезет.'], ['gosha', 'Мяу. (Гоша вытянул лапы и надел невидимую маску ниндзя.)']], () => run1()); } };
    function run1() { const c = byId('caravan1'); W.stealthEnd4(); W.rideEnd4(); if (!W.cv1m) { const g = new THREE.Group(); [['k_craft_cargoA', 0, 0, 6, 0.3], ['containers_A', -22, 14, 5, 1], ['containers_B', 20, -16, 5, 2], ['k_barrels', -14, -22, 5, 0], ['cargo_B_stacked', 26, 18, 5, 1.2]].forEach(([m, x, z, sc, ry]) => { const k = kmodel(m, sc, ry); if (k) { k.position.set(c.x + x, W.H(c.x + x, c.z + z), c.z + z); g.add(k); if (m !== 'k_craft_cargoA') W.COLL.push({ x: c.x + x, z: c.z + z, r: sc * 0.42, soft: true, tag: 'cv1' }); } }); W.scene.add(g); W.cv1m = g; }
      { const dx = R.x - c.x, dz = R.z - c.z, dl = Math.hypot(dx, dz) || 1; R.x = c.x + dx / dl * 62; R.z = c.z + dz / dl * 62; R.y = W.H(R.x, R.z); R.h = Math.atan2(-dx, -dz); R.v = 0; } const pk = { x: R.x, z: R.z }; catRide({ vmax: 11, kit: 'paws' });
      W.stealth4({ label: '🔑 Ключ от клетки', quiet: 7.5, take: 1.5, pickR: 9, guards: [{ path: [[c.x - 34, c.z - 26], [c.x + 34, c.z - 26], [c.x + 34, c.z + 28], [c.x - 34, c.z + 28]], sp: 2.4, pause: 2 }, { path: [[c.x - 20, c.z - 40], [c.x - 20, c.z + 40]], sp: 2, pause: 3 }],
        items: [{ x: c.x + 4, z: c.z + 2, e: '🔑', name: 'Ключ от клетки' }], exit: { x: pk.x, z: pk.z },
        onCaught() { W.talk([['kolyan', '<i>(издалека)</i> Эй! Кот! Держи кота!'], ['gosha', 'Мяу! (Гоша удрал и сделал вид, что спал.)']], () => { W.stealthEnd4(); W.rideEnd4(true); run1(); }); },
        onWin() { W.rideEnd4(true); W.give('money', 700); W.give('food', 3); W.talk([['tanya', 'Гоша принёс ключ! В зубах! Рассада спасена — колония будет с огурцами.'], ['ded', 'Котам — медаль. Мне — пирожок за то, что не мешал.']], () => A.adv()); } });
      A.setObj('🐱 Ты — Гоша: укради ключ, не попадись в свет фонарей', { x: c.x, z: c.z }); }
    cv.tick = (dt) => { if (W.st4) W.stealthStep4(dt); };
    clear4.push(() => { if (W.COLL) W.COLL = W.COLL.filter((q) => q.tag !== 'cv1'); if (W.cv1m) { W.scene.remove(W.cv1m); W.cv1m = null; } });
    insertAfter(S1, 'nest1', cv); }
  // --- гл.6: невесомость у отсека флагмана
  const S6 = A.CHAPTERS[6]; if (S6) { const md = { id: 'cat6', start() { A.setObj('Отсек, оторванный от флагмана', byId('module6')); }, arrive: 'module6',
      onArrive() { W.talk([['pip', 'Это отсек флагмана — его оторвало и закинуло сюда. Внутри — схема ангара тарелок. Но люк заклинило изнутри.'], ['tanya', 'Гоша, ты же у нас всё открываешь. Холодильник, например.'], ['gosha', 'Мрр. (Гоша оттолкнулся лапами — и поплыл. На Фобосе почти нет тяжести.)']], () => run6()); } };
    function run6() { const c = byId('module6'); W.rideEnd4(); if (!W.md6m) { const g = new THREE.Group(); const k = kmodel('k_hangar_largeA', 9, 0.6) || kmodel('basemodule_A', 9); if (k) { k.position.set(c.x, W.H(c.x, c.z) + 2, c.z); k.rotation.z = 0.25; g.add(k); } W.scene.add(g); W.md6m = g; }
      const pts = [[c.x + 30, c.z - 10, 6], [c.x + 10, c.z + 28, 12], [c.x - 26, c.z + 16, 8], [c.x - 20, c.z - 24, 14], [c.x + 4, c.z - 6, 5]];
      W.c6 = { pts, i: 0, rings: pts.map(([x, z, y], k) => { const m = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.35, 10, 28), new THREE.MeshBasicMaterial({ color: k === pts.length - 1 ? '#7aff8a' : '#9ad0ff', transparent: true, opacity: 0.35 })); m.position.set(x, W.H(x, z) + y, z); W.scene.add(m); return m; }) };
      catRide({ fly: 1, alt: 5, flyK: 0.8, glide: 0.9, vmax: 10, kit: 'jet' }); A.setObj('🐱 Плыви сквозь кольца к люку · отталкивайся и тормози заранее', { x: pts[0][0], z: pts[0][1] }); }
    function end6() { if (W.c6) W.c6.rings.forEach((m) => W.scene.remove(m)); W.c6 = null; }
    clear4.push(() => { end6(); if (W.md6m) { W.scene.remove(W.md6m); W.md6m = null; } });
    md.tick = function (dt) { const C = W.c6; if (!C || W.paused) return; const [x, z, y] = C.pts[C.i]; W.flyAlt += (y - W.flyAlt) * Math.min(1, dt * 0.9); C.rings.forEach((m, k) => { m.material.opacity = k === C.i ? 0.95 : k > C.i ? 0.3 : 0; m.rotation.y += dt * 0.5; }); if (W.obj) { W.obj.x = x; W.obj.z = z; }
      $('wdObj').innerHTML = '🐱 Невесомость: кольцо <b>' + (C.i + 1) + ' из ' + C.pts.length + '</b> · Гоша летит, пока не затормозит';
      if (Math.hypot(R.x - x, R.z - z) < 4.5) { sfx('j_found', { vol: 0.5 }); C.i++; if (C.i >= C.pts.length) { end6(); W.rideEnd4(true); W.give('money', 800); W.give('parts', 4); W.talk([['gosha', 'Мяу! (Щёлк. Люк открыт. Гоша сидит на схеме ангара — как на коврике.)'], ['pip', 'Схема! Ангар тарелок — на юго-востоке. Тарелка нас довезёт до флагмана.']], () => A.adv()); } } };
    insertAfter(S6, 'comet', md); }
  // --- гл.9: паркур по тросам между крышами
  const S9 = A.CHAPTERS[9]; if (S9) { const rf = { id: 'cat9', start() { A.setObj('Крыши Нижнего Аэрограда', byId('roofs9')); }, arrive: 'roofs9',
      onArrive() { W.talk([['vnuki', 'Бабуль! Облачная чайка утащила твой пирожок — вон, по крышам!'], ['tanya', 'Мой пирожок?! С капустой?! Гоша, фас!'], ['gosha', 'Мяу! (Гоша уже на тросе.)']], () => run9()); } };
    function run9() { const c = byId('roofs9'); end9(); const P = []; for (let k = 0; k < 8; k++) { const a = k * 0.8, r = 22 + k * 9; P.push({ x: c.x + Math.sin(a) * r, z: c.z + Math.cos(a) * r - 10, y: 6 + k * 2.5 }); }
      const g = new THREE.Group(); P.forEach((p, k) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 2, 16), new THREE.MeshLambertMaterial({ color: k % 2 ? '#d88a5a' : '#e8b07a' })); t.position.set(p.x, p.y - 1, p.z); g.add(t); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 60, 8), LM('#a8a0b0')); st.position.set(p.x, p.y - 32, p.z); g.add(st); if (k) { const q = P[k - 1], L = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z), cab = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, L, 6), LM('#3a3a44')); cab.position.set((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2); cab.lookAt(p.x, p.y, p.z); cab.rotateX(Math.PI / 2); g.add(cab); } }); W.scene.add(g);
      const bird = emojiSprite('🐦', 3); W.scene.add(bird); W.r9 = { P, g, i: 0, bird }; catRide({ fly: 1, flyK: 0.75, vmax: 11, kit: 'umbrella' }); R.x = P[0].x; R.z = P[0].z; R.h = Math.atan2(P[1].x - P[0].x, P[1].z - P[0].z); W.flyY = P[0].y; W.calm = 1; W.EN.forEach((e) => { if (!e.keep) e.dead = true; }); A.setObj('🐱 Беги по тросу за чайкой', { x: P[1].x, z: P[1].z }); }
    function end9() { if (W.r9) { W.scene.remove(W.r9.g); W.scene.remove(W.r9.bird); W.r9 = null; W.calm = 0; } W.flyY = undefined; }
    clear4.push(end9);
    rf.tick = function (dt) { const Q = W.r9; if (!Q || W.paused) return; const a = Q.P[Q.i], b = Q.P[Math.min(Q.i + 1, Q.P.length - 1)], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((R.x - a.x) * dx + (R.z - a.z) * dz) / L2)), cx = a.x + dx * t, cz = a.z + dz * t, off = Math.hypot(R.x - cx, R.z - cz);
      const onRoof = Math.hypot(R.x - a.x, R.z - a.z) < 5 || Math.hypot(R.x - b.x, R.z - b.z) < 5; W.flyY = a.y + (b.y - a.y) * t + 0.3; Q.bird.position.set(b.x, b.y + 3 + Math.sin(W.t * 6) * 0.5, b.z); if (W.obj) { W.obj.x = b.x; W.obj.z = b.z; }
      $('wdObj').innerHTML = '🐱 Крыша <b>' + (Q.i + 1) + ' из ' + Q.P.length + '</b> · держись троса · до чайки ' + Math.round(Math.hypot(R.x - b.x, R.z - b.z)) + ' м';
      if (!onRoof && off > 2.2) { sfx('dry'); W.toast('😿 Сорвался с троса! Обратно на крышу'); R.x = a.x; R.z = a.z; R.v = 0; R.h = Math.atan2(dx, dz); return; }
      if (Math.hypot(R.x - b.x, R.z - b.z) < 4 && Q.i < Q.P.length - 1) { Q.i++; sfx('j_found', { vol: 0.4 }); if (Q.i >= Q.P.length - 1) { end9(); W.rideEnd4(true); W.give('money', 800); W.give('food', 2); W.talk([['gosha', 'Мяу! (Чайка уронила пирожок. Гоша поймал. Откусил ровно половину — по-честному.)'], ['tanya', 'Половину вернул! Ну хоть так.']], () => A.adv()); } } };
    insertAfter(S9, 'chase', rf); }
  // --- гл.13: охота на сусликов
  const S13 = A.CHAPTERS[13]; if (S13) { const su = { id: 'cat13', start() { A.setObj('Сусличья степь', byId('suslik13')); }, arrive: 'suslik13',
      onArrive() { W.talk([['nurlan', '<i>(по рации)</i> Суслики подрыли рельсы — поезд с ракетой не пройдёт! Их надо распугать.'], ['gosha', 'Мяу. (Гоша прижал уши. Это его работа.)'], ['pip', 'Суслик выглядывает из норы на пару секунд — успей добежать!']], () => run13()); } };
    function rodent() { const g = new THREE.Group(), c = '#c8a064', b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), LM(c)); b.scale.set(0.9, 1.3, 0.8); b.position.y = 0.9; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), LM(c)); h.position.set(0, 1.9, 0.15); g.add(h); for (const x of [-0.25, 0.25]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), LM('#a87a44')); e.position.set(x, 2.25, 0.05); g.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), LM('#1a1a1a')); ey.position.set(x * 0.6, 2, 0.52); g.add(ey); } const bl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), LM('#efd8b0')); bl.scale.set(0.8, 1.1, 0.5); bl.position.set(0, 0.9, 0.42); g.add(bl); g.scale.setScalar(1.6); return g; }
    function run13() { const c = byId('suslik13'); end13(); const holes = []; for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.2, r = 22 + (k % 3) * 10, x = c.x + Math.sin(a) * r, z = c.z + Math.cos(a) * r, y = W.H(x, z); const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 18), new THREE.MeshBasicMaterial({ color: '#2a1c10' })); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.08, z); W.scene.add(m); const mound = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.45, 8, 20), LM('#a8824a')); mound.rotation.x = Math.PI / 2; mound.position.set(x, y + 0.1, z); W.scene.add(mound); const s = rodent(); s.position.set(x, y - 3, z); W.scene.add(s); holes.push({ x, z, y, m, mound, s, up: 0 }); }
      W.h13 = { holes, t: 1.5, got: 0, T: 90 }; catRide({ vmax: 13, kit: 'car' }); A.setObj('🐱 Лови сусликов, пока выглядывают', c); }
    function end13() { const Hh = W.h13; if (!Hh) return; Hh.holes.forEach((h) => { W.scene.remove(h.m); W.scene.remove(h.mound); W.scene.remove(h.s); }); W.h13 = null; }
    clear4.push(end13);
    su.tick = function (dt) { const Hh = W.h13; if (!Hh || W.paused) return; Hh.T -= dt; Hh.t -= dt; if (Hh.t <= 0) { Hh.t = rnd(0.9, 1.6); const free = Hh.holes.filter((h) => h.up <= 0); const h = free[Math.floor(Math.random() * free.length)]; if (h) { h.up = rnd(2.2, 3); sfx('pick', { vol: 0.3 }); } }
      let tgt = null, td = 1e9; for (const h of Hh.holes) { if (h.up > 0) { h.up -= dt; const d = Math.hypot(R.x - h.x, R.z - h.z); if (d < 3.6) { h.up = 0; Hh.got++; sfx('j_found', { vol: 0.5 }); W.toast('🐹 Суслик пойман… и отпущен подальше от рельсов! ' + Hh.got + ' из 8'); } else if (d < td) { td = d; tgt = h; } } const ty = h.y + (h.up > 0 ? -0.3 : -3.5); h.s.position.y += (ty - h.s.position.y) * Math.min(1, dt * 10); h.s.rotation.y = Math.atan2(R.x - h.x, R.z - h.z); }
      if (W.obj) { const t = tgt || byId('suslik13'); W.obj.x = t.x; W.obj.z = t.z; } $('wdObj').innerHTML = '🐹 Сусликов: <b>' + Hh.got + ' из 8</b> · ⏱ ' + Math.max(0, Math.ceil(Hh.T)) + ' с · беги к тому, кто выглянул';
      if (Hh.got >= 8) { end13(); W.rideEnd4(true); W.give('money', 700); W.give('food', 2); W.talk([['nurlan', 'Рельсы целы, суслики переехали в соседний овраг. Кот у вас — богатырь!'], ['asel', 'Теперь — монтажный корпус: поезд с ракетой готов.']], () => A.adv()); }
      else if (Hh.T <= 0) { end13(); W.rideEnd4(true); W.talk([['gosha', 'Мяу… (Гоша устал. Попьёт молока — и снова.)']], () => run13()); } };
    insertAfter(S13, 'town', su); }
  // --- дым и искры у огня: костры, вершины вулканов, факелы
  (function smoke() { const d0 = W.director; let t = 0; W.director = function (dt) { d0 && d0(dt); t -= dt; if (t > 0 || W.paused) return; t = 0.12; const L = W.EMIT || []; for (const e of L) { const d = Math.hypot(e.x - R.x, e.z - R.z); if (d > (e.k === 'vol' ? 600 : 140)) continue;
        if (e.k === 'fire') { if (Math.random() < 0.6) burst(W.scene, e.x + rnd(-0.4, 0.4), e.y + 1.2, e.z + rnd(-0.4, 0.4), 'smoke', '#5a5048', 1.6, 1.4); if (Math.random() < 0.5) burst(W.scene, e.x, e.y + 0.8, e.z, 'spark', '#ffb04a', 0.9, 0.6); }
        else if (e.k === 'vol' && Math.random() < 0.5) burst(W.scene, e.x + rnd(-6, 6), e.y + rnd(0, 6), e.z + rnd(-6, 6), 'smoke', '#6a5a50', 9, 3); } }; })();
})();


/* =====================================================================
   ТРАНСПОРТ ПО МИССИЯМ (docs/transport-plan.md, согласовано владельцем 18.11.2026)
   До столба миссии едем на «Буханке»; на месте (или с самого начала, если столба нет) —
   пересадка на транспорт миссии; миссия засчитана — снова «Буханка». go — транспорт уже в дороге.
   Бабуля сидит в каждом транспорте, дед — там, где он стреляет.
   ===================================================================== */
(function transport4() {
  const PLAN = { 1: { rzhav: 'foot', boss: 'tractor' }, 2: { descent: { go: 'hover', at: 'foot' }, dock: 'shuttle' }, 3: { customs: 'foot', smile3: 'buggy', face: 'para', antennas: 'heli' },
    4: { raft4: 'boat' }, 5: { arrive: 'foot', geyser: 'snowmo', aurora: 'icebreak' }, 6: { queue: 'foot', tour6: 'buggy' }, 7: { arsia: 'foot', ascraeus: 'rcart', evac: 'bus', caldera: 'heli' },
    8: { valves8: 'foot', trade8: 'suit', rig: 'miner' }, 9: { patch: 'jet', seeds: 'foot' }, 10: { land: 'foot', tune10: 'snowmo', hunt10: 'cutter', tsar: 'iceboat' },
    11: { race11: 'racer', kraken: 'catamaran' }, 12: { tow: 'buggy', code12: 'jet', tele12: 'saucer', boss: 'ship' }, 13: { land: 'hover', quiz13: 'foot' }, 14: { sort14: 'foot', nets14: 'raft' } };
  const NAME = { foot: '🚶 пешком', tractor: '🚜 тягач Лёхи с ковшом', hover: '🏍 ховербайк', shuttle: '🛸 грузовой челнок', buggy: '🚙 багги', para: '🪂 параплан', heli: '🚁 винтокрыл', boat: '🚤 моторная лодка', snowmo: '🛷 снегоход', icebreak: '🚛 тягач-ледокол', rcart: '🚀 ракетная тележка', bus: '🚌 автобус с прицепом', suit: '👩‍🚀 в скафандре', miner: '⛏ шахтёрский комбайн', jet: '🎒 джетпак', cutter: '🚤 подлёдный катер', iceboat: '⛵ сани-буер', racer: '🏎 гоночный болид', catamaran: '⛵ катамаран', saucer: '🛸 тарелка', ship: '🚀 космический корабль', raft: '🪵 плот' };
  const LMt = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const box = (g, w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LMt(c)); m.position.set(x, y, z); g.add(m); return m; };
  const cyl = (g, r1, r2, h, c, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 12), LMt(c)); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); return m; };
  function kfit(name, len, ry = Math.PI) { if (!MODELS || !MODELS[name]) return null; const m = kmodel(name, 1, ry); if (!m) return null; const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3()), k = len / Math.max(sz.x, sz.z, 0.01); m.scale.multiplyScalar(k); m.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k); const g = new THREE.Group(); g.add(m); g.userData.h = sz.y * k; return g; }
  function gran(sc = 0.6) { let o = { skirt: '#3a5a8a', coat: '#7a3a6a', scarf: '#d8302a', dots: '#ffe08a' }; try { o = Object.assign(o, GRAN[granId()], { glass: '#a8823a' }); } catch (e) {} const p = personMesh(o); p.scale.setScalar(sc); return p; }
  function ded(sc = 0.95) { if (typeof FX === 'undefined' || !FX.ded) return null; const d = FX.ded.clone(true); d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.setScalar(sc); return d; }
  const put = (g, o, x, y, z) => { if (o) { o.position.set(x, y, z); g.add(o); } return o; };
  const BUILD = {
    foot() { const p = gran(1); p.userData.walk = 1; return p; },
    hover() { const g = kfit('r_craft_speederA', 4.4) || (() => { const q = new THREE.Group(); box(q, 1.6, 0.6, 4, '#d84a3a', 0, 0.6, 0); return q; })(); put(g, gran(0.6), 0, 0.7, 0.2); put(g, ded(0.75), 0, 0.75, -1.1); g.userData.dy = 0.6; return g; },
    tractor() { const g = kfit('spacetruck_large', 6.4, 0) || kfit('spacetruck', 6, 0) || new THREE.Group(); box(g, 3.2, 1.0, 0.4, '#e8b83a', 0, 0.6, 3.6).rotation.x = -0.3; box(g, 0.25, 0.25, 1.4, '#3a3a40', -1.2, 1, 3).rotation.x = 0.3; box(g, 0.25, 0.25, 1.4, '#3a3a40', 1.2, 1, 3).rotation.x = 0.3; put(g, ded(0.9), 0, (g.userData.h || 2.5) + 0.05, -0.8); return g; },
    shuttle() { const g = kfit('k_craft_cargoA', 7.5) || new THREE.Group(); put(g, ded(1), 0, (g.userData.h || 2.5), -0.5); g.userData.dy = 3.2; return g; },
    buggy() { const g = kfit('k_rover', 4.6) || new THREE.Group(); const h = g.userData.h || 1.8; put(g, gran(0.6), 0.45, h * 0.55, 0.3); put(g, ded(0.8), -0.4, h * 0.6, -0.9); return g; },
    para() { const g = VEH.glider(); g.position.y = 0; const w = new THREE.Group(); g.position.y = 5.2; w.add(g); return w; },
    heli() { const g = VEH.heli(); put(g, gran(0.55), 0, 1.6, 0.8); put(g, ded(0.8), 0, 1.6, -0.9); g.userData.dy = 3; return g; },
    boat() { const g = VEH.boat(); g.children.forEach((c) => { if (c.isSprite) c.visible = false; }); put(g, ded(0.75), 0, 1, -0.4); return g; }, // без арбузов — они только на Волге
    snowmo() { const g = kfit('r_craft_speederD', 4) || new THREE.Group(); for (const x of [-0.7, 0.7]) box(g, 0.25, 0.12, 4.2, '#e8eef4', x, 0.06, 0.2); box(g, 1.2, 0.15, 0.5, '#e8eef4', 0, 0.1, 2.3).rotation.x = -0.5; put(g, gran(0.6), 0, 0.7, 0); g.userData.dy = 0.25; return g; },
    icebreak() { const g = kfit('spacetruck', 6, 0) || new THREE.Group(); const p = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 4), LMt('#d0303a')); p.rotation.set(Math.PI / 2, Math.PI / 4, 0); p.scale.set(1, 1, 0.5); p.position.set(0, 0.8, 3.6); g.add(p); put(g, ded(0.9), 0, (g.userData.h || 2.5), -1); return g; },
    rcart() { const g = kfit('r_craft_racer', 4.4) || new THREE.Group(); cyl(g, 0.45, 0.6, 1.6, '#8a8a94', 0, 0.9, -2.3, Math.PI / 2); const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 10), new THREE.MeshBasicMaterial({ color: '#ffb04a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.position.set(0, 0.9, -4.2); g.add(f); g.flame = f; put(g, gran(0.6), 0, 0.6, 0.3); return g; },
    bus() { const g = kfit('spacetruck_large', 6, 0) || new THREE.Group(); const t = new THREE.Group(); box(t, 2.4, 1.3, 4.2, '#e8c84a', 0, 1.15, 0); for (let k = 0; k < 3; k++) for (const x of [-1.21, 1.21]) box(t, 0.05, 0.5, 0.9, '#2a3a5a', x, 1.4, -1.4 + k * 1.4); for (const z of [-1.4, 1.4]) for (const x of [-1.1, 1.1]) cyl(t, 0.4, 0.4, 0.3, '#1a1a1e', x, 0.4, z, 0, Math.PI / 2); box(t, 0.3, 0.3, 1.4, '#3a3a40', 0, 0.6, 2.6); t.position.z = -5.6; g.add(t); return g; },
    suit() { const g = VEH.suit(); try { const o = Object.assign({ skirt: '#e8e8ee', coat: '#e8e8ee', scarf: '#dcdce2', dots: '#dcdce2' }); if (g.userData.dress) g.userData.dress(o); } catch (e) {} g.userData.walk = 1; return g; },
    miner() { const g = kfit('k_craft_miner', 6.5) || new THREE.Group(); put(g, ded(0.95), 0, (g.userData.h || 3), -1); return g; },
    jet() { const g = VEH.jet(); return g; },
    cutter() { const g = VEH.boat(); g.children.forEach((c) => { if (c.isSprite) c.visible = false; }); const pr = cyl(g, 1.2, 1.2, 0.15, '#3a3a44', 0, 2.6, -3.6, Math.PI / 2); g.rotors = [pr]; box(g, 3.2, 0.25, 7.4, '#7fd8ff', 0, 0.05, 0); return g; },
    iceboat() { const g = new THREE.Group(); box(g, 1.4, 0.5, 4, '#b8463a', 0, 0.6, 0); box(g, 4.2, 0.15, 0.3, '#5a4a3a', 0, 0.4, -0.6); for (const x of [-2, 2]) box(g, 0.15, 0.15, 1.6, '#e8eef4', x, 0.15, -0.6); box(g, 0.15, 0.15, 1.6, '#e8eef4', 0, 0.15, 1.8); cyl(g, 0.07, 0.07, 6, '#5a4a3a', 0, 3.6, 0.6); const s = new THREE.Mesh(new THREE.ConeGeometry(1.8, 5, 3), LMt('#f4f0e4', { side: THREE.DoubleSide })); s.scale.set(1, 1, 0.08); s.position.set(0, 3.9, -0.4); g.add(s); put(g, gran(0.6), 0, 0.85, -1); return g; },
    racer() { const g = kfit('r_craft_racer', 4.6) || new THREE.Group(); put(g, gran(0.6), 0, 0.55, -0.2); box(g, 2.6, 0.1, 0.6, '#ffd24a', 0, 1.4, -2.1); return g; },
    catamaran() { const g = new THREE.Group(); for (const x of [-1.6, 1.6]) { cyl(g, 0.6, 0.6, 7, '#e8e8f0', x, 0.4, 0, Math.PI / 2); } box(g, 4, 0.25, 4.5, '#8a6a4a', 0, 1, 0); cyl(g, 0.08, 0.08, 6, '#5a4a3a', 0, 4, 0.5); const s = new THREE.Mesh(new THREE.ConeGeometry(2, 5.4, 3), LMt('#ff9a3a', { side: THREE.DoubleSide })); s.scale.set(1, 1, 0.08); s.position.set(0, 4.2, -0.3); g.add(s); put(g, gran(0.6), 0.8, 1.1, -1.4); put(g, ded(0.85), -0.8, 1.1, 0.9); return g; },
    saucer() { return VEH.saucer(); },
    ship() { const g = kfit('s_Spaceship3', 5.5) || kfit('s_Spaceship', 5.5) || new THREE.Group(); put(g, ded(0.9), 0, (g.userData.h || 2), -0.6); g.userData.dy = 1.6; return g; },
    raft() { const g = new THREE.Group(); for (let k = 0; k < 6; k++) cyl(g, 0.32, 0.32, 5, k % 2 ? '#8a6a3a' : '#7a5a32', -1.6 + k * 0.64, 0.3, 0, Math.PI / 2); cyl(g, 0.05, 0.05, 4.5, '#5a4a3a', 1.2, 2.2, -1.6, 0, -0.3); put(g, gran(0.65), 0.3, 0.6, -0.8); return g; },
  };
  const CAM = { foot: 0.55, suit: 0.55, jet: 0.6, hover: 0.75, buggy: 0.85, snowmo: 0.75, racer: 0.8, rcart: 0.8, raft: 0.8, iceboat: 0.9, para: 1.1, heli: 1.1, saucer: 1, shuttle: 1.2, ship: 1.3, tractor: 1, icebreak: 1, bus: 1.5, miner: 1.1, boat: 0.85, cutter: 0.85, catamaran: 0.95 };
  const VMAX = { foot: 8, suit: 7, jet: 10, raft: 9, iceboat: 15, bus: 14 };
  let mine = null, mineKey = '';
  const leg = (m, dt) => { const u = m.userData; if (!u || !u.legL) return; const k = Math.min(1, Math.abs(R.v) / 4), a = Math.sin(W.t * 9) * 0.6 * k; u.legL.rotation.x = a; u.legR.rotation.x = -a; if (u.armL) { u.armL.rotation.x = -a * 0.7; u.armR.rotation.x = a * 0.7; } };
  function want() { const cur = A.curStep(); if (!cur || W.side || W.visit) return null; const P = (PLAN[W.ch] || {})[cur.id]; if (!P) return null; const o = typeof P === 'string' ? { at: P } : P; const arrived = !cur.arrive || cur.arrived; return arrived ? o.at || null : o.go || null; }
  function on(kind) { const m = BUILD[kind] ? BUILD[kind]() : null; if (!m) return; const dy = m.userData.dy || 0;
    mine = W.ride4({ mesh: m, rad: ({ foot: 0.6, suit: 0.6, jet: 0.6, hover: 1.2, racer: 1.3, rcart: 1.3, snowmo: 1.2, raft: 1.6, iceboat: 1.6, buggy: 1.5, bus: 2.0, ship: 2.2, shuttle: 2.4 })[kind] || 1.8, upright: /^(foot|suit|jet)$/.test(kind) ? 1 : 0, parked: 0, hover: kind === 'foot' || kind === 'suit' || kind === 'jet' ? 1 : 0, cam: CAM[kind] || 0.9, vmax: VMAX[kind], tick(dt, V) { V.dy = dy + (dy ? Math.sin(W.t * 2) * 0.25 : 0); if (m.userData.walk) leg(m, dt); if (kind === 'rcart' || kind === 'jet') V.burn = Math.abs(R.v) > 2; } });
    mine.kind = kind; W.toast('🔁 Пересадка: ' + NAME[kind]); sfx('click'); burst(W.scene, R.x, R.y + 1, R.z, 'smoke', '#e8d8c8', 4, 0.5); }
  function off() { if (mine && W.rd4 === mine) W.rideEnd4(); mine = null; mineKey = ''; }
  W.transport4 = { PLAN, NAME, BUILD, off };
  const d0 = W.director; W.director = function (dt) { d0 && d0(dt); if (!W.active) return;
    const k = want(), key = k ? W.ch + ':' + A.stepI + ':' + k : '';
    if (key === mineKey && (!k || (mine && W.rd4 === mine))) return;
    if (mine && W.rd4 === mine) W.rideEnd4(); mine = null; mineKey = key;
    if (k && !W.rd4) on(k); else if (k) mineKey = ''; };
  clear4.push(() => { mine = null; mineKey = ''; });
})();

/* =====================================================================
   КОНТРОЛЬ МИССИЙ: каждый светящийся столб — цель.
   Доехал до столба — «🎯 Цель достигнута» и награда; миссия засчитана — карточка «✅ Миссия выполнена»
   с тем, что получил; сверху — «Миссия 3 из 9» и кружки пройденных. Город со столбом — отметка и награда.
   При входе в главу — «Твари этой планеты».
   ===================================================================== */
(function goals4() {
  const css = document.createElement('style'); css.textContent = `
#wdProg{position:absolute;left:50%;transform:translateX(-50%);top:calc(138px + env(safe-area-inset-top));padding:3px 10px;border-radius:10px;background:rgba(20,8,16,.55);color:#ffe0a0;font:800 12px system-ui,sans-serif;white-space:nowrap;pointer-events:none;display:none}
#wdProg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:3px;background:rgba(255,255,255,.2);vertical-align:1px}#wdProg i.d{background:#7fe87a}#wdProg i.c{background:#ffd24a;box-shadow:0 0 6px #ffd24a}
body.world #wdProg{display:block}
#wdDone{position:fixed;left:50%;top:calc(30% + env(safe-area-inset-top));transform:translate(-50%,-50%) scale(.9);z-index:40;min-width:min(330px,86vw);padding:16px 20px;border-radius:20px;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s,transform .25s;background:linear-gradient(170deg,rgba(40,70,40,.95),rgba(20,40,24,.95));border:2px solid #9aff8a;color:#fff;font-family:system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}
#wdDone.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
#wdDone.goal{background:linear-gradient(170deg,rgba(80,52,16,.95),rgba(44,24,8,.95));border-color:#ffd24a}
#wdDone b{display:block;font-size:22px;font-weight:900;letter-spacing:.02em}#wdDone small{display:block;margin-top:4px;font-size:14px;color:#e8f0d8;font-weight:700}
#wdDone .rw{margin-top:8px;font-size:18px;font-weight:900;color:#ffe08a}`;
  document.head.appendChild(css);
  const prog = document.createElement('div'); prog.id = 'wdProg';
  const mountProg = () => { if (prog.parentNode) return true; const o = document.getElementById('wdObj'); if (!o) return false; o.parentNode.appendChild(prog); return true; };
  const card = document.createElement('div'); card.id = 'wdDone'; document.body.appendChild(card);
  let cardT = 0;
  function showCard(kind, title, sub, rw) { card.className = kind === 'goal' ? 'goal' : ''; card.innerHTML = '<b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + (rw ? '<div class="rw">' + rw + '</div>' : ''); void card.offsetWidth; card.classList.add('on'); cardT = kind === 'goal' ? 2.2 : 3.2; }
  const res = () => ({ money: W.st.money || 0, food: W.st.food || 0, parts: W.st.parts || 0, ammo: W.st.ammo || 0, xp: W.st.lvl || 0 });
  const diff = (a, b) => { const o = []; if (b.money > a.money) o.push('+' + (b.money - a.money) + ' ₽'); if (b.food > a.food) o.push('+' + (b.food - a.food) + ' 🥟'); if (b.parts > a.parts) o.push('+' + (b.parts - a.parts) + ' ⚙'); if (b.ammo > a.ammo + 20) o.push('+' + (b.ammo - a.ammo) + ' 🧂'); return o.join(' · '); };
  const clean = (t) => String(t || '').replace(/<[^>]+>/g, '').replace(/^🎯\s*/, '');
  const ROST_E = { 1: 'Марса', 2: 'Ржавого каньона', 3: 'Кидонии', 4: 'Кристальных пещер', 5: 'Полярной шапки', 6: 'Фобоса', 7: 'Олимпа', 8: 'Цереры', 9: 'Венеры', 10: 'Европы', 11: 'Титана', 12: 'Луны', 13: 'степи', 14: 'Волги' };
  const FXT = { freeze: 'морозит — «Буханка» тормозит', fuel: 'разъедает бак', nerve: 'треплет нервы', blind: 'слепит вспышкой', zap: 'бьёт током — сыплется соль', steal: 'ворует ₽' };
  function bestiary() { const fl = W.flags.best = W.flags.best || {}; if (fl[W.ch] || !W.ROSTER) return; fl[W.ch] = 1;
    const L = (W.ROSTER[W.ch] || []).map(([id]) => W.TYPES[id]).filter(Boolean).map((t) => t.name + (t.fx ? ' (' + FXT[t.fx] + ')' : t.boom ? ' (взрывается)' : t.split ? ' (делится)' : t.buried ? ' (сидит в засаде)' : t.shoots ? ' (плюётся)' : ''));
    setTimeout(() => W.say && W.say('<b>Пип:</b> Твари ' + (ROST_E[W.ch] || 'здесь') + ': ' + L.join(', ') + '. Других таких нигде нет!'), 9000); }
  let lastCh = -1, lastI = -1, snap = null, name = '', arrSeen = 1, upd = 0;
  const d0 = W.director;
  W.director = function (dt) { d0 && d0(dt); if (cardT > 0) { cardT -= dt; if (cardT <= 0) card.classList.remove('on'); }
    const L = A.CHAPTERS[W.ch] || [], i = A.stepI, cur = A.curStep();
    if (W.ch !== lastCh) { lastCh = W.ch; lastI = i; snap = res(); name = clean(W.obj && W.obj.text); arrSeen = cur ? cur.arrived : 1; bestiary(); }
    else if (i > lastI && !W.visit) { const r = res(), got = diff(snap, r); sfx('j_win1', { vol: 0.7 }); showCard('done', '✅ МИССИЯ ВЫПОЛНЕНА', (lastI + 1) + ' из ' + L.length + (name ? ' · ' + name : ''), got || 'дальше — новая цель'); flash('#9aff8a', 0.25);
      lastI = i; snap = r; name = clean(W.obj && W.obj.text); arrSeen = cur ? cur.arrived : 1; }
    else if (i !== lastI) { lastI = i; snap = res(); name = clean(W.obj && W.obj.text); arrSeen = cur ? cur.arrived : 1; }
    // доехал до столба-цели: сразу награда
    if (cur && cur.arrive && !W.side) { if (!cur.arrived) arrSeen = 0; else if (!arrSeen) { arrSeen = 1; const p = byId(cur.arrive), m = 20 + W.ch * 5; W.give('money', m); W.give('fuel', 10); snap.money += m; if (p) { burst(W.scene, p.x, W.H(p.x, p.z) + 2, p.z, 'spark', '#ffd24a', 6, 0.8); burst(W.scene, p.x, W.H(p.x, p.z) + 1, p.z, 'smoke', p.col || '#ffd24a', 8, 1); }
      showCard('goal', '🎯 ЦЕЛЬ ДОСТИГНУТА', p ? p.e + ' ' + clean(p.name.split(' —')[0]) : '', '+' + m + ' ₽ · +10% ⛽'); sfx('coins', { vol: 0.8 }); } }
    // столб над городом: отметиться — награда (раз в главу)
    if (!W.paused && !W.side) for (const p of W.POI) { if (p.kind !== 'city' || Math.hypot(R.x - p.x, R.z - p.z) > p.r * 0.75) continue; const cv = W.flags.cityV = W.flags.cityV || {}, k = W.ch + ':' + p.id; if (cv[k]) continue; cv[k] = 1;
      W.give('money', 30); W.give('fuel', 25); W.give('food', 1); if (!cardT || cardT <= 0) showCard('goal', '🏙 ГОРОД ОТМЕЧЕН', p.e + ' ' + clean(p.name.split(' —')[0]) + ' · рынок 🏪 открыт', '+30 ₽ · +25% ⛽ · +1 🥟'); sfx('coins', { vol: 0.7 }); A.save && A.save(); }
    upd -= dt; if (upd > 0) return; upd = 0.3; if (!mountProg()) return;
    if (!L.length || W.visit) { prog.style.display = 'none'; return; } prog.style.display = '';
    const n = L.length, done = Math.min(i, n); let dots = ''; for (let k = 0; k < n; k++) dots += '<i class="' + (k < done ? 'd' : k === done ? 'c' : '') + '"></i>';
    prog.innerHTML = (done >= n ? '🏆 Глава пройдена' : '📜 Миссия ' + (done + 1) + ' из ' + n) + dots; };
  clear4.push(() => { card.classList.remove('on'); cardT = 0; });
})();

};
