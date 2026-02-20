import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryForm } from './inventory-form';

describe('InventoryForm', () => {
  let component: InventoryForm;
  let fixture: ComponentFixture<InventoryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryForm],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize add mode with default values', () => {
    expect(component.form.getRawValue()).toEqual({
      name: '',
      productIdsCsv: '',
      productsJson: '',
    });
  });

  it('should patch values in edit mode when inventory is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('inventory', {
      name: 'Stock principal',
      productIds: [1, 2, 3],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      name: 'Stock principal',
      productIdsCsv: '1,2,3',
      productsJson: '',
    });
  });

  it('should emit submitted payload with parsed product ids', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      name: 'Frigo',
      productIdsCsv: '1,2,2,3',
      productsJson: '',
    });

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          name: 'Frigo',
          productIds: [1, 2, 3],
          products: [],
        },
      },
    ]);
  });
});
