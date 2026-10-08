import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiDisclosure } from '../../app/ui/disclosure/disclosure';
import { UiDisclosureSummary } from '../../app/ui/disclosure-summary/disclosure-summary';
import { UiEmptyState } from '../../app/ui/empty-state/empty-state';
import { UiTableScroll } from '../../app/ui/table-scroll/table-scroll';
import { UiTableCell } from '../../app/ui/table-cell/table-cell';
import { UiTable } from '../../app/ui/table/table';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { NgTemplateOutlet, KeyValuePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
  inject,
  effect,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LatestRequest } from '../../utils/latest-request';
import { Language } from '../../app/i18n/language';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MaterialDatepickerIntl } from '../../app/i18n/material-datepicker-intl';
import { LocalizedDateAdapter } from '../../app/i18n/localized-date-adapter';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  ProductList,
  ProductListItem,
} from '../../components/product/product-list/product-list';
import {
  Inventory,
  InventoryProduct,
} from '../../interfaces/inventory.interface';
import {
  InputDayItemSummary,
  InputDayMacroValue,
  InputDayResponse,
  InputDayTemplateItemSummary,
  InputDayTargetSource,
  InputDayTotalsMacrosBySlotEntry,
  InputDayTotalsMacrosSummary,
  ProductQuantityInputUnit,
} from '../../interfaces/input-day.interface';
import { InventoryService } from '../../services/inventory-service';
import {
  Product as ProductApiModel,
  ProductService,
} from '../../services/product-service';
import { InputDayService } from '../../services/input-day-service';
import { TemplateService } from '../../services/template-service';
import { TemplateSummary } from '../../interfaces/template.interface';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { SegmentedToggle } from '../../app/ui/segmented-toggle/segmented-toggle';
import {
  INPUT_DAY_EMBEDDED_SECTION_OPTIONS,
  INPUT_DAY_QTY_UNIT_OPTIONS,
  type InputDayAvailableSlot,
  type InputDayDisplayMode,
  type InputDayEmbeddedSection,
  type InputDaySelectedInventoryTemplateStock,
  type InputDaySelectedProductRow,
  type InputDaySlotMacroEntry,
} from './input-day.models';
import {
  buildInputDayItemEditorRequest,
  buildInputDaySelectedItemsRequest,
  canCreateInputDaySelectedItems,
  canSubmitInputDayItemEditor,
  type InputDayItemEditorRequest,
  type InputDaySelectedItemsRequest,
} from './input-day.commands';
import {
  areNumberArraysEqual,
  buildInputDayAvailableSlots,
  buildInputDaySelectableProductListItems,
  canConvertInputDayTemplateItem,
  extractInputDayInventoriesFromResponse,
  extractInputDayInventoryProductsFromResponse,
  extractInputDayProductsFromResponse,
  formatInputDayDateLocal,
  formatInputDayDateTime,
  formatInputDaySelectedDateLabel,
  formatInputDayTime,
  getInputDaySelectedInventoriesTemplateStock,
  getInputDaySlotMacroEntries,
  getInputDayTargetSourceText,
  getInputDayTemplateTargetSourceText,
  hasInputDayEntries,
  mapInputDayProductsToListItems,
  normalizeInputDayInventoryIds,
  normalizeIsoString,
  normalizeNullablePositiveInteger,
  normalizePositiveInteger,
  parseInputDayDateInput,
  resolveInputDayApiErrorMessage,
  resolveInputDayFallbackTimezone,
  resolveInputDayItemSlot,
  resolveInputDayItemSlotKey,
  resolveInputDayItemSlotTitle,
  resolveInputDayTemplateItemSlotKey,
  resolveInputDayTemplateItemSlotTitle,
  toInputDayDateTimeLocalInput,
} from './input-day.helpers';
import {
  aggregateInventoryProducts,
  createInputDayEditorValue,
  resolveInputDayDateLocal,
  resolveInputDayTimezone,
  resolveSelectedSlotId,
  resolveValidInventoryIds,
} from './input-day-state.helpers';

