import { UiEmptyState } from '../../../app/ui/empty-state/empty-state';
import { UiButton } from '../../../app/ui/button/button';
import { TranslatePipe } from '../../../app/i18n/translate-pipe';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { createSelection, deselectItem, getSelectedItems, selectItem } from '../../shared/list-selection';

export type TagListMode = 'manage' | 'select-single' | 'select-multi';

export interface TagListItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-tag-list',
  imports: [UiEmptyState, UiButton,
    TranslatePipe,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
    NgTemplateOutlet
],
  templateUrl: './tag-list.html',
  styleUrl: './tag-list.scss',
})
export class TagList implements OnInit, OnChanges {
  readonly mode = input<TagListMode>('manage');
  readonly tags = input<TagListItem[] | null>(null);
  readonly selectedIds = input<string[] | null>(null);
  readonly compact = input(false);
  readonly embedded = input(false);

  readonly addRequested = output<void>();
  readonly editRequested = output<TagListItem>();
  readonly deleteRequested = output<TagListItem>();
  readonly selected = output<TagListItem>();
  readonly selectedMany = output<TagListItem[]>();

  readonly defaultTags: TagListItem[] = [
    { id: '1', name: 'Bio' },
    { id: '2', name: 'Local' },
    { id: '3', name: 'Surgeles' },
  ];

  resolvedTags: TagListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['tags'] || changes['selectedIds']) {
      this.applyInputState();
    }
  }

  get isManageMode(): boolean {
    return this.mode() === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode() === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode() === 'select-multi';
  }

  get hasItems(): boolean {
    return this.resolvedTags.length > 0;
  }

  get displayedColumns(): string[] {
    if (this.isManageMode) {
      return ['name', 'actions'];
    }

    return this.isMultiSelectMode ? ['select', 'name'] : ['name'];
  }

  trackById(_: number, item: TagListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: TagListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
    }

    return this.isSelected(item.id);
  }

  onRowClick(item: TagListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: TagListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: TagListItem, checked: boolean): void {
    if (!this.isMultiSelectMode) {
      return;
    }

    if (checked) {
      selectItem(this.selectedIdSet, item.id);
    } else {
      deselectItem(this.selectedIdSet, item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onAddClick(): void {
    if (!this.isManageMode) {
      return;
    }

    this.addRequested.emit();
  }

  onEditClick(item: TagListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.editRequested.emit(item);
  }

  onDeleteClick(item: TagListItem): void {
    if (!this.isManageMode) {
      return;
    }

    this.deleteRequested.emit(item);
  }

  private applyInputState(): void {
    const tags = this.tags();
    this.resolvedTags = tags === null ? [...this.defaultTags] : [...tags];

    this.selectedIdSet = createSelection(
      this.resolvedTags,
      this.selectedIds(),
      this.isSingleSelectMode,
    );
  }

  private getSelectedItems(): TagListItem[] {
    return getSelectedItems(this.resolvedTags, this.selectedIdSet);
  }
}
