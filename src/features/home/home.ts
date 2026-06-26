import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { DateTime } from 'luxon';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  InputDayDaySetSlotSummary,
  InputDayItemSummary,
  InputDayMacroValue,
  InputDayResponse,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';
import {
  InventoryPurchaseEventSummary,
  StatisticsTimelineDay,
  StatisticsTimelineResponse,
} from '../../interfaces/statistics.interface';
import { InputDayService } from '../../services/input-day-service';
import { StatisticService } from '../../services/statistic-service';
import { InputDayFeature } from '../input-day/input-day.feature';

type HomeMacroKey = 'energyKcal' | 'proteins' | 'carbs' | 'lipids';

interface HomeMacroCard {
  key: HomeMacroKey;
  label: string;
  unit: string;
  actual: string;
  target: string;
  delta: string;
  progress: number;
  status: 'neutral' | 'under' | 'exact' | 'over';
}

interface HomeScheduleRow {
  key: string;
  title: string;
  rangeLabel: string;
  items: InputDayItemSummary[];
  plannedItems: InputDayTemplateItemSummary[];
}

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    NgClass,
    MatProgressBarModule,
    UiErrorPanel,
    InputDayFeature,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly inputDayService = inject(InputDayService);
  private readonly statisticService = inject(StatisticService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly now = DateTime.local();

  readonly todayDateLocal = this.now.toFormat('yyyy-LL-dd');
  readonly todayLabel = this.now.setLocale('fr').toFormat('cccc d LLLL');
  readonly timezone = this.now.zoneName || 'UTC';
  readonly macroDefinitions: Array<{
    key: HomeMacroKey;
    label: string;
    unit: string;
  }> = [
    { key: 'energyKcal', label: 'Energie', unit: 'kcal' },
    { key: 'proteins', label: 'Proteines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'lipids', label: 'Lipides', unit: 'g' },
  ];

  baseUrl = '';
  loadingDay = false;
  loadingTimeline = false;
  dayError: unknown = null;
  timelineError: unknown = null;
  inputDayResponse: InputDayResponse | null = null;
  timelineResponse: StatisticsTimelineResponse | null = null;

  ngOnInit(): void {
    this.baseUrl = this.statisticService.baseUrl;
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.statisticService.setBaseUrl(this.baseUrl);
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loadTodayPlanning();
    this.loadTodayStats();
  }

  onInputDayItemsChanged(): void {
    this.refreshDashboard();
  }

  get loading(): boolean {
    return this.loadingDay || this.loadingTimeline;
  }

  get todayTimelineDay(): StatisticsTimelineDay | null {
    return (
      this.timelineResponse?.days.find(
        (day) => day.dateLocal === this.todayDateLocal,
      ) ?? null
    );
  }

  get activeCycleLabel(): string {
    const assignment =
      this.inputDayResponse?.assignment ?? this.todayTimelineDay?.inputs.assignment;

    return assignment?.cycleTitle ?? 'Aucun cycle actif';
  }

  get activeDaySetLabel(): string {
    const daySet =
      this.inputDayResponse?.daySet ?? this.todayTimelineDay?.inputs.daySet;

    return daySet?.title ?? 'Aucun day set';
  }

  get enteredItemCount(): number {
    return (
      this.inputDayResponse?.items.length ??
      this.todayTimelineDay?.inputs.itemCount ??
      0
    );
  }

  get pendingTemplateItems(): InputDayTemplateItemSummary[] {
    return (this.inputDayResponse?.templateItems ?? []).filter(
      (item) => item.status === 'pending',
    );
  }

  get convertedTemplateItems(): InputDayTemplateItemSummary[] {
    return (this.inputDayResponse?.templateItems ?? []).filter(
      (item) => item.status === 'converted',
    );
  }

  get macroCards(): HomeMacroCard[] {
    const totals =
      this.inputDayResponse?.totalsMacros ?? this.inputDayResponse?.projectedTotalsMacros;
    const timelineInputs = this.todayTimelineDay?.inputs ?? null;
    const dayTotal = totals?.dayTotal ?? timelineInputs?.dayTotal ?? {};
    const targets = totals?.targets ?? timelineInputs?.targets ?? null;
    const deltas = totals?.deltaToTargets ?? timelineInputs?.deltaToTargets ?? null;

    return this.macroDefinitions.map((definition) => {
      const actual = dayTotal[definition.key];
      const target = targets?.[definition.key] ?? null;
      const delta = deltas?.[definition.key] ?? null;
      const progress = this.getMacroProgress(actual, target);

      return {
        ...definition,
        actual: this.formatMetricValue(actual, definition.unit),
        target: this.formatMetricValue(target, definition.unit),
        delta: this.formatMetricValue(delta, definition.unit, true),
        progress,
        status: this.getMacroStatus(actual, target),
      };
    });
  }

  get scheduleRows(): HomeScheduleRow[] {
    const response = this.inputDayResponse;
    if (!response) {
      return [];
    }

    const slots = this.resolveDaySlots(response);
    const rows = slots.map((slot) =>
      this.buildScheduleRow(
        this.getSlotKey(slot),
        slot.title,
        this.formatSlotRange(slot),
        response,
      ),
    );

    const orphanItems = response.items.filter((item) => !this.findSlotForItem(item));
    const orphanPlannedItems = (response.templateItems ?? []).filter(
      (item) => !this.findSlotForTemplateItem(item),
    );

    if (orphanItems.length > 0 || orphanPlannedItems.length > 0) {
      rows.push({
        key: 'without-slot',
        title: 'Sans slot',
        rangeLabel: 'Horaire libre',
        items: orphanItems,
        plannedItems: orphanPlannedItems,
      });
    }

    return rows;
  }

  get recentPurchaseEvents(): InventoryPurchaseEventSummary[] {
    return [...(this.todayTimelineDay?.expenses.events ?? [])]
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, 5);
  }

  get todayExpenseTotal(): string {
    return this.formatCurrency(this.todayTimelineDay?.expenses.totalAmount ?? 0);
  }

  get purchaseCount(): number {
    return this.todayTimelineDay?.expenses.purchaseCount ?? 0;
  }

  get incompletePurchaseCount(): number {
    return this.todayTimelineDay?.expenses.incompletePurchaseCount ?? 0;
  }

  get targetSourceLabel(): string {
    const source =
      this.inputDayResponse?.totalsMacros?.targetSource ??
      this.todayTimelineDay?.inputs.targetSource ??
      'none';

    if (source === 'daySet') {
      return 'Day set';
    }

    if (source === 'cycle') {
      return 'Cycle';
    }

    return 'Aucune cible';
  }

  formatCurrency(value: number | null | undefined): string {
    const normalized =
      typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalized);
  }

  formatItemQty(item: InputDayItemSummary | InputDayTemplateItemSummary): string {
    const qty = this.roundNumber(item.qty);
    return `${qty} ${item.qtyUnit ?? ''}`.trim();
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const parsed = DateTime.fromISO(value, { setZone: true });
    if (!parsed.isValid) {
      return value;
    }

    return parsed.setZone(this.timezone).toFormat('HH:mm');
  }

  getPurchaseEventLabel(event: InventoryPurchaseEventSummary): string {
    if (event.excludedFromStats || event.pricingStatus === 'excluded') {
      return event.exclusionReason === 'refunded' ? 'Rembourse' : 'Exclu';
    }

    if (event.pricingStatus === 'free') {
      return 'Gratuit';
    }

    if (event.pricingStatus === 'incomplete') {
      return 'Prix incomplet';
    }

    return this.formatCurrency(event.expenseAmount ?? 0);
  }

  getTemplateStockLabel(item: InputDayTemplateItemSummary): string {
    return item.stockAvailability.enoughStock ? 'Stock OK' : 'Stock insuffisant';
  }

  private loadTodayPlanning(): void {
    this.loadingDay = true;
    this.dayError = null;
    this.inputDayService.getInputDay(this.todayDateLocal, this.timezone).subscribe({
      next: (response) => {
        this.inputDayResponse = response;
        this.loadingDay = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.inputDayResponse = null;
        this.dayError = error;
        this.loadingDay = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private loadTodayStats(): void {
    this.loadingTimeline = true;
    this.timelineError = null;
    this.statisticService
      .getTimeline(this.todayDateLocal, this.todayDateLocal, this.timezone)
      .subscribe({
        next: (response) => {
          this.timelineResponse = response;
          this.loadingTimeline = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.timelineResponse = null;
          this.timelineError = error;
          this.loadingTimeline = false;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private resolveDaySlots(
    response: InputDayResponse,
  ): InputDayDaySetSlotSummary[] {
    return response.slots && response.slots.length > 0
      ? response.slots
      : (response.daySet?.slots ?? []);
  }

  private buildScheduleRow(
    key: string,
    title: string,
    rangeLabel: string,
    response: InputDayResponse,
  ): HomeScheduleRow {
    return {
      key,
      title,
      rangeLabel,
      items: response.items.filter((item) => this.doesItemMatchSlot(item, key)),
      plannedItems: (response.templateItems ?? []).filter((item) =>
        this.doesTemplateItemMatchSlot(item, key),
      ),
    };
  }

  private findSlotForItem(
    item: InputDayItemSummary,
  ): InputDayDaySetSlotSummary | null {
    const slots = this.inputDayResponse
      ? this.resolveDaySlots(this.inputDayResponse)
      : [];
    return (
      slots.find((slot) => {
        if (item.slotId !== null && item.slotId === slot.slotId) {
          return true;
        }

        return item.slotKey != null && item.slotKey === slot.slotKey;
      }) ?? null
    );
  }

  private findSlotForTemplateItem(
    item: InputDayTemplateItemSummary,
  ): InputDayDaySetSlotSummary | null {
    const slots = this.inputDayResponse
      ? this.resolveDaySlots(this.inputDayResponse)
      : [];
    return (
      slots.find((slot) => {
        if (item.slotId !== null && item.slotId === slot.slotId) {
          return true;
        }

        return item.slotKey != null && item.slotKey === slot.slotKey;
      }) ?? null
    );
  }

  private doesItemMatchSlot(item: InputDayItemSummary, slotKey: string): boolean {
    const slot = this.findSlotForItem(item);
    return slot ? this.getSlotKey(slot) === slotKey : false;
  }

  private doesTemplateItemMatchSlot(
    item: InputDayTemplateItemSummary,
    slotKey: string,
  ): boolean {
    const slot = this.findSlotForTemplateItem(item);
    return slot ? this.getSlotKey(slot) === slotKey : false;
  }

  private getSlotKey(slot: InputDayDaySetSlotSummary): string {
    return slot.slotId !== null ? `slot-${slot.slotId}` : `key-${slot.slotKey}`;
  }

  private formatSlotRange(slot: InputDayDaySetSlotSummary): string {
    return `${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}`;
  }

  private formatTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private formatMetricValue(
    value: InputDayMacroValue | number | null | undefined,
    unit: string,
    showSign = false,
  ): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const formatted = this.roundNumber(Math.abs(value));
      const sign = showSign && value > 0 ? '+' : showSign && value < 0 ? '-' : '';
      return `${sign}${formatted} ${unit}`.trim();
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }

    return '-';
  }

  private getMacroProgress(
    actual: InputDayMacroValue | undefined,
    target: number | null | undefined,
  ): number {
    if (
      typeof actual !== 'number' ||
      !Number.isFinite(actual) ||
      typeof target !== 'number' ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      return 0;
    }

    return Math.max(4, Math.min(100, Math.round((actual / target) * 100)));
  }

  private getMacroStatus(
    actual: InputDayMacroValue | undefined,
    target: number | null | undefined,
  ): HomeMacroCard['status'] {
    if (
      typeof actual !== 'number' ||
      !Number.isFinite(actual) ||
      typeof target !== 'number' ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      return 'neutral';
    }

    const ratio = actual / target;
    if (ratio > 1.05) {
      return 'over';
    }

    if (ratio >= 0.95) {
      return 'exact';
    }

    return 'under';
  }

  private roundNumber(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }
}
