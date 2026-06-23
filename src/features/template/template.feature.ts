
import { Component, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DaySet } from '../../interfaces/day-set.interface';
import { ProductQuantityInputUnit } from '../../interfaces/input-day.interface';
import { Slot } from '../../interfaces/slot.interface';
import {
  CreateTemplateItemDto,
  Template,
} from '../../interfaces/template.interface';
import {
  TemplateForm,
  TemplateFormMode,
  TemplateFormSubmittedEvent,
  TemplateItemDraft,
} from '../../components/template/template-form/template-form';
import { TemplateList } from '../../components/template/template-list/template-list';
import {
  Product as ProductApiModel,
  ProductService,
} from '../../services/product-service';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import { DaySetService } from '../../services/day-set-service';
import { SlotService } from '../../services/slot-service';
import { TemplateService } from '../../services/template-service';

@Component({
  selector: 'app-template',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatProgressBarModule,
    UiErrorPanel,
    TemplateForm,
    TemplateList
],
  templateUrl: './template.feature.html',
  styleUrl: './template.feature.scss',
})
export class TemplateFeature implements OnInit {
  private readonly templateSrv = inject(TemplateService);
  private readonly productSrv = inject(ProductService);
  private readonly daySetSrv = inject(DaySetService);
  private readonly slotSrv = inject(SlotService);

  private readonly templateEditorDialog = viewChild<TemplateRef<unknown>>('templateEditorDialog');

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
  formMode: TemplateFormMode = 'add';
  editingTemplateId: number | null = null;

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

  ngOnInit(): void {
    this.baseUrl = this.templateSrv.baseUrl;
    this.syncBaseUrls();
    this.loadProducts();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates({ autoSelectFirst: true });
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

  get busy(): boolean {
    return (
      this.loadingTemplates ||
      this.loadingProducts ||
      this.loadingDaySets ||
      this.loadingSlots ||
      this.savingTemplate ||
      this.savingItem
    );
  }

  onBaseUrlChange(): void {
    this.syncBaseUrls();
    this.loadProducts();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates({
      selectId: this.selectedTemplateId,
      autoSelectFirst: this.selectedTemplateId === null,
    });
  }

  onRefreshRequested(): void {
    this.loadProducts();
    this.loadDaySets();
    this.loadSlots();
    this.loadTemplates({
      selectId: this.selectedTemplateId,
      autoSelectFirst: false,
    });
  }

  startCreateTemplate(): void {
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
    if (!Number.isInteger(templateId) || templateId < 1) {
      return;
    }

    if (this.selectedTemplate?.id === templateId) {
      this.openTemplateEditor(templateId);
      return;
    }

    this.loadingTemplates = true;
    this.templateSrv.findOne(templateId, this.compareDaySetId).subscribe({
      next: (response) => {
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.loadingTemplates = false;
        this.openTemplateEditor(response.id);
      },
      error: (error) => {
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  onTemplateDeleteRequested(templateId: number): void {
    if (!Number.isInteger(templateId) || templateId < 1) {
      return;
    }

    this.onTemplateDeleted(templateId);
  }

  selectTemplate(templateId: number): void {
    this.selectedTemplateId = templateId;
    this.loadSelectedTemplate();
  }

  onCompareDaySetChange(compareDaySetId: number | null): void {
    this.compareDaySetId = compareDaySetId;
    this.loadSelectedTemplate();
  }

  onTemplateSubmitted(event: TemplateFormSubmittedEvent): void {
    const title = event.title.trim();
    if (title === '') {
      return;
    }

    this.savingTemplate = true;
    this.lastError = null;
    this.itemError = null;

    if (event.mode === 'edit' && this.editingTemplateId !== null) {
      this.templateSrv.update(this.editingTemplateId, { title }).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.savingTemplate = false;
          this.formMode = 'edit';
          this.editingTemplateId = response.id;
          this.selectedTemplateId = response.id;
          this.selectedTemplate = response;
          this.loadTemplates({
            selectId: this.editingTemplateId,
            autoSelectFirst: false,
          });
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
        this.loadTemplates({
          selectId: response.id,
          autoSelectFirst: false,
        });
      },
      error: (error) => {
        this.lastError = error;
        this.savingTemplate = false;
      },
    });
  }

  onTemplateDeleted(templateId: number): void {
    this.savingTemplate = true;
    this.lastError = null;
    this.itemError = null;

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
        this.loadTemplates({
          selectId: this.selectedTemplateId,
          autoSelectFirst: false,
        });
      },
      error: (error) => {
        this.lastError = error;
        this.savingTemplate = false;
      },
    });
  }

