import { TranslatePipe } from '../../app/i18n/translate-pipe';
import {
  Component,
  OnInit,
  TemplateRef,
  inject,
  effect,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import type {
  TemplateFormMode,
  TemplateFormSubmittedEvent,
  TemplateItemDraft,
} from '../../components/template/template-form/template-form';
import { TemplateForm } from '../../components/template/template-form/template-form';
import { TemplateList } from '../../components/template/template-list/template-list';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import type { DaySet } from '../../interfaces/day-set.interface';
import type { PreparedDish, PreparedMeal } from '../../interfaces/meal-prep.interface';
import type { Slot } from '../../interfaces/slot.interface';
import type { Template } from '../../interfaces/template.interface';
import type { Product as ProductApiModel } from '../../services/product-service';
import { TemplateFeatureStore } from './template.store';

@Component({
  selector: 'app-template',
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatProgressBarModule,
    UiErrorPanel,
    TemplateForm,
    TemplateList,
  ],
  providers: [TemplateFeatureStore],
  templateUrl: './template.feature.html',
  styleUrl: './template.feature.scss',
})
export class TemplateFeature implements OnInit {
  private readonly store = inject(TemplateFeatureStore);
  private readonly dialog = inject(MatDialog);
  private readonly templateEditorDialog = viewChild<TemplateRef<unknown>>(
    'templateEditorDialog',
  );

  readonly qtyUnitOptions = this.store.qtyUnitOptions;

  formMode: TemplateFormMode = 'add';
  editingTemplateId: number | null = null;
  private dialogRef: MatDialogRef<unknown> | null = null;

  constructor() {
    effect(() => {
      const saving = this.store.savingTemplate || this.store.savingItem;
      if (this.dialogRef) this.dialogRef.disableClose = saving;
    });
  }

  ngOnInit(): void {
    this.store.init();
  }

  get baseUrl(): string {
    return this.store.baseUrl;
  }

  set baseUrl(value: string) {
    this.store.baseUrl = value;
  }

  get templates(): Template[] {
    return this.store.templates;
  }

  set templates(value: Template[]) {
    this.store.templates = value;
  }

  get products(): ProductApiModel[] {
    return this.store.products;
  }

  set products(value: ProductApiModel[]) {
    this.store.products = value;
  }

  get dishes(): PreparedDish[] {
    return this.store.dishes;
  }

  set dishes(value: PreparedDish[]) {
    this.store.dishes = value;
  }

  get meals(): PreparedMeal[] {
    return this.store.meals;
  }

  set meals(value: PreparedMeal[]) {
    this.store.meals = value;
  }

  get daySets(): DaySet[] {
    return this.store.daySets;
  }

  set daySets(value: DaySet[]) {
    this.store.daySets = value;
  }

  get slots(): Slot[] {
    return this.store.slots;
  }

  set slots(value: Slot[]) {
    this.store.slots = value;
  }

  get selectedTemplateId(): number | null {
    return this.store.selectedTemplateId;
  }

  set selectedTemplateId(value: number | null) {
    this.store.selectedTemplateId = value;
  }

  get selectedTemplate(): Template | null {
    return this.store.selectedTemplate;
  }

  set selectedTemplate(value: Template | null) {
    this.store.selectedTemplate = value;
  }

  get compareDaySetId(): number | null {
    return this.store.compareDaySetId;
  }

  set compareDaySetId(value: number | null) {
    this.store.compareDaySetId = value;
  }

  get loadingTemplates(): boolean {
    return this.store.loadingTemplates;
  }

  set loadingTemplates(value: boolean) {
    this.store.loadingTemplates = value;
  }

  get loadingProducts(): boolean {
    return this.store.loadingProducts;
  }

  set loadingProducts(value: boolean) {
    this.store.loadingProducts = value;
  }

  get loadingMealPrep(): boolean {
    return this.store.loadingMealPrep;
  }

  set loadingMealPrep(value: boolean) {
    this.store.loadingMealPrep = value;
  }

  get loadingDaySets(): boolean {
    return this.store.loadingDaySets;
  }

  set loadingDaySets(value: boolean) {
    this.store.loadingDaySets = value;
  }

  get loadingSlots(): boolean {
    return this.store.loadingSlots;
  }

  set loadingSlots(value: boolean) {
    this.store.loadingSlots = value;
  }

  get savingTemplate(): boolean {
    return this.store.savingTemplate;
  }

  set savingTemplate(value: boolean) {
    this.store.savingTemplate = value;
  }

  get savingItem(): boolean {
    return this.store.savingItem;
  }

  set savingItem(value: boolean) {
    this.store.savingItem = value;
  }

