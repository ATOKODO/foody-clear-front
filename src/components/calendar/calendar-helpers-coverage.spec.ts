import { DateTime } from 'luxon';
import type { CalendarDaySlot, CalendarInsertedProduct } from '../../interfaces/calendar.interface';
import type {
  InputDayDaySetSlotSummary,
  InputDayItemSummary,
  InputDayResponse,
  InputDayTemplateItemSummary,
  InputDayTotalsMacrosBySlotEntry,
} from '../../interfaces/input-day.interface';
import {
  buildCalendarInsertedProducts,
  buildCalendarInsertedProductsByHour,
  buildCalendarItemsBySlotEntriesFromResponse,
  buildCalendarWeekTimelineBlocks,
  formatCalendarMinutesClock,
  isCalendarSlotOverlappingHour,
  isCalendarTimeInSlotWindow,
  normalizeCalendarTimelineEndMinute,
  parseCalendarTimeToSeconds,
  resolveCalendarDaySetSlots,
  resolveCalendarDaySlots,
  resolveCalendarInsertedProductMinute,
  resolveCalendarItemTimestamp,
  resolveCalendarItemsBySlotEntries,
  resolveCalendarSlotForItem,
  resolveCalendarSlotForTemplateItem,
  resolveCalendarSlotForTimestamp,
  resolveCalendarSlotInfo,
  resolveCalendarTemplatePreferredMinute,
  resolveCalendarTemplateSlots,
  resolvePendingCalendarTemplateItems,
  toCalendarMinutes,
  toCalendarSlotSummary,
} from './calendar-data.helpers';
import {
  buildCalendarDayMacroCards,
  buildCalendarDaySlotMacroGroups,
  buildCalendarMacroComparisonsFromTotals,
  buildCalendarMacroHighlights,
  buildCalendarMonthAlertBadges,
  compareCalendarMacroKeys,
  formatCalendarClock,
  formatCalendarCompactNumber,
  formatCalendarInsertedAt,
  formatCalendarItemTime,
  formatCalendarMetricValue,
  formatCalendarQuantityLabel,
  formatCalendarSignedMetricValue,
  formatCalendarSlotRange,
  formatCalendarWeekMacroValue,
  getCalendarDayTargetSourcePillText,
  getCalendarTargetSourceBadgeText,
  getCalendarTargetSourceText,
  getCalendarTemplateSourceBadgeText,
  getCalendarMetricEntries,
  normalizeCalendarTimezone,
  resolveCalendarDayMacroCardStatus,
  resolveCalendarMacroComparisonStatus,
} from './calendar-format.helpers';
import {
  CALENDAR_MACRO_DEFINITIONS,
  buildCalendarSlotTrackKey,
} from './calendar.models';
import {
  generateDayHours,
  generateMonthDays,
  generateWeekDays,
  generateYearMonths,
} from '../../utils/calendar.utils';

