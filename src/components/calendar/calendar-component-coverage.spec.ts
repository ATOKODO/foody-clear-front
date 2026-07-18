import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import type { CalendarDay, CalendarDaySlot, CalendarInsertedProduct } from '../../interfaces/calendar.interface';
import type { CycleAssignment } from '../../interfaces/cycle-assignment.interface';
import type { InputDayResponse } from '../../interfaces/input-day.interface';
import { Calendar } from './calendar';

describe('Calendar component branches', () => {
  let fixture: ComponentFixture<Calendar>;
  let component: Calendar;

  const callPrivate = (name: string, ...args: unknown[]): unknown => {
    const instance = component as unknown as Record<string, (...values: unknown[]) => unknown>;
    return instance[name](...args);
  };

  const slots: CalendarDaySlot[] = [
    { slotId: 1, slotKey: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: '08:00', endTime: '10:00' },
    { slotId: 2, slotKey: 'lunch', title: 'Lunch', sortOrder: 2, startTime: '12:00', endTime: '14:00' },
  ];

  const response: InputDayResponse = {
    dateLocal: '2026-02-17',
    timezone: 'UTC',
    assignment: {
      id: 7,
      cycleId: 3,
      cycleTitle: 'Cut cycle',
      startDateLocal: '2026-02-16',
      endDateLocal: '2026-02-22',
      dayIndex: 2,
    },
    daySet: {
      id: 4,
      title: 'Work day',
      nutritionValue: null,
      slots: slots.map((slot) => ({ ...slot, startTime: slot.startTime ?? null, endTime: slot.endTime ?? null, nutritionValue: null })),
    },
    templateAssociation: { source: 'manual', template: { id: 9, title: 'Lean template' } },
    templateItems: [
      {
        id: 91,
        productId: 10,
        productName: 'Porridge',
        qty: 1,
        qtyUnit: 'portion',
        qtyNormalized: 100,
        slotId: 1,
        slotKey: 'breakfast',
        preferredTime: '08:00',
        status: 'pending',
        convertedItemId: null,
        stockAvailability: { enoughStock: true, totalAvailableNormalized: 100, requestedQtyNormalized: 100 },
        stockByInventory: [{ inventoryId: 2, inventoryName: 'Pantry', qtyAvailableNormalized: 100, enoughStock: true }],
        nutritionValue: {},
      },
    ],
    items: [
      {
        id: 44,
        productId: 10,
        productName: 'Porridge',
        inventoryId: 2,
        qty: 100,
        qtyUnit: 'g',
        qtyNormalized: 100,
        insertedAt: '2026-02-17T07:45:00Z',
        occurredAt: '2026-02-17T08:15:00Z',
        slotId: 1,
        slotKey: 'breakfast',
        templateItemId: null,
        nutritionValue: {},
      },
    ],
    totalsMacros: {
      bySlot: [],
      dayTotal: { energyKcal: 1234, proteins: 80, carbs: 100, lipids: 40 },
      targets: { energyKcal: 2000, proteins: 100, carbs: 200, lipids: 60 },
      deltaToTargets: { energyKcal: -766, proteins: -20, carbs: -100, lipids: -20 },
      incompleteNutritionKeys: [],
      targetSource: 'daySet',
    },
    projectedTotalsMacros: {
      bySlot: [],
      dayTotal: { energyKcal: 1500, proteins: 90, carbs: 150, lipids: 50 },
      targets: { energyKcal: 2000, proteins: 100, carbs: 200, lipids: 60 },
      deltaToTargets: { energyKcal: -500, proteins: -10, carbs: -50, lipids: -10 },
      incompleteNutritionKeys: [],
      targetSource: 'daySet',
    },
    itemsBySlot: [{ slot: { ...slots[0], startTime: '08:00', endTime: '10:00' }, items: [] }],
    slots: slots.map((slot) => ({ ...slot, startTime: slot.startTime ?? null, endTime: slot.endTime ?? null, nutritionValue: null })),
  };

  const assignment = {
    id: 5,
    cycle: { id: 3, title: 'Cut cycle', color: 'red' },
    startDateLocal: '2026-02-16',
    endDateLocal: '2026-02-22',
  } as unknown as CycleAssignment;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Calendar] }).compileComponents();
    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    component.currentDate = DateTime.fromISO('2026-02-17') as typeof component.currentDate;
    fixture.componentRef.setInput('cycleAssignments', [assignment]);
    fixture.componentRef.setInput('inputDayResponse', response);
    fixture.componentRef.setInput('inputWeekResponse', {
      startDateLocal: '2026-02-16',
      endDateLocal: '2026-02-22',
      timezone: 'UTC',
      days: [response],
    });
    fixture.componentRef.setInput('inputMonthResponse', {
      startDateLocal: '2026-02-01',
      endDateLocal: '2026-02-28',
      timezone: 'UTC',
      days: [response],
    });
    fixture.componentRef.setInput('slotCatalog', slots.map((slot) => ({ id: slot.slotId, key: slot.slotKey, title: slot.title, sortOrder: slot.sortOrder, startTime: slot.startTime, endTime: slot.endTime })));
    fixture.componentRef.setInput('inputDayTimezone', 'UTC');
    fixture.detectChanges();
  });

  it('covers calendar navigation, assignments, outputs and accessors', () => {
    const dayEvents: unknown[] = [];
    const hourEvents: unknown[] = [];
    const monthEvents: unknown[] = [];
    const itemEvents: unknown[] = [];
    const openDayEvents: unknown[] = [];
    const convertEvents: unknown[] = [];
    const revertEvents: unknown[] = [];
    component.dayClick.subscribe((event) => dayEvents.push(event));
    component.hourClick.subscribe((event) => hourEvents.push(event));
    component.monthClick.subscribe((event) => monthEvents.push(event));
    component.itemClick.subscribe((event) => itemEvents.push(event));
    component.openDayView.subscribe((event) => openDayEvents.push(event));
    component.convertTemplateItem.subscribe((event) => convertEvents.push(event));
    component.revertTemplateItem.subscribe((event) => revertEvents.push(event));
    component.switchView('day');
    fixture.detectChanges();

    expect(component.getDayItemCount()).toBe(1);
    expect(component.getDaySlotCount()).toBeGreaterThan(0);
    expect(component.getDayEnergyTotal()).toContain('1');
    expect(component.getProjectedDayEnergyTotal()).toContain('1');
    expect(component.getDayTargetHeadline()).toContain('day set');
    expect(component.getDayTargetSupportingText()).toContain('Work day');
    expect(component.getDayMacroHighlights()).toHaveSize(4);
    expect(component.getDayProjectedMacroHighlights()).toHaveSize(4);
    expect(component.getDayMacroCards()).toHaveSize(4);
    expect(component.getDaySlotMacroGroups()).toEqual([]);
    expect(component.getDayEntryRows()).toHaveSize(1);
    expect(component.getDayTemplateItemCount()).toBe(1);
    expect(component.getDayPendingTemplateItemCount()).toBe(1);
    expect(component.getTemplateChipLabel(response)).toBe('Lean template');
    expect(component.getTemplateChipLabel({ ...response, templateAssociation: null })).toBeNull();
    expect(component.getTemplateSourceBadgeText(response)).toContain('Manual');
    expect(component.getPendingTemplateItemCount(response)).toBe(1);
    expect(component.getDayMetricEntries({ proteins: 80 })).toHaveSize(1);
    expect(component.getDayAssignmentHighlight()?.title).toBe('Cut cycle');
    expect(component.getDayTargetSourcePillText('daySet')).toContain('Day set');
    expect(component.getDayTemplateSlotCount()).toBe(1);
    expect(component.getDaySetSlotCount()).toBe(2);
    expect(component.getDayTemplateTimelineBlocks()).toHaveSize(1);
    expect(component.getDaySetTimelineBlocks()).toHaveSize(2);
    expect(
      component.getDayTemplateBlockEmptyText(
        { slotKey: 'breakfast' } as Parameters<
          Calendar['getDayTemplateBlockEmptyText']
        >[0],
      ),
    ).toContain('planned');

    component.toggleDaySlotStats();
    component.toggleDaySlotStats();
    component.onDayClick({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false } as CalendarDay);
    component.onHourClick({ hour: 8, label: '08:00', assignment: { id: '5', type: 'cycle' } }, '2026-02-17', 30);
    component.onMonthClick(
      component.monthDays.find(
        (day) => day.isCurrentMonth,
      ) as unknown as Parameters<Calendar['onMonthClick']>[0],
    );
    component.onManageItems('');
    component.onManageAssignment('');
    component.onMonthDayClick({ date: '2026-02-01', dateObj: DateTime.fromISO('2026-02-01'), dayNumber: 1, isToday: false, isCurrentMonth: false, isWeekend: false });
    component.onMonthDayClick({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false });
    component.requestOpenDayView('invalid');
    component.requestOpenDayView('2026-02-17');
    component.onCurrentDayClick();
    component.onItemClick({ id: 44, dateLocal: '2026-02-17', productId: 10, productName: 'Porridge', qty: 100, occurredAt: null, insertedAt: '2026-02-17T08:00:00Z', slotId: 1, slotTitle: 'Breakfast', slotKey: 'breakfast', templateItemId: null } as CalendarInsertedProduct, '2026-02-17', { stopPropagation: jasmine.createSpy('stop') } as unknown as Event);
    component.onDayTemplateItemConvert(
      { id: 9, inventoryId: null, stockAvailable: true } as Parameters<
        Calendar['onDayTemplateItemConvert']
      >[0],
      { stopPropagation: jasmine.createSpy('stop') } as unknown as Event,
    );
    component.onDayTemplateItemConvert(
      { id: 9, inventoryId: 2, stockAvailable: false } as Parameters<
        Calendar['onDayTemplateItemConvert']
      >[0],
      { stopPropagation: jasmine.createSpy('stop') } as unknown as Event,
    );
    component.onDayTemplateItemConvert(
      { id: 9, inventoryId: 2, stockAvailable: true } as Parameters<
        Calendar['onDayTemplateItemConvert']
      >[0],
      { stopPropagation: jasmine.createSpy('stop') } as unknown as Event,
    );
    component.onDayTemplateItemRevert({ id: 44, dateLocal: '2026-02-17', productId: 10, productName: 'Porridge', qty: 1, occurredAt: null, insertedAt: '2026-02-17T08:00:00Z', slotId: 1, slotTitle: 'Breakfast', slotKey: 'breakfast', templateItemId: null } as CalendarInsertedProduct, { stopPropagation: jasmine.createSpy('stop') } as unknown as Event);
    component.onDayTemplateItemRevert({ id: 44, dateLocal: '2026-02-17', productId: 10, productName: 'Porridge', qty: 1, occurredAt: null, insertedAt: '2026-02-17T08:00:00Z', slotId: 1, slotTitle: 'Breakfast', slotKey: 'breakfast', templateItemId: 9 } as CalendarInsertedProduct, { stopPropagation: jasmine.createSpy('stop') } as unknown as Event);

    expect(dayEvents.length).toBeGreaterThan(0);
    expect(hourEvents.length).toBeGreaterThan(0);
    expect(monthEvents).toHaveSize(1);
    expect(itemEvents).toHaveSize(1);
    expect(openDayEvents).toHaveSize(2);
    expect(convertEvents).toEqual([{ dateLocal: '2026-02-17', templateItemId: 9, inventoryId: 2 }]);
    expect(revertEvents).toEqual([{ dateLocal: '2026-02-17', itemId: 44 }]);

    component.onWeekTimelineBlockClick(
      { date: '2026-02-17' } as Parameters<
        Calendar['onWeekTimelineBlockClick']
      >[0],
      { startMinute: 1500 } as Parameters<
        Calendar['onWeekTimelineBlockClick']
      >[1],
      { stopPropagation: jasmine.createSpy('stop') } as unknown as Event,
    );
    component.onDayTimelineBlockClick(
      { startMinute: 1500 } as Parameters<
        Calendar['onDayTimelineBlockClick']
      >[0],
      { stopPropagation: jasmine.createSpy('stop') } as unknown as Event,
    );
    component.onDayHalfHourClick(-2, 30);
    component.onDayHalfHourClick(30, 0);

    for (const view of ['year', 'month', 'week', 'day'] as const) {
      component.switchView(view);
      component.navigate('next');
      component.navigate('prev');
      expect(component.currentViewLabel).not.toBe('');
    }
    component.switchView('month');
    component.openMonthView(component.yearMonths[0]);
    component.activateDayView('invalid');
    component.activateDayView('2026-02-17');
    component.goToToday();
    component.switchView('day');
    component.loadView();
    expect(component.getViewLabel('year')).toBe('Year');
  });

  it('covers calendar input fallback, empty state and private normalization branches', () => {
    component.switchView('week');
    fixture.componentRef.setInput('inputWeekResponse', { startDateLocal: '', endDateLocal: '', timezone: 'UTC', days: [] });
    fixture.componentRef.setInput('inputDayResponse', response);
    fixture.detectChanges();
    expect(component.getWeekDayResponse('2026-02-17')).toBe(response);
    expect(component.getWeekDaySlots('missing')).toEqual([]);
    expect(component.getWeekTimelineBlocks('missing')).toEqual([]);
    expect(component.getWeekSummaryItemCount()).toBeGreaterThan(0);
    expect(component.getWeekSummaryTemplateDayCount()).toBe(1);
    expect(component.getWeekSummaryEnergyTotal()).toContain('1');
    expect(component.getWeekDayProductCount('missing')).toBe(0);
    expect(component.getWeekDaySlotCount('2026-02-17')).toBeGreaterThan(0);
    expect(component.getWeekDayMacroComparisons('2026-02-17')).toHaveSize(4);
    expect(component.getWeekDayProjectedMacroComparisons('2026-02-17')).toHaveSize(4);
    expect(component.getMonthDayMacroComparisons('2026-02-17')).toHaveSize(4);
    expect(component.getMonthDayProjectedMacroComparisons('2026-02-17')).toHaveSize(4);
    expect(component.hasWeekDayInsights('2026-02-17')).toBeTrue();
    expect(component.hasWeekDaySummaryData({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false })).toBeTrue();
    expect(component.getWeekDayCycleTitle({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false })).toBe('Cut cycle');
    expect(component.getWeekDayCycleProgress({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false, assignment: { id: '5', type: 'cycle', dayNumber: 2 } })).toBe('D2');
    expect(component.getMonthDayAlertBadges('2026-02-17')).toHaveSize(1);
    expect(component.getMonthDayAlertBadges('missing')).toEqual([]);

    component.switchView('month');
    expect(component.getMonthDayCount()).toBeGreaterThan(0);
    expect(component.getMonthAssignedDayCount()).toBeGreaterThan(0);
    expect(component.getMonthCycleCount()).toBe(1);
    component.switchView('year');
    expect(component.getYearMonthCount()).toBe(12);
    expect(component.getYearAssignedDayCount()).toBeGreaterThan(0);
    expect(component.getYearActiveMonthCount()).toBeGreaterThan(0);
    expect(component.getYearMonthAssignedDayCount(component.yearMonths[1])).toBeGreaterThan(0);
    expect(component.getYearMonthCycleCount(component.yearMonths[1])).toBe(1);
    expect(component.getMonthDayTitle({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false, assignment: { id: '5', type: 'cycle', cycleName: 'Cut cycle' } })).toBe('Cut cycle');
    expect(component.getMonthDayType({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false })).toBe('Tracked day');
    expect(component.getMonthDayProgressText({ date: '2026-02-17', dateObj: DateTime.fromISO('2026-02-17'), dayNumber: 17, isToday: false, isCurrentMonth: true, isWeekend: false, assignment: { id: '5', type: 'cycle', dayNumber: 2, totalDays: 7 } })).toBe('Day 2/7');

    component.switchView('day');
    expect(component.formatItemTime(null, '2026-02-17T08:00:00Z')).toBe('08:00');
    expect(component.formatInsertedAt('bad')).toBe('bad');
    expect(component.formatSlotRange(slots[0])).toContain('08:00');
    expect(component.getTargetSourceText('none')).toBe('No target');
    expect(component.getTargetSourceBadgeText('cycle')).toContain('Cycle');
    expect(component.getDayEntryRows()).toHaveSize(1);
    expect(callPrivate('buildOccurredAtForTime', '2026-02-17', 8, 30)).toContain('08:30');
    expect(callPrivate('buildOccurredAtForTime', '', 8, 30)).toBeNull();
    expect(callPrivate('buildOccurredAtForTime', 'invalid', 8, 30)).toBeNull();
    expect(callPrivate('buildOccurredAtForTime', '2026-02-17', 24, 0)).toBeNull();
    expect(callPrivate('isDateInRange', 'invalid', '2026-02-01', '2026-02-02')).toBeFalse();
    expect(callPrivate('isDateInRange', '2026-02-17', '2026-02-16', '2026-02-22')).toBeTrue();
    expect(callPrivate('isDateRangeOverlappingMonth', { startDateLocal: 'invalid', endDateLocal: 'invalid' }, { year: 2026, month: 2 })).toBeFalse();
    expect(callPrivate('isDateRangeOverlappingMonth', assignment, { year: 2026, month: 2 })).toBeTrue();
    expect(callPrivate('resolveCycleColorClass', 'red')).toBe('bg-red-500');
    expect(callPrivate('resolveCycleColorClass', 'unknown')).toBe('bg-slate-500');
    expect(callPrivate('resolveMonthStartDateTime', { year: 2026, month: 2 })).toEqual(jasmine.any(DateTime));
    expect(callPrivate('findAssignmentForDate', '2026-02-17')).toBe(assignment);
    expect(callPrivate('findAssignmentForDate', '2026-03-01')).toBeUndefined();
    expect(callPrivate('hasTemplateData', response)).toBeTrue();
    expect(callPrivate('hasTemplateData', null)).toBeFalse();
  });
});
