import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Product } from './product';
import { CategoryService } from '../../services/category-service';
import { GenericProductService } from '../../services/generic-product-service';
import { ProductService } from '../../services/product-service';
import { MetaService } from '../../services/meta-service';
import { TagService } from '../../services/tag-service';
import type { Product as ProductModel } from '../../services/product-service';

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
    resetSpyCalls();

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
      'Produits',
      'Categories',
      'Produits generiques',
      'Tags',
    ]);
    expect(component.activeView).toBe('product');
    expect(fixture.nativeElement.querySelector('app-product-list')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-category')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-generic-product')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-tag')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Produits');
    expect(fixture.nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Ajouter un produit');
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

  it('should update the panel actions when switching embedded views', () => {
    clickToggle(1);

    let nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Categories');
    expect(nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Ajouter une categorie');
    expect(nativeElement.querySelector('app-category section.app-page')).toBeNull();

    clickToggle(2);
    nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Produits generiques');
    expect(nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Ajouter un produit generique');
    expect(nativeElement.querySelector('app-generic-product section.app-page')).toBeNull();

    clickToggle(3);
    nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Tags');
    expect(nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Ajouter un tag');
    expect(nativeElement.querySelector('app-tag section.app-page')).toBeNull();
  });

  it('should enable linked-view actions after empty async responses', () => {
    const genericProducts$ = new Subject<never[]>();
    genericProductServiceMock.findAll.and.returnValue(genericProducts$);

    clickToggle(2);
    expectHeaderActionsDisabled(true);

    genericProducts$.next([]);
    fixture.detectChanges();

    expectHeaderActionsDisabled(false);
    expect(fixture.nativeElement.textContent).not.toContain('Chargement...');

    const tags$ = new Subject<never[]>();
    tagServiceMock.findAll.and.returnValue(tags$);

    clickToggle(3);
    expectHeaderActionsDisabled(true);

    tags$.next([]);
    fixture.detectChanges();

    expectHeaderActionsDisabled(false);
    expect(fixture.nativeElement.textContent).not.toContain('Chargement...');
    expect(fixture.nativeElement.textContent).toContain('Aucun tag disponible.');
  });

  it('should open the generic product and tag dialogs from the shared add action', () => {
    clickToggle(2);

    let nativeElement = fixture.nativeElement as HTMLElement;
    let addButton = nativeElement.querySelector(
      '[data-testid="catalogue-add-action"]',
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-testid="generic-product-dialog"]')).not.toBeNull();

    const closeButton = nativeElement.querySelector(
      '[data-testid="generic-product-dialog"] button',
    ) as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    clickToggle(3);
    nativeElement = fixture.nativeElement as HTMLElement;
    addButton = nativeElement.querySelector(
      '[data-testid="catalogue-add-action"]',
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-testid="tag-dialog"]')).not.toBeNull();
  });

  it('should reload products when returning to product after linked data changes', () => {
    productServiceMock.findAll.calls.reset();

    component.onActiveViewChange('category');
    component.onLinkedDataChanged();

    expect(component.linkedDataDirty).toBeTrue();
    expect(productServiceMock.findAll).not.toHaveBeenCalled();

    component.onActiveViewChange('product');

    expect(component.activeView).toBe('product');
    expect(component.linkedDataDirty).toBeFalse();
    expect(productServiceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('should render products after an async load without switching views', async () => {
    const products$ = new Subject<ProductModel[]>();
    productServiceMock.findAll.and.returnValue(products$);
    fixture.autoDetectChanges();

    component.onRefreshRequested();
    products$.next([buildProduct({ id: 42, name: 'Produit async' })]);
    products$.complete();

    await fixture.whenStable();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(component.activeView).toBe('product');
    expect(nativeElement.querySelector('[data-testid="product-row-42"]')).not.toBeNull();
    expect(nativeElement.textContent).toContain('Produit async');
  });

  it('should refresh the current product form state after reloading products', () => {
    component.products = [
      buildProduct({
        id: 1,
        name: 'Ancien produit',
        category: { id: 3, name: 'Ancienne categorie' },
      }),
    ];
    component.onEditRequested({
      id: '1',
      name: 'Ancien produit',
      barcode: null,
      unitType: 'Paquet',
      quantityPerUnit: 1,
      quantityUnit: 'g',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: null,
      tagNames: [],
      nutritionValuesCount: 0,
      category: 'Ancienne categorie',
      genericProduct: null,
    });
    productServiceMock.findAll.and.returnValue(
      of([
        buildProduct({
          id: 1,
          name: 'Produit rafraichi',
          category: { id: 7, name: 'Nouvelle categorie' },
        }),
      ]),
    );

    component.onRefreshRequested();

    expect(component.formInitialValue?.name).toBe('Produit rafraichi');
    expect(component.formInitialValue?.categoryId).toBe(7);
  });

  function buildProduct(overrides: Partial<ProductModel> = {}): ProductModel {
    const baseProduct: ProductModel = {
      id: 1,
      name: 'Produit',
      barcode: null,
      category: null,
      tags: [],
      genericProduct: null,
      unitType: 'Paquet',
      quantityPerUnit: 1,
      quantityUnit: 'g',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: null,
      url: null,
      memo: null,
      nutritionValues: [],
    };

    return { ...baseProduct, ...overrides };
  }

  function resetSpyCalls(): void {
    productServiceMock.setBaseUrl.calls.reset();
    productServiceMock.findAll.calls.reset();
    productServiceMock.create.calls.reset();
    productServiceMock.update.calls.reset();
    productServiceMock.remove.calls.reset();

    metaServiceMock.setBaseUrl.calls.reset();
    metaServiceMock.getQuantityUnits.calls.reset();
    metaServiceMock.getNutritionKeys.calls.reset();

    categoryServiceMock.setBaseUrl.calls.reset();
    categoryServiceMock.findAll.calls.reset();
    categoryServiceMock.create.calls.reset();
    categoryServiceMock.update.calls.reset();
    categoryServiceMock.remove.calls.reset();

    genericProductServiceMock.setBaseUrl.calls.reset();
    genericProductServiceMock.findAll.calls.reset();
    genericProductServiceMock.create.calls.reset();
    genericProductServiceMock.update.calls.reset();
    genericProductServiceMock.remove.calls.reset();

    tagServiceMock.setBaseUrl.calls.reset();
    tagServiceMock.findAll.calls.reset();
    tagServiceMock.create.calls.reset();
    tagServiceMock.update.calls.reset();
    tagServiceMock.remove.calls.reset();
  }

  function expectHeaderActionsDisabled(expected: boolean): void {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const refreshButton = nativeElement.querySelector(
      '[data-testid="catalogue-refresh-action"]',
    ) as HTMLButtonElement;
    const addButton = nativeElement.querySelector(
      '[data-testid="catalogue-add-action"]',
    ) as HTMLButtonElement;

    expect(refreshButton.disabled).toBe(expected);
    expect(addButton.disabled).toBe(expected);
  }

  function clickToggle(index: number): void {
    const toggleButtons = fixture.nativeElement.querySelectorAll('mat-button-toggle button');
    (toggleButtons[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }
});
