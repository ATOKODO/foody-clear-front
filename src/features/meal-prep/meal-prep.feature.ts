import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from '../../app/ui/segmented-toggle/segmented-toggle';
import {
  CreatePreparedDishDto,
  CreatePreparedMealDto,
  MealPrepEntryType,
  PreparedDish,
  PreparedMeal,
  PreparedMealItem,
} from '../../interfaces/meal-prep.interface';
import { ProductQuantityInputUnit } from '../../interfaces/inventory.interface';
import { Product, ProductService } from '../../services/product-service';
import { MealPrepService } from '../../services/meal-prep-service';

type MealPrepView = 'dish' | 'meal';

interface DishDraftLine {
  productId: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
}

interface MealDraftLine {
  itemType: 'product' | 'dish';
  productId: number | null;
  dishId: number | null;
  qty: number;
  qtyUnit: ProductQuantityInputUnit | null;
}

const VIEW_OPTIONS: readonly SegmentedToggleOption<MealPrepView>[] = [
  { value: 'dish', label: 'Plats' },
  { value: 'meal', label: 'Repas' },
];

@Component({
  selector: 'app-meal-prep',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SegmentedToggle,
    UiErrorPanel,
  ],
  templateUrl: './meal-prep.feature.html',
  styleUrl: './meal-prep.feature.scss',
})
export class MealPrepFeature implements OnInit {
  private readonly mealPrepSrv = inject(MealPrepService);
  private readonly productSrv = inject(ProductService);

  readonly viewOptions = VIEW_OPTIONS;
  readonly qtyUnitOptions: ProductQuantityInputUnit[] = [
    'mg',
    'g',
    'kg',
    'ml',
    'l',
    'unit',
    'pack',
    'tranche',
    'piece',
    'part',
    'bouteille',
    'portion',
  ];

  baseUrl = '';
  activeView: MealPrepView = 'dish';

  dishDraftName = '';
  mealDraftName = '';
  dishDraftLines: DishDraftLine[] = [this.createEmptyDishLine()];
  mealDraftLines: MealDraftLine[] = [this.createEmptyMealLine()];
  editingDishId: number | null = null;
  editingMealId: number | null = null;

  private readonly dishesState = signal<PreparedDish[]>([]);
  private readonly mealsState = signal<PreparedMeal[]>([]);
  private readonly productsState = signal<Product[]>([]);
  private readonly selectedDishIdState = signal<number | null>(null);
  private readonly selectedMealIdState = signal<number | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly lastErrorState = signal<unknown>(null);
  private readonly shoppingListFeedbackState = signal<string | null>(null);

  readonly selectedDishState = computed(
    () =>
      this.dishesState().find((dish) => dish.id === this.selectedDishIdState()) ??
      null,
  );
  readonly selectedMealState = computed(
    () =>
      this.mealsState().find((meal) => meal.id === this.selectedMealIdState()) ??
      null,
  );

  ngOnInit(): void {
    this.baseUrl = this.mealPrepSrv.baseUrl;
    this.syncBaseUrls();
    this.loadScreen();
  }

  get dishes(): PreparedDish[] {
    return this.dishesState();
  }

  get meals(): PreparedMeal[] {
    return this.mealsState();
  }

  get products(): Product[] {
    return this.productsState();
  }

  get selectedDish(): PreparedDish | null {
    return this.selectedDishState();
  }

  get selectedMeal(): PreparedMeal | null {
    return this.selectedMealState();
  }

  get loading(): boolean {
    return this.loadingState();
  }

  get saving(): boolean {
    return this.savingState();
  }

  get lastError(): unknown {
    return this.lastErrorState();
  }

  get shoppingListFeedback(): string | null {
    return this.shoppingListFeedbackState();
  }

