import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  input,
  output,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NutritionKeyMeta } from '../../../services/meta-service';
import { CycleNutritionValue } from '../../../interfaces/cycle.interface';
import {
  DaySetList,
  DaySetListItem,
} from '../../day-set/day-set-list/day-set-list';
import { SlotList, SlotListItem } from '../../slot/slot-list/slot-list';
import { TemplateSummary } from '../../../interfaces/template.interface';
import {
  getFallbackUnitsForNutritionKey,
  resolveDefaultNutritionKeys,
} from '../../shared/default-nutrition-values';
import { resolveCycleToneClass } from '../../shared/cycle-tone';

export type TypeDuree = 'jour' | 'semaine' | 'mois';
export type CycleFormMode = 'add' | 'edit';

export interface CycleFormValue {
  titre: string;
  couleur: string;
  nutritionValues: CycleNutritionValue[];
  nombre: number;
  typeDuree: TypeDuree;
  durationDays: number;
  slotIds: number[];
  defaultTemplateId: number | null;
  daySetIds: number[];
  daySetOrder: number[];
}

interface CycleTimelineSlot {
  index: number;
  dayNumber: number;
  daySetId: number;
  title: string;
  isDefault: boolean;
  isOverflow: boolean;
}

interface DurationPreset {
  label: string;
  days: number;
  legacyCount: number;
  legacyType: TypeDuree;
}

