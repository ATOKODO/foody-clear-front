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

export type SlotListMode = 'manage' | 'select-single' | 'select-multi';

export interface SlotListItem {
  id: string;
  title: string;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-slot-list',
  imports: [CommonModule],
  templateUrl: './slot-list.html',
  styleUrl: './slot-list.scss',
})
export class SlotList implements OnInit, OnChanges {
  @Input() mode: SlotListMode = 'manage';
  @Input() slots: SlotListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly selected = new EventEmitter<SlotListItem>();
  @Output() readonly selectedMany = new EventEmitter<SlotListItem[]>();

  readonly defaultSlots: SlotListItem[] = [
    {
      id: '1',
      title: 'Petit dejeuner',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '2',
      title: 'Dejeuner',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '3',
      title: 'Diner',
      protein: 50,
      carbs: 150,
      fat: 30,
    },
  ];

  resolvedSlots: SlotListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['slots'] || changes['selectedIds']) {
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
    return this.resolvedSlots.length > 0;
  }

  trackById(_: number, item: SlotListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: SlotListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
    }

    return this.isSelected(item.id);
  }

  onRowClick(item: SlotListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: SlotListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: SlotListItem, checked: boolean): void {
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
    this.resolvedSlots = this.slots === null ? [...this.defaultSlots] : [...this.slots];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedSlots.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedSlots.find((item) => this.selectedIdSet.has(item.id));
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): SlotListItem[] {
    return this.resolvedSlots.filter((item) => this.selectedIdSet.has(item.id));
  }
}
