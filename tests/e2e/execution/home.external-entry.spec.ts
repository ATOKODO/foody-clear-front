import { expect, test } from '../../fixtures/test';
import { buildInputDayResponse } from '../../mocks/shared';
import type { ExternalMealEntrySummary } from '../../../src/interfaces/input-day.interface';

test('shows the external origin marker on the native emphasis host in the mobile dashboard', async ({ page, mockApi }) => {
  const entry: ExternalMealEntrySummary = {
    id: 100, dateLocal: '2026-03-25', name: 'Restaurant meal', paymentStatus: 'paid', priceAmount: 12,
    occurredAt: '2026-03-25T12:30:00+01:00', insertedAt: '2026-03-25T12:30:00+01:00',
    slotId: null, slotKey: 'lunch', nutritionValue: { energyKcal: 550, proteins: 30, carbs: 65, lipids: 18 },
  };
  await page.route(/\/input-days\/2026-03-25(?:\?|$)/, route => route.fulfill({
    json: { ...buildInputDayResponse(mockApi.state, '2026-03-25'), externalEntries: [entry] },
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const row = page.locator('.home-day-entry').filter({ hasText: 'Restaurant meal' });
  const marker = row.locator('em[appStatusBadge]');
  await expect(marker).toHaveText('External');
  await expect(marker).toHaveCSS('font-size', '9.92px');
  await expect(marker).toHaveCSS('font-style', 'normal');
  await expect(marker).toHaveCSS('font-weight', '850');
  await expect(marker).toHaveCSS('padding-top', '1.92px');
  expect(await marker.getAttribute('role')).toBeNull();
  expect(await marker.getAttribute('aria-live')).toBeNull();
});
