# Исторически музей — Лом | 100 години памет

Едностраничен уебсайт на Историческия музей в Лом с раздели: За нас, Алмус
(Almus), Хронология (интерактивна времева линия), 3D Алмус изглед, Отдели,
Експозиции, Събития (условно видими) и Посещение. Включва тъмна/светла тема,
text-to-speech четене на съдържание и admin панел за управление.

## Функционалности
- Плавна навигация между секции (desktop + mobile меню)
- Тъмна/светла тема (theme toggle)
- Text-to-Speech с избор на език
- Интерактивна времева линия (timeline slider)
- 3D изглед на Алмус (множество ъгли + fullscreen)
- Карти на отдели и експозиции с детайлна информация
- Споделяне на секции (copy link)
- Admin панел за управление на съдържание
- 6 готови дизайн шаблона (по мотив на епохите от Хронологията), всеки с
  dark/light вариант — превключват се от admin панела (таб "Дизайн") и
  важат сайт-широко за всички посетители

## Стартиране
От версия с `server/` насам сайтът има реален backend (Express + SQLite) —
виж [`ARCHITECTURE.md`](ARCHITECTURE.md#backend) за защо (admin auth и AI
API ключ вече не са client-side).

**Пълно приложение (admin login + AI чат работят):**
```
cd server
npm install
cp .env.example .env   # попълни ANTHROPIC_API_KEY за AI функциите
npm start
```
Отвори `http://localhost:3001`.

**Само статичен preview (без auth/AI — само за бърз преглед на дизайна):**
```
npx serve .
```

## Структура
Виж [`ARCHITECTURE.md`](ARCHITECTURE.md).

## QA / Тестване
Виж [`qa-docs/`](qa-docs/) за test plan и ръчни тест кейсове.

Автоматизирани E2E тестове (Playwright) в [`tests/`](tests/):
```
npm install
npx playwright install chromium
npm test
```

## Принос
Виж [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Сигурност
Виж [`SECURITY.md`](SECURITY.md).
