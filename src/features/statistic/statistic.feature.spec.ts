import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import type { ProductPriceHistoryStatsResponse, StatisticsTimelineResponse } from '../../interfaces/statistics.interface';

import { StatisticFeature } from './statistic.feature';
import { StatisticService } from '../../services/statistic-service';
import { ProductService } from '../../services/product-service';

describe('StatisticFeature', () => {
  let component: StatisticFeature;
  let fixture: ComponentFixture<StatisticFeature>;
  const defaultTimelineResponse = {
    fromDateLocal: '2026-03-01',
    toDateLocal: '2026-03-03',
    timezone: 'Europe/Paris',
    summary: {
      totalAmount: 12.5,
      purchaseCount: 2,
      incompletePurchaseCount: 1,
      dayCount: 3,
    },
    days: [
      {
        dateLocal: '2026-03-01',
        expenses: {
          totalAmount: 12.5,
          purchaseCount: 1,
          incompletePurchaseCount: 0,
          events: [
            {
              id: 9,
              inventoryId: 4,
              inventoryName: 'Stock',
              productId: 1,
              productName: 'Produit',
              qty: 1,
              qtyUnit: 'unit',
              qtyNormalized: 1,
              qtyInProductUnits: 1,
              priceSnapshot: 2.5,
              priceUnitSnapshot: 'kg',
              expenseAmount: 12.5,
              pricingStatus: 'complete',
              occurredAt: '2026-03-01T08:00:00.000Z',
            },
          ],
        },
        inputs: {
          assignment: null,
          daySet: null,
          targetSource: 'none',
          dayTotal: {},
          targets: null,
          deltaToTargets: null,
          incompleteNutritionKeys: [],
          itemCount: 0,
        },
      },
    ],
  };
  const statisticService = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getTimeline: jasmine
      .createSpy('getTimeline')
      .and.returnValue(of(defaultTimelineResponse)),
    updatePurchaseEventExclusion: jasmine
      .createSpy('updatePurchaseEventExclusion')
      .and.returnValue(
        of({
          fromDateLocal: '2026-03-01',
          toDateLocal: '2026-03-03',
          timezone: 'Europe/Paris',
          summary: {
            totalAmount: 0,
            purchaseCount: 0,
            incompletePurchaseCount: 0,
            dayCount: 3,
          },
          days: [],
        }),
      ),
    correctProductPrice: jasmine
      .createSpy('correctProductPrice')
      .and.returnValue(
        of({
          productId: 1,
          recalculatedPurchaseCount: 1,
          priceHistory: {
            fromDateLocal: '2026-03-01',
            toDateLocal: '2026-03-03',
            timezone: 'Europe/Paris',
            product: { id: 1, name: 'Produit' },
            currentPrice: { price: 3, priceUnit: 'kg' },
            baselineBeforeRange: null,
            changes: [],
            stats: {
              firstPrice: 3,
              lastPrice: 3,
              absoluteDelta: 0,
              relativeDeltaPct: 0,
              changeCount: 0,
              minPrice: 3,
              maxPrice: 3,
              priceUnit: 'kg',
              hasMixedUnits: false,
            },
          },
        }),
      ),
    getProductPriceHistory: jasmine
      .createSpy('getProductPriceHistory')
      .and.returnValue(
        of({
          fromDateLocal: '2026-03-01',
          toDateLocal: '2026-03-03',
          timezone: 'Europe/Paris',
          product: { id: 1, name: 'Produit' },
          currentPrice: { price: 2.5, priceUnit: 'kg' },
          baselineBeforeRange: null,
          changes: [],
          stats: {
            firstPrice: 2.5,
            lastPrice: 2.5,
            absoluteDelta: 0,
            relativeDeltaPct: 0,
            changeCount: 0,
            minPrice: 2.5,
            maxPrice: 2.5,
            priceUnit: 'kg',
            hasMixedUnits: false,
          },
        }),
      ),
  };
  const productService = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine
      .createSpy('findAll')
      .and.returnValue(
        of([{ id: 1, name: 'Produit', price: 2.5, priceUnit: 'kg' }]),
      ),
  };

  beforeEach(async () => {
    statisticService.getTimeline.calls.reset();
    statisticService.getTimeline.and.returnValue(of(defaultTimelineResponse));
    statisticService.updatePurchaseEventExclusion.calls.reset();
    statisticService.updatePurchaseEventExclusion.and.returnValue(
      of(defaultTimelineResponse),
    );
    statisticService.correctProductPrice.calls.reset();
    statisticService.correctProductPrice.and.returnValue(
      of({ priceHistory: null } as never),
    );
    statisticService.getProductPriceHistory.calls.reset();
    statisticService.getProductPriceHistory.and.returnValue(of({} as never));
    productService.findAll.calls.reset();
    productService.findAll.and.returnValue(
      of([{ id: 1, name: 'Produit', price: 2.5, priceUnit: 'kg' }]),
    );
    await TestBed.configureTestingModule({
      imports: [StatisticFeature],
      providers: [
        { provide: StatisticService, useValue: statisticService },
        { provide: ProductService, useValue: productService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the latest period when timeline replies arrive out of order', () => {
    const old = new Subject<StatisticsTimelineResponse>();
    const current = new Subject<StatisticsTimelineResponse>();
    statisticService.getTimeline.and.returnValues(old, current);
    component.applyQuickRange(7);
    component.applyQuickRange(14);
    const response = { ...defaultTimelineResponse, fromDateLocal: component.fromDateLocal, toDateLocal: component.toDateLocal } as StatisticsTimelineResponse;
    current.next(response);
    old.error(new Error('Old period failed'));
    expect(component.timelineResponse).toBe(response);
    expect(component.timelineError).toBeNull();
    expect(component.loadingTimeline).toBeFalse();
  });

  it('keeps the latest product and clears a pending history when no product is selected', () => {
    const old = new Subject<ProductPriceHistoryStatsResponse>();
    const current = new Subject<ProductPriceHistoryStatsResponse>();
    const pending = new Subject<ProductPriceHistoryStatsResponse>();
    statisticService.getProductPriceHistory.and.returnValues(old, current, pending);
    component.selectedPriceProductId = 1;
    component.onPriceProductChange();
    component.selectedPriceProductId = 2;
    component.onPriceProductChange();
    const response = { product: { id: 2, name: 'B' }, changes: [] } as unknown as ProductPriceHistoryStatsResponse;
    current.next(response);
    old.error(new Error('Old product failed'));
    expect(component.priceHistoryResponse).toBe(response);
    expect(component.priceHistoryError).toBeNull();
    component.onPriceProductChange();
    component.selectedPriceProductId = null;
    component.onPriceProductChange();
    pending.next(response);
    expect(component.priceHistoryResponse).toBeNull();
    expect(component.loadingPriceHistory).toBeFalse();
  });

  it('should show targets as the default first statistics view', () => {
    expect(component.activeView).toBe('targets');
    expect(component.views.map((view) => view.value)).toEqual([
      'targets',
      'expenses',
      'prices',
    ]);
  });

  it('refreshes the current period after an exclusion completes for an older period', () => {
    const mutation = new Subject<StatisticsTimelineResponse>();
    statisticService.updatePurchaseEventExclusion.and.returnValue(mutation);
    component.excludePurchaseEvent(component.timelineResponse!.days[0].expenses.events[0]);
    component.applyQuickRange(7);
    const current = { ...defaultTimelineResponse, fromDateLocal: component.fromDateLocal, toDateLocal: component.toDateLocal } as StatisticsTimelineResponse;
    statisticService.getTimeline.and.returnValue(of(current));
    mutation.next(defaultTimelineResponse as StatisticsTimelineResponse);
    expect(component.timelineResponse).toBe(current);
    expect(statisticService.getTimeline).toHaveBeenCalledWith(component.fromDateLocal, component.toDateLocal, component.timezone);
  });

  it('should exclude a refunded purchase event from statistics', () => {
    const event = component.timelineResponse!.days[0].expenses.events[0];

    component.excludePurchaseEvent(event);

    expect(statisticService.updatePurchaseEventExclusion).toHaveBeenCalledWith(
      9,
      {
        excludedFromStats: true,
        exclusionReason: 'refunded',
      },
      component.fromDateLocal,
      component.toDateLocal,
      component.timezone,
    );
  });

  it('should submit a product price correction over a period', () => {
    component.selectedPriceProductId = 1;
    component.priceCorrectionPrice = 3;
    component.priceCorrectionPriceUnit = 'kg';
    component.priceCorrectionFromDateLocal = '2026-03-01';
    component.priceCorrectionToDateLocal = '2026-03-03';
    component.priceCorrectionRecalculatePurchases = true;

    component.submitPriceCorrection();

    expect(statisticService.correctProductPrice).toHaveBeenCalledWith(
      {
        productId: 1,
        price: 3,
        priceUnit: 'kg',
        effectiveFrom: '2026-03-01',
        effectiveTo: '2026-03-03',
        recalculatePurchases: true,
      },
      component.timezone,
    );
  });

  it('should cover statistic ranges, formatting, restore actions and failures', () => {
    const event = component.timelineResponse!.days[0].expenses.events[0];
    component.restorePurchaseEvent(event);
    expect(statisticService.updatePurchaseEventExclusion).toHaveBeenCalledWith(
      9,
      { excludedFromStats: false, exclusionReason: null },
      component.fromDateLocal,
      component.toDateLocal,
      component.timezone,
    );
    statisticService.updatePurchaseEventExclusion.and.returnValue(throwError(() => new Error('exclude')));
    component.excludePurchaseEvent(event);
    expect(component.purchaseEventActionError).toEqual(jasmine.any(Error));
    statisticService.updatePurchaseEventExclusion.and.returnValue(of({ ...component.timelineResponse!, days: [] }));

    component.applyQuickRange(7);
    component.refresh();
    component.selectTimelineDay('2026-03-01');
    component.onPriceProductChange();
    component.onBaseUrlChange();
    expect(component.selectedTimelineDay).not.toBeNull();

    component.activeMetric = 'proteins';
    expect(component.expenseMax).toBeGreaterThanOrEqual(0);
    expect(component.targetMax).toBeGreaterThanOrEqual(0);
    expect(component.metricLabel).toContain('Protein');
    expect(component.metricUnit).toBe('g');
    expect(component.selectedProductName).toBe('Produit');
    expect(component.selectedDayExpenseTotal).toContain('€');
    expect(component.selectedDayTargetActual).toBe('--');
    expect(component.selectedDayTargetGoal).toBe('--');
    expect(component.selectedDayTargetDelta).toBe('--');
    expect(component.getBarHeight(2, 10)).toBe(20);
    expect(component.getTargetActualHeight(component.timelineResponse!.days[0])).toBeGreaterThanOrEqual(0);
    expect(component.getTargetGoalHeight(component.timelineResponse!.days[0])).toBeGreaterThanOrEqual(0);
    expect(component.formatCurrency(null)).toContain('0');
    expect(component.formatMetricValue(null)).toBe('--');
    expect(component.formatDateTime('bad')).toBe('bad');
    expect(component.formatDate('2026-03-01')).toContain('01');
    expect(component.formatPriceChangeUnit(null)).toBe('');
    expect(component.getPurchaseEventStatusLabel({ ...event, excludedFromStats: true } as never)).toContain('exclu');

    component.selectedPriceProductId = null;
    component.priceCorrectionPrice = null;
    component.priceCorrectionToDateLocal = '';
    component.submitPriceCorrection();
    expect(component.priceCorrectionError).toBeTruthy();
    component.priceCorrectionPrice = 4;
    component.priceCorrectionFromDateLocal = '2026-03-01';
    component.priceCorrectionToDateLocal = '2026-03-03';
    component.selectedPriceProductId = 1;
    component.priceCorrectionRecalculatePurchases = false;
    statisticService.correctProductPrice.and.returnValue(of({ priceHistory: null }));
    component.submitPriceCorrection();
    expect(component.correctingPrice).toBeFalse();
    statisticService.correctProductPrice.and.returnValue(throwError(() => new Error('price')));
    component.submitPriceCorrection();
    expect(component.priceCorrectionError).toEqual(jasmine.any(Error));

    statisticService.getTimeline.and.returnValue(throwError(() => new Error('timeline')));
    component.refresh();
    expect(component.timelineError).toEqual(jasmine.any(Error));
    statisticService.getTimeline.and.returnValue(of({ ...component.timelineResponse!, days: [] }));
    statisticService.getProductPriceHistory.and.returnValue(throwError(() => new Error('history')));
    component.selectedPriceProductId = 1;
    component.onPriceProductChange();
    expect(component.priceHistoryError).toEqual(jasmine.any(Error));
    statisticService.getProductPriceHistory.and.returnValue(of({} as never));
    productService.findAll.and.returnValue(throwError(() => new Error('products')));
    component.onBaseUrlChange();
    expect(component.productError).toEqual(jasmine.any(Error));
  });
});
