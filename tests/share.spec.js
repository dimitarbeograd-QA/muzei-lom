// @ts-check
import { test, expect } from '@playwright/test';

// Съответства на TC-18, TC-19 от qa-docs/TEST_CASES.md

test('share-anchor-btn копира линк със секцията във фрагмента и показва toast', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.shareSection('almus', 'Лом преди Лом'));

  await expect(page.locator('#share-toast')).toContainText('копиран');

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain('#almus');
});

test('отваряне на URL с #section фрагмент фокусира правилната секция', async ({ page }) => {
  await page.goto('/#departments');
  await expect(page.locator('#departments')).toBeInViewport({ timeout: 3000 });
});
