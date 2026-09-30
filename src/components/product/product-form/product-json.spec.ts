import { parseProductJson, ProductJsonOptions } from './product-json';

describe('Product JSON import', () => {
  const options: ProductJsonOptions = {
    categories: [{ id: 7, name: 'Céréales' }],
    genericProducts: [{ id: 8, name: 'Avoine' }],
    tags: [{ id: 9, name: 'Bio' }],
    nutritionKeys: [{ key: 'PROTEIN', value: 'PROTEIN', label: 'Protéines', allowedUnits: ['G'] }],
    unitTypes: ['Paquet', 'Bouteille'], portionUnits: ['portion'], priceUnits: ['kg', 'paquet'],
  };
  const minimal = { name: 'Avoine', unitType: 'Paquet', quantityPerUnit: 500, quantityUnit: 'g' };

  it('creates a minimal product without requiring technical fields or inventing nutrition values', () => {
    const result = parseProductJson(JSON.stringify(minimal), options);
    expect(result.error).toBeNull();
    expect(result.value).toEqual(jasmine.objectContaining({
      ...minimal, categoryId: null, genericProductId: null, tagIds: [], nutritionValues: [],
    }));
  });

  it('resolves names and preserves optional product data for the existing API', () => {
    const result = parseProductJson(JSON.stringify({
      ...minimal, quantityPerUnit: 0.5, quantityUnit: 'kg',
      category: ' céréales ', genericProduct: 'AVOINE', tags: ['Bio', 'bio'],
      barcode: '001234', price: 0, priceUnit: 'paquet', portionCount: 10,
      portionUnit: 'portion', portionQuantity: 0.05, url: 'https://example.com/avoine', memo: 'Note',
      nutritionValues: [{ nutritionKey: 'PROTEIN', amount: 13, unit: 'G', reference: 'PER_100G' }],
    }), options);
    expect(result.error).toBeNull();
    expect(result.value).toEqual(jasmine.objectContaining({
      categoryId: 7, genericProductId: 8, tagIds: [9], barcode: '001234', price: 0,
      priceUnit: 'paquet', portionCount: 10, portionUnit: 'portion', portionQuantityNormalized: 50,
      url: 'https://example.com/avoine', memo: 'Note',
      nutritionValues: [{ nutritionKey: 'PROTEIN', amount: 13, unit: 'G', reference: 'PER_100G' }],
    }));
  });

  it('distinguishes an empty field, malformed JSON and an invalid product', () => {
    expect(parseProductJson('', options)).toEqual({ value: null, error: null, formattedJson: null });
    expect(parseProductJson('{', options)).toEqual({ value: null, error: jasmine.stringMatching('JSON invalide'), formattedJson: null });
    const result = parseProductJson('{"name":"Avoine"}', options);
    expect(result.value).toBeNull();
    expect(result.error).toContain('unitType');
    expect(result.formattedJson).toBe(JSON.stringify({ name: 'Avoine' }, null, 2));
  });

  for (const [field, value] of [
    ['name', ' '], ['unitType', 'Unknown'], ['quantityPerUnit', '500'], ['quantityPerUnit', 0],
    ['quantityUnit', 'oz'], ['category', 'Unknown'], ['genericProduct', 8], ['tags', 'Bio'],
    ['tags', [9]], ['price', -1], ['price', 2], ['priceUnit', 'kg'],
    ['portionCount', 1.5], ['portionUnit', 'portion'], ['portionQuantity', 0],
    ['barcode', 123], ['url', 'not a URL'], ['memo', {}], ['nutritionValues', {}],
    ['id', 1], ['categoryId', 7], ['quantityNormalized', 500], ['createdAt', '2026-01-01'],
    ['nutritionValues', [{ id: 1 }]],
    ['nutritionValues', [{ nutritionKey: 'PROTEIN', amount: -1, unit: 'G', reference: 'PER_100G' }]],
    ['nutritionValues', [{ nutritionKey: 'PROTEIN', amount: 1, unit: 'KCAL', reference: 'PER_100G' }]],
    ['nutritionValues', [{ nutritionKey: 'PROTEIN', amount: 1, unit: 'G', reference: 'PER_UNIT' }]],
  ] as [string, unknown][]) {
    it(`rejects invalid ${field}: ${JSON.stringify(value)}`, () => {
      const result = parseProductJson(JSON.stringify({ ...minimal, [field]: value }), options);
      expect(result.value).toBeNull();
      expect(result.error).toContain(field);
    });
  }

  for (const value of ['null', '[]', '"product"', '42']) {
    it(`rejects a non-object root: ${value}`, () => {
      expect(parseProductJson(value, options).value).toBeNull();
    });
  }

  it('prevents an ambiguous name from linking the wrong entity', () => {
    const result = parseProductJson(JSON.stringify({ ...minimal, category: 'Céréales' }), {
      ...options, categories: [...options.categories, { id: 12, name: 'Céréales' }],
    });
    expect(result.error).toContain('plusieurs éléments');
    expect(result.value).toBeNull();
  });

  it('validates nutrition values with the backend keys when metadata is unavailable', () => {
    const result = parseProductJson(JSON.stringify({ ...minimal, nutritionValues: [
      { nutritionKey: 'ENERGY_KJ', amount: 100, unit: 'KJ', reference: 'PER_100ML' },
    ] }), { ...options, nutritionKeys: [] });
    expect(result.error).toBeNull();
    expect(result.value?.nutritionValues[0].nutritionKey).toBe('ENERGY_KJ');
  });
});
