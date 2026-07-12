import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductForm } from './product-form';

describe('ProductForm', () => {
  let component: ProductForm;
  let fixture: ComponentFixture<ProductForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize add mode with default values', () => {
    expect(component.form.getRawValue().name).toBe('');
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'ENERGY', amount: 0, unit: 'KCAL', reference: 'PER_100G' },
      { nutritionKey: 'PROTEIN', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'FAT', amount: 0, unit: 'G', reference: 'PER_100G' },
    ]);
  });

  it('should resolve energy default from nutrition key metadata', () => {
    fixture.componentRef.setInput('nutritionKeys', [
      { key: 'ENERGY_KCAL', value: 'ENERGY_KCAL', label: 'Energie (Kcal)', allowedUnits: ['KCAL'] },
      { key: 'PROTEIN', value: 'PROTEIN', label: 'Proteine', allowedUnits: ['G'] },
      { key: 'CARBOHYDRATE', value: 'CARBOHYDRATE', label: 'Glucide', allowedUnits: ['G'] },
      { key: 'FAT', value: 'FAT', label: 'Lipide', allowedUnits: ['G'] },
    ]);
    fixture.detectChanges();

    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'ENERGY_KCAL', amount: 0, unit: 'KCAL', reference: 'PER_100G' },
      { nutritionKey: 'PROTEIN', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'FAT', amount: 0, unit: 'G', reference: 'PER_100G' },
    ]);
  });

  it('should patch values in edit mode when product is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('product', {
      name: 'Salade',
      barcode: '123',
      categoryId: 3,
      genericProductId: 8,
      tagIds: [2, 5],
      nutritionValues: [
        { id: 12, nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
      ],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue().name).toBe('Salade');
    expect(component.form.getRawValue().categoryId).toBe(3);
    expect(component.form.getRawValue().genericProductId).toBe(8);
    expect(component.form.getRawValue().tagIds).toEqual([2, 5]);
    expect(component.nutritionValues.length).toBe(1);
    expect(component.nutritionValues[0].id).toBe(12);
  });

  it('should hide technical ids in the rendered form', async () => {
    fixture.componentRef.setInput('categories', [{ id: 1, name: 'Legumes' }]);
    fixture.componentRef.setInput('genericProducts', [{ id: 2, name: 'Salade verte' }]);
    fixture.componentRef.setInput('tags', [{ id: 3, name: 'Bio' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    const textContent = fixture.nativeElement.textContent ?? '';
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('mat-label'),
    ).map((label) => label.textContent?.trim());
    const selectTriggers = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.mat-mdc-select-trigger'),
    );

    expect(labels).not.toContain('Id');
    expect(selectTriggers.length).toBeGreaterThanOrEqual(3);
    expect(textContent).not.toContain('(#1)');
    expect(textContent).not.toContain('(#2)');
    expect(textContent).not.toContain('(#3)');

    selectTriggers[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.textContent ?? '').toContain('Legumes');
    expect(document.body.textContent ?? '').not.toContain('(#1)');
    closeSelectPanel();

    selectTriggers[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.textContent ?? '').toContain('Salade verte');
    expect(document.body.textContent ?? '').not.toContain('(#2)');
    closeSelectPanel();

    selectTriggers[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.textContent ?? '').toContain('Bio');
    expect(document.body.textContent ?? '').not.toContain('(#3)');
    closeSelectPanel();
  });

  it('should emit submitted payload', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.patchValue({
      name: 'Salade',
      categoryId: 3,
      genericProductId: 8,
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      tagIds: [2, 5],
    });
    component.nutritionValues = [
      { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
    ];

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: jasmine.objectContaining({
          name: 'Salade',
          categoryId: 3,
          genericProductId: 8,
          tagIds: [2, 5],
          nutritionValues: [
            { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
          ],
        }),
      },
    ]);
  });

  it('should preserve nutrition value ids in edit submitted payload', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('product', {
      name: 'Salade',
      categoryId: 3,
      genericProductId: 8,
      tagIds: [2, 5],
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      nutritionValues: [
        { id: 12, nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
      ],
    });
    fixture.detectChanges();

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'edit',
        value: jasmine.objectContaining({
          nutritionValues: [
            {
              id: 12,
              nutritionKey: 'PROTEIN',
              amount: 20,
              unit: 'G',
              reference: 'PER_100G',
            },
          ],
        }),
      },
    ]);
  });

  it('should cover product validation, nutrition unit changes and normalizers', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));
    component.onSubmit();
    expect(emitted).toEqual([]);

    component.form.patchValue({
      name: 'Product',
      unitType: 'Paquet',
      quantityPerUnit: 1,
      quantityUnit: 'g',
      portionCount: '2',
      portionUnit: '',
    });
    component.onSubmit();
    expect(component.form.controls.portionUnit.hasError('requiredWithPortion')).toBeTrue();
    component.form.patchValue({ portionUnit: 'portion', price: '2', priceUnit: '' });
    component.onSubmit();
    expect(component.form.controls.price.hasError('requiredWithPrice')).toBeTrue();
    component.form.patchValue({ price: '', priceUnit: 'kg' });
    component.onSubmit();
    expect(component.form.controls.priceUnit.hasError('requiredWithPrice')).toBeTrue();
    component.form.patchValue({ price: '2', priceUnit: 'kg', priceEffectiveFrom: ' 2026-01-01 ', barcode: ' ', url: ' https://example.test ', memo: ' note ' });
    component.nutritionValues = [
      { nutritionKey: ' protein ', amount: -2, unit: 'bad', reference: 'PER_100ML' },
      { nutritionKey: ' ', amount: Number.NaN, unit: '', reference: 'PER_100G' },
    ];
    component.onSubmit();
    expect(emitted.length).toBe(1);

    component.addNutritionValue();
    component.onNutritionKeyChange(999);
    component.nutritionValues[0].nutritionKey = 'UNKNOWN';
    component.onNutritionKeyChange(0);
    expect(component.getUnitsForKey('UNKNOWN').length).toBeGreaterThan(0);
    component.nutritionValues[0].nutritionKey = '';
    component.onNutritionKeyChange(0);
    component.removeNutritionValue(0);
    component.removeNutritionValue(99);

    const call = privateMethod(component);
    expect(call('normalizeIntegerArray', [1, '2', 2, 0, 'bad'])).toEqual([1, 2]);
    expect(call('normalizeIntegerArray', null)).toEqual([]);
    expect(call('normalizeNullableString', '  value ')).toBe('value');
    expect(call('normalizeNullableString', 1)).toBeNull();
    expect(call('normalizeNullableString', ' ')).toBeNull();
    expect(call('normalizeNullableInteger', 2)).toBe(2);
    expect(call('normalizeNullableInteger', ' 3 ')).toBe(3);
    expect(call('normalizeNullableInteger', 0)).toBeNull();
    expect(call('normalizeNullableInteger', true)).toBeNull();
    expect(call('normalizeNullableNumber', 2)).toBe(2);
    expect(call('normalizeNullableNumber', '2.5')).toBe(2.5);
    expect(call('normalizeNullableNumber', Number.NaN)).toBeNull();
    expect(call('normalizeNullableNumber', true)).toBeNull();
    expect(call('normalizeNullablePositiveNumber', 0)).toBeNull();
    expect(call('normalizeNullablePositiveNumber', '2')).toBe(2);
    expect(call('normalizeNullablePriceUnit', ' KG ')).toBe('kg');
    expect(call('normalizeNullablePriceUnit', null)).toBeNull();
    expect(call('normalizeQuantityUnit', ' ML ')).toBe('ml');
    expect(call('normalizeQuantityUnit', null)).toBeNull();
    expect(call('normalizeNullablePortionUnit', ' PORTION ')).toBe('portion');
    expect(call('normalizeNullablePortionUnit', null)).toBeNull();
    fixture.componentRef.setInput('nutritionKeys', [
      { key: 'PROTEIN', value: 'PROTEIN', label: 'Protein', allowedUnits: ['G'] },
    ]);
    fixture.detectChanges();
    expect(call('pickDefaultUnit', 'PROTEIN', 'G')).toBe('G');
    expect(call('pickDefaultUnit', 'PROTEIN', 'BAD')).toBe('G');
    expect(call('pickDefaultUnit', 'UNKNOWN', 'custom')).toBe('custom');
    expect(call('getAllowedUnits', '')).toEqual([]);
    expect(call('getAllowedUnits', 'UNKNOWN')).toEqual([]);
    expect(call('formatOptionalNumber', null)).toBe('');
    expect(call('formatOptionalNumber', 2)).toBe('2');
  });

});

function closeSelectPanel(): void {
  const backdrop = document.body.querySelector<HTMLElement>('.cdk-overlay-backdrop');
  backdrop?.click();
}

function privateMethod(
  component: ProductForm,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}
