import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput, selectLabeledOption } from './utils';

test('creates, updates and deletes a day set', async ({ page, mockApi }) => {
  const createdTitle = `Journee test ${Date.now()}`;
  const updatedTitle = `${createdTitle} renomme`;

  await gotoRoute(page, '/day-set');
  await expectShellTitle(page, 'Jours types');

  await clickTestId(page, 'day-set-add');
  const dialog = page.getByTestId('day-set-dialog');
  await expect(dialog).toBeVisible();

  await fillLabeledInput(dialog, 'Titre', createdTitle);
  await selectLabeledOption(page, dialog, 'Template associe', 'Jour training');
  await dialog.getByTestId('slot-row-1').getByRole('checkbox').click();
  await dialog.getByTestId('slot-row-2').getByRole('checkbox').click();
  await dialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.daySets.some((daySet) => daySet.title === createdTitle)).toBe(true);
  const daySetId = mockApi.state.daySets.find((daySet) => daySet.title === createdTitle)?.id;
  expect(daySetId).toBeTruthy();

  await expect(page.getByTestId(`day-set-row-${daySetId}`)).toContainText(createdTitle);

  await clickTestId(page, `day-set-edit-${daySetId}`);
  const editDialog = page.getByTestId('day-set-dialog');
  await expect(editDialog).toBeVisible();
  await fillLabeledInput(editDialog, 'Titre', updatedTitle);
  await selectLabeledOption(page, editDialog, 'Template associe', 'Aucun template');
  await editDialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.daySets.find((daySet) => daySet.id === daySetId)?.title).toBe(updatedTitle);
  await expect(page.getByTestId(`day-set-row-${daySetId}`)).toContainText(updatedTitle);

  await clickTestId(page, `day-set-delete-${daySetId}`);
  await expect.poll(() => mockApi.state.daySets.some((daySet) => daySet.id === daySetId)).toBe(false);
  await expect(page.getByTestId(`day-set-row-${daySetId}`)).toHaveCount(0);
});

test('opens and closes embedded targets modal from cycle hub with edit prefills', async ({ page, mockApi }) => {
  const seededDaySet = mockApi.state.daySets.find((daySet) => daySet.templateId !== null);
  if (!seededDaySet) {
    throw new Error('Expected a seeded day set with a template for the embedded cycle-hub test.');
  }

  const seededTemplate = mockApi.state.templates.find(
    (template) => template.id === seededDaySet.templateId,
  );
  if (!seededTemplate) {
    throw new Error('Expected a seeded template linked to the selected day set.');
  }

  await gotoRoute(page, '/cycle');
  await expectShellTitle(page, 'Cycles');

  await page.getByRole('radio', { name: 'Targets' }).click();
  await expect(page.getByRole('heading', { name: 'Targets' })).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter un day set' }).click();
  const addDialog = page.getByTestId('day-set-dialog');
  await expect(addDialog).toBeVisible();
  await expect(addDialog.getByRole('heading', { name: 'Ajouter un day set' })).toBeVisible();

  const closeButton = addDialog.getByRole('button', { name: 'Fermer' });
  await expect(closeButton).toBeVisible();
  await closeButton.click();
  await expect(addDialog).toBeHidden();

  await clickTestId(page, `day-set-edit-${seededDaySet.id}`);
  const editDialog = page.getByTestId('day-set-dialog');
  await expect(editDialog).toBeVisible();
  await expect(editDialog.getByLabel('Titre', { exact: true })).toHaveValue(seededDaySet.title);
  await expect(
    editDialog.getByRole('combobox', { name: 'Template associe' }),
  ).toContainText(seededTemplate.title);

  const slotsHeading = editDialog.getByRole('heading', { name: 'Slots du day set' });
  const editCloseButton = editDialog.getByRole('button', { name: 'Fermer' });
  await slotsHeading.scrollIntoViewIfNeeded();
  await expect(slotsHeading).toBeVisible();
  await expect(editCloseButton).toBeVisible();
});
