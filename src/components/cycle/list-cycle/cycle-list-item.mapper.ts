import {
  CycleBreakdownMetric,
  CycleBreakdownStatus,
  CycleDaySetBreakdown,
  CycleListItem,
  CycleMacroTotals,
  CycleSlotBreakdown,
} from './list-cycle';
import { Cycle, CycleNutritionValue } from '../../../interfaces/cycle.interface';
import { DaySet } from '../../../interfaces/day-set.interface';
import { Slot } from '../../../interfaces/slot.interface';

type MacroKey = keyof CycleMacroTotals;

type DaySetRecord = {
  id: number;
  title: string;
  nutritionValues: CycleNutritionValue[];
  slotIds: number[] | null;
  hasSlotIdsProperty: boolean;
  slots: unknown[] | null;
  hasSlotsProperty: boolean;
};

type SlotRecord = {
  id: number | null;
  key: string;
  title: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  nutritionValues: CycleNutritionValue[];
};

type SlotResolution = {
  slots: SlotRecord[];
  hasMissingSlotBreakdown: boolean;
};

export interface CycleDurationPresentation {
  durationDays: number;
  durationCount: number;
  durationType: Cycle['durationType'];
}

export type MacroNutritionKeys = Record<MacroKey, string>;

export interface BuildCycleListItemOptions {
  macroNutritionKeys?: Partial<MacroNutritionKeys>;
  fallbackDaySets?: DaySet[];
  fallbackSlots?: Slot[];
}

export const DEFAULT_MACRO_NUTRITION_KEYS: MacroNutritionKeys = {
  proteins: 'PROTEIN',
  carbs: 'CARBOHYDRATE',
  lipids: 'FAT',
};

const MACRO_DEFINITIONS: Array<{ key: MacroKey; label: string }> = [
  { key: 'proteins', label: 'Proteines' },
  { key: 'carbs', label: 'Glucides' },
  { key: 'lipids', label: 'Lipides' },
];

export function buildCycleListItem(
  cycle: Cycle,
  options: BuildCycleListItemOptions = {},
): CycleListItem {
  const macroNutritionKeys = resolveMacroNutritionKeys(options.macroNutritionKeys);
  const cycleTotals = getCycleMacroTotals(cycle, macroNutritionKeys);
  const durationDays = resolveCycleDurationDays(cycle);
  const durationPresentation = deriveCycleDurationPresentation(durationDays);
  const daySetTimeline = resolveCycleDaySetTimeline(cycle);
  const daySets = resolveCycleDaySets(cycle, options.fallbackDaySets ?? []).map((daySet) =>
    buildDaySetBreakdown(daySet, cycleTotals, macroNutritionKeys, options.fallbackSlots ?? []),
  );
  const missingDayCount = daySetTimeline.filter((daySetId) => daySetId === 0).length;
  const daySetTotals = buildEffectiveDailyTotals(
    daySets.map((daySet) => daySet.totals),
    cycleTotals,
    durationDays,
    missingDayCount,
  );
  const daySetMetrics = buildMetrics(daySetTotals, cycleTotals);

  return {
    ...cycleTotals,
    id: cycle.id,
    title: cycle.title,
    color: cycle.color,
    durationDays: durationPresentation.durationDays,
    durationCount: durationPresentation.durationCount,
    durationType: durationPresentation.durationType,
    missingDayCount,
    daySetTotals,
    daySetMetrics,
    daySets,
    hasDaySetOverflow: hasOverflow(daySetMetrics),
    hasSlotOverflow: daySets.some((daySet) => daySet.hasSlotOverflow),
    hasMissingSlotBreakdown: daySets.some((daySet) => daySet.hasMissingSlotBreakdown),
  };
}

export function getCycleMacroTotals(
  cycle: Cycle,
  macroNutritionKeys: Partial<MacroNutritionKeys> = DEFAULT_MACRO_NUTRITION_KEYS,
): CycleMacroTotals {
  const resolvedMacroKeys = resolveMacroNutritionKeys(macroNutritionKeys);
  const values = cycle.nutritionValues ?? [];
  if (values.length > 0) {
    return extractMacroTotals(values, resolvedMacroKeys);
  }

  return {
    proteins: toNumber((cycle as Partial<Cycle>).proteins),
    carbs: toNumber((cycle as Partial<Cycle>).carbs),
    lipids: toNumber((cycle as Partial<Cycle>).lipids),
  };
}

