import type { Request, Route } from '@playwright/test';
import type { InputDayResponse } from '../src/interfaces/input-day.interface';
import { DateTime } from 'luxon';
import type {
  MockApiState,
  MockCategory,
  MockCycle,
  MockCycleAssignment,
  MockDaySet,
  MockGenericProduct,
  MockInputDayItem,
  MockInventory,
  MockInventoryProduct,
  MockNutritionValue,
  MockProduct,
  MockSlot,
  MockTag,
  MockTemplate,
  MockTemplateItem,
} from './state';

export type IdKey = keyof MockApiState['nextIds'];

export type MockApiRequestContext = {
  route: Route;
  request: Request;
  url: URL;
  path: string;
  state: MockApiState;
  nextId: (key: IdKey) => number;
  readJson: <T>() => Promise<T>;
  json: (body: unknown, status?: number) => Promise<void>;
  noContent: (status?: number) => Promise<void>;
  notFound: (message?: string) => Promise<void>;
};

export async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function fulfillNoContent(route: Route, status = 204): Promise<void> {
  await route.fulfill({ status, body: '' });
}

export function parseId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
}

export function parseQueryId(url: URL, key: string): number | null {
  return parseId(url.searchParams.get(key) ?? undefined);
}

export function readDateLocal(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return DateTime.fromISO(trimmed).isValid ? trimmed : null;
}

export function dateLocalPlus(dateLocal: string, days: number): string {
  return DateTime.fromISO(dateLocal).plus({ days }).toISODate() ?? dateLocal;
}

export function rangeDays(fromDateLocal: string, count: number): string[] {
  const start = DateTime.fromISO(fromDateLocal);
  return Array.from({ length: count }, (_, index) => start.plus({ days: index }).toISODate() ?? fromDateLocal);
}

export function listBetweenDates(fromDateLocal: string, toDateLocal: string): string[] {
  const from = DateTime.fromISO(fromDateLocal);
  const to = DateTime.fromISO(toDateLocal);
  const days = Math.max(0, Math.floor(to.diff(from, 'days').days));
  return rangeDays(fromDateLocal, days + 1);
}

export function sortByName<T extends { name: string }>(values: T[]): T[] {
  return [...values].sort((left, right) =>
    left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
  );
}

