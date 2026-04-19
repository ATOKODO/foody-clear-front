import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { PlanningFeature } from './planning.feature';
import { CycleService } from '../../services/cycle-service';
import { CycleAssignementService } from '../../services/cycle-assignement-service';
import { InputDayService } from '../../services/input-day-service';
import { ProductService } from '../../services/product-service';
import { InventoryService } from '../../services/inventory-service';
import { TemplateService } from '../../services/template-service';
import { InputDayResponse } from '../../interfaces/input-day.interface';
import { CycleAssignment } from '../../interfaces/cycle-assignment.interface';
import { InputDayFeature } from '../input-day/input-day.feature';
import { Calendar } from '../../components/calendar/calendar';

@Component({
  selector: 'app-calendar',
  standalone: true,
  template: '',
})
class CalendarStub {
  @Input() cycleAssignments: unknown = null;
  @Input() inputDayResponse: unknown = null;
  @Input() inputWeekResponse: unknown = null;
  @Input() inputMonthResponse: unknown = null;
  @Input() inputDayItemsBySlot: unknown = null;
  @Input() inputDayTimezone: unknown = null;
  @Input() loadingDayItems: unknown = null;
  @Input() dayItemsError: unknown = null;
  @Input() showHeader = true;

  currentView = 'month';
  currentViewLabel = 'mars 2026';

  @Output() readonly viewChanged = new EventEmitter<unknown>();
  @Output() readonly dayClick = new EventEmitter<unknown>();
  @Output() readonly hourClick = new EventEmitter<unknown>();
  @Output() readonly itemClick = new EventEmitter<unknown>();
  @Output('manageAssignment') readonly manageAssignmentRequested = new EventEmitter<unknown>();
  @Output() readonly manageItems = new EventEmitter<unknown>();
  @Output() readonly monthClick = new EventEmitter<unknown>();
  @Output('openDayView') readonly openDayViewRequested = new EventEmitter<unknown>();

  goToToday(): void {}

  navigate(_: 'prev' | 'next'): void {}

  switchView(view: string): void {
    this.currentView = view;
  }

  openDayView(dateLocal: string): void {
    this.currentView = 'day';
    this.currentViewLabel = dateLocal;
    this.viewChanged.emit({
      view: 'day',
      anchorDateLocal: dateLocal,
      fromDateLocal: dateLocal,
      toDateLocal: dateLocal,
    });
  }

