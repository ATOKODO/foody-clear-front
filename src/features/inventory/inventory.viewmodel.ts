import type { QtyUnitOption } from '../../interfaces/quantity.interface';
import { buildProductQtyUnitOptions, getNormalizedQuantityUnit, normalizeQuantityInputUnit } from '../../utils/product-quantity';
import type { InventoryFormValue } from '../../components/inventory/inventory-form/inventory-form';
import type { InventoryListItem } from '../../components/inventory/inventory-list/inventory-list';
import type { ProductListItem } from '../../components/product/product-list/product-list';
import { mapProductToProductListItem } from '../../components/product/product-list/product-list-item.mapper';
import type {
  CreateInventoryDto,
  Inventory as InventoryApiModel,
  InventoryProduct,
  InventoryProductQtyDto,
  ProductQuantityInputUnit,
  PurchaseAccountingMode,
} from '../../interfaces/inventory.interface';
import type { Product as ProductApiModel } from '../../services/product-service';


export const INVENTORY_PURCHASE_ACCOUNTING_MODE_OPTIONS: readonly {
  value: PurchaseAccountingMode;
  label: string;
}[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'free', label: 'Free' },
  { value: 'excluded', label: 'Ignorer des stats' },
];

export interface InventoryRowProductMeta {
  unitType: string | null;
  quantityPerUnit: number | null;
  quantityUnit: ProductQuantityInputUnit | null;
  portionCount: number | null;
  portionUnit: ProductQuantityInputUnit | null;
  portionQuantityNormalized: number | null;
  price: number | null;
}

export type InventorySelectedProductRow = {
  productId: number;
  productName: string;
  qty: number | null;
  qtyUnit: ProductQuantityInputUnit;
  qtyUnitOptions: InventoryQtyUnitOption[];
  qtyUnitHelpText: string | null;
  purchaseAccountingMode: PurchaseAccountingMode;
} & InventoryRowProductMeta;

export type InventoryManagedProductRow = {
  currentQty: number;
  currentQtyUnit: ProductQuantityInputUnit;
  currentNormalizedQty: number | null;
  currentNormalizedUnit: string | null;
  currentQtyDisplay: string;
} & InventorySelectedProductRow;

interface InventoryProductMetaSource {
  unitType?: string | null;
  quantityPerUnit?: number | null;
  quantityUnit?: string | null;
  portionCount?: number | null;
  portionUnit?: string | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
}

export type InventoryQtyUnitOption = QtyUnitOption;

export function buildInventoryListItems(
  inventories: InventoryApiModel[],
): InventoryListItem[] {
  return inventories.map((inventory) => ({
    id: String(inventory.id),
    name: inventory.name,
    productCount: resolveInventoryProductCount(inventory),
  }));
}

export function buildProductListItems(
  products: ProductApiModel[],
): ProductListItem[] {
  return products.map((product) => mapProductToProductListItem(product));
}

export function toCreateInventoryDto(
  value: InventoryFormValue,
  rows: InventorySelectedProductRow[],
): CreateInventoryDto {
  const payload: CreateInventoryDto = {
    name: value.name.trim(),
  };
  const products = toInventoryProductQtyPayload(rows, true);

  if (products.length > 0) {
    payload.products = products;
  }

  return payload;
}

export function toInventoryFormValue(
  inventory: InventoryApiModel,
): InventoryFormValue {
  return {
    name: inventory.name,
  };
}

export function syncInventorySelectedProductRows(
  items: ProductListItem[],
  currentRows: InventorySelectedProductRow[],
): InventorySelectedProductRow[] {
  const rowsByProductId = new Map(
    currentRows.map((row) => [row.productId, row] as const),
  );

  return items.map((item) => {
    const productId = Number(item.id);
    const existingRow = rowsByProductId.get(productId);
    const meta = buildInventoryProductMeta(item);
    const qtyUnit = ensureInventoryRowQtyUnit(existingRow?.qtyUnit);

    if (existingRow) {
      return hydrateSelectedProductRow({
        row: existingRow,
        item,
        meta,
        qtyUnit,
        purchaseAccountingMode: ensureInventoryPurchaseAccountingMode(
          existingRow.purchaseAccountingMode,
          meta,
        ),
      });
    }

    return {
      productId,
      productName: item.name,
      qty: null,
      qtyUnit,
      qtyUnitOptions: buildProductQtyUnitOptions(meta, qtyUnit),
      qtyUnitHelpText: getInventoryQtyUnitHelpText(meta),
      purchaseAccountingMode: resolveDefaultPurchaseAccountingMode(meta),
      ...meta,
    };
  });
}

export function filterInventorySelectionRows(
  selectedRows: InventorySelectedProductRow[],
  availableItems: ProductListItem[],
): InventorySelectedProductRow[] {
  const availableById = new Map(
    availableItems.map((item) => [item.id, item] as const),
  );

  return selectedRows
    .map((row) => {
      const item = availableById.get(String(row.productId));
      if (!item) {
        return null;
      }

      const meta = buildInventoryProductMeta(item);
      const qtyUnit = ensureInventoryRowQtyUnit(row.qtyUnit);
      return hydrateSelectedProductRow({
        row,
        item,
        meta,
        qtyUnit,
        purchaseAccountingMode: ensureInventoryPurchaseAccountingMode(
          row.purchaseAccountingMode,
          meta,
        ),
      });
    })
    .filter((row): row is InventorySelectedProductRow => row !== null);
}