export function sortByTitle<T extends { title: string }>(values: T[]): T[] {
  return [...values].sort((left, right) =>
    left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
  );
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getCategory(state: MockApiState, id: number | null | undefined): MockCategory | null {
  return state.categories.find((category) => category.id === id) ?? null;
}

export function getTag(state: MockApiState, id: number | null | undefined): MockTag | null {
  return state.tags.find((tag) => tag.id === id) ?? null;
}

export function getGenericProduct(
  state: MockApiState,
  id: number | null | undefined,
): MockGenericProduct | null {
  return state.genericProducts.find((genericProduct) => genericProduct.id === id) ?? null;
}

export function getProduct(state: MockApiState, id: number | null | undefined): MockProduct | null {
  return state.products.find((product) => product.id === id) ?? null;
}

export function getSlot(state: MockApiState, id: number | null | undefined): MockSlot | null {
  return state.slots.find((slot) => slot.id === id) ?? null;
}

export function getDaySet(state: MockApiState, id: number | null | undefined): MockDaySet | null {
  return state.daySets.find((daySet) => daySet.id === id) ?? null;
}

export function getCycle(state: MockApiState, id: number | null | undefined): MockCycle | null {
  return state.cycles.find((cycle) => cycle.id === id) ?? null;
}

export function getTemplate(state: MockApiState, id: number | null | undefined): MockTemplate | null {
  return state.templates.find((template) => template.id === id) ?? null;
}

export function getInventory(
  state: MockApiState,
  id: number | null | undefined,
): MockInventory | null {
  return state.inventories.find((inventory) => inventory.id === id) ?? null;
}

export function getInventoryProducts(
  state: MockApiState,
  inventoryId: number,
): MockInventoryProduct[] {
  return state.inventoryProducts.filter((inventoryProduct) => inventoryProduct.inventoryId === inventoryId);
}

export function hydrateCategory(category: MockCategory): MockCategory {
  return { ...category };
}

export function hydrateTag(tag: MockTag): MockTag {
  return { ...tag };
}

export function hydrateGenericProduct(genericProduct: MockGenericProduct): MockGenericProduct {
  return { ...genericProduct };
}

export function hydrateNutritionValue(value: MockNutritionValue): MockNutritionValue {
  return { ...value };
}

export function macrosFromCycleNutritionValues(
  values: Array<{ nutritionKey: string; amount: number }>,
): { proteins: number; carbs: number; lipids: number } {
  return values.reduce(
    (totals, value) => {
      const key = value.nutritionKey.toUpperCase();
      if (key === 'PROTEIN') {
        totals.proteins += value.amount;
      } else if (key === 'CARBOHYDRATE') {
        totals.carbs += value.amount;
      } else if (key === 'FAT') {
        totals.lipids += value.amount;
      }
      return totals;
    },
    { proteins: 0, carbs: 0, lipids: 0 },
  );
}

export function hydrateProduct(state: MockApiState, product: MockProduct): Record<string, unknown> {
  return {
    ...product,
    category: getCategory(state, product.categoryId),
    tags: product.tagIds
      .map((tagId) => getTag(state, tagId))
      .filter((tag): tag is MockTag => tag !== null)
      .map(hydrateTag),
    genericProduct: getGenericProduct(state, product.genericProductId),
    nutritionValues: product.nutritionValues.map(hydrateNutritionValue),
  };
}

export function hydrateSlot(slot: MockSlot): MockSlot {
  return {
    ...slot,
    nutritionValues: slot.nutritionValues.map((value) => ({ ...value })),
  };
}

export function buildDaySetNutritionRecord(daySet: MockDaySet | null): Record<string, number> | null {
  if (!daySet || daySet.nutritionValues.length === 0) {
    return null;
  }

  return macrosFromCycleNutritionValues(daySet.nutritionValues);
}

export function hydrateDaySet(state: MockApiState, daySet: MockDaySet): Record<string, unknown> {
  const template = getTemplate(state, daySet.templateId);
  return {
    ...daySet,
    nutritionValues: daySet.nutritionValues.map((value) => ({ ...value })),
    slots: daySet.slotIds
      .map((slotId) => getSlot(state, slotId))
      .filter((slot): slot is MockSlot => slot !== null)
      .map(hydrateSlot),
    template: template ? { id: template.id, title: template.title } : null,
  };
}

export function hydrateCycle(state: MockApiState, cycle: MockCycle): Record<string, unknown> {
  const daySetIds = cycle.daySetOrder.filter((daySetId) => Number.isInteger(daySetId) && daySetId > 0);

  return {
    ...cycle,
    proteins: macrosFromCycleNutritionValues(cycle.nutritionValues).proteins,
    carbs: macrosFromCycleNutritionValues(cycle.nutritionValues).carbs,
    lipids: macrosFromCycleNutritionValues(cycle.nutritionValues).lipids,
    nutritionValues: cycle.nutritionValues.map((value) => ({ ...value })),
    daySets: daySetIds
      .map((daySetId) => getDaySet(state, daySetId))
      .filter((daySet): daySet is MockDaySet => daySet !== null)
      .map((daySet) => hydrateDaySet(state, daySet)),
  };
}

export function hydrateInventory(state: MockApiState, inventory: MockInventory): Record<string, unknown> {
  const inventoryProducts = getInventoryProducts(state, inventory.id);
  return {
    ...inventory,
    productCount: inventoryProducts.length,
    inventoryProducts: inventoryProducts.map((inventoryProduct) =>
      hydrateInventoryProduct(state, inventoryProduct),
    ),
  };
}

export function hydrateInventoryProduct(
  state: MockApiState,
  inventoryProduct: MockInventoryProduct,
): Record<string, unknown> {
  return {
    ...inventoryProduct,
    product: getProduct(state, inventoryProduct.productId)
      ? hydrateProduct(state, getProduct(state, inventoryProduct.productId) as MockProduct)
      : null,
  };
}

export function getActiveAssignmentForDate(
  state: MockApiState,
  dateLocal: string,
): { assignment: MockCycleAssignment; cycle: MockCycle; dayIndex: number; endDateLocal: string } | null {
  const sortedAssignments = [...state.cycleAssignments].sort((left, right) =>
    left.startDateLocal.localeCompare(right.startDateLocal),
  );

  for (let index = 0; index < sortedAssignments.length; index += 1) {
    const assignment = sortedAssignments[index];
    const nextAssignment = sortedAssignments[index + 1] ?? null;
    const cycle = getCycle(state, assignment.cycleId);
    if (!cycle) {
      continue;
    }

    const start = DateTime.fromISO(assignment.startDateLocal);
    const end = nextAssignment
      ? DateTime.fromISO(nextAssignment.startDateLocal).minus({ days: 1 })
      : start.plus({ days: 365 });
    const current = DateTime.fromISO(dateLocal);
    if (current < start || current > end) {
      continue;
    }

    const diffDays = Math.max(0, Math.floor(current.diff(start, 'days').days));
    const dayIndex = cycle.durationDays > 0 ? (diffDays % cycle.durationDays) + 1 : 1;

    return {
      assignment,
      cycle,
      dayIndex,
      endDateLocal: end.toISODate() ?? assignment.startDateLocal,
    };
  }

  return null;
}

export function getDaySetForDate(state: MockApiState, dateLocal: string): MockDaySet | null {
  const activeAssignment = getActiveAssignmentForDate(state, dateLocal);
  if (!activeAssignment) {
    return null;
  }

  const daySetId = activeAssignment.cycle.daySetOrder[activeAssignment.dayIndex - 1] ?? 0;
  return getDaySet(state, daySetId);
}

export function getTemplateForDate(
  state: MockApiState,
  dateLocal: string,
): { template: MockTemplate | null; source: 'manual' | 'daySet' | 'cycle' | null } {
  const manualTemplateId = state.manualTemplateOverrides[dateLocal];
  if (manualTemplateId === null) {
    return { template: null, source: null };
  }

  if (typeof manualTemplateId === 'number') {
    return { template: getTemplate(state, manualTemplateId), source: 'manual' };
  }

  const activeAssignment = getActiveAssignmentForDate(state, dateLocal);
  if (!activeAssignment) {
    return { template: null, source: null };
  }

  const daySetId = activeAssignment.cycle.daySetOrder[activeAssignment.dayIndex - 1] ?? 0;
  const daySet = getDaySet(state, daySetId);
  if (daySet?.templateId != null) {
    return { template: getTemplate(state, daySet.templateId), source: 'daySet' };
  }

  if (daySetId <= 0 && activeAssignment.cycle.defaultTemplateId != null) {
    return {
      template: getTemplate(state, activeAssignment.cycle.defaultTemplateId),
      source: 'cycle',
    };
  }

  return { template: null, source: null };
}

export function hydrateCycleAssignment(
  state: MockApiState,
  assignment: MockCycleAssignment,
): Record<string, unknown> | null {
  const cycle = getCycle(state, assignment.cycleId);
  if (!cycle) {
    return null;
  }

  const sortedAssignments = [...state.cycleAssignments].sort((left, right) =>
    left.startDateLocal.localeCompare(right.startDateLocal),
  );
  const currentIndex = sortedAssignments.findIndex((entry) => entry.id === assignment.id);
  const nextAssignment = currentIndex >= 0 ? sortedAssignments[currentIndex + 1] ?? null : null;
  const endDateLocal = nextAssignment
    ? DateTime.fromISO(nextAssignment.startDateLocal).minus({ days: 1 }).toISODate()
    : dateLocalPlus(assignment.startDateLocal, 365);

  return {
    id: assignment.id,
    cycle: hydrateCycle(state, cycle),
    startDateLocal: assignment.startDateLocal,
    endDateLocal,
  };
}

export function nutritionMetricKey(key: string): 'energyKcal' | 'proteins' | 'carbs' | 'lipids' | null {
  const normalized = key.toUpperCase();
  if (normalized === 'ENERGY_KCAL') {
    return 'energyKcal';
  }
  if (normalized === 'PROTEIN') {
    return 'proteins';
  }
  if (normalized === 'CARBOHYDRATE') {
    return 'carbs';
  }
  if (normalized === 'FAT') {
    return 'lipids';
  }

  return null;
}

export function sumNutrition(values: Array<Record<string, number>>): Record<string, number> {
  return values.reduce<Record<string, number>>((totals, entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      totals[key] = round((totals[key] ?? 0) + value);
    });
    return totals;
  }, {});
}

