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
import { DaySetListItem } from '../../components/day-set/day-set-list/day-set-list';
import { SlotListItem } from '../../components/slot/slot-list/slot-list';
import {
  CreateCycleDto,
  CycleAssignmentGapMode,
  CycleAssignmentRescheduleScope,
  Cycle,
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
import { SegmentedToggle } from '../../app/ui/segmented-toggle/segmented-toggle';
import {
  CYCLE_HUB_VIEW_CONFIG,
  CYCLE_HUB_VIEW_OPTIONS,
  DEFAULT_CYCLE_MACRO_NUTRITION_KEYS,
  CycleHubView,
  CycleHubViewConfig,
  CycleImpactDialogResult,
  CycleUpdateImpactOptions,
  MacroNutritionKeys,
  buildCycleDaySetListItems,
  buildCycleHubListItems,
  buildCycleSlotListItems,
  buildCycleTemplateListItems,
  resolveMacroNutritionKeysFromMeta,
  shouldConfirmCycleImpact,
  toCreateCycleDto,
  toCycleFormInitialValue,
} from './cycle.viewmodel';

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
    buildCycleHubListItems(
      this.cyclesState(),
      this.macroNutritionKeys,
      this.daySetsState(),
      this.slotsState(),
    ),
  );
  private readonly daySetListItemsState = computed<DaySetListItem[]>(() =>
    buildCycleDaySetListItems(this.daySetsState()),
  );
  private readonly slotListItemsState = computed<SlotListItem[]>(() =>
    buildCycleSlotListItems(this.slotsState()),
  );
  private readonly templateListItemsState = computed<TemplateSummary[]>(() =>
    buildCycleTemplateListItems(this.templatesState()),
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
  private readonly macroNutritionKeysState = signal<MacroNutritionKeys>(
    DEFAULT_CYCLE_MACRO_NUTRITION_KEYS,
  );
  private pendingCycleUpdatePayload: CreateCycleDto | null = null;

  impactScope: CycleAssignmentRescheduleScope = 'future';
  impactGapMode: CycleAssignmentGapMode = 'preserve';

  ngOnInit(): void {
    this.baseUrl = this.cycleSrv.baseUrl;
    this.syncBaseUrls();
    this.loadCycleWorkspace();
  }

  onBaseUrlChange(): void {
    this.syncBaseUrls();
    this.loadCycleWorkspace();
  }

  private get macroNutritionKeys(): MacroNutritionKeys { return this.macroNutritionKeysState(); }
  private set macroNutritionKeys(value: MacroNutritionKeys) { this.macroNutritionKeysState.set(value); }

  get loading(): boolean { return this.loadingState(); }
  get saving(): boolean { return this.savingState(); }
  get loadingMeta(): boolean { return this.loadingMetaState(); }
  get loadingDaySets(): boolean { return this.loadingDaySetsState(); }
  get loadingSlots(): boolean { return this.loadingSlotsState(); }
  get loadingTemplates(): boolean { return this.loadingTemplatesState(); }

  get cycles(): Cycle[] { return this.cyclesState(); }
  set cycles(value: Cycle[]) { this.cyclesState.set(value); }

  get daySets(): DaySet[] { return this.daySetsState(); }
  set daySets(value: DaySet[]) { this.daySetsState.set(value); }

  get slots(): Slot[] { return this.slotsState(); }
  set slots(value: Slot[]) { this.slotsState.set(value); }

  get cycleListItems(): CycleListItem[] { return this.cycleListItemsState(); }
  get daySetListItems(): DaySetListItem[] { return this.daySetListItemsState(); }
  get slotListItems(): SlotListItem[] { return this.slotListItemsState(); }
  get templateListItems(): TemplateSummary[] { return this.templateListItemsState(); }

  get formDialogTitle(): string { return this.formMode === 'edit' ? 'Modifier un cycle' : 'Ajouter un cycle'; }

  get activeViewConfig(): CycleHubViewConfig { return CYCLE_HUB_VIEW_CONFIG[this.activeView]; }

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
    this.loadCycleWorkspace();
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

    this.formMode = 'edit';
    this.editingCycleId = cycle.id;
    this.selectedCycleId = cycle.id;
    this.formInitialValue = toCycleFormInitialValue(cycle, {
      macroNutritionKeys: this.macroNutritionKeys,
      nutritionKeys: this.nutritionKeys,
    });
    this.openFormDialog();
  }

  onDeleteRequested(item: CycleListItem): void {
    this.savingState.set(true);
    this.cycleSrv.remove(item.id).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: item.id };
        this.lastError = null;
        this.savingState.set(false);

        if (this.editingCycleId === item.id) {
          this.onCancelForm();
        }

        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.savingState.set(false);
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

    this.savingState.set(true);
    this.cycleSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.savingState.set(false);
        this.closeFormDialog('submitted');
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.savingState.set(false);
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

  private syncBaseUrls(): void {
    this.cycleSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.templateSrv.setBaseUrl(this.baseUrl);
  }

  private loadCycleWorkspace(): void {
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
    this.loadCycles();
  }

  private loadCycles(): void {
    this.loadingState.set(true);
    this.cycleSrv.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loadingState.set(false);

        if (
          this.selectedCycleId !== null &&
          !this.cycles.some((cycle) => cycle.id === this.selectedCycleId)
        ) {
          this.selectedCycleId = null;
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loadingState.set(false);
      },
    });
  }

  private loadDaySets(): void {
    this.loadingDaySetsState.set(true);
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
        this.loadingDaySetsState.set(false);
      },
      error: () => {
        this.daySets = [];
        this.loadingDaySetsState.set(false);
      },
    });
  }

  private loadSlots(): void {
    this.loadingSlotsState.set(true);
    this.slotSrv.findAll().subscribe({
      next: (response) => {
        this.slots = response;
        this.loadingSlotsState.set(false);
      },
      error: () => {
        this.slots = [];
        this.loadingSlotsState.set(false);
      },
    });
  }

  private loadTemplates(): void {
    this.loadingTemplatesState.set(true);
    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templatesState.set(buildCycleTemplateListItems(response));
        this.loadingTemplatesState.set(false);
      },
      error: () => {
        this.templatesState.set([]);
        this.loadingTemplatesState.set(false);
      },
    });
  }

  private loadNutritionKeys(): void {
    this.loadingMetaState.set(true);
    this.metaSrv.getNutritionKeys().subscribe({
      next: (nutritionKeys) => {
        this.nutritionKeys = nutritionKeys;
        this.macroNutritionKeys = resolveMacroNutritionKeysFromMeta(nutritionKeys);
        this.lastMetaError = null;
        this.loadingMetaState.set(false);
      },
      error: (error) => {
        this.lastMetaError = error;
        this.loadingMetaState.set(false);
      },
    });
  }

  private toCreateDto(value: CycleFormValue): CreateCycleDto {
    return toCreateCycleDto(value, {
      macroNutritionKeys: this.macroNutritionKeys,
      nutritionKeys: this.nutritionKeys,
    });
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

    this.savingState.set(true);
    this.cycleSrv.update(cycleId, updatePayload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.savingState.set(false);
        this.closeFormDialog('submitted');
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.savingState.set(false);
      },
    });
  }

  private shouldConfirmImpact(payload: CreateCycleDto): boolean {
    const existingCycle = this.editingCycleId === null
      ? null
      : (this.cycles.find((cycle) => cycle.id === this.editingCycleId) ?? null);

    return shouldConfirmCycleImpact(existingCycle, payload);
  }

  private resolveTodayDateLocal(): string {
    return DateTime.local().toFormat('yyyy-LL-dd');
  }

}
