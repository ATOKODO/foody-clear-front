import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaySetForm } from './day-set-form';

describe('DaySetForm', () => {
  let component: DaySetForm;
  let fixture: ComponentFixture<DaySetForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaySetForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DaySetForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize add mode with default values', () => {
    expect(component.form.getRawValue()).toEqual({
      title: '',
    });
    expect(component.nutritionValues.length).toBe(3);
    expect(component.selectedSlotIds).toEqual([]);
  });

  it('should patch values in edit mode when daySet is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('daySet', {
      title: 'Lundi',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
      ],
      slotIds: [2, 3],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      title: 'Lundi',
    });
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'PROTEIN', amount: 20, unit: 'G', reference: 'PER_100G' },
    ]);
    expect(component.selectedSlotIds).toEqual([2, 3]);
  });

  it('should emit submitted payload with mode and form value', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      title: 'Mardi',
    });
    component.nutritionValues = [
      { nutritionKey: 'PROTEIN', amount: 30, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 40, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'FAT', amount: 15, unit: 'G', reference: 'PER_100G' },
    ];
    component.selectedSlotIds = [1, 3];

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          title: 'Mardi',
          templateId: null,
          nutritionValues: [
            { nutritionKey: 'PROTEIN', amount: 30, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'CARBOHYDRATE', amount: 40, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'FAT', amount: 15, unit: 'G', reference: 'PER_100G' },
          ],
          slotIds: [1, 3],
        },
      },
    ]);
  });
});
