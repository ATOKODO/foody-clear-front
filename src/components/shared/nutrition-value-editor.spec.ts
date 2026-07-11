import { NutritionValueEditor } from './nutrition-value-editor';

describe('NutritionValueEditor', () => {
  const editor = new NutritionValueEditor(() => [
    { key: 'PROTEIN', value: 'protein', label: 'Protein', allowedUnits: ['g', 'mg'] },
    { key: 'ENERGY', value: 'energy', label: 'Energy', allowedUnits: [] },
  ]);

  it('should create defaults and normalize values', () => {
    expect(editor.createDefaultValue('protein')).toEqual({
      nutritionKey: 'protein',
      amount: 0,
      unit: 'g',
      reference: 'PER_100G',
    });
    expect(editor.createDefaultValue('energy').unit).toBe('KCAL');
    expect(editor.createDefaultValues().length).toBeGreaterThan(0);
    expect(editor.normalizeValue({ nutritionKey: ' protein ', amount: -2, unit: 'oz', reference: 'PER_100ML' })).toEqual({
      nutritionKey: 'protein',
      amount: 0,
      unit: 'g',
      reference: 'PER_100ML',
    });
    expect(editor.normalizeValuesForSubmission([
      { nutritionKey: ' ', amount: 1, unit: 'g', reference: 'PER_100G' },
      { nutritionKey: 'protein', amount: 1, unit: 'g', reference: 'PER_100G' },
    ])).toHaveSize(1);
  });

  it('should expose allowed and fallback units and repair invalid selections', () => {
    expect(editor.getUnitsForKey('protein')).toEqual(['g', 'mg']);
    expect(editor.getUnitsForKey('energy')).toContain('KCAL');
    expect(editor.getUnitsForKey('unknown')).toContain('G');
    const known = { nutritionKey: 'protein', amount: 1, unit: 'mg', reference: 'PER_100G' } as {
      nutritionKey: string;
      amount: number;
      unit: string;
      reference: 'PER_100G' | 'PER_100ML';
    };
    editor.ensureUnit(known);
    expect(known.unit).toBe('mg');
    known.unit = 'oz';
    editor.ensureUnit(known);
    expect(known.unit).toBe('g');
    const unknown = { nutritionKey: 'energy', amount: 1, unit: 'oz', reference: 'PER_100G' } as {
      nutritionKey: string;
      amount: number;
      unit: string;
      reference: 'PER_100G' | 'PER_100ML';
    };
    editor.ensureUnit(unknown);
    expect(unknown.unit).toBe('KCAL');
  });
});
