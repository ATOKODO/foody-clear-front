import { CommonModule, JsonPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DateTime } from 'luxon';
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
import { Inventory, InventoryProduct } from '../../interfaces/inventory.interface';
import {
  CreateInputDayItemsDto,
  InputDayItemCommand,
  InputDayItemSummary,
  InputDayMacroValue,
  InputDayResponse,
  InputDayTotalsMacrosBySlotEntry,
  ProductQuantityInputUnit,
  UpdateInputDayItemDto,
} from '../../interfaces/input-day.interface';
import { InventoryService } from '../../services/inventory-service';
import {
  Product as ProductApiModel,
  ProductService,
} from '../../services/product-service';
import { InputDayService } from '../../services/input-day-service';

type InputDayDisplayMode = 'standalone' | 'embedded';

type InputDaySelectedProductRow = {
  productId: number;
  productName: string;
  qty: number | null;
  qtyUnit: ProductQuantityInputUnit | null;
};

type InputDayAvailableSlot = {
  slotId: number;
  title: string;
  slotKey: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
};

type ProductListSource = {
  id: number;
  name: string;
  barcode?: string | null;
  unitType?: string | null;
  quantityPerUnit?: number | null;
  quantityUnit?: string | null;
  portionCount?: number | null;
  portionUnit?: string | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  tags?: unknown[];
  nutritionValues?: unknown[];
  category?: unknown | null;
  genericProduct?: unknown | null;
};

@Component({
  selector: 'app-input-day',
  imports: [
    JsonPipe,
    CommonModule,
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
    ProductList,
  ],
  templateUrl: './input-day.feature.html',
  styleUrl: './input-day.feature.scss',
})
export class InputDayFeature implements OnInit, OnChanges {
  @Input() displayMode: InputDayDisplayMode = 'standalone';
  @Input() apiBaseUrl: string | null = null;
  @Input() initialDateLocal: string | null = null;
  @Input() initialOccurredAt: string | null = null;
  @Input() initialEditingItemId: number | null = null;
  @Input() lockDate = false;

  @Output() readonly itemsChanged = new EventEmitter<{ dateLocal: string }>();

  readonly qtyUnitOptions: ProductQuantityInputUnit[] = [
    'mg',
    'g',
    'kg',
    'ml',
    'l',
    'unit',
    'pack',
    'tranche',
    'piece',
    'part',
    'bouteille',
    'portion',
  ];

  baseUrl = '';
  form: FormGroup;
  itemEditorForm: FormGroup;
  loading = false;
  loadingProducts = false;
  loadingInventories = false;
  loadingInventoryProducts = false;

  products: ProductApiModel[] = [];
  inventories: Inventory[] = [];
  selectedInventoryProducts: InventoryProduct[] = [];
  productListItemsCache: ProductListItem[] = [];
  selectableProductListItemsCache: ProductListItem[] = [];
  availableSlotsCache: InputDayAvailableSlot[] = [];
  selectedProductIds: string[] = [];
  selectedProducts: ProductListItem[] = [];
  selectedProductRows: InputDaySelectedProductRow[] = [];
  selectedInventoryId: number | null = null;
  selectedSlotId: number | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  productsError: unknown = null;
  inventoriesError: unknown = null;
  inventoryProductsError: unknown = null;
  itemsFormError: string | null = null;
  itemEditorError: string | null = null;
  initialDateError: string | null = null;
  editingSourceDateLocal: string | null = null;

  private initialized = false;
  private _inputDayResponse: InputDayResponse | null = null;
  private pendingInitialOccurredAt: string | null = null;
  private pendingInitialEditingItemId: number | null = null;
  private readonly emptyProductListItems: ProductListItem[] = [];
  private readonly qtyUnitSet = new Set<ProductQuantityInputUnit>(this.qtyUnitOptions);
  private readonly slotTotalsMetaKeys = new Set([
    'slot',
    'targets',
    'deltaToTargets',
    'incompleteNutritionKeys',
  ]);

