import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OpenFoodFactsService, isProductBarcode } from './open-food-facts-service';
import { ProductService } from './product-service';

describe('OpenFoodFactsService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('reads directly from Open Food Facts regardless of the configured app API URL', () => {
    TestBed.inject(ProductService).setBaseUrl('http://localhost:9999');
    const next = jasmine.createSpy('product');
    TestBed.inject(OpenFoodFactsService).lookup('00012345678905').subscribe(next);
    const request = TestBed.inject(HttpTestingController).expectOne((req) => req.url === 'https://world.openfoodfacts.net/api/v2/product/00012345678905.json');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Basic b2ZmOm9mZg==');
    expect(request.request.headers.get('X-User-Agent')).toContain('FoodyClear/');
    expect(request.request.params.get('lc')).toBe('fr');
    expect(request.request.params.get('fields')).toContain('nutriments');
    request.flush({ status: 1, product: {
      product_name: 'Test', product_name_fr: 'Produit français', brands: 'Marque',
      product_quantity: 400, product_quantity_unit: 'g', quantity: '400 g',
      ingredients_text_fr: 'Lait, noix', allergens_tags: ['en:milk', 'en:nuts'], nutrition_grades: 'e',
      nutriments: { proteins_100g: 6.3, sugars_100g: 0, salt_100g: ' ', fat_100g: -1 },
    } });
    expect(next).toHaveBeenCalledWith(jasmine.objectContaining({
      barcode: '00012345678905', name: 'Produit français', quantityPerUnit: 400,
      quantityUnit: 'g', ingredients: 'Lait, noix', allergens: ['Lait', 'Fruits à coque'], nutriScore: 'E',
      sourceUrl: 'https://world.openfoodfacts.net/product/00012345678905',
      nutritionValues: [
        { nutritionKey: 'SUGARS', amount: 0, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'PROTEIN', amount: 6.3, unit: 'G', reference: 'PER_100G' },
      ],
    }));
  });

  it('keeps normalized liquid quantities and per-100ml nutrient values', () => {
    const next = jasmine.createSpy('product');
    TestBed.inject(OpenFoodFactsService).lookup('12345678').subscribe(next);
    TestBed.inject(HttpTestingController).expectOne((req) => req.url.includes('/12345678.json')).flush({
      status: 1, product: { product_quantity: 1000, product_quantity_unit: 'l', nutriments: { 'energy-kcal_100g': 42 } },
    });
    expect(next).toHaveBeenCalledWith(jasmine.objectContaining({ quantityPerUnit: 1000, quantityUnit: 'ml',
      nutritionValues: [{ nutritionKey: 'ENERGY_KCAL', amount: 42, unit: 'KCAL', reference: 'PER_100ML' }],
    }));
  });

  it('reports a missing product even when the API returns HTTP 200', () => {
    const error = jasmine.createSpy('error');
    TestBed.inject(OpenFoodFactsService).lookup('12345678').subscribe({ error });
    TestBed.inject(HttpTestingController).expectOne((req) => req.url.includes('/12345678.json')).flush({ status: 0 });
    expect(error).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));
    expect(error.calls.mostRecent().args[0].status).toBe(404);
  });

  it('rejects an unexpected payload instead of importing empty facts', () => {
    const error = jasmine.createSpy('error');
    TestBed.inject(OpenFoodFactsService).lookup('12345678').subscribe({ error });
    TestBed.inject(HttpTestingController).expectOne((req) => req.url.includes('/12345678.json')).flush({ status: 1 });
    expect(error.calls.mostRecent().args[0].status).toBe(502);
  });

  it('preserves upstream rate-limit errors', () => {
    const error = jasmine.createSpy('error');
    TestBed.inject(OpenFoodFactsService).lookup('12345678').subscribe({ error });
    TestBed.inject(HttpTestingController).expectOne((req) => req.url.includes('/12345678.json')).flush({}, { status: 429, statusText: 'Too Many Requests' });
    expect(error.calls.mostRecent().args[0].status).toBe(429);
  });

  it('rejects invalid codes before making a request', () => {
    const error = jasmine.createSpy('error');
    TestBed.inject(OpenFoodFactsService).lookup('123').subscribe({ error });
    TestBed.inject(HttpTestingController).expectNone(() => true);
    expect(error.calls.mostRecent().args[0].status).toBe(400);
  });

  it('supports product barcode formats and rejects URLs, incomplete codes and punctuation', () => {
    for (const barcode of ['12345678', '012345678905', '3017624010701', '00012345678905']) expect(isProductBarcode(barcode)).toBeTrue();
    for (const barcode of ['', '123', '123456789', 'https://example.com', '1234-5678']) expect(isProductBarcode(barcode)).toBeFalse();
  });
});
