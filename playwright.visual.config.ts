import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

// Baselines are generated on Ubuntu 24.04 with the Chromium bundled with
// the exact @playwright/test version in package.json (see tests/visual/README.md).
export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.visual.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: 2,
  timeout: 45_000,
  updateSnapshots: 'none',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  outputDir: 'test-results/visual',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/visual', open: 'never' }],
  ],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      threshold: 0.1,
      maxDiffPixels: 0,
    },
  },
  use: {
    browserName: 'chromium',
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:4400',
    locale: 'en-GB',
    timezoneId: 'Europe/Paris',
    contextOptions: { reducedMotion: 'reduce' },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    launchOptions: {
      // Reduce variation from GPU hardware and subpixel text rasterization.
      args: ['--disable-gpu', '--disable-lcd-text'],
      env: { ...process.env, FONTCONFIG_FILE: resolve('tests/visual/fonts.conf') },
    },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start -- --configuration development --host 127.0.0.1 --port 4400',
    url: 'http://127.0.0.1:4400',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-light', use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' } },
    { name: 'desktop-dark', use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' } },
    { name: 'mobile-light', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true } },
    { name: 'mobile-dark', use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true } },
    { name: 'iphone16pro-light', use: { viewport: { width: 402, height: 874 }, colorScheme: 'light', isMobile: true, hasTouch: true } },
    { name: 'iphone16pro-dark', use: { viewport: { width: 402, height: 874 }, colorScheme: 'dark', isMobile: true, hasTouch: true } },
    { name: 'ipadpro11-light', use: { viewport: { width: 834, height: 1194 }, colorScheme: 'light', isMobile: true, hasTouch: true } },
    { name: 'ipadpro11-dark', use: { viewport: { width: 834, height: 1194 }, colorScheme: 'dark', isMobile: true, hasTouch: true } },
    { name: 'macbookpro14-light', use: { viewport: { width: 1512, height: 982 }, colorScheme: 'light' } },
    { name: 'macbookpro14-dark', use: { viewport: { width: 1512, height: 982 }, colorScheme: 'dark' } },
  ],
});
