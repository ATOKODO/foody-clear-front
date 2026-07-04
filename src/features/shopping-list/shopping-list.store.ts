import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import type { ProductListItem } from '../../components/product/product-list/product-list';
import type { Inventory, ProductQuantityInputUnit } from '../../interfaces/inventory.interface';
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListTemplate,
  ShoppingListTemplateItem,
} from '../../interfaces/shopping-list.interface';
import { InventoryService } from '../../services/inventory-service';
import { Product, ProductService } from '../../services/product-service';
import { ShoppingListService } from '../../services/shopping-list-service';
import {
  SHOPPING_LIST_VIEW_OPTIONS,
  ShoppingListView,
  buildDefaultListName,
  buildQtyUnitOptions,
  countCheckedItems,
  normalizeQtyUnitSelection,
  removeById,
  resolveDraftProductName,
  resolveLinkedProduct,
  resolveProductName,
  toProductListItems,
  upsertShoppingList,
  upsertShoppingListTemplate,
} from './shopping-list.viewmodel';
import type { QtyUnitOption } from './shopping-list.viewmodel';

@Injectable()
export class ShoppingListStore {
  private readonly shoppingListSrv = inject(ShoppingListService);
  private readonly productSrv = inject(ProductService);
  private readonly inventorySrv = inject(InventoryService);

  readonly viewOptions = SHOPPING_LIST_VIEW_OPTIONS;

  baseUrl = '';
  draftListName = '';
  draftItemProductId: number | null = null;
  draftItemQty = 1;
  draftItemQtyUnit: ProductQuantityInputUnit | null = 'unit';
  templateDraftName = '';
  templateCreateListName = '';
  selectedInventoryId: number | null = null;
  activeView: ShoppingListView = 'list';
  listEditorMode: 'create' | 'edit' = 'create';


  private readonly shoppingListsState = signal<ShoppingList[]>([]);
  private readonly templatesState = signal<ShoppingListTemplate[]>([]);
  private readonly productsState = signal<Product[]>([]);
  private readonly inventoriesState = signal<Inventory[]>([]);
  private readonly selectedListIdState = signal<number | null>(null);
  private readonly selectedTemplateIdState = signal<number | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly lastErrorState = signal<unknown>(null);
  private readonly productPickerOpenState = signal(false);
  private readonly listEditorOpenState = signal(false);
  private readonly templateEditorOpenState = signal(false);

  private readonly selectedListState = computed<ShoppingList | null>(() => {
    const selectedId = this.selectedListIdState();
    return this.shoppingLists.find((item) => item.id === selectedId) ?? null;
  });
  private readonly selectedTemplateState = computed<ShoppingListTemplate | null>(
    () => {
      const selectedId = this.selectedTemplateIdState();
      return this.templates.find((item) => item.id === selectedId) ?? null;
    },
  );
  private readonly productListItemsState = computed<ProductListItem[]>(() =>
    toProductListItems(this.products),
  );

  init(): void {
    this.baseUrl = this.shoppingListSrv.baseUrl;
    this.syncBaseUrls();
    this.loadScreen();
  }

  get shoppingLists(): ShoppingList[] {
    return this.shoppingListsState();
  }

  get templates(): ShoppingListTemplate[] {
    return this.templatesState();
  }

  get products(): Product[] {
    return this.productsState();
  }

  get productListItems(): ProductListItem[] {
    return this.productListItemsState();
  }

  get inventories(): Inventory[] {
    return this.inventoriesState();
  }

  get selectedList(): ShoppingList | null {
    return this.selectedListState();
  }

  get selectedTemplate(): ShoppingListTemplate | null {
    return this.selectedTemplateState();
  }

  get loading(): boolean {
    return this.loadingState();
  }

  get saving(): boolean {
    return this.savingState();
  }

  get lastError(): unknown {
    return this.lastErrorState();
  }

  get isProductPickerOpen(): boolean {
    return this.productPickerOpenState();
  }

