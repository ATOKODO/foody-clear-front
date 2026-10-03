import { TranslatePipe } from '../../../app/i18n/translate-pipe';

import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  input,
  output
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CycleNutritionValue, NutritionReference } from '../../../interfaces/cycle.interface';
import { NutritionKeyMeta } from '../../../services/meta-service';
import { SlotList, SlotListItem } from '../../slot/slot-list/slot-list';
import { TemplateSummary } from '../../../interfaces/template.interface';
import {
  NutritionValueEditor,
} from '../../shared/nutrition-value-editor';

export type DaySetFormMode = 'add' | 'edit';

export interface DaySetFormValue {
  title: string;
  nutritionValues: CycleNutritionValue[];
  slotIds: number[];
  templateId: number | null;
}

@Component({
  selector: 'app-day-set-form',
  imports: [
    TranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SlotList
  ],
  templateUrl: './day-set-form.html',
  host: { style: 'display: block' },
})
export class DaySetForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly saving = input(false);
  readonly mode = input<DaySetFormMode>('add');
  readonly daySet = input<Partial<DaySetFormValue> | null>(null);
  readonly showHeading = input(true);
  readonly inDialog = input(false);
  readonly nutritionKeys = input<NutritionKeyMeta[]>([]);
  readonly slots = input<SlotListItem[]>([]);
  readonly templates = input<TemplateSummary[]>([]);

  readonly submitted = output<{
    mode: DaySetFormMode;
    value: DaySetFormValue;
}>();
  readonly menuClicked = output<void>();

  nutritionValues: CycleNutritionValue[] = [];
  private readonly nutritionValueEditor = new NutritionValueEditor(() => this.nutritionKeys());
  selectedSlotIds: number[] = [];
  selectedTemplateId: number | null = null;
  readonly referenceOptions: { label: string; value: NutritionReference }[] = [
    { label: 'Pour 100 g', value: 'PER_100G' },
    { label: 'Pour 100 ml', value: 'PER_100ML' },
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['daySet'] || changes['nutritionKeys']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode() === 'edit' ? 'Edit day set' : 'Add day set';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nutritionValues = this.nutritionValueEditor.normalizeValuesForSubmission(
      this.nutritionValues,
    );

    this.submitted.emit({
      mode: this.mode(),
      value: {
        ...this.form.getRawValue(),
        nutritionValues,
        slotIds: [...this.selectedSlotIds],
        templateId: this.selectedTemplateId,
      },
    });
  }

  onSlotsSelected(slots: SlotListItem[]): void {
    this.selectedSlotIds = this.normalizeSlotIds(
      slots
        .map((slot) => Number(slot.id))
        .filter((id) => Number.isFinite(id)),
    );
  }

  get selectedSlotIdsAsString(): string[] {
    return this.selectedSlotIds.map(String);
  }

  addNutritionValue(): void {
    this.nutritionValues = [...this.nutritionValues, this.nutritionValueEditor.createDefaultValue()];
  }

  removeNutritionValue(index: number): void {
    this.nutritionValues = this.nutritionValues.filter((_, i) => i !== index);
  }

  onNutritionKeyChange(index: number): void {
    const row = this.nutritionValues[index];
    if (!row) {
      return;
    }

    this.nutritionValueEditor.ensureUnit(row);
  }

  getUnitsForKey(nutritionKey: string): string[] {
    return this.nutritionValueEditor.getUnitsForKey(nutritionKey);
  }

  private applyInputState(): void {
    const defaults: DaySetFormValue = {
      title: '',
      nutritionValues: this.nutritionValueEditor.createDefaultValues(),
      slotIds: [],
      templateId: null,
    };

    const daySet = this.daySet();
    if (this.mode() === 'edit' && daySet) {
      this.form.reset({
        title: daySet.title ?? defaults.title,
      });
      this.selectedSlotIds = this.normalizeSlotIds(daySet.slotIds ?? defaults.slotIds);
      this.selectedTemplateId = this.normalizeTemplateId(
        daySet.templateId ?? defaults.templateId,
      );
      this.nutritionValues =
        daySet.nutritionValues && daySet.nutritionValues.length > 0
          ? this.nutritionValueEditor.cloneValues(daySet.nutritionValues)
          : this.nutritionValueEditor.createDefaultValues();
      return;
    }

    this.form.reset({ title: defaults.title });
    this.selectedSlotIds = [...defaults.slotIds];
    this.selectedTemplateId = defaults.templateId;
    this.nutritionValues = this.nutritionValueEditor.cloneValues(defaults.nutritionValues);
  }

  private normalizeSlotIds(slotIds: number[]): number[] {
    return Array.from(new Set(slotIds.filter((id) => Number.isInteger(id) && id > 0)));
  }

  private normalizeTemplateId(templateId: number | null | undefined): number | null {
    return typeof templateId === 'number' && Number.isInteger(templateId) && templateId > 0
      ? templateId
      : null;
  }
}
