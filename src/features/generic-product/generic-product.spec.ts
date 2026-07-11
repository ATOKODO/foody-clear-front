import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

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

  it('should render without standalone chrome when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('section.app-page')).toBeNull();
    expect(nativeElement.querySelector('[data-testid="generic-product-embedded"]')).not.toBeNull();
    expect(nativeElement.querySelector('[data-testid="generic-product-list-embedded"]')).not.toBeNull();
  });

  it('should normalize generic products and support edit, delete and error flows', () => {
    const callPrivate = privateMethod(component);
    const products = [
      {
        id: 2,
        name: ' Rice ',
        minQuantityUnit: '2',
        minQuantityUnitType: 'portion',
        minQuantityMetric: 500,
        minQuantityMetricType: 'g',
      },
      { id: 'bad', name: 'Ignored' },
    ];
    component.genericProducts = products as never;

    expect(component.genericProductListItems).toEqual([
      {
        id: '2',
        name: ' Rice ',
        minQuantityUnit: 2,
        minQuantityUnitType: 'portion',
        minQuantityMetric: 500,
        minQuantityMetricType: 'g',
      },
      {
        id: 'bad',
        name: 'Ignored',
        minQuantityUnit: null,
        minQuantityUnitType: null,
        minQuantityMetric: null,
        minQuantityMetricType: null,
      },
    ]);
    expect(callPrivate('extractGenericProductsFromResponse', products)).toEqual([products[0]]);
    expect(callPrivate('extractGenericProductsFromResponse', products[0])).toEqual([products[0]]);
    expect(callPrivate('extractGenericProductsFromResponse', { 'generic-products': [products[0]] })).toEqual([
      products[0],
    ]);
    expect(callPrivate('extractGenericProductsFromResponse', { data: [{ id: 0 }] })).toEqual([]);
    expect(callPrivate('extractGenericProductsFromResponse', null)).toEqual([]);
    expect(callPrivate('isGenericProductLike', products[0])).toBeTrue();
    expect(callPrivate('isGenericProductLike', { id: 1 })).toBeFalse();
    expect(callPrivate('normalizeNonNegativeNumber', -1)).toBeNull();
    expect(callPrivate('normalizeNonNegativeNumber', ' 2.5 ')).toBe(2.5);
    expect(callPrivate('normalizeNonNegativeNumber', 'invalid')).toBeNull();
    expect(callPrivate('normalizeNonNegativeNumber', null)).toBeNull();
    expect(callPrivate('normalizePortionUnit', 'invalid')).toBeNull();
    expect(callPrivate('normalizeQuantityUnit', 'g')).toBe('g');
    expect(callPrivate('toCreateDto', {
      name: ' Rice ',
      minQuantityUnit: 1,
      minQuantityUnitType: 'portion',
      minQuantityMetric: 500,
      minQuantityMetricType: 'g',
    })).toEqual({
      name: 'Rice',
      minQuantityUnit: 1,
      minQuantityUnitType: 'portion',
      minQuantityMetric: 500,
      minQuantityMetricType: 'g',
    });
    expect(callPrivate('toFormValue', products[0])).toEqual({
      name: ' Rice ',
      minQuantityUnit: 2,
      minQuantityUnitType: 'portion',
      minQuantityMetric: 500,
      minQuantityMetricType: 'g',
    });

    const item = {
      id: '2',
      name: 'Rice',
      minQuantityUnit: 2,
      minQuantityUnitType: 'portion',
      minQuantityMetric: 500,
      minQuantityMetricType: 'g',
    } as Parameters<GenericProduct['onEditRequested']>[0];
    component.onEditRequested(item);
    expect(component.formMode).toBe('edit');
    expect(component.editingGenericProductId).toBe(2);
    component.onCancelForm();
    component.onFormSubmitted({
      mode: 'add',
      value: {
        name: ' New product ',
        minQuantityUnit: 1,
        minQuantityUnitType: null,
        minQuantityMetric: 0,
        minQuantityMetricType: null,
      },
    });
    expect(genericProductServiceMock.create).toHaveBeenCalled();
    component.editingGenericProductId = 2;
    component.onFormSubmitted({
      mode: 'edit',
      value: {
        name: ' Updated ',
        minQuantityUnit: 1,
        minQuantityUnitType: null,
        minQuantityMetric: 0,
        minQuantityMetricType: null,
      },
    });
    expect(genericProductServiceMock.update).toHaveBeenCalledWith(2, jasmine.anything());
    component.onDeleteRequested(item);
    expect(genericProductServiceMock.remove).toHaveBeenCalledWith(2);

    genericProductServiceMock.findAll.and.returnValue(throwError(() => new Error('load failed')));
    component.onRefreshRequested();
    expect(component.lastError).toEqual(jasmine.any(Error));
    genericProductServiceMock.findAll.and.returnValue(of([]));
    genericProductServiceMock.remove.and.returnValue(throwError(() => new Error('delete failed')));
    component.onDeleteRequested(item);
    expect(component.lastError).toEqual(jasmine.any(Error));
    component.onMenuClicked();
    expect(component.lastResponse).toEqual(jasmine.objectContaining({ info: jasmine.any(String) }));
  });
});

function privateMethod(
  component: GenericProduct,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}
