import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Product } from './product';
import { ProductService } from '../../services/product-service';
import { MetaService } from '../../services/meta-service';

describe('Product', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;
  const productServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 1, name: 'Test' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 1, name: 'Test' })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  const metaServiceMock = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getQuantityUnits: jasmine.createSpy('getQuantityUnits').and.returnValue(of([])),
    getNutritionKeys: jasmine.createSpy('getNutritionKeys').and.returnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: MetaService, useValue: metaServiceMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Product);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
