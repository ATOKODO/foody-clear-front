import { expect, test } from '../../fixtures/test';
import { expectShellTitle } from '../../helpers/navigation';
import { clickTestId, fillLabeledInput } from './utils';

test('creates a cycle assignment from the planning calendar', async ({ page, mockApi }) => {
  await page.goto('/planning');
  await expect(page.getByTestId('planning-page')).toBeVisible();
  await expectShellTitle(page, 'Assignments');

  await clickTestId(page, 'planning-view-month');
  await expect(page.getByTestId('calendar-month-day-2026-03-22')).toBeVisible();

  await page.getByTestId('calendar-month-manage-cycle-2026-03-22').click();
  const assignmentDialog = page.getByTestId('planning-modal-assignment');
  await expect(assignmentDialog).toBeVisible();

  await clickTestId(assignmentDialog, 'cycle-card-1');
  await assignmentDialog.getByRole('button', { name: "Confirm", exact: true }).click();

  await expect.poll(() =>
    mockApi.state.cycleAssignments.some((assignment) => assignment.startDateLocal === '2026-03-22'),
  ).toBe(true);
  await expect(page.getByTestId('calendar-month-day-2026-03-22')).toContainText('Cycle training');
});

test('edits and removes an assignment from planning', async ({ page, mockApi }) => {
  await page.goto('/planning');
  await expect(page.getByTestId('planning-page')).toBeVisible();
  await expectShellTitle(page, 'Assignments');

  await clickTestId(page, 'planning-view-month');
  await expect(page.getByTestId('calendar-month-day-2026-03-25')).toBeVisible();

  await page.getByTestId('calendar-month-manage-cycle-2026-03-25').click();
  const assignmentDialog = page.getByTestId('planning-modal-assignment');
  await expect(assignmentDialog).toBeVisible();

  await fillLabeledInput(assignmentDialog, 'Start date', '2026-03-24');
  await assignmentDialog.getByRole('button', { name: "Confirm", exact: true }).click();

  await expect.poll(() => mockApi.state.cycleAssignments.find((assignment) => assignment.id === 1)?.startDateLocal).toBe(
    '2026-03-24',
  );

  await page.getByTestId('calendar-month-manage-cycle-2026-03-25').click();
  const editedDialog = page.getByTestId('planning-modal-assignment');
  await expect(editedDialog).toBeVisible();
  await editedDialog.getByRole('button', { name: 'Remove' }).click();

  await expect.poll(() => mockApi.state.cycleAssignments.length).toBe(0);
});

test('keeps the selected date when opening a day-action dialog and its entry editor', async ({ page }) => {
  await page.goto('/planning');
  await expect(page.getByTestId('planning-page')).toBeVisible();
  await clickTestId(page, 'planning-view-year');
  await page.getByTestId('calendar-year-day-2026-03-25').click();
  const actions = page.getByTestId('planning-modal-actions');
  const date = actions.locator('[appDateBadge]');
  await expect(date.locator('.app-date-badge__value')).toHaveText('2026-03-25');
  await expect(date.locator('.app-date-badge__detail')).toHaveCount(0);
  await actions.getByTestId('planning-action-items').click();
  await expect(actions).toHaveCount(0);
  await expect(page.getByTestId('planning-modal-items')).toBeVisible();
  await page.getByTestId('planning-modal-items').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByTestId('planning-modal-items')).toHaveCount(0);
});
