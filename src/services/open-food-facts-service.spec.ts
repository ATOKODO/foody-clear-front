import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OpenFoodFactsService, isProductBarcode } from './open-food-facts-service';
import { ProductService } from './product-service';

describe('OpenFoodFactsService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('reads from the configured backend rather than the external API', () => {
    TestBed.inject(ProductService).setBaseUrl('/api');
    const next = jasmine.createSpy('product');
    TestBed.inject(OpenFoodFactsService).lookup('00012345678905').subscribe(next);
    const request = TestBed.inject(HttpTestingController).expectOne('/api/open-food-facts/products/00012345678905');
    expect(request.request.method).toBe('GET');
    request.flush({ barcode: '00012345678905', name: 'Test' });
    expect(next).toHaveBeenCalledWith({ barcode: '00012345678905', name: 'Test' });
  });

  it('supports product barcode formats and rejects URLs, incomplete codes and punctuation', () => {
    for (const barcode of ['12345678', '012345678905', '3017624010701', '00012345678905']) expect(isProductBarcode(barcode)).toBeTrue();
    for (const barcode of ['', '123', '123456789', 'https://example.com', '1234-5678']) expect(isProductBarcode(barcode)).toBeFalse();
  });
});
