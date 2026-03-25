import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

async function openInventoryEdit(page: Page, inventoryId: number): Promise<void> {
  await gotoRoute(page, '/inventory');
  await expectShellTitle(page, 'Inventaires');
  await expect(page.getByTestId('inventory-list')).toContainText('Frigo maison');
  await page.getByTestId(`inventory-edit-${inventoryId}`).click();
  await expect(page.getByTestId('inventory-dialog')).toBeVisible();
}

test.describe('Inventory products', () => {
  test('adds products to an existing inventory', async ({ page, mockApi }) => {
    mockApi.reset();

    await openInventoryEdit(page, 1);

    const dialog = page.getByTestId('inventory-dialog');
    await dialog.getByRole('button', { name: "Ouvrir l'ajout" }).click();

    const addDialog = page.getByTestId('inventory-add-products-dialog');
    await expect(addDialog).toBeVisible();

    const selectableProductRow = addDialog.getByTestId('product-row-3');
    await expect(selectableProductRow).toBeVisible();
    await selectableProductRow.getByRole('checkbox').check();
    const selectedRow = addDialog.locator('table').nth(1).locator('tbody tr').filter({ hasText: 'Riz basmati' });
    await expect(selectedRow).toBeVisible();
    await selectedRow.locator('input[type="number"]').fill('2');

    await addDialog.getByRole('button', { name: 'Ajouter' }).click();

    await expect(dialog).toContainText('Riz basmati');
    await expect(page.getByTestId('inventory-row-1').locator('td').nth(1)).toHaveText('3');
  });

  test('empties the managed inventory stock', async ({ page, mockApi }) => {
    mockApi.reset();

    await openInventoryEdit(page, 1);

    const dialog = page.getByTestId('inventory-dialog');
    await expect(dialog).toContainText('Banane');

    await dialog.getByRole('button', { name: "Vider l'inventory" }).click();

    await expect(dialog).toContainText("Aucun produit lie a cet inventory.");
    await expect(page.getByTestId('inventory-row-1').locator('td').nth(1)).toHaveText('0');
  });
});
