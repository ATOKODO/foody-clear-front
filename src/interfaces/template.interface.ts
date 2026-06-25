import {
  InputDayDaySetSlotSummary,
  InputDayNutritionValue,
  InputDayTotalsMacrosSummary,
  ProductQuantityInputUnit,
} from './input-day.interface';

export interface TemplateSummary {
  id: number;
  title: string;
}

export interface TemplateStockByInventory {
  inventoryId: number;
  inventoryName: string;
  qtyAvailableNormalized: number;
  enoughStock: boolean;
}

export interface TemplateStockAvailability {
  enoughStock: boolean;
  totalAvailableNormalized: number;
  requestedQtyNormalized: number;
}

export interface TemplateItem {
  id: number;
  productId: number;
  productName: string;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized: number;
  slotId: number | null;
  slotKey: string | null;
  preferredTime?: string;
  nutritionValue: InputDayNutritionValue;
  stockAvailability: TemplateStockAvailability;
  stockByInventory: TemplateStockByInventory[];
  status?: 'pending' | 'converted';
  convertedItemId?: number | null;
}

export interface TemplateComparisonDaySet {
  id: number;
  title: string;
  nutritionValue: InputDayNutritionValue | null;
  slots: InputDayDaySetSlotSummary[];
}

export interface Template {
  id: number;
  title: string;
  items: TemplateItem[];
  comparisonDaySet?: TemplateComparisonDaySet | null;
  totalsMacros?: InputDayTotalsMacrosSummary | null;
}

export interface CreateTemplateDto {
  title: string;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto>;

export interface CreateTemplateItemDto {
  productId: number;
  qty: number;
  qtyUnit?: ProductQuantityInputUnit;
  slotId?: number | null;
  slotKey?: string;
  preferredTime?: string;
}

export type UpdateTemplateItemDto = Partial<CreateTemplateItemDto>;
