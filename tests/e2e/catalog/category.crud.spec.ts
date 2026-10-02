import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('creates, edits and deletes a category', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/category');
  await expectShellTitle(page, 'Categories');
  await expect(page.getByTestId('category-page')).toBeVisible();

  await page.getByTestId('category-add').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Category');
  await dialog.getByLabel('Warn before days *').fill('4');
  await dialog.getByLabel('Recently expired days *').fill('7');
  await dialog.getByLabel('Min quantity *').fill('2');
  await dialog.getByRole('button', { name: 'Create' }).click();

  const createdRow = page.locator('tr').filter({ hasText: 'E2E Category' }).last();
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel('Nom *').fill('E2E Category updated');
  await editDialog.getByLabel('Warn before days *').fill('5');
  await editDialog.getByLabel('Recently expired days *').fill('8');
  await editDialog.getByLabel('Min quantity *').fill('3');
  await editDialog.getByRole('button', { name: 'Update' }).click();

  const updatedRow = page.locator('tr').filter({ hasText: 'E2E Category updated' }).last();
  await expect(updatedRow).toBeVisible();

  await updatedRow.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('tr').filter({ hasText: 'E2E Category updated' })).toHaveCount(0);
});
