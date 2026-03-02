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
  InputDayMacroValue,
  InputDayResponse,
  InputDayTotalsMacrosBySlotEntry,
  ProductQuantityInputUnit,
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
  loading = false;
  loadingProducts = false;
  loadingInventories = false;
  loadingInventoryProducts = false;

  products: ProductApiModel[] = [];
  inventories: Inventory[] = [];
  selectedInventoryProducts: InventoryProduct[] = [];
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
  initialDateError: string | null = null;
  inputDayResponse: InputDayResponse | null = null;

  private initialized = false;
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
      itemId: this.fb.control<number | null>(null),
      updateQty: this.fb.control<number | null>(null),
      updateQtyUnit: this.fb.control<string | null>(null),
    });
  }

  ngOnInit(): void {
    this.baseUrl = this.resolveConfiguredBaseUrl();
    this.applyServicesBaseUrl();
    this.loadProducts();
    this.loadInventories();
    this.applyInitialDateInput();
    this.initialized = true;

    if (this.isEmbeddedMode && this.hasValidSelectedDate) {
      this.loadDay();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }

    if (changes['apiBaseUrl']) {
      this.baseUrl = this.resolveConfiguredBaseUrl();
      this.applyServicesBaseUrl();
      this.loadProducts();
      this.loadInventories();
      if (this.hasValidSelectedDate) {
        this.loadDay();
      }
    }

    if (changes['initialDateLocal'] || changes['displayMode'] || changes['lockDate']) {
      this.applyInitialDateInput();
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
    return this.products.map((product) => this.mapProductToListItem(product));
  }

  get selectableProductListItems(): ProductListItem[] {
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

  get availableSlots(): Array<{
    slotId: number;
    title: string;
    slotKey: string;
    sortOrder: number;
    startTime: string | null;
    endTime: string | null;
  }> {
    return (this.inputDayResponse?.daySet?.slots ?? [])
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

    this.inputDaySrv.getInputDay(dateLocal, timezone).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.inputDayResponse = response;
        this.ensureSelectedSlotStillValid();
        this.loading = false;
      },
      error: (error) => {
        this.lastError = error;
        this.inputDayResponse = null;
        this.loading = false;
      },
    });
  }

  createSelectedItems(): void {
    const dateLocal = this.requireDate();
    if (!dateLocal) {
      return;
    }

    const validationError = this.validateSelectedItemsPayload();
    if (validationError) {
      this.itemsFormError = validationError;
      return;
    }

    const payload: CreateInputDayItemsDto = {
      items: this.selectedProductRows.map((row) => ({
        productId: row.productId,
        inventoryId: this.selectedInventoryId as number,
        qty: row.qty as number,
        ...(row.qtyUnit ? { qtyUnit: row.qtyUnit } : {}),
        ...(this.selectedSlotId != null ? { slotId: this.selectedSlotId } : {}),
      })),
    };

    this.loading = true;
    this.itemsFormError = null;

    this.inputDaySrv.createItems(dateLocal, payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.clearSelectedProducts();
        this.loading = false;
        this.itemsChanged.emit({ dateLocal });
        this.loadDay();
      },
      error: (error) => {
        this.lastError = error;
        this.itemsFormError = 'Impossible d\'ajouter les items selectionnes.';
        this.loading = false;
      },
    });
  }

  updateQty(): void {
    const dateLocal = this.requireDate();
    if (!dateLocal) {
      return;
    }

    const itemId = this.form.value.itemId ?? null;
    const qty = this.form.value.updateQty ?? null;
    const qtyUnit = this.normalizeQtyUnit(this.form.value.updateQtyUnit);

    if (itemId == null || !Number.isInteger(itemId) || itemId < 1) {
      this.lastError = 'itemId est requis et doit etre un entier > 0.';
      return;
    }

    if (qty == null || qty <= 0) {
      this.lastError = 'updateQty est requis et doit etre > 0.';
      return;
    }

    this.loading = true;
    this.inputDaySrv.updateItemQty(dateLocal, itemId, {
      qty,
      ...(qtyUnit ? { qtyUnit } : {}),
    }).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;
        this.itemsChanged.emit({ dateLocal });
        this.loadDay();
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  removeItem(): void {
    const dateLocal = this.requireDate();
    if (!dateLocal) {
      return;
    }

    const itemId = this.form.value.itemId ?? null;
    if (itemId == null || !Number.isInteger(itemId) || itemId < 1) {
      this.lastError = 'itemId est requis et doit etre un entier > 0.';
      return;
    }

    this.loading = true;
    this.inputDaySrv.removeItem(dateLocal, itemId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, itemId, dateLocal };
        this.lastError = null;
        this.loading = false;
        this.itemsChanged.emit({ dateLocal });
        this.loadDay();
      },
      error: (error) => {
        this.lastError = error;
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
    this.refreshSelectedInventoryProducts();
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
      itemId: 1,
      updateQty: 150,
      updateQtyUnit: 'g',
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
      itemId: null,
      updateQty: null,
      updateQtyUnit: null,
    });

    this.selectedInventoryId = null;
    this.selectedSlotId = null;
    this.clearSelectedInventoryProducts();
    this.initialDateError = null;
    this.itemsFormError = null;
    this.clearSelectedProducts();
    this.lastResponse = null;
    this.lastError = null;
    this.inputDayResponse = null;
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

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productsError = null;

    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = this.extractProductsFromResponse(response);
        this.loadingProducts = false;
        this.productsError = null;
        this.syncSelectionToAvailableProducts();
      },
      error: (error) => {
        this.products = [];
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

  private applyServicesBaseUrl(): void {
    this.inputDaySrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.inventorySrv.setBaseUrl(this.baseUrl);
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

  private resolveTimezone(): string {
    const timezone = String(this.form.value.timezone ?? 'UTC').trim();
    return timezone !== '' ? timezone : 'UTC';
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
    this.loadingInventoryProducts = false;
    this.inventoryProductsError = null;
  }

  private syncSelectionToAvailableProducts(): void {
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
    this.syncSelectionToAvailableProducts();

    this.inventorySrv.findProducts(inventoryId).subscribe({
      next: (response) => {
        if (this.selectedInventoryId !== inventoryId) {
          return;
        }

        this.selectedInventoryProducts = this.extractInventoryProductsFromResponse(response);
        this.loadingInventoryProducts = false;
        this.inventoryProductsError = null;
        this.syncSelectionToAvailableProducts();
      },
      error: (error) => {
        if (this.selectedInventoryId !== inventoryId) {
          return;
        }

        this.selectedInventoryProducts = [];
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

  private isInputDayResponse(value: unknown): value is InputDayResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const raw = value as Record<string, unknown>;
    return (
      typeof raw['dateLocal'] === 'string' &&
      typeof raw['timezone'] === 'string' &&
      Array.isArray(raw['items'])
    );
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
