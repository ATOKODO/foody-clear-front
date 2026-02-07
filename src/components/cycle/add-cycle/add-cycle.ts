import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

type TypeDuree = 'jour' | 'semaine' | 'mois';

@Component({
  selector: 'app-add-cycle',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './add-cycle.html',
  styleUrl: './add-cycle.scss',
})
export class AddCycle {
  private readonly fb = inject(FormBuilder);

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

  get couleurSelectionnee(): string {
    return (
      this.colorOptions.find(
        (option) => option.value === this.form.controls.couleur.value,
      )?.value ?? this.colorOptions[0].value
    );
  }

}
