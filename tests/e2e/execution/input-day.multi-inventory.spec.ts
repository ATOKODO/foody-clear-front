import { expect, test } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';
import { loadStandaloneInputDay } from './utils';

test('consumes split stocks and restores each source after editing and deleting the entry', async ({ page, mockApi }) => {
  mockApi.reset({
    inputDayItems: [],
    inventoryProducts: [
      { id: 1, inventoryId: 1, productId: 1, qtyOnHandInUnits: 0.5, qtyOnHandNormalized: 60 },
      { id: 4, inventoryId: 2, productId: 1, qtyOnHandInUnits: 50 / 120, qtyOnHandNormalized: 50 },
    ],
  });
  await loadStandaloneInputDay(page);
  await selectMatOptionByLabel(page, page, 'Inventories', 'Frigo maison (#1)');
  await selectMatOptionByLabel(page, page, 'Inventories', 'Placard (#2)');
  await page.getByTestId('product-row-1').getByRole('checkbox').check();
  const selected = page.getByTestId('input-day-selected-product-1');
  await selected.locator('input[type="number"]').fill('100');
  await selectMatOptionByLabel(page, selected, 'Unit', 'g');
  const creation = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/items/bulk'));
  await page.getByTestId('input-day-create-items').click();
  expect((await creation).postDataJSON().items[0].inventoryIds).toEqual([1, 2]);
  const row = page.getByTestId('input-day-item-3');
  await expect(row).toContainText('Banane');
  expect(mockApi.state.inventoryProducts.map((stock) => stock.qtyOnHandNormalized)).toEqual([0, 10]);
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('input[formcontrolname="qty"]').fill('105');
  await page.getByTestId('input-day-submit-item').click();
  await expect.poll(() => mockApi.state.inputDayItems[0].qty).toBe(105);
  expect(mockApi.state.inputDayItems[0].inventoryAllocations).toEqual([
    { inventoryId: 1, qtyNormalized: 60 }, { inventoryId: 2, qtyNormalized: 45 },
  ]);
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByTestId('input-day-delete-item').click();
  await expect(row).toHaveCount(0);
  expect(mockApi.state.inventoryProducts.map((stock) => stock.qtyOnHandNormalized)).toEqual([60, 50]);
});
