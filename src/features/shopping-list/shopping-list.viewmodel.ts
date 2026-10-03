import type { QtyUnitOption } from '../../interfaces/quantity.interface';
export type { QtyUnitOption } from '../../interfaces/quantity.interface';
import { buildProductQtyUnitOptions, normalizeQuantityInputUnit } from '../../utils/product-quantity';
export { normalizeQtyUnitSelection } from '../../utils/product-quantity';
import type { SegmentedToggleOption } from '../../app/ui/segmented-toggle/segmented-toggle';
import type { ProductListItem } from '../../components/product/product-list/product-list';
import { mapProductToProductListItem } from '../../components/product/product-list/product-list-item.mapper';
import type {
  InventoryLinkedProduct,
  ProductQuantityInputUnit,
} from '../../interfaces/inventory.interface';
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListTemplate,
  ShoppingListTemplateItem,
} from '../../interfaces/shopping-list.interface';
import type { Product } from '../../services/product-service';

export type ShoppingListView = 'list' | 'template';

export const SHOPPING_LIST_VIEW_OPTIONS: readonly SegmentedToggleOption<ShoppingListView>[] = [
  { value: 'list', label: 'Shopping list' },
  { value: 'template', label: 'Shopping template' },
];


type ShoppingListProductItem = ShoppingListItem | ShoppingListTemplateItem;
type LinkedProduct = InventoryLinkedProduct | Product;

export function countCheckedItems(list: ShoppingList | null): number {
  return list?.items.filter((item) => item.checked).length ?? 0;
}

export function buildDefaultListName(listCount: number): string {
  return `Shopping list ${listCount + 1}`;
}

export function toProductListItems(products: Product[]): ProductListItem[] {
  return products.map((product) => mapProductToProductListItem(product));
}

export function resolveProductName(
  item: Pick<ShoppingListProductItem, 'product' | 'productId'>,
  translate: (message: string) => string = (message) => message,
): string {
  return item.product?.name?.trim() || translate(`Product #${item.productId}`);
}

export function resolveDraftProductName(
  products: Product[],
  productId: number | null,
  translate: (message: string) => string = (message) => message,
): string {
  if (productId == null) {
    return translate('No product selected');
  }

  return (
    products.find((item) => item.id === productId)?.name ?? translate(`Product #${productId}`)
  );
}

export function resolveLinkedProduct(
  products: Product[],
  productId: number,
  inlineProduct: LinkedProduct | null,
): LinkedProduct | null {
  return inlineProduct ?? products.find((item) => item.id === productId) ?? null;
}

export function buildQtyUnitOptions(
  product: InventoryLinkedProduct | Product | null,
  currentUnit?: ProductQuantityInputUnit | null,
): QtyUnitOption[] {
  return buildProductQtyUnitOptions(product, currentUnit);
}

export function normalizeQtyUnit(value: string | null | undefined): ProductQuantityInputUnit | null {
  return normalizeQuantityInputUnit(value);
}

export function upsertShoppingList(
  shoppingLists: ShoppingList[],
  shoppingList: ShoppingList,
): ShoppingList[] {
  return upsertById(shoppingLists, shoppingList);
}

export function upsertShoppingListTemplate(
  templates: ShoppingListTemplate[],
  template: ShoppingListTemplate,
): ShoppingListTemplate[] {
  return upsertById(templates, template);
}

export function removeById<T extends { id: number }>(
  items: T[],
  id: number,
): T[] {
  return items.filter((item) => item.id !== id);
}

function upsertById<T extends { id: number }>(items: T[], nextItem: T): T[] {
  const next = [...items];
  const index = next.findIndex((item) => item.id === nextItem.id);
  if (index >= 0) {
    next[index] = nextItem;
    return next;
  }

  next.unshift(nextItem);
  return next;
}
