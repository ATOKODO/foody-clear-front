import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTime } from 'luxon';
import { Subject, of, throwError } from 'rxjs';

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
          totalAvailableNormalized: 500,
          requestedQtyNormalized: 80,
        },
        stockByInventory: [
          {
            inventoryId: 4,
            inventoryName: 'Stock principal',
            qtyAvailableNormalized: 500,
            enoughStock: true,
          },
        ],
        nutritionValue: {},
      },
    ],
  };

  const inputDayServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getInputDay: jasmine
      .createSpy('getInputDay')
      .and.returnValue(of(dayResponse)),
    createItem: jasmine.createSpy('createItem').and.returnValue(of({})),
    createItems: jasmine.createSpy('createItems').and.returnValue(of([])),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(of(null)),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(void 0)),
    setTemplate: jasmine
      .createSpy('setTemplate')
      .and.returnValue(of(dayResponse)),
    convertTemplateItem: jasmine
      .createSpy('convertTemplateItem')
      .and.returnValue(of(dayResponse)),
  };

  const productServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(
      of([
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
      ]),
    ),
  };

  const inventoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(
      of([
        { id: 4, name: 'Stock principal' },
        { id: 5, name: 'Stock secondaire' },
      ]),
    ),
    findProducts: jasmine
      .createSpy('findProducts')
      .and.callFake((inventoryId: number) => {
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
    inputDayServiceMock.getInputDay.and.returnValue(of(dayResponse));
    inputDayServiceMock.createItem.and.returnValue(of({}));
    inputDayServiceMock.createItems.and.returnValue(of([]));
    inputDayServiceMock.updateItem.and.returnValue(of(null));
    inputDayServiceMock.removeItem.and.returnValue(of(void 0));
    inputDayServiceMock.setTemplate.and.returnValue(of(dayResponse));
    inputDayServiceMock.convertTemplateItem.and.returnValue(of(dayResponse));
    productServiceMock.findAll.and.returnValue(of([
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
    ]));
    inventoryServiceMock.findAll.and.returnValue(of([
      { id: 4, name: 'Stock principal' },
      { id: 5, name: 'Stock secondaire' },
    ]));
    inventoryServiceMock.findProducts.and.callFake((inventoryId: number) => {
      if (inventoryId === 4) {
        return of([
          { id: 41, inventoryId: 4, productId: 1, qtyOnHandInUnits: 2, qtyOnHandNormalized: 2 },
          { id: 42, inventoryId: 4, productId: 2, qtyOnHandInUnits: 1, qtyOnHandNormalized: 500 },
        ]);
      }
      if (inventoryId === 5) {
        return of([
          { id: 51, inventoryId: 5, productId: 2, qtyOnHandInUnits: 1, qtyOnHandNormalized: 500 },
        ]);
      }
      return of([]);
    });
    templateServiceMock.findAll.and.returnValue(of([]));

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

  it('cancels earlier day reads when navigating A to B to A', () => {
    const first = new Subject<InputDayResponse>();
    const second = new Subject<InputDayResponse>();
    const latest = new Subject<InputDayResponse>();
    inputDayServiceMock.getInputDay.and.returnValues(first, second, latest);
    component.form.patchValue({ dateLocal: '2026-02-16', timezone: 'UTC' });
    component.loadDay();
    component.form.patchValue({ dateLocal: '2026-02-17' });
    component.loadDay();
    component.form.patchValue({ dateLocal: '2026-02-16' });
    component.loadDay();
    expect(first.observed).toBeFalse();
    expect(second.observed).toBeFalse();
    latest.next(dayResponse);
    first.error(new Error('Old request'));
    second.next({ ...dayResponse, dateLocal: '2026-02-17' });
    expect(component.inputDayResponse).toBe(dayResponse);
    expect(component.lastError).toBeNull();
    expect(component.loading).toBeFalse();
    fixture.destroy();
    expect(latest.observed).toBeFalse();
  });

  it('cancels stock reads even when the same inventory is selected again', () => {
    const first = new Subject<unknown[]>();
    const second = new Subject<unknown[]>();
    const latest = new Subject<unknown[]>();
    inventoryServiceMock.findProducts.and.returnValues(first, second, latest);
    component.onSelectedInventoryChange([4]);
    component.onSelectedInventoryChange([5]);
    component.onSelectedInventoryChange([4]);
    expect(first.observed).toBeFalse();
    expect(second.observed).toBeFalse();
    latest.next([{ id: 41, inventoryId: 4, productId: 1, qtyOnHandInUnits: 7, qtyOnHandNormalized: 7 }]);
    latest.complete();
    first.next([{ id: 41, inventoryId: 4, productId: 1, qtyOnHandInUnits: 1, qtyOnHandNormalized: 1 }]);
    second.error(new Error('Old inventory'));
    expect(component.selectedInventoryProducts[0].qtyOnHandNormalized).toBe(7);
    expect(component.inventoryProductsError).toBeNull();
    expect(component.loadingInventoryProducts).toBeFalse();
  });

  it('should auto-load day in embedded mode when initialDateLocal is provided', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(
      '2026-02-16',
      fallbackTimezone,
    );
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
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(
      '2026-02-16',
      fallbackTimezone,
    );

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

    expect(
      fixture.nativeElement.querySelector('.input-day-response'),
    ).toBeNull();
  });

  it('should keep a single refresh button and hide timezone input in embedded mode', () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="input-day-refresh"]',
      ).length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="input-day-load"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('input[formcontrolname="timezone"]'),
    ).toBeNull();
  });

  it('should show only the inventory guide in embedded mode until inventories are selected', async () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Select at least one inventory to display products, templates, and entered items.',
    );
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="input-day-section-toggle"]',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="input-day-item-31"]'),
    ).toBeNull();

    component.onSelectedInventoryChange([4]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="input-day-section-toggle"]',
      ),
    ).not.toBeNull();
  });

  it('should build one row per selected product and remove deselected rows', () => {
    component.onProductsSelected(component.productListItems);
    expect(component.selectedProductRows.length).toBe(2);

    component.onProductsSelected(component.productListItems.slice(0, 1));
    expect(component.selectedProductRows.length).toBe(1);
    expect(component.selectedProductRows[0].productId).toBe(1);
  });

  it('should expose formatting, tracking, and reset helpers for the active day', () => {
    component.form.patchValue({ dateLocal: '2026-02-16' });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange([4]);
    component.onProductsSelected(component.selectableProductListItems.slice(0, 1));

    const item = dayResponse.items[0];
    const templateItem = dayResponse.templateItems![0];

    expect(component.hasValidSelectedDate).toBeTrue();
    expect(component.hasSelectedInventories).toBeTrue();
    expect(component.formatMacroValue(12.5)).toContain('12.5');
    expect(component.formatNutritionAmount(12.5)).toContain('12.5');
    expect(component.formatTime('08:15:00')).toBe('08:15');
    expect(component.formatDateTime('2026-02-16T08:15:00Z')).toContain('2026');
    expect(component.resolveItemSlotTitle(item)).toBeTruthy();
    expect(component.resolveItemSlotKey(item)).toBeTruthy();
    expect(component.resolveTemplateItemSlotTitle(templateItem)).toBeTruthy();
    expect(component.resolveTemplateItemSlotKey(templateItem)).toBeTruthy();
    expect(component.getSelectedInventoriesTemplateStock(templateItem)).toBeTruthy();
    expect(component.getTargetSourceText('cycle')).toContain('cycle');
    expect(component.getTemplateTargetSourceText(dayResponse.totalsMacros)).toBeTruthy();
    expect(component.hasEntries({ proteins: 1 })).toBeTrue();
    expect(component.hasEntries(null)).toBeFalse();
    expect(component.trackBySelectedProductRow(0, component.selectedProductRows[0])).toBe(1);
    expect(component.trackByInputDayItem(0, item)).toBe(item.id);
    expect(component.trackByTemplateItem(0, templateItem)).toBe(templateItem.id);

    component.clear();

    expect(component.inputDayResponse).toBeNull();
    expect(component.selectedInventoryIds).toEqual([]);
    expect(component.selectedProductRows).toEqual([]);
    expect(component.activeEmbeddedSection).toBe('stock');
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
      'No active day set for this day. Daily targets come from the cycle.',
    );
    expect(textContent).toContain(
      'Daily targets inherited from the cycle (no active day set).',
    );
    expect(textContent).toContain('proteins:');
    expect(textContent).toContain('150');
  });

  it('should expose only products linked to the selected inventory', () => {
    component.onSelectedInventoryChange([5]);

    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(5);
    expect(component.selectableProductListItems.map((item) => item.id)).toEqual(
      ['2'],
    );
  });

  it('should keep editor product options empty until an inventory is selected', () => {
    expect(component.selectedInventoryIds).toEqual([]);
    expect(component.editorProductOptions).toEqual([]);

    component.onSelectedInventoryChange([4]);

    expect(component.editorProductOptions.map((item) => item.id)).toEqual([
      '1',
      '2',
    ]);
  });

  it('should aggregate products and available quantities across selected inventories', () => {
    component.onSelectedInventoryChange([4, 5]);

    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(4);
    expect(inventoryServiceMock.findProducts).toHaveBeenCalledWith(5);
    expect(component.selectableProductListItems.map((item) => item.id)).toEqual(
      ['1', '2'],
    );
    expect(
      component.selectableProductListItems.find((item) => item.id === '2')
        ?.availableQuantity,
    ).toBe(1000);
  });

  it('should create selected items with shared metadata and per-product qty', () => {
    inputDayServiceMock.createItems.calls.reset();
    const emitted: unknown[] = [];
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
    component.onProductsSelected(
      component.selectableProductListItems.slice(0, 1),
    );
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

    expect(inputDayServiceMock.updateItem).toHaveBeenCalledWith(
      '2026-02-16',
      31,
      {
        dateLocal: '2026-02-17',
        productId: 2,
        inventoryIds: [4],
        qty: 200,
        occurredAt: '2026-02-17T09:30:00Z',
        qtyUnit: 'g',
        slotId: null,
        slotKey: 'snack',
      },
    );
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

    expect(inputDayServiceMock.setTemplate).toHaveBeenCalledWith(
      '2026-02-16',
      9,
    );
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="input-day-template-apply"]',
      ),
    ).toBeNull();
  });

  it('should switch embedded sections with the segmented toggle state', async () => {
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
            {
              inventoryId: 4,
              inventoryName: 'Stock principal',
              qtyAvailableNormalized: 500,
              enoughStock: true,
            },
            {
              inventoryId: 5,
              inventoryName: 'Stock secondaire',
              qtyAvailableNormalized: 500,
              enoughStock: true,
            },
          ],
          nutritionValue: {},
        },
      ],
    };
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    component.onSelectedInventoryChange([4, 5]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.activeEmbeddedSection).toBe('stock');
    expect(fixture.nativeElement.textContent).toContain('Add entries');

    component.onActiveEmbeddedSectionChange('templates');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.activeEmbeddedSection).toBe('templates');
    expect(fixture.nativeElement.textContent).toContain('Associated template');
    expect(
      fixture.nativeElement.querySelector('[data-testid="input-day-item-31"]'),
    ).not.toBeNull();
  });

  it('should keep conversion state scoped to the clicked template item', () => {
    const conversionResponse = new Subject<InputDayResponse>();
    inputDayServiceMock.convertTemplateItem.and.returnValue(conversionResponse);
    const pendingItems = [
      {
        id: 18,
        productId: 2,
        productName: 'Rice',
        qty: 80,
        qtyUnit: 'g' as const,
        qtyNormalized: 80,
        slotId: 1,
        slotKey: 'breakfast',
        status: 'pending' as const,
        convertedItemId: null,
        stockAvailability: {
          enoughStock: true,
          totalAvailableNormalized: 1000,
          requestedQtyNormalized: 80,
        },
        stockByInventory: [
          {
            inventoryId: 4,
            inventoryName: 'Stock principal',
            qtyAvailableNormalized: 500,
            enoughStock: true,
          },
        ],
        nutritionValue: {},
      },
      {
        id: 19,
        productId: 1,
        productName: 'Chicken',
        qty: 120,
        qtyUnit: 'g' as const,
        qtyNormalized: 120,
        slotId: 1,
        slotKey: 'breakfast',
        status: 'pending' as const,
        convertedItemId: null,
        stockAvailability: {
          enoughStock: true,
          totalAvailableNormalized: 500,
          requestedQtyNormalized: 120,
        },
        stockByInventory: [
          {
            inventoryId: 4,
            inventoryName: 'Stock principal',
            qtyAvailableNormalized: 500,
            enoughStock: true,
          },
        ],
        nutritionValue: {},
      },
    ];

    component.form.patchValue({ dateLocal: '2026-02-16' });
    component.inputDayResponse = {
      ...dayResponse,
      templateItems: pendingItems,
    };
    component.onSelectedInventoryChange([4]);

    component.convertTemplateItem(pendingItems[0]);

    expect(component.isConvertingTemplateItem(pendingItems[0])).toBeTrue();
    expect(component.isConvertingTemplateItem(pendingItems[1])).toBeFalse();
    expect(component.canConvertTemplateItem(pendingItems[1])).toBeTrue();
  });

  it('should show the item editor after Elements saisis in either embedded section', async () => {
    fixture.componentRef.setInput('displayMode', 'embedded');
    fixture.componentRef.setInput('initialDateLocal', '2026-02-16');
    fixture.detectChanges();
    await fixture.whenStable();

    component.inputDayResponse = dayResponse;
    component.onActiveEmbeddedSectionChange('templates');
    component.startEditingItem(31);
    fixture.detectChanges();

    const itemRow = fixture.nativeElement.querySelector(
      '[data-testid="input-day-item-31"]',
    ) as HTMLElement;
    const editorCard = fixture.nativeElement.querySelector(
      '[data-testid="input-day-edit-item-card"]',
    ) as HTMLElement;

    expect(component.isTemplatesSectionActive).toBeTrue();
    expect(editorCard).toBeTruthy();
    expect(editorCard.textContent).toContain('Edit entry');
    expect(
      itemRow.compareDocumentPosition(editorCard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    component.onActiveEmbeddedSectionChange('stock');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="input-day-edit-item-card"]'),
    ).toBeTruthy();
  });

  it('should expose the API detail when a template conversion fails', () => {
    const pendingItem = {
      id: 18,
      productId: 2,
      productName: 'Rice',
      qty: 80,
      qtyUnit: 'g' as const,
      qtyNormalized: 80,
      slotId: 1,
      slotKey: 'breakfast',
      status: 'pending' as const,
      convertedItemId: null,
      stockAvailability: {
        enoughStock: true,
        totalAvailableNormalized: 1000,
        requestedQtyNormalized: 80,
      },
      stockByInventory: [
        {
          inventoryId: 4,
          inventoryName: 'Stock principal',
          qtyAvailableNormalized: 500,
          enoughStock: true,
        },
      ],
      nutritionValue: {},
    };
    inputDayServiceMock.convertTemplateItem.and.returnValue(
      throwError(() => ({
        error: { message: 'slotId 1 does not belong to the active DaySet' },
      })),
    );
    component.form.patchValue({ dateLocal: '2026-02-16' });
    component.inputDayResponse = {
      ...dayResponse,
      templateItems: [pendingItem],
    };
    component.onSelectedInventoryChange([4]);

    component.convertTemplateItem(pendingItem);

    expect(component.templateActionError).toContain(
      'slotId 1 does not belong to the active DaySet',
    );
    expect(component.isConvertingTemplateItem(pendingItem)).toBeFalse();
  });

  it('should cover invalid editor states, loading errors and template actions', () => {
    const callPrivate = privateMethod(component);
    component.form.patchValue({ dateLocal: null, timezone: ' ' });
    component.loadDay();
    expect(component.lastError).toContain('dateLocal');
    expect(component.selectedDateLabel).toBe('-');
    expect(component.selectedInventoriesLabel).toBe('No inventory selected');
    expect(component.selectedBatchSlotLabel).toBe('No batch slot');
    expect(component.activeTemplateLabel).toBe('No active template');
    expect(component.createSelectedItemsLabel).toBe('Add selected entry');
    expect(callPrivate('resolveDateLocalValue')).toBeNull();
    expect(callPrivate('resolveTimezone')).toBe(fallbackTimezone);
    expect(callPrivate('resolveEditorDefaultDateLocal')).toBe('');

    component.form.patchValue({ dateLocal: '2026-02-16', timezone: 'UTC' });
    component.onItemEditorSlotIdChange(11);
    expect(component.itemEditorSelectedSlotId).toBe(11);
    component.onItemEditorSlotIdChange(null);
    expect(component.itemEditorSelectedSlotId).toBeNull();
    component.onSelectedInventoryChange([999]);
    expect(component.selectedInventoriesLabel).toBe('Inventory #999');
    component.selectedSlotId = 99;
    expect(component.selectedBatchSlotLabel).toBe('Slot #99');
    component.inputDayResponse = {
      ...dayResponse,
      templateAssociation: {
        source: 'manual',
        template: { id: 9, title: 'Manual template' },
      },
    };
    expect(component.activeTemplateLabel).toBe('Manual template (manual override)');
    expect(component.hasManualTemplateOverride).toBeTrue();
    component.selectedProducts = component.productListItems;
    component.onProductsSelected(component.productListItems);
    component.selectedProductRows[0].qty = 1;
    component.selectedProductRows[0].qtyUnit = 'unit';
    expect(component.createSelectedItemsLabel).toBe('Add selected entries');
    component.removeSelectedProduct(1);
    expect(component.selectedProductRows.length).toBe(1);

    inputDayServiceMock.createItems.and.returnValue(throwError(() => new Error('bulk')));
    component.onSelectedInventoryChange([4]);
    component.onProductsSelected(component.selectableProductListItems.slice(0, 1));
    component.selectedProductRows[0].qty = 1;
    component.selectedProductRows[0].qtyUnit = 'unit';
    component.itemEditorForm.patchValue({ dateLocal: '2026-02-16', productId: 1, qty: 1, qtyUnit: 'unit' });
    component.createSelectedItems();
    expect(component.itemsFormError).toBe('Unable to add the selected items.');

    inputDayServiceMock.createItem.and.returnValue(throwError(() => new Error('create')));
    component.itemEditorForm.patchValue({
      itemId: null,
      dateLocal: '2026-02-16',
      productId: 1,
      qty: 1,
      qtyUnit: 'unit',
    });
    component.submitItemEditor();
    expect(component.itemEditorError).toBe('Unable to create the entry.');

    inputDayServiceMock.updateItem.and.returnValue(throwError(() => new Error('update')));
    component.inputDayResponse = dayResponse;
    component.startEditingItem(31);
    component.submitItemEditor();
    expect(component.itemEditorError).toBe('Unable to update the entry.');

    component.itemEditorForm.patchValue({ itemId: null });
    component.removeItem();
    expect(component.lastError).toContain('itemId');
    inputDayServiceMock.removeItem.and.returnValue(throwError(() => new Error('remove')));
    component.itemEditorForm.patchValue({ itemId: 31 });
    component.editingSourceDateLocal = '2026-02-16';
    component.removeItem();
    expect(component.itemEditorError).toBe('Unable to delete the entry.');

    inputDayServiceMock.getInputDay.and.returnValue(throwError(() => new Error('day')));
    component.loadDay();
    expect(component.lastError).toEqual(jasmine.any(Error));
    inputDayServiceMock.setTemplate.and.returnValue(throwError(() => new Error('template')));
    component.onManualTemplateSelectionChange(9);
    expect(component.templateActionError).toBe('Unable to update the active template.');

    const pendingItem = {
      id: 18,
      productId: 2,
      productName: 'Rice',
      qty: 80,
      qtyUnit: 'g' as const,
      qtyNormalized: 80,
      slotId: 11,
      slotKey: 'breakfast',
      status: 'pending' as const,
      convertedItemId: null,
      stockAvailability: {
        enoughStock: true,
        totalAvailableNormalized: 1000,
        requestedQtyNormalized: 80,
      },
      stockByInventory: [],
      nutritionValue: {},
    };
    component.selectedInventoryIds = [];
    component.convertTemplateItem(pendingItem);
    expect(component.templateActionError).toContain('Select at least one inventory');
    component.form.patchValue({ dateLocal: '2026-02-16' });
    component.selectedInventoryIds = [4];
    inputDayServiceMock.convertTemplateItem.and.returnValue(
      throwError(() => ({ error: { message: 'convert' } })),
    );
    component.convertTemplateItem(pendingItem);
    expect(component.templateActionError).toContain('convert');

    productServiceMock.findAll.and.returnValue(throwError(() => new Error('products')));
    inventoryServiceMock.findAll.and.returnValue(throwError(() => new Error('inventories')));
    templateServiceMock.findAll.and.returnValue(throwError(() => new Error('templates')));
    component.onBaseUrlChange();
    expect(component.productsError).toEqual(jasmine.any(Error));
    expect(component.inventoriesError).toEqual(jasmine.any(Error));
    expect(component.templateError).toBe('Unable to load templates.');
    component.fillDemo();
    component.clear();
    expect(component.activeEmbeddedSection).toBe('stock');
  });

  it('should cover successful editor actions, input changes and inventory caches', () => {
    const call = privateMethod(component);
    component.form.patchValue({ dateLocal: '2026-02-16', timezone: 'UTC' });
    component.inputDayResponse = dayResponse;
    component.onSelectedInventoryChange([4]);
    component.onSelectedInventoryChange([4]);
    component.onProductsSelected(component.selectableProductListItems.slice(0, 1));
    component.selectedProductRows[0].qty = 1;
    component.selectedProductRows[0].qtyUnit = 'unit';
    inputDayServiceMock.createItems.and.returnValue(of({ created: true }));
    component.createSelectedItems();
    expect(component.loading).toBeFalse();

    component.itemEditorForm.patchValue({ itemId: null, dateLocal: '2026-02-16', productId: 1, qty: 1, qtyUnit: 'unit' });
    inputDayServiceMock.createItem.and.returnValue(of({ id: 32 }));
    component.submitItemEditor();
    expect(component.loading).toBeFalse();
    component.inputDayResponse = dayResponse;
    component.startEditingItem(31);
    inputDayServiceMock.updateItem.and.returnValue(of({ id: 31 }));
    component.submitItemEditor();
    expect(component.loading).toBeFalse();
    inputDayServiceMock.removeItem.and.returnValue(of(void 0));
    component.itemEditorForm.patchValue({ itemId: 31 });
    component.removeItem();
    expect(component.loading).toBeFalse();

    component.manualTemplateSelectionId = 9;
    inputDayServiceMock.setTemplate.and.returnValue(of(dayResponse));
    component.applyManualTemplateSelection();
    expect(component.templateActionError).toBeNull();
    component.clearManualTemplateOverride();
    expect(component.manualTemplateSelectionId).toBeNull();
    component.selectedInventoryIds = [4];
    inputDayServiceMock.convertTemplateItem.and.returnValue(of(dayResponse));
    component.convertTemplateItem(dayResponse.templateItems![0]);
    expect(component.isConvertingTemplateItem(dayResponse.templateItems![0])).toBeFalse();

    component.onActiveEmbeddedSectionChange('templates');
    expect(component.isTemplatesSectionActive).toBeTrue();
    component.onActiveEmbeddedSectionChange('stock');
    component.onItemEditorSlotIdChange(11);
    component.onItemEditorSlotIdChange(null);
    component.resetItemEditor();
    component.resetCreateComposer();
    expect(component.trackBySelectedProductRow(0, { productId: 1 } as never)).toBe(1);
    expect(component.trackByInputDayItem(0, { id: 31 } as never)).toBe(31);
    expect(component.trackByTemplateItem(0, { id: 18 } as never)).toBe(18);
    expect(component.getTargetSourceText('cycle')).toContain('cycle');
    expect(component.getTemplateTargetSourceText(dayResponse.totalsMacros)).toContain('target');
    expect(component.getSelectedInventoriesTemplateStock(dayResponse.templateItems![0])?.enoughStock).toBeTrue();
    expect(component.canConvertTemplateItem(dayResponse.templateItems![0])).toBeTrue();

    component.inventories = [{ id: 4, name: 'Inline', inventoryProducts: [{ id: 1, inventoryId: 4, productId: 1, qtyOnHandInUnits: 1, qtyOnHandNormalized: 1 }] } as never];
    component.selectedInventoryIds = [4];
    call('refreshSelectedInventoryProducts');
    expect(component.selectedInventoryProducts.length).toBeGreaterThan(0);
    component.selectedInventoryIds = [];
    call('refreshSelectedInventoryProducts');
    expect(component.selectedInventoryProducts).toEqual([]);
    call('ensureSelectedInventoriesStillValid');
    call('ensureSelectedSlotStillValid');
    expect(call('findItemById', 31)).toBe(dayResponse.items[0]);
    expect(call('findItemById', 999)).toBeNull();
    expect(call('findSlotForItem', dayResponse.items[0])).not.toBeNull();
    call('refreshAvailableSlots');
    call('syncManualTemplateSelectionFromResponse');
    call('refreshProductListItems');
    call('refreshSelectableProductListItems');
    expect(call('resolveConfiguredBaseUrl')).toBe('http://localhost:3000');
    component.baseUrl = ' http://custom ';
    expect(call('resolveConfiguredBaseUrl')).toBe('http://custom');
    component.baseUrl = '';
    expect(call('resolveConfiguredBaseUrl')).toBe('http://localhost:3000');
    expect(call('shouldEagerLoadProducts')).toBeTrue();
    call('applyServicesBaseUrl');
    call('syncPendingEditorContextFromInputs');
    call('applyInitialDateInput');
    call('handleInitialEditorContextChange');
    call('handleInitialDateContextChange');
    call('loadProductsForCurrentContext');
    call('applyPendingEditorContext');
    expect(call('buildItemEditorRequest')).toBeNull();
    expect(call('buildSelectedItemsRequest')).toBeNull();
    call('clearSelectedProducts');
    call('clearSelectedInventoryProducts');
    component.onBaseUrlChange();
    expect(component.baseUrl).toBe('http://localhost:3000');
  });
});

function privateMethod(
  component: InputDayFeature,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}
