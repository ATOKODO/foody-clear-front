import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.pwa.spec.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:4300', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/serve-pwa-test.mjs', url: 'http://127.0.0.1:4300', reuseExistingServer: !process.env['CI'] },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
