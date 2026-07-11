import { getNutritionMacro } from './nutrition';

describe('nutrition helpers', () => {
  it('should use direct macro values when no nutrition list exists', () => {
    expect(getNutritionMacro({ protein: 12.345 }, 'protein')).toBe(12.35);
    expect(getNutritionMacro({}, 'fat')).toBe(0);
  });

  it('should aggregate grams, milligrams and known macro keys', () => {
    const item = {
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 12.345, unit: 'g', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 500, unit: 'mg', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 2, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'UNKNOWN', amount: 100, unit: 'g', reference: 'PER_100G' },
        { nutritionKey: 'PROTEIN', amount: 1, unit: 'oz', reference: 'PER_100G' },
      ],
    } as never;
    expect(getNutritionMacro(item, 'protein')).toBe(12.35);
    expect(getNutritionMacro(item, 'carbs')).toBe(0.5);
    expect(getNutritionMacro(item, 'fat')).toBe(2);
  });
});