export function resolveCycleDurationDays(
  cycle: Pick<Cycle, 'durationDays' | 'durationCount' | 'durationType'>,
): number {
  const directDuration = normalizePositiveInteger((cycle as Partial<Cycle>).durationDays, 0);
  if (directDuration > 0) {
    return directDuration;
  }

  const durationCount = normalizePositiveInteger(cycle.durationCount, 1);
  if (cycle.durationType === 'semaine') {
    return durationCount * 7;
  }

  if (cycle.durationType === 'mois') {
    return durationCount * 30;
  }

  return durationCount;
}

export function deriveCycleDurationPresentation(durationDays: number): CycleDurationPresentation {
  const normalizedDurationDays = normalizePositiveInteger(durationDays, 1);

  if (normalizedDurationDays % 30 === 0) {
    return {
      durationDays: normalizedDurationDays,
      durationCount: normalizedDurationDays / 30,
      durationType: 'mois',
    };
  }

  if (normalizedDurationDays % 7 === 0) {
    return {
      durationDays: normalizedDurationDays,
      durationCount: normalizedDurationDays / 7,
      durationType: 'semaine',
    };
  }

  return {
    durationDays: normalizedDurationDays,
    durationCount: normalizedDurationDays,
    durationType: 'jour',
  };
}

export function resolveCycleDaySetIds(
  cycle: Pick<Cycle, 'daySetOrder' | 'daySets' | 'durationDays' | 'durationCount' | 'durationType'>,
): number[] {
  return normalizeDaySetIds(resolveCycleDaySetTimeline(cycle));
}

export function resolveCycleDaySetTimeline(
  cycle: Pick<Cycle, 'daySetOrder' | 'daySets' | 'durationDays' | 'durationCount' | 'durationType'>,
): number[] {
  const durationDays = resolveCycleDurationDays(cycle);
  const rawTimeline =
    Array.isArray(cycle.daySetOrder) && cycle.daySetOrder.length > 0
      ? cycle.daySetOrder
      : (cycle.daySets ?? [])
          .map((daySet) => {
            if (typeof daySet !== 'object' || daySet === null || !('id' in daySet)) {
              return NaN;
            }

            return Number((daySet as { id: unknown }).id);
          })
          .filter((id): id is number => Number.isFinite(id));

  return normalizeDaySetTimeline(rawTimeline, durationDays);
}

function buildDaySetBreakdown(
  daySet: DaySetRecord,
  cycleTotals: CycleMacroTotals,
  macroNutritionKeys: MacroNutritionKeys,
  fallbackSlots: Slot[],
): CycleDaySetBreakdown {
  const totals = extractMacroTotals(daySet.nutritionValues, macroNutritionKeys);
  const metrics = buildMetrics(totals, cycleTotals);
  const slotResolution = resolveDaySetSlots(daySet, fallbackSlots);
  const slots = slotResolution.slots.map((slot) =>
    buildSlotBreakdown(slot, totals, macroNutritionKeys),
  );
  const slotTotals = sumMacroTotals(slots.map((slot) => slot.totals));
  const slotMetrics =
    slotResolution.hasMissingSlotBreakdown && slots.length === 0
      ? []
      : buildMetrics(slotTotals, totals);

  return {
    id: daySet.id,
    title: daySet.title,
    totals,
    metrics,
    slotTotals,
    slotMetrics,
    slots,
    hasSlotOverflow: hasOverflow(slotMetrics),
    hasMissingSlotBreakdown: slotResolution.hasMissingSlotBreakdown,
  };
}

function buildSlotBreakdown(
  slot: SlotRecord,
  daySetTotals: CycleMacroTotals,
  macroNutritionKeys: MacroNutritionKeys,
): CycleSlotBreakdown {
  const totals = extractMacroTotals(slot.nutritionValues, macroNutritionKeys);

  return {
    id: slot.id,
    title: slot.title,
    key: slot.key,
    timeRange: formatSlotRange(slot.startTime, slot.endTime),
    totals,
    metrics: buildMetrics(totals, daySetTotals),
  };
}

function buildMetrics(
  totals: CycleMacroTotals,
  targets: CycleMacroTotals,
): CycleBreakdownMetric[] {
  return MACRO_DEFINITIONS.map(({ key, label }) =>
    buildMetric(key, label, totals[key], targets[key]),
  );
}

function buildMetric(
  key: MacroKey,
  label: string,
  value: number,
  target: number,
): CycleBreakdownMetric {
  const normalizedValue = roundNumber(value);
  const normalizedTarget = roundNumber(target);

  return {
    key,
    label,
    value: normalizedValue,
    target: normalizedTarget,
    percentage:
      normalizedTarget > 0 ? roundNumber((normalizedValue / normalizedTarget) * 100) : null,
    status: resolveMetricStatus(normalizedValue, normalizedTarget),
  };
}

