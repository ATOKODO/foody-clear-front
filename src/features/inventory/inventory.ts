import { UiEmptyState } from '../../app/ui/empty-state/empty-state';
import { UiSelectableCard } from '../../app/ui/selectable-card/selectable-card';
import { UiWorkspaceCard } from '../../app/ui/workspace-card/workspace-card';
import { UiTableScroll } from '../../app/ui/table-scroll/table-scroll';
import { UiTableCell } from '../../app/ui/table-cell/table-cell';
import { UiTable } from '../../app/ui/table/table';
import { UiSummaryPill } from '../../app/ui/summary-pill/summary-pill';
import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { Language } from '../../app/i18n/language';
import { UiModal } from '../../app/ui/modal/modal';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { LatestRequest } from '../../utils/latest-request';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  InventoryForm,
  InventoryFormMode,
  InventoryFormValue,
} from '../../components/inventory/inventory-form/inventory-form';
import type { InventoryListItem } from '../../components/inventory/inventory-list/inventory-list';
import { MasterDetailLayout } from '../../components/shared/master-detail-layout/master-detail-layout';
import {
  ProductList,
  ProductListItem,
} from '../../components/product/product-list/product-list';
import type {
  Inventory as InventoryApiModel,
  InventoryProduct,
  UpdateInventoryDto,
} from '../../interfaces/inventory.interface';
import { InventoryService } from '../../services/inventory-service';
import {
  Product as ProductApiModel,
  ProductService,
} from '../../services/product-service';
import {
  INVENTORY_PURCHASE_ACCOUNTING_MODE_OPTIONS,
  InventoryManagedProductRow,
  InventoryRowProductMeta,
  InventorySelectedProductRow,
  buildInventoryListItems,
  buildProductListItems,
  extractInventoriesFromResponse,
  extractInventoryProductsFromResponse,
  extractProductsFromResponse,
  filterInventorySelectionRows,
  getInventoryQtyUnitHelpText,
  removeInventoryProductRow,
  syncInventorySelectedProductRows,
  toCreateInventoryDto,
  toInventoryFormValue,
  toInventoryProductQtyPayload,
  toManagedInventoryProductRows,
  validateManagedInventoryProductRows,
  validatePositiveInventoryQtyRows,
} from './inventory.viewmodel';

