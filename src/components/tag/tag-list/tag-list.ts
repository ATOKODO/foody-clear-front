import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';

export type TagListMode = 'manage' | 'select-single' | 'select-multi';

export interface TagListItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-tag-list',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './tag-list.html',
  styleUrl: './tag-list.scss',
})
export class TagList implements OnInit, OnChanges {
  @Input() mode: TagListMode = 'manage';
  @Input() tags: TagListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;
  @Input() compact = false;
  @Input() embedded = false;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<TagListItem>();
  @Output() readonly deleteRequested = new EventEmitter<TagListItem>();
  @Output() readonly selected = new EventEmitter<TagListItem>();
  @Output() readonly selectedMany = new EventEmitter<TagListItem[]>();

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
    return this.mode === 'manage';
  }

  get isSingleSelectMode(): boolean {
    return this.mode === 'select-single';
  }

  get isMultiSelectMode(): boolean {
    return this.mode === 'select-multi';
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
      this.selectedIdSet.add(item.id);
    } else {
      this.selectedIdSet.delete(item.id);
    }

    this.selectedMany.emit(this.getSelectedItems());
  }

  onCheckboxClick(event: MouseEvent, item: TagListItem): void {
    event.stopPropagation();

    if (!this.isMultiSelectMode) {
      return;
    }

    this.onCheckboxChange(item, !this.isSelected(item.id));
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
    this.resolvedTags = this.tags === null ? [...this.defaultTags] : [...this.tags];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedTags.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedTags.find((item) => this.selectedIdSet.has(item.id));
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): TagListItem[] {
    return this.resolvedTags.filter((item) => this.selectedIdSet.has(item.id));
  }
}
