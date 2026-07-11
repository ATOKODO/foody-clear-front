import { DateTime } from 'luxon';
import type {
  ExternalMealEntrySummary,
  InputDayDaySetSlotSummary,
  InputDayItemSummary,
  InputDayMacroValue,
  InputDayResponse,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';
import type {
  InventoryPurchaseEventSummary,
  StatisticsTimelineDay,
  StatisticsTimelineResponse,
} from '../../interfaces/statistics.interface';
import type { Slot } from '../../interfaces/slot.interface';
import {
  HOME_MACRO_DEFINITIONS,
  HomeDayEntryRow,
  HomeMacroCard,
  HomeMacroStatus,
  HomeScheduleRow,
} from './home-dashboard.types';

interface SlotLinkedEntity {
  slotId: number | null;
  slotKey: string | null;
}

export function getTodayTimelineDay(
  timelineResponse: StatisticsTimelineResponse | null,
  todayDateLocal: string,
): StatisticsTimelineDay | null {
  return (
    timelineResponse?.days.find((day) => day.dateLocal === todayDateLocal) ??
    null
  );
}

export function getActiveCycleLabel(
  inputDayResponse: InputDayResponse | null,
  timelineDay: StatisticsTimelineDay | null,
): string {
  const assignment = inputDayResponse?.assignment ?? timelineDay?.inputs.assignment;
  return assignment?.cycleTitle ?? 'No active cycle';
}

export function getActiveDaySetLabel(
  inputDayResponse: InputDayResponse | null,
  timelineDay: StatisticsTimelineDay | null,
): string {
  const daySet = inputDayResponse?.daySet ?? timelineDay?.inputs.daySet;
  return daySet?.title ?? 'No day set';
}

export function getEnteredItemCount(
  inputDayResponse: InputDayResponse | null,
  timelineDay: StatisticsTimelineDay | null,
): number {
  return (
    (inputDayResponse
      ? inputDayResponse.items.length + getExternalEntries(inputDayResponse).length
      : timelineDay?.inputs.itemCount) ?? 0
  );
}

export function getExternalEntries(
  inputDayResponse: InputDayResponse | null,
): ExternalMealEntrySummary[] {
  return inputDayResponse?.externalEntries ?? [];
}

export function getPendingTemplateItems(
  inputDayResponse: InputDayResponse | null,
): InputDayTemplateItemSummary[] {
  return (inputDayResponse?.templateItems ?? []).filter(
    (item) => item.status === 'pending',
  );
}

export function getConvertedTemplateItems(
  inputDayResponse: InputDayResponse | null,
): InputDayTemplateItemSummary[] {
  return (inputDayResponse?.templateItems ?? []).filter(
    (item) => item.status === 'converted',
  );
}

export function buildHomeMacroCards(
  inputDayResponse: InputDayResponse | null,
  timelineDay: StatisticsTimelineDay | null,
): HomeMacroCard[] {
  const totals =
    inputDayResponse?.totalsMacros ?? inputDayResponse?.projectedTotalsMacros;
  const timelineInputs = timelineDay?.inputs ?? null;
  const dayTotal = totals?.dayTotal ?? timelineInputs?.dayTotal ?? {};
  const targets = totals?.targets ?? timelineInputs?.targets ?? null;
  const deltas = totals?.deltaToTargets ?? timelineInputs?.deltaToTargets ?? null;

  return HOME_MACRO_DEFINITIONS.map((definition) => {
    const actual = dayTotal[definition.key];
    const target = targets?.[definition.key] ?? null;
    const delta = deltas?.[definition.key] ?? null;

    return {
      ...definition,
      actual: formatMetricValue(actual, definition.unit),
      target: formatMetricValue(target, definition.unit),
      delta: formatMetricValue(delta, definition.unit, true),
      progress: getMacroProgress(actual, target),
      status: getMacroStatus(actual, target),
    };
  });
}

export function buildHomeScheduleRows(
  inputDayResponse: InputDayResponse | null,
  slotCatalog: Slot[],
): HomeScheduleRow[] {
  if (!inputDayResponse) {
    return [];
  }

  const slots = resolveDaySlots(inputDayResponse, slotCatalog);
  const rows = slots.map((slot) => buildScheduleRow(slot, inputDayResponse, slots));
  const templateItems = inputDayResponse.templateItems ?? [];
  const orphanItems = inputDayResponse.items.filter(
    (item) => !findSlotForEntry(item, slots),
  );
  const orphanPlannedItems = templateItems.filter(
    (item) => !findSlotForEntry(item, slots),
  );

  if (orphanItems.length > 0 || orphanPlannedItems.length > 0) {
    rows.push({
      key: 'without-slot',
      title: 'Unassigned to a slot',
      rangeLabel: 'No time range',
      items: orphanItems,
      plannedItems: orphanPlannedItems,
    });
  }

  return rows;
}

export function buildHomeDayEntryRows(
  inputDayResponse: InputDayResponse | null,
  timezone: string,
  slotCatalog: Slot[],
): HomeDayEntryRow[] {
  if (!inputDayResponse) {
    return [];
  }

  const slots = resolveDaySlots(inputDayResponse, slotCatalog);
  const stockRows = inputDayResponse.items.map((item) => ({
    key: `stock-${item.id}`,
    id: item.id,
    occurredAt: resolveItemTimestamp(item),
    timeLabel: formatHomeDateTime(item.occurredAt || item.insertedAt, timezone),
    productName: item.productName,
    slotLabel: getItemSlotLabel(item, slots),
    qtyLabel: formatHomeItemQty(item),
    isExternal: false,
    paymentLabel: null,
  }));

  const externalRows = getExternalEntries(inputDayResponse).map((entry) => ({
    key: `external-${entry.id}`,
    id: entry.id,
    occurredAt: entry.occurredAt,
    timeLabel: formatHomeDateTime(entry.occurredAt, timezone),
    productName: entry.name,
    slotLabel: getExternalEntrySlotLabel(entry, slots),
    qtyLabel: formatExternalEntryMacros(entry),
    isExternal: true,
    paymentLabel: getExternalPaymentLabel(entry),
  }));

  return [...stockRows, ...externalRows]
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
    .map((row) => ({
      key: row.key,
      id: row.id,
      timeLabel: row.timeLabel,
      productName: row.productName,
      slotLabel: row.slotLabel,
      qtyLabel: row.qtyLabel,
      isExternal: row.isExternal,
      paymentLabel: row.paymentLabel,
    }));
}

export function getRecentPurchaseEvents(
  timelineDay: StatisticsTimelineDay | null,
): InventoryPurchaseEventSummary[] {
  return [...(timelineDay?.expenses.events ?? [])]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 5);
}

