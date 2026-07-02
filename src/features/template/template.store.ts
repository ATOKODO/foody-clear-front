import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import type { TemplateItemDraft, TemplateFormSubmittedEvent } from '../../components/template/template-form/template-form';
import type { DaySet } from '../../interfaces/day-set.interface';
import type { PreparedDish, PreparedMeal } from '../../interfaces/meal-prep.interface';
import type { Slot } from '../../interfaces/slot.interface';
import type { Template } from '../../interfaces/template.interface';
import type { Product as ProductApiModel } from '../../services/product-service';
import { DaySetService } from '../../services/day-set-service';
import { MealPrepService } from '../../services/meal-prep-service';
import { ProductService } from '../../services/product-service';
import { SlotService } from '../../services/slot-service';
import { TemplateService } from '../../services/template-service';
import {
  TEMPLATE_QTY_UNIT_OPTIONS,
  resolveTemplateSelectionAfterListLoad,
  sortTemplateDaySets,
  sortTemplateDishes,
  sortTemplateMeals,
  sortTemplateProducts,
  sortTemplateSlots,
  syncTemplateInCollection,
  toCreateTemplateItemDto,
} from './template.viewmodel';

@Injectable()
export class TemplateFeatureStore {
  private readonly templateSrv = inject(TemplateService);
  private readonly productSrv = inject(ProductService);
  private readonly daySetSrv = inject(DaySetService);
  private readonly slotSrv = inject(SlotService);
  private readonly mealPrepSrv = inject(MealPrepService);

  readonly qtyUnitOptions = [...TEMPLATE_QTY_UNIT_OPTIONS];

  baseUrl = '';
  lastResponse: unknown = null;

  private readonly templatesState = signal<Template[]>([]);
  private readonly productsState = signal<ProductApiModel[]>([]);
  private readonly dishesState = signal<PreparedDish[]>([]);
  private readonly mealsState = signal<PreparedMeal[]>([]);
  private readonly daySetsState = signal<DaySet[]>([]);
  private readonly slotsState = signal<Slot[]>([]);
  private readonly selectedTemplateIdState = signal<number | null>(null);
  private readonly selectedTemplateState = signal<Template | null>(null);
  private readonly compareDaySetIdState = signal<number | null>(null);
  private readonly loadingTemplatesState = signal(false);
  private readonly loadingProductsState = signal(false);
  private readonly loadingMealPrepState = signal(false);
  private readonly loadingDaySetsState = signal(false);
  private readonly loadingSlotsState = signal(false);
  private readonly savingTemplateState = signal(false);
  private readonly savingItemState = signal(false);
  private readonly lastErrorState = signal<unknown>(null);
  private readonly itemErrorState = signal<string | null>(null);

  private readonly productOptionsState = computed<ProductApiModel[]>(() =>
    sortTemplateProducts(this.productsState()),
  );
  private readonly dishOptionsState = computed<PreparedDish[]>(() =>
    sortTemplateDishes(this.dishesState()),
  );
  private readonly mealOptionsState = computed<PreparedMeal[]>(() =>
    sortTemplateMeals(this.mealsState()),
  );
  private readonly daySetOptionsState = computed<DaySet[]>(() =>
    sortTemplateDaySets(this.daySetsState()),
  );
  private readonly slotOptionsState = computed<Slot[]>(() =>
    sortTemplateSlots(this.slotsState()),
  );
  private readonly busyState = computed(
    () =>
      this.loadingTemplates ||
      this.loadingProducts ||
      this.loadingMealPrep ||
      this.loadingDaySets ||
      this.loadingSlots ||
      this.savingTemplate ||
      this.savingItem,
  );

  init(): void {
    this.baseUrl = this.templateSrv.baseUrl;
    this.syncBaseUrls();
    this.loadWorkspace({ autoSelectFirst: true });
  }

  get templates(): Template[] {
    return this.templatesState();
  }

  set templates(value: Template[]) {
    this.templatesState.set(value);
  }

  get products(): ProductApiModel[] {
    return this.productsState();
  }

  set products(value: ProductApiModel[]) {
    this.productsState.set(value);
  }

  get dishes(): PreparedDish[] {
    return this.dishesState();
  }

  set dishes(value: PreparedDish[]) {
    this.dishesState.set(value);
  }

  get meals(): PreparedMeal[] {
    return this.mealsState();
  }

  set meals(value: PreparedMeal[]) {
    this.mealsState.set(value);
  }

  get daySets(): DaySet[] {
    return this.daySetsState();
  }

  set daySets(value: DaySet[]) {
    this.daySetsState.set(value);
  }

  get slots(): Slot[] {
    return this.slotsState();
  }

  set slots(value: Slot[]) {
    this.slotsState.set(value);
  }

  get selectedTemplateId(): number | null {
    return this.selectedTemplateIdState();
  }

