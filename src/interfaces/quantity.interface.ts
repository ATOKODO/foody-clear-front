export type QuantityUnit = 'mg' | 'g' | 'kg' | 'ml' | 'l' | 'unit' | 'pack';
export type PortionUnit = 'tranche' | 'piece' | 'part' | 'bouteille' | 'portion';
export type ProductQuantityInputUnit = QuantityUnit | PortionUnit;

export const PRODUCT_QUANTITY_INPUT_UNITS: readonly ProductQuantityInputUnit[] = [
  'mg', 'g', 'kg', 'ml', 'l', 'unit', 'pack',
  'tranche', 'piece', 'part', 'bouteille', 'portion',
];

export interface QtyUnitOption {
  value: ProductQuantityInputUnit;
  label: string;
}

export interface ProductQuantityContext {
  unitType?: string | null;
  quantityUnit?: string | null;
  quantityPerUnit?: number | null;
  quantityNormalized?: number | null;
  portionUnit?: string | null;
  portionCount?: number | null;
  portionQuantityNormalized?: number | null;
}
