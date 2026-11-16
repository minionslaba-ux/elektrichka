# Ассеты «Бабули на Марсе» (репозиторий elektrichka) — что может пригодиться «Ночному тарифу»

Список собран 16.11.2026 по просьбе владельца для сессии «Ночного тарифа». Файлы никуда не копировались — брать из этого репозитория.

## Коротко про лицензии
- **Все модели из паков — CC0 1.0** (Kenney, Quaternius, KayKit от Kay Lousberg). Их можно использовать в другой игре и продавать; подпись автора не обязательна, но желательна. Ссылки на наборы — в `CREDITS.md`.
- **Звуки — Kenney, CC0 1.0**: свободно, в том числе в коммерческой игре.
- **Шрифт Kenney Future** (`assets/ui/kfuture.woff2`) — CC0. В файле оставлены только цифры: кириллицы в шрифтах Kenney нет.
- **Своё** (процедурные модели, музыка кодом, планеты в небе, упаковщик) сделано для проекта владельца с помощью Claude. Принадлежит владельцу, использовать в «Ночном тарифе» можно без ограничений.

## Важно про разнобой стиля (замечание игроков Пикабу)
Всё ниже — один стиль: низкополигональные модели **без текстур**, цвет записан в вершинах (у Kenney и KayKit — из общей текстуры-палитры, у Quaternius — из цветов материалов). Поэтому машины, здания, люди и мелочи смотрятся одним набором.

**Для города «Ночного тарифа» в этом репозитории готового мало.** Тут космос, дача и Марс; из городского есть только один дом (`c_building-type-a`), конусы, трактор и несколько транспортных моделей. Если нужен целый город в том же стиле, лучше взять полные наборы Kenney — тоже CC0 и в той же манере:
- City Kit (Commercial, Suburban, Roads, Industrial);
- **Car Kit** — седаны, такси, полиция, грузовики, около 20 машин;
- Modular Buildings.

Модели Kenney сделаны в одном масштабе и одной палитрой, поэтому такси и город из них будут «из одной игры».

## Формат упакованных моделей (`assets/*.bin` + `assets/*.json`)
- Свой формат: в `.json` для каждой модели — смещения и число вершин и индексов, границы для разжатия; в `.bin` — координаты, сжатые до 16 бит, нормали и цвета вершин.
- Читает функция `decodePack` в `index.html` (ищите `const getPack =`).
- Как упаковывали из исходников (GLB → цвет в вершины): `docs/obnovleniya.md` и `CREDITS.md`.
- Чтобы взять модель в другую игру, проще всего скачать исходный пак по ссылке из `CREDITS.md` (там GLB/FBX/OBJ).

## Модели из паков (CC0)

| Файл | Что внутри | Моделей | Треугольников всего | Размер | Источник |
|---|---|---|---|---|---|
| `assets/kaykit.bin` + `.json` | Жилые модули  гараж  склады  бочки  буровая  посадочная площадка  солнечные панели  ветряк  космогрузовики (spacetruck)  камни  фонари | 26 | 15 510 | 380 КБ | KayKit Space Base Bits (Kay Lousberg) |
| `assets/kn_space.bin` + `.json` | Ангары  антенны  марсоход (k_rover)  грузовые корабли  кратеры  метеориты  кристаллы  астронавты  пришелец  ракета из трёх частей  конус (a_cone) | 28 | 6 185 | 357 КБ | Kenney Space Kit (+ Car Kit: a_cone) |
| `assets/kn_run.bin` + `.json` | Ховербайки и гоночные машинки (r_craft_*)  грузовая баржа  турели  бочки  трубы  рампа  платформы  ворота  опоры  ракета  тарелка | 27 | 7 420 | 464 КБ | Kenney Space Kit |
| `assets/kn_dacha.bin` + `.json` | Дача: забор  калитка  грядки  овощи  кусты  цветы  камни  дрова  палатки  костёр  инструменты  бочки  ящики  мебель  **дом (c_building-type-a)**  **трактор (a_tractor)**  корова/курица/медведь (Cube Pets) | 65 | 13 861 | 407 КБ | Kenney Nature / Survival / Furniture / Food / City Kit (Suburban) / Cube Pets / Car Kit (a_tractor) |
| `assets/kn_market.bin` + `.json` | Рынок: прилавки  тенты  ящики  бочки  фрукты и овощи  указатель | 27 | 4 227 | 129 КБ | Kenney Survival / Food / Furniture / Space Kit |
| `assets/kn_office.bin` + `.json` | Офис: столы  кресла  компьютеры  шкафы  кофемашина  стены с окнами и дверями | 24 | 3 592 | 132 КБ | Kenney Furniture Kit + Space Kit |
| `assets/kn_clinic.bin` + `.json` | Поликлиника: стены  двери  мебель  ковёр  телевизор  колонка | 23 | 2 670 | 112 КБ | Kenney Furniture Kit + Space Kit |
| `assets/mars_mon.bin` + `.json` | Монстры (без анимации  статичные): жуки  слизни  призрак  дракон  ящер  гриб-король и др. | 14 | 19 500 | 258 КБ | Quaternius Ultimate Monsters |
| `assets/qt_crops.bin` + `.json` | Растения по стадиям роста  тыква  арбуз  кукуруза  кактусы  курятник  сарай  мельница | 28 | 13 414 | 550 КБ | Quaternius Ultimate Crops + Farm Buildings |
| `assets/qt_fish.bin` + `.json` | Рыбы: удильщик  акула-гоблин  сом  фугу и др. | 8 | 10 526 | 431 КБ | Quaternius Cute Fish |
| `assets/qt_ships.bin` + `.json` | 5 космических кораблей | 5 | 3 404 | 139 КБ | Quaternius Spaceships |

