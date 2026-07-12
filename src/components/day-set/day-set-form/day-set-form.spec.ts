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
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'ENERGY', amount: 0, unit: 'KCAL', reference: 'PER_100G' },
      { nutritionKey: 'PROTEIN', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 0, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'FAT', amount: 0, unit: 'G', reference: 'PER_100G' },
    ]);
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
    const emitted: unknown[] = [];
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

  it('should cover form guards, slot/template normalization, and helper actions', () => {
    const submitted = jasmine.createSpy('submitted');
    const menuClicked = jasmine.createSpy('menuClicked');
    component.submitted.subscribe(submitted);
    component.menuClicked.subscribe(menuClicked);

    component.onMenuClick();
    component.onSubmit();
    expect(menuClicked).toHaveBeenCalled();
    expect(submitted).not.toHaveBeenCalled();

    component.onSlotsSelected([
      { id: '1', title: 'Breakfast' },
      { id: '1', title: 'Duplicate' },
      { id: '0', title: 'Invalid' },
      { id: 'not-a-number', title: 'Invalid' },
      { id: '2.5', title: 'Invalid' },
    ]);
    expect(component.selectedSlotIds).toEqual([1]);
    expect(component.selectedSlotIdsAsString).toEqual(['1']);

    component.nutritionValues = [];
    component.onNutritionKeyChange(0);
    component.addNutritionValue();
    component.onNutritionKeyChange(0);
    component.removeNutritionValue(0);
    expect(component.nutritionValues).toEqual([]);
    expect(component.getUnitsForKey('PROTEIN')).toEqual(['G', 'MG']);

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('daySet', {
      title: 'Stored',
      nutritionValues: [],
      slotIds: [2, 2, 0, -1, 3.5],
      templateId: 4,
    });
    fixture.detectChanges();
    expect(component.heading).toBe('Edit day set');
    expect(component.selectedSlotIds).toEqual([2]);
    expect(component.selectedTemplateId).toBe(4);

    component.form.setValue({ title: 'Stored' });
    component.onSubmit();
    expect(submitted).toHaveBeenCalledWith(
      jasmine.objectContaining({
        mode: 'edit',
        value: jasmine.objectContaining({
          title: 'Stored',
          slotIds: [2],
          templateId: 4,
        }),
      }),
    );
  });
});
