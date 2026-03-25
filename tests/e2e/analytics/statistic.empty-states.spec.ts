import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test.describe('Statistics empty states', () => {
  test('renders empty states when there are no purchases or price history', async ({ page, mockApi }) => {
    mockApi.reset({
      products: [],
      inputDayItems: [],
      inventoryProducts: [],
    });

    await gotoRoute(page, '/statistic');
    await expectShellTitle(page, 'Statistiques');

    await page.getByTestId('stat-expense-day-2026-03-25').click();
    await expect(page.getByTestId('stat-empty-expenses')).toBeVisible();

    await page.getByTestId('stat-view-prices').click();
    await expect(page.getByTestId('stat-empty-price-history')).toBeVisible();
  });
});
