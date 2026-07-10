import { DateTime } from 'luxon';
import type { ProductListItem } from '../../components/product/product-list/product-list';
import type {
  Inventory,
  InventoryProduct,
} from '../../interfaces/inventory.interface';
import type {
  InputDayItemSummary,
  InputDayMacroValue,
  InputDayResponse,
  InputDayTargetSource,
  InputDayTemplateItemSummary,
  InputDayTotalsMacrosBySlotEntry,
  InputDayTotalsMacrosSummary,
  ProductQuantityInputUnit,
} from '../../interfaces/input-day.interface';
import type { Product as ProductApiModel } from '../../services/product-service';
import {
  INPUT_DAY_SLOT_TOTALS_META_KEYS,
  type InputDayAvailableSlot,
  type InputDaySelectableProductInput,
  type InputDaySelectedInventoryTemplateStock,
  type InputDaySlotMacroEntry,
  type ProductListSource,
} from './input-day.models';

const PRODUCT_RESPONSE_KEYS = ['data', 'items', 'products', 'results', 'payload'];
const INVENTORY_RESPONSE_KEYS = [
  'data',
  'items',
  'inventories',
  'results',
  'payload',
];
const INVENTORY_PRODUCT_RESPONSE_KEYS = [
  'data',
  'items',
  'inventoryProducts',
  'products',
  'results',
  'payload',
];

export function resolveInputDayFallbackTimezone(): string {
  return DateTime.local().zoneName || 'UTC';
}

export function formatInputDayMacroValue(value: InputDayMacroValue): string {
  return typeof value === 'number' ? formatInputDayDecimal(value) : value;
}

export function formatInputDayNutritionAmount(value: number): string {
  return formatInputDayDecimal(value);
}

export function formatInputDayTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

export function formatInputDayDateTime(
  value: string | null | undefined,
  timezone: string,
): string {
  if (!value) {
    return '-';
  }

  const parsed = DateTime.fromISO(value, { setZone: true });
  if (!parsed.isValid) {
    return value;
  }

  return parsed.setZone(timezone).toFormat('yyyy-LL-dd HH:mm');
}

export function formatInputDaySelectedDateLabel(dateLocal: string): string {
  const parsed = DateTime.fromISO(dateLocal);
  if (!parsed.isValid) {
    return dateLocal;
  }

  return parsed.setLocale('en').toFormat('EEEE d LLLL yyyy');
}

export function resolveInputDayItemSlot(
  item: Pick<InputDayItemSummary, 'slotId' | 'slotKey'>,
  availableSlots: readonly InputDayAvailableSlot[],
): InputDayAvailableSlot | null {
  if (item.slotId !== null) {
    return availableSlots.find((slot) => slot.slotId === item.slotId) ?? null;
  }

  if (item.slotKey) {
    return availableSlots.find((slot) => slot.slotKey === item.slotKey) ?? null;
  }

  return null;
}

export function resolveInputDayItemSlotTitle(
  item: InputDayItemSummary,
  availableSlots: readonly InputDayAvailableSlot[],
): string {
  const matchedSlot = resolveInputDayItemSlot(item, availableSlots);
  return matchedSlot?.title ?? item.slotKey?.trim() ?? 'No slot';
}

export function resolveInputDayItemSlotKey(
  item: InputDayItemSummary,
  availableSlots: readonly InputDayAvailableSlot[],
): string {
  const matchedSlot = resolveInputDayItemSlot(item, availableSlots);
  return matchedSlot?.slotKey ?? item.slotKey?.trim() ?? '-';
}

export function resolveInputDayTemplateItemSlotTitle(
  item: InputDayTemplateItemSummary,
  availableSlots: readonly InputDayAvailableSlot[],
): string {
  const matchedSlot =
    item.slotId !== null
      ? availableSlots.find((slot) => slot.slotId === item.slotId) ?? null
      : null;

  return matchedSlot?.title ?? item.slotKey?.trim() ?? 'No slot';
}

