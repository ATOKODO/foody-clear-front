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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

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
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product implements OnInit {
  readonly productTableColumns = [
    'id',
    'name',
    'barcode',
    'unit',
    'price',
    'tags',
  ];

  form: FormGroup = new FormGroup({});
  baseUrl: string | '' = '';

  lastResponse: unknown = null;
  lastError: unknown = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private productSrv: ProductService,
  ) {}
  ngOnInit(): void {
    this.baseUrl = this.productSrv.baseUrl;
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
  }

  // -------- Helpers UI --------
  onBaseUrlChange() {
    this.productSrv.setBaseUrl(this.baseUrl);
  }

  get nvCreatedFA(): FormArray {
    return this.form.get('nutritionValuesCreated') as FormArray;
  }
  get nvUpdatedFA(): FormArray {
    return this.form.get('nutritionValuesUpdated') as FormArray;
  }

  get productTableRows(): Array<{
    id: number;
    name: string;
    barcode: string;
    unit: string;
    price: string;
    tags: string;
  }> {
    return this.extractProductsFromResponse(this.lastResponse).map((product) => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode ?? '-',
      unit: `${product.quantityPerUnit} ${product.quantityUnit}`,
      price: product.price == null ? '-' : String(product.price),
      tags: Array.isArray(product.tags) ? String(product.tags.length) : '-',
    }));
  }

  addNvCreated() {
    this.nvCreatedFA.push(
      this.fb.group({
        label: this.fb.control<string>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        amount: this.fb.control<number | null>(null, {
          validators: [Validators.required],
        }),
        unit: this.fb.control<string>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        per: this.fb.control<number | null>(null, {
          validators: [Validators.required],
        }),
      }),
    );
  }
  removeNvCreated(i: number) {
    this.nvCreatedFA.removeAt(i);
  }

  addNvUpdated() {
    this.nvUpdatedFA.push(
      this.fb.group({
        id: this.fb.control<number | null>(null), // si rempli -> update, sinon -> create
        label: this.fb.control<string>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        amount: this.fb.control<number | null>(null, {
          validators: [Validators.required],
        }),
        unit: this.fb.control<string>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        per: this.fb.control<number | null>(null, {
          validators: [Validators.required],
        }),
      }),
    );
  }
  removeNvUpdated(i: number) {
    this.nvUpdatedFA.removeAt(i);
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

  private extractProductsFromResponse(value: unknown): ProductApiModel[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is ProductApiModel => this.isProductLike(item));
    }

    if (this.isProductLike(value)) {
      return [value];
    }

    if (value && typeof value === 'object') {
      const payload = (value as Record<string, unknown>)['data'];

      if (Array.isArray(payload)) {
        return payload.filter((item): item is ProductApiModel => this.isProductLike(item));
      }

      if (this.isProductLike(payload)) {
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
    return (
      typeof maybe.id === 'number' &&
      typeof maybe.name === 'string' &&
      typeof maybe.quantityUnit === 'string'
    );
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
    this.nvCreatedFA
      .at(0)
      .patchValue({ label: 'Protéines', amount: 12.5, unit: 'g', per: 100 });
    this.nvCreatedFA
      .at(1)
      .patchValue({ label: 'Glucides', amount: 67.3, unit: 'g', per: 100 });
    this.nvCreatedFA
      .at(2)
      .patchValue({ label: 'Fibres', amount: 8, unit: 'g', per: 100 });
  }

  fillDemoUpdate() {
    // exemple : update scalaires + NV : update + create
    this.nvUpdatedFA.clear();
    this.addNvUpdated(); // supposons NV id=10 à mettre à jour
    (this.nvUpdatedFA.at(0) as any).patchValue({
      id: 10,
      label: 'Protéines',
      amount: 13,
      unit: 'g',
      per: 100,
    });
    this.addNvUpdated(); // nouvelle NV
    (this.nvUpdatedFA.at(1) as any).patchValue({
      label: 'Sel',
      amount: 0.01,
      unit: 'g',
      per: 100,
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
    this.lastResponse = null;
    this.lastError = null;
  }
}