describe('calendar helper branches', () => {
  const slot = (overrides: Partial<CalendarDaySlot> = {}): CalendarDaySlot => ({
    slotId: 1,
    slotKey: 'breakfast',
    title: 'Breakfast',
    sortOrder: 1,
    startTime: '08:00:00',
    endTime: '10:00:00',
    ...overrides,
  });

  const item = (overrides: Partial<InputDayItemSummary> = {}): InputDayItemSummary => ({
    id: 1,
    productId: 10,
    productName: 'Porridge',
    inventoryId: 2,
    qty: 1,
    qtyUnit: 'portion',
    qtyNormalized: 100,
    insertedAt: '2026-02-17T07:30:00Z',
    occurredAt: '2026-02-17T08:15:00Z',
    slotId: 1,
    slotKey: 'breakfast',
    nutritionValue: {},
    ...overrides,
  });

  const templateItem = (
    overrides: Partial<InputDayTemplateItemSummary> = {},
  ): InputDayTemplateItemSummary => ({
    id: 9,
    productId: 10,
    productName: 'Porridge',
    qty: 1.5,
    qtyUnit: 'g',
    qtyNormalized: 150,
    slotId: 1,
    slotKey: 'breakfast',
    preferredTime: '08:15:00',
    status: 'pending',
    convertedItemId: null,
    stockAvailability: {
      enoughStock: false,
      totalAvailableNormalized: 0,
      requestedQtyNormalized: 150,
    },
    stockByInventory: [],
    nutritionValue: {},
    ...overrides,
  });

  const response = (overrides: Partial<InputDayResponse> = {}): InputDayResponse => ({
    dateLocal: '2026-02-17',
    timezone: 'UTC',
    assignment: null,
    daySet: null,
    items: [],
    totalsMacros: null,
    itemsBySlot: [],
    slots: [],
    ...overrides,
  });

  it('covers calendar data resolution and time branches', () => {
    const secondSlot: InputDayDaySetSlotSummary = {
      slotId: 2,
      slotKey: 'lunch',
      title: 'Lunch',
      sortOrder: 2,
      startTime: '12:00:00',
      endTime: '14:00:00',
      nutritionValue: null,
    };
    const legacySlot: InputDayDaySetSlotSummary = {
      slotId: null,
      slotKey: 'snack',
      title: 'Snack',
      sortOrder: 3,
      startTime: null,
      endTime: null,
      nutritionValue: null,
    };
    const catalog = [
      { id: 1, key: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: '08:00:00', endTime: '10:00:00' },
      { id: 2, key: 'lunch', title: 'Lunch', sortOrder: 2, startTime: '12:00:00', endTime: '14:00:00' },
      { id: 3, key: 'dinner', title: 'Dinner', sortOrder: 4, startTime: null, endTime: null },
    ] as any;
    const dayResponse = response({
      daySet: {
        id: 1,
        title: 'Target',
        nutritionValue: null,
        slots: [secondSlot, { ...secondSlot, title: 'Duplicate', sortOrder: 9 }],
      },
      slots: [legacySlot],
      templateItems: [
        templateItem({ slotId: 1 }),
        templateItem({ id: 10, slotId: 2, slotKey: 'lunch' }),
        templateItem({ id: 11, slotId: 3, slotKey: ' dinner ' }),
      ],
      totalsMacros: {
        bySlot: [{ slot: { ...secondSlot, title: 'Totals lunch' }, targets: null, deltaToTargets: null, incompleteNutritionKeys: [] }],
        dayTotal: {},
        targets: null,
        deltaToTargets: null,
        incompleteNutritionKeys: [],
        targetSource: 'none',
      },
    });

    expect(resolveCalendarDaySetSlots(dayResponse).map((value) => value.slotKey)).toEqual(['lunch']);
    expect(resolveCalendarDaySetSlots(null)).toEqual([]);
    expect(resolveCalendarTemplateSlots(dayResponse, catalog).map((value) => value.slotKey)).toEqual(['breakfast', 'lunch', 'dinner']);
    expect(resolveCalendarDaySlots(dayResponse, catalog).map((value) => value.slotKey)).toEqual(['breakfast', 'lunch', 'snack', 'dinner']);

    const slots = [slot(), slot({ slotId: 2, slotKey: 'lunch', title: 'Lunch', sortOrder: 2, startTime: '12:00', endTime: '14:00' })];
    const breakfast = item();
    const lunch = item({ id: 2, slotId: null, slotKey: ' lunch ' });
    const timed = item({ id: 3, slotId: null, slotKey: null, occurredAt: '2026-02-17T12:30:00Z' });
    const noMatch = item({ id: 4, slotId: null, slotKey: null, occurredAt: 'not-a-date' });
    const generatedResponse = response({ items: [breakfast, lunch, timed, noMatch] });
    const fallbackEntry = { slot: toCalendarSlotSummary(slots[0]), items: [breakfast] };
    expect(resolveCalendarItemsBySlotEntries(response({ itemsBySlot: [fallbackEntry] }), [], slots, 'UTC')).toEqual([fallbackEntry]);
    expect(resolveCalendarItemsBySlotEntries(generatedResponse, [fallbackEntry], slots, 'UTC')).toEqual([fallbackEntry]);
    expect(buildCalendarItemsBySlotEntriesFromResponse(null, slots, 'UTC')).toEqual([]);
    expect(buildCalendarItemsBySlotEntriesFromResponse(response({ items: [] }), slots, 'UTC')).toEqual([]);
    const generatedEntries = resolveCalendarItemsBySlotEntries(generatedResponse, [], slots, 'UTC');
    expect(generatedEntries[0].items.map((value) => value.id)).toEqual([1]);
    expect(generatedEntries[1].items.map((value) => value.id)).toEqual([2, 3]);

    expect(resolveCalendarSlotForItem(breakfast, slots, 'UTC')).toBe(slots[0]);
    expect(resolveCalendarSlotForItem(lunch, slots, 'UTC')).toBe(slots[1]);
    expect(resolveCalendarSlotForItem(timed, slots, 'UTC')).toBe(slots[1]);
    expect(resolveCalendarSlotForItem(noMatch, slots, 'UTC')).toBeNull();
    expect(resolveCalendarSlotForTimestamp(null, slots, 'UTC')).toBeNull();
    expect(resolveCalendarSlotForTimestamp('invalid', slots, 'UTC')).toBeNull();
    expect(resolveCalendarSlotForTimestamp('2026-02-17T08:30:00Z', slots, 'UTC')).toBe(slots[0]);
    expect(parseCalendarTimeToSeconds('08:15:30.500')).toBe(8 * 3600 + 15 * 60 + 30);
    expect(parseCalendarTimeToSeconds('08')).toBeNull();
    expect(parseCalendarTimeToSeconds('25:00')).toBeNull();
    expect(parseCalendarTimeToSeconds('08:60')).toBeNull();
    expect(isCalendarTimeInSlotWindow(9 * 3600, null, '10:00')).toBeFalse();
    expect(isCalendarTimeInSlotWindow(9 * 3600, 'bad', '10:00')).toBeFalse();
    expect(isCalendarTimeInSlotWindow(9 * 3600, '09:00', '09:00')).toBeTrue();
    expect(isCalendarTimeInSlotWindow(9 * 3600, '08:00', '10:00')).toBeTrue();
    expect(isCalendarTimeInSlotWindow(23 * 3600, '22:00', '02:00')).toBeTrue();
    expect(isCalendarTimeInSlotWindow(12 * 3600, '22:00', '02:00')).toBeFalse();
    expect(toCalendarMinutes(null)).toBeNull();
    expect(toCalendarMinutes('08')).toBeNull();
    expect(toCalendarMinutes('25:00')).toBeNull();
    expect(toCalendarMinutes('08:30')).toBe(510);
    expect(isCalendarSlotOverlappingHour(slot({ startTime: null, endTime: null }), 8 * 60, 9 * 60)).toBeFalse();
    expect(isCalendarSlotOverlappingHour(slot({ startTime: null, endTime: '09:00' }), 8 * 60, 9 * 60)).toBeTrue();
    expect(isCalendarSlotOverlappingHour(slot({ startTime: '10:00', endTime: '09:00' }), 8 * 60, 9 * 60)).toBeFalse();
    expect(isCalendarSlotOverlappingHour(slot(), 8 * 60, 9 * 60)).toBeTrue();
  });

  it('covers inserted products, pending templates and timeline blocks', () => {
    const slots = [
      slot(),
      slot({ slotId: 2, slotKey: 'start-only', title: 'Start only', sortOrder: 2, startTime: '23:30', endTime: null }),
      slot({ slotId: 3, slotKey: 'end-only', title: 'End only', sortOrder: 3, startTime: null, endTime: '01:00' }),
      slot({ slotId: 4, slotKey: 'free', title: 'Free', sortOrder: 4, startTime: null, endTime: null }),
    ];
    const first = item({ id: 10 });
    const second = item({ id: 11, slotId: null, slotKey: 'orphan', occurredAt: '2026-02-17T17:45:00Z' });
    const invalid = item({ id: 12, occurredAt: 'invalid', insertedAt: '' });
    const entries = [{ slot: toCalendarSlotSummary(slots[0]), items: [first] }];
    const products = buildCalendarInsertedProducts(entries, [second, first, invalid], '2026-02-17', slots, 'UTC');
    expect(products.map((value) => value.id)).toEqual([10, 11]);
    expect(products[0].slotTitle).toBe('Breakfast');
    expect(products[1].slotTitle).toBe('orphan');
    expect(buildCalendarInsertedProducts(entries, [], '2026-02-17', slots, 'UTC')).toHaveSize(1);
    expect(buildCalendarInsertedProductsByHour(entries, [first, second], '2026-02-17', slots, 'UTC').get(8)).toHaveSize(1);
    expect(resolveCalendarInsertedProductMinute({ ...products[0], occurredAt: null, insertedAt: 'invalid' }, 'UTC')).toBeNull();
    expect(resolveCalendarInsertedProductMinute(products[0], 'UTC')).toBe(8 * 60 + 15);
    expect(resolveCalendarItemTimestamp({ ...first, occurredAt: '  ', insertedAt: ' 2026-02-17T08:00:00Z ' })).toContain('2026');
    expect(resolveCalendarItemTimestamp({ ...first, occurredAt: ' ', insertedAt: ' ' })).toBeNull();
    expect(resolveCalendarSlotInfo(slots[0], first)).toEqual({ slotTitle: 'Breakfast', slotKey: 'breakfast' });
    expect(resolveCalendarSlotInfo(null, { ...first, slotKey: ' late ' })).toEqual({ slotTitle: 'late', slotKey: 'late' });
    expect(resolveCalendarSlotInfo(null, { ...first, slotKey: ' ' })).toBeNull();

    const pendingResponse = response({
      items: [item({ id: 20, templateItemId: 9 })],
      templateItems: [
        templateItem({ id: 9 }),
        templateItem({ id: 10, status: 'converted' }),
        templateItem({ id: 11, convertedItemId: 20 }),
        templateItem({ id: 12, stockByInventory: [{ inventoryId: 7, inventoryName: 'Pantry', qtyAvailableNormalized: 500, enoughStock: true }] }),
        templateItem({ id: 13, slotId: null, slotKey: ' missing ', preferredTime: 'bad', qtyUnit: null }),
      ],
    });
    const pending = resolvePendingCalendarTemplateItems(pendingResponse, slots);
    expect(pending.map((value) => value.id)).toEqual([12, 13]);
    expect(pending[0].stockAvailable).toBeTrue();
    expect(pending[0].stockLabel).toContain('Pantry');
    expect(pending[1].stockLabel).toBe('Low stock');
    expect(resolvePendingCalendarTemplateItems(null, slots)).toEqual([]);
    expect(resolveCalendarTemplatePreferredMinute(null)).toBe(360);
    expect(resolveCalendarTemplatePreferredMinute('bad')).toBe(360);
    expect(resolveCalendarTemplatePreferredMinute(' 08:30 ')).toBe(510);
    expect(resolveCalendarSlotForTemplateItem(templateItem(), slots)).toBe(slots[0]);
    expect(resolveCalendarSlotForTemplateItem(templateItem({ slotId: 99, slotKey: 'breakfast' }), slots)).toBe(slots[0]);
    expect(resolveCalendarSlotForTemplateItem(templateItem({ slotId: null, slotKey: ' ' }), slots)).toBeNull();
    expect(normalizeCalendarTimelineEndMinute(100, 90)).toBe(130);
    expect(normalizeCalendarTimelineEndMinute(100, 2000)).toBe(1440);
    expect(formatCalendarMinutesClock(-1)).toBe('00:00');
    expect(formatCalendarMinutesClock(1500)).toBe('24:00');

    const planned = pending;
    const blocks = buildCalendarWeekTimelineBlocks('2026-02-17', slots, products, planned, 'UTC');
    expect(blocks.map((block) => block.kind)).toContain('slot');
    expect(blocks.map((block) => block.kind)).toContain('orphan');
    expect(blocks.some((block) => block.rangeLabel.includes('estimated'))).toBeTrue();
  });

  it('covers calendar formatting, macros, models and date utilities', () => {
    expect(normalizeCalendarTimezone('')).toBe('UTC');
    expect(normalizeCalendarTimezone('invalid/timezone')).toBe('UTC');
    expect(formatCalendarItemTime('2026-02-17T08:00:00Z', 'bad', 'UTC')).toBe('08:00');
    expect(formatCalendarItemTime(null, 'bad', 'UTC')).toBe('bad');
    expect(formatCalendarInsertedAt('2026-02-17T08:00:00Z', 'UTC')).toBe('08:00');
    expect(formatCalendarInsertedAt('bad', 'UTC')).toBe('bad');
    expect(formatCalendarClock(null)).toBeNull();
    expect(formatCalendarClock('08:30:00')).toBe('08:30');
    expect(formatCalendarSlotRange(slot())).toBe('08:00-10:00');
    expect(formatCalendarSlotRange(slot({ startTime: null, endTime: '10:00' }))).toBe('10:00');
    expect(formatCalendarSlotRange(slot({ startTime: null, endTime: null }))).toBe('horaire libre');
    expect(getCalendarTargetSourceText('cycle')).toContain('Cycle');
    expect(getCalendarTargetSourceBadgeText('daySet')).toContain('Day set');
    expect(getCalendarDayTargetSourcePillText('none')).toBe('No target');
    expect(getCalendarTemplateSourceBadgeText('manual')).toBe('Manual template');
    expect(getCalendarTemplateSourceBadgeText('unknown')).toBeNull();
    expect(formatCalendarCompactNumber(12.34, 2)).toContain('12');
    expect(formatCalendarWeekMacroValue('donnee incomplete')).toBe('...');
    expect(formatCalendarWeekMacroValue(120)).toContain('120');
    expect(formatCalendarMetricValue(12.3)).toContain('12');
    expect(formatCalendarMetricValue('  text ' as any)).toBe('  text ');
    expect(formatCalendarMetricValue(' ' as any)).toBe('--');
    expect(formatCalendarSignedMetricValue(2)).toContain('+');
    expect(formatCalendarSignedMetricValue(-2)).toContain('-');
    expect(formatCalendarSignedMetricValue('text' as any)).toBe('text');
    expect(formatCalendarSignedMetricValue(null)).toBe('--');
    expect(formatCalendarQuantityLabel(12.34)).toContain('12');

    const macroSlot = {
      slot: { slotId: 1, slotKey: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: '08:00', endTime: '10:00', nutritionValue: null },
      energyKcal: 500,
      proteins: 'donnee incomplete',
      carbs: null,
      lipids: 20,
      targets: { energyKcal: 600, proteins: 30 },
      deltaToTargets: { energyKcal: -100, proteins: 0 },
      incompleteNutritionKeys: [],
    } as unknown as InputDayTotalsMacrosBySlotEntry;
    expect(buildCalendarDaySlotMacroGroups([macroSlot])[0].cards.length).toBeGreaterThan(0);
    expect(buildCalendarDaySlotMacroGroups([{ ...macroSlot, energyKcal: null, proteins: null, carbs: null, lipids: null, targets: null, deltaToTargets: null } as unknown as InputDayTotalsMacrosBySlotEntry]).length).toBe(0);
    expect(buildCalendarMonthAlertBadges([{ key: 'energyKcal', status: 'over' } as any], [{ key: 'proteins', status: 'over' } as any], 1).length).toBe(3);
    expect(buildCalendarMonthAlertBadges([], [], 2).at(-1)?.text).toContain('2');
    expect(buildCalendarMacroHighlights(null)).toEqual([]);
    expect(buildCalendarMacroHighlights({ energyKcal: 120, proteins: 'donnee incomplete', carbs: null, lipids: 12 } as any)).toHaveSize(3);
    expect(buildCalendarMacroComparisonsFromTotals(null)).toEqual([]);
    expect(buildCalendarMacroComparisonsFromTotals({ dayTotal: { energyKcal: 100, proteins: 20, carbs: 30, lipids: 10 }, targets: { energyKcal: 0, proteins: 20, carbs: 40, lipids: 10 }, bySlot: [], deltaToTargets: null, incompleteNutritionKeys: [], targetSource: 'daySet' })).toHaveSize(4);
    expect(buildCalendarDayMacroCards({ energyKcal: 100, custom: 'x' } as any, { energyKcal: 120 }, { energyKcal: -20 })).toHaveSize(2);
    expect(getCalendarMetricEntries(null)).toEqual([]);
    expect(getCalendarMetricEntries({ custom: 2, proteins: 20 }).map((entry) => entry.key)).toEqual(['proteins', 'custom']);
    expect(compareCalendarMacroKeys('proteins', 'custom')).toBeLessThan(0);
    expect(compareCalendarMacroKeys('custom', 'other')).toBeLessThan(0);
    expect(resolveCalendarMacroComparisonStatus(1, 0)).toBe('over');
    expect(resolveCalendarMacroComparisonStatus(0, 0)).toBe('exact');
    expect(resolveCalendarMacroComparisonStatus(1, 2)).toBe('under');
    expect(resolveCalendarDayMacroCardStatus(undefined, undefined, 0)).toBe('exact');
    expect(resolveCalendarDayMacroCardStatus(undefined, undefined, -1)).toBe('under');
    expect(resolveCalendarDayMacroCardStatus(2, 1, undefined)).toBe('over');
    expect(resolveCalendarDayMacroCardStatus(undefined, undefined, 'donnee incomplete')).toBe('neutral');
    expect(buildCalendarSlotTrackKey(slot({ slotId: null, slotKey: 'x' }))).toContain('x');
    expect(CALENDAR_MACRO_DEFINITIONS['energyKcal'].unit).toBe('kcal');

    expect(generateMonthDays(2, 2026).length).toBeGreaterThan(28);
    expect(generateWeekDays(DateTime.fromISO('2026-02-17')).length).toBe(7);
    expect(generateYearMonths(2026)).toHaveSize(12);
    expect(generateDayHours()).toHaveSize(24);
  });
});
