import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput, selectLabeledOption } from './utils';

test('creates, updates and deletes a cycle', async ({ page, mockApi }) => {
  const createdTitle = `Cycle test ${Date.now()}`;
  const updatedTitle = `${createdTitle} renomme`;

  await gotoRoute(page, '/cycle');
  await expectShellTitle(page, 'Cycles');

  await clickTestId(page, 'cycle-add');
  const dialog = page.getByTestId('cycle-dialog');
  await expect(dialog).toBeVisible();

  await fillLabeledInput(dialog, 'Titre', createdTitle);
  await selectLabeledOption(page, dialog, 'Couleur', 'Bleu');
  await fillLabeledInput(dialog, 'Nombre de jours', '7');
  await dialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.cycles.some((cycle) => cycle.title === createdTitle)).toBe(true);
  const cycleId = mockApi.state.cycles.find((cycle) => cycle.title === createdTitle)?.id;
  expect(cycleId).toBeTruthy();

  await expect(page.getByTestId(`cycle-card-${cycleId}`)).toContainText(createdTitle);

  await clickTestId(page, `cycle-edit-${cycleId}`);
  const editDialog = page.getByTestId('cycle-dialog');
  await expect(editDialog).toBeVisible();
  await fillLabeledInput(editDialog, 'Titre', updatedTitle);
  await selectLabeledOption(page, editDialog, 'Couleur', 'Vert');
  await editDialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.cycles.find((cycle) => cycle.id === cycleId)?.title).toBe(updatedTitle);
  await expect(page.getByTestId(`cycle-card-${cycleId}`)).toContainText(updatedTitle);

  await clickTestId(page, `cycle-delete-${cycleId}`);
  await expect.poll(() => mockApi.state.cycles.some((cycle) => cycle.id === cycleId)).toBe(false);
  await expect(page.getByTestId(`cycle-card-${cycleId}`)).toHaveCount(0);
});
