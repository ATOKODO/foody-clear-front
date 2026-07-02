import type {
  SlotFormValue,
} from '../../components/slot/slot-form/slot-form';
import type { SlotListItem } from '../../components/slot/slot-list/slot-list';
import type { CycleNutritionValue } from '../../interfaces/cycle.interface';
import type { CreateSlotDto, Slot } from '../../interfaces/slot.interface';

export function toSlotListItems(slots: Slot[]): SlotListItem[] {
  return slots.map((slot) => ({
    id: String(slot.id),
    key: slot.key,
    title: slot.title,
    sortOrder: slot.sortOrder,
    startTime: slot.startTime ?? null,
    endTime: slot.endTime ?? null,
    nutritionValues: slot.nutritionValues ?? [],
  }));
}

export function getSlotIdFromListItem(item: SlotListItem): number | null {
  const slotId = Number(item.id);
  return Number.isFinite(slotId) ? slotId : null;
}

export function toEditableSlotFormValue(slot: Slot): Partial<SlotFormValue> {
  return {
    key: slot.key,
    title: slot.title,
    sortOrder: slot.sortOrder,
    startTime: slot.startTime ?? null,
    endTime: slot.endTime ?? null,
    nutritionValues: getEditableNutritionValues(slot),
  };
}

export function toCreateSlotDto(value: SlotFormValue): CreateSlotDto {
  return {
    key: value.key.trim(),
    title: value.title,
    sortOrder: Number.isFinite(value.sortOrder)
      ? Math.max(0, value.sortOrder)
      : 0,
    startTime: normalizeTime(value.startTime),
    endTime: normalizeTime(value.endTime),
    nutritionValues: normalizeNutritionValues(value.nutritionValues),
  };
}

export function normalizeNutritionValues(
  values: CycleNutritionValue[],
): CycleNutritionValue[] {
  return values
    .map((value) => ({
      nutritionKey: value.nutritionKey.trim().toUpperCase(),
      amount: Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0,
      unit: value.unit,
      reference: value.reference,
    }))
    .filter((value) => value.nutritionKey !== '');
}

function getEditableNutritionValues(slot: Slot): CycleNutritionValue[] {
  if (slot.nutritionValues && slot.nutritionValues.length > 0) {
    return slot.nutritionValues.map((value) => ({
      nutritionKey: value.nutritionKey,
      amount: value.amount,
      unit: value.unit,
      reference: value.reference,
    }));
  }

  return [
    {
      nutritionKey: 'PROTEIN',
      amount: 0,
      unit: 'G',
      reference: 'PER_100G',
    },
    {
      nutritionKey: 'CARBOHYDRATE',
      amount: 0,
      unit: 'G',
      reference: 'PER_100G',
    },
    {
      nutritionKey: 'FAT',
      amount: 0,
      unit: 'G',
      reference: 'PER_100G',
    },
  ];
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