### Транспорт (интересно для «Ночного тарифа»): треугольники каждой модели

| Модель | Файл | Треугольников |
|---|---|---|
| `lander_A` | `assets/kaykit` | 1464 |
| `spacetruck` | `assets/kaykit` | 1118 |
| `spacetruck_large` | `assets/kaykit` | 1434 |
| `k_rover` | `assets/kn_space` | 172 |
| `k_craft_cargoA` | `assets/kn_space` | 264 |
| `k_craft_miner` | `assets/kn_space` | 384 |
| `a_cone` | `assets/kn_space` | 172 |
| `r_craft_speederA` | `assets/kn_run` | 280 |
| `r_craft_speederB` | `assets/kn_run` | 270 |
| `r_craft_speederC` | `assets/kn_run` | 292 |
| `r_craft_speederD` | `assets/kn_run` | 322 |
| `r_craft_racer` | `assets/kn_run` | 280 |
| `r_craft_cargoB` | `assets/kn_run` | 380 |
| `c_building-type-a` | `assets/kn_dacha` | 1174 |
| `a_tractor` | `assets/kn_dacha` | 2044 |
| `s_Spaceship` | `assets/qt_ships` | 540 |
| `s_Spaceship2` | `assets/qt_ships` | 628 |
| `s_Spaceship3` | `assets/qt_ships` | 1190 |
| `s_Spaceship4` | `assets/qt_ships` | 456 |
| `s_Spaceship5` | `assets/qt_ships` | 590 |

### Полный список моделей по файлам

