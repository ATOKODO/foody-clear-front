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
      proteines: 0,
      glucides: 0,
      lipides: 0,
      nombre: 0,
      typeDuree: 'jour',
    });
  });

  it('should render all key wireframe labels', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Ajouter un Cycle');
    expect(text).toContain('Titre');
    expect(text).toContain('Couleur');
    expect(text).toContain('Proteines');
    expect(text).toContain('Glucides');
    expect(text).toContain('Lipides');
    expect(text).toContain('Nombre');
    expect(text).toContain('Type de duree');
    expect(text).toContain('par jours');
    expect(text).toContain('Jour / Semaine / Mois');
  });

  it('should render expected number of inputs and selects', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelectorAll('input[matInput]').length).toBe(5);
    expect(nativeElement.querySelectorAll('mat-select').length).toBe(2);
  });
});