export function toInventoryProductQtyPayload(
  rows: InventorySelectedProductRow[],
  includeAccountingMode = false,
): InventoryProductQtyDto[] {
  return rows
    .filter(
      (row) => typeof row.qty === 'number' && Number.isFinite(row.qty) && row.qty > 0,
    )
    .map((row) => ({
      productId: row.productId,
      qty: row.qty as number,
      ...(row.qtyUnit === 'unit' ? {} : { qtyUnit: row.qtyUnit }),
      ...(includeAccountingMode
        ? { purchaseAccountingMode: row.purchaseAccountingMode }
        : {}),
    }));
}

export function validatePositiveInventoryQtyRows(
  rows: InventorySelectedProductRow[],
): string | null {
  if (rows.length === 0) {
    return null;
  }

  if (
    rows.some((row) => row.qty == null || !Number.isFinite(row.qty) || row.qty <= 0)
  ) {
    return 'Chaque produit selectionne doit avoir une quantite > 0.';
  }

  return null;
}

export function validateManagedInventoryProductRows(
  rows: InventoryManagedProductRow[],
): string | null {
  if (
    rows.some(
      (row) => row.qty == null || !Number.isFinite(row.qty) || row.qty < 0,
    )
  ) {
    return 'Chaque produit doit avoir une quantite >= 0.';
  }

  return null;
}

export function extractInventoriesFromResponse(
  value: unknown,
): InventoryApiModel[] {
  return extractModelsFromResponse(value, isInventoryLike, [
    'data',
    'items',
    'inventories',
    'results',
    'payload',
  ]);
}

export function extractProductsFromResponse(value: unknown): ProductApiModel[] {
  return extractModelsFromResponse(value, isProductLike, [
    'data',
    'items',
    'products',
    'results',
    'payload',
  ]);
}

export function extractInventoryProductsFromResponse(
  value: unknown,
): InventoryProduct[] {
  return extractModelsFromResponse(value, isInventoryProductLike, [
    'data',
    'items',
    'inventoryProducts',
    'products',
    'results',
    'payload',
  ]);
}

export function toManagedInventoryProductRows(
  items: InventoryProduct[],
): InventoryManagedProductRow[] {
  return items.map((item) => {
    const currentQty = isFiniteNumber(item.qtyOnHandInUnits)
      ? item.qtyOnHandInUnits
      : 0;
    const meta = buildInventoryProductMeta(item.product ?? null);
    const currentQtyDisplay = getCurrentInventoryQtyDisplay({
      currentQty,
      unitType: meta.unitType,
    });

    return {
      productId: item.productId,
      productName: resolveInventoryProductName(item),
      qty: currentQty,
      qtyUnit: 'unit',
      qtyUnitOptions: buildProductQtyUnitOptions(meta, 'unit'),
      qtyUnitHelpText: getInventoryQtyUnitHelpText(meta),
      purchaseAccountingMode: 'excluded',
      currentQty,
      currentQtyUnit: 'unit',
      currentNormalizedQty: isFiniteNumber(item.qtyOnHandNormalized)
        ? item.qtyOnHandNormalized
        : null,
      currentQtyDisplay,
      currentNormalizedUnit: getNormalizedQuantityUnit(meta.quantityUnit),
      ...meta,
    };
  });
}

export function removeInventoryProductRow<
  T extends Pick<InventorySelectedProductRow, 'productId'>,
>(rows: T[], productId: number): T[] {
  return rows.filter((row) => row.productId !== productId);
}

export function getInventoryQtyUnitOptions(
  row: InventoryRowProductMeta,
): InventoryQtyUnitOption[] {
  return buildProductQtyUnitOptions(row);
}

export function getInventoryQtyUnitHelpText(
  row: InventoryRowProductMeta,
): string | null {
  const parts: string[] = [];

  if (
    row.quantityPerUnit != null &&
    Number.isFinite(row.quantityPerUnit) &&
    row.quantityPerUnit > 0 &&
    row.quantityUnit
  ) {
    const unitType = row.unitType?.trim() || 'unite produit';
    parts.push(
      `1 ${unitType} = ${formatDecimal(row.quantityPerUnit)} ${row.quantityUnit}`,
    );
  }

  if (
    row.portionQuantityNormalized != null &&
    Number.isFinite(row.portionQuantityNormalized) &&
    row.portionQuantityNormalized > 0 &&
    row.portionUnit &&
    row.quantityUnit
  ) {
    parts.push(
      `1 ${row.portionUnit} = ${formatDecimal(row.portionQuantityNormalized)} ${row.quantityUnit}`,
    );
  }

  return parts.length > 0 ? parts.join(' | ') : null;
}

