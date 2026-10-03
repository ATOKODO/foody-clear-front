import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput, selectLabeledOption } from './utils';

test('adds, updates and deletes template items', async ({ page, mockApi }) => {
  await gotoRoute(page, '/template');
  await expectShellTitle(page, 'Templates');

  await clickTestId(page, 'template-select-1');
  await clickTestId(page, 'template-edit');

  const dialog = page.getByTestId('template-dialog');
  await expect(dialog).toBeVisible();

  await selectLabeledOption(page, dialog, 'Product', 'Riz basmati');
  await fillLabeledInput(dialog, 'Quantity', '2');
  await selectLabeledOption(page, dialog, 'Unit', "g (Gram)");
  await selectLabeledOption(page, dialog, 'Explicit slot', '2. Dejeuner (lunch)');
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

  await expect(dialog.getByTestId(`template-item-edit-row-${itemId}`)).toContainText('Riz basmati');

  await clickTestId(dialog, `template-item-edit-${itemId}`);
  await selectLabeledOption(page, dialog, 'Product', 'Riz basmati');
  await fillLabeledInput(dialog, 'Quantity', '3');
  await selectLabeledOption(page, dialog, 'Explicit slot', '1. Petit dejeuner (breakfast)');
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
