import { UiEmptyState } from '../../../app/ui/empty-state/empty-state';
import { UiButton } from '../../../app/ui/button/button';
import { TranslatePipe } from '../../../app/i18n/translate-pipe';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { createSelection, deselectItem, getSelectedItems, selectItem } from '../../shared/list-selection';

export type InventoryListMode = 'manage' | 'select-single' | 'select-multi';

export interface InventoryListItem {
  id: string;
  name: string;
  productCount: number;
}

@Component({
  selector: 'app-inventory-list',
  imports: [UiEmptyState, UiButton,
    TranslatePipe,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.scss',
})
export class InventoryList implements OnInit, OnChanges {
  readonly mode = input<InventoryListMode>('manage');
  readonly inventories = input<InventoryListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<InventoryListItem>();
  readonly deleteRequested = output<InventoryListItem>();
  readonly selected = output<InventoryListItem>();
  readonly selectedMany = output<InventoryListItem[]>();

  readonly defaultInventories: InventoryListItem[] = [
    { id: '1', name: 'Stock principal', productCount: 24 },
    { id: '2', name: 'Placard cuisine', productCount: 11 },
    { id: '3', name: 'Congelateur', productCount: 8 },
  ];

  resolvedInventories: InventoryListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['inventories'] || changes['selectedIds']) {
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
    return this.resolvedInventories.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return ['name', 'productCount', 'actions'];
    }

    return this.isMultiSelectMode
      ? ['select', 'name', 'productCount']
      : ['name', 'productCount'];
  }

  trackById(_: number, item: InventoryListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: InventoryListItem): boolean {
    if (this.isManageMode) {
      return false;
    }
    return this.isSelected(item.id);
  }

  onRowClick(item: InventoryListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: InventoryListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: InventoryListItem, checked: boolean): void {
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

  onEditClick(item: InventoryListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: InventoryListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    const inventories = this.inventories();
    this.resolvedInventories = inventories === null
      ? [...this.defaultInventories]
      : [...inventories];

    this.selectedIdSet = createSelection(
      this.resolvedInventories,
      this.selectedIds(),
      this.isSingleSelectMode,
    );
  }

  private getSelectedItems(): InventoryListItem[] {
    return getSelectedItems(this.resolvedInventories, this.selectedIdSet);
  }
}
