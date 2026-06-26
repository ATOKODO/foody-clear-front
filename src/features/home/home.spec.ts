import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import { APP_NAVIGATION } from '../../app/app.navigation';
import { InputDayResponse } from '../../interfaces/input-day.interface';
import { StatisticsTimelineResponse } from '../../interfaces/statistics.interface';
import { InventoryService } from '../../services/inventory-service';
import { InputDayService } from '../../services/input-day-service';
import { ProductService } from '../../services/product-service';
import { StatisticService } from '../../services/statistic-service';
import { TemplateService } from '../../services/template-service';
import { Home } from './home';

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
        stockByInventory: [],
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter(testRoutes),
        { provide: InputDayService, useValue: inputDayServiceMock },
        { provide: StatisticService, useValue: statisticServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: TemplateService, useValue: templateServiceMock },
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

    expect(compiled.textContent).toContain('Tableau de bord');
    expect(compiled.textContent).toContain('Ouvrir le catalogue');
    expect(compiled.textContent).toContain('Voir le planning');
    expect(compiled.textContent).toContain('Cycle prise de masse');
    expect(compiled.textContent).toContain('Jour entrainement');
    expect(compiled.textContent).toContain('Ce qui est prevu aujourd\'hui');
    expect(compiled.textContent).toContain('Porridge');
    expect(compiled.textContent).toContain('Banane');
    expect(compiled.textContent).toContain('2,50');
  });

  it('should load today planning and statistics', () => {
    expect(inputDayServiceMock.getInputDay).toHaveBeenCalledWith(today, timezone);
    expect(statisticServiceMock.getTimeline).toHaveBeenCalledWith(
      today,
      today,
      timezone,
    );
  });
});
