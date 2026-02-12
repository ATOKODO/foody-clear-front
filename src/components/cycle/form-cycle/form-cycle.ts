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
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NutritionKeyMeta } from '../../../services/meta-service';
import { CycleNutritionValue, NutritionReference } from '../../../interfaces/cycle.interface';

export type TypeDuree = 'jour' | 'semaine' | 'mois';
export type CycleFormMode = 'add' | 'edit';

export interface CycleFormValue {
  titre: string;
  couleur: string;
  nutritionValues: CycleNutritionValue[];
  nombre: number;
  typeDuree: TypeDuree;
}

@Component({
  selector: 'app-form-cycle',
  imports: [
    CommonModule,
    FormsModule,
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
  @Input() nutritionKeys: NutritionKeyMeta[] = [];

  @Output() readonly submitted = new EventEmitter<{
    mode: CycleFormMode;
    value: CycleFormValue;
  }>();

  nutritionValues: CycleNutritionValue[] = [];
  readonly referenceOptions: Array<{ label: string; value: NutritionReference }> = [
    { label: 'Pour 100 g', value: 'PER_100G' },
    { label: 'Pour 100 ml', value: 'PER_100ML' },
  ];

  readonly colorOptions = [
    { label: 'Rouge', value: 'red' },
    { label: 'Bleu', value: 'blue' },
    { label: 'Vert', value: 'green' },
    { label: 'Jaune', value: 'yellow' },
    { label: 'Orange', value: 'orange' },
    { label: 'Violet', value: 'purple' },
    { label: 'Rose', value: 'pink' },
  ];

  readonly durationOptions: { label: string; value: TypeDuree }[] = [
    { label: 'Jour', value: 'jour' },
    { label: 'Semaine', value: 'semaine' },
    { label: 'Mois', value: 'mois' },
  ];

  readonly form = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    couleur: [this.colorOptions[0].value],
    nombre: [0, [Validators.min(0)]],
    typeDuree: ['jour' as TypeDuree],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['cycle'] || changes['nutritionKeys']) {
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

    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');

    this.submitted.emit({
      mode: this.mode,
      value: {
        ...this.form.getRawValue(),
        nutritionValues,
      },
    });
  }

  addNutritionValue(): void {
    this.nutritionValues = [...this.nutritionValues, this.buildDefaultNutritionValue()];
  }

  removeNutritionValue(index: number): void {
    this.nutritionValues = this.nutritionValues.filter((_, i) => i !== index);
  }

  onNutritionKeyChange(index: number): void {
    const row = this.nutritionValues[index];
    if (!row) {
      return;
    }

    const allowedUnits = this.getAllowedUnits(row.nutritionKey);
    if (allowedUnits.length === 0) {
      row.unit = 'G';
      return;
    }

    if (!allowedUnits.includes(row.unit)) {
      row.unit = allowedUnits[0];
    }
  }

  getUnitsForKey(nutritionKey: string): string[] {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    return allowedUnits.length > 0 ? allowedUnits : ['G', 'MG'];
  }

  private applyInputState(): void {
    const defaults: CycleFormValue = {
      titre: '',
      couleur: this.colorOptions[0].value,
      nutritionValues: this.getDefaultNutritionValues(),
      nombre: 0,
      typeDuree: 'jour',
    };

    if (this.mode === 'edit' && this.cycle) {
      this.form.reset({
        titre: this.cycle.titre ?? defaults.titre,
        couleur: this.cycle.couleur ?? defaults.couleur,
        nombre: this.cycle.nombre ?? defaults.nombre,
        typeDuree: this.cycle.typeDuree ?? defaults.typeDuree,
      });
      this.nutritionValues =
        this.cycle.nutritionValues && this.cycle.nutritionValues.length > 0
          ? this.cloneNutritionValues(this.cycle.nutritionValues)
          : this.getDefaultNutritionValues();
      return;
    }

    this.form.reset({
      titre: defaults.titre,
      couleur: defaults.couleur,
      nombre: defaults.nombre,
      typeDuree: defaults.typeDuree,
    });
    this.nutritionValues = this.cloneNutritionValues(defaults.nutritionValues);
  }

  private getDefaultNutritionValues(): CycleNutritionValue[] {
    const defaults = ['PROTEIN', 'CARBOHYDRATE', 'FAT'].map((key) =>
      this.buildDefaultNutritionValue(key),
    );
    return this.cloneNutritionValues(defaults);
  }

  private buildDefaultNutritionValue(nutritionKey = ''): CycleNutritionValue {
    const unit = this.pickDefaultUnit(nutritionKey);
    return {
      nutritionKey,
      amount: 0,
      unit,
      reference: 'PER_100G',
    };
  }

  private cloneNutritionValues(values: CycleNutritionValue[]): CycleNutritionValue[] {
    return values.map((value) => this.normalizeNutritionValue(value));
  }

  private normalizeNutritionValue(value: CycleNutritionValue): CycleNutritionValue {
    const nutritionKey = (value.nutritionKey ?? '').trim();
    const amount = Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0;
    const unit = this.pickDefaultUnit(nutritionKey, value.unit);
    const reference = value.reference === 'PER_100ML' ? 'PER_100ML' : 'PER_100G';

    return {
      nutritionKey,
      amount,
      unit,
      reference,
    };
  }

  private pickDefaultUnit(nutritionKey: string, preferred?: string): string {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    if (allowedUnits.length === 0) {
      return preferred && preferred.trim() !== '' ? preferred : 'G';
    }

    if (preferred && allowedUnits.includes(preferred)) {
      return preferred;
    }

    const gramUnit = allowedUnits.find((unit) => unit.toUpperCase() === 'G');
    return gramUnit ?? allowedUnits[0];
  }

  private getAllowedUnits(nutritionKey: string): string[] {
    if (nutritionKey.trim() === '') {
      return [];
    }

    const key = this.nutritionKeys.find(
      (item) =>
        item.value.toUpperCase() === nutritionKey.toUpperCase() ||
        item.key.toUpperCase() === nutritionKey.toUpperCase(),
    );

    if (!key) {
      return [];
    }

    return key.allowedUnits.filter((unit) => unit.trim() !== '');
  }
}
