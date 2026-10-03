import { expect, test } from '../../fixtures/test';
import { gotoRoute } from '../../helpers/navigation';
import { loadStandaloneInputDay } from '../execution/utils';

const localizedRoutes = [
  ['home', 'Home', 'Accueil', 'home-dashboard'],
  ['product', 'Catalog', 'Catalogue', 'product-page'],
  ['category', 'Categories', 'Catégories', 'category-page'],
  ['generic-product', 'Generic products', 'Produits génériques', 'generic-product-page'],
  ['tag', 'Tags', 'Étiquettes', 'tag-page'],
  ['inventory', 'Inventories', 'Inventaires', 'inventory-page'],
  ['shopping-list', 'Shopping lists', 'Listes de courses', 'shopping-list-page'],
  ['meal-prep', 'Meal prep', 'Préparation des repas', 'meal-prep-page'],
  ['cycle', 'Cycles', 'Cycles', 'cycle-page'],
  ['input-day', 'Day input', 'Saisie journalière', 'input-day-form'],
  ['day-set', 'Day sets', 'Journées types', 'day-set-page'],
  ['slot', 'Time slots', 'Créneaux horaires', 'slot-page'],
  ['template', 'Templates', 'Modèles', 'template-page'],
  ['calendar', 'Calendar', 'Calendrier', 'calendar-root'],
  ['planning', 'Assignments', 'Affectations', 'planning-page'],
  ['statistic', 'Statistics', 'Statistiques', 'statistic-page'],
] as const;

for (const [route, english, french, landmark] of localizedRoutes) {
  test(`renders /${route} in both languages`, async ({ page }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.route('http://localhost:3000/**', (request) => {
      const path = new URL(request.request().url()).pathname;
      if (['/shopping-list', '/shopping-list/templates', '/meal-prep/dishes', '/meal-prep/meals'].includes(path)) {
        return request.fulfill({ json: [] });
      }
      return request.fallback();
    });
    await gotoRoute(page, `/${route}`);
    await expect(page.getByTestId(landmark)).toBeVisible();
    await expect(page.locator('mat-progress-bar')).toHaveCount(0);
    await expect(page.locator('.app-shell__header-title')).toHaveText(english);
    await testInfo.attach(`${route}-en-text`, { body: await page.locator('main').first().innerText(), contentType: 'text/plain' });
    await page.getByTestId('language-fr').click();
    await expect(page.locator('.app-shell__header-title')).toHaveText(french);
    await expect(page.getByTestId(landmark)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
    await testInfo.attach(`${route}-fr-text`, { body: await page.locator('main').first().innerText(), contentType: 'text/plain' });
    const screenshotPath = testInfo.outputPath(`${route}-fr.png`);
    await page.screenshot({ path: screenshotPath });
    await testInfo.attach(`${route}-fr-screen`, { path: screenshotPath, contentType: 'image/png' });
    await page.getByTestId('language-en').click();
    await expect(page.locator('.app-shell__header-title')).toHaveText(english);
    expect(runtimeErrors).toEqual([]);
  });
}

test('switches EN/FR live and keeps the choice after navigation and reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('foody-clear-language')) localStorage.setItem('foody-clear-language', 'en');
  });
  await gotoRoute(page, '/home');
  await expect(page.locator('.app-shell__header-title')).toHaveText('Home');
  await expect(page.getByTestId('language-en')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('language-fr').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('.app-shell__header-title')).toHaveText('Accueil');
  await expect(page.getByTestId('language-fr')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveTitle('Accueil · Foody Clear');
  await expect(page.getByRole('button', { name: 'Installer l’application', exact: true })).toBeVisible();

  await page.getByLabel('Navigation principale').getByRole('link', { name: /Catalogue/ }).click();
  await expect(page.locator('.app-shell__header-title')).toHaveText('Catalogue');
  await expect(page.getByTestId('catalogue-add-action')).toHaveText('Ajouter un produit');
  await expect(page.getByRole('button', { name: 'Actualiser', exact: true }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('.app-shell__header-title')).toHaveText('Catalogue');
  await gotoRoute(page, '/input-day');
  await expect(page.locator('.app-shell__header-title')).toHaveText('Saisie journalière');

  await page.getByTestId('language-en').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.app-shell__header-title')).toHaveText('Day input');
});

