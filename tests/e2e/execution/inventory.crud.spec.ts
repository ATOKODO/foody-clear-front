import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test.describe('Inventory CRUD', () => {
  test('creates a new inventory from the dialog', async ({ page, mockApi }) => {
    await gotoRoute(page, '/inventory');
    await expectShellTitle(page, 'Inventaires');
    await expect(page.getByTestId('inventory-list')).toContainText('Frigo maison');

    await page.getByTestId('inventory-add').click();
    const dialog = page.getByTestId('inventory-dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/Nom/i).fill('Inventaire E2E');
    await dialog.getByRole('button', { name: 'Creer' }).click();

    await expect.poll(() => mockApi.state.inventories.some((item) => item.name === 'Inventaire E2E')).toBe(true);
    await expect(page.getByTestId('inventory-list')).toContainText('Inventaire E2E');
  });

  test('updates and deletes an inventory from the list', async ({ page, mockApi }) => {
    mockApi.reset();

    await gotoRoute(page, '/inventory');
    await expectShellTitle(page, 'Inventaires');
    await expect(page.getByTestId('inventory-list')).toContainText('Frigo maison');
    await expect(page.getByTestId('inventory-list')).toContainText('Placard');

    await page.getByTestId('inventory-edit-1').click();
    const dialog = page.getByTestId('inventory-dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel(/Nom/i);
    await nameInput.fill('');
    await nameInput.fill('Frigo principal');
    await dialog.getByRole('button', { name: 'Mettre a jour' }).click();

    await expect(page.getByTestId('inventory-row-1')).toContainText('Frigo principal');
    await dialog.getByRole('button', { name: 'Annuler' }).click();
    await expect(dialog).toBeHidden();

    await page.getByTestId('inventory-delete-2').click();
    await expect(page.getByTestId('inventory-row-2')).toHaveCount(0);
  });
});