  set selectedTemplateId(value: number | null) {
    this.selectedTemplateIdState.set(value);
  }

  get selectedTemplate(): Template | null {
    return this.selectedTemplateState();
  }

  set selectedTemplate(value: Template | null) {
    this.selectedTemplateState.set(value);
  }

  get compareDaySetId(): number | null {
    return this.compareDaySetIdState();
  }

  set compareDaySetId(value: number | null) {
    this.compareDaySetIdState.set(value);
  }

  get loadingTemplates(): boolean {
    return this.loadingTemplatesState();
  }

  set loadingTemplates(value: boolean) {
    this.loadingTemplatesState.set(value);
  }

  get loadingProducts(): boolean {
    return this.loadingProductsState();
  }

  set loadingProducts(value: boolean) {
    this.loadingProductsState.set(value);
  }

  get loadingMealPrep(): boolean {
    return this.loadingMealPrepState();
  }

  set loadingMealPrep(value: boolean) {
    this.loadingMealPrepState.set(value);
  }

  get loadingDaySets(): boolean {
    return this.loadingDaySetsState();
  }

  set loadingDaySets(value: boolean) {
    this.loadingDaySetsState.set(value);
  }

  get loadingSlots(): boolean {
    return this.loadingSlotsState();
  }

  set loadingSlots(value: boolean) {
    this.loadingSlotsState.set(value);
  }

  get savingTemplate(): boolean {
    return this.savingTemplateState();
  }

  set savingTemplate(value: boolean) {
    this.savingTemplateState.set(value);
  }

  get savingItem(): boolean {
    return this.savingItemState();
  }

  set savingItem(value: boolean) {
    this.savingItemState.set(value);
  }

  get lastError(): unknown {
    return this.lastErrorState();
  }

  set lastError(value: unknown) {
    this.lastErrorState.set(value);
  }

  get itemError(): string | null {
    return this.itemErrorState();
  }

  set itemError(value: string | null) {
    this.itemErrorState.set(value);
  }

  get productOptions(): ProductApiModel[] {
    return this.productOptionsState();
  }

  get dishOptions(): PreparedDish[] {
    return this.dishOptionsState();
  }

  get mealOptions(): PreparedMeal[] {
    return this.mealOptionsState();
  }

  get daySetOptions(): DaySet[] {
    return this.daySetOptionsState();
  }

  get slotOptions(): Slot[] {
    return this.slotOptionsState();
  }

  get busy(): boolean {
    return this.busyState();
  }

  onBaseUrlChange(): void {
    this.syncBaseUrls();
    this.loadWorkspace({
      selectId: this.selectedTemplateId,
      autoSelectFirst: this.selectedTemplateId === null,
    });
  }

  onRefreshRequested(): void {
    this.loadWorkspace({
      selectId: this.selectedTemplateId,
      autoSelectFirst: false,
    });
  }

  selectTemplate(templateId: number): void {
    this.selectedTemplateId = templateId;
    this.loadSelectedTemplate();
  }

  onCompareDaySetChange(compareDaySetId: number | null): void {
    this.compareDaySetId = compareDaySetId;
    this.loadSelectedTemplate();
  }

