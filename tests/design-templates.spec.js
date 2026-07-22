// @ts-check
import { test, expect } from '@playwright/test';
import { submitAdminLogin, resetServerState } from './helpers.js';

// Дизайн шаблони — admin панел, таб "Дизайн" (виж CHANGELOG.md).
// 6 шаблона (по мотив на 6-те епохи от Хронологията), всеки задава
// [data-template] на <html> — вече инжектирано server-side (SSR) от
// GET / в server.js, и персистира сайт-широко в SQLite settings таблица
// (не localStorage — виж ARCHITECTURE.md, реално site-wide за всички
// посетители, не per-browser).

test.beforeEach(async ({ request }) => {
  await resetServerState(request);
});

test('default (без запазен шаблон) е "roman"', async ({ page }) => {
  await page.goto('/');
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-template'));
  expect(attr).toBeNull(); // SSR не добавя атрибута, ако няма запазена стойност
  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#c9a84c');
});

test('admin вижда 6 темплейт карти в Дизайн таба, с текущия маркиран', async ({ page }) => {
  await page.goto('/');
  await submitAdminLogin(page, 'admin');
  await page.evaluate(() => window.showAdminTab('design'));
  await expect(page.locator('.design-template-card')).toHaveCount(6);
  await expect(page.locator('.design-template-card.active')).toContainText('Римска епоха');
});

test('избор на шаблон сменя --gold и персистира server-side', async ({ page }) => {
  await page.goto('/');
  await submitAdminLogin(page, 'admin');
  await page.evaluate(() => window.showAdminTab('design'));

  // "Средновековие" е 4-тата карта (индекс 3)
  await page.locator('.design-template-card').nth(3).click();

  await expect(page.locator('html')).toHaveAttribute('data-template', 'medieval');
  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#6478c8');

  const stored = await page.evaluate(() => fetch('/api/settings/template').then(r => r.json()));
  expect(stored.value).toBe('medieval');
});

test('избраният шаблон е видим за всеки посетител (SSR, не per-browser localStorage)', async ({ page, browser }) => {
  await page.goto('/');
  await submitAdminLogin(page, 'admin');
  await page.evaluate(() => window.showAdminTab('design'));
  await page.locator('.design-template-card').nth(4).click(); // "Османска епоха"
  await expect(page.locator('html')).toHaveAttribute('data-template', 'ottoman');

  // Съвсем нов browser context — без сесия/cookies/localStorage, симулира
  // различен посетител на друго устройство.
  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.goto('/');
  await expect(freshPage.locator('html')).toHaveAttribute('data-template', 'ottoman');
  const gold = await freshPage.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#c84040');
  await freshContext.close();
});

test('избор на шаблон без admin сесия е забранен (401)', async ({ request }) => {
  const res = await request.put('/api/settings/template', { data: { value: 'modern' } });
  expect(res.status()).toBe(401);
});

test('шаблонът работи независимо от theme-toggle (light/dark)', async ({ page }) => {
  await page.goto('/');
  await submitAdminLogin(page, 'admin');
  await page.evaluate(() => window.showAdminTab('design'));
  await page.locator('.design-template-card').nth(5).click(); // "Съвременност"
  await expect(page.locator('html')).toHaveAttribute('data-template', 'modern');

  await page.evaluate(() => window.closeAdminPanel());
  await page.locator('#theme-toggle').click();
  await expect(page.locator('body')).toHaveClass(/light-theme/);

  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#40c870');
});
