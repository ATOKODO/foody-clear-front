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
});
