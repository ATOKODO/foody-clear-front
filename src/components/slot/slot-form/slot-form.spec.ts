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
      title: '',
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('should patch values in edit mode when slot is provided', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('slot', {
      title: 'Petit dejeuner',
      protein: 20,
      carbs: 50,
      fat: 10,
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      title: 'Petit dejeuner',
      protein: 20,
      carbs: 50,
      fat: 10,
    });
  });

  it('should emit submitted payload with mode and form value', () => {
    const emitted: Array<unknown> = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.setValue({
      title: 'Collation',
      protein: 30,
      carbs: 40,
      fat: 15,
    });

    component.onSubmit();

    expect(emitted).toEqual([
      {
        mode: 'add',
        value: {
          title: 'Collation',
          protein: 30,
          carbs: 40,
          fat: 15,
        },
      },
    ]);
  });
});
