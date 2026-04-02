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

  it('should preserve nutrition value ids in edit submitted payload', () => {
    const emitted: Array<unknown> = [];
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

  function closeSelectPanel(): void {
    const backdrop = document.body.querySelector<HTMLElement>('.cdk-overlay-backdrop');
    backdrop?.click();
  }
});
