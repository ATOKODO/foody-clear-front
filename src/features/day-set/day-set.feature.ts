import { DOCUMENT } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  DaySetForm,
  DaySetFormMode,
  DaySetFormValue,
} from '../../components/day-set/day-set-form/day-set-form';
import {
  DaySetList,
  DaySetListItem,
} from '../../components/day-set/day-set-list/day-set-list';
import { SlotListItem } from '../../components/slot/slot-list/slot-list';
import { CycleNutritionValue } from '../../interfaces/cycle.interface';
import { CreateDaySetDto, DaySet } from '../../interfaces/day-set.interface';
import { Slot } from '../../interfaces/slot.interface';
import { DaySetService } from '../../services/day-set-service';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';
import { TemplateSummary } from '../../interfaces/template.interface';
import { TemplateService } from '../../services/template-service';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';

@Component({
  selector: 'app-day-set-feature',
  imports: [MatButtonModule, MatCardModule, UiErrorPanel, DaySetList, DaySetForm],
  templateUrl: './day-set.feature.html',
  styleUrl: './day-set.feature.scss',
  host: {
    '(window:resize)': 'onWindowResize()',
  },
})
export class DaySetFeature implements OnInit {
  private readonly daySetSrv = inject(DaySetService);
  private readonly metaSrv = inject(MetaService);
  private readonly slotSrv = inject(SlotService);
  private readonly templateSrv = inject(TemplateService);

  private readonly document = inject(DOCUMENT);

  readonly embedded = input(false);
  readonly dataChanged = output<void>();

  private readonly daySetsState = signal<DaySet[]>([]);
  private readonly slotsState = signal<Slot[]>([]);
  readonly daySetListItems = computed<DaySetListItem[]>(() =>
    this.daySetsState().map((daySet) => ({
      id: String(daySet.id),
      title: daySet.title,
      nutritionValues: daySet.nutritionValues ?? [],
      templateTitle: daySet.template?.title ?? null,
    })),
  );
  readonly slotListItems = computed<SlotListItem[]>(() =>
    this.slotsState().map((slot) => ({
      id: String(slot.id),
      key: slot.key,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
      nutritionValues: slot.nutritionValues ?? [],
    })),
  );
  loading = false;
  saving = false;

  readonly formVisible = signal(false);
  formMode: DaySetFormMode = 'add';
  editingDaySetId: number | null = null;
  formInitialValue: Partial<DaySetFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  loadingMeta = false;
  lastMetaError: unknown = null;
  nutritionKeys: NutritionKeyMeta[] = [];
  templates: TemplateSummary[] = [];
  readonly embeddedDialogTopOffset = signal(0);

  ngOnInit(): void {
    this.refresh();
  }

  onWindowResize(): void {
    if (!this.formVisible() || !this.embedded()) {
      return;
    }

    this.syncEmbeddedDialogLayout();
  }

  refresh(): void {
    this.loadNutritionKeys();
    this.loadSlots();
    this.loadTemplates();
    this.loadDaySets();
  }

  get daySets(): DaySet[] {
    return this.daySetsState();
  }

  set daySets(value: DaySet[]) {
    this.daySetsState.set(value);
  }

  get slots(): Slot[] {
    return this.slotsState();
  }

  set slots(value: Slot[]) {
    this.slotsState.set(value);
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingDaySetId = null;
    this.formInitialValue = null;
    this.openForm();
  }

  openCreate(): void {
    this.onAddRequested();
  }

  onEditRequested(item: DaySetListItem): void {
    const daySetId = Number(item.id);
    if (!Number.isFinite(daySetId)) {
      return;
    }

    const daySet = this.daySets.find((value) => value.id === daySetId);
    if (!daySet) {
      return;
    }

    this.formMode = 'edit';
    this.editingDaySetId = daySet.id;
    this.formInitialValue = {
      title: daySet.title,
      nutritionValues: this.getEditableNutritionValues(daySet),
      slotIds: this.resolveDaySetSlotIds(daySet),
      templateId: daySet.template?.id ?? daySet.templateId ?? null,
    };
    this.openForm();
  }

