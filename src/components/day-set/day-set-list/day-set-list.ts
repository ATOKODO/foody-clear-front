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

export type DaySetListMode = 'manage' | 'select-single' | 'select-multi';

export interface DaySetListItem {
  id: string;
  title: string;
  nutritionValues?: CycleNutritionValue[];
  templateTitle?: string | null;
  protein?: number;
  carbs?: number;
  fat?: number;
}

@Component({
  selector: 'app-day-set-list',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './day-set-list.html',
  styleUrl: './day-set-list.scss',
})
export class DaySetList implements OnInit, OnChanges {
  readonly mode = input<DaySetListMode>('manage');
  readonly daySets = input<DaySetListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly maxSelections = input<number | null>(null);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<DaySetListItem>();
  readonly deleteRequested = output<DaySetListItem>();
  readonly selected = output<DaySetListItem>();
  readonly selectedMany = output<DaySetListItem[]>();

  readonly defaultDaySets: DaySetListItem[] = [
    {
      id: '1',
      title: 'Lundi',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '2',
      title: 'Repos',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '3',
      title: 'Mardi',
      protein: 50,
      carbs: 150,
      fat: 30,
    },
  ];

  resolvedDaySets: DaySetListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['daySets'] || changes['selectedIds']) {
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
    return this.resolvedDaySets.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return ['title', 'protein', 'carbs', 'fat', 'actions'];
    }

    return this.isMultiSelectMode
      ? ['select', 'title', 'protein', 'carbs', 'fat']
      : ['title', 'protein', 'carbs', 'fat'];
  }

  getProtein(item: DaySetListItem): number {
    return this.getMacro(item, 'protein');
  }

  getCarbs(item: DaySetListItem): number {
    return this.getMacro(item, 'carbs');
  }

  getFat(item: DaySetListItem): number {
    return this.getMacro(item, 'fat');
  }

  trackById(_: number, item: DaySetListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isSelectionDisabled(item: DaySetListItem): boolean {
    if (!this.isMultiSelectMode || this.isSelected(item.id)) {
      return false;
    }

    const maxSelections = this.getMaxSelections();
    return maxSelections !== null && this.selectedIdSet.size >= maxSelections;
  }

  isRowActive(item: DaySetListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
    }

    return this.isSelected(item.id);
  }

  onRowClick(item: DaySetListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: DaySetListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: DaySetListItem, checked: boolean): void {
    if (!this.isMultiSelectMode) {
      return;
    }

    if (checked && this.isSelectionDisabled(item)) {
      return;
    }

    if (checked) {
      this.selectedIdSet.add(item.id);
    } else {
      this.selectedIdSet.delete(item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, item: DaySetListItem): void {
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

  onEditClick(item: DaySetListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: DaySetListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    const daySets = this.daySets();
    this.resolvedDaySets = daySets === null ? [...this.defaultDaySets] : [...daySets];

    const initialIds = this.selectedIds() ?? [];
    const availableIds = new Set(this.resolvedDaySets.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedDaySets.find((item) => this.selectedIdSet.has(item.id));
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): DaySetListItem[] {
    return this.resolvedDaySets.filter((item) => this.selectedIdSet.has(item.id));
  }

  private getMaxSelections(): number | null {
    const maxSelections = this.maxSelections();
    if (maxSelections === null || maxSelections === undefined) {
      return null;
    }

    const normalized = Math.trunc(maxSelections);
    return normalized >= 0 ? normalized : null;
  }

  private getMacro(item: DaySetListItem, key: 'protein' | 'carbs' | 'fat'): number {
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
}
