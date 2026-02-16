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
}

export interface InputDayItemsBySlotEntry {
  slot: InputDaySlotSummary;
  items: InputDayItemSummary[];
}

export interface InputDayResponse {
  dateLocal: string;
  timezone: string;
  assignment: unknown | null;
  daySet: unknown | null;
  slots: unknown[];
  itemsBySlot: InputDayItemsBySlotEntry[];
  totalsMacros: unknown;
}
