import type { Cycle } from '../../interfaces/cycle.interface';
import type { CycleFormValue } from '../../components/cycle/form-cycle/form-cycle';
import type { DaySet } from '../../interfaces/day-set.interface';
import type { Slot } from '../../interfaces/slot.interface';
import type { TemplateSummary } from '../../interfaces/template.interface';
import {
  CYCLE_HUB_VIEW_CONFIG,
  CYCLE_HUB_VIEW_OPTIONS,
  DEFAULT_CYCLE_MACRO_NUTRITION_KEYS,
  buildCycleDaySetListItems,
  buildCycleHubListItems,
  buildCycleSlotListItems,
  buildCycleTemplateListItems,
  resolveMacroNutritionKeysFromMeta,
  shouldConfirmCycleImpact,
  toCreateCycleDto,
  toCycleFormInitialValue,
} from './cycle.viewmodel';

describe('cycle viewmodel', () => {
  const nutritionKeys = [
    { key: 'PROTEIN', value: 'protein_custom', label: 'Protein', allowedUnits: ['MG', 'G'] },
    { key: 'CARBOHYDRATE', value: 'carbs_custom', label: 'Carbs', allowedUnits: ['MG'] },
    { key: 'FAT', value: 'fat_custom', label: 'Fat', allowedUnits: [] },
    { key: 'ENERGY', value: 'energy_custom', label: 'Energy', allowedUnits: ['KCAL'] },
  ];
  const daySets = [
    { id: 2, title: 'Work', nutritionValues: [] },
  ] as DaySet[];
  const slots = [
    { id: 4, key: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: null, endTime: null, nutritionValues: [] },
  ] as Slot[];
  const templates = [{ id: 6, title: 'Default' }] as TemplateSummary[];
  const cycle = {
    id: 1,
    title: 'Cut',
    color: 'blue',
    durationDays: 14,
    durationCount: 2,
    durationType: 'semaine',
    energyKcal: 2000,
    proteins: 100,
    carbs: 200,
    lipids: 50,
    nutritionValues: [
      { nutritionKey: 'protein_custom', amount: 100, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: '', amount: Number.NaN, unit: 'G', reference: 'PER_100ML' },
    ],
    slots,
    defaultTemplateId: 6,
    daySetOrder: [0, 2, 0, 2, -1, 0],
  } as unknown as Cycle;

  it('exposes hub configuration and maps related collections', () => {
    expect(CYCLE_HUB_VIEW_OPTIONS.map((option) => option.value)).toEqual(['cycle', 'daySet', 'slot']);
    expect(CYCLE_HUB_VIEW_CONFIG.cycle.addLabel).toBe('Add cycle');
    expect(buildCycleHubListItems([cycle], DEFAULT_CYCLE_MACRO_NUTRITION_KEYS, daySets, slots)).toHaveSize(1);
    expect(buildCycleDaySetListItems(daySets)).toEqual([{ id: '2', title: 'Work', nutritionValues: [] }]);
    expect(buildCycleSlotListItems(slots)).toEqual([{ id: '4', key: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: null, endTime: null, nutritionValues: [] }]);
    expect(buildCycleTemplateListItems(templates)).toEqual(templates);
  });

  it('normalizes cycle forms, nutrition metadata and update impact', () => {
    const initial = toCycleFormInitialValue(cycle, {
      macroNutritionKeys: DEFAULT_CYCLE_MACRO_NUTRITION_KEYS,
      nutritionKeys,
    });
    expect(initial.titre).toBe('Cut');
    expect(initial.durationDays).toBe(14);
    expect(initial.slotIds).toEqual([4]);
    expect(initial.daySetIds).toEqual([2]);
    expect(initial.daySetOrder).toEqual([0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const noValues = { ...cycle, nutritionValues: [], daySetIds: [2, 2, 0], daySetOrder: null } as unknown as Cycle;
    const fallback = toCycleFormInitialValue(noValues, {
      macroNutritionKeys: DEFAULT_CYCLE_MACRO_NUTRITION_KEYS,
      nutritionKeys,
    });
    expect(fallback.nutritionValues).toHaveSize(4);
    expect(fallback.daySetIds).toEqual([]);
    expect(fallback.daySetOrder).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const value = {
      titre: ' New ',
      couleur: 'red',
      nutritionValues: [
        { nutritionKey: ' protein_custom ', amount: '12' as unknown as number, unit: 'MG', reference: 'PER_100ML' },
        { nutritionKey: 'unknown', amount: 2, unit: undefined as unknown as string, reference: 'PER_100G' },
        { nutritionKey: ' ', amount: 1, unit: 'G', reference: 'PER_100G' },
      ],
      durationDays: 0,
      slotIds: [4],
      defaultTemplateId: 6.5,
      daySetIds: [],
      daySetOrder: [0, 2.9, -1, 2],
      nombre: 1,
      typeDuree: 'jour',
    } as unknown as CycleFormValue;
    const dto = toCreateCycleDto(value, {
      macroNutritionKeys: DEFAULT_CYCLE_MACRO_NUTRITION_KEYS,
      nutritionKeys,
    });
    expect(dto.durationDays).toBe(1);
    expect(dto.defaultTemplateId).toBeNull();
    expect(dto.daySetIds).toEqual([2]);
    expect(dto.daySetOrder).toEqual([0, 2, 2]);
    expect(dto.nutritionValues!.map((item) => item.nutritionKey)).toEqual(['protein_custom', 'UNKNOWN']);
    expect(dto.nutritionValues![0].unit).toBe('MG');
    expect(dto.nutritionValues![1].unit).toBe('G');

    expect(resolveMacroNutritionKeysFromMeta(nutritionKeys)).toEqual({
      proteins: 'protein_custom',
      carbs: 'carbs_custom',
      lipids: 'fat_custom',
    });
    expect(resolveMacroNutritionKeysFromMeta([])).toEqual({
      proteins: 'PROTEIN',
      carbs: 'CARBOHYDRATE',
      lipids: 'FAT',
    });
    expect(shouldConfirmCycleImpact(null, { durationDays: 1 })).toBeFalse();
    expect(shouldConfirmCycleImpact(cycle, { durationDays: 14 })).toBeFalse();
    expect(shouldConfirmCycleImpact(cycle, { durationDays: 7 })).toBeTrue();
  });
});
