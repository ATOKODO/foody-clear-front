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
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('should patch values in edit mode when daySet is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('daySet', {
      title: 'Lundi',
      protein: 20,
      carbs: 50,
      fat: 10,
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      title: 'Lundi',
      protein: 20,
      carbs: 50,
      fat: 10,
    });
  });

  it('should emit submitted payload with mode and form value', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      title: 'Mardi',
      protein: 30,
      carbs: 40,
      fat: 15,
    });

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          title: 'Mardi',
          protein: 30,
          carbs: 40,
          fat: 15,
        },
      },
    ]);
  });
});
