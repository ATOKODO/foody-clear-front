import type { Page } from '@playwright/test';
import { expect } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

export const inputDayDateLocal = '2026-03-25';

export async function loadStandaloneInputDay(
  page: Page,
  dateLocal = inputDayDateLocal,
): Promise<void> {
  await gotoRoute(page, '/input-day');
  await expectShellTitle(page, 'Saisie du jour');

  const dateInput = page.locator('input[formcontrolname="dateLocal"]').first();
  await expect(dateInput).toBeVisible();
  await dateInput.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = value as string;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }, dateLocal);

  await page.getByTestId('input-day-load').click();
}
