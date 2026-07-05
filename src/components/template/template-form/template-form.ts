import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProductQuantityInputUnit } from '../../../interfaces/input-day.interface';
import { PreparedDish, PreparedMeal } from '../../../interfaces/meal-prep.interface';
import { Slot } from '../../../interfaces/slot.interface';
import { Template, TemplateItem } from '../../../interfaces/template.interface';
import { PortionUnit, Product as ProductApiModel } from '../../../services/product-service';

export type TemplateFormMode = 'add' | 'edit';

export interface TemplateItemDraft {
  id: number | null;
  itemType: 'product' | 'dish' | 'meal';
  productId: number | null;
  dishId: number | null;
  mealId: number | null;
  qty: number | null;
  qtyUnit: ProductQuantityInputUnit | null;
  slotId: number | null;
  slotKey: string;
  preferredTime: string;
}

export interface TemplateFormSubmittedEvent {
  mode: TemplateFormMode;
  title: string;
}

@Component({
  selector: 'app-template-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './template-form.html',
  styleUrl: './template-form.scss',
})
export class TemplateForm implements OnInit, OnChanges {
  readonly mode = input<TemplateFormMode>('add');
  readonly template = input<Template | null>(null);
  readonly products = input<ProductApiModel[]>([]);
  readonly dishes = input<PreparedDish[]>([]);
  readonly meals = input<PreparedMeal[]>([]);
  readonly slots = input<Slot[]>([]);
  readonly qtyUnitOptions = input<ProductQuantityInputUnit[]>([]);
  readonly savingTemplate = input(false);
  readonly savingItem = input(false);
  readonly itemError = input<string | null>(null);

  readonly templateSubmitted = output<TemplateFormSubmittedEvent>();
  readonly templateDeleted = output<number>();
  readonly itemSubmitted = output<TemplateItemDraft>();
  readonly itemDeleted = output<number>();

  private readonly itemDraftState = signal<TemplateItemDraft>(
    this.buildEmptyItemDraft(),
  );

  draftTitle = '';

  get itemDraft(): TemplateItemDraft {
    return this.itemDraftState();
  }

