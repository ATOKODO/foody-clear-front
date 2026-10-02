import { expect, type Locator, type Page } from '@playwright/test';

export async function selectMatOption(
  page: Page,
  trigger: Locator,
  optionText: string,
): Promise<void> {
  const multiple = await trigger.getAttribute('multiple') !== null;
  await trigger.click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
  if (multiple) await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('listbox')).toBeHidden();
}

export async function selectMatOptionByLabel(
  page: Page,
  scope: Locator | Page,
  label: string,
  optionText: string,
): Promise<void> {
  const field = scope.getByRole('combobox', { name: label, exact: true });
  await selectMatOption(page, field, optionText);
}

export async function closeMatDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}
