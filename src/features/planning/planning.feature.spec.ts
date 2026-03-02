import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { PlanningFeature } from './planning.feature';
import { CycleService } from '../../services/cycle-service';
import { CycleAssignementService } from '../../services/cycle-assignement-service';
import { InputDayService } from '../../services/input-day-service';
import { ProductService } from '../../services/product-service';
import { InventoryService } from '../../services/inventory-service';
import { InputDayFeature } from '../input-day/input-day.feature';

describe('PlanningFeature', () => {
  let component: PlanningFeature;
  let fixture: ComponentFixture<PlanningFeature>;

  const dayResponse = {
    dateLocal: '2026-02-16',
    timezone: 'UTC',
    assignment: null,
    daySet: null,
    items: [],
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
    createItems: jasmine.createSpy('createItems').and.returnValue(of([])),
    updateItemQty: jasmine.createSpy('updateItemQty').and.returnValue(of(null)),
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
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanningFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open assignment modal from calendar day click', () => {
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

    expect(component.activeModal).toBe('assignment');
    expect(component.selectedModalDateLocal).toBe('2026-02-16');
  });

  it('should open items modal and pass embedded input-day inputs', () => {
    component.onCalendarManageItems({
      view: 'day',
      currentDateIso: '2026-02-16T00:00:00.000Z',
      dateLocal: '2026-02-16',
      sourceAssignment: null,
    });
    fixture.detectChanges();

    const inputDay = fixture.debugElement.query(By.directive(InputDayFeature))
      .componentInstance as InputDayFeature;

    expect(component.activeModal).toBe('items');
    expect(inputDay.displayMode).toBe('embedded');
    expect(inputDay.initialDateLocal).toBe('2026-02-16');
    expect(inputDay.apiBaseUrl).toBe(component.baseUrl);
    expect(inputDay.lockDate).toBeTrue();
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

    expect(inputDayServiceMock.getInputWeek).toHaveBeenCalledWith('2026-02-16', jasmine.any(String));
  });
});
