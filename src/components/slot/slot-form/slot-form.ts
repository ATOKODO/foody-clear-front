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

export type SlotFormMode = 'add' | 'edit';

export interface SlotFormValue {
  title: string;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-slot-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slot-form.html',
  styleUrl: './slot-form.scss',
})
export class SlotForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: SlotFormMode = 'add';
  @Input() slot: Partial<SlotFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: SlotFormMode;
    value: SlotFormValue;
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
    if (changes['mode'] || changes['slot']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier Slot' : 'Ajouter Slot';
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
    const defaults: SlotFormValue = {
      title: '',
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    if (this.mode === 'edit' && this.slot) {
      this.form.reset({
        title: this.slot.title ?? defaults.title,
        protein: this.slot.protein ?? defaults.protein,
        carbs: this.slot.carbs ?? defaults.carbs,
        fat: this.slot.fat ?? defaults.fat,
      });
      return;
    }

    this.form.reset(defaults);
  }
}
