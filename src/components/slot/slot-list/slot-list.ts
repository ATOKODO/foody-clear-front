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
import { CycleNutritionValue } from '../../../interfaces/cycle.interface';
import { getNutritionMacro } from '../../shared/nutrition';
import { createSelection, deselectItem, getSelectedItems, selectItem } from '../../shared/list-selection';

export type SlotListMode = 'manage' | 'select-single' | 'select-multi';

export interface SlotListItem {
  id: string;
  key?: string;
  title: string;
  sortOrder?: number;
  startTime?: string | null;
  endTime?: string | null;
  nutritionValues?: CycleNutritionValue[];
  protein?: number;
  carbs?: number;
  fat?: number;
}

@Component({
  selector: 'app-slot-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './slot-list.html',
  styleUrl: './slot-list.scss',
})
export class SlotList implements OnInit, OnChanges {
  readonly mode = input<SlotListMode>('manage');
  readonly slots = input<SlotListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<SlotListItem>();
  readonly deleteRequested = output<SlotListItem>();
  readonly selected = output<SlotListItem>();
  readonly selectedMany = output<SlotListItem[]>();

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
    return this.mode() === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode() === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode() === 'select-multi';
  }

  get hasItems(): boolean {
    return this.resolvedSlots.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return ['title', 'protein', 'carbs', 'fat', 'actions'];
    }

    return this.isMultiSelectMode
      ? ['select', 'title', 'protein', 'carbs', 'fat']
      : ['title', 'protein', 'carbs', 'fat'];
  }

  getProtein(item: SlotListItem): number {
    return this.getMacro(item, 'protein');
  }

  getCarbs(item: SlotListItem): number {
    return this.getMacro(item, 'carbs');
  }

  getFat(item: SlotListItem): number {
    return this.getMacro(item, 'fat');
  }

  getTimeRange(item: SlotListItem): string | null {
    const start = this.formatTime(item.startTime);
    const end = this.formatTime(item.endTime);

    if (start && end) {
      return `${start} - ${end}`;
    }

    return start ?? end ?? null;
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
      selectItem(this.selectedIdSet, item.id);
    } else {
      deselectItem(this.selectedIdSet, item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, item: SlotListItem): void {
    event.stopPropagation();
    this.onCheckboxChange(item, !this.isSelected(item.id));
  }

  onAddClick(): void {
    if (!this.isManageMode) {
      return;
    }

    this.addRequested.emit();
  }

  onEditClick(item: SlotListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: SlotListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    const slots = this.slots();
    this.resolvedSlots = slots === null ? [...this.defaultSlots] : [...slots];

    this.selectedIdSet = createSelection(
      this.resolvedSlots,
      this.selectedIds(),
      this.isSingleSelectMode,
    );
  }

  private getSelectedItems(): SlotListItem[] {
    return getSelectedItems(this.resolvedSlots, this.selectedIdSet);
  }

  private getMacro(item: SlotListItem, key: 'protein' | 'carbs' | 'fat'): number {
    return getNutritionMacro(item, key);
  }

  private formatTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
  }
}
