/* Особые правила историй 51–100 (у каждой истории свой сценарий) */
window.STX = window.STX || {};
(function () {
  const S = window.STX;
  // предмет на трассе впереди кресла; o.i — точка трассы; gone(o, a) — если проехала мимо
  const ah = (a, e, m, lat, o = {}) => { const [x, z] = a.ahead(m, lat), mv = o.move;
    return a.obj(e, Object.assign({ x, z, r: 2.2, size: 1.6 }, o, { i: Math.min(a.len - 1, a.idx + Math.round(m / 2)),
      move(ob, dt, a) { if (a.idx > ob.i + 15) { if (ob.gone) ob.gone(ob, a); ob.kill(); return; } if (mv) mv(ob, dt, a); } })); };
  const rl = (w = 7) => (Math.random() - 0.5) * w;
  // случайная точка на даче подальше от бабули
  const far = (a, r = 3) => { let s = a.spot(); for (let k = 0; k < 8; k++) { const p = a.player(); if (!p || Math.hypot(p.x - s[0], p.z - s[1]) > r) break; s = a.spot(); } return s; };

  // №51 «Отпуск под кофемашиной» (офис): чашки кофе бодрят и дают время
  S[51] = { hint: 'Чашки ☕ по офису: каждая бодрит — 5 с бежишь быстрее и +5 с до конца дня',
    init(a) { a.s.n = 0; a.hud('☕ выпито: 0 из 6'); },
    frame(a) { if (a.mode !== 'walk' || a.s.on) return; a.s.on = 1;
      [[-7.5, -1], [4, -0.8], [-3.5, 4.6], [4.2, 5], [8.2, -2.6], [-8.2, 5.6]].forEach(([x, z]) => a.obj('☕', { x, z, size: 1.1, r: 1.3, hit(o, a) {
        a.s.n++; a.speed(1.5); a.after(5, (a) => a.speed(1)); a.time(5); a.sfx('pot'); a.float('Бодрость! +5 с', '#ffd27a'); a.hud('☕ выпито: ' + a.s.n + ' из 6'); } })); },
    result(a) { return ['Кофе выпито', (a.s.n || 0) + ' из 6']; } };

  // №52 «Консультант из 1987-го»: никаких смартфонов, только кассеты
  S[52] = { hint: 'Только 1987 год! Не трогай смартфоны 📱 (−8 с), собирай кассеты 📼 (+6 с)',
    init(a) { a.s.k = 0; a.s.p = 0; a.hud('📼 0 · 📱 0');
      a.every(5, (a) => { if (a.mode !== 'walk' || a.objs().length > 6) return; const [x, z] = far(a, 4), ph = Math.random() < 0.5;
        a.obj(ph ? '📱' : '📼', { x, z, size: 1.0, r: 1.3, move(o, dt, a) { if (ph) o.x = Math.max(-10, Math.min(10, o.x + Math.sin(a.t + o.z) * dt * 1.5)); },
          hit(o, a) { if (ph) { a.s.p++; a.time(-8); a.sfx('caught'); a.bad('Дед: «В 1987-м такого не было!»', '−8 с'); } else { a.s.k++; a.time(6); a.sfx('coin'); a.float('📼 +6 с', '#9aff8a'); } a.hud('📼 ' + a.s.k + ' · 📱 ' + a.s.p); } }); }); },
    result(a) { return ['Кассет / смартфонов', (a.s.k || 0) + ' / ' + (a.s.p || 0)]; } };

  // №53 «999 доставок и бабка»: дроны-контролёры поперёк дороги
  S[53] = { hint: 'Дроны-контролёры 🛸 снуют поперёк дороги: задела — 3 с «проверка накладной»',
    init(a) { a.s.k = 0; a.every(5, (a) => { if (a.mode !== 'drive') return; ah(a, '🛸', 90 + Math.random() * 40, 0, { size: 1.8, r: 2.0, ph: Math.random() * 6,
        move(o, dt, a) { o.ph += dt * 1.6; const [x, z] = a.track(o.i, Math.sin(o.ph) * 5); o.x = x; o.z = z; o.y = 1.6; },
        hit(o, a) { a.s.k++; a.speed(0.45); a.after(3, (a) => a.speed(1)); a.sfx('warn'); a.bad('Проверка накладной!', 'дрон: «Бабка Таня — груз или водитель?»'); } }); }); },
    frame(a) { const n = (a.dx && a.dx.n) || 0; if (n && !a.s.pr) { a.s.pr = 1; a.addPot(5); a.msg('1000-я доставка!', 'Димону премия — грамота с печатью'); }
      a.hud('📦 доставок отдела: ' + (999 + n) + ' · 🛸 проверок ' + a.s.k); },
    result(a) { return ['Проверок дронами', a.s.k || 0]; } };

  // №54 «Пузырьковая синергия»: пузыри сносят вбок, мост прыгает — руль наоборот
  S[54] = { hint: 'Пузыри 🫧 сносят кресло вбок; каждые 20 с мост прыгает — руль 2 с наоборот',
    init(a) { a.s.b = 0; a.s.rev = 0;
      a.every(3, (a) => { if (a.mode === 'drive') ah(a, '🫧', 80 + Math.random() * 60, rl(7), { size: 1.5, hit(o, a) { a.s.b++; a.s.pt = 0.4; a.s.px = Math.random() < 0.5 ? -1 : 1; a.sfx('soft'); a.float('Бульк!', '#9fe8ff'); } }); });
      a.every(20, (a) => { if (a.mode !== 'drive') return; a.s.rev = 2; a.steer(-1); a.shake(0.4); a.bad('Мост подпрыгнул!', 'руль 2 с наоборот'); }); },
    frame(a, dt) { if (a.s.pt > 0) { a.s.pt -= dt; const h = a.car.h; a.push(-Math.cos(h) * a.s.px * 40, Math.sin(h) * a.s.px * 40); }
      if (a.s.rev > 0) { a.s.rev -= dt; if (a.s.rev <= 0) a.steer(1); } a.hud('🫧 пузырей: ' + a.s.b + (a.s.rev > 0 ? ' · 🔄 РУЛЬ НАОБОРОТ' : '')); },
    result(a) { return ['Пузырей поймала', a.s.b || 0]; } };

  // №55 «Вручить лично» (Димон): посылка сама выпрыгивает из Танка
  S[55] = { hint: 'Посылка 📦 то и дело выпрыгивает из Танка и ждёт впереди — наедь на неё!',
    init(a) { a.s.got = 0; a.s.lost = 0; a.s.on = 1;
      a.every(12, (a) => { if (a.mode !== 'drive' || !a.s.on || a.car.state !== 'go') return; a.s.on = 0; a.say('<b>Димон:</b> Мам, посылка опять уехала! Догоняю!');
        ah(a, '📦', 50, a.lat, { size: 1.8, r: 2.6, move(o, dt, a) { o.y = 1 + Math.abs(Math.sin(a.t * 6)) * 0.6; },
          hit(o, a) { a.s.got++; a.s.on = 1; a.sfx('found'); a.float('Посылка поймана!', '#9aff8a'); },
          gone(o, a) { a.s.lost++; a.s.on = 1; a.bad('Посылка вернулась на склад', '«вручить лично» — ещё раз'); } }); }); },
    frame(a) { a.hud('📦 поймал: ' + a.s.got + ' · уехала на склад: ' + a.s.lost); },
    result(a) { return ['Посылку поймал', (a.s.got || 0) + ' раз · на склад ' + (a.s.lost || 0)]; } };

  // №56 «Поднимайся над собой»: пирожки Димону и плакаты «ЛИФТ»
  S[56] = { hint: 'Собери Димону 6 🥟. Плакат «ЛИФТ» 🪧 — рывок вперёд, но −15% топлива',
    init(a) { a.s.p = 0; a.s.l = 0;
      a.every(4, (a) => { if (a.mode !== 'drive') return; const pie = Math.random() < 0.55;
        ah(a, pie ? '🥟' : '🪧', 90 + Math.random() * 50, rl(7), { size: pie ? 1.4 : 2, hit(o, a) {
          if (pie) { a.s.p++; a.sfx('coin'); a.float('🥟 ' + a.s.p + '/6', '#ffd27a'); if (a.s.p === 6) a.msg('Димон сыт!', 'теперь бы ещё доехать'); }
          else { a.s.l++; a.boost(1.5); if (a.dx && a.dx.f !== undefined) a.dx.f = Math.max(0, a.dx.f - 15); a.sfx('turbo'); a.float('Поднялась над собой! −15% ⛽', '#ffcf6a'); } } }); }); },
    frame(a) { a.hud('🥟 Димону ' + a.s.p + '/6 · 🪧 лифтов ' + a.s.l); },
    result(a) { return ['Пирожков Димону', (a.s.p || 0) + ' из 6']; } };

  // №57 «Лицо не узнано»: пыль на лице Димона
  S[57] = { hint: 'Пыль садится на лицо Димона: 100% — минус ❤. Каждый пройденный раунд протирает −40%',
    init(a) { a.s.dust = 0; a.s.lv = 0; },
    frame(a, dt) { if (a.mode !== 'mg') return; const M = a.mg;
      if (M.lv > a.s.lv) { if (a.s.lv) { a.s.dust = Math.max(0, a.s.dust - 40); a.sfx('soft'); } a.s.lv = M.lv; }
      if (!M.show) a.s.dust += dt * 3;
      if (a.s.dust >= 100) { a.s.dust = 0; M.life--; a.sfx('caught'); a.bad('Турникет: «Лицо не узнано»', 'пыль! минус ❤'); if (M.life <= 0) a.fail('Турникет так и не узнал Димона'); }
      a.hud('🌫 пыль на лице: ' + Math.round(a.s.dust) + '% · ❤ ' + Math.max(0, M.life)); },
    result(a) { return ['Пыли на лице в конце', Math.round(a.s.dust || 0) + '%']; } };

  // №58 «Золотой запас»: сахар отвлекает жуков-сладкоежек
  S[58] = { hint: 'Подбери сахар 🍬 — жуки-сладкоежки 5 с облизывают его и не гонятся',
    init(a) { a.s.n = 0; a.every(7, (a) => { if (a.mode !== 'walk' || a.objs().length > 2) return; const [x, z] = far(a);
      a.obj('🍬', { x, z, size: 1, r: 1.3, hit(o, a) { a.s.n++; a.wk.inv = 5; a.sfx('pick'); a.float('Жуки: «Сахарок!» — 5 с покоя', '#9aff8a'); } }); }); },
    frame(a) { if (a.mode !== 'walk') return; a.hud('🍬 сахара: ' + a.s.n + (a.wk.inv > 2.1 ? ' · жуки заняты ' + Math.ceil(a.wk.inv) + ' с' : '')); },
    result(a) { return ['Отвлекла жуков сахаром', (a.s.n || 0) + ' раз']; } };

  // №59 «Вентилятор решает»: сквозняк сносит, монетка ГенДира
  S[59] = { hint: 'Каждые 12 с вентилятор дует 3 с — бабулю сносит! Монетка ГенДира 🪙 — +10 с',
    init(a) { a.s.c = 0; a.s.w = 0;
      a.every(12, (a) => { if (a.mode !== 'walk') return; a.s.w = 3; a.s.dir = Math.random() < 0.5 ? -1 : 1; a.sfx('warn'); a.msg('Сквозняк!', a.s.dir > 0 ? 'дует вправо →' : '← дует влево'); });
      a.every(15, (a) => { if (a.mode !== 'walk' || a.objs().length) return; const [x, z] = far(a);
        a.obj('🪙', { x, z, size: 1, r: 1.3, move(o, dt, a) { o.y = 1 + Math.sin(a.t * 4) * 0.3; }, hit(o, a) { a.s.c++; a.time(10); a.sfx('coins'); a.float('Монетка ГенДира! +10 с', '#ffd27a'); } }); }); },
    frame(a, dt) { if (a.mode !== 'walk') return; if (a.s.w > 0) { a.s.w -= dt; a.push(a.s.dir * 2.6, 0); } a.hud('🪙 монеток: ' + a.s.c + (a.s.w > 0 ? ' · 💨 СКВОЗНЯК' : '')); },
    result(a) { return ['Монеток ГенДира', a.s.c || 0]; } };

  // №60 «Отчёт размером с ковёр»: принтер разгоняет ленту и зажёвывает
  S[60] = { hint: 'Принтер Лёхи: каждые 11 с гонит листы вдвое быстрее, а потом зажёвывает',
    init(a) { a.s.ph = 'ok'; a.s.j = 0;
      a.every(11, (a) => { a.s.ph = 'fast'; a.speed(2); a.sfx('turbo'); a.after(3, (a) => { a.s.ph = 'jam'; a.s.j++; a.speed(0.35); a.sfx('crash'); a.after(2.5, (a) => { a.s.ph = 'ok'; a.speed(1); }); }); }); },
    frame(a) { a.hud({ ok: '🖨 принтер печатает', fast: '🖨💨 ЛИСТЫ ЛЕТЯТ!', jam: '🖨 зажевал… хватай не спеша' }[a.s.ph] + ' · зажёвов ' + a.s.j); },
    result(a) { return ['Принтер зажевал', (a.s.j || 0) + ' раз']; } };

  // №61 «Склад на крыльце»: срочные посылки на 8 секунд
  S[61] = { hint: 'Каждые 14 с — СРОЧНАЯ посылка 🎁: схвати за 8 с (+8 с), не успела — уедет к Вале (−1)',
    init(a) { a.s.ok = 0; a.s.lost = 0;
      a.every(14, (a) => { if (a.mode !== 'walk') return; const [x, z] = far(a, 4), t0 = a.t; a.say('<b>Приложение «ТрансМарса»:</b> срочная доставка! 8 секунд!'); a.sfx('warn');
        a.obj('🎁', { x, z, size: 1.3, r: 1.4, t0, move(o, dt, a) { o.y = 1.2 + Math.sin(a.t * 8) * 0.2; if (a.t - t0 > 8) { o.kill(); a.s.lost++; a.wk.n = Math.max(0, a.wk.n - 1); a.bad('Срочная уехала к Вале', '−1 из контейнера'); } },
          hit(o, a) { a.s.ok++; a.time(8); a.sfx('coins'); a.float('Срочная! +8 с', '#9aff8a'); } }); }); },
    frame(a) { const u = a.objs()[0]; a.hud('🎁 срочных ' + a.s.ok + ' · упущено ' + a.s.lost + (u ? ' · ⏱ ' + Math.max(0, Math.ceil(8 - (a.t - u.t0))) + ' с' : '')); },
    result(a) { return ['Срочных посылок', (a.s.ok || 0) + ', упущено ' + (a.s.lost || 0)]; } };

  // №62 «Новый год дважды»: куранты — замри
  S[62] = { hint: 'Каждые 18 с бьют куранты 🔔: замри на 3 с! Двигалась — −6 с, выстояла — +4 с',
    init(a) { a.s.ok = 0; a.s.bad = 0; a.s.fz = 0; a.every(18, (a) => { if (a.mode !== 'walk') return; a.s.fz = 3; a.s.mv = 0; a.sfx('tick'); a.msg('🔔 Бьют куранты!', 'замри с бокалом на 3 секунды'); }); },
    frame(a, dt) { if (a.mode !== 'walk') return;
      if (a.s.fz > 0) { a.s.fz -= dt; if (Math.hypot(a.wk.vx || 0, a.wk.vz || 0) > 1) a.s.mv = 1;
        if (a.s.fz <= 0) { if (a.s.mv) { a.s.bad++; a.time(-6); a.bad('Шампанское пролилось!', '−6 с'); } else { a.s.ok++; a.time(4); a.sfx('j_win'); a.msg('С Новым годом! Опять!', '+4 с'); } } }
      a.hud(a.s.fz > 0 ? '🔔 ЗАМРИ! ' + a.s.fz.toFixed(1) + ' с' : '🥂 Новых годов встречено: ' + a.s.ok); },
    result(a) { return ['Новых годов встречено', a.s.ok || 0]; } };

  // №63 «Ёлка из банок»: банки для ёлки и мигающая гирлянда
  S[63] = { hint: 'Собери 6 банок 🫙 для ёлки. Каждые 12 с гирлянда Лёхи на 2 с освещает трассу',
    init(a) { a.s.j = 0;
      a.every(5, (a) => { if (a.mode === 'drive' && a.s.j + a.objs().length < 9) ah(a, '🫙', 100 + Math.random() * 40, rl(7), { size: 1.4, hit(o, a) { a.s.j++; a.sfx('jar'); a.float('🫙 ' + a.s.j + '/6', '#9fe8ff'); if (a.s.j === 6) a.msg('Ёлка собрана!', 'Лёха вешает провода'); } }); });
      a.every(12, (a) => { if (a.mode !== 'drive') return; a.night(false); a.flash('#ffe08a', 0.3); a.after(2, (a) => a.night(true)); }); },
    frame(a) { a.hud('🎄 банок для ёлки: ' + a.s.j + '/6'); },
    result(a) { return ['Банок на ёлку', (a.s.j || 0) + ' из 6']; } };

  // №64 «Ура с задержкой»: сигнал зависает и догоняет
  S[64] = { hint: 'Сигнал до Земли с задержкой: ноты то зависают, то догоняют вдвое быстрее',
    init(a) { a.s.ph = 0; a.s.cu = 0; a.s.k = 0; a.every(9, (a) => { if (a.mode !== 'mg') return; a.s.ph = 1.5; a.s.k++; a.sfx('tick'); }); },
    frame(a, dt) { if (a.mode !== 'mg') return;
      if (a.s.ph > 0) { a.s.ph -= dt; a.mg.t -= dt; if (a.s.ph <= 0) a.s.cu = 1.5; } else if (a.s.cu > 0) { a.s.cu -= dt; a.mg.t += dt; }
      a.hud(a.s.ph > 0 ? '📡 сигнал завис…' : a.s.cu > 0 ? '📡 догоняем! ×2' : '📡 связь с Землёй есть · зависаний ' + a.s.k); },
    result(a) { return ['Зависаний связи', a.s.k || 0]; } };

  // №65 «Свечки по рыбам»: робот-пожарный гоняется за бабулей
  S[65] = { hint: 'Робот-пожарный 🤖 летает за бабулей: догонит — зальёт пеной, 3 с еле ходишь',
    init(a) { a.s.f = 0; },
    frame(a) { if (a.mode !== 'walk') return; a.hud('🤖 залита пеной: ' + a.s.f + ' раз'); if (a.s.on) return; a.s.on = 1;
      a.obj('🤖', { x: 9, z: -9, y: 2.2, size: 1.6, r: 1.3, multi: true,
        move(o, dt, a) { const p = a.player(), dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1, v = a.t < 8 ? 0 : 1.6 + a.d * 0.3; o.x += dx / d * v * dt; o.z += dz / d * v * dt; o.y = 2 + Math.sin(a.t * 5) * 0.3; },
        hit(o, a) { a.s.f++; a.speed(0.4); a.after(3, (a) => a.speed(1)); a.sfx('water'); a.bad('Робот: «Объект "бабушка" потушен»', 'пена! 3 с медленно'); const p = a.player(); o.x = p.x > 0 ? -9 : 9; o.z = p.z > -3 ? -9 : 4; } }); },
    result(a) { return ['Залита пеной', (a.s.f || 0) + ' раз']; } };

  // №66 «Реквизит съеден»: Макс швыряет назад пирожки и кожуру
  S[66] = { hint: 'Макс швыряет назад пирожки 🥟 (лови — публике +1) и кожуру 🍌 (закрутит!)',
    init(a) { a.s.p = 0; a.s.b = 0;
      a.every(3, (a) => { if (a.mode !== 'drive' || !a.dx || a.dx.ti === undefined || a.dx.n >= 3) return; const i = Math.floor(a.dx.ti) - 4, pie = Math.random() < 0.6; if (i < a.idx + 10) return; const [x, z] = a.track(i, rl(7));
        a.obj(pie ? '🥟' : '🍌', { x, z, r: 2.2, size: 1.5, hit(o, a) { if (pie) { a.s.p++; a.sfx('coin'); a.float('Публике +1 🥟', '#ffd27a'); } else { a.s.b++; a.spin(0.9); a.sfx('slap'); a.bad('Кожура!', 'Макс: «Ой, это не я!»'); } } }); }); },
    frame(a) { a.hud('🥟 публике: ' + a.s.p + ' · 🍌 кожуры: ' + a.s.b); },
    result(a) { return ['Пирожков спасено для публики', a.s.p || 0]; } };

  // №67 «Звонок был ненадёжный»: звонок меняет время, 4 верных подряд — победа
  S[67] = { hint: 'Звонок ненадёжный: то +4 с на ответ, то −3 с. Четыре верных подряд — Лёху простят!',
    init(a) { a.s.st = 0; a.s.best = 0; a.s.qi = -1; a.s.ok = 0;
      a.every(7, (a) => { if (a.mode !== 'mg' || a.mg.lock) return; a.sfx('tick'); if (Math.random() < 0.5) { a.mg.qt = Math.max(0, a.mg.qt - 4); a.msg('🔔 Звонок опоздал', '+4 с на ответ'); } else { a.mg.qt += 3; a.bad('🔔 Звонок раньше времени!', '−3 с'); } }); },
    frame(a) { if (a.mode !== 'mg') return; const M = a.mg;
      if (M.lock && a.s.qi !== M.qi) { a.s.qi = M.qi; if (M.ok > a.s.ok) { a.s.st++; a.s.best = Math.max(a.s.best, a.s.st); if (a.s.st >= 4) a.win('Робот-завуч: «Лёха прощён. Бабушке — пятёрка»'); } else a.s.st = 0; a.s.ok = M.ok; }
      a.hud('✅ верных подряд: ' + a.s.st + ' / 4'); },
    result(a) { return ['Лучшая серия ответов', a.s.best || 0]; } };

  // №68 «Улыбочку!»: вспышка фотоаппарата каждые 10 с
  S[68] = { hint: 'Каждые 10 с вспышка 📸: будь рядом с Гошей («горячо») — кадр +6 с, иначе −3 с',
    init(a) { a.s.ok = 0; a.s.bad = 0;
      a.every(10, (a) => { if (a.mode !== 'walk' || !a.wk.spots) return; const h = a.wk.spots[a.wk.hid], p = a.player(); a.flash('#ffffff', 0.5); a.sfx('click');
        if (Math.hypot(p.x - h.x, p.z - h.z) < 4) { a.s.ok++; a.time(6); a.msg('Отличный кадр!', 'в углу — кончик Гошиного хвоста · +6 с'); } else { a.s.bad++; a.time(-3); a.bad('Смазанный кадр', 'на фото только дед моргает · −3 с'); } }); },
    frame(a) { a.hud('📸 кадров ' + a.s.ok + ' · смазано ' + a.s.bad + ' · вспышка через ' + Math.max(1, Math.ceil(10 - (a.t % 10))) + ' с'); },
    result(a) { return ['Удачных кадров', a.s.ok || 0]; } };

  // №69 «Переигровка»: невестка собирает наперегонки, золотая ягода
  S[69] = { hint: 'Невестка собирает наперегонки — обгони её счёт! Золотая ягода 🌟 — сразу +5',
    init(a) { a.s.r = 0; a.s.g = 0;
      a.every(2.6, (a) => { if (a.mode === 'drive' && a.car.state === 'go') a.s.r++; });
      a.every(14, (a) => { if (a.mode === 'drive') ah(a, '🌟', 110, a.lat * 0.5 + rl(4), { size: 1.6, move(o, dt, a) { o.y = 1.4 + Math.sin(a.t * 5) * 0.3; }, hit(o, a) { a.s.g++; a.addPot(5); a.sfx('j_found'); a.float('Золотая! +5', '#ffd27a'); } }); }); },
    frame(a) { const me = a.car.pot; a.hud('🫐 ты ' + me + ' : ' + a.s.r + ' невестка' + (me > a.s.r ? ' · ведёшь!' : '')); },
    result(a) { return ['Ты / невестка', a.car.pot + ' : ' + (a.s.r || 0) + (a.car.pot > (a.s.r || 0) ? ' — переигровка твоя!' : ' — Макс требует ещё')]; } };

  // №70 «Букет в валенке»: дедовы кактусы колются, цветы для букета
  S[70] = { hint: 'Дедовы кактусы 🌵 колются — 2 с хромаешь. Собери 3 цветка 🌸 к 8 Марта (+10 с)',
    init(a) { a.s.c = 0; a.s.f = 0; },
    frame(a) { if (a.mode !== 'walk') return; a.hud('🌸 цветов ' + a.s.f + '/3 · 🌵 уколов ' + a.s.c); if (a.s.on) return; a.s.on = 1;
      for (let k = 0; k < 7; k++) { const [x, z] = far(a, 4); a.obj('🌵', { x, z, size: 1.1, r: 1.0, multi: true, hit(o, a) { a.s.c++; a.speed(0.45); a.after(2, (a) => a.speed(1)); a.sfx('slap'); a.float('Ай! Кактус!', '#ff8a6a'); } }); }
      for (let k = 0; k < 3; k++) { const [x, z] = far(a, 4); a.obj('🌸', { x, z, size: 1.1, r: 1.3, hit(o, a) { a.s.f++; a.sfx('pick'); a.float('🌸 ' + a.s.f + '/3', '#ffb0e0'); if (a.s.f === 3) { a.time(10); a.msg('Букет готов!', 'в валенке, как дед хотел · +10 с'); } } }); } },
    result(a) { return ['Цветов в букет', (a.s.f || 0) + ' из 3']; } };

  // №71 «Ракета в телескопе»: ракета шипит и отвлекает Валю, но тянет вбок
  S[71] = { hint: 'Ракета шипит каждые 12 с — Валя 3 с ищет комету в небе. А в руках ракета тянет вбок!',
    init(a) { a.s.h = 0; a.every(12, (a) => { if (a.mode !== 'walk') return; a.s.h++; a.wk.vs = 'scope'; a.wk.vt = 3; a.sfx('turbo'); a.msg('Пшшш! 🚀', 'Валя: «Комета!» — смотрит в небо 3 с'); }); },
    frame(a, dt) { if (a.mode !== 'walk') return; if (a.wk.carry) { a.s.ph = (a.s.ph || 0) + dt; a.push(Math.sin(a.s.ph * 1.3) * 2.2, 0); }
      a.hud('🚀 ' + (a.wk.carry ? 'ракета тянет — держи курс!' : 'ракета шипела: ' + a.s.h + ' раз')); },
    result(a) { return ['Ракета шипела', (a.s.h || 0) + ' раз']; } };

  // №72 «Блины по ветру»: стопка блинов к самовару
  S[72] = { hint: 'Блины копятся стопкой: неси к самовару 🫖 (+2 с за блин). 8 в стопке — рухнет!',
    init(a) { a.s.st = 0; a.s.del = 0; },
    frame(a) { if (a.mode !== 'walk') return; const W = a.wk;
      if (!a.s.on) { a.s.on = 1; a.s.n0 = W.n || 0; a.obj('🫖', { x: -8.5, z: 4.5, size: 1.6, r: 1.8, multi: true, hit(o, a) { if (!a.s.st) return; a.time(a.s.st * 2); a.s.del += a.s.st; a.sfx('coins'); a.float('К чаю! +' + a.s.st * 2 + ' с', '#9aff8a'); a.s.st = 0; } }); }
      if (W.n > a.s.n0) a.s.st += W.n - a.s.n0; a.s.n0 = W.n;
      if (a.s.st >= 8) { a.s.st = 0; W.n = Math.max(0, W.n - 3); a.s.n0 = W.n; a.sfx('crash'); a.bad('Стопка рухнула!', 'Гоша доволен · −3 блина'); }
      a.hud('🥞 в стопке ' + a.s.st + '/8 · к самовару донесено ' + a.s.del); },
    result(a) { return ['Блинов к чаю', a.s.del || 0]; } };

  // №73 «Небольшой багаж»: выпавший робот ждёт на дороге
  S[73] = { hint: 'Выпавший из прицепа робот 🤖 ждёт на дороге впереди — подбери, и он вернётся!',
    init(a) { a.s.c0 = 6; a.s.back = 0; a.s.run = 0; },
    frame(a) { if (a.mode !== 'drive' || !a.dx || a.dx.c === undefined) return;
      if (a.dx.c < a.s.c0) { a.s.run++; a.say('<b>Серёга:</b> Баб, робот сбежал! Вон он, впереди!');
        ah(a, '🤖', 50, rl(6), { size: 1.6, r: 2.4, move(o, dt, a) { o.y = 1.2 + Math.abs(Math.sin(a.t * 10)) * 0.4; },
          hit(o, a) { if (a.dx.c < 6) a.dx.c++; a.s.back++; a.sfx('found'); a.float('Робот вернулся в прицеп!', '#9aff8a'); }, gone(o, a) { a.bad('Робот убежал к Вале', 'Серёга машет ему вслед'); } }); }
      a.s.c0 = a.dx.c; a.hud('🤖 сбегало ' + a.s.run + ' · вернула ' + a.s.back); },
    result(a) { return ['Беглецов вернула', (a.s.back || 0) + ' из ' + (a.s.run || 0)]; } };

  // №74 «Шкаф на улице»: моль выдёргивает вещи, нафталин её прогоняет
  S[74] = { hint: 'Моль 🦋 гоняется за бабулей и выдёргивает вещь из рук. Нафталин 🧴 прогонит её на 10 с',
    init(a) { a.s.m = 0; a.s.k = 0; a.s.off = 0;
      a.every(12, (a) => { if (a.mode !== 'walk' || a.objs().length > 2) return; const [x, z] = far(a); a.obj('🧴', { x, z, size: 1, r: 1.3, hit(o, a) { a.s.k++; a.s.off = a.t + 10; a.sfx('pick'); a.float('Нафталин! Моль улетела на 10 с', '#9aff8a'); } }); }); },
    frame(a) { if (a.mode !== 'walk') return;
      if (!a.s.on) { a.s.on = 1; a.obj('🦋', { x: 9, z: -9, y: 1.8, size: 1.2, r: 1.1, multi: true,
        move(o, dt, a) { if (a.t < a.s.off || a.t < 6) { o.y = 4; return; } const p = a.player(), dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1, v = 1.4 + a.d * 0.25; o.y = 1.6 + Math.sin(a.t * 9) * 0.3; o.x += (dx / d * v + Math.sin(a.t * 3)) * dt; o.z += dz / d * v * dt; },
        hit(o, a) { if (a.t < a.s.off || a.t < 6) return; const W = a.wk, sp = W.carry && W.carry.pop(), p = a.player(); o.x = p.x > 0 ? -9 : 9; o.z = -9; if (!sp) return; const [x, z] = far(a, 4);
          sp.position.set(x, 0.5, z); W.tr.push({ x, z, s: sp }); a.s.m++; a.sfx('soft'); a.bad('Моль утащила вещь!', 'вещь улетела обратно во двор'); } }); }
      a.hud('🦋 ' + (a.t < a.s.off ? 'моль улетела ещё на ' + Math.ceil(a.s.off - a.t) + ' с' : 'моль рядом!') + ' · утащила ' + a.s.m); },
    result(a) { return ['Моль утащила вещей', a.s.m || 0]; } };

  // №75 «Букет-первоклассник»: цветы в букет, Валина турбина сдувает
  S[75] = { hint: 'Собери в букет 5 цветов 🌷. Рядом с Валей её турбина сдувает тебя вбок!',
    init(a) { a.s.f = 0; a.s.w = 0;
      a.every(6, (a) => { if (a.mode === 'drive' && a.s.f + a.objs().length < 8) ah(a, '🌷', 100 + Math.random() * 40, rl(7), { size: 1.4, hit(o, a) { a.s.f++; a.sfx('pick'); a.float('🌷 ' + a.s.f + '/5', '#ffb0e0'); if (a.s.f === 5) a.msg('Букет-гигант готов!', 'Лёха из-за него не видит дорогу'); } }); }); },
    frame(a) { const D = a.dx; a.s.w = 0;
      if (a.mode === 'drive' && D && D.ri !== undefined) { const [x, z] = a.track(D.ri, D.rl || 0), p = a.player(), dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz); if (d < 9 && d > 0.1) { a.push(dx / d * 14, dz / d * 14); a.s.w = 1; } }
      a.hud('💐 цветов ' + a.s.f + '/5' + (a.s.w ? ' · 💨 Валя сдувает!' : '')); },
    result(a) { return ['Цветов в букете', (a.s.f || 0) + ' из 5']; } };

  // №76 «Соль из патронташа» (оборона): Валя одалживает патроны, медведи роняют банки
  S[76] = { hint: 'Валя каждые 14 с одалживает патрон соли. Зато каждые 5 попаданий медведь роняет банку 🫙',
    init(a) { a.s.v = 0; a.s.j = 0; a.s.h = 0;
      a.every(14, (a) => { const D = a.df; if (a.mode !== 'def' || D.st !== 'go' || D.shells <= 0) return; D.shells--; a.s.v++; a.sfx('click'); a.say('<b>Соседка Валя:</b> Таня, отсыпь патрончик! Мне огурцы солить'); }); },
    frame(a) { if (a.mode !== 'def') return; const D = a.df;
      while ((D.hits || 0) >= a.s.h + 5) { a.s.h += 5; if (D.jars < 12) { D.jars++; a.s.j++; a.sfx('jar'); a.msg('Медведь уронил банку!', '🫙 +1 в погреб'); } }
      a.hud('🧂 Валя одолжила ' + a.s.v + ' · 🫙 отбито банок ' + a.s.j); },
    result(a) { return ['Патронов у Вали / банок отбито', (a.s.v || 0) + ' / ' + (a.s.j || 0)]; } };

  // №77 «Валя, не подглядывай»: ответ под Валиным взглядом уходит ей
  S[77] = { hint: 'Валя подглядывает 👀: ответишь, пока она смотрит, — очко за рецепт уйдёт ей',
    init(a) { a.s.me = 0; a.s.v = 0; a.s.pk = 0; a.s.qi = -1; a.s.ok = 0; a.every(5, (a) => { if (Math.random() < 0.6) { a.s.pk = 2.5; a.sfx('tick'); } }); },
    frame(a, dt) { if (a.mode !== 'mg') return; const M = a.mg; a.s.pk -= dt;
      if (M.lock && a.s.qi !== M.qi) { a.s.qi = M.qi; const ok = M.ok > a.s.ok; a.s.ok = M.ok; if (ok) { if (a.s.pk > 0) { a.s.v++; a.bad('Валя подсмотрела!', '«Это мой рецепт!» — очко Вале'); } else a.s.me++; } }
      a.hud((a.s.pk > 0 ? '👀 ВАЛЯ СМОТРИТ! · ' : '🙈 Валя отвернулась · ') + 'ты ' + a.s.me + ' : ' + a.s.v + ' Валя'); },
    result(a) { return ['Рецепты доказаны', 'ты ' + (a.s.me || 0) + ' : ' + (a.s.v || 0) + ' Валя']; } };

  // №78 «Кто раньше светит»: куры гаснут, во дворе темнеет
  S[78] = { hint: 'Куры гаснут: свет 💡 падает и во дворе темнеет. Каждый накормленный — +25% света',
    init(a) { a.s.l = 100; a.s.min = 100; },
    frame(a, dt) { if (a.mode !== 'walk') return; const W = a.wk; if (a.s.n0 === undefined) a.s.n0 = W.n || 0;
      if (W.n > a.s.n0) { a.s.l = Math.min(100, a.s.l + 25 * (W.n - a.s.n0)); a.float('Засветились! 💡', '#ffe08a'); } a.s.n0 = W.n;
      a.s.l = Math.max(0, a.s.l - dt * (1.2 + a.d * 0.25)); a.s.min = Math.min(a.s.min, a.s.l); a.fog(0.012 + (100 - a.s.l) / 100 * 0.05);
      if (a.s.l <= 0) a.fail('Куры погасли — рассвет у Вали'); a.hud('💡 свет кур: ' + Math.round(a.s.l) + '%'); },
    result(a) { return ['Самый тёмный момент', Math.round(a.s.min || 0) + '% света']; } };

  // №79 «Ползучий забор»: доски сами переползают дорогу
  S[79] = { hint: 'Ползучий забор: доски 🪵 сами переползают дорогу. Заденешь — закрутит!',
    init(a) { a.s.k = 0;
      a.every(4, (a) => { if (a.mode !== 'drive') return; const s0 = Math.random() < 0.5 ? -1 : 1;
        ah(a, '🪵', 70 + Math.random() * 50, s0 * 6, { size: 1.8, r: 1.9, l: s0 * 6, move(o, dt, a) { o.l -= s0 * dt * (1.6 + a.d * 0.3); if (Math.abs(o.l) > 7) o.l = s0 * 6; const [x, z] = a.track(o.i, o.l); o.x = x; o.z = z; o.y = 0.7; },
          hit(o, a) { a.s.k++; a.spin(0.7); a.sfx('thud'); a.bad('Доска!', 'забор переполз прямо под кресло'); } }); }); },
    frame(a) { a.hud('🪵 задела досок: ' + a.s.k); },
    result(a) { return ['Задела ползучих досок', a.s.k || 0]; } };

  // №80 «Натуральное притяжение» (рынок): догоняй Валю-сплетницу
  S[80] = { hint: 'Валя 🗣️ шепчет роботам про «искусственную» картошку. Догони её — +12 с и слух опровергнут',
    init(a) { a.s.n = 0; },
    frame(a) { if (a.mode !== 'walk') return; a.hud('📜 опровергла слухов: ' + a.s.n); if (a.s.on) return; a.s.on = 1;
      a.obj('🗣️', { x: 6, z: -4, y: 1.8, size: 1.5, r: 1.5, multi: true,
        move(o, dt, a) { const p = a.player(), dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) || 1, v = d < 5 ? 2.6 : 0.8; o.x = Math.max(-10.5, Math.min(10.5, o.x + (dx / d * v + Math.sin(a.t) * 0.8) * dt)); o.z = Math.max(-7.5, Math.min(6, o.z + (dz / d * v + Math.cos(a.t * 0.7) * 0.8) * dt)); },
        hit(o, a) { a.s.n++; a.time(12); a.sfx('found'); a.msg('Слух опровергнут!', 'Таня показала роботам землю на картошке · +12 с'); o.x = o.x > 0 ? -8 : 8; o.z = o.z > 0 ? -6 : 5; } }); },
    result(a) { return ['Слухов опровергнуто', a.s.n || 0]; } };

  // №81 «Новости 1987 года»: листы газеты летят поперёк трассы
  const NEWS = ['«Удой на Земле вырос вдвое!»', '«В моде — варёнки»', '«Наши хоккеисты снова чемпионы»', '«На углу открылся гастроном»', '«Магнитофон — в каждый дом!»'];
  S[81] = { hint: 'Листы газеты 📰 летят поперёк трассы — собери 5, деду будет что пересказать',
    init(a) { a.s.p = 0;
      a.every(5, (a) => { if (a.mode !== 'drive' || a.s.p >= 5) return; const s0 = Math.random() < 0.5 ? -1 : 1;
        ah(a, '📰', 90 + Math.random() * 40, s0 * 5, { size: 1.4, l: s0 * 5, move(o, dt, a) { o.l -= s0 * dt * 1.4; const [x, z] = a.track(o.i, o.l + Math.sin(a.t * 3) * 0.6); o.x = x; o.z = z; o.y = 1.4 + Math.sin(a.t * 4 + o.i) * 0.5; },
          hit(o, a) { a.s.p++; a.sfx('pick'); a.say('<b>Дед</b> читает: ' + NEWS[(a.s.p - 1) % 5]); a.float('📰 ' + a.s.p + '/5', '#ffe08a'); } }); }); },
    frame(a) { a.hud('📰 листов газеты: ' + a.s.p + '/5'); },
    result(a) { return ['Листов газеты 1987 года', (a.s.p || 0) + ' из 5']; } };

  // №82 «Настоящая грядка» (огород): зачёты роботов
  S[82] = { hint: 'Каждые 20 с роботы устраивают зачёт: 2 дела за 10 с — +10 с, нет — газон съест 5 с',
    init(a) { a.s.ok = 0; a.s.no = 0; a.s.w = 0;
      a.every(20, (a) => { const F = a.mode === 'farm' && window.BM && window.BM.ST.farm; if (!F) return; a.s.w = 10; a.s.p0 = F.pts + (a.farm.swats - F.s0); a.sfx('tick'); a.say('<b>Робот-сосед:</b> Зачёт по огороду. Десять секунд. Начали.'); }); },
    frame(a, dt) { const F = a.mode === 'farm' && window.BM && window.BM.ST.farm; if (!F) return; const pts = F.pts + (a.farm.swats - F.s0);
      if (a.s.w > 0) { a.s.w -= dt; if (pts - a.s.p0 >= 2) { a.s.w = 0; a.s.ok++; a.time(10); a.sfx('j_win'); a.msg('Роботы в шоке!', 'настоящая грядка · +10 с'); } else if (a.s.w <= 0) { a.s.no++; a.time(-5); a.bad('Пластиковый газон пополз', '−5 с'); } }
      a.hud(a.s.w > 0 ? '🤖 ЗАЧЁТ: ' + (pts - a.s.p0) + '/2 дела · ' + Math.ceil(a.s.w) + ' с' : '🤖 зачётов сдано ' + a.s.ok + ' · провалено ' + a.s.no); },
    result(a) { return ['Зачётов у роботов', (a.s.ok || 0) + ' сдано, ' + (a.s.no || 0) + ' провалено']; } };

  // №83 «Ключ внутри»: четыре ключа, один настоящий
  S[83] = { hint: 'На трассе 4 ключа 🔑 — только один от Валиного купола. Собери все, найди настоящий!',
    init(a) { a.s.k = 0; a.s.sp = 0; a.s.real = Math.floor(Math.random() * 4);
      a.every(10, (a) => { if (a.mode !== 'drive' || a.s.sp >= 4) return; const n = a.s.sp++;
        ah(a, '🔑', 110, rl(6), { size: 1.5, move(o, dt, a) { o.y = 1.4 + Math.sin(a.t * 4) * 0.3; },
          hit(o, a) { a.s.k++; if (n === a.s.real) { a.s.ok = 1; a.boost(2); a.sfx('j_found'); a.msg('Тот самый ключ!', 'Валя: «Таня, ты лучшая соседка!»'); } else { a.sfx('click'); a.float('Не тот ключ…', '#ffcf8a'); } } }); }); },
    frame(a) { a.hud('🔑 ключей ' + a.s.k + '/4' + (a.s.ok ? ' · настоящий найден ✓' : '')); },
    result(a) { return ['Ключ от купола', a.s.ok ? 'найден!' : 'остался на трассе']; } };

  // №84 «Кто громче»: дуэль громкости с Валей
  S[84] = { hint: 'Громкость против Вали! В ритм — 📻 громче, промах — тише. Дойди до 150 дБ — победа!',
    init(a) { a.s.me = 20; a.s.v = 20; a.s.h = 0; a.s.m = 0; },
    frame(a, dt) { if (a.mode !== 'mg') return; const M = a.mg;
      if (M.hit > a.s.h) { a.s.me += (M.hit - a.s.h) * 7; a.s.h = M.hit; } if (M.miss > a.s.m) { a.s.me = Math.max(0, a.s.me - (M.miss - a.s.m) * 4); a.s.m = M.miss; }
      if (M.t > 2) a.s.v += dt * (2.2 + a.d * 0.4); if (a.s.me >= 150 && a.s.me > a.s.v) a.win('Приёмник Тани перекричал Валин! Слышно на Фобосе');
      a.hud('📻 Таня ' + Math.round(a.s.me) + ' дБ : ' + Math.round(a.s.v) + ' дБ Валя'); },
    result(a) { return ['Громкость', 'Таня ' + Math.round(a.s.me || 0) + ' : ' + Math.round(a.s.v || 0) + ' Валя']; } };

  // №85 «Две Тани»: робот путается, чистые раунды возвращают ❤
  const twin = (a) => { if (a.mode !== 'mg' || !a.mg.need) return; a.mg.need++; a.s.add++; a.sfx('warn'); a.bad('Робот: «Обнаружено две Тани»', 'ещё один раунд'); };
  S[85] = { hint: '«Вторая Таня» путает робота: дважды добавит раунд. Два чистых раунда подряд — +❤',
    init(a) { a.s.lv = 0; a.s.cl = 0; a.s.add = 0; a.s.bon = 0; a.after(20, twin); a.after(40, twin); },
    frame(a) { if (a.mode !== 'mg') return; const M = a.mg; if (a.s.life === undefined) a.s.life = M.life;
      if (M.lv > a.s.lv) { if (a.s.lv) { a.s.cl = M.life >= a.s.life ? a.s.cl + 1 : 0; if (a.s.cl >= 2 && M.life < 3) { M.life++; a.s.cl = 0; a.s.bon++; a.sfx('j_found'); a.msg('Справка о личности!', '+❤ — ты точно настоящая Таня'); } } a.s.lv = M.lv; a.s.life = M.life; }
      a.hud('👵👵 лишних раундов: ' + a.s.add + ' · чистых подряд: ' + a.s.cl + '/2 · ❤ ' + M.life); },
    result(a) { return ['Справок о личности (+❤)', a.s.bon || 0]; } };

  // №86 «Картошка-сердечко»: Валя фотографирует сердечко
  S[86] = { hint: 'Валя снимает сердечко каждые 12 с 📸: если ни один жук не жуёт — открытка и +5 с',
    init(a) { a.s.ok = 0; a.s.no = 0;
      a.every(12, (a) => { if (a.mode !== 'walk' || !a.wk.bugs) return; a.flash('#ffffff', 0.4); a.sfx('click');
        if (a.wk.bugs.some((b) => !b.dead && b.eat > 0)) { a.s.no++; a.bad('На снимке жук!', 'сердечко с дыркой'); } else { a.s.ok++; a.time(5); a.msg('Открытка готова! 💌', 'картошка-сердечко без жуков · +5 с'); } }); },
    frame(a) { if (a.mode !== 'walk' || !a.wk.bugs) return; const e = a.wk.bugs.filter((b) => !b.dead && b.eat > 0).length;
      a.hud('💌 открыток ' + a.s.ok + ' · ' + (e ? '🐞 жуют: ' + e + '!' : 'ботва цела') + ' · снимок через ' + Math.max(1, Math.ceil(12 - (a.t % 12))) + ' с'); },
    result(a) { return ['Открыток с сердечком', a.s.ok || 0]; } };

  // №87 «Лунка насквозь» (рыбалка): обмен червями снизу
  S[87] = { hint: 'Каждые 15 с рыбаки снизу шлют червя 🪱: клюёт сразу, а рыба в обмене — вдвойне!',
    init(a) { a.s.tr = 0; a.s.x2 = 0; a.s.win = 0;
      a.every(15, (a) => { const F = a.fish; if (a.mode !== 'fish' || !F.catch) return; a.s.tr++; a.s.win = 8; if (F.st === 'wait') F.wait = Math.min(F.wait, 0.6); a.sfx('hook'); a.say('<b>Рыбаки снизу:</b> Держите червячка! Нам — ваши сухари!'); }); },
    frame(a, dt) { const F = a.fish; if (a.mode !== 'fish' || !F.catch) return; if (a.s.c0 === undefined) a.s.c0 = F.catch.length; a.s.win -= dt;
      if (F.catch.length > a.s.c0) { if (a.s.win > 0) { a.s.x2++; a.msg('Обменная рыба! ×2', 'снизу аплодируют'); } a.s.c0 = F.catch.length; }
      a.hud('🪱 обменов ' + a.s.tr + ' · обменных рыб ' + a.s.x2 + (a.s.win > 0 ? ' · ОБМЕН ' + Math.ceil(a.s.win) + ' с' : '')); },
    result(a) { const n = ((a.fish && a.fish.catch) || []).length; return ['Улов с обменом', (n + (a.s.x2 || 0)) + ' (обменных ×2: ' + (a.s.x2 || 0) + ')']; } };

  // №88 «Вот такая была!»: серия настоящих рыб растит «размер» улова
  S[88] = { hint: 'Дед меряет улов руками: хватай рыб подряд — размер растёт. Ошибка — «это была тина»',
    init(a) { a.s.cm = 0; a.s.st = 0; a.s.ok = 0; a.s.bad = 0; a.s.max = 0; },
    frame(a) { if (a.mode !== 'mg') return; const M = a.mg;
      for (; a.s.ok < M.ok; a.s.ok++) { a.s.st++; a.s.cm += 10 * a.s.st; a.s.max = Math.max(a.s.max, a.s.st); }
      if (M.bad > a.s.bad) { a.s.bad = M.bad; a.s.st = 0; a.s.cm = Math.max(0, a.s.cm - 40); a.say('<b>Дед:</b> Это была тина. Но очень крупная!'); }
      if (a.s.cm >= 900) a.win('Вот такая! Рыба размером с полкратера'); a.hud('🐟 «вот такая»: ' + a.s.cm + ' / 900 см · серия ×' + a.s.st); },
    result(a) { return ['Размер по-дедовски', (a.s.cm || 0) + ' см · лучшая серия ' + (a.s.max || 0)]; } };

  // №89 «Дед на шарике»: догони летящего деда
  S[89] = { hint: 'Дед на шарике 🎈 летит впереди: догони и коснись — нужно 3. В прыжке — вдвойне!',
    init(a) { a.s.n = 0; a.s.cd = 0; },
    frame(a, dt) { if (a.mode !== 'drive') return; if (!a.s.b) { a.s.bi = a.idx + 40; a.s.b = a.obj('🎈', { size: 2.4, y: 3 }); }
      const b = a.s.b; if (a.car.state === 'go' && a.s.n < 3) a.s.bi = Math.min(a.len - 15, a.s.bi + dt * 7); const [x, z] = a.track(a.s.bi, Math.sin(a.t * 0.7) * 3); b.x = x; b.z = z; b.y = 3 + Math.sin(a.t * 2) * 0.5;
      if (a.s.n < 3 && b.dist() < 3.8 && a.t > a.s.cd) { const air = a.car.y > 0.5; a.s.n = Math.min(3, a.s.n + (air ? 2 : 1)); a.s.cd = a.t + 1.5; a.s.bi += 40; a.sfx('found');
        if (a.s.n >= 3) { b.set('👴'); a.msg('Дед спасён!', 'ёрш отпустил леску'); } else a.msg(air ? 'В прыжке! ×2' : 'Ухватила деда!', 'дед: «Таня, ёрш тянет!»'); }
      a.hud('🎈 дед: ' + a.s.n + '/3' + (a.s.n < 3 ? ' · ' + Math.max(0, Math.round((a.s.bi - a.idx) * 2)) + ' м' : ' ✓')); },
    result(a) { return ['Деда догнала', (a.s.n || 0) + ' из 3']; } };

  // №90 «Гошин рыбный ларёк»: рыба портится, коты воруют
  S[90] = { hint: 'Рыба портится: свежесть 🐟 падает, доставка — свежая партия. Коты 🐈 воруют рыбу!',
    init(a) { a.s.f = 100; a.s.n = 0; a.s.c = 0;
      a.every(6, (a) => { if (a.mode === 'drive') ah(a, '🐈', 90 + Math.random() * 40, 0, { size: 1.5, r: 2, ph: Math.random() * 6, move(o, dt, a) { o.ph += dt * 2; const [x, z] = a.track(o.i, Math.sin(o.ph) * 4.5); o.x = x; o.z = z; o.y = 1; },
        hit(o, a) { a.s.c++; a.s.f = Math.max(1, a.s.f - 15); a.sfx('caught'); a.bad('Кот стащил рыбу!', '−15% свежести'); } }); }); },
    frame(a, dt) { if (a.mode !== 'drive' || !a.dx) return; if (a.dx.n > a.s.n) { a.s.n = a.dx.n; a.s.f = 100; a.float('Свежая партия! 🐟', '#9fe8ff'); }
      if (a.car.state === 'go') a.s.f -= dt * 1.5; if (a.s.f <= 0) a.fail('Рыба протухла. Гоша закрыл ларёк'); a.hud('🐟 свежесть ' + Math.max(0, Math.round(a.s.f)) + '% · 🐈 украли ' + a.s.c); },
    result(a) { return ['Котам досталось', (a.s.c || 0) + ' рыб']; } };

  // №91 «Газета для сома»: страницы летят по ветру через дачу
  S[91] = { hint: 'Листы газеты 📰 летят по ветру через дачу — поймай 4 для сома (+5 с за лист)',
    init(a) { a.s.p = 0;
      a.every(6, (a) => { if (a.mode !== 'walk' || a.objs().length > 2 || a.s.p >= 4) return; const z = -9 + Math.random() * 13, s0 = Math.random() < 0.5 ? -1 : 1;
        a.obj('📰', { x: -11 * s0, z, size: 1.2, r: 1.5, move(o, dt, a) { o.x += s0 * dt * 2.2; o.z += Math.sin(a.t * 2 + z) * dt; o.y = 1.2 + Math.sin(a.t * 5) * 0.4; if (Math.abs(o.x) > 12) o.kill(); },
          hit(o, a) { a.s.p++; a.time(5); a.sfx('pick'); a.float('Лист ' + a.s.p + '/4 · +5 с', '#ffe08a'); if (a.s.p === 4) a.msg('Газета собрана!', 'сом получит свежий выпуск 1987 года'); } }); }); },
    frame(a) { a.hud('📰 листов для сома: ' + a.s.p + '/4'); },
    result(a) { return ['Листов газеты для сома', (a.s.p || 0) + ' из 4']; } };

  // №92 «Самая маленькая»: малявки и толстяки
  S[92] = { hint: 'Конкурс самой маленькой: лови малявок 🐟, а толстяк 🐡 дисквалифицирует одну',
    init(a) { a.s.t = 0; a.s.f = 0;
      a.every(3.5, (a) => { if (a.mode !== 'drive') return; const tiny = Math.random() < 0.6;
        ah(a, tiny ? '🐟' : '🐡', 90 + Math.random() * 50, rl(7), { size: tiny ? 0.7 : 2.4, r: tiny ? 1.6 : 2.4, move(o, dt, a) { o.y = (tiny ? 0.8 : 1.4) + Math.abs(Math.sin(a.t * 6 + o.i)) * 0.8; },
          hit(o, a) { if (tiny) { a.s.t++; a.sfx('fish'); a.float('Малявка! ' + a.s.t, '#9fe8ff'); } else { a.s.f++; a.s.t = Math.max(0, a.s.t - 1); a.sfx('soft'); a.bad('Толстяк!', 'жюри: «Слишком большая» · −1 малявка'); } } }); }); },
    frame(a) { a.hud('🐟 малявок ' + a.s.t + ' · 🐡 толстяков ' + a.s.f); },
    result(a) { return ['Малявок на конкурс', a.s.t || 0]; } };

  // №93 «Клубничная мормышка»: лужи прячут от рыб, банки тяжелят
  S[93] = { hint: 'В лужах 💧 рыбы с ложками теряют след. Но с каждой банкой бабуля тяжелее',
    init(a) { a.s.in = 0; },
    frame(a) { if (a.mode !== 'walk') return; const W = a.wk;
      if (!a.s.on) { a.s.on = 1; [[-6, -6], [6, 2], [-3, 3], [5, -8]].forEach(([x, z]) => a.obj('💧', { x, z, y: 0.4, size: 1.8, r: 1.8, multi: true, hit(o, a) { a.s.in++; } })); }
      const wet = a.objs().some((o) => o.dist() < 1.8), k = Math.max(0.6, 1 - (W.n || 0) * 0.05); if (wet && W.inv < 0.3) W.inv = 0.3; a.speed(k);
      a.hud((wet ? '💧 в луже — рыбы потеряли след' : '🍓 банок ' + (W.n || 0)) + ' · скорость ' + Math.round(k * 100) + '%'); },
    result(a) { return ['Пряталась в лужах', (a.s.in || 0) + ' раз']; } };

  // №94 «На часок»: уха остывает, костры греют
  S[94] = { hint: 'Уха остывает 🍲: проезжай через костры 🔥 у дороги — подогреешь. Турбо тоже греет',
    init(a) { a.s.h = 90; a.s.k = 0;
      a.every(6, (a) => { if (a.mode === 'drive') ah(a, '🔥', 100 + Math.random() * 40, (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2.5), { size: 1.6, hit(o, a) { a.s.k++; a.s.h = Math.min(100, a.s.h + 25); a.sfx('boom'); a.float('Уха булькает! +25°', '#ffcf6a'); } }); }); },
    frame(a, dt) { if (a.mode === 'drive' && a.car.state === 'go') a.s.h = Math.max(0, Math.min(100, a.s.h - dt * 1.8 + (a.car.boost > 0 ? dt * 3 : 0)));
      a.hud('🍲 уха ' + Math.round(a.s.h) + '°' + (a.s.h < 30 ? ' — стынет!' : '') + ' · 🔥 ' + a.s.k); },
    result(a) { const h = a.s.h || 0; return ['Уха доехала', Math.round(h) + '° · ' + (h >= 50 ? 'горячая!' : h > 0 ? 'тёплая' : 'холодец')]; } };

  // №95 «Ранний рассвет»: отсчёт до рассвета, микрофон Гены отодвигает
  S[95] = { hint: 'Через 50 с Марс-ФМ объявит рассвет — окуни 🐠 спрячутся. Микрофон 🎙️ отодвинет рассвет',
    init(a) { a.s.dawn = 50; a.s.n = 0; a.s.m = 0;
      a.every(2.5, (a) => { if (a.mode !== 'drive' || a.s.over) return; const mic = Math.random() < 0.12;
        ah(a, mic ? '🎙️' : '🐠', 80 + Math.random() * 60, rl(7), { size: 1.4, hit(o, a) { if (mic) { a.s.m++; a.s.dawn += 10; a.sfx('j_found'); a.float('Гена: «Рассвет переносится!» +10 с', '#ffd27a'); } else { a.s.n++; a.sfx('coin'); a.float('🐠 ' + a.s.n, '#9fe8ff'); } } }); }); },
    frame(a, dt) { if (a.mode !== 'drive') return; if (a.car.state === 'go' && !a.s.over) a.s.dawn -= dt;
      if (a.s.dawn <= 0 && !a.s.over) { a.s.over = 1; a.night(false); a.objs().forEach((o) => o.kill()); a.say('<b>Марс-ФМ:</b> Доброе утро, «Заречная»! Рассвет!'); a.msg('Рассвет!', 'окуни спрятались в пещеру'); }
      a.hud('🐠 окуней ' + a.s.n + ' · ' + (a.s.over ? '🌅 рассвет' : '🌙 до рассвета ' + Math.ceil(a.s.dawn) + ' с')); },
    result(a) { return ['Светлячков-окуней до рассвета', a.s.n || 0]; } };

  // №96 «Рыбка грустная»: робот выпускает рыбу — подбирай
  S[96] = { hint: 'Робот-рыбак выпускает рыбу 🐟 на волю: подбирай её, пока не уползла (6 с)',
    init(a) { a.s.ok = 0; a.s.lost = 0;
      a.every(5, (a) => { const G = a.mode === 'walk' && window.BM && window.BM.FS && window.BM.FS.goat; if (!G || a.objs().length > 3) return; const t0 = a.t, gx = G.position.x, gz = G.position.z;
        a.obj('🐟', { x: gx, z: gz, size: 1, r: 1.4, move(o, dt, a) { o.y = 0.6 + Math.abs(Math.sin(a.t * 9)) * 0.4; o.x += Math.sin(a.t * 3 + gx) * dt * 0.6; if (a.t - t0 > 6) { o.kill(); a.s.lost++; a.sfx('soft'); } },
          hit(o, a) { a.s.ok++; a.sfx('fish'); a.float('Улов спасён! ' + a.s.ok, '#9aff8a'); } }); }); },
    frame(a) { a.hud('🐟 спасено ' + a.s.ok + ' · уплыло ' + a.s.lost); },
    result(a) { return ['Дедов улов спасён', (a.s.ok || 0) + ' рыб, уплыло ' + (a.s.lost || 0)]; } };

  // №97 «Сом для порядка»: рывки сома с предупреждением, червяк успокаивает
  S[97] = { hint: 'Сом дёргает кресло вбок каждые 9 с — смотри стрелку! Червяк 🪱 успокоит его на 12 с',
    init(a) { a.s.t = 0; a.s.w = 0; a.s.calm = 0; a.s.warn = 0; a.s.pull = 0;
      a.every(9, (a) => { if (a.mode !== 'drive' || a.t < a.s.calm || a.car.state !== 'go') return; a.s.dir = Math.random() < 0.5 ? -1 : 1; a.s.warn = 1.5; a.sfx('warn'); });
      a.every(7, (a) => { if (a.mode === 'drive') ah(a, '🪱', 100 + Math.random() * 40, rl(6), { size: 1.3, hit(o, a) { a.s.w++; a.s.calm = a.t + 12; a.s.warn = 0; a.s.pull = 0; a.sfx('pick'); a.float('Сом жуёт червяка — 12 с покоя', '#9aff8a'); } }); }); },
    frame(a, dt) { if (a.mode !== 'drive') return; if (a.s.warn > 0) { a.s.warn -= dt; if (a.s.warn <= 0) { a.s.pull = 1.2; a.s.t++; a.shake(0.3); } }
      if (a.s.pull > 0) { a.s.pull -= dt; const h = a.car.h; a.push(-Math.cos(h) * a.s.dir * 22, Math.sin(h) * a.s.dir * 22); }
      a.hud(a.s.warn > 0 ? (a.s.dir > 0 ? '🐟 рывок → ВПРАВО' : '🐟 рывок ВЛЕВО ←') : a.t < a.s.calm ? '🪱 сом жуёт · ' + Math.ceil(a.s.calm - a.t) + ' с' : '🐟 рывков сома: ' + a.s.t); },
    result(a) { return ['Рывков сома / червяков', (a.s.t || 0) + ' / ' + (a.s.w || 0)]; } };

  // №98 «Переговорщица Зорька»: пикеты жуков и капуста для профсоюза
  S[98] = { hint: 'Жуки-пикетчики 🐞 на дороге: задела 4 раза — переговоры сорваны! Капуста 🥬 их задобрит',
    init(a) { a.s.ang = 0; a.s.k = 0;
      a.every(4, (a) => { if (a.mode !== 'drive') return; const cab = Math.random() < 0.3;
        ah(a, cab ? '🥬' : '🐞', 100 + Math.random() * 40, rl(7), { size: cab ? 1.4 : 1.7, r: 2, hit(o, a) {
          if (cab) { a.s.k++; a.s.ang = Math.max(0, a.s.ang - 1); a.sfx('pick'); a.float('Профсоюзу капусты! −1 обида', '#9aff8a'); }
          else { a.s.ang++; a.sfx('thud'); a.bad('Наехала на пикет!', 'обида профсоюза ' + a.s.ang + '/4'); if (a.s.ang >= 4) a.fail('Жуки обиделись и ушли с переговоров'); } } }); }); },
    frame(a) { a.hud('🐞 обида профсоюза ' + a.s.ang + '/4 · 🥬 подарено ' + a.s.k); },
    result(a) { return ['Обида профсоюза', (a.s.ang || 0) + ' из 4']; } };

  // №99 «Снег на обмен»: вёдра снега задерживают толпу, медведи кидают снежки
  S[99] = { hint: 'Ведро снега 🪣 — медведи дерутся за него и отстают на 30 м. Берегись снежков!',
    init(a) { a.s.b = 0; a.s.s = 0;
      a.every(7, (a) => { if (a.mode === 'drive') ah(a, '🪣', 100 + Math.random() * 40, rl(6), { size: 1.5, hit(o, a) { a.s.b++; if (a.dx && a.dx.wi !== undefined) a.dx.wi -= 15; a.sfx('boom'); a.msg('Снег на обмен!', 'медведи дерутся за ведро · +30 м'); } }); });
      a.every(11, (a) => { if (a.mode !== 'drive' || a.t < 15 || a.car.state !== 'go') return; a.s.s++; a.flash('#ffffff', 0.5); a.spin(0.4); a.sfx('thud'); a.bad('Снежок!', 'медведь метко кинул'); }); },
    frame(a) { a.hud('🪣 вёдер медведям ' + a.s.b + ' · ❄ снежков ' + a.s.s); },
    result(a) { return ['Вёдер снега медведям', a.s.b || 0]; } };

  // №100 «Жалоба на солёность» (поликлиника): бланки встречной жалобы и Михал Потапыч
  S[100] = { hint: 'Собирай бланки встречной жалобы 📝 (+8 с). Михал Потапыч 🐻 бродит — не попадайся!',
    init(a) { a.s.f = 0; a.s.b = 0; },
    frame(a) { if (a.mode !== 'walk') return; a.hud('📝 бланков ' + a.s.f + '/5 · 🐻 жалоб Потапыча ' + a.s.b); if (a.s.on) return; a.s.on = 1;
      [[-7, -1], [0, 5.5], [7, 4.5], [3, -2], [-2, -5]].forEach(([x, z]) => a.obj('📝', { x, z, size: 1, r: 1.3, hit(o, a) { a.s.f++; a.time(8); a.sfx('pick'); a.float('Бланк ' + a.s.f + '/5 · +8 с', '#9aff8a'); if (a.s.f === 5) a.msg('Встречная жалоба готова!', 'МарсЖЭК: «Солёность признана нормальной»'); } }));
      const P = [[6, -4], [-6, 2], [6, 5], [-3, -4]];
      a.obj('🐻', { x: 6, z: -4, size: 1.8, r: 1.3, multi: true, k: 0, move(o, dt, a) { const [tx, tz] = P[o.k], dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz); if (d < 0.3) o.k = (o.k + 1) % P.length; else { o.x += dx / d * 1.3 * dt; o.z += dz / d * 1.3 * dt; } o.y = 1.1; },
        hit(o, a) { a.s.b++; a.speed(0.5); a.after(3, (a) => a.speed(1)); a.sfx('thud'); a.bad('Потапыч: «И на это жалобу напишу!»', 'бумажная волокита — 3 с медленно'); } }); },
    result(a) { return ['Бланков встречной жалобы', (a.s.f || 0) + ' из 5']; } };
})();
