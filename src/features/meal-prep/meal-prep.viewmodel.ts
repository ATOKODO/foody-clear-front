import type { QtyUnitOption } from '../../interfaces/quantity.interface';
export type { QtyUnitOption } from '../../interfaces/quantity.interface';
import { buildProductQtyUnitOptions, normalizeQtyUnitSelection } from '../../utils/product-quantity';
import type { SegmentedToggleOption } from '../../app/ui/segmented-toggle/segmented-toggle';
import type { ProductListItem } from '../../components/product/product-list/product-list';
import { mapProductToProductListItem } from '../../components/product/product-list/product-list-item.mapper';
import type { ProductQuantityInputUnit } from '../../interfaces/inventory.interface';
import type {
  CreatePreparedDishDto,
  CreatePreparedMealDto,
  MealPrepEntryType,
  PreparedDish,
  PreparedMeal,
  PreparedMealItem,
} from '../../interfaces/meal-prep.interface';
import type { Product } from '../../services/product-service';

export type MealPrepView = 'dish' | 'meal';
export type MealLineItemType = 'product' | 'dish';
export type ProductPickerTarget =
  | { kind: 'dish'; index: number }
  | { kind: 'meal'; index: number };

export interface DishDraftLine {
  productId: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
}

export interface MealDraftLine {
  itemType: MealLineItemType;
  productId: number | null;
  dishId: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
}

export interface DishDraftForm {
  editingDishId: number | null;
  dishDraftName: string;
  dishDraftLines: DishDraftLine[];
}

export interface MealDraftForm {
  editingMealId: number | null;
  mealDraftName: string;
  mealDraftLines: MealDraftLine[];
}

export const MEAL_PREP_VIEW_OPTIONS: readonly SegmentedToggleOption<MealPrepView>[] = [
  { value: 'dish', label: 'Dishes' },
  { value: 'meal', label: 'Meals' },
];

const DISH_QTY_UNIT_OPTIONS: readonly QtyUnitOption[] = [
  { value: 'unit', label: 'Unit' },
];

export function buildMealPrepProductListItems(
  products: Product[],
): ProductListItem[] {
  return products.map((product) => mapProductToProductListItem(product));
}

export function sortMealPrepProducts(products: Product[]): Product[] {
  return sortByName(products);
}

export function sortMealPrepDishes(dishes: PreparedDish[]): PreparedDish[] {
  return sortByName(dishes);
}

export function sortMealPrepMeals(meals: PreparedMeal[]): PreparedMeal[] {
  return sortByName(meals);
}

export function createNewDishDraft(products: Product[]): DishDraftForm {
  return {
    editingDishId: null,
    dishDraftName: '',
    dishDraftLines: [createEmptyDishLine(products)],
  };
}

export function createNewMealDraft(products: Product[]): MealDraftForm {
  return {
    editingMealId: null,
    mealDraftName: '',
    mealDraftLines: [createEmptyMealLine(products)],
  };
}

export function createEmptyDishLine(products: Product[]): DishDraftLine {
  return hydrateDishLineQtyUnit(
    {
      productId: null,
      qty: 1,
      qtyUnit: null,
    },
    products,
  );
}

export function createEmptyMealLine(products: Product[]): MealDraftLine {
  return hydrateMealLineQtyUnit(
    {
      itemType: 'dish',
      productId: null,
      dishId: null,
      qty: 1,
      qtyUnit: null,
    },
    products,
  );
}

export function toDishDraftForm(dish: PreparedDish, products: Product[]): DishDraftForm {
  return {
    editingDishId: dish.id,
    dishDraftName: dish.name,
    dishDraftLines: dish.items.length
      ? dish.items.map((item) => ({ productId: item.productId, qty: item.qty, qtyUnit: item.qtyUnit }))
      : [createEmptyDishLine(products)],
  };
}

