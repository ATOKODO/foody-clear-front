import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiEmptyState } from '../../app/ui/empty-state/empty-state';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { Language } from '../../app/i18n/language';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { LatestRequest } from '../../utils/latest-request';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  InventoryPurchaseEventSummary,
  ProductPriceHistoryStatsResponse,
  ProductPriceUnit,
  StatisticsTimelineDay,
  StatisticsTimelineResponse,
} from '../../interfaces/statistics.interface';
import { Product, ProductService } from '../../services/product-service';
import { StatisticService } from '../../services/statistic-service';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  buildStatisticPriceCorrectionDto,
  buildStatisticTimelineRequestKey,
  findSelectedStatisticTimelineDay,
  findStatisticMetricOption,
  formatStatisticCurrency,
  formatStatisticDate,
  formatStatisticDateTime,
  formatStatisticMetricValue,
  getStatisticBarHeight,
  getStatisticExpenseMax,
  getStatisticPurchaseEventStatusLabel,
  getStatisticSelectedProductName,
  getStatisticTargetActualHeight,
  getStatisticTargetGoalHeight,
  getStatisticTargetMax,
  isStatisticDateRangeValid,
  resolveSelectedStatisticTimelineDate,
  resolveStatisticDateRange,
  resolveStatisticPriceCorrectionDefaults,
  resolveStatisticTimezone,
} from './statistic.helpers';
import {
  STATISTIC_METRIC_OPTIONS,
  STATISTIC_PRICE_UNIT_OPTIONS,
  STATISTIC_VIEW_OPTIONS,
  StatisticMetricKey,
  StatisticView,
} from './statistic.models';

