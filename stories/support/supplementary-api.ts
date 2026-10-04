import type { PreparedDish, PreparedMeal, MealPrepAvailability } from '../../src/interfaces/meal-prep.interface';
import type { ShoppingList, ShoppingListTemplate } from '../../src/interfaces/shopping-list.interface';
import type { ExternalMealEntrySummary, CreateExternalMealEntryDto } from '../../src/interfaces/input-day.interface';
import type { MockApiState } from '../../tests/mocks/state';
import { normalizeProductQuantity, stockAvailability, updateInventoryStock, type MockApiRequestContext } from '../../tests/mocks/shared';

export interface SupplementaryState {
  dishes: PreparedDish[];
  meals: PreparedMeal[];
  shoppingLists: ShoppingList[];
  shoppingTemplates: ShoppingListTemplate[];
  externalEntries: Map<string, ExternalMealEntrySummary[]>;
  nextId: number;
}

export function createSupplementaryState(base: MockApiState, empty: boolean): SupplementaryState {
  const dishes: PreparedDish[] = [{ id: 1, name: 'Poulet et riz', items: [
    { id: 1, productId: 2, product: base.products[1], qty: 125, qtyUnit: 'g' },
    { id: 2, productId: 3, product: base.products[2], qty: 100, qtyUnit: 'g' },
  ] }];
  const meals: PreparedMeal[] = [{ id: 1, name: 'Déjeuner training', items: [
    { id: 3, itemType: 'dish', dishId: 1, dish: dishes[0], qty: 1, qtyUnit: 'unit' },
  ] }];
  return {
    dishes: empty ? [] : dishes, meals: empty ? [] : meals,
    shoppingLists: empty ? [] : [{ id: 1, name: 'Courses de la semaine', items: [
      { id: 1, productId: 1, product: base.products[0], qty: 6, qtyUnit: 'unit', checked: true },
      { id: 2, productId: 2, product: base.products[1], qty: 500, qtyUnit: 'g', checked: false },
    ] }],
    shoppingTemplates: empty ? [] : [{ id: 1, name: 'Essentiels du placard', items: [
      { id: 1, productId: 3, product: base.products[2], qty: 1, qtyUnit: 'unit' },
    ] }],
    externalEntries: new Map(), nextId: 100,
  };
}

function hydrateRecipes(extra: SupplementaryState, base: MockApiState): void {
  const availability = (lines: { productId: number; qty: number; qtyUnit: string | null }[]): MealPrepAvailability => {
    const missingProducts: MealPrepAvailability['missingProducts'] = [];
    let maxPreparations = Infinity;
    for (const line of lines) {
      const product = base.products.find(p => p.id === line.productId);
      if (!product) continue;
      const required = normalizeProductQuantity(product, line.qty, line.qtyUnit);
      const stock = stockAvailability(base, product.id, required);
      maxPreparations = Math.min(maxPreparations, required > 0 ? Math.floor(stock.totalAvailableNormalized / required) : 0);
      if (!stock.enoughStock) missingProducts.push({ productId: product.id, productName: product.name, requiredQtyNormalized: required, availableQtyNormalized: stock.totalAvailableNormalized, missingQtyNormalized: required - stock.totalAvailableNormalized });
    }
    return { isInStock: missingProducts.length === 0, maxPreparations: Number.isFinite(maxPreparations) ? maxPreparations : 0, missingProducts };
  };
  for (const dish of extra.dishes) {
    dish.items = dish.items.map(item => ({ ...item, product: base.products.find(p => p.id === item.productId) ?? null }));
    dish.resolvedProducts = dish.items.map(item => ({ ...item, productName: item.product?.name ?? 'Product' }));
    dish.availability = availability(dish.items);
  }
  for (const meal of extra.meals) {
    meal.items = meal.items.map(item => ({ ...item, product: base.products.find(p => p.id === item.productId) ?? null, dish: extra.dishes.find(d => d.id === item.dishId) ?? null }));
    meal.resolvedProducts = meal.items.flatMap(item => item.itemType === 'dish'
      ? (item.dish?.resolvedProducts ?? []).map(line => ({ ...line, qty: line.qty * item.qty }))
      : [{ productId: item.productId ?? 0, productName: item.product?.name ?? 'Product', qty: item.qty, qtyUnit: item.qtyUnit, product: item.product }]);
    meal.availability = availability(meal.resolvedProducts);
  }
}

