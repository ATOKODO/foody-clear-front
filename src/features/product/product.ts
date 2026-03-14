import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Category } from '../category/category';
import { GenericProduct } from '../generic-product/generic-product';
import { Tag } from '../tag/tag';
import {
  ProductForm,
  ProductFormMode,
  ProductFormNutritionValue,
  ProductFormValue,
} from '../../components/product/product-form/product-form';
import {
  ProductList,
  ProductListItem,
} from '../../components/product/product-list/product-list';
import {
  CreateProductDto,
  NutritionValueCreated,
  NutritionValueUpdated,
  PortionUnit,
  Product as ProductApiModel,
  ProductUnitType,
  ProductService,
  QuantityUnit,
  UpdateProductDto,
} from '../../services/product-service';
import {
  MetaService,
  NutritionKeyMeta,
  QuantityUnitMeta,
} from '../../services/meta-service';
import { NutritionReference } from '../../interfaces/cycle.interface';

type ProductHubView = 'product' | 'category' | 'genericProduct' | 'tag';

@Component({
  selector: 'app-product',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    Category,
    GenericProduct,
    ProductList,
    ProductForm,
    Tag,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product implements OnInit {
  baseUrl = '';
  loading = false;
  saving = false;
  loadingMeta = false;
  linkedDataDirty = false;

  products: ProductApiModel[] = [];
  activeView: ProductHubView = 'product';

  formVisible = false;
  formMode: ProductFormMode = 'add';
  editingProductId: number | null = null;
  formInitialValue: Partial<ProductFormValue> | null = null;

  quantityUnitOptions: QuantityUnitMeta[] = [];
  nutritionKeyOptions: NutritionKeyMeta[] = [];

  lastResponse: unknown = null;
  lastError: unknown = null;
  lastMetaError: unknown = null;

  constructor(
    private readonly productSrv: ProductService,
    private readonly metaSrv: MetaService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.productSrv.baseUrl;
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.loadMeta();
    this.loadProducts();
  }

  onBaseUrlChange(): void {
    this.productSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.loadMeta();
    this.loadProducts();
  }

  get productListItems(): ProductListItem[] {
    return this.products.map((product) => ({
      id: String(product.id),
      name: product.name,
      barcode: product.barcode ?? null,
      unitType: product.unitType,
      quantityPerUnit: product.quantityPerUnit,
      quantityUnit: product.quantityUnit,
      portionCount: product.portionCount ?? null,
      portionUnit: product.portionUnit ?? null,
      portionQuantityNormalized: product.portionQuantityNormalized ?? null,
      price: product.price ?? null,
      tagNames: this.resolveTagNames(product.tags),
      nutritionValuesCount: this.extractNutritionValues(product).length,
      category: this.resolveLinkedEntityName(product.category),
      genericProduct: this.resolveLinkedEntityName(product.genericProduct),
    }));
  }

  onRefreshRequested(): void {
    this.loadProducts();
  }

  onActiveViewChange(nextView: ProductHubView): void {
    this.activeView = nextView;

    if (nextView === 'product' && this.linkedDataDirty) {
      this.linkedDataDirty = false;
      this.loadProducts();
    }
  }

  onLinkedDataChanged(): void {
    this.linkedDataDirty = true;
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingProductId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onEditRequested(item: ProductListItem): void {
    const productId = Number(item.id);
    if (!Number.isFinite(productId)) {
      return;
    }

    const product = this.products.find((value) => value.id === productId);
    if (!product) {
      return;
    }

    this.formMode = 'edit';
    this.editingProductId = product.id;
    this.formInitialValue = this.toFormValue(product);
    this.formVisible = true;
  }

  onDeleteRequested(item: ProductListItem): void {
    const productId = Number(item.id);
    if (!Number.isFinite(productId)) {
      return;
    }

    this.saving = true;
    this.productSrv.remove(productId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: productId };
        this.lastError = null;
        this.saving = false;

        if (this.editingProductId === productId) {
          this.onCancelForm();
        }

        this.loadProducts();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: ProductFormMode; value: ProductFormValue }): void {
    this.saving = true;

    if (event.mode === 'edit' && this.editingProductId !== null) {
      const previousProduct =
        this.products.find((product) => product.id === this.editingProductId) ?? null;
      const payload = this.toUpdateDto(event.value, previousProduct);
      this.productSrv.update(this.editingProductId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.formVisible = false;
          this.loadProducts();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    const payload = this.toCreateDto(event.value);
    this.productSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.loadProducts();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu product-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingProductId = null;
  }

  private loadMeta(): void {
    this.loadingMeta = true;
    this.lastMetaError = null;

    this.metaSrv.getQuantityUnits().subscribe({
      next: (units) => {
        this.quantityUnitOptions = units;
      },
      error: (error) => {
        this.quantityUnitOptions = [];
        this.lastMetaError = error;
      },
    });

    this.metaSrv.getNutritionKeys().subscribe({
      next: (keys) => {
        this.nutritionKeyOptions = keys;
        this.loadingMeta = false;
      },
      error: (error) => {
        this.nutritionKeyOptions = [];
        this.lastMetaError = error;
        this.loadingMeta = false;
      },
    });
  }

  private loadProducts(): void {
    this.loading = true;
    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = this.extractProductsFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.editingProductId !== null
        ) {
          const currentProduct =
            this.products.find((product) => product.id === this.editingProductId) ?? null;

          if (!currentProduct) {
            this.onCancelForm();
            return;
          }

          this.formInitialValue = this.toFormValue(currentProduct);
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private toCreateDto(value: ProductFormValue): CreateProductDto {
    return {
      name: value.name,
      barcode: value.barcode,
      categoryId: value.categoryId,
      tagIds: value.tagIds,
      genericProductId: value.genericProductId,
      unitType: value.unitType,
      quantityPerUnit: value.quantityPerUnit,
      quantityUnit: value.quantityUnit,
      portionCount: value.portionCount,
      portionUnit: value.portionUnit,
      portionQuantityNormalized: value.portionQuantityNormalized,
      price: value.price,
      url: value.url,
      memo: value.memo,
      nutritionValuesCreated: this.toNutritionValuesCreated(value.nutritionValues),
    };
  }

  private toUpdateDto(
    value: ProductFormValue,
    previousProduct: ProductApiModel | null,
  ): UpdateProductDto {
    const previousTagIds = previousProduct ? this.resolveTagIds(previousProduct.tags) : [];
    const nextTagIds = value.tagIds;
    const tagIdsToAdd = nextTagIds.filter((id) => !previousTagIds.includes(id));
    const tagIdsToRemove = previousTagIds.filter((id) => !nextTagIds.includes(id));

    const previousCategoryId = previousProduct ? this.readEntityId(previousProduct.category) : null;
    const shouldClearCategory = value.categoryId == null && previousCategoryId != null;

    const dto: UpdateProductDto = {
      name: value.name,
      barcode: value.barcode,
      genericProductId: value.genericProductId,
      unitType: value.unitType,
      quantityPerUnit: value.quantityPerUnit,
      quantityUnit: value.quantityUnit,
      portionCount: value.portionCount,
      portionUnit: value.portionUnit,
      portionQuantityNormalized: value.portionQuantityNormalized,
      price: value.price,
      url: value.url,
      memo: value.memo,
      nutritionValuesUpdated: this.toNutritionValuesUpdated(value.nutritionValues),
    };

    if (value.categoryId != null) {
      dto.categoryId = value.categoryId;
    } else if (shouldClearCategory) {
      dto.clearCategory = true;
    }

    if (tagIdsToAdd.length > 0) {
      dto.tagIdsToAdd = tagIdsToAdd;
    }

    if (tagIdsToRemove.length > 0) {
      dto.tagIdsToRemove = tagIdsToRemove;
    }

    return dto;
  }

  private toNutritionValuesCreated(
    values: ProductFormNutritionValue[],
  ): NutritionValueCreated[] {
    return values
      .map((value) => ({
        nutritionKey: value.nutritionKey.trim().toUpperCase(),
        amount: Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0,
        unit: value.unit,
        reference: value.reference,
      }))
      .filter((value) => value.nutritionKey !== '');
  }

  private toNutritionValuesUpdated(
    values: ProductFormNutritionValue[],
  ): NutritionValueUpdated[] {
    return values
      .map((value) => ({
        ...(typeof value.id === 'number' && Number.isInteger(value.id) && value.id > 0
          ? { id: value.id }
          : {}),
        nutritionKey: value.nutritionKey.trim().toUpperCase(),
        amount: Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0,
        unit: value.unit,
        reference: value.reference,
      }))
      .filter((value) => value.nutritionKey !== '');
  }

  private toFormValue(product: ProductApiModel): ProductFormValue {
    return {
      name: product.name,
      barcode: product.barcode ?? null,
      categoryId: this.readEntityId(product.category),
      tagIds: this.resolveTagIds(product.tags),
      genericProductId: this.readEntityId(product.genericProduct),
      unitType: this.normalizeUnitType(product.unitType),
      quantityPerUnit:
        typeof product.quantityPerUnit === 'number' && Number.isFinite(product.quantityPerUnit)
          ? product.quantityPerUnit
          : 0,
      quantityUnit: this.normalizeQuantityUnit(
        product.quantityUnit ?? this.quantityUnitOptions[0]?.value,
      ),
      portionCount:
        typeof product.portionCount === 'number' &&
        Number.isInteger(product.portionCount) &&
        product.portionCount > 0
          ? product.portionCount
          : null,
      portionUnit: this.normalizePortionUnit(product.portionUnit),
      portionQuantityNormalized:
        typeof product.portionQuantityNormalized === 'number' &&
        Number.isFinite(product.portionQuantityNormalized) &&
        product.portionQuantityNormalized > 0
          ? product.portionQuantityNormalized
          : null,
      price:
        typeof product.price === 'number' && Number.isFinite(product.price)
          ? product.price
          : null,
      url: product.url ?? null,
      memo: product.memo ?? null,
      nutritionValues: this.extractNutritionValues(product),
    };
  }

  private extractNutritionValues(product: ProductApiModel): ProductFormNutritionValue[] {
    if (!Array.isArray(product.nutritionValues) || product.nutritionValues.length === 0) {
      return [];
    }

    return product.nutritionValues
      .filter(
        (value): value is Record<string, unknown> =>
          !!value && typeof value === 'object',
      )
      .map((value) => {
        const rawId = value['id'];
        const id =
          typeof rawId === 'number' && Number.isInteger(rawId) && rawId > 0
            ? rawId
            : typeof rawId === 'string' &&
                rawId.trim() !== '' &&
                Number.isInteger(Number(rawId)) &&
                Number(rawId) > 0
              ? Number(rawId)
              : undefined;

        const rawAmount = value['amount'];
        const amount =
          typeof rawAmount === 'number' && Number.isFinite(rawAmount)
            ? rawAmount
            : typeof rawAmount === 'string' &&
                rawAmount.trim() !== '' &&
                Number.isFinite(Number(rawAmount))
              ? Number(rawAmount)
              : 0;

        const nutritionKey = this.extractNutritionKeyValue(value) ?? '';
        const unit = this.extractNutritionUnitValue(value) ?? 'G';
        const reference = this.extractNutritionReferenceValue(value);

        return {
          ...(id != null ? { id } : {}),
          nutritionKey,
          amount,
          unit,
          reference,
        };
      })
      .filter((value) => value.nutritionKey !== '');
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

  private isProductLike(value: unknown): value is ProductApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const product = value as Partial<ProductApiModel>;
    return typeof product.id === 'number' && typeof product.name === 'string';
  }

  private readEntityId(value: unknown): number | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const id = (value as Record<string, unknown>)['id'];
    return typeof id === 'number' && Number.isFinite(id) ? id : null;
  }

  private resolveTagIds(tags: unknown): number[] {
    if (!Array.isArray(tags)) {
      return [];
    }

    const ids = tags
      .map((tag) => {
        if (typeof tag === 'number') {
          return tag;
        }

        if (tag && typeof tag === 'object' && 'id' in tag) {
          return Number((tag as { id: unknown }).id);
        }

        return NaN;
      })
      .filter((id): id is number => Number.isInteger(id) && id > 0);

    return Array.from(new Set(ids));
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

  private extractNutritionKeyValue(raw: Record<string, unknown>): string | null {
    const value = this.readStringFromCandidates(raw, [
      'nutritionKey',
      'nutrition_key',
      'key',
      'label',
      'name',
    ]);
    if (!value) {
      return null;
    }

    const upper = value.toUpperCase();
    const byValue = this.nutritionKeyOptions.find(
      (option) => option.value.toUpperCase() === upper || option.key.toUpperCase() === upper,
    );
    if (byValue) {
      return byValue.value;
    }

    const byLabel = this.nutritionKeyOptions.find(
      (option) => option.label.toUpperCase() === upper,
    );
    if (byLabel) {
      return byLabel.value;
    }

    return value.toUpperCase();
  }

  private extractNutritionUnitValue(raw: Record<string, unknown>): string | null {
    const value = this.readStringFromCandidates(raw, [
      'unit',
      'nutritionUnit',
      'nutrition_unit',
      'uom',
      'measureUnit',
    ]);
    return value ? value.toUpperCase() : null;
  }

  private extractNutritionReferenceValue(
    raw: Record<string, unknown>,
  ): NutritionReference {
    const direct = this.readStringFromCandidates(raw, [
      'reference',
      'nutritionReference',
      'nutrition_reference',
      'perUnit',
      'per_unit',
    ]);

    if (typeof direct === 'string' && direct.trim() !== '') {
      return this.normalizeNutritionReference(direct);
    }

    const perRaw = raw['per'];
    if (typeof perRaw === 'number' && Number.isFinite(perRaw)) {
      return this.normalizeNutritionReference(perRaw);
    }
    if (typeof perRaw === 'string' && perRaw.trim() !== '') {
      return this.normalizeNutritionReference(perRaw);
    }

    return 'PER_100G';
  }

  private normalizeNutritionReference(value: unknown): NutritionReference {
    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (normalized === 'PER_100ML' || normalized.includes('100ML')) {
        return 'PER_100ML';
      }
      return 'PER_100G';
    }

    if (typeof value === 'number' && Number.isFinite(value) && value !== 100) {
      return 'PER_100ML';
    }

    return 'PER_100G';
  }

  private readStringFromCandidates(
    raw: Record<string, unknown>,
    fields: string[],
  ): string | null {
    for (const field of fields) {
      const value = raw[field];
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private normalizeUnitType(value: unknown): ProductUnitType {
    const allowed: ProductUnitType[] = [
      'Paquet',
      'Bouteille',
      'Boite',
      'Sachet',
      'Canette',
      'Bocal',
      'Unite',
      'Autre',
    ];

    if (typeof value !== 'string') {
      return 'Paquet';
    }

    const candidate = value.trim();
    return allowed.includes(candidate as ProductUnitType)
      ? (candidate as ProductUnitType)
      : 'Paquet';
  }

  private normalizeQuantityUnit(value: unknown): QuantityUnit {
    const allowed: QuantityUnit[] = ['mg', 'g', 'kg', 'ml', 'l', 'unit', 'pack'];

    if (typeof value !== 'string') {
      return 'g';
    }

    const candidate = value.trim().toLowerCase();
    return allowed.includes(candidate as QuantityUnit)
      ? (candidate as QuantityUnit)
      : 'g';
  }

  private normalizePortionUnit(value: unknown): PortionUnit | null {
    const allowed: PortionUnit[] = ['tranche', 'piece', 'part', 'bouteille', 'portion'];

    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim().toLowerCase();
    return allowed.includes(candidate as PortionUnit)
      ? (candidate as PortionUnit)
      : null;
  }
}