export function subtractNutrition(
  left: Record<string, number> | null,
  right: Record<string, number> | null,
): Record<string, number> | null {
  if (!left && !right) {
    return null;
  }

  const keys = new Set<string>([...Object.keys(left ?? {}), ...Object.keys(right ?? {})]);
  const delta: Record<string, number> = {};
  keys.forEach((key) => {
    delta[key] = round((left?.[key] ?? 0) - (right?.[key] ?? 0));
  });
  return delta;
}

export function normalizeProductQuantity(product: MockProduct, qty: number, qtyUnit: string | null): number {
  const normalizedUnit = (qtyUnit ?? 'unit').toLowerCase();

  if (normalizedUnit === 'mg') {
    return qty / 1000;
  }
  if (normalizedUnit === 'g') {
    return qty;
  }
  if (normalizedUnit === 'kg') {
    return qty * 1000;
  }
  if (normalizedUnit === 'ml') {
    return qty;
  }
  if (normalizedUnit === 'l') {
    return qty * 1000;
  }
  if (
    normalizedUnit === 'tranche' ||
    normalizedUnit === 'piece' ||
    normalizedUnit === 'part' ||
    normalizedUnit === 'bouteille' ||
    normalizedUnit === 'portion'
  ) {
    return qty * (product.portionQuantityNormalized ?? product.quantityPerUnit ?? 1);
  }

  return qty * (product.quantityPerUnit ?? 1);
}