  onDeleteRequested(item: DaySetListItem): void {
    const daySetId = Number(item.id);
    if (!Number.isFinite(daySetId)) {
      return;
    }

    this.saving = true;
    this.daySetSrv.remove(daySetId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: daySetId };
        this.lastError = null;
        this.saving = false;
        this.dataChanged.emit();

        if (this.editingDaySetId === daySetId) {
          this.onCancelForm();
        }

        this.loadDaySets();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: DaySetFormMode; value: DaySetFormValue }): void {
    const payload = this.toCreateDto(event.value);
    this.saving = true;

    if (event.mode === 'edit' && this.editingDaySetId !== null) {
      this.daySetSrv.update(this.editingDaySetId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.closeForm();
          this.dataChanged.emit();
          this.loadDaySets();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    this.daySetSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.closeForm();
        this.dataChanged.emit();
        this.loadDaySets();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu day-set-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    this.closeForm();
  }

  private openForm(): void {
    this.formVisible.set(true);
    this.syncEmbeddedDialogLayout();
  }

  private closeForm(): void {
    this.formVisible.set(false);
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingDaySetId = null;
  }

  private syncEmbeddedDialogLayout(): void {
    if (!this.embedded()) {
      this.embeddedDialogTopOffset.set(0);
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      this.embeddedDialogTopOffset.set(0);
      return;
    }

    view.requestAnimationFrame(() => {
      const header = this.document.querySelector('.app-shell__header');
      this.embeddedDialogTopOffset.set(
        header instanceof HTMLElement ? Math.ceil(header.getBoundingClientRect().bottom) : 0,
      );
    });
  }

  private loadNutritionKeys(): void {
    this.loadingMeta = true;
    this.metaSrv.getNutritionKeys().subscribe({
      next: (nutritionKeys) => {
        this.nutritionKeys = nutritionKeys;
        this.lastMetaError = null;
        this.loadingMeta = false;
      },
      error: (error) => {
        this.lastMetaError = error;
        this.loadingMeta = false;
      },
    });
  }

  private loadSlots(): void {
    this.slotSrv.findAll().subscribe({
      next: (response) => {
        this.slots = response;
      },
      error: () => {
        this.slots = [];
      },
    });
  }

  private loadDaySets(): void {
    this.loading = true;
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.editingDaySetId !== null &&
          !this.daySets.some((daySet) => daySet.id === this.editingDaySetId)
        ) {
          this.onCancelForm();
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private toCreateDto(value: DaySetFormValue): CreateDaySetDto {
    return {
      title: value.title,
      nutritionValues: this.normalizeNutritionValues(value.nutritionValues),
      slotIds: this.normalizeSlotIds(value.slotIds),
      templateId: value.templateId,
    };
  }

  private loadTemplates(): void {
    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templates = response
          .map((template) => ({
            id: template.id,
            title: template.title,
          }))
          .sort((left, right) => left.title.localeCompare(right.title, 'fr'));
      },
      error: () => {
        this.templates = [];
      },
    });
  }

  private normalizeNutritionValues(values: CycleNutritionValue[]): CycleNutritionValue[] {
    return values
      .map((value) => ({
        nutritionKey: value.nutritionKey.trim().toUpperCase(),
        amount: Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0,
        unit: value.unit,
        reference: value.reference,
      }))
      .filter((value) => value.nutritionKey !== '');
  }

  private getEditableNutritionValues(daySet: DaySet): CycleNutritionValue[] {
    if (daySet.nutritionValues && daySet.nutritionValues.length > 0) {
      return daySet.nutritionValues.map((value) => ({
        nutritionKey: value.nutritionKey,
        amount: value.amount,
        unit: value.unit,
        reference: value.reference,
      }));
    }

    return [
      {
        nutritionKey: 'PROTEIN',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'CARBOHYDRATE',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'FAT',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
    ];
  }

  private resolveDaySetSlotIds(daySet: DaySet): number[] {
    const slotIdsProperty = (daySet as DaySet & { slotIds?: number[] }).slotIds;
    if (Array.isArray(slotIdsProperty) && slotIdsProperty.length > 0) {
      return this.normalizeSlotIds(slotIdsProperty);
    }

    const slotIds = (daySet.slots ?? [])
      .map((slot) => {
        if (typeof slot === 'number') {
          return slot;
        }

        if (typeof slot === 'object' && slot !== null && 'id' in slot) {
          return Number((slot as { id: unknown }).id);
        }

        return NaN;
      })
      .filter((id): id is number => Number.isFinite(id));

    return this.normalizeSlotIds(slotIds);
  }

  private normalizeSlotIds(slotIds: number[] | null | undefined): number[] {
    return Array.from(new Set((slotIds ?? []).filter((id) => Number.isInteger(id) && id > 0)));
  }
}
