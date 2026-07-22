import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  webServer: {
    command: 'node server/server.js',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      SESSION_SECRET: 'test-secret',
      ANTHROPIC_API_KEY: 'sk-ant-test-fake-key-for-config-only',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