function resolveMetricStatus(value: number, target: number): CycleBreakdownStatus {
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

function hasOverflow(metrics: CycleBreakdownMetric[]): boolean {
  return metrics.some((metric) => metric.status === 'over');
}

function sumMacroTotals(values: CycleMacroTotals[]): CycleMacroTotals {
  return values.reduce<CycleMacroTotals>(
    (totals, value) => ({
      proteins: roundNumber(totals.proteins + value.proteins),
      carbs: roundNumber(totals.carbs + value.carbs),
      lipids: roundNumber(totals.lipids + value.lipids),
    }),
    { proteins: 0, carbs: 0, lipids: 0 },
  );
}

function buildEffectiveDailyTotals(
  daySetTotals: CycleMacroTotals[],
  cycleTotals: CycleMacroTotals,
  durationDays: number,
  missingDayCount: number,
): CycleMacroTotals {
  if (durationDays <= 0) {
    return sumMacroTotals(daySetTotals);
  }

  const combinedTotals = addMacroTotals(
    sumMacroTotals(daySetTotals),
    scaleMacroTotals(cycleTotals, missingDayCount),
  );

  return scaleMacroTotals(combinedTotals, 1 / durationDays);
}

function addMacroTotals(
  left: CycleMacroTotals,
  right: CycleMacroTotals,
): CycleMacroTotals {
  return {
    proteins: roundNumber(left.proteins + right.proteins),
    carbs: roundNumber(left.carbs + right.carbs),
    lipids: roundNumber(left.lipids + right.lipids),
  };
}

function scaleMacroTotals(
  totals: CycleMacroTotals,
  factor: number,
): CycleMacroTotals {
  return {
    proteins: roundNumber(totals.proteins * factor),
    carbs: roundNumber(totals.carbs * factor),
    lipids: roundNumber(totals.lipids * factor),
  };
}

function resolveCycleDaySets(cycle: Cycle, fallbackDaySets: DaySet[]): DaySetRecord[] {
  const globalById = new Map<number, DaySetRecord>();
  fallbackDaySets.forEach((daySet) => {
    const record = toDaySetRecord(daySet);
    if (record) {
      globalById.set(record.id, record);
    }
  });

  const embeddedDaySets = (cycle.daySets ?? [])
    .map((daySet) => toDaySetRecord(daySet))
    .filter((daySet): daySet is DaySetRecord => daySet !== null);
  const embeddedById = new Map(embeddedDaySets.map((daySet) => [daySet.id, daySet]));

  if (Array.isArray(cycle.daySetOrder) && cycle.daySetOrder.length > 0) {
    return resolveCycleDaySetIds(cycle)
      .map((id) => mergeDaySetRecords(embeddedById.get(id) ?? null, globalById.get(id) ?? null))
      .filter((daySet): daySet is DaySetRecord => daySet !== null);
  }

  if (embeddedDaySets.length > 0) {
    return embeddedDaySets
      .map((daySet) => mergeDaySetRecords(daySet, globalById.get(daySet.id) ?? null))
      .filter((daySet): daySet is DaySetRecord => daySet !== null);
  }

  return resolveCycleDaySetIds(cycle)
    .map((id) => mergeDaySetRecords(null, globalById.get(id) ?? null))
    .filter((daySet): daySet is DaySetRecord => daySet !== null);
}

function mergeDaySetRecords(
  primary: DaySetRecord | null,
  fallback: DaySetRecord | null,
): DaySetRecord | null {
  if (!primary && !fallback) {
    return null;
  }

  if (!primary) {
    return fallback ? ensureDaySetTitle(fallback) : null;
  }

  if (!fallback) {
    return ensureDaySetTitle(primary);
  }

  return ensureDaySetTitle({
    id: primary.id,
    title: primary.title || fallback.title,
    nutritionValues:
      primary.nutritionValues.length > 0 ? primary.nutritionValues : fallback.nutritionValues,
    slotIds: primary.hasSlotIdsProperty ? primary.slotIds : fallback.slotIds,
    hasSlotIdsProperty: primary.hasSlotIdsProperty || fallback.hasSlotIdsProperty,
    slots: primary.hasSlotsProperty ? primary.slots : fallback.slots,
    hasSlotsProperty: primary.hasSlotsProperty || fallback.hasSlotsProperty,
  });
}

function resolveDaySetSlots(daySet: DaySetRecord, fallbackSlots: Slot[]): SlotResolution {
  if (daySet.hasSlotsProperty) {
    if (daySet.slots === null) {
      return { slots: [], hasMissingSlotBreakdown: true };
    }

    if (daySet.slots.length > 0) {
      const slots: SlotRecord[] = [];
      let hasMissing = false;

      daySet.slots.forEach((slot) => {
        const resolvedSlot = resolveSlotReference(slot, fallbackSlots);
        if (resolvedSlot) {
          slots.push(resolvedSlot);
        } else {
          hasMissing = true;
        }
      });

      return {
        slots,
        hasMissingSlotBreakdown: hasMissing,
      };
    }

    if (daySet.hasSlotIdsProperty && daySet.slotIds !== null && daySet.slotIds.length > 0) {
      const slots: SlotRecord[] = [];
      let hasMissing = false;

      daySet.slotIds.forEach((id) => {
        const slot = getSlotRecordById(fallbackSlots, id);
        if (slot) {
          slots.push(slot);
        } else {
          hasMissing = true;
        }
      });

      return {
        slots,
        hasMissingSlotBreakdown: hasMissing,
      };
    }

    return { slots: [], hasMissingSlotBreakdown: false };
  }

  if (daySet.hasSlotIdsProperty) {
    if (daySet.slotIds === null) {
      return { slots: [], hasMissingSlotBreakdown: true };
    }

    if (daySet.slotIds.length === 0) {
      return { slots: [], hasMissingSlotBreakdown: false };
    }

    const slots: SlotRecord[] = [];
    let hasMissing = false;

    daySet.slotIds.forEach((id) => {
      const slot = getSlotRecordById(fallbackSlots, id);
      if (slot) {
        slots.push(slot);
      } else {
        hasMissing = true;
      }
    });

    return {
      slots,
      hasMissingSlotBreakdown: hasMissing,
    };
  }

  return {
    slots: [],
    hasMissingSlotBreakdown: true,
  };
}

function resolveSlotReference(value: unknown, fallbackSlots: Slot[]): SlotRecord | null {
  if (typeof value === 'number') {
    return getSlotRecordById(fallbackSlots, value);
  }

  const embeddedSlot = toSlotRecord(value);
  if (!embeddedSlot) {
    return null;
  }

  if (embeddedSlot.id === null) {
    return embeddedSlot;
  }

  return mergeSlotRecords(embeddedSlot, getSlotRecordById(fallbackSlots, embeddedSlot.id));
}

function mergeSlotRecords(
  primary: SlotRecord | null,
  fallback: SlotRecord | null,
): SlotRecord | null {
  if (!primary && !fallback) {
    return null;
  }

  if (!primary) {
    return fallback ? ensureSlotTitle(fallback) : null;
  }

  if (!fallback) {
    return ensureSlotTitle(primary);
  }

  return ensureSlotTitle({
    id: primary.id ?? fallback.id,
    key: primary.key || fallback.key,
    title: primary.title || fallback.title,
    sortOrder: primary.sortOrder !== 0 ? primary.sortOrder : fallback.sortOrder,
    startTime: primary.startTime ?? fallback.startTime,
    endTime: primary.endTime ?? fallback.endTime,
    nutritionValues:
      primary.nutritionValues.length > 0 ? primary.nutritionValues : fallback.nutritionValues,
  });
}

function getSlotRecordById(fallbackSlots: Slot[], id: number): SlotRecord | null {
  const slot = fallbackSlots.find((value) => value.id === id);
  return slot ? toSlotRecord(slot) : null;
}

function toDaySetRecord(value: unknown): DaySetRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = toOptionalPositiveInteger(raw['id']);
  if (id === null) {
    return null;
  }

  const hasSlotIdsProperty = hasOwn(raw, 'slotIds');
  const hasSlotsProperty = hasOwn(raw, 'slots');

  return {
    id,
    title: readString(raw['title']) ?? '',
    nutritionValues: extractNutritionValues(raw['nutritionValues']),
    slotIds: hasSlotIdsProperty ? extractOptionalIdArray(raw['slotIds']) : null,
    hasSlotIdsProperty,
    slots:
      hasSlotsProperty && Array.isArray(raw['slots'])
        ? raw['slots']
        : hasSlotsProperty
          ? null
          : null,
    hasSlotsProperty,
  };
}

