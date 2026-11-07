import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput, selectLabeledOption } from './utils';

test('uses shared insufficient-stock badges in the template list and editor', async ({ page, mockApi }) => {
  mockApi.state.templates[0].items[0].qty = 1000;
  await gotoRoute(page, '/template');
  await clickTestId(page, 'template-select-1');
  const stock = page.getByTestId('template-item-row-1').getByText('Low stock', { exact: true });
  await expect(stock).toHaveClass(/app-status-pill--danger/);
  await expect(stock).toHaveCSS('border-top-width', '0px');
  await clickTestId(page, 'template-edit');
  const editorStock = page.getByTestId('template-dialog').getByTestId('template-item-edit-row-1').getByText('Low stock', { exact: true });
  await expect(editorStock).toHaveClass(/app-status-pill--danger/);
  await expect(editorStock).toHaveClass(/app-status-pill--appearance-soft/);
});

test('adds, updates and deletes template items', async ({ page, mockApi }) => {
  await gotoRoute(page, '/template');
  await expectShellTitle(page, 'Templates');

  await clickTestId(page, 'template-select-1');
  await clickTestId(page, 'template-edit');

  const dialog = page.getByTestId('template-dialog');
  await expect(dialog).toBeVisible();

  await selectLabeledOption(page, dialog, 'Product', 'Basmati rice');
  await fillLabeledInput(dialog, 'Quantity', '2');
  await selectLabeledOption(page, dialog, 'Unit', "g (Gram)");
  await selectLabeledOption(page, dialog, 'Explicit slot', '2. Lunch (lunch)');
  await dialog.getByTestId('template-item-save').click();

  await expect.poll(() =>
    mockApi.state.templates
      .find((template) => template.id === 1)
      ?.items.some((item) => item.productId === 3 && item.qty === 2 && item.slotId === 2),
  ).toBe(true);

  const createdItem = mockApi.state.templates.find((template) => template.id === 1)?.items.find(
    (item) => item.productId === 3 && item.qty === 2 && item.slotId === 2,
  );
  expect(createdItem?.id).toBeTruthy();
  const itemId = createdItem?.id;
  expect(itemId).toBeTruthy();

  await expect(dialog.getByTestId(`template-item-edit-row-${itemId}`)).toContainText('Basmati rice');

  await clickTestId(dialog, `template-item-edit-${itemId}`);
  await selectLabeledOption(page, dialog, 'Product', 'Basmati rice');
  await fillLabeledInput(dialog, 'Quantity', '3');
  await selectLabeledOption(page, dialog, 'Explicit slot', '1. Breakfast (breakfast)');
  await dialog.getByTestId('template-item-save').click();

  await expect.poll(() =>
    mockApi.state.templates
      .find((template) => template.id === 1)
      ?.items.some((item) => item.id === itemId && item.qty === 3 && item.slotId === 1),
  ).toBe(true);

  await clickTestId(dialog, `template-item-delete-${itemId}`);

  await expect.poll(() =>
    mockApi.state.templates
      .find((template) => template.id === 1)
      ?.items.some((item) => item.id === itemId),
  ).toBe(false);
  await expect(dialog.getByTestId(`template-item-edit-row-${itemId}`)).toHaveCount(0);
});
