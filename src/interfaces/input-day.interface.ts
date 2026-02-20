export type ProductQuantityInputUnit =
  | 'mg'
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'unit'
  | 'pack'
  | 'tranche'
  | 'piece'
  | 'part'
  | 'bouteille'
  | 'portion';

export interface InputDayItemCommand {
  productId: number;
  inventoryId: number;
  qty: number;
  qtyUnit?: ProductQuantityInputUnit;
  slotId?: number;
  slotKey?: string;
}

export interface CreateInputDayItemsDto {
  items: InputDayItemCommand[];
}

export interface UpdateInputDayItemDto {
  qty: number;
  qtyUnit?: ProductQuantityInputUnit;
}

export type InputDayIncompleteValue = 'donnee incomplete';
export type InputDayMacroValue = number | InputDayIncompleteValue;

export interface InputDayNutritionValue {
  [nutritionKey: string]: number;
}

export interface InputDayAssignmentSummary {
  id: number;
  cycleId: number;
  cycleTitle: string;
  startDateLocal: string;
  endDateLocal: string;
  dayIndex: number;
}

export interface InputDaySlotSummary {
  slotId: number | null;
  slotKey: string;
  title: string;
  sortOrder: number;
  startTime?: string | null;
  endTime?: string | null;
}

export interface InputDayItemSummary {
  id: number;
  productId: number;
  productName: string;
  inventoryId: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized: number;
  insertedAt: string;
  nutritionValue: InputDayNutritionValue;
}

export interface InputDayDaySetSlotSummary {
  slotId: number | null;
  slotKey: string;
  title: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  nutritionValue: InputDayNutritionValue | null;
}

export interface InputDayDaySetSummary {
  id: number;
  title: string;
  nutritionValue: InputDayNutritionValue | null;
  slots: InputDayDaySetSlotSummary[];
}

export interface InputDayItemsBySlotEntry {
  slot: InputDaySlotSummary;
  items: InputDayItemSummary[];
}

export interface InputDayTotalsMacrosBySlotEntry {
  slot: InputDayDaySetSlotSummary;
  targets: Record<string, number> | null;
  deltaToTargets: Record<string, InputDayMacroValue> | null;
  incompleteNutritionKeys: string[];
  [nutritionKey: string]:
    | InputDayDaySetSlotSummary
    | Record<string, number>
    | Record<string, InputDayMacroValue>
    | InputDayMacroValue
    | string[]
    | null;
}

export interface InputDayTotalsMacrosSummary {
  bySlot: InputDayTotalsMacrosBySlotEntry[];
  dayTotal: Record<string, InputDayMacroValue>;
  targets: Record<string, number> | null;
  deltaToTargets: Record<string, InputDayMacroValue> | null;
  incompleteNutritionKeys: string[];
}

export interface InputDayResponse {
  dateLocal: string;
  timezone: string;
  assignment: InputDayAssignmentSummary | null;
  daySet: InputDayDaySetSummary | null;
  items: InputDayItemSummary[];
  totalsMacros: InputDayTotalsMacrosSummary | null;
  itemsBySlot?: InputDayItemsBySlotEntry[];
  slots?: InputDayDaySetSlotSummary[];
}
