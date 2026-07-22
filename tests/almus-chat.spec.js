// @ts-check
import { test, expect } from '@playwright/test';
import { seedAiKey } from './helpers.js';

// Съответства на TC-25, TC-26 от qa-docs/TEST_CASES.md
// Регресионен тест за фиксирания бъг: визитьорският чат преди винаги
// ползваше хардкоднат placeholder ключ и никога не работеше.

test('чатът показва ясно съобщение, ако не е конфигуриран API ключ (без реална мрежова заявка)', async ({ page }) => {
  const apiCalls = [];
  await page.route('https://api.anthropic.com/**', (route) => {
    apiCalls.push(route.request().url());
    route.abort();
  });

  await page.goto('/');
  await page.evaluate(() => window.toggleAlmusChat());
  await expect(page.locator('#almus-chat')).toBeVisible();

  await page.locator('#almus-input').fill('Кой си ти?');
  await page.locator('#almus-send').click();

  await expect(page.locator('.chat-msg.guide').last()).toContainText('музеят още не е отключил разговора');
  expect(apiCalls, 'не трябва да се прави заявка към Anthropic API без ключ').toHaveLength(0);
});

test('с конфигуриран ключ чатът праща заявка към Anthropic с реалния ключ (не placeholder-а)', async ({ page }) => {
  const FAKE_KEY = 'sk-ant-test-fake-key';
  let capturedKey = null;
  await page.route('https://api.anthropic.com/**', (route) => {
    capturedKey = route.request().headers()['x-api-key'];
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ text: 'Ave, пътнико!' }] }),
    });
  });

  await seedAiKey(page, FAKE_KEY);
  await page.goto('/');
  await page.evaluate(() => window.toggleAlmusChat());
  await page.locator('#almus-input').fill('Кой си ти?');
  await page.locator('#almus-send').click();

  await expect(page.locator('.chat-msg.guide').last()).toContainText('Ave, пътнико!');
  expect(capturedKey).toBe(FAKE_KEY);
});
