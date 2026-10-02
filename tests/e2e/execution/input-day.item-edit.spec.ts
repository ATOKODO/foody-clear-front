import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { loadStandaloneInputDay } from './utils';

async function loadInputDay(page: Page): Promise<void> {
  await loadStandaloneInputDay(page);
  await expect(page.getByTestId('input-day-item-1')).toBeVisible();
}

test.describe('Input day - item editing', () => {
  test('updates an existing item from the editor', async ({ page }) => {
    await loadInputDay(page);

    await page.getByTestId('input-day-item-1').getByRole('button', { name: 'Edit' }).click();
    await page.locator('input[formcontrolname="qty"]').fill('2');
    await page.getByTestId('input-day-submit-item').click();

    await expect(page.getByTestId('input-day-item-1')).toContainText('2');
  });

  test('deletes an existing item from the editor', async ({ page }) => {
    await loadInputDay(page);

    await page.getByTestId('input-day-item-2').getByRole('button', { name: 'Edit' }).click();
    await page.getByTestId('input-day-delete-item').click();

    await expect(page.locator('[data-testid^="input-day-item-"]')).toHaveCount(1);
    await expect(page.getByTestId('input-day-item-2')).toHaveCount(0);
  });
});