export function toMealDraftForm(meal: PreparedMeal, products: Product[]): MealDraftForm {
  return {
    editingMealId: meal.id,
    mealDraftName: meal.name,
    mealDraftLines: meal.items.length
      ? meal.items.map((item) => ({
          itemType: item.itemType, productId: item.productId ?? null,
          dishId: item.dishId ?? null, qty: item.qty, qtyUnit: item.qtyUnit,
        }))
      : [createEmptyMealLine(products)],
  };
}

export function selectDishLineProduct(
  line: DishDraftLine,
  productId: number | null,
  products: Product[],
): DishDraftLine {
  return hydrateDishLineQtyUnit({ ...line, productId }, products);
}

export function selectMealLineItemType(
  line: MealDraftLine,
  itemType: MealLineItemType,
  products: Product[],
): MealDraftLine {
  return hydrateMealLineQtyUnit(
    {
      ...line,
      itemType,
      productId: itemType === 'dish' ? null : line.productId,
      dishId: itemType === 'product' ? null : line.dishId,
    },
    products,
  );
}

export function selectMealLineProduct(
  line: MealDraftLine,
  productId: number | null,
  products: Product[],
): MealDraftLine {
  return hydrateMealLineQtyUnit(
    {
      ...line,
      itemType: 'product',
      productId,
      dishId: null,
    },
    products,
  );
}

export function selectMealLineDish(
  line: MealDraftLine,
  dishId: number | null,
  products: Product[],
): MealDraftLine {
  return hydrateMealLineQtyUnit({ ...line, dishId }, products);
}

export function removeDishDraftLine(
  lines: DishDraftLine[],
  index: number,
  products: Product[],
): DishDraftLine[] {
  return removeDraftLine(lines, index, () => createEmptyDishLine(products));
}

export function removeMealDraftLine(
  lines: MealDraftLine[],
  index: number,
  products: Product[],
): MealDraftLine[] {
  return removeDraftLine(lines, index, () => createEmptyMealLine(products));
}

export function canSaveDishDraft(name: string, lines: DishDraftLine[]): boolean {
  const selected = lines.filter((line) => line.productId !== null);
  return (
    name.trim() !== '' &&
    selected.length > 0 &&
    selected.every((line) => isValidSourceId(line.productId) && isValidQty(line.qty))
  );
}

export function canSaveMealDraft(name: string, lines: MealDraftLine[]): boolean {
  const selected = lines.filter(hasSelectedMealSource);
  return (
    name.trim() !== '' &&
    selected.length > 0 && selected.every(
      (line) =>
        isValidQty(line.qty) &&
        isValidSourceId(line.itemType === 'product' ? line.productId : line.dishId),
    )
  );
}

export function toCreatePreparedDishDto(
  name: string,
  lines: DishDraftLine[],
): CreatePreparedDishDto {
  if (!canSaveDishDraft(name, lines)) throw new Error('Enter a name and a positive quantity for every selected ingredient.');
  return {
    name: name.trim(),
    items: lines
      .filter((line) => line.productId !== null)
      .map((line) => ({
        productId: line.productId as number,
        qty: line.qty,
        qtyUnit: line.qtyUnit,
      })),
  };
}

export function toCreatePreparedMealDto(
  name: string,
  lines: MealDraftLine[],
): CreatePreparedMealDto {
  if (!canSaveMealDraft(name, lines)) throw new Error('Enter a name and a positive quantity for every selected ingredient.');
  return {
    name: name.trim(),
    items: lines
      .filter(hasSelectedMealSource)
      .map((line) => ({
        itemType: line.itemType,
        productId: line.itemType === 'product' ? line.productId : null,
        dishId: line.itemType === 'dish' ? line.dishId : null,
        qty: line.qty,
        qtyUnit: line.qtyUnit,
      })),
  };
}

export function getDishQtyUnitOptions(
  line: DishDraftLine,
  products: Product[],
): QtyUnitOption[] {
  return buildProductQtyUnitOptions(resolveProduct(line.productId, products), line.qtyUnit);
}

