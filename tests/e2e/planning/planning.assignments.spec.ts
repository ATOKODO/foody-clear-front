import { expect, test } from '../../fixtures/test';
import { expectShellTitle } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput } from './utils';

test('creates a cycle assignment from the planning calendar', async ({ page, mockApi }) => {
  await page.goto('/planning');
  await expect(page.getByTestId('planning-page')).toBeVisible();
  await expectShellTitle(page, 'Assignations');

  await clickTestId(page, 'planning-view-month');
  await expect(page.getByTestId('calendar-month-day-2026-03-22')).toBeVisible();

  await page.getByTestId('calendar-month-body-2026-03-22').click();
  const actionsDialog = page.getByTestId('planning-modal-actions');
  await expect(actionsDialog).toBeVisible();

  await clickTestId(actionsDialog, 'planning-action-cycle');
  const assignmentDialog = page.getByTestId('planning-modal-assignment');
  await expect(assignmentDialog).toBeVisible();

  await clickTestId(assignmentDialog, 'cycle-card-1');
  await assignmentDialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() =>
    mockApi.state.cycleAssignments.some((assignment) => assignment.startDateLocal === '2026-03-22'),
  ).toBe(true);
  await expect(page.getByTestId('calendar-month-day-2026-03-22')).toContainText('Cycle training');
});

test('edits and removes an assignment from planning', async ({ page, mockApi }) => {
  await page.goto('/planning');
  await expect(page.getByTestId('planning-page')).toBeVisible();
  await expectShellTitle(page, 'Assignations');

  await clickTestId(page, 'planning-view-month');
  await expect(page.getByTestId('calendar-month-day-2026-03-25')).toBeVisible();

  await page.getByTestId('calendar-month-body-2026-03-25').click();
  const actionsDialog = page.getByTestId('planning-modal-actions');
  await expect(actionsDialog).toBeVisible();

  await clickTestId(actionsDialog, 'planning-action-cycle');
  const assignmentDialog = page.getByTestId('planning-modal-assignment');
  await expect(assignmentDialog).toBeVisible();

  await fillLabeledInput(assignmentDialog, 'Date de depart', '2026-03-24');
  await assignmentDialog.getByRole('button', { name: 'Valider' }).click();

  await expect.poll(() => mockApi.state.cycleAssignments.find((assignment) => assignment.id === 1)?.startDateLocal).toBe(
    '2026-03-24',
  );

  await page.getByTestId('calendar-month-body-2026-03-25').click();
  await clickTestId(page.getByTestId('planning-modal-actions'), 'planning-action-cycle');
  const editedDialog = page.getByTestId('planning-modal-assignment');
  await expect(editedDialog).toBeVisible();
  await editedDialog.getByRole('button', { name: 'Retirer' }).click();

  await expect.poll(() => mockApi.state.cycleAssignments.length).toBe(0);
});
