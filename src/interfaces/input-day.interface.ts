export interface InputDayItemCommand {
  productId: number;
  qty: number;
  slotId?: number;
  slotKey?: string;
}

export interface CreateInputDayItemsDto {
  items: InputDayItemCommand[];
}

export interface UpdateInputDayItemDto {
  qty: number;
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
}

export interface InputDayItemSummary {
  id: number;
  productId: number;
  productName: string;
  qty: number;
  insertedAt: string;
  nutritionValue: InputDayNutritionValue;
}

export interface InputDayDaySetSlotSummary {
  slotId: number;
  slotKey: string;
  title: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  nutritionValue: InputDayNutritionValue;
}

export interface InputDayDaySetSummary {
  id: number;
  title: string;
  nutritionValue: InputDayNutritionValue;
  slots: InputDayDaySetSlotSummary[];
}

export interface InputDayItemsBySlotEntry {
  slot: InputDaySlotSummary;
  items: InputDayItemSummary[];
}

export interface InputDayTotalsMacrosBySlotEntry {
  slot: InputDayDaySetSlotSummary;
  proteins: InputDayMacroValue;
  carbs: InputDayMacroValue;
  lipids: InputDayMacroValue;
  targets: Record<string, number>;
  deltaToTargets: Record<string, InputDayMacroValue>;
  incompleteNutritionKeys: string[];
}

export interface InputDayTotalsMacrosSummary {
  bySlot: InputDayTotalsMacrosBySlotEntry[];
  dayTotal: Record<string, InputDayMacroValue>;
  targets: Record<string, number>;
  deltaToTargets: Record<string, InputDayMacroValue>;
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
