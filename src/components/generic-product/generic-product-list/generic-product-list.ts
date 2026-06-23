import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import type { PortionUnit, QuantityUnit } from '../../../services/product-service';

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
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './generic-product-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './generic-product-list.scss',
})
export class GenericProductList implements OnInit, OnChanges {
  @Input() mode: GenericProductListMode = 'manage';
  @Input() genericProducts: GenericProductListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;
  @Input() compact = false;
  @Input() embedded = false;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<GenericProductListItem>();
  @Output() readonly deleteRequested = new EventEmitter<GenericProductListItem>();
  @Output() readonly selected = new EventEmitter<GenericProductListItem>();
  @Output() readonly selectedMany = new EventEmitter<GenericProductListItem[]>();

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
    return this.mode === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode === 'select-multi';
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
      this.selectedIdSet.add(item.id);
    } else {
      this.selectedIdSet.delete(item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, item: GenericProductListItem): void {
    event.stopPropagation();

    if (!this.isMultiSelectMode) {
      return;
    }

    this.onCheckboxChange(item, !this.isSelected(item.id));
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
    this.resolvedGenericProducts =
      this.genericProducts === null ? [...this.defaultGenericProducts] : [...this.genericProducts];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedGenericProducts.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedGenericProducts.find((item) =>
        this.selectedIdSet.has(item.id),
      );
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): GenericProductListItem[] {
    return this.resolvedGenericProducts.filter((item) => this.selectedIdSet.has(item.id));
  }
}