export function resolveInputDayTemplateItemSlotKey(
  item: InputDayTemplateItemSummary,
  availableSlots: readonly InputDayAvailableSlot[],
): string {
  const matchedSlot =
    item.slotId !== null
      ? availableSlots.find((slot) => slot.slotId === item.slotId) ?? null
      : null;

  return matchedSlot?.slotKey ?? item.slotKey?.trim() ?? '-';
}

export function getInputDaySelectedInventoriesTemplateStock(
  item: InputDayTemplateItemSummary,
  selectedInventoryIds: readonly number[],
): InputDaySelectedInventoryTemplateStock | null {
  if (selectedInventoryIds.length === 0) {
    return null;
  }

  const selectedStocks = item.stockByInventory.filter((entry) =>
    selectedInventoryIds.includes(entry.inventoryId),
  );
  if (selectedStocks.length === 0) {
    return null;
  }

  return {
    enoughStock: selectedStocks.some((entry) => entry.enoughStock),
    qtyAvailableNormalized: roundInputDayQuantity(
      selectedStocks.reduce(
        (sum, entry) => sum + entry.qtyAvailableNormalized,
        0,
      ),
    ),
  };
}

export function canConvertInputDayTemplateItem(
  item: InputDayTemplateItemSummary,
  selectedInventoryIds: readonly number[],
  loading: boolean,
  isConverting: boolean,
): boolean {
  if (
    item.status === 'converted' ||
    loading ||
    isConverting ||
    selectedInventoryIds.length === 0
  ) {
    return false;
  }

  return item.stockByInventory.some(
    (entry) =>
      selectedInventoryIds.includes(entry.inventoryId) && entry.enoughStock,
  );
}

export function getInputDayTemplateTargetSourceText(
  totals: InputDayTotalsMacrosSummary | null | undefined,
): string {
  return getInputDayTargetSourceText(totals?.targetSource ?? 'none');
}

export function hasInputDayEntries(
  value: Record<string, unknown> | null | undefined,
): boolean {
  return !!value && Object.keys(value).length > 0;
}

export function getInputDayTargetSourceText(
  targetSource: InputDayTargetSource,
): string {
  if (targetSource === 'cycle') {
    return 'Daily targets inherited from the cycle (no active day set).';
  }

  if (targetSource === 'daySet') {
    return 'Daily targets inherited from the active day set.';
  }

  return 'No active daily target.';
}

export function getInputDaySlotMacroEntries(
  slotTotals: InputDayTotalsMacrosBySlotEntry,
): InputDaySlotMacroEntry[] {
  return Object.entries(slotTotals)
    .filter(
      ([key, value]) =>
        !INPUT_DAY_SLOT_TOTALS_META_KEYS.has(key) &&
        (typeof value === 'number' || value === 'donnee incomplete'),
    )
    .map(([key, value]) => ({
      key,
      value: value as InputDayMacroValue,
    }));
}

export function buildInputDayAvailableSlots(
  response: InputDayResponse | null,
): InputDayAvailableSlot[] {
  return (response?.daySet?.slots ?? [])
    .filter(
      (slot): slot is typeof slot & { slotId: number } => slot.slotId !== null,
    )
    .map((slot) => ({
      slotId: slot.slotId,
      title: slot.title,
      slotKey: slot.slotKey,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
    }));
}

export function resolveInputDayApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const responseError = (error as { error?: unknown }).error;
  if (!responseError || typeof responseError !== 'object') {
    return fallback;
  }

  const message = (responseError as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim() !== '') {
    return `${fallback} ${message.trim()}`;
  }

  if (Array.isArray(message)) {
    const details = message.filter(
      (value): value is string => typeof value === 'string',
    );
    if (details.length > 0) {
      return `${fallback} ${details.join(' ')}`;
    }
  }

  return fallback;
}

