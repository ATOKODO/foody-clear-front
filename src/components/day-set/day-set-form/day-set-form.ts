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

export type DaySetFormMode = 'add' | 'edit';

export interface DaySetFormValue {
  title: string;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-day-set-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './day-set-form.html',
  styleUrl: './day-set-form.scss',
})
export class DaySetForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: DaySetFormMode = 'add';
  @Input() daySet: Partial<DaySetFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: DaySetFormMode;
    value: DaySetFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    protein: [0, [Validators.required, Validators.min(0)]],
    carbs: [0, [Validators.required, Validators.min(0)]],
    fat: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['daySet']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier DaySet' : 'Ajouter DaySet';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      mode: this.mode,
      value: this.form.getRawValue(),
    });
  }

  private applyInputState(): void {
    const defaults: DaySetFormValue = {
      title: '',
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    if (this.mode === 'edit' && this.daySet) {
      this.form.reset({
        title: this.daySet.title ?? defaults.title,
        protein: this.daySet.protein ?? defaults.protein,
        carbs: this.daySet.carbs ?? defaults.carbs,
        fat: this.daySet.fat ?? defaults.fat,
      });
      return;
    }

    this.form.reset(defaults);
  }
}
