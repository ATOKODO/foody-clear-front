import type { ProductListItem } from '../../components/product/product-list/product-list';
import type { InventoryProduct } from '../../interfaces/inventory.interface';
import type {
  InputDayMacroValue,
  ProductQuantityInputUnit,
} from '../../interfaces/input-day.interface';
import type { SegmentedToggleOption } from '../../app/ui/segmented-toggle/segmented-toggle';

export type InputDayDisplayMode = 'standalone' | 'embedded';
export type InputDayEmbeddedSection = 'stock' | 'templates';

export interface InputDaySelectedProductRow {
  productId: number;
  productName: string;
  qty: number | null;
  qtyUnit: ProductQuantityInputUnit | null;
}

export interface InputDayAvailableSlot {
  slotId: number;
  title: string;
  slotKey: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
}

export interface ProductListSource {
  id: number;
  name: string;
  barcode?: string | null;
  unitType?: string | null;
  quantityPerUnit?: number | null;
  quantityUnit?: string | null;
  portionCount?: number | null;
  portionUnit?: string | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  priceUnit?: string | null;
  tags?: unknown[];
  nutritionValues?: unknown[];
  category?: unknown | null;
  genericProduct?: unknown | null;
}

export interface InputDaySelectedInventoryTemplateStock {
  enoughStock: boolean;
  qtyAvailableNormalized: number;
}

export const INPUT_DAY_QTY_UNIT_OPTIONS: readonly ProductQuantityInputUnit[] = [
  'mg',
  'g',
  'kg',
  'ml',
  'l',
  'unit',
  'pack',
  'tranche',
  'piece',
  'part',
  'bouteille',
  'portion',
];

export const INPUT_DAY_EMBEDDED_SECTION_OPTIONS: readonly SegmentedToggleOption<InputDayEmbeddedSection>[] =
  [
    {
      value: 'stock',
      label: 'Produits en stock',
      testId: 'input-day-section-stock',
    },
    {
      value: 'templates',
      label: 'Modeles',
      testId: 'input-day-section-templates',
    },
  ];

export const INPUT_DAY_SLOT_TOTALS_META_KEYS: ReadonlySet<string> = new Set([
  'slot',
  'targets',
  'deltaToTargets',
  'incompleteNutritionKeys',
]);

export interface InputDaySelectableProductInput {
  productListItems: readonly ProductListItem[];
  selectedInventoryProducts: readonly InventoryProduct[];
}

export type InputDaySlotMacroEntry = {
  key: string;
  value: InputDayMacroValue;
};
