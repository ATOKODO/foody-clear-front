import { TranslatePipe } from '../../../app/i18n/translate-pipe';
import { Language } from '../../../app/i18n/language';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  inject,
  output,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ProductListItem } from './product-list-item.model';
import { createSelection, deselectItem, getSelectedItems, selectItem } from '../../shared/list-selection';

export type ProductListMode =
  | 'manage'
  | 'single-edit'
  | 'multi-edit'
  | 'select-single'
  | 'select-multi';
export type { ProductListItem } from './product-list-item.model';

@Component({
  selector: 'app-product-list',
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit, OnChanges {
  readonly language = inject(Language);
  readonly mode = input<ProductListMode>('manage');
  readonly products = input<ProductListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly compact = input(false);
  readonly embedded = input(false);
  readonly showAvailableQty = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<ProductListItem>();
  readonly deleteRequested = output<ProductListItem>();
  readonly selected = output<ProductListItem>();
  readonly selectedMany = output<ProductListItem[]>();

  readonly defaultProducts: ProductListItem[] = [
    {
      id: '1',
      name: 'Salade verte',
      barcode: '1234567890123',
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      price: 2.99,
      priceUnit: 'kg',
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
      priceUnit: 'unite',
      tagNames: ['Fruit'],
      nutritionValuesCount: 2,
      category: 'Fruits',
      genericProduct: 'Ananas',
    },
  ];

  resolvedProducts: ProductListItem[] = [];
  readonly searchTerm = signal('');

  private allProducts: ProductListItem[] = [];
  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['mode'] ||
      changes['products'] ||
      changes['selectedIds'] ||
      changes['showAvailableQty']
    ) {
      this.applyInputState();
    }
  }

  get isManageMode(): boolean {
    return this.mode() === 'manage';
  }

  get isSingleEditMode(): boolean {
    const mode = this.mode();
    return mode === 'single-edit' || mode === 'select-single';
  }

  get isMultiEditMode(): boolean {
    const mode = this.mode();
    return mode === 'multi-edit' || mode === 'select-multi';
  }

  get hasItems(): boolean {
    return this.resolvedProducts.length > 0;
  }

  get hasSourceItems(): boolean {
    return this.allProducts.length > 0;
  }

  get hasActiveSearch(): boolean {
    return this.searchTerm().trim() !== '';
  }

  get showSearch(): boolean {
    return this.hasSourceItems || this.hasActiveSearch;
  }

  get displayedColumns(): string[] {
    const withAvailability = (columns: string[]) =>
      this.showAvailableQty() ? this.insertAvailableQtyColumn(columns) : columns;

    if (this.isManageMode) {
      return withAvailability([
        'name',
        'category',
        'genericProduct',
        'barcode',
        'unit',
        'price',
        'tags',
        'nutritionValues',
        'actions',
      ]);
    }

    return withAvailability(
      this.isMultiEditMode
        ? ['select', 'name', 'category', 'genericProduct', 'barcode', 'unit', 'price', 'tags', 'nutritionValues']
        : ['name', 'category', 'genericProduct', 'barcode', 'unit', 'price', 'tags', 'nutritionValues'],
    );
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
    const portionSuffix =
      item.portionCount != null &&
      item.portionCount > 0 &&
      item.portionUnit != null &&
      item.portionUnit.trim() !== ''
        ? ` (${this.language.formatNumber(item.portionCount)} ${this.language.translate(item.portionUnit)})`
        : '';

    if (
      item.quantityPerUnit == null ||
      item.quantityUnit == null ||
      item.quantityUnit.trim() === ''
    ) {
      const base = this.language.translate(item.unitType?.trim() || '-');
      return `${base}${portionSuffix}`;
    }

    return `${this.language.formatNumber(item.quantityPerUnit)} ${this.language.translate(item.quantityUnit)}${portionSuffix}`;
  }

  getPriceDisplay(item: ProductListItem): string {
    if (item.price == null || !Number.isFinite(item.price)) {
      return '-';
    }

    const rounded = Math.round(item.price * 100) / 100;
    const unit = item.priceUnit?.trim();
    return unit ? `${this.language.formatNumber(rounded)} / ${this.language.translate(unit)}` : this.language.formatNumber(rounded);
  }

  getAvailableQuantityDisplay(item: ProductListItem): string {
    if (item.availableQuantity == null || !Number.isFinite(item.availableQuantity)) {
      return '-';
    }

    const rounded =
      Math.round(item.availableQuantity * 100) / 100;
    const value = this.language.formatNumber(rounded);
    const unit = item.availableQuantityUnit?.trim() ?? '';
    return unit === '' ? value : `${value} ${this.language.translate(unit)}`;
  }

  getTagNamesDisplay(item: ProductListItem): string {
    const names = (item.tagNames ?? [])
      .map((name) => name.trim())
      .filter((name) => name !== '');

    return names.length > 0 ? names.join(', ') : '-';
  }

  getLinkedEntityDisplay(value: string | null | undefined): string {
    const normalized = value?.trim();
    return normalized || '-';
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
      selectItem(this.selectedIdSet, item.id);
    } else {
      deselectItem(this.selectedIdSet, item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent): void {
    event.stopPropagation();
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

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.applySearchFilter();
  }

  private applyInputState(): void {
    const products = this.products();
    this.allProducts = products === null ? [...this.defaultProducts] : [...products];

    this.selectedIdSet = createSelection(
      this.allProducts,
      this.selectedIds(),
      this.isSingleEditMode,
    );

    this.applySearchFilter();
  }

  private applySearchFilter(): void {
    const searchTerm = this.normalizeSearchValue(this.searchTerm());

    if (searchTerm === '') {
      this.resolvedProducts = [...this.allProducts];
      return;
    }

    this.resolvedProducts = this.allProducts.filter((item) => this.matchesSearch(item, searchTerm));
  }

  private matchesSearch(item: ProductListItem, searchTerm: string): boolean {
    const haystack = [
      item.name,
      item.barcode ?? '',
      item.category ?? '',
      item.genericProduct ?? '',
      ...(item.tagNames ?? []),
    ]
      .map((value) => this.normalizeSearchValue(value))
      .filter((value) => value !== '')
      .join(' ');

    return haystack.includes(searchTerm);
  }

  private normalizeSearchValue(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  private getSelectedItems(): ProductListItem[] {
    return getSelectedItems(this.allProducts, this.selectedIdSet);
  }

  private insertAvailableQtyColumn(columns: string[]): string[] {
    if (columns.includes('availableQty')) {
      return columns;
    }

    const nextColumns = [...columns];
    const unitIndex = nextColumns.indexOf('unit');
    if (unitIndex === -1) {
      nextColumns.push('availableQty');
      return nextColumns;
    }

    nextColumns.splice(unitIndex + 1, 0, 'availableQty');
    return nextColumns;
  }
}
