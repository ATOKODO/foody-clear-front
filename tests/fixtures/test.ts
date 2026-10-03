import { test as base } from '@playwright/test';
import { MockApi } from '../mocks/backend';

export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        if (!localStorage.getItem('foody-clear-language')) {
          localStorage.setItem('foody-clear-language', 'en');
        }
      });
      await page.clock.setFixedTime(new Date('2026-03-25T12:00:00+01:00'));
      const mockApi = new MockApi();
      await mockApi.install(page);
      await use(mockApi);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
