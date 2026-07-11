import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

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
      'Products',
      'Categories',
      'Generic products',
      'Tags',
    ]);
    expect(component.activeView).toBe('product');
    expect(fixture.nativeElement.querySelector('app-product-list')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-category')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-generic-product')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-tag')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Products');
    expect(fixture.nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Add product');
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
      .toContain('Add category');
    expect(nativeElement.querySelector('app-category section.app-page')).toBeNull();

    clickToggle(2);
    nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Generic products');
    expect(nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Add generic product');
    expect(nativeElement.querySelector('app-generic-product section.app-page')).toBeNull();

    clickToggle(3);
    nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('[data-testid="catalogue-panel-title"]')?.textContent)
      .toContain('Tags');
    expect(nativeElement.querySelector('[data-testid="catalogue-add-action"]')?.textContent)
      .toContain('Add tag');
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
    expect(fixture.nativeElement.textContent).not.toContain('Loading...');

    const tags$ = new Subject<never[]>();
    tagServiceMock.findAll.and.returnValue(tags$);

    clickToggle(3);
    expectHeaderActionsDisabled(true);

    tags$.next([]);
    fixture.detectChanges();

    expectHeaderActionsDisabled(false);
    expect(fixture.nativeElement.textContent).not.toContain('Loading...');
    expect(fixture.nativeElement.textContent).toContain('No tag available.');
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

  it('should filter the product list from the local search field', () => {
    component.products = [
      buildProduct({ id: 1, name: 'Pomme verte', barcode: '111' }),
      buildProduct({ id: 2, name: 'Riz blanc', barcode: '222' }),
    ];
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const searchInput = nativeElement.querySelector(
      '[data-testid="product-list-search"]',
    ) as HTMLInputElement;

    searchInput.value = 'riz';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-testid="product-row-2"]')).not.toBeNull();
    expect(nativeElement.querySelector('[data-testid="product-row-1"]')).toBeNull();
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

  it('should cover product normalization and response-shape helpers', () => {
    component.nutritionKeyOptions = [
      { key: 'PROTEIN', value: 'protein', label: 'Protein', allowedUnits: ['g'] },
    ];
    const callPrivate = privateMethod(component);
    const product = buildProduct({
      tags: [1, { id: 2 }, { name: ' Fresh ' }, { title: 'Pantry' }, { label: 'Organic' }, ' Fresh ', null],
      category: { id: 3, name: ' Produce ' },
      genericProduct: { title: 'Rice' },
      nutritionValues: [
        { id: '8', nutritionKey: 'protein', amount: '12.5', unit: 'g', reference: 'PER_100G' },
        { key: 'energy', amount: Number.NaN, nutrition_unit: 'kcal', per: 1000 },
        { amount: 1, unit: 'g' },
        null,
      ],
    });

    component.products = [product];
    expect(component.productListItems()[0]).toEqual(
      jasmine.objectContaining({
        tagNames: ['Fresh', 'Pantry', 'Organic'],
        category: 'Produce',
        genericProduct: 'Rice',
        nutritionValuesCount: 2,
      }),
    );

    expect(callPrivate('extractProductsFromResponse', [product, { id: 'bad' }])).toEqual([product]);
    expect(callPrivate('extractProductsFromResponse', product)).toEqual([product]);
    expect(callPrivate('extractProductsFromResponse', { data: [product] })).toEqual([product]);
    expect(callPrivate('extractProductsFromResponse', { payload: [{ id: 0, name: 'bad' }] })).toEqual([
      { id: 0, name: 'bad' },
    ]);
    expect(callPrivate('extractProductsFromResponse', null)).toEqual([]);
    expect(callPrivate('extractCategoriesFromResponse', { categories: [{ id: 2, name: 'Fruit' }] })).toEqual([
      { id: 2, name: 'Fruit' },
    ]);
    expect(callPrivate('extractGenericProductsFromResponse', { items: [{ id: 2, name: 'Rice' }] })).toEqual([
      { id: 2, name: 'Rice' },
    ]);
    expect(callPrivate('extractTagsFromResponse', { tags: [{ id: 2, name: 'Fresh' }] })).toEqual([
      { id: 2, name: 'Fresh' },
    ]);

    const formValue = {
      name: ' Product ',
      barcode: null,
      categoryId: 3,
      tagIds: [2, 4],
      genericProductId: 5,
      unitType: 'Paquet',
      quantityPerUnit: 2,
      quantityUnit: 'g',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: 2,
      priceUnit: 'kg',
      priceEffectiveFrom: null,
      url: null,
      memo: null,
      nutritionValues: [
        { nutritionKey: ' protein ', amount: -2, unit: 'g', reference: 'PER_100G' },
        { nutritionKey: ' ', amount: Number.NaN, unit: 'g', reference: 'PER_100G' },
      ],
    };
    expect(callPrivate('toCreateDto', formValue)).toEqual(
      jasmine.objectContaining({
        name: ' Product ',
        nutritionValuesCreated: [
          { nutritionKey: 'PROTEIN', amount: 0, unit: 'g', reference: 'PER_100G' },
        ],
      }),
    );
    expect(callPrivate('toUpdateDto', formValue, product)).toEqual(
      jasmine.objectContaining({
        categoryId: 3,
        tagIdsToAdd: [4],
        tagIdsToRemove: [1],
      }),
    );
    expect(callPrivate('toUpdateDto', { ...formValue, categoryId: null, tagIds: [] }, product)).toEqual(
      jasmine.objectContaining({ clearCategory: true, tagIdsToRemove: [1, 2] }),
    );
    expect(callPrivate('toFormValue', product)).toEqual(
      jasmine.objectContaining({ categoryId: 3, genericProductId: null, tagIds: [1, 2] }),
    );

    expect(callPrivate('resolveTagIds', [1, { id: '2' }, { id: 2 }, 0, 'bad'])).toEqual([1, 2]);
    expect(callPrivate('resolveTagNames', [' Fresh ', { label: 'Organic' }, { key: 'Seasonal' }, {}])).toEqual([
      'Fresh',
      'Organic',
      'Seasonal',
    ]);
    expect(callPrivate('resolveLinkedEntityName', null)).toBe('None');
    expect(callPrivate('resolveLinkedEntityName', { label: 'Organic' })).toBe('Organic');
    expect(callPrivate('resolveLinkedEntityName', {})).toBe('None');
    expect(callPrivate('readPositiveInteger', '4')).toBe(4);
    expect(callPrivate('readPositiveInteger', 0)).toBeUndefined();
    expect(callPrivate('readFiniteNumber', '12.5')).toBe(12.5);
    expect(callPrivate('readFiniteNumber', ' ')).toBeNull();
    expect(callPrivate('readFiniteNumber', true)).toBeNull();
    expect(callPrivate('extractNutritionKeyValue', { nutritionKey: 'PROTEIN' })).toBe('protein');
    expect(callPrivate('extractNutritionKeyValue', { label: 'Unknown' })).toBe('UNKNOWN');
    expect(callPrivate('extractNutritionUnitValue', { uom: 'kcal' })).toBe('KCAL');
    expect(callPrivate('extractNutritionReferenceValue', { reference: '100ml' })).toBe('PER_100ML');
    expect(callPrivate('extractNutritionReferenceValue', { per: 1000 })).toBe('PER_100ML');
    expect(callPrivate('extractNutritionReferenceValue', {})).toBe('PER_100G');
    expect(callPrivate('readStringFromCandidates', { first: 3 }, ['missing', 'first'])).toBe('3');
    expect(callPrivate('normalizeUnitType', 'invalid')).toBe('Paquet');
    expect(callPrivate('normalizeQuantityUnit', ' KG ')).toBe('kg');
    expect(callPrivate('normalizePortionUnit', 'invalid')).toBeNull();
    expect(callPrivate('normalizePriceUnit', ' ML ')).toBe('ml');
    expect(callPrivate('normalizeProductSearchValue', ' Épicerie ')).toBe('epicerie');
    expect(callPrivate('matchesProductSearch', component.productListItems()[0], 'organic')).toBeTrue();
    expect((callPrivate('sortByName', [{ name: 'z' }, { name: 'A' }]) as { name: string }[]).map((item) => item.name)).toEqual([
      'A',
      'z',
    ]);
  });

  function resetSpyCalls(): void {
    productServiceMock.setBaseUrl.calls.reset();
    productServiceMock.findAll.calls.reset();
    productServiceMock.create.calls.reset();
    productServiceMock.update.calls.reset();
    productServiceMock.remove.calls.reset();
    productServiceMock.findAll.and.returnValue(of([]));

    metaServiceMock.setBaseUrl.calls.reset();
    metaServiceMock.getQuantityUnits.calls.reset();
    metaServiceMock.getNutritionKeys.calls.reset();
    metaServiceMock.getQuantityUnits.and.returnValue(of([]));
    metaServiceMock.getNutritionKeys.and.returnValue(of([]));

    categoryServiceMock.setBaseUrl.calls.reset();
    categoryServiceMock.findAll.calls.reset();
    categoryServiceMock.create.calls.reset();
    categoryServiceMock.update.calls.reset();
    categoryServiceMock.remove.calls.reset();
    categoryServiceMock.findAll.and.returnValue(of([]));

    genericProductServiceMock.setBaseUrl.calls.reset();
    genericProductServiceMock.findAll.calls.reset();
    genericProductServiceMock.create.calls.reset();
    genericProductServiceMock.update.calls.reset();
    genericProductServiceMock.remove.calls.reset();
    genericProductServiceMock.findAll.and.returnValue(of([]));

    tagServiceMock.setBaseUrl.calls.reset();
    tagServiceMock.findAll.calls.reset();
    tagServiceMock.create.calls.reset();
    tagServiceMock.update.calls.reset();
    tagServiceMock.remove.calls.reset();
    tagServiceMock.findAll.and.returnValue(of([]));
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

function privateMethod(
  component: Product,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}

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
