# Источники моделей и звуков

Модели распространяются по лицензии **CC0 1.0** (общественное достояние): можно использовать в коммерческих проектах без указания авторства. Авторов всё равно указываем — это честно и помогает им.

| Что | Автор | Набор | Лицензия |
| --- | --- | --- | --- |
| Жилые модули, гараж, модуль с золотым куполом (дом внуков), склады, бочки, буровая, посадочная площадка и аппарат, солнечные панели, ветряк, космогрузовики, камни, фонари (`assets/kaykit.bin`) | Kay Lousberg | [KayKit Space Base Bits](https://kaylousberg.itch.io/space-base-bits) ([GitHub](https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0)) | CC0 1.0 |

Бабуля, дед, кресло, люлька, жуки, дорога, теплицы и трубопровод — свои процедурные модели.

## Что изменено
- Отобрано 26 моделей из 57 (список — `assets/kaykit.json`), они упакованы в один файл `assets/kaykit.bin`: координаты сжаты до 16 бит, цвета из общей текстуры набора перенесены в цвета вершин (текстура не скачивается).
- В игре модели вписываются в мир участками и получают запечённый свет (фонари, окна, закат), как остальной мир.

## Звуки (`assets/sfx/`)

| Что | Автор | Набор | Лицензия |
| --- | --- | --- | --- |
| Кнопки, карта, находки, «попалась» | Kenney | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | CC0 1.0 |
| Удары, шлепки тапком, банки, шаги, бур | Kenney | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | CC0 1.0 |
| Турбина кресла, мотор Танка, турбо, метеорит, выстрел солью | Kenney | [Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) | CC0 1.0 |
| Картошка, турбо-занос, прыжок Зорьки, улов, урожай | Kenney | [Digital Audio](https://kenney.nl/assets/digital-audio) | CC0 1.0 |
| Перезарядка, осечка, дверь сарая, монеты | Kenney | [RPG Audio](https://kenney.nl/assets/rpg-audio) | CC0 1.0 |
| Звон копилки | Kenney | [Casino Audio](https://kenney.nl/assets/casino-audio) | CC0 1.0 |
| Джинглы: старт миссии, победа, проигрыш, босс | Kenney | [Music Jingles](https://kenney.nl/assets/music-jingles) | CC0 1.0 |

Звуки обрезаны, переведены в моно 22 кГц и сжаты в MP3 (46 файлов, ≈ 210 КБ). Фоновая музыка своя — её играет код игры (Web Audio), файлов нет. Пак UI Audio скачан, но пока не используется.

## Модели Kenney (`assets/kn_space.bin`, `assets/kn_dacha.bin`)

| Что | Набор | Лицензия |
| --- | --- | --- |
| Ангары, антенны, марсоходы, грузовые корабли, кратеры, метеориты, кристаллы, астронавты, пришелец, ракета на космодроме | [Space Kit](https://kenney.nl/assets/space-kit) | CC0 1.0 |
| Конусы у дороги, трактор у дачи | [Car Kit](https://kenney.nl/assets/car-kit) | CC0 1.0 |
| Забор с калиткой, грядки кукурузы, тыквы и дыни, кусты, цветы, кактусы, камни, дрова | [Nature Kit](https://kenney.nl/assets/nature-kit) | CC0 1.0 |
| Бочки, ведро, лопата, тяпка, верстак, ящики, сундук, указатель | [Survival Kit](https://kenney.nl/assets/survival-kit) | CC0 1.0 |
| Лавочка, стол, цветок в горшке, коробка | [Furniture Kit](https://kenney.nl/assets/furniture-kit) | CC0 1.0 |
| Банки варенья, клубника, тыква, капуста | [Food Kit](https://kenney.nl/assets/food-kit) | CC0 1.0 |
| Домик соседки Вали, клумбы, дорожка | [City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) | CC0 1.0 |
| Полярные медведи, цыплята, Зорька («корова» с рожками) | [Cube Pets](https://kenney.nl/assets/cube-pets) | CC0 1.0 |

Автор всех наборов — Kenney (kenney.nl). Модели упакованы тем же способом, что и KayKit: цвета материалов и общей текстуры перенесены в цвета вершин, координаты сжаты до 16 бит.

## Интерфейс и частицы
- Дым, искры, вспышка выстрела (`assets/fx/`) — [Particle Pack](https://kenney.nl/assets/particle-pack), CC0.
- Значки кнопок звука и итогов (`assets/ui/*.png`) — [Game Icons](https://kenney.nl/assets/game-icons), CC0.
- Цифры на спидометре, таймере и счётчике — шрифт Kenney Future из [Kenney Fonts](https://kenney.nl/assets/kenney-fonts), CC0 (оставлены только цифры: кириллицы в шрифтах Kenney нет).
- Скачаны, но пока не используются: UI Pack, UI Pack (Space Expansion), UI Audio.

## Модели Quaternius (quaternius.com), CC0 1.0

| Что | Набор | Где в игре |
| --- | --- | --- |
| Растения по стадиям роста (свёкла, ягодный куст, салат-капуста, морковь), тыква, арбуз, кукуруза, кактусы (`assets/qt_crops.bin`) | Ultimate Crops | грядки огорода |
| Курятник, сарай, мельница (`assets/qt_crops.bin`) | Farm Buildings | дача |
| Рыбы: золотая рыбка, удильщик, луциан, гоблин-акула, фугу, панцирный сом (`assets/qt_fish.bin`) | Cute Fish | улов на рыбалке |
| Корабли (`assets/qt_ships.bin`) | Spaceships | пролёты над трассой, корабль на космодроме |
| Анимированные: курица, кактусёнок, пришелец-слизень, голубь, Йети (`assets/mon/`) | Ultimate Monsters | куры, голуби, «местные» у дороги, Йети в обороне |
| Анимированные колонисты: рабочий, начальник в костюме, доктор, дама, ковбой | Ultimate Animated Character Pack | болельщики у дороги |
| Анимированный пришелец (хлопает) | Animated Alien | болельщик у дороги |
| Свинья, овца, лама с анимацией | Farm Animal Pack | дача |

Как обработаны: лишние анимации удалены, цвета материалов и атласа перенесены в цвета вершин, части модели склеены в одну (один вызов отрисовки), координаты сжаты (KHR_mesh_quantization). Модели из FBX сконвертированы в glTF. Робот (Animated Robot) — регистратор Валерий в поликлинике. Интерьер поликлиники — Kenney Furniture Kit и Space Kit (`assets/kn_clinic.bin`). Офис «ТрансМарса» — Kenney Furniture Kit и Space Kit (`assets/kn_office.bin`), начальник и Димон — Quaternius Ultimate Animated Character. Рынок «Красная пыль» — Kenney Survival Kit, Food Kit, Furniture Kit, Space Kit (`assets/kn_market.bin`); роботы-покупатели — Animated Robot (добавлена анимация ходьбы), покупатели — Ultimate Monsters и Ultimate Animated Character.
