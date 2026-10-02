import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput } from './utils';

test('creates, updates and deletes a slot', async ({ page, mockApi }) => {
  const createdTitle = `Collation test ${Date.now()}`;
  const updatedTitle = `${createdTitle} renomme`;

  await gotoRoute(page, '/slot');
  await expectShellTitle(page, 'Time slots');

  await clickTestId(page, 'slot-add');
  const dialog = page.getByTestId('slot-dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('input[formcontrolname="key"]').fill('late_snack');
  await fillLabeledInput(dialog, 'Title', createdTitle);
  await fillLabeledInput(dialog, 'Order', '4');
  await fillLabeledInput(dialog, 'Start time', '21:00');
  await fillLabeledInput(dialog, 'End time', '21:30');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect.poll(() => mockApi.state.slots.some((slot) => slot.title === createdTitle)).toBe(true);
  const slotId = mockApi.state.slots.find((slot) => slot.title === createdTitle)?.id;
  expect(slotId).toBeTruthy();

  await expect(page.getByTestId(`slot-row-${slotId}`)).toContainText(createdTitle);

  await clickTestId(page, `slot-edit-${slotId}`);
  const editDialog = page.getByTestId('slot-dialog');
  await expect(editDialog).toBeVisible();
  await fillLabeledInput(editDialog, 'Title', updatedTitle);
  await editDialog.getByRole('button', { name: 'Save' }).click();

  await expect.poll(() => mockApi.state.slots.find((slot) => slot.id === slotId)?.title).toBe(updatedTitle);
  await expect(page.getByTestId(`slot-row-${slotId}`)).toContainText(updatedTitle);

  await clickTestId(page, `slot-delete-${slotId}`);
  await expect.poll(() => mockApi.state.slots.some((slot) => slot.id === slotId)).toBe(false);
  await expect(page.getByTestId(`slot-row-${slotId}`)).toHaveCount(0);
});