  getViewLabel(view: string): string {
    if (view === 'year') {
      return 'Annee';
    }

    if (view === 'month') {
      return 'Mois';
    }

    if (view === 'week') {
      return 'Semaine';
    }

    return 'Jour';
  }
}

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
    getInputMonth: jasmine.createSpy('getInputMonth').and.returnValue(
      of({
        startDateLocal: '2026-02-01',
        endDateLocal: '2026-02-28',
        timezone: 'UTC',
        days: [dayResponse],
      }),
    ),
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
    setTemplate: jasmine.createSpy('setTemplate').and.returnValue(of(dayResponse)),
    convertTemplateItem: jasmine.createSpy('convertTemplateItem').and.returnValue(of(dayResponse)),
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

  const templateServiceMock = {
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
        { provide: TemplateService, useValue: templateServiceMock },
      ],
    })
      .overrideComponent(PlanningFeature, {
        remove: { imports: [Calendar] },
        add: { imports: [CalendarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PlanningFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep only planning controls in the local header', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(fixture.nativeElement.querySelector('[data-testid="planning-today"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="planning-refresh"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="planning-view-toggle"]')).toBeTruthy();
    expect(textContent).not.toContain('Planning');
    expect(textContent).not.toContain('Assignations');
    expect(textContent).not.toContain('Affectation des cycles et suivi des jours');
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

  it('should open input-day modal directly from day hour click and pass embedded inputs', () => {
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

    const inputDay = fixture.debugElement.query(By.directive(InputDayFeature))
      .componentInstance as InputDayFeature;

    expect(component.activeModal).toBe('items');
    expect(inputDay.displayMode).toBe('embedded');
    expect(inputDay.initialDateLocal).toBe('2026-02-16');
    expect(inputDay.initialOccurredAt).toBe('2026-02-16T08:00:00Z');
    expect(inputDay.initialEditingItemId).toBeNull();
    expect(inputDay.apiBaseUrl).toBe(component.baseUrl);
    expect(inputDay.lockDate).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-testid="planning-modal-actions"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Date selectionnee:');
  });

  it('should open input-day modal directly from week hour click', () => {
    component.onCalendarHourClick({
      view: 'week',
      currentDateIso: '2026-02-19T00:00:00.000Z',
      dateLocal: '2026-02-19',
      occurredAt: '2026-02-19T18:30:00Z',
      hour: {
        hour: 18,
        label: '18:30',
      },
      sourceAssignment: null,
    });
    fixture.detectChanges();

    const inputDay = fixture.debugElement.query(By.directive(InputDayFeature))
      .componentInstance as InputDayFeature;

    expect(component.activeModal).toBe('items');
    expect(inputDay.initialDateLocal).toBe('2026-02-19');
    expect(inputDay.initialOccurredAt).toBe('2026-02-19T18:30:00Z');
    expect(fixture.nativeElement.querySelector('[data-testid="planning-modal-actions"]')).toBeNull();
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

  it('should open the clicked month day in day view from calendar openDayView output', () => {
    const calendar = fixture.debugElement.query(By.directive(CalendarStub))
      .componentInstance as CalendarStub;
    const openDayViewSpy = spyOn(calendar, 'openDayView').and.callThrough();
    inputDayServiceMock.getInputDay.calls.reset();

    calendar.openDayViewRequested.emit({ dateLocal: '2026-02-16' });

    expect(openDayViewSpy).toHaveBeenCalledWith('2026-02-16');
    expect(calendar.currentView).toBe('day');
    expect(component.currentCalendarView).toBe('day');
    expect(component.currentAnchorDateLocal).toBe('2026-02-16');
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(
      '2026-02-16',
      jasmine.any(String),
    );
  });

  it('should open assignment modal directly from calendar manageAssignment output', () => {
    const calendar = fixture.debugElement.query(By.directive(CalendarStub))
      .componentInstance as CalendarStub;
    const sourceAssignment: CycleAssignment = {
      id: 31,
      cycle: {
        id: 7,
        title: 'Prise de masse',
        color: 'red',
        durationDays: 14,
        durationCount: 2,
        durationType: 'semaine',
        nutritionValues: [],
      },
      startDateLocal: '2026-02-16',
      endDateLocal: '2026-03-01',
    };

    calendar.manageAssignmentRequested.emit({
      view: 'month',
      currentDateIso: '2026-02-16T00:00:00.000Z',
      dateLocal: '2026-02-16',
      sourceAssignment,
    });
    fixture.detectChanges();

    expect(component.activeModal).toBe('assignment');
    expect(component.selectedModalDateLocal).toBe('2026-02-16');
    expect(component.editingAssignment).toEqual(sourceAssignment);
    expect(component.modalSelectedCycleId).toBe(7);
    expect(fixture.nativeElement.querySelector('[data-testid="planning-modal-actions"]')).toBeNull();
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

  it('should reload month input data after base url change when month view is active', () => {
    component.currentCalendarView = 'month';
    component.currentAnchorDateLocal = '2026-02-18';
    component.currentRangeFromLocal = '2026-02-01';
    component.currentRangeToLocal = '2026-02-28';

    component.onBaseUrlChange();

    expect(inputDayServiceMock.getInputMonth).toHaveBeenCalledWith(
      '2026-02-01',
      jasmine.any(String),
    );
  });

  it('should refresh cycles, assignments and input data when planning is refreshed', () => {
    component.currentCalendarView = 'day';
    component.currentAnchorDateLocal = '2026-02-18';
    component.currentRangeFromLocal = '2026-02-16';
    component.currentRangeToLocal = '2026-02-22';

    cycleServiceMock.findAll.calls.reset();
    cycleAssignmentServiceMock.findInRange.calls.reset();
    inputDayServiceMock.getInputDay.calls.reset();

    component.refreshPlanningData();

    expect(cycleServiceMock.findAll).toHaveBeenCalled();
    expect(cycleAssignmentServiceMock.findInRange).toHaveBeenCalledWith(
      '2026-02-16',
      '2026-02-22',
    );
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(
      '2026-02-18',
      jasmine.any(String),
    );
  });

  it('should refresh month input data when planning is refreshed in month view', () => {
    component.currentCalendarView = 'month';
    component.currentAnchorDateLocal = '2026-02-18';
    component.currentRangeFromLocal = '2026-02-01';
    component.currentRangeToLocal = '2026-02-28';

    cycleServiceMock.findAll.calls.reset();
    cycleAssignmentServiceMock.findInRange.calls.reset();
    inputDayServiceMock.getInputMonth.calls.reset();

    component.refreshPlanningData();

    expect(cycleServiceMock.findAll).toHaveBeenCalled();
    expect(cycleAssignmentServiceMock.findInRange).toHaveBeenCalledWith(
      '2026-02-01',
      '2026-02-28',
    );
    expect(inputDayServiceMock.getInputMonth).toHaveBeenCalledWith(
      '2026-02-01',
      jasmine.any(String),
    );
  });

  it('should load month input data when the calendar switches to month view', () => {
    inputDayServiceMock.getInputMonth.calls.reset();

    component.onCalendarViewChanged({
      view: 'month',
      anchorDateLocal: '2026-02-18',
      fromDateLocal: '2026-02-01',
      toDateLocal: '2026-02-28',
    });

    expect(inputDayServiceMock.getInputMonth).toHaveBeenCalledWith(
      '2026-02-01',
      jasmine.any(String),
    );
    expect(component.inputMonthResponse?.startDateLocal).toBe('2026-02-01');
  });

  it('should refresh planning data when window focus returns', () => {
    const refreshSpy = spyOn(component, 'refreshPlanningData');

    component.onWindowFocus();

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should build cycle picker items from nutrition values and nested day sets', () => {
    component.cycles = [
      {
        id: 11,
        title: 'Seche',
        color: 'green',
        durationDays: 28,
        durationCount: 4,
        durationType: 'semaine',
        nutritionValues: [
          nutritionValue('PROTEIN', 180),
          nutritionValue('CARBOHYDRATE', 120),
          nutritionValue('FAT', 60),
        ],
        daySets: [
          {
            id: 5,
            title: 'Training',
            nutritionValues: [
              nutritionValue('PROTEIN', 100),
              nutritionValue('CARBOHYDRATE', 90),
              nutritionValue('FAT', 30),
            ],
            slots: [
              {
                id: 21,
                key: 'breakfast',
                title: 'Petit dejeuner',
                sortOrder: 1,
                startTime: '08:00:00',
                endTime: '09:00:00',
                nutritionValues: [nutritionValue('PROTEIN', 50)],
              },
            ],
          },
        ],
      },
    ];

    const [item] = component.cycleListItems;

    expect(item.proteins).toBe(180);
    expect(item.carbs).toBe(120);
    expect(item.daySets[0].title).toBe('Training');
    expect(item.daySets[0].slots[0].title).toBe('Petit dejeuner');
    expect(item.missingDayCount).toBe(27);
    expect(item.daySetTotals.proteins).toBeCloseTo(177.14, 2);
  });

  it('should submit assignment payload without endDateLocal', () => {
    component.cycles = [
      {
        id: 11,
        title: 'Mois fixe',
        color: 'blue',
        durationDays: 30,
        durationCount: 1,
        durationType: 'mois',
        nutritionValues: [],
      },
    ];
    component.modalSelectedCycleId = 11;
    component.modalStartDateLocal = '2026-03-10';

    component.saveAssignmentFromModal();

    expect(cycleAssignmentServiceMock.create).toHaveBeenCalledWith({
      cycleId: 11,
      startDateLocal: '2026-03-10',
    });
  });

  function nutritionValue(
    nutritionKey: string,
    amount: number,
    unit = 'G',
  ): {
    nutritionKey: string;
    amount: number;
    unit: string;
    reference: 'PER_100G';
  } {
    return {
      nutritionKey,
      amount,
      unit,
      reference: 'PER_100G',
    };
  }
});
