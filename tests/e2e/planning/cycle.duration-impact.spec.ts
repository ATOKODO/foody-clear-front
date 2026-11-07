import { expect, test } from '../../fixtures/test';
import { expectShellTitle, gotoRoute } from '../../helpers/navigation';
import { fillLabeledInput, selectLabeledOption } from './utils';

test('prompts for impact when cycle duration changes', async ({ page, mockApi }) => {
  await gotoRoute(page, '/cycle');
  await expectShellTitle(page, 'Cycles');

  await page.getByTestId('cycle-edit-1').click();
  const dialog = page.getByTestId('cycle-dialog');
  await expect(dialog).toBeVisible();

  await fillLabeledInput(dialog, 'Title', 'Training cycle');
  await selectLabeledOption(page, dialog, 'Color', 'Blue');
  await fillLabeledInput(dialog, 'Number of days', '10');
  await dialog.getByRole('button', { name: 'Save' }).click();

  const impactDialog = page.getByTestId('cycle-impact-dialog');
  await expect(impactDialog).toBeVisible();

  await impactDialog.getByRole('button', { name: 'Apply' }).click();

  await expect.poll(() => mockApi.state.cycles.find((cycle) => cycle.id === 1)?.durationDays).toBe(10);
  await expect(page.getByTestId('cycle-card-1')).toContainText('10 day(s)');
});
