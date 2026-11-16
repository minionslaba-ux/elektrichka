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
    o.tap = (i) => { if (o.show) return; o.lit(i, 160); if (i === o.seq[o.pi]) { o.pi++; if (o.pi >= o.seq.length) { sfx('coin'); o.lv++; o.show = true; setTimeout(() => cur === o && o.round(), 800); } }
      else { o.err++; sfx('caught'); o.show = true; if (o.err >= cfg.maxErr) { o.say('🚨 ' + cfg.alarm); setTimeout(() => o.fail(), 1200); return; } o.say('❌ Не тот! ' + cfg.who + ' повторяет'); setTimeout(() => cur === o && o.round(), 1200); } };
    o.round(); } }); };

/* ---------- фотоохота: поймать цель в кадр (по ходу «Буханки»), стоять, нажать 📷 ---------- */
const pb = document.createElement('button'); pb.id = 'ph4'; pb.textContent = '📷 Снимок'; pb.style.cssText = 'position:fixed;right:18px;bottom:150px;z-index:40;display:none;min-width:110px;min-height:64px;border-radius:32px;border:3px solid #fff;background:#3a6aff;color:#fff;font:inherit;font-size:17px;box-shadow:0 4px 14px #0007';
document.body.appendChild(pb); const fr = document.createElement('div'); fr.style.cssText = 'position:fixed;left:30%;right:30%;top:22%;bottom:38%;border:3px dashed #fff8;border-radius:12px;z-index:30;pointer-events:none;display:none'; document.body.appendChild(fr);
W.photo4 = function (o) { W.photoEnd4(); const P = W.ph4 = Object.assign({ t: o.time, got: 0, lost: 0 }, o); P.tg.forEach((q) => { q.sp = emojiSprite(q.e, 2.4); q.sp.position.set(q.x, W.H(q.x, q.z) + (q.y || 1.6), q.z); W.scene.add(q.sp); q.done = q.gone = false; }); return P; };
W.photoEnd4 = function () { const P = W.ph4; pb.style.display = fr.style.display = 'none'; if (!P) return; P.tg.forEach((q) => W.scene.remove(q.sp)); W.ph4 = null; };
clear4.push(() => W.photoEnd4());
function inFrame(q) { const dx = q.x - R.x, dz = q.z - R.z, d = Math.hypot(dx, dz), da = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - R.h), Math.cos(Math.atan2(dx, dz) - R.h))); return d > 7 && d < 38 && da < 0.33 ? 1 - da / 0.33 * 0.5 : 0; }
W.photoShot4 = function () { const P = W.ph4; if (!P) return; const q = P.tg.filter((t) => !t.done && !t.gone).map((t) => [t, inFrame(t)]).filter((a) => a[1] > 0).sort((a, b) => b[1] - a[1])[0];
  flash('#ffffff', 0.35); sfx('click'); if (!q) { W.toast('📷 В кадре ничего — наведи «Буханку» прямо на 👣 или 🪞'); return; } if (Math.abs(R.v) > 2) { W.toast('📷 Смазалось! Остановись'); return; }
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
  $('wdObj').innerHTML = '🚶‍♀️ ' + F.label + ' · ' + Math.round(gd) + ' м · 🌡 <b style="color:' + (F.warm < 30 ? '#7fc8ff' : '#ffd27a') + '">' + Math.round(F.warm) + '%</b>' + (hot ? ' · греемся у камня 🔥' : ' · грейся у 🔥 тёплых камней');
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
