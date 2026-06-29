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
  const { path, request, state } = context;
  const method = request.method();
  if (path === '/inventory') {
    if (method === 'GET') {
      await context.json(state.inventories.map((inventory) => hydrateInventory(state, inventory)));
      return true;
    }
    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const inventory: MockInventory = {
        id: context.nextId('inventory'),
        name: String(body.name ?? '').trim(),
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
      inventory.name = String(body.name ?? inventory.name).trim();
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
  if (path.startsWith('/input-days/month/')) {
    const dateLocal = path.split('/')[3];
    await context.json(buildMonthResponse(state, dateLocal));
    return true;
  }
  if (path.startsWith('/input-days/week/')) {
    const dateLocal = path.split('/')[3];
    await context.json(buildWeekResponse(state, dateLocal));
    return true;
  }
  if (/^\/input-days\/[^/]+$/.test(path)) {
    const dateLocal = path.split('/')[2];
    if (method === 'GET') {
      await context.json(buildInputDayResponse(state, dateLocal));
      return true;
    }
  }
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
  if (/^\/input-days\/[^/]+\/items\/bulk$/.test(path) && method === 'POST') {
    const dateLocal = path.split('/')[2];
    const body = await context.readJson<Record<string, unknown>>();
    const items = Array.isArray(body.items) ? body.items : [];
    items.forEach((entry) => {
      const created = createInputDayItem(context, dateLocal, entry as Record<string, unknown>);
      if (created) {
        state.inputDayItems.push(created);
      }
    });
    await context.json({ created: items.length }, 201);
    return true;
  }
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
      const product = getProduct(state, Number(body.productId ?? item.productId));
      if (product) {
        item.productId = product.id;
        item.qty = Number(body.qty ?? item.qty);
        item.qtyUnit = readFallbackString(body.qtyUnit, item.qtyUnit) as typeof item.qtyUnit;
        item.qtyNormalized = normalizeProductQuantity(product, item.qty, item.qtyUnit);
      }
      item.dateLocal = String(body.dateLocal ?? item.dateLocal).trim();
      item.inventoryId = readFallbackNumber(body.inventoryId, item.inventoryId);
      item.occurredAt = readFallbackString(body.occurredAt, item.occurredAt);
      item.slotId = readFallbackNumber(body.slotId, item.slotId);
      item.slotKey = readFallbackString(body.slotKey, item.slotKey);
      await context.json(item);
      return true;
    }
    if (method === 'DELETE') {
      state.inputDayItems = removeArrayItem(state.inputDayItems, itemId);
      state.templateConversions = state.templateConversions.filter((entry) => entry.itemId !== itemId);
      await context.noContent();
      return true;
    }
  }
  if (/^\/input-days\/[^/]+\/template$/.test(path) && method === 'PUT') {
    const dateLocal = path.split('/')[2];
    const body = await context.readJson<Record<string, unknown>>();
    state.manualTemplateOverrides[dateLocal] = readFallbackNumber(body.templateId, null);
    await context.json(buildInputDayResponse(state, dateLocal));
    return true;
  }
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
      inventoryId: Number(body.inventoryId ?? 0),
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
  return {
    id: context.nextId('inputDayItem'),
    dateLocal,
    productId: product.id,
    inventoryId: readNullableNumber(payload.inventoryId),
    qty,
    qtyUnit,
    qtyNormalized: normalizeProductQuantity(product, qty, qtyUnit),
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
function readNullableString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const candidate = String(value).trim();
  return candidate === '' ? null : candidate;
}
function readFallbackString(value: unknown, fallback: string | null): string | null {
  if (value === undefined) {
    return fallback;
  }
  return readNullableString(value);
}
