import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test.describe('Statistics timeline', () => {
  test('shows expense and target timelines for the selected day', async ({ page }) => {
    await gotoRoute(page, '/statistic');
    await expectShellTitle(page, 'Statistics');
    await page.getByTestId('stat-view-expenses').click();

    await expect(page.getByTestId('stat-expense-timeline')).toBeVisible();
    await page.getByTestId('stat-expense-day-2026-03-25').click();

    await expect(page.getByText('Detail du 2026-03-25')).toBeVisible();
    await expect(page.getByText('2 evenement(s)')).toBeVisible();
    await expect(page.getByText('Banane')).toBeVisible();
    await expect(page.getByText('Blanc de poulet')).toBeVisible();

    await page.getByTestId('stat-view-targets').click();
    await expect(page.getByTestId('stat-target-timeline')).toBeVisible();
    await page.getByTestId('stat-target-day-2026-03-25').click();

    await expect(page.getByText('Detail du 2026-03-25')).toBeVisible();
    await expect(page.getByText('Day set: Rest Day')).toBeVisible();
    await expect(page.getByText('Items saisis: 2')).toBeVisible();
  });
});