export function getMealQtyUnitOptions(
  line: MealDraftLine,
  products: Product[],
): QtyUnitOption[] {
  if (line.itemType === 'product') {
    return buildProductQtyUnitOptions(resolveProduct(line.productId, products), line.qtyUnit);
  }

  return [...DISH_QTY_UNIT_OPTIONS];
}

export function resolveProductPickerSelectedIds(
  target: ProductPickerTarget | null,
  dishLines: DishDraftLine[],
  mealLines: MealDraftLine[],
): string[] {
  if (target === null) {
    return [];
  }

  const productId =
    target.kind === 'dish'
      ? dishLines[target.index]?.productId
      : mealLines[target.index]?.productId;

  return productId === null || productId === undefined ? [] : [String(productId)];
}

export function resolveMealLineLabel(
  line: PreparedMealItem,
  translate: (message: string) => string = (message) => message,
): string {
  if (line.itemType === 'dish') {
    return line.dish?.name ?? translate(`Dish #${line.dishId ?? '-'}`);
  }

  return line.product?.name ?? translate(`Product #${line.productId ?? '-'}`);
}

export function resolveMealPrepTypeLabel(type: MealPrepEntryType): string {
  if (type === 'dish') {
    return 'Dish';
  }
  if (type === 'meal') {
    return 'Meal';
  }
  return 'Product';
}

export function resolveMealPrepAvailabilityLabel(
  maxPreparations: number | null | undefined,
): string {
  if (typeof maxPreparations !== 'number' || Number.isNaN(maxPreparations)) {
    return '-';
  }

  return `${maxPreparations}`;
}

export function resolveMealPrepProductName(
  productId: number | null,
  products: Product[],
  fallback = 'No product selected',
): string {
  return resolveProduct(productId, products)?.name ?? fallback;
}

export function resolveNextSelectionId<T extends { id: number }>(
  entries: T[],
  currentId: number | null,
): number | null {
  if (currentId !== null && entries.some((entry) => entry.id === currentId)) {
    return currentId;
  }

  return entries[0]?.id ?? null;
}

export function upsertById<T extends { id: number }>(
  entries: T[],
  nextEntry: T,
): T[] {
  const withoutCurrent = entries.filter((entry) => entry.id !== nextEntry.id);
  return [...withoutCurrent, nextEntry].sort((left, right) => left.id - right.id);
}

function hydrateDishLineQtyUnit(
  line: DishDraftLine,
  products: Product[],
): DishDraftLine {
  return {
    ...line,
    qtyUnit: normalizeQtyUnitSelection(line.qtyUnit, getDishQtyUnitOptions(line, products)),
  };
}

function hydrateMealLineQtyUnit(
  line: MealDraftLine,
  products: Product[],
): MealDraftLine {
  return {
    ...line,
    qtyUnit: normalizeQtyUnitSelection(line.qtyUnit, getMealQtyUnitOptions(line, products)),
  };
}

function resolveProduct(productId: number | null, products: Product[]): Product | null {
  if (productId === null) {
    return null;
  }

  return products.find((product) => product.id === productId) ?? null;
}

function hasSelectedMealSource(line: MealDraftLine): boolean {
  return (line.itemType === 'product' ? line.productId : line.dishId) !== null;
}

function isValidSourceId(id: number | null): boolean {
  return id !== null && Number.isInteger(id) && id > 0;
}

function isValidQty(qty: number): boolean {
  return Number.isFinite(qty) && qty > 0;
}

function removeDraftLine<T>(
  lines: T[],
  index: number,
  createEmptyLine: () => T,
): T[] {
  return lines.length === 1
    ? [createEmptyLine()]
    : lines.filter((_, lineIndex) => lineIndex !== index);
}

function sortByName<T extends { name: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
  );
}
