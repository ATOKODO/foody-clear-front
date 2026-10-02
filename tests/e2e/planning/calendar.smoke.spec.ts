import { expect, test } from '../../fixtures/test';
import { expectShellTitle } from '../../helpers/navigation';

test('@smoke calendar navigation stays stable across views', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.getByTestId('calendar-root')).toBeVisible();
  await expectShellTitle(page, 'Calendar');

  await page.getByTestId('calendar-view-year').click();
  await expect(page.getByTestId('calendar-year-day-2026-03-25')).toBeVisible();
  await page.getByTestId('calendar-open-month-2026-3').click();
  await expect(page.getByTestId('calendar-month-day-2026-03-25')).toBeVisible();

  await page.getByTestId('calendar-next').click();
  await expect(page.getByTestId('calendar-month-day-2026-04-01')).toBeVisible();

  await page.getByTestId('calendar-prev').click();
  await expect(page.getByTestId('calendar-month-day-2026-03-25')).toBeVisible();

  await page.getByTestId('calendar-today').click();
  await expect(page.getByTestId('calendar-month-day-2026-03-25')).toBeVisible();

  await page.getByTestId('calendar-view-week').click();
  await expect(page.getByTestId('calendar-week-day-2026-03-25')).toBeVisible();

  await page.getByTestId('calendar-view-day').click();
  await expect(page.getByTestId('calendar-day-manage-items')).toBeVisible();
  await expect(page.getByTestId('calendar-day-half-hour-08-00')).toBeVisible();
});
