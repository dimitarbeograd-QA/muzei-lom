// @ts-check
import { test, expect } from '@playwright/test';

// Съответства на TC-13, TC-14, TC-15 от qa-docs/TEST_CASES.md
// almus3D зарежда Babylon.js от CDN асинхронно и инициализира WebGL сцена —
// изчакваме го изрично, вместо да предполагаме, че е готово веднага след load.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scroll2('almus-3d'));
  // scroll2() подравнява върха на секцията с viewport-а, но sticky
  // #site-header засенчва бутоните точно там — скролваме допълнително,
  // за да излязат под header-а. setView() разчита на legacy global `event`
  // (популяризиран само от истинска browser click симулация), затова тук
  // не ползваме {force:true} — force click може да не populate-не `event`
  // надеждно и да "изяде" смяната на активния бутон.
  await page.mouse.wheel(0, 150);
  await page.waitForFunction(() => !!window.almus3D, { timeout: 20000 });
});

test('изгледите ЮГ/ПТИЧА/ИЗТОК/360° превключват активния бутон', async ({ page }) => {
  const south = page.getByRole('button', { name: 'ЮГ', exact: true });
  const top = page.getByRole('button', { name: 'ПТИЧА', exact: true });

  await south.click();
  await expect(south).toHaveClass(/active/);

  await top.click();
  await expect(top).toHaveClass(/active/);
  await expect(south).not.toHaveClass(/active/);
});

test('fullscreen бутонът отваря 3D изгледа на цял екран', async ({ page }) => {
  await page.locator('#a3d-fullscreen-btn').click();
  await expect(page.locator('#a3d-fs-overlay')).toBeVisible();
  await page.locator('#a3d-fs-close').click();
  await expect(page.locator('#a3d-fs-overlay')).toBeHidden();
});

test('info card highlight-ва съответната зона (wall/barracks/praetorium/horrea)', async ({ page }) => {
  // almus3D.highlight() трябва да е налична и извикваема без грешка за всяка зона.
  for (const zone of ['wall', 'barracks', 'praetorium', 'horrea']) {
    const errors = [];
    page.once('pageerror', (e) => errors.push(e));
    await page.evaluate((z) => window.almus3D.highlight(z), zone);
    expect(errors, `almus3D.highlight('${zone}') не трябва да хвърля грешка`).toHaveLength(0);
  }
});