- **`assets/kaykit`**: `basemodule_A` (586), `basemodule_B` (620), `basemodule_C` (644), `basemodule_D` (780), `basemodule_E` (732), `basemodule_garage` (770), `cargo_A_stacked` (488), `cargo_B_stacked` (488), `containers_A` (280), `containers_B` (280), `containers_C` (280), `cargodepot_A` (924), `drill_structure` (1198), `lander_A` (1464), `landingpad_large` (478), `solarpanel` (118), `roofmodule_solarpanels` (284), `windturbine_tall` (632), `spacetruck` (1118), `spacetruck_large` (1434), `rocks_A` (88), `rocks_B` (160), `rock_A` (30), `lights` (356), `structure_tall` (670), `tunnel_straight_A` (608)
- **`assets/kn_space`**: `k_hangar_largeA` (412), `k_hangar_roundA` (166), `k_hangar_smallA` (280), `k_hangar_roundGlass` (113), `k_satelliteDish_large` (186), `k_satelliteDish` (274), `k_machine_generator` (406), `k_machine_wireless` (174), `k_rover` (172), `k_craft_cargoA` (264), `k_craft_miner` (384), `k_crater` (60), `k_craterLarge` (60), `k_meteor_detailed` (196), `k_rock_crystalsLargeA` (384), `k_rock_crystals` (364), `k_rocks_smallA` (60), `k_rock_largeA` (176), `k_platform_large` (76), `k_astronautA` (296), `k_astronautB` (314), `k_alien` (292), `k_barrels` (268), `k_machine_barrelLarge` (192), `k_rocket_baseA` (300), `k_rocket_fuelA` (94), `k_rocket_topA` (50), `a_cone` (172)
- **`assets/kn_run`**: `r_craft_speederA` (280), `r_craft_speederB` (270), `r_craft_speederC` (292), `r_craft_speederD` (322), `r_craft_racer` (280), `r_craft_cargoB` (380), `r_turret_single` (576), `r_turret_double` (876), `r_barrel` (56), `r_barrels_rail` (428), `r_pipe_straight` (80), `r_pipe_ring` (144), `r_pipe_rampLarge` (160), `r_bones` (168), `r_rock_largeB` (172), `r_satelliteDish_detailed` (390), `r_machine_wirelessCable` (282), `r_structure_diagonal` (344), `r_gate_complex` (460), `r_platform_high` (236), `r_supports_high` (312), `r_corridor_detailed` (164), `r_platform_long` (76), `r_monorail_trackSupport` (176), `r_rocket_baseB` (284), `r_rocket_fuelB` (130), `r_rocket_topB` (82)
- **`assets/kn_dacha`**: `n_fence_planks` (96), `n_fence_gate` (524), `n_fence_simple` (64), `n_crop_carrot` (148), `n_crop_pumpkin` (120), `n_crop_turnip` (168), `n_crop_melon` (236), `n_crops_cornStageD` (300), `n_crops_leafsStageB` (84), `n_plant_bushLarge` (60), `n_plant_bush` (32), `n_flower_redA` (76), `n_flower_yellowA` (76), `n_flower_purpleA` (76), `n_rock_largeA` (80), `n_rock_smallA` (16), `n_rock_tallA` (136), `n_log_stack` (184), `n_pot_large` (68), `n_stump_round` (56), `n_mushroom_redGroup` (144), `n_cactus_tall` (122), `n_cactus_short` (116), `n_grass_large` (224), `n_tent_detailedOpen` (232), `s_barrel` (412), `s_barrel-open` (380), `s_box-large` (124), `s_box` (124), `s_bucket` (68), `s_tool-shovel` (124), `s_tool-hoe` (58), `s_workbench` (236), `s_signpost` (44), `s_chest` (322), `s_structure-metal` (184), `s_resource-wood` (64), `s_campfire-fishing-stand` (100), `s_campfire-pit` (305), `s_fish` (233), `s_fish-large` (233), `s_tent-canvas` (148), `s_tent` (124), `f_bench` (170), `f_table` (120), `f_chair` (170), `f_pottedPlant` (60), `f_cardboardBoxClosed` (60), `o_strawberry` (156), `o_cabbage` (140), `o_carrot` (148), `o_pumpkin` (188), `o_tomato` (132), `o_honey` (140), `o_can` (156), `o_apple` (136), `o_beet` (100), `c_building-type-a` (1174), `c_fence-1x3` (204), `c_planter` (204), `c_path-stones-long` (48), `p_animal-polar` (522), `p_animal-chick` (490), `p_animal-cow` (578), `a_tractor` (2044)
- **`assets/kn_market`**: `m_structure-canvas` (96), `m_structure` (80), `m_box-large` (124), `m_box` (124), `m_barrel` (412), `m_barrel-open` (380), `m_signpost` (44), `m_tent-canvas` (148), `m_pumpkin` (188), `m_cabbage` (140), `m_carrot` (148), `m_tomato` (132), `m_apple` (136), `m_strawberry` (156), `m_honey` (140), `m_can` (156), `m_beet` (100), `m_bread` (116), `m_fish` (233), `m_banana` (104), `m_corn` (128), `m_table` (120), `m_tableCloth` (144), `m_stoolBar` (176), `m_machine_wireless` (174), `m_barrels` (268), `m_rocks_smallA` (60)
- **`assets/kn_office`**: `o_wall` (12), `o_wallWindow` (108), `o_wallDoorway` (60), `o_wallCorner` (28), `o_desk` (198), `o_deskCorner` (250), `o_chairDesk` (588), `o_computerScreen` (72), `o_computerKeyboard` (32), `o_laptop` (68), `o_kitchenCoffeeMachine` (166), `o_bookcaseOpen` (320), `o_pottedPlant` (60), `o_plantSmall1` (102), `o_trashcan` (68), `o_loungeSofa` (128), `o_tableCoffee` (124), `o_televisionModern` (72), `o_cardboardBoxClosed` (60), `o_coatRackStanding` (190), `o_lampSquareFloor` (60), `o_kitchenFridgeSmall` (152), `o_machine_generator` (406), `o_barrels` (268)
- **`assets/kn_clinic`**: `c_wall` (12), `c_wallWindow` (108), `c_wallDoorway` (60), `c_wallCorner` (28), `c_floorFull` (12), `c_doorway` (188), `c_benchCushion` (196), `c_chairModernCushion` (92), `c_desk` (198), `c_computerScreen` (72), `c_pottedPlant` (60), `c_plantSmall2` (158), `c_coatRackStanding` (190), `c_trashcan` (68), `c_lampSquareFloor` (60), `c_rugRectangle` (28), `c_televisionModern` (72), `c_sideTable` (118), `c_bookcaseClosed` (372), `c_speaker` (228), `c_desk_computer` (88), `c_desk_chair` (88), `c_machine_wireless` (174)
- **`assets/mars_mon`**: `m_armabee` (666), `m_armabee_evolved` (910), `m_dino` (1893), `m_dragon` (1368), `m_ghost` (838), `m_glub` (857), `m_goleling` (1014), `m_greenspikyblob` (1778), `m_hywirl` (1004), `m_mushnub` (1010), `m_mushroomking` (2830), `m_orc_skull` (3312), `m_pinkblob` (914), `m_squidle` (1106)
- **`assets/qt_crops`**: `q_Beet_1` (121), `q_Beet_2` (217), `q_Beet_3` (323), `q_Beet_4` (480), `q_Beet_Crop` (165), `q_BushBerries_1` (88), `q_BushBerries_2` (140), `q_BushBerries_3` (164), `q_BushBerries_4` (892), `q_BushBerries_Crop` (48), `q_Lettuce_1` (88), `q_Lettuce_2` (400), `q_Lettuce_3` (612), `q_Lettuce_4` (1392), `q_Lettuce_Crop` (112), `q_Carrot_1` (88), `q_Carrot_2` (262), `q_Carrot_3` (408), `q_Carrot_4` (514), `q_Carrot_Crop` (186), `q_Pumpkin_Crop` (396), `q_Watermelon_Crop` (220), `q_Corn_4` (958), `q_Cactus_Crop` (256), `q_Cactus_3` (320), `b_ChickenCoop` (948), `b_SmallBarn` (2176), `b_Windmill` (1440)
- **`assets/qt_fish`**: `f_Goldfish` (1590), `f_Anglerfish` (1880), `f_RedSnapper` (1416), `f_GoblinShark` (1270), `f_Puffer` (2142), `f_ArmoredCatfish` (1466), `f_FishingRod_Lvl2` (522), `f_Worm` (240)
- **`assets/qt_ships`**: `s_Spaceship` (540), `s_Spaceship2` (628), `s_Spaceship3` (1190), `s_Spaceship4` (456), `s_Spaceship5` (590)

