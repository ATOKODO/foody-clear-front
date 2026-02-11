import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ProductService,
  CreateProductDto,
  UpdateProductDto,
  NutritionValueCreated,
  NutritionValueUpdated,
  Product as ProductApiModel,
} from '../../services/product-service';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  MetaService,
  NutritionKeyMeta,
  QuantityUnitMeta,
} from '../../services/meta-service';

type ProductTableRow = {
  id: number;
  name: string;
  barcode: string;
  unit: string;
  price: string;
  tags: string;
  category: string;
  genericProduct: string;
  source: ProductApiModel;
  nutritionValues: Array<{
    id: string;
    nutritionKey: string;
    amount: string;
    unit: string;
    reference: string;
  }>;
};

@Component({
  selector: 'app-product',
  imports: [
    JsonPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product implements OnInit {
  readonly nutritionValueColumns = ['id', 'nutritionKey', 'amount', 'unit', 'reference'];
  readonly nutritionReferenceOptions = [
    { value: 'PER_100G', label: 'PER_100G' },
    { value: 'PER_100ML', label: 'PER_100ML' },
  ];

  form: FormGroup = new FormGroup({});
  editForm: FormGroup = new FormGroup({});
  baseUrl: string | '' = '';

  lastResponse: unknown = null;
  lastError: unknown = null;
  loading = false;
  productTableRows: ProductTableRow[] = [];
  expandedProductId: number | null = null;
  isEditModalOpen = false;
  editTargetId: number | null = null;
  quantityUnitOptions: QuantityUnitMeta[] = [];
  nutritionKeyOptions: NutritionKeyMeta[] = [];

  constructor(
    private fb: FormBuilder,
    private productSrv: ProductService,
    private metaSrv: MetaService,
  ) {}
  ngOnInit(): void {
    this.baseUrl = this.productSrv.baseUrl;
    this.metaSrv.setBaseUrl(this.baseUrl);
    // Champs scalaires + 2 FormArray pour NV (create / update)
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),

      name: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      barcode: this.fb.control<string | null>(null),

      categoryId: this.fb.control<number | null>(null),
      tagIdsStr: this.fb.control<string | null>(null), // CSV -> [number, number]1
      tagIdsToAdd: this.fb.control<string | null>(null),
      tagIdsToRemove: this.fb.control<string | null>(null),
      genericProductId: this.fb.control<number | null>(null),

      unitType: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      quantityPerUnit: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      quantityUnit: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),

      price: this.fb.control<number | null>(null),
      url: this.fb.control<string | null>(null),
      memo: this.fb.control<string | null>(null),

      nutritionValuesCreated: this.fb.array<FormArray>([]),
      nutritionValuesUpdated: this.fb.array<FormArray>([]),
    });

    this.loadQuantityUnits();
    this.loadNutritionKeys();

    this.editForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      barcode: this.fb.control<string | null>(null),
      categoryId: this.fb.control<number | null>(null),
      genericProductId: this.fb.control<number | null>(null),
      unitType: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      quantityPerUnit: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      quantityUnit: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      price: this.fb.control<number | null>(null),
      url: this.fb.control<string | null>(null),
      memo: this.fb.control<string | null>(null),
    });
  }

  // -------- Helpers UI --------
  onBaseUrlChange() {
    this.productSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.loadQuantityUnits();
    this.loadNutritionKeys();
  }

  get nvCreatedFA(): FormArray {
    return this.form.get('nutritionValuesCreated') as FormArray;
  }
  get nvUpdatedFA(): FormArray {
    return this.form.get('nutritionValuesUpdated') as FormArray;
  }

  trackByProductId(_: number, row: ProductTableRow): number {
    return row.id;
  }

  private buildProductTableRows(value: unknown): ProductTableRow[] {
    return this.extractProductsFromResponse(value).map((product) => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode ?? '-',
      unit:
        product.quantityPerUnit == null && product.quantityUnit == null
          ? '-'
          : `${product.quantityPerUnit ?? '-'} ${product.quantityUnit ?? ''}`.trim(),
      price: product.price == null ? '-' : String(product.price),
      tags: Array.isArray(product.tags) ? String(product.tags.length) : '-',
      category: this.resolveLinkedEntityName(product.category),
      genericProduct: this.resolveLinkedEntityName(product.genericProduct),
      source: product,
      nutritionValues: Array.isArray(product.nutritionValues)
        ? product.nutritionValues
            .filter(
              (item): item is Record<string, unknown> =>
                !!item && typeof item === 'object',
            )
            .map((item) => ({
              id: item['id'] == null ? '-' : String(item['id']),
              nutritionKey:
                typeof item['nutritionKey'] === 'string'
                  ? item['nutritionKey']
                  : typeof item['label'] === 'string'
                    ? item['label']
                    : '-',
              amount: item['amount'] == null ? '-' : String(item['amount']),
              unit: typeof item['unit'] === 'string' ? item['unit'] : '-',
              reference:
                typeof item['reference'] === 'string'
                  ? item['reference']
                  : item['per'] == null
                    ? '-'
                    : String(item['per']),
            }))
        : [],
    }));
  }

  openEditModalFromRow(row: ProductTableRow, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.editTargetId = row.id;
    this.editForm.reset({
      id: row.id,
      name: row.source.name ?? '',
      barcode: row.source.barcode ?? null,
      categoryId: this.readEntityId(row.source.category),
      genericProductId: this.readEntityId(row.source.genericProduct),
      unitType: row.source.unitType ?? '',
      quantityPerUnit: row.source.quantityPerUnit ?? null,
      quantityUnit: row.source.quantityUnit ?? '',
      price: row.source.price ?? null,
      url: row.source.url ?? null,
      memo: row.source.memo ?? null,
    });

    if (
      !this.editForm.value['quantityUnit'] &&
      this.quantityUnitOptions.length > 0
    ) {
      this.editForm.patchValue({ quantityUnit: this.quantityUnitOptions[0].value });
    }

    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editTargetId = null;
  }

  saveEditFromModal(): void {
    const id = this.editTargetId ?? this.editForm.value['id'] ?? null;
    if (id == null) {
      this.setError('Impossible de modifier: id produit manquant.');
      return;
    }

    const payload = this.pickModalUpdatePayload();

    this.loading = true;
    this.productSrv.update(id, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.getAll();
      },
      error: (e) => this.setError(e),
    });
  }

  deleteFromRow(row: ProductTableRow, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const confirmed = window.confirm(`Supprimer le produit "${row.name}" (id=${row.id}) ?`);
    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.productSrv.remove(row.id).subscribe({
      next: () => {
        this.productTableRows = this.productTableRows.filter((item) => item.id !== row.id);
        if (this.expandedProductId === row.id) {
          this.expandedProductId = null;
        }
        this.lastResponse = { deleted: true, id: row.id };
        this.lastError = null;
        this.loading = false;
      },
      error: (e) => this.setError(e),
    });
  }

  addNvCreated() {
    const defaultNutritionKey = this.nutritionKeyOptions[0]?.value ?? '';
    const allowedUnits = this.getAllowedUnitsByNutritionKey(defaultNutritionKey);
    const defaultUnit = allowedUnits[0] ?? '';
    const defaultReference = this.nutritionReferenceOptions[0]?.value ?? '';

    this.nvCreatedFA.push(
      this.fb.group({
        nutritionKey: this.fb.control<string>(defaultNutritionKey, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        amount: this.fb.control<number | null>(null, {
          validators: [Validators.required],
        }),
        unit: this.fb.control<string>(defaultUnit, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        reference: this.fb.control<string>(defaultReference, {
          nonNullable: true,
          validators: [Validators.required],
        }),
      }),
    );

    this.onCreatedNutritionKeyChange(this.nvCreatedFA.length - 1);
  }
  removeNvCreated(i: number) {
    this.nvCreatedFA.removeAt(i);
  }

  addNvUpdated() {
    const defaultNutritionKey = this.nutritionKeyOptions[0]?.value ?? '';
    const allowedUnits = this.getAllowedUnitsByNutritionKey(defaultNutritionKey);
    const defaultUnit = allowedUnits[0] ?? '';
    const defaultReference = this.nutritionReferenceOptions[0]?.value ?? '';

    this.nvUpdatedFA.push(
      this.fb.group({
        id: this.fb.control<number | null>(null), // si rempli -> update, sinon -> create
        nutritionKey: this.fb.control<string>(defaultNutritionKey, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        amount: this.fb.control<number | null>(null, {
          validators: [Validators.required],
        }),
        unit: this.fb.control<string>(defaultUnit, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        reference: this.fb.control<string>(defaultReference, {
          nonNullable: true,
          validators: [Validators.required],
        }),
      }),
    );

    this.onUpdatedNutritionKeyChange(this.nvUpdatedFA.length - 1);
  }
  removeNvUpdated(i: number) {
    this.nvUpdatedFA.removeAt(i);
  }

  getNutritionUnitsForCreated(index: number): string[] {
    const group = this.nvCreatedFA.at(index);
    const nutritionKey = group?.value?.['nutritionKey'];
    return this.getAllowedUnitsByNutritionKey(
      typeof nutritionKey === 'string' ? nutritionKey : '',
    );
  }

  getNutritionUnitsForUpdated(index: number): string[] {
    const group = this.nvUpdatedFA.at(index);
    const nutritionKey = group?.value?.['nutritionKey'];
    return this.getAllowedUnitsByNutritionKey(
      typeof nutritionKey === 'string' ? nutritionKey : '',
    );
  }

  onCreatedNutritionKeyChange(index: number): void {
    const group = this.nvCreatedFA.at(index) as FormGroup | null;
    if (!group) {
      return;
    }
    this.syncNutritionUnitForGroup(group);
  }

  onUpdatedNutritionKeyChange(index: number): void {
    const group = this.nvUpdatedFA.at(index) as FormGroup | null;
    if (!group) {
      return;
    }
    this.syncNutritionUnitForGroup(group);
  }

  private parseCsvIds(csv: string | null | undefined): number[] | undefined {
    if (!csv) return undefined;
    const ids = csv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n));
    return ids.length ? ids : [];
  }

  private loadNutritionKeys(): void {
    this.metaSrv.getNutritionKeys().subscribe({
      next: (keys) => {
        this.nutritionKeyOptions = keys;
        this.syncNutritionUnitsForAllGroups();
      },
      error: () => {
        this.nutritionKeyOptions = [];
      },
    });
  }

  private loadQuantityUnits(): void {
    this.metaSrv.getQuantityUnits().subscribe({
      next: (units) => {
        this.quantityUnitOptions = units;

        const currentUnit = (this.form.value['quantityUnit'] ?? '')
          .toString()
          .trim();
        const existsInOptions = units.some((unit) => unit.value === currentUnit);
        if ((!existsInOptions || currentUnit === '') && units.length > 0) {
          this.form.patchValue({ quantityUnit: units[0].value });
        }
      },
      error: () => {
        this.quantityUnitOptions = [];
      },
    });
  }

  private getAllowedUnitsByNutritionKey(nutritionKey: string): string[] {
    const key = nutritionKey.trim();
    if (key === '') {
      return [];
    }

    return this.nutritionKeyOptions.find((item) => item.value === key)?.allowedUnits ?? [];
  }

  private syncNutritionUnitsForAllGroups(): void {
    for (let i = 0; i < this.nvCreatedFA.length; i += 1) {
      this.onCreatedNutritionKeyChange(i);
    }

    for (let i = 0; i < this.nvUpdatedFA.length; i += 1) {
      this.onUpdatedNutritionKeyChange(i);
    }
  }

  private syncNutritionUnitForGroup(group: FormGroup): void {
    const nutritionKeyControl = group.get('nutritionKey');
    const nutritionKey = nutritionKeyControl?.value;
    let selectedNutritionKey = typeof nutritionKey === 'string' ? nutritionKey : '';
    if (selectedNutritionKey.trim() === '' && this.nutritionKeyOptions.length > 0) {
      selectedNutritionKey = this.nutritionKeyOptions[0].value;
      nutritionKeyControl?.setValue(selectedNutritionKey);
    }

    const allowedUnits = this.getAllowedUnitsByNutritionKey(selectedNutritionKey);
    const unitControl = group.get('unit');
    const currentUnit = unitControl?.value;
    const currentUnitValue = typeof currentUnit === 'string' ? currentUnit : '';
    const referenceControl = group.get('reference');
    const currentReference = referenceControl?.value;
    const currentReferenceValue =
      typeof currentReference === 'string' ? currentReference.trim() : '';

    if (
      unitControl &&
      allowedUnits.length > 0 &&
      !allowedUnits.includes(currentUnitValue)
    ) {
      unitControl.setValue(allowedUnits[0]);
    }

    if (
      referenceControl &&
      currentReferenceValue === '' &&
      this.nutritionReferenceOptions.length > 0
    ) {
      referenceControl.setValue(this.nutritionReferenceOptions[0].value);
    }
  }

  private extractProductsFromResponse(value: unknown): ProductApiModel[] {
    const direct = this.collectProductsFromNode(value);
    if (direct.length > 0) {
      return direct;
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    // Fallback: explore nested payloads (data/items/results/payload wrappers).
    const queue: unknown[] = [value];
    const visited = new Set<object>();

    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') {
        continue;
      }

      if (visited.has(node)) {
        continue;
      }
      visited.add(node);

      const found = this.collectProductsFromNode(node);
      if (found.length > 0) {
        return found;
      }

      if (Array.isArray(node)) {
        for (const item of node) {
          if (item && typeof item === 'object') {
            queue.push(item);
          }
        }
        continue;
      }

      const record = node as Record<string, unknown>;
      for (const child of Object.values(record)) {
        if (child && typeof child === 'object') {
          queue.push(child);
        }
      }
    }

    return [];
  }

  private collectProductsFromNode(node: unknown): ProductApiModel[] {
    if (Array.isArray(node)) {
      return node.filter((item): item is ProductApiModel => this.isProductLike(item));
    }

    if (this.isProductLike(node)) {
      return [node];
    }

    if (!node || typeof node !== 'object') {
      return [];
    }

    const raw = node as Record<string, unknown>;
    const candidates = ['data', 'items', 'products', 'results', 'payload'];

    for (const key of candidates) {
      const payload = raw[key];
      if (Array.isArray(payload)) {
        const products = payload.filter(
          (item): item is ProductApiModel => this.isProductLike(item),
        );
        if (products.length > 0) {
          return products;
        }
      } else if (this.isProductLike(payload)) {
        return [payload];
      }
    }

    return [];
  }

  private isProductLike(value: unknown): value is ProductApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const maybe = value as Partial<ProductApiModel>;
    return typeof maybe.id === 'number' && typeof maybe.name === 'string';
  }

  private readEntityId(value: unknown): number | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const id = (value as Record<string, unknown>)['id'];
    return typeof id === 'number' && Number.isFinite(id) ? id : null;
  }

  private resolveLinkedEntityName(value: unknown): string {
    if (!value || typeof value !== 'object') {
      return 'Aucun';
    }

    const raw = value as Record<string, unknown>;
    const candidates = ['name', 'title', 'label'];

    for (const key of candidates) {
      const candidate = raw[key];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim();
      }
    }

    return 'Aucun';
  }

  private pickModalUpdatePayload(): UpdateProductDto {
    const v = this.editForm.getRawValue();

    if (
      !v.name ||
      !v.unitType ||
      !v.quantityUnit ||
      v.quantityPerUnit == null
    ) {
      throw new Error(
        'Pour modifier: name, unitType, quantityPerUnit, quantityUnit sont requis.',
      );
    }

    return {
      name: v.name.trim(),
      barcode: v.barcode ?? null,
      categoryId: v.categoryId ?? null,
      genericProductId: v.genericProductId ?? null,
      unitType: v.unitType.trim(),
      quantityPerUnit: v.quantityPerUnit,
      quantityUnit: v.quantityUnit.trim(),
      price: v.price ?? null,
      url: v.url ?? null,
      memo: v.memo ?? null,
    };
  }

  private pickCreatePayload(): CreateProductDto {
    const v = this.form.getRawValue();

    if (
      !v.name ||
      !v.unitType ||
      !v.quantityUnit ||
      v.quantityPerUnit == null
    ) {
      throw new Error(
        'Pour CREATE: name, unitType, quantityPerUnit, quantityUnit sont requis.',
      );
    }

    const dto: CreateProductDto = {
      name: v.name,
      barcode: v.barcode ?? null,
      categoryId: v.categoryId ?? null,
      tagIds: this.parseCsvIds(v.tagIdsStr ?? undefined),
      genericProductId: v.genericProductId ?? null,
      unitType: v.unitType,
      quantityPerUnit: v.quantityPerUnit!,
      quantityUnit: v.quantityUnit,
      price: v.price ?? null,
      url: v.url ?? null,
      memo: v.memo ?? null,
    };

    // nutritionValuesCreated (optionnel)
    if (this.nvCreatedFA.length) {
      dto.nutritionValuesCreated =
        this.nvCreatedFA.getRawValue() as NutritionValueCreated[];
    }

    return dto;
  }

  private pickUpdatePayload(): UpdateProductDto {
    const v = this.form.getRawValue();
    const dto: UpdateProductDto = {};

    // n’ajoute que ce qui est fourni
    if (v.name && v.name.trim() !== '') dto.name = v.name.trim();
    if (v.barcode !== null) dto.barcode = v.barcode;
    if (v.categoryId !== null) dto.categoryId = v.categoryId; // null pour détacher si validation OK
    const tagIds = this.parseCsvIds(v.tagIdsStr ?? undefined);
    const tagIdsToAdd = this.parseCsvIds(v.tagIdsToAdd ?? undefined);
    const tagIdsToRemove = this.parseCsvIds(v.tagIdsToRemove ?? undefined);
    if (tagIds !== undefined) dto.tagIds = tagIds; // sémantique “remplacement” si présent
    if (tagIdsToAdd !== undefined) dto.tagIdsToAdd = tagIdsToAdd; // sémantique “remplacement” si présent
    if (tagIdsToRemove !== undefined) dto.tagIdsToRemove = tagIdsToRemove; // sémantique “remplacement” si présent
    if (v.genericProductId !== null) dto.genericProductId = v.genericProductId;

    if (v.unitType && v.unitType.trim() !== '')
      dto.unitType = v.unitType.trim();
    if (v.quantityPerUnit != null) dto.quantityPerUnit = v.quantityPerUnit;
    if (v.quantityUnit && v.quantityUnit.trim() !== '')
      dto.quantityUnit = v.quantityUnit.trim();

    if (v.price !== null) dto.price = v.price;
    if (v.url !== null) dto.url = v.url;
    if (v.memo !== null) dto.memo = v.memo;

    // nutritionValuesUpdated (PATCH partiel — on n’envoie que si présent et non vide)
    if (this.nvUpdatedFA.length) {
      dto.nutritionValuesUpdated =
        this.nvUpdatedFA.getRawValue() as NutritionValueUpdated[];
    }

    return dto;
  }

  private setResult(resp: unknown) {
    this.lastResponse = resp;
    this.productTableRows = this.buildProductTableRows(resp);
    this.expandedProductId = null;
    this.lastError = null;
    this.loading = false;
  }
  private setError(err: unknown) {
    this.lastError = err;
    this.loading = false;
  }

  // -------- Actions API --------
  create() {
    this.loading = true;
    try {
      const dto = this.pickCreatePayload();
      this.productSrv.create(dto).subscribe({
        next: (r) => this.setResult(r),
        error: (e) => this.setError(e),
      });
    } catch (e) {
      this.setError(e);
    }
  }

  getAll() {
    this.loading = true;
    this.productSrv.findAll().subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  getOne() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError('Veuillez renseigner un id pour GET /products/:id');
    this.loading = true;
    this.productSrv.findOne(id).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  update() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour PATCH /products/:id',
      );

    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0)
      return this.setError('Aucun champ à mettre à jour.');

    this.loading = true;
    this.productSrv.update(id, dto).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  delete() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour DELETE /products/:id',
      );
    this.loading = true;
    this.productSrv.remove(id).subscribe({
      next: () => this.setResult({ deleted: true, id }),
      error: (e) => this.setError(e),
    });
  }

  // -------- Presets & reset --------
  fillDemoCreate() {
    // adapte les IDs à ta base
    this.form.patchValue({
      id: null,
      name: 'Salades vertes',
      barcode: '1234567890123',
      categoryId: 1,
      tagIdsStr: '2,5',
      genericProductId: null,
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      price: 2.99,
      url: 'https://exemple.com/produit/salades-vertes',
      memo: 'A racheter souvent, bon rapport qualité/prix',
    });
    this.nvCreatedFA.clear();
    this.addNvCreated();
    this.addNvCreated();
    this.addNvCreated();
    this.nvCreatedFA.at(0).patchValue({
      nutritionKey: 'PROTEIN',
      amount: 12.5,
      unit: 'G',
      reference: 'PER_100G',
    });
    this.nvCreatedFA.at(1).patchValue({
      nutritionKey: 'CARBOHYDRATE',
      amount: 67.3,
      unit: 'G',
      reference: 'PER_100G',
    });
    this.nvCreatedFA.at(2).patchValue({
      nutritionKey: 'FIBER',
      amount: 8,
      unit: 'G',
      reference: 'PER_100G',
    });
  }

  fillDemoUpdate() {
    // exemple : update scalaires + NV : update + create
    this.nvUpdatedFA.clear();
    this.addNvUpdated(); // supposons NV id=10 à mettre à jour
    (this.nvUpdatedFA.at(0) as any).patchValue({
      id: 10,
      nutritionKey: 'PROTEIN',
      amount: 13,
      unit: 'G',
      reference: 'PER_100G',
    });
    this.addNvUpdated(); // nouvelle NV
    (this.nvUpdatedFA.at(1) as any).patchValue({
      nutritionKey: 'SALT',
      amount: 0.01,
      unit: 'G',
      reference: 'PER_100G',
    });

    this.form.patchValue({
      price: 2.79,
      memo: 'Prendre date courte si promo',
    });
  }

  clear() {
    this.form.reset({
      id: null,
      name: '',
      barcode: null,
      categoryId: null,
      tagIdsStr: null,
      genericProductId: null,
      unitType: '',
      quantityPerUnit: null,
      quantityUnit: '',
      price: null,
      url: null,
      memo: null,
    });
    this.nvCreatedFA.clear();
    this.nvUpdatedFA.clear();
    this.productTableRows = [];
    this.expandedProductId = null;
    this.closeEditModal();
    this.lastResponse = null;
    this.lastError = null;
  }
}
