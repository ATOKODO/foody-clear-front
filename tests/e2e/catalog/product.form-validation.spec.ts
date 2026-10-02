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
  await dialog.getByLabel('quantityPerUnit *').fill('250');
  await dialog.getByRole('button', { name: 'Valider' }).click();
  await expect(dialog).toBeVisible();
  expect(mockApi.state.products.some((product) => product.name.trim() === '')).toBe(false);

  await dialog.getByLabel('Name *').fill('E2E Product validation');
  await dialog.getByLabel('quantityPerUnit *').fill('250');
  await selectMatOptionByLabel(page, dialog, 'unitType *', 'Unite');
  await selectMatOptionByLabel(page, dialog, 'quantityUnit *', 'Gramme (g)');
  await dialog.getByRole('spinbutton', { name: 'price', exact: true }).fill('3.20');
  await dialog.getByRole('button', { name: 'Valider' }).click();
  await expect(
    dialog.getByText('price et priceUnit doivent etre renseignes ensemble.').first(),
  ).toBeVisible();

  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  await page.getByTestId('catalogue-add-action').click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Name *').fill('E2E Product validation 2');
  await dialog.getByLabel('quantityPerUnit *').fill('250');
  await selectMatOptionByLabel(page, dialog, 'unitType *', 'Unite');
  await selectMatOptionByLabel(page, dialog, 'quantityUnit *', 'Gramme (g)');
  await dialog.getByLabel('portionCount').fill('2');
  await dialog.getByRole('button', { name: 'Valider' }).click();
  await expect(
    dialog
      .getByText('portionUnit est requis si portionCount ou portionQuantityNormalized est renseigne.')
      .first(),
  ).toBeVisible();
});
