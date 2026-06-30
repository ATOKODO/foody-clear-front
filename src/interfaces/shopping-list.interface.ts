import { ProductQuantityInputUnit } from './inventory.interface';
import type { InventoryLinkedProduct } from './inventory.interface';

export interface ShoppingListItem {
  id: number;
  shoppingListId?: number;
  productId: number;
  product?: InventoryLinkedProduct | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  checked: boolean;
}

export interface ShoppingList {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  items: ShoppingListItem[];
}

export interface ShoppingListTemplateItem {
  id: number;
  templateId?: number;
  productId: number;
  product?: InventoryLinkedProduct | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
}

export interface ShoppingListTemplate {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  items: ShoppingListTemplateItem[];
}

export interface ShoppingListItemQtyDto {
  productId: number;
  qty: number;
  qtyUnit?: ProductQuantityInputUnit | null;
}

export interface CreateShoppingListDto {
  name: string;
  items?: ShoppingListItemQtyDto[];
}

export interface UpdateShoppingListDto {
  name?: string;
}

export interface CreateShoppingListItemDto {
  productId: number;
  qty: number;
  qtyUnit?: ProductQuantityInputUnit | null;
}

export interface UpdateShoppingListItemDto {
  productId?: number;
  qty?: number;
  qtyUnit?: ProductQuantityInputUnit | null;
  checked?: boolean;
}

export interface CheckAllShoppingListItemsDto {
  checked: boolean;
}

export interface ConvertShoppingListItemsDto {
  inventoryId: number;
}

export interface CreateShoppingListTemplateDto {
  name: string;
}

export interface UpdateShoppingListTemplateDto {
  name?: string;
}

export interface CreateShoppingListFromTemplateDto {
  name?: string;
}