function hydrateSelectedProductRow(params: {
  row: InventorySelectedProductRow;
  item: ProductListItem;
  meta: InventoryRowProductMeta;
  qtyUnit: ProductQuantityInputUnit;
  purchaseAccountingMode: PurchaseAccountingMode;
}): InventorySelectedProductRow {
  return {
    ...params.row,
    productName: params.item.name,
    unitType: params.meta.unitType,
    quantityPerUnit: params.meta.quantityPerUnit,
    quantityUnit: params.meta.quantityUnit,
    portionCount: params.meta.portionCount,
    portionUnit: params.meta.portionUnit,
    portionQuantityNormalized: params.meta.portionQuantityNormalized,
    price: params.meta.price,
    qtyUnit: params.qtyUnit,
    qtyUnitOptions: buildProductQtyUnitOptions(params.meta, params.qtyUnit),
    qtyUnitHelpText: getInventoryQtyUnitHelpText(params.meta),
    purchaseAccountingMode: params.purchaseAccountingMode,
  };
}

function buildInventoryProductMeta(
  source: InventoryProductMetaSource | null | undefined,
): InventoryRowProductMeta {
  return {
    unitType:
      typeof source?.unitType === 'string' && source.unitType.trim() !== ''
        ? source.unitType.trim()
        : null,
    quantityPerUnit: isFiniteNumber(source?.quantityPerUnit)
      ? source.quantityPerUnit
      : null,
    quantityUnit: normalizeInventoryQtyUnit(source?.quantityUnit),
    portionCount: isFiniteNumber(source?.portionCount)
      ? source.portionCount
      : null,
    portionUnit: normalizeInventoryQtyUnit(source?.portionUnit),
    portionQuantityNormalized: isFiniteNumber(source?.portionQuantityNormalized)
      ? source.portionQuantityNormalized
      : null,
    price: isFiniteNumber(source?.price) ? source.price : null,
  };
}

function ensureInventoryPurchaseAccountingMode(
  value: PurchaseAccountingMode | null | undefined,
  meta: InventoryRowProductMeta,
): PurchaseAccountingMode {
  return value === 'paid' || value === 'free' || value === 'excluded'
    ? value
    : resolveDefaultPurchaseAccountingMode(meta);
}

function resolveDefaultPurchaseAccountingMode(
  meta: InventoryRowProductMeta,
): PurchaseAccountingMode {
  return meta.price == null ? 'free' : 'paid';
}

function ensureInventoryRowQtyUnit(
  value: ProductQuantityInputUnit | null | undefined,
): ProductQuantityInputUnit {
  return normalizeQuantityInputUnit(value) ?? 'unit';
}

function normalizeInventoryQtyUnit(
  value: unknown,
): ProductQuantityInputUnit | null {
  return normalizeQuantityInputUnit(value);
}

function resolveInventoryProductCount(inventory: InventoryApiModel): number {
  if (
    typeof inventory.productCount === 'number' &&
    Number.isFinite(inventory.productCount) &&
    inventory.productCount >= 0
  ) {
    return Math.floor(inventory.productCount);
  }

  if (Array.isArray(inventory.inventoryProducts)) {
    return inventory.inventoryProducts.length;
  }

  const raw = inventory as unknown as Record<string, unknown>;
  const candidates = ['productCount', 'productsCount', 'inventoryProductsCount'];
  for (const field of candidates) {
    const value = raw[field];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return Math.floor(value);
    }
  }

  return 0;
}

function extractModelsFromResponse<T>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
  nestedCandidates: string[],
): T[] {
  if (Array.isArray(value)) {
    return value.filter(predicate);
  }

  if (predicate(value)) {
    return [value];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const raw = value as Record<string, unknown>;
  for (const key of nestedCandidates) {
    const nested = raw[key];
    if (Array.isArray(nested)) {
      const models = nested.filter(predicate);
      if (models.length > 0) {
        return models;
      }
    }
  }

  return [];
}

function isProductLike(value: unknown): value is ProductApiModel {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Partial<ProductApiModel>;
  return typeof product.id === 'number' && typeof product.name === 'string';
}

function isInventoryLike(value: unknown): value is InventoryApiModel {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const inventory = value as Partial<InventoryApiModel>;
  return typeof inventory.id === 'number' && typeof inventory.name === 'string';
}

function isInventoryProductLike(value: unknown): value is InventoryProduct {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const inventoryProduct = value as Partial<InventoryProduct>;
  return (
    typeof inventoryProduct.id === 'number' &&
    typeof inventoryProduct.productId === 'number' &&
    typeof inventoryProduct.inventoryId === 'number'
  );
}

function resolveInventoryProductName(item: InventoryProduct): string {
  return typeof item.product?.name === 'string' && item.product.name.trim() !== ''
    ? item.product.name.trim()
    : `Product #${item.productId}`;
}

function getCurrentInventoryQtyDisplay(row: {
  currentQty: number;
  unitType: string | null;
}): string {
  const qty = formatDecimal(row.currentQty);
  const unitType = row.unitType?.trim();
  return unitType ? `${qty} ${unitType}` : qty;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}


function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}
