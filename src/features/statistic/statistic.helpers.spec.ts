import {
  buildStatisticPriceCorrectionDto,
  buildStatisticTimelineRequestKey,
  findSelectedStatisticTimelineDay,
  findStatisticMetricOption,
  formatStatisticCurrency,
  formatStatisticDate,
  formatStatisticDateTime,
  formatStatisticMetricValue,
  formatStatisticPriceChangeUnit,
  getStatisticBarHeight,
  getStatisticExpenseMax,
  getStatisticPurchaseEventStatusLabel,
  getStatisticSelectedProductName,
  getStatisticTargetActualHeight,
  getStatisticTargetGoalHeight,
  getStatisticTargetMax,
  isStatisticDateRangeValid,
  resolveSelectedStatisticTimelineDate,
  resolveStatisticDateRange,
  resolveStatisticPriceCorrectionDefaults,
  resolveStatisticTimezone,
} from './statistic.helpers';
import { STATISTIC_METRIC_OPTIONS } from './statistic.models';
import type { StatisticsTimelineDay, StatisticsTimelineResponse } from '../../interfaces/statistics.interface';

describe('statistic helpers', () => {
  it('formats full local dates in the selected language and timestamps in the requested timezone', () => {
    expect(formatStatisticDate('2026-02-24', 'en-GB', 'full')).toBe('24 Feb 2026');
    expect(formatStatisticDate('2026-02-24', 'fr-FR', 'full')).toBe('24 févr. 2026');
    expect(formatStatisticDate('invalid', 'fr-FR', 'full')).toBe('invalid');
    expect(formatStatisticDateTime('2026-03-29T01:30:00Z', 'Europe/Paris', 'fr-FR')).toContain('29/03/2026');
    expect(formatStatisticDateTime('2026-03-29T01:30:00Z', 'Europe/Paris', 'fr-FR')).toContain('03:30');
  });

  const day: StatisticsTimelineDay = {
    dateLocal: '2026-02-16',
    expenses: { totalAmount: 12.5, purchaseCount: 2, incompletePurchaseCount: 0, events: [] },
    inputs: {
      assignment: null,
      daySet: null,
      targetSource: 'cycle',
      dayTotal: { proteins: 80, carbs: 'donnee incomplete', lipids: 20 },
      targets: { proteins: 100, carbs: 120, lipids: 50 },
      deltaToTargets: null,
      incompleteNutritionKeys: [],
      itemCount: 2,
    },
  };
  const response: StatisticsTimelineResponse = {
    fromDateLocal: '2026-02-16',
    toDateLocal: '2026-02-17',
    timezone: 'UTC',
    summary: { totalAmount: 12.5, purchaseCount: 2, incompletePurchaseCount: 0, dayCount: 1 },
    days: [day],
  };

  it('should resolve ranges, metric values and timeline selections', () => {
    expect(resolveStatisticTimezone()).toBeTruthy();
    expect(resolveStatisticDateRange(7).fromDateLocal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isStatisticDateRangeValid('2026-02-16', '2026-02-17')).toBeTrue();
    expect(isStatisticDateRangeValid('2026-02-17', '2026-02-16')).toBeFalse();
    expect(buildStatisticTimelineRequestKey('a', 'b', 'UTC')).toBe('a|b|UTC');
    expect(resolveSelectedStatisticTimelineDate(response, '2026-02-16')).toBe('2026-02-16');
    expect(resolveSelectedStatisticTimelineDate(response, 'missing')).toBe('2026-02-16');
    expect(findSelectedStatisticTimelineDay(response, '2026-02-16')).toBe(day);
    expect(findSelectedStatisticTimelineDay(null, '')).toBeNull();
    expect(getStatisticExpenseMax(response)).toBe(12.5);
    expect(getStatisticExpenseMax(null)).toBe(1);
    expect(getStatisticTargetMax(response, 'proteins')).toBe(100);
    expect(findStatisticMetricOption(STATISTIC_METRIC_OPTIONS, 'proteins')?.unit).toBe('g');
    expect(findStatisticMetricOption([], 'proteins')).toBeNull();
    expect(getStatisticSelectedProductName([{ id: 1, name: 'Milk' } as never], 1)).toBe('Milk');
    expect(getStatisticSelectedProductName([], null)).toBe('No product');
  });

  it('should format bars, dates, currency, labels and statuses', () => {
    expect(getStatisticBarHeight(0, 100)).toBe(6);
    expect(getStatisticBarHeight(50, 100)).toBe(50);
    expect(getStatisticTargetActualHeight(day, 'proteins', 100)).toBe(80);
    expect(getStatisticTargetActualHeight(day, 'energyKcal', 100)).toBe(6);
    expect(getStatisticTargetGoalHeight(day, 'proteins', 100)).toBe(100);
    expect(formatStatisticCurrency(12.5)).toContain('12,50');
    expect(formatStatisticCurrency(null)).toContain('0,00');
    expect(formatStatisticMetricValue(12.345, 'g')).toBe('12.35 g');
    expect(formatStatisticMetricValue('custom', 'g')).toBe('custom');
    expect(formatStatisticMetricValue(null, 'g')).toBe('--');
    expect(formatStatisticDateTime(null, 'UTC')).toBe('--');
    expect(formatStatisticDateTime('invalid', 'UTC')).toBe('invalid');
    expect(formatStatisticDateTime('2026-02-16T08:00:00Z', 'UTC')).toContain('16/02');
    expect(formatStatisticDate('2026-02-16')).toBe('16/02');
    expect(formatStatisticDate('invalid')).toBe('invalid');
    expect(formatStatisticPriceChangeUnit('kg')).toBe('/kg');
    expect(formatStatisticPriceChangeUnit(null)).toBe('');
    expect(getStatisticPurchaseEventStatusLabel({ pricingStatus: 'complete', excludedFromStats: false } as never)).toBe('complet');
    expect(getStatisticPurchaseEventStatusLabel({ pricingStatus: 'incomplete', excludedFromStats: false } as never)).toBe('prix incomplet');
    expect(getStatisticPurchaseEventStatusLabel({ pricingStatus: 'free', excludedFromStats: false } as never)).toBe('gratuit');
    expect(getStatisticPurchaseEventStatusLabel({ pricingStatus: 'excluded', exclusionReason: 'refunded' } as never)).toBe('rembourse');
  });

  it('should resolve and validate price correction payloads', () => {
    expect(resolveStatisticPriceCorrectionDefaults(
      [{ id: 1, name: 'Milk', price: 2.5, priceUnit: 'l' } as never],
      1,
      { price: null, priceUnit: 'kg' },
    )).toEqual({ price: 2.5, priceUnit: 'l' });
    expect(buildStatisticPriceCorrectionDto({
      selectedProductId: 1,
      price: 2.5,
      priceUnit: 'kg',
      fromDateLocal: '2026-02-16',
      toDateLocal: '',
      recalculatePurchases: true,
    })).toEqual(jasmine.objectContaining({ productId: 1, effectiveTo: null }));
    expect(buildStatisticPriceCorrectionDto({
      selectedProductId: null,
      price: null,
      priceUnit: 'kg',
      fromDateLocal: 'bad',
      toDateLocal: '',
      recalculatePurchases: false,
    })).toBeNull();
  });
});
