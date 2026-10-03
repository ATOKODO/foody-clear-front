import { mapProductToProductListItem } from './product-list-item.mapper';

describe('mapProductToProductListItem', () => {
  it('should map linked entities, tags and nutrition values', () => {
    const result = mapProductToProductListItem({
      id: 3,
      name: 'Milk',
      barcode: null,
      unitType: 'Bouteille',
      quantityPerUnit: 1,
      quantityUnit: 'l',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: 2,
      priceUnit: 'l',
      tags: [' Fresh ', { title: 'Organic' }, { key: 'Fresh' }, null],
      category: { name: ' Dairy ' },
      genericProduct: { label: 'Milk base' },
      nutritionValues: [{ id: 1 }, { id: 2 }],
    });

    expect(result).toEqual({
      id: '3',
      name: 'Milk',
      barcode: null,
      unitType: 'Bouteille',
      quantityPerUnit: 1,
      quantityUnit: 'l',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: 2,
      priceUnit: 'l',
      tagNames: ['Fresh', 'Organic'],
      nutritionValuesCount: 2,
      category: 'Dairy',
      genericProduct: 'Milk base',
    });
  });

  it('should use empty and None fallbacks', () => {
    const result = mapProductToProductListItem({
      id: 4,
      name: 'Unknown',
      unitType: 'Autre',
      quantityPerUnit: 1,
      quantityUnit: 'unit',
      tags: 'not-an-array' as never,
      category: null,
      genericProduct: {},
      nutritionValues: 'not-an-array' as never,
    });
    expect(result.tagNames).toEqual([]);
    expect(result.nutritionValuesCount).toBe(0);
    expect(result.category).toBeNull();
    expect(result.genericProduct).toBeNull();
  });
});
