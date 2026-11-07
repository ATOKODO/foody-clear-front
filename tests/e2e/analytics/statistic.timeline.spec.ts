import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { createRealisticMockApiState } from '../../mocks/realistic-state';

test.describe('Statistics timeline', () => {
  test('shows expense and target timelines for the selected day', async ({ page }) => {
    await gotoRoute(page, '/statistic');
    await expectShellTitle(page, 'Statistics');
    await page.getByTestId('stat-view-expenses').click();

    await expect(page.getByTestId('stat-expense-timeline')).toBeVisible();
    await page.getByTestId('stat-expense-day-2026-03-25').click();

    await expect(page.getByText("Details for 25 Mar 2026")).toBeVisible();
    await expect(page.getByText('2 events')).toBeVisible();
    await expect(page.getByText('Banana')).toBeVisible();
    await expect(page.getByText('Chicken breast')).toBeVisible();

    await page.getByTestId('stat-view-targets').click();
    await expect(page.getByTestId('stat-target-timeline')).toBeVisible();
    await page.getByTestId('stat-target-day-2026-03-25').click();

    await expect(page.getByText("Details for 25 Mar 2026")).toBeVisible();
    await expect(page.getByText('Day set: Rest Day')).toBeVisible();
    await expect(page.getByText("Recorded items: 2")).toBeVisible();
    const values = page.getByTestId('stat-target-details').locator('.target-detail-box strong');
    await expect(values.nth(1)).toHaveText('--');
    await expect(values.nth(2)).toHaveText('--');
  });
});

for (const language of ['en', 'fr'] as const) {
  for (const width of [390, 1440]) {
    test(`shows calorie targets, localized dates and aligned values in ${language} at ${width}px`, async ({ page, mockApi }) => {
      mockApi.reset(createRealisticMockApiState());
      await page.setViewportSize({ width, height: 1000 });
      await gotoRoute(page, '/statistic');
      if (language === 'fr') await page.getByTestId('language-fr').click();
      await page.getByTestId('stat-target-day-2026-02-24').click();
      const details = page.getByTestId('stat-target-details');
      await expect(details.getByRole('heading')).toHaveText(language === 'fr' ? 'Détail du 24 févr. 2026' : 'Details for 24 Feb 2026');
      const values = details.locator('.target-detail-box strong');
      await expect(values.nth(1)).toHaveText(language === 'fr' ? '2\u202f020 kcal' : '2,020 kcal');
      await expect(values.nth(2)).toHaveText(language === 'fr' ? '-300,5 kcal' : '-300.5 kcal');
      for (const box of await details.locator('.target-detail-box').all()) {
        const positions = await box.evaluate(element => {
          const label = element.querySelector('span')!.getBoundingClientRect();
          const value = element.querySelector('strong')!.getBoundingClientRect();
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return { gap: value.left - label.right, inset: bounds.right - value.right, padding: parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth) };
        });
        expect(positions.gap).toBeGreaterThanOrEqual(15);
        expect(Math.abs(positions.inset - positions.padding)).toBeLessThan(1);
      }
    });
  }
}
