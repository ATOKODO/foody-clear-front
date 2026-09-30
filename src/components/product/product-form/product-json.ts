import type { NutritionKeyMeta } from '../../../services/meta-service';
import type { PortionUnit, ProductPriceUnit, ProductUnitType, QuantityUnit } from '../../../services/product-service';
import type { ProductFormNutritionValue, ProductFormValue } from './product-form';

interface NamedOption { id: number; name: string }

export interface ProductJsonOptions {
  categories: NamedOption[];
  genericProducts: NamedOption[];
  tags: NamedOption[];
  nutritionKeys: NutritionKeyMeta[];
  unitTypes: readonly ProductUnitType[];
  portionUnits: readonly PortionUnit[];
  priceUnits: readonly ProductPriceUnit[];
}

export interface ProductJsonResult {
  formattedJson: string | null;
  value: ProductFormValue | null;
  error: string | null;
}

const FIELDS = [
  'name', 'barcode', 'category', 'genericProduct', 'tags', 'unitType',
  'quantityPerUnit', 'quantityUnit', 'portionCount', 'portionUnit', 'portionQuantity',
  'price', 'priceUnit', 'url', 'memo', 'nutritionValues',
];
const QUANTITY_FACTORS: Record<QuantityUnit, number> = {
  mg: 0.001, g: 1, kg: 1000, ml: 1, l: 1000, unit: 1, pack: 1,
};
const NUTRITION_UNITS: Record<string, string[]> = {
  ENERGY_KCAL: ['KCAL'], ENERGY_KJ: ['KJ'], FAT: ['G', 'MG'],
  SATURATED_FAT: ['G', 'MG'], CARBOHYDRATE: ['G', 'MG'], SUGARS: ['G', 'MG'],
  PROTEIN: ['G', 'MG'], FIBER: ['G', 'MG'], SALT: ['G', 'MG'],
};

