import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { Inventory } from './inventory';
import { InventoryService } from '../../services/inventory-service';
import { ProductService } from '../../services/product-service';

describe('Inventory', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;

  const linkedProducts = [
    {
      id: 41,
      inventoryId: 4,
      productId: 1,
      qtyOnHandInUnits: 2,
      qtyOnHandNormalized: 2,
      product: {
        id: 1,
        name: 'Chicken',
        unitType: 'Paquet',
        quantityPerUnit: 1,
        quantityUnit: 'unit',
        portionCount: 2,
        portionUnit: 'portion',
        portionQuantityNormalized: 0.5,
        nutritionValues: [],
        price: 6,
        priceUnit: 'kg',
      },
    },
  ];

  const inventoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      {
        id: 4,
        name: 'Stock principal',
        inventoryProducts: linkedProducts,
      },
    ])),
    findProducts: jasmine.createSpy('findProducts').and.returnValue(of(linkedProducts)),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 5, name: 'Nouveau stock' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 4, name: 'Stock principal' })),
    addProducts: jasmine.createSpy('addProducts').and.returnValue(of({ ok: true })),
    removeProducts: jasmine.createSpy('removeProducts').and.returnValue(of({ ok: true })),
    reconcileProducts: jasmine.createSpy('reconcileProducts').and.returnValue(of({ ok: true })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  const productServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      {
        id: 1,
        name: 'Chicken',
        unitType: 'Paquet',
        quantityPerUnit: 1,
        quantityUnit: 'unit',
        portionCount: 2,
        portionUnit: 'portion',
        portionQuantityNormalized: 0.5,
        nutritionValues: [],
        price: 6,
        priceUnit: 'kg',
      },
      {
        id: 2,
        name: 'Rice',
        unitType: 'Paquet',
        quantityPerUnit: 500,
        quantityUnit: 'g',
        portionCount: 1,
        portionUnit: 'portion',
        portionQuantityNormalized: 125,
        nutritionValues: [],
      },
    ])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventory],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    inventoryServiceMock.setBaseUrl.calls.reset();
    inventoryServiceMock.findAll.calls.reset();
    inventoryServiceMock.findAll.and.returnValue(of([
      {
        id: 4,
        name: 'Stock principal',
        inventoryProducts: linkedProducts,
      },
    ]));
    inventoryServiceMock.findProducts.calls.reset();
    inventoryServiceMock.findProducts.and.returnValue(of(linkedProducts));
    inventoryServiceMock.create.calls.reset();
    inventoryServiceMock.create.and.returnValue(of({ id: 5, name: 'Nouveau stock' }));
    inventoryServiceMock.update.calls.reset();
    inventoryServiceMock.update.and.returnValue(of({ id: 4, name: 'Stock principal' }));
    inventoryServiceMock.addProducts.calls.reset();
    inventoryServiceMock.addProducts.and.returnValue(of({ ok: true }));
    inventoryServiceMock.removeProducts.calls.reset();
    inventoryServiceMock.removeProducts.and.returnValue(of({ ok: true }));
    inventoryServiceMock.reconcileProducts.calls.reset();
    inventoryServiceMock.reconcileProducts.and.returnValue(of({ ok: true }));
    inventoryServiceMock.remove.calls.reset();
    inventoryServiceMock.remove.and.returnValue(of(void 0));

    productServiceMock.setBaseUrl.calls.reset();
    productServiceMock.findAll.calls.reset();
    productServiceMock.findAll.and.returnValue(of([
      {
        id: 1,
        name: 'Chicken',
        unitType: 'Paquet',
        quantityPerUnit: 1,
        quantityUnit: 'unit',
        portionCount: 2,
        portionUnit: 'portion',
        portionQuantityNormalized: 0.5,
        nutritionValues: [],
        price: 6,
        priceUnit: 'kg',
      },
      {
        id: 2,
        name: 'Rice',
        unitType: 'Paquet',
        quantityPerUnit: 500,
        quantityUnit: 'g',
        portionCount: 1,
        portionUnit: 'portion',
        portionQuantityNormalized: 125,
        nutritionValues: [],
      },
    ]));
    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the figma-aligned inventory shell', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="inventory-panel-title"]')?.textContent)
      .toContain('Inventories');
    expect(element.querySelector('[data-testid="inventory-add-action"]')?.textContent)
      .toContain('Add inventory');
    expect(element.querySelector('[data-testid="inventory-select-4"]')).not.toBeNull();
    expect(element.textContent).toContain('Current stock');
  });

  it('should use backend productCount in inventory list items', () => {
    inventoryServiceMock.findAll.and.returnValue(of([
      {
        id: 4,
        name: 'Stock principal',
        productCount: 7,
        inventoryProducts: linkedProducts,
      },
    ]));

    component.onRefreshRequested();

    expect(component.inventoryListItems).toEqual([
      {
        id: '4',
        name: 'Stock principal',
        productCount: 7,
      },
    ]);
  });

  it('should render inventories after an async refresh without another interaction', async () => {
    const inventories$ = new Subject<unknown[]>();
    const products$ = new Subject<unknown[]>();
    inventoryServiceMock.findAll.and.returnValue(inventories$);
    productServiceMock.findAll.and.returnValue(products$);
    fixture.autoDetectChanges();

    component.onRefreshRequested();
    products$.next([]);
    products$.complete();
    inventories$.next([
      {
        id: 6,
        name: 'Stock async',
        productCount: 3,
        inventoryProducts: [],
      },
    ]);
    inventories$.complete();

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="inventory-select-6"]')).not.toBeNull();
    expect(element.textContent).toContain('Stock async');
    expect(element.textContent).not.toContain('Chargement...');
    expect(element.textContent).not.toContain('Produits...');

    const refreshButton = element.querySelector(
      '[data-testid="inventory-refresh-action"]',
    ) as HTMLButtonElement;
    const addButton = element.querySelector(
      '[data-testid="inventory-add-action"]',
    ) as HTMLButtonElement;
    expect(refreshButton.disabled).toBeFalse();
    expect(addButton.disabled).toBeFalse();
  });

  it('should create an inventory with selected products', () => {
    component.onAddRequested();
    component.onCreateProductsSelected(component.productListItems);
    component.createSelectedProductRows[0].qty = 2;
    component.createSelectedProductRows[1].qty = 3;

    component.onFormSubmitted({
      mode: 'add',
      value: { name: 'Nouveau stock' },
    });

    expect(inventoryServiceMock.create).toHaveBeenCalledWith({
      name: 'Nouveau stock',
      products: [
        { productId: 1, qty: 2, purchaseAccountingMode: 'paid' },
        { productId: 2, qty: 3, purchaseAccountingMode: 'free' },
      ],
    });
  });

  it('should add selected products to the current inventory', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.openAddProductsModal();
    component.onProductsToAddSelected([component.productListItems[1]]);
    component.addSelectedProductRows[0].qty = 4;

    component.onAddSelectedProducts();

    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 2, qty: 4, purchaseAccountingMode: 'free' }],
    });
  });

  it('should send qtyUnit when creating inventory stock by portion', () => {
    component.onAddRequested();
    component.onCreateProductsSelected([component.productListItems[1]]);
    component.createSelectedProductRows[0].qty = 2;
    component.createSelectedProductRows[0].qtyUnit = 'portion';

    component.onFormSubmitted({
      mode: 'add',
      value: { name: 'Stock portionne' },
    });

    expect(inventoryServiceMock.create).toHaveBeenCalledWith({
      name: 'Stock portionne',
      products: [{ productId: 2, qty: 2, qtyUnit: 'portion', purchaseAccountingMode: 'free' }],
    });
  });

  it('should send qtyUnit when adding stock by portion', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.openAddProductsModal();
    component.onProductsToAddSelected([component.productListItems[1]]);
    component.addSelectedProductRows[0].qty = 3;
    component.addSelectedProductRows[0].qtyUnit = 'portion';

    component.onAddSelectedProducts();

    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 2, qty: 3, qtyUnit: 'portion', purchaseAccountingMode: 'free' }],
    });
  });

  it('should allow excluding a stock addition from statistics', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.openAddProductsModal();
    component.onProductsToAddSelected([component.productListItems[0]]);
    component.addSelectedProductRows[0].qty = 1;
    component.addSelectedProductRows[0].purchaseAccountingMode = 'excluded';

    component.onAddSelectedProducts();

    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 1, qty: 1, purchaseAccountingMode: 'excluded' }],
    });
  });

  it('should keep already linked products visible in the add modal list', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });

    expect(component.addableProductListItems.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('should allow adding more quantity to an already linked product', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.openAddProductsModal();
    component.onProductsToAddSelected([component.productListItems[0]]);
    component.addSelectedProductRows[0].qty = 4;

    component.onAddSelectedProducts();

    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 1, qty: 4, purchaseAccountingMode: 'paid' }],
    });
  });

  it('should open edit mode with inline product management already visible', async () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const headerActions = Array.from(
      element.querySelectorAll('.inventory-form__header-actions button'),
    ).map((button) => button.textContent?.trim());

    expect(component.activeModal).toBeNull();
    expect(component.manageProductRows.length).toBe(1);
    expect(headerActions).toEqual(['Open add products', 'Options']);
    expect(element.querySelector('.inventory-manage-products')?.textContent).toContain(
      'Manage products',
    );
    expect(element.textContent).not.toContain('Open management');
    expect(element.textContent).not.toContain('Manage inventory products');
  });

  it('should preserve inline managed rows when the add modal closes', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });

    component.openAddProductsModal();
    component.closeActiveModal();

    expect(component.activeModal).toBeNull();
    expect(component.manageProductRows.length).toBe(1);
  });

  it('should render the inline empty state when no product is linked', async () => {
    component.inventories = [
      {
        id: 4,
        name: 'Stock principal',
        inventoryProducts: [],
      },
    ];
    inventoryServiceMock.findProducts.and.returnValue(of([]));

    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 0,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.manageProductRows).toEqual([]);
    expect(fixture.nativeElement.querySelector('.inventory-manage-products')?.textContent).toContain(
      'No product is linked to this inventory.',
    );
  });

  it('should replace stock rows when managed quantities change', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.manageProductRows[0].qty = 5;

    component.saveManagedProducts();

    expect(inventoryServiceMock.reconcileProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 1, qty: 5 }],
    });
    expect(component.formVisible).toBeTrue();
    expect(component.activeModal).toBeNull();
  });

  it('should render inline manage section without recomputing template state indefinitely', async () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const manageTitle = fixture.nativeElement.querySelector('.inventory-manage-products h3');
    expect(component.manageProductRows[0].qtyUnitOptions.length).toBeGreaterThan(0);
    expect(component.manageProductRows[0].currentQtyDisplay).toContain('2');
    expect(manageTitle?.textContent).toContain('Manage products');
  });

  it('should replace stock rows when managed quantities switch to portion', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.manageProductRows[0].qty = 4;
    component.manageProductRows[0].qtyUnit = 'portion';

    component.saveManagedProducts();

    expect(inventoryServiceMock.reconcileProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 1, qty: 4, qtyUnit: 'portion' }],
    });
  });

  it('should empty the inventory in one action', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });

    component.emptyInventory();

    expect(inventoryServiceMock.reconcileProducts).toHaveBeenCalledWith(4, {
      products: [],
    });
    expect(component.formVisible).toBeTrue();
    expect(component.activeModal).toBeNull();
  });

  it('should guard invalid actions and expose request errors', () => {
    component.onEditRequested({ id: 'invalid', name: 'Invalid', productCount: 0 });
    component.selectInventory('invalid');
    component.openAddProductsModal();
    component.openSelectedInventoryEditor();
    component.deleteSelectedInventory();
    expect(component.formVisible).toBeFalse();

    component.onAddRequested();
    component.onCreateProductsSelected([component.productListItems[0]]);
    component.createSelectedProductRows[0].qty = 0;
    component.onFormSubmitted({ mode: 'add', value: { name: 'Invalid stock' } });
    expect(component.createProductsFormError).toBeTruthy();
    component.onCreateProductQtyChange();
    expect(component.createProductsFormError).toBeNull();

    component.onEditRequested({ id: '4', name: 'Stock principal', productCount: 1 });
    component.openAddProductsModal();
    component.onProductsToAddSelected([component.productListItems[0]]);
    component.addSelectedProductRows[0].qty = 0;
    component.onAddSelectedProducts();
    expect(component.addProductsFormError).toBeTruthy();
    component.onAddProductQtyChange();
    expect(component.addProductsFormError).toBeNull();
    component.manageProductRows[0].qty = -1;
    component.saveManagedProducts();
    expect(component.manageProductsFormError).toBeTruthy();
    component.onManagedProductQtyChange();
    expect(component.manageProductsFormError).toBeNull();

    component.onCancelForm();
    component.openAddProductsModal();
    component.closeActiveModal();
    component.onEscapeKey();
    expect(component.activeModal).toBeNull();

    productServiceMock.findAll.and.returnValue(throwError(() => new Error('products')));
    inventoryServiceMock.findAll.and.returnValue(throwError(() => new Error('inventories')));
    inventoryServiceMock.findProducts.and.returnValue(throwError(() => new Error('selected products')));
    component.onRefreshRequested();
    expect(component.lastError).toEqual(jasmine.any(Error));

    productServiceMock.findAll.and.returnValue(of([
      {
        id: 1,
        name: 'Chicken',
        unitType: 'Paquet',
        quantityPerUnit: 1,
        quantityUnit: 'unit',
        portionCount: 2,
        portionUnit: 'portion',
        portionQuantityNormalized: 0.5,
        nutritionValues: [],
        price: 6,
        priceUnit: 'kg',
      },
    ]));
    component.products = [{
      id: 1,
      name: 'Chicken',
      unitType: 'Paquet',
      quantityPerUnit: 1,
      quantityUnit: 'unit',
      portionCount: 2,
      portionUnit: 'portion',
      portionQuantityNormalized: 0.5,
      nutritionValues: [],
      price: 6,
      priceUnit: 'kg',
    }];
    inventoryServiceMock.findAll.and.returnValue(of([
      { id: 4, name: 'Stock principal', inventoryProducts: linkedProducts },
    ]));
    inventoryServiceMock.findProducts.and.returnValue(throwError(() => new Error('products')));
    component.onEditRequested({ id: '4', name: 'Stock principal', productCount: 1 });
    expect(component.lastError).toEqual(jasmine.any(Error));

    inventoryServiceMock.update.and.returnValue(throwError(() => new Error('update')));
    component.onFormSubmitted({ mode: 'edit', value: { name: 'Updated' } });
    expect(component.lastError).toEqual(jasmine.any(Error));
    inventoryServiceMock.remove.and.returnValue(throwError(() => new Error('remove')));
    component.onDeleteRequested({ id: '4', name: 'Stock principal', productCount: 1 });
    expect(component.lastError).toEqual(jasmine.any(Error));

    inventoryServiceMock.addProducts.and.returnValue(throwError(() => new Error('add')));
    component.openAddProductsModal();
    component.onProductsToAddSelected([component.productListItems[0]]);
    component.addSelectedProductRows[0].qty = 1;
    component.onAddSelectedProducts();
    expect(component.lastError).toEqual(jasmine.any(Error));
    inventoryServiceMock.reconcileProducts.and.returnValue(throwError(() => new Error('reconcile')));
    component.manageProductRows = [{
      productId: 1,
      productName: 'Chicken',
      qty: 1,
      qtyUnit: 'unit',
      qtyUnitOptions: [],
      qtyUnitHelpText: null,
      purchaseAccountingMode: 'paid',
      currentQty: 1,
      currentQtyUnit: 'unit',
      currentNormalizedQty: 1,
      currentQtyDisplay: '1',
      unitType: 'Paquet',
      quantityPerUnit: 1,
      quantityUnit: 'unit',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: null,
    }];
    component.saveManagedProducts();
    expect(component.lastError).toEqual(jasmine.any(Error));
    component.emptyInventory();
    expect(component.lastError).toEqual(jasmine.any(Error));
    component.onMenuClicked();
    expect(component.lastResponse).toEqual(jasmine.objectContaining({ info: jasmine.any(String) }));
  });
});