export function normalizeInputDayQtyUnit(
  value: unknown,
  qtyUnitSet: ReadonlySet<ProductQuantityInputUnit>,
): ProductQuantityInputUnit | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new TypeError('qtyUnit invalide.');
  }

  const candidate = value.trim().toLowerCase();
  if (candidate === '') {
    return null;
  }

  if (!qtyUnitSet.has(candidate as ProductQuantityInputUnit)) {
    throw new Error(`qtyUnit invalide: ${candidate}`);
  }

  return candidate as ProductQuantityInputUnit;
}

export function buildInputDayOccurredAtIso(
  value: string,
  timezone: string,
): string | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  const parsed = DateTime.fromISO(trimmed, { zone: timezone });
  if (!parsed.isValid) {
    return null;
  }

  return parsed.toISO({ suppressMilliseconds: true });
}

export function toInputDayDateTimeLocalInput(
  value: string | null | undefined,
  timezone: string,
): string {
  if (!value) {
    return '';
  }

  const parsed = DateTime.fromISO(value, { setZone: true });
  if (!parsed.isValid) {
    return '';
  }

  return parsed.setZone(timezone).toFormat("yyyy-LL-dd'T'HH:mm");
}

export function parseInputDayDateInput(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatInputDayDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isInputDayDateLocal(value: string): boolean {
  return value.length === 10 && DateTime.fromISO(value).isValid;
}

export function normalizeInputDayInventoryIds(
  value: number | number[] | null | undefined,
): number[] {
  let values: number[];
  if (Array.isArray(value)) {
    values = value;
  } else if (value == null) {
    values = [];
  } else {
    values = [value];
  }
  return Array.from(
    new Set(
      values.filter(
        (inventoryId): inventoryId is number =>
          typeof inventoryId === 'number' &&
          Number.isInteger(inventoryId) &&
          inventoryId > 0,
      ),
    ),
  ).sort((left, right) => left - right);
}

export function areNumberArraysEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function normalizePositiveInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

export function normalizeNullablePositiveInteger(value: unknown): number | null {
  return normalizePositiveInteger(value);
}

export function normalizeIsoString(
  value: string | null | undefined,
): string | null {
  const candidate = value?.trim() || null;
  return candidate;
}

export function formatInputDayDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 100) / 100);
}

export function roundInputDayQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

export function extractInputDayProductsFromResponse(
  value: unknown,
): ProductApiModel[] {
  return extractItemsFromResponse(
    value,
    isInputDayProductLike,
    PRODUCT_RESPONSE_KEYS,
  );
}

export function extractInputDayInventoriesFromResponse(
  value: unknown,
): Inventory[] {
  return extractItemsFromResponse(
    value,
    isInputDayInventoryLike,
    INVENTORY_RESPONSE_KEYS,
  );
}

export function extractInputDayInventoryProductsFromResponse(
  value: unknown,
): InventoryProduct[] {
  return extractItemsFromResponse(
    value,
    isInputDayInventoryProductLike,
    INVENTORY_PRODUCT_RESPONSE_KEYS,
  );
}

export function mapInputDayProductToListItem(
  product: ProductListSource,
): ProductListItem {
  return {
    id: String(product.id),
    name: product.name,
    barcode: product.barcode ?? null,
    unitType: product.unitType ?? undefined,
    quantityPerUnit: product.quantityPerUnit ?? undefined,
    quantityUnit: product.quantityUnit ?? null,
    portionCount: product.portionCount ?? null,
    portionUnit: product.portionUnit ?? null,
    portionQuantityNormalized: product.portionQuantityNormalized ?? null,
    price: product.price ?? null,
    tagNames: resolveInputDayTagNames(product.tags),
    nutritionValuesCount: Array.isArray(product.nutritionValues)
      ? product.nutritionValues.length
      : 0,
    category: resolveInputDayLinkedEntityName(product.category),
    genericProduct: resolveInputDayLinkedEntityName(product.genericProduct),
  };
}

