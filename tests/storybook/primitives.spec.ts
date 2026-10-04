import { expect, test } from '@playwright/test';

test('invalid Material fields use real validators and recover after entry', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-text-field--invalid&viewMode=story&globals=language:en');
  const input = page.getByRole('textbox', { name: 'Product' });
  // Material deliberately omits aria-invalid for an empty required native input.
  // Check the actual form validity and the accessible error association instead.
  await expect(input).toHaveClass(/ng-invalid/);
  await expect(page.locator('mat-error')).toHaveText('This field is required.');
  await expect(input).toHaveAttribute('aria-describedby', (await page.locator('mat-error').getAttribute('id'))!);
  await input.fill('Banana');
  await input.blur();
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await expect(input).toHaveClass(/ng-valid/);
  await expect(page.locator('mat-error')).not.toBeVisible();
});

test('Material selection controls remain keyboard accessible', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-checkbox--unchecked&viewMode=story&globals=language:en');
  const checkbox = page.getByRole('checkbox', { name: 'Select product' });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await page.goto('/iframe.html?id=ui-material-select--multiple&viewMode=story&globals=language:en');
  await page.getByRole('combobox', { name: 'Inventory' }).click();
  const freezer = page.getByRole('option', { name: 'Freezer', exact: true });
  await freezer.click();
  await expect(freezer).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('combobox', { name: 'Inventory' })).toContainText('Freezer');
});

test('Material date picker updates the bound date and disabled inputs cannot open it', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-date-picker--selected&viewMode=story&globals=language:en');
  const original = await page.getByRole('textbox', { name: 'Date' }).inputValue();
  await page.getByRole('button', { name: 'Open calendar' }).click();
  await page.locator('mat-calendar').getByText('26', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Date' })).not.toHaveValue(original);
  await expect(page.locator('mat-calendar')).toHaveCount(0);
  await page.goto('/iframe.html?id=ui-material-date-picker--disabled&viewMode=story&globals=language:en');
  await expect(page.getByRole('textbox', { name: 'Date' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open calendar' })).toBeDisabled();
});

test('tabs, progress and data tables expose their actual Material states', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-material-tabs--interactive&viewMode=story');
  await page.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('JSON product entry');
  await page.goto('/iframe.html?id=ui-material-progress--determinate&viewMode=story');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  await page.goto('/iframe.html?id=ui-material-data-table--populated&viewMode=story');
  await expect(page.getByRole('table', { name: 'Inventory products' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Select Banana', exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Select Banana', exact: true })).toBeChecked();
});

test('feedback stories preserve native disclosure and code focus behavior', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-alert--with-details&viewMode=story');
  await expect(page.getByRole('alert')).toContainText('The request failed.');
  const summary = page.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details')).toHaveAttribute('open', '');
  await expect(page.locator('pre[appCodePanel]')).toBeVisible();
  await page.locator('pre[appCodePanel]').focus();
  await expect(page.locator('pre[appCodePanel]')).toBeFocused();
});

test('native table density, headers and editable cells use the real shared components', async ({ page }) => {
  await page.goto('/iframe.html?id=ui-native-table--standard&viewMode=story');
  const quantity = page.getByRole('cell', { name: '400 g', exact: true });
  await expect(page.getByRole('table', { name: 'Current stock' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Quantity' })).toHaveCSS('text-align', 'end');
  await expect(page.getByRole('rowheader', { name: 'Banana' })).toHaveAttribute('scope', 'row');
  const standardPadding = await quantity.evaluate(element => parseFloat(getComputedStyle(element).paddingTop));
  await page.goto('/iframe.html?id=ui-native-table--compact&viewMode=story');
  await expect(quantity).toBeVisible();
  expect(await quantity.evaluate(element => parseFloat(getComputedStyle(element).paddingTop))).toBeLessThan(standardPadding);
  await page.goto('/iframe.html?id=ui-native-table--editable&viewMode=story');
  const input = page.getByRole('spinbutton', { name: 'Quantity' });
  await input.fill('12');
  await input.press('Tab');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('12');
});

test('table viewports scroll using the keyboard and empty-state actions stay reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/iframe.html?id=ui-table-viewport--outlined&viewMode=story');
  const viewport = page.getByRole('region', { name: 'Inventory products', exact: true });
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await page.goto('/iframe.html?id=ui-native-table--empty&viewMode=story');
  await expect(page.getByRole('cell', { name: 'No products available.' })).toHaveAttribute('colspan', '2');
  await page.goto('/iframe.html?id=ui-empty-state--with-action&viewMode=story');
  const action = page.getByRole('button', { name: 'Create inventory', exact: true });
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(action).toBeFocused();
  await expect(page.locator('div[appEmptyState]')).not.toHaveAttribute('role', 'alert');
});
