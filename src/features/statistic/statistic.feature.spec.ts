import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { StatisticFeature } from './statistic.feature';
import { StatisticService } from '../../services/statistic-service';
import { ProductService } from '../../services/product-service';

describe('StatisticFeature', () => {
  let component: StatisticFeature;
  let fixture: ComponentFixture<StatisticFeature>;
  const statisticService = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getTimeline: jasmine.createSpy('getTimeline').and.returnValue(
      of({
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
      }),
    ),
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
});