export function normalizedToProductUnits(product: MockProduct, qtyNormalized: number): number {
  const divisor = product.quantityPerUnit || 1;
  return round(qtyNormalized / divisor);
}

export function nutritionForProduct(
  product: MockProduct,
  qtyNormalized: number,
): Record<string, number> {
  return product.nutritionValues.reduce<Record<string, number>>((totals, value) => {
    const metricKey = nutritionMetricKey(value.nutritionKey);
    if (!metricKey) {
      return totals;
    }

    totals[metricKey] = round((totals[metricKey] ?? 0) + (value.amount * qtyNormalized) / 100);
    return totals;
  }, {});
}

export function stockByInventory(
  state: MockApiState,
  productId: number,
  requestedQtyNormalized: number,
): Array<{ inventoryId: number; inventoryName: string; qtyAvailableNormalized: number; enoughStock: boolean }> {
  return state.inventories.map((inventory) => {
    const stock =
      state.inventoryProducts.find(
        (inventoryProduct) =>
          inventoryProduct.inventoryId === inventory.id && inventoryProduct.productId === productId,
      ) ?? null;

    const qtyAvailableNormalized = stock?.qtyOnHandNormalized ?? 0;
    return {
      inventoryId: inventory.id,
      inventoryName: inventory.name,
      qtyAvailableNormalized,
      enoughStock: qtyAvailableNormalized >= requestedQtyNormalized,
    };
  });
}

export function stockAvailability(state: MockApiState, productId: number, requestedQtyNormalized: number): {
  enoughStock: boolean;
  totalAvailableNormalized: number;
  requestedQtyNormalized: number;
} {
  const byInventory = stockByInventory(state, productId, requestedQtyNormalized);
  const totalAvailableNormalized = round(
    byInventory.reduce((sum, entry) => sum + entry.qtyAvailableNormalized, 0),
  );
  return {
    enoughStock: totalAvailableNormalized >= requestedQtyNormalized,
    totalAvailableNormalized,
    requestedQtyNormalized,
  };
}

export function buildTemplateResponse(
  state: MockApiState,
  template: MockTemplate,
  compareDaySetId: number | null = null,
): Record<string, unknown> {
  const items = template.items.map((item) => {
    const product = getProduct(state, item.productId);
    const qtyNormalized = product ? normalizeProductQuantity(product, item.qty, item.qtyUnit) : 0;
    return {
      id: item.id,
      productId: item.productId,
      productName: product?.name ?? `Produit #${item.productId}`,
      qty: item.qty,
      qtyUnit: item.qtyUnit,
      qtyNormalized,
      slotId: item.slotId,
      slotKey: item.slotKey,
      nutritionValue: product ? nutritionForProduct(product, qtyNormalized) : {},
      stockAvailability: stockAvailability(state, item.productId, qtyNormalized),
      stockByInventory: stockByInventory(state, item.productId, qtyNormalized),
      status: 'pending',
      convertedItemId: null,
    };
  });

  const comparisonDaySet = compareDaySetId ? getDaySet(state, compareDaySetId) : null;
  const dayTotal = sumNutrition(items.map((item) => item.nutritionValue as Record<string, number>));
  const targets = comparisonDaySet ? buildDaySetNutritionRecord(comparisonDaySet) : null;

  return {
    id: template.id,
    title: template.title,
    items,
    comparisonDaySet: comparisonDaySet
      ? {
          id: comparisonDaySet.id,
          title: comparisonDaySet.title,
          nutritionValue: buildDaySetNutritionRecord(comparisonDaySet),
          slots: comparisonDaySet.slotIds
            .map((slotId) => getSlot(state, slotId))
            .filter((slot): slot is MockSlot => slot !== null)
            .map((slot) => ({
              slotId: slot.id,
              slotKey: slot.key,
              title: slot.title,
              sortOrder: slot.sortOrder,
              startTime: slot.startTime,
              endTime: slot.endTime,
              nutritionValue: macrosFromCycleNutritionValues(slot.nutritionValues),
            })),
        }
      : null,
    totalsMacros: {
      bySlot: comparisonDaySet
        ? comparisonDaySet.slotIds
            .map((slotId) => getSlot(state, slotId))
            .filter((slot): slot is MockSlot => slot !== null)
            .map((slot) => ({
              slot: {
                slotId: slot.id,
                slotKey: slot.key,
                title: slot.title,
                sortOrder: slot.sortOrder,
                startTime: slot.startTime,
                endTime: slot.endTime,
              },
              ...macrosFromCycleNutritionValues(slot.nutritionValues),
              targets: macrosFromCycleNutritionValues(slot.nutritionValues),
              deltaToTargets: { proteins: 0, carbs: 0, lipids: 0 },
              incompleteNutritionKeys: [],
            }))
        : [],
      dayTotal,
      targets,
      deltaToTargets: subtractNutrition(dayTotal, targets),
      incompleteNutritionKeys: [],
      targetSource: comparisonDaySet ? 'daySet' : 'none',
    },
  };
}

