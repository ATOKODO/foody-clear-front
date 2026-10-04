import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { UiButton } from '../../ui/button/button';

@Component({
  selector: 'app-material-preview',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatCardModule, MatTabsModule, MatProgressBarModule, MatButtonToggleModule, MatTableModule, MatDatepickerModule, UiButton],
  providers: [provideNativeDateAdapter()],
  templateUrl: './material-preview.html',
  styleUrl: './material-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialPreview {
  readonly section = input<'field' | 'select' | 'checkbox' | 'card' | 'tabs' | 'progress' | 'toggle' | 'table' | 'date'>('field');
  readonly appearance = input<'fill' | 'outline'>('fill');
  readonly label = input('Product');
  readonly value = input('Banana');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly multiple = input(false);
  readonly empty = input(false);
  readonly indeterminate = input(false);
  readonly checked = input(false);
  readonly fieldType = input<'text' | 'number' | 'date' | 'time' | 'datetime-local' | 'textarea'>('text');
  readonly cardAppearance = input<'raised' | 'outlined'>('outlined');
  readonly progressMode = input<'determinate' | 'indeterminate' | 'buffer' | 'query'>('indeterminate');
  readonly control = computed(() => {
    const control = new FormControl({ value: this.invalid() ? '' : this.value(), disabled: this.disabled() }, { nonNullable: true, validators: Validators.required });
    if (this.invalid()) control.markAsTouched();
    return control;
  });
  readonly selectControl = computed(() => {
    const value: string | string[] = this.invalid() ? (this.multiple() ? [] : '') : this.multiple() ? ['fridge', 'pantry'] : 'fridge';
    const control = new FormControl({ value, disabled: this.disabled() }, { nonNullable: true, validators: Validators.required });
    if (this.invalid()) control.markAsTouched();
    return control;
  });
  readonly dateControl = computed(() => {
    const control = new FormControl<Date | null>({ value: this.invalid() ? null : new Date(2026, 2, 25), disabled: this.disabled() }, Validators.required);
    if (this.invalid()) control.markAsTouched();
    return control;
  });
  readonly rows = computed(() => this.empty() ? [] : [
    { name: 'Banana', quantity: '400 g' },
    { name: 'Oats', quantity: '1 kg' },
    { name: 'Product with a long descriptive label for layout review', quantity: '250 g' },
  ]);
}
