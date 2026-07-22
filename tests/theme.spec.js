// @ts-check
import { test, expect } from '@playwright/test';

// Съответства на TC-05, TC-06 от qa-docs/TEST_CASES.md

test('theme-toggle превключва между dark и light', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('body');
  await expect(body).not.toHaveClass(/light-theme/);
  await page.locator('#theme-toggle').click();
  await expect(body).toHaveClass(/light-theme/);
  await page.locator('#theme-toggle').click();
  await expect(body).not.toHaveClass(/light-theme/);
});

test('избраната тема се запазва след презареждане (localStorage)', async ({ page }) => {
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('body')).toHaveClass(/light-theme/);

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/light-theme/);
  const stored = await page.evaluate(() => localStorage.getItem('muzei-theme'));
  expect(stored).toBe('light');
});
