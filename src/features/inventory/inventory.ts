import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  InventoryForm,
  InventoryFormMode,
  InventoryFormProductsPayload,
  InventoryFormValue,
} from '../../components/inventory/inventory-form/inventory-form';
import {
  InventoryList,
  InventoryListItem,
} from '../../components/inventory/inventory-list/inventory-list';
import {
  CreateInventoryDto,
  Inventory as InventoryApiModel,
  InventoryProduct,
  UpdateInventoryDto,
  UpdateInventoryProductsDto,
} from '../../interfaces/inventory.interface';
import { InventoryService } from '../../services/inventory-service';

@Component({
  selector: 'app-inventory',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    InventoryList,
    InventoryForm,
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  baseUrl = '';
  loading = false;
  saving = false;
  loadingInventoryProducts = false;

  inventories: InventoryApiModel[] = [];

  formVisible = false;
  formMode: InventoryFormMode = 'add';
  editingInventoryId: number | null = null;
  formInitialValue: Partial<InventoryFormValue> | null = null;
  editingInventoryProducts: InventoryProduct[] = [];

  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(private readonly inventorySrv: InventoryService) {}

  ngOnInit(): void {
    this.baseUrl = this.inventorySrv.baseUrl;
    this.loadInventories();
  }

  onBaseUrlChange(): void {
    this.inventorySrv.setBaseUrl(this.baseUrl);
    this.loadInventories();
  }

  get inventoryListItems(): InventoryListItem[] {
    return this.inventories.map((inventory) => ({
      id: String(inventory.id),
      name: inventory.name,
      productCount: this.resolveProductCount(inventory),
    }));
  }

  onRefreshRequested(): void {
    this.loadInventories();

    if (this.editingInventoryId !== null) {
      this.loadInventoryProducts(this.editingInventoryId);
    }
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingInventoryId = null;
    this.formInitialValue = null;
    this.editingInventoryProducts = [];
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
    this.formInitialValue = this.toFormValue(inventory);
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
    this.saving = true;

    if (event.mode === 'edit' && this.editingInventoryId !== null) {
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

    const payload = this.toCreateDto(event.value);
    this.inventorySrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.loadInventories();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onProductsAddRequested(value: InventoryFormProductsPayload): void {
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null) {
      return;
    }

    this.saving = true;
    const payload = this.toProductsPayload(value);
    this.inventorySrv.addProducts(inventoryId, payload).subscribe({
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

  onProductsRemoveRequested(value: InventoryFormProductsPayload): void {
    const inventoryId = this.editingInventoryId;
    if (inventoryId == null) {
      return;
    }

    this.saving = true;
    const payload = this.toProductsPayload(value);
    this.inventorySrv.removeProducts(inventoryId, payload).subscribe({
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

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.editingInventoryId = null;
    this.formInitialValue = null;
    this.editingInventoryProducts = [];
    this.loadingInventoryProducts = false;
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
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private loadInventoryProducts(inventoryId: number): void {
    this.loadingInventoryProducts = true;
    this.inventorySrv.findProducts(inventoryId).subscribe({
      next: (response) => {
        this.editingInventoryProducts = this.extractInventoryProductsFromResponse(response);
        this.lastError = null;
        this.loadingInventoryProducts = false;
      },
      error: (error) => {
        this.editingInventoryProducts = [];
        this.lastError = error;
        this.loadingInventoryProducts = false;
      },
    });
  }

  private toCreateDto(value: InventoryFormValue): CreateInventoryDto {
    const payload: CreateInventoryDto = {
      name: value.name.trim(),
    };

    if (value.productIds.length > 0) {
      payload.productIds = value.productIds;
    }

    if (value.products.length > 0) {
      payload.products = value.products;
    }

    return payload;
  }

  private toProductsPayload(value: InventoryFormProductsPayload): UpdateInventoryProductsDto {
    const payload: UpdateInventoryProductsDto = {};

    if (value.productIds.length > 0) {
      payload.productIds = value.productIds;
    }

    if (value.products.length > 0) {
      payload.products = value.products;
    }

    return payload;
  }

  private toFormValue(inventory: InventoryApiModel): InventoryFormValue {
    const inventoryProducts = Array.isArray(inventory.inventoryProducts)
      ? inventory.inventoryProducts
      : [];

    const productIds = Array.from(
      new Set(
        inventoryProducts
          .map((item) => item.productId)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    const products = inventoryProducts
      .filter((item) => Number.isInteger(item.productId) && item.productId > 0)
      .map((item) => ({
        productId: item.productId,
        qty: Number.isFinite(item.qtyOnHandInUnits) ? item.qtyOnHandInUnits : 0,
      }))
      .filter((item) => item.qty > 0);

    return {
      name: inventory.name,
      productIds,
      products,
    };
  }

  private resolveProductCount(inventory: InventoryApiModel): number {
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
}
