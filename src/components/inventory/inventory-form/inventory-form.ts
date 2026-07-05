
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  input,
  output
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type InventoryFormMode = 'add' | 'edit';

export interface InventoryFormValue {
  name: string;
}

@Component({
  selector: 'app-inventory-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
],
  templateUrl: './inventory-form.html',
  styleUrl: './inventory-form.scss',
})
export class InventoryForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<InventoryFormMode>('add');
  readonly inventory = input<Partial<InventoryFormValue> | null>(null);

  readonly submitted = output<{
    mode: InventoryFormMode;
    value: InventoryFormValue;
}>();
  readonly menuClicked = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
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
    return this.mode() === 'edit' ? 'Edit inventory' : 'Add inventory';
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

    this.submitted.emit({
      mode: this.mode(),
      value: {
        name,
      },
    });
  }

  private applyInputState(): void {
    const name = this.inventory()?.name ?? '';

    this.form.reset({
      name,
    });
  }
}
