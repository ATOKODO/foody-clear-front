import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { selectMatOption } from '../../helpers/material';
import { loadStandaloneInputDay } from './utils';

async function loadInputDay(page: Page): Promise<void> {
  await loadStandaloneInputDay(page);
  await expect(page.getByTestId('input-day-item-1')).toBeVisible();
}

test.describe('Input day - template', () => {
  test('applies a manual template override and converts a template item', async ({ page, mockApi }) => {
    mockApi.state.templates.push({
      id: 2,
      title: 'Template E2E',
      items: [
        { id: 4, productId: 1, qty: 1, qtyUnit: 'piece', slotId: 1, slotKey: null },
      ],
    });
    mockApi.state.nextIds.template = 3;
    mockApi.state.nextIds.templateItem = 5;

    await loadInputDay(page);

    await selectMatOption(page, page.getByTestId('input-day-inventory-select'), 'Frigo maison (#1)');

    await selectMatOption(page, page.getByTestId('input-day-template-select'), 'Template E2E');

    await expect(page.getByText('Template E2E (manual override)')).toBeVisible();
    const templateRow = page.getByTestId('input-day-template-item-4');
    await expect(templateRow).toBeVisible();
    await expect(templateRow.getByText('Planned', { exact: true })).toHaveClass(/app-status-pill--info/);
    await expect(templateRow.getByText('Stock OK', { exact: true })).toHaveClass(/app-status-pill--success/);
    await templateRow.getByTestId('input-day-convert-template-4').click();

    await expect.poll(() => mockApi.state.templateConversions.length).toBe(1);
    await expect(page.getByTestId('input-day-item-3')).toContainText('Banane');
    await expect(page.getByTestId('input-day-template-item-4')).toContainText('Converted');
    await expect(templateRow.getByText('Converted', { exact: true })).toHaveClass(/app-status-pill--success/);
    await expect(page.getByTestId('input-day-item-3').getByText('Effective from template', { exact: true })).toHaveClass(/app-status-pill--compact/);
  });

  test('shows insufficient template stock with meaningful text and the shared danger tone', async ({ page, mockApi }) => {
    mockApi.state.templates.push({
      id: 2, title: 'Low stock template',
      items: [{ id: 4, productId: 1, qty: 1000, qtyUnit: 'piece', slotId: 1, slotKey: null }],
    });
    mockApi.state.nextIds.template = 3;
    mockApi.state.nextIds.templateItem = 5;
    await loadInputDay(page);
    await selectMatOption(page, page.getByTestId('input-day-template-select'), 'Low stock template');
    const stock = page.getByTestId('input-day-template-item-4').getByText('Low stock', { exact: true });
    await expect(stock).toBeVisible();
    await expect(stock).toHaveClass(/app-status-pill--danger/);
    await expect(stock).toHaveClass(/app-status-pill--small/);
    expect(await stock.getAttribute('role')).toBeNull();
  });
});
