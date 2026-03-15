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
    expect(component.nutritionValues.length).toBe(3);
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
  });

  it('should emit submitted payload', () => {
    const emitted: Array<unknown> = [];
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
});
