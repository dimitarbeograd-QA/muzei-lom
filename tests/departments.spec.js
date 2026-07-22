// @ts-check
import { test, expect } from '@playwright/test';

// Съответства на TC-16, TC-17 от qa-docs/TEST_CASES.md
// Основано на статичния DEPTS масив в index.html (6 карти, индекси 0-5).

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('има 6 dept-card карти в секция Отдели', async ({ page }) => {
  await expect(page.locator('.dept-card')).toHaveCount(6);
});

test('клик върху dept-card отваря модал с коректно съдържание (Археология)', async ({ page }) => {
  await page.locator('.dept-card').nth(0).click();
  await expect(page.locator('#dmodal')).toBeVisible();
  await expect(page.locator('#dm-header')).toHaveText('01 · Археология');
});

test('различните dept-card карти отварят различно съдържание', async ({ page }) => {
  await page.locator('.dept-card').nth(2).click();
  await expect(page.locator('#dm-header')).toHaveText('03 · Етнография');
});