export function mapInputDayProductsToListItems(
  products: readonly ProductListSource[],
): ProductListItem[] {
  return products.map((product) => mapInputDayProductToListItem(product));
}

export function buildInputDaySelectableProductListItems({
  productListItems,
  selectedInventoryProducts,
}: InputDaySelectableProductInput): ProductListItem[] {
  const productsById = new Map(
    productListItems.map((item) => [Number(item.id), item] as const),
  );
  const resolvedIds = new Set<number>();
  const resolvedItems: ProductListItem[] = [];

  for (const inventoryProduct of selectedInventoryProducts) {
    const productId = inventoryProduct.productId;
    if (
      !Number.isInteger(productId) ||
      productId < 1 ||
      resolvedIds.has(productId)
    ) {
      continue;
    }

    const fallbackItem =
      resolveInputDayInventoryLinkedProductListItem(inventoryProduct);
    const resolvedItem = productsById.get(productId) ?? fallbackItem;
    if (!resolvedItem) {
      continue;
    }

    resolvedIds.add(productId);
    resolvedItems.push(
      withInputDayAvailableQuantity(resolvedItem, inventoryProduct),
    );
  }

  return resolvedItems;
}

function extractItemsFromResponse<T>(
  value: unknown,
  isItem: (value: unknown) => value is T,
  nestedKeys: readonly string[],
): T[] {
  if (Array.isArray(value)) {
    return value.filter(isItem);
  }

  if (isItem(value)) {
    return [value];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const raw = value as Record<string, unknown>;
  for (const key of nestedKeys) {
    const nested = raw[key];
    if (Array.isArray(nested)) {
      const items = nested.filter(isItem);
      if (items.length > 0) {
        return items;
      }
    }
  }

  return [];
}

function isInputDayProductLike(value: unknown): value is ProductApiModel {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Partial<ProductApiModel>;
  return typeof product.id === 'number' && typeof product.name === 'string';
}

function isInputDayInventoryLike(value: unknown): value is Inventory {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const inventory = value as Partial<Inventory>;
  return (
    typeof inventory.id === 'number' && typeof inventory.name === 'string'
  );
}

function isInputDayInventoryProductLike(
  value: unknown,
): value is InventoryProduct {
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

function isInputDayProductListSourceLike(
  value: unknown,
): value is ProductListSource {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Partial<ProductListSource>;
  return typeof product.id === 'number' && typeof product.name === 'string';
}

function resolveInputDayInventoryLinkedProductListItem(
  inventoryProduct: InventoryProduct,
): ProductListItem | null {
  if (!isInputDayProductListSourceLike(inventoryProduct.product)) {
    return null;
  }

  return mapInputDayProductToListItem(inventoryProduct.product);
}

function withInputDayAvailableQuantity(
  item: ProductListItem,
  inventoryProduct: InventoryProduct,
): ProductListItem {
  return {
    ...item,
    availableQuantity:
      typeof inventoryProduct.qtyOnHandNormalized === 'number' &&
      Number.isFinite(inventoryProduct.qtyOnHandNormalized)
        ? inventoryProduct.qtyOnHandNormalized
        : null,
    availableQuantityUnit: item.quantityUnit ?? null,
  };
}

function resolveInputDayTagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const names = tags
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag.trim();
      }

      if (!tag || typeof tag !== 'object') {
        return '';
      }

      const raw = tag as Record<string, unknown>;
      const fields = ['name', 'title', 'label', 'key'];
      for (const field of fields) {
        const value = raw[field];
        if (typeof value === 'string' && value.trim() !== '') {
          return value.trim();
        }
      }

      return '';
    })
    .filter((name) => name !== '');

  return Array.from(new Set(names));
}

function resolveInputDayLinkedEntityName(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return 'None';
  }

  const raw = value as Record<string, unknown>;
  const fields = ['name', 'title', 'label'];
  for (const field of fields) {
    const candidate = raw[field];
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim();
    }
  }

  return 'None';
}
