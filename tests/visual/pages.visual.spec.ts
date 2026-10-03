import { expect, test } from './fixture';

const pages = [
  ['home', 'home-dashboard'],
  ['product', 'product-page'],
  ['category', 'category-page'],
  ['generic-product', 'generic-product-page'],
  ['tag', 'tag-page'],
  ['inventory', 'inventory-page'],
  ['shopping-list', 'shopping-list-page'],
  ['meal-prep', 'meal-prep-page'],
  ['cycle', 'cycle-page'],
  ['input-day', 'input-day-form'],
  ['day-set', 'day-set-page'],
  ['slot', 'slot-page'],
  ['template', 'template-page'],
  ['calendar', 'calendar-root'],
  ['planning', 'planning-page'],
  ['statistic', 'statistic-page'],
] as const;

for (const [path, landmark] of pages) {
  test(`${path} — populated page`, async ({ page, visual, isMobile }) => {
    await visual.open(`/${path}`, landmark);
    await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
    if (path === 'calendar' || path === 'planning') {
      const actions = [
        ['open-day', 'Open day view', 'today'],
        ['manage-cycle', 'Manage cycle', 'autorenew'],
        ['manage-items', 'Manage entries', 'edit_note'],
      ] as const;
      for (const [action, label, icon] of actions) {
        const button = page.getByTestId(`calendar-month-${action}-2026-03-25`);
        await expect(button).toHaveAccessibleName(`${label} for 2026-03-25`);
        const glyph = button.locator(`svg[data-icon="${icon}"]`);
        const text = button.locator('.calendar-month-day__quick-action-label');
        if (isMobile) {
          await expect(glyph).toBeVisible();
          await expect(text).toBeHidden();
          const buttonBox = (await button.boundingBox())!;
          const iconBox = (await glyph.boundingBox())!;
          expect(iconBox.x).toBeGreaterThanOrEqual(buttonBox.x);
          expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(buttonBox.x + buttonBox.width);
          expect(iconBox.y).toBeGreaterThanOrEqual(buttonBox.y);
          expect(iconBox.y + iconBox.height).toBeLessThanOrEqual(buttonBox.y + buttonBox.height);
        } else {
          await expect(glyph).toBeHidden();
          await expect(text).toBeVisible();
        }
      }
    }
    const mobilePlanning = path === 'planning' && isMobile;
    await visual.capture(`${path}.png`, !mobilePlanning);
    if (mobilePlanning) {
      await page.getByTestId('calendar-month-day-2026-03-25').scrollIntoViewIfNeeded();
      await visual.ready();
      await expect(page).toHaveScreenshot('planning-today.png', { fullPage: false });
    }
  });
}

for (const view of ['year', 'week', 'day'] as const) {
  test(`calendar — ${view} view`, async ({ page, visual, isMobile }) => {
    await visual.open('/calendar', 'calendar-root');
    await page.getByTestId(`calendar-view-${view}`).click();
    const landmark = view === 'day'
      ? 'calendar-day-manage-items'
      : `calendar-${view === 'week' && isMobile ? 'week-mobile' : view}-day-2026-03-25`;
    await expect(page.getByTestId(landmark)).toBeVisible();
    await visual.ready();
    // Very tall mobile full-page captures mix visible/offscreen text raster caches.
    // Capture real viewport states for the annual overview and the current month.
    const mobileYear = view === 'year' && isMobile;
    if (mobileYear) {
      await expect(page).toHaveScreenshot(`calendar-${view}.png`, { fullPage: false });
    } else {
      await visual.capture(`calendar-${view}.png`);
    }
    if (mobileYear) {
      await page.getByTestId('calendar-year-day-2026-03-25').scrollIntoViewIfNeeded();
      await visual.ready();
      await expect(page).toHaveScreenshot('calendar-year-current-month.png', { fullPage: false });
    }
  });
}

test('product — create dialog', async ({ page, visual }) => {
  await visual.open('/product', 'product-page');
  await page.getByTestId('catalogue-add-action').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await visual.ready();
  await expect(page).toHaveScreenshot('product-dialog.png', { fullPage: false });
});

test('inventory — nested product picker', async ({ page, visual }) => {
  await visual.open('/inventory', 'inventory-page');
  await page.getByTestId('inventory-select-1').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByTestId('inventory-dialog').getByRole('button', { name: 'Open add products', exact: true }).click();
  await expect(page.getByTestId('inventory-add-products-dialog')).toBeVisible();
  await visual.ready();
  await expect(page).toHaveScreenshot('inventory-product-picker.png', { fullPage: false });
});

test('mobile — navigation drawer', async ({ page, visual, isMobile }) => {
  test.skip(!isMobile, 'Drawer is only present below the mobile breakpoint');
  await visual.open('/home', 'home-dashboard');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page).toHaveScreenshot('navigation-drawer.png', { fullPage: false });
});

test('shopping list — empty state', async ({ page, visual }) => {
  await page.route('http://localhost:3000/shopping-list', (route) => route.fulfill({ json: [] }));
  await visual.open('/shopping-list', 'shopping-list-page');
  await expect(page.getByText('No list.', { exact: true })).toBeVisible();
  await visual.capture('shopping-list-empty.png');
});

test.describe('intentional API failure', () => {
  test.use({ allowedApiErrors: ['/shopping-list'] });
  test('shopping list — error state', async ({ page, visual }) => {
    await page.route('http://localhost:3000/shopping-list', (route) => route.fulfill({
      status: 503, json: { message: 'Service temporarily unavailable' },
    }));
    await visual.open('/shopping-list', 'shopping-list-page');
    await expect(page.locator('app-ui-error-panel')).toBeVisible();
    await visual.capture('shopping-list-error.png');
  });
});
