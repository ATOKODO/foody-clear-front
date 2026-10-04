import { UiEmptyState } from '../../app/ui/empty-state/empty-state';
import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { Language } from '../../app/i18n/language';
import { UiModal } from '../../app/ui/modal/modal';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { SegmentedToggle } from '../../app/ui/segmented-toggle/segmented-toggle';
import {
  ProductList,
  ProductListItem,
} from '../../components/product/product-list/product-list';
import { MasterDetailLayout } from '../../components/shared/master-detail-layout/master-detail-layout';
import {
  MealPrepEntryType,
  PreparedDish,
  PreparedMeal,
  PreparedMealItem,
} from '../../interfaces/meal-prep.interface';
import { Product, ProductService } from '../../services/product-service';
import { MealPrepService } from '../../services/meal-prep-service';
import {
  DishDraftLine,
  MEAL_PREP_VIEW_OPTIONS,
  MealDraftLine,
  MealLineItemType,
  MealPrepView,
  ProductPickerTarget,
  QtyUnitOption,
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

@Component({
  selector: 'app-meal-prep',
  standalone: true,
  imports: [UiEmptyState, UiStatusBadge, UiButton, TranslatePipe, UiModal,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MasterDetailLayout,
    SegmentedToggle,
    UiErrorPanel,
    ProductList,
  ],
  templateUrl: './meal-prep.feature.html',
  styleUrl: './meal-prep.feature.scss',
  host: {
  },
})
export class MealPrepFeature implements OnInit {
  private readonly language = inject(Language);
  private readonly mealPrepSrv = inject(MealPrepService);
  private readonly productSrv = inject(ProductService);

  readonly viewOptions = MEAL_PREP_VIEW_OPTIONS;

  activeView: MealPrepView = 'dish';

  dishDraftName = '';
  mealDraftName = '';
  dishDraftLines: DishDraftLine[] = [createEmptyDishLine([])];
  mealDraftLines: MealDraftLine[] = [createEmptyMealLine([])];
  editingDishId: number | null = null;
  editingMealId: number | null = null;

  private readonly dishesState = signal<PreparedDish[]>([]);
  private readonly mealsState = signal<PreparedMeal[]>([]);
  private readonly productsState = signal<Product[]>([]);
  private readonly productListItemsState = computed<ProductListItem[]>(() =>
    buildMealPrepProductListItems(this.productsState()),
  );
  private readonly selectedDishIdState = signal<number | null>(null);
  private readonly selectedMealIdState = signal<number | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly lastErrorState = signal<unknown>(null);
  private readonly shoppingListFeedbackState = signal<string | null>(null);
  private readonly productPickerTargetState = signal<ProductPickerTarget | null>(null);
  private readonly editorOpenState = signal(false);

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
    this.productSrv.setBaseUrl(this.mealPrepSrv.baseUrl);
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

  get productListItems(): ProductListItem[] {
    return this.productListItemsState();
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

  get productPickerTarget(): ProductPickerTarget | null {
    return this.productPickerTargetState();
  }

  get isProductPickerOpen(): boolean {
    return this.productPickerTarget !== null;
  }

  get isEditorOpen(): boolean {
    return this.editorOpenState();
  }

  get productPickerSelectedIds(): string[] {
    return resolveProductPickerSelectedIds(
      this.productPickerTarget,
      this.dishDraftLines,
      this.mealDraftLines,
    );
  }

  get sortedProducts(): Product[] {
    return sortMealPrepProducts(this.products);
  }

  get sortedDishes(): PreparedDish[] {
    return sortMealPrepDishes(this.dishes);
  }

  get sortedMeals(): PreparedMeal[] {
    return sortMealPrepMeals(this.meals);
  }

  getDishQtyUnitOptions(line: DishDraftLine): QtyUnitOption[] {
    return getDishQtyUnitOptions(line, this.products);
  }

  getMealQtyUnitOptions(line: MealDraftLine): QtyUnitOption[] {
    return getMealQtyUnitOptions(line, this.products);
  }

  onDishProductChange(line: DishDraftLine, productId: number | null): void {
    Object.assign(line, selectDishLineProduct(line, productId, this.products));
  }

  onMealItemTypeChange(line: MealDraftLine, itemType: MealLineItemType): void {
    Object.assign(line, selectMealLineItemType(line, itemType, this.products));
  }

  onMealProductChange(line: MealDraftLine, productId: number | null): void {
    Object.assign(line, selectMealLineProduct(line, productId, this.products));
  }

  onMealDishChange(line: MealDraftLine, dishId: number | null): void {
    Object.assign(line, selectMealLineDish(line, dishId, this.products));
  }

  openDishProductPicker(index: number): void {
    if (!this.saving) {
      this.productPickerTargetState.set({ kind: 'dish', index });
    }
  }

  openMealProductPicker(index: number): void {
    if (!this.saving) {
      this.productPickerTargetState.set({ kind: 'meal', index });
    }
  }

  closeProductPicker(): void {
    this.productPickerTargetState.set(null);
  }

  onProductPicked(item: ProductListItem): void {
    const productId = Number(item.id);
    const target = this.productPickerTarget;

    if (!Number.isInteger(productId) || target === null) {
      return;
    }

    if (target.kind === 'dish') {
      const line = this.dishDraftLines[target.index];
      if (line) {
        this.onDishProductChange(line, productId);
      }
    } else {
      const line = this.mealDraftLines[target.index];
      if (line) {
        this.onMealProductChange(line, productId);
      }
    }

    this.closeProductPicker();
  }

  onEscapeKey(): void {
    if (this.isProductPickerOpen) {
      this.closeProductPicker();
      return;
    }

    this.closeEditor();
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
      next: ({ dishes, meals, products }) => this.handleScreenLoaded(dishes, meals, products),
      error: (error) => this.finishWithError(error, this.loadingState),
    });
  }

  openCreateDishEditor(): void {
    if (this.saving) {
      return;
    }

    this.startNewDish();
    this.editorOpenState.set(true);
  }

  openSelectedDishEditor(id = this.selectedDish?.id ?? null): void {
    if (id == null || this.saving) {
      return;
    }

    this.selectDish(id);
    this.editorOpenState.set(true);
  }

  openCreateMealEditor(): void {
    if (this.saving) {
      return;
    }

    this.startNewMeal();
    this.editorOpenState.set(true);
  }

  openSelectedMealEditor(id = this.selectedMeal?.id ?? null): void {
    if (id == null || this.saving) {
      return;
    }

    this.selectMeal(id);
    this.editorOpenState.set(true);
  }

  closeEditor(): void {
    if (!this.saving) {
      this.editorOpenState.set(false);
    }
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
    this.applyDishDraft(createNewDishDraft(this.products));
    this.shoppingListFeedbackState.set(null);
  }

  startNewMeal(): void {
    this.applyMealDraft(createNewMealDraft(this.products));
    this.shoppingListFeedbackState.set(null);
  }

  addDishLine(): void {
    this.dishDraftLines = [...this.dishDraftLines, createEmptyDishLine(this.products)];
  }

  removeDishLine(index: number): void {
    this.dishDraftLines = removeDishDraftLine(this.dishDraftLines, index, this.products);
  }

  addMealLine(): void {
    this.mealDraftLines = [...this.mealDraftLines, createEmptyMealLine(this.products)];
  }

  removeMealLine(index: number): void {
    this.mealDraftLines = removeMealDraftLine(this.mealDraftLines, index, this.products);
  }

  canSaveDish(): boolean {
    return canSaveDishDraft(this.dishDraftName, this.dishDraftLines);
  }

  canSaveMeal(): boolean {
    return canSaveMealDraft(this.mealDraftName, this.mealDraftLines);
  }

  saveDish(): void {
    if (!this.canSaveDish() || this.saving) {
      return;
    }

    const payload = toCreatePreparedDishDto(this.dishDraftName, this.dishDraftLines);
    const request$ =
      this.editingDishId === null
        ? this.mealPrepSrv.createDish(payload)
        : this.mealPrepSrv.updateDish(this.editingDishId, payload);

    this.savingState.set(true);
    request$.subscribe({
      next: (dish) => {
        this.dishesState.set(upsertById(this.dishes, dish));
        this.selectDish(dish.id);
        this.editorOpenState.set(false);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error, this.savingState),
    });
  }

  saveMeal(): void {
    if (!this.canSaveMeal() || this.saving) {
      return;
    }

    const payload = toCreatePreparedMealDto(this.mealDraftName, this.mealDraftLines);
    const request$ =
      this.editingMealId === null
        ? this.mealPrepSrv.createMeal(payload)
        : this.mealPrepSrv.updateMeal(this.editingMealId, payload);

    this.savingState.set(true);
    request$.subscribe({
      next: (meal) => {
        this.mealsState.set(upsertById(this.meals, meal));
        this.selectMeal(meal.id);
        this.editorOpenState.set(false);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error, this.savingState),
    });
  }

  deleteSelectedDish(): void {
    const dish = this.selectedDish;
    if (dish === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.mealPrepSrv.removeDish(dish.id).subscribe({
      next: () => this.handleDishDeleted(dish.id),
      error: (error) => this.finishWithError(error, this.savingState),
    });
  }

  deleteSelectedMeal(): void {
    const meal = this.selectedMeal;
    if (meal === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.mealPrepSrv.removeMeal(meal.id).subscribe({
      next: () => this.handleMealDeleted(meal.id),
      error: (error) => this.finishWithError(error, this.savingState),
    });
  }

  createShoppingListFromSelectedDish(): void {
    const dish = this.selectedDish;
    if (dish === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListFeedbackState.set(null);
    this.mealPrepSrv
      .createShoppingListFromDish(dish.id, { name: `${dish.name} - achats` })
      .subscribe({
        next: (list) => {
          this.shoppingListFeedbackState.set(`Liste creee: ${list.name}`);
          this.savingState.set(false);
        },
        error: (error) => this.finishWithError(error, this.savingState),
      });
  }

  createShoppingListFromSelectedMeal(): void {
    const meal = this.selectedMeal;
    if (meal === null || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListFeedbackState.set(null);
    this.mealPrepSrv
      .createShoppingListFromMeal(meal.id, { name: `${meal.name} - achats` })
      .subscribe({
        next: (list) => {
          this.shoppingListFeedbackState.set(`Liste creee: ${list.name}`);
          this.savingState.set(false);
        },
        error: (error) => this.finishWithError(error, this.savingState),
      });
  }

  resolveLineLabel(line: PreparedMealItem): string {
    return resolveMealLineLabel(line, (message) => this.language.translate(message));
  }

  resolveTypeLabel(type: MealPrepEntryType): string {
    return resolveMealPrepTypeLabel(type);
  }

  resolveAvailabilityLabel(maxPreparations: number | null | undefined): string {
    return resolveMealPrepAvailabilityLabel(maxPreparations);
  }

  resolveProductName(productId: number | null): string {
    return resolveMealPrepProductName(productId, this.products, this.language.translate('No product selected'));
  }

  private handleScreenLoaded(
    dishes: PreparedDish[],
    meals: PreparedMeal[],
    products: Product[],
  ): void {
    this.dishesState.set(dishes);
    this.mealsState.set(meals);
    this.productsState.set(products);
    this.selectedDishIdState.set(resolveNextSelectionId(dishes, this.selectedDishIdState()));
    this.selectedMealIdState.set(resolveNextSelectionId(meals, this.selectedMealIdState()));

    if (this.selectedDish) {
      this.populateDishDraft(this.selectedDish);
    }
    if (this.selectedMeal) {
      this.populateMealDraft(this.selectedMeal);
    }

    this.loadingState.set(false);
  }

  private handleDishDeleted(dishId: number): void {
    const nextDishes = this.dishes.filter((dish) => dish.id !== dishId);
    this.dishesState.set(nextDishes);
    this.selectedDishIdState.set(nextDishes[0]?.id ?? null);
    if (nextDishes[0]) {
      this.populateDishDraft(nextDishes[0]);
    } else {
      this.startNewDish();
    }
    this.savingState.set(false);
  }

  private handleMealDeleted(mealId: number): void {
    const nextMeals = this.meals.filter((meal) => meal.id !== mealId);
    this.mealsState.set(nextMeals);
    this.selectedMealIdState.set(nextMeals[0]?.id ?? null);
    if (nextMeals[0]) {
      this.populateMealDraft(nextMeals[0]);
    } else {
      this.startNewMeal();
    }
    this.savingState.set(false);
  }

  private populateDishDraft(dish: PreparedDish): void {
    this.applyDishDraft(toDishDraftForm(dish, this.products));
  }

  private populateMealDraft(meal: PreparedMeal): void {
    this.applyMealDraft(toMealDraftForm(meal, this.products));
  }

  private applyDishDraft(draft: {
    editingDishId: number | null;
    dishDraftName: string;
    dishDraftLines: DishDraftLine[];
  }): void {
    this.editingDishId = draft.editingDishId;
    this.dishDraftName = draft.dishDraftName;
    this.dishDraftLines = draft.dishDraftLines;
  }

  private applyMealDraft(draft: {
    editingMealId: number | null;
    mealDraftName: string;
    mealDraftLines: MealDraftLine[];
  }): void {
    this.editingMealId = draft.editingMealId;
    this.mealDraftName = draft.mealDraftName;
    this.mealDraftLines = draft.mealDraftLines;
  }

  private finishWithError(error: unknown, state: { set(value: boolean): void }): void {
    this.lastErrorState.set(error);
    state.set(false);
  }
}
