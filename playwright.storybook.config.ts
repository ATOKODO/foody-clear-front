import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/storybook',
  fullyParallel: true,
  workers: process.env['CI'] ? 2 : 4,
  retries: process.env['CI'] ? 1 : 0,
  timeout: 45_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/storybook' }]],
  use: { baseURL: 'http://127.0.0.1:6007', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/serve-storybook.mjs', url: 'http://127.0.0.1:6007', reuseExistingServer: false },
  projects: [{ name: 'storybook-chromium', use: { browserName: 'chromium', channel: 'chromium' } }],
});