@Component({
  selector: 'app-input-day',
  providers: [
    { provide: MatDatepickerIntl, useExisting: MaterialDatepickerIntl },
    { provide: DateAdapter, useClass: LocalizedDateAdapter },
  ],
  imports: [UiStatusBadge, UiDisclosure, UiDisclosureSummary, UiEmptyState, UiTableScroll, UiTableCell, UiTable, UiButton,
    TranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSelectModule,
    UiErrorPanel,
    ProductList,
    SegmentedToggle,
    KeyValuePipe,
    NgTemplateOutlet,
  ],
  templateUrl: './input-day.feature.html',
  styleUrl: './input-day.feature.scss',
})
export class InputDayFeature implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  readonly language = inject(Language);
  private readonly inputDaySrv = inject(InputDayService);
  private readonly productSrv = inject(ProductService);
  private readonly inventorySrv = inject(InventoryService);
  private readonly templateSrv = inject(TemplateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dayRequest = new LatestRequest(this.destroyRef);
  private readonly stockRequest = new LatestRequest(this.destroyRef);

  readonly displayMode = input<InputDayDisplayMode>('standalone');
  readonly apiBaseUrl = input<string | null>(null);
  readonly initialDateLocal = input<string | null>(null);
  readonly initialOccurredAt = input<string | null>(null);
  readonly initialEditingItemId = input<number | null>(null);
  readonly lockDate = input(false);

  readonly itemsChanged = output<{
    dateLocal: string;
  }>();

  readonly qtyUnitOptions = [...INPUT_DAY_QTY_UNIT_OPTIONS];

  baseUrl = '';
  form: FormGroup;
  itemEditorForm: FormGroup;
  private readonly loadingState = signal(false);
  get loading(): boolean { return this.loadingState(); }
  set loading(value: boolean) { this.loadingState.set(value); }
  loadingProducts = false;
  loadingInventories = false;
  private readonly loadingInventoryProductsState = signal(false);
  get loadingInventoryProducts(): boolean { return this.loadingInventoryProductsState(); }
  set loadingInventoryProducts(value: boolean) { this.loadingInventoryProductsState.set(value); }
  loadingTemplates = false;

  products: ProductApiModel[] = [];
  inventories: Inventory[] = [];
  templates: TemplateSummary[] = [];
  selectedInventoryProducts: InventoryProduct[] = [];
  productListItemsCache: ProductListItem[] = [];
  selectableProductListItemsCache: ProductListItem[] = [];
  availableSlotsCache: InputDayAvailableSlot[] = [];
  private readonly selectedProductIdsState = signal<string[]>([]);
  private readonly selectedInventoryIdsState = signal<number[]>([]);
  private readonly activeEmbeddedSectionState =
    signal<InputDayEmbeddedSection>('stock');

  selectedProducts: ProductListItem[] = [];
  selectedProductRows: InputDaySelectedProductRow[] = [];
  selectedSlotId: number | null = null;
  readonly embeddedSectionOptions = INPUT_DAY_EMBEDDED_SECTION_OPTIONS;

  lastError: unknown = null;
  productsError: unknown = null;
  inventoriesError: unknown = null;
  inventoryProductsError: unknown = null;
  itemsFormError: string | null = null;
  itemEditorError: string | null = null;
  initialDateError: string | null = null;
  editingSourceDateLocal: string | null = null;
  templateError: string | null = null;
  templateActionError: string | null = null;
  manualTemplateSelectionId: number | null = null;
  private readonly convertingTemplateItemIdsState = signal(new Set<number>());
  get convertingTemplateItemIds(): Set<number> { return this.convertingTemplateItemIdsState(); }
  set convertingTemplateItemIds(value: Set<number>) { this.convertingTemplateItemIdsState.set(value); }

  private initialized = false;
  private readonly inputDayResponseState = signal<InputDayResponse | null>(null);
  private pendingInitialOccurredAt: string | null = null;
  private pendingInitialEditingItemId: number | null = null;
  private readonly emptyProductListItems: ProductListItem[] = [];
  private readonly qtyUnitSet = new Set<ProductQuantityInputUnit>(
    this.qtyUnitOptions,
  );
  private readonly fallbackTimezone = resolveInputDayFallbackTimezone();
  private readonly inventoryProductsByInventoryId = new Map<
    number,
    InventoryProduct[]
  >();

  constructor() {
    const dateAdapter = inject(DateAdapter);
    effect(() => dateAdapter.setLocale(this.language.locale()));
    this.form = this.fb.group({
      dateLocal: this.fb.control<Date | string | null>(null, {
        validators: [Validators.required],
      }),
      timezone: this.fb.control<string>(this.fallbackTimezone, {
        nonNullable: true,
      }),
    });

    this.itemEditorForm = this.fb.group({
      itemId: this.fb.control<number | null>(null),
      dateLocal: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      occurredAt: this.fb.control<string>('', { nonNullable: true }),
      productId: this.fb.control<number | null>(null),
      qty: this.fb.control<number | null>(null),
      qtyUnit: this.fb.control<string | null>(null),
      slotId: this.fb.control<number | null>(null),
      slotKey: this.fb.control<string>('', { nonNullable: true }),
    });
  }

  ngOnInit(): void {
    this.baseUrl = this.resolveConfiguredBaseUrl();
    this.applyServicesBaseUrl();
    if (this.shouldEagerLoadProducts()) {
      this.loadProducts();
    }
    this.loadInventories();
    this.loadTemplates();
    this.applyInitialDateInput();
    this.syncPendingEditorContextFromInputs();
    this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
    this.initialized = true;

    if (this.isEmbeddedMode && this.hasValidSelectedDate) {
      this.loadDay();
      return;
    }

    this.applyPendingEditorContext();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }

    if (changes['apiBaseUrl']) {
      this.handleApiBaseUrlChange();
    }

    if (changes['initialOccurredAt'] || changes['initialEditingItemId']) {
      this.handleInitialEditorContextChange();
    }

    if (
      changes['initialDateLocal'] ||
      changes['displayMode'] ||
      changes['lockDate']
    ) {
      this.handleInitialDateContextChange();
    }
  }

  get selectedProductIds(): string[] {
    return this.selectedProductIdsState();
  }

  set selectedProductIds(value: string[]) {
    this.selectedProductIdsState.set(value);
  }

  get selectedInventoryIds(): number[] {
    return this.selectedInventoryIdsState();
  }

  set selectedInventoryIds(value: number[]) {
    this.selectedInventoryIdsState.set(value);
  }

  get activeEmbeddedSection(): InputDayEmbeddedSection {
    return this.activeEmbeddedSectionState();
  }

  set activeEmbeddedSection(value: InputDayEmbeddedSection) {
    this.activeEmbeddedSectionState.set(value);
  }

  get isStandaloneMode(): boolean {
    return this.displayMode() === 'standalone';
  }

  get isEmbeddedMode(): boolean {
    return this.displayMode() === 'embedded';
  }

  get hasValidSelectedDate(): boolean {
    return this.resolveDateLocalValue() !== null;
  }

  get hasSelectedInventories(): boolean {
    return this.selectedInventoryIds.length > 0;
  }

  get shouldShowEmbeddedInventoryGuide(): boolean {
    return this.isEmbeddedMode && !this.hasSelectedInventories;
  }

  get isStockSectionActive(): boolean {
    return this.activeEmbeddedSection === 'stock';
  }

  get isTemplatesSectionActive(): boolean {
    return this.activeEmbeddedSection === 'templates';
  }

  get selectedDateLabel(): string {
    const dateLocal = this.resolveDateLocalValue();
    if (!dateLocal) {
      return this.initialDateLocal()?.trim() || '-';
    }

    return formatInputDaySelectedDateLabel(dateLocal, this.language.locale());
  }

  get productListItems(): ProductListItem[] {
    return this.productListItemsCache;
  }

  get inputDayResponse(): InputDayResponse | null {
    return this.inputDayResponseState();
  }

  set inputDayResponse(value: InputDayResponse | null) {
    this.inputDayResponseState.set(value);
    this.refreshAvailableSlots();
    this.syncManualTemplateSelectionFromResponse();
  }

  get selectableProductListItems(): ProductListItem[] {
    return this.selectableProductListItemsCache;
  }

  get editorProductOptions(): ProductListItem[] {
    const baseOptions = this.hasSelectedInventories
      ? this.selectableProductListItems
      : this.emptyProductListItems;

    const selectedProductId = normalizePositiveInteger(
      this.itemEditorForm.value.productId,
    );
    if (selectedProductId === null) {
      return baseOptions;
    }

    if (baseOptions.some((item) => Number(item.id) === selectedProductId)) {
      return baseOptions;
    }

    const fallback = this.productListItems.find(
      (item) => Number(item.id) === selectedProductId,
    );
    return fallback ? [fallback, ...baseOptions] : baseOptions;
  }

  get availableSlots(): InputDayAvailableSlot[] {
    return this.availableSlotsCache;
  }

  get templateItems(): InputDayTemplateItemSummary[] {
    return this.inputDayResponse?.templateItems ?? [];
  }

  get activeTemplateLabel(): string {
    const templateAssociation = this.inputDayResponse?.templateAssociation;
    if (!templateAssociation) {
      return this.language.translate('No active template');
    }

    const sourceLabel =
      templateAssociation.source === 'manual'
        ? 'manual override'
        : 'day set inheritance';
    return `${templateAssociation.template.title} (${this.language.translate(sourceLabel)})`;
  }

  get hasManualTemplateOverride(): boolean {
    return this.inputDayResponse?.templateAssociation?.source === 'manual';
  }

  get selectedInventoriesLabel(): string {
    if (!this.hasSelectedInventories) {
      return this.language.translate('No inventory selected');
    }

    return this.selectedInventoryIds
      .map((inventoryId) => {
        const inventory =
          this.inventories.find((item) => item.id === inventoryId) ?? null;
        return inventory
          ? `${inventory.name} (#${inventory.id})`
          : this.language.translate('Inventory #{p0}', { p0: inventoryId });
      })
      .join(', ');
  }

  get selectedBatchSlotLabel(): string {
    if (this.selectedSlotId === null) {
      return this.language.translate('No batch slot');
    }

    const slot =
      this.availableSlots.find((item) => item.slotId === this.selectedSlotId) ??
      null;
    if (!slot) {
      return this.language.translate('Slot #{p0}', { p0: this.selectedSlotId });
    }

    return `${slot.sortOrder}. ${slot.title} (${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)})`;
  }

  get isEditingItem(): boolean {
    return (
      normalizePositiveInteger(this.itemEditorForm.value.itemId) !== null
    );
  }

  get itemEditorSelectedSlotId(): number | null {
    return normalizeNullablePositiveInteger(
      this.itemEditorForm.value.slotId,
    );
  }

  get createSelectedItemsLabel(): string {
    return this.selectedProductRows.length > 1
      ? 'Add selected entries'
      : 'Add selected entry';
  }

  get canSubmitItemEditor(): boolean {
    return canSubmitInputDayItemEditor({
      value: this.itemEditorForm.value,
      timezone: this.resolveTimezone(),
      hasValidSelectedDate: this.hasValidSelectedDate,
      hasSelectedInventories: this.hasSelectedInventories,
      initialDateError: this.initialDateError,
      loading: this.loading,
      loadingProducts: this.loadingProducts,
      loadingInventories: this.loadingInventories,
      hasProductsError: !!this.productsError,
      hasInventoriesError: !!this.inventoriesError,
      hasInventoryProductsError: !!this.inventoryProductsError,
    });
  }

  get canCreateSelectedItems(): boolean {
    return canCreateInputDaySelectedItems({
      value: this.itemEditorForm.value,
      timezone: this.resolveTimezone(),
      hasValidSelectedDate: this.hasValidSelectedDate,
      hasSelectedInventories: this.hasSelectedInventories,
      initialDateError: this.initialDateError,
      loading: this.loading,
      loadingProducts: this.loadingProducts,
      loadingInventories: this.loadingInventories,
      loadingInventoryProducts: this.loadingInventoryProducts,
      hasProductsError: !!this.productsError,
      hasInventoriesError: !!this.inventoriesError,
      hasInventoryProductsError: !!this.inventoryProductsError,
      selectedProductRows: this.selectedProductRows,
    });
  }

  loadDay(): void {
    this.dayRequest.cancel();
    const dateLocal = this.requireDate();
    if (!dateLocal) {
      this.loading = false;
      return;
    }

    const timezone = this.resolveTimezone();
    this.loading = true;
    this.itemsFormError = null;
    this.itemEditorError = null;

    this.dayRequest.subscribe(this.inputDaySrv.getInputDay(dateLocal, timezone), {
      next: (response) => {
        this.lastError = null;
        this.inputDayResponse = response;
        this.form.patchValue({
          timezone: response.timezone?.trim() || this.fallbackTimezone,
        });
        this.ensureSelectedSlotStillValid();
        this.loading = false;
        this.applyPendingEditorContext();
      },
      error: (error) => {
        this.lastError = error;
        this.inputDayResponse = null;
        this.loading = false;
      },
    });
  }

  createSelectedItems(): void {
    const request = this.buildSelectedItemsRequest();
    if (!request) {
      return;
    }

    this.loading = true;
    this.itemsFormError = null;

    this.inputDaySrv
      .createItems(request.requestDateLocal, request.payload)
      .subscribe({
        next: () => {
          this.lastError = null;
          this.clearSelectedProducts();
          this.prefillItemEditorForCreate(null);
          this.loading = false;
          this.itemsChanged.emit({ dateLocal: request.requestDateLocal });
          this.loadDay();
        },
        error: (error) => {
          this.lastError = error;
          this.itemsFormError = 'Unable to add the selected items.';
          this.loading = false;
        },
      });
  }

  submitItemEditor(): void {
    const request = this.buildItemEditorRequest();
    if (!request) {
      return;
    }

    this.loading = true;
    this.itemEditorError = null;

    if (request.itemId === null) {
      this.inputDaySrv
        .createItem(request.requestDateLocal, request.payload)
        .subscribe({
          next: () => {
            this.lastError = null;
            this.loading = false;
            this.itemsChanged.emit({
              dateLocal: this.requireDate() ?? request.requestDateLocal,
            });
            this.prefillItemEditorForCreate(null);
            this.loadDay();
          },
          error: (error) => {
            this.lastError = error;
            this.itemEditorError = "Unable to create the entry.";
            this.loading = false;
          },
        });
      return;
    }

    this.inputDaySrv
      .updateItem(request.requestDateLocal, request.itemId, request.payload)
      .subscribe({
        next: () => {
          this.lastError = null;
          this.loading = false;
          this.itemsChanged.emit({
            dateLocal: this.requireDate() ?? request.requestDateLocal,
          });
          this.prefillItemEditorForCreate(null);
          this.loadDay();
        },
        error: (error) => {
          this.lastError = error;
          this.itemEditorError = "Unable to update the entry.";
          this.loading = false;
        },
      });
  }

  startEditingItem(itemId: number): void {
    const item = this.findItemById(itemId);
    if (!item) {
      this.itemEditorError = `Unable to find item #${itemId}.`;
      return;
    }

    const sourceDateLocal =
      this.inputDayResponse?.dateLocal ?? this.resolveEditorDefaultDateLocal();
    this.editingSourceDateLocal = sourceDateLocal;

    if (!this.hasSelectedInventories && item.inventoryId !== null) {
      this.onSelectedInventoryChange(item.inventoryAllocations?.map((allocation) => allocation.inventoryId) ?? [item.inventoryId]);
    }

    this.clearSelectedProducts();
    this.itemEditorForm.reset(
      {
        itemId: item.id,
        dateLocal: sourceDateLocal,
        occurredAt: toInputDayDateTimeLocalInput(
          item.occurredAt ?? item.insertedAt,
          this.resolveTimezone(),
        ),
        productId: item.productId,
        qty: item.qty,
        qtyUnit: item.qtyUnit,
        slotId: item.slotId,
        slotKey: item.slotId === null ? (item.slotKey ?? '') : '',
      },
      { emitEvent: false },
    );

    this.itemEditorError = null;
    this.pendingInitialEditingItemId = null;
    this.pendingInitialOccurredAt = null;
  }

  resetItemEditor(): void {
    this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
  }

  resetCreateComposer(): void {
    this.clearSelectedProducts();
    this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
  }

  removeItem(itemId?: number): void {
    const resolvedItemId =
      itemId ?? normalizePositiveInteger(this.itemEditorForm.value.itemId);
    if (resolvedItemId == null) {
      this.lastError = 'itemId est requis et doit etre un entier > 0.';
      return;
    }

    const dateLocal =
      this.isEditingItem && itemId == null
        ? (this.editingSourceDateLocal ?? this.requireDate())
        : (this.inputDayResponse?.dateLocal ?? this.requireDate());

    if (!dateLocal) {
      return;
    }

    this.loading = true;
    this.itemEditorError = null;

    this.inputDaySrv.removeItem(dateLocal, resolvedItemId).subscribe({
      next: () => {
        this.lastError = null;
        this.loading = false;
        if (
          normalizePositiveInteger(this.itemEditorForm.value.itemId) ===
          resolvedItemId
        ) {
          this.prefillItemEditorForCreate(null);
        }
        this.itemsChanged.emit({ dateLocal: this.requireDate() ?? dateLocal });
        this.loadDay();
      },
      error: (error) => {
        this.lastError = error;
        this.itemEditorError = "Unable to delete the entry.";
        this.loading = false;
      },
    });
  }

  onProductsSelected(items: ProductListItem[]): void {
    this.selectedProductIds = items.map((item) => item.id);
    this.selectedProducts = items;

    const rowsByProductId = new Map(
      this.selectedProductRows.map((row) => [row.productId, row] as const),
    );

    this.selectedProductRows = items.map((item) => {
      const productId = Number(item.id);
      return (
        rowsByProductId.get(productId) ?? {
          productId,
          productName: item.name,
          qty: null,
          qtyUnit: null,
        }
      );
    });

    this.itemsFormError = null;
  }

  onActiveEmbeddedSectionChange(value: InputDayEmbeddedSection): void {
    this.activeEmbeddedSection = value;
  }

  onSelectedInventoryChange(value: number | number[] | null): void {
    const nextInventoryIds = normalizeInputDayInventoryIds(value);

    if (
      areNumberArraysEqual(this.selectedInventoryIds, nextInventoryIds)
    ) {
      return;
    }

    this.selectedInventoryIds = nextInventoryIds;
    if (
      nextInventoryIds.length > 0 &&
      this.products.length === 0 &&
      !this.loadingProducts
    ) {
      this.loadProducts();
    }
    this.refreshSelectedInventoryProducts();
  }

  onItemEditorSlotIdChange(value: number | null): void {
    const slotId =
      typeof value === 'number' && Number.isInteger(value) && value > 0
        ? value
        : null;
    this.itemEditorForm.patchValue({
      slotId,
      slotKey: slotId === null ? (this.itemEditorForm.value.slotKey ?? '') : '',
    });
  }

  removeSelectedProduct(productId: number): void {
    const nextSelection = this.selectedProducts.filter(
      (item) => Number(item.id) !== productId,
    );
    this.onProductsSelected(nextSelection);
  }

  onManualTemplateSelectionChange(value: number | null): void {
    const nextTemplateId = normalizeNullablePositiveInteger(value);
    if (this.manualTemplateSelectionId === nextTemplateId) {
      return;
    }

    this.manualTemplateSelectionId = nextTemplateId;
    this.applyManualTemplateSelection();
  }

  applyManualTemplateSelection(): void {
    const dateLocal = this.requireDate();
    if (!dateLocal) {
      return;
    }

    this.loading = true;
    this.templateActionError = null;

    this.inputDaySrv
      .setTemplate(dateLocal, this.manualTemplateSelectionId)
      .subscribe({
        next: (response) => {
          this.lastError = null;
          this.inputDayResponse = response;
          this.loading = false;
          this.itemsChanged.emit({ dateLocal });
        },
        error: (error) => {
          this.lastError = error;
          this.templateActionError =
            'Unable to update the active template.';
          this.loading = false;
        },
      });
  }

  clearManualTemplateOverride(): void {
    this.onManualTemplateSelectionChange(null);
  }

  convertTemplateItem(item: InputDayTemplateItemSummary): void {
    const dateLocal = this.requireDate();
    if (!dateLocal || this.isConvertingTemplateItem(item)) {
      return;
    }

    if (!this.hasSelectedInventories) {
      this.templateActionError =
        'Select at least one inventory before converting a template line.';
      return;
    }

    this.convertingTemplateItemIds = new Set(
      this.convertingTemplateItemIds,
    ).add(item.id);
    this.templateActionError = null;

    this.inputDaySrv
      .convertTemplateItem(dateLocal, item.id, this.selectedInventoryIds)
      .subscribe({
        next: (response) => {
          this.lastError = null;
          this.inputDayResponse = response;
          this.finishTemplateItemConversion(item.id);
          this.itemsChanged.emit({ dateLocal });
        },
        error: (error) => {
          this.lastError = error;
          this.templateActionError = resolveInputDayApiErrorMessage(
            error,
            'Unable to convert this template item.',
          );
          this.finishTemplateItemConversion(item.id);
        },
      });
  }

  formatMacroValue(value: InputDayMacroValue): string {
    return typeof value === 'number' ? this.language.formatNumber(value) : value;
  }

  formatNutritionAmount(value: number): string {
    return this.language.formatNumber(value);
  }

  formatTime(value: string | null | undefined): string {
    return formatInputDayTime(value);
  }

  formatDateTime(value: string | null | undefined): string {
    return formatInputDayDateTime(value, this.resolveTimezone());
  }

  resolveItemSlotTitle(item: InputDayItemSummary): string {
    return resolveInputDayItemSlotTitle(item, this.availableSlots, this.language.translate('No slot'));
  }

  resolveItemSlotKey(item: InputDayItemSummary): string {
    return resolveInputDayItemSlotKey(item, this.availableSlots);
  }

  resolveTemplateItemSlotTitle(item: InputDayTemplateItemSummary): string {
    return resolveInputDayTemplateItemSlotTitle(item, this.availableSlots, this.language.translate('No slot'));
  }

  resolveTemplateItemSlotKey(item: InputDayTemplateItemSummary): string {
    return resolveInputDayTemplateItemSlotKey(item, this.availableSlots);
  }

  getSelectedInventoriesTemplateStock(
    item: InputDayTemplateItemSummary,
  ): InputDaySelectedInventoryTemplateStock | null {
    return getInputDaySelectedInventoriesTemplateStock(
      item,
      this.selectedInventoryIds,
    );
  }

  isConvertingTemplateItem(item: InputDayTemplateItemSummary): boolean {
    return this.convertingTemplateItemIds.has(item.id);
  }

  canConvertTemplateItem(item: InputDayTemplateItemSummary): boolean {
    return canConvertInputDayTemplateItem(
      item,
      this.selectedInventoryIds,
      this.loading,
      this.isConvertingTemplateItem(item),
    );
  }

  getTemplateTargetSourceText(
    totals: InputDayTotalsMacrosSummary | null | undefined,
  ): string {
    return getInputDayTemplateTargetSourceText(totals);
  }

  hasEntries(value: Record<string, unknown> | null | undefined): boolean {
    return hasInputDayEntries(value);
  }

  getTargetSourceText(targetSource: InputDayTargetSource): string {
    return getInputDayTargetSourceText(targetSource);
  }

  getSlotMacroEntries(
    slotTotals: InputDayTotalsMacrosBySlotEntry,
  ): InputDaySlotMacroEntry[] {
    return getInputDaySlotMacroEntries(slotTotals);
  }

  trackBySelectedProductRow(
    _: number,
    row: InputDaySelectedProductRow,
  ): number {
    return row.productId;
  }

  trackByInputDayItem(_: number, item: InputDayItemSummary): number {
    return item.id;
  }

  trackByTemplateItem(_: number, item: InputDayTemplateItemSummary): number {
    return item.id;
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productsError = null;

    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = extractInputDayProductsFromResponse(response);
        this.refreshProductListItems();
        this.loadingProducts = false;
        this.productsError = null;
        this.syncSelectionToAvailableProducts();
      },
      error: (error) => {
        this.products = [];
        this.refreshProductListItems();
        this.loadingProducts = false;
        this.productsError = error;
        this.syncSelectionToAvailableProducts();
      },
    });
  }

  private loadInventories(): void {
    this.loadingInventories = true;
    this.inventoriesError = null;

    this.inventorySrv.findAll().subscribe({
      next: (response) => {
        this.inventories = extractInputDayInventoriesFromResponse(response);
        this.loadingInventories = false;
        this.inventoriesError = null;
        this.ensureSelectedInventoriesStillValid();
        this.refreshSelectedInventoryProducts();
      },
      error: (error) => {
        this.inventories = [];
        this.loadingInventories = false;
        this.inventoriesError = error;
        this.ensureSelectedInventoriesStillValid();
        this.refreshSelectedInventoryProducts();
      },
    });
  }

  private loadTemplates(): void {
    this.loadingTemplates = true;
    this.templateError = null;

    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templates = response
          .map((template) => ({
            id: template.id,
            title: template.title,
          }))
          .sort((left, right) => left.title.localeCompare(right.title, 'fr'));
        this.loadingTemplates = false;
      },
      error: (error) => {
        this.templates = [];
        this.templateError = 'Unable to load templates.';
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  private resolveConfiguredBaseUrl(): string {
    const inputBaseUrl = this.apiBaseUrl()?.trim();
    if (inputBaseUrl) {
      return inputBaseUrl;
    }

    if (this.baseUrl.trim() !== '') {
      return this.baseUrl.trim();
    }

    return this.inputDaySrv.baseUrl;
  }

  private shouldEagerLoadProducts(): boolean {
    return (
      this.isStandaloneMode ||
      normalizePositiveInteger(this.initialEditingItemId()) !== null
    );
  }

  private handleApiBaseUrlChange(): void {
    this.baseUrl = this.resolveConfiguredBaseUrl();
    this.applyServicesBaseUrl();
    if (this.shouldEagerLoadProducts() || this.products.length > 0) {
      this.loadProducts();
    }
    this.loadInventories();
    this.loadTemplates();
    if (this.hasValidSelectedDate) {
      this.loadDay();
    }
  }

  private handleInitialEditorContextChange(): void {
    this.loadProductsForCurrentContext();
    this.syncPendingEditorContextFromInputs();
    if (this.inputDayResponse) {
      this.applyPendingEditorContext();
    } else if (this.pendingInitialEditingItemId === null) {
      this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
    }
  }

  private handleInitialDateContextChange(): void {
    this.dayRequest.cancel();
    this.loading = false;
    this.loadProductsForCurrentContext();
    this.applyInitialDateInput();
    this.syncPendingEditorContextFromInputs();
    this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
    if (this.isEmbeddedMode && this.hasValidSelectedDate) {
      this.loadDay();
    }
  }

  private loadProductsForCurrentContext(): void {
    if (
      this.shouldEagerLoadProducts() &&
      this.products.length === 0 &&
      !this.loadingProducts
    ) {
      this.loadProducts();
    }
  }

  private applyServicesBaseUrl(): void {
    this.inputDaySrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.inventorySrv.setBaseUrl(this.baseUrl);
    this.templateSrv.setBaseUrl(this.baseUrl);
  }

  private syncPendingEditorContextFromInputs(): void {
    this.pendingInitialOccurredAt = normalizeIsoString(
      this.initialOccurredAt(),
    );
    this.pendingInitialEditingItemId = normalizePositiveInteger(
      this.initialEditingItemId(),
    );
  }

  private applyInitialDateInput(): void {
    const initialDateLocal = this.initialDateLocal();
    if (!initialDateLocal || initialDateLocal.trim() === '') {
      this.initialDateError = null;
      return;
    }

    const parsed = parseInputDayDateInput(initialDateLocal);
    if (!parsed) {
      this.initialDateError = 'dateLocal doit etre au format YYYY-MM-DD.';
      this.inputDayResponse = null;
      return;
    }

    this.initialDateError = null;
    this.form.patchValue({
      dateLocal: this.lockDate() ? formatInputDayDateLocal(parsed) : parsed,
    });
  }

  private applyPendingEditorContext(): void {
    if (this.pendingInitialEditingItemId !== null) {
      const item = this.findItemById(this.pendingInitialEditingItemId);
      this.pendingInitialEditingItemId = null;
      if (item) {
        this.startEditingItem(item.id);
        this.pendingInitialOccurredAt = null;
        return;
      }
    }

    if (this.pendingInitialOccurredAt !== null) {
      this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
      this.pendingInitialOccurredAt = null;
      return;
    }

    if (
      !this.isEditingItem &&
      String(this.itemEditorForm.value.dateLocal ?? '').trim() === ''
    ) {
      this.prefillItemEditorForCreate(null);
    }
  }

  private resolveDateLocalValue(): string | null {
    return resolveInputDayDateLocal(this.form.value.dateLocal);
  }

  private requireDate(): string | null {
    const dateLocal = this.resolveDateLocalValue();
    if (!dateLocal) {
      this.lastError = 'dateLocal doit etre au format YYYY-MM-DD.';
      return null;
    }

    return dateLocal;
  }

  private buildItemEditorRequest(): InputDayItemEditorRequest | null {
    const result = buildInputDayItemEditorRequest({
      value: this.itemEditorForm.value,
      selectedInventoryIds: this.selectedInventoryIds,
      qtyUnitSet: this.qtyUnitSet,
      timezone: this.resolveTimezone(),
      resolveUpdateRequestDateLocal: () =>
        this.editingSourceDateLocal ?? this.requireDate(),
    });

    this.itemEditorError = result.error;
    return result.request;
  }

  private buildSelectedItemsRequest(): InputDaySelectedItemsRequest | null {
    const result = buildInputDaySelectedItemsRequest({
      value: this.itemEditorForm.value,
      selectedProductRows: this.selectedProductRows,
      selectedInventoryIds: this.selectedInventoryIds,
      selectedSlotId: this.selectedSlotId,
      qtyUnitSet: this.qtyUnitSet,
      timezone: this.resolveTimezone(),
      hasValidSelectedDate: this.hasValidSelectedDate,
      initialDateError: this.initialDateError,
    });

    this.itemsFormError = result.error;
    return result.request;
  }

  private prefillItemEditorForCreate(occurredAt: string | null): void {
    this.itemEditorForm.reset(createInputDayEditorValue({
      response: this.inputDayResponse,
      formDateLocal: this.form.value.dateLocal,
      initialDateLocal: this.initialDateLocal(),
      occurredAt,
      timezone: this.resolveTimezone(),
    }), { emitEvent: false });

    this.editingSourceDateLocal = null;
    this.itemEditorError = null;
  }

  private resolveEditorDefaultDateLocal(): string {
    return (
      this.inputDayResponse?.dateLocal ??
      this.resolveDateLocalValue() ??
      this.initialDateLocal()?.trim() ??
      ''
    );
  }

  private finishTemplateItemConversion(templateItemId: number): void {
    const nextIds = new Set(this.convertingTemplateItemIds);
    nextIds.delete(templateItemId);
    this.convertingTemplateItemIds = nextIds;
  }

  private resolveTimezone(): string {
    return resolveInputDayTimezone(this.form.value.timezone, this.fallbackTimezone);
  }

  private clearSelectedProducts(): void {
    this.selectedProductIds = [];
    this.selectedProducts = [];
    this.selectedProductRows = [];
    this.itemsFormError = null;
  }

  private clearSelectedInventoryProducts(): void {
    this.selectedInventoryProducts = [];
    this.refreshSelectableProductListItems();
    this.loadingInventoryProducts = false;
    this.inventoryProductsError = null;
  }

  private syncSelectionToAvailableProducts(): void {
    this.refreshSelectableProductListItems();
    const availableProductsById = new Map(
      this.selectableProductListItems.map((item) => [item.id, item] as const),
    );

    const nextSelectedProducts = this.selectedProductIds
      .map((id) => availableProductsById.get(id) ?? null)
      .filter((item): item is ProductListItem => item !== null);

    this.onProductsSelected(nextSelectedProducts);
  }

  private refreshSelectedInventoryProducts(): void {
    this.stockRequest.cancel();
    if (!this.hasSelectedInventories) {
      this.clearSelectedInventoryProducts();
      this.syncSelectionToAvailableProducts();
      return;
    }

    const nextInventoryIds = [...this.selectedInventoryIds];
    const missingInventoryIds: number[] = [];

    for (const inventoryId of nextInventoryIds) {
      const inventory =
        this.inventories.find((item) => item.id === inventoryId) ?? null;
      if (inventory && Array.isArray(inventory.inventoryProducts)) {
        this.inventoryProductsByInventoryId.set(
          inventoryId,
          extractInputDayInventoryProductsFromResponse(
            inventory.inventoryProducts,
          ),
        );
        continue;
      }

      if (!this.inventoryProductsByInventoryId.has(inventoryId)) {
        missingInventoryIds.push(inventoryId);
      }
    }

    if (missingInventoryIds.length === 0) {
      this.applySelectedInventoryProductsFromCache(nextInventoryIds);
      return;
    }

    this.loadingInventoryProducts = true;
    this.inventoryProductsError = null;

    this.stockRequest.subscribe(forkJoin(
      missingInventoryIds.map((inventoryId) =>
        this.inventorySrv.findProducts(inventoryId),
      ),
    ), {
      next: (responses) => {
        if (
          !areNumberArraysEqual(
            this.selectedInventoryIds,
            nextInventoryIds,
          )
        ) {
          return;
        }

        responses.forEach((response, index) => {
          this.inventoryProductsByInventoryId.set(
            missingInventoryIds[index],
            extractInputDayInventoryProductsFromResponse(response),
          );
        });
        this.applySelectedInventoryProductsFromCache(nextInventoryIds);
      },
      error: (error) => {
        if (
          !areNumberArraysEqual(
            this.selectedInventoryIds,
            nextInventoryIds,
          )
        ) {
          return;
        }

        this.applySelectedInventoryProductsFromCache(nextInventoryIds, false);
        this.loadingInventoryProducts = false;
        this.inventoryProductsError = error;
        this.syncSelectionToAvailableProducts();
      },
    });
  }

  private applySelectedInventoryProductsFromCache(
    inventoryIds: number[],
    syncSelection = true,
  ): void {
    this.selectedInventoryProducts = aggregateInventoryProducts(
      inventoryIds,
      this.inventoryProductsByInventoryId,
    );
    this.refreshSelectableProductListItems();
    this.loadingInventoryProducts = false;
    this.inventoryProductsError = null;
    if (syncSelection) {
      this.syncSelectionToAvailableProducts();
    }
  }

  private ensureSelectedInventoriesStillValid(): void {
    this.selectedInventoryIds = resolveValidInventoryIds(
      this.selectedInventoryIds,
      this.inventories.map((inventory) => inventory.id),
    );
  }

  private ensureSelectedSlotStillValid(): void {
    this.selectedSlotId = resolveSelectedSlotId(this.selectedSlotId, this.availableSlots);
  }

  private findItemById(itemId: number): InputDayItemSummary | null {
    return (
      this.inputDayResponse?.items.find((item) => item.id === itemId) ?? null
    );
  }

  private findSlotForItem(item: InputDayItemSummary): InputDayAvailableSlot | null {
    return resolveInputDayItemSlot(item, this.availableSlots);
  }

  private refreshAvailableSlots(): void {
    this.availableSlotsCache = buildInputDayAvailableSlots(
      this.inputDayResponse,
    );
  }

  private syncManualTemplateSelectionFromResponse(): void {
    const templateAssociation =
      this.inputDayResponse?.templateAssociation ?? null;
    this.manualTemplateSelectionId =
      templateAssociation?.source === 'manual'
        ? templateAssociation.template.id
        : null;
  }

  private refreshProductListItems(): void {
    this.productListItemsCache = mapInputDayProductsToListItems(this.products);
    this.refreshSelectableProductListItems();
  }

  private refreshSelectableProductListItems(): void {
    this.selectableProductListItemsCache = this.hasSelectedInventories
      ? buildInputDaySelectableProductListItems({
          productListItems: this.productListItems,
          selectedInventoryProducts: this.selectedInventoryProducts,
        })
      : [];
  }

}
