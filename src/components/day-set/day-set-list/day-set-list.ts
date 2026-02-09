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

export type DaySetListMode = 'manage' | 'select-single' | 'select-multi';

export interface DaySetListItem {
  id: string;
  title: string;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-day-set-list',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './day-set-list.html',
  styleUrl: './day-set-list.scss',
})
export class DaySetList implements OnInit, OnChanges {
  @Input() mode: DaySetListMode = 'manage';
  @Input() daySets: DaySetListItem[] | null = null;
  @Input() selectedIds: string[] | null = null;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly selected = new EventEmitter<DaySetListItem>();
  @Output() readonly selectedMany = new EventEmitter<DaySetListItem[]>();

  readonly defaultDaySets: DaySetListItem[] = [
    {
      id: '1',
      title: 'Lundi',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '2',
      title: 'Repos',
      protein: 50,
      carbs: 120,
      fat: 30,
    },
    {
      id: '3',
      title: 'Mardi',
      protein: 50,
      carbs: 150,
      fat: 30,
    },
  ];

  resolvedDaySets: DaySetListItem[] = [];

  private selectedIdSet = new Set<string>();

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['daySets'] || changes['selectedIds']) {
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
    return this.resolvedDaySets.length > 0;
  }

  get displayedColumns(): string[] {
    return this.isMultiSelectMode
      ? ['select', 'title', 'protein', 'carbs', 'fat']
      : ['title', 'protein', 'carbs', 'fat'];
  }

  trackById(_: number, item: DaySetListItem): string {
    return item.id;
  }

  isSelected(id: string): boolean {
    return this.selectedIdSet.has(id);
  }

  isRowActive(item: DaySetListItem, index: number): boolean {
    if (this.isManageMode) {
      return index === 0;
    }

    return this.isSelected(item.id);
  }

  onRowClick(item: DaySetListItem): void {
    if (!this.isSingleSelectMode) {
      return;
    }

    this.selectedIdSet.clear();
    this.selectedIdSet.add(item.id);
    this.selected.emit(item);
  }

  onRowKeydown(event: KeyboardEvent, item: DaySetListItem): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onRowClick(item);
  }

  onCheckboxChange(item: DaySetListItem, checked: boolean): void {
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

  onAddClick(): void {
    if (!this.isManageMode) {
      return;
    }

    this.addRequested.emit();
  }

  private applyInputState(): void {
    this.resolvedDaySets = this.daySets === null ? [...this.defaultDaySets] : [...this.daySets];

    const initialIds = this.selectedIds ?? [];
    const availableIds = new Set(this.resolvedDaySets.map((item) => item.id));
    this.selectedIdSet = new Set(initialIds.filter((id) => availableIds.has(id)));

    if (this.isSingleSelectMode && this.selectedIdSet.size > 1) {
      const firstSelected = this.resolvedDaySets.find((item) => this.selectedIdSet.has(item.id));
      this.selectedIdSet.clear();
      if (firstSelected) {
        this.selectedIdSet.add(firstSelected.id);
      }
    }
  }

  private getSelectedItems(): DaySetListItem[] {
    return this.resolvedDaySets.filter((item) => this.selectedIdSet.has(item.id));
  }
}
