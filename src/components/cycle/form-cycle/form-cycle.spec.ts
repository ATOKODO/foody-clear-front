import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCycle } from './form-cycle';

describe('FormCycle', () => {
  let component: FormCycle;
  let fixture: ComponentFixture<FormCycle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCycle],
    })
    .compileComponents();

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
      couleur: '#ff5b5b',
      nombre: 0,
      typeDuree: 'jour',
    });
    expect(component.nutritionValues.length).toBe(3);
  });

  it('should patch values in edit mode when cycle is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('cycle', {
      titre: 'Seche',
      couleur: '#22c55e',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 180, unit: 'G', reference: 'PER_100G' },
      ],
      nombre: 4,
      typeDuree: 'semaine',
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      titre: 'Seche',
      couleur: '#22c55e',
      nombre: 4,
      typeDuree: 'semaine',
    });
    expect(component.nutritionValues).toEqual([
      { nutritionKey: 'PROTEIN', amount: 180, unit: 'G', reference: 'PER_100G' },
    ]);
  });

  it('should emit submitted payload with mode and form value', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      titre: 'Prise de masse',
      couleur: '#f97316',
      nombre: 6,
      typeDuree: 'jour',
    });
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
          couleur: '#f97316',
          nutritionValues: [
            { nutritionKey: 'PROTEIN', amount: 200, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'CARBOHYDRATE', amount: 300, unit: 'G', reference: 'PER_100G' },
            { nutritionKey: 'FAT', amount: 70, unit: 'G', reference: 'PER_100G' },
          ],
          nombre: 6,
          typeDuree: 'jour',
        },
      },
    ]);
  });

  it('should render all key wireframe labels', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Ajouter un Cycle');
    expect(text).toContain('Titre');
    expect(text).toContain('Couleur');
    expect(text).toContain('Nutrition values');
    expect(text).toContain('Nombre');
    expect(text).toContain('Type de duree');
    expect(text).toContain('Jour / Semaine / Mois');
  });

  it('should render expected number of inputs and selects', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelectorAll('input[matInput]').length).toBeGreaterThanOrEqual(4);
    expect(nativeElement.querySelectorAll('mat-select').length).toBeGreaterThanOrEqual(3);
  });
});
