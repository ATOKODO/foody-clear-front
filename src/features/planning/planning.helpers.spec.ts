import { DateTime } from 'luxon';

import {
  findPlanningInputDayResponseForDate,
  getPlanningFallbackCalendarViewLabel,
  isPlanningCalendarView,
  isPlanningDateLocal,
  resolvePlanningCalendarDateLocal,
  resolvePlanningCalendarView,
  resolvePlanningExternalEntrySlots,
  resolvePlanningHourClickDateLocal,
  resolvePlanningTimezone,
  shouldSkipPlanningInputDataRequest,
  shouldThrottlePlanningAutoRefresh,
  shouldUseRecentPlanningData,
  stringifyPlanningDebugValue,
} from './planning.helpers';

describe('planning helpers', () => {
  it('should resolve dates, views, labels and timezones', () => {
    expect(resolvePlanningTimezone()).toBeTruthy();
    expect(isPlanningDateLocal('2026-02-16')).toBeTrue();
    expect(isPlanningDateLocal('bad')).toBeFalse();
    expect(resolvePlanningHourClickDateLocal(' 2026-02-16 ', 'bad')).toBe('2026-02-16');
    expect(resolvePlanningHourClickDateLocal('', '2026-02-16T08:00:00Z')).toBe('2026-02-16');
    expect(isPlanningCalendarView('day')).toBeTrue();
    expect(isPlanningCalendarView('unknown')).toBeFalse();
    const map = (values: Record<string, string | null>) => ({
      get: (key: string) => values[key] ?? null,
    });
    expect(resolvePlanningCalendarView(map({ view: 'week' }) as never)).toBe('week');
    expect(resolvePlanningCalendarView(map({ view: 'bad' }) as never)).toBe('month');
    expect(resolvePlanningCalendarDateLocal(map({ date: '2026-02-16' }) as never)).toBe('2026-02-16');
    expect(resolvePlanningCalendarDateLocal(map({ date: 'bad' }) as never)).toBe(
      DateTime.local().toFormat('yyyy-LL-dd'),
    );
    expect(getPlanningFallbackCalendarViewLabel('year')).toBe('Year');
    expect(getPlanningFallbackCalendarViewLabel('month')).toBe('Month');
    expect(getPlanningFallbackCalendarViewLabel('week')).toBe('Week');
    expect(getPlanningFallbackCalendarViewLabel('day')).toBe('Day');
  });

  it('should handle cache and throttling decisions', () => {
    const now = 100_000;
    expect(shouldThrottlePlanningAutoRefresh(0, now).throttled).toBeFalse();
    expect(shouldThrottlePlanningAutoRefresh(now - 1, now).throttled).toBeTrue();
    expect(shouldUseRecentPlanningData(now - 1, now)).toBeTrue();
    expect(shouldUseRecentPlanningData(0, now)).toBeFalse();
    expect(shouldSkipPlanningInputDataRequest({
      requestKey: 'day:1:UTC',
      force: false,
      inputDataRequestKey: 'day:1:UTC',
      lastInputDataLoadedKey: null,
      lastInputDataLoadedAt: 0,
    })).toBeTrue();
    expect(shouldSkipPlanningInputDataRequest({
      requestKey: 'day:1:UTC',
      force: false,
      inputDataRequestKey: null,
      lastInputDataLoadedKey: 'day:1:UTC',
      lastInputDataLoadedAt: Date.now() - 1,
    })).toBeTrue();
    expect(shouldSkipPlanningInputDataRequest({
      requestKey: 'day:1:UTC',
      force: true,
      inputDataRequestKey: null,
      lastInputDataLoadedKey: 'day:1:UTC',
      lastInputDataLoadedAt: Date.now() - 1,
    })).toBeFalse();
  });

  it('should find day responses and resolve external entry slots', () => {
    const day = { dateLocal: '2026-02-16', slots: [{ slotId: 1, title: 'Breakfast' }] } as never;
    const inputWeekResponse = { days: [{ dateLocal: '2026-02-17' }] };
    const inputMonthResponse = { days: [{ dateLocal: '2026-02-18' }] };
    const lookup = {
      inputDayResponse: day,
      inputWeekResponse,
      inputMonthResponse,
    };
    expect(findPlanningInputDayResponseForDate('2026-02-16', lookup as never)).toBe(day);
    expect(findPlanningInputDayResponseForDate('2026-02-17', lookup as never)).toEqual(inputWeekResponse.days[0] as never);
    expect(findPlanningInputDayResponseForDate('2026-02-18', lookup as never)).toEqual(inputMonthResponse.days[0] as never);
    expect(findPlanningInputDayResponseForDate('unknown', lookup as never)).toBeNull();
    expect(resolvePlanningExternalEntrySlots({
      dateLocal: '2026-02-16',
      slots: [],
      ...lookup,
    } as never)).toEqual((day as { slots: unknown[] }).slots as never);
    expect(resolvePlanningExternalEntrySlots({
      dateLocal: '2026-02-20',
      slots: [{ id: 2, key: 'snack', title: 'Snack', sortOrder: 3, startTime: null, endTime: null }],
      inputDayResponse: null,
      inputWeekResponse: null,
      inputMonthResponse: null,
    })).toEqual([
      { slotId: 2, slotKey: 'snack', title: 'Snack', sortOrder: 3, startTime: null, endTime: null, nutritionValue: null },
    ]);
  });

  it('should stringify regular and circular debug values', () => {
    expect(stringifyPlanningDebugValue(null)).toBe('null');
    expect(stringifyPlanningDebugValue({ ok: true })).toContain('ok');
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(stringifyPlanningDebugValue(circular)).toBe('Unserializable debug value');
  });
});
