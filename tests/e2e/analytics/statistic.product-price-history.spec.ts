import { expect, test } from '../../fixtures/test';
import { selectMatOption } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test.describe('Statistics price history', () => {
  test('switches products and reflects the price history', async ({ page }) => {
    await gotoRoute(page, '/statistic');
    await expectShellTitle(page, 'Statistiques');

    await page.getByTestId('stat-view-prices').click();
    await expect(page.getByTestId('stat-price-timeline')).toBeVisible();
    await expect(page.getByTestId('stat-price-timeline').locator('.price-timeline__item')).toHaveCount(1);
    await expect(page.getByTestId('stat-price-timeline')).toContainText('0,49');

    await selectMatOption(page, page.getByTestId('stat-price-product-select'), 'Blanc de poulet (#2)');

    await expect(page.getByTestId('stat-price-timeline').locator('.price-timeline__item')).toHaveCount(1);
    await expect(page.getByTestId('stat-price-timeline')).toContainText('8,40');
  });
});
