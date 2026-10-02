import type { MockApiRequestContext } from '../shared';
import type { MockInputDayItem, MockInventory } from '../state';

import {
  buildInputDayResponse,
  buildMonthResponse,
  buildWeekResponse,
  getInventory,
  getInventoryProducts,
  getProduct,
  getTemplateForDate,
  hydrateInventory,
  hydrateInventoryProduct,
  normalizeProductQuantity,
  removeArrayItem,
  updateInventoryStock,
} from '../shared';
export async function handleExecutionRequest(context: MockApiRequestContext): Promise<boolean> {
  const handlers = [
    handleInventoryCollectionRequest,
    handleInventoryRequest,
    handleInventoryProductsRequest,
    handleInventoryProductsAddRequest,
    handleInventoryProductsRemoveRequest,
    handleInventoryProductsReconcileRequest,
    handleInputDayMonthRequest,
    handleInputDayWeekRequest,
    handleInputDayRequest,
    handleInputDayCreateRequest,
    handleInputDayBulkCreateRequest,
    handleInputDayItemRequest,
    handleInputDayTemplateRequest,
    handleInputDayTemplateConversionRequest,
  ];

  for (const handler of handlers) {
    if (await handler(context)) {
      return true;
    }
  }

  return false;
}

async function handleInventoryCollectionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path === '/inventory') {
    if (method === 'GET') {
      await context.json(state.inventories.map((inventory) => hydrateInventory(state, inventory)));
      return true;
    }
    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const inventory: MockInventory = {
        id: context.nextId('inventory'),
        name: readNullableString(body.name) ?? '',
      };
      state.inventories.push(inventory);
      const products = Array.isArray(body.products) ? body.products : [];
      products.forEach((entry) => {
        const payload = entry as Record<string, unknown>;
        const productId = Number(payload.productId ?? 0);
        const product = getProduct(state, productId);
        if (!product) {
          return;
        }
        updateInventoryStock(
          state,
          inventory.id,
          productId,
          normalizeProductQuantity(product, Number(payload.qty ?? 0), readNullableString(payload.qtyUnit)),
          'set',
        );
      });
      await context.json(hydrateInventory(state, inventory), 201);
      return true;
    }
  }
  return false;
}

async function handleInventoryRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/inventory/') && path.split('/').length === 3) {
    const inventoryId = Number(path.split('/')[2]);
    const inventory = getInventory(state, inventoryId);
    if (!inventory) {
      await context.notFound('Inventory not found');
      return true;
    }
    if (method === 'GET') {
      await context.json(hydrateInventory(state, inventory));
      return true;
    }
    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      inventory.name = readNullableString(body.name) ?? inventory.name;
      await context.json(hydrateInventory(state, inventory));
      return true;
    }
    if (method === 'DELETE') {
      state.inventories = removeArrayItem(state.inventories, inventoryId);
      state.inventoryProducts = state.inventoryProducts.filter((item) => item.inventoryId !== inventoryId);
      await context.noContent();
      return true;
    }
  }
  return false;
}

async function handleInventoryProductsRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (path.startsWith('/inventory/') && path.endsWith('/products')) {
    const inventoryId = Number(path.split('/')[2]);
    const inventory = getInventory(state, inventoryId);
    if (!inventory) {
      await context.notFound('Inventory not found');
      return true;
    }
    if (method === 'GET') {
      await context.json(getInventoryProducts(state, inventoryId).map((item) => hydrateInventoryProduct(state, item)));
      return true;
    }
  }
  return false;
}

