import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { Inventory, ProductQuantityInputUnit } from '../../interfaces/inventory.interface';
import {
  ShoppingList as ShoppingListModel,
  ShoppingListItem,
  ShoppingListTemplate,
} from '../../interfaces/shopping-list.interface';
import { InventoryService } from '../../services/inventory-service';
import { Product, ProductService } from '../../services/product-service';
import { ShoppingListService } from '../../services/shopping-list-service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UiErrorPanel,
  ],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
})
export class ShoppingList implements OnInit {
  private readonly shoppingListSrv = inject(ShoppingListService);
  private readonly productSrv = inject(ProductService);
  private readonly inventorySrv = inject(InventoryService);

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
  draftListName = '';
  draftItemProductId: number | null = null;
  draftItemQty = 1;
  draftItemQtyUnit: ProductQuantityInputUnit | null = 'unit';
  templateDraftName = '';
  templateCreateListName = '';
  selectedInventoryId: number | null = null;

  private readonly shoppingListsState = signal<ShoppingListModel[]>([]);
  private readonly templatesState = signal<ShoppingListTemplate[]>([]);
  private readonly productsState = signal<Product[]>([]);
  private readonly inventoriesState = signal<Inventory[]>([]);
  private readonly selectedListIdState = signal<number | null>(null);
  private readonly selectedTemplateIdState = signal<number | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly lastErrorState = signal<unknown>(null);

  readonly selectedListState = computed<ShoppingListModel | null>(() => {
    const selectedId = this.selectedListIdState();
    return this.shoppingListsState().find((item) => item.id === selectedId) ?? null;
  });

  readonly selectedTemplateState = computed<ShoppingListTemplate | null>(() => {
    const selectedId = this.selectedTemplateIdState();
    return this.templatesState().find((item) => item.id === selectedId) ?? null;
  });

  ngOnInit(): void {
    this.baseUrl = this.shoppingListSrv.baseUrl;
    this.syncBaseUrls();
    this.loadScreen();
  }

  get shoppingLists(): ShoppingListModel[] {
    return this.shoppingListsState();
  }

  get templates(): ShoppingListTemplate[] {
    return this.templatesState();
  }

  get products(): Product[] {
    return this.productsState();
  }

  get inventories(): Inventory[] {
    return this.inventoriesState();
  }

