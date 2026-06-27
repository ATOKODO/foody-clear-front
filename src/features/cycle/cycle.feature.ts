import {
  Component,
  OnInit,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
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
  CycleListItem,
  ListCycle,
} from '../../components/cycle/list-cycle/list-cycle';
import {
  buildCycleListItem,
  deriveCycleDurationPresentation,
  getCycleMacroTotals,
  resolveCycleDaySetIds,
  resolveCycleDaySetTimeline,
  resolveCycleDurationDays,
} from '../../components/cycle/list-cycle/cycle-list-item.mapper';
import { DaySetListItem } from '../../components/day-set/day-set-list/day-set-list';
import { SlotListItem } from '../../components/slot/slot-list/slot-list';
import {
  CreateCycleDto,
  CycleAssignmentGapMode,
  CycleAssignmentRescheduleScope,
  Cycle,
  CycleNutritionValue,
  UpdateCycleDto,
} from '../../interfaces/cycle.interface';
import { DaySet } from '../../interfaces/day-set.interface';
import { Slot } from '../../interfaces/slot.interface';
import { TemplateSummary } from '../../interfaces/template.interface';
import { CycleService } from '../../services/cycle-service';
import { DaySetService } from '../../services/day-set-service';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';
import { TemplateService } from '../../services/template-service';
import { DaySetFeature } from '../day-set/day-set.feature';
import { SlotFeature } from '../slot/slot.feature';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  getFallbackUnitsForNutritionKey,
  resolveDefaultNutritionKeys,
} from '../../components/shared/default-nutrition-values';
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from '../../app/ui/segmented-toggle/segmented-toggle';

type CycleHubView = 'cycle' | 'daySet' | 'slot';
type CycleImpactDialogResult = 'submitted' | 'cancelled';

type CycleHubViewConfig = {
  title: string;
  addLabel: string;
};

type CycleUpdateImpactOptions = {
  assignmentRescheduleScope: CycleAssignmentRescheduleScope;
  assignmentGapMode: CycleAssignmentGapMode;
  assignmentEffectiveDateLocal?: string;
};

const CYCLE_HUB_VIEW_CONFIG: Record<CycleHubView, CycleHubViewConfig> = {
  cycle: {
    title: 'Cycles',
    addLabel: 'Ajouter un cycle',
  },
  daySet: {
    title: 'Targets',
    addLabel: 'Ajouter un day set',
  },
  slot: {
    title: 'Slots',
    addLabel: 'Ajouter un slot',
  },
};

const CYCLE_HUB_VIEW_OPTIONS: readonly SegmentedToggleOption<CycleHubView>[] = [
  { value: 'cycle', label: 'Cycles' },
  { value: 'daySet', label: 'Targets' },
  { value: 'slot', label: 'Slots' },
];

@Component({
  selector: 'app-cycle',
  imports: [
    FormsModule,
    ListCycle,
    FormCycle,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    SegmentedToggle,
    UiErrorPanel,
    DaySetFeature,
    SlotFeature,
  ],
  templateUrl: './cycle.feature.html',
  styleUrl: './cycle.feature.scss',
})
export class CycleFeature implements OnInit {
  private readonly cycleSrv = inject(CycleService);
  private readonly daySetSrv = inject(DaySetService);
  private readonly metaSrv = inject(MetaService);
  private readonly slotSrv = inject(SlotService);
  private readonly templateSrv = inject(TemplateService);

  private readonly cycleFormDialogTemplate =
    viewChild<TemplateRef<unknown>>('cycleFormDialog');

  private readonly cycleImpactDialogTemplate =
    viewChild<TemplateRef<unknown>>('cycleImpactDialog');
  private readonly daySetFeature = viewChild(DaySetFeature);
  private readonly slotFeature = viewChild(SlotFeature);

  private readonly dialog = inject(MatDialog);

  baseUrl = '';
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly loadingMetaState = signal(false);
  private readonly loadingDaySetsState = signal(false);
  private readonly loadingSlotsState = signal(false);
  private readonly loadingTemplatesState = signal(false);

