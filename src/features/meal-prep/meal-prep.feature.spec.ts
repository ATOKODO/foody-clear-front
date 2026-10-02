import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { ProductListItem } from '../../components/product/product-list/product-list';
import type {
  PreparedDish,
  PreparedMeal,
} from '../../interfaces/meal-prep.interface';
import { MealPrepService } from '../../services/meal-prep-service';
import { ProductService } from '../../services/product-service';
import { MealPrepFeature } from './meal-prep.feature';

describe('MealPrepFeature', () => {
  let component: MealPrepFeature;
  let fixture: ComponentFixture<MealPrepFeature>;

  const products = [
    {
      id: 1,
      name: 'Pasta',
      unitType: 'Paquet' as const,
      quantityPerUnit: 500,
      quantityUnit: 'g' as const,
      portionUnit: 'portion' as const,
    },
    {
      id: 2,
      name: 'Tomato',
      unitType: 'Unite' as const,
      quantityPerUnit: 1,
      quantityUnit: 'unit' as const,
      portionUnit: null,
    },
  ];
  const dish: PreparedDish = {
    id: 10,
    name: 'Sauce',
    items: [{ id: 101, productId: 1, qty: 2, qtyUnit: 'g', product: products[0] }],
    availability: { isInStock: true, maxPreparations: 3, missingProducts: [] },
  };
  const secondDish: PreparedDish = {
    id: 11,
    name: 'Salad',
    items: [],
    availability: { isInStock: false, maxPreparations: 0, missingProducts: [] },
  };
  const meal: PreparedMeal = {
    id: 20,
    name: 'Dinner',
    items: [
      { id: 201, itemType: 'dish', dishId: 10, qty: 1, qtyUnit: 'unit', dish },
      { id: 202, itemType: 'product', productId: 2, qty: 2, qtyUnit: 'unit', product: products[1] },
    ],
    availability: { isInStock: true, maxPreparations: 2, missingProducts: [] },
  };
  const secondMeal: PreparedMeal = {
    id: 21,
    name: 'Breakfast',
    items: [],
  };

  const mealPrepServiceMock = {
    baseUrl: 'http://api.test.local/',
    findAllDishes: jasmine.createSpy('findAllDishes').and.returnValue(of([dish, secondDish])),
    findAllMeals: jasmine.createSpy('findAllMeals').and.returnValue(of([meal, secondMeal])),
    createDish: jasmine.createSpy('createDish').and.returnValue(of({ ...dish, id: 12, name: 'New dish' })),
    updateDish: jasmine.createSpy('updateDish').and.returnValue(of({ ...dish, name: 'Updated dish' })),
    removeDish: jasmine.createSpy('removeDish').and.returnValue(of(void 0)),
    createShoppingListFromDish: jasmine.createSpy('createShoppingListFromDish').and.returnValue(of({ id: 30, name: 'Sauce - achats', items: [] })),
    createMeal: jasmine.createSpy('createMeal').and.returnValue(of({ ...meal, id: 22, name: 'New meal' })),
    updateMeal: jasmine.createSpy('updateMeal').and.returnValue(of({ ...meal, name: 'Updated meal' })),
    removeMeal: jasmine.createSpy('removeMeal').and.returnValue(of(void 0)),
    createShoppingListFromMeal: jasmine.createSpy('createShoppingListFromMeal').and.returnValue(of({ id: 31, name: 'Dinner - achats', items: [] })),
  };
  const productServiceMock = {
    baseUrl: 'http://api.test.local/',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of(products)),
  };

  beforeEach(async () => {
    Object.values(mealPrepServiceMock).forEach((value) => {
      if (value && typeof value === 'function' && 'calls' in value) {
        (value as jasmine.Spy).calls.reset();
      }
    });
    mealPrepServiceMock.baseUrl = 'http://api.test.local/';
    mealPrepServiceMock.findAllDishes.and.returnValue(of([dish, secondDish]));
    mealPrepServiceMock.findAllMeals.and.returnValue(of([meal, secondMeal]));
    mealPrepServiceMock.createDish.and.returnValue(of({ ...dish, id: 12, name: 'New dish' }));
    mealPrepServiceMock.updateDish.and.returnValue(of({ ...dish, name: 'Updated dish' }));
    mealPrepServiceMock.removeDish.and.returnValue(of(void 0));
    mealPrepServiceMock.createShoppingListFromDish.and.returnValue(of({ id: 30, name: 'Sauce - achats', items: [] }));
    mealPrepServiceMock.createMeal.and.returnValue(of({ ...meal, id: 22, name: 'New meal' }));
    mealPrepServiceMock.updateMeal.and.returnValue(of({ ...meal, name: 'Updated meal' }));
    mealPrepServiceMock.removeMeal.and.returnValue(of(void 0));
    mealPrepServiceMock.createShoppingListFromMeal.and.returnValue(of({ id: 31, name: 'Dinner - achats', items: [] }));
    productServiceMock.setBaseUrl.calls.reset();
    productServiceMock.findAll.calls.reset();
    productServiceMock.findAll.and.returnValue(of(products));

    await TestBed.configureTestingModule({
      imports: [MealPrepFeature],
      providers: [
        { provide: MealPrepService, useValue: mealPrepServiceMock },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MealPrepFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  interface WritableState<T> {
    set(value: T): void;
  }

  interface MealPrepInternals {
    dishesState: WritableState<PreparedDish[]>;
    mealsState: WritableState<PreparedMeal[]>;
    selectedDishIdState: WritableState<number | null>;
    selectedMealIdState: WritableState<number | null>;
    savingState: WritableState<boolean>;
  }

  function internals(): MealPrepInternals {
    return component as unknown as MealPrepInternals;
  }

  it('loads the workspace and exposes sorted state and labels', () => {
    expect(component).toBeTruthy();
    expect(productServiceMock.setBaseUrl).toHaveBeenCalledWith('http://api.test.local/');
    expect(component.dishes).toEqual([dish, secondDish]);
    expect(component.meals).toEqual([meal, secondMeal]);
    expect(component.products).toEqual(products);
    expect(component.productListItems.map((item) => item.name)).toEqual(['Pasta', 'Tomato']);
    expect(component.sortedDishes.map((entry) => entry.name)).toEqual(['Salad', 'Sauce']);
    expect(component.sortedMeals.map((entry) => entry.name)).toEqual(['Breakfast', 'Dinner']);
    expect(component.sortedProducts.map((entry) => entry.name)).toEqual(['Pasta', 'Tomato']);
    expect(component.selectedDish).toBe(dish);
    expect(component.selectedMeal).toBe(meal);
    expect(component.loading).toBeFalse();
    expect(component.getDishQtyUnitOptions(component.dishDraftLines[0])).toHaveSize(5);
    expect(component.getMealQtyUnitOptions(component.mealDraftLines[0])).toEqual([
      { value: 'unit', label: 'Unit' },
    ]);
    expect(component.resolveLineLabel(meal.items[0])).toBe('Sauce');
    expect(component.resolveTypeLabel('dish')).toBe('Dish');
    expect(component.resolveAvailabilityLabel(null)).toBe('-');
    expect(component.resolveProductName(null)).toBe('No product selected');
  });

  it('changes views, editors, selections and picker targets', () => {
    component.onViewChange('meal');
    expect(component.activeView).toBe('meal');
    expect(component.shoppingListFeedback).toBeNull();

    component.openCreateDishEditor();
    expect(component.isEditorOpen).toBeTrue();
    expect(component.editingDishId).toBeNull();
    component.closeEditor();
    expect(component.isEditorOpen).toBeFalse();

    component.openSelectedDishEditor(10);
    expect(component.isEditorOpen).toBeTrue();
    expect(component.editingDishId).toBe(10);
    component.openSelectedMealEditor(20);
    expect(component.editingMealId).toBe(20);
    component.closeEditor();

    component.selectDish(11);
    expect(component.selectedDish?.id).toBe(11);
    component.selectDish(999);
    expect(component.selectedDish).toBeNull();
    component.selectMeal(21);
    expect(component.selectedMeal?.id).toBe(21);
    component.selectMeal(999);
    expect(component.selectedMeal).toBeNull();

    component.startNewDish();
    component.startNewMeal();
    expect(component.editingDishId).toBeNull();
    expect(component.editingMealId).toBeNull();
    component.addDishLine();
    component.removeDishLine(0);
    component.addMealLine();
    component.removeMealLine(0);

    component.openDishProductPicker(0);
    expect(component.productPickerTarget).toEqual({ kind: 'dish', index: 0 });
    component.onProductPicked({ id: '1' } as ProductListItem);
    expect(component.dishDraftLines[0].productId).toBe(1);
    component.openMealProductPicker(0);
    component.onProductPicked({ id: '2' } as ProductListItem);
    expect(component.mealDraftLines[0].productId).toBe(2);
    expect(component.isProductPickerOpen).toBeFalse();
    component.openDishProductPicker(0);
    component.onProductPicked({ id: 'not-a-number' } as ProductListItem);
    expect(component.isProductPickerOpen).toBeTrue();
    component.closeProductPicker();

    component.openDishProductPicker(0);
    component.onEscapeKey();
    expect(component.isProductPickerOpen).toBeFalse();
    component.openCreateDishEditor();
    component.onEscapeKey();
    expect(component.isEditorOpen).toBeFalse();
  });

  it('creates and updates dishes and meals', () => {
    component.startNewDish();
    component.dishDraftName = ' New dish ';
    component.dishDraftLines = [{ productId: 1, qty: 2, qtyUnit: 'g' }];
    expect(component.canSaveDish()).toBeTrue();
    component.saveDish();
    expect(mealPrepServiceMock.createDish).toHaveBeenCalledWith({
      name: 'New dish',
      items: [{ productId: 1, qty: 2, qtyUnit: 'g' }],
    });
    expect(component.isEditorOpen).toBeFalse();
    expect(component.selectedDish?.id).toBe(12);

    component.editingDishId = 12;
    component.dishDraftName = 'Updated dish';
    component.saveDish();
    expect(mealPrepServiceMock.updateDish).toHaveBeenCalled();

    component.startNewMeal();
    component.mealDraftName = ' New meal ';
    component.mealDraftLines = [
      { itemType: 'dish', productId: null, dishId: 10, qty: 1, qtyUnit: 'unit' },
      { itemType: 'product', productId: 1, dishId: null, qty: 2, qtyUnit: 'g' },
    ];
    expect(component.canSaveMeal()).toBeTrue();
    component.saveMeal();
    expect(mealPrepServiceMock.createMeal).toHaveBeenCalledWith({
      name: 'New meal',
      items: [
        { itemType: 'dish', productId: null, dishId: 10, qty: 1, qtyUnit: 'unit' },
        { itemType: 'product', productId: 1, dishId: null, qty: 2, qtyUnit: 'g' },
      ],
    });
    expect(component.selectedMeal?.id).toBe(22);

    component.editingMealId = 22;
    component.mealDraftName = 'Updated meal';
    component.saveMeal();
    expect(mealPrepServiceMock.updateMeal).toHaveBeenCalled();
  });

  it('deletes entries and creates shopping lists with fallback selection', () => {
    const state = internals();
    state.dishesState.set([dish, secondDish]);
    state.selectedDishIdState.set(10);
    component.deleteSelectedDish();
    expect(mealPrepServiceMock.removeDish).toHaveBeenCalledWith(10);
    expect(component.selectedDish?.id).toBe(11);

    state.mealsState.set([meal, secondMeal]);
    state.selectedMealIdState.set(20);
    component.deleteSelectedMeal();
    expect(mealPrepServiceMock.removeMeal).toHaveBeenCalledWith(20);
    expect(component.selectedMeal?.id).toBe(21);

    state.dishesState.set([secondDish]);
    state.selectedDishIdState.set(11);
    component.createShoppingListFromSelectedDish();
    expect(mealPrepServiceMock.createShoppingListFromDish).toHaveBeenCalledWith(11, {
      name: 'Salad - achats',
    });
    expect(component.shoppingListFeedback).toBe('Liste creee: Sauce - achats');

    state.mealsState.set([secondMeal]);
    state.selectedMealIdState.set(21);
    component.createShoppingListFromSelectedMeal();
    expect(mealPrepServiceMock.createShoppingListFromMeal).toHaveBeenCalledWith(21, {
      name: 'Breakfast - achats',
    });
    expect(component.shoppingListFeedback).toBe('Liste creee: Dinner - achats');

    state.dishesState.set([]);
    state.selectedDishIdState.set(null);
    component.deleteSelectedDish();
    state.mealsState.set([]);
    state.selectedMealIdState.set(null);
    component.deleteSelectedMeal();
    component.createShoppingListFromSelectedDish();
    component.createShoppingListFromSelectedMeal();
  });

  it('ignores guarded actions and records loading and save errors', () => {
    const state = internals();
    state.savingState.set(true);
    component.openCreateDishEditor();
    component.openCreateMealEditor();
    component.openSelectedDishEditor(10);
    component.openSelectedMealEditor(20);
    component.closeEditor();
    component.openDishProductPicker(0);
    component.openMealProductPicker(0);
    expect(component.isEditorOpen).toBeFalse();
    expect(component.isProductPickerOpen).toBeFalse();
    state.savingState.set(false);

    component.dishDraftName = '';
    component.dishDraftLines = [{ productId: null, qty: 0, qtyUnit: null }];
    component.saveDish();
    component.mealDraftName = '';
    component.mealDraftLines = [{ itemType: 'dish', productId: null, dishId: null, qty: 0, qtyUnit: null }];
    component.saveMeal();

    const error = new Error('save failed');
    mealPrepServiceMock.createDish.and.returnValue(throwError(() => error));
    component.editingDishId = null;
    component.dishDraftName = 'Dish';
    component.dishDraftLines = [{ productId: 1, qty: 1, qtyUnit: 'g' }];
    component.saveDish();
    expect(component.lastError).toBe(error);
    expect(component.saving).toBeFalse();

    mealPrepServiceMock.createMeal.and.returnValue(throwError(() => error));
    component.editingMealId = null;
    component.mealDraftName = 'Meal';
    component.mealDraftLines = [{ itemType: 'product', productId: 1, dishId: null, qty: 1, qtyUnit: 'g' }];
    component.saveMeal();
    expect(component.lastError).toBe(error);

    mealPrepServiceMock.findAllDishes.and.returnValue(throwError(() => error));
    component.loadScreen();
    expect(component.lastError).toBe(error);
    expect(component.loading).toBeFalse();
  });

  it('handles delete and shopping-list errors and refreshes the screen', () => {
    const state = internals();
    const error = new Error('request failed');
    state.dishesState.set([dish]);
    state.selectedDishIdState.set(10);
    mealPrepServiceMock.removeDish.and.returnValue(throwError(() => error));
    component.deleteSelectedDish();
    expect(component.lastError).toBe(error);
    expect(component.saving).toBeFalse();

    state.mealsState.set([meal]);
    state.selectedMealIdState.set(20);
    mealPrepServiceMock.removeMeal.and.returnValue(throwError(() => error));
    component.deleteSelectedMeal();
    expect(component.lastError).toBe(error);

    mealPrepServiceMock.createShoppingListFromDish.and.returnValue(throwError(() => error));
    component.createShoppingListFromSelectedDish();
    expect(component.lastError).toBe(error);
    mealPrepServiceMock.createShoppingListFromMeal.and.returnValue(throwError(() => error));
    component.createShoppingListFromSelectedMeal();
    expect(component.lastError).toBe(error);

    mealPrepServiceMock.findAllDishes.and.returnValue(of([dish]));
    mealPrepServiceMock.findAllMeals.and.returnValue(of([meal]));
    mealPrepServiceMock.findAllDishes.calls.reset();
    component.loadScreen();
    expect(mealPrepServiceMock.findAllDishes).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('covers meal line selection, picker selections, and empty delete fallbacks', () => {
    component.openCreateMealEditor();
    expect(component.isEditorOpen).toBeTrue();
    component.closeEditor();

    component.startNewMeal();
    component.addMealLine();
    const mealLine = component.mealDraftLines[0];
    component.onMealItemTypeChange(mealLine, 'product');
    component.onMealProductChange(mealLine, 1);
    component.onMealItemTypeChange(mealLine, 'dish');
    component.onMealDishChange(mealLine, 10);

    component.startNewDish();
    component.addDishLine();
    component.openDishProductPicker(0);
    expect(component.productPickerSelectedIds).toEqual([]);
    component.onProductPicked({ id: '1' } as ProductListItem);
    component.openMealProductPicker(0);
    expect(component.productPickerSelectedIds).toEqual([]);
    component.onProductPicked({ id: '2' } as ProductListItem);
    expect(component.productPickerSelectedIds).toEqual([]);

    const state = internals();
    state.dishesState.set([dish]);
    state.selectedDishIdState.set(10);
    component.deleteSelectedDish();
    expect(component.dishes).toEqual([]);
    expect(component.editingDishId).toBeNull();

    state.mealsState.set([meal]);
    state.selectedMealIdState.set(20);
    component.deleteSelectedMeal();
    expect(component.meals).toEqual([]);
    expect(component.editingMealId).toBeNull();
  });
});