/** Supplement the legacy E2E CRUD transport with the newer recipe, shopping and external-entry APIs. */
export async function handleSupplementaryRequest(context: MockApiRequestContext, extra: SupplementaryState): Promise<boolean> {
  const { path, state } = context;
  const method = context.request.method();
  const recipe = path.match(/^\/meal-prep\/(dishes|meals)(?:\/(\d+))?(?:\/(create-shopping-list))?$/);
  if (recipe) {
    const collection = recipe[1] === 'dishes' ? extra.dishes : extra.meals;
    const id = Number(recipe[2]);
    const current = collection.find(item => item.id === id);
    const body = await context.readJson<{ name?: string; items?: PreparedDish['items'] & PreparedMeal['items'] }>();
    if (method === 'POST' && !id) {
      collection.push({ id: extra.nextId++, name: body.name ?? 'Recipe', items: body.items ?? [] });
      hydrateRecipes(extra, state);
      await context.json(collection.at(-1), 201);
    } else if (!id && method === 'GET') {
      hydrateRecipes(extra, state); await context.json(collection);
    } else if (!current) await context.notFound();
    else if (recipe[3] && method === 'POST') {
      hydrateRecipes(extra, state);
      const list: ShoppingList = { id: extra.nextId++, name: body.name ?? current.name, items: (current.availability?.missingProducts ?? []).map(p => ({ id: extra.nextId++, productId: p.productId, product: state.products.find(product => product.id === p.productId), qty: p.missingQtyNormalized, qtyUnit: 'g', checked: false })) };
      extra.shoppingLists.push(list); await context.json(list, 201);
    } else if (method === 'PATCH') {
      Object.assign(current, body); hydrateRecipes(extra, state); await context.json(current);
    } else if (method === 'DELETE') {
      collection.splice(collection.findIndex(item => item.id === id), 1); await context.noContent();
    } else if (method === 'GET') await context.json(current);
    else return false;
    return true;
  }

  const shopping = path.match(/^\/shopping-list(?:\/(templates))?(?:\/(\d+))?(?:\/(items|check-all|convert-checked|save-template|create-list))?(?:\/(\d+))?$/);
  if (shopping) {
    const collection = shopping[1] ? extra.shoppingTemplates : extra.shoppingLists;
    const id = Number(shopping[2]);
    const current = collection.find(item => item.id === id);
    const action = shopping[3];
    const body = await context.readJson<Partial<ShoppingList & ShoppingList['items'][number]> & { inventoryId?: number }>();
    if (!id && method === 'GET') await context.json(collection);
    else if (!id && method === 'POST') {
      const list = { id: extra.nextId++, name: body.name ?? 'Shopping list', items: (body.items ?? []).map(item => ({ ...item, id: extra.nextId++, product: state.products.find(p => p.id === item.productId), checked: false })) };
      collection.push(list); await context.json(list, 201);
    } else if (!current) await context.notFound();
    else if (action === 'items') {
      const itemId = Number(shopping[4]);
      if (method === 'POST') current.items.push({ id: extra.nextId++, productId: body.productId ?? 1, product: state.products.find(p => p.id === body.productId), qty: body.qty ?? 1, qtyUnit: body.qtyUnit ?? 'unit', checked: false });
      else if (method === 'PATCH') Object.assign(current.items.find(item => item.id === itemId) ?? {}, body);
      else if (method === 'DELETE') current.items = current.items.filter(item => item.id !== itemId);
      else return false;
      await context.json(current);
    } else if (action === 'check-all') {
      (current as ShoppingList).items.forEach(item => { item.checked = body.checked ?? false; }); await context.json(current);
    } else if (action === 'convert-checked') {
      const list = current as ShoppingList;
      for (const item of list.items.filter(item => item.checked)) {
        const product = state.products.find(p => p.id === item.productId);
        if (product && body.inventoryId) updateInventoryStock(state, body.inventoryId, product.id, normalizeProductQuantity(product, item.qty, item.qtyUnit), 'add');
      }
      list.items = list.items.filter(item => !item.checked); await context.json(list);
    } else if (action === 'save-template' || action === 'create-list') {
      const copy = { ...structuredClone(current), id: extra.nextId++, name: body.name ?? current.name, items: current.items.map(item => ({ ...structuredClone(item), id: extra.nextId++, checked: false })) };
      (action === 'save-template' ? extra.shoppingTemplates : extra.shoppingLists).push(copy); await context.json(copy, 201);
    } else if (method === 'GET') await context.json(current);
    else if (method === 'PATCH') { current.name = body.name ?? current.name; await context.json(current); }
    else if (method === 'DELETE') { collection.splice(collection.findIndex(item => item.id === id), 1); await context.noContent(); }
    else return false;
    return true;
  }

  const external = path.match(/^\/input-days\/([\d-]+)\/external-entries(?:\/(\d+))?$/);
  if (external) {
    const date = external[1]; const id = Number(external[2]);
    const entries = extra.externalEntries.get(date) ?? [];
    const body = await context.readJson<CreateExternalMealEntryDto>();
    if (method === 'POST') entries.push({ ...body, id: extra.nextId++, occurredAt: body.occurredAt, insertedAt: `${date}T12:00:00+01:00`, slotId: body.slotId ?? null, slotKey: body.slotKey ?? null, priceAmount: body.priceAmount ?? null });
    else if (method === 'PATCH' || method === 'DELETE') {
      const index = entries.findIndex(entry => entry.id === id);
      if (index < 0) { await context.notFound(); return true; }
      if (method === 'PATCH') Object.assign(entries[index], body);
      else entries.splice(index, 1);
    }
    else return false;
    extra.externalEntries.set(date, entries);
    await context.json(entries.at(-1) ?? null); return true;
  }
  return false;
}
