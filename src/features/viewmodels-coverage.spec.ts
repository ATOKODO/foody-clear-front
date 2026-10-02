import type { Product } from '../services/product-service';
import type { PreparedDish, PreparedMeal } from '../interfaces/meal-prep.interface';
import type { DaySet } from '../interfaces/day-set.interface';
import type { Slot } from '../interfaces/slot.interface';
import type { ShoppingList, ShoppingListTemplate } from '../interfaces/shopping-list.interface';
import type { Template } from '../interfaces/template.interface';
import type { TemplateItemDraft } from '../components/template/template-form/template-form';
import {
  SHOPPING_LIST_VIEW_OPTIONS,
  buildDefaultListName,
  buildQtyUnitOptions,
  countCheckedItems,
  normalizeQtyUnit,
  normalizeQtyUnitSelection,
  removeById,
  resolveDraftProductName,
  resolveLinkedProduct,
  resolveProductName,
  toProductListItems,
  upsertShoppingList,
  upsertShoppingListTemplate,
} from './shopping-list/shopping-list.viewmodel';
import {
  TEMPLATE_QTY_UNIT_OPTIONS,
  resolveTemplateSelectionAfterListLoad,
  sortTemplateDaySets,
  sortTemplateDishes,
  sortTemplateMeals,
  sortTemplateProducts,
  sortTemplateSlots,
  syncTemplateInCollection,
  toCreateTemplateItemDto,
} from './template/template.viewmodel';