  get sortedProducts(): Product[] {
    return [...this.products].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedDishes(): PreparedDish[] {
    return [...this.dishes].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedMeals(): PreparedMeal[] {
    return [...this.meals].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  onBaseUrlChange(): void {
    this.syncBaseUrls();
    this.loadScreen();
  }

  onViewChange(view: MealPrepView): void {
    this.activeView = view;
    this.shoppingListFeedbackState.set(null);
  }

  loadScreen(): void {
    this.loadingState.set(true);
    this.lastErrorState.set(null);

    forkJoin({
      dishes: this.mealPrepSrv.findAllDishes(),
      meals: this.mealPrepSrv.findAllMeals(),
      products: this.productSrv.findAll(),
    }).subscribe({
      next: ({ dishes, meals, products }) => {
        this.dishesState.set(dishes);
        this.mealsState.set(meals);
        this.productsState.set(products);
        this.selectedDishIdState.set(this.resolveNextSelectionId(dishes, this.selectedDishIdState()));
        this.selectedMealIdState.set(this.resolveNextSelectionId(meals, this.selectedMealIdState()));
        if (this.selectedDish) {
          this.populateDishDraft(this.selectedDish);
        }
        if (this.selectedMeal) {
          this.populateMealDraft(this.selectedMeal);
        }
        this.loadingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.loadingState.set(false);
      },
    });
  }

  selectDish(id: number): void {
    this.selectedDishIdState.set(id);
    const dish = this.dishes.find((entry) => entry.id === id) ?? null;
    if (dish) {
      this.populateDishDraft(dish);
    }
    this.shoppingListFeedbackState.set(null);
  }

  selectMeal(id: number): void {
    this.selectedMealIdState.set(id);
    const meal = this.meals.find((entry) => entry.id === id) ?? null;
    if (meal) {
      this.populateMealDraft(meal);
    }
    this.shoppingListFeedbackState.set(null);
  }

  startNewDish(): void {
    this.editingDishId = null;
    this.dishDraftName = '';
    this.dishDraftLines = [this.createEmptyDishLine()];
    this.shoppingListFeedbackState.set(null);
  }

  startNewMeal(): void {
    this.editingMealId = null;
    this.mealDraftName = '';
    this.mealDraftLines = [this.createEmptyMealLine()];
    this.shoppingListFeedbackState.set(null);
  }

  addDishLine(): void {
    this.dishDraftLines = [...this.dishDraftLines, this.createEmptyDishLine()];
  }

  removeDishLine(index: number): void {
    this.dishDraftLines =
      this.dishDraftLines.length === 1
        ? [this.createEmptyDishLine()]
        : this.dishDraftLines.filter((_, lineIndex) => lineIndex !== index);
  }

  addMealLine(): void {
    this.mealDraftLines = [...this.mealDraftLines, this.createEmptyMealLine()];
  }

  removeMealLine(index: number): void {
    this.mealDraftLines =
      this.mealDraftLines.length === 1
        ? [this.createEmptyMealLine()]
        : this.mealDraftLines.filter((_, lineIndex) => lineIndex !== index);
  }

  canSaveDish(): boolean {
    return (
      this.dishDraftName.trim() !== '' &&
      this.dishDraftLines.some((line) => line.productId !== null && line.qty > 0)
    );
  }

  canSaveMeal(): boolean {
    return (
      this.mealDraftName.trim() !== '' &&
      this.mealDraftLines.some((line) =>
        line.qty > 0 &&
        ((line.itemType === 'product' && line.productId !== null) ||
          (line.itemType === 'dish' && line.dishId !== null)),
      )
    );
  }

  saveDish(): void {
    if (!this.canSaveDish() || this.saving) {
      return;
    }

    const payload: CreatePreparedDishDto = {
      name: this.dishDraftName.trim(),
      items: this.dishDraftLines
        .filter((line) => line.productId !== null && line.qty > 0)
        .map((line) => ({
          productId: line.productId!,
          qty: line.qty,
          qtyUnit: line.qtyUnit,
        })),
    };

    this.savingState.set(true);
    const request$ = this.editingDishId === null
      ? this.mealPrepSrv.createDish(payload)
      : this.mealPrepSrv.updateDish(this.editingDishId, payload);

    request$.subscribe({
      next: (dish) => {
        const nextDishes = this.upsertById(this.dishes, dish);
        this.dishesState.set(nextDishes);
        this.selectDish(dish.id);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  saveMeal(): void {
    if (!this.canSaveMeal() || this.saving) {
      return;
    }

    const payload: CreatePreparedMealDto = {
      name: this.mealDraftName.trim(),
      items: this.mealDraftLines
        .filter((line) =>
          line.qty > 0 &&
          ((line.itemType === 'product' && line.productId !== null) ||
            (line.itemType === 'dish' && line.dishId !== null)),
        )
        .map((line) => ({
          itemType: line.itemType,
          productId: line.itemType === 'product' ? line.productId : null,
          dishId: line.itemType === 'dish' ? line.dishId : null,
          qty: line.qty,
          qtyUnit: line.qtyUnit,
        })),
    };

    this.savingState.set(true);
    const request$ = this.editingMealId === null
      ? this.mealPrepSrv.createMeal(payload)
      : this.mealPrepSrv.updateMeal(this.editingMealId, payload);

    request$.subscribe({
      next: (meal) => {
        const nextMeals = this.upsertById(this.meals, meal);
        this.mealsState.set(nextMeals);
        this.selectMeal(meal.id);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  deleteSelectedDish(): void {
    if (this.selectedDish === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.mealPrepSrv.removeDish(this.selectedDish.id).subscribe({
      next: () => {
        const nextDishes = this.dishes.filter((dish) => dish.id !== this.selectedDish!.id);
        this.dishesState.set(nextDishes);
        this.selectedDishIdState.set(nextDishes[0]?.id ?? null);
        if (nextDishes[0]) {
          this.populateDishDraft(nextDishes[0]);
        } else {
          this.startNewDish();
        }
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  deleteSelectedMeal(): void {
    if (this.selectedMeal === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.mealPrepSrv.removeMeal(this.selectedMeal.id).subscribe({
      next: () => {
        const nextMeals = this.meals.filter((meal) => meal.id !== this.selectedMeal!.id);
        this.mealsState.set(nextMeals);
        this.selectedMealIdState.set(nextMeals[0]?.id ?? null);
        if (nextMeals[0]) {
          this.populateMealDraft(nextMeals[0]);
        } else {
          this.startNewMeal();
        }
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  createShoppingListFromSelectedDish(): void {
    if (this.selectedDish === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListFeedbackState.set(null);
    this.mealPrepSrv
      .createShoppingListFromDish(this.selectedDish.id, {
        name: `${this.selectedDish.name} - achats`,
      })
      .subscribe({
        next: (list) => {
          this.shoppingListFeedbackState.set(`Liste creee: ${list.name}`);
          this.savingState.set(false);
        },
        error: (error) => {
          this.lastErrorState.set(error);
          this.savingState.set(false);
        },
      });
  }

  createShoppingListFromSelectedMeal(): void {
    if (this.selectedMeal === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListFeedbackState.set(null);
    this.mealPrepSrv
      .createShoppingListFromMeal(this.selectedMeal.id, {
        name: `${this.selectedMeal.name} - achats`,
      })
      .subscribe({
        next: (list) => {
          this.shoppingListFeedbackState.set(`Liste creee: ${list.name}`);
          this.savingState.set(false);
        },
        error: (error) => {
          this.lastErrorState.set(error);
          this.savingState.set(false);
        },
      });
  }

  resolveLineLabel(line: PreparedMealItem): string {
    if (line.itemType === 'dish') {
      return line.dish?.name ?? `Plat #${line.dishId ?? '-'}`;
    }

    return line.product?.name ?? `Produit #${line.productId ?? '-'}`;
  }

  resolveTypeLabel(type: MealPrepEntryType): string {
    if (type === 'dish') {
      return 'Plat';
    }
    if (type === 'meal') {
      return 'Repas';
    }
    return 'Produit';
  }

  resolveAvailabilityLabel(maxPreparations: number | null | undefined): string {
    if (typeof maxPreparations !== 'number' || Number.isNaN(maxPreparations)) {
      return '-';
    }

    return `${maxPreparations}`;
  }

  private populateDishDraft(dish: PreparedDish): void {
    this.editingDishId = dish.id;
    this.dishDraftName = dish.name;
    this.dishDraftLines =
      dish.items.length > 0
        ? dish.items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            qtyUnit: item.qtyUnit ?? null,
          }))
        : [this.createEmptyDishLine()];
  }

  private populateMealDraft(meal: PreparedMeal): void {
    this.editingMealId = meal.id;
    this.mealDraftName = meal.name;
    this.mealDraftLines =
      meal.items.length > 0
        ? meal.items.map((item) => ({
            itemType: item.itemType,
            productId: item.productId ?? null,
            dishId: item.dishId ?? null,
            qty: item.qty,
            qtyUnit: item.qtyUnit ?? null,
          }))
        : [this.createEmptyMealLine()];
  }

  private createEmptyDishLine(): DishDraftLine {
    return {
      productId: null,
      qty: 1,
      qtyUnit: null,
    };
  }

  private createEmptyMealLine(): MealDraftLine {
    return {
      itemType: 'dish',
      productId: null,
      dishId: null,
      qty: 1,
      qtyUnit: null,
    };
  }

  private syncBaseUrls(): void {
    this.mealPrepSrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
  }

  private resolveNextSelectionId<T extends { id: number }>(
    entries: T[],
    currentId: number | null,
  ): number | null {
    if (currentId !== null && entries.some((entry) => entry.id === currentId)) {
      return currentId;
    }

    return entries[0]?.id ?? null;
  }

  private upsertById<T extends { id: number }>(entries: T[], nextEntry: T): T[] {
    const withoutCurrent = entries.filter((entry) => entry.id !== nextEntry.id);
    return [...withoutCurrent, nextEntry].sort((left, right) => left.id - right.id);
  }
}
