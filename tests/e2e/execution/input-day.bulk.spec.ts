import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { loadStandaloneInputDay } from './utils';

async function loadInputDay(page: Page): Promise<void> {
  await loadStandaloneInputDay(page);
  await expect(page.getByTestId('input-day-item-1')).toBeVisible();
}

test.describe('Input day - bulk', () => {
  test('creates multiple items in a single bulk request', async ({ page }) => {
    await loadInputDay(page);

    await selectMatOptionByLabel(page, page, 'Inventories', 'Frigo maison (#1)');
    await page.getByTestId('product-row-1').getByRole('checkbox').check();
    await page.getByTestId('product-row-2').getByRole('checkbox').check();

    const firstRow = page.getByTestId('input-day-selected-product-1');
    const secondRow = page.getByTestId('input-day-selected-product-2');

    await expect(firstRow).toBeVisible();
    await expect(secondRow).toBeVisible();

    await firstRow.locator('input[type="number"]').fill('3');
    await secondRow.locator('input[type="number"]').fill('1');

    await page.getByTestId('input-day-create-items').click();

    await expect(page.locator('[data-testid^="input-day-item-"]')).toHaveCount(4);
    await expect(page.getByTestId('input-day-item-3')).toContainText('Banane');
    await expect(page.getByTestId('input-day-item-4')).toContainText('Blanc de poulet');
  });
});
