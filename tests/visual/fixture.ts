import type { Page, Request } from '@playwright/test';
import { createRealisticMockApiState } from '../mocks/realistic-state';
import { expectProductSearchContained } from '../helpers/product-search';
import { expect, test as base } from '../fixtures/test';

type VisualFixtures = {
  visual: {
    open: (path: string, testId: string) => Promise<void>;
    ready: () => Promise<void>;
    capture: (name: string, scroll?: boolean) => Promise<void>;
  };
  allowedApiErrors: string[];
};

async function settle(page: Page, pending: Set<Request>): Promise<void> {
  await expect.poll(() => pending.size, { message: 'All mocked API requests must finish' }).toBe(0);
  await page.waitForFunction(() => {
    const win = window as typeof window & {
      getAllAngularTestabilities?: () => { isStable: () => boolean }[];
    };
    return win.getAllAngularTestabilities?.().every((app) => app.isStable()) ?? true;
  });
  await expect(page.locator('mat-progress-bar, mat-spinner')).toHaveCount(0);
  await expect(page.locator('.app-status-pill').filter({ hasText: /^Loading/ })).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expectProductSearchContained(page);
}

export const test = base.extend<VisualFixtures>({
  allowedApiErrors: [[], { option: true }],
  visual: [async ({ page, context, mockApi, colorScheme, isMobile, allowedApiErrors }, use) => {
    const errors: string[] = [];
    let expectedApiFailureObserved = false;
    const pending = new Set<Request>();
    const isApi = (url: string) => url.startsWith('http://localhost:3000/');
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (isApi(request.url())) pending.add(request); });
    page.on('requestfinished', (request) => pending.delete(request));
    page.on('requestfailed', (request) => {
      pending.delete(request);
      const reason = request.failure()?.errorText;
      // forkJoin cancels sibling XHRs when the deliberate error response arrives.
      if (expectedApiFailureObserved && isApi(request.url()) && reason === 'net::ERR_ABORTED') return;
      errors.push(`Request failed: ${request.url()} (${reason})`);
    });
    page.on('response', (response) => {
      if (isApi(response.url()) && response.status() >= 400 &&
          allowedApiErrors.includes(new URL(response.url()).pathname)) {
        expectedApiFailureObserved = true;
      }
      if (isApi(response.url()) && response.status() >= 400 &&
          !allowedApiErrors.includes(new URL(response.url()).pathname)) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });

    await context.addInitScript((theme) => localStorage.setItem('theme', theme), colorScheme === 'dark' ? 'dark' : 'light');
    await context.route('**/*', (route) => {
      const origin = new URL(route.request().url()).origin;
      if (origin === 'http://127.0.0.1:4400' || origin === 'http://localhost:3000') return route.fallback();
      errors.push(`Unexpected external dependency: ${route.request().url()}`);
      return route.abort();
    });
    mockApi.reset(createRealisticMockApiState());

    await use({
      open: async (path, testId) => {
        await page.goto(path);
        await expect(page.getByTestId(testId)).toBeVisible();
        await settle(page, pending);
        await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /dark/ : /^(?!.*\bdark\b)/);
      },
      ready: () => settle(page, pending),
      capture: async (name, scroll = true) => {
        if (!isMobile) {
          await expect(page).toHaveScreenshot(name, { fullPage: true });
          return;
        }
        // Use actual mobile viewport paints instead of Chromium's very tall
        // full-page captures, which can mix visible/offscreen text raster modes.
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await settle(page, pending);
        await expect(page).toHaveScreenshot(name, { fullPage: false });
        if (!scroll) return;

        const viewport = page.viewportSize()!;
        const header = await page.locator('.app-shell__header').boundingBox();
        const step = Math.max(1, Math.floor(viewport.height - (header?.height ?? 0) - 24));
        const maxScroll = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
        const offsets: number[] = [];
        for (let offset = step; offset < maxScroll; offset += step) offsets.push(offset);
        if (maxScroll > 0) offsets.push(maxScroll);
        for (const [index, offset] of offsets.entries()) {
          await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), offset);
          await settle(page, pending);
          await expect(page).toHaveScreenshot(name.replace(/\.png$/, `-scroll-${index + 1}.png`), { fullPage: false });
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      },
    });
    expect(errors, 'Visual references must not hide API errors, browser errors or external requests').toEqual([]);
  }, { auto: true }],
});

export { expect };