export function getTargetSourceLabel(
  inputDayResponse: InputDayResponse | null,
  timelineDay: StatisticsTimelineDay | null,
): string {
  const source =
    inputDayResponse?.totalsMacros?.targetSource ??
    timelineDay?.inputs.targetSource ??
    'none';

  if (source === 'daySet') {
    return 'Day set';
  }

  if (source === 'cycle') {
    return 'Cycle';
  }

  return 'No target';
}

export function formatCurrency(value: number | null | undefined): string {
  const normalized =
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
}

export function formatHomeItemQty(
  item: InputDayItemSummary | InputDayTemplateItemSummary,
): string {
  const qty = roundNumber(item.qty);
  return `${qty} ${item.qtyUnit ?? ''}`.trim();
}

export function formatHomeDateTime(
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

  return parsed.setZone(timezone).toFormat('HH:mm');
}

export function getPurchaseEventLabel(
  event: InventoryPurchaseEventSummary,
): string {
  if (event.excludedFromStats || event.pricingStatus === 'excluded') {
    return event.exclusionReason === 'refunded' ? 'Refunded' : 'Excluded';
  }

  if (event.pricingStatus === 'free') {
    return 'Gratuit';
  }

  if (event.pricingStatus === 'incomplete') {
    return 'Prix incomplet';
  }

  return formatCurrency(event.expenseAmount ?? 0);
}

