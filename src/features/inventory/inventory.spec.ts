import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

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
        { productId: 1, qty: 2 },
        { productId: 2, qty: 3 },
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
      products: [{ productId: 2, qty: 4 }],
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
      products: [{ productId: 2, qty: 2, qtyUnit: 'portion' }],
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
      products: [{ productId: 2, qty: 3, qtyUnit: 'portion' }],
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
      products: [{ productId: 1, qty: 4 }],
    });
  });

  it('should open edit mode with inline product management already visible', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const headerActions = Array.from(
      element.querySelectorAll('.inventory-form__header-actions button'),
    ).map((button) => button.textContent?.trim());

    expect(component.activeModal).toBeNull();
    expect(component.manageProductRows.length).toBe(1);
    expect(headerActions).toEqual(["Ouvrir l'ajout", 'Options']);
    expect(element.querySelector('.inventory-manage-products')?.textContent).toContain(
      'Gerer les produits',
    );
    expect(element.textContent).not.toContain('Ouvrir la gestion');
    expect(element.textContent).not.toContain("Gerer les produits de l'inventory");
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

  it('should render the inline empty state when no product is linked', () => {
    component.inventories = [
      {
        id: 4,
        name: 'Stock principal',
        inventoryProducts: [],
      } as (typeof component.inventories)[number],
    ];
    inventoryServiceMock.findProducts.and.returnValue(of([]));

    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 0,
    });
    fixture.detectChanges();

    expect(component.manageProductRows).toEqual([]);
    expect(fixture.nativeElement.querySelector('.inventory-manage-products')?.textContent).toContain(
      'Aucun produit lie a cet inventory.',
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

    expect(inventoryServiceMock.removeProducts).toHaveBeenCalledWith(4, {
      productIds: [1],
    });
    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 1, qty: 5 }],
    });
    expect(component.formVisible).toBeTrue();
    expect(component.activeModal).toBeNull();
  });

  it('should render inline manage section without recomputing template state indefinitely', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    fixture.detectChanges();

    const manageTitle = fixture.nativeElement.querySelector('.inventory-manage-products h3');
    expect(component.manageProductRows[0].qtyUnitOptions.length).toBeGreaterThan(0);
    expect(component.manageProductRows[0].currentQtyDisplay).toContain('2');
    expect(manageTitle?.textContent).toContain('Gerer les produits');
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

    expect(inventoryServiceMock.removeProducts).toHaveBeenCalledWith(4, {
      productIds: [1],
    });
    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
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

    expect(inventoryServiceMock.removeProducts).toHaveBeenCalledWith(4, {
      productIds: [1],
    });
    expect(component.formVisible).toBeTrue();
    expect(component.activeModal).toBeNull();
  });
});