## Анимированные персонажи и животные (`assets/mon/*.glb`, Quaternius, CC0)

GLB со скелетом и анимациями. Цвет — в вершинах, части склеены (один вызов отрисовки), координаты сжаты (KHR_mesh_quantization). Люди подойдут как прохожие и пассажиры: они в том же лоу-поли стиле.

| Файл | Треугольников | Размер | Анимации | Набор |
|---|---|---|---|---|
| `assets/mon/alien.glb` | 2616 | 64 КБ | Dance, Idle, Jump, Walk, Yes | Ultimate Monsters |
| `assets/mon/cactoro.glb` | 2388 | 68 КБ | Dance, Idle, Jump, Walk, Yes | Ultimate Monsters |
| `assets/mon/chicken.glb` | 2904 | 66 КБ | Bite_Front, Idle, Jump, Walk | Ultimate Monsters |
| `assets/mon/h_cowboy_male.glb` | 3176 | 247 КБ | Defeat, Idle, Run, Victory, Walk | Ultimate Animated Character Pack |
| `assets/mon/h_dimon.glb` | 6492 | 323 КБ | Defeat, Idle, Victory, Walk | Ultimate Animated Character Pack (перекрашен — «Димон») |
| `assets/mon/h_doctor_female_old.glb` | 6790 | 352 КБ | Defeat, Idle, Run, Victory, Walk | Ultimate Animated Character Pack |
| `assets/mon/h_oldclassy_female.glb` | 7008 | 363 КБ | Defeat, Idle, Run, Victory, Walk | Ultimate Animated Character Pack |
| `assets/mon/h_suit_male.glb` | 6518 | 343 КБ | Defeat, Idle, Run, Victory, Walk | Ultimate Animated Character Pack |
| `assets/mon/h_worker_male.glb` | 2524 | 220 КБ | Defeat, Idle, Run, Victory, Walk | Ultimate Animated Character Pack |
| `assets/mon/llama.glb` | 662 | 100 КБ | Jump, Idle | Farm Animal Pack |
| `assets/mon/marsian.glb` | 3780 | 369 КБ | Alien_Idle, Alien_Jump, Alien_Clapping, Alien_Walk | Animated Alien |
| `assets/mon/pig.glb` | 562 | 97 КБ | Jump, Idle | Farm Animal Pack |
| `assets/mon/pigeon.glb` | 3512 | 91 КБ | Fast_Flying, Flying_Idle | Farm Animal Pack |
| `assets/mon/robot.glb` | 3238 | 360 КБ | Robot_No, Robot_Dance, Robot_Idle, Robot_Yes, Robot_Wave, Robot_Walking, Robot_ThumbsUp | Animated Robot (+ своя анимация ходьбы) |
| `assets/mon/sheep.glb` | 612 | 98 КБ | Jump, Idle | Farm Animal Pack |
| `assets/mon/yeti.glb` | 6094 | 236 КБ | Death, HitReact, Run, Walk, Wave | Ultimate Monsters |