  get selectedList(): ShoppingListModel | null {
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

  get checkedItemCount(): number {
    return this.countChecked(this.selectedList);
  }

  countChecked(list: ShoppingListModel | null): number {
    return list?.items.filter((item) => item.checked).length ?? 0;
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
    const name = this.draftListName.trim();
    if (!name || this.saving) {
      return;
    }
    this.savingState.set(true);
    this.lastErrorState.set(null);
    this.shoppingListSrv.create({ name }).subscribe({
      next: (created) => {
        this.upsertShoppingList(created, true);
        this.draftListName = '';
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
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
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
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
        this.shoppingListsState.set(this.shoppingLists.filter((item) => item.id !== selectedList.id));
        this.selectedListIdState.set(this.shoppingLists[0]?.id ?? null);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  addItemToSelectedList(): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.draftItemProductId == null || this.draftItemQty <= 0 || this.saving) {
      return;
    }
    this.savingState.set(true);
    this.shoppingListSrv.createItem(selectedList.id, {
      productId: this.draftItemProductId,
      qty: this.draftItemQty,
      qtyUnit: this.draftItemQtyUnit,
    }).subscribe({
      next: (updated) => {
        this.upsertShoppingList(updated);
        this.draftItemProductId = null;
        this.draftItemQty = 1;
        this.draftItemQtyUnit = 'unit';
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  saveItem(item: ShoppingListItem): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.saving) {
      return;
    }
    this.savingState.set(true);
    this.shoppingListSrv.updateItem(selectedList.id, item.id, {
      productId: item.productId,
      qty: item.qty,
      qtyUnit: item.qtyUnit,
      checked: item.checked,
    }).subscribe({
      next: (updated) => {
        this.upsertShoppingList(updated);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
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
        if (updated) {
          this.upsertShoppingList(updated);
        } else {
          this.shoppingListsState.set(this.shoppingLists.filter((item) => item.id !== selectedList.id));
          this.selectedListIdState.set(this.shoppingLists[0]?.id ?? null);
        }
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
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
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  convertChecked(): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.selectedInventoryId == null || this.saving) {
      return;
    }
    this.savingState.set(true);
    this.shoppingListSrv.convertChecked(selectedList.id, { inventoryId: this.selectedInventoryId }).subscribe({
      next: (updated) => {
        if (updated) {
          this.upsertShoppingList(updated);
        } else {
          this.shoppingListsState.set(this.shoppingLists.filter((item) => item.id !== selectedList.id));
          this.selectedListIdState.set(this.shoppingLists[0]?.id ?? null);
        }
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  convertAll(): void {
    const selectedList = this.selectedList;
    if (!selectedList || this.selectedInventoryId == null || this.saving || selectedList.items.length === 0) {
      return;
    }
    this.savingState.set(true);
    this.shoppingListSrv.checkAll(selectedList.id, { checked: true }).subscribe({
      next: (checkedList) => {
        this.upsertShoppingList(checkedList);
        this.shoppingListSrv.convertChecked(selectedList.id, { inventoryId: this.selectedInventoryId! }).subscribe({
          next: (updated) => {
            if (updated) {
              this.upsertShoppingList(updated);
            } else {
              this.shoppingListsState.set(this.shoppingLists.filter((item) => item.id !== selectedList.id));
              this.selectedListIdState.set(this.shoppingLists[0]?.id ?? null);
            }
            this.savingState.set(false);
          },
          error: (error) => {
            this.lastErrorState.set(error);
            this.savingState.set(false);
          },
        });
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
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
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  renameSelectedTemplate(): void {
    const selectedTemplate = this.selectedTemplate;
    if (!selectedTemplate || this.saving) {
      return;
    }
    this.savingState.set(true);
    this.shoppingListSrv.updateTemplate(selectedTemplate.id, { name: selectedTemplate.name }).subscribe({
      next: (updated) => {
        this.upsertTemplate(updated);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
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
        this.templatesState.set(this.templates.filter((item) => item.id !== selectedTemplate.id));
        this.selectedTemplateIdState.set(this.templates[0]?.id ?? null);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  createListFromTemplate(): void {
    const selectedTemplate = this.selectedTemplate;
    if (!selectedTemplate || this.saving) {
      return;
    }
    this.savingState.set(true);
    this.shoppingListSrv.createFromTemplate(selectedTemplate.id, {
      name: this.templateCreateListName.trim() || undefined,
    }).subscribe({
      next: (created) => {
        this.upsertShoppingList(created, true);
        this.savingState.set(false);
      },
      error: (error) => {
        this.lastErrorState.set(error);
        this.savingState.set(false);
      },
    });
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  trackByProductId(_: number, item: { productId: number }): number {
    return item.productId;
  }

  resolveProductName(item: { product?: { name?: string | null } | null; productId: number }): string {
    return item.product?.name?.trim() || `Produit #${item.productId}`;
  }

  public loadScreen(): void {
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
        this.templateDraftName = shoppingLists[0] ? `${shoppingLists[0].name} modele` : '';
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

  private upsertShoppingList(shoppingList: ShoppingListModel, select = false): void {
    const next = [...this.shoppingLists];
    const index = next.findIndex((item) => item.id === shoppingList.id);
    if (index >= 0) {
      next[index] = shoppingList;
    } else {
      next.unshift(shoppingList);
    }
    this.shoppingListsState.set(next);
    if (select || this.selectedListIdState() === shoppingList.id) {
      this.selectedListIdState.set(shoppingList.id);
      this.templateDraftName = `${shoppingList.name} modele`;
    }
  }

  private upsertTemplate(template: ShoppingListTemplate, select = false): void {
    const next = [...this.templates];
    const index = next.findIndex((item) => item.id === template.id);
    if (index >= 0) {
      next[index] = template;
    } else {
      next.unshift(template);
    }
    this.templatesState.set(next);
    if (select || this.selectedTemplateIdState() === template.id) {
      this.selectedTemplateIdState.set(template.id);
      this.templateCreateListName = template.name;
    }
  }
}
