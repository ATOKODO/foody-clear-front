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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';

export type ProductListMode =
  | 'manage'
  | 'single-edit'
  | 'multi-edit'
  | 'select-single'
  | 'select-multi';

export interface ProductListItem {
  id: string;
  name: string;
  barcode?: string | null;
  unitType?: string;
  quantityPerUnit?: number;
  quantityUnit?: string | null;
  price?: number | null;
  tagNames?: string[];
  nutritionValuesCount?: number;
  category?: string | null;
  genericProduct?: string | null;
}

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit, OnChanges {
  @Input() mode: ProductListMode = 'manage';
  @Input() products: ProductListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<ProductListItem>();
  @Output() readonly deleteRequested = new EventEmitter<ProductListItem>();
  @Output() readonly selected = new EventEmitter<ProductListItem>();
  @Output() readonly selectedMany = new EventEmitter<ProductListItem[]>();

  readonly defaultProducts: ProductListItem[] = [
    {
      id: '1',
      name: 'Salade verte',
      barcode: '1234567890123',
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      price: 2.99,
      tagNames: ['Bio', 'Local'],
      nutritionValuesCount: 3,
      category: 'Legumes',
      genericProduct: 'Salade',
    },
    {
      id: '2',
      name: 'Pineapple',
      barcode: '3210987654321',
      unitType: 'Piece',
      quantityPerUnit: 1,
      quantityUnit: 'piece',
      price: 1.49,
      tagNames: ['Fruit'],
      nutritionValuesCount: 2,
      category: 'Fruits',
      genericProduct: 'Ananas',
    },
  ];

  resolvedProducts: ProductListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['products'] || changes['selectedIds']) {
      this.applyInputState();
    }
  }

  get isManageMode(): boolean {
    return this.mode === 'manage';
  }

  get isSingleEditMode(): boolean {
    return this.mode === 'single-edit' || this.mode === 'select-single';
  }

  get isMultiEditMode(): boolean {
    return this.mode === 'multi-edit' || this.mode === 'select-multi';
  }

  get hasItems(): boolean {
    return this.resolvedProducts.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return [
        'name',
        'barcode',
        'unit',
        'price',
        'tags',
        'nutritionValues',
        'actions',
      ];
    }

    return this.isMultiEditMode
      ? ['select', 'name', 'barcode', 'unit', 'price', 'tags', 'nutritionValues']
      : ['name', 'barcode', 'unit', 'price', 'tags', 'nutritionValues'];
  }

  trackById(_: number, item: ProductListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: ProductListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
    }

    return this.isSelected(item.id);
  }

  getUnitDisplay(item: ProductListItem): string {
    if (
      item.quantityPerUnit == null ||
      item.quantityUnit == null ||
      item.quantityUnit.trim() === ''
    ) {
      return item.unitType?.trim() || '-';
    }

    return `${item.quantityPerUnit} ${item.quantityUnit}`;
  }

  getPriceDisplay(item: ProductListItem): string {
    if (item.price == null || !Number.isFinite(item.price)) {
      return '-';
    }

    return String(Math.round(item.price * 100) / 100);
  }

  getTagNamesDisplay(item: ProductListItem): string {
    const names = (item.tagNames ?? [])
      .map((name) => name.trim())
      .filter((name) => name !== '');

    return names.length > 0 ? names.join(', ') : '-';
  }

  onRowClick(item: ProductListItem): void {
    if (!this.isSingleEditMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: ProductListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: ProductListItem, checked: boolean): void {
    if (!this.isMultiEditMode) {
      return;
    }

    if (checked) {
      this.selectedIdSet.add(item.id);
    } else {
      this.selectedIdSet.delete(item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onAddClick(): void {
    if (!this.isManageMode) {
      return;
    }

    this.addRequested.emit();
  }

  onEditClick(item: ProductListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: ProductListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    this.resolvedProducts = this.products === null ? [...this.defaultProducts] : [...this.products];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedProducts.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleEditMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedProducts.find((item) => this.selectedIdSet.has(item.id));
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): ProductListItem[] {
    return this.resolvedProducts.filter((item) => this.selectedIdSet.has(item.id));
  }
}