  private readonly cyclesState = signal<Cycle[]>([]);
  private readonly daySetsState = signal<DaySet[]>([]);
  private readonly slotsState = signal<Slot[]>([]);
  private readonly templatesState = signal<TemplateSummary[]>([]);
  private readonly cycleListItemsState = computed<CycleListItem[]>(() =>
    this.cyclesState().map((cycle) =>
      buildCycleListItem(cycle, {
        macroNutritionKeys: this.macroNutritionKeys,
        fallbackDaySets: this.daySetsState(),
        fallbackSlots: this.slotsState(),
      }),
    ),
  );
  private readonly daySetListItemsState = computed<DaySetListItem[]>(() =>
    this.daySetsState().map((daySet) => ({
      id: String(daySet.id),
      title: daySet.title,
      nutritionValues: daySet.nutritionValues ?? [],
    })),
  );
  private readonly slotListItemsState = computed<SlotListItem[]>(() =>
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
  private readonly templateListItemsState = computed<TemplateSummary[]>(() =>
    this.templatesState().map((template) => ({
      id: template.id,
      title: template.title,
    })),
  );

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
  readonly viewOptions = CYCLE_HUB_VIEW_OPTIONS;
  private dialogRef: MatDialogRef<unknown> | null = null;
  private impactDialogRef: MatDialogRef<unknown> | null = null;
  private readonly macroNutritionKeysState = signal({
    proteins: 'PROTEIN',
    carbs: 'CARBOHYDRATE',
    lipids: 'FAT',
  });
  private pendingCycleUpdatePayload: CreateCycleDto | null = null;

  impactScope: CycleAssignmentRescheduleScope = 'future';
  impactGapMode: CycleAssignmentGapMode = 'preserve';

  ngOnInit(): void {
    this.baseUrl = this.cycleSrv.baseUrl;
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.templateSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
    this.loadCycles();
  }

  onBaseUrlChange(): void {
    this.cycleSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.templateSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
    this.loadCycles();
  }

  private get macroNutritionKeys(): {
    proteins: string;
    carbs: string;
    lipids: string;
  } {
    return this.macroNutritionKeysState();
  }

  private set macroNutritionKeys(value: {
    proteins: string;
    carbs: string;
    lipids: string;
  }) {
    this.macroNutritionKeysState.set(value);
  }

  get loading(): boolean {
    return this.loadingState();
  }

  set loading(value: boolean) {
    this.loadingState.set(value);
  }

  get saving(): boolean {
    return this.savingState();
  }

  set saving(value: boolean) {
    this.savingState.set(value);
  }

  get loadingMeta(): boolean {
    return this.loadingMetaState();
  }

  set loadingMeta(value: boolean) {
    this.loadingMetaState.set(value);
  }

  get loadingDaySets(): boolean {
    return this.loadingDaySetsState();
  }

  set loadingDaySets(value: boolean) {
    this.loadingDaySetsState.set(value);
  }

  get loadingSlots(): boolean {
    return this.loadingSlotsState();
  }

  set loadingSlots(value: boolean) {
    this.loadingSlotsState.set(value);
  }

  get loadingTemplates(): boolean {
    return this.loadingTemplatesState();
  }

  set loadingTemplates(value: boolean) {
    this.loadingTemplatesState.set(value);
  }

  get cycles(): Cycle[] {
    return this.cyclesState();
  }

  set cycles(value: Cycle[]) {
    this.cyclesState.set(value);
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

  get templates(): TemplateSummary[] {
    return this.templatesState();
  }

  set templates(value: TemplateSummary[]) {
    this.templatesState.set(value);
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycleListItemsState();
  }

  get daySetListItems(): DaySetListItem[] {
    return this.daySetListItemsState();
  }

  get slotListItems(): SlotListItem[] {
    return this.slotListItemsState();
  }

  get templateListItems(): TemplateSummary[] {
    return this.templateListItemsState();
  }

  get formDialogTitle(): string {
    return this.formMode === 'edit' ? 'Modifier un cycle' : 'Ajouter un cycle';
  }

  get activeViewConfig(): CycleHubViewConfig {
    return CYCLE_HUB_VIEW_CONFIG[this.activeView];
  }

  get activeViewBusy(): boolean {
    const daySetFeature = this.daySetFeature();
    const slotFeature = this.slotFeature();

    switch (this.activeView) {
      case 'cycle':
        return (
          this.loading ||
          this.loadingMeta ||
          this.loadingDaySets ||
          this.loadingSlots ||
          this.loadingTemplates ||
          this.saving
        );
      case 'daySet':
        return (
          !!daySetFeature &&
          (daySetFeature.loading ||
            daySetFeature.loadingMeta ||
            daySetFeature.saving)
        );
      case 'slot':
        return (
          !!slotFeature &&
          (slotFeature.loading || slotFeature.loadingMeta || slotFeature.saving)
        );
      default:
        return false;
    }
  }

  get formDialogSubtitle(): string {
    return this.formMode === 'edit'
      ? 'Les changements sont appliques sans quitter la liste.'
      : 'Creez un cycle sans descendre en bas de page.';
  }

  get impactEffectiveDateLocal(): string {
    return this.resolveTodayDateLocal();
  }

  onRefreshRequested(): void {
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
    this.loadCycles();
  }

  onRefreshActiveView(): void {
    switch (this.activeView) {
      case 'cycle':
        this.onRefreshRequested();
        break;
      case 'daySet':
        this.daySetFeature()?.refresh();
        break;
      case 'slot':
        this.slotFeature()?.refresh();
        break;
    }
  }

  onAddActiveView(): void {
    switch (this.activeView) {
      case 'cycle':
        this.onAddRequested();
        break;
      case 'daySet':
        this.daySetFeature()?.openCreate();
        break;
      case 'slot':
        this.slotFeature()?.openCreate();
        break;
    }
  }

  onActiveViewChange(nextView: CycleHubView): void {
    this.activeView = nextView;
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
    this.openFormDialog();
  }

  onEditRequested(item: CycleListItem): void {
    const cycle = this.cycles.find((value) => value.id === item.id);
    if (!cycle) {
      return;
    }

    const durationPresentation = deriveCycleDurationPresentation(
      resolveCycleDurationDays(cycle),
    );

    this.formMode = 'edit';
    this.editingCycleId = cycle.id;
    this.selectedCycleId = cycle.id;
    this.formInitialValue = {
      titre: cycle.title,
      couleur: cycle.color,
      nutritionValues: this.getEditableNutritionValues(cycle),
      nombre: durationPresentation.durationCount,
      typeDuree: durationPresentation.durationType,
      durationDays: durationPresentation.durationDays,
      slotIds: (cycle.slots ?? []).map((slot) => slot.id),
      defaultTemplateId: cycle.defaultTemplateId ?? null,
      daySetIds: resolveCycleDaySetIds(cycle),
      daySetOrder: resolveCycleDaySetTimeline(cycle),
    };
    this.openFormDialog();
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

    if (event.mode === 'edit' && this.editingCycleId !== null) {
      if (this.shouldConfirmImpact(payload)) {
        this.openImpactDialog(payload);
        return;
      }

      this.submitCycleUpdate(this.editingCycleId, payload);
      return;
    }

    this.saving = true;
    this.cycleSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.closeFormDialog('submitted');
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onCancelForm(): void {
    this.closeFormDialog('cancelled');
  }

  confirmImpactUpdate(): void {
    if (
      this.pendingCycleUpdatePayload === null ||
      this.editingCycleId === null
    ) {
      return;
    }

    this.submitCycleUpdate(
      this.editingCycleId,
      this.pendingCycleUpdatePayload,
      {
        assignmentRescheduleScope: this.impactScope,
        assignmentGapMode: this.impactGapMode,
        assignmentEffectiveDateLocal:
          this.impactScope === 'future'
            ? this.resolveTodayDateLocal()
            : undefined,
      },
    );
  }

  cancelImpactUpdate(): void {
    this.closeImpactDialog('cancelled');
  }

  onLinkedDataChanged(): void {
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
    this.loadCycles();
  }

  private openFormDialog(): void {
    const cycleFormDialogTemplate = this.cycleFormDialogTemplate();
    if (!cycleFormDialogTemplate || this.dialogRef !== null) {
      this.formVisible = this.dialogRef !== null;
      return;
    }

    this.formVisible = true;
    this.dialogRef = this.dialog.open(cycleFormDialogTemplate, {
      width: '1100px',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
      this.resetFormState();
    });
  }

  private closeFormDialog(result: 'submitted' | 'cancelled'): void {
    if (this.impactDialogRef !== null) {
      this.impactDialogRef.close(result);
    }

    if (this.dialogRef !== null) {
      this.dialogRef.close(result);
      return;
    }

    this.resetFormState();
  }

  private openImpactDialog(payload: CreateCycleDto): void {
    this.pendingCycleUpdatePayload = payload;
    this.impactScope = 'future';
    this.impactGapMode = 'preserve';

    const cycleImpactDialogTemplate = this.cycleImpactDialogTemplate();
    if (!cycleImpactDialogTemplate || this.impactDialogRef !== null) {
      return;
    }

    this.impactDialogRef = this.dialog.open(cycleImpactDialogTemplate, {
      width: '560px',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      disableClose: this.saving,
    });

    this.impactDialogRef.afterClosed().subscribe(() => {
      this.impactDialogRef = null;
      this.pendingCycleUpdatePayload = null;
    });
  }

  private closeImpactDialog(result: CycleImpactDialogResult): void {
    if (this.impactDialogRef !== null) {
      this.impactDialogRef.close(result);
      return;
    }

    this.pendingCycleUpdatePayload = null;
  }

  private resetFormState(): void {
    if (this.impactDialogRef !== null) {
      this.impactDialogRef.close('cancelled');
    }

    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
    this.pendingCycleUpdatePayload = null;
    this.impactScope = 'future';
    this.impactGapMode = 'preserve';
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
    this.loadingDaySets = true;
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
        this.loadingDaySets = false;
      },
      error: () => {
        this.daySets = [];
        this.loadingDaySets = false;
      },
    });
  }