@Component({
  selector: 'app-statistic',
  imports: [UiStatusBadge, UiEmptyState, UiButton,
    TranslatePipe,
    FormsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    UiErrorPanel,
  ],
  templateUrl: './statistic.feature.html',
  styleUrl: './statistic.feature.scss',
})
export class StatisticFeature implements OnInit {
  readonly language = inject(Language);
  private readonly statisticService = inject(StatisticService);
  private readonly productService = inject(ProductService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly timelineRequest = new LatestRequest(inject(DestroyRef));
  private readonly priceHistoryRequest = new LatestRequest(inject(DestroyRef));

  private readonly initialDateRange = resolveStatisticDateRange(30);

  baseUrl = '';
  timezone = resolveStatisticTimezone();
  fromDateLocal = this.initialDateRange.fromDateLocal;
  toDateLocal = this.initialDateRange.toDateLocal;

  activeView: StatisticView = 'targets';
  activeMetric: StatisticMetricKey = 'energyKcal';

  loadingTimeline = false;
  loadingProducts = false;
  loadingPriceHistory = false;
  savingPurchaseEventId: number | null = null;
  correctingPrice = false;

  timelineError: unknown = null;
  productError: unknown = null;
  priceHistoryError: unknown = null;
  purchaseEventActionError: unknown = null;
  priceCorrectionError: unknown = null;

  timelineResponse: StatisticsTimelineResponse | null = null;
  priceHistoryResponse: ProductPriceHistoryStatsResponse | null = null;
  products: Product[] = [];
  selectedTimelineDateLocal = '';
  selectedPriceProductId: number | null = null;
  priceCorrectionPrice: number | null = null;
  priceCorrectionPriceUnit: ProductPriceUnit = 'kg';
  priceCorrectionFromDateLocal = this.fromDateLocal;
  priceCorrectionToDateLocal = '';
  priceCorrectionRecalculatePurchases = true;
  private activeTimelineRequestKey: string | null = null;

  readonly views = STATISTIC_VIEW_OPTIONS;
  readonly priceUnitOptions = STATISTIC_PRICE_UNIT_OPTIONS;
  readonly metricOptions = STATISTIC_METRIC_OPTIONS;

  ngOnInit(): void {
    this.baseUrl = this.statisticService.baseUrl;
    this.productService.setBaseUrl(this.baseUrl);
    this.loadProducts();
    this.loadTimeline();
  }

  onBaseUrlChange(): void {
    this.timelineRequest.cancel();
    this.priceHistoryRequest.cancel();
    this.activeTimelineRequestKey = null;
    this.statisticService.setBaseUrl(this.baseUrl);
    this.productService.setBaseUrl(this.baseUrl);
    this.loadProducts();
    this.loadTimeline();
  }

  applyQuickRange(days: number): void {
    const range = resolveStatisticDateRange(days);
    this.fromDateLocal = range.fromDateLocal;
    this.toDateLocal = range.toDateLocal;
    this.priceCorrectionFromDateLocal = this.fromDateLocal;
    this.loadTimeline();
    this.loadPriceHistory();
  }

  refresh(): void {
    this.loadTimeline();
    this.loadPriceHistory();
  }

  selectTimelineDay(dateLocal: string): void {
    this.selectedTimelineDateLocal = dateLocal;
  }

  onPriceProductChange(): void {
    this.syncPriceCorrectionDefaults();
    this.loadPriceHistory();
  }

  excludePurchaseEvent(event: InventoryPurchaseEventSummary): void {
    this.updatePurchaseEventExclusion(event.id, true);
  }

  restorePurchaseEvent(event: InventoryPurchaseEventSummary): void {
    this.updatePurchaseEventExclusion(event.id, false);
  }

  submitPriceCorrection(): void {
    if (this.correctingPrice) return;
    const dto = buildStatisticPriceCorrectionDto({
      selectedProductId: this.selectedPriceProductId,
      price: this.priceCorrectionPrice,
      priceUnit: this.priceCorrectionPriceUnit,
      fromDateLocal: this.priceCorrectionFromDateLocal,
      toDateLocal: this.priceCorrectionToDateLocal,
      recalculatePurchases: this.priceCorrectionRecalculatePurchases,
    });

    if (!dto) {
      this.priceCorrectionError = { message: 'Correction de prix invalide.' };
      return;
    }

    this.correctingPrice = true;
    this.priceCorrectionError = null;
    const recalculatePurchases = this.priceCorrectionRecalculatePurchases;
    this.statisticService
      .correctProductPrice(dto, this.timezone)
      .subscribe({
        next: () => {
          this.loadPriceHistory();
          this.correctingPrice = false;
          if (recalculatePurchases) {
            this.loadTimeline(true);
          }
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.priceCorrectionError = error;
          this.correctingPrice = false;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  get selectedTimelineDay(): StatisticsTimelineDay | null {
    return findSelectedStatisticTimelineDay(
      this.timelineResponse,
      this.selectedTimelineDateLocal,
    );
  }

  get expenseMax(): number {
    return getStatisticExpenseMax(this.timelineResponse);
  }

  get targetMax(): number {
    return getStatisticTargetMax(this.timelineResponse, this.activeMetric);
  }

  get metricLabel(): string {
    return (
      findStatisticMetricOption(this.metricOptions, this.activeMetric)?.label ??
      this.activeMetric
    );
  }

  get metricUnit(): string {
    return (
      findStatisticMetricOption(this.metricOptions, this.activeMetric)?.unit ??
      ''
    );
  }

  get selectedProductName(): string {
    return getStatisticSelectedProductName(
      this.products,
      this.selectedPriceProductId,
    );
  }

  get selectedDayExpenseTotal(): string {
    return this.formatCurrency(
      this.selectedTimelineDay?.expenses.totalAmount ?? 0,
    );
  }

  get selectedDayTargetActual(): string {
    const value = this.selectedTimelineDay?.inputs.dayTotal[this.activeMetric];
    return this.formatMetricValue(value);
  }

  get selectedDayTargetGoal(): string {
    const value =
      this.selectedTimelineDay?.inputs.targets?.[this.activeMetric] ?? null;
    return this.formatMetricValue(value);
  }

  get selectedDayTargetDelta(): string {
    const value =
      this.selectedTimelineDay?.inputs.deltaToTargets?.[this.activeMetric] ??
      null;
    return this.formatMetricValue(value);
  }

  getBarHeight(value: number, max: number): number {
    return getStatisticBarHeight(value, max);
  }

  getTargetActualHeight(day: StatisticsTimelineDay): number {
    return getStatisticTargetActualHeight(
      day,
      this.activeMetric,
      this.targetMax,
    );
  }

  getTargetGoalHeight(day: StatisticsTimelineDay): number {
    return getStatisticTargetGoalHeight(day, this.activeMetric, this.targetMax);
  }

  formatCurrency(value: number | null | undefined): string {
    return formatStatisticCurrency(value, this.language.locale());
  }

  formatMetricValue(value: unknown): string {
    return formatStatisticMetricValue(value, this.metricUnit, this.language.locale());
  }

  formatDateTime(value: string | null | undefined): string {
    return formatStatisticDateTime(value, this.timezone);
  }

  formatDate(value: string): string {
    return formatStatisticDate(value);
  }

  formatPriceChangeUnit(value: ProductPriceUnit | null | undefined): string {
    return value ? `/${this.language.translate(value)}` : '';
  }

  formatTargetSource(value: string): string {
    return this.language.translate(value === 'daySet' ? 'Day set' : value === 'cycle' ? 'Cycle' : 'None');
  }

  getPurchaseEventStatusLabel(event: InventoryPurchaseEventSummary): string {
    return getStatisticPurchaseEventStatusLabel(event);
  }

  private updatePurchaseEventExclusion(
    eventId: number,
    excludedFromStats: boolean,
  ): void {
    this.savingPurchaseEventId = eventId;
    this.purchaseEventActionError = null;
    this.statisticService
      .updatePurchaseEventExclusion(
        eventId,
        {
          excludedFromStats,
          exclusionReason: excludedFromStats ? 'refunded' : null,
        },
        this.fromDateLocal,
        this.toDateLocal,
        this.timezone,
      )
      .subscribe({
        next: () => {
          this.savingPurchaseEventId = null;
          this.loadTimeline(true);
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.purchaseEventActionError = error;
          this.savingPurchaseEventId = null;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private syncPriceCorrectionDefaults(): void {
    const defaults = resolveStatisticPriceCorrectionDefaults(
      this.products,
      this.selectedPriceProductId,
      {
        price: this.priceCorrectionPrice,
        priceUnit: this.priceCorrectionPriceUnit,
      },
    );
    this.priceCorrectionPrice = defaults.price;
    this.priceCorrectionPriceUnit = defaults.priceUnit;
  }

  private loadTimeline(force = false): void {
    if (!this.isCurrentDateRangeValid()) {
      this.timelineRequest.cancel();
      this.timelineResponse = null;
      this.loadingTimeline = false;
      this.activeTimelineRequestKey = null;
      return;
    }

    const requestKey = buildStatisticTimelineRequestKey(
      this.fromDateLocal,
      this.toDateLocal,
      this.timezone,
    );
    if (!force && this.loadingTimeline && this.activeTimelineRequestKey === requestKey) {
      return;
    }

    this.activeTimelineRequestKey = requestKey;
    this.loadingTimeline = true;
    this.timelineError = null;
    this.timelineRequest.subscribe(
      this.statisticService.getTimeline(this.fromDateLocal, this.toDateLocal, this.timezone), {
        next: (response) => {
          this.timelineResponse = response;
          this.loadingTimeline = false;
          this.activeTimelineRequestKey = null;
          this.selectedTimelineDateLocal =
            resolveSelectedStatisticTimelineDate(
              response,
              this.selectedTimelineDateLocal,
            );
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.timelineError = error;
          this.timelineResponse = null;
          this.loadingTimeline = false;
          this.activeTimelineRequestKey = null;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productError = null;
    this.productService.findAll().subscribe({
      next: (response) => {
        this.products = response;
        if (this.selectedPriceProductId == null && this.products.length > 0) {
          this.selectedPriceProductId = this.products[0].id;
          this.syncPriceCorrectionDefaults();
        }
        this.loadingProducts = false;
        this.loadPriceHistory();
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.products = [];
        this.productError = error;
        this.loadingProducts = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private loadPriceHistory(): void {
    this.priceHistoryRequest.cancel();
    if (!this.isCurrentDateRangeValid() || this.selectedPriceProductId == null) {
      this.priceHistoryResponse = null;
      this.loadingPriceHistory = false;
      return;
    }

    this.loadingPriceHistory = true;
    this.priceHistoryError = null;
    this.priceHistoryRequest.subscribe(
      this.statisticService.getProductPriceHistory(
        this.selectedPriceProductId,
        this.fromDateLocal,
        this.toDateLocal,
        this.timezone,
      ), {
        next: (response) => {
          this.priceHistoryResponse = response;
          this.loadingPriceHistory = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.priceHistoryError = error;
          this.priceHistoryResponse = null;
          this.loadingPriceHistory = false;
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  private isCurrentDateRangeValid(): boolean {
    return isStatisticDateRangeValid(this.fromDateLocal, this.toDateLocal);
  }
}