/** Converts the public, name-based JSON format to the existing creation form value. */
export function parseProductJson(text: string, options: ProductJsonOptions): ProductJsonResult {
  if (!text.trim()) return { formattedJson: null, value: null, error: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { formattedJson: null, value: null, error: 'JSON invalide. Vérifiez les guillemets, les virgules et les accolades.' };
  }
  const formattedJson = JSON.stringify(parsed, null, 2);
  try {
    const raw = object(parsed, 'Le produit');
    checkFields(raw, FIELDS);
    const name = requiredString(raw['name'], 'name');
    const unitType = choice(raw['unitType'], options.unitTypes, 'unitType');
    const quantityPerUnit = number(raw['quantityPerUnit'], 'quantityPerUnit', 0.000001);
    const quantityUnit = choice(raw['quantityUnit'], Object.keys(QUANTITY_FACTORS) as QuantityUnit[], 'quantityUnit');
    const categoryId = resolveName(raw['category'], options.categories, 'category');
    const genericProductId = resolveName(raw['genericProduct'], options.genericProducts, 'genericProduct');
    const tags = raw['tags'] ?? [];
    if (!Array.isArray(tags)) throw new Error('tags doit être une liste de noms.');
    const tagIds = Array.from(new Set(tags.map((tag) => {
      requiredString(tag, 'tags');
      return resolveName(tag, options.tags, 'tags') as number;
    })));
    const price = optionalNumber(raw['price'], 'price', 0);
    const priceUnit = optionalChoice(raw['priceUnit'], options.priceUnits, 'priceUnit');
    if ((price == null) !== (priceUnit == null)) throw new Error('Renseignez price et priceUnit ensemble.');
    const portionCount = optionalNumber(raw['portionCount'], 'portionCount', 1);
    if (portionCount != null && !Number.isInteger(portionCount)) throw new Error('portionCount doit être un entier.');
    const portionUnit = optionalChoice(raw['portionUnit'], options.portionUnits, 'portionUnit');
    const portionQuantity = optionalNumber(raw['portionQuantity'], 'portionQuantity', 0.000001);
    if ((portionCount != null || portionQuantity != null) && portionUnit == null) {
      throw new Error('Renseignez portionUnit pour définir des portions.');
    }
    if (portionUnit != null && portionCount == null && portionQuantity == null) {
      throw new Error('Renseignez portionCount ou portionQuantity lorsque portionUnit est défini.');
    }
    const url = optionalString(raw['url'], 'url');
    if (url && !/^https?:\/\/[^\s/]+\.[^\s/]+(?:[/?#][^\s]*)?$/i.test(url)) {
      throw new Error('url doit être une adresse complète (https://example.com/produit).');
    }
    const nutrition = raw['nutritionValues'] ?? [];
    if (!Array.isArray(nutrition)) throw new Error('nutritionValues doit être une liste de valeurs nutritionnelles.');
    const nutritionValues: ProductFormNutritionValue[] = nutrition.map((item, index) => {
      const path = `nutritionValues[${index}]`;
      const row = object(item, path);
      checkFields(row, ['nutritionKey', 'amount', 'unit', 'reference'], path);
      const knownKeys = options.nutritionKeys.length
        ? options.nutritionKeys.map((key) => key.value) : Object.keys(NUTRITION_UNITS);
      const nutritionKey = choice(row['nutritionKey'], knownKeys, `${path}.nutritionKey`);
      const units = options.nutritionKeys.find((key) => key.value === nutritionKey)?.allowedUnits;
      return {
        nutritionKey,
        amount: number(row['amount'], `${path}.amount`, 0),
        unit: choice(row['unit'], units?.length ? units : NUTRITION_UNITS[nutritionKey] ?? ['G', 'MG', 'KCAL', 'KJ'], `${path}.unit`),
        reference: choice(row['reference'], ['PER_100G', 'PER_100ML'] as const, `${path}.reference`),
      };
    });
    return {
      formattedJson,
      error: null,
      value: {
        name, barcode: optionalString(raw['barcode'], 'barcode'), categoryId, genericProductId,
        tagIds, unitType, quantityPerUnit, quantityUnit, portionCount, portionUnit,
        portionQuantityNormalized: portionQuantity == null ? null : portionQuantity * QUANTITY_FACTORS[quantityUnit],
        price, priceUnit, priceEffectiveFrom: null, url,
        memo: optionalString(raw['memo'], 'memo'), nutritionValues,
      },
    };
  } catch (error) {
    return { formattedJson, value: null, error: error instanceof Error ? error.message : 'Produit invalide.' };
  }
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} doit être un objet JSON.`);
  return value as Record<string, unknown>;
}

function checkFields(raw: Record<string, unknown>, fields: string[], path = ''): void {
  const unknown = Object.keys(raw).filter((key) => !fields.includes(key));
  if (unknown.length) throw new Error(`Champ non pris en charge : ${path ? `${path}.` : ''}${unknown.join(', ')}. Utilisez le format de l’exemple.`);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} doit être un texte non vide.`);
  return value.trim();
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') throw new Error(`${field} doit être un texte.`);
  return value.trim() || null;
}

function number(value: unknown, field: string, min: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    throw new Error(`${field} doit être un nombre supérieur ou égal à ${min}.`);
  }
  return value;
}

function optionalNumber(value: unknown, field: string, min: number): number | null {
  return value == null ? null : number(value, field, min);
}

function choice<T extends string>(value: unknown, choices: readonly T[], field: string): T {
  const candidate = requiredString(value, field);
  if (!choices.includes(candidate as T)) throw new Error(`${field} : valeurs acceptées — ${choices.join(', ')}.`);
  return candidate as T;
}

function optionalChoice<T extends string>(value: unknown, choices: readonly T[], field: string): T | null {
  return value == null ? null : choice(value, choices, field);
}

function resolveName(value: unknown, options: NamedOption[], field: string): number | null {
  if (value == null) return null;
  const name = requiredString(value, field);
  const matches = options.filter((option) => option.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
  if (!matches.length) throw new Error(`${field} : « ${name} » est introuvable. Choisissez un nom existant ou omettez ce champ.`);
  if (matches.length > 1) throw new Error(`${field} : plusieurs éléments portent le nom « ${name} ». Utilisez le formulaire pour choisir.`);
  return matches[0].id;
}
