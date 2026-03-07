import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InputDayFeature } from './input-day.feature';
import { InputDayService } from '../../services/input-day-service';
import { ProductService } from '../../services/product-service';
import { InventoryService } from '../../services/inventory-service';

describe('InputDayFeature', () => {
  let component: InputDayFeature;
  let fixture: ComponentFixture<InputDayFeature>;

  const dayResponse = {
    dateLocal: '2026-02-16',
    timezone: 'UTC',
    assignment: null,
    daySet: {
      id: 3,
      title: 'Jour standard',
      nutritionValue: null,
      slots: [
        {
          slotId: 11,
          slotKey: 'breakfast',
          title: 'Petit dejeuner',
          sortOrder: 1,
          startTime: '08:00:00',
          endTime: '09:00:00',
          nutritionValue: null,
        },
      ],
    },
    items: [],
    slots: [],
    itemsBySlot: [],
    totalsMacros: null,
  };

  const inputDayServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getInputDay: jasmine.createSpy('getInputDay').and.returnValue(of(dayResponse)),
    createItems: jasmine.createSpy('createItems').and.returnValue(of([])),
    updateItemQty: jasmine.createSpy('updateItemQty').and.returnValue(of(null)),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(void 0)),
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

  const inventoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([
      { id: 4, name: 'Stock principal' },
      { id: 5, name: 'Stock secondaire' },
    ])),
    findProducts: jasmine.createSpy('findProducts').and.callFake((inventoryId: number) => {
      if (inventoryId === 4) {
        return of([
          {
            id: 41,
            inventoryId: 4,
            productId: 1,
            qtyOnHandInUnits: 2,
            qtyOnHandNormalized: 2,
          },
          {
            id: 42,
            inventoryId: 4,
            productId: 2,
            qtyOnHandInUnits: 1,
            qtyOnHandNormalized: 500,
          },
        ]);
      }

      if (inventoryId === 5) {
        return of([
          {
            id: 51,
            inventoryId: 5,
            productId: 2,
            qtyOnHandInUnits: 1,
            qtyOnHandNormalized: 500,
          },
        ]);
      }

      return of([]);
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputDayFeature],
      providers: [
        { provide: InputDayService, useValue: inputDayServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InputDayFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-load day in embedded mode when initialDateLocal is provided', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith('2026-02-16', 'UTC');
  });

  it('should hide standalone response block in embedded mode', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.input-day-response')).toBeNull();
  });

  it('should build one row per selected product and remove deselected rows', () => {
    component.onProductsSelected(component.productListItems);
    expect(component.selectedProductRows.length).toBe(2);

    component.onProductsSelected(component.productListItems.slice(0, 1));
    expect(component.selectedProductRows.length).toBe(1);
    expect(component.selectedProductRows[0].productId).toBe(1);
  });

  it('should expose only products linked to the selected inventory', () => {
    component.onSelectedInventoryChange(5);

    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(5);
    expect(component.selectableProductListItems.map((item) => item.id)).toEqual(['2']);
  });

  it('should select a product on the first checkbox click in input-day list', () => {
    component.onSelectedInventoryChange(4);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('app-product-list mat-checkbox');
    checkbox.click();
    fixture.detectChanges();

    expect(component.selectedProductIds).toEqual(['1']);
    expect(component.selectedProductRows.length).toBe(1);
    expect(component.selectedProductRows[0].productId).toBe(1);
  });

  it('should create items with shared inventory and slot plus per-product qty', () => {
    const emitted: Array<unknown> = [];
    component.itemsChanged.subscribe((event) => emitted.push(event));

    component.form.patchValue({
      dateLocal: '2026-02-16',
      timezone: 'UTC',
    });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange(4);
    component.selectedSlotId = 11;
    component.onProductsSelected(component.selectableProductListItems);
    component.selectedProductRows[0].qty = 120;
    component.selectedProductRows[0].qtyUnit = 'g';
    component.selectedProductRows[1].qty = 80;
    component.selectedProductRows[1].qtyUnit = null;

    component.createSelectedItems();

    expect(inputDayServiceMock.createItems).toHaveBeenCalledWith('2026-02-16', {
      items: [
        {
          productId: 1,
          inventoryId: 4,
          qty: 120,
          qtyUnit: 'g',
          slotId: 11,
        },
        {
          productId: 2,
          inventoryId: 4,
          qty: 80,
          slotId: 11,
        },
      ],
    });
    expect(emitted).toEqual([{ dateLocal: '2026-02-16' }]);
  });
});
