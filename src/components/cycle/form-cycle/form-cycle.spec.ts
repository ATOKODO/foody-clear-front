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
    expect(component.daySetTimeline).toEqual([3, 0, 1, 0]);
  });

  it('should emit submitted payload with the full daySet timeline', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      titre: 'Prise de masse',
      couleur: 'orange',
      nombre: 6,
      typeDuree: 'jour',
      durationDays: 6,
    });
    component.selectedSlotIds = [11, 12];
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
    const emitted: Array<unknown> = [];
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

    expect(text).toContain('Ajouter un Cycle');
    expect(text).toContain('Nombre de jours');
    expect(text).toContain('Raccourcis de duree');
    expect(text).toContain('Ordre du cycle');
    expect(text).toContain('Objectif du cycle');
    expect(text).not.toContain('Reference');
  });
});
