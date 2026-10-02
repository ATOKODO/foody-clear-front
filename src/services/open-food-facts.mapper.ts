import type { FoodFactsProduct } from './open-food-facts-service';

const NUTRIENTS: [string, string, string][] = [
  ['energy-kcal', 'ENERGY_KCAL', 'KCAL'],
  ['energy-kj', 'ENERGY_KJ', 'KJ'],
  ['fat', 'FAT', 'G'],
  ['saturated-fat', 'SATURATED_FAT', 'G'],
  ['carbohydrates', 'CARBOHYDRATE', 'G'],
  ['sugars', 'SUGARS', 'G'],
  ['proteins', 'PROTEIN', 'G'],
  ['fiber', 'FIBER', 'G'],
  ['salt', 'SALT', 'G'],
];

const ALLERGENS: Record<string, string> = {
  milk: 'Lait',
  eggs: 'Œufs',
  nuts: 'Fruits à coque',
  peanuts: 'Arachides',
  gluten: 'Gluten',
  soybeans: 'Soja',
  fish: 'Poisson',
  celery: 'Céleri',
  mustard: 'Moutarde',
  'sesame-seeds': 'Graines de sésame',
  lupin: 'Lupin',
  crustaceans: 'Crustacés',
  molluscs: 'Mollusques',
  'sulphur-dioxide-and-sulphites': 'Dioxyde de soufre et sulfites',
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'string' && !value.trim()) return null;
  if (value == null || value === '' || typeof value === 'boolean') return null;
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/** OFF's _100g values use standard units, including for per-100ml liquid products. */
export function mapFoodFactsProduct(
  barcode: string,
  raw: Record<string, unknown>,
): FoodFactsProduct {
  const unit = text(raw['product_quantity_unit'])?.toLowerCase();
  const quantityUnit =
    unit === 'ml' || unit === 'l'
      ? 'ml'
      : unit === 'g' || unit === 'kg' || unit === 'mg'
        ? 'g'
        : null;
  const quantity = nonNegativeNumber(raw['product_quantity']);
  // OFF product_quantity is already normalized to g/ml, even when the label uses kg/l.
  const quantityPerUnit =
    quantity != null && quantity > 0 && quantityUnit ? quantity : null;
  const reference =
    quantityUnit === 'ml'
      ? 'PER_100ML'
      : 'PER_100G';
  const nutriments = asRecord(raw['nutriments']) ?? {};
  const nutritionValues: FoodFactsProduct['nutritionValues'] = [];
  for (const [key, nutritionKey, nutrientUnit] of NUTRIENTS) {
    const amount = nonNegativeNumber(
      nutriments[`${key}_100g`] ??
        (key === 'energy-kj' ? nutriments['energy_100g'] : null),
    );
    if (amount != null)
      nutritionValues.push({
        nutritionKey,
        amount,
        unit: nutrientUnit,
        reference,
      });
  }
  const grade = text(raw['nutrition_grades'])?.toLowerCase();
  const image = text(raw['image_front_url']);
  return {
    barcode,
    name: text(raw['product_name_fr']) ?? text(raw['product_name']),
    brands: text(raw['brands']),
    quantity: text(raw['quantity']),
    quantityPerUnit,
    quantityUnit,
    ingredients: text(raw['ingredients_text_fr']) ?? text(raw['ingredients_text']),
    allergens: Array.isArray(raw['allergens_tags'])
      ? raw['allergens_tags']
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => {
            const key = tag.replace(/^[a-z]{2}:/, '');
            return ALLERGENS[key] ?? key.replaceAll('-', ' ');
          })
      : [],
    nutriScore: grade && /^[a-e]$/.test(grade) ? grade.toUpperCase() : null,
    imageUrl:
      image && /^https:\/\/images\.openfoodfacts\.(?:org|net)\//.test(image)
        ? image
        : null,
    sourceUrl: `https://world.openfoodfacts.net/product/${barcode}`,
    nutritionValues,
  };
}
