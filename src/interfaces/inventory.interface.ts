export interface InventoryProduct {
  id: number;
  name: string;
  barcode?: string | null;
  category?: unknown | null;
  tags?: unknown[];
  genericProduct?: unknown | null;
  unitType?: string;
  quantityPerUnit?: number;
  quantityUnit?: string;
  price?: number | null;
  url?: string | null;
  memo?: string | null;
  nutritionValues?: unknown[];
}

export interface Inventory {
  id: number;
  name: string;
  products?: InventoryProduct[];
}

export interface CreateInventoryDto {
  name: string;
  productIds?: number[];
}

export interface UpdateInventoryDto {
  name?: string;
}

export interface UpdateInventoryProductsDto {
  productIds: number[];
}
