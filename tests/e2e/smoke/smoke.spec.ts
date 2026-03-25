import { expect } from '../../fixtures/test';
import { test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute, openSidebarRoute } from '../../helpers/navigation';

test('redirects / to /home @smoke', async ({ page, mockApi }) => {
  void mockApi;

  await page.goto('/');

  await expect(page).toHaveURL(/\/home$/);
  await expectShellTitle(page, 'Accueil');
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
});

test('navigates through the main shell routes @smoke', async ({ page, mockApi }) => {
  void mockApi;

  await gotoRoute(page, '/home');

  const routes = [
    { label: 'Catalogue', url: /\/product$/, title: 'Catalogue' },
    { label: 'Inventaires', url: /\/inventory$/, title: 'Inventaires' },
    { label: 'Saisie du jour', url: /\/input-day$/, title: 'Saisie du jour' },
    { label: 'Cycles', url: /\/cycle$/, title: 'Cycles' },
    { label: 'Calendrier', url: /\/calendar$/, title: 'Calendrier' },
    { label: 'Assignations', url: /\/planning$/, title: 'Assignations' },
    { label: 'Statistiques', url: /\/statistic$/, title: 'Statistiques' },
  ];

  for (const route of routes) {
    await openSidebarRoute(page, route.label);
    await expect(page).toHaveURL(route.url);
    await expectShellTitle(page, route.title);
  }
});

test('toggles the theme from the shell @smoke', async ({ page, mockApi }) => {
  void mockApi;

  await gotoRoute(page, '/home');

  const toggle = page.locator('.app-theme-toggle');
  await expect(toggle).toHaveAttribute('aria-label', 'Passer en sombre');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Passer en clair');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Passer en sombre');
});
