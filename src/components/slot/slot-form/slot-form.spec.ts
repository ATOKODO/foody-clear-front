import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotForm } from './slot-form';

describe('SlotForm', () => {
  let component: SlotForm;
  let fixture: ComponentFixture<SlotForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize add mode with default values', () => {
    expect(component.form.getRawValue()).toEqual({
      key: '',
      title: '',
      sortOrder: 0,
    });
    expect(component.nutritionValues.length).toBe(3);
  });

  it('should patch values in edit mode when slot is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('slot', {
      key: 'morning',
      title: 'Petit dejeuner',
      sortOrder: 0,
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
      ],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      key: 'morning',
      title: 'Petit dejeuner',
      sortOrder: 0,
    });
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
    ]);
  });

  it('should emit submitted payload with mode and form value', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      key: 'snack',
      title: 'Collation',
      sortOrder: 3,
    });
    component.nutritionValues = [
      { nutritionKey: 'PROTEIN', amount: 30, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 40, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'FAT', amount: 15, unit: 'G', reference: 'PER_100G' },
    ];

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          key: 'snack',
          title: 'Collation',
          sortOrder: 3,
          nutritionValues: [
            { nutritionKey: 'PROTEIN', amount: 30, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'CARBOHYDRATE', amount: 40, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'FAT', amount: 15, unit: 'G', reference: 'PER_100G' },
          ],
        },
      },
    ]);
  });
});
