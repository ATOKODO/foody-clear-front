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

export type TagFormMode = 'add' | 'edit';

export interface TagFormValue {
  name: string;
}

@Component({
  selector: 'app-tag-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './tag-form.html',
  styleUrl: './tag-form.scss',
})
export class TagForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: TagFormMode = 'add';
  @Input() tag: Partial<TagFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: TagFormMode;
    value: TagFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['tag']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier Tag' : 'Ajouter Tag';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.controls.name.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();
    this.form.controls.name.setErrors(null);
    if (name === '') {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.submitted.emit({
      mode: this.mode,
      value: {
        name,
      },
    });
  }

  private applyInputState(): void {
    this.form.reset({
      name: this.tag?.name ?? '',
    });
  }
}