describe('shopping and template viewmodels', () => {
  const product: Product = {
    id: 1,
    name: 'Pasta',
    unitType: 'Paquet',
    quantityPerUnit: 500,
    quantityUnit: 'g',
    portionUnit: 'portion',
  };

  it('covers shopping-list viewmodel normalization and collection helpers', () => {
    expect(SHOPPING_LIST_VIEW_OPTIONS.map((option) => option.value)).toEqual(['list', 'template']);
    expect(countCheckedItems(null)).toBe(0);
    expect(countCheckedItems({ items: [{ checked: true }, { checked: false }] } as ShoppingList)).toBe(1);
    expect(buildDefaultListName(2)).toBe('Shopping list 3');
    expect(toProductListItems([product])[0].name).toBe('Pasta');
    expect(resolveProductName({ product: { id: 1, name: ' Pasta ' }, productId: 1 })).toBe('Pasta');
    expect(resolveProductName({ product: null, productId: 8 })).toBe('Product #8');
    expect(resolveDraftProductName([], null)).toBe('No product selected');
    expect(resolveDraftProductName([product], 1)).toBe('Pasta');
    expect(resolveDraftProductName([], 8)).toBe('Product #8');
    expect(resolveLinkedProduct([product], 1, product)).toBe(product);
    expect(resolveLinkedProduct([product], 1, null)).toBe(product);
    expect(resolveLinkedProduct([], 8, null)).toBeNull();
    expect(buildQtyUnitOptions(null)).toEqual([
      { value: 'unit', label: 'Product unit' },
    ]);
    expect(buildQtyUnitOptions(product)).toEqual([
      { value: 'unit', label: 'Product unit (Paquet)' },
      { value: 'portion', label: 'Portion' },
      { value: 'g', label: 'G (Gram)' },
      { value: 'mg', label: 'MG (Milligram)' },
      { value: 'kg', label: 'KG (Kilogram)' },
    ]);
    expect(normalizeQtyUnit(' G ')).toBe('g');
    expect(normalizeQtyUnit(null)).toBeNull();
    expect(normalizeQtyUnit('invalid')).toBeNull();
    expect(normalizeQtyUnitSelection('g', [{ value: 'g', label: 'G' }])).toBe('g');
    expect(normalizeQtyUnitSelection('kg', [{ value: 'g', label: 'G' }])).toBe('kg');
    expect(normalizeQtyUnitSelection(null, [])).toBe('unit');

    const listA = { id: 1, name: 'A', items: [] } as ShoppingList;
    const listB = { id: 2, name: 'B', items: [] } as ShoppingList;
    expect(upsertShoppingList([listA], listA)).toEqual([listA]);
    expect(upsertShoppingList([listA], listB)).toEqual([listB, listA]);
    const templateA = { id: 1, name: 'A', items: [] } as ShoppingListTemplate;
    const templateB = { id: 2, name: 'B', items: [] } as ShoppingListTemplate;
    expect(upsertShoppingListTemplate([templateA], templateA)).toEqual([templateA]);
    expect(upsertShoppingListTemplate([templateA], templateB)).toEqual([templateB, templateA]);
    expect(removeById([listA, listB], 1)).toEqual([listB]);
  });

  it('covers template sorting, item DTOs and selection state', () => {
    expect(TEMPLATE_QTY_UNIT_OPTIONS).toContain('g');
    const products = [{ ...product, name: 'Zulu' }, { ...product, id: 2, name: 'Alpha' }];
    const dishes = [{ id: 1, name: 'Zulu', items: [] }, { id: 2, name: 'Alpha', items: [] }] as PreparedDish[];
    const meals = [{ id: 1, name: 'Zulu', items: [] }, { id: 2, name: 'Alpha', items: [] }] as PreparedMeal[];
    const daySets = [{ id: 1, title: 'Zulu' }, { id: 2, title: 'Alpha' }] as DaySet[];
    const slots = [
      { id: 1, key: 'z', title: 'Zulu', sortOrder: 1 },
      { id: 2, key: 'a', title: 'Alpha', sortOrder: 1 },
    ] as Slot[];
    expect(sortTemplateProducts(products).map((item) => item.name)).toEqual(['Alpha', 'Zulu']);
    expect(sortTemplateDishes(dishes).map((item) => item.name)).toEqual(['Alpha', 'Zulu']);
    expect(sortTemplateMeals(meals).map((item) => item.name)).toEqual(['Alpha', 'Zulu']);
    expect(sortTemplateDaySets(daySets).map((item) => item.title)).toEqual(['Alpha', 'Zulu']);
    expect(sortTemplateSlots(slots).map((item) => item.title)).toEqual(['Alpha', 'Zulu']);

    const baseDraft: TemplateItemDraft = {
      id: null,
      itemType: 'product',
      productId: 1,
      dishId: null,
      mealId: null,
      qty: 2,
      qtyUnit: 'g',
      slotId: null,
      slotKey: ' breakfast ',
      preferredTime: '',
    };
    expect(toCreateTemplateItemDto(baseDraft)).toEqual({
      itemType: 'product',
      productId: 1,
      qty: 2,
      qtyUnit: 'g',
      slotId: null,
      slotKey: 'breakfast',
      preferredTime: '06:00',
    });
    expect(toCreateTemplateItemDto({ ...baseDraft, itemType: 'dish', productId: null, dishId: 3, qtyUnit: null, slotId: 1 })).toEqual({
      itemType: 'dish',
      dishId: 3,
      qty: 2,
      slotId: 1,
      slotKey: 'breakfast',
    });
    expect(toCreateTemplateItemDto({ ...baseDraft, itemType: 'meal', productId: null, mealId: 4, slotKey: ' ', preferredTime: '07:00' })).toEqual({
      itemType: 'meal',
      mealId: 4,
      qty: 2,
      qtyUnit: 'g',
      slotId: null,
      preferredTime: '07:00',
    });

    const templateA = { id: 2, title: 'Zulu', items: [], totalsMacros: null } as Template;
    const templateB = { id: 1, title: 'Alpha', items: [], totalsMacros: null } as Template;
    expect(syncTemplateInCollection([templateA], templateB)).toEqual([templateB, templateA]);
    expect(syncTemplateInCollection([templateA], { ...templateA, title: 'Updated' })).toEqual([{ ...templateA, title: 'Updated' }]);
    expect(resolveTemplateSelectionAfterListLoad({ templates: [templateA], selectId: 2, autoSelectFirst: false })).toEqual({ selectedTemplateId: 2, selectedTemplate: null, compareDaySetId: null });
    expect(resolveTemplateSelectionAfterListLoad({ templates: [templateA], selectId: 9, autoSelectFirst: true })).toEqual({ selectedTemplateId: 2, selectedTemplate: null, compareDaySetId: null });
    expect(resolveTemplateSelectionAfterListLoad({ templates: [], selectId: null, autoSelectFirst: true })).toEqual({ selectedTemplateId: null, selectedTemplate: null, compareDaySetId: null });
  });
});
