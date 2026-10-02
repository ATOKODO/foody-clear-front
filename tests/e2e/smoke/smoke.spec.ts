import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute, openSidebarRoute } from '../../helpers/navigation';

test('redirects / to /home @smoke', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await page.goto('/');

  await expect(page).toHaveURL(/\/home$/);
  await expectShellTitle(page, 'Home');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('navigates through the main shell routes @smoke', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/home');

  const routes = [
    { label: 'Catalog', url: /\/product$/, title: 'Catalog' },
    { label: 'Shopping lists', url: /\/shopping-list$/, title: 'Shopping lists' },
    { label: 'Inventories', url: /\/inventory$/, title: 'Inventories' },
    { label: 'Meal prep', url: /\/meal-prep$/, title: 'Meal prep' },
    { label: 'Templates', url: /\/template$/, title: 'Templates' },
    { label: 'Cycles', url: /\/cycle$/, title: 'Cycles' },
    { label: 'Assignments', url: /\/planning(?:\?|$)/, title: 'Assignments' },
    { label: 'Statistics', url: /\/statistic$/, title: 'Statistics' },
  ];

  for (const route of routes) {
    await openSidebarRoute(page, route.label);
    await expect(page).toHaveURL(route.url);
    await expectShellTitle(page, route.title);
  }
  for (const [url, title] of [['/input-day', 'Day input'], ['/calendar', 'Calendar']]) {
    await gotoRoute(page, url);
    await expectShellTitle(page, title);
  }
});

test('toggles the theme from the shell @smoke', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/home');

  const toggle = page.locator('.app-theme-toggle');
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to light');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark');
});