async function handleInventoryProductsAddRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  if (path.startsWith('/inventory/') && path.endsWith('/products/add')) {
    const inventoryId = Number(path.split('/')[2]);
    const inventory = getInventory(state, inventoryId);
    if (!inventory) {
      await context.notFound('Inventory not found');
      return true;
    }
    const body = await context.readJson<Record<string, unknown>>();
    const products = Array.isArray(body.products) ? body.products : [];
    products.forEach((entry) => {
      const payload = entry as Record<string, unknown>;
      const productId = Number(payload.productId ?? 0);
      const product = getProduct(state, productId);
      if (!product) {
        return;
      }
      updateInventoryStock(
        state,
        inventoryId,
        productId,
        normalizeProductQuantity(product, Number(payload.qty ?? 0), readNullableString(payload.qtyUnit)),
        'add',
      );
    });
    await context.json(hydrateInventory(state, inventory));
    return true;
  }
  return false;
}

async function handleInventoryProductsRemoveRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  if (path.startsWith('/inventory/') && path.endsWith('/products/remove')) {
    const inventoryId = Number(path.split('/')[2]);
    const inventory = getInventory(state, inventoryId);
    if (!inventory) {
      await context.notFound('Inventory not found');
      return true;
    }
    const body = await context.readJson<Record<string, unknown>>();
    const products = Array.isArray(body.products) ? body.products : [];
    products.forEach((entry) => {
      const payload = entry as Record<string, unknown>;
      const productId = Number(payload.productId ?? 0);
      const product = getProduct(state, productId);
      if (!product) {
        return;
      }
      updateInventoryStock(
        state,
        inventoryId,
        productId,
        normalizeProductQuantity(product, Number(payload.qty ?? 0), readNullableString(payload.qtyUnit)),
        'remove',
      );
    });
    await context.json(hydrateInventory(state, inventory));
    return true;
  }
  return false;
}

async function handleInventoryProductsReconcileRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  if (path.startsWith('/inventory/') && path.endsWith('/products/reconcile')) {
    const inventoryId = Number(path.split('/')[2]);
    const inventory = getInventory(state, inventoryId);
    if (!inventory) {
      await context.notFound('Inventory not found');
      return true;
    }
    state.inventoryProducts = state.inventoryProducts.filter((item) => item.inventoryId !== inventoryId);
    const body = await context.readJson<Record<string, unknown>>();
    const products = Array.isArray(body.products) ? body.products : [];
    products.forEach((entry) => {
      const payload = entry as Record<string, unknown>;
      const productId = Number(payload.productId ?? 0);
      const product = getProduct(state, productId);
      if (!product) {
        return;
      }
      updateInventoryStock(
        state,
        inventoryId,
        productId,
        normalizeProductQuantity(product, Number(payload.qty ?? 0), readNullableString(payload.qtyUnit)),
        'set',
      );
    });
    await context.json(hydrateInventory(state, inventory));
    return true;
  }
  return false;
}

async function handleInputDayMonthRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  if (path.startsWith('/input-days/month/')) {
    const dateLocal = path.split('/')[3];
    await context.json(buildMonthResponse(state, dateLocal));
    return true;
  }
  return false;
}

async function handleInputDayWeekRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  if (path.startsWith('/input-days/week/')) {
    const dateLocal = path.split('/')[3];
    await context.json(buildWeekResponse(state, dateLocal));
    return true;
  }
  return false;
}

async function handleInputDayRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (/^\/input-days\/[^/]+$/.test(path)) {
    const dateLocal = path.split('/')[2];
    if (method === 'GET') {
      await context.json(buildInputDayResponse(state, dateLocal));
      return true;
    }
  }
  return false;
}

async function handleInputDayCreateRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (/^\/input-days\/[^/]+\/items$/.test(path) && method === 'POST') {
    const dateLocal = path.split('/')[2];
    const body = await context.readJson<Record<string, unknown>>();
    const created = createInputDayItem(context, dateLocal, body);
    if (!created) {
      await context.json({ message: 'Invalid input-day payload' }, 400);
      return true;
    }
    state.inputDayItems.push(created);
    await context.json(created, 201);
    return true;
  }
  return false;
}

async function handleInputDayBulkCreateRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (/^\/input-days\/[^/]+\/items\/bulk$/.test(path) && method === 'POST') {
    const dateLocal = path.split('/')[2];
    const body = await context.readJson<Record<string, unknown>>();
    const items = Array.isArray(body.items) ? body.items : [];
    const previousStocks = structuredClone(state.inventoryProducts);
    const previousItems = [...state.inputDayItems];
    for (const entry of items) {
      const created = createInputDayItem(context, dateLocal, entry as Record<string, unknown>);
      if (!created) {
        state.inventoryProducts = previousStocks;
        state.inputDayItems = previousItems;
        await context.json({ message: 'Not enough stock in selected inventories' }, 400);
        return true;
      }
      state.inputDayItems.push(created);
    }
    await context.json({ created: items.length }, 201);
    return true;
  }
  return false;
}

async function handleInputDayItemRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (/^\/input-days\/[^/]+\/items\/\d+$/.test(path)) {
    const [, , dateLocal, , itemIdValue] = path.split('/');
    const itemId = Number(itemIdValue);
    const item = state.inputDayItems.find((candidate) => candidate.id === itemId && candidate.dateLocal === dateLocal) ?? null;
    if (!item) {
      await context.notFound('Input-day item not found');
      return true;
    }
    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      const previousStocks = structuredClone(state.inventoryProducts);
      restoreInputDayStock(context, item);
      const updated = createInputDayItem(context, readNullableString(body.dateLocal) ?? item.dateLocal, {
        ...item,
        ...body,
        inventoryIds: body.inventoryIds ?? (body.inventoryId ? [body.inventoryId] : item.inventoryAllocations?.map((allocation) => allocation.inventoryId) ?? [item.inventoryId]),
      });
      if (!updated) {
        state.inventoryProducts = previousStocks;
        await context.json({ message: 'Not enough stock in selected inventories' }, 400);
        return true;
      }
      Object.assign(item, updated, { templateItemId: item.templateItemId });
      await context.json(item);
      return true;
    }
    if (method === 'DELETE') {
      restoreInputDayStock(context, item);
      state.inputDayItems = removeArrayItem(state.inputDayItems, itemId);
      state.templateConversions = state.templateConversions.filter((entry) => entry.itemId !== itemId);
      await context.noContent();
      return true;
    }
  }
  return false;
}

async function handleInputDayTemplateRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (/^\/input-days\/[^/]+\/template$/.test(path) && method === 'PUT') {
    const dateLocal = path.split('/')[2];
    const body = await context.readJson<Record<string, unknown>>();
    state.manualTemplateOverrides[dateLocal] = readFallbackNumber(body.templateId, null);
    await context.json(buildInputDayResponse(state, dateLocal));
    return true;
  }
  return false;
}

async function handleInputDayTemplateConversionRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path } = context;
  const { state } = context;
  const method = context.request.method();
  if (/^\/input-days\/[^/]+\/template-items\/\d+\/convert$/.test(path) && method === 'POST') {
    const [, , dateLocal, , templateItemIdValue] = path.split('/');
    const templateItemId = Number(templateItemIdValue);
    const template = getTemplateForDate(state, dateLocal).template;
    const templateItem = template?.items.find((candidate) => candidate.id === templateItemId) ?? null;
    if (!template || !templateItem) {
      await context.notFound('Template item not found');
      return true;
    }
    const body = await context.readJson<Record<string, unknown>>();
    const created = createInputDayItem(context, dateLocal, {
      productId: templateItem.productId,
      inventoryIds: body.inventoryIds ?? [body.inventoryId],
      qty: templateItem.qty,
      qtyUnit: templateItem.qtyUnit,
      slotId: templateItem.slotId,
      slotKey: templateItem.slotKey,
    });
    if (!created) {
      await context.json({ message: 'Unable to convert template item' }, 400);
      return true;
    }
    created.templateItemId = templateItem.id;
    state.inputDayItems.push(created);
    state.templateConversions.push({
      dateLocal,
      templateItemId: templateItem.id,
      itemId: created.id,
    });
    await context.json(buildInputDayResponse(state, dateLocal));
    return true;
  }
  return false;
}

