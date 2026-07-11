import { expect, test as base } from '@playwright/test';
import { MockApi } from '../mocks/backend';

export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    async ({ page }, use) => {
      const mockApi = new MockApi();
      await mockApi.install(page);
      await use(mockApi);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
