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

export type InventoryListMode = 'manage' | 'select-single' | 'select-multi';

export interface InventoryListItem {
  id: string;
  name: string;
  productCount: number;
}

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.scss',
})
export class InventoryList implements OnInit, OnChanges {
  @Input() mode: InventoryListMode = 'manage';
  @Input() inventories: InventoryListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly selected = new EventEmitter<InventoryListItem>();
  @Output() readonly selectedMany = new EventEmitter<InventoryListItem[]>();

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
    return this.mode === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode === 'select-multi';
  }

  get hasItems(): boolean {
    return this.resolvedInventories.length > 0;
  }

  trackById(_: number, item: InventoryListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: InventoryListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
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

  private applyInputState(): void {
    this.resolvedInventories = this.inventories === null
      ? [...this.defaultInventories]
      : [...this.inventories];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedInventories.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedInventories.find(
        (item) => this.selectedIdSet.has(item.id),
      );
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): InventoryListItem[] {
    return this.resolvedInventories.filter((item) => this.selectedIdSet.has(item.id));
  }
}
