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
import { TypeDuree } from '../form-cycle/form-cycle';

export type CycleListMode = 'manage' | 'select-single' | 'select-multi';
export type CycleBreakdownStatus = 'under' | 'exact' | 'over' | 'missing';
export type CycleBreakdownMetricKey = 'proteins' | 'carbs' | 'lipids';

export interface CycleMacroTotals {
  proteins: number;
  carbs: number;
  lipids: number;
}

export interface CycleBreakdownMetric {
  key: CycleBreakdownMetricKey;
  label: string;
  value: number;
  target: number;
  percentage: number | null;
  status: CycleBreakdownStatus;
}

export interface CycleSlotBreakdown {
  id: number | null;
  title: string;
  key: string;
  timeRange: string | null;
  totals: CycleMacroTotals;
  metrics: CycleBreakdownMetric[];
}

export interface CycleDaySetBreakdown {
  id: number;
  title: string;
  totals: CycleMacroTotals;
  metrics: CycleBreakdownMetric[];
  slotTotals: CycleMacroTotals;
  slotMetrics: CycleBreakdownMetric[];
  slots: CycleSlotBreakdown[];
  hasSlotOverflow: boolean;
  hasMissingSlotBreakdown: boolean;
}

export interface CycleListItem extends CycleMacroTotals {
  id: number;
  title: string;
  color: string;
  durationDays: number;
  durationCount: number;
  durationType: TypeDuree;
  daySetTotals: CycleMacroTotals;
  daySetMetrics: CycleBreakdownMetric[];
  daySets: CycleDaySetBreakdown[];
  hasDaySetOverflow: boolean;
  hasSlotOverflow: boolean;
  hasMissingSlotBreakdown: boolean;
}

@Component({
  selector: 'app-list-cycle',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatCheckboxModule],
  templateUrl: './list-cycle.html',
  styleUrl: './list-cycle.scss',
})
export class ListCycle implements OnInit, OnChanges {
  @Input() mode: CycleListMode = 'manage';
  @Input() cycles: CycleListItem[] | null = null;
  @Input() selectedIds: number[] | null = null;
  @Input() activeCycleId: number | null = null;
  @Input() showAddButton = true;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<CycleListItem>();
  @Output() readonly deleteRequested = new EventEmitter<CycleListItem>();
  @Output() readonly selected = new EventEmitter<CycleListItem>();
  @Output() readonly selectedMany = new EventEmitter<CycleListItem[]>();

  resolvedCycles: CycleListItem[] = [];

  private readonly selectedIdSet = new Set<number>();
  private expandedIdSet = new Set<number>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['mode'] ||
      changes['cycles'] ||
      changes['selectedIds'] ||
      changes['activeCycleId']
    ) {
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
    return this.resolvedCycles.length > 0;
  }

  trackById(_: number, item: CycleListItem): number {
    return item.id;
  }

  trackByMetric(_: number, metric: CycleBreakdownMetric): string {
    return metric.key;
  }

  trackByDaySetId(_: number, daySet: CycleDaySetBreakdown): number {
    return daySet.id;
  }

  trackBySlotId(_: number, slot: CycleSlotBreakdown): string {
    return `${slot.id ?? 'slot'}-${slot.key}-${slot.title}-${slot.timeRange ?? 'na'}`;
  }

  isSelected(id: number): boolean {
    return this.selectedIdSet.has(id);
  }

  isExpanded(id: number): boolean {
    return this.expandedIdSet.has(id);
  }

  isRowActive(cycle: CycleListItem, index: number): boolean {
    if (this.isManageMode) {
      if (this.activeCycleId !== null) {
        return cycle.id === this.activeCycleId;
      }

      return index === 0;
    }

    return this.isSelected(cycle.id);
  }

  hasSlotMetrics(daySet: CycleDaySetBreakdown): boolean {
    return daySet.slotMetrics.length > 0;
  }

  formatAmount(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
  }

  formatPercent(percentage: number | null): string {
    if (percentage === null) {
      return 'Cible 0';
    }

    return `${this.formatAmount(percentage)}%`;
  }

  getStatusLabel(status: CycleBreakdownStatus): string {
    if (status === 'over') {
      return 'Depasse';
    }

    if (status === 'exact') {
      return 'OK';
    }

    if (status === 'missing') {
      return 'Indispo';
    }

    return 'Sous cible';
  }

  getStatusClass(status: CycleBreakdownStatus): string {
    return `lc-status-${status}`;
  }

  onRowClick(cycle: CycleListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(cycle.id);
    this.selected.emit(cycle);
  }

  onRowKeydown(event: KeyboardEvent, cycle: CycleListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(cycle);
  }

  onCheckboxChange(cycle: CycleListItem, checked: boolean): void {
    if (!this.isMultiSelectMode) {
      return;
    }

    if (checked) {
      this.selectedIdSet.add(cycle.id);
    } else {
      this.selectedIdSet.delete(cycle.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, cycle: CycleListItem): void {
    event.stopPropagation();

    if (!this.isMultiSelectMode) {
      return;
    }

    this.onCheckboxChange(cycle, !this.isSelected(cycle.id));
  }

  onToggleExpanded(event: MouseEvent, cycleId: number): void {
    event.stopPropagation();

    if (this.expandedIdSet.has(cycleId)) {
      this.expandedIdSet.delete(cycleId);
      return;
    }

    this.expandedIdSet.add(cycleId);
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  onEdit(cycle: CycleListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(cycle);
  }

  onDelete(cycle: CycleListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(cycle);
  }

  onAddCycle(): void {
    if (!this.isManageMode) {
      return;
    }

    this.addRequested.emit();
  }

  private applyInputState(): void {
    this.resolvedCycles = this.cycles === null ? [] : [...this.cycles];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedCycles.map((item) => item.id));

    this.selectedIdSet.clear();
    initialIds.forEach((id) => {
      if (availableIds.has(id)) {
        this.selectedIdSet.add(id);
      }
    });

    this.expandedIdSet = new Set(
      [...this.expandedIdSet].filter((id) => availableIds.has(id)),
    );

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedCycles.find((item) => this.selectedIdSet.has(item.id));
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): CycleListItem[] {
    return this.resolvedCycles.filter((item) => this.selectedIdSet.has(item.id));
  }
}