export function getTemplateStockLabel(
  item: InputDayTemplateItemSummary,
  inputDayResponse: InputDayResponse | null,
): string {
  if (isConvertedTemplateItem(item, inputDayResponse)) {
    return 'Converti';
  }

  return item.stockAvailability.enoughStock ? 'Stock OK' : 'Low stock';
}

export function getTemplateSlotLabel(
  item: InputDayTemplateItemSummary,
  inputDayResponse: InputDayResponse | null,
  slotCatalog: Slot[],
): string {
  const slot = inputDayResponse
    ? findSlotForEntry(item, resolveDaySlots(inputDayResponse, slotCatalog))
    : null;
  if (slot) {
    return `${slot.title} - ${formatSlotRange(slot)}`;
  }

  const slotKey = item.slotKey?.trim();
  return slotKey ? `Slot ${slotKey}` : 'Unassigned to a slot';
}

export function canConvertTemplateItem(
  item: InputDayTemplateItemSummary,
  inputDayResponse: InputDayResponse | null,
): boolean {
  return (
    !isConvertedTemplateItem(item, inputDayResponse) &&
    item.status === 'pending' &&
    getTemplateInventoryId(item) !== null
  );
}

export function isConvertedTemplateItem(
  item: InputDayTemplateItemSummary,
  inputDayResponse: InputDayResponse | null,
): boolean {
  return item.status === 'converted' || getConvertedItemId(item, inputDayResponse) !== null;
}

export function getTemplateInventoryId(
  item: InputDayTemplateItemSummary,
): number | null {
  if (!item.stockAvailability.enoughStock) {
    return null;
  }

  return (
    item.stockByInventory.find((stock) => stock.enoughStock)?.inventoryId ?? null
  );
}

export function getConvertedItemId(
  item: InputDayTemplateItemSummary,
  inputDayResponse: InputDayResponse | null,
): number | null {
  if (item.convertedItemId !== null) {
    return item.convertedItemId;
  }

  return (
    inputDayResponse?.items.find((enteredItem) => enteredItem.templateItemId === item.id)
      ?.id ?? null
  );
}

export function resolveDaySlots(
  inputDayResponse: InputDayResponse,
  slotCatalog: Slot[],
): InputDayDaySetSlotSummary[] {
  return mergeSlots(
    inputDayResponse.daySet?.slots ?? [],
    inputDayResponse.slots ?? [],
    resolveTemplateCatalogSlots(inputDayResponse, slotCatalog),
  );
}

function buildScheduleRow(
  slot: InputDayDaySetSlotSummary,
  inputDayResponse: InputDayResponse,
  slots: InputDayDaySetSlotSummary[],
): HomeScheduleRow {
  const key = getSlotKey(slot);
  return {
    key,
    title: slot.title,
    rangeLabel: formatSlotRange(slot),
    items: inputDayResponse.items.filter((item) =>
      doesEntryMatchSlot(item, key, slots),
    ),
    plannedItems: (inputDayResponse.templateItems ?? []).filter((item) =>
      doesEntryMatchSlot(item, key, slots),
    ),
  };
}

function doesEntryMatchSlot(
  entry: SlotLinkedEntity,
  slotKey: string,
  slots: InputDayDaySetSlotSummary[],
): boolean {
  const slot = findSlotForEntry(entry, slots);
  return slot ? getSlotKey(slot) === slotKey : false;
}

function findSlotForEntry(
  entry: SlotLinkedEntity,
  slots: InputDayDaySetSlotSummary[],
): InputDayDaySetSlotSummary | null {
  return (
    slots.find((slot) => {
      if (entry.slotId !== null && entry.slotId === slot.slotId) {
        return true;
      }

      return entry.slotKey != null && entry.slotKey === slot.slotKey;
    }) ?? null
  );
}

function getItemSlotLabel(
  item: InputDayItemSummary,
  slots: InputDayDaySetSlotSummary[],
): string {
  const slot = findSlotForEntry(item, slots);
  if (slot) {
    return `${slot.title} - ${formatSlotRange(slot)}`;
  }

  const slotKey = item.slotKey?.trim();
  return slotKey ? `Slot ${slotKey}` : 'Unassigned to a slot';
}

