import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { DateTime } from 'luxon';
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

type StatisticView = 'expenses' | 'targets' | 'prices';
type StatisticMetricKey = 'energyKcal' | 'proteins' | 'carbs' | 'lipids';

@Component({
  selector: 'app-statistic',
  imports: [
    FormsModule,
    MatButtonModule,
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
  private readonly statisticService = inject(StatisticService);
  private readonly productService = inject(ProductService);

  baseUrl = '';
  timezone = DateTime.local().zoneName || 'UTC';
  fromDateLocal = DateTime.local().minus({ days: 29 }).toFormat('yyyy-LL-dd');
  toDateLocal = DateTime.local().toFormat('yyyy-LL-dd');

  activeView: StatisticView = 'expenses';
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

  readonly views: Array<{ value: StatisticView; label: string }> = [
    { value: 'expenses', label: 'Depenses' },
    { value: 'targets', label: 'Objectifs' },
    { value: 'prices', label: 'Prix produit' },
  ];
  readonly priceUnitOptions: ProductPriceUnit[] = [
    'kg',
    'g',
    'l',
    'ml',
    'unite',
    'paquet',
    'bouteille',
    'boite',
    'sachet',
    'canette',
    'bocal',
    'autre',
  ];
  readonly metricOptions: Array<{
    key: StatisticMetricKey;
    label: string;
    unit: string;
  }> = [
    { key: 'energyKcal', label: 'Energie', unit: 'kcal' },
    { key: 'proteins', label: 'Proteines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'lipids', label: 'Lipides', unit: 'g' },
  ];

  ngOnInit(): void {
    this.baseUrl = this.statisticService.baseUrl;
    this.productService.setBaseUrl(this.baseUrl);
    this.loadProducts();
    this.loadTimeline();
  }

  onBaseUrlChange(): void {
    this.statisticService.setBaseUrl(this.baseUrl);
    this.productService.setBaseUrl(this.baseUrl);
    this.loadProducts();
    this.loadTimeline();
  }

  applyQuickRange(days: number): void {
    this.fromDateLocal = DateTime.local()
      .minus({ days: days - 1 })
      .toFormat('yyyy-LL-dd');
    this.toDateLocal = DateTime.local().toFormat('yyyy-LL-dd');
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
    if (
      this.selectedPriceProductId == null ||
      this.priceCorrectionPrice == null ||
      !Number.isFinite(this.priceCorrectionPrice) ||
      this.priceCorrectionPrice < 0 ||
      this.priceCorrectionFromDateLocal.length !== 10 ||
      (this.priceCorrectionToDateLocal !== '' &&
        this.priceCorrectionToDateLocal < this.priceCorrectionFromDateLocal)
    ) {
      this.priceCorrectionError = { message: 'Correction de prix invalide.' };
      return;
    }

    this.correctingPrice = true;
    this.priceCorrectionError = null;
    this.statisticService
      .correctProductPrice(
        {
          productId: this.selectedPriceProductId,
          price: this.priceCorrectionPrice,
          priceUnit: this.priceCorrectionPriceUnit,
          effectiveFrom: this.priceCorrectionFromDateLocal,
          effectiveTo: this.priceCorrectionToDateLocal || null,
          recalculatePurchases: this.priceCorrectionRecalculatePurchases,
        },
        this.timezone,
      )
      .subscribe({
        next: (response) => {
          this.priceHistoryResponse = response.priceHistory;
          this.correctingPrice = false;
          if (this.priceCorrectionRecalculatePurchases) {
            this.loadTimeline();
          }
        },
        error: (error) => {
          this.priceCorrectionError = error;
          this.correctingPrice = false;
        },
      });
  }

  get selectedTimelineDay(): StatisticsTimelineDay | null {
    if (!this.timelineResponse) {
      return null;
    }

    const dateLocal =
      this.selectedTimelineDateLocal ||
      this.timelineResponse.days[0]?.dateLocal;
    return (
      this.timelineResponse.days.find((day) => day.dateLocal === dateLocal) ??
      null
    );
  }

  get expenseMax(): number {
    return Math.max(
      1,
      ...(this.timelineResponse?.days.map(
        (day) => day.expenses.totalAmount,
      ) ?? [0]),
    );
  }

  get targetMax(): number {
    const values = (this.timelineResponse?.days ?? []).flatMap((day) => {
      const actual = day.inputs.dayTotal[this.activeMetric];
      const target = day.inputs.targets?.[this.activeMetric] ?? 0;
      return [
        typeof actual === 'number' ? actual : 0,
        typeof target === 'number' ? target : 0,
      ];
    });
    return Math.max(1, ...values);
  }

  get metricLabel(): string {
    return (
      this.metricOptions.find((item) => item.key === this.activeMetric)
        ?.label ?? this.activeMetric
    );
  }

  get metricUnit(): string {
    return (
      this.metricOptions.find((item) => item.key === this.activeMetric)?.unit ??
      ''
    );
  }

  get selectedProductName(): string {
    return (
      this.products.find(
        (product) => product.id === this.selectedPriceProductId,
      )?.name ?? 'Aucun produit'
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
    return Math.max(6, Math.round((value / max) * 100));
  }

  getTargetActualHeight(day: StatisticsTimelineDay): number {
    const value = day.inputs.dayTotal[this.activeMetric];
    return typeof value === 'number'
      ? this.getBarHeight(value, this.targetMax)
      : 6;
  }

  getTargetGoalHeight(day: StatisticsTimelineDay): number {
    const value = day.inputs.targets?.[this.activeMetric] ?? 0;
    return this.getBarHeight(value, this.targetMax);
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

  formatMetricValue(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${this.round(value)} ${this.metricUnit}`.trim();
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }

    return '--';
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '--';
    }

    const parsed = DateTime.fromISO(value, { setZone: true });
    if (!parsed.isValid) {
      return value;
    }

    return parsed.setZone(this.timezone).toFormat('dd/LL HH:mm');
  }

  formatDate(value: string): string {
    const parsed = DateTime.fromISO(value);
    return parsed.isValid ? parsed.toFormat('dd/LL') : value;
  }

  formatPriceChangeUnit(value: ProductPriceUnit | null | undefined): string {
    return value ? `/${value}` : '';
  }

  getPurchaseEventStatusLabel(event: InventoryPurchaseEventSummary): string {
    if (event.excludedFromStats || event.pricingStatus === 'excluded') {
      return event.exclusionReason === 'refunded' ? 'rembourse' : 'exclu';
    }

    if (event.pricingStatus === 'free') {
      return 'gratuit';
    }

    return event.pricingStatus === 'complete' ? 'complet' : 'prix incomplet';
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
        next: (response) => {
          this.timelineResponse = response;
          this.savingPurchaseEventId = null;
          this.selectedTimelineDateLocal =
            this.selectedTimelineDateLocal &&
            response.days.some(
              (day) => day.dateLocal === this.selectedTimelineDateLocal,
            )
              ? this.selectedTimelineDateLocal
              : (response.days[0]?.dateLocal ?? '');
        },
        error: (error) => {
          this.purchaseEventActionError = error;
          this.savingPurchaseEventId = null;
        },
      });
  }

  private syncPriceCorrectionDefaults(): void {
    const selected = this.products.find(
      (product) => product.id === this.selectedPriceProductId,
    );
    this.priceCorrectionPrice =
      typeof selected?.price === 'number' && Number.isFinite(selected.price)
        ? selected.price
        : this.priceCorrectionPrice;
    this.priceCorrectionPriceUnit =
      (selected?.priceUnit as ProductPriceUnit | null | undefined) ??
      this.priceCorrectionPriceUnit;
  }

  private loadTimeline(): void {
    if (!this.isDateRangeValid()) {
      return;
    }

    this.loadingTimeline = true;
    this.timelineError = null;
    this.statisticService
      .getTimeline(this.fromDateLocal, this.toDateLocal, this.timezone)
      .subscribe({
        next: (response) => {
          this.timelineResponse = response;
          this.loadingTimeline = false;
          this.selectedTimelineDateLocal =
            this.selectedTimelineDateLocal &&
            response.days.some(
              (day) => day.dateLocal === this.selectedTimelineDateLocal,
            )
              ? this.selectedTimelineDateLocal
              : (response.days[0]?.dateLocal ?? '');
        },
        error: (error) => {
          this.timelineError = error;
          this.timelineResponse = null;
          this.loadingTimeline = false;
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
      },
      error: (error) => {
        this.products = [];
        this.productError = error;
        this.loadingProducts = false;
      },
    });
  }

  private loadPriceHistory(): void {
    if (!this.isDateRangeValid() || this.selectedPriceProductId == null) {
      this.priceHistoryResponse = null;
      return;
    }

    this.loadingPriceHistory = true;
    this.priceHistoryError = null;
    this.statisticService
      .getProductPriceHistory(
        this.selectedPriceProductId,
        this.fromDateLocal,
        this.toDateLocal,
        this.timezone,
      )
      .subscribe({
        next: (response) => {
          this.priceHistoryResponse = response;
          this.loadingPriceHistory = false;
        },
        error: (error) => {
          this.priceHistoryError = error;
          this.priceHistoryResponse = null;
          this.loadingPriceHistory = false;
        },
      });
  }

  private isDateRangeValid(): boolean {
    return (
      this.fromDateLocal.length === 10 &&
      this.toDateLocal.length === 10 &&
      this.toDateLocal >= this.fromDateLocal
    );
  }

  private round(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }
}
