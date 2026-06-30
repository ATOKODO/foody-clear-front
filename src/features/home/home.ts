import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { DateTime } from 'luxon';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  ExternalMealEntrySummary,
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
import { Slot } from '../../interfaces/slot.interface';
import { ExternalMealEntryDialogService } from '../../services/external-meal-entry-dialog-service';
import { InputDayService } from '../../services/input-day-service';
import { SlotService } from '../../services/slot-service';
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

interface HomeDayEntryRow {
  key: string;
  id: number;
  timeLabel: string;
  productName: string;
  slotLabel: string;
  qtyLabel: string;
  isExternal: boolean;
  paymentLabel: string | null;
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
  private readonly externalMealEntryDialog = inject(ExternalMealEntryDialogService);
  private readonly inputDayService = inject(InputDayService);
  private readonly statisticService = inject(StatisticService);
  private readonly slotService = inject(SlotService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly now = DateTime.local();

  readonly todayDateLocal = this.now.toFormat('yyyy-LL-dd');
  readonly todayLabel = this.now.setLocale('fr').toFormat('cccc d LLLL');
  readonly timezone = this.now.zoneName || 'UTC';
  readonly planningTodayQueryParams = {
    view: 'day',
    date: this.todayDateLocal,
  };
  readonly macroDefinitions: {
    key: HomeMacroKey;
    label: string;
    unit: string;
  }[] = [
    { key: 'energyKcal', label: 'Energie', unit: 'kcal' },
    { key: 'proteins', label: 'Proteines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'lipids', label: 'Lipides', unit: 'g' },
  ];

  baseUrl = '';
  loadingDay = false;
  loadingTimeline = false;
  slotCatalogLoaded = false;
  dayError: unknown = null;
  timelineError: unknown = null;
  inputDayResponse: InputDayResponse | null = null;
  timelineResponse: StatisticsTimelineResponse | null = null;
  slotCatalog: Slot[] = [];

  ngOnInit(): void {
    this.baseUrl = this.statisticService.baseUrl;
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.statisticService.setBaseUrl(this.baseUrl);
    this.slotService.setBaseUrl(this.baseUrl);
    this.loadTodayPlanning();
    this.scheduleDeferredDashboardData();
  }

  refreshDashboard(): void {
    this.loadTodayPlanning();
    this.loadTodayStats();
    this.ensureSlotCatalogLoaded();
  }

  onInputDayItemsChanged(): void {
    this.refreshDashboard();
  }

  openExternalMealEntry(): void {
    this.externalMealEntryDialog
      .openCreate({
        apiBaseUrl: this.baseUrl,
        dateLocal: this.todayDateLocal,
        occurredAt: DateTime.local().toISO({ suppressMilliseconds: true }),
        timezone: this.timezone,
        slots: this.inputDayResponse ? this.resolveDaySlots(this.inputDayResponse) : [],
      })
      .subscribe((result) => {
        if (result) {
          this.refreshDashboard();
        }
      });
  }

  get loading(): boolean {
    return this.loadingDay || this.loadingTimeline;
  }

  get showPrimaryLoading(): boolean {
    return this.loadingDay && this.inputDayResponse === null;
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
      (this.inputDayResponse
        ? this.inputDayResponse.items.length + this.externalEntries.length
        : this.todayTimelineDay?.inputs.itemCount) ?? 0
    );
  }

  get externalEntries(): ExternalMealEntrySummary[] {
    return this.inputDayResponse?.externalEntries ?? [];
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
        title: 'Non rattache a un slot',
        rangeLabel: 'Sans plage horaire',
        items: orphanItems,
        plannedItems: orphanPlannedItems,
      });
    }

    return rows;
  }

  get dayEntryRows(): HomeDayEntryRow[] {
    const response = this.inputDayResponse;
    if (!response) {
      return [];
    }

    const stockRows = response.items.map((item) => ({
      key: `stock-${item.id}`,
      id: item.id,
      occurredAt: this.resolveItemTimestamp(item),
      timeLabel: this.formatDateTime(item.occurredAt || item.insertedAt),
      productName: item.productName,
      slotLabel: this.getItemSlotLabel(item),
      qtyLabel: this.formatItemQty(item),
      isExternal: false,
      paymentLabel: null,
    }));

    const externalRows = this.externalEntries.map((entry) => ({
      key: `external-${entry.id}`,
      id: entry.id,
      occurredAt: entry.occurredAt,
      timeLabel: this.formatDateTime(entry.occurredAt),
      productName: entry.name,
      slotLabel: this.getExternalEntrySlotLabel(entry),
      qtyLabel: this.formatExternalEntryMacros(entry),
      isExternal: true,
      paymentLabel: this.getExternalPaymentLabel(entry),
    }));

    return [...stockRows, ...externalRows]
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .map((row) => ({
        key: row.key,
        id: row.id,
        timeLabel: row.timeLabel,
        productName: row.productName,
        slotLabel: row.slotLabel,
        qtyLabel: row.qtyLabel,
        isExternal: row.isExternal,
        paymentLabel: row.paymentLabel,
      }));
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
    if (this.isConvertedTemplateItem(item)) {
      return 'Converti';
    }

    return item.stockAvailability.enoughStock ? 'Stock OK' : 'Stock insuffisant';
  }

  getTemplateSlotLabel(item: InputDayTemplateItemSummary): string {
    const slot = this.findSlotForTemplateItem(item);
    if (slot) {
      return `${slot.title} · ${this.formatSlotRange(slot)}`;
    }

    const slotKey = item.slotKey?.trim();
    return slotKey ? `Slot ${slotKey}` : 'Non rattache a un slot';
  }

  canConvertTemplateItem(item: InputDayTemplateItemSummary): boolean {
    return (
      !this.isConvertedTemplateItem(item) &&
      item.status === 'pending' &&
      this.getTemplateInventoryId(item) !== null
    );
  }

  isConvertedTemplateItem(item: InputDayTemplateItemSummary): boolean {
    return item.status === 'converted' || this.getConvertedItemId(item) !== null;
  }

  convertTemplateItem(item: InputDayTemplateItemSummary): void {
    const inventoryId = this.getTemplateInventoryId(item);
    if (inventoryId === null || this.loadingDay) {
      return;
    }

    this.loadingDay = true;
    this.dayError = null;
    this.inputDayService
      .convertTemplateItem(this.todayDateLocal, item.id, [inventoryId])
      .subscribe({
        next: (response) => {
          this.inputDayResponse = response;
          this.loadingDay = false;
          this.loadTodayStats();
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.dayError = error;
          this.loadingDay = false;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  revertTemplateItem(item: InputDayTemplateItemSummary): void {
    const itemId = this.getConvertedItemId(item);
    if (itemId === null || this.loadingDay) {
      return;
    }

    this.loadingDay = true;
    this.dayError = null;
    this.inputDayService.removeItem(this.todayDateLocal, itemId).subscribe({
      next: () => {
        this.loadTodayPlanning();
        this.loadTodayStats();
      },
      error: (error) => {
        this.dayError = error;
        this.loadingDay = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private loadSlotCatalog(): void {
    this.slotService.findAll().subscribe({
      next: (response) => {
        this.slotCatalog = response;
        this.slotCatalogLoaded = true;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.slotCatalog = [];
        this.slotCatalogLoaded = true;
      },
    });
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

  private scheduleDeferredDashboardData(): void {
    this.runAfterFirstPaint(() => {
      this.ensureSlotCatalogLoaded();
      this.loadTodayStats();
    });
  }

  private ensureSlotCatalogLoaded(): void {
    if (this.slotCatalogLoaded) {
      return;
    }

    this.loadSlotCatalog();
  }

  private runAfterFirstPaint(task: () => void): void {
    globalThis.setTimeout(task, 0);
  }

  private resolveDaySlots(
    response: InputDayResponse,
  ): InputDayDaySetSlotSummary[] {
    return this.mergeSlots(
      response.daySet?.slots ?? [],
      response.slots ?? [],
      this.resolveTemplateCatalogSlots(response),
    );
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

  private getTemplateInventoryId(
    item: InputDayTemplateItemSummary,
  ): number | null {
    if (!item.stockAvailability.enoughStock) {
      return null;
    }

    return (
      item.stockByInventory.find((stock) => stock.enoughStock)?.inventoryId ??
      null
    );
  }

  private getConvertedItemId(item: InputDayTemplateItemSummary): number | null {
    if (item.convertedItemId !== null) {
      return item.convertedItemId;
    }

    return (
      this.inputDayResponse?.items.find(
        (enteredItem) => enteredItem.templateItemId === item.id,
      )?.id ?? null
    );
  }

  private getItemSlotLabel(item: InputDayItemSummary): string {
    const slot = this.findSlotForItem(item);
    if (slot) {
      return `${slot.title} · ${this.formatSlotRange(slot)}`;
    }

    const slotKey = item.slotKey?.trim();
    return slotKey ? `Slot ${slotKey}` : 'Non rattache a un slot';
  }

  private getExternalEntrySlotLabel(entry: ExternalMealEntrySummary): string {
    const slot = this.findSlotForExternalEntry(entry);
    if (slot) {
      return `${slot.title} · ${this.formatSlotRange(slot)}`;
    }

    const slotKey = entry.slotKey?.trim();
    return slotKey ? `Slot ${slotKey}` : 'Non rattache a un slot';
  }

  private findSlotForExternalEntry(
    entry: ExternalMealEntrySummary,
  ): InputDayDaySetSlotSummary | null {
    const slots = this.inputDayResponse
      ? this.resolveDaySlots(this.inputDayResponse)
      : [];
    return (
      slots.find((slot) => {
        if (entry.slotId !== null && entry.slotId === slot.slotId) {
          return true;
        }

        return entry.slotKey != null && entry.slotKey === slot.slotKey;
      }) ?? null
    );
  }

  private formatExternalEntryMacros(entry: ExternalMealEntrySummary): string {
    const macros = entry.nutritionValue;
    return `${this.roundNumber(macros.energyKcal)} kcal · P ${this.roundNumber(macros.proteins)} · G ${this.roundNumber(macros.carbs)} · L ${this.roundNumber(macros.lipids)}`;
  }

  private getExternalPaymentLabel(entry: ExternalMealEntrySummary): string {
    if (entry.paymentStatus === 'free') {
      return 'Offert';
    }

    if (entry.paymentStatus === 'refunded') {
      return 'Rembourse';
    }

    return this.formatCurrency(entry.priceAmount ?? 0);
  }

  private resolveItemTimestamp(item: InputDayItemSummary): string {
    return item.occurredAt?.trim() || item.insertedAt?.trim() || '';
  }

  private resolveTemplateCatalogSlots(
    response: InputDayResponse,
  ): InputDayDaySetSlotSummary[] {
    const referencedIds = new Set(
      (response.templateItems ?? [])
        .map((item) => item.slotId)
        .filter((slotId): slotId is number => typeof slotId === 'number'),
    );
    const referencedKeys = new Set(
      (response.templateItems ?? [])
        .map((item) => item.slotKey?.trim() ?? '')
        .filter((slotKey) => slotKey !== ''),
    );

    return this.slotCatalog
      .filter(
        (slot) => referencedIds.has(slot.id) || referencedKeys.has(slot.key),
      )
      .map((slot) => ({
        slotId: slot.id,
        slotKey: slot.key,
        title: slot.title,
        sortOrder: slot.sortOrder,
        startTime: slot.startTime ?? null,
        endTime: slot.endTime ?? null,
        nutritionValue: null,
      }));
  }

  private mergeSlots(
    ...slotGroups: InputDayDaySetSlotSummary[][]
  ): InputDayDaySetSlotSummary[] {
    const uniqueSlots = new Map<string, InputDayDaySetSlotSummary>();

    slotGroups.flat().forEach((slot) => {
      const key = slot.slotId !== null ? `id:${slot.slotId}` : `key:${slot.slotKey}`;
      if (!uniqueSlots.has(key)) {
        uniqueSlots.set(key, slot);
      }
    });

    return [...uniqueSlots.values()].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, 'fr'),
    );
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
