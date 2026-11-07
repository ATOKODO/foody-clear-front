import type { PreparedDish, PreparedMeal, MealPrepAvailability } from '../../src/interfaces/meal-prep.interface';
import type { ShoppingList, ShoppingListTemplate } from '../../src/interfaces/shopping-list.interface';
import type { ExternalMealEntrySummary, CreateExternalMealEntryDto } from '../../src/interfaces/input-day.interface';
import type { MockApiState } from './state';
import { normalizeProductQuantity, stockAvailability, updateInventoryStock, type MockApiRequestContext } from './shared';

export interface SupplementaryState {
  dishes: PreparedDish[];
  meals: PreparedMeal[];
  shoppingLists: ShoppingList[];
  shoppingTemplates: ShoppingListTemplate[];
  externalEntries: Map<string, ExternalMealEntrySummary[]>;
  nextId: number;
}

export function createSupplementaryState(base: MockApiState, empty = false): SupplementaryState {
  if (!empty && base.profile === 'realistic') return createRealisticSupplementaryState(base);
  const dishes: PreparedDish[] = [{ id: 1, name: 'Chicken and rice', items: [
    { id: 1, productId: 2, product: base.products[1], qty: 125, qtyUnit: 'g' },
    { id: 2, productId: 3, product: base.products[2], qty: 100, qtyUnit: 'g' },
  ] }];
  const meals: PreparedMeal[] = [{ id: 1, name: 'Training lunch', items: [
    { id: 3, itemType: 'dish', dishId: 1, dish: dishes[0], qty: 1, qtyUnit: 'unit' },
  ] }];
  return {
    dishes: empty ? [] : dishes, meals: empty ? [] : meals,
    shoppingLists: empty ? [] : [{ id: 1, name: 'Weekly groceries', items: [
      { id: 1, productId: 1, product: base.products[0], qty: 6, qtyUnit: 'unit', checked: true },
      { id: 2, productId: 2, product: base.products[1], qty: 500, qtyUnit: 'g', checked: false },
    ] }],
    shoppingTemplates: empty ? [] : [{ id: 1, name: 'Pantry essentials', items: [
      { id: 1, productId: 3, product: base.products[2], qty: 1, qtyUnit: 'unit' },
    ] }],
    externalEntries: new Map(), nextId: 100,
  };
}