test('preserves a product draft while changing the language', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('foody-clear-language', 'en'));
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const name = page.locator('app-product-form input[formcontrolname="name"]');
  await name.fill('Home – mon produit');
  // Material traps focus and blocks background clicks while a dialog is open.
  // Dispatch the language action to verify rendering without recreating the form.
  await page.getByTestId('language-fr').dispatchEvent('click');

  await expect(name).toHaveValue('Home – mon produit');
  await expect(page.locator('.app-dialog-title')).toHaveText('Ajouter un produit');
  await page.getByTestId('language-en').dispatchEvent('click');
  await expect(name).toHaveValue('Home – mon produit');
  await expect(page.locator('.app-dialog-title')).toHaveText('Add product');
});

test('keeps the language switch beside the theme on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, '/home');
  await page.getByTestId('language-fr').click();
  const theme = await page.locator('.app-theme-toggle').boundingBox();
  const language = await page.getByTestId('language-switch').boundingBox();
  expect(theme).not.toBeNull();
  expect(language).not.toBeNull();
  expect(language!.x).toBeGreaterThanOrEqual(theme!.x + theme!.width);
  expect(Math.abs(language!.y + language!.height / 2 - theme!.y - theme!.height / 2)).toBeLessThan(1);
  expect(language!.x + language!.width).toBeLessThanOrEqual(390);
});

test('localizes the datepicker while preserving the selected business date', async ({ page, mockApi }) => {
  await loadStandaloneInputDay(page);
  await page.getByTestId('language-fr').click();
  await page.getByRole('button', { name: 'Ouvrir le calendrier', exact: true }).click();
  const calendar = page.locator('mat-calendar');
  await expect(calendar).toBeVisible();
  await expect(calendar).toContainText(/mars 2026/i);
  await expect(page.getByRole('button', { name: 'Mois précédent', exact: true })).toBeVisible();
  // Material ignores close actions while the opening animation is running.
  await page.locator('mat-datepicker-content').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  });
  const closeCalendar = page.getByRole('button', { name: 'Fermer le calendrier', exact: true });
  await closeCalendar.focus();
  await closeCalendar.press('Enter');
  await expect(calendar).toBeHidden();
  await page.getByTestId('input-day-load').click();
  await expect(page.getByTestId('input-day-item-1')).toBeVisible();
  expect(mockApi.state.inputDayItems.some((item) => item.dateLocal === '2026-03-25')).toBe(true);
  await page.getByTestId('language-en').click();
  await page.getByRole('button', { name: 'Open calendar', exact: true }).click();
  await expect(calendar).toContainText(/mar 2026/i);
  await expect(page.getByRole('button', { name: 'Previous month', exact: true })).toBeVisible();
});

test('localizes scanner feedback and allergens without changing imported product content', async ({ page }) => {
  await page.route('https://world.openfoodfacts.net/api/v2/product/*', (route) => route.fulfill({ json: {
    status: 1, product: {
      product_name: 'Home', brands: 'Home', quantity: '400 g', product_quantity: 400,
      product_quantity_unit: 'g', ingredients_text: 'User-owned original content',
      allergens_tags: ['en:milk', 'en:eggs', 'en:Home'], nutrition_grades: 'e', nutriments: {},
    },
  } }));
  await gotoRoute(page, '/product');
  await page.getByTestId('catalogue-add-action').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Scanner', exact: true }).click();
  const barcode = dialog.getByLabel('Product barcode', { exact: true });
  await barcode.fill('123');
  await dialog.getByRole('button', { name: 'Search for the product', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Enter a barcode');
  await page.getByTestId('language-fr').dispatchEvent('click');
  await expect(dialog.getByRole('alert')).toContainText('Saisissez un code-barres');
  await dialog.getByLabel('Code-barres du produit', { exact: true }).fill('3017624010701');
  await dialog.getByRole('button', { name: 'Rechercher le produit', exact: true }).click();
  const result = dialog.getByTestId('food-facts-product');
  await expect(result).toContainText('Lait, Œufs, Home');
  await page.getByTestId('language-en').dispatchEvent('click');
  await expect(result).toContainText('Milk, Eggs, Home');
  await expect(result.getByRole('heading', { name: 'Home', exact: true })).toBeVisible();
  await expect(result).toContainText('User-owned original content');
});
