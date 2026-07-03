import { ProductPriceUnit } from '../../interfaces/statistics.interface';

export type StatisticView = 'expenses' | 'targets' | 'prices';

export type StatisticMetricKey = 'energyKcal' | 'proteins' | 'carbs' | 'lipids';

export interface StatisticViewOption {
  value: StatisticView;
  label: string;
}

export interface StatisticMetricOption {
  key: StatisticMetricKey;
  label: string;
  unit: string;
}

export interface StatisticPriceCorrectionState {
  selectedProductId: number | null;
  price: number | null;
  priceUnit: ProductPriceUnit;
  fromDateLocal: string;
  toDateLocal: string;
  recalculatePurchases: boolean;
}

export const STATISTIC_VIEW_OPTIONS: StatisticViewOption[] = [
  { value: 'targets', label: 'Objectifs' },
  { value: 'expenses', label: 'Depenses' },
  { value: 'prices', label: 'Prix produit' },
];

export const STATISTIC_PRICE_UNIT_OPTIONS: ProductPriceUnit[] = [
  'kg',
  'g',
  'l',
  'ml',
  'unite',
  'paquet',
  'bouteille',
  'boite',
  'sachet',
  'canette',
  'bocal',
  'autre',
];

export const STATISTIC_METRIC_OPTIONS: StatisticMetricOption[] = [
  { key: 'energyKcal', label: 'Energie', unit: 'kcal' },
  { key: 'proteins', label: 'Proteines', unit: 'g' },
  { key: 'carbs', label: 'Glucides', unit: 'g' },
  { key: 'lipids', label: 'Lipides', unit: 'g' },
];