  private loadSlots(): void {
    this.loadingSlots = true;
    this.slotSrv.findAll().subscribe({
      next: (response) => {
        this.slots = response;
        this.loadingSlots = false;
      },
      error: () => {
        this.slots = [];
        this.loadingSlots = false;
      },
    });
  }

  private loadTemplates(): void {
    this.loadingTemplates = true;
    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templates = response.map((template) => ({
          id: template.id,
          title: template.title,
        }));
        this.loadingTemplates = false;
      },
      error: () => {
        this.templates = [];
        this.loadingTemplates = false;
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

  private getEditableNutritionValues(cycle: Cycle): CycleNutritionValue[] {
    if (cycle.nutritionValues && cycle.nutritionValues.length > 0) {
      return cycle.nutritionValues.map((value) => ({
        nutritionKey: value.nutritionKey,
        amount: this.toNumber(value.amount),
        unit: value.unit,
        reference: value.reference,
      }));
    }

    const macros = getCycleMacroTotals(cycle, this.macroNutritionKeys);
    return this.buildNutritionValues(
      macros.proteins,
      macros.carbs,
      macros.lipids,
    );
  }

  private toCreateDto(value: CycleFormValue): CreateCycleDto {
    const durationPresentation = deriveCycleDurationPresentation(
      this.normalizePositiveInteger(value.durationDays, 1),
    );
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
      durationDays: durationPresentation.durationDays,
      durationCount: durationPresentation.durationCount,
      durationType: durationPresentation.durationType,
      slotIds: value.slotIds,
      defaultTemplateId: this.normalizeTemplateId(value.defaultTemplateId),
      daySetIds: this.normalizeDaySetIds(value.daySetOrder),
      daySetOrder: this.normalizeDaySetTimeline(value.daySetOrder),
    };
  }