function createInputDayItem(
  context: MockApiRequestContext,
  dateLocal: string,
  payload: Record<string, unknown>,
): MockInputDayItem | null {
  const product = getProduct(context.state, Number(payload.productId ?? 0));
  if (!product) {
    return null;
  }
  const qty = Number(payload.qty ?? 0);
  const qtyUnit = readNullableString(payload.qtyUnit) as MockInputDayItem['qtyUnit'];
  const occurredAt = readNullableString(payload.occurredAt) ?? `${dateLocal}T12:00:00+01:00`;
  const inputUnit = qtyUnit ?? (product.quantityUnit === 'ml' || product.quantityUnit === 'l' ? 'ml' : ['mg', 'g', 'kg'].includes(product.quantityUnit ?? '') ? 'g' : 'unit');
  const qtyNormalized = normalizeProductQuantity(product, qty, inputUnit);
  const inventoryIds = [...new Set((Array.isArray(payload.inventoryIds) ? payload.inventoryIds : [payload.inventoryId]).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  const rows = context.state.inventoryProducts.filter((row) => row.productId === product.id && inventoryIds.includes(row.inventoryId))
    .sort((left, right) => right.qtyOnHandNormalized - left.qtyOnHandNormalized || left.inventoryId - right.inventoryId);
  if (qtyNormalized <= 0 || rows.reduce((sum, row) => sum + row.qtyOnHandNormalized, 0) + 1e-6 < qtyNormalized) return null;
  let remaining = qtyNormalized;
  const inventoryAllocations: { inventoryId: number; qtyNormalized: number }[] = [];
  for (const row of rows) {
    const amount = Math.min(remaining, row.qtyOnHandNormalized);
    if (amount <= 0) continue;
    row.qtyOnHandNormalized -= amount;
    row.qtyOnHandInUnits -= amount / (normalizeProductQuantity(product, 1, 'unit') || 1);
    inventoryAllocations.push({ inventoryId: row.inventoryId, qtyNormalized: amount });
    remaining -= amount;
    if (remaining <= 1e-6) break;
  }
  return {
    id: Number(payload.id ?? context.nextId('inputDayItem')),
    dateLocal,
    productId: product.id,
    inventoryId: inventoryAllocations[0]?.inventoryId ?? null,
    inventoryAllocations,
    qty,
    qtyUnit,
    qtyNormalized,
    occurredAt,
    insertedAt: occurredAt,
    slotId: readNullableNumber(payload.slotId),
    slotKey: readNullableString(payload.slotKey),
    templateItemId: null,
  };
}
function readNullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}
function readFallbackNumber(value: unknown, fallback: number | null): number | null {
  if (value === undefined) {
    return fallback;
  }
  return readNullableNumber(value);
}
function restoreInputDayStock(context: MockApiRequestContext, item: MockInputDayItem): void {
  const product = getProduct(context.state, item.productId);
  const allocations = item.inventoryAllocations ?? (item.inventoryId === null ? [] : [{ inventoryId: item.inventoryId, qtyNormalized: item.qtyNormalized }]);
  for (const allocation of allocations) {
    const row = context.state.inventoryProducts.find((stock) => stock.inventoryId === allocation.inventoryId && stock.productId === item.productId);
    if (row) {
      row.qtyOnHandNormalized += allocation.qtyNormalized;
      row.qtyOnHandInUnits += allocation.qtyNormalized / (product ? normalizeProductQuantity(product, 1, 'unit') || 1 : 1);
    }
  }
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const candidate = value.trim();
  return candidate === '' ? null : candidate;
}
function readFallbackString(value: unknown, fallback: string | null): string | null {
  if (value === undefined) {
    return fallback;
  }
  return readNullableString(value);
}
