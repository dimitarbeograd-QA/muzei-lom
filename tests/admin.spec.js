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

test('AI генераторът изисква API ключ преди заявка', async ({ page }) => {
  await submitAdminLogin(page, 'admin');
  // AI табът (#admtab-ai) е display:none по подразбиране — активният таб е "hours".
  await page.evaluate(() => window.showAdminTab('ai'));
  await page.evaluate(() => window.setAiMode('news'));
  await page.locator('#adm-ai-input').fill('Нова изложба за пролетта');
  await page.evaluate(() => window.runAiGenerate());
  await expect(page.locator('#adm-ai-msg')).toContainText('Anthropic API ключ');
});
