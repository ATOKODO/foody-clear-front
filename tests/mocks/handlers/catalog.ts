import type { MockApiRequestContext } from '../shared';
import {
  getProduct,
  hydrateCategory,
  hydrateGenericProduct,
  hydrateNutritionValue,
  hydrateProduct,
  hydrateTag,
  removeArrayItem,
  round,
} from '../shared';
import type { MockNutritionValue, MockProduct } from '../state';

export async function handleCatalogRequest(context: MockApiRequestContext): Promise<boolean> {
  const { path, request, state } = context;
  const method = request.method();

  if (method === 'GET' && path === '/meta/quantity-units') {
    await context.json(state.quantityUnits);
    return true;
  }

  if (method === 'GET' && path === '/meta/nutrition-keys') {
    await context.json(state.nutritionKeys);
    return true;
  }

  if (path === '/category') {
    if (method === 'GET') {
      await context.json(state.categories.map(hydrateCategory));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const category = {
        id: context.nextId('category'),
        name: String(body.name ?? '').trim(),
        warnBeforeDays: Number(body.warnBeforeDays ?? 0),
        recentlyExpiredDays: Number(body.recentlyExpiredDays ?? 0),
        minQuantity: Number(body.minQuantity ?? 0),
      };
      state.categories.push(category);
      await context.json(hydrateCategory(category), 201);
      return true;
    }
  }

  if (path.startsWith('/category/')) {
    const categoryId = Number(path.split('/')[2]);
    const category = state.categories.find((item) => item.id === categoryId) ?? null;
    if (!category) {
      await context.notFound('Category not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateCategory(category));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      category.name = String(body.name ?? category.name).trim();
      category.warnBeforeDays = Number(body.warnBeforeDays ?? category.warnBeforeDays);
      category.recentlyExpiredDays = Number(body.recentlyExpiredDays ?? category.recentlyExpiredDays);
      category.minQuantity = Number(body.minQuantity ?? category.minQuantity);
      await context.json(hydrateCategory(category));
      return true;
    }

    if (method === 'DELETE') {
      state.categories = removeArrayItem(state.categories, categoryId);
      state.products.forEach((product) => {
        if (product.categoryId === categoryId) {
          product.categoryId = null;
        }
      });
      await context.noContent();
      return true;
    }
  }

  if (path === '/tag') {
    if (method === 'GET') {
      await context.json(state.tags.map(hydrateTag));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const tag = {
        id: context.nextId('tag'),
        name: String(body.name ?? '').trim(),
      };
      state.tags.push(tag);
      await context.json(hydrateTag(tag), 201);
      return true;
    }
  }

  if (path.startsWith('/tag/')) {
    const tagId = Number(path.split('/')[2]);
    const tag = state.tags.find((item) => item.id === tagId) ?? null;
    if (!tag) {
      await context.notFound('Tag not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateTag(tag));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      tag.name = String(body.name ?? tag.name).trim();
      await context.json(hydrateTag(tag));
      return true;
    }

    if (method === 'DELETE') {
      state.tags = removeArrayItem(state.tags, tagId);
      state.products.forEach((product) => {
        product.tagIds = product.tagIds.filter((candidate) => candidate !== tagId);
      });
      await context.noContent();
      return true;
    }
  }

  if (path === '/generic-product') {
    if (method === 'GET') {
      await context.json(state.genericProducts.map(hydrateGenericProduct));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const genericProduct = {
        id: context.nextId('genericProduct'),
        name: String(body.name ?? '').trim(),
        minQuantityUnit: Number(body.minQuantityUnit ?? 0),
        minQuantityUnitType: (body.minQuantityUnitType as MockProduct['portionUnit']) ?? null,
        minQuantityMetric: Number(body.minQuantityMetric ?? 0),
        minQuantityMetricType: (body.minQuantityMetricType as MockProduct['portionUnit']) ?? null,
      };
      state.genericProducts.push(genericProduct);
      await context.json(hydrateGenericProduct(genericProduct), 201);
      return true;
    }
  }

  if (path.startsWith('/generic-product/')) {
    const genericProductId = Number(path.split('/')[2]);
    const genericProduct = state.genericProducts.find((item) => item.id === genericProductId) ?? null;
    if (!genericProduct) {
      await context.notFound('Generic product not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateGenericProduct(genericProduct));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      genericProduct.name = String(body.name ?? genericProduct.name).trim();
      genericProduct.minQuantityUnit = Number(body.minQuantityUnit ?? genericProduct.minQuantityUnit);
      genericProduct.minQuantityUnitType =
        (body.minQuantityUnitType as MockProduct['portionUnit']) ?? genericProduct.minQuantityUnitType;
      genericProduct.minQuantityMetric = Number(body.minQuantityMetric ?? genericProduct.minQuantityMetric);
      genericProduct.minQuantityMetricType =
        (body.minQuantityMetricType as MockProduct['portionUnit']) ?? genericProduct.minQuantityMetricType;
      await context.json(hydrateGenericProduct(genericProduct));
      return true;
    }

    if (method === 'DELETE') {
      state.genericProducts = removeArrayItem(state.genericProducts, genericProductId);
      state.products.forEach((product) => {
        if (product.genericProductId === genericProductId) {
          product.genericProductId = null;
        }
      });
      await context.noContent();
      return true;
    }
  }

  if (path === '/product') {
    if (method === 'GET') {
      await context.json(state.products.map((product) => hydrateProduct(state, product)));
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const productId = context.nextId('product');
      const product: MockProduct = {
        id: productId,
        name: String(body.name ?? '').trim(),
        barcode: readNullableString(body.barcode),
        categoryId: readNullableNumber(body.categoryId),
        tagIds: Array.isArray(body.tagIds)
          ? body.tagIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
          : [],
        genericProductId: readNullableNumber(body.genericProductId),
        unitType: String(body.unitType ?? 'Unite'),
        quantityPerUnit: Number(body.quantityPerUnit ?? 1),
        quantityUnit: readNullableString(body.quantityUnit) ?? 'g',
        portionCount: readNullableNumber(body.portionCount),
        portionUnit: (readNullableString(body.portionUnit) as MockProduct['portionUnit']) ?? null,
        portionQuantityNormalized: readNullableNumber(body.portionQuantityNormalized),
        price: readNullableNumber(body.price),
        priceUnit: readNullableString(body.priceUnit) as MockProduct['priceUnit'],
        url: readNullableString(body.url),
        memo: readNullableString(body.memo),
        nutritionValues: [],
        priceHistory: [],
      };

      const nutritionValues = Array.isArray(body.nutritionValuesCreated)
        ? body.nutritionValuesCreated
        : [];
      product.nutritionValues = nutritionValues
        .map((value) => createNutritionValue(context, value as Record<string, unknown>))
        .filter((value): value is MockNutritionValue => value !== null);

      if (product.price != null && product.priceUnit) {
        product.priceHistory.push({
          id: context.nextId('priceHistory'),
          price: round(product.price),
          priceUnit: product.priceUnit,
          effectiveFrom: String(body.priceEffectiveFrom ?? '2026-03-01T08:00:00+01:00'),
          effectiveTo: null,
        });
      }

      state.products.push(product);
      await context.json(hydrateProduct(state, product), 201);
      return true;
    }
  }

  if (path.startsWith('/product/')) {
    const productId = Number(path.split('/')[2]);
    const product = getProduct(state, productId);
    if (!product) {
      await context.notFound('Product not found');
      return true;
    }

    if (method === 'GET') {
      await context.json(hydrateProduct(state, product));
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      product.name = String(body.name ?? product.name).trim();
      product.barcode = readFallbackString(body.barcode, product.barcode);
      if ('categoryId' in body) {
        product.categoryId = readNullableNumber(body.categoryId);
      }
      if (body.clearCategory === true) {
        product.categoryId = null;
      }
      if ('genericProductId' in body) {
        product.genericProductId = readNullableNumber(body.genericProductId);
      }
      product.unitType = String(body.unitType ?? product.unitType);
      product.quantityPerUnit = Number(body.quantityPerUnit ?? product.quantityPerUnit);
      product.quantityUnit = readFallbackString(body.quantityUnit, product.quantityUnit);
      product.portionCount = readFallbackNumber(body.portionCount, product.portionCount);
      product.portionUnit = (readFallbackString(body.portionUnit, product.portionUnit) as MockProduct['portionUnit']) ?? null;
      product.portionQuantityNormalized = readFallbackNumber(
        body.portionQuantityNormalized,
        product.portionQuantityNormalized,
      );
      product.url = readFallbackString(body.url, product.url);
      product.memo = readFallbackString(body.memo, product.memo);

      if (Array.isArray(body.tagIdsToAdd)) {
        product.tagIds = Array.from(
          new Set([
            ...product.tagIds,
            ...body.tagIdsToAdd.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0),
          ]),
        );
      }
      if (Array.isArray(body.tagIdsToRemove)) {
        const toRemove = new Set(body.tagIdsToRemove.map((value) => Number(value)));
        product.tagIds = product.tagIds.filter((tagId) => !toRemove.has(tagId));
      }

      const nextPrice = readNullableNumber(body.price);
      const nextPriceUnit = readNullableString(body.priceUnit) as MockProduct['priceUnit'];
      if (nextPrice != null && nextPriceUnit && (nextPrice !== product.price || nextPriceUnit !== product.priceUnit)) {
        const effectiveFrom =
          String(body.priceEffectiveFrom ?? '2026-03-25T09:00:00+01:00').trim() ||
          '2026-03-25T09:00:00+01:00';
        const currentVersion = product.priceHistory[product.priceHistory.length - 1] ?? null;
        if (currentVersion) {
          currentVersion.effectiveTo = effectiveFrom;
        }
        product.priceHistory.push({
          id: context.nextId('priceHistory'),
          price: round(nextPrice),
          priceUnit: nextPriceUnit,
          effectiveFrom,
          effectiveTo: null,
        });
        product.price = round(nextPrice);
        product.priceUnit = nextPriceUnit;
      }

      if (Array.isArray(body.nutritionValuesUpdated)) {
        body.nutritionValuesUpdated.forEach((value) => {
          const payload = value as Record<string, unknown>;
          const existingId = readNullableNumber(payload.id);
          if (existingId != null) {
            const existing = product.nutritionValues.find((item) => item.id === existingId);
            if (existing) {
              existing.nutritionKey = String(payload.nutritionKey ?? existing.nutritionKey).trim().toUpperCase();
              existing.amount = Number(payload.amount ?? existing.amount);
              existing.unit = String(payload.unit ?? existing.unit);
              existing.reference = String(payload.reference ?? existing.reference) === 'PER_100ML' ? 'PER_100ML' : 'PER_100G';
            }
            return;
          }

          const nextValue = createNutritionValue(context, payload);
          if (nextValue) {
            product.nutritionValues.push(nextValue);
          }
        });
      }

      await context.json(hydrateProduct(state, product));
      return true;
    }

    if (method === 'DELETE') {
      state.products = removeArrayItem(state.products, productId);
      state.inventoryProducts = state.inventoryProducts.filter((item) => item.productId !== productId);
      state.inputDayItems = state.inputDayItems.filter((item) => item.productId !== productId);
      state.templates.forEach((template) => {
        template.items = template.items.filter((item) => item.productId !== productId);
      });
      await context.noContent();
      return true;
    }
  }

  if (path === '/nutrition-value') {
    if (method === 'GET') {
      await context.json(
        state.products.flatMap((product) =>
          product.nutritionValues.map((value) => ({
            ...hydrateNutritionValue(value),
            productId: product.id,
            product: { id: product.id, name: product.name },
          })),
        ),
      );
      return true;
    }

    if (method === 'POST') {
      const body = await context.readJson<Record<string, unknown>>();
      const product = getProduct(state, readNullableNumber(body.productId));
      if (!product) {
        await context.notFound('Product not found');
        return true;
      }

      const nutritionValue = createNutritionValue(context, body);
      if (!nutritionValue) {
        await context.json({ message: 'Invalid payload' }, 400);
        return true;
      }

      product.nutritionValues.push(nutritionValue);
      await context.json({
        ...hydrateNutritionValue(nutritionValue),
        productId: product.id,
        product: { id: product.id, name: product.name },
      }, 201);
      return true;
    }
  }

  if (path.startsWith('/nutrition-value/')) {
    const nutritionValueId = Number(path.split('/')[2]);
    const located = findNutritionValue(state, nutritionValueId);
    if (!located) {
      await context.notFound('Nutrition value not found');
      return true;
    }

    if (method === 'GET') {
      await context.json({
        ...hydrateNutritionValue(located.value),
        productId: located.product.id,
        product: { id: located.product.id, name: located.product.name },
      });
      return true;
    }

    if (method === 'PATCH') {
      const body = await context.readJson<Record<string, unknown>>();
      located.value.nutritionKey = String(body.label ?? body.nutritionKey ?? located.value.nutritionKey)
        .trim()
        .toUpperCase();
      located.value.amount = Number(body.amount ?? located.value.amount);
      located.value.unit = String(body.unit ?? located.value.unit);
      located.value.reference = Number(body.per ?? 100) === 100 ? 'PER_100G' : 'PER_100ML';
      await context.json({
        id: located.value.id,
        label: String(body.label ?? located.value.nutritionKey),
        amount: located.value.amount,
        unit: located.value.unit,
        per: Number(body.per ?? 100),
        productId: located.product.id,
      });
      return true;
    }

    if (method === 'DELETE') {
      located.product.nutritionValues = removeArrayItem(located.product.nutritionValues, nutritionValueId);
      await context.noContent();
      return true;
    }
  }

  return false;
}

function findNutritionValue(
  state: MockApiRequestContext['state'],
  nutritionValueId: number,
): { product: MockProduct; value: MockNutritionValue } | null {
  for (const product of state.products) {
    const value = product.nutritionValues.find((candidate) => candidate.id === nutritionValueId);
    if (value) {
      return { product, value };
    }
  }

  return null;
}

function createNutritionValue(
  context: MockApiRequestContext,
  payload: Record<string, unknown>,
): MockNutritionValue | null {
  const nutritionKey = String(payload.nutritionKey ?? payload.label ?? '').trim().toUpperCase();
  if (!nutritionKey) {
    return null;
  }

  return {
    id: context.nextId('nutritionValue'),
    nutritionKey,
    amount: Number(payload.amount ?? 0),
    unit: String(payload.unit ?? 'G').trim().toUpperCase(),
    reference: Number(payload.per ?? 100) === 100 ? 'PER_100G' : 'PER_100ML',
  };
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
