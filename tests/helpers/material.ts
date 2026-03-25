import type { Locator, Page } from '@playwright/test';

export async function selectMatOption(
  page: Page,
  trigger: Locator,
  optionText: string,
): Promise<void> {
  await trigger.click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
}

export async function selectMatOptionByLabel(
  page: Page,
  scope: Locator | Page,
  label: string,
  optionText: string,
): Promise<void> {
  const field = scope.getByLabel(label, { exact: true });
  await selectMatOption(page, field, optionText);
}

export async function closeMatDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}
