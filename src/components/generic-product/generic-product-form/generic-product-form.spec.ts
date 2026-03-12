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
});
