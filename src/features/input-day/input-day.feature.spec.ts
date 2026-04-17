import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { of } from 'rxjs';

import { InputDayFeature } from './input-day.feature';
import { InputDayResponse } from '../../interfaces/input-day.interface';
import { InputDayService } from '../../services/input-day-service';
import { ProductService } from '../../services/product-service';
import { InventoryService } from '../../services/inventory-service';
import { TemplateService } from '../../services/template-service';

describe('InputDayFeature', () => {
  let component: InputDayFeature;
  let fixture: ComponentFixture<InputDayFeature>;
  const fallbackTimezone = DateTime.local().zoneName || 'UTC';

  const dayResponse: InputDayResponse = {
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
    items: [
      {
        id: 31,
        productId: 1,
        productName: 'Chicken',
        inventoryId: 4,
        qty: 120,
        qtyUnit: 'g',
        qtyNormalized: 120,
        insertedAt: '2026-02-16T08:20:00Z',
        occurredAt: '2026-02-16T08:15:00Z',
        slotId: 11,
        slotKey: 'breakfast',
        nutritionValue: {},
      },
    ],
    slots: [],
    itemsBySlot: [],
    totalsMacros: null,
  };

  const inputDayServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getInputDay: jasmine.createSpy('getInputDay').and.returnValue(of(dayResponse)),
    createItem: jasmine.createSpy('createItem').and.returnValue(of({})),
    createItems: jasmine.createSpy('createItems').and.returnValue(of([])),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(of(null)),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(void 0)),
    setTemplate: jasmine.createSpy('setTemplate').and.returnValue(of(dayResponse)),
    convertTemplateItem: jasmine.createSpy('convertTemplateItem').and.returnValue(of(dayResponse)),
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

  const templateServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputDayFeature],
      providers: [
        { provide: InputDayService, useValue: inputDayServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: TemplateService, useValue: templateServiceMock },
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

    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith('2026-02-16', fallbackTimezone);
  });

  it('should defer full product loading on embedded open until an inventory is selected', () => {
    productServiceMock.findAll.calls.reset();
    inventoryServiceMock.findAll.calls.reset();
    inputDayServiceMock.getInputDay.calls.reset();

    const embeddedFixture = TestBed.createComponent(InputDayFeature);
    embeddedFixture.componentRef.setInput('displayMode', 'embedded');
    embeddedFixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    embeddedFixture.detectChanges();

    expect(productServiceMock.findAll).not.toHaveBeenCalled();
    expect(inventoryServiceMock.findAll).toHaveBeenCalled();
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith('2026-02-16', fallbackTimezone);

    embeddedFixture.componentInstance.onSelectedInventoryChange([4]);

    expect(productServiceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('should prefill occurredAt from embedded hour context', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.componentRef.setInput('initialOccurredAt', '2026-02-16T08:00:00Z');
    fixture.detectChanges();

    expect(component.itemEditorForm.value.occurredAt).toBe('2026-02-16T08:00');
  });

  it('should hide standalone response block in embedded mode', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.input-day-response')).toBeNull();
  });

  it('should keep a single refresh button and hide timezone input in embedded mode', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="input-day-refresh"]').length).toBe(1);
    expect(fixture.nativeElement.querySelector('[data-testid="input-day-load"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[formcontrolname="timezone"]')).toBeNull();
  });

  it('should show only the inventory guide in embedded mode until inventories are selected', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Selectionne au moins un inventory pour afficher les produits, les modeles et les elements saisis.',
    );
    expect(fixture.nativeElement.querySelector('[data-testid="input-day-section-toggle"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="input-day-item-31"]')).toBeNull();

    component.onSelectedInventoryChange([4]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="input-day-section-toggle"]')).not.toBeNull();
  });

  it('should build one row per selected product and remove deselected rows', () => {
    component.onProductsSelected(component.productListItems);
    expect(component.selectedProductRows.length).toBe(2);

    component.onProductsSelected(component.productListItems.slice(0, 1));
    expect(component.selectedProductRows.length).toBe(1);
    expect(component.selectedProductRows[0].productId).toBe(1);
  });

  it('should render cycle-level targets when no day set is active', () => {
    const cycleTargetResponse: InputDayResponse = {
      ...dayResponse,
      daySet: null,
      totalsMacros: {
        bySlot: [],
        dayTotal: {
          proteins: 120,
          carbs: 95,
          lipids: 35,
        },
        targets: {
          proteins: 150,
          carbs: 120,
          lipids: 50,
        },
        deltaToTargets: {
          proteins: -30,
          carbs: -25,
          lipids: -15,
        },
        incompleteNutritionKeys: [],
        targetSource: 'cycle',
      },
    };

    component.lastResponse = cycleTargetResponse;
    component.inputDayResponse = cycleTargetResponse;
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain(
      'Aucun daySet actif pour cette journee. Les cibles quotidiennes proviennent du cycle.',
    );
    expect(textContent).toContain(
      'Cibles quotidiennes heritees du cycle (aucun day set actif).',
    );
    expect(textContent).toContain('proteins:');
    expect(textContent).toContain('150');
  });

  it('should expose only products linked to the selected inventory', () => {
    component.onSelectedInventoryChange([5]);

    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(5);
    expect(component.selectableProductListItems.map((item) => item.id)).toEqual(['2']);
  });

  it('should keep editor product options empty until an inventory is selected', () => {
    expect(component.selectedInventoryIds).toEqual([]);
    expect(component.editorProductOptions).toEqual([]);

    component.onSelectedInventoryChange([4]);

    expect(component.editorProductOptions.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('should aggregate products and available quantities across selected inventories', () => {
    component.onSelectedInventoryChange([4, 5]);

    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(4);
    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(5);
    expect(component.selectableProductListItems.map((item) => item.id)).toEqual(['1', '2']);
    expect(component.selectableProductListItems.find((item) => item.id === '2')?.availableQuantity).toBe(1000);
  });

  it('should create selected items with shared metadata and per-product qty', () => {
    inputDayServiceMock.createItems.calls.reset();
    const emitted: Array<unknown> = [];
    component.itemsChanged.subscribe((event) => emitted.push(event));

    component.form.patchValue({
      dateLocal: '2026-02-16',
      timezone: 'UTC',
    });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange([4]);
    component.selectedSlotId = 11;
    component.itemEditorForm.patchValue({
      dateLocal: '2026-02-17',
      occurredAt: '2026-02-17T08:00',
      slotKey: '',
    });
    component.onProductsSelected(component.selectableProductListItems);
    component.selectedProductRows[0].qty = 120;
    component.selectedProductRows[0].qtyUnit = 'g';
    component.selectedProductRows[1].qty = 80;
    component.selectedProductRows[1].qtyUnit = null;

    component.createSelectedItems();

    expect(inputDayServiceMock.createItems).toHaveBeenCalledWith('2026-02-17', {
      items: [
        {
          productId: 1,
          inventoryIds: [4],
          qty: 120,
          occurredAt: '2026-02-17T08:00:00Z',
          qtyUnit: 'g',
          slotId: 11,
        },
        {
          productId: 2,
          inventoryIds: [4],
          qty: 80,
          occurredAt: '2026-02-17T08:00:00Z',
          slotId: 11,
        },
      ],
    });
    expect(emitted).toEqual([{ dateLocal: '2026-02-17' }]);
  });

  it('should use slotKey for selected items when no batch slot is set', () => {
    inputDayServiceMock.createItems.calls.reset();

    component.form.patchValue({
      dateLocal: '2026-02-16',
      timezone: 'UTC',
    });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange([4]);
    component.itemEditorForm.patchValue({
      dateLocal: '2026-02-16',
      occurredAt: '',
      slotKey: 'snack',
    });
    component.onProductsSelected(component.selectableProductListItems.slice(0, 1));
    component.selectedProductRows[0].qty = 120;
    component.selectedProductRows[0].qtyUnit = 'g';

    component.createSelectedItems();

    expect(inputDayServiceMock.createItems).toHaveBeenCalledWith('2026-02-16', {
      items: [
        {
          productId: 1,
          inventoryIds: [4],
          qty: 120,
          qtyUnit: 'g',
          slotKey: 'snack',
        },
      ],
    });
  });

  it('should create a single item with occurredAt', () => {
    component.form.patchValue({
      dateLocal: '2026-02-16',
      timezone: 'UTC',
    });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange([4]);
    component.itemEditorForm.patchValue({
      dateLocal: '2026-02-16',
      occurredAt: '2026-02-16T08:00',
      productId: 1,
      qty: 150,
      qtyUnit: 'g',
      slotId: 11,
      slotKey: '',
    });

    component.submitItemEditor();

    expect(inputDayServiceMock.createItem).toHaveBeenCalledWith('2026-02-16', {
      productId: 1,
      inventoryIds: [4],
      qty: 150,
      occurredAt: '2026-02-16T08:00:00Z',
      qtyUnit: 'g',
      slotId: 11,
    });
  });

  it('should load the clicked row into the editor', () => {
    component.inputDayResponse = dayResponse;
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.input-day-edit-item');
    trigger.click();
    fixture.detectChanges();

    expect(component.itemEditorForm.value.itemId).toBe(31);
    expect(component.itemEditorForm.value.productId).toBe(1);
    expect(component.itemEditorForm.value.occurredAt).toBe(
      DateTime.fromISO('2026-02-16T08:15:00Z', { setZone: true })
        .setZone(fallbackTimezone)
        .toFormat("yyyy-LL-dd'T'HH:mm"),
    );
  });

  it('should clear selected batch products when switching to edition', () => {
    component.onSelectedInventoryChange([4]);
    component.onProductsSelected(component.selectableProductListItems);
    expect(component.selectedProductRows.length).toBe(2);

    component.inputDayResponse = dayResponse;
    component.startEditingItem(31);

    expect(component.selectedProductRows).toEqual([]);
    expect(component.itemEditorForm.value.itemId).toBe(31);
  });

  it('should send the full update payload for an edited item', () => {
    component.form.patchValue({
      dateLocal: '2026-02-16',
      timezone: 'UTC',
    });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange([4]);
    component.startEditingItem(31);
    component.itemEditorForm.patchValue({
      dateLocal: '2026-02-17',
      occurredAt: '2026-02-17T09:30',
      productId: 2,
      qty: 200,
      qtyUnit: 'g',
      slotId: null,
      slotKey: 'snack',
    });

    component.submitItemEditor();

    expect(inputDayServiceMock.updateItem).toHaveBeenCalledWith('2026-02-16', 31, {
      dateLocal: '2026-02-17',
      productId: 2,
      inventoryIds: [4],
      qty: 200,
      occurredAt: '2026-02-17T09:30:00Z',
      qtyUnit: 'g',
      slotId: null,
      slotKey: 'snack',
    });
  });

  it('should preserve the current inventory selection when editing an item', () => {
    component.onSelectedInventoryChange([5]);
    component.inputDayResponse = dayResponse;

    component.startEditingItem(31);

    expect(component.selectedInventoryIds).toEqual([5]);
  });

  it('should preload the edited item inventory when no selection exists', () => {
    component.inputDayResponse = dayResponse;

    component.startEditingItem(31);

    expect(component.selectedInventoryIds).toEqual([4]);
  });

  it('should apply the selected template immediately without an apply button', () => {
    inputDayServiceMock.setTemplate.calls.reset();
    component.form.patchValue({
      dateLocal: '2026-02-16',
      timezone: 'UTC',
    });
    component.inputDayResponse = dayResponse;
    fixture.detectChanges();

    component.onManualTemplateSelectionChange(9);
    fixture.detectChanges();

    expect(inputDayServiceMock.setTemplate).toHaveBeenCalledWith('2026-02-16', 9);
    expect(fixture.nativeElement.querySelector('[data-testid="input-day-template-apply"]')).toBeNull();
  });

  it('should switch embedded sections with the segmented toggle state', () => {
    component.inputDayResponse = {
      ...dayResponse,
      templateAssociation: {
        source: 'manual',
        template: {
          id: 9,
          title: 'Batch sec',
        },
      },
      templateItems: [
        {
          id: 18,
          productId: 2,
          productName: 'Rice',
          qty: 80,
          qtyUnit: 'g',
          qtyNormalized: 80,
          slotId: 11,
          slotKey: 'breakfast',
          status: 'pending',
          convertedItemId: null,
          stockAvailability: {
            enoughStock: true,
            totalAvailableNormalized: 1000,
            requestedQtyNormalized: 80,
          },
          stockByInventory: [
            { inventoryId: 4, inventoryName: 'Stock principal', qtyAvailableNormalized: 500, enoughStock: true },
            { inventoryId: 5, inventoryName: 'Stock secondaire', qtyAvailableNormalized: 500, enoughStock: true },
          ],
          nutritionValue: {},
        },
      ],
    };
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    component.onSelectedInventoryChange([4, 5]);
    fixture.detectChanges();

    expect(component.activeEmbeddedSection).toBe('stock');
    expect(fixture.nativeElement.textContent).toContain('Ajouter des entrees');

    component.onActiveEmbeddedSectionChange('templates');
    fixture.detectChanges();

    expect(component.activeEmbeddedSection).toBe('templates');
    expect(fixture.nativeElement.textContent).toContain('Template associe');
    expect(fixture.nativeElement.querySelector('[data-testid="input-day-item-31"]')).not.toBeNull();
  });
});
