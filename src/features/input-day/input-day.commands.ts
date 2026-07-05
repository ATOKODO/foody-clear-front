import type {
  CreateInputDayItemsDto,
  InputDayItemCommand,
  ProductQuantityInputUnit,
  UpdateInputDayItemDto,
} from '../../interfaces/input-day.interface';
import type { InputDaySelectedProductRow } from './input-day.models';
import {
  buildInputDayOccurredAtIso,
  isInputDayDateLocal,
  normalizeInputDayQtyUnit,
  normalizeNullablePositiveInteger,
  normalizePositiveInteger,
} from './input-day.helpers';

export interface InputDayItemEditorValue {
  itemId?: unknown;
  dateLocal?: unknown;
  occurredAt?: unknown;
  productId?: unknown;
  qty?: unknown;
  qtyUnit?: unknown;
  slotId?: unknown;
  slotKey?: unknown;
}

export type InputDayItemEditorRequest =
  | { itemId: null; requestDateLocal: string; payload: InputDayItemCommand }
  | {
      itemId: number;
      requestDateLocal: string;
      payload: UpdateInputDayItemDto;
    };

export interface InputDayCommandResult<T> {
  request: T | null;
  error: string | null;
}

export interface InputDayItemEditorRequestInput {
  value: InputDayItemEditorValue;
  selectedInventoryIds: readonly number[];
  qtyUnitSet: ReadonlySet<ProductQuantityInputUnit>;
  timezone: string;
  resolveUpdateRequestDateLocal: () => string | null;
}

export interface InputDaySelectedItemsRequest {
  requestDateLocal: string;
  payload: CreateInputDayItemsDto;
}

export interface InputDaySelectedItemsRequestInput {
  value: InputDayItemEditorValue;
  selectedProductRows: readonly InputDaySelectedProductRow[];
  selectedInventoryIds: readonly number[];
  selectedSlotId: number | null;
  qtyUnitSet: ReadonlySet<ProductQuantityInputUnit>;
  timezone: string;
  hasValidSelectedDate: boolean;
  initialDateError: string | null;
}

export interface InputDayItemEditorAvailabilityInput {
  value: InputDayItemEditorValue;
  timezone: string;
  hasValidSelectedDate: boolean;
  hasSelectedInventories: boolean;
  initialDateError: string | null;
  loading: boolean;
  loadingProducts: boolean;
  loadingInventories: boolean;
  hasProductsError: boolean;
  hasInventoriesError: boolean;
  hasInventoryProductsError: boolean;
}

export interface InputDaySelectedItemsAvailabilityInput
  extends Omit<
    InputDayItemEditorAvailabilityInput,
    'hasProductsError' | 'hasInventoriesError' | 'hasInventoryProductsError'
  > {
  loadingInventoryProducts: boolean;
  hasProductsError: boolean;
  hasInventoriesError: boolean;
  hasInventoryProductsError: boolean;
  selectedProductRows: readonly InputDaySelectedProductRow[];
}

export function canSubmitInputDayItemEditor({
  value,
  timezone,
  hasValidSelectedDate,
  hasSelectedInventories,
  initialDateError,
  loading,
  loadingProducts,
  loadingInventories,
  hasProductsError,
  hasInventoriesError,
  hasInventoryProductsError,
}: InputDayItemEditorAvailabilityInput): boolean {
  if (
    loading ||
    loadingProducts ||
    loadingInventories ||
    hasProductsError ||
    hasInventoriesError ||
    hasInventoryProductsError
  ) {
    return false;
  }

  if (initialDateError !== null || !hasValidSelectedDate) {
    return false;
  }

  if (!hasSelectedInventories) {
    return false;
  }

  const dateLocal = readString(value.dateLocal);
  const productId = normalizePositiveInteger(value.productId);
  const qty = value.qty ?? null;
  const occurredAtRaw = readString(value.occurredAt);

  if (
    !isInputDayDateLocal(dateLocal) ||
    productId === null ||
    qty == null ||
    typeof qty !== 'number' ||
    qty <= 0
  ) {
    return false;
  }

  return (
    occurredAtRaw === '' ||
    buildInputDayOccurredAtIso(occurredAtRaw, timezone) !== null
  );
}

export function canCreateInputDaySelectedItems({
  value,
  timezone,
  hasValidSelectedDate,
  hasSelectedInventories,
  initialDateError,
  loading,
  loadingProducts,
  loadingInventories,
  loadingInventoryProducts,
  hasProductsError,
  hasInventoriesError,
  hasInventoryProductsError,
  selectedProductRows,
}: InputDaySelectedItemsAvailabilityInput): boolean {
  if (
    loading ||
    loadingProducts ||
    loadingInventories ||
    loadingInventoryProducts
  ) {
    return false;
  }

  if (!hasValidSelectedDate || initialDateError !== null) {
    return false;
  }

  if (hasProductsError || hasInventoriesError || hasInventoryProductsError) {
    return false;
  }

  if (!hasSelectedInventories) {
    return false;
  }

  const dateLocal = readString(value.dateLocal);
  const occurredAtRaw = readString(value.occurredAt);
  if (!isInputDayDateLocal(dateLocal)) {
    return false;
  }

  if (
    occurredAtRaw !== '' &&
    buildInputDayOccurredAtIso(occurredAtRaw, timezone) === null
  ) {
    return false;
  }

  if (selectedProductRows.length === 0) {
    return false;
  }

  return selectedProductRows.every(
    (row) =>
      typeof row.qty === 'number' && Number.isFinite(row.qty) && row.qty > 0,
  );
}

