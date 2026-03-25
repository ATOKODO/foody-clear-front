import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput } from './utils';

test('creates, renames and deletes a template', async ({ page, mockApi }) => {
  const createdTitle = `Modele test ${Date.now()}`;
  const updatedTitle = `${createdTitle} renomme`;

  await gotoRoute(page, '/template');
  await expectShellTitle(page, 'Modeles');

  await clickTestId(page, 'template-add');
  const dialog = page.getByTestId('template-dialog');
  await expect(dialog).toBeVisible();

  await fillLabeledInput(dialog, 'Titre du template', createdTitle);
  await dialog.getByTestId('template-save').click();
  await dialog.getByRole('button', { name: 'Fermer' }).click();
  await expect(dialog).toHaveCount(0);

  await expect.poll(() => mockApi.state.templates.some((template) => template.title === createdTitle)).toBe(true);
  const templateId = mockApi.state.templates.find((template) => template.title === createdTitle)?.id;
  expect(templateId).toBeTruthy();

  await expect(page.getByTestId(`template-select-${templateId}`)).toContainText(createdTitle);

  await clickTestId(page, 'template-edit');
  const editDialog = page.getByTestId('template-dialog');
  await expect(editDialog).toBeVisible();
  await fillLabeledInput(editDialog, 'Titre du template', updatedTitle);
  await editDialog.getByTestId('template-save').click();

  await expect.poll(() => mockApi.state.templates.find((template) => template.id === templateId)?.title).toBe(updatedTitle);
  await expect(page.getByTestId(`template-select-${templateId}`)).toContainText(updatedTitle);

  await editDialog.getByTestId('template-delete').click();

  await expect.poll(() => mockApi.state.templates.some((template) => template.id === templateId)).toBe(false);
  await expect(page.getByTestId(`template-select-${templateId}`)).toHaveCount(0);
});
