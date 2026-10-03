import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('creates, edits and deletes a generic product', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/generic-product');
  await expectShellTitle(page, 'Generic products');
  await expect(page.getByTestId('generic-product-list')).toBeVisible();

  await page.getByTestId('generic-product-add').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Name *").fill('E2E Generic Product');
  await dialog.getByLabel("Minimum unit quantity *").fill('6');
  await selectMatOptionByLabel(page, dialog, "Unit type", "piece");
  await dialog.getByLabel("Minimum metric quantity *").fill('900');
  await selectMatOptionByLabel(page, dialog, "Measurement type", 'g');
  await dialog.getByRole('button', { name: 'Create' }).click();

  const createdRow = page.locator('tr').filter({ hasText: 'E2E Generic Product' }).last();
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel("Name *").fill('E2E Generic Product updated');
  await editDialog.getByLabel("Minimum unit quantity *").fill('8');
  await selectMatOptionByLabel(page, editDialog, "Unit type", "portion");
  await editDialog.getByLabel("Minimum metric quantity *").fill('1200');
  await selectMatOptionByLabel(page, editDialog, "Measurement type", 'kg');
  await editDialog.getByRole('button', { name: 'Update' }).click();

  const updatedRow = page.locator('tr').filter({ hasText: 'E2E Generic Product updated' }).last();
  await expect(updatedRow).toBeVisible();

  await updatedRow.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('tr').filter({ hasText: 'E2E Generic Product updated' })).toHaveCount(0);
});
