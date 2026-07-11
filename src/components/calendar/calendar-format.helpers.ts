import { DateTime } from 'luxon';
import { CalendarDaySlot } from '../../interfaces/calendar.interface';
import {
  InputDayMacroValue,
  InputDayTargetSource,
  InputDayTotalsMacrosBySlotEntry,
  InputDayTotalsMacrosSummary,
} from '../../interfaces/input-day.interface';
import {
  CALENDAR_MACRO_DEFINITIONS,
  CALENDAR_MONTH_MACRO_ALERT_LABELS,
  CALENDAR_MACRO_ORDER,
  CalendarDayMacroCard,
  CalendarDaySlotMacroGroup,
  CalendarMacroComparison,
  CalendarMacroMetricEntry,
  CalendarMonthAlertBadge,
  CalendarWeekMacroHighlight,
} from './calendar.models';

export function normalizeCalendarTimezone(timezone: string): string {
  const candidate = timezone.trim() || 'UTC';
  return DateTime.now().setZone(candidate).isValid ? candidate : 'UTC';
}

export function formatCalendarItemTime(
  occurredAt: string | null,
  insertedAt: string,
  timezone: string,
): string {
  const timestamp = occurredAt?.trim() || insertedAt;
  const parsed = DateTime.fromISO(timestamp, { setZone: true });
  return parsed.isValid
    ? parsed.setZone(normalizeCalendarTimezone(timezone)).toFormat('HH:mm')
    : timestamp;
}

export function formatCalendarInsertedAt(
  insertedAt: string,
  timezone: string,
): string {
  const parsed = DateTime.fromISO(insertedAt, { setZone: true });
  return parsed.isValid
    ? parsed.setZone(normalizeCalendarTimezone(timezone)).toFormat('HH:mm')
    : insertedAt;
}

export function formatCalendarSlotRange(slot: CalendarDaySlot): string {
  const start = formatCalendarClock(slot.startTime);
  const end = formatCalendarClock(slot.endTime);
  return start && end ? `${start}-${end}` : (start ?? end ?? 'horaire libre');
}

export function formatCalendarClock(
  time: string | null | undefined,
): string | null {
  if (!time) {
    return null;
  }

  return time.length >= 5 ? time.slice(0, 5) : time;
}

export function getCalendarTargetSourceText(
  targetSource: InputDayTargetSource,
): string {
  const labels: Record<InputDayTargetSource, string> = {
    cycle: 'Cycle target',
    daySet: 'Day set target',
    none: 'No target',
  };
  return labels[targetSource] ?? labels.none;
}

export function getCalendarTargetSourceBadgeText(
  targetSource: InputDayTargetSource,
): string {
  const labels: Record<InputDayTargetSource, string> = {
    cycle: 'Cycle targets',
    daySet: 'Day set targets',
    none: 'No target',
  };
  return labels[targetSource] ?? labels.none;
}

export function getCalendarDayTargetSourcePillText(
  targetSource: InputDayTargetSource,
): string {
  const labels: Record<InputDayTargetSource, string> = {
    cycle: 'Assigned cycle target',
    daySet: 'Day set target',
    none: 'No target',
  };
  return labels[targetSource] ?? labels.none;
}

export function getCalendarTemplateSourceBadgeText(
  source: string | null | undefined,
): string | null {
  if (source === 'manual') {
    return 'Manual template';
  }

  if (source === 'daySet') {
    return 'Template day-set';
  }

  if (source === 'cycle') {
    return 'Template cycle';
  }

  return null;
}

