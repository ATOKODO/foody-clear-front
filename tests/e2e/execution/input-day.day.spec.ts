import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { loadStandaloneInputDay } from './utils';

async function loadInputDay(page: Page): Promise<void> {
  await loadStandaloneInputDay(page);
  await expect(page.getByTestId('input-day-item-1')).toBeVisible();
}

test.describe('Input day - day', () => {
  test('keeps the standalone editor without diagnostic or demo controls', async ({ page }) => {
    await loadInputDay(page);

    await expect(page.getByTestId('input-day-load')).toBeVisible();
    await expect(page.getByTestId('input-day-inventory-select')).toBeVisible();
    await expect(page.getByTestId('input-day-base-url')).toHaveCount(0);
    await expect(page.locator('input[formcontrolname="timezone"]')).toHaveCount(0);
    await expect(page.locator('.input-day-response')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Exemple', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Effacer', exact: true })).toHaveCount(0);
  });

  test('creates a single item in the day composer', async ({ page }) => {
    await loadInputDay(page);

    await selectMatOptionByLabel(page, page, 'Inventories', 'Frigo maison (#1)');
    const bananaRow = page.getByTestId('product-row-1');
    await expect(bananaRow).toBeVisible();

    await bananaRow.getByRole('checkbox').check();
    const selectedRow = page.getByTestId('input-day-selected-product-1');
    await expect(selectedRow).toBeVisible();
    await selectedRow.locator('input[type="number"]').fill('2');

    await page.getByTestId('input-day-create-items').click();

    await expect(page.locator('[data-testid^="input-day-item-"]')).toHaveCount(3);
    await expect(page.getByTestId('input-day-item-3')).toContainText('Banane');
  });

  test('edits and deletes an existing day item', async ({ page }) => {
    await loadInputDay(page);

    const itemRow = page.getByTestId('input-day-item-1');
    await itemRow.getByRole('button', { name: 'Edit' }).click();

    await page.locator('input[formcontrolname="qty"]').fill('2');
    await page.getByTestId('input-day-submit-item').click();

    await expect(page.getByTestId('input-day-item-1')).toContainText('2');

    await page.getByTestId('input-day-item-2').getByRole('button', { name: 'Edit' }).click();
    await page.getByTestId('input-day-delete-item').click();

    await expect(page.locator('[data-testid^="input-day-item-"]')).toHaveCount(1);
    await expect(page.getByTestId('input-day-item-2')).toHaveCount(0);
  });
});
