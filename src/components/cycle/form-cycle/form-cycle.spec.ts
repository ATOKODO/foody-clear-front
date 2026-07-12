import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCycle } from './form-cycle';

describe('FormCycle', () => {
  let component: FormCycle;
  let fixture: ComponentFixture<FormCycle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCycle],
    }).compileComponents();

    fixture = TestBed.createComponent(FormCycle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with expected default values', () => {
    expect(component.form.getRawValue()).toEqual({
      titre: '',
      couleur: 'red',
      nombre: 1,
      typeDuree: 'jour',
      durationDays: 1,
    });
    expect(component.nutritionValues).toEqual([
      {
        nutritionKey: 'ENERGY',
        amount: 0,
        unit: 'KCAL',
        reference: 'PER_100G',
      },
      { nutritionKey: 'PROTEIN', amount: 0, unit: 'G', reference: 'PER_100G' },
      {
        nutritionKey: 'CARBOHYDRATE',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      { nutritionKey: 'FAT', amount: 0, unit: 'G', reference: 'PER_100G' },
    ]);
    expect(component.selectedSlotIds).toEqual([]);
    expect(component.selectedDefaultTemplateId).toBeNull();
    expect(component.daySetTimeline).toEqual([0]);
  });

  it('should patch values in edit mode when cycle is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('cycle', {
      titre: 'Seche',
      couleur: 'green',
      nutritionValues: [
        {
          nutritionKey: 'PROTEIN',
          amount: 180,
          unit: 'G',
          reference: 'PER_100G',
        },
      ],
      nombre: 4,
      typeDuree: 'jour',
      durationDays: 4,
      slotIds: [11, 12],
      defaultTemplateId: 7,
      daySetOrder: [3, 0, 1, 0],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      titre: 'Seche',
      couleur: 'green',
      nombre: 4,
      typeDuree: 'jour',
      durationDays: 4,
    });
    expect(component.nutritionValues).toEqual([
      {
        nutritionKey: 'PROTEIN',
        amount: 180,
        unit: 'G',
        reference: 'PER_100G',
      },
    ]);
    expect(component.selectedSlotIds).toEqual([11, 12]);
    expect(component.selectedDefaultTemplateId).toBe(7);
    expect(component.daySetTimeline).toEqual([3, 0, 1, 0]);
  });

  it('should emit submitted payload with the full daySet timeline', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      titre: 'Prise de masse',
      couleur: 'orange',
      nombre: 6,
      typeDuree: 'jour',
      durationDays: 6,
    });
    component.selectedSlotIds = [11, 12];
    component.selectedDefaultTemplateId = 9;
    component.daySetTimeline = [0, 4, 0, 2, 0, 0];
    component.nutritionValues = [
      {
        nutritionKey: 'PROTEIN',
        amount: 200,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'CARBOHYDRATE',
        amount: 300,
        unit: 'G',
        reference: 'PER_100G',
      },
      { nutritionKey: 'FAT', amount: 70, unit: 'G', reference: 'PER_100G' },
    ];

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          titre: 'Prise de masse',
          couleur: 'orange',
          nutritionValues: [
            {
              nutritionKey: 'PROTEIN',
              amount: 200,
              unit: 'G',
              reference: 'PER_100G',
            },
            {
              nutritionKey: 'CARBOHYDRATE',
              amount: 300,
              unit: 'G',
              reference: 'PER_100G',
            },
            {
              nutritionKey: 'FAT',
              amount: 70,
              unit: 'G',
              reference: 'PER_100G',
            },
          ],
          nombre: 6,
          typeDuree: 'jour',
          durationDays: 6,
          slotIds: [11, 12],
          defaultTemplateId: 9,
          daySetIds: [4, 2],
          daySetOrder: [0, 4, 0, 2, 0, 0],
        },
      },
    ]);
  });

  it('should update selected default cycle slots', () => {
    component.onSlotsSelected([
      { id: '12', title: 'Dejeuner' },
      { id: '11', title: 'Petit dejeuner' },
      { id: '12', title: 'Dejeuner' },
    ]);

    expect(component.selectedSlotIds).toEqual([12, 11]);
    expect(component.selectedSlotIdsAsString).toEqual(['12', '11']);
  });

  it('should block submit when assigned day sets remain beyond durationDays', () => {
    const emitted: unknown[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      titre: 'Cycle court',
      couleur: 'red',
      nombre: 2,
      typeDuree: 'jour',
      durationDays: 2,
    });
    component.daySetTimeline = [1, 0, 3];

    component.onSubmit();

    expect(emitted).toEqual([]);
    expect(component.showSelectionError).toBeTrue();
  });

  it('should place a newly selected day set in the first default slot', () => {
    component.form.patchValue({
      durationDays: 4,
    });
    component.daySetTimeline = [0, 2, 0, 4];

    component.onDaySetsSelected([
      { id: '4', title: 'Jour 4' },
      { id: '2', title: 'Jour 2' },
      { id: '6', title: 'Jour 6' },
    ]);

    expect(component.daySetTimeline).toEqual([6, 2, 0, 4]);
  });

  it('should turn an unchecked day set slot back into a cycle default day', () => {
    component.form.patchValue({
      durationDays: 4,
    });
    component.daySetTimeline = [0, 2, 0, 4];

    component.onDaySetsSelected([{ id: '4', title: 'Jour 4' }]);

    expect(component.daySetTimeline).toEqual([0, 0, 0, 4]);
  });

  it('should keep overflowing day sets visible when durationDays is reduced', () => {
    component.form.patchValue({
      nombre: 4,
      typeDuree: 'jour',
      durationDays: 2,
    });
    component.daySetTimeline = [1, 0, 2, 0];

    component.onDurationDaysInput();

    expect(component.form.controls.nombre.value).toBe(2);
    expect(component.form.controls.typeDuree.value).toBe('jour');
    expect(component.daySetTimeline).toEqual([1, 0, 2]);
    expect(component.hasSelectedDaySetOverflow).toBeTrue();
  });

  it('should render the updated duration and ordering labels', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Add cycle');
    expect(text).toContain('Number of days');
    expect(text).toContain('Duration shortcuts');
    expect(text).toContain('Cycle order');
    expect(text).toContain('Cycle target');
    expect(text).not.toContain('Reference');
  });

  it('should cover cycle selection guards, nutrition units and timeline helpers', () => {
    component.form.patchValue({ titre: 'Cycle', durationDays: 1 });
    component.daySetTimeline = [2];
    component.onDaySetsSelected([
      { id: '2', title: 'Existing' },
      { id: '3', title: 'Ignored overflow' },
      { id: 'bad', title: 'Invalid' } as never,
    ]);
    expect(component.daySetTimeline).toEqual([2]);
    component.onDaySetsSelected([]);
    component.onSlotsSelected([{ id: 'bad', title: 'Bad' } as never, { id: '4', title: 'Slot' }]);
    expect(component.selectedSlotIds).toEqual([4]);
    component.applyDurationPreset(component.durationPresets[1]);
    expect(component.durationDays).toBe(14);
    component.onDurationDaysInput();
    component.onDaySetOrderDropped({ previousIndex: 0, currentIndex: 0 } as never);
    component.daySetTimeline = [0, 2, 0];
    component.onDaySetOrderDropped({ previousIndex: 0, currentIndex: 1 } as never);
    expect(component.daySetTimeline[1]).toBe(0);
    component.removeDaySetFromOrder(2);
    expect(component.selectedDaySetIds).toEqual([]);
    expect(component.selectedDaySetIdsAsString).toEqual([]);
    expect(component.timelineSlots[0].title).toBe('Cycle target');
    expect(component.trackByTimelineSlot(0, { index: 0, daySetId: 0 } as never)).toBe('0-0');
    expect(component.couleurSelectionnee).toBe('red');
    expect(component.canSubmit).toBeTrue();

    fixture.componentRef.setInput('nutritionKeys', [
      { key: 'PROTEIN', value: 'PROTEIN', label: 'Protein', allowedUnits: ['MG', 'G'] },
      { key: 'CUSTOM', value: 'CUSTOM', label: 'Custom', allowedUnits: [] },
    ]);
    fixture.detectChanges();
    component.nutritionValues = [
      { nutritionKey: 'PROTEIN', amount: 1, unit: 'BAD', reference: 'PER_100G' },
      { nutritionKey: 'CUSTOM', amount: 1, unit: '', reference: 'PER_100ML' },
    ];
    component.onNutritionKeyChange(0);
    component.onNutritionKeyChange(1);
    component.onNutritionKeyChange(99);
    expect(component.nutritionValues[0].unit).toBe('MG');
    expect(component.getUnitsForKey('PROTEIN')).toEqual(['MG', 'G']);
    expect(component.getUnitsForKey('UNKNOWN')).toContain('G');
    component.addNutritionValue();
    component.removeNutritionValue(99);
    component.removeNutritionValue(0);
    const call = privateMethod(component);
    expect(call('normalizeSlotIds', [1, 1, 0, -1, 2.5])).toEqual([1]);
    expect(call('normalizeTemplateId', 3)).toBe(3);
    expect(call('normalizeTemplateId', 0)).toBeNull();
    expect(call('normalizeDaySetIds', [1, 1, 0, 2.5])).toEqual([1]);
    expect(call('normalizeDaySetTimeline', [2.9, -1], 3)).toEqual([2, 0, 0]);
    expect(call('serializeDaySetTimeline', 4)).toEqual([0, 0, 0, 0]);
    expect(call('extractAssignedDaySetIds', [0, 2, 2, -1])).toEqual([2]);
    expect(call('getDaySetTitle', 99)).toBe('Day Set 99');
    expect(call('normalizePositiveInteger', '3.8', 1)).toBe(3);
  });
});

function privateMethod(
  component: FormCycle,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}
