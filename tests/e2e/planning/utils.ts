import type { Locator, Page } from '@playwright/test';
import { expect } from '../../fixtures/test';
import { selectMatOptionByLabel } from '../../helpers/material';

export type PlanningScope = Page | Locator;

export async function fillLabeledInput(
  scope: PlanningScope,
  label: string,
  value: string,
): Promise<void> {
  await scope.getByLabel(label, { exact: true }).fill(value);
}

export async function selectLabeledOption(
  page: Page,
  scope: PlanningScope,
  label: string,
  optionText: string,
): Promise<void> {
  await selectMatOptionByLabel(page, scope, label, optionText);
}

export async function checkLabeledCheckbox(
  scope: PlanningScope,
  label: string,
): Promise<void> {
  await scope.locator(`[aria-label="${label}"]`).click();
}

export async function clickTestId(scope: PlanningScope, testId: string): Promise<void> {
  await scope.getByTestId(testId).click();
}

export async function expectTestIdVisible(
  scope: PlanningScope,
  testId: string,
): Promise<void> {
  await expect(scope.getByTestId(testId)).toBeVisible();
}
