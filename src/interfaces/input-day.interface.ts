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

export interface InputDayResponse {
  dateLocal: string;
  timezone: string;
  assignment: unknown | null;
  daySet: unknown | null;
  slots: unknown[];
  itemsBySlot: unknown[];
  totalsMacros: unknown;
}