export function hydrateInputDayItem(state: MockApiState, item: MockInputDayItem): Record<string, unknown> {
  const product = getProduct(state, item.productId);
  const slot = getSlot(state, item.slotId);

  return {
    id: item.id,
    productId: item.productId,
    productName: product?.name ?? `Produit #${item.productId}`,
    inventoryId: item.inventoryId,
    qty: item.qty,
    qtyUnit: item.qtyUnit,
    qtyNormalized: item.qtyNormalized,
    insertedAt: item.insertedAt,
    occurredAt: item.occurredAt,
    slotId: slot?.id ?? item.slotId,
    slotKey: slot?.key ?? item.slotKey,
    templateItemId: item.templateItemId,
    nutritionValue: product ? nutritionForProduct(product, item.qtyNormalized) : {},
  };
}


export function hydrateInputDayTemplateItem(
  state: MockApiState,
  item: MockTemplateItem,
  dateLocal: string,
): Record<string, unknown> {
  const product = getProduct(state, item.productId);
  const qtyNormalized = product ? normalizeProductQuantity(product, item.qty, item.qtyUnit) : 0;
  const conversion =
    state.templateConversions.find(
      (entry) => entry.dateLocal === dateLocal && entry.templateItemId === item.id,
    ) ?? null;
  return {
    id: item.id,
    productId: item.productId,
    productName: product?.name ?? `Produit #${item.productId}`,
    qty: item.qty,
    qtyUnit: item.qtyUnit,
    qtyNormalized,
    slotId: item.slotId,
    slotKey: item.slotKey,
    status: conversion ? 'converted' : 'pending',
    convertedItemId: conversion?.itemId ?? null,
    stockAvailability: stockAvailability(state, item.productId, qtyNormalized),
    stockByInventory: stockByInventory(state, item.productId, qtyNormalized),
    nutritionValue: product ? nutritionForProduct(product, qtyNormalized) : {},
  };
}

function resolveNutritionTargets(
  daySet: MockDaySet | null,
  activeAssignment: MockCycleAssignment | null,
): Record<string, number> | null {
  if (daySet) {
    return buildDaySetNutritionRecord(daySet);
  }
  if (activeAssignment) {
    return macrosFromCycleNutritionValues(activeAssignment.cycle.nutritionValues);
  }
  return null;
}

function resolveTargetSource(
  daySet: MockDaySet | null,
  activeAssignment: MockCycleAssignment | null,
): 'daySet' | 'cycle' | 'none' {
  if (daySet) return 'daySet';
  if (activeAssignment) return 'cycle';
  return 'none';
}

function resolveExpenseAmount(
  product: MockProduct | null,
  quantityNormalized: number,
  unitCount: number,
): number | null {
  if (product?.price == null) {
    return null;
  }
  const quantity = product.priceUnit === 'kg' || product.priceUnit === 'g'
    ? quantityNormalized / 1000
    : unitCount;
  return round(quantity * product.price);
}

