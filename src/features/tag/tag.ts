import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    UiErrorPanel,
    TagList,
    TagForm,
  ],
  templateUrl: './tag.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './tag.scss',
})
export class Tag implements OnInit {
  @Input() embedded = false;
  @Output() readonly dataChanged = new EventEmitter<void>();

  baseUrl = '';
  loading = false;
  saving = false;

  tags: TagApiModel[] = [];

  formVisible = false;
  formMode: TagFormMode = 'add';
  editingTagId: number | null = null;
  formInitialValue: Partial<TagFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(private readonly tagSrv: TagService) {}

  ngOnInit(): void {
    this.baseUrl = this.tagSrv.baseUrl;
    this.loadTags();
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
    this.formMode = 'add';
    this.editingTagId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  openCreate(): void {
    this.onAddRequested();
  }

  onEditRequested(item: TagListItem): void {
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
    const tagId = Number(item.id);
    if (!Number.isInteger(tagId) || tagId < 1) {
      return;
    }

    this.saving = true;
    this.tagSrv.remove(tagId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: tagId };
        this.lastError = null;
        this.saving = false;
        this.dataChanged.emit();

        if (this.editingTagId === tagId) {
          this.onCancelForm();
        }

        this.loadTags();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: TagFormMode; value: TagFormValue }): void {
    this.saving = true;

    if (event.mode === 'edit' && this.editingTagId !== null) {
      const payload = this.toUpdateDto(event.value);
      this.tagSrv.update(this.editingTagId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.dataChanged.emit();
          this.onCancelForm();
          this.loadTags();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    const payload = this.toCreateDto(event.value);
    this.tagSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.dataChanged.emit();
        this.onCancelForm();
        this.loadTags();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
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
    this.formVisible = false;
    this.formMode = 'add';
    this.editingTagId = null;
    this.formInitialValue = null;
  }

  private loadTags(): void {
    this.loading = true;
    this.tagSrv.findAll().subscribe({
      next: (response) => {
        this.tags = this.extractTagsFromResponse(response);
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

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
        this.loading = false;
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
