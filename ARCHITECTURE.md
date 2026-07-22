# Архитектура — Исторически музей Лом

## Общ преглед
Едностраничен сайт (`index.html`) с inline CSS/JS. Съдържанието на секциите
(отдели, експозиции, хронология) изглежда вградено директно в markup/скрипта.
От версията с `server/` насам има и минимален реален backend (Express +
SQLite) — виж [`## Backend`](#backend) по-долу. Новини/събития/часове/
контакти/находки/изложби продължават да се управляват изцяло client-side
(localStorage) — умишлено извън обхвата на backend-а засега.

## Backend
`server/` съдържа Express + SQLite (`better-sqlite3`) сървър, чиято
отговорност е ограничена до три неща, които реално се демонстрираха като
уязвими, докато бяха client-side (виж `SECURITY.md`):

| Endpoint | Отговорност |
|---|---|
| `POST /api/login` | `{password}` → bcrypt сравнение спрямо `admin` таблицата → при успех `req.session.isAdmin = true` (httpOnly cookie), 401 при неуспех |
| `POST /api/logout` | Унищожава сървърната сесия (викан от `closeAdminPanel()` — бутонът "✕ ИЗХОД") |
| `GET /api/session` | `{isAdmin: bool}` — единствен източник на истина дали има валидна admin сесия |
| `POST /api/change-password` | Само за `isAdmin` сесия — bcrypt проверка на старата парола, презаписва hash-а |
| `GET/PUT /api/settings/:key` | `GET` е публичен (напр. активния дизайн темплейт се чете от всеки визитьор); `PUT` изисква `isAdmin` |
| `GET /api/ai/status` | Публично — само дали `ANTHROPIC_API_KEY` е конфигуриран, никога самия ключ |
| `POST /api/ai/chat` | Публичен (визитьорският AI чат "Алмус"), с прост in-memory rate limit — проксира към Anthropic с ключа от `process.env` |
| `POST /api/ai/generate` | Само за `isAdmin` — admin AI генераторът на съдържание, същия proxy механизъм |
| `POST /api/test/reset` | Само когато `NODE_ENV=test` — връща SQLite-то (in-memory в test режим) към default seed |
| `GET /` | Сервира `index.html` — **инжектира `[data-template]` server-side (SSR)** спрямо запазения в SQLite темплейт, за да няма "проблясване" при зареждане |

Anthropic API ключът живее само в `server/.env` — клиентът никога не го
вижда, нито го пази. Дизайн темплейтът (виж по-долу) вече е сървърен
`settings` запис, не localStorage — реално сайт-широк, не per-browser.

## Основни UI компоненти
| Компонент | Отговорност |
|---|---|
| `nav` (`scroll2(id)`) + `nav-toggle` | Навигация между 8 секции (7 постоянни + условно "Събития"), mobile меню |
| `theme-toggle` | Превключване light/dark тема, персистира в `localStorage['muzei-theme']` |
| `tts-lang-select` + TTS логика | Избор на език и четене на съдържание на глас |
| `tl-slider` (Хронология) | Интерактивна времева линия, `setEra(idx)` за 6 позиции (0-5) |
| Almus 3D (`window.almus3D`) | 3D изглед с `setView()`/`highlight()`/`openFullscreen()` |
| `dept-card` (Отдели, `openDept(idx)`) | Модал (`#dmodal`) с артефакти + исторически личности (вкл. биографии на Маринов/Пишурка) |
| `almus-chat` — AI гид "Алмус" | Чат с Anthropic Claude API (`sendMessage()`) през сървърния proxy `/api/ai/chat` — ключът живее само в `server/.env` |
| `share-anchor-btn` (`shareSection()`) | Копира линк с `#section` фрагмент в клипборда |
| `events-grid` / `nav-events-link` | Секция "Събития" — видима само ако има активни записи |
| `news-list` | Секция "Новини и съобщения" |
| PWA install banner (`pwa-banner`) | Промпт за инсталиране като PWA |
| Интерактивна римска карта (`mapSvg`, provinces) | Карта на провинциите на Римската империя |
| Музейна карта (`museum-map`, zoom controls) | Отделна zoom-ируема карта на музея |
| Admin панел (`admin-panel`, табове) | CRUD за новини/събития/изложби/находки/часове/контакти (localStorage) + смяна на парола (server-side) + AI генератор на съдържание (`runAiGenerate()`, server-side proxy) |
| Дизайн шаблони (admin таб "Дизайн") | 6 готови визуални теми (по мотив на 6-те епохи от Хронологията), всяка с dark/light вариант; `selectTemplate(key)` задава `[data-template]` на `<html>` и персистира сайт-широко |

## Дизайн шаблони — архитектура
Цветовата система е изцяло CSS variable-driven (`--gold`, `--gold-l`,
`--dark`/`--dark2`/`--dark3`, `--cream`/`--cream2`, `--text` за тъмен режим;
`--light-accent*`, `--light-heading`, `--light-body`, `--light-surface*`,
`--light-bg` за светъл режим — виж `:root` в `<style>`). Всеки от 6-те
темплейта (`html[data-template="X"]`) предефинира само тези променливи;
`--light-heading/body/surface*` остават универсални (неутрални) за
четимост във всички темплейти. "roman" е default темплейтът (стойностите
му са директно в `:root`, без нужда от override).

Активният темплейт се пази сайт-широко (не per-visitor) в SQLite
(`settings` таблица, ключ `template`) — реално споделено между всички
визитьори, за разлика от предишна localStorage версия, която изглеждаше
"сайт-широка", но реално беше per-browser. Прилага се сървър-странно
(SSR, `GET /` в `server/server.js` инжектира `data-template="X"` в
`<html>` тага при отговора), за да няма "проблясване" на грешна тема —
не чрез client-side `<script>`, за да се избегне async fetch преди paint.

**Забележка:** `theme-toggle` (light/dark) е ортогонален, per-visitor
избор (`localStorage['muzei-theme']`) — независим от избрания дизайн
темплейт. Двата механизма комбинират свободно (всеки темплейт работи в
двата режима).

## Роли
- **Посетител** — разглежда всички публични секции, ползва AI чата (винаги
  достъпен, ако сървърът има конфигуриран `ANTHROPIC_API_KEY`).
- **Admin** — единствената защитена роля; вход през `POST /api/login`
  (bcrypt сравнение server-side), сесията живее в httpOnly cookie.
  `#admin-nav-btn` вика `handleAdminNavClick()`, който първо проверява
  `GET /api/session` — при вече валидна сесия отваря панела директно,
  иначе показва login формата (`fail-closed` при грешка в заявката).

Няма междинни роли (за разлика от др. проекти в това repo) — само тези две
нива на достъп. За разлика от старата версия, ролята/сесията вече не може
да бъде задавана от клиента по никакъв начин (виж поправения bypass в
`SECURITY.md`).

## Препоръки за бъдещо развитие
- Ако броят на отделите/експозициите расте, обмисли извеждане на данните в
  отделен JSON файл вместо вградени в скрипта — по-лесна поддръжка за не-разработчик.
- 3D Алмус логиката (`almus3D`) е добър кандидат за самостоятелен модул/файл,
  ако продължи да се разраства.
