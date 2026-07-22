// @ts-check
import { test, expect } from '@playwright/test';
import { seedEvent } from './helpers.js';

// Съответства на TC-01, TC-02, TC-03, TC-04 от qa-docs/TEST_CASES.md

test('nav линковете скролват до правилната секция (scroll2)', async ({ page }) => {
  await page.goto('/');
  const targets = ['almus', 'timeline-map', 'almus-3d', 'departments', 'exhibitions', 'visit'];
  for (const id of targets) {
    await page.evaluate((sectionId) => window.scroll2(sectionId), id);
    await expect(page.locator(`#${id}`)).toBeInViewport({ timeout: 3000 });
  }
});

test('nav-toggle отваря/затваря мобилното меню', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.locator('nav');
  await expect(nav).not.toHaveClass(/mobile-open/);
  await page.locator('#nav-toggle').click();
  await expect(nav).toHaveClass(/mobile-open/);
  await page.locator('#nav-toggle').click();
  await expect(nav).not.toHaveClass(/mobile-open/);
});

test('линк "Събития" е скрит по подразбиране (без активни събития)', async ({ page }) => {
  await page.goto('/');
  // renderPublicEvents() крие цялата #events секция (не само линка), ако няма бъдещи събития.
  await expect(page.locator('#nav-events-link')).toBeHidden();
  await expect(page.locator('#events')).toBeHidden();
});

test('линк "Събития" се показва, когато има активно събитие', async ({ page }) => {
  await seedEvent(page);
  await page.goto('/');
  await expect(page.locator('#nav-events-link')).toBeVisible();
  await expect(page.locator('#events-grid')).toContainText('Нощ на музеите 2026');
});
