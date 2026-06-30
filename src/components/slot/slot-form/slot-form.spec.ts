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
      startTime: '',
      endTime: '',
    });
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'ENERGY', amount: 0, unit: 'KCAL', reference: 'PER_100G' },
      { nutritionKey: 'PROTEIN', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'FAT', amount: 0, unit: 'G', reference: 'PER_100G' },
    ]);
  });

  it('should patch values in edit mode when slot is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('slot', {
      key: 'morning',
      title: 'Petit dejeuner',
      sortOrder: 0,
      startTime: '08:00:00',
      endTime: '09:00:00',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
      ],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      key: 'morning',
      title: 'Petit dejeuner',
      sortOrder: 0,
      startTime: '08:00',
      endTime: '09:00',
    });
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
    ]);
  });

  it('should emit submitted payload with mode and form value', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      key: 'snack',
      title: 'Collation',
      sortOrder: 3,
      startTime: '',
      endTime: '16:30',
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
          startTime: null,
          endTime: '16:30',
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
