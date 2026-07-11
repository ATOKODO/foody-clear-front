import type { ProductQuantityInputUnit } from '../../interfaces/input-day.interface';
import type { PreparedDish, PreparedMeal } from '../../interfaces/meal-prep.interface';
import type { DaySet } from '../../interfaces/day-set.interface';
import type { Slot } from '../../interfaces/slot.interface';
import type {
  CreateTemplateItemDto,
  Template,
} from '../../interfaces/template.interface';
import type { Product as ProductApiModel } from '../../services/product-service';
import type { TemplateItemDraft } from '../../components/template/template-form/template-form';

export const TEMPLATE_QTY_UNIT_OPTIONS: readonly ProductQuantityInputUnit[] = [
  'mg',
  'g',
  'kg',
  'ml',
  'l',
  'unit',
  'pack',
  'tranche',
  'piece',
  'part',
  'bouteille',
  'portion',
];

export interface TemplateSelectionState {
  selectedTemplateId: number | null;
  selectedTemplate: Template | null;
  compareDaySetId: number | null;
}

export function sortTemplateProducts(
  products: ProductApiModel[],
): ProductApiModel[] {
  return sortByName(products, 'name');
}

export function sortTemplateDishes(dishes: PreparedDish[]): PreparedDish[] {
  return sortByName(dishes, 'name');
}

export function sortTemplateMeals(meals: PreparedMeal[]): PreparedMeal[] {
  return sortByName(meals, 'name');
}

export function sortTemplateDaySets(daySets: DaySet[]): DaySet[] {
  return sortByName(daySets, 'title');
}

export function sortTemplateSlots(slots: Slot[]): Slot[] {
  return [...slots].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
  );
}

export function toCreateTemplateItemDto(
  itemDraft: TemplateItemDraft,
): CreateTemplateItemDto {
  return {
    itemType: itemDraft.itemType,
    ...(itemDraft.itemType === 'product'
      ? { productId: itemDraft.productId }
      : {}),
    ...(itemDraft.itemType === 'dish'
      ? { dishId: itemDraft.dishId }
      : {}),
    ...(itemDraft.itemType === 'meal'
      ? { mealId: itemDraft.mealId }
      : {}),
    qty: itemDraft.qty as number,
    ...(itemDraft.qtyUnit ? { qtyUnit: itemDraft.qtyUnit } : {}),
    slotId: itemDraft.slotId,
    ...(itemDraft.slotKey.trim() === ''
      ? {}
      : { slotKey: itemDraft.slotKey.trim() }),
    ...(itemDraft.slotId === null
      ? { preferredTime: itemDraft.preferredTime || '06:00' }
      : {}),
  };
}

export function syncTemplateInCollection(
  templates: Template[],
  template: Template,
): Template[] {
  const nextTemplates = [...templates];
  const index = nextTemplates.findIndex(
    (candidate) => candidate.id === template.id,
  );

  if (index === -1) {
    nextTemplates.push(template);
  } else {
    nextTemplates[index] = template;
  }

  return sortByName(nextTemplates, 'title');
}

export function resolveTemplateSelectionAfterListLoad(params: {
  templates: Template[];
  selectId: number | null;
  autoSelectFirst: boolean;
}): TemplateSelectionState {
  if (
    typeof params.selectId === 'number' &&
    params.templates.some((item) => item.id === params.selectId)
  ) {
    return {
      selectedTemplateId: params.selectId,
      selectedTemplate: null,
      compareDaySetId: null,
    };
  }

  if (params.autoSelectFirst && params.templates.length > 0) {
    return {
      selectedTemplateId: params.templates[0].id,
      selectedTemplate: null,
      compareDaySetId: null,
    };
  }

  return {
    selectedTemplateId: null,
    selectedTemplate: null,
    compareDaySetId: null,
  };
}

function sortByName<T extends Record<K, string>, K extends keyof T>(
  items: T[],
  key: K,
): T[] {
  return [...items].sort((left, right) =>
    left[key].localeCompare(right[key], 'fr', { sensitivity: 'base' }),
  );
}
