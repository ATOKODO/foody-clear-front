import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import type { PortionUnit, QuantityUnit } from '../../../services/product-service';
import { createSelection, deselectItem, getSelectedItems, selectItem } from '../../shared/list-selection';

export type GenericProductListMode = 'manage' | 'select-single' | 'select-multi';

export interface GenericProductListItem {
  id: string;
  name: string;
  minQuantityUnit: number | null;
  minQuantityUnitType: PortionUnit | null;
  minQuantityMetric: number | null;
  minQuantityMetricType: QuantityUnit | null;
}

@Component({
  selector: 'app-generic-product-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './generic-product-list.html',
  styleUrl: './generic-product-list.scss',
})
export class GenericProductList implements OnInit, OnChanges {
  readonly mode = input<GenericProductListMode>('manage');
  readonly genericProducts = input<GenericProductListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly compact = input(false);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<GenericProductListItem>();
  readonly deleteRequested = output<GenericProductListItem>();
  readonly selected = output<GenericProductListItem>();
  readonly selectedMany = output<GenericProductListItem[]>();

  readonly defaultGenericProducts: GenericProductListItem[] = [
    {
      id: '1',
      name: 'Riz',
      minQuantityUnit: 1,
      minQuantityUnitType: null,
      minQuantityMetric: 500,
      minQuantityMetricType: 'g',
    },
    {
      id: '2',
      name: 'Pates',
      minQuantityUnit: 2,
      minQuantityUnitType: 'portion',
      minQuantityMetric: 250,
      minQuantityMetricType: 'g',
    },
  ];

  resolvedGenericProducts: GenericProductListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['genericProducts'] || changes['selectedIds']) {
      this.applyInputState();
    }
  }

  get isManageMode(): boolean {
    return this.mode() === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode() === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode() === 'select-multi';
  }

  get hasItems(): boolean {
    return this.resolvedGenericProducts.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return ['name', 'minQuantityUnit', 'minQuantityMetric', 'actions'];
    }

    return this.isMultiSelectMode
      ? ['select', 'name', 'minQuantityUnit', 'minQuantityMetric']
      : ['name', 'minQuantityUnit', 'minQuantityMetric'];
  }

  trackById(_: number, item: GenericProductListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: GenericProductListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
    }

    return this.isSelected(item.id);
  }

  getNumberDisplay(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) {
      return '-';
    }

    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }

  getQuantityDisplay(
    value: number | null | undefined,
    unitType: PortionUnit | QuantityUnit | null | undefined,
  ): string {
    const numberDisplay = this.getNumberDisplay(value);
    if (numberDisplay === '-') {
      return numberDisplay;
    }

    return typeof unitType === 'string' && unitType.trim() !== ''
      ? `${numberDisplay} ${unitType}`
      : numberDisplay;
  }

  onRowClick(item: GenericProductListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: GenericProductListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: GenericProductListItem, checked: boolean): void {
    if (!this.isMultiSelectMode) {
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

  onEditClick(item: GenericProductListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: GenericProductListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    const genericProducts = this.genericProducts();
    this.resolvedGenericProducts =
      genericProducts === null ? [...this.defaultGenericProducts] : [...genericProducts];

    this.selectedIdSet = createSelection(
      this.resolvedGenericProducts,
      this.selectedIds(),
      this.isSingleSelectMode,
    );
  }

  private getSelectedItems(): GenericProductListItem[] {
    return getSelectedItems(this.resolvedGenericProducts, this.selectedIdSet);
  }
}
