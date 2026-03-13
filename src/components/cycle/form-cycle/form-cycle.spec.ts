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
    expect(component.nutritionValues.length).toBe(3);
    expect(component.selectedDaySetOrder).toEqual([]);
  });

  it('should patch values in edit mode when cycle is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('cycle', {
      titre: 'Seche',
      couleur: 'green',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 180, unit: 'G', reference: 'PER_100G' },
      ],
      nombre: 4,
      typeDuree: 'semaine',
      durationDays: 28,
      daySetOrder: [3, 1],
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      titre: 'Seche',
      couleur: 'green',
      nombre: 4,
      typeDuree: 'semaine',
      durationDays: 28,
    });
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'PROTEIN', amount: 180, unit: 'G', reference: 'PER_100G' },
    ]);
    expect(component.selectedDaySetOrder).toEqual([3, 1]);
  });

  it('should emit submitted payload with durationDays and ordered day sets', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      titre: 'Prise de masse',
      couleur: 'orange',
      nombre: 6,
      typeDuree: 'jour',
      durationDays: 6,
    });
    component.selectedDaySetOrder = [4, 2];
    component.nutritionValues = [
      { nutritionKey: 'PROTEIN', amount: 200, unit: 'G', reference: 'PER_100G' },
      { nutritionKey: 'CARBOHYDRATE', amount: 300, unit: 'G', reference: 'PER_100G' },
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
            { nutritionKey: 'PROTEIN', amount: 200, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'CARBOHYDRATE', amount: 300, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'FAT', amount: 70, unit: 'G', reference: 'PER_100G' },
          ],
          nombre: 6,
          typeDuree: 'jour',
          durationDays: 6,
          daySetIds: [4, 2],
          daySetOrder: [4, 2],
        },
      },
    ]);
  });

  it('should block submit when selected day sets exceed durationDays', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      titre: 'Cycle court',
      couleur: 'red',
      nombre: 2,
      typeDuree: 'jour',
      durationDays: 2,
    });
    component.selectedDaySetOrder = [1, 2, 3];

    component.onSubmit();

    expect(emitted).toEqual([]);
    expect(component.showSelectionError).toBeTrue();
  });

  it('should keep current order and append newly selected day sets', () => {
    component.selectedDaySetOrder = [2, 4];

    component.onDaySetsSelected([
      { id: '4', title: 'Jour 4' },
      { id: '2', title: 'Jour 2' },
      { id: '6', title: 'Jour 6' },
    ]);

    expect(component.selectedDaySetOrder).toEqual([2, 4, 6]);
  });

  it('should sync helper fields when durationDays is edited manually', () => {
    component.form.patchValue({
      nombre: 2,
      typeDuree: 'semaine',
      durationDays: 31,
    });

    component.onDurationDaysInput();

    expect(component.form.controls.nombre.value).toBe(31);
    expect(component.form.controls.typeDuree.value).toBe('jour');
  });

  it('should render the updated duration and ordering labels', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Ajouter un Cycle');
    expect(text).toContain('Nombre de jours');
    expect(text).toContain('Raccourcis de duree');
    expect(text).toContain('Ordre du cycle');
  });
});
