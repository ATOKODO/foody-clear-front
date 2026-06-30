import type { InventoryLinkedProduct, ProductQuantityInputUnit } from './inventory.interface';

export type MealPrepEntryType = 'product' | 'dish' | 'meal';

export interface MealPrepAvailability {
  isInStock: boolean;
  maxPreparations: number;
  missingProducts: {
    productId: number;
    productName: string;
    requiredQtyNormalized: number;
    availableQtyNormalized: number;
    missingQtyNormalized: number;
  }[];
}

export interface MealPrepResolvedProductLine {
  productId: number;
  productName: string;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized?: number | null;
  product?: InventoryLinkedProduct | null;
}

export interface PreparedDishItem {
  id: number;
  productId: number;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized?: number | null;
  product?: InventoryLinkedProduct | null;
}

export interface PreparedDish {
  id: number;
  name: string;
  items: PreparedDishItem[];
  availability?: MealPrepAvailability | null;
  resolvedProducts?: MealPrepResolvedProductLine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PreparedMealItem {
  id: number;
  itemType: 'product' | 'dish';
  productId?: number | null;
  dishId?: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized?: number | null;
  product?: InventoryLinkedProduct | null;
  dish?: PreparedDish | null;
}

export interface PreparedMeal {
  id: number;
  name: string;
  items: PreparedMealItem[];
  availability?: MealPrepAvailability | null;
  resolvedProducts?: MealPrepResolvedProductLine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePreparedDishItemDto {
  productId: number;
  qty: number;
  qtyUnit?: ProductQuantityInputUnit | null;
}

export interface CreatePreparedDishDto {
  name: string;
  items: CreatePreparedDishItemDto[];
}

export interface UpdatePreparedDishDto {
  name?: string;
  items?: CreatePreparedDishItemDto[];
}

export interface CreatePreparedMealItemDto {
  itemType: 'product' | 'dish';
  productId?: number | null;
  dishId?: number | null;
  qty: number;
  qtyUnit?: ProductQuantityInputUnit | null;
}

export interface CreatePreparedMealDto {
  name: string;
  items: CreatePreparedMealItemDto[];
}

export interface UpdatePreparedMealDto {
  name?: string;
  items?: CreatePreparedMealItemDto[];
}

export interface CreateMealPrepShoppingListDto {
  name?: string;
}
