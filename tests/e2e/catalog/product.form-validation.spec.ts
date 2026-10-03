import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('shows the product form validation errors', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/product');
  await expectShellTitle(page, 'Catalog');
  await expect(page.getByTestId('product-page')).toBeVisible();

  await page.getByTestId('catalogue-add-action').click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Name *').fill('   ');
  await dialog.getByLabel("Quantity per unit *").fill('250');
  await dialog.getByRole('button', { name: "Confirm" }).click();
  await expect(dialog).toBeVisible();
  expect(mockApi.state.products.some((product) => product.name.trim() === '')).toBe(false);

  await dialog.getByLabel('Name *').fill('E2E Product validation');
  await dialog.getByLabel("Quantity per unit *").fill('250');
  await selectMatOptionByLabel(page, dialog, "Container type *", "Unit");
  await selectMatOptionByLabel(page, dialog, "Quantity unit *", 'Gram (g)');
  await dialog.getByRole('spinbutton', { name: "Price", exact: true }).fill('3.20');
  await dialog.getByRole('button', { name: "Confirm" }).click();
  await expect(
    dialog.getByText("price and priceUnit must be provided together.").first(),
  ).toBeVisible();

  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  await page.getByTestId('catalogue-add-action').click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Name *').fill('E2E Product validation 2');
  await dialog.getByLabel("Quantity per unit *").fill('250');
  await selectMatOptionByLabel(page, dialog, "Container type *", "Unit");
  await selectMatOptionByLabel(page, dialog, "Quantity unit *", 'Gram (g)');
  await dialog.getByLabel("Number of portions").fill('2');
  await dialog.getByRole('button', { name: "Confirm" }).click();
  await expect(
    dialog
      .getByText("portionUnit is required if portionCount or portionQuantityNormalized is set.")
      .first(),
  ).toBeVisible();
});
