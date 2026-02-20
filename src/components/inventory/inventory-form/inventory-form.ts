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
import { InventoryProductQtyDto } from '../../../interfaces/inventory.interface';

export type InventoryFormMode = 'add' | 'edit';

export interface InventoryFormValue {
  name: string;
  productIds: number[];
  products: InventoryProductQtyDto[];
}

@Component({
  selector: 'app-inventory-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory-form.html',
  styleUrl: './inventory-form.scss',
})
export class InventoryForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: InventoryFormMode = 'add';
  @Input() inventory: Partial<InventoryFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: InventoryFormMode;
    value: InventoryFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    productIdsCsv: [''],
    productsJson: [''],
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

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const productIds = this.parseCsvIds(this.form.controls.productIdsCsv.value);
      const products = this.parseProductsJson(this.form.controls.productsJson.value);
      this.submitted.emit({
        mode: this.mode,
        value: {
          name: this.form.controls.name.value.trim(),
          productIds,
          products,
        },
      });
    } catch (error) {
      this.form.controls.productIdsCsv.setErrors({ invalidIds: true });
      this.form.controls.productsJson.setErrors({ invalidProducts: true });
    }
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
      productIdsCsv,
      productsJson,
    });
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
