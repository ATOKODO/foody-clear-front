import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Product } from './product';
import { CategoryService } from '../../services/category-service';
import { GenericProductService } from '../../services/generic-product-service';
import { ProductService } from '../../services/product-service';
import { MetaService } from '../../services/meta-service';
import { TagService } from '../../services/tag-service';

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

  const categoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 1, name: 'Category' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 1, name: 'Category' })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  const genericProductServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 1, name: 'Generic' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 1, name: 'Generic' })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  const tagServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 1, name: 'Tag' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 1, name: 'Tag' })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [
        provideNoopAnimations(),
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: GenericProductService, useValue: genericProductServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: MetaService, useValue: metaServiceMock },
        { provide: TagService, useValue: tagServiceMock },
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

  it('should render the toggle hub and show product by default', () => {
    const toggleElements = fixture.nativeElement.querySelectorAll(
      'mat-button-toggle',
    ) as NodeListOf<Element>;
    const toggleLabels = Array.from(toggleElements).map((toggle) =>
      toggle.textContent?.trim().replace(/\s+/g, ' '),
    );

    expect(toggleLabels).toEqual([
      'Product',
      'Category',
      'Generic product',
      'Tag',
    ]);
    expect(component.activeView).toBe('product');
    expect(fixture.nativeElement.querySelector('app-product-list')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-category')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-generic-product')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-tag')).toBeNull();
  });

  it('should show linked features when selecting a toggle', () => {
    clickToggle(1);
    expect(component.activeView).toBe('category');
    expect(fixture.nativeElement.querySelector('app-category')).not.toBeNull();

    clickToggle(2);
    expect(component.activeView).toBe('genericProduct');
    expect(fixture.nativeElement.querySelector('app-generic-product')).not.toBeNull();

    clickToggle(3);
    expect(component.activeView).toBe('tag');
    expect(fixture.nativeElement.querySelector('app-tag')).not.toBeNull();
  });

  function clickToggle(index: number): void {
    const toggleButtons = fixture.nativeElement.querySelectorAll('mat-button-toggle button');
    (toggleButtons[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }
});
