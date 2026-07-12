import type {
  PreparedDish,
  PreparedMeal,
  PreparedMealItem,
} from '../../interfaces/meal-prep.interface';
import type { Product } from '../../services/product-service';
import {
  buildMealPrepProductListItems,
  canSaveDishDraft,
  canSaveMealDraft,
  createEmptyDishLine,
  createEmptyMealLine,
  createNewDishDraft,
  createNewMealDraft,
  getDishQtyUnitOptions,
  getMealQtyUnitOptions,
  removeDishDraftLine,
  removeMealDraftLine,
  resolveMealLineLabel,
  resolveMealPrepAvailabilityLabel,
  resolveMealPrepProductName,
  resolveMealPrepTypeLabel,
  resolveNextSelectionId,
  resolveProductPickerSelectedIds,
  selectDishLineProduct,
  selectMealLineDish,
  selectMealLineItemType,
  selectMealLineProduct,
  sortMealPrepDishes,
  sortMealPrepMeals,
  sortMealPrepProducts,
  toCreatePreparedDishDto,
  toCreatePreparedMealDto,
  toDishDraftForm,
  toMealDraftForm,
  upsertById,
} from './meal-prep.viewmodel';

describe('meal-prep viewmodel', () => {
  const products: Product[] = [
    {
      id: 1,
      name: 'Pasta',
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      portionUnit: 'portion',
      portionCount: 5,
      portionQuantityNormalized: 100,
    },
    {
      id: 2,
      name: 'Apple',
      unitType: 'Unite',
      quantityPerUnit: 1,
      quantityUnit: 'unit',
      portionUnit: null,
    },
  ];

  const dish: PreparedDish = {
    id: 2,
    name: 'Zesty dish',
    items: [
      { id: 20, productId: 1, qty: 2, qtyUnit: 'g', product: products[0] },
    ],
  };

  const meal: PreparedMeal = {
    id: 1,
    name: 'Morning meal',
    items: [
      {
        id: 30,
        itemType: 'dish',
        dishId: 2,
        qty: 1,
        qtyUnit: 'unit',
        dish,
      },
      {
        id: 31,
        itemType: 'product',
        productId: 1,
        qty: 2,
        qtyUnit: 'portion',
        product: products[0],
      },
    ],
  };

  it('maps and sorts meal-prep collections', () => {
    expect(buildMealPrepProductListItems(products).map((item) => item.id)).toEqual([
      '1',
      '2',
    ]);
    expect(sortMealPrepProducts([...products].reverse()).map((item) => item.name)).toEqual([
      'Apple',
      'Pasta',
    ]);
    expect(sortMealPrepDishes([dish, { ...dish, id: 3, name: 'A dish' }]).map((item) => item.name)).toEqual([
      'A dish',
      'Zesty dish',
    ]);
    expect(sortMealPrepMeals([meal, { ...meal, id: 4, name: 'Evening meal' }]).map((item) => item.name)).toEqual([
      'Evening meal',
      'Morning meal',
    ]);
  });

  it('creates and hydrates dish and meal drafts', () => {
    expect(createNewDishDraft(products)).toEqual({
      editingDishId: null,
      dishDraftName: '',
      dishDraftLines: [createEmptyDishLine(products)],
    });
    expect(createNewMealDraft(products)).toEqual({
      editingMealId: null,
      mealDraftName: '',
      mealDraftLines: [createEmptyMealLine(products)],
    });

    expect(toDishDraftForm(dish, products)).toEqual({
      editingDishId: 2,
      dishDraftName: 'Zesty dish',
      dishDraftLines: [{ productId: 1, qty: 2, qtyUnit: 'g' }],
    });
    expect(toDishDraftForm({ ...dish, items: [] }, products).dishDraftLines).toEqual([
      createEmptyDishLine(products),
    ]);
    expect(toMealDraftForm(meal, products).mealDraftLines).toEqual([
      { itemType: 'dish', productId: null, dishId: 2, qty: 1, qtyUnit: 'unit' },
      { itemType: 'product', productId: 1, dishId: null, qty: 2, qtyUnit: 'portion' },
    ]);
    expect(toMealDraftForm({ ...meal, items: [] }, products).mealDraftLines).toEqual([
      createEmptyMealLine(products),
    ]);
  });

  it('selects products, dishes and line types while preserving valid units', () => {
    const emptyDish = createEmptyDishLine(products);
    expect(selectDishLineProduct(emptyDish, 1, products)).toEqual({
      productId: 1,
      qty: 1,
      qtyUnit: 'unit',
    });
    expect(selectDishLineProduct({ ...emptyDish, qtyUnit: 'g' }, 2, products).qtyUnit).toBe(
      'g',
    );

    const mealLine = createEmptyMealLine(products);
    expect(selectMealLineItemType(mealLine, 'product', products)).toEqual({
      itemType: 'product',
      productId: null,
      dishId: null,
      qty: 1,
      qtyUnit: 'unit',
    });
    expect(selectMealLineItemType({ ...mealLine, productId: 1 }, 'dish', products)).toEqual({
      itemType: 'dish',
      productId: null,
      dishId: null,
      qty: 1,
      qtyUnit: 'unit',
    });
    expect(selectMealLineProduct({ ...mealLine, itemType: 'dish', dishId: 2 }, 1, products)).toEqual({
      itemType: 'product',
      productId: 1,
      dishId: null,
      qty: 1,
      qtyUnit: 'unit',
    });
    expect(selectMealLineDish({ ...mealLine, itemType: 'dish' }, 2, products)).toEqual({
      itemType: 'dish',
      productId: null,
      dishId: 2,
      qty: 1,
      qtyUnit: 'unit',
    });
  });

  it('covers validation, DTO conversion and line removal', () => {
    const validDishLine = { productId: 1, qty: 2, qtyUnit: 'g' as const };
    const invalidDishLine = { productId: null, qty: 0, qtyUnit: null };
    expect(canSaveDishDraft('  dish  ', [validDishLine])).toBeTrue();
    expect(canSaveDishDraft(' ', [validDishLine])).toBeFalse();
    expect(canSaveDishDraft('dish', [invalidDishLine])).toBeFalse();
    expect(canSaveMealDraft('meal', [
      { itemType: 'product', productId: 1, dishId: null, qty: 1, qtyUnit: 'unit' },
    ])).toBeTrue();
    expect(canSaveMealDraft('meal', [
      { itemType: 'dish', productId: null, dishId: 2, qty: 1, qtyUnit: 'unit' },
    ])).toBeTrue();
    expect(canSaveMealDraft('meal', [
      { itemType: 'dish', productId: 1, dishId: null, qty: 0, qtyUnit: null },
    ])).toBeFalse();

    expect(toCreatePreparedDishDto('  dish  ', [validDishLine, invalidDishLine])).toEqual({
      name: 'dish',
      items: [{ productId: 1, qty: 2, qtyUnit: 'g' }],
    });
    expect(toCreatePreparedMealDto(' meal ', [
      { itemType: 'product', productId: 1, dishId: 2, qty: 2, qtyUnit: 'g' },
      { itemType: 'dish', productId: null, dishId: 2, qty: 1, qtyUnit: null },
      { itemType: 'product', productId: null, dishId: null, qty: 0, qtyUnit: null },
    ])).toEqual({
      name: 'meal',
      items: [
        { itemType: 'product', productId: 1, dishId: null, qty: 2, qtyUnit: 'g' },
        { itemType: 'dish', productId: null, dishId: 2, qty: 1, qtyUnit: null },
      ],
    });

    const twoDishLines = [validDishLine, { productId: 2, qty: 1, qtyUnit: 'unit' as const }];
    expect(removeDishDraftLine(twoDishLines, 0, products)).toEqual([twoDishLines[1]]);
    expect(removeDishDraftLine([validDishLine], 0, products)).toEqual([createEmptyDishLine(products)]);
    const twoMealLines = [
      { itemType: 'dish' as const, productId: null, dishId: 2, qty: 1, qtyUnit: 'unit' as const },
      { itemType: 'product' as const, productId: 1, dishId: null, qty: 1, qtyUnit: 'g' as const },
    ];
    expect(removeMealDraftLine(twoMealLines, 1, products)).toEqual([twoMealLines[0]]);
    expect(removeMealDraftLine([twoMealLines[0]], 0, products)).toEqual([createEmptyMealLine(products)]);
  });

  it('resolves labels, options, picker selections and ids', () => {
    expect(getDishQtyUnitOptions(createEmptyDishLine([]), [])).toEqual([
      { value: 'unit', label: 'Product unit' },
      { value: 'g', label: 'G (Gramme)' },
    ]);
    expect(getDishQtyUnitOptions({ productId: 1, qty: 1, qtyUnit: null }, products)).toEqual([
      { value: 'unit', label: 'Product unit (Paquet)' },
      { value: 'portion', label: 'Portion' },
      { value: 'g', label: 'G (Gramme)' },
    ]);
    expect(getMealQtyUnitOptions({ itemType: 'dish', productId: null, dishId: 2, qty: 1, qtyUnit: null }, products)).toEqual([
      { value: 'unit', label: 'Unit' },
    ]);
    expect(getMealQtyUnitOptions({ itemType: 'product', productId: 1, dishId: null, qty: 1, qtyUnit: null }, products)).toHaveSize(3);

    expect(resolveMealLineLabel(meal.items[0])).toBe('Zesty dish');
    expect(resolveMealLineLabel({ ...meal.items[0], dish: null, dishId: 99 })).toBe('Dish #99');
    expect(resolveMealLineLabel(meal.items[1])).toBe('Pasta');
    expect(resolveMealLineLabel({ ...meal.items[1], product: null, productId: 99 })).toBe('Product #99');
    expect(resolveMealPrepTypeLabel('dish')).toBe('Dish');
    expect(resolveMealPrepTypeLabel('meal')).toBe('Meal');
    expect(resolveMealPrepTypeLabel('product')).toBe('Product');
    expect(resolveMealPrepAvailabilityLabel(null)).toBe('-');
    expect(resolveMealPrepAvailabilityLabel(Number.NaN)).toBe('-');
    expect(resolveMealPrepAvailabilityLabel(3)).toBe('3');
    expect(resolveMealPrepProductName(1, products)).toBe('Pasta');
    expect(resolveMealPrepProductName(null, products)).toBe('No product selected');
    expect(resolveMealPrepProductName(99, products)).toBe('No product selected');

    expect(resolveProductPickerSelectedIds(null, [], [])).toEqual([]);
    expect(resolveProductPickerSelectedIds({ kind: 'dish', index: 0 }, [{ productId: 1, qty: 1, qtyUnit: null }], [])).toEqual(['1']);
    expect(resolveProductPickerSelectedIds({ kind: 'meal', index: 0 }, [], [{ itemType: 'product', productId: null, dishId: null, qty: 1, qtyUnit: null }])).toEqual([]);
    expect(resolveProductPickerSelectedIds({ kind: 'dish', index: 4 }, [], [])).toEqual([]);

    expect(resolveNextSelectionId([{ id: 2 }, { id: 1 }], 1)).toBe(1);
    expect(resolveNextSelectionId([{ id: 2 }, { id: 1 }], 9)).toBe(2);
    expect(resolveNextSelectionId([], null)).toBeNull();
    expect(upsertById([{ id: 2 }, { id: 4 }], { id: 2 })).toEqual([{ id: 2 }, { id: 4 }]);
    expect(upsertById([{ id: 2 }, { id: 4 }], { id: 3 })).toEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
  });
});
