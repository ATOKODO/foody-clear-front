import type { InventoryProduct } from '../../interfaces/inventory.interface';
import type { InputDayResponse } from '../../interfaces/input-day.interface';
import type { InputDayAvailableSlot } from './input-day.models';
import {
  formatInputDayDateLocal,
  parseInputDayDateInput,
  roundInputDayQuantity,
  toInputDayDateTimeLocalInput,
} from './input-day.helpers';

export function resolveInputDayDateLocal(value: Date | string | null): string | null {
  const parsedDate = parseInputDayDateInput(value);
  return parsedDate ? formatInputDayDateLocal(parsedDate) : null;
}

export function resolveInputDayTimezone(value: unknown, fallbackTimezone: string): string {
  const timezone = typeof value === 'string' ? value.trim() : '';
  return timezone === '' ? fallbackTimezone : timezone;
}

export function createInputDayEditorValue(params: {
  response: InputDayResponse | null;
  formDateLocal: Date | string | null;
  initialDateLocal: string | null;
  occurredAt: string | null;
  timezone: string;
}): Record<string, unknown> {
  return {
    itemId: null,
    dateLocal:
      params.response?.dateLocal ??
      resolveInputDayDateLocal(params.formDateLocal) ??
      params.initialDateLocal?.trim() ??
      '',
    occurredAt: toInputDayDateTimeLocalInput(params.occurredAt, params.timezone),
    productId: null,
    qty: null,
    qtyUnit: null,
    slotId: null,
    slotKey: '',
  };
}

export function aggregateInventoryProducts(
  inventoryIds: number[],
  productsByInventoryId: ReadonlyMap<number, InventoryProduct[]>,
): InventoryProduct[] {
  const aggregatedProducts = new Map<number, InventoryProduct>();

  for (const inventoryId of inventoryIds) {
    for (const product of productsByInventoryId.get(inventoryId) ?? []) {
      const existing = aggregatedProducts.get(product.productId);
      if (!existing) {
        aggregatedProducts.set(product.productId, {
          ...product,
          qtyOnHandInUnits: product.qtyOnHandInUnits ?? 0,
          qtyOnHandNormalized: product.qtyOnHandNormalized ?? 0,
        });
        continue;
      }

      existing.qtyOnHandInUnits = roundInputDayQuantity(
        (existing.qtyOnHandInUnits ?? 0) + (product.qtyOnHandInUnits ?? 0),
      );
      existing.qtyOnHandNormalized = roundInputDayQuantity(
        (existing.qtyOnHandNormalized ?? 0) + (product.qtyOnHandNormalized ?? 0),
      );
    }
  }

  return Array.from(aggregatedProducts.values()).sort(
    (left, right) => left.productId - right.productId,
  );
}

export function resolveValidInventoryIds(
  selectedInventoryIds: number[],
  availableInventoryIds: Iterable<number>,
): number[] {
  const validInventoryIds = new Set(availableInventoryIds);
  return selectedInventoryIds.filter((inventoryId) => validInventoryIds.has(inventoryId));
}

export function resolveSelectedSlotId(
  selectedSlotId: number | null,
  availableSlots: InputDayAvailableSlot[],
): number | null {
  return selectedSlotId !== null && !availableSlots.some((slot) => slot.slotId === selectedSlotId)
    ? null
    : selectedSlotId;
}