  get isListEditorOpen(): boolean {
    return this.listEditorOpenState();
  }

  get isTemplateEditorOpen(): boolean {
    return this.templateEditorOpenState();
  }

  get productPickerSelectedIds(): string[] {
    return this.draftItemProductId == null
      ? []
      : [String(this.draftItemProductId)];
  }

  get checkedItemCount(): number {
    return this.countChecked(this.selectedList);
  }

  countChecked(list: ShoppingList | null): number {
    return countCheckedItems(list);
  }

  onActiveViewChange(view: ShoppingListView): void {
    this.activeView = view;
  }

  openCreateListEditor(): void {
    if (this.loading || this.saving) {
      return;
    }

    this.listEditorMode = 'create';
    this.draftListName = buildDefaultListName(this.shoppingLists.length);
    this.resetDraftItem();
    this.listEditorOpenState.set(true);
  }

  openSelectedListEditor(id = this.selectedList?.id ?? null): void {
    if (id == null || this.loading || this.saving) {
      return;
    }

    this.selectList(id);
    this.listEditorMode = 'edit';
    this.resetDraftItem();
    this.listEditorOpenState.set(true);
  }

  closeListEditor(): void {
    if (!this.saving) {
      this.listEditorOpenState.set(false);
    }
  }

  openSelectedTemplateEditor(id = this.selectedTemplate?.id ?? null): void {
    if (id == null || this.loading || this.saving) {
      return;
    }

    this.selectTemplate(id);
    this.templateEditorOpenState.set(true);
  }

  closeTemplateEditor(): void {
    if (!this.saving) {
      this.templateEditorOpenState.set(false);
    }
  }

  saveListEditor(): void {
    if (this.listEditorMode === 'create') {
      this.createList();
      return;
    }

    this.renameSelectedList();
  }

  saveTemplateEditor(): void {
    this.renameSelectedTemplate();
  }

  openProductPicker(): void {
    if (this.loading || this.saving) {
      return;
    }

    this.productPickerOpenState.set(true);
  }

  closeProductPicker(): void {
    this.productPickerOpenState.set(false);
  }

  onProductPicked(product: ProductListItem): void {
    const productId = Number(product.id);
    if (!Number.isInteger(productId)) {
      return;
    }

    this.onDraftProductChange(productId);
    this.closeProductPicker();
  }

  onEscapeKey(): void {
    if (this.isProductPickerOpen) {
      this.closeProductPicker();
      return;
    }

    this.closeListEditor();
    this.closeTemplateEditor();
  }

  resolveDraftProductName(): string {
    return resolveDraftProductName(this.products, this.draftItemProductId);
  }

  selectList(id: number): void {
    this.selectedListIdState.set(id);
    const list = this.shoppingLists.find((entry) => entry.id === id) ?? null;
    this.templateDraftName = list ? `${list.name} modele` : '';
  }

  selectTemplate(id: number): void {
    this.selectedTemplateIdState.set(id);
    const template = this.templates.find((entry) => entry.id === id) ?? null;
    this.templateCreateListName = template?.name ?? '';
  }

