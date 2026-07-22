// @ts-check
import { test, expect } from '@playwright/test';
import { submitAdminLogin } from './helpers.js';

// Дизайн шаблони — admin панел, таб "Дизайн" (виж CHANGELOG.md).
// 6 шаблона (по мотив на 6-те епохи от Хронологията), всеки задава
// [data-template] на <html> и персистира сайт-широко през
// localStorage['mlcms_template'] (не е per-visitor предпочитание,
// за разлика от theme-toggle light/dark).

test('default (без запазен шаблон) е "roman"', async ({ page }) => {
  await page.goto('/');
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

test('избор на шаблон сменя --gold и персистира в localStorage', async ({ page }) => {
  await page.goto('/');
  await submitAdminLogin(page, 'admin');
  await page.evaluate(() => window.showAdminTab('design'));

  // "Средновековие" е 4-тата карта (индекс 3)
  await page.locator('.design-template-card').nth(3).click();

  await expect(page.locator('html')).toHaveAttribute('data-template', 'medieval');
  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#6478c8');
  const stored = await page.evaluate(() => localStorage.getItem('mlcms_template'));
  expect(stored).toBe('"medieval"');
});

test('избраният шаблон е видим за всеки посетител след презареждане (не е per-browser предпочитание)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mlcms_template', JSON.stringify('ottoman')));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-template', 'ottoman');
  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#c84040');
});

test('шаблонът работи независимо от theme-toggle (light/dark)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mlcms_template', JSON.stringify('modern'));
    localStorage.setItem('muzei-theme', 'light');
  });
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/light-theme/);
  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
  expect(gold).toBe('#40c870');
});
