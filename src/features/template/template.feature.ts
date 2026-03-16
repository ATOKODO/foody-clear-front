import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateTemplateItemDto,
  Template,
  TemplateItem,
} from '../../interfaces/template.interface';
import { DaySet } from '../../interfaces/day-set.interface';
import { Slot } from '../../interfaces/slot.interface';
import {
  Product as ProductApiModel,
  ProductService,
} from '../../services/product-service';
import { TemplateService } from '../../services/template-service';
import { DaySetService } from '../../services/day-set-service';
import { SlotService } from '../../services/slot-service';
import {
  InputDayMacroValue,
  InputDayTargetSource,
  InputDayTotalsMacrosBySlotEntry,
  InputDayTotalsMacrosSummary,
  ProductQuantityInputUnit,
} from '../../interfaces/input-day.interface';

type TemplateItemDraft = {
  id: number | null;
  productId: number | null;
  qty: number | null;
  qtyUnit: ProductQuantityInputUnit | null;
  slotId: number | null;
  slotKey: string;
};

@Component({
  selector: 'app-template',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './template.feature.html',
  styleUrl: './template.feature.scss',
})
export class TemplateFeature implements OnInit {
  @ViewChild('templateEditorDialog')
  private templateEditorDialog?: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);

  readonly qtyUnitOptions: ProductQuantityInputUnit[] = [
    'mg',
    'g',
    'kg',
    'ml',
    'l',
    'unit',
    'pack',
    'tranche',
    'piece',
    'part',
    'bouteille',
    'portion',
  ];

  baseUrl = '';
  templates: Template[] = [];
  products: ProductApiModel[] = [];
  daySets: DaySet[] = [];
  slots: Slot[] = [];

  selectedTemplateId: number | null = null;
  selectedTemplate: Template | null = null;
  compareDaySetId: number | null = null;
  draftTitle = '';
  formMode: 'add' | 'edit' = 'add';
  editingTemplateId: number | null = null;
  itemDraft: TemplateItemDraft = this.buildEmptyItemDraft();

  loadingTemplates = false;
  loadingProducts = false;
  loadingDaySets = false;
  loadingSlots = false;
  savingTemplate = false;
  savingItem = false;

  lastResponse: unknown = null;
  lastError: unknown = null;
  itemError: string | null = null;
  private dialogRef: MatDialogRef<unknown> | null = null;

  constructor(
    private readonly templateSrv: TemplateService,
    private readonly productSrv: ProductService,
    private readonly daySetSrv: DaySetService,
    private readonly slotSrv: SlotService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.templateSrv.baseUrl;
    this.syncBaseUrls();
    this.loadProducts();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
  }

  get canSaveTemplate(): boolean {
    return this.draftTitle.trim() !== '' && !this.savingTemplate;
  }

  get canSaveItem(): boolean {
    return (
      this.editingTemplateId !== null &&
      this.itemDraft.productId !== null &&
      this.itemDraft.qty !== null &&
      this.itemDraft.qty > 0 &&
      !this.savingItem
    );
  }

  get editedTemplate(): Template | null {
    if (this.editingTemplateId === null) {
      return null;
    }

    return this.selectedTemplate?.id === this.editingTemplateId ? this.selectedTemplate : null;
  }

  get formDialogTitle(): string {
    return this.formMode === 'edit' ? 'Modifier le template' : 'Nouveau template';
  }

  get formDialogSubtitle(): string {
    return this.formMode === 'edit'
      ? 'Mets a jour le titre, les lignes et les controles stock du template.'
      : 'Cree un template previsionnel, puis ajoute ses lignes produits.';
  }

  get productOptions(): ProductApiModel[] {
    return [...this.products].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }),
    );
  }

  get daySetOptions(): DaySet[] {
    return [...this.daySets].sort((left, right) =>
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  get slotOptions(): Slot[] {
    return [...this.slots].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  onBaseUrlChange(): void {
    this.syncBaseUrls();
    this.loadProducts();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates();
  }

  startCreateTemplate(): void {
    this.formMode = 'add';
    this.editingTemplateId = null;
    this.draftTitle = '';
    this.resetItemDraft();
    this.itemError = null;
    this.openEditorDialog();
  }

  openSelectedTemplateEditor(): void {
    if (this.selectedTemplateId === null || !this.selectedTemplate) {
      return;
    }

    this.formMode = 'edit';
    this.editingTemplateId = this.selectedTemplateId;
    this.draftTitle = this.selectedTemplate.title;
    this.resetItemDraft();
    this.itemError = null;
    this.openEditorDialog();
  }

  selectTemplate(templateId: number): void {
    this.selectedTemplateId = templateId;
    this.loadSelectedTemplate();
  }

  saveTemplate(): void {
    const title = this.draftTitle.trim();
    if (title === '') {
      return;
    }

    this.savingTemplate = true;
    this.lastError = null;

    if (this.editingTemplateId !== null) {
      this.templateSrv.update(this.editingTemplateId, { title }).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.savingTemplate = false;
          this.formMode = 'edit';
          this.editingTemplateId = response.id;
          this.selectedTemplateId = response.id;
          this.selectedTemplate = response;
          this.draftTitle = response.title;
          this.loadTemplates(this.editingTemplateId);
        },
        error: (error) => {
          this.lastError = error;
          this.savingTemplate = false;
        },
      });
      return;
    }

    this.templateSrv.create({ title }).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.savingTemplate = false;
        this.formMode = 'edit';
        this.editingTemplateId = response.id;
        this.selectedTemplateId = response.id;
        this.selectedTemplate = response;
        this.draftTitle = response.title;
        this.loadTemplates(response.id);
      },
      error: (error) => {
        this.lastError = error;
        this.savingTemplate = false;
      },
    });
  }

  removeTemplate(templateId: number): void {
    this.savingTemplate = true;
    this.lastError = null;

    this.templateSrv.remove(templateId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: templateId };
        this.savingTemplate = false;
        if (this.selectedTemplateId === templateId) {
          this.selectedTemplateId = null;
          this.selectedTemplate = null;
          this.compareDaySetId = null;
        }
        if (this.editingTemplateId === templateId) {
          this.closeEditorDialog();
        }
        this.loadTemplates();
      },
      error: (error) => {
        this.lastError = error;
        this.savingTemplate = false;
      },
    });
  }

  onCompareDaySetChange(): void {
    this.loadSelectedTemplate();
  }

  editItem(item: TemplateItem): void {
    this.itemDraft = {
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      qtyUnit: item.qtyUnit,
      slotId: item.slotId,
      slotKey: item.slotKey ?? '',
    };
    this.itemError = null;
  }

  saveItem(): void {
    if (!this.canSaveItem || this.editingTemplateId === null) {
      return;
    }

    const payload: CreateTemplateItemDto = {
      productId: this.itemDraft.productId as number,
      qty: this.itemDraft.qty as number,
      ...(this.itemDraft.qtyUnit ? { qtyUnit: this.itemDraft.qtyUnit } : {}),
      ...(this.itemDraft.slotId ? { slotId: this.itemDraft.slotId } : {}),
      ...(this.itemDraft.slotKey.trim() !== '' ? { slotKey: this.itemDraft.slotKey.trim() } : {}),
    };

    this.savingItem = true;
    this.itemError = null;

    const request =
      this.itemDraft.id === null
        ? this.templateSrv.createItem(this.editingTemplateId, payload)
        : this.templateSrv.updateItem(this.editingTemplateId, this.itemDraft.id, payload);

    request.subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.editingTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.savingItem = false;
        this.resetItemDraft();
      },
      error: (error) => {
        this.lastError = error;
        this.itemError = 'Impossible de sauvegarder la ligne template.';
        this.savingItem = false;
      },
    });
  }

  removeItem(itemId: number): void {
    if (this.editingTemplateId === null) {
      return;
    }

    this.savingItem = true;
    this.itemError = null;

    this.templateSrv.removeItem(this.editingTemplateId, itemId).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.savingItem = false;
        if (this.itemDraft.id === itemId) {
          this.resetItemDraft();
        }
      },
      error: (error) => {
        this.lastError = error;
        this.itemError = 'Impossible de supprimer la ligne template.';
        this.savingItem = false;
      },
    });
  }

  resetItemDraft(): void {
    this.itemDraft = this.buildEmptyItemDraft();
  }

  closeEditorDialog(): void {
    if (this.dialogRef !== null) {
      this.dialogRef.close();
      return;
    }

    this.resetEditorState();
  }

  getTargetSourceText(targetSource: InputDayTargetSource): string {
    if (targetSource === 'daySet') {
      return 'Comparaison avec un day set';
    }

    if (targetSource === 'cycle') {
      return 'Comparaison avec un cycle';
    }

    return 'Aucune cible';
  }

  getSlotMacroEntries(
    value: InputDayTotalsMacrosBySlotEntry,
  ): Array<{ key: string; value: InputDayMacroValue }> {
    return Object.entries(value)
      .filter(([key]) => !['slot', 'targets', 'deltaToTargets', 'incompleteNutritionKeys'].includes(key))
      .map(([key, entry]) => ({ key, value: entry as InputDayMacroValue }));
  }

  formatMacroValue(value: InputDayMacroValue): string {
    if (typeof value !== 'number') {
      return value;
    }

    return this.formatNumber(value);
  }

  formatNutritionAmount(value: number): string {
    return this.formatNumber(value);
  }

  hasEntries(value: Record<string, unknown> | null | undefined): boolean {
    return !!value && Object.keys(value).length > 0;
  }

  resolveTemplateItemSlotLabel(item: TemplateItem): string {
    if (item.slotId !== null) {
      const slot = this.slotOptions.find((candidate) => candidate.id === item.slotId) ?? null;
      if (slot) {
        return `${slot.sortOrder}. ${slot.title}`;
      }
    }

    return item.slotKey?.trim() || 'Sans slot';
  }

  private syncBaseUrls(): void {
    this.templateSrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
  }

  private loadTemplates(selectId?: number | null): void {
    this.loadingTemplates = true;
    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templates = response;
        this.loadingTemplates = false;

        const resolvedSelection = selectId ?? this.selectedTemplateId;
        if (resolvedSelection !== null && this.templates.some((item) => item.id === resolvedSelection)) {
          this.selectedTemplateId = resolvedSelection;
          this.loadSelectedTemplate();
          return;
        }

        if (this.templates.length > 0 && this.selectedTemplateId === null && selectId !== null) {
          this.selectedTemplateId = this.templates[0].id;
          this.loadSelectedTemplate();
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  private loadSelectedTemplate(): void {
    if (this.selectedTemplateId === null) {
      return;
    }

    this.loadingTemplates = true;
    this.templateSrv.findOne(this.selectedTemplateId, this.compareDaySetId).subscribe({
      next: (response) => {
        this.selectedTemplate = response;
        if (this.editingTemplateId === response.id) {
          this.draftTitle = response.title;
        }
        this.syncTemplateInCollection(response);
        this.loadingTemplates = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productSrv.findAll().subscribe({
      next: (response) => {
        this.products = response;
        this.loadingProducts = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingProducts = false;
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
      error: (error) => {
        this.lastError = error;
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
      error: (error) => {
        this.lastError = error;
        this.loadingSlots = false;
      },
    });
  }

  private buildEmptyItemDraft(): TemplateItemDraft {
    return {
      id: null,
      productId: null,
      qty: null,
      qtyUnit: null,
      slotId: null,
      slotKey: '',
    };
  }

  private formatNumber(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 2,
    }).format(rounded);
  }

  private openEditorDialog(): void {
    if (!this.templateEditorDialog || this.dialogRef !== null) {
      return;
    }

    const dialogRef = this.dialog.open(this.templateEditorDialog, {
      width: 'min(1120px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
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
    this.draftTitle = '';
    this.resetItemDraft();
    this.itemError = null;
  }

  private syncTemplateInCollection(template: Template): void {
    const nextTemplates = [...this.templates];
    const index = nextTemplates.findIndex((candidate) => candidate.id === template.id);
    if (index === -1) {
      nextTemplates.push(template);
    } else {
      nextTemplates[index] = template;
    }

    this.templates = nextTemplates.sort((left, right) =>
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }
}
