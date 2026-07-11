import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TypeDuree } from '../form-cycle/form-cycle';

export type CycleListMode = 'manage' | 'select-single' | 'select-multi';
export type CycleBreakdownStatus = 'under' | 'exact' | 'over' | 'missing';
export type CycleBreakdownMetricKey = 'kcal' | 'proteins' | 'carbs' | 'lipids';

export interface CycleMacroTotals {
  energyKcal: number;
  proteins: number;
  carbs: number;
  lipids: number;
}

export interface CycleBreakdownMetric {
  key: CycleBreakdownMetricKey;
  label: string;
  unit: 'g' | 'kcal';
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

export interface CycleEmbeddedSummaryCard {
  key: CycleBreakdownMetricKey;
  label: string;
  unit: 'g' | 'kcal';
  value: number;
  target: number;
  percentage: number | null;
  status: CycleBreakdownStatus;
  caption: string;
}

export interface CycleListItem extends CycleMacroTotals {
  id: number;
  title: string;
  color: string;
  durationDays: number;
  durationCount: number;
  durationType: TypeDuree;
  missingDayCount: number;
  daySetTotals: CycleMacroTotals;
  daySetMetrics: CycleBreakdownMetric[];
  daySets: CycleDaySetBreakdown[];
  hasDaySetOverflow: boolean;
  hasSlotOverflow: boolean;
  hasMissingSlotBreakdown: boolean;
}

@Component({
  selector: 'app-list-cycle',
  imports: [MatButtonModule, MatCardModule, MatCheckboxModule],
  templateUrl: './list-cycle.html',
  styleUrl: './list-cycle.scss',
})
export class ListCycle implements OnInit, OnChanges {
  readonly mode = input<CycleListMode>('manage');
  readonly cycles = input<CycleListItem[] | null>(null);
  readonly selectedIds = input<number[] | null>(null);
  readonly activeCycleId = input<number | null>(null);
  readonly showAddButton = input(true);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<CycleListItem>();
  readonly deleteRequested = output<CycleListItem>();
  readonly selected = output<CycleListItem>();
  readonly selectedMany = output<CycleListItem[]>();

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
    return this.mode() === 'manage';
  }

  get isEmbeddedManageMode(): boolean {
    return this.embedded() && this.isManageMode;
  }

  get isSingleSelectMode(): boolean {
    return this.mode() === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode() === 'select-multi';
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

  trackByEmbeddedCard(_: number, card: CycleEmbeddedSummaryCard): string {
    return card.key;
  }

  isSelected(id: number): boolean {
    return this.selectedIdSet.has(id);
  }

  isExpanded(id: number): boolean {
    return this.expandedIdSet.has(id);
  }

  isRowActive(cycle: CycleListItem, index: number): boolean {
    if (this.isManageMode) {
      const activeCycleId = this.activeCycleId();
      if (activeCycleId !== null) {
        return cycle.id === activeCycleId;
      }

      return index === 0;
    }

    return this.isSelected(cycle.id);
  }

  hasSlotMetrics(daySet: CycleDaySetBreakdown): boolean {
    return daySet.slotMetrics.length > 0;
  }

  formatAmount(value: number): string {
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(2).replace(/\.?0+$/, '');
  }

  formatPercent(percentage: number | null): string {
    if (percentage === null) {
      return 'Target 0';
    }

    return `${this.formatAmount(percentage)}%`;
  }

  formatDuration(count: number, type: TypeDuree): string {
    if (type === 'mois') {
      return `${count} month${count > 1 ? 's' : ''}`;
    }

    const suffix = count > 1 ? 's' : '';
    const unit = type === 'semaine' ? `week${suffix}` : `day${suffix}`;
    return `${count} ${unit}`;
  }

  getToggleLabel(cycleId: number): string {
    return this.isExpanded(cycleId) ? 'Hide details' : 'View details';
  }

  getEmbeddedSummaryCards(cycle: CycleListItem): CycleEmbeddedSummaryCard[] {
    return [
      this.buildEmbeddedSummaryCard(
        'kcal',
        'KCAL',
        cycle.daySetTotals.energyKcal,
        cycle.energyKcal,
        'kcal',
      ),
      this.buildEmbeddedSummaryCard(
        'proteins',
        'PROTEINS',
        cycle.daySetTotals.proteins,
        cycle.proteins,
        'g',
      ),
      this.buildEmbeddedSummaryCard(
        'carbs',
        'CARBS',
        cycle.daySetTotals.carbs,
        cycle.carbs,
        'g',
      ),
      this.buildEmbeddedSummaryCard(
        'lipids',
        'FATS',
        cycle.daySetTotals.lipids,
        cycle.lipids,
        'g',
      ),
    ];
  }

  getStatusLabel(status: CycleBreakdownStatus): string {
    if (status === 'over') {
      return 'Over';
    }

    if (status === 'exact') {
      return 'On target';
    }

    if (status === 'missing') {
      return 'Unavailable';
    }

    return 'Below target';
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
    const cycles = this.cycles();
    this.resolvedCycles = cycles === null ? [] : [...cycles];

    const initialIds = this.selectedIds() ?? [];
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
      const firstSelected = this.resolvedCycles.find((item) =>
        this.selectedIdSet.has(item.id),
      );
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): CycleListItem[] {
    return this.resolvedCycles.filter((item) =>
      this.selectedIdSet.has(item.id),
    );
  }

  private buildEmbeddedSummaryCard(
    key: CycleEmbeddedSummaryCard['key'],
    label: string,
    value: number,
    target: number,
    unit: CycleEmbeddedSummaryCard['unit'],
  ): CycleEmbeddedSummaryCard {
    const roundedValue = this.roundNumber(value);
    const roundedTarget = this.roundNumber(target);

    return {
      key,
      label,
      unit,
      value: roundedValue,
      target: roundedTarget,
      percentage:
        roundedTarget > 0
          ? this.roundNumber((roundedValue / roundedTarget) * 100)
          : null,
      status: this.resolveComparisonStatus(roundedValue, roundedTarget),
      caption: 'Effective daily average',
    };
  }

  private resolveComparisonStatus(
    value: number,
    target: number,
  ): CycleBreakdownStatus {
    if (target === 0) {
      return value > 0 ? 'over' : 'exact';
    }

    if (value > target) {
      return 'over';
    }

    if (value === target) {
      return 'exact';
    }

    return 'under';
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
