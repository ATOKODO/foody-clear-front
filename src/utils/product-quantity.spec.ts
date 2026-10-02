import {
  buildProductQtyUnitOptions,
  getNormalizedQuantityUnit,
  toNormalizedProductQuantity,
} from './product-quantity';

describe('product quantities', () => {
  it('offers volume units for liquids and preserves stored units without metadata', () => {
    expect(buildProductQtyUnitOptions({ quantityUnit: 'l' }).map((option) => option.value)).toEqual(['unit', 'ml', 'l']);
    expect(buildProductQtyUnitOptions(null, 'ml').map((option) => option.value)).toEqual(['unit', 'ml']);
    expect(getNormalizedQuantityUnit('kg')).toBe('g');
    expect(getNormalizedQuantityUnit('mg')).toBe('g');
    expect(getNormalizedQuantityUnit('l')).toBe('ml');
    expect(getNormalizedQuantityUnit('unit')).toBe('unit');
  });

  it('matches metric, package and portion conversions used by the API', () => {
    const product = { quantityUnit: 'kg', quantityPerUnit: 1, portionUnit: 'portion', portionCount: 4 };
    expect(toNormalizedProductQuantity(1, 'kg', product)).toBe(1000);
    expect(toNormalizedProductQuantity(1000, 'mg', product)).toBe(1);
    expect(toNormalizedProductQuantity(1.5, 'l', null)).toBe(1500);
    expect(toNormalizedProductQuantity(2, 'unit', product)).toBe(2000);
    expect(toNormalizedProductQuantity(2, 'portion', product)).toBe(500);
    expect(toNormalizedProductQuantity(1, 'piece', product)).toBeNull();
    expect(toNormalizedProductQuantity(Infinity, 'g', product)).toBeNull();
  });
});
