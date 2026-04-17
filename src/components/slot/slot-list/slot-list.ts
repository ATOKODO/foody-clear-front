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
import { CycleNutritionValue } from '../../../interfaces/cycle.interface';

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
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './slot-list.html',
  styleUrl: './slot-list.scss',
})
export class SlotList implements OnInit, OnChanges {
  @Input() mode: SlotListMode = 'manage';
  @Input() slots: SlotListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;
  @Input() embedded = false;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<SlotListItem>();
  @Output() readonly deleteRequested = new EventEmitter<SlotListItem>();
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
      this.selectedIdSet.add(item.id);
    } else {
      this.selectedIdSet.delete(item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, item: SlotListItem): void {
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

  private getMacro(item: SlotListItem, key: 'protein' | 'carbs' | 'fat'): number {
    const nutritionValues = item.nutritionValues ?? [];
    if (nutritionValues.length > 0) {
      return this.extractMacroTotals(nutritionValues)[key];
    }

    if (key === 'protein') {
      return this.roundNumber(item.protein ?? 0);
    }

    if (key === 'carbs') {
      return this.roundNumber(item.carbs ?? 0);
    }

    return this.roundNumber(item.fat ?? 0);
  }

  private extractMacroTotals(values: CycleNutritionValue[]): {
    protein: number;
    carbs: number;
    fat: number;
  } {
    const totals = { protein: 0, carbs: 0, fat: 0 };

    values.forEach((value) => {
      const amount = this.toGrams(value.amount, value.unit);
      const nutritionKey = value.nutritionKey.toUpperCase();

      if (nutritionKey === 'PROTEIN') {
        totals.protein += amount;
      } else if (nutritionKey === 'CARBOHYDRATE') {
        totals.carbs += amount;
      } else if (nutritionKey === 'FAT') {
        totals.fat += amount;
      }
    });

    return {
      protein: this.roundNumber(totals.protein),
      carbs: this.roundNumber(totals.carbs),
      fat: this.roundNumber(totals.fat),
    };
  }

  private toGrams(amount: number, unit: string): number {
    if (unit.toUpperCase() === 'G') {
      return amount;
    }

    if (unit.toUpperCase() === 'MG') {
      return amount / 1000;
    }

    return 0;
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private formatTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
  }
}
