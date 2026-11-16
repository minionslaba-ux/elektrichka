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