  createList(): void {
    if (this.saving) {
      return;
    }

    const name =
      this.draftListName.trim() || buildDefaultListName(this.shoppingLists.length);
    this.savingState.set(true);
    this.lastErrorState.set(null);

    this.shoppingListSrv.create({ name }).subscribe({
      next: (created) => {
        this.upsertShoppingList(created, true);
        this.draftListName = '';
        this.listEditorOpenState.set(false);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  renameSelectedList(): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv.update(selectedList.id, { name: selectedList.name }).subscribe({
      next: (updated) => {
        this.upsertShoppingList(updated);
        this.listEditorOpenState.set(false);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  deleteSelectedList(): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv.remove(selectedList.id).subscribe({
      next: () => {
        this.removeShoppingList(selectedList.id);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  addItemToSelectedList(): void {
    const selectedList = this.selectedList;
    if (
      !selectedList ||
      this.draftItemProductId == null ||
      this.draftItemQty <= 0 ||
      this.saving
    ) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv
      .createItem(selectedList.id, {
        productId: this.draftItemProductId,
        qty: this.draftItemQty,
        qtyUnit: this.draftItemQtyUnit,
      })
      .subscribe({
        next: (updated) => {
          this.upsertShoppingList(updated);
          this.resetDraftItem();
          this.savingState.set(false);
        },
        error: (error) => this.finishWithError(error),
      });
  }

  saveItem(item: ShoppingListItem): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv
      .updateItem(selectedList.id, item.id, {
        productId: item.productId,
        qty: item.qty,
        qtyUnit: item.qtyUnit,
        checked: item.checked,
      })
      .subscribe({
        next: (updated) => {
          this.upsertShoppingList(updated);
          this.savingState.set(false);
        },
        error: (error) => this.finishWithError(error),
      });
  }

  toggleItem(item: ShoppingListItem, checked: boolean): void {
    item.checked = checked;
    this.saveItem(item);
  }

  removeItem(itemId: number): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv.removeItem(selectedList.id, itemId).subscribe({
      next: (updated) => {
        this.applyNullableShoppingListUpdate(selectedList.id, updated);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  setAllChecked(checked: boolean): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv.checkAll(selectedList.id, { checked }).subscribe({
      next: (updated) => {
        this.upsertShoppingList(updated);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  convertChecked(): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.selectedInventoryId == null || this.saving) {
      return;
    }

    this.convertCheckedList(selectedList.id, this.selectedInventoryId);
  }

  convertAll(): void {
    const selectedList = this.selectedList;
    if (
      !selectedList ||
      this.selectedInventoryId == null ||
      this.saving ||
      selectedList.items.length === 0
    ) {
      return;
    }

    const inventoryId = this.selectedInventoryId;
    this.savingState.set(true);
    this.shoppingListSrv.checkAll(selectedList.id, { checked: true }).subscribe({
      next: (checkedList) => {
        this.upsertShoppingList(checkedList);
        this.shoppingListSrv
          .convertChecked(selectedList.id, { inventoryId })
          .subscribe({
            next: (updated) => {
              this.applyNullableShoppingListUpdate(selectedList.id, updated);
              this.savingState.set(false);
            },
            error: (error) => this.finishWithError(error),
          });
      },
      error: (error) => this.finishWithError(error),
    });
  }

  saveAsTemplate(): void {
    const selectedList = this.selectedList;
    const name = this.templateDraftName.trim() || `${selectedList?.name ?? ''} modele`;
    if (!selectedList || !name || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv.saveTemplate(selectedList.id, { name }).subscribe({
      next: (template) => {
        this.upsertTemplate(template, true);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  renameSelectedTemplate(): void {
    const selectedTemplate = this.selectedTemplate;
    if (!selectedTemplate || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv
      .updateTemplate(selectedTemplate.id, { name: selectedTemplate.name })
      .subscribe({
        next: (updated) => {
          this.upsertTemplate(updated);
          this.templateEditorOpenState.set(false);
          this.savingState.set(false);
        },
        error: (error) => this.finishWithError(error),
      });
  }

  deleteSelectedTemplate(): void {
    const selectedTemplate = this.selectedTemplate;
    if (!selectedTemplate || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv.removeTemplate(selectedTemplate.id).subscribe({
      next: () => {
        this.removeTemplate(selectedTemplate.id);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  createListFromTemplate(): void {
    const selectedTemplate = this.selectedTemplate;
    if (!selectedTemplate || this.saving) {
      return;
    }

    this.savingState.set(true);
    this.shoppingListSrv
      .createFromTemplate(selectedTemplate.id, {
        name: this.templateCreateListName.trim() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.upsertShoppingList(created, true);
          this.savingState.set(false);
        },
        error: (error) => this.finishWithError(error),
      });
  }

  getDraftQtyUnitOptions(): QtyUnitOption[] {
    const product =
      this.products.find((item) => item.id === this.draftItemProductId) ?? null;
    return buildQtyUnitOptions(product);
  }

  getItemQtyUnitOptions(item: ShoppingListItem): QtyUnitOption[] {
    const product = resolveLinkedProduct(
      this.products,
      item.productId,
      item.product ?? null,
    );
    return buildQtyUnitOptions(product);
  }

  onDraftProductChange(productId: number | null): void {
    this.draftItemProductId = productId;
    this.draftItemQtyUnit = normalizeQtyUnitSelection(
      this.draftItemQtyUnit,
      this.getDraftQtyUnitOptions(),
    );
  }

  resolveProductName(item: ShoppingListItem | ShoppingListTemplateItem): string {
    return resolveProductName(item);
  }

  loadScreen(): void {
    this.loadingState.set(true);
    this.lastErrorState.set(null);

    forkJoin({
      shoppingLists: this.shoppingListSrv.findAll(),
      templates: this.shoppingListSrv.findAllTemplates(),
      products: this.productSrv.findAll(),
      inventories: this.inventorySrv.findAll(),
    }).subscribe({
      next: ({ shoppingLists, templates, products, inventories }) => {
        this.shoppingListsState.set(shoppingLists);
        this.templatesState.set(templates);
        this.productsState.set(products);
        this.inventoriesState.set(inventories);
        this.selectedListIdState.set(shoppingLists[0]?.id ?? null);
        this.selectedTemplateIdState.set(templates[0]?.id ?? null);
        this.templateDraftName = shoppingLists[0]
          ? `${shoppingLists[0].name} modele`
          : '';
        this.templateCreateListName = templates[0]?.name ?? '';
        this.selectedInventoryId = inventories[0]?.id ?? null;
        this.loadingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.loadingState.set(false);
      },
    });
  }

  private syncBaseUrls(): void {
    this.shoppingListSrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.inventorySrv.setBaseUrl(this.baseUrl);
  }

  private resetDraftItem(): void {
    this.draftItemProductId = null;
    this.draftItemQty = 1;
    this.draftItemQtyUnit = 'unit';
  }

  private convertCheckedList(listId: number, inventoryId: number): void {
    this.savingState.set(true);
    this.shoppingListSrv.convertChecked(listId, { inventoryId }).subscribe({
      next: (updated) => {
        this.applyNullableShoppingListUpdate(listId, updated);
        this.savingState.set(false);
      },
      error: (error) => this.finishWithError(error),
    });
  }

  private applyNullableShoppingListUpdate(
    listId: number,
    shoppingList: ShoppingList | null,
  ): void {
    if (shoppingList) {
      this.upsertShoppingList(shoppingList);
      return;
    }

    this.removeShoppingList(listId);
  }

  private removeShoppingList(listId: number): void {
    const next = removeById(this.shoppingLists, listId);
    this.shoppingListsState.set(next);
    this.selectedListIdState.set(next[0]?.id ?? null);
  }

  private removeTemplate(templateId: number): void {
    const next = removeById(this.templates, templateId);
    this.templatesState.set(next);
    this.selectedTemplateIdState.set(next[0]?.id ?? null);
  }

  private upsertShoppingList(shoppingList: ShoppingList, select = false): void {
    this.shoppingListsState.set(upsertShoppingList(this.shoppingLists, shoppingList));
    if (select || this.selectedListIdState() === shoppingList.id) {
      this.selectedListIdState.set(shoppingList.id);
      this.templateDraftName = `${shoppingList.name} modele`;
    }
  }

  private upsertTemplate(template: ShoppingListTemplate, select = false): void {
    this.templatesState.set(upsertShoppingListTemplate(this.templates, template));
    if (select || this.selectedTemplateIdState() === template.id) {
      this.selectedTemplateIdState.set(template.id);
      this.templateCreateListName = template.name;
    }
  }

  private finishWithError(error: unknown): void {
    this.lastErrorState.set(error);
    this.savingState.set(false);
  }
}
