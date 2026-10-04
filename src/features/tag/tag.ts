import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { UiModal } from '../../app/ui/modal/modal';

import { Component, OnChanges, OnInit, SimpleChanges, input, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  TagForm,
  TagFormMode,
  TagFormValue,
} from '../../components/tag/tag-form/tag-form';
import { TagList, TagListItem } from '../../components/tag/tag-list/tag-list';
import {
  CreateTagDto,
  Tag as TagApiModel,
  TagService,
  UpdateTagDto,
} from '../../services/tag-service';

@Component({
  selector: 'app-tag',
  imports: [UiStatusBadge, UiButton, TranslatePipe, UiModal,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    UiErrorPanel,
    TagList,
    TagForm
  ],
  templateUrl: './tag.html',
})
export class Tag implements OnInit, OnChanges {
  private readonly tagSrv = inject(TagService);

  readonly embedded = input(false);
  readonly openCreateRequestId = input(0);
  readonly dataChanged = output<void>();

  baseUrl = '';
  readonly loading = signal(false);
  readonly saving = signal(false);

  tags: TagApiModel[] = [];

  formVisible = false;
  formMode: TagFormMode = 'add';
  editingTagId: number | null = null;
  formInitialValue: Partial<TagFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;

  ngOnInit(): void {
    this.baseUrl = this.tagSrv.baseUrl;
    this.loadTags();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openCreateRequestChange = changes['openCreateRequestId'];
    if (!openCreateRequestChange) {
      return;
    }

    if (openCreateRequestChange.firstChange) {
      return;
    }

    const nextRequestId = Number(openCreateRequestChange.currentValue ?? 0);
    const previousRequestId = Number(openCreateRequestChange.previousValue ?? 0);
    if (nextRequestId > previousRequestId) {
      this.openCreate();
    }
  }

  onBaseUrlChange(): void {
    this.tagSrv.setBaseUrl(this.baseUrl);
    this.loadTags();
  }

  get tagListItems(): TagListItem[] {
    return this.tags.map((tag) => ({
      id: String(tag.id),
      name: tag.name,
    }));
  }

  onRefreshRequested(): void {
    this.loadTags();
  }

  refresh(): void {
    this.onRefreshRequested();
  }

  onAddRequested(): void {
    if (this.saving()) return;
    this.formMode = 'add';
    this.editingTagId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  openCreate(): void {
    this.onAddRequested();
  }

  onEditRequested(item: TagListItem): void {
    if (this.saving()) return;
    const tagId = Number(item.id);
    if (!Number.isInteger(tagId) || tagId < 1) {
      return;
    }

    const tag = this.tags.find((value) => value.id === tagId);
    if (!tag) {
      return;
    }

    this.formMode = 'edit';
    this.editingTagId = tag.id;
    this.formInitialValue = this.toFormValue(tag);
    this.formVisible = true;
  }

  onDeleteRequested(item: TagListItem): void {
    if (this.saving()) return;
    const tagId = Number(item.id);
    if (!Number.isInteger(tagId) || tagId < 1) {
      return;
    }

    this.saving.set(true);
    this.tagSrv.remove(tagId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: tagId };
        this.lastError = null;
        this.saving.set(false);
        this.dataChanged.emit();

        if (this.editingTagId === tagId) {
          this.onCancelForm();
        }

        this.loadTags();
      },
      error: (error) => {
        this.lastError = error;
        this.saving.set(false);
      },
    });
  }

  onFormSubmitted(event: { mode: TagFormMode; value: TagFormValue }): void {
    if (this.saving()) return;
    this.saving.set(true);

    if (event.mode === 'edit' && this.editingTagId !== null) {
      const payload = this.toUpdateDto(event.value);
      this.tagSrv.update(this.editingTagId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving.set(false);
          this.dataChanged.emit();
          this.onCancelForm();
          this.loadTags();
        },
        error: (error) => {
          this.lastError = error;
          this.saving.set(false);
        },
      });
      return;
    }

    const payload = this.toCreateDto(event.value);
    this.tagSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving.set(false);
        this.dataChanged.emit();
        this.onCancelForm();
        this.loadTags();
      },
      error: (error) => {
        this.lastError = error;
        this.saving.set(false);
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu tag-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    if (this.saving()) return;
    this.formVisible = false;
    this.formMode = 'add';
    this.editingTagId = null;
    this.formInitialValue = null;
  }

  private loadTags(): void {
    this.loading.set(true);
    this.tagSrv.findAll().subscribe({
      next: (response) => {
        this.tags = this.extractTagsFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading.set(false);

        if (this.editingTagId !== null) {
          const currentTag = this.tags.find((tag) => tag.id === this.editingTagId) ?? null;

          if (!currentTag) {
            this.onCancelForm();
            return;
          }

          this.formInitialValue = this.toFormValue(currentTag);
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading.set(false);
      },
    });
  }

  private toCreateDto(value: TagFormValue): CreateTagDto {
    return {
      name: value.name.trim(),
    };
  }

  private toUpdateDto(value: TagFormValue): UpdateTagDto {
    return this.toCreateDto(value);
  }

  private toFormValue(tag: TagApiModel): TagFormValue {
    return {
      name: tag.name,
    };
  }

  private extractTagsFromResponse(value: unknown): TagApiModel[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is TagApiModel => this.isTagLike(item));
    }

    if (this.isTagLike(value)) {
      return [value];
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    const raw = value as Record<string, unknown>;
    const nestedCandidates = ['data', 'items', 'tags', 'results', 'payload'];
    for (const key of nestedCandidates) {
      const nested = raw[key];
      if (Array.isArray(nested)) {
        const tags = nested.filter((item): item is TagApiModel => this.isTagLike(item));
        if (tags.length > 0) {
          return tags;
        }
      }
    }

    return [];
  }

  private isTagLike(value: unknown): value is TagApiModel {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const tag = value as Partial<TagApiModel>;
    return typeof tag.id === 'number' && typeof tag.name === 'string';
  }
}