function getExternalEntrySlotLabel(
  entry: ExternalMealEntrySummary,
  slots: InputDayDaySetSlotSummary[],
): string {
  const slot = findSlotForEntry(entry, slots);
  if (slot) {
    return `${slot.title} - ${formatSlotRange(slot)}`;
  }

  const slotKey = entry.slotKey?.trim();
  return slotKey ? `Slot ${slotKey}` : 'Unassigned to a slot';
}

function formatExternalEntryMacros(entry: ExternalMealEntrySummary): string {
  const macros = entry.nutritionValue;
  return `${roundNumber(macros.energyKcal)} kcal - P ${roundNumber(macros.proteins)} - G ${roundNumber(macros.carbs)} - L ${roundNumber(macros.lipids)}`;
}

function getExternalPaymentLabel(entry: ExternalMealEntrySummary): string {
  if (entry.paymentStatus === 'free') {
    return 'Free';
  }

  if (entry.paymentStatus === 'refunded') {
    return 'Refunded';
  }

  return formatCurrency(entry.priceAmount ?? 0);
}

function resolveItemTimestamp(item: InputDayItemSummary): string {
  return item.occurredAt?.trim() || item.insertedAt?.trim() || '';
}

function resolveTemplateCatalogSlots(
  inputDayResponse: InputDayResponse,
  slotCatalog: Slot[],
): InputDayDaySetSlotSummary[] {
  const referencedIds = new Set(
    (inputDayResponse.templateItems ?? [])
      .map((item) => item.slotId)
      .filter((slotId): slotId is number => typeof slotId === 'number'),
  );
  const referencedKeys = new Set(
    (inputDayResponse.templateItems ?? [])
      .map((item) => item.slotKey?.trim() ?? '')
      .filter((slotKey) => slotKey !== ''),
  );

  return slotCatalog
    .filter((slot) => referencedIds.has(slot.id) || referencedKeys.has(slot.key))
    .map((slot) => ({
      slotId: slot.id,
      slotKey: slot.key,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
      nutritionValue: null,
    }));
}

function mergeSlots(
  ...slotGroups: InputDayDaySetSlotSummary[][]
): InputDayDaySetSlotSummary[] {
  const uniqueSlots = new Map<string, InputDayDaySetSlotSummary>();

  slotGroups.flat().forEach((slot) => {
    const key = slot.slotId === null ? `key:${slot.slotKey}` : `id:${slot.slotId}`;
    if (!uniqueSlots.has(key)) {
      uniqueSlots.set(key, slot);
    }
  });

  return [...uniqueSlots.values()].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, 'fr'),
  );
}

function getSlotKey(slot: InputDayDaySetSlotSummary): string {
  return slot.slotId === null ? `key-${slot.slotKey}` : `slot-${slot.slotId}`;
}

function formatSlotRange(slot: InputDayDaySetSlotSummary): string {
  return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
}

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatMetricValue(
  value: InputDayMacroValue | number | null | undefined,
  unit: string,
  showSign = false,
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const formatted = roundNumber(Math.abs(value));
    let sign = '';
    if (showSign && value > 0) {
      sign = '+';
    } else if (showSign && value < 0) {
      sign = '-';
    }
    return `${sign}${formatted} ${unit}`.trim();
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return '-';
}

function getMacroProgress(
  actual: InputDayMacroValue | undefined,
  target: number | null | undefined,
): number {
  if (!isFiniteNumber(actual) || !isFiniteNumber(target) || target <= 0) {
    return 0;
  }

  return Math.max(4, Math.min(100, Math.round((actual / target) * 100)));
}

function getMacroStatus(
  actual: InputDayMacroValue | undefined,
  target: number | null | undefined,
): HomeMacroStatus {
  if (!isFiniteNumber(actual) || !isFiniteNumber(target) || target <= 0) {
    return 'neutral';
  }

  const ratio = actual / target;
  if (ratio > 1.05) {
    return 'over';
  }

  if (ratio >= 0.95) {
    return 'exact';
  }

  return 'under';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function roundNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}
