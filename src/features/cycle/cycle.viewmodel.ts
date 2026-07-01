import type { SegmentedToggleOption } from '../../app/ui/segmented-toggle/segmented-toggle';
import type { CycleFormValue } from '../../components/cycle/form-cycle/form-cycle';
import type { CycleListItem } from '../../components/cycle/list-cycle/list-cycle';
import {
  DEFAULT_MACRO_NUTRITION_KEYS,
  buildCycleListItem,
  deriveCycleDurationPresentation,
  getCycleMacroTotals,
  resolveCycleDaySetIds,
  resolveCycleDaySetTimeline,
  resolveCycleDurationDays,
  type MacroNutritionKeys,
} from '../../components/cycle/list-cycle/cycle-list-item.mapper';
import type { DaySetListItem } from '../../components/day-set/day-set-list/day-set-list';
import type { SlotListItem } from '../../components/slot/slot-list/slot-list';
import {
  getFallbackUnitsForNutritionKey,
  resolveDefaultNutritionKeys,
} from '../../components/shared/default-nutrition-values';
import type {
  CreateCycleDto,
  Cycle,
  CycleAssignmentGapMode,
  CycleAssignmentRescheduleScope,
  CycleNutritionValue,
} from '../../interfaces/cycle.interface';
import type { DaySet } from '../../interfaces/day-set.interface';
import type { Slot } from '../../interfaces/slot.interface';
import type { TemplateSummary } from '../../interfaces/template.interface';
import type { NutritionKeyMeta } from '../../services/meta-service';

export type { MacroNutritionKeys };

export type CycleHubView = 'cycle' | 'daySet' | 'slot';
export type CycleImpactDialogResult = 'submitted' | 'cancelled';

export interface CycleHubViewConfig {
  title: string;
  addLabel: string;
}

export interface CycleUpdateImpactOptions {
  assignmentRescheduleScope: CycleAssignmentRescheduleScope;
  assignmentGapMode: CycleAssignmentGapMode;
  assignmentEffectiveDateLocal?: string;
}

export const CYCLE_HUB_VIEW_CONFIG: Record<CycleHubView, CycleHubViewConfig> = {
  cycle: {
    title: 'Cycles',
    addLabel: 'Ajouter un cycle',
  },
  daySet: {
    title: 'Targets',
    addLabel: 'Ajouter un day set',
  },
  slot: {
    title: 'Slots',
    addLabel: 'Ajouter un slot',
  },
};

export const CYCLE_HUB_VIEW_OPTIONS: readonly SegmentedToggleOption<CycleHubView>[] = [
  { value: 'cycle', label: 'Cycles' },
  { value: 'daySet', label: 'Targets' },
  { value: 'slot', label: 'Slots' },
];

export const DEFAULT_CYCLE_MACRO_NUTRITION_KEYS: MacroNutritionKeys = {
  ...DEFAULT_MACRO_NUTRITION_KEYS,
};

export interface CycleFormInitialValueOptions {
  macroNutritionKeys: MacroNutritionKeys;
  nutritionKeys: NutritionKeyMeta[];
}

export function buildCycleHubListItems(
  cycles: Cycle[],
  macroNutritionKeys: MacroNutritionKeys,
  daySets: DaySet[],
  slots: Slot[],
): CycleListItem[] {
  return cycles.map((cycle) =>
    buildCycleListItem(cycle, {
      macroNutritionKeys,
      fallbackDaySets: daySets,
      fallbackSlots: slots,
    }),
  );
}

export function buildCycleDaySetListItems(
  daySets: DaySet[],
): DaySetListItem[] {
  return daySets.map((daySet) => ({
    id: String(daySet.id),
    title: daySet.title,
    nutritionValues: daySet.nutritionValues ?? [],
  }));
}

export function buildCycleSlotListItems(slots: Slot[]): SlotListItem[] {
  return slots.map((slot) => ({
    id: String(slot.id),
    key: slot.key,
    title: slot.title,
    sortOrder: slot.sortOrder,
    startTime: slot.startTime ?? null,
    endTime: slot.endTime ?? null,
    nutritionValues: slot.nutritionValues ?? [],
  }));
}

export function buildCycleTemplateListItems(
  templates: TemplateSummary[],
): TemplateSummary[] {
  return templates.map((template) => ({
    id: template.id,
    title: template.title,
  }));
}

export function toCycleFormInitialValue(
  cycle: Cycle,
  options: CycleFormInitialValueOptions,
): Partial<CycleFormValue> {
  const durationPresentation = deriveCycleDurationPresentation(
    resolveCycleDurationDays(cycle),
  );

  return {
    titre: cycle.title,
    couleur: cycle.color,
    nutritionValues: getEditableCycleNutritionValues(cycle, options),
    nombre: durationPresentation.durationCount,
    typeDuree: durationPresentation.durationType,
    durationDays: durationPresentation.durationDays,
    slotIds: (cycle.slots ?? []).map((slot) => slot.id),
    defaultTemplateId: cycle.defaultTemplateId ?? null,
    daySetIds: resolveCycleDaySetIds(cycle),
    daySetOrder: resolveCycleDaySetTimeline(cycle),
  };
}