export function formatCalendarCompactNumber(
  value: number,
  maximumFractionDigits: number,
): string {
  const hasFraction = Math.abs(value % 1) > Number.EPSILON;

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: hasFraction
      ? Math.min(1, maximumFractionDigits)
      : 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatCalendarWeekMacroValue(
  value: InputDayMacroValue,
): string {
  if (typeof value !== 'number') {
    return '...';
  }

  return formatCalendarCompactNumber(value, Math.abs(value) >= 100 ? 0 : 1);
}

export function formatCalendarMetricValue(
  value: number | InputDayMacroValue | null | undefined,
): string {
  if (typeof value === 'number') {
    return formatCalendarCompactNumber(value, Math.abs(value) >= 100 ? 0 : 1);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return '--';
}

export function formatCalendarSignedMetricValue(
  value: number | InputDayMacroValue | null | undefined,
): string {
  if (typeof value === 'number') {
    const formatted = formatCalendarCompactNumber(
      value,
      Math.abs(value) >= 100 ? 0 : 1,
    );
    return value > 0 ? `+${formatted}` : formatted;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return '--';
}

export function formatCalendarQuantityLabel(value: number): string {
  return formatCalendarCompactNumber(value, Math.abs(value) >= 100 ? 0 : 2);
}

export function buildCalendarDaySlotMacroGroups(
  bySlot: InputDayTotalsMacrosBySlotEntry[],
  formatSlotRange: (slot: CalendarDaySlot) => string = formatCalendarSlotRange,
): CalendarDaySlotMacroGroup[] {
  return [...bySlot]
    .sort(
      (left, right) =>
        left.slot.sortOrder - right.slot.sortOrder ||
        left.slot.title.localeCompare(right.slot.title, 'fr'),
    )
    .map((entry) => {
      const consumed = CALENDAR_MACRO_ORDER.reduce<
        Record<string, InputDayMacroValue>
      >((values, key) => {
        const value = entry[key];
        if (typeof value === 'number' || typeof value === 'string') {
          values[key] = value;
        }
        return values;
      }, {});

      return {
        key: `${entry.slot.slotId ?? entry.slot.slotKey}`,
        title: entry.slot.title,
        rangeLabel: formatSlotRange(entry.slot),
        cards: buildCalendarDayMacroCards(
          consumed,
          entry.targets,
          entry.deltaToTargets,
        ),
      };
    })
    .filter((group) => group.cards.length > 0);
}

export function buildCalendarMonthAlertBadges(
  actualComparisons: CalendarMacroComparison[],
  projectedComparisons: CalendarMacroComparison[],
  pendingTemplateItems: number,
): CalendarMonthAlertBadge[] {
  const actualComparisonByKey = new Map(
    actualComparisons.map((comparison) => [comparison.key, comparison]),
  );
  const projectedComparisonByKey = new Map(
    projectedComparisons.map((comparison) => [comparison.key, comparison]),
  );

  const badges = CALENDAR_MACRO_ORDER.reduce<CalendarMonthAlertBadge[]>(
    (accumulator, key) => {
      const macroLabel = CALENDAR_MONTH_MACRO_ALERT_LABELS[key] ?? key;
      const actualComparison = actualComparisonByKey.get(key);
      if (actualComparison?.status === 'over') {
        accumulator.push({
          key: `${key}-actual`,
          text: `${macroLabel} depasse`,
          tone: 'over',
        });
        return accumulator;
      }

      const projectedComparison = projectedComparisonByKey.get(key);
      if (projectedComparison?.status === 'over') {
        accumulator.push({
          key: `${key}-projected`,
          text: `${macroLabel} projete depasse`,
          tone: 'projected',
        });
      }

      return accumulator;
    },
    [],
  );

  if (pendingTemplateItems > 0) {
    badges.push({
      key: 'template-pending',
      text:
        pendingTemplateItems === 1
          ? 'Pending template'
          : `${pendingTemplateItems} pending templates`,
      tone: 'template',
    });
  }

  return badges;
}

export function buildCalendarMacroHighlights(
  dayTotal: Record<string, InputDayMacroValue> | null,
): CalendarWeekMacroHighlight[] {
  if (!dayTotal) {
    return [];
  }

  return CALENDAR_MACRO_ORDER.flatMap((key) => {
    const definition = CALENDAR_MACRO_DEFINITIONS[key];
    const value = dayTotal[key];
    if (!definition || value === null || value === undefined) {
      return [];
    }

    return [
      {
        key,
        label: definition.label,
        value: formatCalendarWeekMacroValue(value),
        unit: definition.unit,
        tone: definition.tone,
      },
    ];
  });
}

export function buildCalendarMacroComparisonsFromTotals(
  totals: InputDayTotalsMacrosSummary | null,
): CalendarMacroComparison[] {
  const dayTotal = totals?.dayTotal ?? null;
  const targets = totals?.targets ?? null;
  if (!dayTotal || !targets) {
    return [];
  }

  return CALENDAR_MACRO_ORDER.flatMap((key) => {
    const definition = CALENDAR_MACRO_DEFINITIONS[key];
    const value = dayTotal[key];
    const target = targets[key];
    if (!definition || typeof value !== 'number' || typeof target !== 'number') {
      return [];
    }

    const normalizedValue = roundCalendarComparisonNumber(value);
    const normalizedTarget = roundCalendarComparisonNumber(target);
    const percentage =
      normalizedTarget > 0
        ? roundCalendarComparisonNumber(
            (normalizedValue / normalizedTarget) * 100,
          )
        : null;

    return [
      {
        key,
        label: definition.label,
        abbr: definition.abbr,
        value: formatCalendarMetricValue(normalizedValue),
        target: formatCalendarMetricValue(normalizedTarget),
        percentage: formatCalendarComparisonPercentage(percentage),
        status: resolveCalendarMacroComparisonStatus(
          normalizedValue,
          normalizedTarget,
        ),
        unit: definition.unit,
        tone: definition.tone,
      },
    ];
  });
}

export function buildCalendarDayMacroCards(
  consumedValues: Record<string, InputDayMacroValue> | null | undefined,
  targets: Record<string, number> | null | undefined,
  deltas: Record<string, InputDayMacroValue> | null | undefined,
): CalendarDayMacroCard[] {
  const keys = new Set<string>([
    ...Object.keys(consumedValues ?? {}),
    ...Object.keys(targets ?? {}),
    ...Object.keys(deltas ?? {}),
  ]);

  return Array.from(keys)
    .sort(compareCalendarMacroKeys)
    .map((key) => {
      const definition = CALENDAR_MACRO_DEFINITIONS[key];
      const consumed = consumedValues?.[key];
      const target = targets?.[key];
      const delta = deltas?.[key];

      return {
        key,
        label: definition?.label ?? key,
        consumed: formatCalendarMetricValue(consumed ?? null),
        target: formatCalendarMetricValue(target ?? null),
        delta: formatCalendarSignedMetricValue(delta ?? null),
        unit: definition?.unit ?? '',
        tone: definition?.tone ?? 'energy',
        status: resolveCalendarDayMacroCardStatus(consumed, target, delta),
      };
    });
}

export function getCalendarMetricEntries(
  metrics: Record<string, number | InputDayMacroValue> | null | undefined,
): CalendarMacroMetricEntry[] {
  if (!metrics) {
    return [];
  }

  return Object.entries(metrics)
    .sort(([leftKey], [rightKey]) => compareCalendarMacroKeys(leftKey, rightKey))
    .map(([key, value]) => {
      const definition = CALENDAR_MACRO_DEFINITIONS[key];

      return {
        key,
        label: definition?.label ?? key,
        value: formatCalendarMetricValue(value),
        unit: definition?.unit ?? '',
      };
    });
}

export function compareCalendarMacroKeys(
  leftKey: string,
  rightKey: string,
): number {
  const leftIndex = CALENDAR_MACRO_ORDER.indexOf(
    leftKey as (typeof CALENDAR_MACRO_ORDER)[number],
  );
  const rightIndex = CALENDAR_MACRO_ORDER.indexOf(
    rightKey as (typeof CALENDAR_MACRO_ORDER)[number],
  );

  if (leftIndex === -1 && rightIndex === -1) {
    return leftKey.localeCompare(rightKey, 'fr');
  }

  if (leftIndex === -1) {
    return 1;
  }

  if (rightIndex === -1) {
    return -1;
  }

  return leftIndex - rightIndex;
}

export function resolveCalendarMacroComparisonStatus(
  value: number,
  target: number,
): CalendarMacroComparison['status'] {
  if (target === 0) {
    return value > 0 ? 'over' : 'exact';
  }

  if (value > target) {
    return 'over';
  }

  if (value === target) {
    return 'exact';
  }

  return 'under';
}

export function resolveCalendarDayMacroCardStatus(
  consumed: InputDayMacroValue | undefined,
  target: number | undefined,
  delta: InputDayMacroValue | undefined,
): CalendarDayMacroCard['status'] {
  if (typeof delta === 'number') {
    if (delta === 0) {
      return 'exact';
    }

    return delta > 0 ? 'over' : 'under';
  }

  if (typeof consumed === 'number' && typeof target === 'number') {
    return resolveCalendarMacroComparisonStatus(consumed, target);
  }

  return 'neutral';
}

function formatCalendarComparisonPercentage(percentage: number | null): string {
  return percentage === null
    ? 'Cible 0'
    : `${formatCalendarCompactNumber(percentage, 2)}%`;
}

function roundCalendarComparisonNumber(value: number): number {
  return Math.round(value * 100) / 100;
}