## Звуки (`assets/sfx/`, 46 MP3, ≈ 300 КБ, Kenney, CC0)
- Моно 22 кГц, MP3. Состав по наборам — в `CREDITS.md`: Interface, Impact, Sci-Fi, Digital Audio, RPG Audio, Casino Audio, Music Jingles.
- Для «Ночного тарифа» полезны: удары, выстрел, мотор/турбо (Sci-Fi), монеты, джинглы победы, проигрыша и босса.

## Частицы и интерфейс
- `assets/fx/smoke.png`, `spark.png`, `muzzle.png` — дым, искры, вспышка выстрела (Kenney Particle Pack, CC0).
- `assets/ui/*.png` — значки звука, меню, «ещё раз» (Kenney Game Icons, CC0).
- `assets/ui/kfuture.woff2` — шрифт Kenney Future, только цифры (CC0).

## Сделано своими руками для проекта (код, файлов-моделей нет)
Всё собрано в браузере из простых фигур (кубы, цилиндры, шары) с цветом в вершинах. Значит, рисуется в том же стиле, что паки Kenney.
- `index.html`: бабуля, дед, турбо-кресло, люлька, жуки, дорога, теплицы, трубопровод, общий «сборщик» моделей `Builder` и функции `mat()` / `bakedMat` (запечённый свет в цвете вершин — без динамических теней, быстро на слабых телефонах).
- `assets/world.js`: марсоход «Буханка» (корпус, турель, колёса со спицами — колёса одним InstancedMesh), небо-купол Марса; планеты в небе с запечённым светом — Юпитер, Сатурн с кольцами, Земля с облаками и сиянием; облака из шаров; рельсы со шпалами; трамплин.
- `assets/world3.js`: дирижабль, баллон, щупальце, робот-коллектор, червь, перекати-поле, поезд с ракетой на платформах.
- **Музыка** — своя, играет код (Web Audio, `index.html`), файлов нет.
- Владельцу может пригодиться приём «модель → цвет в вершинах → один буфер на набор + InstancedMesh»: один вызов отрисовки на сотни одинаковых объектов. Для слабых телефонов «Ночного тарифа», у которых узкое место — подготовка кадра, это прямой выигрыш.

