import { DateTime } from 'luxon';
import {
  InventoryPurchaseEventSummary,
  ProductPriceCorrectionDto,
  ProductPriceUnit,
  StatisticsTimelineDay,
  StatisticsTimelineResponse,
} from '../../interfaces/statistics.interface';
import { Product } from '../../services/product-service';
import {
  StatisticMetricKey,
  StatisticMetricOption,
  StatisticPriceCorrectionState,
} from './statistic.models';

export interface StatisticDateRange {
  fromDateLocal: string;
  toDateLocal: string;
}

export interface StatisticPriceCorrectionDefaults {
  price: number | null;
  priceUnit: ProductPriceUnit;
}

export function resolveStatisticTimezone(): string {
  return DateTime.local().zoneName || 'UTC';
}

export function resolveStatisticDateRange(days: number): StatisticDateRange {
  const today = DateTime.local();
  return {
    fromDateLocal: today.minus({ days: days - 1 }).toFormat('yyyy-LL-dd'),
    toDateLocal: today.toFormat('yyyy-LL-dd'),
  };
}

export function isStatisticDateRangeValid(
  fromDateLocal: string,
  toDateLocal: string,
): boolean {
  return (
    fromDateLocal.length === 10 &&
    toDateLocal.length === 10 &&
    toDateLocal >= fromDateLocal
  );
}

export function buildStatisticTimelineRequestKey(
  fromDateLocal: string,
  toDateLocal: string,
  timezone: string,
): string {
  return `${fromDateLocal}|${toDateLocal}|${timezone}`;
}

export function resolveSelectedStatisticTimelineDate(
  response: StatisticsTimelineResponse,
  selectedTimelineDateLocal: string,
): string {
  return selectedTimelineDateLocal &&
    response.days.some((day) => day.dateLocal === selectedTimelineDateLocal)
    ? selectedTimelineDateLocal
    : (response.days[0]?.dateLocal ?? '');
}

export function findSelectedStatisticTimelineDay(
  response: StatisticsTimelineResponse | null,
  selectedTimelineDateLocal: string,
): StatisticsTimelineDay | null {
  if (!response) {
    return null;
  }

  const dateLocal = selectedTimelineDateLocal || response.days[0]?.dateLocal;
  return response.days.find((day) => day.dateLocal === dateLocal) ?? null;
}

export function getStatisticExpenseMax(
  response: StatisticsTimelineResponse | null,
): number {
  return Math.max(
    1,
    ...(response?.days.map((day) => day.expenses.totalAmount) ?? [0]),
  );
}

export function getStatisticTargetMax(
  response: StatisticsTimelineResponse | null,
  metric: StatisticMetricKey,
): number {
  const values = (response?.days ?? []).flatMap((day) => {
    const actual = day.inputs.dayTotal[metric];
    const target = day.inputs.targets?.[metric] ?? 0;
    return [
      typeof actual === 'number' ? actual : 0,
      typeof target === 'number' ? target : 0,
    ];
  });
  return Math.max(1, ...values);
}

export function findStatisticMetricOption(
  options: StatisticMetricOption[],
  metric: StatisticMetricKey,
): StatisticMetricOption | null {
  return options.find((item) => item.key === metric) ?? null;
}

export function getStatisticSelectedProductName(
  products: Product[],
  selectedProductId: number | null,
): string {
  return (
    products.find((product) => product.id === selectedProductId)?.name ??
    'No product'
  );
}

export function getStatisticBarHeight(value: number, max: number): number {
  return Math.max(6, Math.round((value / max) * 100));
}

export function getStatisticTargetActualHeight(
  day: StatisticsTimelineDay,
  metric: StatisticMetricKey,
  targetMax: number,
): number {
  const value = day.inputs.dayTotal[metric];
  return typeof value === 'number'
    ? getStatisticBarHeight(value, targetMax)
    : 6;
}

export function getStatisticTargetGoalHeight(
  day: StatisticsTimelineDay,
  metric: StatisticMetricKey,
  targetMax: number,
): number {
  const value = day.inputs.targets?.[metric] ?? 0;
  return getStatisticBarHeight(value, targetMax);
}

export function formatStatisticCurrency(
  value: number | null | undefined,
): string {
  const normalized =
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
}

export function formatStatisticMetricValue(
  value: unknown,
  unit: string,
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${roundStatisticValue(value)} ${unit}`.trim();
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return '--';
}

export function formatStatisticDateTime(
  value: string | null | undefined,
  timezone: string,
): string {
  if (!value) {
    return '--';
  }

  const parsed = DateTime.fromISO(value, { setZone: true });
  if (!parsed.isValid) {
    return value;
  }

  return parsed.setZone(timezone).toFormat('dd/LL HH:mm');
}

export function formatStatisticDate(value: string): string {
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? parsed.toFormat('dd/LL') : value;
}

export function formatStatisticPriceChangeUnit(
  value: ProductPriceUnit | null | undefined,
): string {
  return value ? `/${value}` : '';
}

export function getStatisticPurchaseEventStatusLabel(
  event: InventoryPurchaseEventSummary,
): string {
  if (event.excludedFromStats || event.pricingStatus === 'excluded') {
    return event.exclusionReason === 'refunded' ? 'rembourse' : 'exclu';
  }

  if (event.pricingStatus === 'free') {
    return 'gratuit';
  }

  return event.pricingStatus === 'complete' ? 'complet' : 'prix incomplet';
}

export function resolveStatisticPriceCorrectionDefaults(
  products: Product[],
  selectedProductId: number | null,
  current: StatisticPriceCorrectionDefaults,
): StatisticPriceCorrectionDefaults {
  const selected = products.find((product) => product.id === selectedProductId);
  return {
    price:
      typeof selected?.price === 'number' && Number.isFinite(selected.price)
        ? selected.price
        : current.price,
    priceUnit:
      selected?.priceUnit ??
      current.priceUnit,
  };
}

export function buildStatisticPriceCorrectionDto(
  state: StatisticPriceCorrectionState,
): ProductPriceCorrectionDto | null {
  if (!isStatisticPriceCorrectionValid(state)) {
    return null;
  }

  return {
    productId: state.selectedProductId,
    price: state.price,
    priceUnit: state.priceUnit,
    effectiveFrom: state.fromDateLocal,
    effectiveTo: state.toDateLocal || null,
    recalculatePurchases: state.recalculatePurchases,
  };
}

function isStatisticPriceCorrectionValid(
  state: StatisticPriceCorrectionState,
): state is StatisticPriceCorrectionState & {
  selectedProductId: number;
  price: number;
} {
  return (
    state.selectedProductId != null &&
    state.price != null &&
    Number.isFinite(state.price) &&
    state.price >= 0 &&
    state.fromDateLocal.length === 10 &&
    (state.toDateLocal === '' || state.toDateLocal >= state.fromDateLocal)
  );
}

function roundStatisticValue(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}
