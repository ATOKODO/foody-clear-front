import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test('creates, edits and deletes a product', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/product');
  await expectShellTitle(page, 'Catalog');
  await expect(page.getByTestId('product-page')).toBeVisible();

  await page.getByTestId('catalogue-add-action').click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Name *').fill('E2E Product');
  await dialog.getByLabel("Quantity per unit *").fill('250');
  await selectMatOptionByLabel(page, dialog, 'Category', 'Fruits');
  await selectMatOptionByLabel(page, dialog, 'Generic product', 'Banane');
  await selectMatOptionByLabel(page, dialog, "Container type *", "Unit");
  await selectMatOptionByLabel(page, dialog, "Quantity unit *", 'Gram (g)');
  await dialog.getByRole('button', { name: "Confirm" }).click();

  const createdRow = page.locator('tr').filter({ hasText: 'E2E Product' }).last();
  await expect(createdRow).toBeVisible();

  await createdRow.getByRole('button', { name: 'Edit' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Name *').fill('E2E Product updated');
  await dialog.getByLabel("Quantity per unit *").fill('300');
  const removedNutritionIds = mockApi.state.products.find((product) => product.name === 'E2E Product')!.nutritionValues.map((value) => value.id);
  expect(removedNutritionIds.length).toBeGreaterThan(0);
  const removeNutrition = dialog.getByRole('button', { name: 'Remove', exact: true });
  await expect(removeNutrition).toHaveCount(removedNutritionIds.length);
  for (let remaining = removedNutritionIds.length; remaining > 0; remaining--) {
    await removeNutrition.first().click();
    await expect(removeNutrition).toHaveCount(remaining - 1);
  }
  const updateRequest = page.waitForRequest((request) => request.method() === 'PATCH' && /\/product\/\d+$/.test(new URL(request.url()).pathname));
  await dialog.getByRole('button', { name: "Confirm" }).click();
  expect((await updateRequest).postDataJSON()).toMatchObject({ nutritionValuesUpdated: [], nutritionValueIdsToRemove: removedNutritionIds });

  const updatedRow = page.locator('tr').filter({ hasText: 'E2E Product updated' }).last();
  await expect(updatedRow).toBeVisible();
  await updatedRow.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();

  await updatedRow.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('tr').filter({ hasText: 'E2E Product updated' })).toHaveCount(0);
});
