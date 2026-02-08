import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TypeDuree } from '../form-cycle/form-cycle';

export interface CycleListItem {
  id: number;
  title: string;
  color: string;
  proteins: number;
  carbs: number;
  lipids: number;
  durationCount: number;
  durationType: TypeDuree;
}

@Component({
  selector: 'app-list-cycle',
  imports: [CommonModule],
  templateUrl: './list-cycle.html',
  styleUrl: './list-cycle.scss',
})
export class ListCycle {
  @Input() cycles: CycleListItem[] = [];
  @Input() activeCycleId: number | null = null;
  @Input() showAddButton = true;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<CycleListItem>();
  @Output() readonly deleteRequested = new EventEmitter<CycleListItem>();

  isActive(cycle: CycleListItem, index: number): boolean {
    if (this.activeCycleId !== null) {
      return cycle.id === this.activeCycleId;
    }

    return index === 0;
  }

  onEdit(cycle: CycleListItem): void {
    this.editRequested.emit(cycle);
  }

  onDelete(cycle: CycleListItem): void {
    this.deleteRequested.emit(cycle);
  }

  onAddCycle(): void {
    this.addRequested.emit();
  }
}
