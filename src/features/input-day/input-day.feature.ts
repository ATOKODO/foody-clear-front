import { JsonPipe, NgTemplateOutlet, KeyValuePipe } from '@angular/common';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
  inject,
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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
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
  formatInputDayMacroValue,
  formatInputDayNutritionAmount,
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
  roundInputDayQuantity,
  toInputDayDateTimeLocalInput,
} from './input-day.helpers';

@Component({
  selector: 'app-input-day',
  imports: [
    JsonPipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatDividerModule,
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
  private readonly inputDaySrv = inject(InputDayService);
  private readonly productSrv = inject(ProductService);
  private readonly inventorySrv = inject(InventoryService);
  private readonly templateSrv = inject(TemplateService);

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
  loading = false;
  loadingProducts = false;
  loadingInventories = false;
  loadingInventoryProducts = false;
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

  lastResponse: unknown = null;
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
  convertingTemplateItemIds = new Set<number>();

  private initialized = false;
  private _inputDayResponse: InputDayResponse | null = null;
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

    if (changes['initialOccurredAt'] || changes['initialEditingItemId']) {
      if (
        this.shouldEagerLoadProducts() &&
        this.products.length === 0 &&
        !this.loadingProducts
      ) {
        this.loadProducts();
      }

      this.syncPendingEditorContextFromInputs();
      if (this.inputDayResponse) {
        this.applyPendingEditorContext();
      } else if (this.pendingInitialEditingItemId === null) {
        this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
      }
    }

    if (
      changes['initialDateLocal'] ||
      changes['displayMode'] ||
      changes['lockDate']
    ) {
      if (
        this.shouldEagerLoadProducts() &&
        this.products.length === 0 &&
        !this.loadingProducts
      ) {
        this.loadProducts();
      }

      this.applyInitialDateInput();
      this.syncPendingEditorContextFromInputs();
      this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
      if (this.isEmbeddedMode && this.hasValidSelectedDate) {
        this.loadDay();
      }
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

    return formatInputDaySelectedDateLabel(dateLocal);
  }

  get productListItems(): ProductListItem[] {
    return this.productListItemsCache;
  }

  get inputDayResponse(): InputDayResponse | null {
    return this._inputDayResponse;
  }

  set inputDayResponse(value: InputDayResponse | null) {
    this._inputDayResponse = value;
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
      return 'No active template';
    }

    const sourceLabel =
      templateAssociation.source === 'manual'
        ? 'manual override'
        : 'day set inheritance';
    return `${templateAssociation.template.title} (${sourceLabel})`;
  }

  get hasManualTemplateOverride(): boolean {
    return this.inputDayResponse?.templateAssociation?.source === 'manual';
  }

  get selectedInventoriesLabel(): string {
    if (!this.hasSelectedInventories) {
      return 'No inventory selected';
    }

    return this.selectedInventoryIds
      .map((inventoryId) => {
        const inventory =
          this.inventories.find((item) => item.id === inventoryId) ?? null;
        return inventory
          ? `${inventory.name} (#${inventory.id})`
          : `Inventory #${inventoryId}`;
      })
      .join(', ');
  }

  get selectedBatchSlotLabel(): string {
    if (this.selectedSlotId === null) {
      return 'No batch slot';
    }

    const slot =
      this.availableSlots.find((item) => item.slotId === this.selectedSlotId) ??
      null;
    if (!slot) {
      return `Slot #${this.selectedSlotId}`;
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

  onBaseUrlChange(): void {
    this.baseUrl = this.resolveConfiguredBaseUrl();
    this.applyServicesBaseUrl();
    this.loadProducts();
    this.loadInventories();
    this.loadTemplates();
    if (this.hasValidSelectedDate) {
      this.loadDay();
    }
  }

  loadDay(): void {
    const dateLocal = this.requireDate();
    if (!dateLocal) {
      return;
    }

    const timezone = this.resolveTimezone();
    this.loading = true;
    this.itemsFormError = null;
    this.itemEditorError = null;

    this.inputDaySrv.getInputDay(dateLocal, timezone).subscribe({
      next: (response) => {
        this.lastResponse = response;
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
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.clearSelectedProducts();
          this.prefillItemEditorForCreate(null);
          this.loading = false;
          this.itemsChanged.emit({ dateLocal: request.requestDateLocal });
          this.loadDay();
        },
        error: (error) => {
          this.lastError = error;
          this.itemsFormError = "Impossible d'ajouter les items selectionnes.";
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
          next: (response) => {
            this.lastResponse = response;
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
        next: (response) => {
          this.lastResponse = response;
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
      this.itemEditorError = `Impossible de trouver l'item #${itemId}.`;
      return;
    }

    const sourceDateLocal =
      this.inputDayResponse?.dateLocal ?? this.resolveEditorDefaultDateLocal();
    this.editingSourceDateLocal = sourceDateLocal;

    if (!this.hasSelectedInventories && item.inventoryId !== null) {
      this.onSelectedInventoryChange([item.inventoryId]);
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
        this.lastResponse = {
          deleted: true,
          itemId: resolvedItemId,
          dateLocal,
        };
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
          this.lastResponse = response;
          this.lastError = null;
          this.inputDayResponse = response;
          this.loading = false;
          this.itemsChanged.emit({ dateLocal });
        },
        error: (error) => {
          this.lastError = error;
          this.templateActionError =
            'Impossible de mettre a jour le template actif.';
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
          this.lastResponse = response;
          this.lastError = null;
          this.inputDayResponse = response;
          this.finishTemplateItemConversion(item.id);
          this.itemsChanged.emit({ dateLocal });
        },
        error: (error) => {
          this.lastError = error;
          this.templateActionError = resolveInputDayApiErrorMessage(
            error,
            'Impossible de convertir cette ligne template.',
          );
          this.finishTemplateItemConversion(item.id);
        },
      });
  }

  fillDemo(): void {
    this.form.patchValue({
      dateLocal: new Date(2026, 1, 8),
      timezone: 'Europe/Paris',
    });

    this.prefillItemEditorForCreate('2026-02-08T08:00:00+01:00');
    this.itemEditorForm.patchValue({
      productId: 1,
      qty: 150,
      qtyUnit: 'g',
    });

    this.onSelectedInventoryChange(this.inventories[0]?.id ?? null);

    const demoProducts = this.selectableProductListItems.slice(0, 2);
    this.selectedProducts = demoProducts;
    this.selectedProductIds = demoProducts.map((item) => item.id);
    this.selectedProductRows = demoProducts.map((item, index) => ({
      productId: Number(item.id),
      productName: item.name,
      qty: index === 0 ? 120 : 80,
      qtyUnit: 'g',
    }));

    this.itemsFormError = null;
  }

  clear(): void {
    this.form.reset({
      dateLocal: null,
      timezone: this.fallbackTimezone,
    });

    this.selectedInventoryIds = [];
    this.selectedSlotId = null;
    this.clearSelectedInventoryProducts();
    this.initialDateError = null;
    this.itemsFormError = null;
    this.itemEditorError = null;
    this.clearSelectedProducts();
    this.lastResponse = null;
    this.lastError = null;
    this.inputDayResponse = null;
    this.pendingInitialOccurredAt = null;
    this.pendingInitialEditingItemId = null;
    this.manualTemplateSelectionId = null;
    this.templateActionError = null;
    this.activeEmbeddedSection = 'stock';
    this.prefillItemEditorForCreate(null);
  }

  formatMacroValue(value: InputDayMacroValue): string {
    return formatInputDayMacroValue(value);
  }

  formatNutritionAmount(value: number): string {
    return formatInputDayNutritionAmount(value);
  }

  formatTime(value: string | null | undefined): string {
    return formatInputDayTime(value);
  }

  formatDateTime(value: string | null | undefined): string {
    return formatInputDayDateTime(value, this.resolveTimezone());
  }

  resolveItemSlotTitle(item: InputDayItemSummary): string {
    return resolveInputDayItemSlotTitle(item, this.availableSlots);
  }

  resolveItemSlotKey(item: InputDayItemSummary): string {
    return resolveInputDayItemSlotKey(item, this.availableSlots);
  }

  resolveTemplateItemSlotTitle(item: InputDayTemplateItemSummary): string {
    return resolveInputDayTemplateItemSlotTitle(item, this.availableSlots);
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
        this.templateError = 'Impossible de charger les templates.';
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
    const rawDate = this.form.value.dateLocal;
    const parsedDate = parseInputDayDateInput(rawDate);
    if (!parsedDate) {
      return null;
    }

    return formatInputDayDateLocal(parsedDate);
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
    this.itemEditorForm.reset(
      {
        itemId: null,
        dateLocal: this.resolveEditorDefaultDateLocal(),
        occurredAt: toInputDayDateTimeLocalInput(occurredAt, this.resolveTimezone()),
        productId: null,
        qty: null,
        qtyUnit: null,
        slotId: null,
        slotKey: '',
      },
      { emitEvent: false },
    );

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
    const timezone = String(
      this.form.value.timezone ?? this.fallbackTimezone,
    ).trim();
    return timezone !== '' ? timezone : this.fallbackTimezone;
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

    forkJoin(
      missingInventoryIds.map((inventoryId) =>
        this.inventorySrv.findProducts(inventoryId),
      ),
    ).subscribe({
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
    const aggregatedProducts = new Map<number, InventoryProduct>();

    for (const inventoryId of inventoryIds) {
      const inventoryProducts =
        this.inventoryProductsByInventoryId.get(inventoryId) ?? [];
      for (const inventoryProduct of inventoryProducts) {
        const existing = aggregatedProducts.get(inventoryProduct.productId);
        if (!existing) {
          aggregatedProducts.set(inventoryProduct.productId, {
            ...inventoryProduct,
            qtyOnHandInUnits: inventoryProduct.qtyOnHandInUnits ?? 0,
            qtyOnHandNormalized: inventoryProduct.qtyOnHandNormalized ?? 0,
          });
          continue;
        }

        existing.qtyOnHandInUnits = roundInputDayQuantity(
          (existing.qtyOnHandInUnits ?? 0) +
            (inventoryProduct.qtyOnHandInUnits ?? 0),
        );
        existing.qtyOnHandNormalized = roundInputDayQuantity(
          (existing.qtyOnHandNormalized ?? 0) +
            (inventoryProduct.qtyOnHandNormalized ?? 0),
        );
      }
    }

    this.selectedInventoryProducts = Array.from(
      aggregatedProducts.values(),
    ).sort((left, right) => left.productId - right.productId);
    this.refreshSelectableProductListItems();
    this.loadingInventoryProducts = false;
    this.inventoryProductsError = null;
    if (syncSelection) {
      this.syncSelectionToAvailableProducts();
    }
  }

  private ensureSelectedInventoriesStillValid(): void {
    const validInventoryIds = new Set(
      this.inventories.map((inventory) => inventory.id),
    );
    this.selectedInventoryIds = this.selectedInventoryIds.filter(
      (inventoryId) => validInventoryIds.has(inventoryId),
    );
  }

  private ensureSelectedSlotStillValid(): void {
    if (
      this.selectedSlotId !== null &&
      !this.availableSlots.some((slot) => slot.slotId === this.selectedSlotId)
    ) {
      this.selectedSlotId = null;
    }
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
