/* ============================================================
   🛒 «МАРСТОРГ» — магазин за игровые ₽ экспедиции
   Вкладки: внешний вид, улучшения, расходники, помощники.
   Покупки — в localStorage 'bm_shop' (не пропадают при перезапуске главы),
   деньги — W.st.money (в экспедиции) или сохранение 'bm_world' (из меню).
   Грузится лениво: при входе в экспедицию или по кнопке 🛒.
   ============================================================ */
(function () {
  if (window.SHOP) return;
  const KEY = 'bm_shop';
  const S = (() => { try { return Object.assign({ own: {}, eq: { paint: 'p_classic', exh: '', hat: '', roofcat: 0, outfit: 'o_classic' }, lv: {}, help: {} }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { own: {}, eq: { paint: 'p_classic', exh: '', hat: '', roofcat: 0, outfit: 'o_classic' }, lv: {}, help: {} }; } })();
  const saveS = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const WD = () => window.WD;
  const inWorld = () => !!(WD() && WD().active && WD().st);
  const fmt = (n) => Math.round(n).toLocaleString('ru');
  const snd = (n, o) => { try { sfx(n, o); } catch (e) {} };

  /* ---------- деньги ---------- */
  function money() { if (inWorld()) return WD().st.money; try { const sv = JSON.parse(localStorage.getItem('bm_world') || 'null'); return sv && sv.st ? sv.st.money : null; } catch (e) { return null; } }
  function pay(n) {
    if (inWorld()) { const W = WD(); if (W.st.money < n) return false; W.st.money -= n; if (W.ckpt && W.ckpt.st) W.ckpt.st.money = Math.max(0, (W.ckpt.st.money || 0) - n); try { if (W.A && W.A.save) W.A.save(); } catch (e) {} return true; }
    try { const sv = JSON.parse(localStorage.getItem('bm_world') || 'null'); if (!sv || !sv.st || sv.st.money < n) return false; sv.st.money -= n; localStorage.setItem('bm_world', JSON.stringify(sv)); const W = WD(); if (W && W.st) W.st.money = Math.max(0, W.st.money - n); return true; } catch (e) { return false; }
  }

  /* ---------- каталог ---------- */
  const PAINT = { p_classic: ['#b8c890', '#a8b880', '#ff7a3a'], p_fire: ['#c8463a', '#b83c32', '#ffffff'], p_sky: ['#6aa8d8', '#5a98c8', '#ffd24a'], p_milk: ['#ece4d4', '#dcd4c4', '#d0303a'], p_night: ['#34343e', '#2a2a32', '#ffd24a'], p_rust: ['#a8643a', '#985a34', '#7fe8ff'], p_gold: ['#e0b04a', '#d0a03a', '#d0303a'] };
  const ITEMS = [
    { id: 'p_classic', tab: 'look', grp: 'paint', name: 'Классика', d: 'Цвет «Буханки» с завода. Проверенный временем', price: 0 },
    { id: 'p_fire', tab: 'look', grp: 'paint', name: 'Пожарная', d: 'Красная с белым флажком. Твари сами уступают дорогу', price: 39 },
    { id: 'p_sky', tab: 'look', grp: 'paint', name: 'Небесная', d: 'Голубая, как земное небо, которого Таня не видела 20 лет', price: 39 },
    { id: 'p_milk', tab: 'look', grp: 'paint', name: 'Молоковоз', d: 'Белая с красным флажком. «Молоко, творог, сметана!»', price: 49 },
    { id: 'p_night', tab: 'look', grp: 'paint', name: 'Ночная', d: 'Чёрная с жёлтым флажком. Для поездок после заката', price: 59 },
    { id: 'p_rust', tab: 'look', grp: 'paint', name: 'Ржавый шик', d: 'Медная, как старые марсианские корабли. Лёха одобряет', price: 69 },
    { id: 'p_gold', tab: 'look', grp: 'paint', name: 'Золотая пенсия', d: 'Вся в золоте. Соседка Валя будет в ярости', price: 99 },
    { id: 'o_classic', tab: 'dress', grp: 'outfit', name: 'Кофта и платок', d: 'Любимая кофта и платок в горошек. В них Таня улетела с Земли', price: 0 },
    { id: 'o_sport', tab: 'dress', grp: 'outfit', name: 'Олимпийка', d: 'Синий костюм с белыми лампасами. Для утренней зарядки на Фобосе', price: 39 },
    { id: 'o_garden', tab: 'dress', grp: 'outfit', name: 'Дачница', d: 'Жёлтая кофта, фартук и соломенная шляпа с цветами. Картошка растёт быстрее (так говорят)', price: 45 },
    { id: 'o_party', tab: 'dress', grp: 'outfit', name: 'Платье на праздник', d: 'Красное в белый горох, бусы и брошка. На юбилей колонии', price: 55 },
    { id: 'o_winter', tab: 'dress', grp: 'outfit', name: 'Шуба и пуховый платок', d: 'Для Европы и полюсов. Дед говорит — «как в 78-м»', price: 65 },
    { id: 'o_pilot', tab: 'dress', grp: 'outfit', name: 'Лётчица', d: 'Кожаная куртка, шлем с очками и белый шарф. Как в кино', price: 75 },
    { id: 'o_cyber', tab: 'dress', grp: 'outfit', name: 'Кибер-бабуля', d: 'Чёрный костюм со светящимися полосками. Внуки в восторге', price: 85 },
    { id: 'o_space', tab: 'dress', grp: 'outfit', name: 'Скафандр', d: 'Белый, с шлемом-аквариумом и кнопками на груди. Настоящая космонавтка', price: 95 },
    { id: 'o_queen', tab: 'dress', grp: 'outfit', name: 'Царица колонии', d: 'Сарафан с золотом, кокошник и жемчуг в два ряда. Валя не переживёт', price: 99 },
    { id: 'roofcat', tab: 'look', grp: 'cat', e: '🐈', name: 'Гоша на крыше', d: 'Гоша едет на крыше и смотрит вперёд. Можно надеть шапку', price: 29 },
    { id: 'h_ushanka', tab: 'look', grp: 'hat', e: '🧢', name: 'Ушанка для Гоши', d: 'Дедова, из кролика. Гоша не против', price: 35, need: 'roofcat' },
    { id: 'h_helm', tab: 'look', grp: 'hat', e: '👨‍🚀', name: 'Шлем космонавта', d: 'Настоящий, только маленький. Гоша — кот-космонавт', price: 59, need: 'roofcat' },
    { id: 'h_bow', tab: 'look', grp: 'hat', e: '🎀', name: 'Бантик', d: 'Красный, на ушко. Гоша делает вид, что не замечает', price: 25, need: 'roofcat' },
    { id: 'h_crown', tab: 'look', grp: 'hat', e: '👑', name: 'Корона', d: 'Царь-кот Марса. Блестит на солнце', price: 89, need: 'roofcat' },
    { id: 'x_steam', tab: 'look', grp: 'exh', e: '♨️', name: 'Пар из самовара', d: 'Из выхлопной трубы — белый пар клубами', price: 35 },
    { id: 'x_heart', tab: 'look', grp: 'exh', e: '💗', name: 'Розовый дым', d: 'За «Буханкой» тянется розовое облако', price: 45 },
    { id: 'x_spark', tab: 'look', grp: 'exh', e: '✨', name: 'Искры', d: 'Сыплются золотые искры, особенно на скорости', price: 59 },
    { id: 'x_rainbow', tab: 'look', grp: 'exh', e: '🌈', name: 'Радуга', d: 'Дым всех цветов по очереди', price: 79 },
    { id: 'u_armor', tab: 'up', e: '🧳', name: 'Бабушкин сундук', d: '+40 к прочности корпуса за уровень', prices: [39, 69, 99] },
    { id: 'u_turbo', tab: 'up', e: '⚡', name: 'Турбо-наддув', d: '+6% к скорости «Буханки» за уровень', prices: [45, 75, 99] },
    { id: 'u_magnet', tab: 'up', e: '🧲', name: 'Магнит XL', d: '+30% к радиусу сбора находок за уровень', prices: [29, 59, 89] },
    { id: 'u_tank', tab: 'up', e: '🛢', name: 'Канистры на крыше', d: '−15% расхода топлива за уровень', prices: [35, 69] },
    { id: 'u_salt', tab: 'up', e: '🧂', name: 'Соль «Экстра»', d: '+10% к урону всего оружия деда за уровень', prices: [49, 79, 99] },
    { id: 'c_fuel', tab: 'cons', e: '⛽', name: 'Полный бак', d: 'Дрон привезёт канистру и зальёт до краёв', price: 99, ok: (st) => st.fuel < 99, fn: (W) => W.give('fuel', 100) },
    { id: 'c_fix', tab: 'cons', e: '🛠', name: 'Полный ремонт', d: 'Корпус как новый', price: 99, ok: (st) => st.hull < st.hullMax, fn: (W) => W.give('hull', 9999) },
    { id: 'c_pies', tab: 'cons', e: '🥟', name: 'Пирожки ×4', d: 'С капустой. Бабуля одобряет — сама бы лучше испекла', price: 49, fn: (W) => W.give('food', 4) },
    { id: 'c_salt', tab: 'cons', e: '🫙', name: 'Соль ×100', d: 'Патроны для дедова ружья', price: 59, fn: (W) => W.give('ammo', 100) },
    { id: 'c_calm', tab: 'cons', e: '🍵', name: 'Валерьянка с чаем', d: 'Нервы бабули +40', price: 39, ok: (st) => st.nerves < 100, fn: (W) => { W.st.nerves = Math.min(100, (W.st.nerves || 0) + 40); } },
    { id: 'hp_vac', tab: 'help', e: '🛸', name: 'Дрон-пылесос', d: 'Летает рядом и сам подбирает находки в 30 м вокруг', price: 79 },
    { id: 'hp_fix', tab: 'help', e: '🔧', name: 'Дрон-ремонтник', d: 'Чинит корпус (+2 в секунду), когда по вам 4 секунды не попадали', price: 89 },
    { id: 'hp_musya', tab: 'help', e: '🐈‍⬛', name: 'Кошка Муся', d: 'Подружка Гоши едет на багажнике и раз в минуту приносит находку: ₽ или деталь', price: 69 },
    { id: 'hp_valera', tab: 'help', e: '🤖', name: 'Робот Валера', d: 'Стоит на багажнике и бьёт током ближайших тварей', price: 99 },
  ];
  const TABS = [['dress', '👗', 'Наряды'], ['look', '🎨', 'Внешний вид'], ['up', '⚙', 'Улучшения'], ['cons', '🧺', 'Расходники'], ['help', '🤝', 'Помощники']];
  const byId = (id) => ITEMS.find((i) => i.id === id);
  S.own.p_classic = 1; S.own.o_classic = 1; if (!S.eq.outfit) S.eq.outfit = 'o_classic';

  /* ---------- окно ---------- */
  const css = document.createElement('style'); css.textContent = `
#shop{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(14,4,10,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff4ea}
#shop.on{display:flex}
#shop .sp{position:relative;width:min(760px,calc(100vw - 20px));height:min(640px,calc(100vh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom)));display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:linear-gradient(170deg,#3a1a2c,#1c0c16 60%);border:1px solid rgba(255,200,160,.18);box-shadow:0 20px 60px rgba(0,0,0,.55);animation:spIn .35s cubic-bezier(.2,.9,.2,1)}
@keyframes spIn{from{opacity:0;transform:translateY(18px) scale(.97)}}
#shop .sh{display:flex;align-items:center;gap:12px;padding:14px 16px 10px}
#shop .sh h2{margin:0;font-size:22px;font-weight:900;letter-spacing:-.01em;background:linear-gradient(#fff3d6,#ffb35c);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
#shop .sh small{display:block;font-size:12px;color:#d8b0a0;font-weight:600}
#shop .bal{margin-left:auto;padding:7px 12px;border-radius:12px;background:rgba(255,190,90,.14);border:1px solid rgba(255,190,90,.35);font-weight:900;font-size:16px;white-space:nowrap;font-variant-numeric:tabular-nums}
#shop .bal.bump{animation:balB .4s}@keyframes balB{40%{transform:scale(1.12);background:rgba(255,120,90,.35)}}
#shop .x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font-size:18px;flex:none;cursor:pointer}
#shop .tabs{display:flex;gap:6px;padding:0 14px 10px;overflow-x:auto;scrollbar-width:none}
#shop .tabs button{flex:none;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:8px 13px;background:rgba(255,255,255,.05);color:#e8c8b8;font:800 14px system-ui,sans-serif;cursor:pointer}
#shop .tabs button.on{background:linear-gradient(#ffcf7a,#ff9a4a);color:#2a1406;border-color:transparent}
#shop .grid{flex:1;overflow-y:auto;padding:4px 14px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;align-content:start;-webkit-overflow-scrolling:touch}
#shop .note{grid-column:1/-1;margin:0 2px 2px;font-size:13px;color:#d8b0a0}
#shop .gh{grid-column:1/-1;margin:8px 2px 0;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#c89a88}
#shop .cd{position:relative;display:flex;flex-direction:column;border-radius:16px;padding:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}
#shop .cd.eq{border-color:rgba(127,232,255,.55);box-shadow:0 0 0 1px rgba(127,232,255,.25) inset}
#shop .cd.got{animation:cdGot .6s}@keyframes cdGot{30%{transform:scale(1.04);box-shadow:0 0 30px rgba(255,200,90,.5)}}
#shop .pv{height:78px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;background:radial-gradient(ellipse 70% 80% at 50% 70%,rgba(255,170,100,.25),rgba(0,0,0,0) 70%),linear-gradient(#2c1622,#24101a);margin-bottom:8px;overflow:hidden}
#shop .pv svg{width:118px;height:70px}
#shop .cd b{font-size:15px;line-height:1.15}
#shop .cd p{margin:4px 0 8px;font-size:12px;line-height:1.3;color:#d8b8a8;flex:1}
#shop .lvl{display:flex;gap:4px;margin:-2px 0 8px}#shop .lvl i{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.14)}#shop .lvl i.on{background:linear-gradient(90deg,#ff9a4a,#ffd27a)}
#shop .bt{border:0;border-radius:11px;padding:9px 8px;font:900 14px system-ui,sans-serif;cursor:pointer;color:#2a1406;background:linear-gradient(#ffd27a,#ff9a4a);touch-action:manipulation}
#shop .bt.eqb{background:rgba(127,232,255,.18);color:#bff4ff}
#shop .bt.dis{background:rgba(255,255,255,.08);color:rgba(255,255,255,.45);cursor:default}
#shop .bt.off{background:rgba(255,255,255,.12);color:#fff}
#shop .tag{position:absolute;top:8px;right:8px;font-size:11px;font-weight:900;padding:3px 7px;border-radius:8px;background:rgba(127,232,255,.2);color:#bff4ff}
#shopB{position:fixed;left:16px;top:calc(246px + env(safe-area-inset-top));z-index:9;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,210,140,.4);background:rgba(30,14,22,.7);font-size:22px;display:none;touch-action:manipulation;cursor:pointer}
body.world #shopB{display:block}body.world.wdcab #shopB,body.world.wdtur #shopB{display:block}
@media (max-height:430px){#shopB{top:calc(196px + env(safe-area-inset-top));left:62px;width:38px;height:38px;font-size:18px}#shop .pv{height:58px;font-size:30px}}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'shop'; el.innerHTML = '<div class="sp"><div class="sh"><div><h2>🛒 Марсторг</h2><small>доставка дроном прямо к «Буханке»</small></div><div class="bal" id="shopBal"></div><button class="x" id="shopX" aria-label="Закрыть">✕</button></div><div class="tabs" id="shopTabs"></div><div class="grid" id="shopGrid"></div></div>';
  document.body.appendChild(el);
  const btn = document.createElement('button'); btn.id = 'shopB'; btn.textContent = '🛒'; btn.setAttribute('aria-label', 'Магазин'); document.body.appendChild(btn);
  ['pointerdown', 'touchstart'].forEach((ev) => { el.addEventListener(ev, (e) => e.stopPropagation()); btn.addEventListener(ev, (e) => e.stopPropagation()); });
  btn.onclick = (e) => { e.stopPropagation(); open(); };
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  document.getElementById('shopX').onclick = (e) => { e.stopPropagation(); close(); };
  let tab = 'dress', wasPaused = null;

  function rover(P) { return `<svg viewBox="760 490 260 240"><g transform="translate(0,-22)"><rect x="782" y="676" width="214" height="14" rx="5" fill="#2a2428"/><path d="M776 690V612q0-20 20-20h152q18 0 26 14l24 44q4 8 4 18v22z" fill="${P[0]}"/><rect x="776" y="592" width="198" height="12" rx="6" fill="${P[1]}"/><rect x="800" y="610" width="40" height="28" rx="5" fill="#1a2a38"/><rect x="848" y="610" width="44" height="28" rx="5" fill="#1a2a38"/><path d="M904 610h48l20 36h-68z" fill="#1a2a38"/><circle cx="992" cy="664" r="6" fill="#fff4c8"/><rect x="800" y="582" width="70" height="10" rx="3" fill="#5a4a3a"/><path d="M790 592V512" stroke="#ccc" stroke-width="3"/><path d="M791 513h26l-6 8 6 8h-26z" fill="${P[2]}"/>${[806, 884, 962].map((x) => `<circle cx="${x}" cy="700" r="26" fill="#141012"/><circle cx="${x}" cy="700" r="9" fill="#d8a43a"/>`).join('')}</g></svg>`; }
  const GP = { o_classic: ['#3a5a8a', '#7a3a6a', '#d8302a', '#ffe08a'], o_sport: ['#2a3a8a', '#2a3a8a', '#ffffff', '#d8302a'], o_garden: ['#4a6a3a', '#e8b83a', '#5ab84a', '#ffffff'], o_party: ['#c8303a', '#c8303a', '#ffffff', '#c8303a'], o_winter: ['#5a3a2a', '#7a5238', '#9a8aa8', '#f4ece0'], o_pilot: ['#3a4a3a', '#6a3a1e', '', '#5a3418'], o_cyber: ['#22222c', '#1a1a24', '#2a2a36', '#7fe8ff'], o_space: ['#e8e8ee', '#e8e8ee', '', '#dcdce2'], o_queen: ['#b8202a', '#b8202a', '', '#dcdce2'] };
  function granSVG(id) { const [sk, co, sc, dt] = GP[id], x = id.slice(2); let h = '';
    h += `<path d="M28 96 L36 62 H64 L72 96Z" fill="${sk}"/>`; if (x === 'party') h += [[40, 72], [56, 70], [48, 84], [36, 88], [62, 86], [52, 94]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.6" fill="#fff"/>`).join('');
    if (x === 'queen') h += '<rect x="47" y="40" width="6" height="56" fill="#ffcf3a"/>';
    h += `<path d="M35 64 L38 40 Q50 34 62 40 L65 64Z" fill="${co}"/><path d="M37 44 L26 62" stroke="${x === 'queen' ? '#f4efe4' : co}" stroke-width="8" stroke-linecap="round"/><path d="M63 44 L74 62" stroke="${x === 'queen' ? '#f4efe4' : co}" stroke-width="8" stroke-linecap="round"/><circle cx="26" cy="63" r="4" fill="#f0c8a8"/><circle cx="74" cy="63" r="4" fill="#f0c8a8"/>`;
    if (x === 'sport') h += '<path d="M33 47 L24 63M67 47 L76 63M50 40V64" stroke="#fff" stroke-width="2"/>';
    if (x === 'garden') h += '<rect x="41" y="44" width="18" height="24" rx="3" fill="#f4f0e0"/><rect x="45" y="54" width="10" height="7" fill="#5ab84a"/>';
    if (x === 'winter') h += '<ellipse cx="50" cy="39" rx="15" ry="5" fill="#f4ece0"/><path d="M29 95 Q50 99 71 95" stroke="#f4ece0" stroke-width="5" fill="none"/>';
    if (x === 'cyber') h += '<path d="M36 60 H64M30 92 H70M50 40V62" stroke="#7fe8ff" stroke-width="2"/><path d="M37 46 L27 60M63 46 L73 60" stroke="#ff4ad8" stroke-width="2"/>';
    if (x === 'space') h += '<path d="M36 52 H64" stroke="#ff8a2a" stroke-width="3"/><rect x="54" y="45" width="6" height="4" fill="#4aff8a"/><rect x="40" y="45" width="6" height="4" fill="#d8302a"/>';
    if (x === 'pilot') h += '<path d="M42 37 Q50 42 58 37 L66 30" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>';
    if (x === 'party' || x === 'queen') h += '<path d="M40 40 Q50 48 60 40" stroke="#fff8ea" stroke-width="3" fill="none" stroke-dasharray="1 3" stroke-linecap="round"/>';
    h += '<circle cx="50" cy="26" r="12" fill="#f0c8a8"/>';
    if (sc) h += `<path d="M37 28 Q36 11 50 11 Q64 11 63 28 Q60 20 50 20 Q40 20 37 28Z" fill="${sc}"/><path d="M38 28 L50 38 L62 28" stroke="${sc}" stroke-width="3" fill="none"/>` + [[43, 15], [50, 13], [57, 15], [40, 22], [60, 22]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.6" fill="${dt}"/>`).join('');
    else h += `<path d="M38 27 Q37 13 50 13 Q63 13 62 27 Q58 19 50 19 Q42 19 38 27Z" fill="${dt}"/>` + (x !== 'pilot' ? `<circle cx="50" cy="12" r="5" fill="${dt}"/>` : '');
    if (x === 'pilot') h += '<path d="M37 30 V22 Q50 6 63 22 V30" fill="#5a3418"/><circle cx="45" cy="17" r="4" fill="#8ad8ff" stroke="#3a2a20" stroke-width="1.5"/><circle cx="55" cy="17" r="4" fill="#8ad8ff" stroke="#3a2a20" stroke-width="1.5"/>';
    if (x === 'garden') h += '<ellipse cx="50" cy="14" rx="20" ry="4" fill="#e8c870"/><path d="M41 14 Q42 4 50 4 Q58 4 59 14Z" fill="#e8c870"/><rect x="41" y="10" width="18" height="3" fill="#d8302a"/><circle cx="40" cy="14" r="2.2" fill="#fff"/><circle cx="44" cy="15" r="2.2" fill="#ffd24a"/>';
    if (x === 'queen') h += '<path d="M36 18 Q50 -6 64 18 Q50 12 36 18Z" fill="#ffc23a"/><circle cx="50" cy="8" r="2.6" fill="#ff3a5a"/><circle cx="43" cy="12" r="1.6" fill="#4ac8ff"/><circle cx="57" cy="12" r="1.6" fill="#4ac8ff"/>';
    h += '<rect x="42" y="25" width="16" height="3" rx="1.5" fill="#7fe8ff"/>';
    if (x === 'space') h += '<circle cx="50" cy="24" r="17" fill="rgba(207,233,255,.25)" stroke="#e8f4ff" stroke-width="1.5"/>';
    return `<svg viewBox="0 0 100 100" style="width:76px;height:76px">${h}</svg>`; }
  function render() {
    const m = money(); document.getElementById('shopBal').textContent = m === null ? '₽ —' : '₽ ' + fmt(m);
    document.getElementById('shopTabs').innerHTML = TABS.map(([id, e, n]) => `<button data-t="${id}" class="${id === tab ? 'on' : ''}">${e} ${n}</button>`).join('');
    document.getElementById('shopTabs').querySelectorAll('button').forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); tab = b.dataset.t; snd('click'); render(); document.getElementById('shopGrid').scrollTop = 0; }));
    let h = '';
    if (m === null) h += '<p class="note">Магазин работает в экспедиции. Отправься в первую поездку — там заработаешь первые рубли.</p>';
    if (tab === 'cons' && !inWorld()) h += '<p class="note">Расходники дрон привозит только в экспедиции — прямо к «Буханке».</p>';
    if (tab === 'dress') h += '<p class="note">Бабулю видно в колонии: в турбо-кресле, на грядках, на рыбалке и на прогулках.</p>';
    if (tab === 'up') h += '<p class="note">Улучшения навсегда — работают во всех главах.</p>';
    if (tab === 'help') h += '<p class="note">Помощники ездят с вами во всех главах. Купленных можно отпускать и звать снова.</p>';
    let grp = '';
    for (const it of ITEMS.filter((i) => i.tab === tab)) {
      if (tab === 'look' && it.grp !== grp) { grp = it.grp; h += `<div class="gh">${{ paint: 'Покраска «Буханки»', cat: 'Гоша', hat: 'Шапки для Гоши', exh: 'Выхлоп' }[grp]}</div>`; }
      const own = !!S.own[it.id], lv = S.lv[it.id] || 0, eq = isEq(it);
      let pv = it.grp === 'paint' ? rover(PAINT[it.id]) : it.grp === 'outfit' ? granSVG(it.id) : it.e, b, extra = '';
      if (it.prices) { const max = it.prices.length; extra = `<div class="lvl">${it.prices.map((_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</div>`; if (lv >= max) b = `<button class="bt dis">Максимум</button>`; else { const p = it.prices[lv]; b = `<button class="bt${m === null || m < p ? ' dis' : ''}" data-buy="${it.id}">${lv ? 'Ур. ' + (lv + 1) + ' · ' : ''}${fmt(p)} ₽</button>`; } }
      else if (it.tab === 'cons') { const okk = inWorld() && (!it.ok || it.ok(WD().st)); b = `<button class="bt${!okk || m < it.price ? ' dis' : ''}" data-buy="${it.id}">${!inWorld() ? 'В экспедиции' : it.ok && !it.ok(WD().st) ? 'Не нужно' : fmt(it.price) + ' ₽'}</button>`; }
      else if (!own) { const needOk = !it.need || S.own[it.need]; b = `<button class="bt${!needOk || m === null || m < it.price ? ' dis' : ''}" data-buy="${it.id}">${needOk ? fmt(it.price) + ' ₽' : 'Сначала Гоша на крыше'}</button>`; }
      else if (it.tab === 'help') b = eq ? `<button class="bt off" data-eq="${it.id}">Отпустить</button>` : `<button class="bt eqb" data-eq="${it.id}">Позвать</button>`;
      else b = eq ? (it.grp === 'paint' || it.grp === 'outfit' ? `<button class="bt dis">✓ Надето</button>` : `<button class="bt off" data-eq="${it.id}">Снять</button>`) : `<button class="bt eqb" data-eq="${it.id}">Надеть</button>`;
      h += `<div class="cd${eq ? ' eq' : ''}" data-id="${it.id}">${eq ? '<span class="tag">' + (it.tab === 'help' ? 'с вами' : 'надето') + '</span>' : ''}<div class="pv">${pv}</div><b>${it.name}</b><p>${it.d}</p>${extra}${b}</div>`;
    }
    const g = document.getElementById('shopGrid'); g.innerHTML = h;
    g.querySelectorAll('[data-buy]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); if (x.classList.contains('dis')) { snd('dry'); return; } buy(x.dataset.buy); }));
    g.querySelectorAll('[data-eq]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); toggle(x.dataset.eq); }));
  }
  function isEq(it) { if (it.grp === 'paint') return S.eq.paint === it.id; if (it.grp === 'outfit') return S.eq.outfit === it.id; if (it.grp === 'cat') return !!S.eq.roofcat; if (it.grp === 'hat') return S.eq.hat === it.id; if (it.grp === 'exh') return S.eq.exh === it.id; if (it.tab === 'help') return !!S.help[it.id]; return false; }
  function toggle(id) { const it = byId(id); snd('click');
    if (it.grp === 'outfit') S.eq.outfit = id; else if (it.grp === 'paint') S.eq.paint = id; else if (it.grp === 'cat') S.eq.roofcat = S.eq.roofcat ? 0 : 1; else if (it.grp === 'hat') S.eq.hat = S.eq.hat === id ? '' : id; else if (it.grp === 'exh') S.eq.exh = S.eq.exh === id ? '' : id; else if (it.tab === 'help') S.help[id] = S.help[id] ? 0 : 1;
    saveS(); apply(); render(); }
  function buy(id) { const it = byId(id); const lv = S.lv[id] || 0, price = it.prices ? it.prices[lv] : it.price;
    if (it.tab === 'cons' && !inWorld()) return; if (!pay(price)) { snd('dry'); return; }
    if (it.tab === 'cons') { it.fn(WD()); } else if (it.prices) S.lv[id] = lv + 1; else { S.own[id] = 1; if (it.grp === 'outfit') S.eq.outfit = id; else if (it.grp === 'paint') S.eq.paint = id; else if (it.grp === 'cat') S.eq.roofcat = 1; else if (it.grp === 'hat') S.eq.hat = id; else if (it.grp === 'exh') S.eq.exh = id; else if (it.tab === 'help') S.help[id] = 1; }
    saveS(); snd('coins'); apply(); render(); const c = document.querySelector(`#shopGrid .cd[data-id="${id}"]`); if (c) c.classList.add('got'); const bl = document.getElementById('shopBal'); bl.classList.remove('bump'); void bl.offsetWidth; bl.classList.add('bump');
    try { const W = WD(); if (W && W.toast && inWorld() && it.tab !== 'cons') W.toast('🛸 Дрон «Марсторга» привёз: ' + it.name); } catch (e) {} }
  function open() { const W = WD(); if (inWorld()) { wasPaused = W.paused; W.paused = true; } el.classList.add('on'); snd('open'); render(); }
  function close() { const W = WD(); if (inWorld() && wasPaused !== null) W.paused = wasPaused; wasPaused = null; el.classList.remove('on'); snd('close'); }

  /* ---------- применение в мире ---------- */
  let hatMesh = null, catG = null, helpers = {}, exhT = 0, rainbowK = 0;
  const HB = (geo, col, o = {}) => { const m = new THREE.Mesh(geo, o.basic ? new THREE.MeshBasicMaterial({ color: col, transparent: !!o.op, opacity: o.op || 1 }) : new THREE.MeshLambertMaterial({ color: col, transparent: !!o.op, opacity: o.op || 1 })); return m; };
  function makeHat(id) { const g = new THREE.Group();
    if (id === 'h_ushanka') { const d = HB(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#6a4a32'); g.add(d); const band = HB(new THREE.CylinderGeometry(0.53, 0.55, 0.22, 18), '#8a6a4a'); band.position.y = 0.04; g.add(band); for (const s of [-1, 1]) { const f = HB(new THREE.SphereGeometry(0.22, 10, 8), '#8a6a4a'); f.scale.set(0.5, 1.2, 1); f.position.set(s * 0.5, -0.16, 0); g.add(f); } }
    else if (id === 'h_helm') { const b = HB(new THREE.SphereGeometry(0.85, 20, 14), '#cfe9ff', { op: 0.3 }); b.position.y = -0.3; g.add(b); const r = HB(new THREE.TorusGeometry(0.62, 0.1, 8, 20), '#e8e8f0'); r.rotation.x = Math.PI / 2; r.position.y = -0.85; g.add(r); }
    else if (id === 'h_bow') { for (const s of [-1, 1]) { const c = HB(new THREE.ConeGeometry(0.22, 0.4, 10), '#e0303a'); c.rotation.z = s * Math.PI / 2; c.position.x = s * 0.18; g.add(c); } const k = HB(new THREE.SphereGeometry(0.1, 8, 6), '#b0202a'); g.add(k); g.position.x = 0.3; }
    else if (id === 'h_crown') { const r = HB(new THREE.CylinderGeometry(0.42, 0.38, 0.28, 16, 1, true), '#ffcf3a', { basic: true }); r.material.side = THREE.DoubleSide; g.add(r); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, c = HB(new THREE.ConeGeometry(0.09, 0.26, 6), '#ffd84a', { basic: true }); c.position.set(Math.cos(a) * 0.4, 0.26, Math.sin(a) * 0.4); g.add(c); const gm = HB(new THREE.SphereGeometry(0.06, 6, 4), k % 2 ? '#e0303a' : '#3a8aff', { basic: true }); gm.position.set(Math.cos(a) * 0.42, 0.02, Math.sin(a) * 0.42); g.add(gm); } }
    return g; }
  function catModel(tint) { const F = window.BM && BM.FX; if (!F || !F.cat) return null; const c = F.cat.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, Math.PI, 0); c.scale.setScalar(1); c.updateMatrixWorld(true); if (tint) c.traverse((q) => { if (q.isMesh) { const m = q.material.clone(); m.vertexColors = false; m.color = new THREE.Color(tint); m.needsUpdate = true; q.material = m; } }); return c; }
  function modelK(name, sc) { if (typeof MODELS === 'undefined' || !MODELS || !MODELS[name]) return null; const b = new Builder([]); b.add(MODELS[name], null, null, { crease: 0.6, vcol: true, vk: 1.05 }); const m = new THREE.Mesh(b.build(), bakedMat); m.scale.setScalar(sc); return m; }
  function droneMesh(name, col) { const g = new THREE.Group(); const m = modelK(name, 0.55); if (m) g.add(m); else { const b = HB(new THREE.CylinderGeometry(0.7, 0.45, 0.35, 16), '#c8ccd8'); g.add(b); const d = HB(new THREE.SphereGeometry(0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), col, { op: 0.7 }); d.position.y = 0.17; g.add(d); } const l = HB(new THREE.SphereGeometry(0.16, 8, 6), col, { basic: true }); l.position.y = -0.35; g.add(l); return g; }

  function apply() { try { if (window.BM && BM.granDress) BM.granDress(S.eq.outfit); } catch (e) {} const W = WD(); if (!W || !W.st) return;
    const L = (k) => S.lv[k] || 0;
    W.shopV = 1 + L('u_turbo') * 0.06; W.shopMag = 1 + L('u_magnet') * 0.3; W.shopDmg = 1 + L('u_salt') * 0.1; W.shopFuel = 1 - L('u_tank') * 0.15;
    const ah = L('u_armor') * 40, had = W.st.shopHull || 0; if (ah > had) { W.st.hullMax += ah - had; W.st.hull += ah - had; W.st.shopHull = ah; }
    W.paint = PAINT[S.eq.paint] || PAINT.p_classic; if (W.roverPaint && W.bodyMesh) { if (W._paintId !== S.eq.paint) { W.roverPaint(W.paint); W._paintId = S.eq.paint; } }
    // Гоша на крыше и шапка
    if (W.body) { if (S.eq.roofcat && S.own.roofcat) { if (!catG) { const c = catModel(); if (c) { catG = new THREE.Group(); const bb = new THREE.Box3().setFromObject(c), sz = bb.getSize(new THREE.Vector3()); const k = 1.15 / Math.max(0.01, sz.y); c.scale.multiplyScalar(k); c.position.y = -bb.min.y * k; catG.add(c); catG.userData.top = sz.y * k; catG.userData.front = bb.max.z * k; catG.position.set(-0.55, 2.56, 0.95); W.body.add(catG); } } }
      else if (catG) { W.body.remove(catG); catG = null; hatMesh = null; }
      if (catG) { if (hatMesh && hatMesh.userData.id !== S.eq.hat) { catG.remove(hatMesh); hatMesh = null; } if (S.eq.hat && !hatMesh) { hatMesh = makeHat(S.eq.hat); hatMesh.userData.id = S.eq.hat; hatMesh.scale.setScalar(0.62); hatMesh.position.set(0, catG.userData.top * 0.93, catG.userData.front * 0.55); catG.add(hatMesh); } } }
    // помощники
    for (const id of ['hp_vac', 'hp_fix', 'hp_musya', 'hp_valera']) { const on = S.own[id] && S.help[id]; if (on && !helpers[id]) helpers[id] = mkHelper(id); else if (!on && helpers[id]) { const h = helpers[id]; if (h.m.parent) h.m.parent.remove(h.m); delete helpers[id]; } }
  }
  function mkHelper(id) { const W = WD(); const h = { id, t: Math.random() * 3, cd: 0 };
    if (id === 'hp_vac') { h.m = droneMesh('r_craft_speederA', '#7fe8ff'); h.x = W.rover.x; h.z = W.rover.z; h.y = W.rover.y + 5; }
    else if (id === 'hp_fix') { h.m = droneMesh(MODELS && MODELS.k_craft_miner ? 'k_craft_miner' : 'r_craft_speederB', '#9aff8a'); h.x = W.rover.x; h.z = W.rover.z; h.y = W.rover.y + 5; h.lastHull = W.st.hull; h.calm = 0; }
    else if (id === 'hp_musya') { h.m = new THREE.Group(); const c = catModel('#4a4a56'); if (c) { const bb = new THREE.Box3().setFromObject(c), sz = bb.getSize(new THREE.Vector3()), k = 1.0 / Math.max(0.01, sz.y); c.scale.multiplyScalar(k); c.position.y = -bb.min.y * k; c.rotation.y = 0.6; h.m.add(c); } h.m.position.set(0.55, 2.78, -1.15); W.body.add(h.m); h.cd = 30; }
    else if (id === 'hp_valera') { h.m = new THREE.Group(); h.m.position.set(-0.45, 2.78, -1.35); h.m.rotation.y = Math.PI; W.body.add(h.m); if (window.BM && BM.monster) BM.monster('robot', 1.25).then((r) => { if (!helpers.hp_valera || helpers.hp_valera !== h) return; h.m.add(r); h.anim = r; const A = r.userData.acts, k = Object.keys(A).find((n) => /idle/i.test(n)) || Object.keys(A)[0]; h.clipIdle = k; h.clipHit = Object.keys(A).find((n) => /punch|attack|shoot|yes|wave/i.test(n)) || k; if (k) r.userData.play(k, 0); }).catch(() => {}); h.bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#9fe8ff', transparent: true, opacity: 0 })); h.bolt.frustumCulled = false; }
    return h; }

  function tick(dt) { const W = WD(); if (!W || !W.st || W.st.dead) return; const R = W.rover, sc = W.scene, hidden = W.foot || W.rd4;
    // выхлоп
    if (S.eq.exh && !hidden && Math.abs(R.v) > 2 && W.body) { exhT -= dt; if (exhT <= 0) { exhT = S.eq.exh === 'x_spark' ? 0.05 : 0.09; const s = Math.sin(R.h), c = Math.cos(R.h), x = R.x - s * 2.7 + c * 0.7, z = R.z - c * 2.7 - s * 0.7, y = R.y + 1.1;
      if (S.eq.exh === 'x_steam') burst(sc, x, y, z, 'smoke', '#f4f4f4', 2.2, 1.0);
      else if (S.eq.exh === 'x_heart') burst(sc, x, y, z, 'smoke', '#ff7ab8', 2.2, 1.1);
      else if (S.eq.exh === 'x_spark') burst(sc, x, y + Math.random() * 0.4, z, 'spark', Math.random() < 0.5 ? '#ffd24a' : '#ff9a3a', 1.1, 0.5);
      else if (S.eq.exh === 'x_rainbow') { rainbowK = (rainbowK + 1) % 6; burst(sc, x, y, z, 'smoke', ['#ff4a4a', '#ff9a3a', '#ffe14a', '#5ad85a', '#4aa8ff', '#a86aff'][rainbowK], 2.3, 1.2); } } }
    for (const id in helpers) { const h = helpers[id]; h.t += dt;
      if (id === 'hp_vac' || id === 'hp_fix') { if (h.m.parent !== sc) sc.add(h.m); h.m.visible = !W.foot || id === 'hp_fix';
        let tx = R.x + Math.sin(h.t * 0.9 + (id === 'hp_fix' ? 3 : 0)) * 5, tz = R.z + Math.cos(h.t * 0.9 + (id === 'hp_fix' ? 3 : 0)) * 5, ty = R.y + 5 + Math.sin(h.t * 2) * 0.4;
        if (id === 'hp_vac' && W.loot) { let best = null, bd = 30; for (const l of W.loot) { const d = Math.hypot(l.x - R.x, l.z - R.z); if (d < bd) { bd = d; best = l; } } if (best) { tx = best.x; tz = best.z; ty = W.H(best.x, best.z) + 2.2; if (Math.hypot(h.x - best.x, h.z - best.z) < 1.6) { const i = W.loot.indexOf(best); if (i >= 0) { W.loot.splice(i, 1); sc.remove(best.sp); W.give(best.res, best.n); burst(sc, best.x, ty, best.z, 'spark', '#7fe8ff', 1.4, 0.4); } } }
          if (W.gemList) for (const gm of W.gemList) { const d = Math.hypot(gm.x - h.x, gm.z - h.z); if (d < 9 && d > 0.1) { gm.x += (R.x - gm.x) * dt * 2.5; gm.z += (R.z - gm.z) * dt * 2.5; } } }
        if (id === 'hp_fix') { if (W.st.hull < h.lastHull - 0.01) h.calm = 0; else h.calm += dt; h.lastHull = W.st.hull; if (h.calm > 4 && W.st.hull < W.st.hullMax) { W.st.hull = Math.min(W.st.hullMax, W.st.hull + 2 * dt); h.lastHull = W.st.hull; tx = R.x; tz = R.z; ty = R.y + 4.2; if (Math.random() < dt * 6) burst(sc, R.x + (Math.random() - 0.5) * 2.5, R.y + 2.2, R.z + (Math.random() - 0.5) * 3, 'spark', '#9aff8a', 0.9, 0.35); } }
        const k = 1 - Math.exp(-dt * (id === 'hp_vac' ? 4 : 3)); h.x += (tx - h.x) * k; h.z += (tz - h.z) * k; h.y += (ty - h.y) * k; h.m.position.set(h.x, h.y, h.z); h.m.rotation.y = Math.atan2(tx - h.x, tz - h.z) || h.m.rotation.y; h.m.rotation.z = Math.sin(h.t * 3) * 0.08; }
      else if (id === 'hp_musya') { if (h.m.parent !== W.body) W.body.add(h.m); h.m.rotation.y = 0.6 + Math.sin(h.t * 0.7) * 0.4; if (Math.abs(R.v) > 3 && !hidden && !W.calm) { h.cd -= dt; if (h.cd <= 0) { h.cd = 55 + Math.random() * 15; if (Math.random() < 0.3) { W.give('parts', 1); W.toast('🐈‍⬛ Муся притащила деталь ⚙'); } else { const n = 60 + Math.round(Math.random() * 12) * 10; W.give('money', n); W.toast('🐈‍⬛ Муся нашла кошелёк: +' + n + ' ₽'); } } } }
      else if (id === 'hp_valera') { if (h.m.parent !== W.body) W.body.add(h.m); if (h.bolt.parent !== sc) sc.add(h.bolt); if (h.anim) h.anim.userData.mixer.update(dt); h.cd -= dt; h.bolt.material.opacity = Math.max(0, h.bolt.material.opacity - dt * 6);
        if (h.cd <= 0 && !hidden && !W.noFire && W.EN) { let best = null, bd = 24; for (const e of W.EN) { if (e.dead || e.st === 'buried' || e.immune) continue; const d = Math.hypot(e.x - R.x, e.z - R.z); if (d < bd) { bd = d; best = e; } }
          if (best) { h.cd = 1.4; const p = new THREE.Vector3(); h.m.getWorldPosition(p); p.y += 1.1; const q = new THREE.Vector3(best.x, best.y + (best.t ? best.t.h * 0.5 : 1), best.z); h.bolt.geometry.setFromPoints([p, p.clone().lerp(q, 0.33).add(new THREE.Vector3(0, 0.6, 0)), p.clone().lerp(q, 0.66).add(new THREE.Vector3(0.4, -0.4, 0)), q]); h.bolt.material.opacity = 1; burst(sc, q.x, q.y, q.z, 'spark', '#9fe8ff', 1.6, 0.35); snd('shot', { rate: 1.8, vol: 0.35 });
            W.hitEnemy(best, (4 + W.ch * 1.2) * (W.shopDmg || 1), (best.x - R.x) / (bd || 1) * 2, (best.z - R.z) / (bd || 1) * 2); if (h.anim && h.clipHit) { h.anim.userData.play(h.clipHit, 0.1); clearTimeout(h.tm); h.tm = setTimeout(() => h.anim && h.anim.userData.play(h.clipIdle, 0.3), 600); } } else h.cd = 0.3; } } }
  }

  /* ---------- подключение к экспедиции ---------- */
  function hook() { const W = WD(); if (!W || W._shopHooked) return; W._shopHooked = true;
    const s0 = W.onStart; W.onStart = function () { const r = s0 && s0.apply(this, arguments); try { apply(); } catch (e) { console.warn(e); } return r; };
    const d0 = W.director; W.director = function (dt) { d0 && d0(dt); try { tick(dt); } catch (e) { if (!tick.err) { tick.err = 1; console.warn(e); } } };
    // на рынке в городах — вход в магазин
    if (W.active) try { apply(); } catch (e) {} }
  hook();
  window.SHOP = { open, close, apply, hook, S, ITEMS };
})();
