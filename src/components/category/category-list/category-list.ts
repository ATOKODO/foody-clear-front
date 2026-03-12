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
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit, OnChanges {
  @Input() mode: CategoryListMode = 'manage';
  @Input() categories: CategoryListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;
  @Input() compact = false;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<CategoryListItem>();
  @Output() readonly deleteRequested = new EventEmitter<CategoryListItem>();
  @Output() readonly selected = new EventEmitter<CategoryListItem>();
  @Output() readonly selectedMany = new EventEmitter<CategoryListItem[]>();

  readonly defaultCategories: CategoryListItem[] = [
    {
      id: '1',
      name: 'Fruits',
      warnBeforeDays: 4,
      recentlyExpiredDays: 2,
      minQuantity: 1,
    },
    {
      id: '2',
      name: 'Epicerie',
      warnBeforeDays: 10,
      recentlyExpiredDays: 3,
      minQuantity: 2,
    },
  ];

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
    return this.mode === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode === 'select-multi';
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
      this.selectedIdSet.add(item.id);
    } else {
      this.selectedIdSet.delete(item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, item: CategoryListItem): void {
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
    this.resolvedCategories =
      this.categories === null ? [...this.defaultCategories] : [...this.categories];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedCategories.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedCategories.find((item) =>
        this.selectedIdSet.has(item.id),
      );
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): CategoryListItem[] {
    return this.resolvedCategories.filter((item) => this.selectedIdSet.has(item.id));
  }
}