export function buildInputDayItemEditorRequest({
  value,
  selectedInventoryIds,
  qtyUnitSet,
  timezone,
  resolveUpdateRequestDateLocal,
}: InputDayItemEditorRequestInput): InputDayCommandResult<InputDayItemEditorRequest> {
  const dateLocal = readString(value.dateLocal);
  if (!isInputDayDateLocal(dateLocal)) {
    return {
      request: null,
      error: "Entry date must use YYYY-MM-DD format.",
    };
  }

  if (selectedInventoryIds.length === 0) {
    return {
      request: null,
      error: "Select at least one inventory before saving the entry.",
    };
  }

  const inventoryId = selectedInventoryIds[0];
  const productId = normalizePositiveInteger(value.productId);
  if (productId === null) {
    return { request: null, error: 'Select a product.' };
  }

  const qty = value.qty ?? null;
  if (
    qty == null ||
    typeof qty !== 'number' ||
    !Number.isFinite(qty) ||
    qty <= 0
  ) {
    return { request: null, error: 'La quantite doit etre > 0.' };
  }

  let qtyUnit: ProductQuantityInputUnit | null;
  try {
    qtyUnit = normalizeInputDayQtyUnit(value.qtyUnit, qtyUnitSet);
  } catch (error) {
    return {
      request: null,
      error: error instanceof Error ? error.message : 'qtyUnit invalide.',
    };
  }

  const occurredAtRaw = readString(value.occurredAt);
  const occurredAt =
    occurredAtRaw === ''
      ? null
      : buildInputDayOccurredAtIso(occurredAtRaw, timezone);
  if (occurredAtRaw !== '' && occurredAt === null) {
    return { request: null, error: 'occurredAt doit etre une date/heure valide.' };
  }

  const slotId = normalizeNullablePositiveInteger(value.slotId);
  const slotKey = slotId === null ? readString(value.slotKey) : '';
  const itemId = normalizePositiveInteger(value.itemId);

  if (itemId === null) {
    return {
      request: {
        itemId: null,
        requestDateLocal: dateLocal,
        payload: {
          productId,
          inventoryId,
          qty,
          ...(occurredAt ? { occurredAt } : {}),
          ...(qtyUnit ? { qtyUnit } : {}),
          ...(slotId !== null ? { slotId } : {}),
          ...(slotId === null && slotKey !== '' ? { slotKey } : {}),
        },
      },
      error: null,
    };
  }

  const requestDateLocal = resolveUpdateRequestDateLocal();
  if (!requestDateLocal) {
    return { request: null, error: null };
  }

  return {
    request: {
      itemId,
      requestDateLocal,
      payload: {
        dateLocal,
        productId,
        inventoryId,
        qty,
        ...(occurredAt ? { occurredAt } : {}),
        ...(qtyUnit ? { qtyUnit } : {}),
        slotId,
        ...(slotId === null && slotKey !== '' ? { slotKey } : {}),
      },
    },
    error: null,
  };
}

export function buildInputDaySelectedItemsRequest(
  input: InputDaySelectedItemsRequestInput,
): InputDayCommandResult<InputDaySelectedItemsRequest> {
  const validationError = validateSelectedItemsPayload(input);
  if (validationError) {
    return { request: null, error: validationError };
  }

  const requestDateLocal = readString(input.value.dateLocal);
  const inventoryId = input.selectedInventoryIds[0];
  const occurredAtRaw = readString(input.value.occurredAt);
  const occurredAt =
    occurredAtRaw === ''
      ? null
      : buildInputDayOccurredAtIso(occurredAtRaw, input.timezone);
  const slotKey =
    input.selectedSlotId === null ? readString(input.value.slotKey) : '';

  try {
    return {
      request: {
        requestDateLocal,
        payload: {
          items: input.selectedProductRows.map((row) => {
            const qtyUnit = normalizeInputDayQtyUnit(
              row.qtyUnit,
              input.qtyUnitSet,
            );
            return {
              productId: row.productId,
              inventoryId,
              qty: row.qty as number,
              ...(occurredAt ? { occurredAt } : {}),
              ...(qtyUnit ? { qtyUnit } : {}),
              ...(input.selectedSlotId != null
                ? { slotId: input.selectedSlotId }
                : {}),
              ...(input.selectedSlotId == null && slotKey !== ''
                ? { slotKey }
                : {}),
            };
          }),
        },
      },
      error: null,
    };
  } catch (error) {
    return {
      request: null,
      error: error instanceof Error ? error.message : 'qtyUnit invalide.',
    };
  }
}

function validateSelectedItemsPayload({
  value,
  selectedProductRows,
  selectedInventoryIds,
  timezone,
  hasValidSelectedDate,
  initialDateError,
}: InputDaySelectedItemsRequestInput): string | null {
  if (!hasValidSelectedDate || initialDateError !== null) {
    return 'La date selectionnee est invalide.';
  }

  if (selectedInventoryIds.length === 0) {
    return "Select at least one inventory before adding items.";
  }

  if (selectedProductRows.length === 0) {
    return 'Select at least one product.';
  }

  const requestDateLocal = readString(value.dateLocal);
  if (!isInputDayDateLocal(requestDateLocal)) {
    return 'La date metier doit etre au format YYYY-MM-DD.';
  }

  const occurredAtRaw = readString(value.occurredAt);
  if (
    occurredAtRaw !== '' &&
    buildInputDayOccurredAtIso(occurredAtRaw, timezone) === null
  ) {
    return 'occurredAt doit etre une date/heure valide.';
  }

  if (
    selectedProductRows.some(
      (row) => row.qty == null || !Number.isFinite(row.qty) || row.qty <= 0,
    )
  ) {
    return 'Chaque produit selectionne doit avoir une quantite > 0.';
  }

  return null;
}

function readString(value: unknown): string {
  return String(value ?? '').trim();
}
