import { expect, test } from '@playwright/test';

test('serves an installable manifest and a working offline mobile shell', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home');
  await expect(page.locator('app-root')).toContainText('Foody Clear');
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!;
    return (await fetch(link.href)).json();
  });
  expect(manifest).toMatchObject({ name: 'Foody Clear', start_url: '/home', display: 'standalone', scope: '/' });
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain('192x192');
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain('512x512');
  for (const icon of manifest.icons as { src: string }[]) {
    const response = await page.request.get(`/${icon.src}`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  // Wait for the worker's complete app version, including lazy route chunks.
  await expect.poll(() => page.evaluate(async () => {
    const names = await caches.keys();
    return names.some((name) => name.includes('app-shell'));
  })).toBe(true);
  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  // Playwright's isolated contexts are private browsing sessions.
  expect(installabilityErrors.filter((error) => error.errorId !== 'in-incognito')).toEqual([]);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Hors connexion');
  await page.goto('/product');
  await expect(page.getByTestId('product-page')).toBeVisible();
  await expect(page.locator('.app-shell__header-title')).toHaveText('Catalog');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.setOffline(false);
  await expect(page.getByText(/Hors connexion/)).toHaveCount(0);
});

test('offers installation instructions on a mobile browser', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home');
  await page.getByRole('button', { name: "Install app", exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Android');
  await expect(dialog).toContainText('iPhone / iPad');
  await expect(dialog).toContainText('HTTPS');
  await dialog.getByRole('button', { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
});

test('meets Chrome installation criteria in a normal browser profile', async ({ playwright }, testInfo) => {
  const context = await playwright.chromium.launchPersistentContext('', {
    ...testInfo.project.use.launchOptions,
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = context.pages()[0];
    await page.goto('http://127.0.0.1:4300/home');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    const cdp = await context.newCDPSession(page);
    await expect.poll(async () => (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
