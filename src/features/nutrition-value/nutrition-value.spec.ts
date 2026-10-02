import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { NutritionValues } from './nutrition-value';

describe('NutritionValues', () => {
  let component: NutritionValues;
  let fixture: ComponentFixture<NutritionValues>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionValues],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionValues);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should execute create, read, update, delete and form helper flows', () => {
    component.form.patchValue({
      nutritionKey: ' PROTEIN ',
      amount: 12.5,
      unit: ' G ',
      reference: 'PER_100G',
      productId: 4,
    });
    component.create();
    let request = httpMock.expectOne('http://localhost:3000/nutrition-value');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nutritionKey: 'PROTEIN',
      amount: 12.5,
      unit: 'G',
      reference: 'PER_100G',
      productId: 4,
    });
    request.flush({ id: 1 });
    expect(component.lastResponse).toEqual({ id: 1 });

    component.getAll();
    request = httpMock.expectOne('http://localhost:3000/nutrition-value');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    component.form.patchValue({ id: 2 });
    component.getOne();
    request = httpMock.expectOne('http://localhost:3000/nutrition-value/2');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 2 });

    component.form.patchValue({ id: 2, nutritionKey: ' PROTEIN ', amount: 20, unit: 'G', reference: '', productId: null });
    component.update();
    request = httpMock.expectOne('http://localhost:3000/nutrition-value/2');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ nutritionKey: 'PROTEIN', amount: 20, unit: 'G' });
    request.flush({ id: 2, amount: 20 });

    component.delete();
    request = httpMock.expectOne('http://localhost:3000/nutrition-value/2');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    expect(component.lastResponse).toEqual({ deleted: true, id: 2 });

    component.fillDemoCreate();
    expect(component.form.value).toEqual(jasmine.objectContaining({ nutritionKey: 'PROTEIN', productId: 1 }));
    component.clear();
    expect(component.form.value.nutritionKey).toBe('');
    expect(component.lastResponse).toBeNull();
  });

  it('should report validation errors without sending requests', () => {
    component.create();
    expect(component.lastError).toEqual(jasmine.any(Error));
    component.getOne();
    expect(component.lastError).toContain('Veuillez renseigner un id');
    component.update();
    expect(component.lastError).toContain('Veuillez renseigner un id');
    component.delete();
    expect(component.lastError).toContain('Veuillez renseigner un id');

    component.form.patchValue({ id: 2 });
    component.update();
    expect(component.lastError).toBe('No field to update.');
  });

  it('should expose the service base URL and handle request errors', () => {
    component.baseUrl = 'http://api.example.test/';
    expect(component.baseUrl).toBe('http://api.example.test');

    component.form.patchValue({
      nutritionKey: 'PROTEIN',
      amount: 10,
      unit: 'G',
      reference: 'PER_100G',
      productId: 4,
      id: 2,
    });

    component.create();
    let request = httpMock.expectOne('http://api.example.test/nutrition-value');
    request.flush('create failed', { status: 500, statusText: 'Server error' });
    expect(component.lastError).toBeTruthy();

    component.getAll();
    request = httpMock.expectOne('http://api.example.test/nutrition-value');
    request.flush('list failed', { status: 500, statusText: 'Server error' });
    expect(component.lastError).toBeTruthy();

    component.getOne();
    request = httpMock.expectOne('http://api.example.test/nutrition-value/2');
    request.flush('read failed', { status: 500, statusText: 'Server error' });
    expect(component.lastError).toBeTruthy();

    component.update();
    request = httpMock.expectOne('http://api.example.test/nutrition-value/2');
    request.flush('update failed', { status: 500, statusText: 'Server error' });
    expect(component.lastError).toBeTruthy();

    component.delete();
    request = httpMock.expectOne('http://api.example.test/nutrition-value/2');
    request.flush('delete failed', { status: 500, statusText: 'Server error' });
    expect(component.lastError).toBeTruthy();
  });
});
