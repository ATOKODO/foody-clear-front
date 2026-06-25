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
import {
  ProductList,
  ProductListItem,
} from '../../product/product-list/product-list';
import { mapProductToProductListItem } from '../../product/product-list/product-list-item.mapper';
import { ProductQuantityInputUnit } from '../../../interfaces/input-day.interface';
import { Slot } from '../../../interfaces/slot.interface';
import { Template, TemplateItem } from '../../../interfaces/template.interface';
import { Product as ProductApiModel } from '../../../services/product-service';

export type TemplateFormMode = 'add' | 'edit';

export interface TemplateItemDraft {
  id: number | null;
  productId: number | null;
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
    ProductList,
  ],
  templateUrl: './template-form.html',
  styleUrl: './template-form.scss',
})
export class TemplateForm implements OnInit, OnChanges {
  readonly mode = input<TemplateFormMode>('add');
  readonly template = input<Template | null>(null);
  readonly products = input<ProductApiModel[]>([]);
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
      this.itemDraft.productId !== null &&
      this.itemDraft.qty !== null &&
      this.itemDraft.qty > 0 &&
      !this.savingItem()
    );
  }

  get productListItems(): ProductListItem[] {
    return this.products().map((product) =>
      mapProductToProductListItem(product),
    );
  }

  get selectedProductIds(): string[] {
    return this.itemDraft.productId !== null
      ? [String(this.itemDraft.productId)]
      : [];
  }

  get sortedSlots(): Slot[] {
    return [...this.slots()].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
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
    this.itemDraft = {
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      qtyUnit: item.qtyUnit,
      slotId: item.slotId,
      slotKey: item.slotKey ?? '',
      preferredTime: this.formatPreferredTime(item.preferredTime),
    };
  }

  onProductSelected(product: ProductListItem): void {
    const productId = Number(product.id);
    if (!Number.isInteger(productId) || productId < 1) {
      return;
    }

    this.updateItemDraft({ productId });
  }

  updateItemDraft(patch: Partial<TemplateItemDraft>): void {
    this.itemDraft = {
      ...this.itemDraft,
      ...patch,
    };
  }

  onItemSave(): void {
    if (!this.canSaveItem) {
      return;
    }

    const itemDraft = this.itemDraft;
    this.itemSubmitted.emit({
      id: itemDraft.id,
      productId: itemDraft.productId,
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

    return item.slotKey?.trim() || 'Sans slot';
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
      productId: null,
      qty: null,
      qtyUnit: null,
      slotId: null,
      slotKey: '',
      preferredTime: '06:00',
    };
  }
}