export function buildInputDayResponse(state: MockApiState, dateLocal: string): Record<string, unknown> {
  const activeAssignment = getActiveAssignmentForDate(state, dateLocal);
  const daySet = getDaySetForDate(state, dateLocal);
  const templateResolution = getTemplateForDate(state, dateLocal);
  const dayItems = state.inputDayItems
    .filter((item) => item.dateLocal === dateLocal)
    .map((item) => hydrateInputDayItem(state, item));

  const templateItems = templateResolution.template
    ? templateResolution.template.items.map((item) =>
        hydrateInputDayTemplateItem(state, item, dateLocal),
      )
    : [];
  const enteredNutrition = sumNutrition([
    ...dayItems.map((item) => item.nutritionValue as Record<string, number>),
  ]);
  const templateNutrition = sumNutrition(
    templateItems.map((item) =>
      item.status === 'converted' ? {} : (item.nutritionValue as Record<string, number>),
    ),
  );
  const targets = resolveNutritionTargets(daySet, activeAssignment);

  const slots = daySet
    ? daySet.slotIds
        .map((slotId) => getSlot(state, slotId))
        .filter((slot): slot is MockSlot => slot !== null)
        .map((slot) => ({
          slotId: slot.id,
          slotKey: slot.key,
          title: slot.title,
          sortOrder: slot.sortOrder,
          startTime: slot.startTime,
          endTime: slot.endTime,
          nutritionValue: macrosFromCycleNutritionValues(slot.nutritionValues),
        }))
    : [];

  return {
    dateLocal,
    timezone: state.timezone,
    assignment: activeAssignment
      ? {
          id: activeAssignment.assignment.id,
          cycleId: activeAssignment.cycle.id,
          cycleTitle: activeAssignment.cycle.title,
          startDateLocal: activeAssignment.assignment.startDateLocal,
          endDateLocal: activeAssignment.endDateLocal,
          dayIndex: activeAssignment.dayIndex,
        }
      : null,
    daySet: daySet
      ? {
          id: daySet.id,
          title: daySet.title,
          nutritionValue: buildDaySetNutritionRecord(daySet),
          slots,
        }
      : null,
    templateAssociation: templateResolution.template && templateResolution.source
      ? {
          source: templateResolution.source,
          template: {
            id: templateResolution.template.id,
            title: templateResolution.template.title,
          },
        }
      : null,
    templateItems,
    items: dayItems,
    totalsMacros: {
      bySlot: slots.map((slot) => ({
        slot,
        ...macrosForSlotItems(dayItems, slot.slotId, slot.slotKey),
        targets: slot.nutritionValue,
        deltaToTargets: subtractNutrition(
          macrosForSlotItems(dayItems, slot.slotId, slot.slotKey),
          slot.nutritionValue,
        ),
        incompleteNutritionKeys: [],
      })),
      dayTotal: enteredNutrition,
      targets,
      deltaToTargets: subtractNutrition(enteredNutrition, targets),
      incompleteNutritionKeys: [],
      targetSource: resolveTargetSource(daySet, activeAssignment),
    },
    projectedTotalsMacros: templateItems.length > 0
      ? {
          bySlot: slots.map((slot) => ({
            slot,
            ...sumNutrition([
              macrosForSlotItems(dayItems, slot.slotId, slot.slotKey),
              macrosForTemplateItems(templateItems, slot.slotId),
            ]),
            targets: slot.nutritionValue,
            deltaToTargets: subtractNutrition(
              sumNutrition([
                macrosForSlotItems(dayItems, slot.slotId, slot.slotKey),
                macrosForTemplateItems(templateItems, slot.slotId),
              ]),
              slot.nutritionValue,
            ),
            incompleteNutritionKeys: [],
          })),
          dayTotal: sumNutrition([enteredNutrition, templateNutrition]),
          targets,
          deltaToTargets: subtractNutrition(sumNutrition([enteredNutrition, templateNutrition]), targets),
          incompleteNutritionKeys: [],
          targetSource: resolveTargetSource(daySet, activeAssignment),
        }
      : null,
    itemsBySlot: slots.map((slot) => ({
      slot: {
        slotId: slot.slotId,
        slotKey: slot.slotKey,
        title: slot.title,
        sortOrder: slot.sortOrder,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      items: dayItems.filter((item) => item.slotId === slot.slotId),
    })),
    slots,
  };
}

export function buildWeekResponse(state: MockApiState, startDateLocal: string): Record<string, unknown> {
  const days = rangeDays(startDateLocal, 7).map((dateLocal) => buildInputDayResponse(state, dateLocal));
  return {
    startDateLocal,
    endDateLocal: dateLocalPlus(startDateLocal, 6),
    timezone: state.timezone,
    days,
  };
}

export function buildMonthResponse(state: MockApiState, startDateLocal: string): Record<string, unknown> {
  const days = rangeDays(startDateLocal, 42).map((dateLocal) => buildInputDayResponse(state, dateLocal));
  return {
    startDateLocal,
    endDateLocal: dateLocalPlus(startDateLocal, 41),
    timezone: state.timezone,
    days,
  };
}

export function buildStatisticsTimeline(
  state: MockApiState,
  fromDateLocal: string,
  toDateLocal: string,
  timezone: string,
): Record<string, unknown> {
  const days = listBetweenDates(fromDateLocal, toDateLocal).map((dateLocal) => {
    const response = buildInputDayResponse(state, dateLocal) as InputDayResponse;
    const dayItems = state.inputDayItems.filter((item) => item.dateLocal === dateLocal);
    const events = dayItems.map((item) => {
      const product = getProduct(state, item.productId);
      const inventory = getInventory(state, item.inventoryId);
      const unitCount = product ? normalizedToProductUnits(product, item.qtyNormalized) : 0;
      const expenseAmount = resolveExpenseAmount(product, item.qtyNormalized, unitCount);

      return {
        id: item.id,
        inventoryId: inventory?.id ?? null,
        inventoryName: inventory?.name ?? null,
        productId: product?.id ?? null,
        productName: product?.name ?? `Produit #${item.productId}`,
        qty: item.qty,
        qtyUnit: item.qtyUnit ?? 'unit',
        qtyNormalized: item.qtyNormalized,
        qtyInProductUnits: round(unitCount),
        priceSnapshot: product?.price ?? null,
        priceUnitSnapshot: product?.priceUnit ?? null,
        expenseAmount,
        pricingStatus: expenseAmount == null ? 'incomplete' : 'complete',
        occurredAt: item.occurredAt ?? item.insertedAt,
      };
    });

    const totalAmount = round(
      events.reduce((sum, event) => sum + (event.expenseAmount ?? 0), 0),
    );

    return {
      dateLocal,
      expenses: {
        totalAmount,
        purchaseCount: events.length,
        incompletePurchaseCount: events.filter((event) => event.expenseAmount == null).length,
        events,
      },
      inputs: {
        assignment: response.assignment,
        daySet: response.daySet
          ? {
              id: response.daySet.id,
              title: response.daySet.title,
            }
          : null,
        targetSource: response.totalsMacros?.targetSource ?? 'none',
        dayTotal: response.totalsMacros?.dayTotal ?? {},
        targets: response.totalsMacros?.targets ?? null,
        deltaToTargets: response.totalsMacros?.deltaToTargets ?? null,
        incompleteNutritionKeys: response.totalsMacros?.incompleteNutritionKeys ?? [],
        itemCount: dayItems.length,
      },
    };
  });

  return {
    fromDateLocal,
    toDateLocal,
    timezone,
    summary: {
      totalAmount: round(days.reduce((sum, day) => sum + day.expenses.totalAmount, 0)),
      purchaseCount: days.reduce((sum, day) => sum + day.expenses.purchaseCount, 0),
      incompletePurchaseCount: days.reduce(
        (sum, day) => sum + day.expenses.incompletePurchaseCount,
        0,
      ),
      dayCount: days.length,
    },
    days,
  };
}

export function buildProductPriceHistory(
  state: MockApiState,
  productId: number,
  fromDateLocal: string,
  toDateLocal: string,
  timezone: string,
): Record<string, unknown> | null {
  const product = getProduct(state, productId);
  if (!product) {
    return null;
  }

  const changes = product.priceHistory
    .filter((entry) => {
      const effectiveDateLocal = DateTime.fromISO(entry.effectiveFrom).toISODate();
      return !!effectiveDateLocal && effectiveDateLocal >= fromDateLocal && effectiveDateLocal <= toDateLocal;
    })
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom))
    .map((entry, index, entries) => {
      const previous = entries[index - 1] ?? null;
      return {
        id: entry.id,
        price: entry.price,
        priceUnit: entry.priceUnit,
        effectiveFrom: entry.effectiveFrom,
        effectiveTo: entry.effectiveTo,
        previousPrice: previous?.price ?? null,
        previousPriceUnit: previous?.priceUnit ?? null,
        absoluteDelta: previous ? round(entry.price - previous.price) : null,
        relativeDeltaPct:
          previous && previous.price !== 0
            ? round(((entry.price - previous.price) / previous.price) * 100)
            : null,
      };
    });

  const baselineBeforeRange =
    [...product.priceHistory]
      .filter((entry) => {
        const effectiveDateLocal = DateTime.fromISO(entry.effectiveFrom).toISODate();
        return !!effectiveDateLocal && effectiveDateLocal < fromDateLocal;
      })
      .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0] ?? null;
  const currentPriceEntry = [...product.priceHistory].sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom),
  )[0] ?? null;
  const firstPrice = changes[0]?.price ?? null;
  const lastPrice = changes.at(-1)?.price ?? null;

  return {
    fromDateLocal,
    toDateLocal,
    timezone,
    product: {
      id: product.id,
      name: product.name,
    },
    currentPrice: {
      price: currentPriceEntry?.price ?? product.price ?? null,
      priceUnit: currentPriceEntry?.priceUnit ?? product.priceUnit ?? null,
    },
    baselineBeforeRange: baselineBeforeRange
      ? {
          id: baselineBeforeRange.id,
          price: baselineBeforeRange.price,
          priceUnit: baselineBeforeRange.priceUnit,
          effectiveFrom: baselineBeforeRange.effectiveFrom,
          effectiveTo: baselineBeforeRange.effectiveTo,
        }
      : null,
    changes,
    stats: {
      firstPrice,
      lastPrice,
      absoluteDelta: firstPrice != null && lastPrice != null ? round(lastPrice - firstPrice) : null,
      relativeDeltaPct:
        firstPrice != null && lastPrice != null && firstPrice !== 0
          ? round(((lastPrice - firstPrice) / firstPrice) * 100)
          : null,
      changeCount: changes.length,
      minPrice: changes.length > 0 ? Math.min(...changes.map((entry) => entry.price)) : null,
      maxPrice: changes.length > 0 ? Math.max(...changes.map((entry) => entry.price)) : null,
      priceUnit: currentPriceEntry?.priceUnit ?? product.priceUnit ?? null,
      hasMixedUnits: new Set(changes.map((entry) => entry.priceUnit)).size > 1,
    },
  };
}

