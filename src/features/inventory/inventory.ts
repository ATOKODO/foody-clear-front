
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  InventoryForm,
  InventoryFormMode,
  InventoryFormValue,
} from '../../components/inventory/inventory-form/inventory-form';
import {
  InventoryList,
  InventoryListItem,
} from '../../components/inventory/inventory-list/inventory-list';
import {
  ProductList,
  ProductListItem,
} from '../../components/product/product-list/product-list';
import { mapProductToProductListItem } from '../../components/product/product-list/product-list-item.mapper';
import {
  CreateInventoryDto,
  Inventory as InventoryApiModel,
  InventoryProduct,
  InventoryProductQtyDto,
  ProductQuantityInputUnit,
  PurchaseAccountingMode,
  UpdateInventoryDto,
} from '../../interfaces/inventory.interface';
import { InventoryService } from '../../services/inventory-service';
import {
  Product as ProductApiModel,
  ProductService,
} from '../../services/product-service';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';

const INVENTORY_QTY_UNITS: ProductQuantityInputUnit[] = [
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

interface InventoryRowProductMeta {
  unitType: string | null;
  quantityPerUnit: number | null;
  quantityUnit: ProductQuantityInputUnit | null;
  portionCount: number | null;
  portionUnit: ProductQuantityInputUnit | null;
  portionQuantityNormalized: number | null;
  price: number | null;
}

type InventorySelectedProductRow = {
  productId: number;
  productName: string;
  qty: number | null;
  qtyUnit: ProductQuantityInputUnit;
  qtyUnitOptions: InventoryQtyUnitOption[];
  qtyUnitHelpText: string | null;
  purchaseAccountingMode: PurchaseAccountingMode;
} & InventoryRowProductMeta;

type InventoryManagedProductRow = {
  currentQty: number;
  currentQtyUnit: ProductQuantityInputUnit;
  currentNormalizedQty: number | null;
  currentQtyDisplay: string;
} & InventorySelectedProductRow;

interface InventoryProductMetaSource {
  unitType?: string | null;
  quantityPerUnit?: number | null;
  quantityUnit?: string | null;
  portionCount?: number | null;
  portionUnit?: string | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
}

interface InventoryQtyUnitOption {
  value: ProductQuantityInputUnit;
  label: string;
}

@Component({
  selector: 'app-inventory',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UiErrorPanel,
    InventoryList,
    InventoryForm,
    ProductList
],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class Inventory implements OnInit {
  private readonly inventorySrv = inject(InventoryService);
  private readonly productSrv = inject(ProductService);

  baseUrl = '';
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly loadingInventoryProductsState = signal(false);
  private readonly loadingProductsState = signal(false);

  private readonly inventoriesState = signal<InventoryApiModel[]>([]);
  private readonly productsState = signal<ProductApiModel[]>([]);
  private readonly inventoryListItemsState = computed<InventoryListItem[]>(() =>
    this.inventoriesState().map((inventory) => ({
      id: String(inventory.id),
      name: inventory.name,
      productCount: this.resolveProductCount(inventory),
    })),
  );
  private readonly productListItemsState = computed<ProductListItem[]>(() =>
    this.productsState().map((product) => mapProductToProductListItem(product)),
  );

  private readonly formVisibleState = signal(false);
  private readonly formModeState = signal<InventoryFormMode>('add');
  private readonly activeModalState = signal<'add-products' | null>(null);
  private readonly formInitialValueState = signal<Partial<InventoryFormValue> | null>(null);
  private readonly manageProductRowsState = signal<InventoryManagedProductRow[]>([]);

  editingInventoryId: number | null = null;
  editingInventoryProducts: InventoryProduct[] = [];
  createSelectedProductRows: InventorySelectedProductRow[] = [];
  addSelectedProductRows: InventorySelectedProductRow[] = [];

  lastResponse: unknown = null;
  lastError: unknown = null;
  createProductsFormError: string | null = null;
  addProductsFormError: string | null = null;
  manageProductsFormError: string | null = null;

  readonly purchaseAccountingModeOptions: { value: PurchaseAccountingMode; label: string }[] = [
    { value: 'paid', label: 'Paye' },
    { value: 'free', label: 'Offert' },
    { value: 'excluded', label: 'Ignorer des stats' },
  ];

  private readonly qtyUnitSet = new Set<ProductQuantityInputUnit>(INVENTORY_QTY_UNITS);

  ngOnInit(): void {
    this.baseUrl = this.inventorySrv.baseUrl;
    this.productSrv.setBaseUrl(this.baseUrl);
    this.loadProducts();
    this.loadInventories();
  }

  onBaseUrlChange(): void {
    this.inventorySrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.loadProducts();
    this.loadInventories();
  }

  get loading(): boolean {
    return this.loadingState();
  }

  set loading(value: boolean) {
    this.loadingState.set(value);
  }

  get saving(): boolean {
    return this.savingState();
  }

  set saving(value: boolean) {
    this.savingState.set(value);
  }

  get loadingInventoryProducts(): boolean {
    return this.loadingInventoryProductsState();
  }

  set loadingInventoryProducts(value: boolean) {
    this.loadingInventoryProductsState.set(value);
  }

  get loadingProducts(): boolean {
    return this.loadingProductsState();
  }

  set loadingProducts(value: boolean) {
    this.loadingProductsState.set(value);
  }

  get formVisible(): boolean {
    return this.formVisibleState();
  }

  set formVisible(value: boolean) {
    this.formVisibleState.set(value);
  }

  get formMode(): InventoryFormMode {
    return this.formModeState();
  }

  set formMode(value: InventoryFormMode) {
    this.formModeState.set(value);
  }

  get activeModal(): 'add-products' | null {
    return this.activeModalState();
  }

  set activeModal(value: 'add-products' | null) {
    this.activeModalState.set(value);
  }

  get formInitialValue(): Partial<InventoryFormValue> | null {
    return this.formInitialValueState();
  }

  set formInitialValue(value: Partial<InventoryFormValue> | null) {
    this.formInitialValueState.set(value);
  }

  get manageProductRows(): InventoryManagedProductRow[] {
    return this.manageProductRowsState();
  }

  set manageProductRows(value: InventoryManagedProductRow[]) {
    this.manageProductRowsState.set(value);
  }

  get inventories(): InventoryApiModel[] {
    return this.inventoriesState();
  }

  set inventories(value: InventoryApiModel[]) {
    this.inventoriesState.set(value);
  }

  get products(): ProductApiModel[] {
    return this.productsState();
  }

  set products(value: ProductApiModel[]) {
    this.productsState.set(value);
  }

  get inventoryListItems(): InventoryListItem[] {
    return this.inventoryListItemsState();
  }

  get productListItems(): ProductListItem[] {
    return this.productListItemsState();
  }

  get addableProductListItems(): ProductListItem[] {
    return this.productListItems;
  }

  get createSelectedProductIds(): string[] {
    return this.createSelectedProductRows.map((row) => String(row.productId));
  }

  get addSelectedProductIds(): string[] {
    return this.addSelectedProductRows.map((row) => String(row.productId));
  }

  get isAddProductsModalOpen(): boolean {
    return this.activeModal === 'add-products';
  }

  get canAddSelectedProducts(): boolean {
    return (
      this.isAddProductsModalOpen &&
      this.addSelectedProductRows.length > 0 &&
      !this.saving &&
      !this.loadingProducts &&
      !this.loadingInventoryProducts &&
      this.validatePositiveQtyRows(this.addSelectedProductRows) === null
    );
  }

  get canSaveManagedProducts(): boolean {
    return (
      this.formMode === 'edit' &&
      this.editingInventoryId !== null &&
      !this.saving &&
      !this.loadingInventoryProducts &&
      this.validateManagedProductRows(this.manageProductRows) === null &&
      (this.manageProductRows.length > 0 || this.editingInventoryProducts.length > 0)
    );
  }

  onRefreshRequested(): void {
    this.loadProducts();
    this.loadInventories();

    if (this.editingInventoryId !== null) {
      this.loadInventoryProducts(this.editingInventoryId);
    }
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingInventoryId = null;
    this.activeModal = null;
    this.formInitialValue = null;
    this.editingInventoryProducts = [];
    this.clearProductSelections();
    this.formVisible = true;
  }

  onEditRequested(item: InventoryListItem): void {
    const inventoryId = Number(item.id);
    if (!Number.isInteger(inventoryId) || inventoryId < 1) {
      return;
    }

    const inventory = this.inventories.find((value) => value.id === inventoryId);
    if (!inventory) {
      return;
    }

    this.formMode = 'edit';
    this.editingInventoryId = inventory.id;
    this.activeModal = null;
    this.formInitialValue = this.toFormValue(inventory);
    this.clearProductSelections();
    this.formVisible = true;
    this.loadInventoryProducts(inventory.id);
  }

  onDeleteRequested(item: InventoryListItem): void {
    const inventoryId = Number(item.id);
    if (!Number.isInteger(inventoryId) || inventoryId < 1) {
      return;
    }

    this.saving = true;
    this.inventorySrv.remove(inventoryId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: inventoryId };
        this.lastError = null;
        this.saving = false;

        if (this.editingInventoryId === inventoryId) {
          this.onCancelForm();
        }

        this.loadInventories();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: InventoryFormMode; value: InventoryFormValue }): void {
    if (event.mode === 'edit' && this.editingInventoryId !== null) {
      this.saving = true;
      const payload: UpdateInventoryDto = {
        name: event.value.name.trim(),
      };

      this.inventorySrv.update(this.editingInventoryId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.loadInventories();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    const validationError = this.validatePositiveQtyRows(this.createSelectedProductRows);
    if (validationError) {
      this.createProductsFormError = validationError;
      return;
    }

    this.saving = true;
    const payload = this.toCreateDto(event.value);
    this.inventorySrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.clearProductSelections();
        this.loadInventories();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onCreateProductsSelected(items: ProductListItem[]): void {
    this.createSelectedProductRows = this.syncSelectedProductRows(
      items,
      this.createSelectedProductRows,
    );
    this.createProductsFormError = null;
  }

  onProductsToAddSelected(items: ProductListItem[]): void {
    this.addSelectedProductRows = this.syncSelectedProductRows(items, this.addSelectedProductRows);
    this.addProductsFormError = null;
  }

  openAddProductsModal(): void {
    if (this.editingInventoryId == null) {
      return;
    }

    this.activeModal = 'add-products';
    this.addSelectedProductRows = [];
    this.addProductsFormError = null;
  }

  closeActiveModal(): void {
    if (this.saving) {
      return;
    }

    this.activeModal = null;
    this.addSelectedProductRows = [];
    this.addProductsFormError = null;
  }

  onEscapeKey(): void {
    if (this.formVisible) {
      this.closeFormModal();
      return;
    }

    if (this.activeModal) {
      this.closeActiveModal();
    }
  }

  onAddSelectedProducts(): void {
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null || this.addSelectedProductRows.length === 0) {
      return;
    }

    const validationError = this.validatePositiveQtyRows(this.addSelectedProductRows);
    if (validationError) {
      this.addProductsFormError = validationError;
      return;
    }

    this.saving = true;
    this.inventorySrv.addProducts(inventoryId, {
      products: this.toProductQtyPayload(this.addSelectedProductRows, true),
    }).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.closeActiveModal();
        this.loadInventories();
        this.loadInventoryProducts(inventoryId);
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  saveManagedProducts(): void {
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null) {
      return;
    }

    const validationError = this.validateManagedProductRows(this.manageProductRows);
    if (validationError) {
      this.manageProductsFormError = validationError;
      return;
    }

    this.saving = true;
    this.inventorySrv.reconcileProducts(inventoryId, {
      products: this.toProductQtyPayload(this.manageProductRows),
    }).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.loadInventories();
        this.loadInventoryProducts(inventoryId);
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  emptyInventory(): void {
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null) {
      return;
    }

    this.saving = true;
    this.inventorySrv.reconcileProducts(inventoryId, {
      products: [],
    }).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.loadInventories();
        this.loadInventoryProducts(inventoryId);
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu inventory-form capturee.',
      at: new Date().toISOString(),
    };
  }

  closeFormModal(): void {
    if (this.saving) {
      return;
    }

    this.onCancelForm();
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.editingInventoryId = null;
    this.activeModal = null;
    this.formInitialValue = null;
    this.editingInventoryProducts = [];
    this.loadingInventoryProducts = false;
    this.clearProductSelections();
  }

  onCreateProductQtyChange(): void {
    this.createProductsFormError = null;
  }

  onAddProductQtyChange(): void {
    this.addProductsFormError = null;
  }

  onManagedProductQtyChange(): void {
    this.manageProductsFormError = null;
  }

  getQtyUnitOptions(row: InventoryRowProductMeta): InventoryQtyUnitOption[] {
    const options: InventoryQtyUnitOption[] = [];
    const seen = new Set<ProductQuantityInputUnit>();

    const pushOption = (value: ProductQuantityInputUnit | null, label: string): void => {
      if (value === null || seen.has(value)) {
        return;
      }

      seen.add(value);
      options.push({ value, label });
    };

    const unitType = row.unitType?.trim();
    pushOption('unit', unitType ? `Unite produit (${unitType})` : 'Unite produit');

    if (row.quantityUnit) {
      pushOption(row.quantityUnit, row.quantityUnit.toUpperCase());
    }

    if (row.portionUnit) {
      pushOption(row.portionUnit, this.toTitleCase(row.portionUnit));
    }

    return options;
  }

  getQtyUnitHelpText(row: InventoryRowProductMeta): string | null {
    const parts: string[] = [];

    if (
      row.quantityPerUnit != null &&
      Number.isFinite(row.quantityPerUnit) &&
      row.quantityPerUnit > 0 &&
      row.quantityUnit
    ) {
      const unitType = row.unitType?.trim() || 'unite produit';
      parts.push(`1 ${unitType} = ${this.formatDecimal(row.quantityPerUnit)} ${row.quantityUnit}`);
    }

    if (
      row.portionQuantityNormalized != null &&
      Number.isFinite(row.portionQuantityNormalized) &&
      row.portionQuantityNormalized > 0 &&
      row.portionUnit &&
      row.quantityUnit
    ) {
      parts.push(
        `1 ${row.portionUnit} = ${this.formatDecimal(row.portionQuantityNormalized)} ${row.quantityUnit}`,
      );
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  }

  getCurrentQtyDisplay(
    row: Pick<InventoryManagedProductRow, 'currentQty' | 'unitType'>,
  ): string {
    const qty = this.formatDecimal(row.currentQty);
    const unitType = row.unitType?.trim();
    return unitType ? `${qty} ${unitType}` : qty;
  }

  removeCreateSelectedProduct(productId: number): void {
    this.createSelectedProductRows = this.createSelectedProductRows.filter(
      (row) => row.productId !== productId,
    );
    this.createProductsFormError = null;
  }

  removeAddSelectedProduct(productId: number): void {
    this.addSelectedProductRows = this.addSelectedProductRows.filter(
      (row) => row.productId !== productId,
    );
    this.addProductsFormError = null;
  }

  removeManagedProduct(productId: number): void {
    this.manageProductRows = this.manageProductRows.filter(
      (row) => row.productId !== productId,
    );
    this.manageProductsFormError = null;
  }

  trackBySelectedProductRow(_: number, row: InventorySelectedProductRow): number {
    return row.productId;
  }


  private ensurePurchaseAccountingMode(
    value: PurchaseAccountingMode | null | undefined,
    meta: InventoryRowProductMeta,
  ): PurchaseAccountingMode {
    return value === 'paid' || value === 'free' || value === 'excluded'
      ? value
      : this.resolveDefaultPurchaseAccountingMode(meta);
  }

  private resolveDefaultPurchaseAccountingMode(
    meta: InventoryRowProductMeta,
  ): PurchaseAccountingMode {
    return meta.price != null ? 'paid' : 'free';
  }

  private loadInventories(): void {
    this.loading = true;
    this.inventorySrv.findAll().subscribe({
      next: (response) => {
        this.inventories = this.extractInventoriesFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (this.editingInventoryId !== null) {
          const currentInventory =
            this.inventories.find((inventory) => inventory.id === this.editingInventoryId) ?? null;

          if (!currentInventory) {
            this.onCancelForm();
            return;
          }

          this.formInitialValue = this.toFormValue(currentInventory);
        }

        this.syncSelectionsToAvailableProducts();
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = this.extractProductsFromResponse(response);
        this.lastError = null;
        this.loadingProducts = false;
        this.syncSelectionsToAvailableProducts();
      },
      error: (error) => {
        this.products = [];
        this.lastError = error;
        this.loadingProducts = false;
        this.syncSelectionsToAvailableProducts();
      },
    });
  }

  private loadInventoryProducts(inventoryId: number): void {
    this.loadingInventoryProducts = true;
    this.inventorySrv.findProducts(inventoryId).subscribe({
      next: (response) => {
        this.editingInventoryProducts = this.extractInventoryProductsFromResponse(response);
        this.syncManagedProductRows();
        this.lastError = null;
        this.loadingInventoryProducts = false;
        this.syncSelectionsToAvailableProducts();
      },
      error: (error) => {
        this.editingInventoryProducts = [];
        this.syncManagedProductRows();
        this.lastError = error;
        this.loadingInventoryProducts = false;
        this.syncSelectionsToAvailableProducts();
      },
    });
  }

  private toCreateDto(value: InventoryFormValue): CreateInventoryDto {
    const payload: CreateInventoryDto = {
      name: value.name.trim(),
    };

    const products = this.toProductQtyPayload(this.createSelectedProductRows, true);
    if (products.length > 0) {
      payload.products = products;
    }

    return payload;
  }

  private toFormValue(inventory: InventoryApiModel): InventoryFormValue {
    return {
      name: inventory.name,
    };
  }

  private clearProductSelections(): void {
    this.createSelectedProductRows = [];
    this.createProductsFormError = null;
    this.clearEditModeSelections();
  }

  private clearEditModeSelections(): void {
    this.addSelectedProductRows = [];
    this.manageProductRows = [];
    this.addProductsFormError = null;
    this.manageProductsFormError = null;
  }

  private syncManagedProductRows(): void {
    this.manageProductRows = this.toManagedProductRows(this.editingInventoryProducts);
    this.manageProductsFormError = null;
  }

  private syncSelectionsToAvailableProducts(): void {
    this.createSelectedProductRows = this.filterSelectionRows(
      this.createSelectedProductRows,
      this.productListItems,
    );
    this.addSelectedProductRows = this.filterSelectionRows(
      this.addSelectedProductRows,
      this.productListItems,
    );
  }

  private filterSelectionRows(
    selectedRows: InventorySelectedProductRow[],
    availableItems: ProductListItem[],
  ): InventorySelectedProductRow[] {
    const availableById = new Map(
      availableItems.map((item) => [item.id, item] as const),
    );

    return selectedRows
      .map((row) => {
        const item = availableById.get(String(row.productId));
        if (!item) {
          return null;
        }

        const meta = this.buildProductMeta(item);
        const qtyUnit = this.ensureRowQtyUnit(row.qtyUnit, meta);
        return {
          ...row,
          productName: item.name,
          unitType: meta.unitType,
          quantityPerUnit: meta.quantityPerUnit,
          quantityUnit: meta.quantityUnit,
          portionCount: meta.portionCount,
          portionUnit: meta.portionUnit,
          portionQuantityNormalized: meta.portionQuantityNormalized,
          price: meta.price,
          qtyUnit,
          qtyUnitOptions: this.getQtyUnitOptions(meta),
          qtyUnitHelpText: this.getQtyUnitHelpText(meta),
          purchaseAccountingMode: this.ensurePurchaseAccountingMode(
            row.purchaseAccountingMode,
            meta,
          ),
        };
      })
      .filter((row): row is InventorySelectedProductRow => row !== null);
  }

  private syncSelectedProductRows(
    items: ProductListItem[],
    currentRows: InventorySelectedProductRow[],
  ): InventorySelectedProductRow[] {
    const rowsByProductId = new Map(
      currentRows.map((row) => [row.productId, row] as const),
    );

    return items.map((item) => {
      const productId = Number(item.id);
      const existingRow = rowsByProductId.get(productId);
      const meta = this.buildProductMeta(item);
      const qtyUnit = this.ensureRowQtyUnit(existingRow?.qtyUnit, meta);
      if (existingRow) {
        return {
          ...existingRow,
          productName: item.name,
          unitType: meta.unitType,
          quantityPerUnit: meta.quantityPerUnit,
          quantityUnit: meta.quantityUnit,
          portionCount: meta.portionCount,
          portionUnit: meta.portionUnit,
          portionQuantityNormalized: meta.portionQuantityNormalized,
          price: meta.price,
          qtyUnit,
          qtyUnitOptions: this.getQtyUnitOptions(meta),
          qtyUnitHelpText: this.getQtyUnitHelpText(meta),
          purchaseAccountingMode: this.ensurePurchaseAccountingMode(
            existingRow.purchaseAccountingMode,
            meta,
          ),
        };
      }

      return {
        productId,
        productName: item.name,
        qty: null,
        qtyUnit,
        qtyUnitOptions: this.getQtyUnitOptions(meta),
        qtyUnitHelpText: this.getQtyUnitHelpText(meta),
        purchaseAccountingMode: this.resolveDefaultPurchaseAccountingMode(meta),
        ...meta,
      };
    });
  }

  private toProductQtyPayload(
    rows: InventorySelectedProductRow[],
    includeAccountingMode = false,
  ): InventoryProductQtyDto[] {
    return rows
      .filter(
        (row) => typeof row.qty === 'number' && Number.isFinite(row.qty) && row.qty > 0,
      )
      .map((row) => ({
        productId: row.productId,
        qty: row.qty as number,
        ...(row.qtyUnit !== 'unit' ? { qtyUnit: row.qtyUnit } : {}),
        ...(includeAccountingMode
          ? { purchaseAccountingMode: row.purchaseAccountingMode }
          : {}),
      }));
  }

  private validatePositiveQtyRows(rows: InventorySelectedProductRow[]): string | null {
    if (rows.length === 0) {
      return null;
    }

    if (
      rows.some((row) => row.qty == null || !Number.isFinite(row.qty) || row.qty <= 0)
    ) {
      return 'Chaque produit selectionne doit avoir une quantite > 0.';
    }

    return null;
  }

  private validateManagedProductRows(rows: InventoryManagedProductRow[]): string | null {
    if (
      rows.some(
        (row) => row.qty == null || !Number.isFinite(row.qty) || row.qty < 0,
      )
    ) {
      return 'Chaque produit doit avoir une quantite >= 0.';
    }

    return null;
  }

  private resolveProductCount(inventory: InventoryApiModel): number {
    if (
      typeof inventory.productCount === 'number' &&
      Number.isFinite(inventory.productCount) &&
      inventory.productCount >= 0
    ) {
      return Math.floor(inventory.productCount);
    }

    if (Array.isArray(inventory.inventoryProducts)) {
      return inventory.inventoryProducts.length;
    }

    const raw = inventory as unknown as Record<string, unknown>;
    const candidates = ['productCount', 'productsCount', 'inventoryProductsCount'];
    for (const field of candidates) {
      const value = raw[field];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return Math.floor(value);
      }
    }

    return 0;
  }

  private extractInventoriesFromResponse(value: unknown): InventoryApiModel[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is InventoryApiModel => this.isInventoryLike(item));
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
        const inventories = nested.filter(
          (item): item is InventoryApiModel => this.isInventoryLike(item),
        );
        if (inventories.length > 0) {
          return inventories;
        }
      }
    }

    return [];
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

  private isInventoryLike(value: unknown): value is InventoryApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const inventory = value as Partial<InventoryApiModel>;
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

  private toManagedProductRows(items: InventoryProduct[]): InventoryManagedProductRow[] {
    return items.map((item) => {
      const currentQty =
        typeof item.qtyOnHandInUnits === 'number' && Number.isFinite(item.qtyOnHandInUnits)
          ? item.qtyOnHandInUnits
          : 0;
      const meta = this.buildProductMeta(item.product ?? null);
      const currentQtyDisplay = this.getCurrentQtyDisplay({
        currentQty,
        unitType: meta.unitType,
      });

      return {
        productId: item.productId,
        productName:
          typeof item.product?.name === 'string' && item.product.name.trim() !== ''
            ? item.product.name.trim()
            : `Produit #${item.productId}`,
        qty: currentQty,
        qtyUnit: 'unit',
        qtyUnitOptions: this.getQtyUnitOptions(meta),
        qtyUnitHelpText: this.getQtyUnitHelpText(meta),
        purchaseAccountingMode: 'excluded',
        currentQty,
        currentQtyUnit: 'unit',
        currentNormalizedQty:
          typeof item.qtyOnHandNormalized === 'number' && Number.isFinite(item.qtyOnHandNormalized)
            ? item.qtyOnHandNormalized
            : null,
        currentQtyDisplay,
        ...meta,
      };
    });
  }

  private buildProductMeta(source: InventoryProductMetaSource | null | undefined): InventoryRowProductMeta {
    return {
      unitType:
        typeof source?.unitType === 'string' && source.unitType.trim() !== ''
          ? source.unitType.trim()
          : null,
      quantityPerUnit:
        typeof source?.quantityPerUnit === 'number' && Number.isFinite(source.quantityPerUnit)
          ? source.quantityPerUnit
          : null,
      quantityUnit: this.normalizeQtyUnit(source?.quantityUnit),
      portionCount:
        typeof source?.portionCount === 'number' && Number.isFinite(source.portionCount)
          ? source.portionCount
          : null,
      portionUnit: this.normalizeQtyUnit(source?.portionUnit),
      portionQuantityNormalized:
        typeof source?.portionQuantityNormalized === 'number' &&
        Number.isFinite(source.portionQuantityNormalized)
          ? source.portionQuantityNormalized
          : null,
      price:
        typeof source?.price === 'number' && Number.isFinite(source.price)
          ? source.price
          : null,
    };
  }

  private ensureRowQtyUnit(
    value: ProductQuantityInputUnit | null | undefined,
    meta: InventoryRowProductMeta,
  ): ProductQuantityInputUnit {
    const normalized = this.normalizeQtyUnit(value);
    if (normalized === 'unit') {
      return normalized;
    }

    if (
      normalized &&
      this.getQtyUnitOptions({
        ...meta,
      }).some((option) => option.value === normalized)
    ) {
      return normalized;
    }

    return 'unit';
  }

  private normalizeQtyUnit(value: unknown): ProductQuantityInputUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim().toLowerCase();
    if (candidate === '' || !this.qtyUnitSet.has(candidate as ProductQuantityInputUnit)) {
      return null;
    }

    return candidate as ProductQuantityInputUnit;
  }

  private toTitleCase(value: string): string {
    return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
  }

  private formatDecimal(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }

}