  private submitCycleUpdate(
    cycleId: number,
    payload: CreateCycleDto,
    impactOptions?: CycleUpdateImpactOptions,
  ): void {
    const updatePayload: UpdateCycleDto = {
      ...payload,
      ...impactOptions,
    };

    this.saving = true;
    this.cycleSrv.update(cycleId, updatePayload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.closeFormDialog('submitted');
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  private shouldConfirmImpact(payload: CreateCycleDto): boolean {
    if (this.editingCycleId === null) {
      return false;
    }

    const existingCycle = this.cycles.find(
      (cycle) => cycle.id === this.editingCycleId,
    );
    if (!existingCycle) {
      return false;
    }

    return resolveCycleDurationDays(existingCycle) !== payload.durationDays;
  }

  private resolveTodayDateLocal(): string {
    return DateTime.local().toFormat('yyyy-LL-dd');
  }

  private buildNutritionValues(
    proteins: number,
    carbs: number,
    lipids: number,
  ): CycleNutritionValue[] {
    const [energyKey] = resolveDefaultNutritionKeys(this.nutritionKeys);
    const energyKcal = this.roundNumber(proteins * 4 + carbs * 4 + lipids * 9);

    return [
      this.buildNutritionValue(energyKey, energyKcal),
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
      return getFallbackUnitsForNutritionKey(nutritionKey)[0];
    }

    const gramUnit = found.allowedUnits.find(
      (unit) => unit.toUpperCase() === 'G',
    );
    return gramUnit ?? found.allowedUnits[0];
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
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

  private normalizeDaySetIds(daySetIds: number[] | null | undefined): number[] {
    return Array.from(
      new Set((daySetIds ?? []).filter((id) => Number.isInteger(id) && id > 0)),
    );
  }

  private normalizeDaySetTimeline(
    daySetOrder: number[] | null | undefined,
  ): number[] {
    return (daySetOrder ?? [])
      .map((id) => Math.trunc(Number(id)))
      .filter((id) => Number.isInteger(id) && id >= 0);
  }

  private normalizePositiveInteger(value: unknown, fallback: number): number {
    const normalized = Math.trunc(Number(value));
    return normalized >= 1 ? normalized : fallback;
  }
}
