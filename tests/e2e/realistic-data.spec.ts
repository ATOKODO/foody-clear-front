import { expect, test } from '../fixtures/test';
import { createRealisticMockApiState } from '../mocks/realistic-state';
import { getActiveAssignmentForDate, hydrateCycleAssignment } from '../mocks/shared';

test('realistic planning has valid references, non-overlapping cycles and fresh mutation IDs', async ({ mockApi }) => {
  mockApi.reset(createRealisticMockApiState());
  const state = mockApi.state;
  const ids = (items: { id: number }[]) => new Set(items.map(item => item.id));
  const productIds = ids(state.products);
  const slotIds = ids(state.slots);
  const daySetIds = ids(state.daySets);
  const inventoryIds = ids(state.inventories);
  const templateIds = ids(state.templates);
  expect(productIds.size).toBe(state.products.length);
  for (const template of state.templates) for (const line of template.items) {
    expect(productIds.has(line.productId)).toBe(true);
    expect(slotIds.has(line.slotId!)).toBe(true);
  }
  for (const cycle of state.cycles) {
    expect(cycle.daySetOrder).toHaveLength(cycle.durationDays);
    for (const id of cycle.daySetOrder) expect(daySetIds.has(id)).toBe(true);
    expect(templateIds.has(cycle.defaultTemplateId!)).toBe(true);
  }
  for (const item of [...state.inventoryProducts, ...state.inputDayItems]) {
    expect(productIds.has(item.productId)).toBe(true);
    expect(inventoryIds.has(item.inventoryId!)).toBe(true);
  }
  const assignments = [...state.cycleAssignments].sort((a, b) => a.startDateLocal.localeCompare(b.startDateLocal));
  for (const [i, assignment] of assignments.entries()) {
    const hydrated = hydrateCycleAssignment(state, assignment)!;
    if (assignments[i + 1]) expect(String(hydrated.endDateLocal) < assignments[i + 1].startDateLocal).toBe(true);
  }
  expect(getActiveAssignmentForDate(state, '2026-03-25')?.cycle.title).toContain('Recovery');
  expect(getActiveAssignmentForDate(state, '2026-05-11')).toBeNull();
  expect(state.nextIds.inputDayItem).toBeGreaterThan(Math.max(...state.inputDayItems.map(item => item.id)));
  expect(state.nextIds.templateItem).toBeGreaterThan(Math.max(...state.templates.flatMap(item => item.items.map(line => line.id))));
  expect(mockApi.supplementary.nextId).toBeGreaterThan(Math.max(...mockApi.supplementary.shoppingLists.flatMap(list => list.items.map(item => item.id))));
});

test('realistic recipe availability combines shared ingredients and shopping uses full packages', async ({ page, mockApi }) => {
  mockApi.reset(createRealisticMockApiState());
  // Both dishes in the plant-based meal need olive oil: stock must cover their sum.
  mockApi.state.inventoryProducts.filter(item => item.productId === 11).forEach(item => { item.qtyOnHandNormalized = 20; });
  await page.goto('/meal-prep');
  const meals = await page.evaluate(async () => (await fetch('http://localhost:3000/meal-prep/meals')).json());
  const meal = meals.find((item: { id: number }) => item.id === 4);
  expect(meal.availability.missingProducts).toContainEqual(expect.objectContaining({ productId: 11, requiredQtyNormalized: 25, missingQtyNormalized: 5 }));
  const list = await page.evaluate(async () => (await fetch('http://localhost:3000/meal-prep/dishes/1/create-shopping-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json());
  expect(list.items).toHaveLength(4);
  expect(list.items).toContainEqual(expect.objectContaining({ productId: 2, qty: 1, qtyUnit: 'unit' }));
  expect(list.items.every((item: { qty: number }) => Number.isInteger(item.qty) && item.qty > 0)).toBe(true);
});

test('realistic screens show a full catalog, multiple training blocks and stocked recipes', async ({ page, mockApi }) => {
  mockApi.reset(createRealisticMockApiState());
  await page.goto('/product');
  await expect(page.getByTestId('product-row-31')).toContainText('Sparkling mineral water');
  await page.goto('/cycle');
  await expect(page.getByTestId('cycle-card-1')).toContainText('Recovery');
  await expect(page.getByTestId('cycle-card-2')).toContainText('Lean bulk');
  await expect(page.getByTestId('cycle-card-3')).toContainText('Cutting');
  await page.goto('/meal-prep');
  await expect(page.locator('.meal-prep-list-card__title')).toHaveCount(8);
  await page.goto('/statistic');
  await page.getByTestId('stat-view-expenses').click();
  await expect(page.getByTestId('stat-expense-timeline')).toBeVisible();
  await expect(page.locator('app-ui-error-panel')).toHaveCount(0);
});
