import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('creates, edits and deletes a generic product', async ({ page, mockApi }) => {
  void mockApi;

  await gotoRoute(page, '/generic-product');
  await expectShellTitle(page, 'Produits generiques');
  await expect(page.getByTestId('generic-product-list')).toBeVisible();

  await page.getByTestId('generic-product-add').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Generic Product');
  await dialog.getByLabel('Quantite unite minimum *').fill('6');
  await selectMatOptionByLabel(page, dialog, 'Type unite', 'piece');
  await dialog.getByLabel('Quantite metrique minimum *').fill('900');
  await selectMatOptionByLabel(page, dialog, 'Type metrique', 'g');
  await dialog.getByRole('button', { name: 'Creer' }).click();

  const createdRow = page.locator('tr').filter({ hasText: 'E2E Generic Product' }).last();
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: 'Modifier' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel('Nom *').fill('E2E Generic Product updated');
  await editDialog.getByLabel('Quantite unite minimum *').fill('8');
  await selectMatOptionByLabel(page, editDialog, 'Type unite', 'portion');
  await editDialog.getByLabel('Quantite metrique minimum *').fill('1200');
  await selectMatOptionByLabel(page, editDialog, 'Type metrique', 'kg');
  await editDialog.getByRole('button', { name: 'Mettre a jour' }).click();

  const updatedRow = page.locator('tr').filter({ hasText: 'E2E Generic Product updated' }).last();
  await expect(updatedRow).toBeVisible();

  await updatedRow.getByRole('button', { name: 'Retirer' }).click();
  await expect(page.locator('tr').filter({ hasText: 'E2E Generic Product updated' })).toHaveCount(0);
});
