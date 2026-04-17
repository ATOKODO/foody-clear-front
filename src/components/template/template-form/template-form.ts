import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
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
}

export interface TemplateFormSubmittedEvent {
  mode: TemplateFormMode;
  title: string;
}

@Component({
  selector: 'app-template-form',
  imports: [
    CommonModule,
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
  @Input() mode: TemplateFormMode = 'add';
  @Input() template: Template | null = null;
  @Input() products: ProductApiModel[] = [];
  @Input() slots: Slot[] = [];
  @Input() qtyUnitOptions: ProductQuantityInputUnit[] = [];
  @Input() savingTemplate = false;
  @Input() savingItem = false;
  @Input() itemError: string | null = null;

  @Output() readonly templateSubmitted = new EventEmitter<TemplateFormSubmittedEvent>();
  @Output() readonly templateDeleted = new EventEmitter<number>();
  @Output() readonly itemSubmitted = new EventEmitter<TemplateItemDraft>();
  @Output() readonly itemDeleted = new EventEmitter<number>();

  draftTitle = '';
  itemDraft: TemplateItemDraft = this.buildEmptyItemDraft();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['template']) {
      this.applyInputState();
    }
  }

  get canSaveTemplate(): boolean {
    return this.draftTitle.trim() !== '' && !this.savingTemplate;
  }

  get canSaveItem(): boolean {
    return (
      this.template !== null &&
      this.itemDraft.productId !== null &&
      this.itemDraft.qty !== null &&
      this.itemDraft.qty > 0 &&
      !this.savingItem
    );
  }

  get productListItems(): ProductListItem[] {
    return this.products.map((product) => mapProductToProductListItem(product));
  }

  get selectedProductIds(): string[] {
    return this.itemDraft.productId !== null ? [String(this.itemDraft.productId)] : [];
  }

  get sortedSlots(): Slot[] {
    return [...this.slots].sort(
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
      mode: this.mode,
      title,
    });
  }

  onTemplateDelete(): void {
    if (!this.template) {
      return;
    }

    this.templateDeleted.emit(this.template.id);
  }

  editItem(item: TemplateItem): void {
    this.itemDraft = {
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      qtyUnit: item.qtyUnit,
      slotId: item.slotId,
      slotKey: item.slotKey ?? '',
    };
  }

  onProductSelected(product: ProductListItem): void {
    const productId = Number(product.id);
    if (!Number.isInteger(productId) || productId < 1) {
      return;
    }

    this.itemDraft = {
      ...this.itemDraft,
      productId,
    };
  }

  onItemSave(): void {
    if (!this.canSaveItem) {
      return;
    }

    this.itemSubmitted.emit({
      id: this.itemDraft.id,
      productId: this.itemDraft.productId,
      qty: this.itemDraft.qty,
      qtyUnit: this.itemDraft.qtyUnit,
      slotId: this.itemDraft.slotId,
      slotKey: this.itemDraft.slotKey,
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
      const slot = this.sortedSlots.find((candidate) => candidate.id === item.slotId) ?? null;
      if (slot) {
        return `${slot.sortOrder}. ${slot.title}`;
      }
    }

    return item.slotKey?.trim() || 'Sans slot';
  }

  formatNutritionAmount(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 2,
    }).format(rounded);
  }

  private applyInputState(): void {
    if (this.mode === 'edit' && this.template) {
      this.draftTitle = this.template.title;
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
    };
  }
}
