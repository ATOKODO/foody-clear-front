import type { ParamMap } from '@angular/router';
import { DateTime } from 'luxon';
import type { CalendarView } from '../../interfaces/calendar.interface';
import type {
  InputDayDaySetSlotSummary,
  InputDayResponse,
  InputMonthResponse,
  InputWeekResponse,
} from '../../interfaces/input-day.interface';
import type { Slot } from '../../interfaces/slot.interface';
import {
  AUTO_REFRESH_THROTTLE_MS,
  PLANNING_DATA_CACHE_MS,
} from './planning.models';

export interface PlanningInputDayLookup {
  inputDayResponse: InputDayResponse | null;
  inputWeekResponse: InputWeekResponse | null;
  inputMonthResponse: InputMonthResponse | null;
}

export interface PlanningExternalEntrySlotsInput extends PlanningInputDayLookup {
  dateLocal: string;
  slots: readonly Slot[];
}

export interface PlanningInputDataSkipInput {
  requestKey: string;
  force: boolean;
  inputDataRequestKey: string | null;
  lastInputDataLoadedKey: string | null;
  lastInputDataLoadedAt: number;
}

export function resolvePlanningTimezone(): string {
  return DateTime.local().zoneName || 'UTC';
}

export function resolvePlanningTodayDateLocal(): string {
  return DateTime.local().toFormat('yyyy-LL-dd');
}

export function isPlanningDateLocal(value: string): boolean {
  return value.length === 10 && DateTime.fromISO(value).isValid;
}

export function resolvePlanningHourClickDateLocal(
  dateLocal: string,
  currentDateIso: string,
): string {
  const candidate = dateLocal.trim();
  if (candidate !== '') {
    return candidate;
  }

  return DateTime.fromISO(currentDateIso).toISODate() ?? '';
}

export function isPlanningCalendarView(
  value: string | null,
): value is CalendarView {
  return (
    value === 'day' ||
    value === 'week' ||
    value === 'month' ||
    value === 'year'
  );
}

export function resolvePlanningCalendarView(
  queryParamMap: ParamMap,
): CalendarView {
  const requestedView = queryParamMap.get('view');
  return isPlanningCalendarView(requestedView) ? requestedView : 'month';
}

export function resolvePlanningCalendarDateLocal(
  queryParamMap: ParamMap,
): string {
  const requestedDateLocal = queryParamMap.get('date') ?? '';
  if (isPlanningDateLocal(requestedDateLocal)) {
    return requestedDateLocal;
  }

  return resolvePlanningTodayDateLocal();
}

export function getPlanningFallbackCalendarViewLabel(
  view: CalendarView,
): string {
  if (view === 'year') {
    return 'Year';
  }

  if (view === 'month') {
    return 'Month';
  }

  if (view === 'week') {
    return 'Week';
  }

  return 'Day';
}

export function shouldThrottlePlanningAutoRefresh(
  lastAutomaticRefreshAt: number,
  now = Date.now(),
): { throttled: boolean; lastAutomaticRefreshAt: number } {
  if (now - lastAutomaticRefreshAt < AUTO_REFRESH_THROTTLE_MS) {
    return { throttled: true, lastAutomaticRefreshAt };
  }

  return { throttled: false, lastAutomaticRefreshAt: now };
}

export function shouldUseRecentPlanningData(
  lastLoadedAt: number,
  now = Date.now(),
): boolean {
  return (
    lastLoadedAt > 0 && now - lastLoadedAt < PLANNING_DATA_CACHE_MS
  );
}

export function shouldSkipPlanningInputDataRequest({
  requestKey,
  force,
  inputDataRequestKey,
  lastInputDataLoadedKey,
  lastInputDataLoadedAt,
}: PlanningInputDataSkipInput): boolean {
  if (inputDataRequestKey === requestKey) {
    return true;
  }

  return (
    !force &&
    lastInputDataLoadedKey === requestKey &&
    shouldUseRecentPlanningData(lastInputDataLoadedAt)
  );
}

export function findPlanningInputDayResponseForDate(
  dateLocal: string,
  { inputDayResponse, inputWeekResponse, inputMonthResponse }: PlanningInputDayLookup,
): InputDayResponse | null {
  if (inputDayResponse?.dateLocal === dateLocal) {
    return inputDayResponse;
  }

  return (
    inputWeekResponse?.days.find((day) => day.dateLocal === dateLocal) ??
    inputMonthResponse?.days.find((day) => day.dateLocal === dateLocal) ??
    null
  );
}

export function resolvePlanningExternalEntrySlots({
  dateLocal,
  slots,
  ...lookup
}: PlanningExternalEntrySlotsInput): InputDayDaySetSlotSummary[] {
  const response = findPlanningInputDayResponseForDate(dateLocal, lookup);
  const responseSlots = response?.slots ?? response?.daySet?.slots ?? [];
  if (responseSlots.length > 0) {
    return responseSlots;
  }

  return slots.map((slot) => ({
    slotId: slot.id,
    slotKey: slot.key,
    title: slot.title,
    sortOrder: slot.sortOrder,
    startTime: slot.startTime ?? null,
    endTime: slot.endTime ?? null,
    nutritionValue: null,
  }));
}

export function stringifyPlanningDebugValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'Unserializable debug value';
  }
}
