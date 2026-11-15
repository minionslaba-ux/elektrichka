/* Особые правила историй 1–50 (у каждой истории свой сценарий) */
window.STX = window.STX || {};
// №7 «Довези Макса сытым» (погоня): Макс ест пирожки на бегу — каждые 2 с минус один; каждая поимка — отбираешь 5 назад.
window.STX[7] = { hint: 'Макс ест пирожки на бегу: каждые 2 с — минус один. Поймала — отобрала 5 назад!',
  init(a) { a.s.pies = 40; a.s.caught = 0; a.hud('🥟 у Макса: 40'); a.every(2, (a) => { a.s.pies--; if (a.s.pies <= 8) a.fail('Макс съел почти всё!'); }); },
  frame(a) { const n = (a.dx && a.dx.n) || 0; if (n > a.s.caught) { a.s.caught = n; a.s.pies = Math.min(40, a.s.pies + 5); a.float('+5 🥟 отобрала!', '#9aff8a'); } a.hud('🥟 у Макса: ' + a.s.pies); },
  result(a) { return ['Пирожков уцелело', a.s.pies + ' из 40']; } };

(() => {
  const X = window.STX;
  // общие помощники: предмет впереди на трассе, погоня/блуждание на даче, «за бабулей»
  const ah = (a, e, m, lat, o) => { const p = a.ahead(m, lat); return a.obj(e, Object.assign({ x: p[0], z: p[1] }, o || {})); };
  const chase = (o, a, v, dt) => { const p = a.player(); if (!p) return; const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1; if (d > 0.3) { o.x += dx / d * v * dt; o.z += dz / d * v * dt; } };
  const wander = (o, a, v, dt, pts) => { if (!o.tg || Math.hypot(o.tg[0] - o.x, o.tg[1] - o.z) < 0.4) o.tg = pts ? a.pick(pts) : a.spot(); const dx = o.tg[0] - o.x, dz = o.tg[1] - o.z, d = Math.hypot(dx, dz) || 1; o.x += dx / d * v * dt; o.z += dz / d * v * dt; };
  const away = (o, a) => { const p = a.player() || { x: 0, z: 0 }; o.x = p.x > 0 ? -9 : 9; o.z = p.z > -3 ? -9 : 4; o.tg = null; };
  const follow = (o, a, h) => { const p = a.player(); if (p) { o.x = p.x; o.z = p.z; o.y = h || 2.6; } };
  const spd = (a) => Math.hypot(a.car.vx || 0, a.car.vz || 0);
  const side = (a, k) => { const v = spd(a) || 1; a.push(a.car.vz / v * k, -a.car.vx / v * k); }; // толчок поперёк хода
  const MKP = [[-8, -1], [-3, -1.2], [3, -0.8], [8, -1.1], [-3, 1.2], [3, 1.0], [-3, 4.2], [3, 4.6], [0, 0.8], [-8.4, 1.2], [8.4, 1.2]]; // проходы рынка
  const OFP = [[6.5, -4.6], [3.0, -1.0], [-3.5, -0.6], [-6.8, -3.6], [-0.5, -0.6], [2.6, 4.0], [5.6, 2.6]]; // проходы офиса
  const CLP = [[-7, 3], [-2, -1.5], [0, 5.5], [6, -2.5], [-3, 5], [7, 5], [3, -4.5]]; // коридор поликлиники

  // №1 Последний земной батон (викторина): Валя отвечает в эфир; опередишь — батон твой.
  X[1] = { hint: 'Валя отвечает за 3–6 с. Успей раньше — 🍞 твой; опоздаешь — времени вдвое меньше',
    init(a) { a.s.me = 0; a.s.va = 0; a.s.qi = -9; },
    frame(a) { const M = a.mg, s = a.s; if (!M || !M.q) return;
      if (M.qi !== s.qi) { s.qi = M.qi; s.vt = a.rnd(3, 6) - a.d * 0.3; s.vf = false; s.j = false; s.ok = M.ok; }
      if (!M.lock && !s.vf && M.qt > s.vt) { s.vf = true; M.qt += (12 - a.d * 1.5 - M.qt) / 2; a.sfx('warn'); a.say('<b>Валя:</b> Я знаю! Я первая! Батон мой!'); }
      if (M.lock && !s.j) { s.j = true; if (M.ok > s.ok && !s.vf) { s.me++; a.sfx('coins'); } else s.va++; }
      a.hud('🍞 ты ' + s.me + ' : ' + s.va + ' Валя' + (s.vf && !M.lock ? ' · Валя уже ответила!' : '')); },
    result(a) { return ['Батон по очкам', (a.s.me > a.s.va ? 'твой ' : 'у Вали ') + a.s.me + ':' + a.s.va]; } };

  // №2 Красная пятница (рынок): прищепки между торгом + ценник «−90 %» ползёт за бабулей.
  X[2] = { hint: 'Собери 5 прищепок 🧷. Ценник «−90 %» 🏷️ ползёт за тобой: коснётся — −8 с',
    init(a) { a.s.n = 0; a.s.buy = 0;
      const pin = (a) => { const p = a.pick(MKP); a.obj('🧷', { x: p[0], z: p[1], size: 1.1, hit(o, a) { a.s.n++; a.sfx('pick'); a.float('Прищепка ' + a.s.n + '/5', '#9aff8a'); if (a.s.n < 5) pin(a); else { a.time(15); a.msg('Прищепки на всю зиму!', '+15 с'); } } }); }; pin(a);
      a.after(6, (a) => a.obj('🏷️', { x: 9, z: -6, size: 1.5, r: 1.2, multi: true,
        move(o, dt, a) { if (!(window.BM && BM.MK && BM.MK.trade)) chase(o, a, 1.1 + a.d * 0.3, dt); },
        hit(o, a) { a.s.buy++; a.time(-8); a.sfx('coins'); a.bad('Купила ненужное!', 'купол для кота · −8 с'); away(o, a); } })); },
    frame(a) { a.hud('🧷 прищепки ' + a.s.n + '/5 · 🏷️ ненужных покупок ' + a.s.buy); },
    result(a) { return ['Прищепок / ненужного', a.s.n + ' / ' + a.s.buy]; } };

  // №3 Банка тяжелее бабки (почта): без марки посылку вернут.
  X[3] = { hint: 'Без марки посылку вернут! Собирай марки 🏷️ — каждая доставка тратит одну',
    init(a) { a.s.st = 2; a.s.n = 0; a.s.back = 0; const put = (a) => ah(a, '🏷️', 90, a.rnd(-4, 4), { hit(o, a) { a.s.st++; a.sfx('coin'); a.float('+1 марка', '#ffe08a'); } }); put(a); a.every(4, put); },
    frame(a) { const D = a.dx, s = a.s; if (!D) return;
      if (D.n > s.n) { if (s.st > 0) s.st--; else { D.n--; D.miss++; s.back++; a.bad('Без марки!', 'Робот-почтальон: «Возврат отправителю»'); } s.n = D.n; }
      a.hud('🏷️ марок: ' + s.st + ' · возвратов ' + s.back); },
    result(a) { return ['Вернули без марки', a.s.back + ' посылок']; } };

  // №4 Дед брал по смыслу (поиск): ложные «гвозди» сбивают, кефир — награда.
  X[4] = { hint: 'Дедовы «по смыслу» 🔩 бродят по даче — не трогай (−5 с). Найди кефир 🥛 — +20 с',
    init(a) { a.s.k = 0; a.s.f = 0;
      for (let i = 0; i < 3; i++) { const p = a.spot(); a.obj('🔩', { x: p[0], z: p[1], size: 1.1, r: 1.1, multi: true, move: (o, dt, a) => wander(o, a, 0.8, dt), hit(o, a) { a.s.f++; a.time(-5); a.sfx('thud'); a.bad('Это гвозди!', 'Дед: «Ну по смыслу же…» · −5 с'); away(o, a); } }); }
      a.after(12, (a) => { const p = a.spot(); a.obj('🥛', { x: p[0], z: p[1], size: 1.3, hit(o, a) { a.s.k = 1; a.time(20); a.sfx('j_found'); a.msg('Кефир нашёлся!', '+20 с · дед оправдан'); } }); a.say('<b>Дед:</b> Таня, кефир я тоже купил! Где-то…'); }); },
    frame(a) { a.hud('🥛 кефир: ' + (a.s.k ? 'найден ✓' : 'ищи!') + ' · 🔩 ошибок ' + a.s.f); },
    result(a) { return ['Кефир', a.s.k ? 'нашёлся' : 'так и не нашёлся']; } };

  // №5 Козу в зону упаковки (лента): Зорька едет по ленте, касса зависает.
  X[5] = { hint: 'Зорька 🐐 на ленте: тапнешь — съест 2 покупки, пропустишь — +2 с. Касса зависает!',
    init(a) { a.s.seen = new Set(); a.s.g = []; a.s.pass = 0; a.s.eat = 0;
      a.every(11, (a) => { a.speed(0.15); a.sfx('warn'); a.say('<b>Касса:</b> Неизвестный предмет в зоне упаковки…'); a.after(2, (a) => a.speed(1)); }); },
    frame(a) { const M = a.mg, s = a.s; if (!M || !M.it) return;
      for (const it of M.it) if (!s.seen.has(it)) { s.seen.add(it); if (!it.good && Math.random() < 0.5) { it.el.textContent = '🐐'; it.goat = 1; s.g.push(it); } }
      s.g = s.g.filter((it) => { if (it.gone) { s.eat++; M.ok = Math.max(0, M.ok - 2); M.bad = Math.max(0, M.bad - 1); a.sfx('slap'); a.flash('#ff8a6a', 0.2); return false; }
        if (it.x < -0.1) { s.pass++; M.left += 2; a.sfx('coin'); return false; } return true; });
      a.hud('🐐 пропущено ' + s.pass + ' (+' + s.pass * 2 + ' с) · съела ' + s.eat * 2); },
    result(a) { return ['Зорька съела покупок', a.s.eat * 2]; } };

  // №6 Торг до урожая (огород): продавец носит ящики рассады, лишние вянут.
  X[6] = { hint: 'Продавец носит рассаду: ящик каждые 20 с (3 посадки). Больше 2 ждут — вянут (−6 с)',
    init(a) { a.s.box = 1; a.s.pl = 0; a.s.wilt = 0; a.s.c = ((a.farm && a.farm.beds) || []).map((b) => b.c);
      a.every(20, (a) => { a.s.box++; a.sfx('thud'); a.say('<b>Продавец:</b> Бабушка, вот ещё партия! Только уйдите!');
        if (a.s.box > 2) { a.s.box = 2; if (a.farm.beds.some((b) => !b.c)) { a.s.wilt++; a.time(-6); a.bad('Рассада вянет!', 'сажай быстрее · −6 с'); } } }); },
    frame(a) { const s = a.s, B = (a.farm && a.farm.beds) || [];
      B.forEach((b, i) => { if (b.c && !s.c[i]) { s.pl++; if (s.box > 0 && s.pl % 3 === 0) s.box--; if (s.pl === 9) { a.time(15); a.msg('Всё засажено!', 'продавец ушёл обедать · +15 с'); } } s.c[i] = b.c; });
      a.hud('📦 ящиков ждёт: ' + s.box + ' · посажено ' + s.pl + ' · завяло ' + s.wilt); },
    result(a) { return ['Посажено / завяло', a.s.pl + ' / ' + a.s.wilt]; } };

  // №8 Яйца посветлее (ночь): Валя шарит лучом и забирает яйца, золотые — бонус.
  X[8] = { hint: 'Валя шарит лучом 🔦: заедешь в луч — заберёт 3 яйца. Золотое 🌟 — +5',
    init(a) { a.s.lost = 0; a.s.gold = 0;
      a.every(5, (a) => { const i = a.idx + 35, p = a.track(i, 0); a.obj('🔦', { x: p[0], z: p[1], size: 2.6, r: 2.4, multi: true, y: 1.4, i, ph: Math.random() * 6,
        move(o, dt, a) { o.ph += dt; const q = a.track(o.i, Math.sin(o.ph * 1.3) * 5); o.x = q[0]; o.z = q[1]; },
        hit(o, a) { a.addPot(-3); a.s.lost += 3; a.flash('#fff6c0', 0.4); a.sfx('warn'); a.float('Валя: «Моё!» −3', '#ff9ad5'); } }); });
      a.every(9, (a) => ah(a, '🌟', 80, a.rnd(-3, 3), { size: 1.6, hit(o, a) { a.addPot(5); a.s.gold++; a.sfx('combo'); a.float('+5 🌟', '#ffe08a'); } })); },
    frame(a) { a.hud('🔦 Валя забрала: ' + a.s.lost + ' · 🌟 золотых ' + a.s.gold); },
    result(a) { return ['Валя забрала яиц', a.s.lost]; } };

  // №9 Третий подорожник: акция «каждый третий бесплатно» + бонусная карта ×2.
  X[9] = { hint: 'Каждый 3-й подорожник — +1 бесплатно, с картой 💳 — каждый. Колючка сжигает акцию!',
    init(a) { a.s.p = a.car.pot; a.s.c = 0; a.s.free = 0; a.s.burn = 0; a.s.x2 = 0;
      a.every(10, (a) => ah(a, '💳', 90, a.rnd(-4, 4), { size: 1.5, hit(o, a) { a.s.x2 = 6; a.sfx('coins'); a.float('Бонусная карта! 6 с', '#9fd8ff'); } })); },
    frame(a, dt) { const s = a.s, p = a.car.pot; if (s.x2 > 0) s.x2 -= dt;
      if (p > s.p) { s.c += p - s.p; const need = s.x2 > 0 ? 1 : 3; while (s.c >= need) { s.c -= need; s.free++; a.addPot(1); a.float('Бесплатно! +1', '#9aff8a'); } }
      else if (p < s.p) { if (s.c) a.bad('Акция сгорела!', 'колючка порвала чек'); s.burn++; s.c = 0; }
      s.p = a.car.pot; a.hud((s.x2 > 0 ? '💳 каждый бесплатно! ' + Math.ceil(s.x2) + ' с' : '🌿 акция ' + s.c + '/3') + ' · бесплатных ' + s.free); },
    result(a) { return ['Бесплатных подорожников', a.s.free]; } };

  // №10 Земная картофелина (прицеп): фотографы у обочины + охранник «руками не трогать».
  X[10] = { hint: 'Очередь фотографов 📸 у обочин: проедь вплотную — фото со звездой. Охранник 👮 — объезжай',
    init(a) { a.s.ph = 0; a.s.g = 0;
      a.every(6, (a) => ah(a, '📸', 100, a.pick([-4.5, 4.5]), { size: 1.7, r: 2, hit(o, a) { a.s.ph++; a.flash('#ffffff', 0.35); a.sfx('click'); a.float('Фото с картошкой! ' + a.s.ph, '#ffe08a'); if (a.s.ph === 5) a.msg('Звезда выставки!', 'пять фото — очередь в восторге'); } }));
      a.every(9, (a) => ah(a, '👮', 110, a.rnd(-2, 2), { size: 1.8, hit(o, a) { a.s.g++; a.spin(0.5); a.sfx('thud'); a.bad('Руками не трогать!', 'охранник проверяет прицеп'); } })); },
    frame(a) { a.hud('📸 фото ' + a.s.ph + '/5 · 👮 придирок ' + a.s.g); },
    result(a) { return ['Фото с картофелиной', a.s.ph]; } };

  // №11 Робот вернулся сам (загон): из мешка сыплются банки, торговец с жалобой гонится.
  X[11] = { hint: 'Из мешка робота сыплются банки 🥫 — собирай (+3 с). Торговец с жалобой 🧾 догоняет: −10 с',
    init(a) { a.s.n = 0; a.s.c = 0;
      a.every(4, (a) => { const g = (a.wk && a.wk.gt) || a.spot(); a.obj('🥫', { x: a.clamp(g[0] + a.rnd(-1.5, 1.5), -9.5, 9.5), z: a.clamp(g[1] + a.rnd(-1.5, 1.5), -10, 5), size: 0.9, r: 1.1, hit(o, a) { a.s.n++; a.time(3); a.sfx('pick'); a.float('Банка! +3 с', '#9aff8a'); } }); });
      a.after(8, (a) => a.obj('🧾', { x: -9, z: -9, size: 1.4, r: 1.2, multi: true, move: (o, dt, a) => chase(o, a, 1.3 + a.d * 0.3, dt),
        hit(o, a) { a.s.c++; a.time(-10); a.sfx('warn'); a.bad('Жалоба!', 'Торговец: «Возврат в обратную сторону!» · −10 с'); away(o, a); } })); },
    frame(a) { a.hud('🥫 банок ' + a.s.n + ' · 🧾 жалоб ' + a.s.c); },
    result(a) { return ['Банок из мешка / жалоб', a.s.n + ' / ' + a.s.c]; } };

  // №12 Чих на бирже (лента): Гена чихает — лента мчит, клубни за два.
  X[12] = { hint: 'Гена чихает каждые 10 с: лента мчит 3 с, но клубни в чих идут за два!',
    init(a) { a.s.ch = 0; a.s.x2 = 0; a.s.ok = 0; a.s.seen = new Set();
      a.every(10, (a) => { a.s.ch = 3; a.speed(2); a.shake(0.3); a.sfx('boom'); a.say('<b>Гена:</b> А-а-апчхи! Извините, это не обвал!'); }); },
    frame(a, dt) { const M = a.mg, s = a.s; if (!M || !M.it) return; if (s.ch > 0) { s.ch -= dt; if (s.ch <= 0) a.speed(1); }
      if (M.ok > s.ok && s.ch > 0) { s.x2++; M.ok++; } s.ok = M.ok;
      for (const it of M.it) if (!s.seen.has(it)) { s.seen.add(it); if (!it.good) it.el.textContent = '🚀'; }
      a.hud((s.ch > 0 ? '🤧 ЧИХ! клубни ×2 · ' : '📈 курс ровный · ') + 'бонусных ' + s.x2); },
    result(a) { return ['Поймано на чихе', a.s.x2 + ' клубней ×2']; } };

  // №13 Пирожок вместо заплатки (тушим): холодный пирожок не держит — грей у печки.
  X[13] = { hint: 'Горячий пирожок держит, холодный — нет! Жар 🥧 падает — грейся у печки 🔥 справа',
    init(a) { a.s.h = 100; a.s.n = 0; a.s.cold = 0;
      a.obj('🔥', { x: 8.5, z: 3.5, size: 1.6, r: 1.8, multi: true, hit(o, a) { if (a.s.h < 100) { a.s.h = 100; a.sfx('pot'); a.float('Пирожок горячий! 🥧', '#ffcf6a'); } } }); },
    frame(a, dt) { const s = a.s, W = a.wk; if (!W) return; s.h = Math.max(0, s.h - dt * (3 + a.d)); if (W.n > s.n) { s.h = Math.max(0, s.h - 15 * (W.n - s.n)); s.n = W.n; }
      if (s.h <= 0) { if (W.w > 0) { W.w = 0; s.cold++; a.bad('Пирожок остыл!', 'Дед: «Холодный не держит!» — к печке 🔥'); } }
      a.hud(s.h > 0 ? '🥧 жар ' + Math.round(s.h) + '%' : '🥶 пирожок холодный — к печке 🔥!'); },
    result(a) { return ['Пирожок остывал', a.s.cold + ' раз']; } };

  // №14 Гравитация до 14:00 (лови): МарсЖЭК выключает гравитацию — всё падает медленно, бабуля прыгучая.
  X[14] = { hint: 'Каждые 12 с гравитацию отключают на 4 с: всё падает медленно, а ты бегаешь быстрее',
    init(a) { a.s.zg = 0; a.s.k = 0; a.s.clock = 0;
      a.every(12, (a) => { a.s.zg = 4; a.s.k++; a.speed(1.5); a.sfx('jump'); a.flash('#bfe8ff', 0.3); a.say('<b>МарсЖЭК:</b> Плановое отключение гравитации. Держитесь!'); }); },
    frame(a, dt) { const s = a.s, W = a.wk; if (!W || !W.fall) return;
      if (s.zg > 0) { s.zg -= dt; for (const f of W.fall) if (!f.zg && f.t < 0.1) { f.zg = 1; f.T *= 1.8; } if (s.zg <= 0) a.speed(1); }
      s.clock += dt; const m = Math.min(59, 40 + Math.floor(s.clock / 4)); a.hud((s.zg > 0 ? '🪐 НЕВЕСОМОСТЬ ' + Math.ceil(s.zg) + ' с' : '🌍 гравитация есть') + ' · 13:' + m); },
    result(a) { return ['Отключений гравитации', a.s.k]; } };

  // №15 Обои стык в стык (уборка): обрезки липнут, кот Гоша — «узор».
  X[15] = { hint: 'Обрезки липкие: носишь дольше 5 с — прилипли, ход вдвое тише. Гоша-«узор» 🐱 — +4 с',
    init(a) { a.s.ct = 0; a.s.st = 0; a.s.cat = 0;
      a.obj('🐱', { x: 4, z: -4, size: 1.3, r: 1.2, multi: true, move: (o, dt, a) => wander(o, a, 1.5, dt), hit(o, a) { a.s.cat++; a.time(4); a.sfx('found'); a.float('Это не стык, это кот! +4 с', '#9aff8a'); away(o, a); } }); },
    frame(a, dt) { const s = a.s, W = a.wk; if (!W || !W.carry) return;
      if (W.carry.length) { s.ct += dt; if (s.ct > 5 && !s.sk) { s.sk = 1; s.st++; a.speed(0.55); a.sfx('soft'); a.bad('Прилипло!', 'неси скорее в бак 🗑️'); } }
      else { s.ct = 0; if (s.sk) { s.sk = 0; a.speed(1); } }
      a.hud(s.sk ? '🧻 ПРИЛИПЛО! в бак!' : W.carry.length ? '🧻 клей схватывается: ' + Math.max(0, 5 - s.ct).toFixed(1) + ' с' : '🧻 руки свободны · 🐱 ' + s.cat); },
    result(a) { return ['Прилипало обрезков', a.s.st + ' раз']; } };

  // №16 Храп по ночному тарифу (лунатик): инспектор с диктофоном считает пени.
  X[16] = { hint: 'Инспектор 🎙️ подкрадывается к храпящему деду и считает пени. Коснись — убежит',
    init(a) { a.s.p = 0; a.s.sh = 0;
      a.after(6, (a) => a.obj('🎙️', { x: -9, z: -9, size: 1.4, r: 1.3, multi: true,
        move(o, dt, a) { const D = a.wk && a.wk.dd; if (D && D.visible) { const dx = D.position.x - o.x, dz = D.position.z - o.z, d = Math.hypot(dx, dz) || 1; if (d > 1.6) { o.x += dx / d * (1.4 + a.d * 0.3) * dt; o.z += dz / d * (1.4 + a.d * 0.3) * dt; } else a.s.p += dt * 5; } },
        hit(o, a) { a.s.sh++; a.sfx('slap'); a.float('Кыш, МарсЖЭК!', '#9aff8a'); away(o, a); } })); },
    frame(a) { if (a.s.p >= 200) a.fail('Пени за храп больше пенсии!'); a.hud('💸 пени за храп: ' + Math.round(a.s.p) + ' / 200 ₽ · прогнала ' + a.s.sh); },
    result(a) { return ['Пени за храп', Math.round(a.s.p) + ' ₽']; } };

  // №17 Экономия по-гошиному (кислород): кот крутит счётчик назад, МарсЖЭК проверяет.
  X[17] = { hint: 'Подбери Гошу 🐱 — 5 с кислород не тратится. Проверка МарсЖЭКа 📋 — −15 %',
    init(a) { a.s.g = 0; a.s.ch = 0; a.s.n = 0;
      a.every(8, (a) => ah(a, '🐱', 90, a.rnd(-4, 4), { hit(o, a) { a.s.g = 5; a.s.n++; a.sfx('found'); a.float('Гоша крутит счётчик назад!', '#9aff8a'); } }));
      a.every(7, (a) => ah(a, '📋', 110, a.rnd(-4, 4), { hit(o, a) { if (a.dx) a.dx.f -= 15; a.s.ch++; a.sfx('warn'); a.bad('Проверка МарсЖЭКа!', '−15 % кислорода'); } })); },
    frame(a, dt) { const s = a.s, D = a.dx; if (s.g > 0 && D) { s.g -= dt; D.f = Math.min(100, D.f + dt * (1.6 + a.d * 0.25) * (a.car.boost > 0 ? 1.8 : 1)); }
      a.hud(s.g > 0 ? '🐱 счётчик крутится назад: ' + Math.ceil(s.g) + ' с' : '🐱 Гош ' + s.n + ' · 📋 проверок ' + s.ch); },
    result(a) { return ['Гоша помог / проверок', a.s.n + ' / ' + a.s.ch]; } };

  // №18 Дырочки для ушей (танцы): дрель глушит музыку, серии усыпляют колонию.
  X[18] = { hint: 'Дрель глушит музыку: каждые 9 с нотки пропадают на 2 с. 6 попаданий подряд — 😴 +1',
    init(a) { a.s.dr = 0; a.s.st = 0; a.s.z = 0; a.s.h = 0; a.s.m = 0;
      a.every(9, (a) => { a.s.dr = 2; a.sfx('warn'); a.shake(0.2); a.say('<b>Лёха:</b> Ба, ещё одну дырочку! Вжжжж!'); }); },
    frame(a, dt) { const M = a.mg, s = a.s; if (!M || !M.els) return; if (s.dr > 0) s.dr -= dt;
      M.els.forEach((el) => (el.style.opacity = s.dr > 0 ? '0.08' : ''));
      if (M.hit > s.h) { s.st += M.hit - s.h; s.h = M.hit; if (s.st >= 6) { s.st = 0; s.z++; a.sfx('combo'); } }
      if (M.miss > s.m) { s.m = M.miss; s.st = 0; }
      a.hud((s.dr > 0 ? '🔩 ВЖЖЖ! жми по памяти · ' : '') + '😴 спят: ' + s.z + ' · серия ' + s.st + '/6'); },
    result(a) { return ['Колония доспала', a.s.z + ' раз']; } };

  // №19 Субботник в пыли (стена): мётлы отбрасывают стену, кучи пыли тормозят.
  X[19] = { hint: 'Метла 🧹 отбрасывает пылевую стену на 24 м. Кучи пыли 🟫 на дороге — заносят',
    init(a) { a.s.b = 0; a.s.p = 0;
      a.every(7, (a) => ah(a, '🧹', 100, a.rnd(-4, 4), { size: 1.6, hit(o, a) { if (a.dx) a.dx.wi -= 12; a.s.b++; a.sfx('turbo'); a.float('Подмела! стена −24 м', '#9aff8a'); } }));
      a.every(4, (a) => ah(a, '🟫', 120, a.rnd(-4, 4), { size: 1.8, r: 1.9, hit(o, a) { a.s.p++; a.spin(0.5); a.sfx('soft'); a.float('Куча пыли!', '#ff9a7a'); } })); },
    frame(a) { a.hud('🧹 мётел ' + a.s.b + ' · 🟫 куч ' + a.s.p); },
    result(a) { return ['Мётел / куч пыли', a.s.b + ' / ' + a.s.p]; } };

  // №20 До свадьбы внуков (рецепт): Лёха таскает огурцы, пустые банки дают время.
  X[20] = { hint: 'Лёха 🧒 таскает огурцы: догонит — рецепт заново. Пустые банки 🫙 — +5 с',
    init(a) { a.s.l = 0; a.s.j = 0;
      a.after(5, (a) => a.obj('🧒', { x: 9, z: 4, size: 1.4, r: 1.2, multi: true, move: (o, dt, a) => chase(o, a, 1.0 + a.d * 0.35, dt),
        hit(o, a) { const W = a.wk; if (W && W.ri > 0) { W.ri = 0; a.s.l++; a.sfx('slap'); a.bad('Лёха утащил!', 'Лёха: «Ба, я жениться не собираюсь!» · рецепт заново'); } away(o, a); } }));
      a.every(9, (a) => { const p = a.spot(); a.obj('🫙', { x: p[0], z: p[1], size: 1.1, hit(o, a) { a.s.j++; a.time(5); a.sfx('jar'); a.float('Пустая банка! +5 с', '#9aff8a'); } }); }); },
    frame(a) { a.hud('🧒 утащил ' + a.s.l + ' · 🫙 пустых ' + a.s.j); },
    result(a) { return ['Лёха утащил / пустых банок', a.s.l + ' / ' + a.s.j]; } };

  // №21 Скафандр за 30 секунд (дед рулит): дед отвлекается, ватники стирают песок.
  X[21] = { hint: 'Каждые 12 с дед отвлекается на Макса — 4 с руль НОРМАЛЬНЫЙ. Ватники 🧥 — −1,5 с песка',
    init(a) { a.s.k = 0; a.s.v = 0; a.s.f = 0;
      a.every(12, (a) => { a.s.f = 4; a.s.k++; a.steer(-1); a.sfx('warn'); a.msg('Дед отвлёкся!', 'руль снова нормальный — 4 с'); a.after(4, (a) => { a.steer(1); a.msg('Дед снова рулит', 'опять наоборот!'); }); });
      a.every(6, (a) => ah(a, '🧥', 90, a.rnd(-3.5, 3.5), { hit(o, a) { if (a.dx) a.dx.off = Math.max(0, a.dx.off - 1.5); a.s.v++; a.sfx('pick'); a.float('Ватник! −1,5 с песка', '#9aff8a'); } })); },
    frame(a, dt) { if (a.s.f > 0) a.s.f -= dt; a.hud((a.s.f > 0 ? '🙂 руль нормальный ' + Math.ceil(a.s.f) + ' с' : '🙃 руль наоборот') + ' · 🧥 ' + a.s.v); },
    result(a) { return ['Ватников собрано', a.s.v]; } };

  // №22 Кто стучит в погребе (ночь): темно, фонарь у деда, медведь с ложкой.
  X[22] = { hint: 'Ночь, ничего не видно. Фонарь 🔦 у деда — светит 12 с. Медведь с ложкой 🐻 — −6 с',
    init(a) { a.s.l = 0; a.s.b = 0; a.fog(0.085);
      a.obj('🔦', { x: 0, z: 4.5, size: 1.4, r: 1.4, multi: true, hit(o, a) { if (a.s.l <= 0) { a.s.l = 12; a.fog(0.02); a.sfx('click'); a.float('Дед: «Держи фонарь!»', '#ffe08a'); } } });
      a.after(10, (a) => a.obj('🐻', { x: 9, z: -9, size: 1.6, r: 1.3, multi: true, move: (o, dt, a) => chase(o, a, 0.9 + a.d * 0.3, dt), hit(o, a) { a.s.b++; a.time(-6); a.sfx('thud'); a.bad('Медведь с ложкой!', 'просит варенья · −6 с'); away(o, a); } })); },
    frame(a, dt) { const s = a.s; if (s.l > 0) { s.l -= dt; if (s.l <= 0) { a.fog(0.085); a.bad('Батарейка села!', 'к деду за фонарём 🔦'); } }
      a.hud(s.l > 0 ? '🔦 светло ещё ' + Math.ceil(s.l) + ' с' : '🌑 темно — фонарь у деда'); },
    result(a) { return ['Встреч с медведем', a.s.b]; } };

  // №23 Помидоры тушатся сами (тушим): пар выкипает ведро, спелые помидоры — в банку.
  X[23] = { hint: 'Пар 💨 гуляет по теплице — выкипает ведро. Спелые помидоры 🍅 — в банку (+3 с)',
    init(a) { a.s.st = 0; a.s.t = 0;
      for (let i = 0; i < 2; i++) { const p = a.spot(); a.obj('💨', { x: p[0], z: p[1], size: 1.8, r: 1.4, multi: true, move: (o, dt, a) => wander(o, a, 1.4 + a.d * 0.2, dt), hit(o, a) { const W = a.wk; if (W && W.w > 0) { W.w--; a.s.st++; a.sfx('soft'); a.bad('Пар!', 'ведро выкипело на треть'); } } }); }
      a.every(6, (a) => { const p = a.spot(); a.obj('🍅', { x: p[0], z: p[1], size: 1, hit(o, a) { a.s.t++; a.time(3); a.sfx('jar'); a.float('В банку! +3 с', '#9aff8a'); } }); }); },
    frame(a) { a.hud('🍅 в банках ' + a.s.t + ' · 💨 выкипело ' + a.s.st); },
    result(a) { return ['Помидоров спасено', a.s.t]; } };

  // №24 Шесть соток с долину (картошка): межевые колышки и перемер председателя.
  X[24] = { hint: 'Проезжай через 6 колышков 📍 — каждый отмеряет сотку (+5 🥔). Рулетка 📏 — перемер −2',
    init(a) { a.s.n = 0; a.s.r = 0;
      for (let k = 0; k < 6; k++) { const p = a.track(a.len * (0.12 + k * 0.14), k % 2 ? 3 : -3); a.obj('📍', { x: p[0], z: p[1], size: 2, r: 2.3, hit(o, a) { a.s.n++; a.addPot(5); a.sfx('coins'); a.float('Сотка ' + a.s.n + '/6 · +5', '#9aff8a'); if (a.s.n === 6) a.msg('Все шесть соток!', 'Председатель: «Как вышло — так и вышло»'); } }); }
      a.every(9, (a) => ah(a, '📏', 100, a.rnd(-4, 4), { hit(o, a) { a.addPot(-2); a.s.r++; a.sfx('warn'); a.float('Перемер! −2', '#ff8a6a'); } })); },
    frame(a) { a.hud('📍 соток ' + a.s.n + '/6 · 📏 перемеров ' + a.s.r); },
    result(a) { return ['Соток отмерено', a.s.n + ' из 6']; } };

  // №25 Криворукий предшественник (жуки): подай роботу 3 ключа — заделает дыру.
  X[25] = { hint: 'Принеси роботу-мастеру 🤖 3 ключа 🔧 — он заделает дыру, и жуков станет меньше',
    init(a) { a.s.n = 0; a.s.h = null;
      const key = (a) => { const p = a.spot(); a.obj('🔧', { x: p[0], z: p[1], size: 1.1, r: 1.2, hit(o, a) { if (a.s.h) return; a.s.h = a.obj('🔧', { size: 0.8, move: (q, dt, a) => follow(q, a) }); a.sfx('pick'); } }); };
      key(a); a.obj('🤖', { x: 0, z: -9, size: 1.8, r: 1.8, multi: true, hit(o, a) { if (!a.s.h) return; a.s.h.kill(); a.s.h = null; a.s.n++; a.sfx('found');
        if (a.s.n >= 3) a.msg('Дыра заделана!', 'Робот: «Версия 2.0 паяет лучше»'); else { a.float('Ключ ' + a.s.n + '/3', '#9aff8a'); key(a); } } }); },
    frame(a, dt) { const W = a.wk; if (a.s.n >= 3 && W && W.bugT !== undefined) W.bugT += dt * 0.6; a.hud(a.s.n >= 3 ? '🤖 дыра заделана — жуков меньше' : '🔧 ключей ' + a.s.n + '/3' + (a.s.h ? ' · неси роботу 🤖' : '')); },
    result(a) { return ['Ключей роботу', a.s.n + ' из 3']; } };

  // №26 Справка, что я — это я (поликлиника): «вечный цикл» возвращает ко входу, пирожок перезагружает Валерия.
  X[26] = { hint: 'Справка «цикл» 🔄 кружит по коридору — вернёт ко входу. Пирожок 🥧 Валерию — +20 с',
    init(a) { a.s.c = 0; a.s.p = 0; a.s.h = null;
      a.obj('🥧', { x: 0, z: 5.5, size: 1.2, hit(o, a) { a.s.h = a.obj('🥧', { size: 0.8, move: (q, dt, a) => follow(q, a) }); a.sfx('pick'); a.float('Пирожок для Валеры', '#ffe08a'); } });
      a.obj('🤖', { x: -4.5, z: -3.6, y: 2.6, size: 0.9, r: 2, multi: true, hit(o, a) { if (!a.s.h) return; a.s.h.kill(); a.s.h = null; a.s.p = 1; a.time(20); a.sfx('j_found'); a.msg('Валерий перезагрузился!', 'Валера, не зацикливайся · +20 с'); } });
      a.after(5, (a) => a.obj('🔄', { x: 3, z: 0, size: 1.4, r: 1.1, multi: true, ph: 0, move(o, dt) { o.ph += dt * 0.7; o.x = 1 + Math.cos(o.ph) * 5; o.z = 0.5 + Math.sin(o.ph) * 4.5; },
        hit(o, a) { a.s.c++; a.wk.p.set(-7.4, 0, 3); a.sfx('warn'); a.bad('Вечный цикл!', 'для справки нужен паспорт… — снова у входа'); } })); },
    frame(a) { a.hud('🔄 циклов ' + a.s.c + ' · 🥧 ' + (a.s.p ? 'Валера сыт ✓' : a.s.h ? 'неси Валерию' : 'пирожок на скамейке')); },
    result(a) { return ['Ходила по кругу', a.s.c + ' раз']; } };

  // №27 Староста очереди (почта): обеды остывают — грей у костров, Валя «по журналу».
  X[27] = { hint: 'Обеды остывают! 🔥 костры на дороге греют, доставка — тоже. Остынут — Таню занесёт',
    init(a) { a.s.tp = 100; a.s.n = 0; a.s.hot = 0; a.s.cold = 0;
      a.every(5, (a) => ah(a, '🔥', 100, a.rnd(-4, 4), { hit(o, a) { a.s.tp = Math.min(100, a.s.tp + 40); a.sfx('pot'); a.float('Подогрела! +40°', '#ffcf6a'); } }));
      a.every(13, (a) => ah(a, '👵', 110, a.rnd(-3, 3), { size: 1.8, hit(o, a) { a.boost(1.5); a.sfx('turbo'); a.float('Валя: «Мне по журналу!» — газу!', '#ff9ad5'); } })); },
    frame(a, dt) { const s = a.s, D = a.dx; s.tp -= dt * (3 + a.d);
      if (D && D.n > s.n) { if (s.tp > 50) s.hot++; s.n = D.n; s.tp = 100; }
      if (s.tp <= 0) { s.tp = 35; s.cold++; a.spin(0.6); a.bad('Обеды остыли!', 'Дед: «Таня, кружок не ест холодное!»'); }
      a.hud('🍲 ' + Math.round(s.tp) + '° · горячими ' + s.hot + ' · остывало ' + s.cold); },
    result(a) { return ['Обедов горячими', a.s.hot]; } };

  // №28 Таблетка от сквозняка (буря): догоняй катящуюся таблетку — ветер стихает.
  X[28] = { hint: 'Таблетка 💊 катится по куполу по часовой. Догони — 6 с тихо: пыль оседает, идёшь быстрее',
    init(a) { a.s.n = 0; a.s.c = 0;
      a.obj('💊', { x: 6, z: -3, size: 1.3, r: 1.3, multi: true, ph: 0, move(o, dt, a) { o.ph -= dt * (0.35 + a.d * 0.05); o.x = Math.cos(o.ph) * 6.5; o.z = -3 + Math.sin(o.ph) * 5.5; },
        hit(o, a) { if (a.s.c > 0) return; a.s.c = 6; a.s.n++; a.fog(0.015); a.speed(1.35); a.sfx('found'); a.msg('Сквозняк утих!', 'Фармацевт: «Катить по часовой!»'); } }); },
    frame(a, dt) { const s = a.s; if (s.c > 0) { s.c -= dt; if (s.c <= 0) { a.fog(0.055); a.speed(1); a.bad('Снова дует!', 'догоняй таблетку 💊'); } }
      a.hud(s.c > 0 ? '💊 тихо ещё ' + Math.ceil(s.c) + ' с' : '💊 таблетка катится — догони! (' + s.n + ')'); },
    result(a) { return ['Ловила таблетку', a.s.n + ' раз']; } };

  // №29 Рецепт в кроссворде (лови): ветер меняется и гонит особые страницы с рецептом.
  X[29] = { hint: 'Ветер меняется каждые 8 с и сносит тебя. Лови 3 страницы с рецептом 📜 — +10 с',
    init(a) { a.s.w = 1.6; a.s.n = 0;
      a.every(8, (a) => { a.s.w = (Math.random() < 0.5 ? -1 : 1) * (1.2 + a.d * 0.5); a.sfx('soft'); a.say('<b>Дед:</b> Таня, ветер ' + (a.s.w > 0 ? 'вправо' : 'влево') + '! Страницы летят!'); });
      const page = (a) => { const w = a.s.w; a.obj('📜', { x: w > 0 ? -9.5 : 9.5, z: a.rnd(-8, 4), y: 1.6, size: 1.3, r: 1.3, move(o, dt, a) { o.x += a.s.w * 0.9 * dt; o.y = 1.6 + Math.sin(a.t * 3) * 0.4; if (Math.abs(o.x) > 11) { o.kill(); page(a); } },
        hit(o, a) { a.s.n++; a.sfx('found'); a.float('Страница ' + a.s.n + '/3', '#9aff8a'); if (a.s.n === 3) { a.time(10); a.msg('Рецепт собран!', 'по вертикали — «грелка» · +10 с'); } else page(a); } }); };
      a.after(3, page); },
    frame(a) { a.push(a.s.w, 0); a.hud('🌬 ветер ' + (a.s.w > 0 ? '→' : '←') + ' · 📜 рецепт ' + Math.min(3, a.s.n) + '/3'); },
    result(a) { return ['Страниц рецепта', Math.min(3, a.s.n) + ' из 3']; } };

  // №30 Триста первых (повтори): дед-староста прощает ошибку, быстрые раунды наводят порядок.
  X[30] = { hint: 'Дед-староста прощает 1 ошибку. Раунд быстрее 15 с — ⭐ порядка; набери все — талоны!',
    init(a) { const M = a.mg; if (M && M.life) M.life++; a.s.lv = M ? M.lv : 0; a.s.t0 = a.t; a.s.o = 0; a.s.need = Math.max(3, ((M && M.need) || 6) - 3); },
    frame(a) { const M = a.mg, s = a.s; if (!M || M.lv === undefined) return;
      if (M.lv !== s.lv) { if (M.lv > s.lv && s.lv > 0 && a.t - s.t0 < 15) { s.o++; a.sfx('combo'); a.say('<b>Дед:</b> Порядок! Следующий — по журналу!'); if (s.o >= s.need) a.win('Очередь построена — все снова по номерам!'); } s.lv = M.lv; s.t0 = a.t; }
      a.hud('⭐ порядок ' + s.o + '/' + s.need + ' · ⏱ ' + Math.max(0, Math.ceil(15 - (a.t - s.t0))) + ' с · ❤ ' + M.life); },
    result(a) { return ['Звёзд порядка', a.s.o + ' из ' + a.s.need]; } };

  // №31 Пластыри на неделю (оборона): медведи заклеиваются, надо сберечь 8 банок.
  X[31] = { hint: 'Медведи в пластырях: каждые 12 с заклеиваются (+1 к здоровью). Сбереги 8 банок!',
    init(a) { a.s.n = 0; a.every(12, (a) => { const D = a.df; let k = 0; ((D && D.bears) || []).forEach((b) => { if (!b.run && b.hp > 0) { b.hp++; k++; } }); if (k) { a.s.n += k; a.sfx('soft'); a.say('<b>Михал Потапыч:</b> Пластырь — и как новенький!'); } }); },
    frame(a) { const D = a.df; if (!D || !D.active) return; a.hud('🩹 заклеилось ' + a.s.n + ' · 🫙 ' + D.jars + (D.jars < 8 ? ' — мало!' : ' ≥ 8 ✓')); },
    result(a) { const j = (a.df && a.df.jars) || 0; return ['Банок к ужину', j + (j >= 8 ? ' — хватит на неделю' : ' — на пластыри не хватит')]; } };

  // №32 Где печать, Гоша? (украсть): кот ходит следом и шумит, рыбка его отвлекает.
  X[32] = { hint: 'Гоша 🐱 ходит за тобой и мурчит — Валя слышит. Подбери рыбку 🐟 — кот сядет есть',
    init(a) { a.s.nz = 0; a.s.f = 0; a.s.k = 0;
      a.obj('🐱', { x: -1, z: 4.5, size: 1.1, r: 0, move(o, dt, a) { if (a.s.f > 0) return; const p = a.player(); if (Math.hypot(p.x - o.x, p.z - o.z) > 1.4) chase(o, a, 3.2, dt); else a.s.nz += dt * (9 + a.d * 3); } });
      const fish = (a) => { const p = a.player(); a.obj('🐟', { x: a.clamp(p.x + a.rnd(-4, 4), -8, 8), z: p.z + a.rnd(2, 5), size: 1, hit(o, a) { a.s.f = 10; a.sfx('pick'); a.float('Гоша, ешь рыбку!', '#9aff8a'); a.after(9, fish); } }); }; a.after(4, fish); },
    frame(a, dt) { const s = a.s; if (s.f > 0) s.f -= dt; s.nz = Math.max(0, s.nz - dt * 4);
      if (s.nz >= 100) { s.nz = 0; s.k++; a.time(-10); a.sfx('warn'); a.bad('Валя: «Кто там мурчит?!»', 'приходится замереть · −10 с'); }
      a.hud(s.f > 0 ? '🐟 Гоша занят рыбкой ' + Math.ceil(s.f) + ' с' : '🐱 мурчание ' + Math.round(s.nz) + '%'); },
    result(a) { return ['Валя слышала кота', a.s.k + ' раз']; } };

  // №33 Долг за солнце (слалом): вне тени копится загар, ворота и зонтики — тень.
  X[33] = { hint: 'Солнце ☀️ печёт: вне тени копится загар. Ворота и зонтики ☂️ — тень. 100 % — удар',
    init(a) { a.s.sun = 0; a.s.sh = 3; a.s.n = 0; a.s.hit = 0;
      a.every(6, (a) => ah(a, '☂️', 90, a.rnd(-4, 4), { size: 2, hit(o, a) { a.s.sh = 4; a.sfx('soft'); a.float('Тень! 4 с', '#9fd8ff'); } })); },
    frame(a, dt) { const s = a.s, D = a.dx; if (D && D.n > s.n) { s.n = D.n; s.sh = Math.max(s.sh, 2); }
      if (s.sh > 0) { s.sh -= dt; s.sun = Math.max(0, s.sun - dt * 15); } else s.sun += dt * (4 + a.d * 1.5);
      if (s.sun >= 100) { s.sun = 40; s.hit++; a.spin(0.8); a.flash('#ffd040', 0.5); a.bad('Солнечный удар!', 'МарсЖЭК: «Пени за солнце!»'); }
      a.hud((s.sh > 0 ? '⛱ в тени · ' : '☀️ ') + 'загар ' + Math.round(s.sun) + '%'); },
    result(a) { return ['Счёт за солнце', a.s.hit ? a.s.hit * 100 + ' ₽ пени' : 'всё в тени — 0 ₽']; } };

  // №34 Перепись жуков (накорми): жуки-«жители» требуют варенья.
  X[34] = { hint: 'Жуки 🪲 тоже жители: неси им варенье 🍯 из угла. Не дождутся — съедят чужой обед',
    init(a) { a.s.f = 0; a.s.e = 0; a.s.h = null;
      a.obj('🍯', { x: -9, z: -9, size: 1.4, r: 1.4, multi: true, hit(o, a) { if (!a.s.h) { a.s.h = a.obj('🍯', { size: 0.8, move: (q, dt, a) => follow(q, a) }); a.sfx('jar'); } } });
      a.every(14, (a) => { const p = a.pick([[-6, -4], [6, -6.5], [7.5, 3.5], [-1, 1]]); const o = a.obj('🪲', { x: p[0] + 1.2, z: p[1] + 1, size: 1.1, r: 1.5, multi: true, w: 14,
        move(o, dt, a) { o.w -= dt; if (o.w <= 0) { o.kill(); a.s.e++; if (a.wk) a.wk.n = Math.max(0, a.wk.n - 1); a.sfx('j_fail'); a.bad('Жуки съели чужой обед!', 'Профсоюз жуков доволен · −1'); } },
        hit(o, a) { if (!a.s.h) return; a.s.h.kill(); a.s.h = null; o.kill(); a.s.f++; a.time(4); a.sfx('harvest'); a.float('Жук сыт! +4 с', '#9aff8a'); } }); }); },
    frame(a) { const b = a.objs().filter((o) => o.e === '🪲'); a.hud('🪲 ждут ' + b.length + (b.length ? ' (' + Math.ceil(Math.min(...b.map((o) => o.w))) + ' с)' : '') + ' · накормлено ' + a.s.f + (a.s.h ? ' · 🍯 в руках' : '')); },
    result(a) { return ['Жуков накормлено / обидели', a.s.f + ' / ' + a.s.e]; } };

  // №35 Обгон метеорита справа (экзамен): строгий экзаменатор.
  X[35] = { hint: 'Строгий экзамен: 3 ошибки — пересдача, 4 верных подряд — права досрочно!',
    init(a) { a.s.qi = -9; a.s.w = 0; a.s.row = 0; },
    frame(a) { const M = a.mg, s = a.s; if (!M || !M.q) return;
      if (M.qi !== s.qi) { s.qi = M.qi; s.j = false; s.ok = M.ok; M.qt += s.w * 1.5; }
      if (M.lock && !s.j) { s.j = true; if (M.ok > s.ok) { s.row++; if (s.row >= 4) a.win('Права выданы досрочно! Обгон справа разрешён'); }
        else { s.w++; s.row = 0; a.say('<b>Экзаменатор:</b> Так-так, бабушка. Минус балл, и я тороплюсь.'); if (s.w >= 3) a.fail('Пересдача через марсианский год'); } }
      a.hud('🪪 подряд ' + s.row + '/4 · ошибок ' + s.w + '/3'); },
    result(a) { return ['Ошибок на экзамене', a.s.w]; } };

  // №36 Секретный рецепт (рецепт): Валя подсматривает — не бери продукты, пока она смотрит.
  X[36] = { hint: 'Валя 👀 подглядывает каждые 11 с по 3 с — не бери продукты! 3 утечки — рецепт раскрыт',
    init(a) { a.s.lk = 0; a.s.on = 0; a.s.v = a.obj('🙈', { x: 0, z: 6, y: 2.4, size: 1.8 });
      a.every(11, (a) => { a.s.on = 3; a.s.ri = a.wk.ri; a.s.n = a.wk.n; a.s.v.set('👀'); a.sfx('warn'); a.say('<b>Валя:</b> Таня, ну хоть одним глазком!'); a.after(3, (a) => { a.s.on = 0; a.s.v.set('🙈'); }); }); },
    frame(a) { const s = a.s, W = a.wk; if (!W) return;
      if (s.on > 0 && (W.ri > s.ri || W.n > s.n)) { s.lk++; s.ri = W.ri; s.n = W.n; a.sfx('caught'); a.bad('Валя подсмотрела!', 'утечка ' + s.lk + '/3'); if (s.lk >= 3) a.fail('Рецепт рассекречен! Валя печёт такие же'); }
      a.hud((s.on > 0 ? '👀 ВАЛЯ СМОТРИТ — замри! · ' : '🙈 Валя отвернулась · ') + 'утечек ' + s.lk + '/3'); },
    result(a) { return ['Утечек рецепта', a.s.lk + ' из 3']; } };

  // №37 Дрон на ушанке (слалом): дрон тянет вбок, промах — свисток и тормоз.
  X[37] = { hint: 'Каждые 10 с дрон тянет ушанку вбок на 3 с. Пропустишь ворота — свисток и тормоз',
    init(a) { a.s.p = 0; a.s.dir = 1; a.s.m = 0; a.s.k = 0;
      a.every(10, (a) => { a.s.p = 3; a.s.dir = Math.random() < 0.5 ? -1 : 1; a.s.k++; a.sfx('warn'); a.msg('Дрон тянет ' + (a.s.dir > 0 ? '→' : '←'), 'Дед: «За ушанку не дёргай!»'); }); },
    frame(a, dt) { const s = a.s, D = a.dx; if (s.p > 0) { s.p -= dt; side(a, s.dir * (6 + a.d * 2)); }
      if (D && D.miss > s.m) { s.m = D.miss; a.speed(0.6); a.sfx('caught'); a.bad('Фьють!', 'Дрон: «Гражданка, вешку пропустили!»'); a.after(2, (a) => a.speed(1)); }
      a.hud(s.p > 0 ? '🚁 ТЯНЕТ ' + (s.dir > 0 ? '→' : '←') : '🚁 дрон держится за ушанку · свистков ' + s.m); },
    result(a) { return ['Рывков дрона', a.s.k]; } };

  // №38 Лежачий полицейский (трамплины): два чистых — «зелёный», лежачие роботы на дороге.
  X[38] = { hint: 'Каждые 2 чистых приземления — «зелёный»: турбо 3 с. Лежачих роботов 🤖 объезжай',
    init(a) { a.s.c = 0; a.s.g = 0; a.s.r = 0;
      a.every(6, (a) => ah(a, '🤖', 110, a.rnd(-4, 4), { size: 1.6, hit(o, a) { a.s.r++; a.spin(0.6); a.sfx('thud'); a.bad('Ой, регулировщик!', '«Я тут полежу ещё»'); } })); },
    frame(a) { const s = a.s, c = (a.dx && a.dx.clean) || 0; if (c > s.c) { s.c = c; if (c % 2 === 0) { s.g++; a.boost(3); a.sfx('turbo'); a.msg('Зелёный!', 'Регулировщик машет: проезжай!'); } }
      a.hud('🚦 до зелёного ' + (2 - s.c % 2) + ' · зелёных ' + s.g + ' · 🤖 ' + s.r); },
    result(a) { return ['Зелёных от регулировщика', a.s.g]; } };

  // №39 Пробка из козы (погоня): морковка подманивает Зорьку, сирена пугает.
  X[39] = { hint: 'Морковка 🥕 подманивает Зорьку на 40 м. Сирена дрона каждые 14 с — отпрыгнет на 30 м',
    init(a) { a.s.c = 0; a.s.s = 0;
      a.every(6, (a) => ah(a, '🥕', 80, a.rnd(-4, 4), { hit(o, a) { const D = a.dx; if (D && D.n < D.need) { D.ti = Math.max(a.idx + 8, D.ti - 20); a.s.c++; a.sfx('found'); a.float('Зорька, морковка!', '#ffcf6a'); } } }));
      a.every(14, (a) => { const D = a.dx; if (D && D.n < D.need) { D.ti = Math.min(a.len - 14, D.ti + 15); a.s.s++; a.sfx('warn'); a.bad('Сирена!', 'Зорька испугалась и рванула'); } }); },
    frame(a) { a.hud('🥕 подманила ' + a.s.c + ' · 🚨 сирен ' + a.s.s); },
    result(a) { return ['Морковок для Зорьки', a.s.c]; } };

  // №40 Урок парковки задом (гонка): парковки заставляют Валю спорить и стоять.
  X[40] = { hint: 'Проедь по парковке 🅿️ — Валя спорит, где у кресла зад, и стоит 2,5 с',
    init(a) { a.s.f = 0; a.s.n = 0;
      a.every(7, (a) => ah(a, '🅿️', 90, a.rnd(-4, 4), { size: 1.8, r: 2, hit(o, a) { const D = a.dx; if (!D) return; a.s.f = 2.5; a.s.ri = D.ri; a.s.n++; a.sfx('coin'); a.say('<b>Валя:</b> Таня, где у него зад? Оно же круглое!'); } })); },
    frame(a, dt) { const s = a.s, D = a.dx; if (s.f > 0 && D) { s.f -= dt; D.ri = s.ri; }
      a.hud(s.f > 0 ? '🅿️ Валя спорит! ' + s.f.toFixed(1) + ' с' : '🅿️ споров ' + s.n); },
    result(a) { return ['Валя спорила', a.s.n + ' раз']; } };

  // №41 Счёт за луну (варенье): шлагбаумы берут плату монеткой — или банкой.
  X[41] = { hint: 'Шлагбаум 🚧 каждые 12 с берёт плату: монетка 🪙, а нет монетки — банка варенья!',
    init(a) { a.s.c = 1; a.s.pd = 0; a.s.j = 0;
      a.every(3.5, (a) => ah(a, '🪙', 80, a.rnd(-4, 4), { size: 1.2, hit(o, a) { a.s.c++; a.sfx('coin'); a.float('+🪙', '#ffe08a'); } }));
      a.every(12, (a) => ah(a, '🚧', 120, 0, { size: 2.6, r: 7, hit(o, a) { if (a.s.c > 0) { a.s.c--; a.s.pd++; a.sfx('coins'); a.float('Оплачено 🪙', '#9aff8a'); } else { a.cargo(-1); a.s.j++; a.sfx('glass'); a.bad('Нет монетки!', 'Шлагбаум взял банку за луну'); } } })); },
    frame(a) { a.hud('🪙 монет ' + a.s.c + ' · отдано банок ' + a.s.j); },
    result(a) { return ['Шлагбаумам: монет / банок', a.s.pd + ' / ' + a.s.j]; } };

  // №42 Рыжая полоса (конусы): рамы-шедевры дают турбо, конус на турбо — ×2 искусства.
  X[42] = { hint: 'Рама 🖼️ — турбо. Конус, снесённый на турбо, — двойное искусство 🎨',
    init(a) { a.s.c = 0; a.s.art = 0; a.every(7, (a) => ah(a, '🖼️', 90, a.rnd(-3.5, 3.5), { size: 1.8, hit(o, a) { a.boost(2.5); a.sfx('turbo'); a.float('Вдохновение!', '#ffcf6a'); } })); },
    frame(a) { const s = a.s, c = (a.dx && a.dx.cones) || 0; if (c > s.c) { const k = a.car.boost > 0 ? 2 : 1; s.art += (c - s.c) * k; if (k > 1) a.float('×2 шедевр!', '#ff9ad5'); s.c = c; }
      a.hud('🎨 искусство ' + s.art + (a.car.boost > 0 ? ' · ×2 ТУРБО!' : '')); },
    result(a) { return ['Баллов искусства', a.s.art]; } };

  // №43 Навигатор Гена (ночь): Гена поёт — руль наоборот, ноты его утихомиривают.
  X[43] = { hint: 'Гена поёт каждые 12 с — руль 3 с наоборот! Собери 5 нот 🎵 — навигатор замолчит',
    init(a) { a.s.n = 0; a.s.sg = 0; a.s.k = 0;
      a.every(12, (a) => { if (a.s.n >= 5) return; a.s.sg = 3; a.s.k++; a.steer(-1); a.sfx('warn'); a.say('<b>Гена:</b> А вот прекрасная песня! Ля-ля-ля!'); a.after(3, (a) => a.steer(1)); });
      a.every(5, (a) => { if (a.s.n < 5) ah(a, '🎵', 80, a.rnd(-3.5, 3.5), { size: 1.4, hit(o, a) { a.s.n++; a.sfx('pick'); a.float('Нота ' + a.s.n + '/5', '#bcd8ff'); if (a.s.n === 5) a.msg('Гена замолчал!', '«Вы прибыли. Ой, это космодром»'); } }); }); },
    frame(a, dt) { if (a.s.sg > 0) a.s.sg -= dt; a.hud(a.s.sg > 0 ? '🎤 ГЕНА ПОЁТ — руль наоборот!' : a.s.n >= 5 ? '🔇 Гена молчит ✓' : '🎵 нот ' + a.s.n + '/5'); },
    result(a) { return ['Песен Гены', a.s.k]; } };

  // №44 Остановка «Дедова грядка» (рой): автобус раз в 18 с — запрыгни, и рой отстанет.
  X[44] = { hint: 'Автобус 🚌 проезжает каждые 18 с вдоль забора. Коснись его — рой отстанет, 4 с без укусов',
    init(a) { a.s.r = 0;
      a.obj('🚏', { x: 0, z: 5.6, size: 1.4 });
      const bus = (a) => { const L = Math.random() < 0.5; a.obj('🚌', { x: L ? -12 : 12, z: 4.6, size: 2.4, r: 2.2, v: L ? 3.5 : -3.5, move(o, dt) { o.x += o.v * dt; if (Math.abs(o.x) > 13) o.kill(); },
        hit(o, a) { const W = a.wk; if (!W || !W.sw) return; W.inv = 4; const p = a.player(); W.sw.x = p.x > 0 ? -9 : 9; W.sw.z = -9; a.s.r++; a.sfx('j_found'); a.msg('Уехала на автобусе!', 'рой остался на остановке'); } }); a.say('<b>Марс-ФМ:</b> Автобус №1 подходит к остановке «Дедова грядка»!'); };
      a.every(18, bus); a.after(8, bus); },
    frame(a) { const b = a.objs().find((o) => o.e === '🚌'); a.hud(b ? '🚌 АВТОБУС! беги к нему' : '🚏 автобус скоро · прокатилась ' + a.s.r); },
    result(a) { return ['Прокатилась на автобусе', a.s.r + ' раз']; } };

  // №45 Всё по-хозяйски (техосмотр): ценное не выбрасывать — отнести к креслу.
  X[45] = { hint: 'Турбина, снасти и кот — не мусор! Отнеси 🚀 🎣 🐱 к креслу 🪑 — инспектор зачтёт (+8 с)',
    init(a) { a.s.n = 0; a.s.h = null; const L = ['🚀', '🎣', '🐱'];
      a.obj('🪑', { x: 8.5, z: 4.2, size: 1.8, r: 1.8, multi: true, hit(o, a) { if (!a.s.h) return; a.s.h.kill(); a.s.h = null; a.s.n++; a.time(8); a.sfx('coins'); a.float('В кресло! ' + a.s.n + '/3 · +8 с', '#9aff8a'); if (a.s.n === 3) a.msg('Хозяйственно!', 'Инспектор: «Турбина ваша, честная»'); } });
      L.forEach((e, i) => a.after(3 + i * 10, (a) => { const p = a.spot(); a.obj(e, { x: p[0], z: p[1], size: 1.2, r: 1.2, multi: true, hit(o, a) { if (a.s.h) return; o.kill(); a.s.h = a.obj(e, { size: 0.9, move: (q, dt, a) => follow(q, a, 3) }); a.sfx('pick'); } }); })); },
    frame(a) { a.hud('🪑 ценного в кресле ' + a.s.n + '/3' + (a.s.h ? ' · неси к креслу!' : '')); },
    result(a) { return ['Ценного сохранено', a.s.n + ' из 3']; } };

  // №46 Дрон влюбился (заряд): дрон летит рядом и шлёт записки; пропустишь три — обидится.
  X[46] = { hint: 'Влюблённый дрон 🚁 шлёт записки 💌: каждая +12 ⚡. Пропустишь 3 — обидится и тормозит',
    init(a) { a.s.n = 0; a.s.m = 0; a.s.sulk = 0;
      a.obj('🚁', { size: 1.6, ph: 0, move(o, dt, a) { o.ph += dt; const p = a.ahead(12, Math.sin(o.ph) * 3); o.x = p[0]; o.z = p[1]; o.y = 3.2 + Math.sin(o.ph * 3) * 0.4; } });
      a.every(6, (a) => { const i = a.idx + 40, p = a.track(i, a.rnd(-3.5, 3.5)); a.obj('💌', { x: p[0], z: p[1], size: 1.4, i, lt: 1, hit(o, a) { if (a.dx) a.dx.f = Math.min(100, a.dx.f + 12); a.s.n++; a.sfx('coin'); a.float('💌 +12 ⚡', '#ff9ad5'); } }); }); },
    frame(a) { const s = a.s;
      for (const o of a.objs()) if (o.lt && o.i < a.idx - 4) { o.kill(); s.m++; if (s.m >= 3) { s.m = 0; s.sulk++; a.speed(0.6); a.bad('Дрон обиделся!', 'сел на кресло и дуется · 4 с'); a.after(4, (a) => a.speed(1)); } }
      a.hud('💌 записок ' + s.n + ' · пропущено ' + s.m + '/3'); },
    result(a) { return ['Записок от дрона', a.s.n]; } };

  // №47 Полоса для пенсионеров (гонка): своя полоса быстрее, но там черепахи-контроль.
  X[47] = { hint: 'Правая полоса — для пенсионеров 👵: там быстрее! Но председатель ставит черепах 🐢',
    init(a) { a.s.on = 0; a.s.t = 0;
      a.every(1.5, (a) => ah(a, '👵', 100, 5.2, { size: 0.9, r: 0 }));
      a.every(8, (a) => ah(a, '🐢', 110, 3, { size: 1.5, hit(o, a) { a.s.t++; a.spin(0.5); a.sfx('thud'); a.bad('Медленно и по порядку!', 'председатель доволен'); } })); },
    frame(a) { const on = a.lat > 1; if (on !== a.s.on) { a.s.on = on; a.speed(on ? 1.15 : 1); } a.hud(on ? '👵 полоса пенсионеров: +15 %' : '🛣 общая полоса · 🐢 ' + a.s.t); },
    result(a) { return ['Черепах-контролёров', a.s.t]; } };

  // №48 Кто кого буксирует (прицеп): молнии подзаряжают батарейки, масло заносит.
  X[48] = { hint: 'Молния ⚡ подзаряжает батарейку в кузове (+1 груз). Лужи масла 🛢️ заносят — прицеп качнёт',
    init(a) { a.s.z = 0; a.s.o = 0;
      a.every(9, (a) => ah(a, '⚡', 90, a.rnd(-4, 4), { size: 1.5, hit(o, a) { const D = a.dx; if (D && D.c < 6) { D.c++; a.s.z++; a.sfx('combo'); a.float('Батарейка ожила! +1', '#9aff8a'); } else a.float('Всё заряжено', '#ffe08a'); } }));
      a.every(6, (a) => ah(a, '🛢️', 110, a.rnd(-4, 4), { size: 1.5, hit(o, a) { a.s.o++; a.spin(0.5); a.sfx('soft'); a.bad('Масло!', 'Серёга: «Тёть Тань, у меня кузов!»'); } })); },
    frame(a) { a.hud('⚡ подзарядила ' + a.s.z + ' · 🛢️ ' + a.s.o); },
    result(a) { return ['Батареек оживила', a.s.z]; } };

  // №49 Неделя синергии (офис): коллеги лезут обниматься.
  X[49] = { hint: 'Неделя синергии: коллеги 🤗 лезут обниматься — 2 с стоишь в объятиях. Обходи!',
    init(a) { a.s.h = 0;
      for (let i = 0; i < 2; i++) a.after(4 + i * 6, (a) => { const p = a.pick(OFP); a.obj('🤗', { x: p[0], z: p[1], size: 1.4, r: 1.2, multi: true, move: (o, dt, a) => wander(o, a, 1.3 + a.d * 0.2, dt, OFP),
        hit(o, a) { a.s.h++; a.speed(0.05); a.sfx('soft'); a.bad('Обнимашки!', 'Кузьмич: «Это взаимная вовлечённость!»'); a.after(2, (a) => a.speed(1)); o.x = a.pick(OFP)[0]; o.z = -4.6; o.tg = null; } }); }); },
    frame(a) { a.hud('🤗 объятий ' + a.s.h); },
    result(a) { return ['Объятий синергии', a.s.h]; } };

  // №50 Три метра до планёрки (Димон): видеосвязь падает — лови сигнал, Кузьмич требует камеру.
  X[50] = { hint: 'Димон на видеосвязи: сигнал 📶 падает — лови вышки. Нет связи — Танк дёргается',
    init(a) { a.s.sig = 100; a.s.lost = 0; a.s.j = 0;
      a.every(4, (a) => ah(a, '📶', 90, a.rnd(-4, 4), { size: 1.5, hit(o, a) { a.s.sig = Math.min(100, a.s.sig + 35); a.sfx('coin'); a.float('Связь есть! +35', '#9aff8a'); } }));
      a.every(15, (a) => { a.s.sig -= 20; a.say('<b>Эдуард Кузьмич:</b> Дмитрий, включите камеру! Мы вас не видим!'); }); },
    frame(a, dt) { const s = a.s; s.sig = Math.max(0, s.sig - dt * (4 + a.d));
      if (s.sig <= 0) { s.j -= dt; if (s.j <= 0) { s.j = 2.5; s.lost++; a.spin(0.4); a.sfx('warn'); a.bad('Связь пропала!', 'Димон: «Мам, я завис! Ой, это Танк»'); } }
      a.hud('📶 сигнал ' + Math.round(s.sig) + '%' + (s.sig <= 0 ? ' — НЕТ СВЯЗИ!' : '')); },
    result(a) { return ['Обрывов связи', a.s.lost]; } };
})();
