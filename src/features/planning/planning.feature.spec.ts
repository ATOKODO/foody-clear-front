import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { PlanningFeature } from './planning.feature';
import { CycleService } from '../../services/cycle-service';
import { CycleAssignementService } from '../../services/cycle-assignement-service';
import { InputDayService } from '../../services/input-day-service';
import { ProductService } from '../../services/product-service';
import { InventoryService } from '../../services/inventory-service';
import { InputDayResponse } from '../../interfaces/input-day.interface';
import { InputDayFeature } from '../input-day/input-day.feature';

describe('PlanningFeature', () => {
  let component: PlanningFeature;
  let fixture: ComponentFixture<PlanningFeature>;

  const dayResponse: InputDayResponse = {
    dateLocal: '2026-02-16',
    timezone: 'UTC',
    assignment: null,
    daySet: null,
    items: [
      {
        id: 77,
        productId: 3,
        productName: 'Skyr',
        inventoryId: 4,
        qty: 150,
        qtyUnit: 'g',
        qtyNormalized: 150,
        insertedAt: '2026-02-16T08:25:00Z',
        occurredAt: '2026-02-16T08:00:00Z',
        slotId: 11,
        slotKey: 'breakfast',
        nutritionValue: {},
      },
    ],
    slots: [],
    itemsBySlot: [],
    totalsMacros: null,
  };

  const cycleServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const cycleAssignmentServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findInRange: jasmine.createSpy('findInRange').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of(null)),
    update: jasmine.createSpy('update').and.returnValue(of(null)),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  const inputDayServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getInputDay: jasmine.createSpy('getInputDay').and.returnValue(of(dayResponse)),
    getInputWeek: jasmine.createSpy('getInputWeek').and.returnValue(
      of({
        startDateLocal: '2026-02-16',
        endDateLocal: '2026-02-22',
        timezone: 'UTC',
        days: [dayResponse],
      }),
    ),
    createItem: jasmine.createSpy('createItem').and.returnValue(of([])),
    createItems: jasmine.createSpy('createItems').and.returnValue(of([])),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(of(null)),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(void 0)),
  };

  const productServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const inventoryServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    findProducts: jasmine.createSpy('findProducts').and.returnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningFeature],
      providers: [
        { provide: CycleService, useValue: cycleServiceMock },
        { provide: CycleAssignementService, useValue: cycleAssignmentServiceMock },
        { provide: InputDayService, useValue: inputDayServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanningFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open actions modal from calendar day click', () => {
    component.onCalendarDayClick({
      view: 'day',
      currentDateIso: '2026-02-16T00:00:00.000Z',
      day: {
        date: '2026-02-16',
        dateObj: {} as never,
        dayNumber: 16,
        isToday: false,
        isCurrentMonth: true,
        isWeekend: false,
      },
      sourceAssignment: null,
    });

    expect(component.activeModal).toBe('actions');
    expect(component.selectedModalDateLocal).toBe('2026-02-16');
  });

  it('should open items modal from action chooser and pass embedded input-day inputs', () => {
    component.onCalendarHourClick({
      view: 'day',
      currentDateIso: '2026-02-16T00:00:00.000Z',
      dateLocal: '2026-02-16',
      occurredAt: '2026-02-16T08:00:00Z',
      hour: {
        hour: 8,
        label: '08:00',
      },
      sourceAssignment: null,
    });
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.planning-action-item');
    trigger.click();
    fixture.detectChanges();

    const inputDay = fixture.debugElement.query(By.directive(InputDayFeature))
      .componentInstance as InputDayFeature;

    expect(component.activeModal).toBe('items');
    expect(inputDay.displayMode).toBe('embedded');
    expect(inputDay.initialDateLocal).toBe('2026-02-16');
    expect(inputDay.initialOccurredAt).toBe('2026-02-16T08:00:00Z');
    expect(inputDay.initialEditingItemId).toBeNull();
    expect(inputDay.apiBaseUrl).toBe(component.baseUrl);
    expect(inputDay.lockDate).toBeTrue();
  });

  it('should open items modal in edit mode from calendar item click', () => {
    component.onCalendarItemClick({
      view: 'week',
      currentDateIso: '2026-02-16T00:00:00.000Z',
      dateLocal: '2026-02-16',
      item: {
        id: 77,
        dateLocal: '2026-02-16',
        productId: 3,
        productName: 'Skyr',
        qty: 150,
        occurredAt: '2026-02-16T08:00:00Z',
        insertedAt: '2026-02-16T08:25:00Z',
        slotId: 11,
        slotTitle: 'Petit dejeuner',
        slotKey: 'breakfast',
      },
    });
    fixture.detectChanges();

    const inputDay = fixture.debugElement.query(By.directive(InputDayFeature))
      .componentInstance as InputDayFeature;

    expect(component.activeModal).toBe('items');
    expect(inputDay.initialEditingItemId).toBe(77);
    expect(inputDay.initialOccurredAt).toBeNull();
  });

  it('should keep manage items button opening items modal directly', () => {
    component.onCalendarManageItems({
      view: 'day',
      currentDateIso: '2026-02-16T00:00:00.000Z',
      dateLocal: '2026-02-16',
      sourceAssignment: null,
    });
    fixture.detectChanges();

    expect(component.activeModal).toBe('items');
    expect(component.selectedOccurredAt).toBeNull();
    expect(component.selectedItemId).toBeNull();
  });

  it('should reload current input data when embedded items change', () => {
    const reloadSpy = spyOn<any>(component, 'reloadInputDataForCurrentView');

    component.onEmbeddedItemsChanged({ dateLocal: '2026-02-16' });

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should reload week input data after base url change when week view is active', () => {
    component.currentCalendarView = 'week';
    component.currentAnchorDateLocal = '2026-02-18';
    component.currentRangeFromLocal = '2026-02-16';
    component.currentRangeToLocal = '2026-02-22';

    component.onBaseUrlChange();

    expect(inputDayServiceMock.getInputWeek).toHaveBeenCalledWith(
      '2026-02-16',
      jasmine.any(String),
    );
  });
});
