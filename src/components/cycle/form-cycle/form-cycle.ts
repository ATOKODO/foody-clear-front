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
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type TypeDuree = 'jour' | 'semaine' | 'mois';
export type CycleFormMode = 'add' | 'edit';

export interface CycleFormValue {
  titre: string;
  couleur: string;
  proteines: number;
  glucides: number;
  lipides: number;
  nombre: number;
  typeDuree: TypeDuree;
}

@Component({
  selector: 'app-form-cycle',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './form-cycle.html',
  styleUrl: './form-cycle.scss',
})
export class FormCycle implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: CycleFormMode = 'add';
  @Input() cycle: Partial<CycleFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: CycleFormMode;
    value: CycleFormValue;
  }>();

  readonly colorOptions = [
    { label: 'Rouge', value: '#ff5b5b' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Bleu', value: '#3b82f6' },
    { label: 'Vert', value: '#22c55e' },
  ];

  readonly durationOptions: { label: string; value: TypeDuree }[] = [
    { label: 'Jour', value: 'jour' },
    { label: 'Semaine', value: 'semaine' },
    { label: 'Mois', value: 'mois' },
  ];

  readonly form = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    couleur: [this.colorOptions[0].value],
    proteines: [0, [Validators.min(0)]],
    glucides: [0, [Validators.min(0)]],
    lipides: [0, [Validators.min(0)]],
    nombre: [0, [Validators.min(0)]],
    typeDuree: ['jour' as TypeDuree],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['cycle']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier un Cycle' : 'Ajouter un Cycle';
  }

  get couleurSelectionnee(): string {
    return (
      this.colorOptions.find(
        (option) => option.value === this.form.controls.couleur.value,
      )?.value ?? this.colorOptions[0].value
    );
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
    const defaults: CycleFormValue = {
      titre: '',
      couleur: this.colorOptions[0].value,
      proteines: 0,
      glucides: 0,
      lipides: 0,
      nombre: 0,
      typeDuree: 'jour',
    };

    if (this.mode === 'edit' && this.cycle) {
      this.form.reset({
        titre: this.cycle.titre ?? defaults.titre,
        couleur: this.cycle.couleur ?? defaults.couleur,
        proteines: this.cycle.proteines ?? defaults.proteines,
        glucides: this.cycle.glucides ?? defaults.glucides,
        lipides: this.cycle.lipides ?? defaults.lipides,
        nombre: this.cycle.nombre ?? defaults.nombre,
        typeDuree: this.cycle.typeDuree ?? defaults.typeDuree,
      });
      return;
    }

    this.form.reset(defaults);
  }
}
