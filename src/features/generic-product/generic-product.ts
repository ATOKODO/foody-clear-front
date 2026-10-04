import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { UiModal } from '../../app/ui/modal/modal';

import { Component, OnChanges, OnInit, SimpleChanges, input, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  GenericProductForm,
  GenericProductFormMode,
  GenericProductFormValue,
} from '../../components/generic-product/generic-product-form/generic-product-form';
import {
  GenericProductList,
  GenericProductListItem,
} from '../../components/generic-product/generic-product-list/generic-product-list';
import {
  CreateGenericProductDto,
  GenericProduct as GenericProductApiModel,
  GenericProductService,
  UpdateGenericProductDto,
} from '../../services/generic-product-service';
import type { PortionUnit, QuantityUnit } from '../../services/product-service';

@Component({
  selector: 'app-generic-product',
  imports: [UiStatusBadge, UiButton, TranslatePipe, UiModal,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    UiErrorPanel,
    GenericProductList,
    GenericProductForm
  ],
  templateUrl: './generic-product.html',
})
export class GenericProduct implements OnInit, OnChanges {
  private readonly gpSrv = inject(GenericProductService);

  readonly embedded = input(false);
  readonly openCreateRequestId = input(0);
  readonly dataChanged = output<void>();

  baseUrl = '';
  readonly loading = signal(false);
  readonly saving = signal(false);

  genericProducts: GenericProductApiModel[] = [];

  formVisible = false;
  formMode: GenericProductFormMode = 'add';
  editingGenericProductId: number | null = null;
  formInitialValue: Partial<GenericProductFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;

  ngOnInit(): void {
    this.baseUrl = this.gpSrv.baseUrl;
    this.loadGenericProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openCreateRequestChange = changes['openCreateRequestId'];
    if (!openCreateRequestChange) {
      return;
    }

    if (openCreateRequestChange.firstChange) {
      return;
    }

    const nextRequestId = Number(openCreateRequestChange.currentValue ?? 0);
    const previousRequestId = Number(openCreateRequestChange.previousValue ?? 0);
    if (nextRequestId > previousRequestId) {
      this.openCreate();
    }
  }

  onBaseUrlChange(): void {
    this.gpSrv.setBaseUrl(this.baseUrl);
    this.loadGenericProducts();
  }

  get genericProductListItems(): GenericProductListItem[] {
    return this.genericProducts.map((genericProduct) => ({
      id: String(genericProduct.id),
      name: genericProduct.name,
      minQuantityUnit: this.normalizeNonNegativeNumber(genericProduct.minQuantityUnit),
      minQuantityUnitType: this.normalizePortionUnit(genericProduct.minQuantityUnitType),
      minQuantityMetric: this.normalizeNonNegativeNumber(genericProduct.minQuantityMetric),
      minQuantityMetricType: this.normalizeQuantityUnit(genericProduct.minQuantityMetricType),
    }));
  }

  onRefreshRequested(): void {
    this.loadGenericProducts();
  }

  refresh(): void {
    this.onRefreshRequested();
  }

