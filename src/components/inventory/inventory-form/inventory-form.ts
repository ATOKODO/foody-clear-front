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

export type InventoryFormMode = 'add' | 'edit';

export interface InventoryFormValue {
  name: string;
  productIds: number[];
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
      this.submitted.emit({
        mode: this.mode,
        value: {
          name: this.form.controls.name.value.trim(),
          productIds,
        },
      });
    } catch (error) {
      this.form.controls.productIdsCsv.setErrors({ invalidIds: true });
    }
  }

  private applyInputState(): void {
    const name = this.inventory?.name ?? '';
    const productIdsCsv = this.inventory?.productIds?.length
      ? this.inventory.productIds.join(',')
      : '';

    this.form.reset({
      name,
      productIdsCsv,
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
}
