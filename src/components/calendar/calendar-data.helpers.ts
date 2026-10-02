import { getTemplateInventoryIds } from '../../utils/template-stock';
import { DateTime } from 'luxon';
import {
  CalendarDaySlot,
  CalendarInsertedProduct,
} from '../../interfaces/calendar.interface';
import {
  InputDayDaySetSlotSummary,
  InputDayItemSummary,
  InputDayItemsBySlotEntry,
  InputDayResponse,
  InputDaySlotSummary,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';
import { Slot } from '../../interfaces/slot.interface';
import {
  CalendarPlannedTemplateItem,
  CalendarSlotInfo,
  CalendarSlotWindow,
  CalendarWeekTimelineBlock,
} from './calendar.models';
import {
  formatCalendarCompactNumber,
  normalizeCalendarTimezone,
} from './calendar-format.helpers';

export function resolveCalendarDaySetSlots(
  response: InputDayResponse | null,
): CalendarDaySlot[] {
  const daySetSlots = response?.daySet?.slots ?? [];
  const totalsSlots =
    response?.totalsMacros?.bySlot.map((entry) => entry.slot) ?? [];

  return toCalendarDaySlots(mergeCalendarSlots(daySetSlots, totalsSlots));
}

export function resolveCalendarTemplateSlots(
  response: InputDayResponse | null,
  slotCatalog: Slot[],
): CalendarDaySlot[] {
  return toCalendarDaySlots(resolveCalendarTemplateCatalogSlots(response, slotCatalog));
}

export function resolveCalendarDaySlots(
  response: InputDayResponse | null,
  slotCatalog: Slot[],
): CalendarDaySlot[] {
  const daySetSlots = response?.daySet?.slots ?? [];
  const totalsSlots =
    response?.totalsMacros?.bySlot.map((entry) => entry.slot) ?? [];
  const legacySlots = response?.slots ?? [];
  const templateSlots = resolveCalendarTemplateCatalogSlots(
    response,
    slotCatalog,
  );

  return toCalendarDaySlots(
    mergeCalendarSlots(daySetSlots, totalsSlots, legacySlots, templateSlots),
  );
}

export function resolveCalendarItemsBySlotEntries(
  response: InputDayResponse | null,
  fallbackEntries: InputDayItemsBySlotEntry[],
  slots: CalendarDaySlot[],
  timezone: string,
): InputDayItemsBySlotEntry[] {
  if (response?.itemsBySlot && response.itemsBySlot.length > 0) {
    return response.itemsBySlot;
  }

  if (fallbackEntries.length > 0) {
    return fallbackEntries;
  }

  return buildCalendarItemsBySlotEntriesFromResponse(response, slots, timezone);
}

export function buildCalendarItemsBySlotEntriesFromResponse(
  response: InputDayResponse | null,
  slots: CalendarDaySlot[],
  timezone: string,
): InputDayItemsBySlotEntry[] {
  if (!response || response.items.length === 0 || slots.length === 0) {
    return [];
  }

  const entries: InputDayItemsBySlotEntry[] = slots.map((slot) => ({
    slot: toCalendarSlotSummary(slot),
    items: [],
  }));
  const entryByKey = new Map(
    entries.map((entry) => [entry.slot.slotKey, entry]),
  );

  response.items.forEach((item) => {
    const matchedSlot = resolveCalendarSlotForItem(item, slots, timezone);
    if (matchedSlot) {
      entryByKey.get(matchedSlot.slotKey)?.items.push(item);
    }
  });

  return entries;
}

export function toCalendarSlotSummary(
  slot: CalendarDaySlot,
): InputDaySlotSummary {
  return {
    slotId: slot.slotId,
    slotKey: slot.slotKey,
    title: slot.title,
    sortOrder: slot.sortOrder,
    startTime: slot.startTime ?? null,
    endTime: slot.endTime ?? null,
  };
}

export function resolveCalendarSlotForItem(
  item: InputDayItemSummary,
  slots: CalendarDaySlot[],
  timezone: string,
): CalendarDaySlot | null {
  if (item.slotId !== null) {
    const matchedById = slots.find((slot) => slot.slotId === item.slotId);
    if (matchedById) {
      return matchedById;
    }
  }

  const trimmedSlotKey = item.slotKey?.trim() ?? '';
  if (trimmedSlotKey !== '') {
    const matchedByKey = slots.find((slot) => slot.slotKey === trimmedSlotKey);
    if (matchedByKey) {
      return matchedByKey;
    }
  }

  return resolveCalendarSlotForTimestamp(
    resolveCalendarItemTimestamp(item),
    slots,
    timezone,
  );
}

export function resolveCalendarSlotForTimestamp(
  timestamp: string | null,
  slots: CalendarDaySlot[],
  timezone: string,
): CalendarDaySlot | null {
  if (!timestamp) {
    return null;
  }

  const parsed = DateTime.fromISO(timestamp, { setZone: true });
  if (!parsed.isValid) {
    return null;
  }

  const localized = parsed.setZone(normalizeCalendarTimezone(timezone));
  const secondsFromMidnight =
    localized.hour * 3600 + localized.minute * 60 + localized.second;

  return (
    slots.find((slot) =>
      isCalendarTimeInSlotWindow(
        secondsFromMidnight,
        slot.startTime ?? null,
        slot.endTime ?? null,
      ),
    ) ?? null
  );
}

export function isCalendarTimeInSlotWindow(
  secondsFromMidnight: number,
  startTime: string | null,
  endTime: string | null,
): boolean {
  if (!startTime || !endTime) {
    return false;
  }

  const startSeconds = parseCalendarTimeToSeconds(startTime);
  const endSeconds = parseCalendarTimeToSeconds(endTime);
  if (startSeconds === null || endSeconds === null) {
    return false;
  }

  if (startSeconds === endSeconds) {
    return true;
  }

  if (startSeconds < endSeconds) {
    return secondsFromMidnight >= startSeconds && secondsFromMidnight < endSeconds;
  }

  return secondsFromMidnight >= startSeconds || secondsFromMidnight < endSeconds;
}

export function parseCalendarTimeToSeconds(value: string): number | null {
  const parts = value.split(':');
  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number((parts[2] ?? '0').split('.')[0]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

export function isCalendarSlotOverlappingHour(
  slot: CalendarDaySlot,
  hourStart: number,
  hourEnd: number,
): boolean {
  const start = toCalendarMinutes(slot.startTime);
  const end = toCalendarMinutes(slot.endTime);

  if (start === null && end === null) {
    return false;
  }

  const startMinutes = start ?? 0;
  const endMinutes = end ?? 24 * 60;
  if (endMinutes === startMinutes) return true;
  if (endMinutes < startMinutes) {
    return startMinutes < hourEnd || endMinutes > hourStart;
  }

  return startMinutes < hourEnd && endMinutes > hourStart;
}

export function toCalendarMinutes(
  time: string | null | undefined,
): number | null {
  if (!time) {
    return null;
  }

  const parts = time.split(':');
  if (parts.length < 2) {
    return null;
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

export function buildCalendarInsertedProductsByHour(
  entries: InputDayItemsBySlotEntry[],
  responseItems: InputDayItemSummary[],
  dateLocal: string,
  slots: CalendarDaySlot[],
  timezone: string,
): Map<number, CalendarInsertedProduct[]> {
  const items = buildCalendarInsertedProducts(
    entries,
    responseItems,
    dateLocal,
    slots,
    timezone,
  );
  const byHour = new Map<number, CalendarInsertedProduct[]>();

  items.forEach((item) => {
    const minute = resolveCalendarInsertedProductMinute(item, timezone);
    if (minute === null) {
      return;
    }

    const hour = Math.floor(minute / 60);
    const products = byHour.get(hour) ?? [];
    products.push(item);
    byHour.set(hour, products);
  });

  return byHour;
}

export function buildCalendarInsertedProducts(
  entries: InputDayItemsBySlotEntry[],
  responseItems: InputDayItemSummary[],
  dateLocal: string,
  slots: CalendarDaySlot[],
  timezone: string,
): CalendarInsertedProduct[] {
  const items =
    responseItems.length > 0
      ? responseItems
      : entries.flatMap((entry) => entry.items);
  const slotByItemId = new Map<number, CalendarSlotInfo>();

  entries.forEach((entry) => {
    entry.items.forEach((item) => {
      slotByItemId.set(item.id, {
        slotTitle: entry.slot.title,
        slotKey: entry.slot.slotKey,
      });
    });
  });

  return items
    .flatMap((item) =>
      buildCalendarInsertedProduct(
        item,
        dateLocal,
        slots,
        slotByItemId,
        timezone,
      ),
    )
    .sort((left, right) => compareCalendarInsertedProducts(left, right, timezone));
}

export function buildCalendarWeekTimelineBlocks(
  dateLocal: string,
  slots: CalendarDaySlot[],
  insertedProducts: CalendarInsertedProduct[],
  plannedItems: CalendarPlannedTemplateItem[] = [],
  timezone = 'UTC',
): CalendarWeekTimelineBlock[] {
  const blocks: CalendarWeekTimelineBlock[] = [];
  const slotKeys = new Set(slots.map((slot) => slot.slotKey));
  const productsBySlotKey = groupCalendarItemsBySlotKey(
    insertedProducts,
    slotKeys,
  );
  const plannedItemsBySlotKey = groupCalendarItemsBySlotKey(
    plannedItems,
    slotKeys,
  );

  slots.forEach((slot, index) => {
    const slotBlocks = buildCalendarWeekTimelineSlotBlocks(
      dateLocal,
      slot,
      productsBySlotKey.get(slot.slotKey) ?? [],
      plannedItemsBySlotKey.get(slot.slotKey) ?? [],
      index,
      slots.length,
      timezone,
    );

    blocks.push(...slotBlocks);
  });

  return blocks
    .concat(
      buildCalendarOrphanTimelineBlocks(
        dateLocal,
        insertedProducts.filter((product) => !slotKeys.has(product.slotKey)),
        plannedItems.filter((item) => !slotKeys.has(item.slotKey)),
        timezone,
      ),
    )
    .sort(compareCalendarTimelineBlocks);
}

export function resolvePendingCalendarTemplateItems(
  response: InputDayResponse | null,
  slots: CalendarDaySlot[],
): CalendarPlannedTemplateItem[] {
  if (!response) {
    return [];
  }

  const enteredTemplateItemIds = new Set(
    response.items
      .map((item) => item.templateItemId)
      .filter(
        (templateItemId): templateItemId is number =>
          typeof templateItemId === 'number' && templateItemId > 0,
      ),
  );

  return (response.templateItems ?? []).flatMap((item) => {
    if (
      item.status !== 'pending' ||
      item.convertedItemId !== null ||
      enteredTemplateItemIds.has(item.id)
    ) {
      return [];
    }

    const slot = resolveCalendarSlotForTemplateItem(item, slots);
    const preferredMinute = resolveCalendarTemplatePreferredMinute(
      item.preferredTime,
    );
    const unitLabel = item.qtyUnit ? ' ' + item.qtyUnit : '';
    const inventoryIds = getTemplateInventoryIds(item);
    const availableStock = item.stockByInventory.filter((stock) => inventoryIds.includes(stock.inventoryId));

    return [
      {
        id: item.id,
        productName: item.productName,
        qtyLabel: formatCalendarCompactNumber(item.qty, 2) + unitLabel,
        slotKey: slot?.slotKey ?? '',
        preferredMinute,
        stockAvailable: inventoryIds.length > 0,
        stockLabel: inventoryIds.length > 0
          ? `Disponible dans ${availableStock.map((stock) => stock.inventoryName).join(', ')}`
          : 'Low stock',
        inventoryId: inventoryIds[0] ?? null,
        inventoryIds,
      },
    ];
  });
}

export function resolveCalendarTemplatePreferredMinute(
  value: string | null | undefined,
): number {
  return toCalendarMinutes(value?.trim() || '06:00:00') ?? 6 * 60;
}

export function resolveCalendarSlotForTemplateItem(
  item: InputDayTemplateItemSummary,
  slots: CalendarDaySlot[],
): CalendarDaySlot | null {
  if (item.slotId !== null) {
    const slotById = slots.find((slot) => slot.slotId === item.slotId);
    if (slotById) {
      return slotById;
    }
  }

  const slotKey = item.slotKey?.trim();
  return slotKey
    ? (slots.find((slot) => slot.slotKey === slotKey) ?? null)
    : null;
}

export function normalizeCalendarTimelineEndMinute(
  startMinute: number,
  endMinute: number,
): number {
  return Math.max(startMinute + 30, Math.min(24 * 60, endMinute));
}

export function formatCalendarMinutesClock(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function resolveCalendarInsertedProductMinute(
  product: CalendarInsertedProduct,
  timezone: string,
): number | null {
  const parsed = DateTime.fromISO(
    product.occurredAt?.trim() || product.insertedAt,
    { setZone: true },
  );
  if (!parsed.isValid) {
    return null;
  }

  const localized = parsed.setZone(normalizeCalendarTimezone(timezone));
  return localized.hour * 60 + localized.minute;
}

export function resolveCalendarItemTimestamp(
  item: InputDayItemSummary,
): string | null {
  const occurredAt = item.occurredAt?.trim();
  return occurredAt || item.insertedAt?.trim() || null;
}

export function resolveCalendarSlotInfo(
  slot: CalendarDaySlot | null,
  item: InputDayItemSummary,
): CalendarSlotInfo | null {
  if (slot) {
    return {
      slotTitle: slot.title,
      slotKey: slot.slotKey,
    };
  }

  const slotKey = item.slotKey?.trim();
  return slotKey ? { slotTitle: slotKey, slotKey } : null;
}

function resolveCalendarTemplateCatalogSlots(
  response: InputDayResponse | null,
  slotCatalog: Slot[],
): InputDayDaySetSlotSummary[] {
  const referencedSlotIds = new Set(
    (response?.templateItems ?? [])
      .map((item) => item.slotId)
      .filter(
        (slotId): slotId is number => typeof slotId === 'number' && slotId > 0,
      ),
  );
  const referencedSlotKeys = new Set(
    (response?.templateItems ?? [])
      .map((item) => item.slotKey?.trim() ?? '')
      .filter((slotKey) => slotKey !== ''),
  );

  return slotCatalog
    .filter(
      (slot) =>
        referencedSlotIds.has(slot.id) || referencedSlotKeys.has(slot.key),
    )
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

function mergeCalendarSlots(
  ...sources: InputDayDaySetSlotSummary[][]
): InputDayDaySetSlotSummary[] {
  const unique = new Map<string, InputDayDaySetSlotSummary>();

  sources.forEach((slots) => {
    slots.forEach((slot) => {
      const key =
        slot.slotId === null ? `key:${slot.slotKey}` : `id:${slot.slotId}`;
      if (!unique.has(key)) {
        unique.set(key, slot);
      }
    });
  });

  return Array.from(unique.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

function toCalendarDaySlots(
  slots: InputDayDaySetSlotSummary[],
): CalendarDaySlot[] {
  return slots.map((slot) => ({
    slotId: slot.slotId,
    slotKey: slot.slotKey,
    title: slot.title,
    sortOrder: slot.sortOrder,
    startTime: slot.startTime ?? null,
    endTime: slot.endTime ?? null,
  }));
}

function buildCalendarInsertedProduct(
  item: InputDayItemSummary,
  dateLocal: string,
  slots: CalendarDaySlot[],
  slotByItemId: Map<number, CalendarSlotInfo>,
  timezone: string,
): CalendarInsertedProduct[] {
  const timestamp = resolveCalendarItemTimestamp(item);
  if (!timestamp || !DateTime.fromISO(timestamp, { setZone: true }).isValid) {
    return [];
  }

  const slot =
    slotByItemId.get(item.id) ??
    resolveCalendarSlotInfo(
      resolveCalendarSlotForItem(item, slots, timezone),
      item,
    );

  return [
    {
      id: item.id,
      dateLocal,
      productId: item.productId,
      productName: item.productName,
      qty: item.qty,
      occurredAt: item.occurredAt,
      insertedAt: item.insertedAt,
      slotId: item.slotId,
      slotTitle: slot?.slotTitle ?? 'No slot',
      slotKey: slot?.slotKey ?? item.slotKey?.trim() ?? '-',
      templateItemId: item.templateItemId ?? null,
    },
  ];
}

function compareCalendarInsertedProducts(
  left: CalendarInsertedProduct,
  right: CalendarInsertedProduct,
  timezone: string,
): number {
  const leftMinute = resolveCalendarInsertedProductMinute(left, timezone);
  const rightMinute = resolveCalendarInsertedProductMinute(right, timezone);
  if (leftMinute !== null && rightMinute !== null && leftMinute !== rightMinute) {
    return leftMinute - rightMinute;
  }

  return left.id - right.id;
}

function groupCalendarItemsBySlotKey<T extends { slotKey: string }>(
  items: T[],
  slotKeys: Set<string>,
): Map<string, T[]> {
  const itemsBySlotKey = new Map<string, T[]>();
  items.forEach((item) => {
    if (!slotKeys.has(item.slotKey)) {
      return;
    }

    const slotItems = itemsBySlotKey.get(item.slotKey) ?? [];
    slotItems.push(item);
    itemsBySlotKey.set(item.slotKey, slotItems);
  });
  return itemsBySlotKey;
}

function buildCalendarWeekTimelineSlotBlocks(
  dateLocal: string,
  slot: CalendarDaySlot,
  items: CalendarInsertedProduct[],
  plannedItems: CalendarPlannedTemplateItem[],
  index: number,
  slotCount: number,
  timezone: string,
): CalendarWeekTimelineBlock[] {
  const windows = resolveCalendarTimelineSlotWindows(slot, index, slotCount);
  // An overnight slot has two visible parts. Each entry belongs to one part only.
  const windowIndex = (minute: number | null): number => {
    const match = windows.findIndex((window) => minute !== null &&
      minute >= window.startMinute && minute < window.endMinute);
    return match < 0 ? windows.length - 1 : match;
  };
  return windows.map(({ startMinute, endMinute, estimated }, part) => ({
    id: `slot:${dateLocal}:${slot.slotId ?? slot.slotKey}:${part}`,
    kind: 'slot',
    title: slot.title,
    slotKey: slot.slotKey,
    rangeLabel: formatCalendarTimelineSlotRange(startMinute, endMinute, estimated),
    startMinute,
    endMinute,
    items: items.filter((item) => windowIndex(resolveCalendarInsertedProductMinute(item, timezone)) === part),
    plannedItems: plannedItems.filter((item) => windowIndex(item.preferredMinute) === part),
    tone: index % 4,
  }));
}

function resolveCalendarTimelineSlotWindows(
  slot: CalendarDaySlot,
  index: number,
  slotCount: number,
): CalendarSlotWindow[] {
  const configuredStart = toCalendarMinutes(slot.startTime);
  const configuredEnd = toCalendarMinutes(slot.endTime);

  if (
    configuredStart !== null &&
    configuredEnd !== null
  ) {
    if (configuredEnd === configuredStart) {
      return [{ startMinute: 0, endMinute: 24 * 60, estimated: false }];
    }
    if (configuredEnd < configuredStart) {
      return [
        { startMinute: 0, endMinute: configuredEnd, estimated: false },
        { startMinute: configuredStart, endMinute: 24 * 60, estimated: false },
      ].filter((window) => window.endMinute > window.startMinute);
    }
    return [{ startMinute: configuredStart, endMinute: configuredEnd, estimated: false }];
  }

  if (configuredStart !== null) {
    return [{
      startMinute: configuredStart,
      endMinute: Math.min(24 * 60, configuredStart + 60),
      estimated: true,
    }];
  }

  if (configuredEnd !== null) {
    return [{
      startMinute: Math.max(0, configuredEnd - 120),
      endMinute: configuredEnd,
      estimated: true,
    }];
  }

  const firstFallbackMinute = 8 * 60;
  const lastFallbackMinute = 20 * 60;
  const rawFallbackStart =
    slotCount <= 1
      ? 12 * 60
      : firstFallbackMinute +
        (index * (lastFallbackMinute - firstFallbackMinute)) / (slotCount - 1);
  const fallbackStart = Math.round(rawFallbackStart / 30) * 30;

  return [{
    startMinute: fallbackStart,
    endMinute: Math.min(24 * 60, fallbackStart + 60),
    estimated: true,
  }];
}

function formatCalendarTimelineSlotRange(
  startMinute: number,
  endMinute: number,
  estimated: boolean,
): string {
  const range =
    formatCalendarMinutesClock(startMinute) +
    '-' +
    formatCalendarMinutesClock(endMinute);
  return estimated ? range + ' · estimated' : range;
}

function buildCalendarOrphanTimelineBlocks(
  dateLocal: string,
  orphanProducts: CalendarInsertedProduct[],
  orphanPlannedItems: CalendarPlannedTemplateItem[],
  timezone: string,
): CalendarWeekTimelineBlock[] {
  const orphanProductsByHour = groupCalendarOrphansByHour(
    orphanProducts,
    (product) => resolveCalendarInsertedProductMinute(product, timezone),
  );
  const orphanPlannedItemsByHour = groupCalendarOrphansByHour(
    orphanPlannedItems,
    (item) => item.preferredMinute,
  );
  const orphanStartMinutes = new Set([
    ...orphanProductsByHour.keys(),
    ...orphanPlannedItemsByHour.keys(),
  ]);

  return Array.from(orphanStartMinutes).map((startMinute) => {
    const products = orphanProductsByHour.get(startMinute) ?? [];
    const preferredItems = orphanPlannedItemsByHour.get(startMinute) ?? [];
    const endMinute = normalizeCalendarTimelineEndMinute(
      startMinute,
      Math.max(
        startMinute + 60,
        ...products.map(
          (product) =>
            (resolveCalendarInsertedProductMinute(product, timezone) ??
              startMinute) + 30,
        ),
        ...preferredItems.map((item) => item.preferredMinute + 30),
      ),
    );

    return {
      id: `orphan:${dateLocal}:${startMinute}`,
      kind: 'orphan',
      title: 'Unassigned slot',
      slotKey: null,
      rangeLabel: `${formatCalendarMinutesClock(startMinute)}-${formatCalendarMinutesClock(endMinute)}`,
      startMinute,
      endMinute,
      items: products,
      plannedItems: preferredItems,
      tone: 4,
    };
  });
}

function groupCalendarOrphansByHour<T>(
  items: T[],
  resolveMinute: (item: T) => number | null,
): Map<number, T[]> {
  const itemsByHour = new Map<number, T[]>();
  items.forEach((item) => {
    const minute = resolveMinute(item);
    const startMinute = minute === null ? 0 : Math.floor(minute / 60) * 60;
    const hourItems = itemsByHour.get(startMinute) ?? [];
    hourItems.push(item);
    itemsByHour.set(startMinute, hourItems);
  });
  return itemsByHour;
}

function compareCalendarTimelineBlocks(
  left: CalendarWeekTimelineBlock,
  right: CalendarWeekTimelineBlock,
): number {
  return (
    left.startMinute - right.startMinute ||
    left.endMinute - right.endMinute ||
    left.title.localeCompare(right.title, 'fr')
  );
}
