# Changelog

Форматът следва приблизително [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
### Security
- **Критично:** видимият `#admin-nav-btn` ("ADMIN" бутон в header-а) викаше
  `openAdminPanel()` директно, без изобщо да минава login gate-а — всеки
  посетител е влизал в admin панела само с едно кликване, без парола, без
  console/DevTools. Открито чрез реален клик тест (не само чрез директно
  извикване на функциите). Фиксирано — вика `handleAdminNavClick()`, който
  проверява сървърна сесия.
- **Реален backend за автентикация и AI ключ** (`server/` — Express +
  SQLite + bcrypt): admin паролата вече се проверява server-side (`POST
  /api/login`, httpOnly cookie сесия), вместо client-side SHA-256 сравнение
  в localStorage. Anthropic API ключът живее само в `server/.env` — и
  визитьорският чат, и admin AI генераторът минават през сървърен proxy
  (`/api/ai/chat`, `/api/ai/generate`), ключът никога не стига до
  браузъра. Дизайн темплейтът вече е SQLite `settings` запис (реално
  сайт-широк), не localStorage (беше само per-browser въпреки че се
  представяше за "сайт-широко"). Виж `ARCHITECTURE.md#backend`,
  `SECURITY.md`.

### Fixed
- **Критично:** Секцията "3D Алмус" беше напълно нефункционална за всеки
  посетител — `initScene()` хвърляше грешка при `new
  B.CubeTexture.CreateFromPrefilteredData` (извикан с `new` без аргументи,
  последван от мъртъв `? null : null` тернарник), преди `window.almus3D`
  изобщо да се присвои. Резултат: нито view бутоните (ЮГ/ПТИЧА/ИЗТОК/360°),
  нито fullscreen, нито highlight на info картите са работили. Премахнат
  напълно мъртвия/чупещ ред — 3D изгледът вече зарежда и работи коректно.
  Открито и потвърдено чрез Playwright тестовете в `tests/almus3d.spec.js`.
- Визитьорският AI чат "Алмус" никога не работеше — ползваше хардкоднат
  placeholder ключ (`ALMUS_KEY = 'YOUR_ANTHROPIC_API_KEY'`) вместо реалния
  ключ, който admin запазва през AI панела. Сега чете същия ключ
  (`localStorage['mlcms_ai_key']`) и показва ясно съобщение, ако все още
  не е конфигуриран, вместо да прави гарантирано неуспешна заявка.
- Коментар в кода твърдеше, че default admin паролата е "Admin2025!" —
  реално е "admin" (проверено спрямо `DEFAULT_HASH`). Коригиран коментарът
  и добавено ясно предупреждение в `SECURITY.md`.
- `ARCHITECTURE.md`/`qa-docs/` не споменаваха AI чата "Алмус", admin AI
  генератора на съдържание, News секцията, PWA install банера и римската/
  музейната карта — добавени в документацията.
- `SECURITY.md` не покриваше риска от съхранение на реален Anthropic API
  ключ в plaintext localStorage и изпращането му directly от браузъра.

### Added
- **6 дизайн шаблона** за целия сайт (admin панел → таб "Дизайн"), по мотив
  на 6-те епохи от Хронологията — Римска епоха (default), Праистория,
  Тракийска епоха, Средновековие, Османска епоха, Съвременност. Всеки
  работи в тъмна и светла тема, desktop и мобилно (същия responsive CSS,
  само сменени цветови променливи). Избраният шаблон важи сайт-широко за
  всички посетители (persist server-side в SQLite, виж Security секцията
  по-горе), за разлика от `theme-toggle` (light/dark), който си остава
  per-visitor избор.
  Техническа реализация: цветовата система на `index.html` беше почти
  изцяло hardcoded (370+ `rgba()`/hex литерала извън 8-те CSS променливи,
  68 отделни `body.light-theme` override правила) — рефакторирана в пълна
  CSS variable/`color-mix()` система, за да могат темплейтите да работят
  като чисто variable overrides без риск за визуален regression
  (default темплейтът е проверен да рендира идентично на преди).
- Playwright тестове за темплейт системата (`tests/design-templates.spec.js`).
- Пълна QA документация (`qa-docs/TEST_PLAN.md`, `TEST_CASES.md`) и bug report темплейт.
- Технически документи: `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.

## Преди този журнал
По-ранните промени не са документирани тук — виж `git log` за пълна история.
