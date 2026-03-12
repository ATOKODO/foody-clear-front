import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GenericProduct } from './generic-product';
import { GenericProductService } from '../../services/generic-product-service';

describe('GenericProduct', () => {
  let component: GenericProduct;
  let fixture: ComponentFixture<GenericProduct>;
  const genericProductServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(
      of({ id: 1, name: 'Riz', minQuantityUnit: 1, minQuantityMetric: 500 }),
    ),
    update: jasmine.createSpy('update').and.returnValue(
      of({ id: 1, name: 'Riz', minQuantityUnit: 1, minQuantityMetric: 500 }),
    ),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
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
});
