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
  occurredAt?: string;
  qtyUnit?: ProductQuantityInputUnit;
  slotId?: number;
  slotKey?: string;
}

export interface CreateInputDayItemsDto {
  items: InputDayItemCommand[];
}

export interface UpdateInputDayItemDto {
  dateLocal: string;
  productId: number;
  inventoryId: number;
  qty: number;
  occurredAt?: string;
  qtyUnit?: ProductQuantityInputUnit;
  slotId?: number | null;
  slotKey?: string;
}

export type InputDayIncompleteValue = 'donnee incomplete';
export type InputDayMacroValue = number | InputDayIncompleteValue;

export interface InputDayNutritionValue {
  [nutritionKey: string]: number;
}

export type ExternalMealEntryPaymentStatus = 'paid' | 'free' | 'refunded';

export interface ExternalMealEntryMacroValues {
  energyKcal: number;
  proteins: number;
  carbs: number;
  lipids: number;
}

export interface CreateExternalMealEntryDto {
  dateLocal: string;
  occurredAt: string;
  name: string;
  paymentStatus: ExternalMealEntryPaymentStatus;
  priceAmount?: number | null;
  nutritionValue: ExternalMealEntryMacroValues;
  slotId?: number | null;
  slotKey?: string | null;
  restaurantName?: string | null;
  note?: string | null;
}

export type UpdateExternalMealEntryDto = CreateExternalMealEntryDto;

export interface ExternalMealEntrySummary {
  id: number;
  dateLocal: string;
  name: string;
  paymentStatus: ExternalMealEntryPaymentStatus;
  priceAmount: number | null;
  insertedAt: string;
  occurredAt: string;
  slotId: number | null;
  slotKey: string | null;
  restaurantName?: string | null;
  note?: string | null;
  nutritionValue: ExternalMealEntryMacroValues;
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
  occurredAt: string | null;
  slotId: number | null;
  slotKey: string | null;
  templateItemId?: number | null;
  nutritionValue: InputDayNutritionValue;
}

export interface InputDayTemplateStockByInventory {
  inventoryId: number;
  inventoryName: string;
  qtyAvailableNormalized: number;
  enoughStock: boolean;
}

export interface InputDayTemplateItemSummary {
  id: number;
  productId: number;
  productName: string;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
  qtyNormalized: number;
  slotId: number | null;
  slotKey: string | null;
  preferredTime?: string;
  status: 'pending' | 'converted';
  convertedItemId: number | null;
  stockAvailability: {
    enoughStock: boolean;
    totalAvailableNormalized: number;
    requestedQtyNormalized: number;
  };
  stockByInventory: InputDayTemplateStockByInventory[];
  nutritionValue: InputDayNutritionValue;
}

export interface InputDayTemplateAssociationSummary {
  source: 'manual' | 'daySet' | 'cycle';
  template: {
    id: number;
    title: string;
  };
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

export type InputDayTargetSource = 'daySet' | 'cycle' | 'none';

export interface InputDayTotalsMacrosSummary {
  bySlot: InputDayTotalsMacrosBySlotEntry[];
  dayTotal: Record<string, InputDayMacroValue>;
  targets: Record<string, number> | null;
  deltaToTargets: Record<string, InputDayMacroValue> | null;
  incompleteNutritionKeys: string[];
  targetSource: InputDayTargetSource;
}

export interface InputDayResponse {
  dateLocal: string;
  timezone: string;
  assignment: InputDayAssignmentSummary | null;
  daySet: InputDayDaySetSummary | null;
  templateAssociation?: InputDayTemplateAssociationSummary | null;
  templateItems?: InputDayTemplateItemSummary[];
  items: InputDayItemSummary[];
  externalEntries?: ExternalMealEntrySummary[];
  totalsMacros: InputDayTotalsMacrosSummary | null;
  projectedTotalsMacros?: InputDayTotalsMacrosSummary | null;
  itemsBySlot?: InputDayItemsBySlotEntry[];
  slots?: InputDayDaySetSlotSummary[];
}

export interface InputWeekResponse {
  startDateLocal: string;
  endDateLocal: string;
  timezone: string;
  days: InputDayResponse[];
}

export interface InputMonthResponse {
  startDateLocal: string;
  endDateLocal: string;
  timezone: string;
  days: InputDayResponse[];
}