export function updateInventoryStock(
  state: MockApiState,
  inventoryId: number,
  productId: number,
  qtyNormalized: number,
  mode: 'set' | 'add' | 'remove',
): void {
  const product = getProduct(state, productId);
  if (!product) {
    return;
  }

  let inventoryProduct =
    state.inventoryProducts.find(
      (entry) => entry.inventoryId === inventoryId && entry.productId === productId,
    ) ?? null;

  if (!inventoryProduct) {
    inventoryProduct = {
      id: state.nextIds.inventoryProduct,
      inventoryId,
      productId,
      qtyOnHandInUnits: 0,
      qtyOnHandNormalized: 0,
    };
    state.nextIds.inventoryProduct += 1;
    state.inventoryProducts.push(inventoryProduct);
  }

  if (mode === 'set') {
    inventoryProduct.qtyOnHandNormalized = Math.max(0, round(qtyNormalized));
  } else if (mode === 'add') {
    inventoryProduct.qtyOnHandNormalized = Math.max(
      0,
      round(inventoryProduct.qtyOnHandNormalized + qtyNormalized),
    );
  } else {
    inventoryProduct.qtyOnHandNormalized = Math.max(
      0,
      round(inventoryProduct.qtyOnHandNormalized - qtyNormalized),
    );
  }

  inventoryProduct.qtyOnHandInUnits = round(
    normalizedToProductUnits(product, inventoryProduct.qtyOnHandNormalized),
  );
}

