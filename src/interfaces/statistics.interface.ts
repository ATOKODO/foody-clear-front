import { InputDayMacroValue, InputDayTargetSource } from './input-day.interface';

export type ProductPriceUnit =
  | 'kg'
  | 'g'
  | 'l'
  | 'ml'
  | 'unite'
  | 'paquet'
  | 'bouteille'
  | 'boite'
  | 'sachet'
  | 'canette'
  | 'bocal'
  | 'autre';

export type InventoryPurchasePricingStatus = 'complete' | 'incomplete' | 'free' | 'excluded';
export type PurchaseExclusionReason = 'refunded' | 'manual' | 'other';

export interface InventoryPurchaseEventSummary {
  id: number;
  inventoryId: number | null;
  inventoryName: string | null;
  productId: number | null;
  productName: string;
  qty: number;
  qtyUnit: string;
  qtyNormalized: number;
  qtyInProductUnits: number;
  priceSnapshot: number | null;
  priceUnitSnapshot: ProductPriceUnit | null;
  expenseAmount: number | null;
  pricingStatus: InventoryPurchasePricingStatus;
  excludedFromStats?: boolean;
  exclusionReason?: PurchaseExclusionReason | null;
  occurredAt: string;
}

export interface StatisticsTimelineDay {
  dateLocal: string;
  expenses: {
    totalAmount: number;
    purchaseCount: number;
    incompletePurchaseCount: number;
    events: InventoryPurchaseEventSummary[];
  };
  inputs: {
    assignment: {
      id: number;
      cycleId: number;
      cycleTitle: string;
      startDateLocal: string;
      endDateLocal: string;
      dayIndex: number;
    } | null;
    daySet: {
      id: number;
      title: string;
    } | null;
    targetSource: InputDayTargetSource;
    dayTotal: Record<string, InputDayMacroValue>;
    targets: Record<string, number> | null;
    deltaToTargets: Record<string, InputDayMacroValue> | null;
    incompleteNutritionKeys: string[];
    itemCount: number;
  };
}

export interface StatisticsTimelineResponse {
  fromDateLocal: string;
  toDateLocal: string;
  timezone: string;
  summary: {
    totalAmount: number;
    purchaseCount: number;
    incompletePurchaseCount: number;
    dayCount: number;
  };
  days: StatisticsTimelineDay[];
}

export interface ProductPriceVersionSummary {
  id: number;
  price: number;
  priceUnit: ProductPriceUnit;
  effectiveFrom: string;
  effectiveTo: string | null;
  previousPrice: number | null;
  previousPriceUnit: ProductPriceUnit | null;
  absoluteDelta: number | null;
  relativeDeltaPct: number | null;
}

export interface ProductPriceHistoryStatsResponse {
  fromDateLocal: string;
  toDateLocal: string;
  timezone: string;
  product: {
    id: number;
    name: string;
  };
  currentPrice: {
    price: number | null;
    priceUnit: ProductPriceUnit | null;
  };
  baselineBeforeRange: {
    id: number;
    price: number;
    priceUnit: ProductPriceUnit;
    effectiveFrom: string;
    effectiveTo: string | null;
  } | null;
  changes: ProductPriceVersionSummary[];
  stats: {
    firstPrice: number | null;
    lastPrice: number | null;
    absoluteDelta: number | null;
    relativeDeltaPct: number | null;
    changeCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    priceUnit: ProductPriceUnit | null;
    hasMixedUnits: boolean;
  };
}

export interface UpdatePurchaseEventExclusionDto {
  excludedFromStats: boolean;
  exclusionReason?: PurchaseExclusionReason | null;
}

export interface ProductPriceCorrectionDto {
  productId: number;
  price: number;
  priceUnit: ProductPriceUnit;
  effectiveFrom: string;
  effectiveTo?: string | null;
  recalculatePurchases?: boolean;
}

export interface ProductPriceCorrectionResponse {
  productId: number;
  priceHistory: ProductPriceHistoryStatsResponse;
  recalculatedPurchaseCount?: number;
}
