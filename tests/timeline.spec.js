// @ts-check
import { test, expect } from '@playwright/test';

// Съответства на TC-11 от qa-docs/TEST_CASES.md
// Основано на статичния ERAS масив в index.html (6 позиции, индекси 0-5).

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('слайдерът показва коректна ера за позиция 0 (Праистория)', async ({ page }) => {
  await expect(page.locator('#tl-era-name')).toHaveText('ПРАИСТОРИЯ');
  await expect(page.locator('#tl-year-label')).toHaveText('ок. 5000 пр. Хр.');
});

test('местене на слайдера към позиция 2 показва Римската епоха', async ({ page }) => {
  const slider = page.locator('#tl-slider');
  await slider.fill('2');
  await slider.dispatchEvent('input');
  await expect(page.locator('#tl-era-name')).toHaveText('РИМСКА ЕПОХА');
  await expect(page.locator('#tl-era-desc')).toContainText('Almus');
});

test('местене на слайдера към последна позиция (5) показва Съвременност', async ({ page }) => {
  const slider = page.locator('#tl-slider');
  await slider.fill('5');
  await slider.dispatchEvent('input');
  await expect(page.locator('#tl-era-name')).toHaveText('СЪВРЕМЕННОСТ');
});

test('клик върху era-tick сменя ерата аналогично на слайдера', async ({ page }) => {
  const ticks = page.locator('.tl-era-tick');
  await expect(ticks).toHaveCount(6);
  await ticks.nth(1).click();
  await expect(page.locator('#tl-era-name')).toHaveText('ТРАКИЙСКА ЕПОХА');
  await expect(page.locator('#tl-slider')).toHaveValue('1');
});