  onItemSubmitted(itemDraft: TemplateItemDraft): void {
    if (this.editingTemplateId === null) {
      return;
    }

    const payload: CreateTemplateItemDto = {
      productId: itemDraft.productId as number,
      qty: itemDraft.qty as number,
      ...(itemDraft.qtyUnit ? { qtyUnit: itemDraft.qtyUnit } : {}),
      ...(itemDraft.slotId ? { slotId: itemDraft.slotId } : {}),
      ...(itemDraft.slotKey.trim() !== '' ? { slotKey: itemDraft.slotKey.trim() } : {}),
    };

    this.savingItem = true;
    this.itemError = null;

    const request =
      itemDraft.id === null
        ? this.templateSrv.createItem(this.editingTemplateId, payload)
        : this.templateSrv.updateItem(this.editingTemplateId, itemDraft.id, payload);

    request.subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.selectedTemplate = response;
        this.selectedTemplateId = response.id;
        this.editingTemplateId = response.id;
        this.syncTemplateInCollection(response);
        this.savingItem = false;
      },
      error: (error) => {
        this.lastError = error;
        this.itemError = 'Impossible de sauvegarder la ligne template.';
        this.savingItem = false;
      },
    });
  }

  onItemDeleted(itemId: number): void {
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
      },
      error: (error) => {
        this.lastError = error;
        this.itemError = 'Impossible de supprimer la ligne template.';
        this.savingItem = false;
      },
    });
  }

  closeEditorDialog(): void {
    if (this.dialogRef !== null) {
      this.dialogRef.close();
      return;
    }

    this.resetEditorState();
  }

  private syncBaseUrls(): void {
    this.templateSrv.setBaseUrl(this.baseUrl);
    this.productSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
  }

  private loadTemplates(options?: {
    selectId?: number | null;
    autoSelectFirst?: boolean;
  }): void {
    const selectId = options?.selectId ?? this.selectedTemplateId;
    const autoSelectFirst = options?.autoSelectFirst ?? false;

    this.loadingTemplates = true;
    this.templateSrv.findAll().subscribe({
      next: (response) => {
        this.templates = response;
        this.loadingTemplates = false;

        if (
          typeof selectId === 'number' &&
          this.templates.some((item) => item.id === selectId)
        ) {
          this.selectedTemplateId = selectId;
          this.loadSelectedTemplate();
          return;
        }

        if (autoSelectFirst && this.templates.length > 0) {
          this.selectedTemplateId = this.templates[0].id;
          this.loadSelectedTemplate();
          return;
        }

        this.selectedTemplateId = null;
        this.selectedTemplate = null;
        this.compareDaySetId = null;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingTemplates = false;
      },
    });
  }

  private loadSelectedTemplate(): void {
    if (this.selectedTemplateId === null) {
      this.selectedTemplate = null;
      return;
    }

    this.loadingTemplates = true;
    this.templateSrv.findOne(this.selectedTemplateId, this.compareDaySetId).subscribe({
      next: (response) => {
        this.selectedTemplate = response;
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

  private openEditorDialog(): void {
    const templateEditorDialog = this.templateEditorDialog();
    if (!templateEditorDialog || this.dialogRef !== null) {
      return;
    }

    const dialogRef = this.dialog.open(templateEditorDialog, {
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
    this.itemError = null;
  }

  private openTemplateEditor(templateId: number): void {
    this.formMode = 'edit';
    this.editingTemplateId = templateId;
    this.itemError = null;
    this.openEditorDialog();
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
