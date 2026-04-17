export interface ProductListItem {
  id: string;
  name: string;
  barcode?: string | null;
  unitType?: string;
  quantityPerUnit?: number;
  quantityUnit?: string | null;
  portionCount?: number | null;
  portionUnit?: string | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  priceUnit?: string | null;
  tagNames?: string[];
  nutritionValuesCount?: number;
  category?: string | null;
  genericProduct?: string | null;
  availableQuantity?: number | null;
  availableQuantityUnit?: string | null;
}
