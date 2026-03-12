import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  CycleFormMode,
  CycleFormValue,
  FormCycle,
} from '../../components/cycle/form-cycle/form-cycle';
import {
  CycleBreakdownMetric,
  CycleBreakdownStatus,
  CycleDaySetBreakdown,
  CycleListItem,
  CycleMacroTotals,
  CycleSlotBreakdown,
  ListCycle,
} from '../../components/cycle/list-cycle/list-cycle';
import { DaySetListItem } from '../../components/day-set/day-set-list/day-set-list';
import {
  CreateCycleDto,
  Cycle,
  CycleNutritionValue,
} from '../../interfaces/cycle.interface';
import { DaySet } from '../../interfaces/day-set.interface';
import { Slot } from '../../interfaces/slot.interface';
import { CycleService } from '../../services/cycle-service';
import { DaySetService } from '../../services/day-set-service';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';
import { DaySetFeature } from '../day-set/day-set.feature';
import { SlotFeature } from '../slot/slot.feature';

type MacroTotals = CycleMacroTotals;
type CycleHubView = 'cycle' | 'daySet' | 'slot';
type MacroKey = keyof MacroTotals;

type DaySetRecord = {
  id: number;
  title: string;
  nutritionValues: CycleNutritionValue[];
  slotIds: number[] | null;
  hasSlotIdsProperty: boolean;
  slots: unknown[] | null;
  hasSlotsProperty: boolean;
};

type SlotRecord = {
  id: number | null;
  key: string;
  title: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  nutritionValues: CycleNutritionValue[];
};

type SlotResolution = {
  slots: SlotRecord[];
  hasMissingSlotBreakdown: boolean;
};

const MACRO_DEFINITIONS: Array<{ key: MacroKey; label: string }> = [
  { key: 'proteins', label: 'Proteines' },
  { key: 'carbs', label: 'Glucides' },
  { key: 'lipids', label: 'Lipides' },
];

@Component({
  selector: 'app-cycle',
  imports: [
    CommonModule,
    FormsModule,
    ListCycle,
    FormCycle,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    DaySetFeature,
    SlotFeature,
  ],
  templateUrl: './cycle.feature.html',
  styleUrl: './cycle.feature.scss',
})
export class CycleFeature implements OnInit {
  baseUrl = '';
  loading = false;
  saving = false;
  loadingMeta = false;

  cycles: Cycle[] = [];
  daySets: DaySet[] = [];
  slots: Slot[] = [];
  selectedCycleId: number | null = null;
  activeView: CycleHubView = 'cycle';

  formVisible = false;
  formMode: CycleFormMode = 'add';
  editingCycleId: number | null = null;

  formInitialValue: Partial<CycleFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  lastMetaError: unknown = null;

  nutritionKeys: NutritionKeyMeta[] = [];
  private macroNutritionKeys = {
    proteins: 'PROTEIN',
    carbs: 'CARBOHYDRATE',
    lipids: 'FAT',
  };

  constructor(
    private readonly cycleSrv: CycleService,
    private readonly daySetSrv: DaySetService,
    private readonly metaSrv: MetaService,
    private readonly slotSrv: SlotService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.cycleSrv.baseUrl;
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadCycles();
  }

  onBaseUrlChange(): void {
    this.cycleSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadCycles();
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycles.map((cycle) => this.buildCycleListItem(cycle));
  }

  get daySetListItems(): DaySetListItem[] {
    return this.daySets.map((daySet) => ({
      id: String(daySet.id),
      title: daySet.title,
      nutritionValues: daySet.nutritionValues ?? [],
    }));
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
    this.formVisible = true;
  }

  onEditRequested(item: CycleListItem): void {
    const cycle = this.cycles.find((value) => value.id === item.id);
    if (!cycle) {
      return;
    }

    this.formMode = 'edit';
    this.editingCycleId = cycle.id;
    this.selectedCycleId = cycle.id;
    this.formInitialValue = {
      titre: cycle.title,
      couleur: cycle.color,
      nutritionValues: this.getEditableNutritionValues(cycle),
      nombre: cycle.durationCount,
      typeDuree: cycle.durationType,
      daySetIds: this.resolveCycleDaySetIds(cycle),
    };
    this.formVisible = true;
  }