function createRealisticSupplementaryState(base: MockApiState): SupplementaryState {
  let nextId = 100;
  const product = (id: number) => base.products.find(item => item.id === id)!;
  const dish = (id: number, name: string, lines: readonly (readonly [number, number])[]): PreparedDish => ({
    id, name, items: lines.map(([productId, qty]) => ({ id: nextId++, productId, product: product(productId), qty, qtyUnit: product(productId).quantityUnit as 'g' | 'ml' })),
  });
  const dishes = [
    dish(1, 'Chicken, basmati rice & roasted broccoli', [[2, 160], [3, 90], [12, 200], [11, 10]]),
    dish(2, 'Overnight oats with yogurt & blueberries', [[4, 70], [5, 200], [8, 80], [9, 15]]),
    dish(3, 'Salmon, sweet potato & spinach traybake', [[14, 180], [13, 250], [21, 150], [11, 10]]),
    dish(4, 'Lentil and tomato batch-cooking stew', [[16, 100], [22, 200], [21, 100], [11, 15]]),
    dish(5, 'Tofu and Mediterranean vegetable rice bowl', [[20, 180], [3, 80], [29, 250], [11, 10]]),
    dish(6, 'Tuna and whole-wheat pasta salad', [[15, 140], [18, 100], [22, 150], [11, 10]]),
    dish(7, 'Scrambled eggs on avocado toast', [[7, 100], [19, 80], [23, 75], [22, 100]]),
    dish(8, 'Cottage cheese, apple & almond snack', [[28, 150], [24, 180], [10, 25]]),
  ];
  const meal = (id: number, name: string, dishIds: number[], extras: readonly (readonly [number, number])[] = []): PreparedMeal => ({
    id, name, items: [
      ...dishIds.map(dishId => ({ id: nextId++, itemType: 'dish' as const, dishId, dish: dishes.find(item => item.id === dishId)!, qty: 1, qtyUnit: 'unit' as const })),
      ...extras.map(([productId, qty]) => ({ id: nextId++, itemType: 'product' as const, productId, product: product(productId), qty, qtyUnit: product(productId).quantityUnit as 'g' | 'ml' })),
    ],
  });
  const meals = [
    meal(1, 'Post-workout lunch — chicken bowl & fruit', [1], [[1, 120], [5, 150]]),
    meal(2, 'Bulking breakfast — overnight oats, toast & juice', [2, 7], [[27, 250]]),
    meal(3, 'Recovery dinner — salmon traybake', [3], [[5, 200]]),
    meal(4, 'Plant-based batch-cooking lunch', [4, 5]),
    meal(5, 'Office lunch — tuna pasta & crunchy apple', [6], [[24, 180]]),
    meal(6, 'Evening recovery snack', [8], [[26, 20]]),
  ];
  const shopping = (id: number, name: string, lines: readonly (readonly [number, number, boolean])[]): ShoppingList => ({
    id, name, items: lines.map(([productId, qty, checked]) => ({ id: nextId++, productId, product: product(productId), qty, qtyUnit: 'unit', checked })),
  });
  const extra: SupplementaryState = {
    dishes, meals,
    shoppingLists: [
      shopping(1, 'Weekly groceries — recovery & training', [[2, 2, true], [5, 3, false], [8, 1, false], [12, 2, true], [14, 2, false], [21, 2, false], [24, 6, true], [28, 2, false], [30, 1, false]]),
      shopping(2, 'Bulk-cooking Sunday — freezer restock', [[2, 4, false], [3, 2, false], [16, 2, true], [20, 3, false], [29, 2, false], [11, 1, false]]),
      shopping(3, 'Office snacks & breakfast essentials', [[4, 1, true], [9, 1, true], [10, 2, false], [24, 5, false], [25, 1, false], [31, 4, false]]),
      shopping(4, 'Weekend trip — add supplies', []),
    ],
    shoppingTemplates: [
      { id: 1, name: 'Pantry essentials', items: [3, 4, 9, 11, 15, 16, 18].map(productId => ({ id: nextId++, productId, product: product(productId), qty: 1, qtyUnit: 'unit' })) },
      { id: 2, name: 'Fresh produce & dairy', items: [1, 5, 6, 7, 12, 21, 22, 24].map(productId => ({ id: nextId++, productId, product: product(productId), qty: 2, qtyUnit: 'unit' })) },
      { id: 3, name: 'Plant-based meal-prep staples', items: [16, 17, 20, 29, 30].map(productId => ({ id: nextId++, productId, product: product(productId), qty: 1, qtyUnit: 'unit' })) },
    ],
    externalEntries: new Map(), nextId: 1000,
  };
  hydrateRecipes(extra, base);
  return extra;
}

function hydrateRecipes(extra: SupplementaryState, base: MockApiState): void {
  const availability = (lines: { productId: number; qty: number; qtyUnit: string | null }[]): MealPrepAvailability => {
    const missingProducts: MealPrepAvailability['missingProducts'] = [];
    let maxPreparations = Infinity;
    const requirements = new Map<number, number>();
    for (const line of lines) {
      const product = base.products.find(p => p.id === line.productId);
      if (!product) continue;
      const required = normalizeProductQuantity(product, line.qty, line.qtyUnit);
      requirements.set(product.id, (requirements.get(product.id) ?? 0) + required);
    }
    for (const [productId, required] of requirements) {
      const product = base.products.find(p => p.id === productId)!;
      const stock = stockAvailability(base, productId, required);
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
      const requirements = new Map<number, number>();
      for (const line of current.resolvedProducts ?? []) {
        const product = state.products.find(p => p.id === line.productId)!;
        requirements.set(product.id, (requirements.get(product.id) ?? 0) + normalizeProductQuantity(product, line.qty, line.qtyUnit));
      }
      const list: ShoppingList = { id: extra.nextId++, name: body.name ?? current.name, items: [...requirements].map(([productId, required]) => {
        const product = state.products.find(p => p.id === productId)!;
        return { id: extra.nextId++, productId, product, qty: Math.ceil(required / normalizeProductQuantity(product, 1, 'unit')), qtyUnit: 'unit', checked: false };
      }) };
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
