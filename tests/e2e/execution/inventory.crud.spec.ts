import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';

test.describe('Inventory CRUD', () => {
  test('traps focus and closes only the innermost dialog with Escape', async ({ page }) => {
    await gotoRoute(page, '/inventory');
    const edit = page.getByTestId('inventory-select-1').getByRole('button', { name: 'Edit', exact: true });
    await edit.click();
    const editor = page.getByTestId('inventory-dialog');
    const addProducts = editor.getByRole('button', { name: 'Open add products', exact: true });
    await addProducts.click();
    const picker = page.getByTestId('inventory-add-products-dialog');
    await expect(picker).toBeVisible();
    await expect.poll(() => picker.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press(index % 2 === 0 ? 'Shift+Tab' : 'Tab');
      await expect.poll(() => picker.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await picker.getByRole('checkbox', { name: 'Select Banana', exact: true }).focus();
    await page.keyboard.press('Escape');
    await expect(picker).toBeHidden();
    await expect(editor).toBeVisible();
    await expect(addProducts).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(editor).toBeHidden();
    await expect(edit).toBeFocused();
  });

  test('keeps native checkbox clicks and Space in sync with selected product rows', async ({ page }) => {
    await gotoRoute(page, '/inventory');
    await page.getByTestId('inventory-add-action').click();
    const dialog = page.getByRole('dialog', { name: 'Inventory editor' });
    const checkbox = dialog.getByRole('checkbox', { name: 'Select Banana', exact: true });
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(dialog.getByText('1 selected', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveCount(1);
    await checkbox.press('Space');
    await expect(checkbox).not.toBeChecked();
    await expect(dialog.getByText('0 selected', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveCount(0);
    await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(dialog.getByText('1 selected', { exact: true })).toBeVisible();
  });

  test('creates a new inventory from the dialog', async ({ page, mockApi }) => {
    await gotoRoute(page, '/inventory');
    await expectShellTitle(page, 'Inventories');
    await expect(page.getByTestId('inventory-panel')).toContainText('Home fridge');

    await page.getByTestId('inventory-add-action').click();
    const dialog = page.getByTestId('inventory-dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Name *', { exact: true }).fill('Inventaire E2E');
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect.poll(() => mockApi.state.inventories.some((item) => item.name === 'Inventaire E2E')).toBe(true);
    await expect(page.getByTestId('inventory-panel')).toContainText('Inventaire E2E');
  });

  test('updates and deletes an inventory from the list', async ({ page, mockApi }) => {
    mockApi.reset();

    await gotoRoute(page, '/inventory');
    await expectShellTitle(page, 'Inventories');
    await expect(page.getByTestId('inventory-panel')).toContainText('Home fridge');
    await expect(page.getByTestId('inventory-panel')).toContainText('Pantry');

    await page.getByTestId('inventory-select-1').getByRole('button', { name: 'Edit', exact: true }).click();
    const dialog = page.getByTestId('inventory-dialog');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel('Name *', { exact: true });
    await nameInput.fill('');
    await nameInput.fill('Main fridge');
    await dialog.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByTestId('inventory-select-1')).toContainText('Main fridge');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();

    await page.getByTestId('inventory-select-2').getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByTestId('inventory-select-2')).toHaveCount(0);
  });
});
