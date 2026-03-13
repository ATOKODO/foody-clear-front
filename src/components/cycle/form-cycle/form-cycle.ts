import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
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
import {
  DaySetList,
  DaySetListItem,
} from '../../day-set/day-set-list/day-set-list';

export type TypeDuree = 'jour' | 'semaine' | 'mois';
export type CycleFormMode = 'add' | 'edit';

export interface CycleFormValue {
  titre: string;
  couleur: string;
  nutritionValues: CycleNutritionValue[];
  nombre: number;
  typeDuree: TypeDuree;
  durationDays: number;
  daySetIds: number[];
  daySetOrder: number[];
}

type DurationPreset = {
  label: string;
  days: number;
  legacyCount: number;
  legacyType: TypeDuree;
};

@Component({
  selector: 'app-form-cycle',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DaySetList,
  ],
  templateUrl: './form-cycle.html',
  styleUrl: './form-cycle.scss',
})
export class FormCycle implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: CycleFormMode = 'add';
  @Input() cycle: Partial<CycleFormValue> | null = null;
  @Input() nutritionKeys: NutritionKeyMeta[] = [];
  @Input() daySets: DaySetListItem[] = [];

  @Output() readonly submitted = new EventEmitter<{
    mode: CycleFormMode;
    value: CycleFormValue;
  }>();

  nutritionValues: CycleNutritionValue[] = [];
  selectedDaySetOrder: number[] = [];
  showSelectionError = false;
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

  readonly durationPresets: DurationPreset[] = [
    { label: '7 jours', days: 7, legacyCount: 1, legacyType: 'semaine' },
    { label: '14 jours', days: 14, legacyCount: 2, legacyType: 'semaine' },
    { label: '28 jours', days: 28, legacyCount: 28, legacyType: 'jour' },
    { label: '29 jours', days: 29, legacyCount: 29, legacyType: 'jour' },
    { label: '30 jours', days: 30, legacyCount: 30, legacyType: 'jour' },
    { label: '31 jours', days: 31, legacyCount: 31, legacyType: 'jour' },
  ];

  readonly form = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    couleur: [this.colorOptions[0].value],
    nombre: [1, [Validators.min(1)]],
    typeDuree: ['jour' as TypeDuree],
    durationDays: [1, [Validators.required, Validators.min(1)]],
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

  get durationDays(): number {
    return this.normalizePositiveInteger(this.form.controls.durationDays.value, 0);
  }

  get maxSelectableDaySets(): number {
    return this.durationDays;
  }

  get selectedDaySetIds(): number[] {
    return [...this.selectedDaySetOrder];
  }

  get selectedDaySetIdsAsString(): string[] {
    return this.selectedDaySetOrder.map((id) => String(id));
  }

  get selectedDaySetsInOrder(): DaySetListItem[] {
    const daySetById = new Map(this.daySets.map((daySet) => [Number(daySet.id), daySet]));

    return this.selectedDaySetOrder.map((id) => {
      const item = daySetById.get(id);
      if (item) {
        return item;
      }

      return {
        id: String(id),
        title: `Day Set ${id}`,
      };
    });
  }

  get hasSelectedDaySetOverflow(): boolean {
    return this.selectedDaySetOrder.length > this.maxSelectableDaySets;
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.hasSelectedDaySetOverflow;
  }

  onSubmit(): void {
    if (this.form.invalid || this.hasSelectedDaySetOverflow) {
      this.form.markAllAsTouched();
      this.showSelectionError = true;
      return;
    }

    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');
    const durationDays = this.normalizePositiveInteger(this.form.controls.durationDays.value, 1);
    const daySetOrder = this.normalizeDaySetIds(this.selectedDaySetOrder);

    this.submitted.emit({
      mode: this.mode,
      value: {
        ...this.form.getRawValue(),
        nutritionValues,
        durationDays,
        daySetIds: [...daySetOrder],
        daySetOrder,
      },
    });
  }

  onDaySetsSelected(daySets: DaySetListItem[]): void {
    const nextSelection = this.normalizeDaySetIds(
      daySets
        .map((daySet) => Number(daySet.id))
        .filter((id) => Number.isFinite(id)),
    );
    const nextSelectionSet = new Set(nextSelection);
    const keptSelection = this.selectedDaySetOrder.filter((id) => nextSelectionSet.has(id));
    const keptSet = new Set(keptSelection);
    const appendedSelection = nextSelection.filter((id) => !keptSet.has(id));

    this.selectedDaySetOrder = [...keptSelection, ...appendedSelection];
    this.showSelectionError = this.hasSelectedDaySetOverflow;
  }

  onDurationDaysInput(): void {
    const durationDays = this.normalizePositiveInteger(this.form.controls.durationDays.value, 0);
    this.form.patchValue(
      {
        nombre: Math.max(1, durationDays),
        typeDuree: 'jour',
      },
      { emitEvent: false },
    );
    this.showSelectionError = this.hasSelectedDaySetOverflow;
  }

  applyDurationPreset(preset: DurationPreset): void {
    this.form.patchValue(
      {
        durationDays: preset.days,
        nombre: preset.legacyCount,
        typeDuree: preset.legacyType,
      },
      { emitEvent: false },
    );
    this.showSelectionError = this.hasSelectedDaySetOverflow;
  }

  onDaySetOrderDropped(event: CdkDragDrop<DaySetListItem[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const updatedOrder = [...this.selectedDaySetOrder];
    moveItemInArray(updatedOrder, event.previousIndex, event.currentIndex);
    this.selectedDaySetOrder = updatedOrder;
  }

  removeDaySetFromOrder(daySetId: number): void {
    this.selectedDaySetOrder = this.selectedDaySetOrder.filter((id) => id !== daySetId);
    this.showSelectionError = this.hasSelectedDaySetOverflow;
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

  trackByDaySetId(_: number, daySet: DaySetListItem): string {
    return daySet.id;
  }

  private applyInputState(): void {
    const defaults: CycleFormValue = {
      titre: '',
      couleur: this.colorOptions[0].value,
      nutritionValues: this.getDefaultNutritionValues(),
      nombre: 1,
      typeDuree: 'jour',
      durationDays: 1,
      daySetIds: [],
      daySetOrder: [],
    };

    if (this.mode === 'edit' && this.cycle) {
      const durationDays = this.normalizePositiveInteger(
        this.cycle.durationDays ?? this.cycle.nombre ?? defaults.durationDays,
        defaults.durationDays,
      );
      const daySetOrder = this.normalizeDaySetIds(
        this.cycle.daySetOrder ?? this.cycle.daySetIds ?? defaults.daySetOrder,
      );

      this.form.reset({
        titre: this.cycle.titre ?? defaults.titre,
        couleur: this.cycle.couleur ?? defaults.couleur,
        nombre: this.normalizePositiveInteger(this.cycle.nombre ?? durationDays, durationDays),
        typeDuree: this.cycle.typeDuree ?? defaults.typeDuree,
        durationDays,
      });
      this.selectedDaySetOrder = daySetOrder;
      this.nutritionValues =
        this.cycle.nutritionValues && this.cycle.nutritionValues.length > 0
          ? this.cloneNutritionValues(this.cycle.nutritionValues)
          : this.getDefaultNutritionValues();
      this.showSelectionError = this.hasSelectedDaySetOverflow;
      return;
    }

    this.form.reset({
      titre: defaults.titre,
      couleur: defaults.couleur,
      nombre: defaults.nombre,
      typeDuree: defaults.typeDuree,
      durationDays: defaults.durationDays,
    });
    this.selectedDaySetOrder = [...defaults.daySetOrder];
    this.nutritionValues = this.cloneNutritionValues(defaults.nutritionValues);
    this.showSelectionError = false;
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

  private normalizeDaySetIds(daySetIds: number[]): number[] {
    return Array.from(new Set(daySetIds.filter((id) => Number.isInteger(id) && id > 0)));
  }

  private normalizePositiveInteger(value: unknown, fallback: number): number {
    const normalized = Math.trunc(Number(value));
    return normalized >= 1 ? normalized : fallback;
  }
}