function toSlotRecord(value: unknown): SlotRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = toOptionalPositiveInteger(raw['id'] ?? raw['slotId']);
  const title = readString(raw['title']) ?? '';
  const key = readString(raw['key'] ?? raw['slotKey']) ?? '';

  if (id === null && title === '' && key === '') {
    return null;
  }

  return {
    id,
    key,
    title,
    sortOrder: toOptionalInteger(raw['sortOrder']) ?? 0,
    startTime: readString(raw['startTime']),
    endTime: readString(raw['endTime']),
    nutritionValues: extractNutritionValues(raw['nutritionValues']),
  };
}

function ensureDaySetTitle(record: DaySetRecord): DaySetRecord {
  return {
    ...record,
    title: record.title || `Day Set ${record.id}`,
  };
}

function ensureSlotTitle(record: SlotRecord): SlotRecord {
  return {
    ...record,
    title: record.title || record.key || (record.id !== null ? `Slot ${record.id}` : 'Slot'),
  };
}

function extractNutritionValues(value: unknown): CycleNutritionValue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const nutritionValues: CycleNutritionValue[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const raw = item as Record<string, unknown>;
    const nutritionKey = readString(raw['nutritionKey']);
    if (!nutritionKey) {
      return;
    }

    nutritionValues.push({
      nutritionKey,
      amount: toNumber(raw['amount']),
      unit: readString(raw['unit']) ?? 'G',
      reference: raw['reference'] === 'PER_100ML' ? 'PER_100ML' : 'PER_100G',
    });
  });

  return nutritionValues;
}