  set itemDraft(value: TemplateItemDraft) {
    this.itemDraftState.set(value);
  }

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['template']) {
      this.applyInputState();
    }
  }

  get canSaveTemplate(): boolean {
    return this.draftTitle.trim() !== '' && !this.savingTemplate();
  }

  get canSaveItem(): boolean {
    return (
      this.template() !== null &&
      this.itemDraft.qty !== null &&
      this.itemDraft.qty > 0 &&
      this.hasSelectedSource() &&
      !this.savingItem()
    );
  }

  get sortedProducts(): ProductApiModel[] {
    return [...this.products()].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedDishes(): PreparedDish[] {
    return [...this.dishes()].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedMeals(): PreparedMeal[] {
    return [...this.meals()].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedSlots(): Slot[] {
    return [...this.slots()].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  getAvailableQtyUnitOptions(): { value: ProductQuantityInputUnit; label: string }[] {
    if (this.itemDraft.itemType !== 'product') {
      return this.qtyUnitOptions().map((unit) => ({ value: unit, label: unit }));
    }

    const product = this.sortedProducts.find((item) => item.id === this.itemDraft.productId) ?? null;
    return this.buildProductQtyUnitOptions(product);
  }

  onTemplateSave(): void {
    const title = this.draftTitle.trim();
    if (title === '') {
      return;
    }

    this.templateSubmitted.emit({
      mode: this.mode(),
      title,
    });
  }

  onTemplateDelete(): void {
    const template = this.template();
    if (!template) {
      return;
    }

    this.templateDeleted.emit(template.id);
  }

  editItem(item: TemplateItem): void {
    const nextDraft: TemplateItemDraft = {
      id: item.id,
      itemType: item.itemType ?? this.resolveItemType(item),
      productId: item.productId ?? null,
      dishId: item.dishId ?? null,
      mealId: item.mealId ?? null,
      qty: item.qty,
      qtyUnit: item.qtyUnit,
      slotId: item.slotId,
      slotKey: item.slotKey ?? '',
      preferredTime: this.formatPreferredTime(item.preferredTime),
    };

    if (nextDraft.itemType === 'product') {
      nextDraft.qtyUnit = this.normalizeQtyUnitSelection(
        nextDraft.qtyUnit,
        this.buildProductQtyUnitOptions(
          this.sortedProducts.find((product) => product.id === nextDraft.productId) ?? null,
        ),
      );
    }

    this.itemDraft = nextDraft;
  }

  updateItemDraft(patch: Partial<TemplateItemDraft>): void {
    const nextDraft = {
      ...this.itemDraft,
      ...patch,
    };

    if (Object.prototype.hasOwnProperty.call(patch, 'itemType')) {
      nextDraft.productId = null;
      nextDraft.dishId = null;
      nextDraft.mealId = null;
    }

    if (nextDraft.itemType === 'product') {
      nextDraft.qtyUnit = this.normalizeQtyUnitSelection(
        nextDraft.qtyUnit,
        this.buildProductQtyUnitOptions(
          this.sortedProducts.find((item) => item.id === nextDraft.productId) ?? null,
        ),
      );
    }

    this.itemDraft = nextDraft;
  }

  onItemSave(): void {
    if (!this.canSaveItem) {
      return;
    }

    const itemDraft = this.itemDraft;
    this.itemSubmitted.emit({
      id: itemDraft.id,
      itemType: itemDraft.itemType,
      productId: itemDraft.productId,
      dishId: itemDraft.dishId,
      mealId: itemDraft.mealId,
      qty: itemDraft.qty,
      qtyUnit: itemDraft.qtyUnit,
      slotId: itemDraft.slotId,
      slotKey: itemDraft.slotKey,
      preferredTime: itemDraft.preferredTime,
    });
  }

  onItemDelete(itemId: number): void {
    this.itemDeleted.emit(itemId);
  }

  resetItemDraft(): void {
    this.itemDraft = this.buildEmptyItemDraft();
  }

  resolveTemplateItemSlotLabel(item: TemplateItem): string {
    if (item.slotId !== null) {
      const slot =
        this.sortedSlots.find((candidate) => candidate.id === item.slotId) ??
        null;
      if (slot) {
        return `${slot.sortOrder}. ${slot.title}`;
      }
    }

    return item.slotKey?.trim() || 'No slot';
  }

  resolveTemplateItemLabel(item: TemplateItem): string {
    return (
      item.displayName ??
      item.mealName ??
      item.dishName ??
      item.productName ??
      'Element sans nom'
    );
  }

  resolveTemplateItemTypeLabel(item: TemplateItem): string {
    const itemType = item.itemType ?? this.resolveItemType(item);
    if (itemType === 'meal') {
      return 'Repas';
    }
    if (itemType === 'dish') {
      return 'Plat';
    }
    return 'Produit';
  }

  formatPreferredTime(value: string | null | undefined): string {
    const preferredTime = value?.trim() || '06:00';
    return preferredTime.slice(0, 5);
  }

  formatNutritionAmount(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 2,
    }).format(rounded);
  }

  private applyInputState(): void {
    const template = this.template();
    if (this.mode() === 'edit' && template) {
      this.draftTitle = template.title;
      this.resetItemDraft();
      return;
    }

    this.draftTitle = '';
    this.resetItemDraft();
  }

  private buildEmptyItemDraft(): TemplateItemDraft {
    return {
      id: null,
      itemType: 'product',
      productId: null,
      dishId: null,
      mealId: null,
      qty: null,
      qtyUnit: null,
      slotId: null,
      slotKey: '',
      preferredTime: '06:00',
    };
  }

  private buildProductQtyUnitOptions(
    product: ProductApiModel | null,
  ): { value: ProductQuantityInputUnit; label: string }[] {
    const options: { value: ProductQuantityInputUnit; label: string }[] = [];
    const seen = new Set<ProductQuantityInputUnit>();

    const pushOption = (value: ProductQuantityInputUnit | null, label: string): void => {
      if (value === null || seen.has(value)) {
        return;
      }

      seen.add(value);
      options.push({ value, label });
    };

    const unitType = product?.unitType?.trim();
    pushOption('unit', unitType ? `Product unit (${unitType})` : 'Product unit');

    const portionUnit = this.normalizePortionQtyUnit(product?.portionUnit);
    if (portionUnit) {
      pushOption(portionUnit, this.toTitleCase(portionUnit));
    }

    pushOption('g', 'G (Gramme)');

    return options;
  }

  private normalizePortionQtyUnit(value: PortionUnit | null | undefined): ProductQuantityInputUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim().toLowerCase();
    const allowed: ProductQuantityInputUnit[] = ['tranche', 'piece', 'part', 'bouteille', 'portion'];
    return allowed.includes(candidate as ProductQuantityInputUnit)
      ? (candidate as ProductQuantityInputUnit)
      : null;
  }

  private normalizeQtyUnitSelection(
    currentValue: ProductQuantityInputUnit | null,
    options: { value: ProductQuantityInputUnit; label: string }[],
  ): ProductQuantityInputUnit | null {
    if (currentValue && options.some((option) => option.value === currentValue)) {
      return currentValue;
    }

    return options[0]?.value ?? null;
  }

  private toTitleCase(value: string): string {
    if (value.length === 0) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private hasSelectedSource(): boolean {
    if (this.itemDraft.itemType === 'dish') {
      return this.itemDraft.dishId !== null;
    }

    if (this.itemDraft.itemType === 'meal') {
      return this.itemDraft.mealId !== null;
    }

    return this.itemDraft.productId !== null;
  }

  private resolveItemType(item: TemplateItem): 'product' | 'dish' | 'meal' {
    if (item.mealId != null) {
      return 'meal';
    }

    if (item.dishId != null) {
      return 'dish';
    }

    return 'product';
  }
}
