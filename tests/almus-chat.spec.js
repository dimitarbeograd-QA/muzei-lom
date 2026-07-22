// @ts-check
import { test, expect } from '@playwright/test';

// Съответства на TC-25, TC-26 от qa-docs/TEST_CASES.md
// Регресионен тест за фиксирания бъг: визитьорският чат преди винаги
// ползваше хардкоднат placeholder ключ и никога не работеше.
//
// Ключът вече живее само на сървъра (process.env.ANTHROPIC_API_KEY) — чатът
// пътува до /api/ai/chat (same-origin), който в NODE_ENV=test връща canned
// отговор вместо реална Anthropic заявка (виж proxyAnthropic в server.js).

test('чатът показва ясно съобщение, ако сървърът върне "не е конфигуриран"', async ({ page }) => {
  let apiCalls = 0;
  await page.route('**/api/ai/chat', (route) => {
    apiCalls++;
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'AI не е конфигуриран на сървъра.' }) });
  });

  await page.goto('/');
  await page.evaluate(() => window.toggleAlmusChat());
  await expect(page.locator('#almus-chat')).toBeVisible();

  await page.locator('#almus-input').fill('Кой си ти?');
  await page.locator('#almus-send').click();

  await expect(page.locator('.chat-msg.guide').last()).toContainText('музеят още не е отключил разговора');
  expect(apiCalls).toBe(1);
});

test('с конфигуриран ключ чатът получава реален отговор през сървърния proxy (не placeholder)', async ({ page }) => {
  let sentBody = null;
  await page.route('**/api/ai/chat', async (route) => {
    sentBody = route.request().postDataJSON();
    await route.continue();
  });

  await page.goto('/');
  await page.evaluate(() => window.toggleAlmusChat());
  await page.locator('#almus-input').fill('Кой си ти?');
  await page.locator('#almus-send').click();

  // Сървърът (NODE_ENV=test) връща canned отговор вместо реална Anthropic заявка.
  await expect(page.locator('.chat-msg.guide').last()).toContainText('[TEST MODE]');
  expect(sentBody.messages[sentBody.messages.length - 1]).toEqual({ role: 'user', content: 'Кой си ти?' });
  expect(typeof sentBody.system).toBe('string');
});
