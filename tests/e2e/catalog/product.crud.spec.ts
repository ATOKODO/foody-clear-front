import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('creates, edits and deletes a product', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/product');
  await expectShellTitle(page, 'Catalogue');
  await expect(page.getByTestId('product-page')).toBeVisible();

  await page.getByTestId('product-add').click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Product');
  await dialog.getByLabel('quantityPerUnit *').fill('250');
  await selectMatOptionByLabel(page, dialog, 'Categorie', 'Fruits (#1)');
  await selectMatOptionByLabel(page, dialog, 'Generic product', 'Banane (#1)');
  await selectMatOptionByLabel(page, dialog, 'unitType *', 'Unite');
  await selectMatOptionByLabel(page, dialog, 'quantityUnit *', 'Gramme (g)');
  await dialog.getByRole('button', { name: 'Valider' }).click();

  const createdRow = page.locator('tr').filter({ hasText: 'E2E Product' }).last();
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: 'Modifier' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Product updated');
  await dialog.getByLabel('quantityPerUnit *').fill('300');
  await dialog.getByRole('button', { name: 'Valider' }).click();

  const updatedRow = page.locator('tr').filter({ hasText: 'E2E Product updated' }).last();
  await expect(updatedRow).toBeVisible();

  await updatedRow.getByRole('button', { name: 'Retirer' }).click();
  await expect(page.locator('tr').filter({ hasText: 'E2E Product updated' })).toHaveCount(0);
});
