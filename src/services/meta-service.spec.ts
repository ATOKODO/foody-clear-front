import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { MetaService } from './meta-service';

describe('MetaService', () => {
  let service: MetaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(MetaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and normalize quantity units from backend payload', () => {
    const backendPayload = [
      {
        key: 'MG',
        value: 'mg',
        label: 'Milligramme (mg)',
        dimension: 'mass',
        factor: 0.001,
      },
      {
        key: 'G',
        value: 'g',
        label: 'Gramme (g)',
        dimension: 'mass',
        factor: 1,
      },
      {
        key: 'UNIT',
        value: 'unit',
        label: 'Unite (unit)',
        dimension: 'count',
      },
    ];

    let received: unknown;
    service.getQuantityUnits().subscribe((units) => {
      received = units;
    });

    const req = httpMock.expectOne('http://localhost:3000/meta/quantity-units');
    expect(req.request.method).toBe('GET');
    req.flush(backendPayload);

    expect(received).toEqual(backendPayload);
  });

  it('should use updated baseUrl when fetching units', () => {
    service.setBaseUrl('http://api.test.local/');

    service.getQuantityUnits().subscribe();

    const req = httpMock.expectOne('http://api.test.local/meta/quantity-units');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should normalize nested quantity units and remove invalid duplicates', () => {
    service.getQuantityUnits().subscribe((units) => {
      expect(units).toEqual([
        { key: 'G', value: 'g', label: 'g' },
        { key: 'KG', value: 'kg', label: 'Kilogram', dimension: 'mass', factor: 1 },
      ]);
    });

    const req = httpMock.expectOne('http://localhost:3000/meta/quantity-units');
    req.flush({ units: [' g ', ' ', { value: 'kg', label: 'Kilogram', dimension: 'mass', factor: 1 }, { value: 'kg' }, 42] });
  });

  it('should normalize nutrition keys from nested and primitive payloads', () => {
    service.getNutritionKeys().subscribe((keys) => {
      expect(keys).toEqual([
        { key: 'PROTEIN', value: 'protein', label: 'protein', allowedUnits: [] },
        { key: 'CARBS', value: 'carbs', label: 'Carbs', allowedUnits: ['g', 'mg'] },
      ]);
    });

    const req = httpMock.expectOne('http://localhost:3000/meta/nutrition-keys');
    req.flush({ keys: [' protein ', { value: 'carbs', label: 'Carbs', allowedUnits: [' g ', 4, 'mg'] }, { value: 'carbs' }, {}] });

    service.getNutritionKeys().subscribe((keys) => expect(keys).toEqual([]));
    httpMock.expectOne('http://localhost:3000/meta/nutrition-keys').flush('invalid');
  });
});
