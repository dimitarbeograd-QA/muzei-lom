// @ts-check

/**
 * Сийдва localStorage преди navigation (през addInitScript), огледално на
 * ключовете, които index.html чете при init() — `getData()`/`setData()`
 * префиксират всичко с `mlcms_`.
 */
export async function seedEvent(page, event) {
  const evs = [{
    id: 1,
    title: 'Нощ на музеите 2026',
    body: 'Специална програма за Европейската нощ на музеите.',
    // renderPublicEvents() филтрира по дата >= днес — фиксирана бъдеща дата,
    // за да не зависи тестът от кога реално се пуска.
    date: '2099-05-18',
    time: '19:00',
    place: 'Исторически музей — Лом',
    ...event,
  }];
  await page.addInitScript(([data]) => {
    localStorage.setItem('mlcms_events', JSON.stringify(data));
  }, [evs]);
}

/** Отваря admin login модала и въвежда парола (не логва — само submit-ва формата). */
export async function submitAdminLogin(page, password) {
  await page.evaluate(() => window.openAdminLogin());
  await page.locator('#admin-pwd-input').fill(password);
  await page.evaluate(() => window.tryAdminLogin());
}

/**
 * Връща сървърния SQLite state (admin парола, settings) към default seed и
 * унищожава текущата сесия — вика POST /api/test/reset (само налично при
 * NODE_ENV=test, виж server/server.js). За разлика от localStorage/предишния
 * дизайн, backend-ът пази реално споделено state между тестовете, затова
 * тестове, които мутират admin паролата или темплейта, трябва да викат това
 * в beforeEach, за да са независими от реда на изпълнение.
 */
export async function resetServerState(request) {
  const res = await request.post('/api/test/reset');
  if (!res.ok()) {
    throw new Error('POST /api/test/reset failed — сървърът стартиран ли е с NODE_ENV=test?');
  }
}