  constructor(
    private readonly fb: FormBuilder,
    private readonly inputDaySrv: InputDayService,
    private readonly productSrv: ProductService,
    private readonly inventorySrv: InventoryService,
  ) {
    this.form = this.fb.group({
      dateLocal: this.fb.control<Date | string | null>(null, {
        validators: [Validators.required],
      }),
      timezone: this.fb.control<string>('UTC', { nonNullable: true }),
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
      if (this.hasValidSelectedDate) {
        this.loadDay();
      }
    }

    if (changes['initialOccurredAt'] || changes['initialEditingItemId']) {
      if (this.shouldEagerLoadProducts() && this.products.length === 0 && !this.loadingProducts) {
        this.loadProducts();
      }

      this.syncPendingEditorContextFromInputs();
      if (this.inputDayResponse) {
        this.applyPendingEditorContext();
      } else if (this.pendingInitialEditingItemId === null) {
        this.prefillItemEditorForCreate(this.pendingInitialOccurredAt);
      }
    }

    if (changes['initialDateLocal'] || changes['displayMode'] || changes['lockDate']) {
      if (this.shouldEagerLoadProducts() && this.products.length === 0 && !this.loadingProducts) {
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

  get isStandaloneMode(): boolean {
    return this.displayMode === 'standalone';
  }

  get isEmbeddedMode(): boolean {
    return this.displayMode === 'embedded';
  }

  get hasValidSelectedDate(): boolean {
    return this.resolveDateLocalValue() !== null;
  }

  get selectedDateLabel(): string {
    const dateLocal = this.resolveDateLocalValue();
    if (!dateLocal) {
      return this.initialDateLocal?.trim() || '-';
    }

    const parsed = DateTime.fromISO(dateLocal);
    if (!parsed.isValid) {
      return dateLocal;
    }

    return parsed.toFormat('EEEE d LLLL yyyy', { locale: 'fr' });
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
  }

  get selectableProductListItems(): ProductListItem[] {
    return this.selectableProductListItemsCache;
  }

  get editorProductOptions(): ProductListItem[] {
    const baseOptions =
      this.selectedInventoryId !== null
        ? this.selectableProductListItems
        : this.emptyProductListItems;

    const selectedProductId = this.normalizePositiveInteger(this.itemEditorForm.value.productId);
    if (selectedProductId === null) {
      return baseOptions;
    }

    if (baseOptions.some((item) => Number(item.id) === selectedProductId)) {
      return baseOptions;
    }

    const fallback = this.productListItems.find((item) => Number(item.id) === selectedProductId);
    return fallback ? [fallback, ...baseOptions] : baseOptions;
  }

  get availableSlots(): InputDayAvailableSlot[] {
    return this.availableSlotsCache;
  }

  get selectedInventoryLabel(): string {
    if (this.selectedInventoryId === null) {
      return 'Aucun inventory selectionne';
    }

    const inventory = this.inventories.find((item) => item.id === this.selectedInventoryId) ?? null;
    return inventory ? `${inventory.name} (#${inventory.id})` : `Inventory #${this.selectedInventoryId}`;
  }

  get selectedBatchSlotLabel(): string {
    if (this.selectedSlotId === null) {
      return 'Sans slot batch';
    }

    const slot = this.availableSlots.find((item) => item.slotId === this.selectedSlotId) ?? null;
    if (!slot) {
      return `Slot #${this.selectedSlotId}`;
    }

    return `${slot.sortOrder}. ${slot.title} (${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)})`;
  }

  get isEditingItem(): boolean {
    return this.normalizePositiveInteger(this.itemEditorForm.value.itemId) !== null;
  }

  get itemEditorSelectedSlotId(): number | null {
    return this.normalizeNullablePositiveInteger(this.itemEditorForm.value.slotId);
  }

  get createSelectedItemsLabel(): string {
    return this.selectedProductRows.length > 1
      ? 'Ajouter les entrees selectionnees'
      : 'Ajouter l entree selectionnee';
  }

  get canSubmitItemEditor(): boolean {
    if (
      this.loading ||
      this.loadingProducts ||
      this.loadingInventories ||
      this.productsError ||
      this.inventoriesError ||
      this.inventoryProductsError
    ) {
      return false;
    }

    if (this.initialDateError !== null || !this.hasValidSelectedDate) {
      return false;
    }

    if (
      this.selectedInventoryId == null ||
      !Number.isInteger(this.selectedInventoryId) ||
      this.selectedInventoryId < 1
    ) {
      return false;
    }

    const dateLocal = String(this.itemEditorForm.value.dateLocal ?? '').trim();
    const productId = this.normalizePositiveInteger(this.itemEditorForm.value.productId);
    const qty = this.itemEditorForm.value.qty ?? null;
    const occurredAtRaw = String(this.itemEditorForm.value.occurredAt ?? '').trim();

    if (!this.isDateLocal(dateLocal) || productId === null || qty == null || qty <= 0) {
      return false;
    }

    if (occurredAtRaw === '') {
      return true;
    }

    return this.buildOccurredAtIso(occurredAtRaw) !== null;
  }

  get canCreateSelectedItems(): boolean {
    if (
      this.loading ||
      this.loadingProducts ||
      this.loadingInventories ||
      this.loadingInventoryProducts
    ) {
      return false;
    }

    if (!this.hasValidSelectedDate || this.initialDateError !== null) {
      return false;
    }

    if (this.productsError || this.inventoriesError || this.inventoryProductsError) {
      return false;
    }

    if (
      this.selectedInventoryId == null ||
      !Number.isInteger(this.selectedInventoryId) ||
      this.selectedInventoryId < 1
    ) {
      return false;
    }

    const dateLocal = String(this.itemEditorForm.value.dateLocal ?? '').trim();
    const occurredAtRaw = String(this.itemEditorForm.value.occurredAt ?? '').trim();
    if (!this.isDateLocal(dateLocal)) {
      return false;
    }

    if (occurredAtRaw !== '' && this.buildOccurredAtIso(occurredAtRaw) === null) {
      return false;
    }

    if (this.selectedProductRows.length === 0) {
      return false;
    }

    return this.selectedProductRows.every(
      (row) => typeof row.qty === 'number' && Number.isFinite(row.qty) && row.qty > 0,
    );
  }

  onBaseUrlChange(): void {
    this.baseUrl = this.resolveConfiguredBaseUrl();
    this.applyServicesBaseUrl();
    this.loadProducts();
    this.loadInventories();
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
          timezone: response.timezone?.trim() || timezone,
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

    this.inputDaySrv.createItems(request.requestDateLocal, request.payload).subscribe({
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
        this.itemsFormError = 'Impossible d\'ajouter les items selectionnes.';
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
      this.inputDaySrv.createItem(request.requestDateLocal, request.payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.loading = false;
          this.itemsChanged.emit({ dateLocal: this.requireDate() ?? request.requestDateLocal });
          this.prefillItemEditorForCreate(null);
          this.loadDay();
        },
        error: (error) => {
          this.lastError = error;
          this.itemEditorError = 'Impossible de creer l\'entree.';
          this.loading = false;
        },
      });
      return;
    }

    this.inputDaySrv.updateItem(request.requestDateLocal, request.itemId, request.payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;
        this.itemsChanged.emit({ dateLocal: this.requireDate() ?? request.requestDateLocal });
        this.prefillItemEditorForCreate(null);
        this.loadDay();
      },
      error: (error) => {
        this.lastError = error;
        this.itemEditorError = 'Impossible de modifier l\'entree.';
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

    const sourceDateLocal = this.inputDayResponse?.dateLocal ?? this.resolveEditorDefaultDateLocal();
    this.editingSourceDateLocal = sourceDateLocal;

    if (item.inventoryId !== null) {
      this.onSelectedInventoryChange(item.inventoryId);
    }

    this.clearSelectedProducts();
    this.itemEditorForm.reset(
      {
        itemId: item.id,
        dateLocal: sourceDateLocal,
        occurredAt: this.toDateTimeLocalInput(item.occurredAt ?? item.insertedAt),
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
      itemId ?? this.normalizePositiveInteger(this.itemEditorForm.value.itemId);
    if (resolvedItemId == null) {
      this.lastError = 'itemId est requis et doit etre un entier > 0.';
      return;
    }

    const dateLocal = this.isEditingItem && itemId == null
      ? (this.editingSourceDateLocal ?? this.requireDate())
      : (this.inputDayResponse?.dateLocal ?? this.requireDate());

    if (!dateLocal) {
      return;
    }

    this.loading = true;
    this.itemEditorError = null;

    this.inputDaySrv.removeItem(dateLocal, resolvedItemId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, itemId: resolvedItemId, dateLocal };
        this.lastError = null;
        this.loading = false;
        if (this.normalizePositiveInteger(this.itemEditorForm.value.itemId) === resolvedItemId) {
          this.prefillItemEditorForCreate(null);
        }
        this.itemsChanged.emit({ dateLocal: this.requireDate() ?? dateLocal });
        this.loadDay();
      },
      error: (error) => {
        this.lastError = error;
        this.itemEditorError = 'Impossible de supprimer l\'entree.';
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
      return rowsByProductId.get(productId) ?? {
        productId,
        productName: item.name,
        qty: null,
        qtyUnit: null,
      };
    });

    this.itemsFormError = null;
  }

  onSelectedInventoryChange(value: number | null): void {
    const nextInventoryId =
      typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;

    if (this.selectedInventoryId === nextInventoryId) {
      return;
    }

    this.selectedInventoryId = nextInventoryId;
    if (nextInventoryId !== null && this.products.length === 0 && !this.loadingProducts) {
      this.loadProducts();
    }
    this.refreshSelectedInventoryProducts();
  }

  onItemEditorSlotIdChange(value: number | null): void {
    const slotId =
      typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
    this.itemEditorForm.patchValue({
      slotId,
      slotKey: slotId === null ? this.itemEditorForm.value.slotKey ?? '' : '',
    });
  }

  removeSelectedProduct(productId: number): void {
    const nextSelection = this.selectedProducts.filter(
      (item) => Number(item.id) !== productId,
    );
    this.onProductsSelected(nextSelection);
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
      timezone: 'UTC',
    });

    this.selectedInventoryId = null;
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
    this.prefillItemEditorForCreate(null);
  }

  formatMacroValue(value: InputDayMacroValue): string {
    if (typeof value === 'number') {
      return this.formatDecimal(value);
    }

    return value;
  }

  formatNutritionAmount(value: number): string {
    return this.formatDecimal(value);
  }

  formatTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const parsed = DateTime.fromISO(value, { setZone: true });
    if (!parsed.isValid) {
      return value;
    }

    return parsed.setZone(this.resolveTimezone()).toFormat('yyyy-LL-dd HH:mm');
  }

  resolveItemSlotTitle(item: InputDayItemSummary): string {
    const matchedSlot = this.findSlotForItem(item);
    if (matchedSlot) {
      return matchedSlot.title;
    }

    return item.slotKey?.trim() || 'Sans slot';
  }

  resolveItemSlotKey(item: InputDayItemSummary): string {
    const matchedSlot = this.findSlotForItem(item);
    if (matchedSlot) {
      return matchedSlot.slotKey;
    }

    return item.slotKey?.trim() || '-';
  }

  hasEntries(value: Record<string, unknown> | null | undefined): boolean {
    return !!value && Object.keys(value).length > 0;
  }

  getSlotMacroEntries(
    slotTotals: InputDayTotalsMacrosBySlotEntry,
  ): Array<{ key: string; value: InputDayMacroValue }> {
    return Object.entries(slotTotals)
      .filter(
        ([key, value]) =>
          !this.slotTotalsMetaKeys.has(key) &&
          (typeof value === 'number' || value === 'donnee incomplete'),
      )
      .map(([key, value]) => ({
        key,
        value: value as InputDayMacroValue,
      }));
  }

  trackBySelectedProductRow(_: number, row: InputDaySelectedProductRow): number {
    return row.productId;
  }

  trackByInputDayItem(_: number, item: InputDayItemSummary): number {
    return item.id;
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productsError = null;

    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = this.extractProductsFromResponse(response);
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
        this.inventories = this.extractInventoriesFromResponse(response);
        this.loadingInventories = false;
        this.inventoriesError = null;
        this.ensureSelectedInventoryStillValid();
        this.refreshSelectedInventoryProducts();
      },
      error: (error) => {
        this.inventories = [];
        this.loadingInventories = false;
        this.inventoriesError = error;
        this.ensureSelectedInventoryStillValid();
        this.refreshSelectedInventoryProducts();
      },
    });
  }

  private resolveConfiguredBaseUrl(): string {
    const inputBaseUrl = this.apiBaseUrl?.trim();
    if (inputBaseUrl) {
      return inputBaseUrl;
    }

    if (this.baseUrl.trim() !== '') {
      return this.baseUrl.trim();
    }

    return this.inputDaySrv.baseUrl;
  }

  private shouldEagerLoadProducts(): boolean {
    return this.isStandaloneMode || this.normalizePositiveInteger(this.initialEditingItemId) !== null;
  }

  private applyServicesBaseUrl(): void {
    this.inputDaySrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.inventorySrv.setBaseUrl(this.baseUrl);
  }

  private syncPendingEditorContextFromInputs(): void {
    this.pendingInitialOccurredAt = this.normalizeIsoString(this.initialOccurredAt);
    this.pendingInitialEditingItemId = this.normalizePositiveInteger(this.initialEditingItemId);
  }

  private applyInitialDateInput(): void {
    if (!this.initialDateLocal || this.initialDateLocal.trim() === '') {
      this.initialDateError = null;
      return;
    }

    const parsed = this.parseDateInput(this.initialDateLocal);
    if (!parsed) {
      this.initialDateError = 'dateLocal doit etre au format YYYY-MM-DD.';
      this.inputDayResponse = null;
      return;
    }

    this.initialDateError = null;
    this.form.patchValue({
      dateLocal: this.lockDate ? this.formatDateLocal(parsed) : parsed,
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

    if (!this.isEditingItem && String(this.itemEditorForm.value.dateLocal ?? '').trim() === '') {
      this.prefillItemEditorForCreate(null);
    }
  }

  private resolveDateLocalValue(): string | null {
    const rawDate = this.form.value.dateLocal;
    const parsedDate = this.parseDateInput(rawDate);
    if (!parsedDate) {
      return null;
    }

    return this.formatDateLocal(parsedDate);
  }

  private requireDate(): string | null {
    const dateLocal = this.resolveDateLocalValue();
    if (!dateLocal) {
      this.lastError = 'dateLocal doit etre au format YYYY-MM-DD.';
      return null;
    }

    return dateLocal;
  }

  private buildItemEditorRequest():
    | { itemId: null; requestDateLocal: string; payload: InputDayItemCommand }
    | { itemId: number; requestDateLocal: string; payload: UpdateInputDayItemDto }
    | null {
    const dateLocal = String(this.itemEditorForm.value.dateLocal ?? '').trim();
    if (!this.isDateLocal(dateLocal)) {
      this.itemEditorError = 'La date de l\'entree doit etre au format YYYY-MM-DD.';
      return null;
    }

    if (
      this.selectedInventoryId == null ||
      !Number.isInteger(this.selectedInventoryId) ||
      this.selectedInventoryId < 1
    ) {
      this.itemEditorError = 'Selectionne un inventory avant d\'enregistrer l\'entree.';
      return null;
    }

    const productId = this.normalizePositiveInteger(this.itemEditorForm.value.productId);
    if (productId === null) {
      this.itemEditorError = 'Selectionne un produit.';
      return null;
    }

    const qty = this.itemEditorForm.value.qty ?? null;
    if (qty == null || !Number.isFinite(qty) || qty <= 0) {
      this.itemEditorError = 'La quantite doit etre > 0.';
      return null;
    }

    let qtyUnit: ProductQuantityInputUnit | null = null;
    try {
      qtyUnit = this.normalizeQtyUnit(this.itemEditorForm.value.qtyUnit);
    } catch (error) {
      this.itemEditorError = error instanceof Error ? error.message : 'qtyUnit invalide.';
      return null;
    }

    const occurredAtRaw = String(this.itemEditorForm.value.occurredAt ?? '').trim();
    const occurredAt = occurredAtRaw === '' ? null : this.buildOccurredAtIso(occurredAtRaw);
    if (occurredAtRaw !== '' && occurredAt === null) {
      this.itemEditorError = 'occurredAt doit etre une date/heure valide.';
      return null;
    }

    const slotId = this.normalizeNullablePositiveInteger(this.itemEditorForm.value.slotId);
    const slotKey =
      slotId === null ? String(this.itemEditorForm.value.slotKey ?? '').trim() : '';

    const itemId = this.normalizePositiveInteger(this.itemEditorForm.value.itemId);
    this.itemEditorError = null;

    if (itemId === null) {
      const payload: InputDayItemCommand = {
        productId,
        inventoryId: this.selectedInventoryId,
        qty,
        ...(occurredAt ? { occurredAt } : {}),
        ...(qtyUnit ? { qtyUnit } : {}),
        ...(slotId !== null ? { slotId } : {}),
        ...(slotId === null && slotKey !== '' ? { slotKey } : {}),
      };

      return {
        itemId: null,
        requestDateLocal: dateLocal,
        payload,
      };
    }

    const requestDateLocal = this.editingSourceDateLocal ?? this.requireDate();
    if (!requestDateLocal) {
      return null;
    }

    const payload: UpdateInputDayItemDto = {
      dateLocal,
      productId,
      inventoryId: this.selectedInventoryId,
      qty,
      ...(occurredAt ? { occurredAt } : {}),
      ...(qtyUnit ? { qtyUnit } : {}),
      slotId,
      ...(slotId === null && slotKey !== '' ? { slotKey } : {}),
    };

    return {
      itemId,
      requestDateLocal,
      payload,
    };
  }

  private buildSelectedItemsRequest():
    | { requestDateLocal: string; payload: CreateInputDayItemsDto }
    | null {
    const validationError = this.validateSelectedItemsPayload();
    if (validationError) {
      this.itemsFormError = validationError;
      return null;
    }

    const requestDateLocal = String(this.itemEditorForm.value.dateLocal ?? '').trim();
    const occurredAtRaw = String(this.itemEditorForm.value.occurredAt ?? '').trim();
    const occurredAt = occurredAtRaw === '' ? null : this.buildOccurredAtIso(occurredAtRaw);
    const slotKey =
      this.selectedSlotId === null ? String(this.itemEditorForm.value.slotKey ?? '').trim() : '';

    try {
      const payload: CreateInputDayItemsDto = {
        items: this.selectedProductRows.map((row) => {
          const qtyUnit = this.normalizeQtyUnit(row.qtyUnit);
          return {
            productId: row.productId,
            inventoryId: this.selectedInventoryId as number,
            qty: row.qty as number,
            ...(occurredAt ? { occurredAt } : {}),
            ...(qtyUnit ? { qtyUnit } : {}),
            ...(this.selectedSlotId != null ? { slotId: this.selectedSlotId } : {}),
            ...(this.selectedSlotId == null && slotKey !== '' ? { slotKey } : {}),
          };
        }),
      };

      this.itemsFormError = null;
      return {
        requestDateLocal,
        payload,
      };
    } catch (error) {
      this.itemsFormError = error instanceof Error ? error.message : 'qtyUnit invalide.';
      return null;
    }
  }

  private prefillItemEditorForCreate(occurredAt: string | null): void {
    this.itemEditorForm.reset(
      {
        itemId: null,
        dateLocal: this.resolveEditorDefaultDateLocal(),
        occurredAt: this.toDateTimeLocalInput(occurredAt),
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
      this.initialDateLocal?.trim() ??
      ''
    );
  }

  private validateSelectedItemsPayload(): string | null {
    if (!this.hasValidSelectedDate || this.initialDateError !== null) {
      return 'La date selectionnee est invalide.';
    }

    if (
      this.selectedInventoryId == null ||
      !Number.isInteger(this.selectedInventoryId) ||
      this.selectedInventoryId < 1
    ) {
      return 'Selectionne un inventory avant d\'ajouter des items.';
    }

    if (this.selectedProductRows.length === 0) {
      return 'Selectionne au moins un produit.';
    }

    const requestDateLocal = String(this.itemEditorForm.value.dateLocal ?? '').trim();
    if (!this.isDateLocal(requestDateLocal)) {
      return 'La date metier doit etre au format YYYY-MM-DD.';
    }

    const occurredAtRaw = String(this.itemEditorForm.value.occurredAt ?? '').trim();
    if (occurredAtRaw !== '' && this.buildOccurredAtIso(occurredAtRaw) === null) {
      return 'occurredAt doit etre une date/heure valide.';
    }

    if (
      this.selectedProductRows.some(
        (row) => row.qty == null || !Number.isFinite(row.qty) || row.qty <= 0,
      )
    ) {
      return 'Chaque produit selectionne doit avoir une quantite > 0.';
    }

    return null;
  }

  private normalizeQtyUnit(value: unknown): ProductQuantityInputUnit | null {
    if (value == null) {
      return null;
    }

    const candidate = String(value).trim().toLowerCase();
    if (candidate === '') {
      return null;
    }

    if (!this.qtyUnitSet.has(candidate as ProductQuantityInputUnit)) {
      throw new Error(`qtyUnit invalide: ${candidate}`);
    }

    return candidate as ProductQuantityInputUnit;
  }

  private buildOccurredAtIso(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const parsed = DateTime.fromISO(trimmed, { zone: this.resolveTimezone() });
    if (!parsed.isValid) {
      return null;
    }

    return parsed.toISO({ suppressMilliseconds: true });
  }

  private toDateTimeLocalInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsed = DateTime.fromISO(value, { setZone: true });
    if (!parsed.isValid) {
      return '';
    }

    return parsed.setZone(this.resolveTimezone()).toFormat("yyyy-LL-dd'T'HH:mm");
  }

  private parseDateInput(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isDateLocal(value: string): boolean {
    return value.length === 10 && DateTime.fromISO(value).isValid;
  }

  private resolveTimezone(): string {
    const timezone = String(this.form.value.timezone ?? 'UTC').trim();
    return timezone !== '' ? timezone : 'UTC';
  }

  private normalizePositiveInteger(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      return null;
    }

    return value;
  }

  private normalizeNullablePositiveInteger(value: unknown): number | null {
    return this.normalizePositiveInteger(value);
  }

  private normalizeIsoString(value: string | null | undefined): string | null {
    const candidate = value?.trim();
    return candidate ? candidate : null;
  }

  private formatDecimal(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
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
    if (
      this.selectedInventoryId == null ||
      !Number.isInteger(this.selectedInventoryId) ||
      this.selectedInventoryId < 1
    ) {
      this.clearSelectedInventoryProducts();
      this.syncSelectionToAvailableProducts();
      return;
    }

    const inventory = this.inventories.find((item) => item.id === this.selectedInventoryId) ?? null;
    const embeddedProducts = this.extractInventoryProductsFromResponse(
      inventory?.inventoryProducts ?? null,
    );

    if (inventory && Array.isArray(inventory.inventoryProducts)) {
      this.selectedInventoryProducts = embeddedProducts;
      this.refreshSelectableProductListItems();
      this.loadingInventoryProducts = false;
      this.inventoryProductsError = null;
      this.syncSelectionToAvailableProducts();
      return;
    }

    this.loadSelectedInventoryProducts(this.selectedInventoryId);
  }

  private loadSelectedInventoryProducts(inventoryId: number): void {
    this.loadingInventoryProducts = true;
    this.inventoryProductsError = null;
    this.selectedInventoryProducts = [];
    this.refreshSelectableProductListItems();
    this.syncSelectionToAvailableProducts();

    this.inventorySrv.findProducts(inventoryId).subscribe({
      next: (response) => {
        if (this.selectedInventoryId !== inventoryId) {
          return;
        }

        this.selectedInventoryProducts = this.extractInventoryProductsFromResponse(response);
        this.refreshSelectableProductListItems();
        this.loadingInventoryProducts = false;
        this.inventoryProductsError = null;
        this.syncSelectionToAvailableProducts();
      },
      error: (error) => {
        if (this.selectedInventoryId !== inventoryId) {
          return;
        }

        this.selectedInventoryProducts = [];
        this.refreshSelectableProductListItems();
        this.loadingInventoryProducts = false;
        this.inventoryProductsError = error;
        this.syncSelectionToAvailableProducts();
      },
    });
  }

  private ensureSelectedInventoryStillValid(): void {
    if (
      this.selectedInventoryId !== null &&
      !this.inventories.some((inventory) => inventory.id === this.selectedInventoryId)
    ) {
      this.selectedInventoryId = null;
    }
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
    return this.inputDayResponse?.items.find((item) => item.id === itemId) ?? null;
  }

  private findSlotForItem(item: InputDayItemSummary): {
    slotId: number;
    title: string;
    slotKey: string;
    sortOrder: number;
    startTime: string | null;
    endTime: string | null;
  } | null {
    if (item.slotId !== null) {
      return this.availableSlots.find((slot) => slot.slotId === item.slotId) ?? null;
    }

    if (item.slotKey) {
      return this.availableSlots.find((slot) => slot.slotKey === item.slotKey) ?? null;
    }

    return null;
  }

  private refreshAvailableSlots(): void {
    this.availableSlotsCache = (this.inputDayResponse?.daySet?.slots ?? [])
      .filter((slot): slot is typeof slot & { slotId: number } => slot.slotId !== null)
      .map((slot) => ({
        slotId: slot.slotId,
        title: slot.title,
        slotKey: slot.slotKey,
        sortOrder: slot.sortOrder,
        startTime: slot.startTime ?? null,
        endTime: slot.endTime ?? null,
      }));
  }

  private extractProductsFromResponse(value: unknown): ProductApiModel[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is ProductApiModel => this.isProductLike(item));
    }

    if (this.isProductLike(value)) {
      return [value];
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    const raw = value as Record<string, unknown>;
    const nestedCandidates = ['data', 'items', 'products', 'results', 'payload'];
    for (const key of nestedCandidates) {
      const nested = raw[key];
      if (Array.isArray(nested)) {
        const products = nested.filter((item): item is ProductApiModel => this.isProductLike(item));
        if (products.length > 0) {
          return products;
        }
      }
    }

    return [];
  }

  private extractInventoriesFromResponse(value: unknown): Inventory[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is Inventory => this.isInventoryLike(item));
    }

    if (this.isInventoryLike(value)) {
      return [value];
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    const raw = value as Record<string, unknown>;
    const nestedCandidates = ['data', 'items', 'inventories', 'results', 'payload'];
    for (const key of nestedCandidates) {
      const nested = raw[key];
      if (Array.isArray(nested)) {
        const inventories = nested.filter((item): item is Inventory => this.isInventoryLike(item));
        if (inventories.length > 0) {
          return inventories;
        }
      }
    }

    return [];
  }

  private extractInventoryProductsFromResponse(value: unknown): InventoryProduct[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is InventoryProduct => this.isInventoryProductLike(item));
    }

    if (this.isInventoryProductLike(value)) {
      return [value];
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    const raw = value as Record<string, unknown>;
    const nestedCandidates = [
      'data',
      'items',
      'inventoryProducts',
      'products',
      'results',
      'payload',
    ];
    for (const key of nestedCandidates) {
      const nested = raw[key];
      if (Array.isArray(nested)) {
        const products = nested.filter(
          (item): item is InventoryProduct => this.isInventoryProductLike(item),
        );
        if (products.length > 0) {
          return products;
        }
      }
    }

    return [];
  }

  private isProductLike(value: unknown): value is ProductApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const product = value as Partial<ProductApiModel>;
    return typeof product.id === 'number' && typeof product.name === 'string';
  }

  private isInventoryLike(value: unknown): value is Inventory {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const inventory = value as Partial<Inventory>;
    return typeof inventory.id === 'number' && typeof inventory.name === 'string';
  }

  private isInventoryProductLike(value: unknown): value is InventoryProduct {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const inventoryProduct = value as Partial<InventoryProduct>;
    return (
      typeof inventoryProduct.id === 'number' &&
      typeof inventoryProduct.productId === 'number' &&
      typeof inventoryProduct.inventoryId === 'number'
    );
  }

  private isProductListSourceLike(value: unknown): value is ProductListSource {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const product = value as Partial<ProductListSource>;
    return typeof product.id === 'number' && typeof product.name === 'string';
  }

  private mapProductToListItem(product: ProductListSource): ProductListItem {
    return {
      id: String(product.id),
      name: product.name,
      barcode: product.barcode ?? null,
      unitType: product.unitType ?? undefined,
      quantityPerUnit: product.quantityPerUnit ?? undefined,
      quantityUnit: product.quantityUnit ?? null,
      portionCount: product.portionCount ?? null,
      portionUnit: product.portionUnit ?? null,
      portionQuantityNormalized: product.portionQuantityNormalized ?? null,
      price: product.price ?? null,
      tagNames: this.resolveTagNames(product.tags),
      nutritionValuesCount: Array.isArray(product.nutritionValues)
        ? product.nutritionValues.length
        : 0,
      category: this.resolveLinkedEntityName(product.category),
      genericProduct: this.resolveLinkedEntityName(product.genericProduct),
    };
  }

  private resolveInventoryLinkedProductListItem(
    inventoryProduct: InventoryProduct,
  ): ProductListItem | null {
    if (!this.isProductListSourceLike(inventoryProduct.product)) {
      return null;
    }

    return this.mapProductToListItem(inventoryProduct.product);
  }

  private withAvailableQuantity(
    item: ProductListItem,
    inventoryProduct: InventoryProduct,
  ): ProductListItem {
    return {
      ...item,
      availableQuantity:
        typeof inventoryProduct.qtyOnHandNormalized === 'number' &&
        Number.isFinite(inventoryProduct.qtyOnHandNormalized)
          ? inventoryProduct.qtyOnHandNormalized
          : null,
      availableQuantityUnit: item.quantityUnit ?? null,
    };
  }

  private refreshProductListItems(): void {
    this.productListItemsCache = this.products.map((product) => this.mapProductToListItem(product));
    this.refreshSelectableProductListItems();
  }

  private refreshSelectableProductListItems(): void {
    this.selectableProductListItemsCache = this.buildSelectableProductListItems();
  }

  private buildSelectableProductListItems(): ProductListItem[] {
    if (
      this.selectedInventoryId == null ||
      !Number.isInteger(this.selectedInventoryId) ||
      this.selectedInventoryId < 1
    ) {
      return [];
    }

    const productsById = new Map(
      this.productListItems.map((item) => [Number(item.id), item] as const),
    );
    const resolvedIds = new Set<number>();
    const resolvedItems: ProductListItem[] = [];

    for (const inventoryProduct of this.selectedInventoryProducts) {
      const productId = inventoryProduct.productId;
      if (!Number.isInteger(productId) || productId < 1 || resolvedIds.has(productId)) {
        continue;
      }

      const fallbackItem = this.resolveInventoryLinkedProductListItem(inventoryProduct);
      const resolvedItem = productsById.get(productId) ?? fallbackItem;
      if (!resolvedItem) {
        continue;
      }

      resolvedIds.add(productId);
      resolvedItems.push(this.withAvailableQuantity(resolvedItem, inventoryProduct));
    }

    return resolvedItems;
  }

  private resolveTagNames(tags: unknown): string[] {
    if (!Array.isArray(tags)) {
      return [];
    }

    const names = tags
      .map((tag) => {
        if (typeof tag === 'string') {
          return tag.trim();
        }

        if (!tag || typeof tag !== 'object') {
          return '';
        }

        const raw = tag as Record<string, unknown>;
        const fields = ['name', 'title', 'label', 'key'];
        for (const field of fields) {
          const value = raw[field];
          if (typeof value === 'string' && value.trim() !== '') {
            return value.trim();
          }
        }

        return '';
      })
      .filter((name) => name !== '');

    return Array.from(new Set(names));
  }

  private resolveLinkedEntityName(value: unknown): string {
    if (!value || typeof value !== 'object') {
      return 'Aucun';
    }

    const raw = value as Record<string, unknown>;
    const fields = ['name', 'title', 'label'];
    for (const field of fields) {
      const candidate = raw[field];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim();
      }
    }

    return 'Aucun';
  }
}
