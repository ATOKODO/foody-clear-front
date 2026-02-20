import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NutritionReference } from '../../../interfaces/cycle.interface';
import { NutritionKeyMeta, QuantityUnitMeta } from '../../../services/meta-service';
import {
  PortionUnit,
  ProductUnitType,
  QuantityUnit,
} from '../../../services/product-service';

export type ProductFormMode = 'add' | 'edit';

export interface ProductFormNutritionValue {
  id?: number;
  nutritionKey: string;
  amount: number;
  unit: string;
  reference: NutritionReference;
}

export interface ProductFormValue {
  name: string;
  barcode: string | null;
  categoryId: number | null;
  tagIds: number[];
  genericProductId: number | null;
  unitType: ProductUnitType;
  quantityPerUnit: number;
  quantityUnit: QuantityUnit;
  portionCount: number | null;
  portionUnit: PortionUnit | null;
  portionQuantityNormalized: number | null;
  price: number | null;
  url: string | null;
  memo: string | null;
  nutritionValues: ProductFormNutritionValue[];
}

@Component({
  selector: 'app-product-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: ProductFormMode = 'add';
  @Input() product: Partial<ProductFormValue> | null = null;
  @Input() nutritionKeys: NutritionKeyMeta[] = [];
  @Input() quantityUnits: QuantityUnitMeta[] = [];

  @Output() readonly submitted = new EventEmitter<{
    mode: ProductFormMode;
    value: ProductFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  nutritionValues: ProductFormNutritionValue[] = [];
  readonly unitTypeOptions: ProductUnitType[] = [
    'Paquet',
    'Bouteille',
    'Boite',
    'Sachet',
    'Canette',
    'Bocal',
    'Unite',
    'Autre',
  ];
  readonly portionUnitOptions: PortionUnit[] = [
    'tranche',
    'piece',
    'part',
    'bouteille',
    'portion',
  ];
  readonly referenceOptions: Array<{ label: string; value: NutritionReference }> = [
    { label: 'Pour 100 g', value: 'PER_100G' },
    { label: 'Pour 100 ml', value: 'PER_100ML' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    barcode: [''],
    categoryId: [''],
    tagIdsCsv: [''],
    genericProductId: [''],
    unitType: ['', [Validators.required]],
    quantityPerUnit: [0, [Validators.required, Validators.min(0.000001)]],
    quantityUnit: ['', [Validators.required]],
    portionCount: [''],
    portionUnit: [''],
    portionQuantityNormalized: [''],
    price: [''],
    url: [''],
    memo: [''],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['mode'] ||
      changes['product'] ||
      changes['nutritionKeys'] ||
      changes['quantityUnits']
    ) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier Produit' : 'Ajouter Produit';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const portionCount = this.normalizeNullableInteger(rawValue.portionCount);
    const portionUnit = this.normalizeNullablePortionUnit(rawValue.portionUnit);
    const portionQuantityNormalized = this.normalizeNullablePositiveNumber(
      rawValue.portionQuantityNormalized,
    );

    this.form.controls.portionUnit.setErrors(null);
    if ((portionCount != null || portionQuantityNormalized != null) && portionUnit == null) {
      this.form.controls.portionUnit.setErrors({ requiredWithPortion: true });
      return;
    }

    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');

    this.submitted.emit({
      mode: this.mode,
      value: {
        name: rawValue.name.trim(),
        barcode: this.normalizeNullableString(rawValue.barcode),
        categoryId: this.normalizeNullableInteger(rawValue.categoryId),
        tagIds: this.parseCsvIds(rawValue.tagIdsCsv),
        genericProductId: this.normalizeNullableInteger(rawValue.genericProductId),
        unitType: rawValue.unitType.trim() as ProductUnitType,
        quantityPerUnit: Number.isFinite(rawValue.quantityPerUnit)
          ? rawValue.quantityPerUnit
          : 0.000001,
        quantityUnit: rawValue.quantityUnit.trim() as QuantityUnit,
        portionCount,
        portionUnit,
        portionQuantityNormalized,
        price: this.normalizeNullableNumber(rawValue.price),
        url: this.normalizeNullableString(rawValue.url),
        memo: this.normalizeNullableString(rawValue.memo),
        nutritionValues,
      },
    });
  }

  addNutritionValue(): void {
    this.nutritionValues = [...this.nutritionValues, this.buildDefaultNutritionValue()];
  }

  removeNutritionValue(index: number): void {
    this.nutritionValues = this.nutritionValues.filter((_, i) => i !== index);
  }

  onNutritionKeyChange(index: number): void {
    const row = this.nutritionValues[index];
    if (!row) {
      return;
    }

    const allowedUnits = this.getAllowedUnits(row.nutritionKey);
    if (allowedUnits.length === 0) {
      row.unit = 'G';
      return;
    }

    if (!allowedUnits.includes(row.unit)) {
      row.unit = allowedUnits[0];
    }
  }

  getUnitsForKey(nutritionKey: string): string[] {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    return allowedUnits.length > 0 ? allowedUnits : ['G', 'MG'];
  }

  private applyInputState(): void {
    const defaults: ProductFormValue = {
      name: '',
      barcode: null,
      categoryId: null,
      tagIds: [],
      genericProductId: null,
      unitType: this.unitTypeOptions[0],
      quantityPerUnit: 0,
      quantityUnit: this.normalizeQuantityUnit(this.quantityUnits[0]?.value) ?? 'g',
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: null,
      url: null,
      memo: null,
      nutritionValues: this.getDefaultNutritionValues(),
    };

    if (this.mode === 'edit' && this.product) {
      this.form.reset({
        name: this.product.name ?? defaults.name,
        barcode: this.product.barcode ?? defaults.barcode ?? '',
        categoryId:
          this.product.categoryId != null ? String(this.product.categoryId) : '',
        tagIdsCsv: this.toTagIdsCsv(this.product.tagIds ?? defaults.tagIds),
        genericProductId:
          this.product.genericProductId != null ? String(this.product.genericProductId) : '',
        unitType: this.product.unitType ?? defaults.unitType,
        quantityPerUnit: this.product.quantityPerUnit ?? defaults.quantityPerUnit,
        quantityUnit: this.product.quantityUnit ?? defaults.quantityUnit,
        portionCount:
          this.product.portionCount != null ? String(this.product.portionCount) : '',
        portionUnit: this.product.portionUnit ?? '',
        portionQuantityNormalized:
          this.product.portionQuantityNormalized != null
            ? String(this.product.portionQuantityNormalized)
            : '',
        price: this.product.price != null ? String(this.product.price) : '',
        url: this.product.url ?? defaults.url ?? '',
        memo: this.product.memo ?? defaults.memo ?? '',
      });
      this.nutritionValues =
        this.product.nutritionValues && this.product.nutritionValues.length > 0
          ? this.cloneNutritionValues(this.product.nutritionValues)
          : this.getDefaultNutritionValues();
      return;
    }

    this.form.reset({
      name: defaults.name,
      barcode: defaults.barcode ?? '',
      categoryId: '',
      tagIdsCsv: this.toTagIdsCsv(defaults.tagIds),
      genericProductId: '',
      unitType: defaults.unitType,
      quantityPerUnit: defaults.quantityPerUnit,
      quantityUnit: defaults.quantityUnit,
      portionCount: '',
      portionUnit: '',
      portionQuantityNormalized: '',
      price: '',
      url: defaults.url ?? '',
      memo: defaults.memo ?? '',
    });
    this.nutritionValues = this.cloneNutritionValues(defaults.nutritionValues);
  }

  private getDefaultNutritionValues(): ProductFormNutritionValue[] {
    const defaults = ['PROTEIN', 'CARBOHYDRATE', 'FAT'].map((key) =>
      this.buildDefaultNutritionValue(key),
    );
    return this.cloneNutritionValues(defaults);
  }

  private buildDefaultNutritionValue(nutritionKey = ''): ProductFormNutritionValue {
    const unit = this.pickDefaultUnit(nutritionKey);
    return {
      nutritionKey,
      amount: 0,
      unit,
      reference: 'PER_100G',
    };
  }

  private cloneNutritionValues(values: ProductFormNutritionValue[]): ProductFormNutritionValue[] {
    return values.map((value) => this.normalizeNutritionValue(value));
  }

  private normalizeNutritionValue(value: ProductFormNutritionValue): ProductFormNutritionValue {
    const normalizedId =
      typeof value.id === 'number' && Number.isInteger(value.id) && value.id > 0
        ? value.id
        : undefined;
    const nutritionKey = (value.nutritionKey ?? '').trim().toUpperCase();
    const amount = Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0;
    const unit = this.pickDefaultUnit(nutritionKey, value.unit);
    const reference = value.reference === 'PER_100ML' ? 'PER_100ML' : 'PER_100G';

    return {
      ...(normalizedId != null ? { id: normalizedId } : {}),
      nutritionKey,
      amount,
      unit,
      reference,
    };
  }

  private pickDefaultUnit(nutritionKey: string, preferred?: string): string {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    if (allowedUnits.length === 0) {
      return preferred && preferred.trim() !== '' ? preferred : 'G';
    }

    if (preferred && allowedUnits.includes(preferred)) {
      return preferred;
    }

    const gramUnit = allowedUnits.find((unit) => unit.toUpperCase() === 'G');
    return gramUnit ?? allowedUnits[0];
  }

  private getAllowedUnits(nutritionKey: string): string[] {
    if (nutritionKey.trim() === '') {
      return [];
    }

    const key = this.nutritionKeys.find(
      (item) =>
        item.value.toUpperCase() === nutritionKey.toUpperCase() ||
        item.key.toUpperCase() === nutritionKey.toUpperCase(),
    );

    if (!key) {
      return [];
    }

    return key.allowedUnits.filter((unit) => unit.trim() !== '');
  }

  private toTagIdsCsv(tagIds: number[]): string {
    return tagIds.join(',');
  }

  private parseCsvIds(csv: unknown): number[] {
    if (typeof csv !== 'string') {
      return [];
    }

    const ids = csv
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value !== '')
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    return Array.from(new Set(ids));
  }

  private normalizeNullableString(value: unknown): string | null {
    if (value == null) {
      return null;
    }

    if (typeof value !== 'string') {
      return String(value);
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private normalizeNullableInteger(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) && value > 0 ? value : null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const numberValue = Number(trimmed);
    return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private normalizeNullableNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const numberValue = Number(trimmed);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private normalizeNullablePositiveNumber(value: unknown): number | null {
    const normalized = this.normalizeNullableNumber(value);
    return normalized != null && normalized > 0 ? normalized : null;
  }

  private normalizeQuantityUnit(value: unknown): QuantityUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim().toLowerCase();
    const allowed: QuantityUnit[] = ['mg', 'g', 'kg', 'ml', 'l', 'unit', 'pack'];
    return allowed.includes(candidate as QuantityUnit)
      ? (candidate as QuantityUnit)
      : null;
  }

  private normalizeNullablePortionUnit(value: unknown): PortionUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim().toLowerCase();
    return this.portionUnitOptions.includes(candidate as PortionUnit)
      ? (candidate as PortionUnit)
      : null;
  }
}