function extractMacroTotals(
  values: CycleNutritionValue[],
  macroNutritionKeys: MacroNutritionKeys,
): CycleMacroTotals {
  const totals: CycleMacroTotals = { proteins: 0, carbs: 0, lipids: 0 };

  values.forEach((value) => {
    const amount = toGrams(value.amount, value.unit);
    const key = value.nutritionKey.toUpperCase();

    if (key === macroNutritionKeys.proteins || key === 'PROTEIN') {
      totals.proteins += amount;
    } else if (key === macroNutritionKeys.carbs || key === 'CARBOHYDRATE') {
      totals.carbs += amount;
    } else if (key === macroNutritionKeys.lipids || key === 'FAT') {
      totals.lipids += amount;
    }
  });

  return {
    proteins: roundNumber(totals.proteins),
    carbs: roundNumber(totals.carbs),
    lipids: roundNumber(totals.lipids),
  };
}

function resolveMacroNutritionKeys(
  macroNutritionKeys: Partial<MacroNutritionKeys> | undefined,
): MacroNutritionKeys {
  return {
    proteins: macroNutritionKeys?.proteins ?? DEFAULT_MACRO_NUTRITION_KEYS.proteins,
    carbs: macroNutritionKeys?.carbs ?? DEFAULT_MACRO_NUTRITION_KEYS.carbs,
    lipids: macroNutritionKeys?.lipids ?? DEFAULT_MACRO_NUTRITION_KEYS.lipids,
  };
}

function extractOptionalIdArray(value: unknown): number[] | null {
  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => {
          if (typeof item === 'number') {
            return item;
          }

          if (item && typeof item === 'object' && 'id' in item) {
            return Number((item as { id: unknown }).id);
          }

          return NaN;
        })
        .filter((id): id is number => Number.isInteger(id) && id > 0),
    ),
  );
}

function formatSlotRange(startTime: string | null, endTime: string | null): string | null {
  const start = formatTimeValue(startTime);
  const end = formatTimeValue(endTime);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start ?? end ?? null;
}

function formatTimeValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toGrams(amount: number, unit: string): number {
  const normalizedUnit = unit.toUpperCase();

  if (normalizedUnit === 'G') {
    return amount;
  }

  if (normalizedUnit === 'MG') {
    return amount / 1000;
  }

  return 0;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalInteger(value: unknown): number | null {
  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : null;
}

function toOptionalPositiveInteger(value: unknown): number | null {
  const normalized = toOptionalInteger(value);
  return normalized !== null && normalized > 0 ? normalized : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function roundNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeDaySetIds(daySetIds: number[] | null | undefined): number[] {
  return Array.from(new Set((daySetIds ?? []).filter((id) => Number.isInteger(id) && id > 0)));
}

function normalizeDaySetTimeline(daySetOrder: number[] | null | undefined, durationDays: number): number[] {
  const timeline = Array.isArray(daySetOrder)
    ? daySetOrder
        .slice(0, Math.max(0, durationDays))
        .map((id) => (Number.isInteger(id) && id > 0 ? id : 0))
    : [];

  while (timeline.length < Math.max(0, durationDays)) {
    timeline.push(0);
  }

  return timeline;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const normalized = Math.trunc(Number(value));
  return normalized >= 1 ? normalized : fallback;
}
