// @ts-check
import { test, expect } from '@playwright/test';
import { submitAdminLogin } from './helpers.js';

// Съответства на TC-20, TC-21, TC-21a, TC-21c от qa-docs/TEST_CASES.md
// Default паролата е "admin" (виж DEFAULT_HASH в index.html) — фиксиран
// известен бъг: коментарът в кода погрешно твърдеше "Admin2025!".

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('admin панелът е затворен по подразбиране', async ({ page }) => {
  await expect(page.locator('#admin-panel')).toBeHidden();
});

test('РЕГРЕСИЯ: реалният клик върху видимия ADMIN бутон в header-а изисква парола', async ({ page }) => {
  // Открит критичен bypass: #admin-nav-btn викаше openAdminPanel() директно
  // (без auth check), пропускайки изцяло login gate-а — всеки посетител е
  // можел да влезе в admin панела само с едно кликване, без console/DevTools.
  // Тестовете по-горе ползват submitAdminLogin() helper, който вика
  // openAdminLogin()/tryAdminLogin() директно през evaluate — затова не са
  // хванали този бъг; тук кликваме реалния бутон, както посетител би направил.
  await page.locator('#admin-nav-btn').click();
  await expect(page.locator('#admin-login-modal')).toBeVisible();
  await expect(page.locator('#admin-panel')).toBeHidden();
});

test('грешна парола показва грешка и не отваря панела', async ({ page }) => {
  await submitAdminLogin(page, 'wrong-password');
  await expect(page.locator('#admin-login-err')).toHaveText('Грешна парола.');
  await expect(page.locator('#admin-panel')).toBeHidden();
});

test('вход с default парола ("admin") отваря admin панела', async ({ page }) => {
  await submitAdminLogin(page, 'admin');
  await expect(page.locator('#admin-panel')).toBeVisible();
  await expect(page.locator('#admin-login-modal')).toBeHidden();
});

test('AI генераторът работи с конфигуриран сървърен ключ (proxy през /api/ai/generate)', async ({ page }) => {
  await submitAdminLogin(page, 'admin');
  // AI табът (#admtab-ai) е display:none по подразбиране — активният таб е "hours".
  await page.evaluate(() => window.showAdminTab('ai'));
  await page.evaluate(() => window.setAiMode('news'));
  await page.locator('#adm-ai-input').fill('Нова изложба за пролетта');
  // Сървърът (NODE_ENV=test) връща canned JSON вместо реална Anthropic заявка.
  await page.route('**/api/ai/generate', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: [{ text: '{"title":"Тест изложба","desc":"Тестово описание"}' }] }),
  }));
  await page.evaluate(() => window.runAiGenerate());
  await expect(page.locator('#adm-ai-result')).toBeVisible();
});

test('AI генераторът без admin сесия връща 401 (API ниво)', async ({ request }) => {
  const res = await request.post('/api/ai/generate', { data: { system: 'x', prompt: 'y' } });
  expect(res.status()).toBe(401);
});

test('сесията оцелява презареждане на страницата (без "ИЗХОД")', async ({ page }) => {
  // closeAdminPanel() извиква /api/logout (бутонът е "✕ ИЗХОД") — затова тук
  // НЕ затваряме панела, а само презареждаме, за да проверим, че cookie
  // сесията наистина персистира между заредания (за разлика от предишния
  // дизайн, където изобщо нямаше admin сесия между презареждания).
  await submitAdminLogin(page, 'admin');
  await expect(page.locator('#admin-panel')).toBeVisible();
  await page.reload();
  await page.locator('#admin-nav-btn').click();
  await expect(page.locator('#admin-panel')).toBeVisible();
  await expect(page.locator('#admin-login-modal')).toBeHidden();
});

test('"✕ ИЗХОД" реално прекратява сесията (не само крие UI-я)', async ({ page }) => {
  await submitAdminLogin(page, 'admin');
  await page.evaluate(() => window.closeAdminPanel());
  await page.reload();
  await page.locator('#admin-nav-btn').click();
  await expect(page.locator('#admin-login-modal')).toBeVisible();
  await expect(page.locator('#admin-panel')).toBeHidden();
});
