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
import { createSelection, deselectItem, getSelectedItems, selectItem } from '../../shared/list-selection';

export type CategoryListMode = 'manage' | 'select-single' | 'select-multi';

export interface CategoryListItem {
  id: string;
  name: string;
  warnBeforeDays: number | null;
  recentlyExpiredDays: number | null;
  minQuantity: number | null;
}

@Component({
  selector: 'app-category-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit, OnChanges {
  readonly mode = input<CategoryListMode>('manage');
  readonly categories = input<CategoryListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly compact = input(false);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<CategoryListItem>();
  readonly deleteRequested = output<CategoryListItem>();
  readonly selected = output<CategoryListItem>();
  readonly selectedMany = output<CategoryListItem[]>();

  resolvedCategories: CategoryListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['categories'] || changes['selectedIds']) {
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
    return this.resolvedCategories.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return ['name', 'warnBeforeDays', 'recentlyExpiredDays', 'minQuantity', 'actions'];
    }

    return this.isMultiSelectMode
      ? ['select', 'name', 'warnBeforeDays', 'recentlyExpiredDays', 'minQuantity']
      : ['name', 'warnBeforeDays', 'recentlyExpiredDays', 'minQuantity'];
  }

  trackById(_: number, item: CategoryListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: CategoryListItem, index: number): boolean {
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

  onRowClick(item: CategoryListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: CategoryListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: CategoryListItem, checked: boolean): void {
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

  onAddClick(): void {
    if (!this.isManageMode) {
      return;
    }

    this.addRequested.emit();
  }

  onEditClick(item: CategoryListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: CategoryListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    const categories = this.categories();
    this.resolvedCategories = categories === null ? [] : [...categories];

    this.selectedIdSet = createSelection(
      this.resolvedCategories,
      this.selectedIds(),
      this.isSingleSelectMode,
    );
  }

  private getSelectedItems(): CategoryListItem[] {
    return getSelectedItems(this.resolvedCategories, this.selectedIdSet);
  }
}
