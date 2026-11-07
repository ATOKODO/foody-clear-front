import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

async function openInventoryEdit(page: Page, inventoryId: number): Promise<void> {
  await gotoRoute(page, '/inventory');
  await expectShellTitle(page, 'Inventories');
  await expect(page.getByTestId('inventory-panel')).toContainText('Home fridge');
  await page.getByTestId(`inventory-select-${inventoryId}`).getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByTestId('inventory-dialog')).toBeVisible();
}

test.describe('Inventory products', () => {
  test('adds products to an existing inventory', async ({ page, mockApi }) => {
    mockApi.reset();

    await openInventoryEdit(page, 1);

    const dialog = page.getByTestId('inventory-dialog');
    await dialog.getByRole('button', { name: 'Open add products' }).click();

    const addDialog = page.getByTestId('inventory-add-products-dialog');
    await expect(addDialog).toBeVisible();

    const selectableProductRow = addDialog.getByTestId('product-row-3');
    await expect(selectableProductRow).toBeVisible();
    await selectableProductRow.getByRole('checkbox').check();
    const selectedRow = addDialog.locator('table').nth(1).locator('tbody tr').filter({ hasText: 'Basmati rice' });
    await expect(selectedRow).toBeVisible();
    await selectedRow.locator('input[type="number"]').fill('2');

    await addDialog.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(dialog).toContainText('Basmati rice');
    await expect(page.getByTestId('inventory-select-1')).toContainText('3 linked product(s)');
  });

  test('empties the managed inventory stock', async ({ page, mockApi }) => {
    mockApi.reset();

    await openInventoryEdit(page, 1);

    const dialog = page.getByTestId('inventory-dialog');
    await expect(dialog).toContainText('Banana');

    await dialog.getByRole('button', { name: 'Empty inventory' }).click();

    await expect(dialog).toContainText('No product is linked to this inventory.');
    await expect(page.getByTestId('inventory-select-1')).toContainText('0 linked product(s)');
  });
});
