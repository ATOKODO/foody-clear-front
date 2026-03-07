export interface InventoryLinkedProduct {
  id: number;
  name: string;
  barcode?: string | null;
  category?: unknown | null;
  tags?: unknown[];
  genericProduct?: unknown | null;
  unitType?: string | null;
  quantityPerUnit?: number | null;
  quantityUnit?: string | null;
  quantityNormalized?: number | null;
  portionCount?: number | null;
  portionUnit?: string | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  url?: string | null;
  memo?: string | null;
  nutritionValues?: unknown[];
}

export interface InventoryProduct {
  id: number;
  inventoryId: number;
  productId: number;
  qtyOnHandInUnits: number;
  qtyOnHandNormalized: number;
  product?: InventoryLinkedProduct | null;
}

export interface Inventory {
  id: number;
  name: string;
  productCount?: number | null;
  inventoryProducts?: InventoryProduct[];
}

export interface InventoryProductQtyDto {
  productId: number;
  qty: number;
}

export interface CreateInventoryDto {
  name: string;
  productIds?: number[];
  products?: InventoryProductQtyDto[];
}

export interface UpdateInventoryDto {
  name?: string;
}

export interface UpdateInventoryProductsDto {
  productIds?: number[];
  products?: InventoryProductQtyDto[];
}
