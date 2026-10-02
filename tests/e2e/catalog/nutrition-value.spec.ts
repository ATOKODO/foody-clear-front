import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

function readLastResponseJson(text: string | null): Record<string, unknown> | unknown[] {
  if (!text) {
    throw new Error('No response body found.');
  }

  return JSON.parse(text) as Record<string, unknown> | unknown[];
}

test('creates, reads, updates and deletes a nutrition value', async ({ page, mockApi }) => {
  expect(mockApi).toBeDefined();

  await gotoRoute(page, '/nutrition-value');
  await expectShellTitle(page, 'Nutrition values');
  await expect(page.getByTestId('nutrition-value-page')).toBeVisible();

  await page.getByRole('button', { name: 'Exemple' }).click();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('pre')).toContainText(`"productId": 1`);

  const responseAfterCreate = readLastResponseJson(await page.locator('pre').textContent());
  expect(responseAfterCreate).toMatchObject({
    productId: 1,
    nutritionKey: 'PROTEIN',
    unit: 'G',
    reference: 'PER_100G',
  });

  const createdId = Number((responseAfterCreate as Record<string, unknown>).id);
  expect(createdId).toBeGreaterThan(0);

  await page.getByLabel('id (GET/PATCH/DELETE)').fill(String(createdId));
  await page.getByRole('button', { name: 'Recuperer' }).click();
  await expect(page.locator('pre')).toContainText(`"id": ${createdId}`);

  const responseAfterGetOne = readLastResponseJson(await page.locator('pre').textContent());
  expect(responseAfterGetOne).toMatchObject({
    id: createdId,
    productId: 1,
  });

  await page.getByLabel('nutritionKey *').click();
  await page.getByRole('option', { name: 'FAT', exact: true }).click();
  await page.getByLabel('amount *').fill('18.2');
  await page.getByLabel('unit *').click();
  await page.getByRole('option', { name: 'G', exact: true }).click();
  await page.getByLabel('reference *').click();
  await page.getByRole('option', { name: 'PER_100ML', exact: true }).click();
  await page.getByRole('button', { name: 'Update' }).click();
  await expect(page.locator('pre')).toContainText(`"nutritionKey": "FAT"`);
  await expect(page.locator('pre')).toContainText(`"amount": 18.2`);

  const responseAfterUpdate = readLastResponseJson(await page.locator('pre').textContent());
  expect(responseAfterUpdate).toMatchObject({
    id: createdId,
    nutritionKey: 'FAT',
    amount: 18.2,
    unit: 'G',
    reference: 'PER_100ML',
  });

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('pre')).toContainText(`"deleted": true`);
  const responseAfterDelete = readLastResponseJson(await page.locator('pre').textContent());
  expect(responseAfterDelete).toMatchObject({
    deleted: true,
    id: createdId,
  });

  await page.getByRole('button', { name: 'Lister' }).click();
  await expect(page.locator('pre')).not.toContainText(`"id": ${createdId}`);
  const responseAfterList = readLastResponseJson(await page.locator('pre').textContent());
  expect(Array.isArray(responseAfterList)).toBe(true);
  expect(
    (responseAfterList as Array<Record<string, unknown>>).some((item) => Number(item.id) === createdId),
  ).toBe(false);
});
