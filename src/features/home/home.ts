import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { getTemplateInventoryIds } from '../../utils/template-stock';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnInit, inject, signal } from '@angular/core';
import { LatestRequest } from '../../utils/latest-request';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { DateTime } from 'luxon';
import { Language } from '../../app/i18n/language';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import type {
  InputDayItemSummary,
  InputDayResponse,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';
import type {
  InventoryPurchaseEventSummary,
  StatisticsTimelineDay,
  StatisticsTimelineResponse,
} from '../../interfaces/statistics.interface';
import type { Slot } from '../../interfaces/slot.interface';
import { ExternalMealEntryDialogService } from '../../services/external-meal-entry-dialog-service';
import { InputDayService } from '../../services/input-day-service';
import { SlotService } from '../../services/slot-service';
import { StatisticService } from '../../services/statistic-service';
import { InputDayFeature } from '../input-day/input-day.feature';
import type {
  HomeDayEntryRow,
  HomeMacroCard,
  HomeScheduleRow,
} from './home-dashboard.types';
import {
  buildHomeDayEntryRows,
  buildHomeMacroCards,
  buildHomeScheduleRows,
  canConvertTemplateItem as canConvertTemplateItemView,
  formatCurrency as formatHomeCurrency,
  formatHomeDateTime,
  formatHomeItemQty,
  getActiveCycleLabel,
  getActiveDaySetLabel,
  getConvertedItemId,
  getConvertedTemplateItems,
  getEnteredItemCount,
  getPendingTemplateItems,
  getPurchaseEventLabel as getPurchaseEventLabelView,
  getRecentPurchaseEvents,
  getTargetSourceLabel,
  getTemplateSlotLabel as getTemplateSlotLabelView,
  getTemplateStockLabel as getTemplateStockLabelView,
  getTodayTimelineDay,
  isConvertedTemplateItem as isConvertedTemplateItemView,
  resolveDaySlots,
} from './home-dashboard.viewmodel';

@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    RouterLink,
    NgClass,
    MatProgressBarModule,
    UiErrorPanel,
    InputDayFeature,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: {
    '(window:focus)': 'refreshDashboard()',
    '(document:visibilitychange)': 'onVisibilityChange()',
  },
})
export class Home implements OnInit {
  private readonly externalMealEntryDialog = inject(ExternalMealEntryDialogService);
  private readonly inputDayService = inject(InputDayService);
  private readonly statisticService = inject(StatisticService);
  private readonly slotService = inject(SlotService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly dayRequest = new LatestRequest(this.destroyRef);
  private readonly timelineRequest = new LatestRequest(this.destroyRef);
  private readonly localDay = signal(DateTime.local());
  private midnightTimer: ReturnType<typeof setTimeout> | null = null;
  private deferredTimer: ReturnType<typeof setTimeout> | null = null;

  get todayDateLocal(): string { return this.localDay().toFormat('yyyy-LL-dd'); }
  readonly language = inject(Language);
  get todayLabel(): string { return this.localDay().setLocale(this.language.locale()).toFormat('cccc d LLLL'); }
  get timezone(): string { return this.localDay().zoneName || 'UTC'; }
  get planningTodayQueryParams(): { view: string; date: string } {
    return { view: 'day', date: this.todayDateLocal };
  }

  baseUrl = '';
  loadingDay = false;
  loadingTimeline = false;
  dayError: unknown = null;
  timelineError: unknown = null;
  inputDayResponse: InputDayResponse | null = null;
  timelineResponse: StatisticsTimelineResponse | null = null;

  private slotCatalogLoaded = false;
  private slotCatalog: Slot[] = [];

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      if (this.midnightTimer !== null) clearTimeout(this.midnightTimer);
      if (this.deferredTimer !== null) clearTimeout(this.deferredTimer);
    });
    this.configureApiBaseUrl();
    this.refreshLocalDay();
    this.loadTodayPlanning();
    this.scheduleDeferredDashboardData();
  }

  refreshDashboard(): void {
    this.refreshLocalDay();
    this.loadTodayPlanning();
    this.loadTodayStats();
    this.ensureSlotCatalogLoaded();
  }

  onVisibilityChange(): void {
    if (document.visibilityState === 'visible') this.refreshDashboard();
  }

  private refreshLocalDay(): void {
    const now = DateTime.local();
    if (now.toISODate() !== this.localDay().toISODate() || now.zoneName !== this.timezone) {
      this.dayRequest.cancel();
      this.timelineRequest.cancel();
      this.localDay.set(now);
      this.inputDayResponse = null;
      this.timelineResponse = null;
      this.loadingDay = false;
      this.loadingTimeline = false;
    }
    if (this.midnightTimer !== null) clearTimeout(this.midnightTimer);
    const delay = Math.max(1, now.plus({ days: 1 }).startOf('day').diff(now).as('milliseconds'));
    this.zone.runOutsideAngular(() => {
      this.midnightTimer = setTimeout(() => this.zone.run(() => this.refreshDashboard()), delay);
    });
  }

  onInputDayItemsChanged(): void {
    this.refreshDashboard();
  }

  openExternalMealEntry(): void {
    this.refreshLocalDay();
    this.externalMealEntryDialog
      .openCreate({
        apiBaseUrl: this.baseUrl,
        dateLocal: this.todayDateLocal,
        occurredAt: DateTime.local().toISO({ suppressMilliseconds: true }),
        timezone: this.timezone,
        slots: this.inputDayResponse
          ? resolveDaySlots(this.inputDayResponse, this.slotCatalog)
          : [],
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
    return getTodayTimelineDay(this.timelineResponse, this.todayDateLocal);
  }

  get activeCycleLabel(): string {
    return getActiveCycleLabel(this.inputDayResponse, this.todayTimelineDay, (source) => this.language.translate(source));
  }

  get activeDaySetLabel(): string {
    return getActiveDaySetLabel(this.inputDayResponse, this.todayTimelineDay, (source) => this.language.translate(source));
  }

  get enteredItemCount(): number {
    return getEnteredItemCount(this.inputDayResponse, this.todayTimelineDay);
  }

  get pendingTemplateItems(): InputDayTemplateItemSummary[] {
    return getPendingTemplateItems(this.inputDayResponse);
  }

  get convertedTemplateItems(): InputDayTemplateItemSummary[] {
    return getConvertedTemplateItems(this.inputDayResponse);
  }

  get scheduleRows(): HomeScheduleRow[] {
    return buildHomeScheduleRows(this.inputDayResponse, this.slotCatalog);
  }

  get dayEntryRows(): HomeDayEntryRow[] {
    return buildHomeDayEntryRows(
      this.inputDayResponse,
      this.timezone,
      this.slotCatalog,
      this.language.locale(),
      (source) => this.language.translate(source),
    );
  }

  get macroCards(): HomeMacroCard[] {
    return buildHomeMacroCards(this.inputDayResponse, this.todayTimelineDay, this.language.locale());
  }

  get recentPurchaseEvents(): InventoryPurchaseEventSummary[] {
    return getRecentPurchaseEvents(this.todayTimelineDay);
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
    return getTargetSourceLabel(this.inputDayResponse, this.todayTimelineDay);
  }

  formatCurrency(value: number | null | undefined): string {
    return formatHomeCurrency(value, this.language.locale());
  }

  formatItemQty(item: InputDayItemSummary | InputDayTemplateItemSummary): string {
    return formatHomeItemQty(item, this.language.locale(), (source) => this.language.translate(source));
  }

  formatDateTime(value: string | null | undefined): string {
    return formatHomeDateTime(value, this.timezone);
  }

  getPurchaseEventLabel(event: InventoryPurchaseEventSummary): string {
    return getPurchaseEventLabelView(event, this.language.locale());
  }

  getTemplateStockLabel(item: InputDayTemplateItemSummary): string {
    return getTemplateStockLabelView(item, this.inputDayResponse);
  }

  getTemplateSlotLabel(item: InputDayTemplateItemSummary): string {
    return getTemplateSlotLabelView(
      item,
      this.inputDayResponse,
      this.slotCatalog,
      (source) => this.language.translate(source),
    );
  }

  canConvertTemplateItem(item: InputDayTemplateItemSummary): boolean {
    return canConvertTemplateItemView(item, this.inputDayResponse);
  }

  isConvertedTemplateItem(item: InputDayTemplateItemSummary): boolean {
    return isConvertedTemplateItemView(item, this.inputDayResponse);
  }

  convertTemplateItem(item: InputDayTemplateItemSummary): void {
    const inventoryIds = getTemplateInventoryIds(item);
    if (inventoryIds.length === 0 || this.loadingDay) {
      return;
    }

    this.loadingDay = true;
    this.dayError = null;
    const dateLocal = this.todayDateLocal;
    this.inputDayService
      .convertTemplateItem(this.todayDateLocal, item.id, inventoryIds)
      .subscribe({
        next: (response) => {
          if (dateLocal !== this.todayDateLocal) return;
          this.inputDayResponse = response;
          this.loadingDay = false;
          this.loadTodayStats();
          this.detectChanges();
        },
        error: (error) => {
          if (dateLocal !== this.todayDateLocal) return;
          this.dayError = error;
          this.loadingDay = false;
          this.detectChanges();
        },
      });
  }

  revertTemplateItem(item: InputDayTemplateItemSummary): void {
    const itemId = getConvertedItemId(item, this.inputDayResponse);
    if (itemId === null || this.loadingDay) {
      return;
    }

    this.loadingDay = true;
    this.dayError = null;
    const dateLocal = this.todayDateLocal;
    this.inputDayService.removeItem(this.todayDateLocal, itemId).subscribe({
      next: () => {
        this.loadTodayPlanning();
        this.loadTodayStats();
      },
      error: (error) => {
        if (dateLocal !== this.todayDateLocal) return;
        this.dayError = error;
        this.loadingDay = false;
        this.detectChanges();
      },
    });
  }

  private configureApiBaseUrl(): void {
    this.baseUrl = this.statisticService.baseUrl;
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.statisticService.setBaseUrl(this.baseUrl);
    this.slotService.setBaseUrl(this.baseUrl);
  }

  private loadSlotCatalog(): void {
    this.slotService.findAll().subscribe({
      next: (response) => {
        this.slotCatalog = response;
        this.slotCatalogLoaded = true;
        this.detectChanges();
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
    this.dayRequest.subscribe(this.inputDayService.getInputDay(this.todayDateLocal, this.timezone), {
      next: (response) => {
        this.inputDayResponse = response;
        this.loadingDay = false;
        this.detectChanges();
      },
      error: (error) => {
        this.inputDayResponse = null;
        this.dayError = error;
        this.loadingDay = false;
        this.detectChanges();
      },
    });
  }

  private loadTodayStats(): void {
    this.loadingTimeline = true;
    this.timelineError = null;
    this.timelineRequest.subscribe(
      this.statisticService.getTimeline(this.todayDateLocal, this.todayDateLocal, this.timezone), {
        next: (response) => {
          this.timelineResponse = response;
          this.loadingTimeline = false;
          this.detectChanges();
        },
        error: (error) => {
          this.timelineResponse = null;
          this.timelineError = error;
          this.loadingTimeline = false;
          this.detectChanges();
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
    if (!this.slotCatalogLoaded) {
      this.loadSlotCatalog();
    }
  }

  private runAfterFirstPaint(task: () => void): void {
    this.deferredTimer = globalThis.setTimeout(() => {
      if (!this.destroyRef.destroyed) task();
    }, 0);
  }

  private detectChanges(): void {
    if (!this.destroyRef.destroyed) this.changeDetectorRef.detectChanges();
  }
}