export function replaceArrayItem<T extends { id: number }>(values: T[], nextValue: T): T[] {
  const nextValues = [...values];
  const index = nextValues.findIndex((value) => value.id === nextValue.id);
  if (index === -1) {
    nextValues.push(nextValue);
    return nextValues;
  }

  nextValues[index] = nextValue;
  return nextValues;
}

export function removeArrayItem<T extends { id: number }>(values: T[], id: number): T[] {
  return values.filter((value) => value.id !== id);
}

function macrosForSlotItems(
  items: Array<Record<string, unknown>>,
  slotId: number | null,
  slotKey: string | null = null,
): Record<string, number> {
  return sumNutrition(
    items
      .filter((item) => {
        const itemSlotId = item.slotId as number | null;
        if (itemSlotId !== null && itemSlotId === slotId) {
          return true;
        }

        const itemSlotKey = String(item.slotKey ?? '').trim();
        return slotKey !== null && itemSlotKey !== '' && itemSlotKey === slotKey;
      })
      .map((item) => item.nutritionValue as Record<string, number>),
  );
}

function macrosForTemplateItems(
  items: Array<Record<string, unknown>>,
  slotId: number | null,
): Record<string, number> {
  return sumNutrition(
    items
      .filter(
        (item) => (item.slotId as number | null) === slotId && item.status !== 'converted',
      )
      .map((item) => item.nutritionValue as Record<string, number>),
  );
}
