import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('creates, edits and deletes a tag', async ({ page, mockApi }) => {
  void mockApi;

  await gotoRoute(page, '/tag');
  await expectShellTitle(page, 'Tags');
  await expect(page.getByTestId('tag-list')).toBeVisible();

  await page.getByTestId('tag-add').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Nom *').fill('E2E Tag');
  await dialog.getByRole('button', { name: 'Creer' }).click();

  const createdRow = page.locator('tr').filter({ hasText: 'E2E Tag' }).last();
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: 'Modifier' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel('Nom *').fill('E2E Tag updated');
  await editDialog.getByRole('button', { name: 'Mettre a jour' }).click();

  const updatedRow = page.locator('tr').filter({ hasText: 'E2E Tag updated' }).last();
  await expect(updatedRow).toBeVisible();

  await updatedRow.getByRole('button', { name: 'Retirer' }).click();
  await expect(page.locator('tr').filter({ hasText: 'E2E Tag updated' })).toHaveCount(0);
});
