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

/** Сийдва admin-конфигуриран Anthropic API ключ (localStorage['mlcms_ai_key']). */
export async function seedAiKey(page, key = 'sk-ant-test-fake-key') {
  await page.addInitScript(([k]) => {
    localStorage.setItem('mlcms_ai_key', k);
  }, [key]);
}

/** Отваря admin login модала и въвежда парола (не логва — само submit-ва формата). */
export async function submitAdminLogin(page, password) {
  await page.evaluate(() => window.openAdminLogin());
  await page.locator('#admin-pwd-input').fill(password);
  await page.evaluate(() => window.tryAdminLogin());
}