@Component({
  selector: 'app-form-cycle',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DaySetList,
    SlotList,
  ],
  templateUrl: './form-cycle.html',
  styleUrl: './form-cycle.scss',
})
export class FormCycle implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly defaultDaySetId = 0;

  readonly saving = input(false);
  readonly mode = input<CycleFormMode>('add');
  readonly cycle = input<Partial<CycleFormValue> | null>(null);
  readonly nutritionKeys = input<NutritionKeyMeta[]>([]);
  readonly daySets = input<DaySetListItem[]>([]);
  readonly slots = input<SlotListItem[]>([]);
  readonly templates = input<TemplateSummary[]>([]);
  readonly showHeading = input(true);
  readonly inDialog = input(false);
  readonly resolveCycleToneClass = resolveCycleToneClass;

  readonly submitted = output<{
    mode: CycleFormMode;
    value: CycleFormValue;
  }>();

  nutritionValues: CycleNutritionValue[] = [];
  selectedSlotIds: number[] = [];
  selectedDefaultTemplateId: number | null = null;
  daySetTimeline: number[] = [];
  showSelectionError = false;

  readonly colorOptions = [
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
    { label: 'Green', value: 'green' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Orange', value: 'orange' },
    { label: 'Purple', value: 'purple' },
    { label: 'Pink', value: 'pink' },
  ];

  readonly durationPresets: DurationPreset[] = [
    { label: '7 days', days: 7, legacyCount: 1, legacyType: 'semaine' },
    { label: '14 days', days: 14, legacyCount: 2, legacyType: 'semaine' },
    { label: '28 days', days: 28, legacyCount: 28, legacyType: 'jour' },
    { label: '29 days', days: 29, legacyCount: 29, legacyType: 'jour' },
    { label: '30 days', days: 30, legacyCount: 30, legacyType: 'jour' },
    { label: '31 days', days: 31, legacyCount: 31, legacyType: 'jour' },
  ];

  readonly form = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    couleur: [this.colorOptions[0].value],
    nombre: [1, [Validators.min(1)]],
    typeDuree: this.fb.nonNullable.control<TypeDuree>('jour'),
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
    return this.mode() === 'edit' ? 'Edit cycle' : 'Add cycle';
  }

  get couleurSelectionnee(): string {
    return (
      this.colorOptions.find(
        (option) => option.value === this.form.controls.couleur.value,
      )?.value ?? this.colorOptions[0].value
    );
  }

  get durationDays(): number {
    return this.normalizePositiveInteger(
      this.form.controls.durationDays.value,
      0,
    );
  }

  get maxSelectableDaySets(): number {
    return this.durationDays;
  }

  get selectedDaySetIds(): number[] {
    return this.extractAssignedDaySetIds(this.daySetTimeline);
  }

  get selectedDaySetIdsAsString(): string[] {
    return this.selectedDaySetIds.map(String);
  }

  get timelineSlots(): CycleTimelineSlot[] {
    return this.daySetTimeline.map((daySetId, index) => ({
      index,
      dayNumber: index + 1,
      daySetId,
      title:
        daySetId > this.defaultDaySetId
          ? this.getDaySetTitle(daySetId)
          : 'Cycle target',
      isDefault: daySetId === this.defaultDaySetId,
      isOverflow: index >= this.maxSelectableDaySets,
    }));
  }

  get hasSelectedDaySetOverflow(): boolean {
    return this.daySetTimeline.some(
      (daySetId, index) =>
        index >= this.maxSelectableDaySets && daySetId > this.defaultDaySetId,
    );
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.hasSelectedDaySetOverflow;
  }

  onSubmit(): void {
    if (this.saving()) return;
    if (this.form.invalid || this.hasSelectedDaySetOverflow) {
      this.form.markAllAsTouched();
      this.showSelectionError = true;
      return;
    }

    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');
    const durationDays = this.normalizePositiveInteger(
      this.form.controls.durationDays.value,
      1,
    );
    const daySetOrder = this.serializeDaySetTimeline(durationDays);

    this.submitted.emit({
      mode: this.mode(),
      value: {
        ...this.form.getRawValue(),
        nutritionValues,
        durationDays,
        slotIds: [...this.selectedSlotIds],
        defaultTemplateId: this.selectedDefaultTemplateId,
        daySetIds: this.extractAssignedDaySetIds(daySetOrder),
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
    const nextTimeline = this.daySetTimeline.map((daySetId) =>
      daySetId > this.defaultDaySetId && !nextSelectionSet.has(daySetId)
        ? this.defaultDaySetId
        : daySetId,
    );
    const assignedIds = new Set(this.extractAssignedDaySetIds(nextTimeline));

    nextSelection.forEach((daySetId) => {
      if (assignedIds.has(daySetId)) {
        return;
      }

      const nextDefaultIndex = nextTimeline.findIndex(
        (slotDaySetId, index) =>
          index < this.maxSelectableDaySets &&
          slotDaySetId === this.defaultDaySetId,
      );
      if (nextDefaultIndex === -1) {
        return;
      }

      nextTimeline[nextDefaultIndex] = daySetId;
      assignedIds.add(daySetId);
    });

    this.daySetTimeline = this.reconcileDaySetTimeline(nextTimeline);
    this.showSelectionError = this.hasSelectedDaySetOverflow;
  }

  onSlotsSelected(slots: SlotListItem[]): void {
    this.selectedSlotIds = this.normalizeSlotIds(
      slots.map((slot) => Number(slot.id)),
    );
  }

  get selectedSlotIdsAsString(): string[] {
    return this.selectedSlotIds.map(String);
  }

  onDurationDaysInput(): void {
    const durationDays = this.normalizePositiveInteger(
      this.form.controls.durationDays.value,
      0,
    );
    this.form.patchValue(
      {
        nombre: Math.max(1, durationDays),
        typeDuree: 'jour',
      },
      { emitEvent: false },
    );
    this.daySetTimeline = this.reconcileDaySetTimeline(this.daySetTimeline);
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
    this.daySetTimeline = this.reconcileDaySetTimeline(this.daySetTimeline);
    this.showSelectionError = this.hasSelectedDaySetOverflow;
  }

  onDaySetOrderDropped(event: CdkDragDrop<CycleTimelineSlot[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const updatedOrder = [...this.daySetTimeline];
    moveItemInArray(updatedOrder, event.previousIndex, event.currentIndex);
    this.daySetTimeline = updatedOrder;
  }

  removeDaySetFromOrder(daySetId: number): void {
    this.daySetTimeline = this.reconcileDaySetTimeline(
      this.daySetTimeline.map((assignedDaySetId) =>
        assignedDaySetId === daySetId ? this.defaultDaySetId : assignedDaySetId,
      ),
    );
    this.showSelectionError = this.hasSelectedDaySetOverflow;
  }

  addNutritionValue(): void {
    this.nutritionValues = [
      ...this.nutritionValues,
      this.buildDefaultNutritionValue(),
    ];
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
      row.unit = this.getFallbackUnits(row.nutritionKey)[0];
      return;
    }

    if (!allowedUnits.includes(row.unit)) {
      row.unit = allowedUnits[0];
    }
  }

  getUnitsForKey(nutritionKey: string): string[] {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    return allowedUnits.length > 0
      ? allowedUnits
      : this.getFallbackUnits(nutritionKey);
  }

  trackByTimelineSlot(_: number, slot: CycleTimelineSlot): string {
    return `${slot.index}-${slot.daySetId}`;
  }

  private applyInputState(): void {
    const defaults: CycleFormValue = {
      titre: '',
      couleur: this.colorOptions[0].value,
      nutritionValues: this.getDefaultNutritionValues(),
      nombre: 1,
      typeDuree: 'jour',
      durationDays: 1,
      slotIds: [],
      defaultTemplateId: null,
      daySetIds: [],
      daySetOrder: [this.defaultDaySetId],
    };

    const cycle = this.cycle();
    if (this.mode() === 'edit' && cycle) {
      const durationDays = this.normalizePositiveInteger(
        cycle.durationDays ?? cycle.nombre ?? defaults.durationDays,
        defaults.durationDays,
      );
      const daySetOrder = this.normalizeDaySetTimeline(
        cycle.daySetOrder ?? cycle.daySetIds ?? defaults.daySetOrder,
        durationDays,
      );

      this.form.reset({
        titre: cycle.titre ?? defaults.titre,
        couleur: cycle.couleur ?? defaults.couleur,
        nombre: this.normalizePositiveInteger(
          cycle.nombre ?? durationDays,
          durationDays,
        ),
        typeDuree: cycle.typeDuree ?? defaults.typeDuree,
        durationDays,
      });
      this.daySetTimeline = this.reconcileDaySetTimeline(daySetOrder);
      this.selectedSlotIds = this.normalizeSlotIds(
        cycle.slotIds ?? defaults.slotIds,
      );
      this.selectedDefaultTemplateId = this.normalizeTemplateId(
        cycle.defaultTemplateId ?? defaults.defaultTemplateId,
      );
      this.nutritionValues =
        cycle.nutritionValues && cycle.nutritionValues.length > 0
          ? this.cloneNutritionValues(cycle.nutritionValues)
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
    this.daySetTimeline = this.reconcileDaySetTimeline(defaults.daySetOrder);
    this.selectedSlotIds = [];
    this.selectedDefaultTemplateId = defaults.defaultTemplateId;
    this.nutritionValues = this.cloneNutritionValues(defaults.nutritionValues);
    this.showSelectionError = false;
  }

  private getDefaultNutritionValues(): CycleNutritionValue[] {
    const defaults = resolveDefaultNutritionKeys(this.nutritionKeys()).map(
      (key) => this.buildDefaultNutritionValue(key),
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

  private cloneNutritionValues(
    values: CycleNutritionValue[],
  ): CycleNutritionValue[] {
    return values.map((value) => this.normalizeNutritionValue(value));
  }

  private normalizeNutritionValue(
    value: CycleNutritionValue,
  ): CycleNutritionValue {
    const nutritionKey = (value.nutritionKey ?? '').trim();
    const amount = Number.isFinite(value.amount)
      ? Math.max(0, value.amount)
      : 0;
    const unit = this.pickDefaultUnit(nutritionKey, value.unit);
    const reference =
      value.reference === 'PER_100ML' ? 'PER_100ML' : 'PER_100G';

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
      return preferred && preferred.trim() !== ''
        ? preferred
        : this.getFallbackUnits(nutritionKey)[0];
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

    const key = this.nutritionKeys().find(
      (item) =>
        item.value.toUpperCase() === nutritionKey.toUpperCase() ||
        item.key.toUpperCase() === nutritionKey.toUpperCase(),
    );

    if (!key) {
      return [];
    }

    return key.allowedUnits.filter((unit) => unit.trim() !== '');
  }

  private getFallbackUnits(nutritionKey: string): string[] {
    return getFallbackUnitsForNutritionKey(nutritionKey);
  }

  private normalizeSlotIds(slotIds: number[]): number[] {
    return Array.from(
      new Set(slotIds.filter((id) => Number.isInteger(id) && id > 0)),
    );
  }

  private normalizeTemplateId(
    templateId: number | null | undefined,
  ): number | null {
    return typeof templateId === 'number' &&
      Number.isInteger(templateId) &&
      templateId > 0
      ? templateId
      : null;
  }

  private normalizeDaySetIds(daySetIds: number[]): number[] {
    return Array.from(
      new Set(daySetIds.filter((id) => Number.isInteger(id) && id > 0)),
    );
  }

  private normalizeDaySetTimeline(
    daySetIds: number[] | null | undefined,
    durationDays: number,
  ): number[] {
    const timeline = (daySetIds ?? [])
      .map((id) => Math.trunc(Number(id)))
      .filter((id) => Number.isInteger(id) && id >= this.defaultDaySetId);

    while (timeline.length < durationDays) {
      timeline.push(this.defaultDaySetId);
    }

    return timeline;
  }

  private reconcileDaySetTimeline(daySetTimeline: number[]): number[] {
    const timeline = [...daySetTimeline];

    while (timeline.length < this.maxSelectableDaySets) {
      timeline.push(this.defaultDaySetId);
    }

    while (
      timeline.length > this.maxSelectableDaySets &&
      timeline.at(-1) === this.defaultDaySetId
    ) {
      timeline.pop();
    }

    return timeline;
  }

  private serializeDaySetTimeline(durationDays: number): number[] {
    const timeline = this.daySetTimeline.slice(0, durationDays);

    while (timeline.length < durationDays) {
      timeline.push(this.defaultDaySetId);
    }

    return timeline.map((id) =>
      Number.isInteger(id) && id > this.defaultDaySetId
        ? id
        : this.defaultDaySetId,
    );
  }

  private extractAssignedDaySetIds(daySetTimeline: number[]): number[] {
    return Array.from(
      new Set(
        daySetTimeline.filter(
          (daySetId) => Number.isInteger(daySetId) && daySetId > 0,
        ),
      ),
    );
  }

  private getDaySetTitle(daySetId: number): string {
    const matchingDaySet = this.daySets().find(
      (daySet) => Number(daySet.id) === daySetId,
    );
    return matchingDaySet?.title ?? `Day Set ${daySetId}`;
  }

  private normalizePositiveInteger(value: unknown, fallback: number): number {
    const normalized = Math.trunc(Number(value));
    return normalized >= 1 ? normalized : fallback;
  }
}