  get lastError(): unknown {
    return this.store.lastError;
  }

  set lastError(value: unknown) {
    this.store.lastError = value;
  }

  get itemError(): string | null {
    return this.store.itemError;
  }

  set itemError(value: string | null) {
    this.store.itemError = value;
  }

  get lastResponse(): unknown {
    return this.store.lastResponse;
  }

  set lastResponse(value: unknown) {
    this.store.lastResponse = value;
  }

  get editedTemplate(): Template | null {
    if (this.editingTemplateId === null) {
      return null;
    }

    return this.selectedTemplate?.id === this.editingTemplateId
      ? this.selectedTemplate
      : null;
  }

  get formDialogTitle(): string {
    return this.formMode === 'edit'
      ? 'Edit template'
      : 'Nouveau template';
  }

  get formDialogSubtitle(): string {
    return this.formMode === 'edit'
      ? 'Update the title, lines, and stock controls for this template.'
      : 'Create a planning template, then add its product lines.';
  }

  get productOptions(): ProductApiModel[] {
    return this.store.productOptions;
  }

  get dishOptions(): PreparedDish[] {
    return this.store.dishOptions;
  }

  get mealOptions(): PreparedMeal[] {
    return this.store.mealOptions;
  }

  get daySetOptions(): DaySet[] {
    return this.store.daySetOptions;
  }

  get slotOptions(): Slot[] {
    return this.store.slotOptions;
  }

  get busy(): boolean {
    return this.store.busy;
  }

  onBaseUrlChange(): void {
    this.store.onBaseUrlChange();
  }

  onRefreshRequested(): void {
    this.store.onRefreshRequested();
  }

  startCreateTemplate(): void {
    if (this.savingTemplate || this.savingItem) return;
    this.formMode = 'add';
    this.editingTemplateId = null;
    this.itemError = null;
    this.openEditorDialog();
  }

  openSelectedTemplateEditor(): void {
    if (this.selectedTemplateId === null || !this.selectedTemplate) {
      return;
    }

    this.onTemplateEditRequested(this.selectedTemplateId);
  }

  onTemplateEditRequested(templateId: number): void {
    if (this.savingTemplate || this.savingItem) return;
    this.store.loadTemplateForEdit(templateId, (readyTemplateId) => {
      this.openTemplateEditor(readyTemplateId);
    });
  }

  onTemplateDeleteRequested(templateId: number): void {
    this.onTemplateDeleted(templateId);
  }

  selectTemplate(templateId: number): void {
    this.store.selectTemplate(templateId);
  }

  onCompareDaySetChange(compareDaySetId: number | null): void {
    this.store.onCompareDaySetChange(compareDaySetId);
  }

  onTemplateSubmitted(event: TemplateFormSubmittedEvent): void {
    this.store.saveTemplate(event, this.editingTemplateId, (template) => {
      this.formMode = 'edit';
      this.editingTemplateId = template.id;
    });
  }

  onTemplateDeleted(templateId: number): void {
    this.store.deleteTemplate(templateId, this.editingTemplateId, () => {
      this.closeEditorDialog();
    });
  }

  onItemSubmitted(itemDraft: TemplateItemDraft): void {
    this.store.saveItem(this.editingTemplateId, itemDraft, (template) => {
      this.editingTemplateId = template.id;
    });
  }

  onItemDeleted(itemId: number): void {
    this.store.deleteItem(this.editingTemplateId, itemId);
  }

  closeEditorDialog(): void {
    if (this.savingTemplate || this.savingItem) return;
    if (this.dialogRef !== null) {
      this.dialogRef.close();
      return;
    }

    this.resetEditorState();
  }

  private openEditorDialog(): void {
    const templateEditorDialog = this.templateEditorDialog();
    if (!templateEditorDialog || this.dialogRef !== null) {
      return;
    }

    const dialogRef = this.dialog.open(templateEditorDialog, {
      width: 'min(1120px, 96vw)',
      maxWidth: '96vw',
      autoFocus: 'first-tabbable',
    });

    this.dialogRef = dialogRef;
    dialogRef.afterClosed().subscribe(() => {
      if (this.dialogRef !== dialogRef) {
        return;
      }

      this.resetEditorState();
    });
  }

  private resetEditorState(): void {
    this.dialogRef = null;
    this.formMode = 'add';
    this.editingTemplateId = null;
    this.itemError = null;
  }

  private openTemplateEditor(templateId: number): void {
    this.formMode = 'edit';
    this.editingTemplateId = templateId;
    this.itemError = null;
    this.openEditorDialog();
  }
}
