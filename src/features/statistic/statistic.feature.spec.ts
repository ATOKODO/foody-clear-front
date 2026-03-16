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
        days: [],
      }),
    ),
    getProductPriceHistory: jasmine.createSpy('getProductPriceHistory').and.returnValue(
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
    findAll: jasmine.createSpy('findAll').and.returnValue(of([{ id: 1, name: 'Produit' }])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticFeature],
      providers: [
        { provide: StatisticService, useValue: statisticService },
        { provide: ProductService, useValue: productService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
