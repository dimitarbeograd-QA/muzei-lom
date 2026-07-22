# Changelog

Форматът следва приблизително [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
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
- Пълна QA документация (`qa-docs/TEST_PLAN.md`, `TEST_CASES.md`) и bug report темплейт.
- Технически документи: `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.

## Преди този журнал
По-ранните промени не са документирани тук — виж `git log` за пълна история.
