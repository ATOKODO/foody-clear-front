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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import {
  InventoryProduct,
  InventoryProductQtyDto,
} from '../../../interfaces/inventory.interface';

export type InventoryFormMode = 'add' | 'edit';

export interface InventoryFormValue {
  name: string;
  productIds: number[];
  products: InventoryProductQtyDto[];
}

export interface InventoryFormProductsPayload {
  productIds: number[];
  products: InventoryProductQtyDto[];
}

@Component({
  selector: 'app-inventory-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
  ],
  templateUrl: './inventory-form.html',
  styleUrl: './inventory-form.scss',
})
export class InventoryForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: InventoryFormMode = 'add';
  @Input() inventory: Partial<InventoryFormValue> | null = null;
  @Input() linkedProducts: InventoryProduct[] = [];
  @Input() productsLoading = false;

  @Output() readonly submitted = new EventEmitter<{
    mode: InventoryFormMode;
    value: InventoryFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();
  @Output() readonly productsAddSubmitted = new EventEmitter<InventoryFormProductsPayload>();
  @Output() readonly productsRemoveSubmitted = new EventEmitter<InventoryFormProductsPayload>();

  readonly linkedProductsColumns = ['product', 'barcode', 'qtyUnits', 'qtyNormalized'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    productIdsCsv: [''],
    productsJson: [''],
    addProductIdsCsv: [''],
    addProductsJson: [''],
    removeProductIdsCsv: [''],
    removeProductsJson: [''],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['inventory']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier Inventory' : 'Ajouter Inventory';
  }

  get hasLinkedProducts(): boolean {
    return this.linkedProducts.length > 0;
  }

  trackByInventoryProductId(_: number, item: InventoryProduct): number {
    return item.id;
  }

  getLinkedProductName(item: InventoryProduct): string {
    const name = item.product?.name;
    return typeof name === 'string' && name.trim() !== '' ? name.trim() : `Produit #${item.productId}`;
  }

  getLinkedProductBarcode(item: InventoryProduct): string {
    const barcode = item.product?.barcode;
    return typeof barcode === 'string' && barcode.trim() !== '' ? barcode.trim() : '-';
  }

  getLinkedProductNormalizedDisplay(item: InventoryProduct): string {
    const unit = item.product?.quantityUnit;
    if (typeof unit === 'string' && unit.trim() !== '') {
      return `${item.qtyOnHandNormalized} ${unit}`;
    }

    return String(item.qtyOnHandNormalized);
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.controls.name.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }

    this.form.controls.name.setErrors(null);
    const name = this.form.controls.name.value.trim();
    if (name === '') {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    try {
      const productIds =
        this.mode === 'add'
          ? this.parseCsvIds(this.form.controls.productIdsCsv.value)
          : [];
      const products =
        this.mode === 'add'
          ? this.parseProductsJson(this.form.controls.productsJson.value)
          : [];

      this.submitted.emit({
        mode: this.mode,
        value: {
          name,
          productIds,
          products,
        },
      });
    } catch (error) {
      this.form.controls.productIdsCsv.setErrors({ invalidIds: true });
      this.form.controls.productsJson.setErrors({ invalidProducts: true });
    }
  }

  onAddProductsSubmit(): void {
    this.emitProductsPayload(
      this.form.controls.addProductIdsCsv.value,
      this.form.controls.addProductsJson.value,
      this.form.controls.addProductIdsCsv,
      this.form.controls.addProductsJson,
      this.productsAddSubmitted,
    );
  }

  onRemoveProductsSubmit(): void {
    this.emitProductsPayload(
      this.form.controls.removeProductIdsCsv.value,
      this.form.controls.removeProductsJson.value,
      this.form.controls.removeProductIdsCsv,
      this.form.controls.removeProductsJson,
      this.productsRemoveSubmitted,
    );
  }

  private applyInputState(): void {
    const name = this.inventory?.name ?? '';
    const productIdsCsv = this.inventory?.productIds?.length
      ? this.inventory.productIds.join(',')
      : '';
    const productsJson = this.inventory?.products?.length
      ? JSON.stringify(this.inventory.products)
      : '';

    this.form.reset({
      name,
      productIdsCsv: this.mode === 'add' ? productIdsCsv : '',
      productsJson: this.mode === 'add' ? productsJson : '',
      addProductIdsCsv: '',
      addProductsJson: '',
      removeProductIdsCsv: '',
      removeProductsJson: '',
    });
  }

  private emitProductsPayload(
    csvRaw: string,
    jsonRaw: string,
    csvControl: typeof this.form.controls.addProductIdsCsv,
    jsonControl: typeof this.form.controls.addProductsJson,
    output: EventEmitter<InventoryFormProductsPayload>,
  ): void {
    csvControl.setErrors(null);
    jsonControl.setErrors(null);

    try {
      const productIds = this.parseCsvIds(csvRaw);
      const products = this.parseProductsJson(jsonRaw);

      if (productIds.length === 0 && products.length === 0) {
        csvControl.setErrors({ requiredPayload: true });
        jsonControl.setErrors({ requiredPayload: true });
        return;
      }

      output.emit({ productIds, products });
    } catch {
      if (csvRaw.trim() !== '') {
        csvControl.setErrors({ invalidIds: true });
      }
      if (jsonRaw.trim() !== '') {
        jsonControl.setErrors({ invalidProducts: true });
      }
    }
  }

  private parseCsvIds(csv: string): number[] {
    const value = csv.trim();
    if (value === '') {
      return [];
    }

    const ids = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')
      .map((item) => Number(item));

    const hasInvalid = ids.some(
      (id) => Number.isNaN(id) || !Number.isInteger(id) || id < 1,
    );

    if (hasInvalid) {
      throw new Error('Invalid product ids');
    }

    return Array.from(new Set(ids));
  }

  private parseProductsJson(raw: string): InventoryProductQtyDto[] {
    const value = raw.trim();
    if (value === '') {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Invalid products JSON');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid products JSON');
    }

    const products = parsed.map((item) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid products JSON');
      }

      const row = item as Record<string, unknown>;
      const productId = Number(row['productId']);
      const qty = Number(row['qty']);
      if (!Number.isInteger(productId) || productId < 1 || !Number.isFinite(qty) || qty <= 0) {
        throw new Error('Invalid products JSON');
      }

      return { productId, qty };
    });

    const merged = new Map<number, number>();
    products.forEach((product) => {
      merged.set(product.productId, (merged.get(product.productId) ?? 0) + product.qty);
    });

    return Array.from(merged.entries()).map(([productId, qty]) => ({ productId, qty }));
  }
}