export function toCreateCycleDto(
  value: CycleFormValue,
  options: CycleFormInitialValueOptions,
): CreateCycleDto {
  const durationPresentation = deriveCycleDurationPresentation(
    normalizePositiveInteger(value.durationDays, 1),
  );
  const nutritionValues = value.nutritionValues
    .map((nutritionValue) =>
      buildCycleNutritionValue(
        nutritionValue.nutritionKey,
        nutritionValue.amount,
        options.nutritionKeys,
        nutritionValue.unit,
        nutritionValue.reference,
      ),
    )
    .filter((nutritionValue) => nutritionValue.nutritionKey.trim() !== '');

  return {
    title: value.titre,
    color: value.couleur,
    nutritionValues,
    durationDays: durationPresentation.durationDays,
    durationCount: durationPresentation.durationCount,
    durationType: durationPresentation.durationType,
    slotIds: value.slotIds,
    defaultTemplateId: normalizeTemplateId(value.defaultTemplateId),
    daySetIds: normalizeDaySetIds(value.daySetOrder),
    daySetOrder: normalizeDaySetTimeline(value.daySetOrder),
  };
}

export function resolveMacroNutritionKeysFromMeta(
  nutritionKeys: NutritionKeyMeta[],
): MacroNutritionKeys {
  return {
    proteins: resolveNutritionKey(nutritionKeys, 'PROTEIN'),
    carbs: resolveNutritionKey(nutritionKeys, 'CARBOHYDRATE'),
    lipids: resolveNutritionKey(nutritionKeys, 'FAT'),
  };
}

export function shouldConfirmCycleImpact(
  existingCycle: Cycle | null,
  payload: Pick<CreateCycleDto, 'durationDays'>,
): boolean {
  return (
    existingCycle !== null &&
    resolveCycleDurationDays(existingCycle) !== payload.durationDays
  );
}

function getEditableCycleNutritionValues(
  cycle: Cycle,
  options: CycleFormInitialValueOptions,
): CycleNutritionValue[] {
  if (cycle.nutritionValues && cycle.nutritionValues.length > 0) {
    return cycle.nutritionValues.map((value) => ({
      nutritionKey: value.nutritionKey,
      amount: toNumber(value.amount),
      unit: value.unit,
      reference: value.reference,
    }));
  }

  const macros = getCycleMacroTotals(cycle, options.macroNutritionKeys);
  return buildCycleNutritionValues(
    macros.proteins,
    macros.carbs,
    macros.lipids,
    options.nutritionKeys,
    options.macroNutritionKeys,
  );
}

function buildCycleNutritionValues(
  proteins: number,
  carbs: number,
  lipids: number,
  nutritionKeys: NutritionKeyMeta[],
  macroNutritionKeys: MacroNutritionKeys,
): CycleNutritionValue[] {
  const [energyKey] = resolveDefaultNutritionKeys(nutritionKeys);
  const energyKcal = roundNumber(proteins * 4 + carbs * 4 + lipids * 9);

  return [
    buildCycleNutritionValue(energyKey, energyKcal, nutritionKeys),
    buildCycleNutritionValue(macroNutritionKeys.proteins, proteins, nutritionKeys),
    buildCycleNutritionValue(macroNutritionKeys.carbs, carbs, nutritionKeys),
    buildCycleNutritionValue(macroNutritionKeys.lipids, lipids, nutritionKeys),
  ];
}

function buildCycleNutritionValue(
  nutritionKey: string,
  amount: number,
  nutritionKeys: NutritionKeyMeta[],
  unit?: string,
  reference?: 'PER_100G' | 'PER_100ML',
): CycleNutritionValue {
  const resolvedNutritionKey = normalizeNutritionKey(nutritionKey, nutritionKeys);
  return {
    nutritionKey: resolvedNutritionKey,
    amount: roundNumber(amount),
    unit: unit ?? resolveUnitForNutritionKey(resolvedNutritionKey, nutritionKeys),
    reference: reference ?? 'PER_100G',
  };
}

function normalizeNutritionKey(
  nutritionKey: string,
  nutritionKeys: NutritionKeyMeta[],
): string {
  const normalized = nutritionKey.trim();
  if (normalized === '') {
    return '';
  }

  const found = nutritionKeys.find(
    (key) =>
      key.value.toUpperCase() === normalized.toUpperCase() ||
      key.key.toUpperCase() === normalized.toUpperCase(),
  );
  return found?.value ?? normalized.toUpperCase();
}

function resolveNutritionKey(
  nutritionKeys: NutritionKeyMeta[],
  expectedKey: 'PROTEIN' | 'CARBOHYDRATE' | 'FAT',
): string {
  const found = nutritionKeys.find(
    (key) =>
      key.value.toUpperCase() === expectedKey ||
      key.key.toUpperCase() === expectedKey,
  );
  return found?.value ?? expectedKey;
}

function resolveUnitForNutritionKey(
  nutritionKey: string,
  nutritionKeys: NutritionKeyMeta[],
): string {
  const found = nutritionKeys.find(
    (key) =>
      key.value.toUpperCase() === nutritionKey.toUpperCase() ||
      key.key.toUpperCase() === nutritionKey.toUpperCase(),
  );
  if (!found || found.allowedUnits.length === 0) {
    return getFallbackUnitsForNutritionKey(nutritionKey)[0];
  }

  const gramUnit = found.allowedUnits.find((unit) => unit.toUpperCase() === 'G');
  return gramUnit ?? found.allowedUnits[0];
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeTemplateId(templateId: number | null | undefined): number | null {
  return typeof templateId === 'number' &&
    Number.isInteger(templateId) &&
    templateId > 0
    ? templateId
    : null;
}

function normalizeDaySetIds(daySetIds: number[] | null | undefined): number[] {
  return Array.from(
    new Set((daySetIds ?? []).filter((id) => Number.isInteger(id) && id > 0)),
  );
}

function normalizeDaySetTimeline(
  daySetOrder: number[] | null | undefined,
): number[] {
  return (daySetOrder ?? [])
    .map((id) => Math.trunc(Number(id)))
    .filter((id) => Number.isInteger(id) && id >= 0);
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const normalized = Math.trunc(Number(value));
  return normalized >= 1 ? normalized : fallback;
}
