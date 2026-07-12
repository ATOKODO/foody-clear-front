import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericProductForm } from './generic-product-form';

describe('GenericProductForm', () => {
  let component: GenericProductForm;
  let fixture: ComponentFixture<GenericProductForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericProductForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit quantity enum fields on submit', () => {
    const submittedSpy = jasmine.createSpy('submitted');
    component.submitted.subscribe(submittedSpy);

    component.form.setValue({
      name: 'Pain de mie',
      minQuantityUnit: 2,
      minQuantityUnitType: 'tranche',
      minQuantityMetric: 60,
      minQuantityMetricType: 'g',
    });

    component.onSubmit();

    expect(submittedSpy).toHaveBeenCalledWith({
      mode: 'add',
      value: {
        name: 'Pain de mie',
        minQuantityUnit: 2,
        minQuantityUnitType: 'tranche',
        minQuantityMetric: 60,
        minQuantityMetricType: 'g',
      },
    });
  });

  it('should cover validation guards and normalizers', () => {
    const submitted = jasmine.createSpy('submitted');
    const menuClicked = jasmine.createSpy('menuClicked');
    component.submitted.subscribe(submitted);
    component.menuClicked.subscribe(menuClicked);

    component.onMenuClick();
    component.onSubmit();
    expect(menuClicked).toHaveBeenCalled();
    expect(submitted).not.toHaveBeenCalled();

    component.form.patchValue({
      name: '   ',
      minQuantityUnit: 1,
      minQuantityMetric: 2,
    });
    component.onSubmit();
    expect(component.form.controls.name.hasError('required')).toBeTrue();

    component.form.patchValue({
      name: 'Valid',
      minQuantityUnit: 'invalid' as never,
      minQuantityMetric: 2,
    });
    component.onSubmit();
    expect(submitted).not.toHaveBeenCalled();

    const normalizeNumber = (component as any)
      .normalizeNonNegativeNumber as (value: unknown) => number | null;
    expect(normalizeNumber(3)).toBe(3);
    expect(normalizeNumber(-1)).toBeNull();
    expect(normalizeNumber(Number.NaN)).toBeNull();
    expect(normalizeNumber(' 4.5 ')).toBe(4.5);
    expect(normalizeNumber('')).toBeNull();
    expect(normalizeNumber('invalid')).toBeNull();
    expect(normalizeNumber(null)).toBeNull();

    const normalizeQuantityUnit = (value: unknown): string | null =>
      (component as any).normalizeNullableQuantityUnit.call(component, value);
    const normalizePortionUnit = (value: unknown): string | null =>
      (component as any).normalizeNullablePortionUnit.call(component, value);
    expect(normalizeQuantityUnit(' g ')).toBe('g');
    expect(normalizeQuantityUnit('invalid')).toBeNull();
    expect(normalizeQuantityUnit(2)).toBeNull();
    expect(normalizePortionUnit(' tranche ')).toBe('tranche');
    expect(normalizePortionUnit('invalid')).toBeNull();
    expect(normalizePortionUnit(2)).toBeNull();

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('genericProduct', {
      name: 'Stored',
      minQuantityUnit: '3',
      minQuantityUnitType: 'piece',
      minQuantityMetric: '250',
      minQuantityMetricType: 'g',
    } as never);
    fixture.detectChanges();
    expect(component.heading).toBe('Edit generic product');
    component.onSubmit();
    expect(submitted).toHaveBeenCalledWith({
      mode: 'edit',
      value: {
        name: 'Stored',
        minQuantityUnit: 3,
        minQuantityUnitType: 'piece',
        minQuantityMetric: 250,
        minQuantityMetricType: 'g',
      },
    });
  });
});