  loadTemplateForEdit(
    templateId: number,
    onReady: (templateId: number) => void,
  ): void {
    if (!Number.isInteger(templateId) || templateId < 1) {
      return;
    }

    if (this.selectedTemplate?.id === templateId) {
      onReady(templateId);
      return;
    }

    this.loadingTemplates = true;
    this.templateSrv.findOne(templateId, this.compareDaySetId).subscribe({
      next: (response) => {
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.loadingTemplates = false;
        onReady(response.id);
      },
      error: (error) => {
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  saveTemplate(
    event: TemplateFormSubmittedEvent,
    editingTemplateId: number | null,
    onSaved: (template: Template) => void,
  ): void {
    const title = event.title.trim();
    if (title === '') {
      return;
    }

    this.savingTemplate = true;
    this.lastError = null;
    this.itemError = null;

    const request =
      event.mode === 'edit' && editingTemplateId !== null
        ? this.templateSrv.update(editingTemplateId, { title })
        : this.templateSrv.create({ title });

    request.subscribe({
      next: (response) => {
        this.handleTemplateSaved(response);
        onSaved(response);
      },
      error: (error) => this.finishTemplateSaveWithError(error),
    });
  }

  deleteTemplate(
    templateId: number,
    editingTemplateId: number | null,
    onDeletedEditedTemplate: () => void,
  ): void {
    if (!Number.isInteger(templateId) || templateId < 1) {
      return;
    }

    this.savingTemplate = true;
    this.lastError = null;
    this.itemError = null;

    this.templateSrv.remove(templateId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: templateId };
        this.savingTemplate = false;

        if (this.selectedTemplateId === templateId) {
          this.selectedTemplateId = null;
          this.selectedTemplate = null;
          this.compareDaySetId = null;
        }

        if (editingTemplateId === templateId) {
          onDeletedEditedTemplate();
        }

        this.loadTemplates({
          selectId: this.selectedTemplateId,
          autoSelectFirst: false,
        });
      },
      error: (error) => {
        this.lastError = error;
        this.savingTemplate = false;
      },
    });
  }

  saveItem(
    editingTemplateId: number | null,
    itemDraft: TemplateItemDraft,
    onSaved: (template: Template) => void,
  ): void {
    if (editingTemplateId === null) {
      return;
    }

    const payload = toCreateTemplateItemDto(itemDraft);

    this.savingItem = true;
    this.itemError = null;

    const request =
      itemDraft.id === null
        ? this.templateSrv.createItem(editingTemplateId, payload)
        : this.templateSrv.updateItem(editingTemplateId, itemDraft.id, payload);

    request.subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.savingItem = false;
        onSaved(response);
      },
      error: (error) => {
        this.lastError = error;
        this.itemError = 'Impossible de sauvegarder la ligne template.';
        this.savingItem = false;
      },
    });
  }

  deleteItem(editingTemplateId: number | null, itemId: number): void {
    if (editingTemplateId === null) {
      return;
    }

    this.savingItem = true;
    this.itemError = null;

    this.templateSrv.removeItem(editingTemplateId, itemId).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.savingItem = false;
      },
      error: (error) => {
        this.lastError = error;
        this.itemError = 'Impossible de supprimer la ligne template.';
        this.savingItem = false;
      },
    });
  }

  private syncBaseUrls(): void {
    this.templateSrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.mealPrepSrv.setBaseUrl(this.baseUrl);
  }

  private loadWorkspace(options?: {
    selectId?: number | null;
    autoSelectFirst?: boolean;
  }): void {
    this.loadProducts();
    this.loadMealPrepOptions();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates(options);
  }

  private loadTemplates(options?: {
    selectId?: number | null;
    autoSelectFirst?: boolean;
  }): void {
    const selectId = options?.selectId ?? this.selectedTemplateId;
    const autoSelectFirst = options?.autoSelectFirst ?? false;

    this.loadingTemplates = true;
    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templates = response;
        this.loadingTemplates = false;
        this.applyTemplateSelectionAfterListLoad(
          response,
          selectId,
          autoSelectFirst,
        );
      },
      error: (error) => {
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  private loadSelectedTemplate(): void {
    if (this.selectedTemplateId === null) {
      this.selectedTemplate = null;
      return;
    }

    this.loadingTemplates = true;
    this.templateSrv
      .findOne(this.selectedTemplateId, this.compareDaySetId)
      .subscribe({
        next: (response) => {
          this.selectedTemplate = response;
          this.syncTemplateInCollection(response);
          this.loadingTemplates = false;
        },
        error: (error) => {
          this.lastError = error;
          this.loadingTemplates = false;
        },
      });
  }

  private loadMealPrepOptions(): void {
    this.loadingMealPrep = true;
    forkJoin({
      dishes: this.mealPrepSrv.findAllDishes(),
      meals: this.mealPrepSrv.findAllMeals(),
    }).subscribe({
      next: ({ dishes, meals }) => {
        this.dishes = dishes;
        this.meals = meals;
        this.loadingMealPrep = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingMealPrep = false;
      },
    });
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = response;
        this.loadingProducts = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingProducts = false;
      },
    });
  }

  private loadDaySets(): void {
    this.loadingDaySets = true;
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
        this.loadingDaySets = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingDaySets = false;
      },
    });
  }

  private loadSlots(): void {
    this.loadingSlots = true;
    this.slotSrv.findAll().subscribe({
      next: (response) => {
        this.slots = response;
        this.loadingSlots = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingSlots = false;
      },
    });
  }

  private applyTemplateSelectionAfterListLoad(
    templates: Template[],
    selectId: number | null,
    autoSelectFirst: boolean,
  ): void {
    const nextSelection = resolveTemplateSelectionAfterListLoad({
      templates,
      selectId,
      autoSelectFirst,
    });

    this.selectedTemplateId = nextSelection.selectedTemplateId;
    if (this.selectedTemplateId !== null) {
      this.loadSelectedTemplate();
      return;
    }

    this.selectedTemplate = nextSelection.selectedTemplate;
    this.compareDaySetId = nextSelection.compareDaySetId;
  }

  private handleTemplateSaved(template: Template): void {
    this.lastResponse = template;
    this.savingTemplate = false;
    this.selectedTemplateId = template.id;
    this.selectedTemplate = template;
    this.loadTemplates({ selectId: template.id, autoSelectFirst: false });
  }

  private finishTemplateSaveWithError(error: unknown): void {
    this.lastError = error;
    this.savingTemplate = false;
  }

  private syncTemplateInCollection(template: Template): void {
    this.templates = syncTemplateInCollection(this.templates, template);
  }
}
