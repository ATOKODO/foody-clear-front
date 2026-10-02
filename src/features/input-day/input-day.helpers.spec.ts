import { DateTime } from 'luxon';

import {
  areNumberArraysEqual,
  buildInputDayAvailableSlots,
  buildInputDayOccurredAtIso,
  buildInputDaySelectableProductListItems,
  canConvertInputDayTemplateItem,
  extractInputDayInventoriesFromResponse,
  extractInputDayInventoryProductsFromResponse,
  extractInputDayProductsFromResponse,
  formatInputDayDateLocal,
  formatInputDayDateTime,
  formatInputDayDecimal,
  formatInputDayMacroValue,
  formatInputDayNutritionAmount,
  formatInputDaySelectedDateLabel,
  formatInputDayTime,
  getInputDaySelectedInventoriesTemplateStock,
  getInputDaySlotMacroEntries,
  getInputDayTargetSourceText,
  getInputDayTemplateTargetSourceText,
  hasInputDayEntries,
  isInputDayDateLocal,
  mapInputDayProductToListItem,
  mapInputDayProductsToListItems,
  normalizeInputDayInventoryIds,
  normalizeInputDayQtyUnit,
  normalizeIsoString,
  normalizeNullablePositiveInteger,
  normalizePositiveInteger,
  parseInputDayDateInput,
  resolveInputDayApiErrorMessage,
  resolveInputDayFallbackTimezone,
  resolveInputDayItemSlot,
  resolveInputDayItemSlotKey,
  resolveInputDayItemSlotTitle,
  resolveInputDayTemplateItemSlotKey,
  resolveInputDayTemplateItemSlotTitle,
  roundInputDayQuantity,
  toInputDayDateTimeLocalInput,
} from './input-day.helpers';
import type {
  InputDayResponse,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';

describe('input-day helpers', () => {
  it('shows normalized inventory availability in grams and millilitres', () => {
    for (const [quantityUnit, availableQuantityUnit] of [['kg', 'g'], ['l', 'ml']] as const) {
      const items = buildInputDaySelectableProductListItems({
        productListItems: [{ id: '1', name: 'Product', quantityUnit }],
        selectedInventoryProducts: [{ id: 1, inventoryId: 4, productId: 1, qtyOnHandInUnits: 1, qtyOnHandNormalized: 1000 }],
      });
      expect(items[0].availableQuantity).toBe(1000);
      expect(items[0].availableQuantityUnit).toBe(availableQuantityUnit);
    }
  });
  const slot = {
    slotId: 2,
    title: 'Breakfast',
    slotKey: 'breakfast',
    sortOrder: 1,
    startTime: '08:00:00',
    endTime: '09:00:00',
  };
  const product = {
    id: 1,
    name: ' Milk ',
    barcode: '123',
    unitType: 'Bouteille',
    quantityPerUnit: 1,
    quantityUnit: 'l',
    portionCount: 2,
    portionUnit: 'portion',
    portionQuantityNormalized: 0.5,
    price: 2,
    tags: [' Fresh ', { label: 'Organic' }, { key: 'Fresh' }, null],
    category: { name: ' Dairy ' },
    genericProduct: { title: 'Milk' },
    nutritionValues: [{ id: 1 }],
  };
  const inventoryProduct = {
    id: 10,
    inventoryId: 4,
    productId: 1,
    qtyOnHandInUnits: 1,
    qtyOnHandNormalized: 3.456,
    product,
  };
  const templateItem: InputDayTemplateItemSummary = {
    id: 20,
    productId: 1,
    productName: 'Milk',
    qty: 2,
    qtyUnit: 'unit',
    qtyNormalized: 2,
    slotId: 2,
    slotKey: 'breakfast',
    status: 'pending',
    convertedItemId: null,
    stockAvailability: {
      enoughStock: true,
      totalAvailableNormalized: 3,
      requestedQtyNormalized: 2,
    },
    stockByInventory: [
      {
        inventoryId: 4,
        inventoryName: 'Main stock',
        qtyAvailableNormalized: 3,
        enoughStock: true,
      },
    ],
    nutritionValue: {},
  };

  it('should format dates, numbers, times and quantities', () => {
    expect(resolveInputDayFallbackTimezone()).toBeTruthy();
    expect(formatInputDayMacroValue(2.345)).toBe('2.35');
    expect(formatInputDayMacroValue('donnee incomplete')).toBe('donnee incomplete');
    expect(formatInputDayNutritionAmount(3)).toBe('3');
    expect(formatInputDayDecimal(Number.NaN)).toBe('0');
    expect(formatInputDayTime(null)).toBe('-');
    expect(formatInputDayTime('08:15:00')).toBe('08:15');
    expect(formatInputDayTime('08')).toBe('08');
    expect(formatInputDayDateTime(null, 'UTC')).toBe('-');
    expect(formatInputDayDateTime('invalid', 'UTC')).toBe('invalid');
    expect(formatInputDayDateTime('2026-02-16T08:00:00Z', 'UTC')).toContain('2026-02-16');
    expect(formatInputDaySelectedDateLabel('invalid')).toBe('invalid');
    expect(formatInputDaySelectedDateLabel('2026-02-16')).toContain('February');
    expect(formatInputDayDateLocal(new Date(2026, 1, 3))).toBe('2026-02-03');
    expect(toInputDayDateTimeLocalInput(null, 'UTC')).toBe('');
    expect(toInputDayDateTimeLocalInput('invalid', 'UTC')).toBe('');
    expect(toInputDayDateTimeLocalInput('2026-02-16T08:00:00Z', 'UTC')).toBe('2026-02-16T08:00');
    expect(buildInputDayOccurredAtIso(' ', 'UTC')).toBeNull();
    expect(buildInputDayOccurredAtIso('invalid', 'UTC')).toBeNull();
    expect(buildInputDayOccurredAtIso('2026-02-16T08:00', 'UTC')).toContain('2026-02-16');
    expect(roundInputDayQuantity(3.456)).toBe(3.46);
  });

  it('should parse dates and normalize primitive selections', () => {
    expect(parseInputDayDateInput(new Date(2026, 1, 16))).toEqual(jasmine.any(Date));
    expect(parseInputDayDateInput(new Date('invalid'))).toBeNull();
    expect(parseInputDayDateInput('2026-02-16')).toEqual(jasmine.any(Date));
    expect(parseInputDayDateInput('2026-02-30')).toBeNull();
    expect(parseInputDayDateInput(42)).toBeNull();
    expect(isInputDayDateLocal('2026-02-16')).toBeTrue();
    expect(isInputDayDateLocal('invalid')).toBeFalse();
    expect(normalizeInputDayInventoryIds([4, 2, 4, 0, -1])).toEqual([2, 4]);
    expect(normalizeInputDayInventoryIds(5)).toEqual([5]);
    expect(normalizeInputDayInventoryIds(null)).toEqual([]);
    expect(areNumberArraysEqual([1, 2], [1, 2])).toBeTrue();
    expect(areNumberArraysEqual([1], [2])).toBeFalse();
    expect(normalizePositiveInteger(2)).toBe(2);
    expect(normalizePositiveInteger(0)).toBeNull();
    expect(normalizeNullablePositiveInteger('2')).toBeNull();
    expect(normalizeIsoString('  UTC ')).toBe('UTC');
    expect(normalizeIsoString(' ')).toBeNull();
    const units = new Set(['g', 'unit'] as const);
    expect(normalizeInputDayQtyUnit(null, units)).toBeNull();
    expect(normalizeInputDayQtyUnit(' G ', units)).toBe('g');
    expect(() => normalizeInputDayQtyUnit(2, units)).toThrowError(TypeError);
    expect(() => normalizeInputDayQtyUnit('kg', units)).toThrow();
  });

  it('should resolve slots, targets, conversion and stock states', () => {
    expect(resolveInputDayItemSlot({ slotId: 2, slotKey: null }, [slot])).toEqual(slot);
    expect(resolveInputDayItemSlot({ slotId: null, slotKey: 'breakfast' }, [slot])).toEqual(slot);
    expect(resolveInputDayItemSlot({ slotId: null, slotKey: null }, [slot])).toBeNull();
    expect(resolveInputDayItemSlotTitle({ slotId: null, slotKey: 'snack' } as never, [])).toBe('snack');
    expect(resolveInputDayItemSlotKey({ slotId: null, slotKey: null } as never, [])).toBe('-');
    expect(resolveInputDayTemplateItemSlotTitle({ ...templateItem, slotId: null }, [])).toBe('breakfast');
    expect(resolveInputDayTemplateItemSlotKey({ ...templateItem, slotId: null, slotKey: null }, [])).toBe('-');
    expect(getInputDaySelectedInventoriesTemplateStock(templateItem, [])).toBeNull();
    expect(getInputDaySelectedInventoriesTemplateStock(templateItem, [4])).toEqual({
      enoughStock: true,
      qtyAvailableNormalized: 3,
    });
    expect(canConvertInputDayTemplateItem(templateItem, [4], false, false)).toBeTrue();
    expect(canConvertInputDayTemplateItem({ ...templateItem, status: 'converted' }, [4], false, false)).toBeFalse();
    expect(canConvertInputDayTemplateItem(templateItem, [], false, false)).toBeFalse();
    expect(getInputDayTemplateTargetSourceText(undefined)).toBe('No active daily target.');
    expect(getInputDayTargetSourceText('cycle')).toContain('cycle');
    expect(getInputDayTargetSourceText('daySet')).toContain('day set');
    expect(hasInputDayEntries({ proteins: 1 })).toBeTrue();
    expect(hasInputDayEntries({})).toBeFalse();
    expect(hasInputDayEntries(null)).toBeFalse();
    expect(getInputDaySlotMacroEntries({
      proteins: 12,
      carbs: 'donnee incomplete',
      bySlot: [],
      targets: null,
    } as never)).toEqual([
      { key: 'proteins', value: 12 },
      { key: 'carbs', value: 'donnee incomplete' },
    ]);
  });

  it('should extract API payloads and map selectable product rows', () => {
    const invalid = { id: 'bad' };
    expect(extractInputDayProductsFromResponse([product, invalid])).toEqual([product as never]);
    expect(extractInputDayProductsFromResponse(product)).toEqual([product as never]);
    expect(extractInputDayProductsFromResponse({ data: [product] })).toEqual([product as never]);
    expect(extractInputDayProductsFromResponse({ payload: [invalid] })).toEqual([]);
    expect(extractInputDayProductsFromResponse(null)).toEqual([]);
    const inventory = { id: 4, name: 'Main stock' };
    expect(extractInputDayInventoriesFromResponse({ inventories: [inventory] })).toEqual([inventory]);
    expect(extractInputDayInventoriesFromResponse({ items: [{ id: 'bad' }] })).toEqual([]);
    expect(extractInputDayInventoryProductsFromResponse([inventoryProduct])).toEqual([inventoryProduct as never]);
    expect(extractInputDayInventoryProductsFromResponse({ products: [inventoryProduct] })).toEqual([inventoryProduct as never]);

    const item = mapInputDayProductToListItem(product as never);
    expect(item).toEqual(jasmine.objectContaining({
      id: '1',
      name: ' Milk ',
      tagNames: ['Fresh', 'Organic'],
      category: 'Dairy',
      genericProduct: 'Milk',
      nutritionValuesCount: 1,
    }));
    expect(mapInputDayProductsToListItems([product as never])).toHaveSize(1);
    expect(buildInputDaySelectableProductListItems({
      productListItems: [item],
      selectedInventoryProducts: [inventoryProduct as never, { ...inventoryProduct, id: 11 } as never],
    })).toEqual([
      jasmine.objectContaining({ id: '1', availableQuantity: 3.456 }),
    ]);
    expect(buildInputDaySelectableProductListItems({
      productListItems: [],
      selectedInventoryProducts: [{
        ...inventoryProduct,
        productId: 2,
        product: { id: 2, name: 'Fallback', quantityUnit: 'g' },
      } as never],
    })[0].name).toBe('Fallback');
    expect(buildInputDaySelectableProductListItems({
      productListItems: [],
      selectedInventoryProducts: [{ ...inventoryProduct, productId: 3, product: null } as never],
    })).toEqual([]);
  });

  it('should build available slots and expose API error details', () => {
    const response: InputDayResponse = {
      dateLocal: '2026-02-16',
      timezone: 'UTC',
      assignment: null,
      daySet: {
        id: 1,
        title: 'Day set',
        nutritionValue: null,
        slots: [
          { ...slot, nutritionValue: null },
          { ...slot, slotId: null, slotKey: 'open', title: 'Open', nutritionValue: null },
        ],
      },
      items: [],
      slots: [],
      itemsBySlot: [],
      totalsMacros: null,
    };
    expect(buildInputDayAvailableSlots(response)).toEqual([slot]);
    expect(buildInputDayAvailableSlots(null)).toEqual([]);
    expect(resolveInputDayApiErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(resolveInputDayApiErrorMessage({ error: { message: 'detail' } }, 'Fallback')).toBe('Fallback detail');
    expect(resolveInputDayApiErrorMessage({ error: { message: ['one', 'two'] } }, 'Fallback')).toBe('Fallback one two');
    expect(resolveInputDayApiErrorMessage({ error: {} }, 'Fallback')).toBe('Fallback');
    expect(resolveInputDayApiErrorMessage({ error: 'text' }, 'Fallback')).toBe('Fallback');
    expect(DateTime.fromISO('2026-02-16').isValid).toBeTrue();
  });
});