  onAddRequested(): void {
    if (this.saving()) return;
    this.formMode = 'add';
    this.editingGenericProductId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  openCreate(): void {
    this.onAddRequested();
  }

  onEditRequested(item: GenericProductListItem): void {
    if (this.saving()) return;
    const genericProductId = Number(item.id);
    if (!Number.isInteger(genericProductId) || genericProductId < 1) {
      return;
    }

    const genericProduct = this.genericProducts.find(
      (value) => value.id === genericProductId,
    );
    if (!genericProduct) {
      return;
    }

    this.formMode = 'edit';
    this.editingGenericProductId = genericProduct.id;
    this.formInitialValue = this.toFormValue(genericProduct);
    this.formVisible = true;
  }

  onDeleteRequested(item: GenericProductListItem): void {
    if (this.saving()) return;
    const genericProductId = Number(item.id);
    if (!Number.isInteger(genericProductId) || genericProductId < 1) {
      return;
    }

    this.saving.set(true);
    this.gpSrv.remove(genericProductId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: genericProductId };
        this.lastError = null;
        this.saving.set(false);
        this.dataChanged.emit();

        if (this.editingGenericProductId === genericProductId) {
          this.onCancelForm();
        }

        this.loadGenericProducts();
      },
      error: (error) => {
        this.lastError = error;
        this.saving.set(false);
      },
    });
  }

  onFormSubmitted(event: {
    mode: GenericProductFormMode;
    value: GenericProductFormValue;
  }): void {
    if (this.saving()) return;
    this.saving.set(true);

    if (event.mode === 'edit' && this.editingGenericProductId !== null) {
      const payload = this.toUpdateDto(event.value);
      this.gpSrv.update(this.editingGenericProductId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving.set(false);
          this.dataChanged.emit();
          this.onCancelForm();
          this.loadGenericProducts();
        },
        error: (error) => {
          this.lastError = error;
          this.saving.set(false);
        },
      });
      return;
    }

    const payload = this.toCreateDto(event.value);
    this.gpSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving.set(false);
        this.dataChanged.emit();
        this.onCancelForm();
        this.loadGenericProducts();
      },
      error: (error) => {
        this.lastError = error;
        this.saving.set(false);
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu generic-product-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    if (this.saving()) return;
    this.formVisible = false;
    this.formMode = 'add';
    this.editingGenericProductId = null;
    this.formInitialValue = null;
  }

  private loadGenericProducts(): void {
    this.loading.set(true);
    this.gpSrv.findAll().subscribe({
      next: (response) => {
        this.genericProducts = this.extractGenericProductsFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading.set(false);

        if (this.editingGenericProductId !== null) {
          const currentGenericProduct =
            this.genericProducts.find(
              (genericProduct) => genericProduct.id === this.editingGenericProductId,
            ) ?? null;

          if (!currentGenericProduct) {
            this.onCancelForm();
            return;
          }

          this.formInitialValue = this.toFormValue(currentGenericProduct);
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading.set(false);
      },
    });
  }

  private toCreateDto(value: GenericProductFormValue): CreateGenericProductDto {
    return {
      name: value.name.trim(),
      minQuantityUnit: value.minQuantityUnit,
      minQuantityUnitType: value.minQuantityUnitType,
      minQuantityMetric: value.minQuantityMetric,
      minQuantityMetricType: value.minQuantityMetricType,
    };
  }

  private toUpdateDto(value: GenericProductFormValue): UpdateGenericProductDto {
    return this.toCreateDto(value);
  }

  private toFormValue(genericProduct: GenericProductApiModel): GenericProductFormValue {
    return {
      name: genericProduct.name,
      minQuantityUnit: this.normalizeNonNegativeNumber(genericProduct.minQuantityUnit) ?? 0,
      minQuantityUnitType: this.normalizePortionUnit(genericProduct.minQuantityUnitType),
      minQuantityMetric: this.normalizeNonNegativeNumber(genericProduct.minQuantityMetric) ?? 0,
      minQuantityMetricType: this.normalizeQuantityUnit(genericProduct.minQuantityMetricType),
    };
  }

  private extractGenericProductsFromResponse(value: unknown): GenericProductApiModel[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is GenericProductApiModel =>
        this.isGenericProductLike(item),
      );
    }

    if (this.isGenericProductLike(value)) {
      return [value];
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    const raw = value as Record<string, unknown>;
    const nestedCandidates = [
      'data',
      'items',
      'genericProducts',
      'generic-products',
      'results',
      'payload',
    ];
    for (const key of nestedCandidates) {
      const nested = raw[key];
      if (Array.isArray(nested)) {
        const genericProducts = nested.filter((item): item is GenericProductApiModel =>
          this.isGenericProductLike(item),
        );
        if (genericProducts.length > 0) {
          return genericProducts;
        }
      }
    }

    return [];
  }

  private isGenericProductLike(value: unknown): value is GenericProductApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const genericProduct = value as Partial<GenericProductApiModel>;
    return typeof genericProduct.id === 'number' && typeof genericProduct.name === 'string';
  }

  private normalizeNonNegativeNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 0 ? value : null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const parsedValue = Number(trimmed);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
  }

  private normalizePortionUnit(value: unknown): PortionUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim();
    const allowed: PortionUnit[] = ['tranche', 'piece', 'part', 'bouteille', 'portion'];
    return allowed.includes(candidate as PortionUnit) ? (candidate as PortionUnit) : null;
  }

  private normalizeQuantityUnit(value: unknown): QuantityUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim();
    const allowed: QuantityUnit[] = ['mg', 'g', 'kg', 'ml', 'l', 'unit', 'pack'];
    return allowed.includes(candidate as QuantityUnit) ? (candidate as QuantityUnit) : null;
  }
}
