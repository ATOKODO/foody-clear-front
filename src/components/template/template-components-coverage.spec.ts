import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PreparedDish, PreparedMeal } from '../../interfaces/meal-prep.interface';
import type { Slot } from '../../interfaces/slot.interface';
import type { Template, TemplateItem } from '../../interfaces/template.interface';
import type { Product } from '../../services/product-service';
import { TemplateForm } from './template-form/template-form';
import { TemplateList } from './template-list/template-list';

describe('template component branches', () => {
  const products: Product[] = [
    { id: 1, name: 'Pasta', unitType: 'Paquet', quantityPerUnit: 500, quantityUnit: 'g', portionUnit: 'portion' },
    { id: 2, name: 'Apple', unitType: 'Unite', quantityPerUnit: 1, quantityUnit: 'unit', portionUnit: null },
  ];
  const dishes: PreparedDish[] = [{ id: 3, name: 'Sauce', items: [] }];
  const meals: PreparedMeal[] = [{ id: 4, name: 'Dinner', items: [] }];
  const slots: Slot[] = [{ id: 7, key: 'breakfast', title: 'Breakfast', sortOrder: 1, startTime: '08:00', endTime: '09:00' }];
  const templates = [
    { id: 1, title: 'Zulu', items: [], totalsMacros: null },
    { id: 2, title: 'Alpha', items: [], totalsMacros: null },
  ] as Template[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateList, TemplateForm],
    }).compileComponents();
  });

  it('covers template list sorting, events, labels and formatting', () => {
    const fixture: ComponentFixture<TemplateList> = TestBed.createComponent(TemplateList);
    const component = fixture.componentInstance;
    const selected: number[] = [];
    const edited: number[] = [];
    const deleted: number[] = [];
    const compared: (number | null)[] = [];
    component.templateSelected.subscribe((id) => selected.push(id));
    component.editRequested.subscribe((id) => edited.push(id));
    component.deleteRequested.subscribe((id) => deleted.push(id));
    component.compareDaySetChanged.subscribe((id) => compared.push(id));
    fixture.componentRef.setInput('templates', templates);
    fixture.componentRef.setInput('daySets', [{ id: 1, title: 'Zulu set' }, { id: 2, title: 'Alpha set' }]);
    fixture.componentRef.setInput('slots', slots);
    fixture.detectChanges();

    expect(component.sortedTemplates.map((item) => item.title)).toEqual(['Alpha', 'Zulu']);
    expect(component.sortedDaySets.map((item) => item.title)).toEqual(['Alpha set', 'Zulu set']);
    expect(component.busy).toBeFalse();
    fixture.componentRef.setInput('loadingTemplates', true);
    expect(component.busy).toBeTrue();
    fixture.componentRef.setInput('loadingTemplates', false);
    fixture.componentRef.setInput('loadingProducts', true);
    expect(component.busy).toBeTrue();
    fixture.componentRef.setInput('loadingProducts', false);
    fixture.componentRef.setInput('loadingDaySets', true);
    expect(component.busy).toBeTrue();
    fixture.componentRef.setInput('loadingDaySets', false);
    fixture.componentRef.setInput('loadingSlots', true);
    expect(component.busy).toBeTrue();
    fixture.componentRef.setInput('loadingSlots', false);
    fixture.componentRef.setInput('savingTemplate', true);
    expect(component.busy).toBeTrue();
    fixture.componentRef.setInput('savingTemplate', false);
    fixture.componentRef.setInput('savingItem', true);
    expect(component.busy).toBeTrue();

    component.onEditClick(1);
    component.onDeleteClick(2);
    component.onTemplateClick(2);
    component.onTemplateKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), 1);
    component.onTemplateKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 1);
    component.onTemplateKeydown(new KeyboardEvent('keydown', { key: ' ' }), 2);
    component.onCompareDaySetChange(null);
    expect(edited).toEqual([1]);
    expect(deleted).toEqual([2]);
    expect(selected).toEqual([2, 1, 2]);
    expect(compared).toEqual([null]);

    expect(component.getTargetSourceText('daySet')).toContain('day set');
    expect(component.getTargetSourceText('cycle')).toContain('cycle');
    expect(component.getTargetSourceText('none')).toBe('No target');
    expect(
      component.getSlotMacroEntries({
        slot: {},
        targets: {},
        deltaToTargets: {},
        incompleteNutritionKeys: [],
        energyKcal: 2,
      } as unknown as Parameters<TemplateList['getSlotMacroEntries']>[0]),
    ).toEqual([{ key: 'energyKcal', value: 2 }]);
    expect(
      component.formatMacroValue(
        'missing' as unknown as Parameters<TemplateList['formatMacroValue']>[0],
      ),
    ).toBe('missing');
    expect(component.formatMacroValue(2.345)).toBe('2.35');
    expect(component.formatNutritionAmount(null)).toBe('-');
    expect(component.formatNutritionAmount(Number.NaN)).toBe('-');
    expect(component.formatNutritionAmount(2.345)).toBe('2.35');
    expect(component.getStockAvailabilityLabel({ stockAvailability: { enoughStock: true } } as TemplateItem)).toBe('Stock OK');
    expect(component.getStockAvailabilityLabel({ stockAvailability: { enoughStock: false } } as TemplateItem)).toBe('Low stock');
    expect(component.getStockAvailabilityLabel({ stockAvailability: null } as unknown as TemplateItem)).toBe('Unknown stock');
    expect(component.hasEntries({ a: 1 })).toBeTrue();
    expect(component.hasEntries({})).toBeFalse();
    expect(component.hasEntries(null)).toBeFalse();
    expect(component.resolveTemplateItemLabel({ displayName: 'Display' } as TemplateItem)).toBe('Display');
    expect(component.resolveTemplateItemLabel({ mealName: 'Meal' } as TemplateItem)).toBe('Meal');
    expect(component.resolveTemplateItemLabel({ dishName: 'Dish' } as TemplateItem)).toBe('Dish');
    expect(component.resolveTemplateItemLabel({ productName: 'Product' } as TemplateItem)).toBe('Product');
    expect(component.resolveTemplateItemLabel({} as TemplateItem)).toBe('Unnamed item');
    expect(component.resolveTemplateItemTypeLabel({ itemType: 'meal' } as TemplateItem)).toBe('Meal');
    expect(component.resolveTemplateItemTypeLabel({ itemType: 'dish' } as TemplateItem)).toBe('Dish');
    expect(component.resolveTemplateItemTypeLabel({ itemType: 'product' } as TemplateItem)).toBe('Product');
    expect(component.resolveTemplateItemTypeLabel({ mealId: 1 } as TemplateItem)).toBe('Meal');
    expect(component.resolveTemplateItemTypeLabel({ dishId: 1 } as TemplateItem)).toBe('Dish');
    expect(component.resolveTemplateItemTypeLabel({} as TemplateItem)).toBe('Product');
    expect(component.resolveTemplateItemSlotLabel({ slotId: 7 } as TemplateItem)).toBe('1. Breakfast');
    expect(component.resolveTemplateItemSlotLabel({ slotId: 99, slotKey: 'lunch' } as TemplateItem)).toBe('lunch');
    expect(component.resolveTemplateItemSlotLabel({ slotId: null, slotKey: '  ' } as TemplateItem)).toBe('No slot');
  });

  it('covers template form sources, drafts, validation and helper branches', () => {
    const fixture: ComponentFixture<TemplateForm> = TestBed.createComponent(TemplateForm);
    const component = fixture.componentInstance;
    const template = {
      id: 8,
      title: 'Breakfast template',
      items: [],
      totalsMacros: null,
    } as Template;
    const submitted: unknown[] = [];
    const deleted: number[] = [];
    const itemSubmitted: unknown[] = [];
    const itemDeleted: number[] = [];
    component.templateSubmitted.subscribe((event) => submitted.push(event));
    component.templateDeleted.subscribe((id) => deleted.push(id));
    component.itemSubmitted.subscribe((event) => itemSubmitted.push(event));
    component.itemDeleted.subscribe((id) => itemDeleted.push(id));
    fixture.componentRef.setInput('products', products);
    fixture.componentRef.setInput('dishes', dishes);
    fixture.componentRef.setInput('meals', meals);
    fixture.componentRef.setInput('slots', slots);
    fixture.componentRef.setInput('qtyUnitOptions', ['kg', 'g']);
    fixture.detectChanges();

    expect(component.canSaveTemplate).toBeFalse();
    component.draftTitle = ' Template ';
    expect(component.canSaveTemplate).toBeTrue();
    fixture.componentRef.setInput('savingTemplate', true);
    expect(component.canSaveTemplate).toBeFalse();
    fixture.componentRef.setInput('savingTemplate', false);
    expect(component.sortedProducts.map((item) => item.name)).toEqual(['Apple', 'Pasta']);
    expect(component.sortedDishes).toEqual(dishes);
    expect(component.sortedMeals).toEqual(meals);
    expect(component.sortedSlots).toEqual(slots);
    expect(component.getAvailableQtyUnitOptions()).toEqual([
      { value: 'unit', label: 'Product unit' },
    ]);
    component.updateItemDraft({ productId: 1 });
    expect(component.getAvailableQtyUnitOptions()).toHaveSize(5);
    component.updateItemDraft({ itemType: 'dish' });
    expect(component.getAvailableQtyUnitOptions()).toEqual([
      { value: 'kg', label: 'kg' },
      { value: 'g', label: 'g' },
    ]);
    component.draftTitle = '';
    component.onTemplateSave();
    component.draftTitle = '  Saved  ';
    component.onTemplateSave();
    expect(submitted).toEqual([{ mode: 'add', title: 'Saved' }]);
    component.onTemplateDelete();
    fixture.componentRef.setInput('template', template);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    component.onTemplateDelete();
    expect(deleted).toEqual([8]);

    component.itemDraft = { id: null, itemType: 'product', productId: 1, dishId: null, mealId: null, qty: 2, qtyUnit: 'g', slotId: 7, slotKey: '', preferredTime: '08:00' };
    expect(component.canSaveItem).toBeTrue();
    component.onItemSave();
    expect(itemSubmitted).toHaveSize(1);
    component.onItemDelete(12);
    expect(itemDeleted).toEqual([12]);
    fixture.componentRef.setInput('savingItem', true);
    expect(component.canSaveItem).toBeFalse();
    fixture.componentRef.setInput('savingItem', false);

    component.editItem({ id: 1, itemType: 'product', productId: 1, qty: 3, qtyUnit: 'portion', slotId: 7, slotKey: null, preferredTime: null } as unknown as TemplateItem);
    expect(component.itemDraft.preferredTime).toBe('06:00');
    component.editItem({ id: 2, dishId: 3, qty: 1, qtyUnit: null, slotId: null, slotKey: 'lunch' } as TemplateItem);
    expect(component.itemDraft.itemType).toBe('dish');
    component.editItem({ id: 3, mealId: 4, qty: 1, qtyUnit: null, slotId: null, slotKey: 'dinner' } as TemplateItem);
    expect(component.itemDraft.itemType).toBe('meal');
    component.updateItemDraft({ itemType: 'meal' });
    component.updateItemDraft({ mealId: 4, qty: 1 });
    expect(component.canSaveItem).toBeTrue();
    component.updateItemDraft({ itemType: 'product' });
    component.updateItemDraft({ productId: 2, qty: 1 });
    expect(component.canSaveItem).toBeTrue();
    component.resetItemDraft();
    expect(component.itemDraft.id).toBeNull();
    expect(component.resolveTemplateItemSlotLabel({ slotId: 7 } as TemplateItem)).toBe('1. Breakfast');
    expect(component.resolveTemplateItemSlotLabel({ slotId: null, slotKey: ' lunch ' } as TemplateItem)).toBe('lunch');
    expect(component.resolveTemplateItemSlotLabel({ slotId: null, slotKey: '' } as TemplateItem)).toBe('No slot');
    expect(component.resolveTemplateItemLabel({ displayName: 'D' } as TemplateItem)).toBe('D');
    expect(component.resolveTemplateItemLabel({ mealName: 'M' } as TemplateItem)).toBe('M');
    expect(component.resolveTemplateItemLabel({ dishName: 'Dish' } as TemplateItem)).toBe('Dish');
    expect(component.resolveTemplateItemLabel({ productName: 'P' } as TemplateItem)).toBe('P');
    expect(component.resolveTemplateItemLabel({} as TemplateItem)).toBe('Unnamed item');
    expect(component.resolveTemplateItemTypeLabel({ itemType: 'meal' } as TemplateItem)).toBe('Repas');
    expect(component.resolveTemplateItemTypeLabel({ itemType: 'dish' } as TemplateItem)).toBe('Plat');
    expect(component.resolveTemplateItemTypeLabel({ itemType: 'product' } as TemplateItem)).toBe('Produit');
    expect(component.formatPreferredTime(null)).toBe('06:00');
    expect(component.formatPreferredTime(' 08:30:00 ')).toBe('08:30');
    expect(component.formatNutritionAmount(2.345)).toBe('2.35');

    const internals = component as unknown as {
      hasSelectedSource(): boolean;
      resolveItemType(item: Partial<TemplateItem>): 'product' | 'dish' | 'meal';
    };
    expect(internals.hasSelectedSource()).toBeFalse();
    component.itemDraft = { ...component.itemDraft, itemType: 'dish', dishId: 3 };
    expect(internals.hasSelectedSource()).toBeTrue();
    component.itemDraft = { ...component.itemDraft, itemType: 'meal', mealId: 4 };
    expect(internals.hasSelectedSource()).toBeTrue();
    expect(internals.resolveItemType({ mealId: 4 })).toBe('meal');
    expect(internals.resolveItemType({ dishId: 3 })).toBe('dish');
    expect(internals.resolveItemType({})).toBe('product');
  });
});
