import { Component } from '@angular/core';
import { ComponentFixture, DeferBlockState, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { DateTime } from 'luxon';
import { Subject, of, throwError } from 'rxjs';
import { APP_NAVIGATION } from '../../app/app.navigation';
import { InputDayResponse } from '../../interfaces/input-day.interface';
import { StatisticsTimelineResponse } from '../../interfaces/statistics.interface';
import { InventoryService } from '../../services/inventory-service';
import { InputDayService } from '../../services/input-day-service';
import { ExternalMealEntryDialogService } from '../../services/external-meal-entry-dialog-service';
import { ProductService } from '../../services/product-service';
import { SlotService } from '../../services/slot-service';
import { StatisticService } from '../../services/statistic-service';
import { TemplateService } from '../../services/template-service';
import { Home } from './home';
import { InputDayFeature } from '../input-day/input-day.feature';

@Component({
  standalone: true,
  template: '<p>Page test</p>',
})
class DummyPage {}

const testRoutes: Routes = APP_NAVIGATION.flatMap((group) =>
  group.entries.map((entry) => ({
    path: entry.path.replace(/^\//, ''),
    component: DummyPage,
  })),
);

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  const today = DateTime.local().toFormat('yyyy-LL-dd');
  const timezone = DateTime.local().zoneName || 'UTC';

  const dayResponse: InputDayResponse = {
    dateLocal: today,
    timezone,
    assignment: {
      id: 8,
      cycleId: 2,
      cycleTitle: 'Cycle prise de masse',
      startDateLocal: today,
      endDateLocal: today,
      dayIndex: 1,
    },
    daySet: {
      id: 4,
      title: 'Jour entrainement',
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
    templateAssociation: {
      source: 'daySet',
      template: { id: 6, title: 'Matin standard' },
    },
    templateItems: [
      {
        id: 41,
        productId: 12,
        productName: 'Porridge',
        qty: 80,
        qtyUnit: 'g',
        qtyNormalized: 80,
        slotId: 11,
        slotKey: 'breakfast',
        preferredTime: '08:15:00',
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
    items: [
      {
        id: 31,
        productId: 13,
        productName: 'Banane',
        inventoryId: 4,
        qty: 1,
        qtyUnit: 'piece',
        qtyNormalized: 1,
        insertedAt: `${today}T08:05:00+02:00`,
        occurredAt: `${today}T08:00:00+02:00`,
        slotId: 11,
        slotKey: 'breakfast',
        nutritionValue: {},
      },
    ],
    totalsMacros: {
      bySlot: [],
      dayTotal: {
        energyKcal: 720,
        proteins: 35,
        carbs: 90,
        lipids: 18,
      },
      targets: {
        energyKcal: 2400,
        proteins: 150,
        carbs: 260,
        lipids: 70,
      },
      deltaToTargets: {
        energyKcal: -1680,
        proteins: -115,
        carbs: -170,
        lipids: -52,
      },
      incompleteNutritionKeys: [],
      targetSource: 'daySet',
    },
    projectedTotalsMacros: null,
    itemsBySlot: [],
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
  };

  const timelineResponse: StatisticsTimelineResponse = {
    fromDateLocal: today,
    toDateLocal: today,
    timezone,
    summary: {
      totalAmount: 2.5,
      purchaseCount: 1,
      incompletePurchaseCount: 0,
      dayCount: 1,
    },
    days: [
      {
        dateLocal: today,
        expenses: {
          totalAmount: 2.5,
          purchaseCount: 1,
          incompletePurchaseCount: 0,
          events: [
            {
              id: 91,
              inventoryId: 4,
              inventoryName: 'Stock principal',
              productId: 13,
              productName: 'Banane',
              qty: 1,
              qtyUnit: 'piece',
              qtyNormalized: 1,
              qtyInProductUnits: 1,
              priceSnapshot: 2.5,
              priceUnitSnapshot: 'unite',
              expenseAmount: 2.5,
              pricingStatus: 'complete',
              occurredAt: `${today}T07:55:00+02:00`,
            },
          ],
        },
        inputs: {
          assignment: dayResponse.assignment,
          daySet: { id: 4, title: 'Jour entrainement' },
          targetSource: 'daySet',
          dayTotal: dayResponse.totalsMacros?.dayTotal ?? {},
          targets: dayResponse.totalsMacros?.targets ?? null,
          deltaToTargets: dayResponse.totalsMacros?.deltaToTargets ?? null,
          incompleteNutritionKeys: [],
          itemCount: 1,
        },
      },
    ],
  };

  const inputDayServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getInputDay: jasmine.createSpy('getInputDay').and.returnValue(of(dayResponse)),
    createItem: jasmine.createSpy('createItem').and.returnValue(of({})),
    createItems: jasmine.createSpy('createItems').and.returnValue(of({})),
    updateItem: jasmine.createSpy('updateItem').and.returnValue(of({})),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(void 0)),
    setTemplate: jasmine.createSpy('setTemplate').and.returnValue(of(dayResponse)),
    convertTemplateItem: jasmine
      .createSpy('convertTemplateItem')
      .and.returnValue(of(dayResponse)),
  };

  const statisticServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getTimeline: jasmine
      .createSpy('getTimeline')
      .and.returnValue(of(timelineResponse)),
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

  const slotServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
  };

  const externalMealEntryDialogMock = {
    openCreate: jasmine.createSpy('openCreate').and.returnValue(of(undefined)),
  };

  beforeEach(async () => {
    inputDayServiceMock.getInputDay.calls.reset();
    inputDayServiceMock.getInputDay.and.returnValue(of(dayResponse));
    inputDayServiceMock.convertTemplateItem.calls.reset();
    inputDayServiceMock.convertTemplateItem.and.returnValue(of(dayResponse));
    inputDayServiceMock.removeItem.calls.reset();
    inputDayServiceMock.removeItem.and.returnValue(of(void 0));
    statisticServiceMock.getTimeline.calls.reset();
    statisticServiceMock.getTimeline.and.returnValue(of(timelineResponse));
    slotServiceMock.findAll.calls.reset();
    slotServiceMock.findAll.and.returnValue(of([]));
    externalMealEntryDialogMock.openCreate.calls.reset();
    externalMealEntryDialogMock.openCreate.and.returnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter(testRoutes),
        { provide: InputDayService, useValue: inputDayServiceMock },
        { provide: StatisticService, useValue: statisticServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: TemplateService, useValue: templateServiceMock },
        { provide: SlotService, useValue: slotServiceMock },
        { provide: ExternalMealEntryDialogService, useValue: externalMealEntryDialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the daily operational dashboard', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Open catalog');
    expect(compiled.textContent).toContain('View planning');
    expect(compiled.textContent).toContain('Day planning');
    expect(compiled.textContent).toContain('What is planned today');
    expect(compiled.textContent).toContain('Porridge');
    expect(compiled.textContent).toContain('Banane');
    expect(compiled.textContent).toContain("Today's spending");
  });

  it('should load today planning on init', () => {
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(today, timezone);
  });

  it('refreshes the date and planning links at local midnight', fakeAsync(() => {
    let now = DateTime.fromISO('2026-10-24T23:59:00', { zone: 'Europe/Paris' });
    spyOn(DateTime, 'local').and.callFake(() => now as ReturnType<typeof DateTime.local>);
    component.refreshDashboard();
    now = now.plus({ minutes: 1 });
    tick(60_000);
    fixture.detectChanges();

    expect(component.todayDateLocal).toBe('2026-10-25');
    expect(component.planningTodayQueryParams).toEqual({ view: 'day', date: '2026-10-25' });
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith('2026-10-25', 'Europe/Paris');
    expect(statisticServiceMock.getTimeline).toHaveBeenCalledWith('2026-10-25', '2026-10-25', 'Europe/Paris');
    fixture.destroy();
  }));

  it('updates the date in an already opened quick-entry form', async () => {
    const [quickEntry] = await fixture.getDeferBlocks();
    await quickEntry.render(DeferBlockState.Complete);
    fixture.detectChanges();
    const now = DateTime.local().plus({ days: 1 });
    spyOn(DateTime, 'local').and.callFake(() => now as ReturnType<typeof DateTime.local>);
    component.refreshDashboard();
    fixture.detectChanges();
    const inputForm = fixture.debugElement.query(By.directive(InputDayFeature)).componentInstance as InputDayFeature;
    expect(inputForm.initialDateLocal()).toBe(now.toISODate());
  });

  it('refreshes a suspended dashboard on focus and ignores previous-day replies', () => {
    let now = DateTime.fromISO('2026-10-01T23:50:00', { zone: 'Europe/Paris' });
    spyOn(DateTime, 'local').and.callFake(() => now as ReturnType<typeof DateTime.local>);
    const oldDay = new Subject<InputDayResponse>();
    const newDay = new Subject<InputDayResponse>();
    const oldTimeline = new Subject<StatisticsTimelineResponse>();
    const newTimeline = new Subject<StatisticsTimelineResponse>();
    inputDayServiceMock.getInputDay.and.callFake((date: string) => date === '2026-10-01' ? oldDay : newDay);
    statisticServiceMock.getTimeline.and.callFake((date: string) => date === '2026-10-01' ? oldTimeline : newTimeline);
    component.refreshDashboard();
    now = now.plus({ days: 1 });
    window.dispatchEvent(new Event('focus'));
    const currentDay = { ...dayResponse, dateLocal: '2026-10-02' };
    const currentTimeline = { ...timelineResponse, fromDateLocal: '2026-10-02', toDateLocal: '2026-10-02' };
    newDay.next(currentDay);
    newTimeline.next(currentTimeline);
    oldDay.next(dayResponse);
    oldTimeline.error(new Error('late failure'));

    expect(component.todayDateLocal).toBe('2026-10-02');
    expect(component.inputDayResponse).toBe(currentDay);
    expect(component.timelineResponse).toBe(currentTimeline);
    expect(component.timelineError).toBeNull();
    expect(component.loading).toBeFalse();
  });

  it('should load planning and statistics on manual refresh', () => {
    inputDayServiceMock.getInputDay.calls.reset();
    statisticServiceMock.getTimeline.calls.reset();

    component.refreshDashboard();

    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(today, timezone);
    expect(statisticServiceMock.getTimeline).toHaveBeenCalledWith(
      today,
      today,
      timezone,
    );
  });

  it('should expose dashboard getters and delegate formatting helpers', () => {
    component.inputDayResponse = dayResponse;
    component.timelineResponse = timelineResponse;
    expect(component.loading).toBeFalse();
    expect(component.showPrimaryLoading).toBeFalse();
    expect(component.todayTimelineDay).toBe(timelineResponse.days[0]);
    expect(component.activeCycleLabel).toBe('Cycle prise de masse');
    expect(component.activeDaySetLabel).toBe('Jour entrainement');
    expect(component.enteredItemCount).toBe(1);
    expect(component.pendingTemplateItems).toHaveSize(1);
    expect(component.convertedTemplateItems).toEqual([]);
    expect(component.scheduleRows.length).toBeGreaterThan(0);
    expect(component.dayEntryRows).toHaveSize(1);
    expect(component.macroCards).toHaveSize(4);
    expect(component.recentPurchaseEvents).toHaveSize(1);
    expect(component.todayExpenseTotal).toContain('2');
    expect(component.purchaseCount).toBe(1);
    expect(component.incompletePurchaseCount).toBe(0);
    expect(component.targetSourceLabel).toBe('Day set');
    expect(component.formatCurrency(2.5)).toContain('2');
    expect(component.formatItemQty(dayResponse.items[0])).toBe('1 piece');
    expect(component.formatDateTime(null)).toBe('-');
    expect(component.getPurchaseEventLabel(timelineResponse.days[0].expenses.events[0])).toContain('2');
    expect(component.getTemplateStockLabel(dayResponse.templateItems![0])).toBe('Stock OK');
    expect(component.getTemplateSlotLabel(dayResponse.templateItems![0])).toContain('Petit dejeuner');
    expect(component.canConvertTemplateItem(dayResponse.templateItems![0])).toBeTrue();
    expect(component.isConvertedTemplateItem(dayResponse.templateItems![0])).toBeFalse();

    component.loadingDay = true;
    expect(component.showPrimaryLoading).toBeFalse();
    component.inputDayResponse = null;
    expect(component.showPrimaryLoading).toBeTrue();
    component.loadingTimeline = true;
    expect(component.loading).toBeTrue();
  });

  it('should refresh after an external entry and handle conversion actions', () => {
    const refresh = spyOn(component, 'refreshDashboard').and.callThrough();
    externalMealEntryDialogMock.openCreate.and.returnValue(of({ dateLocal: today }));
    component.inputDayResponse = dayResponse;
    component.openExternalMealEntry();
    expect(externalMealEntryDialogMock.openCreate).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();

    refresh.calls.reset();
    externalMealEntryDialogMock.openCreate.and.returnValue(of(undefined));
    component.openExternalMealEntry();
    expect(refresh).not.toHaveBeenCalled();

    const item = dayResponse.templateItems![0];
    inputDayServiceMock.convertTemplateItem.and.returnValue(of(dayResponse));
    component.loadingDay = false;
    component.convertTemplateItem(item);
    expect(inputDayServiceMock.convertTemplateItem).toHaveBeenCalledWith(today, item.id, [4]);

    component.loadingDay = true;
    component.convertTemplateItem(item);
    component.loadingDay = false;
    component.convertTemplateItem({ ...item, stockAvailability: { ...item.stockAvailability, enoughStock: false } });

    inputDayServiceMock.convertTemplateItem.and.returnValue(throwError(() => new Error('convert')));
    component.convertTemplateItem(item);
    expect(component.dayError).toEqual(jasmine.any(Error));
    expect(component.loadingDay).toBeFalse();

    inputDayServiceMock.removeItem.and.returnValue(of(void 0));
    component.inputDayResponse = {
      ...dayResponse,
      items: [{ ...dayResponse.items[0], templateItemId: item.id }],
    };
    component.revertTemplateItem(item);
    expect(inputDayServiceMock.removeItem).toHaveBeenCalledWith(today, 31);
    inputDayServiceMock.removeItem.and.returnValue(throwError(() => new Error('revert')));
    component.revertTemplateItem({ ...item, convertedItemId: 31 });
    expect(component.dayError).toEqual(jasmine.any(Error));
  });

  it('should cover loading success and error paths for planning, stats and slots', async () => {
    const internals = component as unknown as {
      slotCatalogLoaded: boolean;
      slotCatalog: unknown[];
      ensureSlotCatalogLoaded(): void;
      loadSlotCatalog(): void;
      loadTodayPlanning(): void;
      loadTodayStats(): void;
      runAfterFirstPaint(task: () => void): void;
    };
    const slot = {
      id: 11,
      key: 'breakfast',
      title: 'Breakfast',
      sortOrder: 1,
      startTime: '08:00',
      endTime: '09:00',
    };
    slotServiceMock.findAll.and.returnValue(of([slot]));
    internals.slotCatalogLoaded = false;
    internals.ensureSlotCatalogLoaded();
    expect(internals.slotCatalog).toEqual([slot]);
    expect(internals.slotCatalogLoaded).toBeTrue();
    const slotCalls = slotServiceMock.findAll.calls.count();
    internals.ensureSlotCatalogLoaded();
    expect(slotServiceMock.findAll.calls.count()).toBe(slotCalls);

    slotServiceMock.findAll.and.returnValue(throwError(() => new Error('slots')));
    internals.slotCatalogLoaded = false;
    internals.loadSlotCatalog();
    expect(internals.slotCatalog).toEqual([]);
    expect(internals.slotCatalogLoaded).toBeTrue();

    inputDayServiceMock.getInputDay.and.returnValue(of(dayResponse));
    internals.loadTodayPlanning();
    expect(component.inputDayResponse).toBe(dayResponse);
    inputDayServiceMock.getInputDay.and.returnValue(throwError(() => new Error('planning')));
    internals.loadTodayPlanning();
    expect(component.inputDayResponse).toBeNull();
    expect(component.dayError).toEqual(jasmine.any(Error));

    statisticServiceMock.getTimeline.and.returnValue(of(timelineResponse));
    internals.loadTodayStats();
    expect(component.timelineResponse).toBe(timelineResponse);
    statisticServiceMock.getTimeline.and.returnValue(throwError(() => new Error('stats')));
    internals.loadTodayStats();
    expect(component.timelineResponse).toBeNull();
    expect(component.timelineError).toEqual(jasmine.any(Error));

    const task = jasmine.createSpy('task');
    internals.runAfterFirstPaint(task);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 0));
    expect(task).toHaveBeenCalled();
    spyOn(component, 'refreshDashboard');
    component.onInputDayItemsChanged();
    expect(component.refreshDashboard).toHaveBeenCalled();
  });
});
