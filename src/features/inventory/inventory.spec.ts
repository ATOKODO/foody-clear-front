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
        nutritionValues: [],
      },
      {
        id: 2,
        name: 'Rice',
        unitType: 'Paquet',
        quantityPerUnit: 500,
        quantityUnit: 'g',
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

    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should replace stock rows when managed quantities change', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.openManageProductsModal();
    component.manageProductRows[0].qty = 5;

    component.saveManagedProducts();

    expect(inventoryServiceMock.removeProducts).toHaveBeenCalledWith(4, {
      productIds: [1],
    });
    expect(inventoryServiceMock.addProducts).toHaveBeenCalledWith(4, {
      products: [{ productId: 1, qty: 5 }],
    });
  });

  it('should empty the inventory in one action', () => {
    component.onEditRequested({
      id: '4',
      name: 'Stock principal',
      productCount: 1,
    });
    component.openManageProductsModal();

    component.emptyInventory();

    expect(inventoryServiceMock.removeProducts).toHaveBeenCalledWith(4, {
      productIds: [1],
    });
  });
});