@Component({
  selector: 'app-inventory',
  imports: [UiSummaryPill, UiEmptyState, UiSelectableCard, UiWorkspaceCard, UiTableScroll, UiTableCell, UiTable, UiStatusBadge, UiButton, TranslatePipe, UiModal,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UiErrorPanel,
    InventoryForm,
    ProductList,
    MasterDetailLayout,
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
  host: {
  },
})
export class Inventory implements OnInit {
  readonly language = inject(Language);
  private readonly inventorySrv = inject(InventoryService);
  private readonly productSrv = inject(ProductService);
  private readonly editorProductsRequest = new LatestRequest(inject(DestroyRef));
  private readonly selectedProductsRequest = new LatestRequest(inject(DestroyRef));

  baseUrl = '';
  formatQtyUnitHelpText(row: InventoryRowProductMeta): string | null {
    return getInventoryQtyUnitHelpText(row, this.language.locale(), (source) => this.language.translate(source));
  }
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly loadingInventoryProductsState = signal(false);
  private readonly loadingProductsState = signal(false);

  private readonly inventoriesState = signal<InventoryApiModel[]>([]);
  private readonly productsState = signal<ProductApiModel[]>([]);
  private readonly inventoryListItemsState = computed<InventoryListItem[]>(() =>
    buildInventoryListItems(this.inventoriesState()),
  );
  private readonly productListItemsState = computed<ProductListItem[]>(() =>
    buildProductListItems(this.productsState()),
  );

  private readonly formVisibleState = signal(false);
  private readonly formModeState = signal<InventoryFormMode>('add');
  private readonly activeModalState = signal<'add-products' | null>(null);
  private readonly formInitialValueState = signal<Partial<InventoryFormValue> | null>(null);
  private readonly manageProductRowsState = signal<InventoryManagedProductRow[]>([]);
  private readonly selectedInventoryIdState = signal<number | null>(null);
  private readonly selectedInventoryProductsState = signal<InventoryProduct[]>([]);
  private readonly loadingSelectedInventoryProductsState = signal(false);

  editingInventoryId: number | null = null;
  editingInventoryProducts: InventoryProduct[] = [];
  createSelectedProductRows: InventorySelectedProductRow[] = [];
  addSelectedProductRows: InventorySelectedProductRow[] = [];

  lastResponse: unknown = null;
  lastError: unknown = null;
  createProductsFormError: string | null = null;
  addProductsFormError: string | null = null;
  manageProductsFormError: string | null = null;

  readonly purchaseAccountingModeOptions = INVENTORY_PURCHASE_ACCOUNTING_MODE_OPTIONS;

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

  get selectedInventoryId(): number | null {
    return this.selectedInventoryIdState();
  }

  set selectedInventoryId(value: number | null) {
    this.selectedInventoryIdState.set(value);
  }

  get selectedInventoryProducts(): InventoryProduct[] {
    return this.selectedInventoryProductsState();
  }

  set selectedInventoryProducts(value: InventoryProduct[]) {
    this.selectedInventoryProductsState.set(value);
  }

  get loadingSelectedInventoryProducts(): boolean {
    return this.loadingSelectedInventoryProductsState();
  }

  set loadingSelectedInventoryProducts(value: boolean) {
    this.loadingSelectedInventoryProductsState.set(value);
  }

  get selectedInventory(): InventoryListItem | null {
    const inventoryId = this.selectedInventoryId;
    if (inventoryId === null) {
      return null;
    }

    return this.inventoryListItems.find((item) => Number(item.id) === inventoryId) ?? null;
  }

  get selectedInventoryRecord(): InventoryApiModel | null {
    const inventoryId = this.selectedInventoryId;
    if (inventoryId === null) {
      return null;
    }

    return this.inventories.find((inventory) => inventory.id === inventoryId) ?? null;
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
      validatePositiveInventoryQtyRows(this.addSelectedProductRows) === null
    );
  }

  get canSaveManagedProducts(): boolean {
    return (
      this.formMode === 'edit' &&
      this.editingInventoryId !== null &&
      !this.saving &&
      !this.loadingInventoryProducts &&
      validateManagedInventoryProductRows(this.manageProductRows) === null &&
      (this.manageProductRows.length > 0 || this.editingInventoryProducts.length > 0)
    );
  }

  onRefreshRequested(): void {
    this.loadProducts();
    this.loadInventories();

    if (this.editingInventoryId !== null) {
      this.loadInventoryProducts(this.editingInventoryId);
    }

    if (this.selectedInventoryId !== null) {
      this.loadSelectedInventoryProducts(this.selectedInventoryId);
    }
  }

  onAddRequested(): void {
    if (this.saving) return;
    this.editorProductsRequest.cancel();
    this.loadingInventoryProducts = false;
    this.formMode = 'add';
    this.editingInventoryId = null;
    this.activeModal = null;
    this.formInitialValue = null;
    this.editingInventoryProducts = [];
    this.clearProductSelections();
    this.formVisible = true;
  }

  onEditRequested(item: InventoryListItem): void {
    if (this.saving) return;
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
    this.editingInventoryProducts = [];
    this.activeModal = null;
    this.formInitialValue = toInventoryFormValue(inventory);
    this.clearProductSelections();
    this.formVisible = true;
    this.loadInventoryProducts(inventory.id);
  }

  selectInventory(itemId: string | number): void {
    const inventoryId = Number(itemId);
    if (!Number.isInteger(inventoryId) || inventoryId < 1) {
      return;
    }

    this.selectedInventoryId = inventoryId;
    this.selectedInventoryProducts =
      this.inventories.find((inventory) => inventory.id === inventoryId)?.inventoryProducts ?? [];
    this.loadSelectedInventoryProducts(inventoryId);
  }

  openSelectedInventoryEditor(): void {
    if (!this.selectedInventory) {
      return;
    }

    this.onEditRequested(this.selectedInventory);
  }

  deleteSelectedInventory(): void {
    if (!this.selectedInventory) {
      return;
    }

    this.onDeleteRequested(this.selectedInventory);
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
    if (this.saving) return;
    if (event.mode === 'edit' && this.editingInventoryId !== null) {
      this.updateInventoryName(this.editingInventoryId, event.value);
      return;
    }

    const validationError = validatePositiveInventoryQtyRows(
      this.createSelectedProductRows,
    );
    if (validationError) {
      this.createProductsFormError = validationError;
      return;
    }

    this.saving = true;
    this.inventorySrv
      .create(toCreateInventoryDto(event.value, this.createSelectedProductRows))
      .subscribe({
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
    this.createSelectedProductRows = syncInventorySelectedProductRows(
      items,
      this.createSelectedProductRows,
    );
    this.createProductsFormError = null;
  }

  onProductsToAddSelected(items: ProductListItem[]): void {
    this.addSelectedProductRows = syncInventorySelectedProductRows(
      items,
      this.addSelectedProductRows,
    );
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
    if (this.activeModal) {
      this.closeActiveModal();
      return;
    }

    if (this.formVisible) {
      this.closeFormModal();
    }
  }

  onAddSelectedProducts(): void {
    if (this.saving || this.loadingInventoryProducts) return;
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null || this.addSelectedProductRows.length === 0) {
      return;
    }

    const validationError = validatePositiveInventoryQtyRows(
      this.addSelectedProductRows,
    );
    if (validationError) {
      this.addProductsFormError = validationError;
      return;
    }

    this.saving = true;
    this.inventorySrv
      .addProducts(inventoryId, {
        products: toInventoryProductQtyPayload(this.addSelectedProductRows, true),
      })
      .subscribe({
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
    if (this.saving || this.loadingInventoryProducts) return;
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null) {
      return;
    }

    const validationError = validateManagedInventoryProductRows(this.manageProductRows);
    if (validationError) {
      this.manageProductsFormError = validationError;
      return;
    }

    this.saving = true;
    this.inventorySrv
      .reconcileProducts(inventoryId, {
        products: toInventoryProductQtyPayload(this.manageProductRows),
      })
      .subscribe({
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
    if (this.saving || this.loadingInventoryProducts) return;
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null) {
      return;
    }

    this.saving = true;
    this.inventorySrv.reconcileProducts(inventoryId, { products: [] }).subscribe({
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
    if (this.saving) return;
    this.editorProductsRequest.cancel();
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

  removeCreateSelectedProduct(productId: number): void {
    this.createSelectedProductRows = removeInventoryProductRow(
      this.createSelectedProductRows,
      productId,
    );
    this.createProductsFormError = null;
  }

  removeAddSelectedProduct(productId: number): void {
    this.addSelectedProductRows = removeInventoryProductRow(
      this.addSelectedProductRows,
      productId,
    );
    this.addProductsFormError = null;
  }

  removeManagedProduct(productId: number): void {
    this.manageProductRows = removeInventoryProductRow(
      this.manageProductRows,
      productId,
    );
    this.manageProductsFormError = null;
  }

  trackBySelectedProductRow(_: number, row: InventorySelectedProductRow): number {
    return row.productId;
  }

  private updateInventoryName(
    inventoryId: number,
    value: InventoryFormValue,
  ): void {
    this.saving = true;
    const payload: UpdateInventoryDto = {
      name: value.name.trim(),
    };

    this.inventorySrv.update(inventoryId, payload).subscribe({
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
  }

  private loadInventories(): void {
    this.loading = true;
    this.inventorySrv.findAll().subscribe({
      next: (response) => {
        this.inventories = extractInventoriesFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;
        this.refreshEditingInventoryState();
        this.syncSelectedInventoryState();
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
        this.products = extractProductsFromResponse(response);
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
    if (this.editingInventoryId !== inventoryId) return;
    this.loadingInventoryProducts = true;
    this.editorProductsRequest.subscribe(this.inventorySrv.findProducts(inventoryId), {
      next: (response) => {
        this.editingInventoryProducts = extractInventoryProductsFromResponse(response);
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

  private loadSelectedInventoryProducts(inventoryId: number): void {
    this.loadingSelectedInventoryProducts = true;
    this.selectedProductsRequest.subscribe(this.inventorySrv.findProducts(inventoryId), {
      next: (response) => {
        if (this.selectedInventoryId !== inventoryId) {
          return;
        }

        this.selectedInventoryProducts = extractInventoryProductsFromResponse(response);
        this.lastError = null;
        this.loadingSelectedInventoryProducts = false;
      },
      error: (error) => {
        if (this.selectedInventoryId !== inventoryId) {
          return;
        }

        this.selectedInventoryProducts = [];
        this.lastError = error;
        this.loadingSelectedInventoryProducts = false;
      },
    });
  }

  private refreshEditingInventoryState(): void {
    if (this.editingInventoryId === null) {
      return;
    }

    const currentInventory =
      this.inventories.find((inventory) => inventory.id === this.editingInventoryId) ?? null;

    if (!currentInventory) {
      this.onCancelForm();
      return;
    }

    this.formInitialValue = toInventoryFormValue(currentInventory);
  }

  private syncSelectedInventoryState(): void {
    if (this.inventoryListItems.length === 0) {
      this.selectedInventoryId = null;
      this.selectedInventoryProducts = [];
      this.loadingSelectedInventoryProducts = false;
      return;
    }

    const inventoryId = this.selectedInventoryId;
    const hasCurrent =
      inventoryId !== null && this.inventoryListItems.some((item) => Number(item.id) === inventoryId);
    let nextInventoryId = Number(this.inventoryListItems[0].id);
    if (hasCurrent && inventoryId !== null) {
      nextInventoryId = inventoryId;
    }

    this.selectedInventoryId = nextInventoryId;
    this.selectedInventoryProducts =
      this.inventories.find((inventory) => inventory.id === nextInventoryId)?.inventoryProducts ?? [];
    this.loadSelectedInventoryProducts(nextInventoryId);
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
    this.manageProductRows = toManagedInventoryProductRows(
      this.editingInventoryProducts,
    );
    this.manageProductsFormError = null;
  }

  private syncSelectionsToAvailableProducts(): void {
    this.createSelectedProductRows = filterInventorySelectionRows(
      this.createSelectedProductRows,
      this.productListItems,
    );
    this.addSelectedProductRows = filterInventorySelectionRows(
      this.addSelectedProductRows,
      this.productListItems,
    );
  }
}
