import {
  PRODUCT_QUANTITY_INPUT_UNITS,
  type ProductQuantityContext,
  type ProductQuantityInputUnit,
  type QtyUnitOption,
} from '../interfaces/quantity.interface';

const INPUT_UNITS = new Set<string>(PRODUCT_QUANTITY_INPUT_UNITS);
const NORMALIZED_FACTORS: Readonly<Record<string, number>> = {
  mg: 0.001, g: 1, kg: 1000, ml: 1, l: 1000,
};

export function normalizeQuantityInputUnit(value: unknown): ProductQuantityInputUnit | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLowerCase();
  return INPUT_UNITS.has(candidate) ? candidate as ProductQuantityInputUnit : null;
}

export function getNormalizedQuantityUnit(value: unknown): 'g' | 'ml' | 'unit' | null {
  const unit = normalizeQuantityInputUnit(value);
  if (unit === 'mg' || unit === 'g' || unit === 'kg') return 'g';
  if (unit === 'ml' || unit === 'l') return 'ml';
  return unit === 'unit' || unit === 'pack' ? 'unit' : null;
}

export function defaultProductInputUnit(product: ProductQuantityContext | null): ProductQuantityInputUnit {
  return getNormalizedQuantityUnit(product?.quantityUnit) ?? 'unit';
}

/** Includes the stored unit so opening an editor cannot reinterpret its quantity. */
export function buildProductQtyUnitOptions(
  product: ProductQuantityContext | null,
  currentUnit?: ProductQuantityInputUnit | null,
): QtyUnitOption[] {
  const options: QtyUnitOption[] = [];
  const add = (value: ProductQuantityInputUnit | null, label = value?.toUpperCase() ?? ''): void => {
    if (value && !options.some((option) => option.value === value)) options.push({ value, label });
  };
  const unitType = product?.unitType?.trim();
  add('unit', unitType ? `Product unit (${unitType})` : 'Product unit');
  const portion = normalizeQuantityInputUnit(product?.portionUnit);
  add(portion, portion ? portion.charAt(0).toUpperCase() + portion.slice(1) : '');
  const baseUnit = getNormalizedQuantityUnit(product?.quantityUnit);
  if (baseUnit === 'g') {
    add('g', 'G (Gram)'); add('mg', 'MG (Milligram)'); add('kg', 'KG (Kilogram)');
  } else if (baseUnit === 'ml') {
    add('ml', 'ML (Millilitre)'); add('l', 'L (Litre)');
  } else if (baseUnit === 'unit') {
    add('pack', 'Pack');
  }
  add(currentUnit ?? null);
  return options;
}

export function normalizeQtyUnitSelection(
  value: ProductQuantityInputUnit | null | undefined,
  options: readonly QtyUnitOption[],
): ProductQuantityInputUnit {
  return normalizeQuantityInputUnit(value) ?? options[0]?.value ?? 'unit';
}

/** Matches the API's mass/volume, package and portion conversions. */
export function toNormalizedProductQuantity(
  qty: number,
  unit: ProductQuantityInputUnit,
  product: ProductQuantityContext | null,
): number | null {
  if (!Number.isFinite(qty) || qty < 0) return null;
  const factor = NORMALIZED_FACTORS[unit];
  if (factor != null) return qty * factor;
  const perUnit = product?.quantityNormalized ?? (
    product?.quantityPerUnit == null ? null : product.quantityPerUnit * (NORMALIZED_FACTORS[product.quantityUnit ?? ''] ?? 1)
  );
  if (unit === 'unit' || unit === 'pack') return perUnit != null && perUnit > 0 ? qty * perUnit : null;
  if (unit !== product?.portionUnit) return null;
  const perPortion = product.portionQuantityNormalized ?? (
    product.portionCount && perUnit ? perUnit / product.portionCount : null
  );
  return perPortion != null && perPortion > 0 ? qty * perPortion : null;
}
