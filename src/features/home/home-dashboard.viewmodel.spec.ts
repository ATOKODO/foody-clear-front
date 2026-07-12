import type {
  InputDayResponse,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';
import type {
  InventoryPurchaseEventSummary,
  StatisticsTimelineResponse,
} from '../../interfaces/statistics.interface';
import type { Slot } from '../../interfaces/slot.interface';
import {
  buildHomeDayEntryRows,
  buildHomeMacroCards,
  buildHomeScheduleRows,
  canConvertTemplateItem,
  formatCurrency,
  formatHomeDateTime,
  formatHomeItemQty,
  getActiveCycleLabel,
  getActiveDaySetLabel,
  getConvertedItemId,
  getConvertedTemplateItems,
  getEnteredItemCount,
  getExternalEntries,
  getPendingTemplateItems,
  getPurchaseEventLabel,
  getRecentPurchaseEvents,
  getTargetSourceLabel,
  getTemplateInventoryId,
  getTemplateSlotLabel,
  getTemplateStockLabel,
  getTodayTimelineDay,
  isConvertedTemplateItem,
  resolveDaySlots,
} from './home-dashboard.viewmodel';

describe('home dashboard viewmodel', () => {
  const slots: Slot[] = [
    { id: 1, key: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: '08:00:00', endTime: '09:00:00' },
    { id: 2, key: 'lunch', title: 'Lunch', sortOrder: 2, startTime: null, endTime: '13' },
  ];
  const response = {
    dateLocal: '2026-07-11',
    timezone: 'Europe/Paris',
    assignment: { id: 1, cycleId: 2, cycleTitle: 'Cycle', startDateLocal: '2026-07-01', endDateLocal: '2026-07-20', dayIndex: 2 },
    daySet: {
      id: 3,
      title: 'Training day',
      nutritionValue: null,
      slots: [
        { slotId: 1, slotKey: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: '08:00:00', endTime: '09:00:00', nutritionValue: null },
        { slotId: null, slotKey: 'lunch', title: 'Lunch', sortOrder: 2, startTime: null, endTime: '13', nutritionValue: null },
      ],
    },
    slots: [
      { slotId: 1, slotKey: 'breakfast', title: 'Duplicate', sortOrder: 1, startTime: '08:00', endTime: '09:00', nutritionValue: null },
    ],
    templateItems: [
      {
        id: 10,
        productId: 1,
        productName: 'Pasta',
        qty: 2,
        qtyUnit: 'g',
        qtyNormalized: 2,
        slotId: 1,
        slotKey: 'breakfast',
        preferredTime: null,
        status: 'pending',
        convertedItemId: null,
        stockAvailability: { enoughStock: true, totalAvailableNormalized: 10, requestedQtyNormalized: 2 },
        stockByInventory: [{ inventoryId: 8, inventoryName: 'Pantry', qtyAvailableNormalized: 10, enoughStock: true }],
        nutritionValue: {},
      },
      {
        id: 11,
        productId: 2,
        productName: 'Apple',
        qty: 1,
        qtyUnit: 'unit',
        qtyNormalized: 1,
        slotId: null,
        slotKey: 'snack',
        preferredTime: null,
        status: 'converted',
        convertedItemId: 99,
        stockAvailability: { enoughStock: false, totalAvailableNormalized: 0, requestedQtyNormalized: 1 },
        stockByInventory: [],
        nutritionValue: {},
      },
      {
        id: 12,
        productId: 3,
        productName: 'Bread',
        qty: 1.234,
        qtyUnit: null,
        qtyNormalized: null,
        slotId: null,
        slotKey: null,
        preferredTime: null,
        status: 'pending',
        convertedItemId: null,
        stockAvailability: { enoughStock: false, totalAvailableNormalized: 0, requestedQtyNormalized: 1 },
        stockByInventory: [],
        nutritionValue: {},
      },
    ],
    items: [
      { id: 20, productId: 1, productName: 'Pasta', inventoryId: 8, qty: 2.345, qtyUnit: 'g', qtyNormalized: 2, insertedAt: '2026-07-11T07:55:00+02:00', occurredAt: '2026-07-11T08:10:00+02:00', slotId: 1, slotKey: 'breakfast', nutritionValue: {}, templateItemId: null },
      { id: 21, productId: 2, productName: 'Apple', inventoryId: null, qty: 1, qtyUnit: null, qtyNormalized: 1, insertedAt: '2026-07-11T12:00:00+02:00', occurredAt: null, slotId: null, slotKey: 'lunch', nutritionValue: {}, templateItemId: 10 },
      { id: 22, productId: 3, productName: 'Bread', inventoryId: null, qty: 1, qtyUnit: 'piece', qtyNormalized: 1, insertedAt: '2026-07-11T18:00:00+02:00', occurredAt: null, slotId: null, slotKey: null, nutritionValue: {}, templateItemId: null },
    ],
    externalEntries: [
      { id: 30, name: 'Restaurant', occurredAt: '2026-07-11T09:00:00+02:00', paymentStatus: 'free', priceAmount: null, slotId: 1, slotKey: 'breakfast', nutritionValue: { energyKcal: 300, proteins: 10, carbs: 20, lipids: 5 } },
      { id: 31, name: 'Refunded meal', occurredAt: '2026-07-11T20:00:00+02:00', paymentStatus: 'refunded', priceAmount: 12, slotId: null, slotKey: 'dinner', nutritionValue: { energyKcal: 500, proteins: 20, carbs: 30, lipids: 10 } },
    ],
    totalsMacros: {
      bySlot: [],
      dayTotal: { energyKcal: 1200, proteins: 95, carbs: 20, lipids: Number.NaN },
      targets: { energyKcal: 1000, proteins: 100, carbs: 40, lipids: 0 },
      deltaToTargets: { energyKcal: 200, proteins: -5, carbs: 'unknown', lipids: null },
      incompleteNutritionKeys: [],
      targetSource: 'daySet',
    },
    projectedTotalsMacros: null,
    itemsBySlot: [],
  } as unknown as InputDayResponse;

  const timeline = {
    fromDateLocal: '2026-07-11',
    toDateLocal: '2026-07-11',
    timezone: 'Europe/Paris',
    summary: { totalAmount: 12, purchaseCount: 3, incompletePurchaseCount: 1, dayCount: 1 },
    days: [{
      dateLocal: '2026-07-11',
      inputs: {
        itemCount: 5,
        assignment: { cycleTitle: 'Timeline cycle' },
        daySet: { title: 'Timeline day' },
        dayTotal: { energyKcal: 200, proteins: 20, carbs: 30, lipids: 10 },
        targets: { energyKcal: 1000, proteins: 100, carbs: 100, lipids: 100 },
        deltaToTargets: { energyKcal: -800, proteins: -80, carbs: -70, lipids: -90 },
        targetSource: 'cycle',
      },
      expenses: {
        totalAmount: 12,
        purchaseCount: 3,
        incompletePurchaseCount: 1,
        events: [
          { id: 1, inventoryId: 1, inventoryName: 'A', productId: 1, productName: 'Old', qty: 1, qtyUnit: 'unit', qtyNormalized: 1, qtyInProductUnits: 1, priceSnapshot: 2, priceUnitSnapshot: 'unite', expenseAmount: 2, occurredAt: '2026-07-11T08:00:00+02:00', pricingStatus: 'complete', excludedFromStats: false, exclusionReason: null },
          { id: 2, inventoryId: 1, inventoryName: 'A', productId: 2, productName: 'New', qty: 1, qtyUnit: 'unit', qtyNormalized: 1, qtyInProductUnits: 1, priceSnapshot: 2, priceUnitSnapshot: 'unite', expenseAmount: 4, occurredAt: '2026-07-11T18:00:00+02:00', pricingStatus: 'complete', excludedFromStats: false, exclusionReason: null },
        ],
      },
    }],
  } as unknown as StatisticsTimelineResponse;

  it('resolves timeline, labels, counts, macros and formatting', () => {
    expect(getTodayTimelineDay(timeline, '2026-07-11')).toBe(timeline.days[0]);
    expect(getTodayTimelineDay(timeline, '2026-07-12')).toBeNull();
    expect(getTodayTimelineDay(null, '2026-07-11')).toBeNull();
    expect(getActiveCycleLabel(response, timeline.days[0])).toBe('Cycle');
    expect(getActiveDaySetLabel(response, timeline.days[0])).toBe('Training day');
    expect(getActiveCycleLabel(null, timeline.days[0])).toBe('Timeline cycle');
    expect(getActiveDaySetLabel(null, timeline.days[0])).toBe('Timeline day');
    expect(getActiveCycleLabel(null, null)).toBe('No active cycle');
    expect(getActiveDaySetLabel(null, null)).toBe('No day set');
    expect(getEnteredItemCount(response, null)).toBe(5);
    expect(getEnteredItemCount(null, timeline.days[0])).toBe(5);
    expect(getEnteredItemCount(null, null)).toBe(0);
    expect(getExternalEntries(response)).toHaveSize(2);
    expect(getExternalEntries(null)).toEqual([]);
    expect(getPendingTemplateItems(response).map((item) => item.id)).toEqual([10, 12]);
    expect(getConvertedTemplateItems(response).map((item) => item.id)).toEqual([11]);

    const cards = buildHomeMacroCards(response, null);
    expect(cards.map((card) => card.status)).toEqual(['over', 'exact', 'under', 'neutral']);
    expect(cards[0].progress).toBe(100);
    expect(buildHomeMacroCards(null, timeline.days[0])[0].status).toBe('under');
    expect(buildHomeMacroCards(null, null)[0].actual).toBe('-');
    expect(formatCurrency(12.5)).toContain('12');
    expect(formatCurrency(Number.NaN)).toContain('0');
    expect(formatHomeItemQty({ qty: 1.234, qtyUnit: null } as any)).toBe('1.23');
    expect(formatHomeDateTime(null, 'UTC')).toBe('-');
    expect(formatHomeDateTime('not-a-date', 'UTC')).toBe('not-a-date');
    expect(formatHomeDateTime('2026-07-11T08:30:00+02:00', 'Europe/Paris')).toBe('08:30');
  });

  it('builds schedule and entry rows, including orphan and external cases', () => {
    expect(buildHomeScheduleRows(null, slots)).toEqual([]);
    const schedule = buildHomeScheduleRows(response, slots);
    expect(schedule.map((row) => row.key)).toEqual(['slot-1', 'key-lunch', 'without-slot']);
    expect(schedule[0].items).toHaveSize(1);
    expect(schedule[2].plannedItems).toHaveSize(2);
    expect(buildHomeDayEntryRows(null, 'UTC', slots)).toEqual([]);
    const entries = buildHomeDayEntryRows(response, 'Europe/Paris', slots);
    expect(entries.map((entry) => entry.id)).toEqual([20, 30, 21, 22, 31]);
    expect(entries[1].paymentLabel).toBe('Free');
    expect(entries[4].paymentLabel).toBe('Refunded');
    expect(entries[3].slotLabel).toBe('Unassigned to a slot');

    const resolved = resolveDaySlots(response, slots);
    expect(resolved.map((slot) => slot.title)).toEqual(['Breakfast', 'Lunch']);
    expect(getTemplateSlotLabel(response.templateItems![0], response, slots)).toContain('Breakfast');
    expect(getTemplateSlotLabel(response.templateItems![1], response, slots)).toBe('Slot snack');
    expect(getTemplateSlotLabel(response.templateItems![2], response, slots)).toBe('Unassigned to a slot');
  });

  it('resolves stock, conversions, target sources and purchase labels', () => {
    const pending = response.templateItems![0];
    const converted = response.templateItems![1];
    expect(getTemplateInventoryId(pending)).toBe(8);
    expect(getTemplateInventoryId(converted)).toBeNull();
    expect(getTemplateInventoryId({ ...pending, stockByInventory: [] })).toBeNull();
    expect(getTemplateStockLabel(converted, response)).toBe('Converti');
    expect(getTemplateStockLabel({ ...pending, status: 'pending', stockAvailability: { ...pending.stockAvailability, enoughStock: false } }, null)).toBe('Low stock');
    expect(getTemplateStockLabel({ ...pending, status: 'pending' }, null)).toBe('Stock OK');
    expect(isConvertedTemplateItem(converted, response)).toBeTrue();
    expect(isConvertedTemplateItem({ ...pending, convertedItemId: null }, response)).toBeTrue();
    expect(isConvertedTemplateItem({ ...pending, id: 999 }, response)).toBeFalse();
    expect(getConvertedItemId(converted, response)).toBe(99);
    expect(getConvertedItemId(pending, response)).toBe(21);
    expect(getConvertedItemId({ ...pending, id: 999 }, null)).toBeNull();
    expect(canConvertTemplateItem(pending, response)).toBeFalse();
    expect(canConvertTemplateItem({ ...pending, stockByInventory: [{ inventoryId: 8, inventoryName: 'A', qtyAvailableNormalized: 3, enoughStock: true }], convertedItemId: null }, null)).toBeTrue();
    expect(canConvertTemplateItem(converted, response)).toBeFalse();

    expect(getTargetSourceLabel(response, null)).toBe('Day set');
    expect(getTargetSourceLabel(null, timeline.days[0])).toBe('Cycle');
    expect(getTargetSourceLabel(null, null)).toBe('No target');
    expect(getRecentPurchaseEvents(null)).toEqual([]);
    expect(getRecentPurchaseEvents(timeline.days[0])[0].id).toBe(2);
    const base = timeline.days[0].expenses.events[0] as InventoryPurchaseEventSummary;
    expect(getPurchaseEventLabel({ ...base, excludedFromStats: true, exclusionReason: 'refunded' })).toBe('Refunded');
    expect(getPurchaseEventLabel({ ...base, pricingStatus: 'excluded', excludedFromStats: false, exclusionReason: 'other' })).toBe('Excluded');
    expect(getPurchaseEventLabel({ ...base, pricingStatus: 'free' })).toBe('Gratuit');
    expect(getPurchaseEventLabel({ ...base, pricingStatus: 'incomplete' })).toBe('Prix incomplet');
    expect(getPurchaseEventLabel({ ...base, expenseAmount: 3.5 })).toContain('3');
  });
});
