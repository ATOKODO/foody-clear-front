import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GenericProduct } from './generic-product';
import { GenericProductService } from '../../services/generic-product-service';
import { GenericProductFormValue } from '../../components/generic-product/generic-product-form/generic-product-form';

describe('GenericProduct', () => {
  let component: GenericProduct;
  let fixture: ComponentFixture<GenericProduct>;
  const genericProductServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(
      of({
        id: 1,
        name: 'Riz',
        minQuantityUnit: 1,
        minQuantityUnitType: 'portion',
        minQuantityMetric: 500,
        minQuantityMetricType: 'g',
      }),
    ),
    update: jasmine.createSpy('update').and.returnValue(
      of({
        id: 1,
        name: 'Riz',
        minQuantityUnit: 1,
        minQuantityUnitType: 'portion',
        minQuantityMetric: 500,
        minQuantityMetricType: 'g',
      }),
    ),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    genericProductServiceMock.setBaseUrl.calls.reset();
    genericProductServiceMock.findAll.calls.reset();
    genericProductServiceMock.create.calls.reset();
    genericProductServiceMock.update.calls.reset();
    genericProductServiceMock.remove.calls.reset();

    await TestBed.configureTestingModule({
      imports: [GenericProduct],
      providers: [{ provide: GenericProductService, useValue: genericProductServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericProduct);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should include quantity enum fields in create payload', () => {
    const emitSpy = spyOn(component.dataChanged, 'emit');
    const formValue: GenericProductFormValue = {
      name: 'Pain de mie',
      minQuantityUnit: 2,
      minQuantityUnitType: 'tranche',
      minQuantityMetric: 60,
      minQuantityMetricType: 'g',
    };

    component.onFormSubmitted({ mode: 'add', value: formValue });

    expect(genericProductServiceMock.create).toHaveBeenCalledWith({
      name: 'Pain de mie',
      minQuantityUnit: 2,
      minQuantityUnitType: 'tranche',
      minQuantityMetric: 60,
      minQuantityMetricType: 'g',
    });
    expect(emitSpy).toHaveBeenCalled();
  });
});
