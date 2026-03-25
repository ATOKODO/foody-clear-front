import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput } from './utils';

test('creates, updates and deletes a slot', async ({ page, mockApi }) => {
  const createdTitle = `Collation test ${Date.now()}`;
  const updatedTitle = `${createdTitle} renomme`;

  await gotoRoute(page, '/slot');
  await expectShellTitle(page, 'Plages horaires');

  await clickTestId(page, 'slot-add');
  const dialog = page.getByTestId('slot-dialog');
  await expect(dialog).toBeVisible();

  await fillLabeledInput(dialog, 'Key', 'late_snack');
  await fillLabeledInput(dialog, 'Titre', createdTitle);
  await fillLabeledInput(dialog, 'Ordre', '4');
  await fillLabeledInput(dialog, 'Heure de debut', '21:00');
  await fillLabeledInput(dialog, 'Heure de fin', '21:30');
  await dialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.slots.some((slot) => slot.title === createdTitle)).toBe(true);
  const slotId = mockApi.state.slots.find((slot) => slot.title === createdTitle)?.id;
  expect(slotId).toBeTruthy();

  await expect(page.getByTestId(`slot-row-${slotId}`)).toContainText(createdTitle);

  await clickTestId(page, `slot-edit-${slotId}`);
  const editDialog = page.getByTestId('slot-dialog');
  await expect(editDialog).toBeVisible();
  await fillLabeledInput(editDialog, 'Titre', updatedTitle);
  await editDialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.slots.find((slot) => slot.id === slotId)?.title).toBe(updatedTitle);
  await expect(page.getByTestId(`slot-row-${slotId}`)).toContainText(updatedTitle);

  await clickTestId(page, `slot-delete-${slotId}`);
  await expect.poll(() => mockApi.state.slots.some((slot) => slot.id === slotId)).toBe(false);
  await expect(page.getByTestId(`slot-row-${slotId}`)).toHaveCount(0);
});
