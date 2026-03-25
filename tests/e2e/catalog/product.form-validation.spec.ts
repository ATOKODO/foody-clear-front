import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('shows the product form validation errors', async ({ page, mockApi }) => {
  void mockApi;

  await gotoRoute(page, '/product');
  await expectShellTitle(page, 'Catalogue');
  await expect(page.getByTestId('product-page')).toBeVisible();

  await page.getByTestId('product-add').click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Product validation');
  await dialog.getByLabel('quantityPerUnit *').fill('250');
  await selectMatOptionByLabel(page, dialog, 'unitType *', 'Unite');
  await selectMatOptionByLabel(page, dialog, 'quantityUnit *', 'Gramme (g)');
  await dialog.getByRole('spinbutton', { name: 'price', exact: true }).fill('3.20');
  await dialog.getByRole('button', { name: 'Valider' }).click();
  await expect(
    dialog.getByText('price et priceUnit doivent etre renseignes ensemble.').first(),
  ).toBeVisible();

  await dialog.getByRole('button', { name: 'Fermer' }).click();
  await expect(dialog).toBeHidden();

  await page.getByTestId('product-add').click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Product validation 2');
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