  onDeleteRequested(item: CycleListItem): void {
    this.saving = true;
    this.cycleSrv.remove(item.id).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: item.id };
        this.lastError = null;
        this.saving = false;

        if (this.editingCycleId === item.id) {
          this.onCancelForm();
        }

        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: CycleFormMode; value: CycleFormValue }): void {
    const payload = this.toCreateDto(event.value);
    this.saving = true;

    if (event.mode === 'edit' && this.editingCycleId !== null) {
      this.cycleSrv.update(this.editingCycleId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.formVisible = false;
          this.loadCycles();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    this.cycleSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
  }

  private buildCycleListItem(cycle: Cycle): CycleListItem {
    const cycleTotals = this.getCycleMacroTotals(cycle);
    const daySets = this.resolveCycleDaySets(cycle).map((daySet) =>
      this.buildDaySetBreakdown(daySet, cycleTotals),
    );
    const daySetTotals = this.sumMacroTotals(daySets.map((daySet) => daySet.totals));
    const daySetMetrics = this.buildMetrics(daySetTotals, cycleTotals);

    return {
      ...cycleTotals,
      id: cycle.id,
      title: cycle.title,
      color: cycle.color,
      durationCount: cycle.durationCount,
      durationType: cycle.durationType,
      daySetTotals,
      daySetMetrics,
      daySets,
      hasDaySetOverflow: this.hasOverflow(daySetMetrics),
      hasSlotOverflow: daySets.some((daySet) => daySet.hasSlotOverflow),
      hasMissingSlotBreakdown: daySets.some((daySet) => daySet.hasMissingSlotBreakdown),
    };
  }

  private buildDaySetBreakdown(
    daySet: DaySetRecord,
    cycleTotals: MacroTotals,
  ): CycleDaySetBreakdown {
    const totals = this.extractMacroTotals(daySet.nutritionValues);
    const metrics = this.buildMetrics(totals, cycleTotals);
    const slotResolution = this.resolveDaySetSlots(daySet);
    const slots = slotResolution.slots.map((slot) => this.buildSlotBreakdown(slot, totals));
    const slotTotals = this.sumMacroTotals(slots.map((slot) => slot.totals));
    const slotMetrics =
      slotResolution.hasMissingSlotBreakdown && slots.length === 0
        ? []
        : this.buildMetrics(slotTotals, totals);

    return {
      id: daySet.id,
      title: daySet.title,
      totals,
      metrics,
      slotTotals,
      slotMetrics,
      slots,
      hasSlotOverflow: this.hasOverflow(slotMetrics),
      hasMissingSlotBreakdown: slotResolution.hasMissingSlotBreakdown,
    };
  }

  private buildSlotBreakdown(
    slot: SlotRecord,
    daySetTotals: MacroTotals,
  ): CycleSlotBreakdown {
    const totals = this.extractMacroTotals(slot.nutritionValues);

    return {
      id: slot.id,
      title: slot.title,
      key: slot.key,
      timeRange: this.formatSlotRange(slot.startTime, slot.endTime),
      totals,
      metrics: this.buildMetrics(totals, daySetTotals),
    };
  }

  private buildMetrics(
    totals: MacroTotals,
    targets: MacroTotals,
  ): CycleBreakdownMetric[] {
    return MACRO_DEFINITIONS.map(({ key, label }) =>
      this.buildMetric(key, label, totals[key], targets[key]),
    );
  }

  private buildMetric(
    key: MacroKey,
    label: string,
    value: number,
    target: number,
  ): CycleBreakdownMetric {
    const normalizedValue = this.roundNumber(value);
    const normalizedTarget = this.roundNumber(target);

    return {
      key,
      label,
      value: normalizedValue,
      target: normalizedTarget,
      percentage:
        normalizedTarget > 0
          ? this.roundNumber((normalizedValue / normalizedTarget) * 100)
          : null,
      status: this.resolveMetricStatus(normalizedValue, normalizedTarget),
    };
  }

  private resolveMetricStatus(
    value: number,
    target: number,
  ): CycleBreakdownStatus {
    if (target === 0) {
      return value > 0 ? 'over' : 'exact';
    }

    if (value > target) {
      return 'over';
    }

    if (value === target) {
      return 'exact';
    }

    return 'under';
  }

  private hasOverflow(metrics: CycleBreakdownMetric[]): boolean {
    return metrics.some((metric) => metric.status === 'over');
  }

  private sumMacroTotals(values: MacroTotals[]): MacroTotals {
    return values.reduce<MacroTotals>(
      (totals, value) => ({
        proteins: this.roundNumber(totals.proteins + value.proteins),
        carbs: this.roundNumber(totals.carbs + value.carbs),
        lipids: this.roundNumber(totals.lipids + value.lipids),
      }),
      { proteins: 0, carbs: 0, lipids: 0 },
    );
  }

  private resolveCycleDaySets(cycle: Cycle): DaySetRecord[] {
    const globalById = new Map<number, DaySetRecord>();
    this.daySets.forEach((daySet) => {
      const record = this.toDaySetRecord(daySet);
      if (record) {
        globalById.set(record.id, record);
      }
    });

    const embeddedDaySets = (cycle.daySets ?? [])
      .map((daySet) => this.toDaySetRecord(daySet))
      .filter((daySet): daySet is DaySetRecord => daySet !== null);
    const embeddedById = new Map(embeddedDaySets.map((daySet) => [daySet.id, daySet]));

    if (Array.isArray(cycle.daySetOrder) && cycle.daySetOrder.length > 0) {
      const orderedDaySets = cycle.daySetOrder
        .map((id) =>
          this.mergeDaySetRecords(
            embeddedById.get(id) ?? null,
            globalById.get(id) ?? null,
          ),
        )
        .filter((daySet): daySet is DaySetRecord => daySet !== null);

      const orderedIds = new Set(orderedDaySets.map((daySet) => daySet.id));
      const extraEmbedded = embeddedDaySets
        .filter((daySet) => !orderedIds.has(daySet.id))
        .map((daySet) =>
          this.mergeDaySetRecords(daySet, globalById.get(daySet.id) ?? null),
        )
        .filter((daySet): daySet is DaySetRecord => daySet !== null);

      return [...orderedDaySets, ...extraEmbedded];
    }

    if (embeddedDaySets.length > 0) {
      return embeddedDaySets
        .map((daySet) =>
          this.mergeDaySetRecords(daySet, globalById.get(daySet.id) ?? null),
        )
        .filter((daySet): daySet is DaySetRecord => daySet !== null);
    }

    return this.resolveCycleDaySetIds(cycle)
      .map((id) => this.mergeDaySetRecords(null, globalById.get(id) ?? null))
      .filter((daySet): daySet is DaySetRecord => daySet !== null);
  }

  private mergeDaySetRecords(
    primary: DaySetRecord | null,
    fallback: DaySetRecord | null,
  ): DaySetRecord | null {
    if (!primary && !fallback) {
      return null;
    }

    if (!primary) {
      return fallback ? this.ensureDaySetTitle(fallback) : null;
    }

    if (!fallback) {
      return this.ensureDaySetTitle(primary);
    }

    return this.ensureDaySetTitle({
      id: primary.id,
      title: primary.title || fallback.title,
      nutritionValues:
        primary.nutritionValues.length > 0
          ? primary.nutritionValues
          : fallback.nutritionValues,
      slotIds: primary.hasSlotIdsProperty ? primary.slotIds : fallback.slotIds,
      hasSlotIdsProperty: primary.hasSlotIdsProperty || fallback.hasSlotIdsProperty,
      slots: primary.hasSlotsProperty ? primary.slots : fallback.slots,
      hasSlotsProperty: primary.hasSlotsProperty || fallback.hasSlotsProperty,
    });
  }

  private resolveDaySetSlots(daySet: DaySetRecord): SlotResolution {
    if (daySet.hasSlotsProperty) {
      if (daySet.slots === null) {
        return { slots: [], hasMissingSlotBreakdown: true };
      }

      if (daySet.slots.length === 0) {
        return { slots: [], hasMissingSlotBreakdown: false };
      }

      const slots: SlotRecord[] = [];
      let hasMissing = false;

      daySet.slots.forEach((slot) => {
        const resolvedSlot = this.resolveSlotReference(slot);
        if (resolvedSlot) {
          slots.push(resolvedSlot);
        } else {
          hasMissing = true;
        }
      });

      return {
        slots,
        hasMissingSlotBreakdown: hasMissing,
      };
    }

    if (daySet.hasSlotIdsProperty) {
      if (daySet.slotIds === null) {
        return { slots: [], hasMissingSlotBreakdown: true };
      }

      if (daySet.slotIds.length === 0) {
        return { slots: [], hasMissingSlotBreakdown: false };
      }

      const slots: SlotRecord[] = [];
      let hasMissing = false;

      daySet.slotIds.forEach((id) => {
        const slot = this.getSlotRecordById(id);
        if (slot) {
          slots.push(slot);
        } else {
          hasMissing = true;
        }
      });

      return {
        slots,
        hasMissingSlotBreakdown: hasMissing,
      };
    }

    return {
      slots: [],
      hasMissingSlotBreakdown: true,
    };
  }

  private resolveSlotReference(value: unknown): SlotRecord | null {
    if (typeof value === 'number') {
      return this.getSlotRecordById(value);
    }

    const embeddedSlot = this.toSlotRecord(value);
    if (!embeddedSlot) {
      return null;
    }

    if (embeddedSlot.id === null) {
      return embeddedSlot;
    }

    return this.mergeSlotRecords(
      embeddedSlot,
      this.getSlotRecordById(embeddedSlot.id),
    );
  }

  private mergeSlotRecords(
    primary: SlotRecord | null,
    fallback: SlotRecord | null,
  ): SlotRecord | null {
    if (!primary && !fallback) {
      return null;
    }

    if (!primary) {
      return fallback ? this.ensureSlotTitle(fallback) : null;
    }

    if (!fallback) {
      return this.ensureSlotTitle(primary);
    }

    return this.ensureSlotTitle({
      id: primary.id ?? fallback.id,
      key: primary.key || fallback.key,
      title: primary.title || fallback.title,
      sortOrder: primary.sortOrder !== 0 ? primary.sortOrder : fallback.sortOrder,
      startTime: primary.startTime ?? fallback.startTime,
      endTime: primary.endTime ?? fallback.endTime,
      nutritionValues:
        primary.nutritionValues.length > 0
          ? primary.nutritionValues
          : fallback.nutritionValues,
    });
  }

  private getSlotRecordById(id: number): SlotRecord | null {
    const slot = this.slots.find((value) => value.id === id);
    return slot ? this.toSlotRecord(slot) : null;
  }

  private toDaySetRecord(value: unknown): DaySetRecord | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const raw = value as Record<string, unknown>;
    const id = this.toOptionalPositiveInteger(raw['id']);
    if (id === null) {
      return null;
    }

    const title = this.readString(raw['title']) ?? '';

    return {
      id,
      title,
      nutritionValues: this.extractNutritionValues(raw['nutritionValues']),
      slotIds: this.hasOwn(raw, 'slotIds') ? this.extractIdArray(raw['slotIds']) : null,
      hasSlotIdsProperty: this.hasOwn(raw, 'slotIds'),
      slots:
        this.hasOwn(raw, 'slots') && Array.isArray(raw['slots'])
          ? raw['slots']
          : null,
      hasSlotsProperty: this.hasOwn(raw, 'slots'),
    };
  }

  private toSlotRecord(value: unknown): SlotRecord | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const raw = value as Record<string, unknown>;
    const id = this.toOptionalPositiveInteger(raw['id'] ?? raw['slotId']);
    const title = this.readString(raw['title']) ?? '';
    const key = this.readString(raw['key'] ?? raw['slotKey']) ?? '';

    if (id === null && title === '' && key === '') {
      return null;
    }

    return {
      id,
      key,
      title,
      sortOrder: this.toOptionalInteger(raw['sortOrder']) ?? 0,
      startTime: this.readString(raw['startTime']),
      endTime: this.readString(raw['endTime']),
      nutritionValues: this.extractNutritionValues(raw['nutritionValues']),
    };
  }

  private ensureDaySetTitle(record: DaySetRecord): DaySetRecord {
    return {
      ...record,
      title: record.title || `Day Set ${record.id}`,
    };
  }

  private ensureSlotTitle(record: SlotRecord): SlotRecord {
    return {
      ...record,
      title:
        record.title ||
        record.key ||
        (record.id !== null ? `Slot ${record.id}` : 'Slot'),
    };
  }

  private extractNutritionValues(value: unknown): CycleNutritionValue[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const nutritionValues: CycleNutritionValue[] = [];

    value.forEach((item) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const raw = item as Record<string, unknown>;
      const nutritionKey = this.readString(raw['nutritionKey']);
      if (!nutritionKey) {
        return;
      }

      nutritionValues.push({
        nutritionKey,
        amount: this.toNumber(raw['amount']),
        unit: this.readString(raw['unit']) ?? 'G',
        reference: raw['reference'] === 'PER_100ML' ? 'PER_100ML' : 'PER_100G',
      });
    });

    return nutritionValues;
  }

  private extractIdArray(value: unknown): number[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((item) => {
            if (typeof item === 'number') {
              return item;
            }

            if (item && typeof item === 'object' && 'id' in item) {
              return Number((item as { id: unknown }).id);
            }

            return NaN;
          })
          .filter((id): id is number => Number.isInteger(id) && id > 0),
      ),
    );
  }

  private formatSlotRange(
    startTime: string | null,
    endTime: string | null,
  ): string | null {
    const start = this.formatTimeValue(startTime);
    const end = this.formatTimeValue(endTime);

    if (start && end) {
      return `${start} - ${end}`;
    }

    return start ?? end ?? null;
  }

  private formatTimeValue(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private loadCycles(): void {
    this.loading = true;
    this.cycleSrv.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.selectedCycleId !== null &&
          !this.cycles.some((cycle) => cycle.id === this.selectedCycleId)
        ) {
          this.selectedCycleId = null;
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private loadDaySets(): void {
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
      },
      error: () => {
        this.daySets = [];
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

  private loadNutritionKeys(): void {
    this.loadingMeta = true;
    this.metaSrv.getNutritionKeys().subscribe({
      next: (nutritionKeys) => {
        this.nutritionKeys = nutritionKeys;
        this.macroNutritionKeys = {
          proteins: this.resolveNutritionKey(nutritionKeys, 'PROTEIN'),
          carbs: this.resolveNutritionKey(nutritionKeys, 'CARBOHYDRATE'),
          lipids: this.resolveNutritionKey(nutritionKeys, 'FAT'),
        };
        this.lastMetaError = null;
        this.loadingMeta = false;
      },
      error: (error) => {
        this.lastMetaError = error;
        this.loadingMeta = false;
      },
    });
  }

  private getCycleMacroTotals(cycle: Cycle): MacroTotals {
    const values = cycle.nutritionValues ?? [];
    if (values.length > 0) {
      return this.extractMacroTotals(values);
    }

    return {
      proteins: this.toNumber((cycle as Partial<Cycle>).proteins),
      carbs: this.toNumber((cycle as Partial<Cycle>).carbs),
      lipids: this.toNumber((cycle as Partial<Cycle>).lipids),
    };
  }

  private getEditableNutritionValues(cycle: Cycle): CycleNutritionValue[] {
    if (cycle.nutritionValues && cycle.nutritionValues.length > 0) {
      return cycle.nutritionValues.map((value) => ({
        nutritionKey: value.nutritionKey,
        amount: this.toNumber(value.amount),
        unit: value.unit,
        reference: value.reference,
      }));
    }

    const macros = this.getCycleMacroTotals(cycle);
    return this.buildNutritionValues(macros.proteins, macros.carbs, macros.lipids);
  }

  private extractMacroTotals(values: CycleNutritionValue[]): MacroTotals {
    const totals: MacroTotals = { proteins: 0, carbs: 0, lipids: 0 };

    values.forEach((value) => {
      const amount = this.toGrams(value.amount, value.unit);
      const key = value.nutritionKey.toUpperCase();

      if (key === this.macroNutritionKeys.proteins || key === 'PROTEIN') {
        totals.proteins += amount;
      } else if (key === this.macroNutritionKeys.carbs || key === 'CARBOHYDRATE') {
        totals.carbs += amount;
      } else if (key === this.macroNutritionKeys.lipids || key === 'FAT') {
        totals.lipids += amount;
      }
    });

    return {
      proteins: this.roundNumber(totals.proteins),
      carbs: this.roundNumber(totals.carbs),
      lipids: this.roundNumber(totals.lipids),
    };
  }

  private toCreateDto(value: CycleFormValue): CreateCycleDto {
    const nutritionValues = value.nutritionValues
      .map((nutritionValue) =>
        this.buildNutritionValue(
          nutritionValue.nutritionKey,
          nutritionValue.amount,
          nutritionValue.unit,
          nutritionValue.reference,
        ),
      )
      .filter((nutritionValue) => nutritionValue.nutritionKey.trim() !== '');

    return {
      title: value.titre,
      color: value.couleur,
      nutritionValues,
      durationCount: value.nombre,
      durationType: value.typeDuree,
      daySetIds: this.normalizeDaySetIds(value.daySetIds),
    };
  }

  private resolveCycleDaySetIds(cycle: Cycle): number[] {
    if (Array.isArray(cycle.daySetOrder) && cycle.daySetOrder.length > 0) {
      return this.normalizeDaySetIds(cycle.daySetOrder);
    }

    const daySetIds = (cycle.daySets ?? [])
      .map((daySet) => {
        if (typeof daySet !== 'object' || daySet === null || !('id' in daySet)) {
          return NaN;
        }
        return Number((daySet as { id: unknown }).id);
      })
      .filter((id): id is number => Number.isFinite(id));

    return this.normalizeDaySetIds(daySetIds);
  }

  private buildNutritionValues(
    proteins: number,
    carbs: number,
    lipids: number,
  ): CycleNutritionValue[] {
    return [
      this.buildNutritionValue(this.macroNutritionKeys.proteins, proteins),
      this.buildNutritionValue(this.macroNutritionKeys.carbs, carbs),
      this.buildNutritionValue(this.macroNutritionKeys.lipids, lipids),
    ];
  }

  private buildNutritionValue(
    nutritionKey: string,
    amount: number,
    unit?: string,
    reference?: 'PER_100G' | 'PER_100ML',
  ): CycleNutritionValue {
    const resolvedNutritionKey = this.normalizeNutritionKey(nutritionKey);
    return {
      nutritionKey: resolvedNutritionKey,
      amount: this.roundNumber(amount),
      unit: unit ?? this.resolveUnitForNutritionKey(resolvedNutritionKey),
      reference: reference ?? 'PER_100G',
    };
  }

  private normalizeNutritionKey(nutritionKey: string): string {
    const normalized = nutritionKey.trim();
    if (normalized === '') {
      return '';
    }

    const found = this.nutritionKeys.find(
      (key) =>
        key.value.toUpperCase() === normalized.toUpperCase() ||
        key.key.toUpperCase() === normalized.toUpperCase(),
    );
    return found?.value ?? normalized.toUpperCase();
  }

  private resolveNutritionKey(
    nutritionKeys: NutritionKeyMeta[],
    expectedKey: 'PROTEIN' | 'CARBOHYDRATE' | 'FAT',
  ): string {
    const found = nutritionKeys.find(
      (key) =>
        key.value.toUpperCase() === expectedKey ||
        key.key.toUpperCase() === expectedKey,
    );
    return found?.value ?? expectedKey;
  }

  private resolveUnitForNutritionKey(nutritionKey: string): string {
    const found = this.nutritionKeys.find(
      (key) =>
        key.value.toUpperCase() === nutritionKey.toUpperCase() ||
        key.key.toUpperCase() === nutritionKey.toUpperCase(),
    );
    if (!found || found.allowedUnits.length === 0) {
      return 'G';
    }

    const gramUnit = found.allowedUnits.find((unit) => unit.toUpperCase() === 'G');
    return gramUnit ?? found.allowedUnits[0];
  }

  private toGrams(amount: number, unit: string): number {
    const normalizedUnit = unit.toUpperCase();

    if (normalizedUnit === 'G') {
      return amount;
    }

    if (normalizedUnit === 'MG') {
      return amount / 1000;
    }

    return 0;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toOptionalInteger(value: unknown): number | null {
    const normalized = Number(value);
    return Number.isInteger(normalized) ? normalized : null;
  }

  private toOptionalPositiveInteger(value: unknown): number | null {
    const normalized = this.toOptionalInteger(value);
    return normalized !== null && normalized > 0 ? normalized : null;
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
  }

  private hasOwn(value: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private normalizeDaySetIds(daySetIds: number[] | null | undefined): number[] {
    return Array.from(new Set((daySetIds ?? []).filter((id) => Number.isInteger(id) && id > 0)));
  }
}
