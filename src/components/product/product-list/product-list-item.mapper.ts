import type { Product as ProductApiModel } from '../../../services/product-service';
import type { ProductListItem } from './product-list-item.model';

export function mapProductToProductListItem(product: ProductApiModel): ProductListItem {
  return {
    id: String(product.id),
    name: product.name,
    barcode: product.barcode ?? null,
    unitType: product.unitType,
    quantityPerUnit: product.quantityPerUnit,
    quantityUnit: product.quantityUnit,
    portionCount: product.portionCount ?? null,
    portionUnit: product.portionUnit ?? null,
    portionQuantityNormalized: product.portionQuantityNormalized ?? null,
    price: product.price ?? null,
    priceUnit: product.priceUnit ?? null,
    tagNames: resolveTagNames(product.tags),
    nutritionValuesCount: Array.isArray(product.nutritionValues)
      ? product.nutritionValues.length
      : 0,
    category: resolveLinkedEntityName(product.category),
    genericProduct: resolveLinkedEntityName(product.genericProduct),
  };
}

function resolveTagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const names = tags
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag.trim();
      }

      if (!tag || typeof tag !== 'object') {
        return '';
      }

      const raw = tag as Record<string, unknown>;
      const fields = ['name', 'title', 'label', 'key'];
      for (const field of fields) {
        const value = raw[field];
        if (typeof value === 'string' && value.trim() !== '') {
          return value.trim();
        }
      }

      return '';
    })
    .filter((name) => name !== '');

  return Array.from(new Set(names));
}

function resolveLinkedEntityName(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return 'None';
  }

  const raw = value as Record<string, unknown>;
  const fields = ['name', 'title', 'label'];
  for (const field of fields) {
    const candidate = raw[field];
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim();
    }
  }

  return 'None';
}
