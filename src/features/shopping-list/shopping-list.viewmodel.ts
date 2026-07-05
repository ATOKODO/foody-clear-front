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

export interface QtyUnitOption {
  value: ProductQuantityInputUnit;
  label: string;
}

export const SHOPPING_LIST_VIEW_OPTIONS: readonly SegmentedToggleOption<ShoppingListView>[] = [
  { value: 'list', label: 'Shopping list' },
  { value: 'template', label: 'Shopping template' },
];

const ALLOWED_QTY_UNITS: readonly ProductQuantityInputUnit[] = [
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
  item: Pick<ShoppingListItem | ShoppingListTemplateItem, 'product' | 'productId'>,
): string {
  return item.product?.name?.trim() || `Product #${item.productId}`;
}

export function resolveDraftProductName(
  products: Product[],
  productId: number | null,
): string {
  if (productId == null) {
    return 'No product selected';
  }

  return (
    products.find((item) => item.id === productId)?.name ?? `Product #${productId}`
  );
}

export function resolveLinkedProduct(
  products: Product[],
  productId: number,
  inlineProduct: InventoryLinkedProduct | Product | null,
): InventoryLinkedProduct | Product | null {
  return inlineProduct ?? products.find((item) => item.id === productId) ?? null;
}

export function buildQtyUnitOptions(
  product: InventoryLinkedProduct | Product | null,
): QtyUnitOption[] {
  const options: QtyUnitOption[] = [];
  const seen = new Set<ProductQuantityInputUnit>();

  const pushOption = (
    value: ProductQuantityInputUnit | null,
    label: string,
  ): void => {
    if (value === null || seen.has(value)) {
      return;
    }

    seen.add(value);
    options.push({ value, label });
  };

  const unitType = product?.unitType?.trim();
  pushOption('unit', unitType ? `Product unit (${unitType})` : 'Product unit');

  const portionUnit = normalizeQtyUnit(product?.portionUnit);
  if (portionUnit) {
    pushOption(portionUnit, toTitleCase(portionUnit));
  }

  pushOption('g', 'G (Gram)');

  return options;
}

export function normalizeQtyUnit(
  value: string | null | undefined,
): ProductQuantityInputUnit | null {
  if (typeof value !== 'string') {
    return null;
  }

  const candidate = value.trim().toLowerCase();
  return ALLOWED_QTY_UNITS.includes(candidate as ProductQuantityInputUnit)
    ? (candidate as ProductQuantityInputUnit)
    : null;
}

export function normalizeQtyUnitSelection(
  currentValue: ProductQuantityInputUnit | null,
  options: QtyUnitOption[],
): ProductQuantityInputUnit | null {
  if (currentValue && options.some((option) => option.value === currentValue)) {
    return currentValue;
  }

  return options[0]?.value ?? null;
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

function toTitleCase(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
